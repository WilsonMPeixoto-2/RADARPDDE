'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const bridge = require('../../src/data/state-bridge.js');

function legacyStateWithDifferentAvailabilityAndRegistration() {
    return {
        config: {},
        programs: [],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [],
        verifications: {},
        contacts: [],
        assets: [],
        registeredInvoices: [],
        logs: [],
        pendencies: [{
            id: 'pend-availability-1',
            escolaId: '04.31.001',
            competencia: '2026-08',
            competenciaOrigem: '2026-08',
            programaId: 'BASIC',
            documentoKey: 'extCC',
            item: 'PDDE Básico - Extrato Conta Corrente',
            status: 'Aguardando reanálise',
            responsavel: 'Controlador',
            motivo: 'Documento incompleto',
            observacao: 'Aguardando análise do novo arquivo.',
            dataAbertura: '2026-08-10',
            dataResolucao: null,
            tentativas: [{
                id: 'attempt-availability-1',
                numero: 1,
                dataDisponibilizacao: '2026-08-20',
                dataRegistro: '2026-08-22T18:45:00.000Z',
                observacao: 'Arquivo disponibilizado antes do lançamento no RADAR.',
                link: 'https://drive.example.test/documento',
                status: 'aguardando',
                dataAnalise: null,
                resultado: null,
                errosEncontrados: []
            }],
            historico: [],
            cancelamento: null
        }]
    };
}

test('data de disponibilização sobrevive ao round-trip sem virar data de registro', () => {
    const transformed = bridge.transformLegacyState(
        legacyStateWithDifferentAvailabilityAndRegistration()
    );
    const canonicalAttempt = transformed.entities.pendencyAttempts[0];

    assert.equal(canonicalAttempt.available_at, '2026-08-20T00:00:00.000Z');
    assert.equal(canonicalAttempt.submitted_at, '2026-08-22T18:45:00.000Z');

    const restored = bridge.canonicalEntitiesToLegacyState({
        pendencies: transformed.entities.pendencies,
        pendencyAttempts: transformed.entities.pendencyAttempts
    });
    const restoredAttempt = restored.pendencies[0].tentativas[0];

    assert.equal(restoredAttempt.dataDisponibilizacao, '2026-08-20');
    assert.equal(restoredAttempt.dataRegistro, '2026-08-22T18:45:00.000Z');
});
