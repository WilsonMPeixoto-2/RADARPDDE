'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const evaluationRetification = require('../../src/integration/evaluation-retification.js');

function createHarness(currentProfile = 'controlador') {
    const verification = {
        bonificacao: {
            extCC: '',
            extINV: '',
            notaFiscal: '',
            consAssessoria: '',
            declBBAgil: '',
            encampInventario: ''
        },
        analise: {
            extCC: 'Não analisado',
            extINV: 'Não analisado',
            notaFiscal: 'Não analisado',
            consAssessoria: 'Não analisado',
            declBBAgil: 'Não analisado',
            encampInventario: 'Não analisado'
        },
        resultadoBonif: '',
        rowVersion: 3
    };
    const state = {
        verifications: { 'ESC-1': { '2026-05_BASIC': verification } },
        registeredInvoices: [],
        pendencies: [],
        schools: [{ id: 'ESC-1', denominação: 'Escola Um' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        logs: []
    };
    const calls = [];
    const dataService = {
        async execute(command) {
            calls.push(command.name);
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    let id = 0;
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: (action, details) => {
            const log = { id: `log-${++id}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'controlador' }),
        getCurrentProfile: () => currentProfile,
        createId: prefix => `${prefix}-${++id}`,
        now: () => '2026-09-10T15:00:00.000Z',
        fluxo,
        retificacoes
    });
    evaluationRetification.protectVerificationService(service);
    return { state, calls, verification, service };
}

test('desfazer bonificação volta ao neutro, invalida análise dependente e registra Avaliação desfeita', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.extCC = 'Sim';
    harness.verification.analise.extCC = 'Correto';

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: '',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.extCC, '');
    assert.equal(result.value.verification.analise.extCC, 'Não analisado');
    assert.equal(result.value.undone, true);
    assert.equal(harness.state.logs[0].action, 'Avaliação desfeita');
    assert.match(harness.state.logs[0].details, /Sim/);
    assert.equal(harness.calls.length, 1);
});

test('corrigir análise técnica é comando explícito e não cria novo envio nem reanálise', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.extCC = 'Sim';
    harness.verification.analise.extCC = 'Correto';

    const result = await harness.service.correctTechnicalAnalysis({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Não analisado',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.analise.extCC, 'Não analisado');
    assert.equal(harness.state.pendencies.length, 0);
    assert.equal(harness.state.logs[0].action, 'Avaliação técnica retificada');
    assert.match(harness.state.logs[0].details, /Correto/);
    assert.match(harness.state.logs[0].details, /Não analisado/);
});

test('retificação técnica não libera alteração agregada de Nota Fiscal, boleto ou Consulta Assessoria', async () => {
    for (const documentKey of ['notaFiscal', 'boletoInternet', 'consAssessoria']) {
        const harness = createHarness();
        harness.verification.bonificacao[documentKey] = 'Sim';

        await assert.rejects(
            () => harness.service.correctTechnicalAnalysis({
                schoolId: 'ESC-1',
                compKey: '2026-05_BASIC',
                documentKey,
                value: 'Correto',
                profile: 'controlador'
            }),
            error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
        );
    }
});

test('fluxo ordinário continua proibindo gravar Incorreto sem abertura atômica de Pendência', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.extCC = 'Sim';

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'extCC',
            value: 'Incorreto',
            profile: 'controlador'
        }),
        error => error?.code === 'PENDENCY_REQUIRED'
    );

    assert.equal(harness.verification.analise.extCC, 'Não analisado');
    assert.equal(harness.state.pendencies.length, 0);
});
