'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    install,
    applyPendingRoute,
    createNavigationState
} = require('../../src/integration/navigation-history.js');

function createRoot() {
    const listeners = new Map();
    const emitted = [];
    const root = {
        location: { pathname: '/', search: '' },
        history: {
            state: null,
            replaceState(state) { this.state = structuredClone(state); },
            pushState(state) { this.state = structuredClone(state); }
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) {
            emitted.push(event);
            for (const listener of listeners.get(event.type) || []) listener(event);
        },
        addEventListener(type, listener) {
            const current = listeners.get(type) || [];
            current.push(listener);
            listeners.set(type, current);
        },
        switchView() {}
    };
    return { root, listeners, emitted };
}

test('rota interna confirmada publica radar:navigation-committed com a rota canônica', () => {
    const { root, emitted } = createRoot();
    install(root);
    applyPendingRoute(root);
    emitted.length = 0;

    root.switchView('prontuario', 'school-b');

    const event = emitted.find(item => item.type === 'radar:navigation-committed');
    assert.ok(event);
    assert.deepEqual(event.detail.route, {
        valid: true,
        view: 'prontuario',
        param: 'school-b',
        section: null,
        filters: {},
        canonicalPath: '/escolas/school-b'
    });
});

test('popstate também publica a rota efetivamente restaurada', () => {
    const { root, listeners, emitted } = createRoot();
    install(root, { applyRoute: route => route });
    applyPendingRoute(root);
    emitted.length = 0;

    listeners.get('popstate')[0]({ state: createNavigationState('prontuario', 'school-c') });

    const event = emitted.find(item => item.type === 'radar:navigation-committed');
    assert.ok(event);
    assert.equal(event.detail.route.view, 'prontuario');
    assert.equal(event.detail.route.param, 'school-c');
    assert.equal(event.detail.route.canonicalPath, '/escolas/school-c');
});
