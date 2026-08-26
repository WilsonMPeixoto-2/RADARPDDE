'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const pendencyDomain = require('../../src/domain/pendencias.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const { PendencyService } = require('../../src/application/pendency-service.js');

function completeBonification(boletoValue) {
    return {
        extCC: 'Sim',
        extINV: 'Sim',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica',
        boletoInternet: boletoValue
    };
}

function createVerificationHarness() {
    const verification = {
        bonificacao: completeBonification('Não se aplica'),
        analise: Object.fromEntries([
            ...fluxo.DOCUMENT_KEYS.map(key => [key, 'Correto']),
            ['boletoInternet', 'Não analisado']
        ]),
        resultadoBonif: ''
    };
    const state = {
        verifications: { 'ESC-1': { '2026-08_BASIC': verification } },
        registeredInvoices: [],
        assets: [],
        pendencies: [],
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
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
        getCurrentProfile: () => 'controlador',
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-08-26T20:00:00.000Z',
        fluxo,
        retificacoes,
        reopenConsolidation: () => {}
    });
    return { state, verification, service };
}

test('Boleto de pagamento de Internet integra a avaliação mensal com Sim, Não e Não se aplica', () => {
    assert.equal(fluxo.DOCUMENT_KEYS.includes('boletoInternet'), true);

    const empty = fluxo.createEmptyVerification();
    assert.equal(empty.bonificacao.boletoInternet, '');
    assert.equal(empty.analise.boletoInternet, 'Não analisado');

    assert.deepEqual(fluxo.evaluateBonification(completeBonification('Sim')), {
        canConsolidate: true,
        status: 'apta',
        missingFields: []
    });
    assert.deepEqual(fluxo.evaluateBonification(completeBonification('Não se aplica')), {
        canConsolidate: true,
        status: 'apta',
        missingFields: []
    });
    assert.deepEqual(fluxo.evaluateBonification(completeBonification('Não')), {
        canConsolidate: true,
        status: 'inapta',
        missingFields: []
    });
});

test('Boleto de Internet usa análise técnica comum sem criar NF, Assessoria ou bem', async () => {
    const harness = createVerificationHarness();

    await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        documentKey: 'boletoInternet',
        value: 'Sim',
        profile: 'controlador'
    });
    await harness.service.setTechnicalAnalysis({
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        documentKey: 'boletoInternet',
        value: 'Correto',
        profile: 'controlador'
    });

    assert.equal(harness.verification.bonificacao.boletoInternet, 'Sim');
    assert.equal(harness.verification.analise.boletoInternet, 'Correto');
    assert.equal(harness.state.registeredInvoices.length, 0);
    assert.equal(harness.state.assets.length, 0);
    assert.equal(harness.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.match(
        harness.state.logs.map(log => log.details).join('\n'),
        /Boleto de pagamento de Internet/
    );
});

test('Boleto de Internet abre pendência documental e grava Incorreto atomicamente', async () => {
    const state = {
        pendencies: [],
        contacts: [],
        registeredInvoices: [],
        assets: [],
        verifications: {
            'ESC-1': {
                '2026-08_BASIC': {
                    bonificacao: { boletoInternet: 'Sim' },
                    analise: { boletoInternet: 'Não analisado' },
                    resultadoBonif: ''
                }
            }
        },
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
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
        programId: 'BASIC',
        documentKey: 'boletoInternet',
        item: 'Boleto de pagamento de Internet',
        errors: ['Comprovante ilegível'],
        observation: 'Reenviar comprovante.',
        technicalAnalysisValue: 'Incorreto'
    });

    assert.equal(result.value.pendency.documentoKey, 'boletoInternet');
    assert.equal(result.value.verification.analise.boletoInternet, 'Incorreto');
    assert.equal(state.registeredInvoices.length, 0);
    assert.equal(state.assets.length, 0);
    assert.equal(state.pendencies.length, 1);
});
