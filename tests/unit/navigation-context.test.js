'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const navigationContext = require('../../src/integration/navigation-context.js');

function createStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

test('normaliza e persiste uma pilha de origens contextuais sem dados excessivos', () => {
    const storage = createStorage();
    const first = navigationContext.createReturnContext({
        origin: { view: 'escolas', filters: { escola: '04.31.026' } },
        target: { view: 'prontuario', param: '04.31.026' },
        competenceKey: '2026-08',
        scrollY: 420,
        focus: { id: 'school-link-1', schoolId: '04.31.026' },
        capturedAt: '2026-07-29T03:00:00.000Z'
    });

    assert.deepEqual(first, {
        version: 1,
        capturedAt: '2026-07-29T03:00:00.000Z',
        origin: {
            view: 'escolas',
            param: null,
            section: null,
            filters: { escola: '04.31.026' }
        },
        target: {
            view: 'prontuario',
            param: '04.31.026',
            section: null,
            filters: {}
        },
        competenceKey: '2026-08',
        scrollY: 420,
        focus: { id: 'school-link-1', schoolId: '04.31.026', pendencyRef: '', action: '' }
    });

    navigationContext.pushReturnContext(storage, first);
    navigationContext.pushReturnContext(storage, navigationContext.createReturnContext({
        origin: { view: 'pendencias', filters: { escola: '04.31.026' } },
        target: { view: 'prontuario', param: '04.31.026', section: 'pendencias' },
        competenceKey: '2026-08',
        scrollY: 80,
        capturedAt: '2026-07-29T03:01:00.000Z'
    }));

    assert.equal(navigationContext.peekReturnContext(storage).origin.view, 'pendencias');
    assert.equal(navigationContext.popReturnContext(storage).origin.view, 'pendencias');
    assert.equal(navigationContext.popReturnContext(storage).origin.view, 'escolas');
    assert.equal(navigationContext.popReturnContext(storage), null);
});

test('captura apenas transições que entram em superfícies contextuais', () => {
    assert.equal(navigationContext.shouldCaptureTransition(
        { view: 'escolas' },
        { view: 'prontuario', param: '04.31.026' }
    ), true);
    assert.equal(navigationContext.shouldCaptureTransition(
        { view: 'pendencias' },
        { view: 'prontuario', param: '04.31.026', section: 'pendencias' }
    ), true);
    assert.equal(navigationContext.shouldCaptureTransition(
        { view: 'dashboard' },
        { view: 'pendencias' }
    ), true);
    assert.equal(navigationContext.shouldCaptureTransition(
        { view: 'prontuario', param: '04.31.026' },
        { view: 'prontuario', param: '04.31.026', section: 'pendencias' }
    ), false);
    assert.equal(navigationContext.shouldCaptureTransition(
        { view: 'dashboard' },
        { view: 'escolas' }
    ), false);
});

test('restaura competência, rota, rolagem e foco; sem contexto usa Carteira', async () => {
    const calls = [];
    const focusTarget = { focus(options) { calls.push({ type: 'focus', options }); } };
    const root = {
        sessionStorage: createStorage(),
        RadarCompetenceContext: {
            isInitialized: () => true,
            getState: () => ({ exercise: '2026', activeKey: '2026-07' }),
            select(key, meta) { calls.push({ type: 'competence', key, meta }); }
        },
        RadarNavigationHistory: {
            navigate(_root, route) { calls.push({ type: 'navigate', route }); return route; }
        },
        document: {
            getElementById(id) { return id === 'school-link-1' ? focusTarget : null; },
            querySelectorAll() { return []; }
        },
        scrollTo(options) { calls.push({ type: 'scroll', options }); },
        requestAnimationFrame(callback) { callback(); }
    };

    navigationContext.pushReturnContext(root.sessionStorage, navigationContext.createReturnContext({
        origin: { view: 'escolas' },
        target: { view: 'prontuario', param: '04.31.026' },
        competenceKey: '2026-08',
        scrollY: 420,
        focus: { id: 'school-link-1' }
    }));

    const restored = await navigationContext.returnToOrigin(root);
    assert.equal(restored.origin.view, 'escolas');
    assert.deepEqual(calls, [
        { type: 'competence', key: '2026-08', meta: { source: 'contextual-return' } },
        { type: 'navigate', route: { view: 'escolas', param: null, section: null, filters: {} } },
        { type: 'scroll', options: { top: 420, left: 0, behavior: 'auto' } },
        { type: 'focus', options: { preventScroll: true } }
    ]);

    calls.length = 0;
    const fallback = await navigationContext.returnToOrigin(root);
    assert.equal(fallback.fallback, true);
    assert.deepEqual(calls, [
        { type: 'navigate', route: { view: 'escolas', param: null, section: null, filters: {} } },
        { type: 'scroll', options: { top: 0, left: 0, behavior: 'auto' } }
    ]);
});
