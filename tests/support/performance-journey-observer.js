'use strict';

function round(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function percentile(values = [], ratio = 0.5) {
  const numbers = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!numbers.length) return null;
  const index = Math.min(numbers.length - 1, Math.max(0, Math.ceil(numbers.length * ratio) - 1));
  return round(numbers[index]);
}

function summarizeSamples(samples = []) {
  const metric = key => samples.map(item => item?.[key]).filter(Number.isFinite);
  return {
    sampleCount: samples.length,
    totalMs: { p50: percentile(metric('totalMs'), 0.50), p95: percentile(metric('totalMs'), 0.95) },
    networkWallMs: { p50: percentile(metric('networkWallMs'), 0.50), p95: percentile(metric('networkWallMs'), 0.95) },
    contextLoadMs: { p50: percentile(metric('contextLoadMs'), 0.50), p95: percentile(metric('contextLoadMs'), 0.95) },
    renderProntuarioMs: { p50: percentile(metric('renderProntuarioMs'), 0.50), p95: percentile(metric('renderProntuarioMs'), 0.95) },
    rebuildIndexesMs: { p50: percentile(metric('rebuildIndexesMs'), 0.50), p95: percentile(metric('rebuildIndexesMs'), 0.95) }
  };
}

function sanitizePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw, 'http://radar.local').pathname || '/';
  } catch (_error) {
    return raw.split(/[?#]/, 1)[0];
  }
}

function summarizeRequests(requests = []) {
  const grouped = new Map();
  for (const item of requests) {
    const path = sanitizePath(item?.path || item?.url);
    const method = String(item?.method || 'GET').toUpperCase();
    if (!path) continue;
    const key = `${method}\u0000${path}`;
    const current = grouped.get(key) || {
      method,
      path,
      count: 0,
      totalDurationMs: 0,
      maxDurationMs: 0
    };
    const duration = Math.max(0, Number(item?.durationMs) || 0);
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
    .sort((a, b) => b.totalDurationMs - a.totalDurationMs || a.path.localeCompare(b.path));
}

async function installNetworkObserver(page) {
  await page.addInitScript(() => {
    const root = window;
    const requests = [];
    const longTasks = [];
    let generation = 0;
    let generationStartedAt = performance.now();

    function pathOnly(value) {
      try {
        return new URL(String(value?.url || value || ''), root.location.origin).pathname || '/';
      } catch (_error) {
        return String(value || '').split(/[?#]/, 1)[0];
      }
    }

    const nativeFetch = root.fetch?.bind(root);
    if (nativeFetch) {
      root.fetch = async function observedFetch(input, init) {
        const requestGeneration = generation;
        const startedAt = performance.now();
        const method = String(init?.method || input?.method || 'GET').toUpperCase();
        const path = pathOnly(input);
        try {
          const response = await nativeFetch(input, init);
          if (requestGeneration === generation) {
            requests.push({
              method,
              path,
              startedAtMs: startedAt - generationStartedAt,
              durationMs: performance.now() - startedAt,
              status: Number(response?.status) || 0
            });
          }
          return response;
        } catch (error) {
          if (requestGeneration === generation) {
            requests.push({
              method,
              path,
              startedAtMs: startedAt - generationStartedAt,
              durationMs: performance.now() - startedAt,
              status: 0
            });
          }
          throw error;
        }
      };
    }

    if (typeof PerformanceObserver === 'function') {
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.startTime < generationStartedAt) continue;
            longTasks.push({
              startMs: entry.startTime - generationStartedAt,
              durationMs: entry.duration
            });
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
      } catch (_error) {
        // Long Tasks são diagnósticos opcionais.
      }
    }

    root.__RADAR_PERFORMANCE_JOURNEY_OBSERVER__ = Object.freeze({
      reset() {
        generation += 1;
        generationStartedAt = performance.now();
        requests.length = 0;
        longTasks.length = 0;
        return generationStartedAt;
      },
      now() {
        return performance.now();
      },
      snapshot() {
        return {
          generation,
          startedAt: generationStartedAt,
          now: performance.now(),
          requests: requests.map(item => ({ ...item })),
          longTasks: longTasks.map(item => ({ ...item }))
        };
      }
    });
  });
}

async function installRuntimeHooks(page) {
  return page.evaluate(() => {
    if (window.__RADAR_PERFORMANCE_RUNTIME_HOOKS__?.installed === true) return true;

    const measurements = [];
    const wrapAsync = (target, key, label) => {
      if (!target || typeof target[key] !== 'function') return false;
      const original = target[key].bind(target);
      target[key] = async function observedAsync(...args) {
        const startedAt = performance.now();
        try {
          return await original(...args);
        } finally {
          measurements.push({ label, durationMs: performance.now() - startedAt });
        }
      };
      return true;
    };
    const wrapSync = (target, key, label) => {
      if (!target || typeof target[key] !== 'function') return false;
      const original = target[key];
      target[key] = function observedSync(...args) {
        const startedAt = performance.now();
        try {
          return original.apply(this, args);
        } finally {
          measurements.push({ label, durationMs: performance.now() - startedAt });
        }
      };
      return true;
    };

    wrapAsync(window.RadarApplicationServices?.data, 'loadOperationalContext', 'contextLoad');
    wrapSync(window, 'renderProntuario', 'renderProntuario');
    wrapSync(window, 'rebuildOperationalIndexes', 'rebuildIndexes');

    window.__RADAR_PERFORMANCE_RUNTIME_HOOKS__ = Object.freeze({
      installed: true,
      reset() {
        measurements.length = 0;
      },
      snapshot() {
        return measurements.map(item => ({ ...item }));
      }
    });
    return true;
  });
}

async function resetObservers(page) {
  await page.evaluate(() => {
    window.__RADAR_PERFORMANCE_JOURNEY_OBSERVER__?.reset?.();
    window.__RADAR_PERFORMANCE_RUNTIME_HOOKS__?.reset?.();
  });
}

async function readObservation(page) {
  const raw = await page.evaluate(() => ({
    network: window.__RADAR_PERFORMANCE_JOURNEY_OBSERVER__?.snapshot?.() || null,
    runtime: window.__RADAR_PERFORMANCE_RUNTIME_HOOKS__?.snapshot?.() || []
  }));
  const requests = raw.network?.requests || [];
  const requestSummary = summarizeRequests(requests);
  const started = requests.map(item => Number(item.startedAtMs)).filter(Number.isFinite);
  const ended = requests
    .map(item => Number(item.startedAtMs) + Number(item.durationMs))
    .filter(Number.isFinite);
  const networkWallMs = started.length && ended.length
    ? Math.max(0, Math.max(...ended) - Math.min(...started))
    : 0;
  const sum = label => raw.runtime
    .filter(item => item.label === label)
    .reduce((total, item) => total + Math.max(0, Number(item.durationMs) || 0), 0);

  return {
    networkWallMs: round(networkWallMs),
    requestCount: requests.length,
    requests: requestSummary,
    longTaskCount: raw.network?.longTasks?.length || 0,
    longTaskTotalMs: round((raw.network?.longTasks || [])
      .reduce((total, item) => total + Math.max(0, Number(item.durationMs) || 0), 0)),
    contextLoadMs: round(sum('contextLoad')),
    renderProntuarioMs: round(sum('renderProntuario')),
    rebuildIndexesMs: round(sum('rebuildIndexes'))
  };
}

module.exports = Object.freeze({
  round,
  percentile,
  summarizeSamples,
  summarizeRequests,
  installNetworkObserver,
  installRuntimeHooks,
  resetObservers,
  readObservation
});
