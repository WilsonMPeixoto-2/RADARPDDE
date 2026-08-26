'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { VerificationService } = require('../../src/application/verification-service.js');

function completeBonification(overrides = {}) {
  return {
    extCC: 'Sim',
    extINV: 'Sim',
    notaFiscal: 'Não se aplica',
    consAssessoria: 'Não se aplica',
    declBBAgil: 'Sim',
    encampInventario: 'Não se aplica',
    ...overrides
  };
}

function completeAnalysis(overrides = {}) {
  return {
    extCC: 'Correto',
    extINV: 'Correto',
    notaFiscal: 'Correto',
    consAssessoria: 'Correto',
    declBBAgil: 'Correto',
    encampInventario: 'Correto',
    ...overrides
  };
}

function createHarness() {
  const verification = {
    bonificacao: completeBonification(),
    analise: completeAnalysis(),
    resultadoBonif: '',
    rowVersion: 7
  };
  const state = {
    verifications: { school1: { '2026-08_BASIC': verification } },
    pendencies: [
      {
        id: 'p1',
        escolaId: 'school1',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        status: 'Aberta'
      },
      {
        id: 'p2',
        escolaId: 'school1',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        status: 'Aguardando reanálise'
      },
      {
        id: 'p3',
        escolaId: 'school1',
        competenciaOrigem: '2026-07',
        programaId: 'BASIC',
        status: 'Aberta'
      },
      {
        id: 'p4',
        escolaId: 'other-school',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        status: 'Aberta'
      }
    ],
    registeredInvoices: [],
    logs: []
  };
  const dataService = {
    async execute(command) {
      return { ok: true, value: await command.mutate() };
    }
  };
  const appendLog = (action, details, context = {}) => {
    const log = {
      id: `log-${state.logs.length + 1}`,
      escolaId: context.escolaId || context.schoolId,
      acao: action,
      detalhes: details
    };
    state.logs.push(log);
    return log;
  };
  const service = new VerificationService({
    dataService,
    getState: () => state,
    ensureVerification: (schoolId, compKey) => state.verifications[schoolId][compKey],
    appendLog
  });
  return { service, state, verification };
}

test('serviço projeta somente pendências da mesma escola, competência e programa', () => {
  const { service } = createHarness();

  assert.equal(typeof service.getMonthlyEvaluation, 'function');
  const result = service.getMonthlyEvaluation({
    schoolId: 'school1',
    compKey: '2026-08_BASIC'
  });

  assert.equal(result.bonusResult, 'apta');
  assert.equal(result.technicalStatus, 'correto');
  assert.equal(result.openPendencyCount, 1);
  assert.equal(result.awaitingReanalysisCount, 1);
  assert.equal(result.activePendencyCount, 2);
});

test('consolidação devolve a mesma projeção canônica persistida na verificação', async () => {
  const { service, verification } = createHarness();

  const result = await service.closeBonification({
    profile: 'controlador',
    schoolId: 'school1',
    compKey: '2026-08_BASIC'
  });

  assert.equal(result.value.status, 'apta');
  assert.equal(result.value.evaluation.bonusResult, 'apta');
  assert.equal(result.value.evaluation.technicalStatus, 'correto');
  assert.equal(result.value.evaluation.activePendencyCount, 2);
  assert.equal(verification.resultadoBonif, result.value.evaluation.bonusResult);
});

test('consolidação incompleta preserva o estado e informa os campos ausentes', async () => {
  const { service, verification } = createHarness();
  verification.bonificacao.extCC = '';

  await assert.rejects(
    service.closeBonification({
      profile: 'controlador',
      schoolId: 'school1',
      compKey: '2026-08_BASIC'
    }),
    error => error?.code === 'INCOMPLETE_BONIFICATION'
      && error?.details?.missingFields?.includes('extCC')
  );
  assert.equal(verification.resultadoBonif, '');
});
