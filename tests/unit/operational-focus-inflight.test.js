'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { install } = require('../../src/integration/operational-context-refresh.js');

function session() {
    const root = new EventTarget();
    const document = new EventTarget();
    Object.assign(document, {
        visibilityState: 'visible',
        activeElement: null,
        querySelectorAll: () => [],
        getElementById: () => null
    });
    const reads = [];
    const renders = [];
    let canonicalRevision = 1;
    let projectedRevision = null;
    let releaseFirst;
    const firstResponse = new Promise(resolve => { releaseFirst = resolve; });
    Object.assign(root, {
        document,
        RadarAuthContext: { user: { id: 'local-controller' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarGlobalCompetenceSelector: {
            refreshCurrentView() { renders.push(projectedRevision); }
        },
        RadarApplicationServices: { data: {
            repository: { capabilities: () => ({ remote: true }) },
            async loadOperationalContext(competence, options) {
                const revision = canonicalRevision;
                reads.push({ competence, source: options.source });
                const outcome = reads.length === 1 ? await firstResponse : 'success';
                if (outcome === 'failure') throw new Error('temporary network failure');
                if (outcome === 'stale' || !options.shouldApply()) {
                    return { stale: true, aborted: outcome === 'stale' };
                }
                projectedRevision = revision;
                return { stale: false, revision };
            }
        } },
        console: { warn() {} }
    });
    assert.equal(install(root), true);
    return {
        controller: root.RadarOperationalContextRefreshController,
        reads,
        renders,
        focus: () => root.dispatchEvent(new Event('focus')),
        blur: () => root.dispatchEvent(new Event('blur')),
        hidden: () => {
            document.visibilityState = 'hidden';
            document.dispatchEvent(new Event('visibilitychange'));
        },
        visible: () => {
            document.visibilityState = 'visible';
            document.dispatchEvent(new Event('visibilitychange'));
        },
        releaseFirst,
        changeCanonical: revision => { canonicalRevision = revision; },
        projected: () => projectedRevision
    };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('retornar foco e visibilidade durante leitura bem-sucedida não relê nem reconstrói o mesmo estado', async () => {
    const tab = session();
    tab.focus();
    await settle();
    assert.equal(tab.reads.length, 1);

    tab.visible();
    tab.focus();
    tab.visible();
    tab.releaseFirst('success');
    await settle();

    assert.equal(tab.projected(), 1, 'o resultado em voo já atualiza a sessão que retomou');
    assert.equal(tab.reads.length, 1, 'retomar a aba não informa alteração canônica posterior à leitura');
    assert.deepEqual(tab.renders, [1], 'não reconstruir a projeção novamente sem alteração');
    assert.equal(tab.controller.hasPendingRefresh(), false);
});

test('novo ciclo hidden→visible durante leitura em voo agenda uma reconciliação posterior', async () => {
    const tab = session();
    tab.focus();
    await settle();
    assert.equal(tab.reads.length, 1);

    tab.hidden();
    tab.changeCanonical(2);
    tab.visible();
    tab.releaseFirst('success');
    await settle();
    await settle();

    assert.equal(tab.reads.length, 2, 'um novo ciclo de suspensão pode conter alterações posteriores ao snapshot em voo');
    assert.equal(tab.projected(), 2, 'a sessão visível deve convergir sem depender de outro gesto ou do Realtime');
    assert.deepEqual(tab.renders, [1, 2]);
    assert.equal(tab.controller.hasPendingRefresh(), false);
});

test('novo ciclo blur→focus durante leitura em voo agenda uma reconciliação posterior', async () => {
    const tab = session();
    tab.focus();
    await settle();
    assert.equal(tab.reads.length, 1);

    tab.blur();
    tab.changeCanonical(2);
    tab.focus();
    tab.releaseFirst('success');
    await settle();
    await settle();

    assert.equal(tab.reads.length, 2, 'retomar a janela após blur pode conter alterações posteriores ao snapshot em voo');
    assert.equal(tab.projected(), 2, 'o fallback de foco deve convergir mesmo sem visibilitychange ou Realtime');
    assert.deepEqual(tab.renders, [1, 2]);
    assert.equal(tab.controller.hasPendingRefresh(), false);
});

test('o mesmo retorno hidden+blur→visible+focus não cria duas leituras do mesmo ciclo', async () => {
    const tab = session();
    tab.hidden();
    tab.blur();
    tab.changeCanonical(2);

    tab.visible();
    tab.focus();
    await settle();
    assert.equal(tab.reads.length, 1, 'o primeiro evento de retomada deve iniciar uma única leitura');

    tab.releaseFirst('success');
    await settle();
    await settle();

    assert.equal(tab.reads.length, 1, 'visibility e focus do mesmo retorno não podem criar reconciliação duplicada');
    assert.equal(tab.projected(), 2);
    assert.deepEqual(tab.renders, [2]);
    assert.equal(tab.controller.hasPendingRefresh(), false);
});

test('foco em voo não elimina invalidação realmente nova recebida na mesma leitura', async () => {
    const tab = session();
    tab.focus();
    await settle();
    tab.changeCanonical(2);
    const remote = tab.controller.refresh('realtime', { force: true });
    tab.visible();
    tab.focus();
    tab.releaseFirst('success');
    await remote;
    await settle();

    assert.equal(tab.reads.length, 2, 'reler uma vez para alcançar a alteração posterior');
    assert.equal(tab.projected(), 2);
    assert.deepEqual(tab.renders, [1, 2]);
    assert.equal(tab.controller.hasPendingRefresh(), false);
});

for (const outcome of ['failure', 'stale']) {
    test(`foco e visibilidade preservam recuperação controlada após resultado ${outcome}`, async () => {
        const tab = session();
        tab.focus();
        await settle();
        tab.visible();
        tab.focus();
        tab.releaseFirst(outcome);
        await settle();

        assert.equal(tab.reads.length, 1, 'interação não deve iniciar retry imediato');
        assert.equal(tab.projected(), null);
        assert.deepEqual(tab.renders, []);
        assert.equal(tab.controller.hasPendingRefresh(), true);

        tab.changeCanonical(2);
        await tab.controller.refresh('realtime-retry', { force: true });
        assert.equal(tab.reads.length, 2);
        assert.equal(tab.projected(), 2);
        assert.deepEqual(tab.renders, [2]);
        assert.equal(tab.controller.hasPendingRefresh(), false);
    });
}
