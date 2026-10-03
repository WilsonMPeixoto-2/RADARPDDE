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
      mutations: 0, lastMutationAt: performance.now() };
    const load = data.loadOperationalContext;
    data.loadOperationalContext = async function observedContext(key, options = {}) {
      const start = performance.now();
      try {
        const result = await load.call(this, key, options);
        counters.loads.push({ source: options.source || 'unknown', durationMs: performance.now() - start,
          stale: result?.stale === true, ok: result?.ok !== false });
        return result;
      } catch (error) {
        counters.loads.push({ source: options.source || 'unknown', durationMs: performance.now() - start, ok: false });
        throw error;
      }
    };
    const apply = data.applyRemoteState;
    data.applyRemoteState = async function observedApply(...args) {
      counters.applies += 1;
      return apply.apply(this, args);
    };
    const render = window.renderProntuario;
    window.renderProntuario = function observedRender(...args) {
      counters.renderCalls += 1;
      return render.apply(this, args);
    };
    const main = document.getElementById('main-container');
    new MutationObserver(records => {
      counters.mutations += records.length;
      counters.mainReplacements += records.filter(r => r.target === main
        && r.type === 'childList' && r.removedNodes.length > 0).length;
      counters.lastMutationAt = performance.now();
    }).observe(main, { childList: true, subtree: true, attributes: true, characterData: true });
    window.__RADAR_OPERATIONAL_SESSION_OBSERVATION__ = counters;
  });
  return {
    async snapshot() {
      await Promise.all([...pendingBodies]);
      const runtime = await page.evaluate(() => ({
        ...window.__RADAR_OPERATIONAL_SESSION_OBSERVATION__,
        refresh: window.RadarOperationalContextRefreshController?.getMetrics?.() || null,
        realtime: window.RadarOperationalRealtimeInvalidationController?.getMetrics?.() || null,
        pendingRefresh: window.RadarOperationalContextRefreshController?.hasPendingRefresh?.(),
        scrollTop: document.querySelector('.content-area')?.scrollTop ?? window.scrollY,
        focusedId: document.activeElement?.id || null
      }));
      const reads = requests.filter(r => r.path === '/rest/v1/rpc/read_operational_context');
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
