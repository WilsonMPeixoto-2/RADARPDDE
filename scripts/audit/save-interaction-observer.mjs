// Test-only observer: never loaded by the product or included in its public build.
// Native Event Timing measures the next presentation, not completion of async save.
export function installSaveInteractionObserver() {
  const root = window;
  root.__A9_NATIVE__?.dispose();
  const startedAt = performance.now();
  const observations = {
    supported: [...PerformanceObserver.supportedEntryTypes],
    durationThresholdMs: 16,
    startedAt,
    visibilityAtStart: document.visibilityState,
    focusedAtStart: document.hasFocus(),
    events: [], frames: [], longAnimationFrames: [], longTasks: [], phases: [], visibility: []
  };
  const observers = [];
  const restorers = [];
  const safePath = value => {
    try { return new URL(value, location.href).pathname; } catch { return ''; }
  };
  const observe = (type, consume, options = {}) => {
    if (!observations.supported.includes(type)) return;
    const observer = new PerformanceObserver(list => list.getEntries().forEach(consume));
    observer.observe({ type, buffered: false, ...options });
    observers.push({ observer, consume });
  };
  observe('event', e => observations.events.push({
    name: e.name, startTime: e.startTime, duration: e.duration,
    processingStart: e.processingStart, processingEnd: e.processingEnd,
    interactionId: e.interactionId, cancelable: e.cancelable,
    target: e.target?.id || e.target?.textContent?.trim().slice(0, 80) || null
  }), { durationThreshold: 16 });
  observe('longtask', e => observations.longTasks.push({ startTime: e.startTime, duration: e.duration }));
  observe('long-animation-frame', e => observations.longAnimationFrames.push({
    startTime: e.startTime, duration: e.duration, blockingDuration: e.blockingDuration,
    renderStart: e.renderStart, styleAndLayoutStart: e.styleAndLayoutStart,
    firstUIEventTimestamp: e.firstUIEventTimestamp,
    scripts: Array.from(e.scripts || [], s => ({
      startTime: s.startTime, duration: s.duration, executionStart: s.executionStart,
      forcedStyleAndLayoutDuration: s.forcedStyleAndLayoutDuration,
      pauseDuration: s.pauseDuration, invoker: s.invoker, invokerType: s.invokerType,
      sourcePath: safePath(s.sourceURL), sourceFunctionName: s.sourceFunctionName,
      sourceCharPosition: s.sourceCharPosition
    }))
  }));
  const visible = () => observations.visibility.push({ at: performance.now(), state: document.visibilityState, focus: document.hasFocus() });
  document.addEventListener('visibilitychange', visible);
  const click = event => {
    if (!event.target.closest('#form-dados-nota button[type="submit"]')) return;
    observations.click = { at: performance.now(), timeStamp: event.timeStamp, trusted: event.isTrusted,
      visibility: document.visibilityState, focus: document.hasFocus(), label: event.target.textContent.trim() };
    const frame = timestamp => {
      observations.frames.push({ timestamp, callbackAt: performance.now() });
      if (performance.now() < observations.click.at + 1000) frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
  };
  let frameId;
  document.addEventListener('click', click, true);
  const data = root.RadarApplicationServices.data;
  const state = () => ({ coverage: Boolean(data.schoolOperationalCoverage),
    generation: data.schoolOperationalCoverageGeneration, competence: data.currentOperationalCompetence });
  const phase = (name, extra = {}) => observations.phases.push({ name, at: performance.now(), ...state(), ...extra });
  const wrap = (object, key, describe = () => ({})) => {
    const original = object?.[key];
    if (typeof original !== 'function') return;
    function observed(...args) {
      phase(`${key}:start`, describe(args));
      let result;
      try { result = original.apply(this, args); }
      catch (error) { phase(`${key}:throw`, { code: error?.code || null }); throw error; }
      const finish = value => phase(`${key}:end`, {
        stateSync: value?.stateSync || null, fallback: value?.fallback || null,
        stale: value?.stale ?? null, applied: value?.applied ?? null
      });
      if (result?.then) result.then(finish, error => phase(`${key}:reject`, { code: error?.code || null }));
      else finish(result);
      return result;
    }
    object[key] = observed;
    restorers.push(() => { if (object[key] === observed) object[key] = original; });
  };
  wrap(data, 'execute', ([c]) => ({ command: c?.name, authoritativeResult: c?.remoteResultIsAuthoritative === true,
    authoritativeCommit: c?.remoteCommitIsAuthoritative === true, changedEntities: c?.changedEntities }));
  wrap(data, 'invalidateSchoolOperationalCoverage');
  wrap(data, 'applyRemoteState', ([, entities, source]) => ({ entities, source }));
  wrap(data, 'loadSchoolOperationalContext', ([, , o]) => ({ source: o?.source }));
  wrap(data, 'loadOperationalContext', ([, o]) => ({ source: o?.source }));
  wrap(root, 'renderProntuario');
  wrap(root, 'closeModal', ([id]) => ({ modal: id }));
  const sample = () => {
    observers.forEach(({ observer, consume }) => observer.takeRecords().forEach(consume));
    return observations;
  };
  root.__A9_NATIVE__ = {
    sample,
    dispose() {
      sample(); observers.forEach(({ observer }) => observer.disconnect());
      cancelAnimationFrame(frameId);
      document.removeEventListener('click', click, true);
      document.removeEventListener('visibilitychange', visible);
      restorers.reverse().forEach(restore => restore());
    }
  };
}
