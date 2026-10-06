'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createController } = require('../../src/integration/operational-context-refresh.js');

function createRoot() {
    let editing = true;
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-09' }) },
        RadarTask9PendencyPage: { requestedHistoryStatuses: () => ['Resolvida'] },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        document: {
            querySelectorAll: () => [],
            activeElement: { matches: () => editing },
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
    return {
        root,
        setEditing(value) { editing = Boolean(value); }
    };
}

test('invalidação escolar adiada por edição continua escolar quando a edição termina', async () => {
    const { root, setEditing } = createRoot();
    const schoolCalls = [];
    const globalCalls = [];
    const service = {
        async loadSchoolOperationalContext(schoolId, competenceId) {
            schoolCalls.push({ schoolId, competenceId });
            return { stale: false, applied: true };
        },
        async loadOperationalContext(competenceId) {
            globalCalls.push({ competenceId });
            return { stale: false };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const deferred = await controller.refreshSchool('school-a', 'realtime-school');
    assert.equal(deferred.skipped, true);
    assert.equal(deferred.reason, 'editing');
    assert.equal(controller.hasPendingRefresh(), true);
    assert.equal(schoolCalls.length, 0);
    assert.equal(globalCalls.length, 0);

    setEditing(false);
    const result = await controller.flushPending('editing-ended');

    assert.equal(result.applied, true);
    assert.deepEqual(schoolCalls, [{ schoolId: 'school-a', competenceId: '2026-09' }]);
    assert.equal(globalCalls.length, 0, 'a drenagem da pendência escolar não pode cair no refresh global');
    assert.equal(controller.hasPendingRefresh(), false);
});
