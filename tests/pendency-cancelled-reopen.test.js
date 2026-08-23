'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { reopenPendency } = require('../src/domain/pendencias.js');

function cancelledFixture() {
    return {
        schemaVersion: 2,
        tipo: 'documental',
        id: 'pend-cancelada-1',
        escolaId: '04.31.001',
        competencia: '2026-05',
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'extCC',
        item: 'PDDE Básico - Extrato Conta Corrente',
        status: 'Cancelada',
        errosAtuais: ['Dados divergentes'],
        motivo: 'Dados divergentes',
        observacao: 'Pendência documental.',
        responsavel: null,
        dataAbertura: '2026-05-31',
        dataResolucao: null,
        tentativas: [],
        historico: [{
            id: 'evt-cancelamento-1',
            tipo: 'cancelamento',
            dataHora: '2026-07-15T09:10:00.000Z',
            usuario: 'Maria Controladora',
            perfil: 'controlador',
            detalhe: 'Pendência cancelada: cancelamento administrativo.',
            erros: ['Dados divergentes'],
            tentativaId: null
        }],
        cancelamento: {
            justificativa: 'cancelamento administrativo.',
            dataHora: '2026-07-15T09:10:00.000Z',
            usuario: 'Maria Controladora',
            perfil: 'controlador'
        },
        contextoIncompleto: false
    };
}

test('reabre pendência Cancelada conforme o contrato PEND-05 e preserva o histórico', () => {
    const source = cancelledFixture();
    const sourceSnapshot = structuredClone(source);

    const result = reopenPendency(source, {
        justificativa: 'A pendência voltou a exigir acompanhamento.',
        erros: ['Documento incompleto']
    }, {
        eventId: 'evt-reabertura-cancelada-1',
        at: '2026-08-22T21:30:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador'
    });

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.status, 'Aberta');
    assert.equal(result.responsavel, 'Escola');
    assert.deepEqual(result.errosAtuais, ['Documento incompleto']);
    assert.equal(result.motivo, 'Documento incompleto');
    assert.deepEqual(result.cancelamento, source.cancelamento);
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-reabertura-cancelada-1',
        tipo: 'reabertura',
        dataHora: '2026-08-22T21:30:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Pendência reaberta: A pendência voltou a exigir acompanhamento.',
        erros: ['Documento incompleto'],
        tentativaId: null
    });
});
