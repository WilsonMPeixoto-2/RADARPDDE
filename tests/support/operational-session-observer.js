'use strict';

const { performance } = require('node:perf_hooks');
const { percentile } = require('./performance-journey-observer.js');

async function observeOperationalSession(page) {
  const requests = [];
  const pendingBodies = new Set();
  const starts = new Map();
  const errors = [];
  const startedAt = performance.now();
  const operational = url => new URL(url).pathname.startsWith('/rest/v1/');
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (operational(request.url())) starts.set(request, performance.now());
  });
  page.on('requestfailed', request => {
    if (!starts.has(request)) return;
    requests.push({ path: new URL(request.url()).pathname, method: request.method(),
      status: 0, aborted: /abort|cancel/i.test(request.failure()?.errorText || ''),
      durationMs: performance.now() - starts.get(request), payloadBytes: null });
    starts.delete(request);
  });
  page.on('response', response => {
    const request = response.request();
    if (!starts.has(request)) return;
    const start = starts.get(request);
    const task = (async () => {
      const body = await response.body().catch(() => null);
      if (!starts.has(request)) return;
      requests.push({ path: new URL(request.url()).pathname, method: request.method(),
        status: response.status(), durationMs: performance.now() - start,
        payloadBytes: body?.byteLength ?? null });
      starts.delete(request);
    })();
    pendingBodies.add(task);
    void task.finally(() => pendingBodies.delete(task));
  });
  await page.evaluate(() => {
    const data = window.RadarApplicationServices.data;
    const counters = { loads: [], applies: 0, renderCalls: 0, mainReplacements: 0,
      mutations: 0, lastMutationAt: performance.now(),
      performance: {
        longTasks: { supported: PerformanceObserver.supportedEntryTypes?.includes('longtask') === true,
          count: 0, totalMs: 0, maxMs: 0, blockingMs: 0 },
        applyRemoteState: { count: 0, totalMs: 0, maxMs: 0, samplesMs: [] },
        renderProntuario: { count: 0, totalMs: 0, maxMs: 0 }
      },
      visual: { sampledFrames: 0, fadedFrames: 0, nearlyInvisibleFrames: 0,
        minOpacity: 1, firstFadedFrames: [] } };
    const recordDuration = (metric, start) => {
      const duration = performance.now() - start;
      metric.count += 1;
      metric.totalMs += duration;
      metric.maxMs = Math.max(metric.maxMs, duration);
      if (metric.samplesMs) {
        metric.samplesMs.push(duration);
        if (metric.samplesMs.length > 100) metric.samplesMs.shift();
      }
    };
    const recordLongTasks = entries => {
      const metric = counters.performance.longTasks;
      for (const entry of entries) {
        metric.count += 1;
        metric.totalMs += entry.duration;
        metric.maxMs = Math.max(metric.maxMs, entry.duration);
        metric.blockingMs += Math.max(0, entry.duration - 50);
      }
    };
    if (counters.performance.longTasks.supported) {
      const longTaskObserver = new PerformanceObserver(list => recordLongTasks(list.getEntries()));
      longTaskObserver.observe({ type: 'longtask' });
      window.__RADAR_OPERATIONAL_FLUSH_LONG_TASKS__ = () => recordLongTasks(longTaskObserver.takeRecords());
    }
    for (const method of ['loadOperationalContext', 'loadSchoolOperationalContext']) {
      const load = data[method];
      if (typeof load !== 'function') continue;
      data[method] = async function observedContext(...args) {
        const start = performance.now();
        const options = args[method === 'loadOperationalContext' ? 1 : 2] || {};
        try {
          const result = await load.apply(this, args);
          counters.loads.push({ method, source: options.source || 'unknown', durationMs: performance.now() - start,
            stale: result?.stale === true, aborted: result?.aborted === true, ok: result?.ok !== false });
          return result;
        } catch (error) {
          counters.loads.push({ method, source: options.source || 'unknown', durationMs: performance.now() - start, ok: false });
          throw error;
        }
      };
    }
    const apply = data.applyRemoteState;
    data.applyRemoteState = async function observedApply(...args) {
      counters.applies += 1;
      const start = performance.now();
      try { return await apply.apply(this, args); }
      finally { recordDuration(counters.performance.applyRemoteState, start); }
    };
    const render = window.renderProntuario;
    window.renderProntuario = function observedRender(...args) {
      counters.renderCalls += 1;
      const start = performance.now();
      try { return render.apply(this, args); }
      finally { recordDuration(counters.performance.renderProntuario, start); }
    };
    const main = document.getElementById('main-container');
    new MutationObserver(records => {
      counters.mutations += records.length;
      counters.mainReplacements += records.filter(r => r.target === main
        && r.type === 'childList' && r.removedNodes.length > 0).length;
      counters.lastMutationAt = performance.now();
    }).observe(main, { childList: true, subtree: true, attributes: true, characterData: true });
    window.__RADAR_OPERATIONAL_SESSION_OBSERVATION__ = counters;
    // O observador não navega nem troca de aba do Prontuário durante a coleta.
    // Uma nova animação de entrada após refresh é perceptível mesmo se o DOM
    // já contiver todos os dados. Ler opacity não modifica a apresentação.
    const sampleFrame = () => {
      const panel = document.getElementById('tab-verificacoes');
      if (panel?.classList.contains('active') && !panel.hidden) {
        const style = getComputedStyle(panel);
        const opacity = Number(style.opacity);
        counters.visual.sampledFrames += 1;
        counters.visual.minOpacity = Math.min(counters.visual.minOpacity, opacity);
        if (opacity < 0.95) {
          counters.visual.fadedFrames += 1;
          if (counters.visual.firstFadedFrames.length < 20) counters.visual.firstFadedFrames.push({
            at: performance.now(), opacity, animationName: style.animationName,
            animationDuration: style.animationDuration, display: style.display
          });
        }
        if (opacity < 0.1) counters.visual.nearlyInvisibleFrames += 1;
      }
      requestAnimationFrame(sampleFrame);
    };
    requestAnimationFrame(sampleFrame);
  });
  return {
    async snapshot() {
      await Promise.all([...pendingBodies]);
      const runtime = await page.evaluate(() => {
        window.__RADAR_OPERATIONAL_FLUSH_LONG_TASKS__?.();
        return ({
        ...window.__RADAR_OPERATIONAL_SESSION_OBSERVATION__,
        refresh: window.RadarOperationalContextRefreshController?.getMetrics?.() || null,
        realtime: window.RadarOperationalRealtimeInvalidationController?.getMetrics?.() || null,
        writeTiming: window.RadarOperationalWriteMetrics?.summary?.() || null,
        pendingRefresh: window.RadarOperationalContextRefreshController?.hasPendingRefresh?.(),
        scrollTop: document.querySelector('.content-area')?.scrollTop ?? window.scrollY,
        focusedId: document.activeElement?.id || null
        });
      });
      const reads = requests.filter(r => ['/rest/v1/rpc/read_operational_context', '/rest/v1/rpc/read_school_operational_context'].includes(r.path));
      const writePaths = new Set(['/rest/v1/rpc/save_verification_with_log',
        '/rest/v1/rpc/save_invoice_with_effects', '/rest/v1/rpc/save_invoice_with_effects_v2',
        '/rest/v1/rpc/delete_invoice_with_effects']);
      const writes = requests.filter(r => r.method === 'POST' && writePaths.has(r.path));
      const durations = reads.filter(r => r.status === 200).map(r => r.durationMs);
      return { elapsedMs: performance.now() - startedAt, reads: reads.length, writes: writes.length,
        readsPerWrite: writes.length ? reads.length / writes.length : null,
        readsPerMinute: reads.length * 60000 / (performance.now() - startedAt),
        readDurationMs: { p50: percentile(durations, 0.5), p95: percentile(durations, 0.95),
          p99: percentile(durations, 0.99), max: durations.length ? Math.max(...durations) : null },
        payloadBytes: reads.reduce((sum, r) => sum + (r.payloadBytes || 0), 0),
        requests: requests.map(r => ({ ...r })), runtime, errors: [...errors] };
    }
  };
}

module.exports = { observeOperationalSession };
