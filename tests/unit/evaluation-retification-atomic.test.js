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

test('retificar Incorreto confirmado cancela a Pendência no mesmo comando sem fabricar tentativa', async () => {
    const harness = createHarness();
    const historyBefore = structuredClone(harness.activePendency.historico);

    const result = await harness.service.correctTechnicalAnalysis({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Não analisado',
        profile: 'controlador',
        confirmPendencyCancellation: true
    });

    assert.equal(result.value.verification.analise.extCC, 'Não analisado');
    assert.equal(result.value.pendency.status, 'Cancelada');
    assert.equal(
        result.value.pendency.cancelamento.justificativa,
        'cancelada por retificação da avaliação'
    );
    assert.deepEqual(result.value.pendency.tentativas, []);
    assert.deepEqual(result.value.pendency.historico.slice(0, historyBefore.length), historyBefore);
    assert.equal(result.value.pendency.historico.at(-1).tipo, 'cancelamento');
    assert.match(result.value.pendency.historico.at(-1).detalhe, /retificação da avaliação/i);
    assert.equal(harness.state.pendencies[0].status, 'Cancelada');
    assert.equal(harness.state.logs.at(-1)?.action || harness.state.logs[0]?.action, 'Avaliação técnica retificada');
    assert.equal(harness.calls.length, 1);
});
