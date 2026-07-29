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

test('aguarda a decoração assíncrona do link antes de restaurar o foco', async () => {
    const storage = createStorage();
    let queries = 0;
    let focused = 0;
    const candidate = {
        dataset: {},
        getAttribute(name) {
            return name === 'href' ? '/escolas/04.31.026' : null;
        },
        focus(options) {
            focused += 1;
            assert.deepEqual(options, { preventScroll: true });
        }
    };
    const root = {
        sessionStorage: storage,
        location: { href: 'https://radar.invalid/carteira' },
        RadarNavigationHistory: {
            navigate(_root, route) { return route; }
        },
        document: {
            getElementById() { return null; },
            querySelector() { return null; },
            querySelectorAll() {
                queries += 1;
                return queries >= 3 ? [candidate] : [];
            }
        },
        requestAnimationFrame(callback) { callback(); },
        scrollTo() {}
    };

    navigationContext.pushReturnContext(storage, navigationContext.createReturnContext({
        origin: { view: 'escolas' },
        target: { view: 'prontuario', param: '04.31.026' },
        competenceKey: '2026-08',
        focus: { schoolId: '04.31.026' }
    }));

    await navigationContext.returnToOrigin(root);

    assert.equal(queries, 3);
    assert.equal(focused, 1);
});
