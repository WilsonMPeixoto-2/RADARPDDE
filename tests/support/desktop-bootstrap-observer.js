'use strict';

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function sanitizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(raw);
    const parsed = new URL(raw, 'http://radar.local');
    if (!absolute) return parsed.pathname || '/';
    return `${parsed.origin}${parsed.pathname || '/'}`;
  } catch (_error) {
    return raw.split(/[?#]/, 1)[0];
  }
}

function summarizeRequests(requests = []) {
  const grouped = new Map();
  for (const request of Array.isArray(requests) ? requests : []) {
    const method = String(request?.method || 'GET').trim().toUpperCase() || 'GET';
    const url = sanitizeUrl(request?.url);
    if (!url) continue;
    const key = `${method}\u0000${url}`;
    const duration = Math.max(0, Number(request?.durationMs) || 0);
    const current = grouped.get(key) || {
      method,
      url,
      count: 0,
      totalDurationMs: 0,
      maxDurationMs: 0
    };
    current.count += 1;
    current.totalDurationMs += duration;
    current.maxDurationMs = Math.max(current.maxDurationMs, duration);
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map(item => ({
      ...item,
      totalDurationMs: round(item.totalDurationMs),
      maxDurationMs: round(item.maxDurationMs)
    }))
    .sort((left, right) => left.method.localeCompare(right.method) || left.url.localeCompare(right.url));
}

function summarizeDuplicateResources(resources = []) {
  const grouped = new Map();
  for (const resource of Array.isArray(resources) ? resources : []) {
    const type = String(resource?.type || resource?.initiatorType || 'resource').trim().toLowerCase();
    const url = sanitizeUrl(resource?.url || resource?.name);
    if (!url) continue;
    const key = `${type}\u0000${url}`;
    const current = grouped.get(key) || { type, url, count: 0 };
    current.count += 1;
    grouped.set(key, current);
  }
  return [...grouped.values()]
    .filter(item => item.count > 1)
    .sort((left, right) => left.type.localeCompare(right.type) || left.url.localeCompare(right.url));
}

function sanitizeMilestones(milestones) {
  return (Array.isArray(milestones) ? milestones : [])
    .map(item => ({
      name: String(item?.name || '').trim(),
      atMs: round(item?.atMs)
    }))
    .filter(item => item.name)
    .sort((left, right) => left.atMs - right.atMs || left.name.localeCompare(right.name));
}

function sanitizeResources(resources) {
  return (Array.isArray(resources) ? resources : [])
    .map(item => ({
      type: String(item?.type || item?.initiatorType || 'resource').trim().toLowerCase(),
      url: sanitizeUrl(item?.url || item?.name),
      durationMs: round(item?.durationMs ?? item?.duration),
      transferSize: Math.max(0, Number(item?.transferSize) || 0)
    }))
    .filter(item => item.url)
    .sort((left, right) => left.type.localeCompare(right.type) || left.url.localeCompare(right.url));
}

function sanitizeTimers(timers) {
  return (Array.isArray(timers) ? timers : [])
    .map(item => ({
      delayMs: Math.max(0, Number(item?.delayMs) || 0),
      source: sanitizeUrl(item?.source),
      createdAtMs: round(item?.createdAtMs),
      clearedAtMs: item?.clearedAtMs == null ? null : round(item.clearedAtMs)
    }))
    .sort((left, right) => left.createdAtMs - right.createdAtMs || left.source.localeCompare(right.source));
}

function sanitizeLongTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .map(item => ({ startMs: round(item?.startMs), durationMs: round(item?.durationMs) }))
    .filter(item => item.durationMs > 0)
    .sort((left, right) => left.startMs - right.startMs);
}

function sanitizeCoverage(coverage) {
  return (Array.isArray(coverage) ? coverage : [])
    .map(item => {
      const totalBytes = Math.max(0, Number(item?.totalBytes) || 0);
      const usedBytes = Math.min(totalBytes, Math.max(0, Number(item?.usedBytes) || 0));
      return {
        type: String(item?.type || 'script').trim().toLowerCase(),
        url: sanitizeUrl(item?.url),
        totalBytes,
        usedBytes,
        usedPercent: totalBytes > 0 ? round((usedBytes / totalBytes) * 100, 2) : 0
      };
    })
    .filter(item => item.url)
    .sort((left, right) => left.type.localeCompare(right.type) || left.url.localeCompare(right.url));
}

function sanitizeDiagnosticReport(report = {}) {
  const resources = sanitizeResources(report.resources);
  const sanitized = {
    schemaVersion: 1,
    run: {
      kind: String(report?.run?.kind || '').trim(),
      profile: String(report?.run?.profile || '').trim(),
      iteration: Math.max(0, Number(report?.run?.iteration) || 0),
      totalDurationMs: round(report?.run?.totalDurationMs)
    },
    milestones: sanitizeMilestones(report.milestones),
    requests: summarizeRequests(report.requests),
    resources,
    duplicateResources: summarizeDuplicateResources(resources),
    timers: sanitizeTimers(report.timers),
    longTasks: sanitizeLongTasks(report.longTasks),
    coverage: sanitizeCoverage(report.coverage)
  };
  return sanitized;
}

function median(values = []) {
  const numbers = (Array.isArray(values) ? values : [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (numbers.length === 0) return 0;
  const middle = Math.floor(numbers.length / 2);
  return round(numbers.length % 2 === 1
    ? numbers[middle]
    : (numbers[middle - 1] + numbers[middle]) / 2);
}

function mergedRangeLength(ranges = []) {
  const normalized = (Array.isArray(ranges) ? ranges : [])
    .map(range => ({ start: Math.max(0, Number(range?.start) || 0), end: Math.max(0, Number(range?.end) || 0) }))
    .filter(range => range.end > range.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  if (normalized.length === 0) return 0;
  let total = 0;
  let start = normalized[0].start;
  let end = normalized[0].end;
  for (const range of normalized.slice(1)) {
    if (range.start <= end) {
      end = Math.max(end, range.end);
      continue;
    }
    total += end - start;
    start = range.start;
    end = range.end;
  }
  return total + (end - start);
}

function summarizeCoverageEntries(entries = [], type = 'script') {
  return (Array.isArray(entries) ? entries : [])
    .map(entry => {
      const text = String(entry?.text || '');
      return {
        type,
        url: sanitizeUrl(entry?.url),
        totalBytes: Buffer.byteLength(text, 'utf8'),
        usedBytes: mergedRangeLength(entry?.ranges)
      };
    })
    .filter(entry => entry.url && entry.totalBytes > 0);
}

function browserObserverInit(options = {}) {
  const root = window;
  const startedAt = performance.now();
  const observeTimers = options?.observeTimers === true;
  const state = {
    schemaVersion: 1,
    startedAt,
    milestones: [],
    requests: [],
    resourcesAdded: [],
    timers: [],
    longTasks: []
  };
  const milestoneNames = new Set();

  function localSanitizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const absolute = /^[a-z][a-z\d+.-]*:/i.test(raw);
      const parsed = new URL(raw, root.location?.origin || 'http://radar.local');
      return absolute ? `${parsed.origin}${parsed.pathname || '/'}` : (parsed.pathname || '/');
    } catch (_error) {
      return raw.split(/[?#]/, 1)[0];
    }
  }

  function mark(name) {
    const normalized = String(name || '').trim();
    if (!normalized || milestoneNames.has(normalized)) return;
    milestoneNames.add(normalized);
    state.milestones.push({ name: normalized, atMs: performance.now() - startedAt });
  }

  function sourceFromStack() {
    const stack = String(new Error().stack || '').split('\n');
    const candidate = stack.find(line => /(?:\/src\/|\/app\.js|\/config\.js)/.test(line));
    if (!candidate) return '';
    const match = candidate.match(/(?:https?:\/\/[^/]+)?(\/[^\s):]+\.js)(?::\d+){0,2}/);
    return match ? localSanitizeUrl(match[1]) : '';
  }

  for (const eventName of [
    'radar:auth-required',
    'radar:auth-resolved',
    'radar:application-services-ready',
    'radar:competence-change'
  ]) {
    root.addEventListener(eventName, () => mark(`event:${eventName}`), { capture: true });
  }

  if (typeof root.fetch === 'function') {
    const nativeFetch = root.fetch;
    root.fetch = async function radarObservedFetch(...args) {
      const input = args[0];
      const init = args[1];
      const method = String(init?.method || input?.method || 'GET').toUpperCase();
      const url = localSanitizeUrl(input?.url || input);
      const started = performance.now();
      try {
        const response = await nativeFetch.apply(this, args);
        state.requests.push({
          method,
          url,
          startedAtMs: started - startedAt,
          durationMs: performance.now() - started,
          status: Number(response?.status) || 0
        });
        return response;
      } catch (error) {
        state.requests.push({
          method,
          url,
          startedAtMs: started - startedAt,
          durationMs: performance.now() - started,
          status: 0
        });
        throw error;
      }
    };
  }

  const mutationObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes || []) {
        if (!(node instanceof Element)) continue;
        const candidates = [node, ...node.querySelectorAll?.('script[src],link[href]') || []];
        for (const candidate of candidates) {
          const tag = String(candidate.tagName || '').toLowerCase();
          if (tag === 'script' && candidate.src) {
            state.resourcesAdded.push({ type: 'script', url: localSanitizeUrl(candidate.src), atMs: performance.now() - startedAt });
          } else if (tag === 'link' && candidate.href) {
            state.resourcesAdded.push({ type: 'style', url: localSanitizeUrl(candidate.href), atMs: performance.now() - startedAt });
          }
        }
      }
    }
  });
  mutationObserver.observe(document, { childList: true, subtree: true });

  if (typeof PerformanceObserver === 'function') {
    try {
      const longTaskObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          state.longTasks.push({ startMs: entry.startTime, durationMs: entry.duration });
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (_error) {
      // Long Tasks não está disponível em todos os runtimes. A ausência não altera o teste.
    }
  }

  if (observeTimers && typeof root.setInterval === 'function' && typeof root.clearInterval === 'function') {
    const nativeSetInterval = root.setInterval.bind(root);
    const nativeClearInterval = root.clearInterval.bind(root);
    root.setInterval = function radarObservedSetInterval(callback, delay, ...args) {
      const createdAtMs = performance.now() - startedAt;
      const handle = nativeSetInterval(callback, delay, ...args);
      state.timers.push({
        handle: String(handle),
        delayMs: Number(delay) || 0,
        createdAtMs,
        clearedAtMs: null,
        source: sourceFromStack()
      });
      return handle;
    };
    root.clearInterval = function radarObservedClearInterval(handle) {
      const record = [...state.timers].reverse().find(item => item.handle === String(handle) && item.clearedAtMs == null);
      if (record) record.clearedAtMs = performance.now() - startedAt;
      return nativeClearInterval(handle);
    };
  }

  let productReadyHooked = false;
  function sampleReadiness() {
    if (root.RadarDataContext?.ready === true) mark('data-ready');
    if (root.RadarCompetenceContext?.isInitialized?.() === true) mark('competence-ready');
    if (root.__radarNavigationHistoryInstalled === true) mark('navigation-installed');
    if (!productReadyHooked && root.RadarProductExtensionsReady?.then) {
      productReadyHooked = true;
      root.RadarProductExtensionsReady.then(() => mark('product-extensions-ready')).catch(() => mark('product-extensions-failed'));
    }

    const gate = document.getElementById('radar-auth-gate');
    const app = document.getElementById('app-layout');
    if (gate && (gate.hidden || getComputedStyle(gate).display === 'none' || getComputedStyle(gate).visibility === 'hidden')) {
      mark('auth-gate-hidden');
    }
    const main = document.getElementById('main-container');
    const dashboardActive = document.getElementById('nav-dashboard')?.classList.contains('active') === true;
    const appReleased = app && app.inert !== true && getComputedStyle(app).display !== 'none';
    if (root.RadarDataContext?.ready === true && appReleased && dashboardActive && main && main.childElementCount > 0) {
      mark('dashboard-usable');
    }
    root.requestAnimationFrame(sampleReadiness);
  }
  root.requestAnimationFrame(sampleReadiness);

  root.__RADAR_BOOTSTRAP_OBSERVER__ = Object.freeze({
    mark,
    snapshot() {
      const resourceEntries = performance.getEntriesByType('resource').map(entry => ({
        type: entry.initiatorType || 'resource',
        url: localSanitizeUrl(entry.name),
        durationMs: entry.duration,
        transferSize: entry.transferSize || 0
      }));
      return {
        schemaVersion: state.schemaVersion,
        milestones: state.milestones.map(item => ({ ...item })),
        requests: state.requests.map(item => ({ ...item })),
        resourcesAdded: state.resourcesAdded.map(item => ({ ...item })),
        resources: resourceEntries,
        timers: state.timers.map(item => ({ ...item })),
        longTasks: state.longTasks.map(item => ({ ...item }))
      };
    }
  });
}

async function installBootstrapObserver(page, options = {}) {
  await page.addInitScript(browserObserverInit, { observeTimers: options.observeTimers === true });
}

async function markMilestone(page, name) {
  await page.evaluate(value => window.__RADAR_BOOTSTRAP_OBSERVER__?.mark?.(value), name);
}

async function readBootstrapObservation(page) {
  return page.evaluate(() => window.__RADAR_BOOTSTRAP_OBSERVER__?.snapshot?.() || null);
}

module.exports = Object.freeze({
  sanitizeUrl,
  summarizeRequests,
  summarizeDuplicateResources,
  sanitizeDiagnosticReport,
  median,
  summarizeCoverageEntries,
  installBootstrapObserver,
  markMilestone,
  readBootstrapObservation
});
