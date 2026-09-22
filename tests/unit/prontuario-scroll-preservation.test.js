'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../../src/integration/prontuario-scroll-preservation.js');

function createRoot(handler) {
    const area = {
        scrollTop: 780,
        scrollLeft: 12,
        scrollTo({ top, left }) {
            this.scrollTop = top;
            this.scrollLeft = left;
        }
    };
    const calls = [];
    const root = {
        document: {
            querySelector(selector) {
                return selector === 'main.content-area' ? area : null;
            }
        },
        requestAnimationFrame(callback) {
            callback();
            return 1;
        },
        async toggleBonif(...args) {
            calls.push(args);
            area.scrollTop = 0;
            area.scrollLeft = 0;
            return handler ? handler(...args) : true;
        },
        async changeAnaliseTecnica() { return true; },
        async toggleInvoiceAdvisorySent() { return true; },
        async changeInvoiceAdvisoryAnalysis() { return true; },
        async changeInvoiceDocumentAnalysis() { return true; },
        async toggleConsEnviada() { return true; }
    };
    return { root, area, calls };
}

test('preserva a posição da área de conteúdo após alterar a bonificação', async () => {
    const { root, area, calls } = createRoot();

    assert.equal(api.install(root), true);
    const result = await root.toggleBonif('04.10.001', '2026-08_BASIC', 'extCC', 'Sim');

    assert.equal(result, true);
    assert.equal(area.scrollTop, 780);
    assert.equal(area.scrollLeft, 12);
    assert.deepEqual(calls, [[
        '04.10.001',
        '2026-08_BASIC',
        'extCC',
        'Sim'
    ]]);
    const wrapped = root.toggleBonif;
    assert.equal(api.install(root), true);
    assert.equal(root.toggleBonif, wrapped, 'reinstalação não pode empilhar wrappers');
});

test('restaura a rolagem mesmo quando o salvamento falha e preserva o erro original', async () => {
    const expected = new Error('falha simulada');
    const { root, area } = createRoot(() => {
        throw expected;
    });

    api.install(root);
    await assert.rejects(
        root.toggleBonif('04.10.001', '2026-08_BASIC', 'declBBAgil', 'Não se aplica'),
        error => error === expected
    );

    assert.equal(area.scrollTop, 780);
    assert.equal(area.scrollLeft, 12);
});

test('não instala sem DOM ou sem o handler de bonificação', () => {
    assert.equal(api.install({}), false);
    assert.equal(api.install({ document: {} }), false);
});


test('todos os handlers de avaliação preservam a posição mesmo se o handler reposicionar o conteúdo', async () => {
    const handlerNames = [
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'changeInvoiceDocumentAnalysis',
        'toggleConsEnviada',
        'confirmRetification'
    ];

    for (const handlerName of handlerNames) {
        const area = {
            scrollTop: 937,
            scrollLeft: 21,
            scrollTo({ top, left }) {
                this.scrollTop = top;
                this.scrollLeft = left;
            }
        };
        const calls = [];
        const root = {
            document: {
                querySelector(selector) {
                    return selector === 'main.content-area' ? area : null;
                }
            },
            requestAnimationFrame(callback) {
                callback();
                return 1;
            },
            async toggleBonif() { return true; },
            async changeAnaliseTecnica() { return true; },
            async toggleInvoiceAdvisorySent() { return true; },
            async changeInvoiceAdvisoryAnalysis() { return true; },
            async toggleConsEnviada() { return true; }
        };
        root[handlerName] = async (...args) => {
            calls.push(args);
            area.scrollTop = 0;
            area.scrollLeft = 0;
            return 'resultado-preservado';
        };

        assert.equal(api.install(root), true, `${handlerName} precisa ser protegido`);
        const result = await root[handlerName]('arg-1', { arg: 2 });

        assert.equal(result, 'resultado-preservado', `${handlerName} alterou o retorno`);
        assert.deepEqual(calls, [['arg-1', { arg: 2 }]], `${handlerName} alterou os argumentos`);
        assert.equal(area.scrollTop, 937, `${handlerName} alterou scrollTop`);
        assert.equal(area.scrollLeft, 21, `${handlerName} alterou scrollLeft`);
    }
});

test('todos os handlers de avaliação restauram posição também quando a operação falha', async () => {
    const handlerNames = [
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'changeInvoiceDocumentAnalysis',
        'toggleConsEnviada',
        'confirmRetification'
    ];

    for (const handlerName of handlerNames) {
        const area = {
            scrollTop: 611,
            scrollLeft: 7,
            scrollTo({ top, left }) {
                this.scrollTop = top;
                this.scrollLeft = left;
            }
        };
        const root = {
            document: {
                querySelector(selector) {
                    return selector === 'main.content-area' ? area : null;
                }
            },
            requestAnimationFrame(callback) {
                callback();
                return 1;
            },
            async toggleBonif() { return true; },
            async changeAnaliseTecnica() { return true; },
            async toggleInvoiceAdvisorySent() { return true; },
            async changeInvoiceAdvisoryAnalysis() { return true; },
            async toggleConsEnviada() { return true; }
        };
        const expected = new Error(`falha-${handlerName}`);
        root[handlerName] = async () => {
            area.scrollTop = 0;
            area.scrollLeft = 0;
            throw expected;
        };

        assert.equal(api.install(root), true, `${handlerName} precisa ser protegido`);
        await assert.rejects(root[handlerName](), error => error === expected);

        assert.equal(area.scrollTop, 611, `${handlerName} perdeu scrollTop após erro`);
        assert.equal(area.scrollLeft, 7, `${handlerName} perdeu scrollLeft após erro`);
    }
});


test('preserva metadados __radar dos wrappers funcionais já instalados', async () => {
    const { root } = createRoot();
    Object.defineProperty(root.changeAnaliseTecnica, '__radarConditionalReconciler', {
        value: true,
        enumerable: false
    });
    Object.defineProperty(root.changeAnaliseTecnica, '__radarIncrementalInlineHandler', {
        value: true,
        enumerable: false
    });

    assert.equal(api.install(root), true);
    assert.equal(root.changeAnaliseTecnica.__radarConditionalReconciler, true);
    assert.equal(root.changeAnaliseTecnica.__radarIncrementalInlineHandler, true);
    assert.equal(root.changeAnaliseTecnica.__radarScrollPreservingEvaluationHandler, true);
});
