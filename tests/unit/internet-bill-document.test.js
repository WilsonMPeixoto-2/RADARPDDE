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

const BASE_ANALYSIS = Object.freeze({
    extCC: 'Correto',
    extINV: 'Correto',
    notaFiscal: 'Correto',
    consAssessoria: 'Correto',
    declBBAgil: 'Correto',
    encampInventario: 'Correto'
});

function createVerificationHarness(compKey = '2026-08_CONECTADA', profile = 'controlador') {
    const verification = {
        bonificacao: {
            ...BASE_BONIFICATION,
            boletoInternet: 'Sim'
        },
        analise: {
            ...BASE_ANALYSIS,
            boletoInternet: 'Incorreto'
        },
        resultadoBonif: ''
    };
    const state = {
        verifications: { 'ESC-1': { [compKey]: verification } },
        registeredInvoices: [],
        assets: [],
        pendencies: [],
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste', programasIds: ['CONECTADA'] }],
        programs: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
        logs: []
    };
    let executeCalls = 0;
    const service = new VerificationService({
        dataService: {
            async execute(command) {
                executeCalls += 1;
                return { ok: true, value: await command.mutate() };
            }
        },
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: () => ({ id: 'log-legacy-boleto' }),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        getCurrentProfile: () => profile,
        createId: prefix => `${prefix}-legacy-boleto`,
        now: () => '2026-08-27T15:00:00.000Z',
        fluxo,
        retificacoes,
        reopenConsolidation: () => {}
    });
    return { state, verification, service, getExecuteCalls: () => executeCalls };
}

test('Educação Conectada usa a mesma matriz documental e ignora boletoInternet legado', () => {
    assert.deepEqual(fluxo.getDocumentKeysForProgram('CONECTADA'), fluxo.DOCUMENT_KEYS);
    assert.equal(fluxo.getDocumentKeysForProgram('CONECTADA').includes('boletoInternet'), false);
    assert.equal(
        Object.hasOwn(fluxo.createEmptyVerification('CONECTADA').bonificacao, 'boletoInternet'),
        false
    );

    assert.deepEqual(fluxo.evaluateBonification(BASE_BONIFICATION, 'CONECTADA'), {
        canConsolidate: true,
        status: 'apta',
        missingFields: []
    });

    assert.deepEqual(
        fluxo.evaluateBonification({ ...BASE_BONIFICATION, boletoInternet: 'Não' }, 'CONECTADA'),
        {
            canConsolidate: true,
            status: 'apta',
            missingFields: []
        }
    );

    const evaluation = fluxo.evaluateMonthlyEvaluation({
        bonification: { ...BASE_BONIFICATION, boletoInternet: 'Não' },
        analysis: { ...BASE_ANALYSIS, boletoInternet: 'Incorreto' },
        bonusResult: '',
        programId: 'CONECTADA',
        pendencies: []
    });

    assert.equal(evaluation.canConsolidate, true);
    assert.equal(evaluation.bonusResult, 'apta');
    assert.equal(evaluation.technicalStatus, 'correto');
    assert.equal(evaluation.technicalCompletion, 'complete');
});

test('estado legado boletoInternet é preservado como dado, mas não recebe compatibilidade ativa', () => {
    const verification = {
        bonificacao: { ...BASE_BONIFICATION, boletoInternet: 'Sim' },
        analise: { ...BASE_ANALYSIS, boletoInternet: 'Incorreto' },
        resultadoBonif: ''
    };

    const projected = fluxo.getEffectiveDocumentState(
        verification,
        'CONECTADA',
        'boletoInternet'
    );

    assert.deepEqual(projected, {
        bonification: 'Sim',
        analysis: 'Incorreto',
        usesLegacyCompatibility: false
    });
    assert.equal(verification.bonificacao.boletoInternet, 'Sim');
    assert.equal(verification.analise.boletoInternet, 'Incorreto');
});

test('VerificationService rejeita boletoInternet como documento independente antes de DataService', async () => {
    const harness = createVerificationHarness();

    await assert.rejects(
        () => harness.service.setBonification({
            schoolId: 'ESC-1',
            compKey: '2026-08_CONECTADA',
            documentKey: 'boletoInternet',
            value: 'Sim',
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-08_CONECTADA',
            documentKey: 'boletoInternet',
            value: 'Correto',
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    const assistantHarness = createVerificationHarness('2026-08_CONECTADA', 'assistente');
    await assert.rejects(
        () => assistantHarness.service.retify({
            schoolId: 'ESC-1',
            compKey: '2026-08_CONECTADA',
            programId: 'CONECTADA',
            bonification: { boletoInternet: 'Não' },
            bonusResult: 'apta',
            justification: 'Tentativa de editar requisito legado.'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    assert.equal(harness.getExecuteCalls(), 0);
    assert.equal(assistantHarness.getExecuteCalls(), 0);
});

test('PendencyService rejeita nova pendência boletoInternet e exige o documento Notas Fiscais', async () => {
    const state = {
        pendencies: [],
        contacts: [],
        verifications: {
            'ESC-1': {
                '2026-08_CONECTADA': {
                    bonificacao: { ...BASE_BONIFICATION, boletoInternet: 'Sim' },
                    analise: { ...BASE_ANALYSIS, boletoInternet: 'Não analisado' },
                    resultadoBonif: ''
                }
            }
        },
        schools: [],
        programs: [],
        logs: []
    };
    let executeCalls = 0;
    const service = new PendencyService({
        dataService: {
            async execute(command) {
                executeCalls += 1;
                return { ok: true, value: await command.mutate() };
            }
        },
        domain: pendencyDomain,
        getState: () => state,
        appendLog: () => ({ id: 'log-boleto-disabled' }),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-boleto-disabled`,
        now: () => '2026-08-27T15:00:00.000Z'
    });

    await assert.rejects(
        () => service.open({
            schoolId: 'ESC-1',
            competence: '2026-08',
            programId: 'CONECTADA',
            documentKey: 'boletoInternet',
            item: 'Boleto de pagamento de Internet',
            errors: ['Documento incorreto'],
            technicalAnalysisValue: 'Incorreto'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    assert.equal(executeCalls, 0);
    assert.equal(state.pendencies.length, 0);
});
