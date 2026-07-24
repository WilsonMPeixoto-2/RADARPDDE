'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createNavigationState,
    sameNavigationState,
    install,
    applyPendingRoute,
    navigate
} = require('../../src/integration/navigation-history.js');

function createFakeRoot({ pathname = '/', search = '' } = {}) {
    const listeners = new Map();
    const calls = [];
    const historyCalls = [];
    const root = {
        location: {
            href: `https://radarpdde-fix.vercel.app${pathname}${search}`,
            pathname,
            search
        },
        history: {
            state: null,
            replaceState(state, _title, url) {
                this.state = structuredClone(state);
                historyCalls.push({ type: 'replace', state: structuredClone(state), url });
            },
            pushState(state, _title, url) {
                this.state = structuredClone(state);
                historyCalls.push({ type: 'push', state: structuredClone(state), url });
            }
        },
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        switchView(view, param = null) {
            calls.push({ view, param });
            return `${view}:${param || ''}`;
        }
    };
    return { root, listeners, calls, historyCalls };
}

function routeApplier(calls) {
    return route => {
        calls.push({
            view: route.view,
            param: route.param,
            section: route.section,
            filters: route.filters
        });
        return route;
    };
}

test('normaliza o estado navegável completo do RADAR', () => {
    assert.deepEqual(createNavigationState('prontuario', '04.11.001', 'pendencias'), {
        radarNavigation: true,
        view: 'prontuario',
        param: '04.11.001',
        section: 'pendencias',
        filters: {}
    });
    assert.equal(sameNavigationState(
        createNavigationState('pendencias', null, null, { escola: '04.11.001' }),
        createNavigationState('pendencias', null, null, { escola: '04.11.001' })
    ), true);
});

test('preserva a rota profunda até o bootstrap autorizado', () => {
    const { root, calls, historyCalls } = createFakeRoot({
        pathname: '/escolas/04.31.026',
        search: ''
    });
    install(root, { applyRoute: routeApplier(calls) });

    root.switchView('dashboard');

    assert.equal(calls.length, 1);
    assert.equal(historyCalls.length, 1);
    assert.equal(historyCalls[0].url, '/escolas/04.31.026');

    applyPendingRoute(root);

    assert.deepEqual(calls.at(-1), {
        view: 'prontuario',
        param: '04.31.026',
        section: null,
        filters: {}
    });
});

test('registra navegações internas com URLs canônicas sem duplicar a rota atual', () => {
    const { root, historyCalls } = createFakeRoot();
    install(root);
    applyPendingRoute(root);

    root.switchView('dashboard');
    root.switchView('escolas');
    root.switchView('escolas');
    root.switchView('prontuario', '04.11.001');

    assert.deepEqual(historyCalls.map(item => item.type), ['replace', 'push', 'push']);
    assert.deepEqual(historyCalls.map(item => item.url), [
        '/dashboard',
        '/carteira',
        '/escolas/04.11.001'
    ]);
    assert.deepEqual(historyCalls.at(-1).state, createNavigationState('prontuario', '04.11.001'));
});

test('o evento popstate restaura a tela anterior sem criar nova entrada', () => {
    const { root, listeners, calls, historyCalls } = createFakeRoot();
    install(root, { applyRoute: routeApplier(calls) });
    applyPendingRoute(root);
    navigate(root, { view: 'escolas' });
    const before = historyCalls.length;

    listeners.get('popstate')({ state: createNavigationState('dashboard') });

    assert.deepEqual(calls.at(-1), {
        view: 'dashboard',
        param: null,
        section: null,
        filters: {}
    });
    assert.equal(historyCalls.length, before);
});

test('preserva o identificador do prontuário quando a chamada usa o estado ativo', () => {
    const { root, historyCalls } = createFakeRoot();
    install(root, { getActiveSchoolId: () => '04.11.777' });
    applyPendingRoute(root);

    root.switchView('prontuario');

    assert.deepEqual(historyCalls.at(-1).state, createNavigationState('prontuario', '04.11.777'));
    assert.equal(historyCalls.at(-1).url, '/escolas/04.11.777');
});

test('navega para seção de pendências e filtro de escola', () => {
    const { root, calls, historyCalls } = createFakeRoot();
    install(root, { applyRoute: routeApplier(calls) });
    applyPendingRoute(root);

    navigate(root, {
        view: 'prontuario',
        param: '04.31.026',
        section: 'pendencias'
    });
    navigate(root, {
        view: 'pendencias',
        filters: { escola: '04.31.026' }
    });

    assert.equal(historyCalls.at(-2).url, '/escolas/04.31.026/pendencias');
    assert.equal(historyCalls.at(-1).url, '/pendencias?escola=04.31.026');
    assert.deepEqual(calls.at(-1), {
        view: 'pendencias',
        param: null,
        section: null,
        filters: { escola: '04.31.026' }
    });
});
