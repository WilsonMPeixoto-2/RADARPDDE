'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createOperationalReadTracker } = require('../support/operational-read-tracker.js');

test('leitura conta desde a entrada, inclusive durante latência induzida', () => {
  const tracker = createOperationalReadTracker();
  tracker.start('slow');
  assert.equal(tracker.unheldCount, 1);
  tracker.finish('slow');
  assert.equal(tracker.size, 0);
});
test('drenagem ignora somente resposta explicitamente retida, não leitura nova', () => {
  const tracker = createOperationalReadTracker();
  tracker.start('old'); tracker.hold('old'); tracker.start('new');
  assert.equal(tracker.heldCount, 1);
  assert.equal(tracker.unheldCount, 1);
  tracker.finish('new');
  assert.equal(tracker.unheldCount, 0);
  assert.equal(tracker.size, 1);
});
test('abort de resposta retida limpa ambos conjuntos sem contagem negativa', () => {
  const tracker = createOperationalReadTracker();
  tracker.start('old'); tracker.hold('old'); tracker.finish('old');
  tracker.release('old'); tracker.finish('old');
  assert.equal(tracker.size, 0);
  assert.equal(tracker.heldCount, 0);
  assert.equal(tracker.unheldCount, 0);
});
test('handler tardio não ressuscita request abortada durante latência', () => {
  const tracker = createOperationalReadTracker();
  tracker.start('old'); tracker.finish('old'); tracker.hold('old');
  assert.equal(tracker.heldCount, 0);
  assert.equal(tracker.size, 0);
});
test('liberar barreira não significa que HTTP já terminou', () => {
  const tracker = createOperationalReadTracker();
  tracker.start('old'); tracker.hold('old'); tracker.release('old');
  assert.equal(tracker.unheldCount, 1);
  tracker.finish('old');
  assert.equal(tracker.unheldCount, 0);
});
