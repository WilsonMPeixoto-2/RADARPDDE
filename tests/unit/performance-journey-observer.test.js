'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const observer = require('../support/performance-journey-observer.js');

function harness(window) {
  let now = 0;
  const context = vm.createContext({ window, performance: { now: () => now }, URL });
  const evaluate = fn => vm.runInContext(`(${fn.toString()})()`, context);
  return { page: { evaluate, addInitScript: evaluate }, tick: value => { now = value; } };
}

test('resumo distingue ausência de medição de zero observado', () => {
  const summary = observer.summarizeSamples([
    { totalMs: 10, contextLoadMs: null },
    { totalMs: 20, contextLoadMs: 0 },
    { totalMs: 30, contextLoadMs: 5 }
  ]);
  assert.deepEqual(summary.contextLoadMs, { observedSampleCount: 2, p50: 0, p95: 5 });
  assert.deepEqual(summary.writeRpcClientMs, { observedSampleCount: 0, p50: null, p95: null });
  assert.equal(observer.percentile([null, undefined, NaN]), null);
});

test('RPC assíncrona é medida depois da fila sem depender do trace síncrono da UI', async () => {
  let release;
  const result = { committed: true };
  const repository = {
    saveVerificationWithLog() {
      assert.equal(this, repository);
      return new Promise(resolve => { release = () => resolve(result); });
    }
  };
  const window = { RadarApplicationServices: { data: { repository } } };
  const { page, tick } = harness(window);
  await observer.installRuntimeHooks(page);
  tick(5);
  const queued = Promise.resolve().then(() => repository.saveVerificationWithLog());
  await Promise.resolve();
  tick(17);
  release();
  assert.equal(await queued, result);
  const sample = await observer.readObservation(page);
  assert.equal(sample.writeRpcClientMs, 12);
  assert.equal(sample.contextLoadMs, null);
  assert.equal(sample.renderProntuarioMs, null);
});

test('operação iniciada antes do reset não contamina a jornada seguinte', async () => {
  let release;
  const data = { loadOperationalContext: () => new Promise(resolve => { release = resolve; }) };
  const window = { RadarApplicationServices: { data } };
  const { page, tick } = harness(window);
  await observer.installRuntimeHooks(page);
  const stale = data.loadOperationalContext();
  await observer.resetObservers(page);
  tick(100);
  release({ stale: true });
  await stale;
  const sample = await observer.readObservation(page);
  assert.equal(sample.contextLoadMs, 0);
  assert.equal(sample.writeRpcClientMs, null);
});

test('observação preserva rejeição original da RPC', async () => {
  const error = new Error('fixture failure');
  const repository = { saveVerificationWithLog: async () => { throw error; } };
  const { page } = harness({ RadarApplicationServices: { data: { repository } } });
  await observer.installRuntimeHooks(page);
  await assert.rejects(repository.saveVerificationWithLog(), value => value === error);
});

test('fetch mede cabeçalhos, preserva resposta e não lê o corpo ou guarda query string', async () => {
  let release;
  let bodyReads = 0;
  const response = { status: 200, json() { bodyReads += 1; } };
  const window = {
    location: { origin: 'http://localhost' },
    fetch: () => new Promise(resolve => { release = resolve; })
  };
  const { page, tick } = harness(window);
  await observer.installNetworkObserver(page);
  tick(2);
  const fetch = window.fetch('http://localhost/rest/v1/verifications?school_id=private#fragment');
  assert.equal((await observer.readObservation(page)).pendingFetchCount, 1);
  tick(12);
  release(response);
  assert.equal(await fetch, response);
  const sample = await observer.readObservation(page);
  assert.equal(sample.fetchHeadersWallMs, 10);
  assert.equal(sample.pendingFetchCount, 0);
  assert.equal(sample.longTaskCount, null);
  assert.equal(sample.requests[0].path, '/rest/v1/verifications');
  assert.equal(bodyReads, 0);
  assert.doesNotMatch(JSON.stringify(sample), /private|fragment/);
});
