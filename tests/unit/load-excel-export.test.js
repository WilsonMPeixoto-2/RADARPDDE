'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const bootstrapApi = require('../../src/integration/load-excel-export.js');

function createFakeDocument(onAppend) {
    const scripts = new Map();

    function createScript() {
        const listeners = new Map();
        return {
            dataset: {},
            parentNode: null,
            addEventListener(type, handler) {
                const bucket = listeners.get(type) || new Set();
                bucket.add(handler);
                listeners.set(type, bucket);
            },
            removeEventListener(type, handler) {
                listeners.get(type)?.delete(handler);
            },
            dispatch(type) {
                [...(listeners.get(type) || [])].forEach(handler => handler());
            },
            remove() {
                if (this.dataset.radarExtension) scripts.delete(this.dataset.radarExtension);
                this.parentNode = null;
            }
        };
    }

    const head = {
        appendChild(script) {
            scripts.set(script.dataset.radarExtension, script);
            script.parentNode = head;
            onAppend(script);
            return script;
        },
        removeChild(script) {
            script.remove();
        }
    };

    return {
        readyState: 'complete',
        head,
        createElement(tagName) {
            assert.equal(tagName, 'script');
            return createScript();
        },
        querySelector(selector) {
            const match = /data-radar-extension="([^"]+)"/.exec(selector);
            return match ? scripts.get(match[1]) || null : null;
        },
        getScript(src) {
            return scripts.get(src) || null;
        }
    };
}

test('não considera a mera presença do script como carregamento concluído', async () => {
    const root = {};
    let appendCalls = 0;
    const document = createFakeDocument(script => {
        appendCalls += 1;
        queueMicrotask(() => {
            if (appendCalls === 1) {
                script.dispatch('error');
                return;
            }
            root.ModuleA = { ready: true };
            script.dispatch('load');
        });
    });
    const bootstrap = bootstrapApi.createBootstrap({
        root,
        document,
        timeoutMs: 30,
        scripts: [{
            src: '/module-a.js',
            isReady: target => target.ModuleA?.ready === true
        }]
    });

    await assert.rejects(
        bootstrap.start(),
        error => error?.code === 'EXCEL_BOOTSTRAP_SCRIPT_FAILED'
    );
    assert.equal(document.getScript('/module-a.js'), null);
    assert.equal(bootstrap.getState(), 'failed');

    await bootstrap.start();
    assert.equal(appendCalls, 2);
    assert.equal(bootstrap.getState(), 'ready');
});

test('remove script pendente após timeout e permite reinício', async () => {
    const root = {};
    let appendCalls = 0;
    const document = createFakeDocument(script => {
        appendCalls += 1;
        if (appendCalls === 2) {
            queueMicrotask(() => {
                root.ModuleA = { ready: true };
                script.dispatch('load');
            });
        }
    });
    const bootstrap = bootstrapApi.createBootstrap({
        root,
        document,
        timeoutMs: 10,
        scripts: [{
            src: '/module-a.js',
            isReady: target => target.ModuleA?.ready === true
        }]
    });

    await assert.rejects(
        bootstrap.start(),
        error => error?.code === 'EXCEL_BOOTSTRAP_SCRIPT_TIMEOUT'
    );
    assert.equal(document.getScript('/module-a.js'), null);

    await bootstrap.start();
    assert.equal(appendCalls, 2);
    assert.equal(bootstrap.getState(), 'ready');
});

test('carrega módulos em ordem e só publica ready ao concluir todos', async () => {
    const root = {};
    const order = [];
    const document = createFakeDocument(script => {
        order.push(script.dataset.radarExtension);
        queueMicrotask(() => {
            if (script.dataset.radarExtension === '/a.js') root.A = true;
            if (script.dataset.radarExtension === '/b.js') root.B = true;
            script.dispatch('load');
        });
    });
    const bootstrap = bootstrapApi.createBootstrap({
        root,
        document,
        scripts: [
            { src: '/a.js', isReady: target => target.A === true },
            { src: '/b.js', isReady: target => target.B === true }
        ]
    });

    const pending = bootstrap.start();
    assert.equal(bootstrap.getState(), 'loading');
    await pending;

    assert.deepEqual(order, ['/a.js', '/b.js']);
    assert.equal(bootstrap.getState(), 'ready');
    assert.equal(root.__RADAR_EXCEL_EXPORT_LOADER__, 'ready');
});

test('reutiliza módulo somente quando o contrato global está disponível', async () => {
    const root = { A: true };
    const document = createFakeDocument(() => {
        throw new Error('não deveria inserir script');
    });
    const bootstrap = bootstrapApi.createBootstrap({
        root,
        document,
        scripts: [{ src: '/a.js', isReady: target => target.A === true }]
    });

    await bootstrap.start();
    assert.equal(bootstrap.getState(), 'ready');
    assert.equal(document.getScript('/a.js'), null);
});
