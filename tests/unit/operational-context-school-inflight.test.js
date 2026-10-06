'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createController } = require('../../src/integration/operational-context-refresh.js');

function createRoot() {
    const renders = [];
    return {
        renders,
        root: {
            RadarAuthContext: { user: { id: 'user-1' } },
            RadarCompetenceContext: { getState: () => ({ activeKey: '2026-09' }) },
            RadarTask9PendencyPage: { requestedHistoryStatuses: () => [] },
            RadarGlobalCompetenceSelector: { refreshCurrentView: () => renders.push('render') },
            document: {
                querySelectorAll: () => [],
                activeElement: null,
                getElementById: () => null
            },
            console: { warn() {} }
        }
    };
}

test('nova invalidação escolar durante leitura em voo executa uma segunda leitura após a primeira', async () => {
    const { root, renders } = createRoot();
    const calls = [];
    const resolvers = [];
    const service = {
        async loadOperationalContext() { return { stale: false }; },
        loadSchoolOperationalContext(schoolId, competenceId) {
            calls.push({ schoolId, competenceId });
            return new Promise(resolve => resolvers.push(resolve));
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const first = controller.refreshSchool('school-a', 'realtime-school');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 1);

    const second = controller.refreshSchool('school-a', 'realtime-school');
    await Promise.resolve();
    assert.equal(calls.length, 1, 'a segunda leitura deve esperar a primeira terminar');

    resolvers[0]({ stale: false, applied: true });
    await first;
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(calls.length, 2, 'a invalidação posterior precisa de snapshot próprio');
    resolvers[1]({ stale: false, applied: true });
    const secondResult = await second;

    assert.equal(secondResult.applied, true);
    assert.equal(controller.hasPendingRefresh(), false);
    assert.equal(renders.length, 2);
});
