'use strict';
// Teste adversarial INDEPENDENTE: executa o script real da página, sem fixtures de Auth.
// Referência: PR #438 ainda contém timeout de 10s no Task 9.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/integration/task-9-pendencias-page.js'), 'utf8'
);

function bootstrap({ initialRenderer = false } = {}) {
  const intervals = new Map();
  const timeouts = [];
  const listeners = new Map();
  let seq = 0;
  const doc = { readyState: 'complete', addEventListener() {}, removeEventListener() {} };
  const root = {
    document: doc,
    RadarPendenciasViewModel: {}, RadarPendencias: {}, RadarAccessPolicy: {},
    switchView() {}, encodePendencyIdReference: x => x, resolvePendencyIdReference: x => x,
    ...(initialRenderer ? { renderPendencias() {} } : {}),
    CustomEvent: class { constructor(type) { this.type = type; } },
    dispatchEvent(e) { for (const cb of listeners.get(e.type) || []) cb(e); },
    addEventListener(type, cb) { listeners.set(type, [...(listeners.get(type) || []), cb]); },
    setInterval(cb) { const id = ++seq; intervals.set(id, cb); return id; },
    clearInterval(id) { intervals.delete(id); },
    setTimeout(cb, ms) { timeouts.push({ cb, ms }); return ++seq; }
  };
  vm.runInNewContext(source, { window: root, document: doc, currentView: 'dashboard' }, {
    filename: 'task-9-pendencias-page.js'
  });
  return {
    root,
    tick() { for (const cb of [...intervals.values()]) cb(); },
    expire() { for (const { cb, ms } of timeouts) if (ms >= 10000) cb(); },
    remainingIntervals() { return intervals.size; }
  };
}

test('controle: Task 9 instala quando suas dependências aparecem antes do deadline', () => {
  const h = bootstrap();
  assert.equal(h.root.RadarTask9PendencyPage, undefined);
  h.root.renderPendencias = () => 'despachado';
  h.tick();
  assert.ok(h.root.RadarTask9PendencyPage);
  assert.equal(h.remainingIntervals(), 0);
});

test('contraprova: Task 9 deve recuperar-se se o renderizador aparecer DEPOIS dos 10 segundos', () => {
  const h = bootstrap();
  assert.equal(h.root.RadarTask9PendencyPage, undefined);
  h.expire(); // o deadline histórico expirou: o antigo polling acaba aqui
  assert.equal(h.remainingIntervals(), 0);
  h.root.renderPendencias = () => 'despachado';
  h.root.dispatchEvent(new h.root.CustomEvent('radar:application-services-ready'));
  h.root.dispatchEvent(new h.root.CustomEvent('radar:auth-resolved'));
  h.tick();
  assert.ok(h.root.RadarTask9PendencyPage,
    'Serviços/renderizador já prontos após autenticação tardia: Task 9 não pode continuar ausente');
});
