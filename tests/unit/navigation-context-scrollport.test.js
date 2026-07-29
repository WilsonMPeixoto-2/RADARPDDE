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

test('captura e restaura o scroll de main.content-area em vez de window', async () => {
    const storage = createStorage();
    const contentArea = {
        scrollTop: 360,
        scrollHeight: 1600,
        clientHeight: 720,
        scrollTo(options) { this.scrollTop = options.top; }
    };
    const root = {
        scrollY: 0,
        sessionStorage: storage,
        RadarNavigationHistory: {
            currentRoute() { return { view: 'escolas', filters: {} }; },
            navigate(_root, route) { return route; }
        },
        document: {
            activeElement: null,
            body: {},
            querySelector(selector) {
                return selector === 'main.content-area' ? contentArea : null;
            },
            querySelectorAll() { return []; },
            getElementById() { return null; }
        },
        requestAnimationFrame(callback) { callback(); },
        scrollTo() { throw new Error('window não deve receber a restauração.'); }
    };

    const captured = navigationContext.captureContext(
        root,
        { view: 'escolas' },
        { view: 'prontuario', param: '04.31.026' }
    );
    assert.equal(captured.scrollTarget, 'content-area');
    assert.equal(captured.scrollY, 360);

    navigationContext.pushReturnContext(storage, captured);
    contentArea.scrollTop = 0;
    await navigationContext.returnToOrigin(root);
    assert.equal(contentArea.scrollTop, 360);
});

test('considera o foco restaurado somente depois de permanecer estável no alvo final', async () => {
    const storage = createStorage();
    const document = {
        activeElement: null,
        body: {},
        querySelector() { return null; },
        querySelectorAll() { return [target]; },
        getElementById() { return null; }
    };
    let focusAttempts = 0;
    const target = {
        dataset: {},
        getAttribute(name) { return name === 'href' ? '/escolas/04.31.026' : null; },
        focus() {
            focusAttempts += 1;
            document.activeElement = target;
        }
    };
    let frames = 0;
    const root = {
        sessionStorage: storage,
        location: { href: 'https://radar.invalid/carteira' },
        RadarNavigationHistory: {
            navigate(_root, route) { return route; }
        },
        document,
        requestAnimationFrame(callback) {
            frames += 1;
            if (frames === 3) document.activeElement = document.body;
            callback();
        },
        scrollTo() {}
    };

    navigationContext.pushReturnContext(storage, navigationContext.createReturnContext({
        origin: { view: 'escolas' },
        target: { view: 'prontuario', param: '04.31.026' },
        focus: { schoolId: '04.31.026' }
    }));

    await navigationContext.returnToOrigin(root);
    assert.equal(document.activeElement, target);
    assert.ok(focusAttempts >= 2);
});
