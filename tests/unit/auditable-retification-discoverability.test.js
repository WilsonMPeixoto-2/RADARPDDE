'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const retification = require('../../src/integration/auditable-retification.js');

function createButtonElement() {
    return {
        type: '',
        dataset: {},
        attributes: {},
        innerHTML: '',
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        getAttribute(name) {
            return this.attributes[name] || null;
        },
        addEventListener() {}
    };
}

function createHarness() {
    const appended = [];
    const actions = {
        appendChild(element) {
            appended.push(element);
        }
    };
    const titleLine = {
        querySelector(selector) {
            return selector === '.invoice-document-inline-actions' ? actions : null;
        },
        appendChild(element) {
            appended.push(element);
        }
    };
    const row = {
        dataset: { invoiceId: 'NF-UX-1' },
        querySelector(selector) {
            if (selector === '[data-auditable-retification-edit]') return null;
            if (selector === '.invoice-document-title-line') return titleLine;
            return null;
        },
        querySelectorAll() {
            return [];
        }
    };
    const state = {
        registeredInvoices: [{
            id: 'NF-UX-1',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            tipo: 'consumo',
            numero: '123',
            desc: 'Material pedagógico',
            valor: 100
        }],
        pendencies: [{
            id: 'PEND-UX-1',
            documentoKey: 'notaFiscal',
            registeredInvoiceId: 'NF-UX-1',
            status: 'Aberta'
        }]
    };
    const root = {
        RadarApplicationServices: {
            invoices: {
                getState: () => state
            }
        },
        getRadarAccessProfile: () => 'controlador',
        getInvoiceDocumentTitle: () => 'NF: 123',
        document: {
            querySelectorAll: selector => (
                selector === '.invoice-document-row[data-invoice-id]' ? [row] : []
            ),
            createElement: tag => {
                assert.equal(tag, 'button');
                return createButtonElement();
            }
        }
    };
    return { root, appended };
}

test('retificação com histórico expõe ação textual Editar lançamento em vez de ícone opaco', () => {
    const { root, appended } = createHarness();

    assert.equal(retification.decorateInvoiceRows(root), true);
    assert.equal(appended.length, 1);

    const button = appended[0];
    assert.match(button.getAttribute('aria-label'), /^Editar lançamento:/);
    assert.match(button.innerHTML, />Editar lançamento<|>Editar lançamento<\/span>/);
});
