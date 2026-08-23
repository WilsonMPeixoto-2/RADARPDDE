(function installRadarOperationalWriteDiagnostics(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarOperationalWriteDiagnostics = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalWriteDiagnosticsApi() {
    'use strict';

    const PHASES = Object.freeze([
        'click',
        'feedback',
        'rpcStart',
        'rpcEnd',
        'applyStart',
        'applyEnd',
        'stable'
    ]);
    const PERFORMANCE_PREFIX = 'radar-operational-write:';
    const MAX_PENDING_PER_LABEL = 20;
    const runtimes = new WeakMap();

    function finite(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function percentile(values, ratio) {
        const ordered = (values || [])
            .map(finite)
            .filter(value => value !== null)
            .sort((left, right) => left - right);
        if (!ordered.length) return null;
        const index = Math.min(
            ordered.length - 1,
            Math.max(0, Math.ceil(ordered.length * ratio) - 1)
        );
        return ordered[index];
    }

    function durations(entry = {}) {
        const at = phase => finite(entry[phase]);
        const delta = (end, start) => {
            const endAt = at(end);
            const startAt = at(start);
            return endAt === null || startAt === null ? null : Math.max(0, endAt - startAt);
        };
        return Object.freeze({
            clickToFeedback: delta('feedback', 'click'),
            rpc: delta('rpcEnd', 'rpcStart'),
            apply: delta('applyEnd', 'applyStart'),
            clickToStable: delta('stable', 'click')
        });
    }

    function summarize(entries = []) {
        const samples = entries.map(durations);
        const metric = name => samples.map(sample => sample[name]).filter(value => value !== null);
        return Object.freeze({
            sampleCount: entries.length,
            clickToFeedback: Object.freeze({
                p50: percentile(metric('clickToFeedback'), 0.50),
                p95: percentile(metric('clickToFeedback'), 0.95)
            }),
            rpc: Object.freeze({
                p50: percentile(metric('rpc'), 0.50),
                p95: percentile(metric('rpc'), 0.95)
            }),
            apply: Object.freeze({
                p50: percentile(metric('apply'), 0.50),
                p95: percentile(metric('apply'), 0.95)
            }),
            clickToStable: Object.freeze({
                p50: percentile(metric('clickToStable'), 0.50),
                p95: percentile(metric('clickToStable'), 0.95)
            })
        });
    }

    function createProbe(options = {}) {
        const now = typeof options.now === 'function'
            ? options.now
            : (() => (typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now()));
        const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 100;
        const entries = [];
        let sequence = 0;

        function begin(label = 'operational-write') {
            const entry = { id: ++sequence, label: String(label), click: now() };
            entries.push(entry);
            while (entries.length > limit) entries.shift();
            return entry.id;
        }

        function mark(id, phase) {
            if (!PHASES.includes(phase)) throw new TypeError(`Fase de performance inválida: ${phase}.`);
            const entry = entries.find(candidate => candidate.id === id);
            if (!entry) return false;
            entry[phase] = now();
            return true;
        }

        function snapshot() {
            return entries.map(entry => ({ ...entry, durations: durations(entry) }));
        }

        function summary() {
            return summarize(entries);
        }

        return Object.freeze({ begin, mark, snapshot, summary });
    }

    function validRoot(root) {
        return Boolean(root && (typeof root === 'object' || typeof root === 'function'));
    }

    function phaseMarkName(id, phase) {
        return `${PERFORMANCE_PREFIX}${id}:${phase}`;
    }

    function measureName(id, metric) {
        return `${PERFORMANCE_PREFIX}${id}:${metric}`;
    }

    function createNativePerformanceBridge(root) {
        const performanceApi = root?.performance;
        const supported = Boolean(performanceApi && typeof performanceApi.mark === 'function');
        let observer = null;

        if (supported && typeof root?.PerformanceObserver === 'function') {
            try {
                observer = new root.PerformanceObserver(list => {
                    const entries = typeof list?.getEntries === 'function' ? list.getEntries() : [];
                    entries.forEach(entry => {
                        if (String(entry?.name || '').startsWith(PERFORMANCE_PREFIX)) {
                            try {
                                performanceApi.clearMeasures?.(entry.name);
                            } catch (_error) {
                                // Diagnóstico é sempre fail-open.
                            }
                        }
                    });
                });
                observer.observe({ entryTypes: ['measure'] });
            } catch (_error) {
                observer = null;
            }
        }

        function nativeMark(id, phase) {
            if (!supported) return false;
            try {
                performanceApi.mark(phaseMarkName(id, phase));
                return true;
            } catch (_error) {
                return false;
            }
        }

        function nativeMeasure(id, metric, startPhase, endPhase) {
            if (!supported || typeof performanceApi.measure !== 'function') return false;
            const name = measureName(id, metric);
            try {
                performanceApi.measure(name, {
                    start: phaseMarkName(id, startPhase),
                    end: phaseMarkName(id, endPhase)
                });
                if (!observer) performanceApi.clearMeasures?.(name);
                return true;
            } catch (_error) {
                return false;
            }
        }

        function close(id) {
            nativeMeasure(id, 'clickToFeedback', 'click', 'feedback');
            nativeMeasure(id, 'rpc', 'rpcStart', 'rpcEnd');
            nativeMeasure(id, 'apply', 'applyStart', 'applyEnd');
            nativeMeasure(id, 'clickToStable', 'click', 'stable');
            PHASES.forEach(phase => {
                try {
                    performanceApi?.clearMarks?.(phaseMarkName(id, phase));
                } catch (_error) {
                    // Diagnóstico é sempre fail-open.
                }
            });
        }

        return Object.freeze({ mark: nativeMark, close });
    }

    function createRuntime(root, options = {}) {
        const now = typeof options.now === 'function'
            ? options.now
            : (() => {
                try {
                    if (typeof root?.performance?.now === 'function') return root.performance.now();
                } catch (_error) {
                    // Fallback abaixo.
                }
                return Date.now();
            });
        const probe = createProbe({ ...options, now });
        const pending = new Map();
        const nativePerformance = createNativePerformanceBridge(root);
        let activeTraceId = null;

        return {
            probe,
            pending,
            nativePerformance,
            get activeTraceId() {
                return activeTraceId;
            },
            set activeTraceId(value) {
                activeTraceId = value;
            }
        };
    }

    function install(root, options = {}) {
        if (!validRoot(root)) return null;
        const existing = runtimes.get(root);
        if (existing) return existing;

        const runtime = createRuntime(root, options);
        runtimes.set(root, runtime);
        try {
            root.RadarOperationalWriteMetrics = Object.freeze({
                snapshot: () => runtime.probe.snapshot(),
                summary: () => runtime.probe.summary()
            });
        } catch (_error) {
            // A indisponibilidade da interface de leitura não pode bloquear o produto.
        }
        return runtime;
    }

    function begin(root, label = 'operational-write') {
        try {
            const runtime = install(root);
            if (!runtime) return null;
            const id = runtime.probe.begin(String(label || 'operational-write'));
            runtime.nativePerformance.mark(id, 'click');
            return id;
        } catch (_error) {
            return null;
        }
    }

    function mark(root, id, phase) {
        try {
            const runtime = install(root);
            if (!runtime || id == null || !PHASES.includes(phase)) return false;
            const marked = runtime.probe.mark(id, phase);
            if (!marked) return false;
            runtime.nativePerformance.mark(id, phase);
            if (phase === 'stable') runtime.nativePerformance.close(id);
            return true;
        } catch (_error) {
            return false;
        }
    }

    function enqueue(root, label, id) {
        try {
            const runtime = install(root);
            if (!runtime || id == null) return false;
            const key = String(label || 'operational-write');
            const queue = runtime.pending.get(key) || [];
            queue.push(id);
            while (queue.length > MAX_PENDING_PER_LABEL) queue.shift();
            runtime.pending.set(key, queue);
            return true;
        } catch (_error) {
            return false;
        }
    }

    function take(root, label) {
        try {
            const runtime = install(root);
            if (!runtime) return null;
            const key = String(label || 'operational-write');
            const queue = runtime.pending.get(key);
            if (!queue?.length) return null;
            const id = queue.shift();
            if (queue.length === 0) runtime.pending.delete(key);
            return id ?? null;
        } catch (_error) {
            return null;
        }
    }

    function active(root) {
        try {
            return install(root)?.activeTraceId ?? null;
        } catch (_error) {
            return null;
        }
    }

    function withActive(root, id, callback) {
        if (typeof callback !== 'function') return undefined;
        const runtime = install(root);
        if (!runtime || id == null) return callback();
        const previous = runtime.activeTraceId;
        runtime.activeTraceId = id;
        try {
            return callback();
        } finally {
            runtime.activeTraceId = previous;
        }
    }

    return Object.freeze({
        PHASES,
        percentile,
        durations,
        summarize,
        createProbe,
        install,
        begin,
        mark,
        enqueue,
        take,
        active,
        withActive
    });
}));
