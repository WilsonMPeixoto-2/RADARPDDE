'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const legacyAdapter = require('../../src/data/legacy-state-adapter.js');
const stateBridge = require('../../src/data/state-bridge.js');

function legacyState() {
    return {
        config: { exercicios: ['2026'], competenciaFechamento: '2026-12' },
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [{
            id: 'ESC-1',
            designação: 'ESC-1',
            programasIds: ['BASIC'],
            competenciaInicial: '2026-01'
        }],
        verifications: {},
        pendencies: [{
            schemaVersion: 2,
            tipo: 'documental',
            id: 'pend-advisory-1',
            escolaId: 'ESC-1',
            competencia: '2026-08',
            competenciaOrigem: '2026-08',
            programaId: 'BASIC',
            documentoKey: 'consAssessoria',
            registeredInvoiceId: 'invoice-service-1',
            item: 'Consulta à Assessoria - NF 100',
            status: 'Aberta',
            errosAtuais: ['Dados divergentes'],
            motivo: 'Dados divergentes',
            observacao: 'NF requer correção.',
            responsavel: 'Escola',
            dataAbertura: '2026-08-23',
            dataResolucao: null,
            tentativas: [],
            historico: [],
            cancelamento: null,
            contextoIncompleto: false
        }],
        contacts: [],
        assets: [],
        registeredInvoices: [{
            id: 'invoice-service-1',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            competencia: '2026-08',
            programaId: 'BASIC',
            desc: 'Serviço de manutenção',
            tipo: 'servico',
            numero: '100',
            valor: 300,
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Incorreto'
        }],
        logs: []
    };
}

test('adapter persiste vínculo da pendência com a NF no registro canônico', () => {
    const transformed = legacyAdapter.transformLegacyState(legacyState());

    assert.equal(transformed.rejected.length, 0);
    assert.equal(
        transformed.entities.pendencies[0].registered_invoice_id,
        'invoice-service-1'
    );
});

test('round-trip canônico preserva registeredInvoiceId sem contaminar pendências sem NF', () => {
    const canonical = stateBridge.transformLegacyState(legacyState()).entities;
    const restored = stateBridge.canonicalEntitiesToLegacyState(canonical);

    assert.equal(restored.pendencies[0].registeredInvoiceId, 'invoice-service-1');

    const roundTrip = stateBridge.transformLegacyState(restored);
    assert.equal(
        roundTrip.entities.pendencies[0].registered_invoice_id,
        'invoice-service-1'
    );
});

test('reload reconstrói registeredInvoiceId pela coluna canônica mesmo sem cópia no payload', () => {
    const canonical = stateBridge.transformLegacyState(legacyState()).entities;
    canonical.pendencies[0].payload = {};

    const restored = stateBridge.canonicalEntitiesToLegacyState(canonical);

    assert.equal(restored.pendencies[0].registeredInvoiceId, 'invoice-service-1');
});

test('reload preserva vínculo legado do payload quando a coluna canônica ainda está vazia', () => {
    const canonical = stateBridge.transformLegacyState(legacyState()).entities;
    canonical.pendencies[0].registered_invoice_id = null;
    canonical.pendencies[0].payload = { registeredInvoiceId: 'invoice-service-1' };

    const restored = stateBridge.canonicalEntitiesToLegacyState(canonical);

    assert.equal(restored.pendencies[0].registeredInvoiceId, 'invoice-service-1');
});
