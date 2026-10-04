'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install } = require('../../src/integration/operational-context-refresh.js');

const settle = () => new Promise(resolve => setImmediate(resolve));

function session(t) {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 100000 });
    const root = new EventTarget();
    const document = new EventTarget();
    const reads = [];
    const renders = [];
    let canonicalRevision = 1;
    let projectedRevision = null;
    Object.assign(document, {
        visibilityState: 'visible',
        activeElement: null,
        querySelectorAll: () => [],
        getElementById: () => null
    });
    Object.assign(root, {
        document,
        setTimeout: (...args) => setTimeout(...args),
        RadarAuthContext: { user: { id: 'local-controller' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarGlobalCompetenceSelector: {
            refreshCurrentView() { renders.push(projectedRevision); }
        },
        RadarApplicationServices: { data: {
            repository: { capabilities: () => ({ remote: true }) },
            async loadOperationalContext(_competence, options) {
                reads.push(canonicalRevision);
                assert.equal(options.shouldApply(), true);
                projectedRevision = canonicalRevision;
                return { stale: false };
            }
        } },
        console: { warn() {} }
    });
    assert.equal(install(root), true);
    return {
        reads,
        renders,
        controller: root.RadarOperationalContextRefreshController,
        leave() {
            document.visibilityState = 'hidden';
            document.dispatchEvent(new Event('visibilitychange'));
            root.dispatchEvent(new Event('blur'));
        },
        signal(kind) {
            document.visibilityState = 'visible';
            if (kind === 'focus') root.dispatchEvent(new Event('focus'));
            else document.dispatchEvent(new Event('visibilitychange'));
        },
        changeCanonical(revision) { canonicalRevision = revision; },
        async advance(ms) { t.mock.timers.tick(ms); await settle(); }
    };
}

for (const order of [['visibility', 'focus'], ['focus', 'visibility']]) {
    test(`retomada ${order.join('→')} não relê quando a primeira resposta termina antes do segundo sinal`, async t => {
        const tab = session(t);
        tab.leave();
        tab.signal(order[0]);
        await settle();
        assert.deepEqual(tab.renders, [1], 'o primeiro sinal já aplicou o estado canônico');

        tab.signal(order[1]);
        await settle();
        // A leitura precisa continuar única depois do cooldown, não apenas
        // enquanto a primeira Promise permanece em voo.
        await tab.advance(31000);
        await tab.advance(31000);

        assert.deepEqual(tab.reads, [1], 'sem invalidação, a mesma retomada exige somente uma leitura');
        assert.deepEqual(tab.renders, [1], 'não reconstruir a mesma projeção 30 segundos depois');
        assert.equal(tab.controller.hasPendingRefresh(), false);
    });
}

test('nova suspensão dentro do cooldown mantém a recuperação mesmo sem Broadcast ou gesto posterior', async t => {
    const tab = session(t);
    tab.leave();
    tab.signal('visibility');
    tab.signal('focus');
    await settle();
    assert.deepEqual(tab.renders, [1]);

    tab.leave();
    tab.changeCanonical(2);
    tab.signal('focus');
    tab.signal('visibility');
    await settle();
    assert.equal(tab.controller.hasPendingRefresh(), true, 'a nova suspensão pode ter perdido alterações');

    await tab.advance(31000);
    await tab.advance(31000);
    assert.deepEqual(tab.reads, [1, 2]);
    assert.deepEqual(tab.renders, [1, 2], 'a sessão recupera a verdade sem gesto ou evento remoto adicional');
    assert.equal(tab.controller.hasPendingRefresh(), false);
});
