'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createNavigationContext,
  normalizeContextEntry
} = require('../../src/domain/navigation-context.js');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function carteiraEntry(overrides = {}) {
  return {
    route: {
      view: 'escolas',
      param: null,
      section: null,
      filters: {}
    },
    competenceKey: '2026-08',
    profile: 'controlador',
    ui: {
      searchQuery: '04.10.001',
      controls: {
        'filter-escola-programa': 'BASIC',
        'filter-escola-pendencias': 'com'
      },
      activeTab: '',
      scrollY: 640,
      scrollAnchor: 'school-card-04.10.001',
      focusSelector: 'a[data-radar-route="true"][href="/escolas/04.10.001"]'
    },
    reason: 'school-drill-down',
    ...overrides
  };
}

test('volta à Carteira filtrada preservando competência, consulta, rolagem e foco', () => {
  assert.equal(typeof createNavigationContext, 'function');
  const context = createNavigationContext({ storage: memoryStorage(), maxDepth: 10 });

  assert.equal(context.push(carteiraEntry()), true);
  assert.equal(context.size(), 1);

  const result = context.back({
    canAccess: route => route.view === 'escolas',
    fallbackRoute: { view: 'dashboard' }
  });

  assert.equal(result.source, 'context');
  assert.deepEqual(result.entry, normalizeContextEntry(carteiraEntry()));
  assert.equal(result.entry.competenceKey, '2026-08');
  assert.equal(result.entry.ui.searchQuery, '04.10.001');
  assert.equal(result.entry.ui.controls['filter-escola-programa'], 'BASIC');
  assert.equal(result.entry.ui.scrollY, 640);
  assert.match(result.entry.ui.focusSelector, /04\.10\.001/);
  assert.equal(context.size(), 0);
});

test('não registra modal, estado sem rota nem conteúdo não serializável', () => {
  const context = createNavigationContext({ storage: memoryStorage() });

  assert.equal(context.push({ route: { view: 'modal-contato' } }), false);
  assert.equal(context.push({ competenceKey: '2026-08' }), false);
  assert.equal(context.push({
    ...carteiraEntry(),
    ui: {
      ...carteiraEntry().ui,
      handler: () => {},
      node: { nodeType: 1, ownerDocument: {} }
    }
  }), true);

  const stored = context.peek();
  assert.equal(Object.hasOwn(stored.ui, 'handler'), false);
  assert.equal(Object.hasOwn(stored.ui, 'node'), false);
  assert.doesNotThrow(() => JSON.stringify(stored));
});

test('ignora origem cujo acesso foi revogado e usa fallback seguro', () => {
  const context = createNavigationContext({ storage: memoryStorage() });
  context.push(carteiraEntry({
    route: { view: 'sme-config', param: null, section: null, filters: {} },
    profile: 'sme'
  }));

  const result = context.back({
    canAccess: route => route.view !== 'sme-config',
    fallbackRoute: { view: 'dashboard', filters: {} }
  });

  assert.equal(result.source, 'fallback');
  assert.deepEqual(result.entry.route, {
    view: 'dashboard',
    param: null,
    section: null,
    filters: {}
  });
  assert.equal(context.size(), 0);
});

test('hidrata a pilha da sessão, limita profundidade e não duplica a mesma origem', () => {
  const storage = memoryStorage();
  const first = createNavigationContext({ storage, maxDepth: 2 });

  assert.equal(first.push(carteiraEntry()), true);
  assert.equal(first.push(carteiraEntry()), false);
  assert.equal(first.push(carteiraEntry({ route: { view: 'competencias', filters: {} } })), true);
  assert.equal(first.push(carteiraEntry({ route: { view: 'pendencias', filters: { escola: '04.10.001' } } })), true);
  assert.equal(first.size(), 2);

  const restored = createNavigationContext({ storage, maxDepth: 2 });
  assert.equal(restored.size(), 2);
  assert.equal(restored.peek().route.view, 'pendencias');
});

test('limpa armazenamento corrompido sem impedir fallback', () => {
  const storage = memoryStorage({
    radar_pdde_navigation_context_v1: '{not-json'
  });
  const context = createNavigationContext({ storage });

  assert.equal(context.size(), 0);
  const result = context.back({ fallbackRoute: { view: 'escolas' } });
  assert.equal(result.source, 'fallback');
  assert.equal(result.entry.route.view, 'escolas');
});
