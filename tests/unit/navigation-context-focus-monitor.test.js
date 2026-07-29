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

test('mantém vigilância limitada e refoca quando a representação da escola é substituída', async () => {
    const storage = createStorage();
    const document = { activeElement: null, body: {} };
    let currentTarget;
    let firstFocuses = 0;
    let replacementFocuses = 0;

    const first = {
        dataset: {},
        getAttribute(name) { return name === 'href' ? '/escolas/04.31.026' : null; },
        getClientRects() { return [{ width: 120, height: 32 }]; },
        focus() { firstFocuses += 1; document.activeElement = first; }
    };
    const replacement = {
        dataset: {},
        getAttribute(name) { return name === 'href' ? '/escolas/04.31.026' : null; },
        getClientRects() { return [{ width: 120, height: 32 }]; },
        focus() { replacementFocuses += 1; document.activeElement = replacement; }
    };
    currentTarget = first;

    Object.assign(document, {
        querySelector() { return null; },
        querySelectorAll() { return [currentTarget]; },
        getElementById() { return null; }
    });

    let frames = 0;
    const root = {
        sessionStorage: storage,
        location: { href: 'https://radar.invalid/carteira' },
        RadarNavigationHistory: { navigate(_root, route) { return route; } },
        document,
        requestAnimationFrame(callback) {
            frames += 1;
            if (frames === 8) {
                currentTarget = replacement;
                document.activeElement = document.body;
            }
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

    assert.ok(frames >= navigationContext.MAX_FOCUS_RESTORE_FRAMES);
    assert.ok(firstFocuses >= 1);
    assert.ok(replacementFocuses >= 1);
    assert.equal(document.activeElement, replacement);
});
