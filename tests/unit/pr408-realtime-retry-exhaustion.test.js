'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createController } = require('../../src/integration/operational-context-refresh.js');

function rootWithTimers(timers) {
    return {
        RadarAuthContext: { user: { id: 'local-controller' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        document: {
            querySelectorAll: () => [],
            activeElement: null,
            getElementById: () => null
        },
        setTimeout(callback, delay) {
            const token = { callback, delay };
            timers.push(token);
            return token;
        },
        clearTimeout(token) {
            const index = timers.indexOf(token);
            if (index >= 0) timers.splice(index, 1);
        },
        console: { warn() {} }
    };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('retry Realtime stale agenda uma única recuperação futura mesmo se write-settled ocorreu enquanto a pendência estava consumida', async () => {
    const timers = [];
    let calls = 0;
    let releaseSecond;
    const secondBarrier = new Promise(resolve => { releaseSecond = resolve; });
    const controller = createController(rootWithTimers(timers), {
        async loadOperationalContext() {
            calls += 1;
            if (calls === 1) return { stale: true, aborted: true };
            if (calls === 2) {
                await secondBarrier;
                return { stale: true, aborted: true };
            }
            return { stale: false };
        }
    }, { minIntervalMs: 20 });

    await controller.refresh('realtime', { force: true });
    assert.equal(controller.hasPendingRefresh(), true);

    const retry = controller.refresh('realtime-retry', { force: true });
    await settle();
    assert.equal(controller.hasPendingRefresh(), false, 'o retry em voo consumiu a pendência anterior');

    // O write-settled real verifica hasPendingRefresh antes de chamar flushPending.
    // Se a escrita terminar neste ponto, nenhum callback adicional será registrado.
    releaseSecond();
    await retry;
    await settle();

    assert.equal(calls, 2);
    assert.equal(controller.hasPendingRefresh(), true, 'o segundo stale recria a necessidade de convergência');
    assert.equal(timers.length, 1, 'o retry final precisa deixar uma recuperação limitada já agendada');

    const recovery = timers.shift();
    assert.ok(recovery.delay >= 20, 'a recuperação deve respeitar a janela de cooldown, não executar imediatamente');
    await wait(30);
    recovery.callback();
    await settle();
    await settle();

    assert.equal(calls, 3, 'a recuperação ocorre sem depender de clique, foco ou novo Broadcast');
    assert.equal(controller.hasPendingRefresh(), false);
    assert.equal(timers.length, 0, 'a recuperação bem-sucedida não cria polling contínuo');
});
