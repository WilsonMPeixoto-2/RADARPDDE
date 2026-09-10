'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const pendencias = require('../../src/domain/pendencias.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const evaluationRetification = require('../../src/integration/evaluation-retification.js');

function createHarness() {
    const verification = {
        bonificacao: {
            extCC: 'Sim',
            extINV: '',
            notaFiscal: '',
            consAssessoria: '',
            declBBAgil: '',
            encampInventario: ''
        },
        analise: {
            extCC: 'Incorreto',
            extINV: 'Não analisado',
            notaFiscal: 'Não analisado',
            consAssessoria: 'Não analisado',
            declBBAgil: 'Não analisado',
            encampInventario: 'Não analisado'
        },
        resultadoBonif: '',
        rowVersion: 3
    };
    const activePendency = pendencias.createDocumentPendency({
        id: 'PEND-1',
        escolaId: 'ESC-1',
        competencia: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'extCC',
        item: 'Extrato Conta Corrente',
        erros: ['Documento ausente'],
        observacao: 'Documento marcado como incorreto por engano.',
        dataAbertura: '2026-09-09'
    }, {
        eventId: 'evento-abertura-1',
        at: '2026-09-09T12:00:00.000Z',
        usuario: 'Controlador Teste',
        perfil: 'controlador'
    });
    activePendency.rowVersion = 2;

    const state = {
        verifications: { 'ESC-1': { '2026-05_BASIC': verification } },
        registeredInvoices: [],
        pendencies: [activePendency],
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
        getCurrentProfile: () => 'controlador',
        createId: prefix => `${prefix}-${++id}`,
        now: () => '2026-09-10T18:00:00.000Z',
        fluxo,
        retificacoes
    });
    evaluationRetification.protectVerificationService(service);
    return { state, calls, verification, activePendency, service };
}

test('retificação de Incorreto com Pendência ativa exige confirmação expressa', async () => {
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.correctTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'extCC',
            value: 'Correto',
            profile: 'controlador',
            retificationJustification: 'A análise foi marcada como incorreta por erro de lançamento.'
        }),
        error => error?.code === 'RETIFICATION_CONFIRMATION_REQUIRED'
    );

    assert.equal(harness.verification.analise.extCC, 'Incorreto');
    assert.equal(harness.activePendency.status, 'Aberta');
    assert.deepEqual(harness.calls, []);
});

test('confirmação sem justificativa não pode anular Pendência por retificação', async () => {
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.correctTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'extCC',
            value: 'Correto',
            profile: 'controlador',
            confirmPendencyCancellation: true,
            retificationJustification: '   '
        }),
        error => error?.code === 'RETIFICATION_JUSTIFICATION_REQUIRED'
    );

    assert.equal(harness.verification.analise.extCC, 'Incorreto');
    assert.equal(harness.activePendency.status, 'Aberta');
    assert.deepEqual(harness.calls, []);
});

test('retificar Incorreto confirmado anula a Pendência como retificação formal e preserva tentativas e histórico', async () => {
    const harness = createHarness();
    const historyBefore = structuredClone(harness.activePendency.historico);
    const justification = 'A avaliação foi marcada como Incorreto por engano após conferência do documento correto.';

    const result = await harness.service.correctTechnicalAnalysis({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Correto',
        profile: 'controlador',
        confirmPendencyCancellation: true,
        retificationJustification: justification
    });

    assert.equal(result.value.verification.analise.extCC, 'Correto');
    assert.equal(result.value.pendency.status, 'Cancelada');
    assert.equal(result.value.pendency.cancelamento.tipo, 'retificacao_avaliacao');
    assert.equal(result.value.pendency.cancelamento.origem, 'avaliacao_tecnica');
    assert.equal(result.value.pendency.cancelamento.avaliacaoAnterior, 'Incorreto');
    assert.equal(result.value.pendency.cancelamento.avaliacaoNova, 'Correto');
    assert.equal(result.value.pendency.cancelamento.justificativa, justification);
    assert.equal(result.value.pendency.cancelamento.confirmacaoExpressa, true);
    assert.deepEqual(result.value.pendency.tentativas, []);
    assert.deepEqual(result.value.pendency.historico.slice(0, historyBefore.length), historyBefore);
    assert.equal(result.value.pendency.historico.at(-1).tipo, 'retificacao_avaliacao');
    assert.match(result.value.pendency.historico.at(-1).detalhe, /Incorreto.*Correto/i);
    assert.match(result.value.pendency.historico.at(-1).detalhe, /anulada por edição da avaliação/i);
    assert.match(result.value.pendency.historico.at(-1).detalhe, /marcada como Incorreto por engano/i);
    assert.equal(harness.state.pendencies[0].status, 'Cancelada');
    assert.equal(harness.state.logs[0].action, 'Avaliação técnica retificada');
    assert.match(harness.state.logs[0].details, /Incorreto.*Correto/i);
    assert.match(harness.state.logs[0].details, /Justificativa:/i);
    assert.match(harness.state.logs[0].details, /marcada como Incorreto por engano/i);
    assert.equal(harness.calls.length, 1);
});
