'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createDocumentPendency,
    findActivePendency
} = require('../src/domain/pendencias.js');

const AUDIT = Object.freeze({
    eventId: 'evt-1',
    at: '2026-08-23T03:00:00.000Z',
    usuario: 'Controlador Teste',
    perfil: 'controlador'
});

function createAdvisoryPendency(id, invoiceId) {
    return createDocumentPendency({
        id,
        escolaId: 'ESC-1',
        competencia: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: invoiceId,
        item: `Consulta à Assessoria - ${invoiceId}`,
        erros: ['Dados divergentes'],
        observacao: 'Parecer da Assessoria requer correção.',
        dataAbertura: '2026-08-23'
    }, {
        ...AUDIT,
        eventId: `evt-${id}`
    });
}

test('pendência individual de Assessoria preserva a NF de origem', () => {
    const pendency = createAdvisoryPendency('pend-1', 'nota-serv-1');

    assert.equal(pendency.registeredInvoiceId, 'nota-serv-1');
});

test('pendências de Assessoria simultâneas são distinguidas pela NF vinculada', () => {
    const first = createAdvisoryPendency('pend-1', 'nota-serv-1');
    const second = createAdvisoryPendency('pend-2', 'nota-serv-2');

    const found = findActivePendency([first, second], {
        escolaId: 'ESC-1',
        competencia: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'nota-serv-2'
    });

    assert.equal(found?.id, 'pend-2');
});
