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

test('ignora representação responsiva oculta e restaura foco no link visível', async () => {
    const storage = createStorage();
    const document = { activeElement: null, body: {} };
    const hidden = {
        dataset: {},
        hidden: false,
        getAttribute(name) { return name === 'href' ? '/escolas/04.31.026' : null; },
        getClientRects() { return []; },
        focus() { document.activeElement = hidden; }
    };
    const visible = {
        dataset: {},
        hidden: false,
        getAttribute(name) { return name === 'href' ? '/escolas/04.31.026' : null; },
        getClientRects() { return [{ width: 120, height: 32 }]; },
        focus() { document.activeElement = visible; }
    };
    Object.assign(document, {
        querySelector() { return null; },
        querySelectorAll() { return [hidden, visible]; },
        getElementById() { return null; }
    });
    const root = {
        sessionStorage: storage,
        location: { href: 'https://radar.invalid/carteira' },
        RadarNavigationHistory: { navigate(_root, route) { return route; } },
        document,
        requestAnimationFrame(callback) { callback(); },
        scrollTo() {}
    };

    navigationContext.pushReturnContext(storage, navigationContext.createReturnContext({
        origin: { view: 'escolas' },
        target: { view: 'prontuario', param: '04.31.026' },
        focus: { schoolId: '04.31.026' }
    }));

    await navigationContext.returnToOrigin(root);
    assert.equal(document.activeElement, visible);
});
