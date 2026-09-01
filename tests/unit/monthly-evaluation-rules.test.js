'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const flow = require('../../src/domain/fluxo-operacional.js');

const completeBonification = Object.freeze({
  extCC: 'Sim',
  extINV: 'Sim',
  notaFiscal: 'Não se aplica',
  consAssessoria: 'Não se aplica',
  declBBAgil: 'Sim',
  encampInventario: 'Não se aplica'
});

const completeAnalysis = Object.freeze({
  extCC: 'Correto',
  extINV: 'Correto',
  notaFiscal: 'Correto',
  consAssessoria: 'Correto',
  declBBAgil: 'Correto',
  encampInventario: 'Correto'
});

test('projeta APTA quando todos os itens aplicáveis foram entregues', () => {
  assert.equal(typeof flow.evaluateMonthlyEvaluation, 'function');

  const result = flow.evaluateMonthlyEvaluation({
    bonification: completeBonification,
    analysis: completeAnalysis,
    pendencies: []
  });

  assert.deepEqual(result, {
    canConsolidate: true,
    bonusResult: 'apta',
    missingFields: [],
    bonificationStatus: 'apta',
    technicalStatus: 'correto',
    technicalCompletion: 'complete',
    openPendencyCount: 0,
    awaitingReanalysisCount: 0,
    activePendencyCount: 0
  });
});

test('projeta INAPTA quando qualquer item aplicável não foi entregue', () => {
  const result = flow.evaluateMonthlyEvaluation({
    bonification: { ...completeBonification, extINV: 'Não' },
    analysis: { ...completeAnalysis, extINV: 'Incorreto' },
    pendencies: [{ status: 'Aberta' }]
  });

  assert.equal(result.canConsolidate, true);
  assert.equal(result.bonusResult, 'inapta');
  assert.equal(result.bonificationStatus, 'inapta');
  assert.equal(result.technicalStatus, 'incorreto');
  assert.equal(result.technicalCompletion, 'complete');
  assert.equal(result.openPendencyCount, 1);
  assert.equal(result.activePendencyCount, 1);
});

test('não consolida quando campo obrigatório está vazio ou marcado como não se aplica', () => {
  const empty = flow.evaluateMonthlyEvaluation({
    bonification: { ...completeBonification, extCC: '' },
    analysis: completeAnalysis,
    pendencies: []
  });
  const invalidNotApplicable = flow.evaluateMonthlyEvaluation({
    bonification: { ...completeBonification, extINV: 'Não se aplica' },
    analysis: completeAnalysis,
    pendencies: []
  });

  assert.equal(empty.canConsolidate, false);
  assert.equal(empty.bonusResult, null);
  assert.deepEqual(empty.missingFields, ['extCC']);
  assert.equal(invalidNotApplicable.canConsolidate, false);
  assert.deepEqual(invalidNotApplicable.missingFields, ['extINV']);
});

test('Declaração BB Ágil aceita N/A e mantém a bonificação apta', () => {
  const result = flow.evaluateMonthlyEvaluation({
    bonification: { ...completeBonification, declBBAgil: 'Não se aplica' },
    analysis: completeAnalysis,
    pendencies: []
  });

  assert.equal(result.canConsolidate, true);
  assert.equal(result.bonusResult, 'apta');
  assert.deepEqual(result.missingFields, []);
});

test('Declaração BB Ágil em N/A neutraliza análise histórica ainda não analisada', () => {
  const result = flow.evaluateMonthlyEvaluation({
    bonification: { ...completeBonification, declBBAgil: 'Não se aplica' },
    analysis: { ...completeAnalysis, declBBAgil: 'Não analisado' },
    pendencies: []
  });
  const documentState = flow.getEffectiveDocumentState({
    bonificacao: { ...completeBonification, declBBAgil: 'Não se aplica' },
    analise: { ...completeAnalysis, declBBAgil: 'Não analisado' }
  }, 'BASIC', 'declBBAgil');

  assert.equal(result.technicalStatus, 'correto');
  assert.equal(result.technicalCompletion, 'complete');
  assert.equal(documentState.analysis, 'Correto');
});

test('distingue análise não iniciada, em andamento e concluída', () => {
  const notStarted = flow.evaluateMonthlyEvaluation({
    bonification: {},
    analysis: {},
    pendencies: []
  });
  const inProgress = flow.evaluateMonthlyEvaluation({
    bonification: completeBonification,
    analysis: { ...completeAnalysis, extCC: 'Não analisado' },
    pendencies: []
  });
  const delayed = flow.evaluateMonthlyEvaluation({
    bonification: completeBonification,
    analysis: { ...completeAnalysis, extCC: 'Correto (Atrasado)' },
    pendencies: []
  });

  assert.equal(notStarted.technicalStatus, 'nao-analisado');
  assert.equal(notStarted.technicalCompletion, 'not_started');
  assert.equal(inProgress.technicalStatus, 'em-analise');
  assert.equal(inProgress.technicalCompletion, 'in_progress');
  assert.equal(delayed.technicalStatus, 'correto-atrasado');
  assert.equal(delayed.technicalCompletion, 'complete');
});

test('mantém situação incorreta separada da conclusão ainda em andamento', () => {
  const result = flow.evaluateMonthlyEvaluation({
    bonification: completeBonification,
    analysis: {
      ...completeAnalysis,
      extCC: 'Incorreto',
      extINV: 'Não analisado'
    },
    pendencies: [{ status: 'Aberta' }]
  });

  assert.equal(result.technicalStatus, 'incorreto');
  assert.equal(result.technicalCompletion, 'in_progress');
});

test('contabiliza separadamente providência da escola e reanálise do controlador', () => {
  const result = flow.evaluateMonthlyEvaluation({
    bonification: completeBonification,
    analysis: completeAnalysis,
    pendencies: [
      { status: 'Aberta' },
      { status: 'Aguardando reanálise' },
      { status: 'Resolvida' },
      { status: 'Cancelada' }
    ]
  });

  assert.equal(result.openPendencyCount, 1);
  assert.equal(result.awaitingReanalysisCount, 1);
  assert.equal(result.activePendencyCount, 2);
});
