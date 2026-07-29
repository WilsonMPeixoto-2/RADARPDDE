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

test('ignora o contêiner da escola e restaura foco no controle acionável', async () => {
    const storage = createStorage();
    const document = { activeElement: null, body: {} };
    let containerFocuses = 0;
    let linkFocuses = 0;

    const schoolContainer = {
        dataset: { schoolId: '04.31.026' },
        getAttribute() { return null; },
        getClientRects() { return [{ width: 600, height: 80 }]; },
        focus() { containerFocuses += 1; }
    };
    const schoolLink = {
        dataset: { radarRoute: 'true' },
        getAttribute(name) { return name === 'href' ? '/escolas/04.31.026' : null; },
        getClientRects() { return [{ width: 120, height: 32 }]; },
        focus() { linkFocuses += 1; document.activeElement = schoolLink; }
    };

    Object.assign(document, {
        querySelector() { return null; },
        querySelectorAll() { return [schoolContainer, schoolLink]; },
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

    assert.equal(containerFocuses, 0);
    assert.ok(linkFocuses >= 1);
    assert.equal(document.activeElement, schoolLink);
});
