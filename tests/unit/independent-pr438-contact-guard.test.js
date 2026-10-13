'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const guard = require('../../src/integration/critical-action-guard.js');
function form() {
  const attrs = new Map();
  const button = { disabled: false, textContent: 'Salvar contato' };
  return {
    button,
    getAttribute: key => attrs.get(key) ?? null,
    setAttribute: (key, value) => attrs.set(key, value),
    removeAttribute: key => attrs.delete(key),
    querySelector: selector => selector === 'button[type="submit"]' ? button : null
  };
}
test('contraprova independente: dois submits simultâneos gravam uma vez, nova intenção não é bloqueada', async () => {
  const f = form();
  let resolveWrite;
  let calls = 0;
  let inFlight = new Promise(resolve => { resolveWrite = resolve; });
  const root = {
    document: { getElementById: id => id === 'form-pendency-contact' ? f : null },
    savePendencyContact: async () => { calls++; await inFlight; return calls; }
  };
  assert.equal(guard.wrapAction(root, 'savePendencyContact', {
    key: () => 'pendency:contact',
    form: () => f,
    busyLabel: 'Registrando…'
  }), true);
  const first = root.savePendencyContact();
  const second = root.savePendencyContact();
  assert.equal(calls, 1);
  assert.equal(await second, false);
  assert.equal(f.button.disabled, true);
  resolveWrite();
  assert.equal(await first, 1);
  assert.equal(f.button.disabled, false);
  inFlight = Promise.resolve();
  assert.equal(await root.savePendencyContact(), 2);
  assert.equal(calls, 2);
});
test('contraprova independente: API ausente bloqueia instalação, sem lançar operação', () => {
  assert.equal(guard.wrapAction({document:{}}, 'savePendencyContact', {}), false);
});
