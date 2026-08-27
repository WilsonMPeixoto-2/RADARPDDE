'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const pendencyDomain = require('../../src/domain/pendencias.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const { PendencyService } = require('../../src/application/pendency-service.js');

const BASE_BONIFICATION = Object.freeze({
    extCC: 'Sim',
    extINV: 'Sim',
    notaFiscal: 'Não se aplica',
    consAssessoria: 'Não se aplica',
    declBBAgil: 'Sim',
    encampInventario: 'Não se aplica'
});

function connectedBonification(boletoValue) {
    return { ...BASE_BONIFICATION, boletoInternet: boletoValue };
}

function createVerificationHarness(compKey = '2026-08_CONECTADA', profile = 'controlador') {
    const verification = {
        bonificacao: connectedBonification('Não se aplica'),
        analise: {
            extCC: 'Correto',
            extINV: 'Correto',
            notaFiscal: 'Correto',
            consAssessoria: 'Correto',
            declBBAgil: 'Correto',
            encampInventario: 'Correto',
            boletoInternet: 'Não analisado'
        },
        resultadoBonif: ''
    };
    const state = {
        verifications: { 'ESC-1': { [compKey]: verification } },
        registeredInvoices: [],
        assets: [],
        pendencies: [],
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste' }],
        programs: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
        logs: []
    };
    let sequence = 0;
    const service = new VerificationService({
        dataService: {
            async execute(command) {
                return { ok: true, value: await command.mutate() };
            }
        },
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        getCurrentProfile: () => profile,
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-08-26T20:00:00.000Z',
        fluxo,
        retificacoes,
        reopenConsolidation: () => {}
    });
    return { state, verification, service };
}

test('Boleto de Internet pertence somente ao programa Educação Conectada', () => {
    assert.equal(fluxo.DOCUMENT_KEYS.includes('boletoInternet'), false);
    assert.deepEqual(fluxo.getDocumentKeysForProgram('BASIC'), fluxo.DOCUMENT_KEYS);
    assert.equal(fluxo.getDocumentKeysForProgram('CONECTADA').includes('boletoInternet'), true);
    assert.equal(
        Object.hasOwn(fluxo.createEmptyVerification('BASIC').bonificacao, 'boletoInternet'),
        false
    );
    assert.equal(
        Object.hasOwn(fluxo.createEmptyVerification('CONECTADA').bonificacao, 'boletoInternet'),
        true
    );

    assert.deepEqual(fluxo.evaluateBonification(BASE_BONIFICATION, 'BASIC'), {
        canConsolidate: true,
        status: 'apta',
        missingFields: []
    });
    assert.deepEqual(fluxo.evaluateBonification(BASE_BONIFICATION, 'CONECTADA'), {
        canConsolidate: false,
        status: null,
        missingFields: ['boletoInternet']
    });
    assert.equal(fluxo.evaluateBonification(connectedBonification('Sim'), 'CONECTADA').status, 'apta');
    assert.equal(fluxo.evaluateBonification(connectedBonification('Não se aplica'), 'CONECTADA').status, 'apta');
    assert.equal(fluxo.evaluateBonification(connectedBonification('Não'), 'CONECTADA').status, 'inapta');
});

test('consolidações antigas de Educação Conectada permanecem válidas sem backfill do boleto', () => {
    const legacyAnalysis = Object.fromEntries(
        fluxo.DOCUMENT_KEYS.map(key => [key, 'Correto'])
    );
    const result = fluxo.evaluateMonthlyEvaluation({
        bonification: BASE_BONIFICATION,
        analysis: legacyAnalysis,
        bonusResult: 'apta',
        programId: 'CONECTADA',
        pendencies: []
    });

    assert.equal(result.canConsolidate, true);
    assert.equal(result.bonusResult, 'apta');
    assert.equal(result.technicalStatus, 'correto');
    assert.equal(result.technicalCompletion, 'complete');

    const projectedBill = fluxo.getEffectiveDocumentState({
        bonificacao: BASE_BONIFICATION,
        analise: legacyAnalysis,
        resultadoBonif: 'apta'
    }, 'CONECTADA', 'boletoInternet');
    assert.deepEqual(projectedBill, {
        bonification: 'Não se aplica',
        analysis: 'Correto',
        usesLegacyCompatibility: true
    });
    assert.equal(Object.hasOwn(BASE_BONIFICATION, 'boletoInternet'), false);
    assert.equal(Object.hasOwn(legacyAnalysis, 'boletoInternet'), false);
});

test('Boleto de Internet usa análise técnica comum sem criar NF, Assessoria ou bem', async () => {
    const harness = createVerificationHarness();

    await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-08_CONECTADA',
        documentKey: 'boletoInternet',
        value: 'Sim',
        profile: 'controlador'
    });
    await harness.service.setTechnicalAnalysis({
        schoolId: 'ESC-1',
        compKey: '2026-08_CONECTADA',
        documentKey: 'boletoInternet',
        value: 'Correto',
        profile: 'controlador'
    });

    assert.equal(harness.verification.bonificacao.boletoInternet, 'Sim');
    assert.equal(harness.verification.analise.boletoInternet, 'Correto');
    assert.equal(harness.state.registeredInvoices.length, 0);
    assert.equal(harness.state.assets.length, 0);
    assert.equal(harness.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.match(harness.state.logs.map(log => log.details).join('\n'), /Boleto de pagamento de Internet/);
});

test('serviço rejeita Boleto de Internet fora de Educação Conectada', async () => {
    const harness = createVerificationHarness('2026-08_BASIC');

    await assert.rejects(
        () => harness.service.setBonification({
            schoolId: 'ESC-1',
            compKey: '2026-08_BASIC',
            documentKey: 'boletoInternet',
            value: 'Sim',
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-08_BASIC',
            documentKey: 'boletoInternet',
            value: 'Correto',
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );
});

test('retificação rejeita Boleto de Internet fora de Educação Conectada', async () => {
    const harness = createVerificationHarness('2026-08_BASIC', 'assistente');

    await assert.rejects(
        () => harness.service.retify({
            schoolId: 'ESC-1',
            compKey: '2026-08_BASIC',
            programId: 'BASIC',
            bonification: { boletoInternet: 'Sim' },
            bonusResult: 'apta',
            justification: 'Retificação de teste.'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );
});

test('Boleto de Internet abre pendência documental e grava Incorreto atomicamente em Educação Conectada', async () => {
    const state = {
        pendencies: [],
        contacts: [],
        registeredInvoices: [],
        assets: [],
        verifications: {
            'ESC-1': {
                '2026-08_CONECTADA': {
                    bonificacao: { boletoInternet: 'Sim' },
                    analise: { boletoInternet: 'Não analisado' },
                    resultadoBonif: ''
                }
            }
        },
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste' }],
        programs: [{ id: 'CONECTADA', name: 'Educação Conectada' }],
        logs: []
    };
    let sequence = 0;
    const service = new PendencyService({
        dataService: {
            async execute(command) {
                return { ok: true, value: await command.mutate() };
            }
        },
        domain: pendencyDomain,
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-08-26T20:00:00.000Z',
        getCorrectAnalysisLabel: () => 'Correto'
    });

    const result = await service.open({
        schoolId: 'ESC-1',
        competence: '2026-08',
        programId: 'CONECTADA',
        documentKey: 'boletoInternet',
        item: 'Boleto de pagamento de Internet',
        errors: ['Comprovante ilegível'],
        observation: 'Reenviar comprovante.',
        technicalAnalysisValue: 'Incorreto'
    });

    assert.equal(result.value.pendency.programaId, 'CONECTADA');
    assert.equal(result.value.pendency.documentoKey, 'boletoInternet');
    assert.equal(result.value.verification.analise.boletoInternet, 'Incorreto');
    assert.equal(state.registeredInvoices.length, 0);
    assert.equal(state.assets.length, 0);
    assert.equal(state.pendencies.length, 1);
});

test('serviço de Pendências rejeita Boleto de Internet fora de Educação Conectada', async () => {
    const state = {
        pendencies: [],
        contacts: [],
        verifications: {},
        schools: [],
        programs: [],
        logs: []
    };
    const service = new PendencyService({
        dataService: {
            async execute(command) {
                return { ok: true, value: await command.mutate() };
            }
        },
        domain: pendencyDomain,
        getState: () => state,
        appendLog: () => ({ id: 'log-out-of-scope' }),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-out-of-scope`,
        now: () => '2026-08-26T20:00:00.000Z'
    });

    await assert.rejects(
        () => service.open({
            schoolId: 'ESC-1',
            competence: '2026-08',
            programId: 'BASIC',
            documentKey: 'boletoInternet',
            item: 'Boleto de pagamento de Internet',
            errors: ['Documento ausente']
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );
});
