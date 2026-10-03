'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createController: createRefresh } = require('../../src/integration/operational-context-refresh.js');
const { createController: createRealtime } = require('../../src/integration/operational-realtime-invalidation.js');

test('Broadcast durante RPC lenta não abre outra leitura antes da janela operacional', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1800000000000 });
  const timers = new Map();
  let sequence = 0;
  let broadcast;
  let release;
  let calls = 0;
  const slowRead = new Promise(resolve => { release = resolve; });
  const root = {
    RadarAuthContext: { user: { id: 'observer' } },
    RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
    RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
    document: { querySelectorAll: () => [], activeElement: null, getElementById: () => null },
    setTimeout(callback, delay) {
      const id = ++sequence;
      timers.set(id, { callback, at: Date.now() + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    console: { warn() {} }
  };
  const channel = { on(_type, _filter, handler) { broadcast = handler; return this; },
    subscribe(handler) { handler('SUBSCRIBED'); return this; } };
  const refresh = createRefresh(root, { async loadOperationalContext() {
    calls += 1;
    if (calls === 2) await slowRead;
    return { stale: false };
  } });
  const realtime = createRealtime(root, {
    client: { channel: () => channel, async removeChannel() {} },
    refreshController: refresh, debounceMs: 2000, remoteMinIntervalMs: 5000
  });
  t.after(() => realtime.stop());
  const microtasks = async () => { for (let n = 0; n < 30; n += 1) await Promise.resolve(); };
  const advance = async ms => {
    const end = Date.now() + ms;
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      timers.delete(next[0]);
      t.mock.timers.setTime(next[1].at);
      next[1].callback();
      await microtasks();
    }
    t.mock.timers.setTime(end);
    await microtasks();
  };
  const event = () => broadcast({ payload: { entity: 'verifications', operation: 'update' } });
  await realtime.start();
  event();
  await advance(2000);
  assert.equal(calls, 1, 'a primeira alteração continua rápida');
  await advance(5000);
  event();
  await advance(2000);
  assert.equal(calls, 2);
  event();
  await advance(2000);
  release();
  await microtasks();
  assert.equal(calls, 2, 'o timer criado durante a RPC não pode provocar uma reconstrução imediatamente depois dela');
  await advance(5000);
  assert.equal(calls, 3, 'a invalidação recebida durante a leitura continua exigindo reconciliação final');
  assert.equal(refresh.hasPendingRefresh(), false);
});
