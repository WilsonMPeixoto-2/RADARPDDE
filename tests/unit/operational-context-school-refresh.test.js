'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createController } = require('../../src/integration/operational-context-refresh.js');

function createRoot({ editing = false } = {}) {
    const renders = [];
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-09' }) },
        RadarTask9PendencyPage: { requestedHistoryStatuses: () => ['Resolvida'] },
        RadarGlobalCompetenceSelector: {
            refreshCurrentView() { renders.push('render'); }
        },
        document: {
            querySelectorAll: () => editing ? [{}] : [],
            activeElement: null,
            getElementById: () => null
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent() {},
        console: { warn() {} }
    };
    return { root, renders, setEditing(value) { editing = Boolean(value); } };
}

test('refresh escolar usa competência ativa, aplica a fatia e rerenderiza a visão atual', async () => {
    const { root, renders } = createRoot();
    const calls = [];
    const service = {
        async loadOperationalContext() {
            throw new Error('refresh global não deveria ser usado');
        },
        async loadSchoolOperationalContext(schoolId, competenceId, options) {
            calls.push({ schoolId, competenceId, options });
            assert.equal(options.shouldApply(), true);
            return { schoolId, competenceId, stale: false, applied: true };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const result = await controller.refreshSchool('school-a', 'realtime-school');

    assert.equal(result.applied, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].schoolId, 'school-a');
    assert.equal(calls[0].competenceId, '2026-09');
    assert.deepEqual(calls[0].options.historyStatuses, ['Resolvida']);
    assert.match(calls[0].options.source, /realtime-school/);
    assert.deepEqual(renders, ['render']);
});

test('refresh escolar não interrompe edição ativa e preserva recuperação pendente', async () => {
    const { root } = createRoot({ editing: true });
    let schoolCalls = 0;
    const service = {
        async loadOperationalContext() { return { stale: false }; },
        async loadSchoolOperationalContext() {
            schoolCalls += 1;
            return { stale: false, applied: true };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const result = await controller.refreshSchool('school-a', 'realtime-school');

    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'editing');
    assert.equal(result.pending, true);
    assert.equal(schoolCalls, 0);
    assert.equal(controller.hasPendingRefresh(), true);
});

test('fallback da leitura escolar usa o refresh global canônico', async () => {
    const { root, renders } = createRoot();
    let schoolCalls = 0;
    let globalCalls = 0;
    const service = {
        async loadSchoolOperationalContext() {
            schoolCalls += 1;
            return {
                stale: false,
                applied: false,
                fallback: { kind: 'global', reason: 'NON_ISOLATABLE_RELATION' }
            };
        },
        async loadOperationalContext() {
            globalCalls += 1;
            return { stale: false };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const result = await controller.refreshSchool('school-a', 'realtime-school');

    assert.equal(result.stale, false);
    assert.equal(schoolCalls, 1);
    assert.equal(globalCalls, 1);
    assert.deepEqual(renders, ['render']);
});

test('resposta escolar stale não rerenderiza e mantém necessidade de reconciliação', async () => {
    const { root, renders } = createRoot();
    const service = {
        async loadOperationalContext() { return { stale: false }; },
        async loadSchoolOperationalContext() {
            return { schoolId: 'school-a', competenceId: '2026-09', stale: true, applied: false };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const result = await controller.refreshSchool('school-a', 'realtime-school');

    assert.equal(result.stale, true);
    assert.equal(controller.hasPendingRefresh(), true);
    assert.deepEqual(renders, []);
});
