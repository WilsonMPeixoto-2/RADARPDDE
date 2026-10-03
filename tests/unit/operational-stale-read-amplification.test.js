'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createController } = require('../../src/integration/operational-context-refresh.js');

function root() {
  return { RadarAuthContext: { user: { id: 'local-controller' } },
    RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
    RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
    document: { querySelectorAll: () => [], activeElement: null, getElementById: () => null },
    console: { warn() {} } };
}

test('leitura abortada por escrita não transforma gestos posteriores em novos retries', async () => {
  let calls = 0;
  let obsolete = true;
  const controller = createController(root(), { async loadOperationalContext() {
    calls += 1;
    return { stale: obsolete, aborted: obsolete };
  } }, { minIntervalMs: 30000 });
  await controller.refresh('realtime', { force: true });
  for (let n = 0; n < 30; n += 1) {
    await controller.flushPending(['click', 'focusout', 'write-settled'][n % 3]);
  }
  assert.equal(calls, 1, 'um evento conhecido não pode produzir uma leitura por gesto humano');
  assert.equal(controller.hasPendingRefresh(), true, 'não perder a reconciliação necessária');
  obsolete = false;
  const recovered = await controller.refresh('realtime-retry', { force: true });
  assert.equal(recovered.stale, false);
  assert.equal(calls, 2, 'o retry controlado continua podendo recuperar o contexto');
  assert.equal(controller.hasPendingRefresh(), false);
});

test('invalidação realmente nova continua podendo recuperar uma leitura anterior abortada', async () => {
  let calls = 0;
  const controller = createController(root(), { async loadOperationalContext() {
    calls += 1;
    return { stale: calls === 1, aborted: calls === 1 };
  } }, { minIntervalMs: 30000 });
  await controller.refresh('realtime', { force: true });
  const result = await controller.refresh('realtime', { force: true });
  assert.equal(result.stale, false);
  assert.equal(calls, 2);
  assert.equal(controller.hasPendingRefresh(), false);
});

test('interações durante leitura não multiplicam a invalidação remota recebida em voo', async () => {
  let calls = 0;
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const controller = createController(root(), { async loadOperationalContext() {
    calls += 1;
    if (calls === 1) await barrier;
    return { stale: false };
  } }, { minIntervalMs: 30000 });
  const first = controller.refresh('realtime', { force: true });
  await Promise.resolve();
  const remote = controller.refresh('realtime', { force: true });
  const joins = Array.from({ length: 30 }, (_, n) =>
    controller.flushPending(['click', 'focusout', 'write-settled'][n % 3]));
  release();
  await Promise.all([first, remote, ...joins]);
  assert.equal(calls, 2, 'uma leitura e uma reconciliação da invalidação nova');
  assert.equal(controller.hasPendingRefresh(), false);
});
