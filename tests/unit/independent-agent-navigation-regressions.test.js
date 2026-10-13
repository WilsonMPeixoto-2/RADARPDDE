'use strict';

/*
 * AUDITORIA INDEPENDENTE - OUTRO AGENTE (12/10/2026)
 * BASE: PR #438 HEAD 53f2fe991f0c4460576346cbca3a2375bf8c9890
 * Esta é uma prova adversarial, não uma alteração funcional do Codex.
 * REDs são INTENCIONAIS no candidato atual. Não apagar/afrouxar as asserções.
 * Executar: node --test tests/unit/independent-agent-navigation-regressions.test.js
 * Limite: VM com History API e DOM reduzidos; complementar com Playwright/Auth.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const CODE = Object.freeze({
  routes: fs.readFileSync(path.join(ROOT, 'src/integration/navigation-routes.js'), 'utf8'),
  policy: fs.readFileSync(path.join(ROOT, 'src/integration/navigation-policy.js'), 'utf8'),
  bootstrap: fs.readFileSync(path.join(ROOT, 'src/integration/navigation-bootstrap.js'), 'utf8'),
  history: fs.readFileSync(path.join(ROOT, 'src/integration/navigation-history.js'), 'utf8'),
  page: fs.readFileSync(path.join(ROOT, 'src/integration/task-9-pendencias-page.js'), 'utf8'),
  focus: fs.readFileSync(path.join(ROOT, 'src/integration/task-9-focus-bridge.js'), 'utf8')
});

function harness(options = {}) {
  const {
    authorized = true,
    pageBeforeNavigation = false,
    applyRouteBeforePage = false,
    focusBeforePage = false
  } = options;
  const handlers = new Map();
  const docHandlers = new Map();
  const nav = { stack: [], index: -1, view: 'dashboard' };

  const document = {
    readyState: 'interactive',
    body: {},
    scripts: [{ getAttribute: () => '/src/integration/product-extensions-bootstrap.js' }],
    head: { appendChild() {} },
    getElementById() { return null; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener(name, fn) {
      docHandlers.set(name, [...(docHandlers.get(name) || []), fn]);
    },
    removeEventListener(name, fn) {
      docHandlers.set(name, (docHandlers.get(name) || []).filter(x => x !== fn));
    },
    createElement() { return {}; }
  };
  const window = {
    document,
    location: { pathname: '/pendencias', search: '?escola=ESC-LOCAL' },
    RadarPendenciasViewModel: {},
    RadarPendencias: {},
    RadarAccessPolicy: {},
    encodePendencyIdReference: x => x,
    resolvePendencyIdReference: x => x,
    getPendencyActionFocusScope() { return null; },
    renderPendencias() { return false; },
    switchView(view) {
      nav.view = view;
      if (view === 'pendencias') window.renderPendencias();
    },
    requestAnimationFrame(callback) { callback(); },
    getRadarAccessProfile: () => 'controlador',
    addEventListener(name, fn) {
      handlers.set(name, [...(handlers.get(name) || []), fn]);
    },
    removeEventListener(name, fn) {
      handlers.set(name, (handlers.get(name) || []).filter(x => x !== fn));
    },
    dispatchEvent(event) {
      for (const fn of [...(handlers.get(event.type) || [])]) fn(event);
    },
    CustomEvent: class { constructor(type) { this.type = type; } },
    setInterval() { throw new Error('Polling de instalação não é permitido neste teste.'); },
    setTimeout() { throw new Error('Deadline de instalação não é permitido neste teste.'); },
    clearInterval() {}
  };
  function setUrl(url) {
    const [pathname, query] = url.split('?');
    window.location.pathname = pathname;
    window.location.search = query ? '?' + query : '';
  }
  window.history = {
    state: null,
    pushState(state, _title, url) {
      nav.stack.splice(nav.index + 1);
      nav.stack.push({ state, url });
      nav.index += 1;
      this.state = state;
      setUrl(url);
    },
    replaceState(state, _title, url) {
      if (nav.index < 0) {
        nav.stack.push({ state, url });
        nav.index = 0;
      } else {
        nav.stack[nav.index] = { state, url };
      }
      this.state = state;
      setUrl(url);
    }
  };

  // Scripts de produção, sem substituir seus corpos por mocks.
  // O DOM mínimo evita desenhar HTML completo, mantendo a autoridade real de filtros.
  const context = vm.createContext({
    window, document, URLSearchParams,
    currentView: 'dashboard',
    currentProfile: 'controlador',
    escolas: authorized ? [{ id: 'ESC-LOCAL' }] : [{ id: 'OUTRA-ESCOLA' }]
  });
  function load(name) {
    vm.runInContext(CODE[name], context, {
      filename: name + '.js',
      timeout: 4000
    });
  }
  function loadNavigation() {
    ['routes', 'policy', 'bootstrap', 'history'].forEach(load);
  }
  if (pageBeforeNavigation) {
    load('page');
    load('focus');
    loadNavigation();
  } else {
    loadNavigation();
    if (applyRouteBeforePage) window.RadarNavigationHistory.applyPendingRoute(window);
    if (focusBeforePage) load('focus');
    load('page');
    if (!focusBeforePage) load('focus');
  }
  if (!applyRouteBeforePage) window.RadarNavigationHistory.applyPendingRoute(window);

  function state() {
    const currentRoute = window.RadarNavigationHistory.currentRoute(window);
    return {
      url: window.location.pathname + window.location.search,
      route: currentRoute.filters?.escola || '',
      view: currentRoute.view,
      pageSchool: window.RadarTask9PendencyPage.getState().filters.schoolId || '',
      historySchool: window.history.state?.filters?.escola || ''
    };
  }
  function pop(delta) {
    nav.index += delta;
    const entry = nav.stack[nav.index];
    assert.ok(entry, 'Navegação deve manter entrada de histórico');
    window.history.state = entry.state;
    setUrl(entry.url);
    for (const fn of handlers.get('popstate') || []) fn({ state: entry.state });
  }
  return { window, document, state, pop, nav };
}

test('CONTROLE: rota escolar pré-inicializada é preservada se Task9 estiver disponível', () => {
  const h = harness({ pageBeforeNavigation: true });
  assert.equal(h.state().url, '/pendencias?escola=ESC-LOCAL');
  assert.equal(h.state().pageSchool, 'ESC-LOCAL');
});

test('CONTROLE: política impede escola não autorizada durante restauração tardia', () => {
  const h = harness({ authorized: false, applyRouteBeforePage: true });
  assert.equal(h.state().view, 'escolas');
  assert.equal(h.state().url, '/carteira');
  assert.equal(h.state().pageSchool, '');
});

test('RED independente: rota autorizada antes de Task9 precisa ser refletida na página tardia', () => {
  const h = harness({ applyRouteBeforePage: true, focusBeforePage: true });
  assert.equal(h.state().route, 'ESC-LOCAL');
  assert.equal(h.state().pageSchool, 'ESC-LOCAL',
    'O instalador tardio deve consumir a rota já autorizada, sem reabrir autorização');
});

test('RED independente: limpar rota e avançar não pode reaplicar escola anterior', () => {
  const h = harness();
  assert.equal(h.state().pageSchool, 'ESC-LOCAL');
  h.window.RadarNavigationHistory.navigate(h.window, { view: 'pendencias' });
  h.pop(-1);
  assert.equal(h.state().url, '/pendencias?escola=ESC-LOCAL');
  // No DOM reduzido, o filtro no Voltar pode não renderizar. A afirmação deste
  // teste é especificamente sobre a rota limpa depois de Avançar.
  const schoolOnBack = h.state().pageSchool;
  h.pop(1);
  assert.equal(h.state().url, '/pendencias');
  assert.equal(h.state().route, '');
  assert.equal(h.state().pageSchool, '',
    'Rota sem escola não deve recuperar ESC-LOCAL ao Avançar (filtro após Voltar: ' + schoolOnBack + ')');
});

test('RED independente: Limpar filtros não pode manter rota e history.state escolares obsoletos', () => {
  const h = harness();
  h.window.clearPendencyFilters();
  assert.equal(h.state().pageSchool, '');
  assert.equal(h.state().url, '/pendencias');
  assert.equal(h.state().route, '',
    'Rota interna deve acompanhar a limpeza, sem modificar somente a URL');
  assert.equal(h.state().historySchool, '',
    'history.state não pode continuar com escola antiga após replaceState');
  h.window.renderPendencias();
  assert.equal(h.state().pageSchool, '');
});

test('RED independente: remover chip de escola precisa remover também o contexto de rota', () => {
  const h = harness();
  h.window.removePendencyFilter('schoolId');
  assert.equal(h.state().pageSchool, '');
  h.window.renderPendencias();
  assert.equal(h.state().pageSchool, '',
    'Uma renderização posterior não pode ressuscitar o chip removido');
});

test('CONTROLE: eventos de prontidão repetidos não reinstalam wrappers Task9/Focus', () => {
  const h = harness();
  const page = h.window.RadarTask9PendencyPage;
  const focus = h.window.RadarTask9FocusBridge;
  const render = h.window.renderPendencias;
  for (let i = 0; i < 3; i++) {
    h.window.dispatchEvent(new h.window.CustomEvent('radar:application-services-ready'));
    h.window.dispatchEvent(new h.window.CustomEvent('radar:pendency-page-ready'));
  }
  assert.equal(h.window.RadarTask9PendencyPage, page);
  assert.equal(h.window.RadarTask9FocusBridge, focus);
  assert.equal(h.window.renderPendencias, render);
});

// Revisão principal: redirecionamento autorizado é navegação tratada, não fallback
// para aplicar localmente um schoolId que a política recusou.
test('seleção manual de escola fora do catálogo mantém o redirecionamento da política', () => {
  const h = harness({ pageBeforeNavigation: true });
  h.window.changePendencyFilter('schoolId', 'ESC-INEXISTENTE');
  assert.equal(h.state().view, 'escolas');
  assert.equal(h.state().url, '/carteira');
  assert.equal(h.state().pageSchool, '');
});
