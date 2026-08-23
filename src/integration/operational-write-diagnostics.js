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

    return Object.freeze({ PHASES, percentile, durations, summarize, createProbe });
}));
