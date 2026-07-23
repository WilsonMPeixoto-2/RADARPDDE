'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createNavigationState,
    sameNavigationState,
    install
} = require('../../src/integration/navigation-history.js');

function createFakeRoot() {
    const listeners = new Map();
    const calls = [];
    const historyCalls = [];
    const root = {
        location: { href: 'https://radarpdde-fix.vercel.app/' },
        history: {
            state: null,
            replaceState(state) {
                this.state = structuredClone(state);
                historyCalls.push({ type: 'replace', state: structuredClone(state) });
            },
            pushState(state) {
                this.state = structuredClone(state);
                historyCalls.push({ type: 'push', state: structuredClone(state) });
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

test('normaliza o estado mínimo de navegação do RADAR', () => {
    assert.deepEqual(createNavigationState('prontuario', '04.11.001'), {
        radarNavigation: true,
        view: 'prontuario',
        param: '04.11.001'
    });
    assert.equal(sameNavigationState(
        createNavigationState('escolas'),
        createNavigationState('escolas')
    ), true);
});

test('registra navegações internas no histórico sem duplicar a rota atual', () => {
    const { root, historyCalls } = createFakeRoot();
    install(root);

    root.switchView('dashboard');
    root.switchView('escolas');
    root.switchView('escolas');
    root.switchView('prontuario', '04.11.001');

    assert.deepEqual(historyCalls.map(item => item.type), ['replace', 'push', 'push']);
    assert.deepEqual(historyCalls.at(-1).state, createNavigationState('prontuario', '04.11.001'));
});

test('o evento popstate restaura a tela anterior sem criar nova entrada', () => {
    const { root, listeners, calls, historyCalls } = createFakeRoot();
    install(root);
    root.switchView('escolas');
    const before = historyCalls.length;

    listeners.get('popstate')({ state: createNavigationState('dashboard') });

    assert.deepEqual(calls.at(-1), { view: 'dashboard', param: null });
    assert.equal(historyCalls.length, before);
});

test('preserva o identificador do prontuário quando a chamada usa o estado ativo', () => {
    const { root, historyCalls } = createFakeRoot();
    install(root, { getActiveSchoolId: () => '04.11.777' });

    root.switchView('prontuario');

    assert.deepEqual(historyCalls.at(-1).state, createNavigationState('prontuario', '04.11.777'));
});