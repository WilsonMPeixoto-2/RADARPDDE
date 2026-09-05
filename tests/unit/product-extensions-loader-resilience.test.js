'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bootstrapSource = fs.readFileSync(
    path.resolve(__dirname, '../../src/integration/product-extensions-bootstrap.js'),
    'utf8'
);

function createHarness({ failOnce = [] } = {}) {
    const requested = [];
    const failedOnce = new Set(failOnce);
    const scripts = [];
    const links = [];
    const rootListeners = new Map();

    function eventTarget(base = {}) {
        const listeners = new Map();
        return Object.assign(base, {
            addEventListener(type, callback) {
                const list = listeners.get(type) || [];
                list.push(callback);
                listeners.set(type, list);
            },
            removeEventListener(type, callback) {
                const list = listeners.get(type) || [];
                listeners.set(type, list.filter(item => item !== callback));
            },
            dispatch(type) {
                const list = [...(listeners.get(type) || [])];
                listeners.delete(type);
                list.forEach(callback => callback());
            }
        });
    }

    const document = {
        scripts,
        querySelectorAll(selector) {
            if (selector === 'link[rel="stylesheet"]') return links;
            return [];
        },
        createElement(tagName) {
            if (tagName === 'link') {
                return {
                    rel: '',
                    href: '',
                    dataset: {},
                    getAttribute(name) {
                        if (name === 'href') return this.href;
                        return null;
                    }
                };
            }
            const node = eventTarget({
                src: '',
                async: true,
                dataset: {},
                getAttribute(name) {
                    if (name === 'src') return this.src;
                    return null;
                },
                remove() {
                    const index = scripts.indexOf(this);
                    if (index >= 0) scripts.splice(index, 1);
                }
            });
            return node;
        },
        head: {
            appendChild(node) {
                if ('rel' in node && node.rel === 'stylesheet') {
                    links.push(node);
                    return node;
                }
                scripts.push(node);
                requested.push(node.src);
                queueMicrotask(() => {
                    if (failedOnce.delete(node.src)) {
                        node.dispatch('error');
                        return;
                    }
                    if (node.src.endsWith('/service-advisory-pendency.js')) {
                        root.RadarServiceAdvisoryPendency = { install: () => true };
                    }
                    if (node.src.endsWith('/service-advisory-corrective-submission.js')) {
                        root.RadarServiceAdvisoryCorrectiveSubmission = { install: () => true };
                    }
                    if (node.src.endsWith('/critical-action-guard.js')) {
                        root.RadarCriticalActionGuard = { install: () => true };
                    }
                    node.dispatch('load');
                });
                return node;
            }
        }
    };

    const root = {
        document,
        console: { error() {} },
        addEventListener(type, callback) {
            const list = rootListeners.get(type) || [];
            list.push(callback);
            rootListeners.set(type, list);
        },
        removeEventListener(type, callback) {
            const list = rootListeners.get(type) || [];
            rootListeners.set(type, list.filter(item => item !== callback));
        },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    };

    const context = vm.createContext({
        window: root,
        globalThis: root,
        console: root.console,
        Promise,
        Error,
        Object,
        Array,
        Set,
        Map,
        String,
        Boolean,
        queueMicrotask,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    });

    async function executeBootstrap() {
        vm.runInContext(bootstrapSource, context, { filename: 'product-extensions-bootstrap.js' });
        return root.RadarProductExtensionsReady;
    }

    return { root, requested, executeBootstrap };
}

test('falha em extensão opcional não impede Assessoria nem guard crítico e o mesmo loader retoma o item falho', async () => {
    const controllerGuide = '/src/integration/controller-guide.js';
    const harness = createHarness({ failOnce: [controllerGuide] });

    const firstReady = await harness.executeBootstrap();

    assert.equal(firstReady, false, 'readiness global deve refletir que uma extensão continua ausente');
    assert.ok(harness.requested.includes('/src/integration/service-advisory-pendency.js'));
    assert.ok(harness.requested.includes('/src/integration/service-advisory-corrective-submission.js'));
    assert.ok(harness.requested.includes('/src/integration/critical-action-guard.js'));
    assert.equal(harness.requested.filter(src => src === controllerGuide).length, 1);

    const secondReady = await harness.executeBootstrap();

    assert.equal(secondReady, true);
    assert.equal(
        harness.requested.filter(src => src === controllerGuide).length,
        2,
        'reexecutar o bootstrap na mesma página deve retentar a extensão que falhou'
    );
});

test('falha em extensão crítica mantém readiness falso sem bloquear tentativa das demais e pode ser recuperada', async () => {
    const advisory = '/src/integration/service-advisory-pendency.js';
    const harness = createHarness({ failOnce: [advisory] });

    const firstReady = await harness.executeBootstrap();

    assert.equal(firstReady, false, 'falha crítica não pode ser mascarada como readiness verde');
    assert.ok(harness.requested.includes('/src/integration/critical-action-guard.js'));

    const secondReady = await harness.executeBootstrap();

    assert.equal(secondReady, true);
    assert.equal(harness.requested.filter(src => src === advisory).length, 2);
});
