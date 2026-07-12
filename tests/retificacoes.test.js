const test = require('node:test');
const assert = require('node:assert/strict');

const Retificacoes = require('../src/domain/retificacoes.js');

const verification = {
  bonificacao: {
    extCC: 'Sim',
    extINV: 'Não',
    notaFiscal: 'Não se aplica'
  },
  analise: {
    extCC: 'Correto',
    extINV: 'Incorreto',
    notaFiscal: 'Correto'
  },
  resultadoBonif: 'APTA',
  retificacoes: []
};

test('autoriza retificação somente ao perfil Assistente nesta fase', () => {
  assert.equal(Retificacoes.canRetify('assistente'), true);
  assert.equal(Retificacoes.canRetify('controlador'), false);
  assert.equal(Retificacoes.canRetify('sme'), false);
});

test('exige justificativa e alteração efetiva', () => {
  assert.throws(() => Retificacoes.applyRetification(verification, {
    bonificacao: { extINV: 'Sim' },
    justificativa: ''
  }, {
    id: 'ret-1',
    at: '2026-07-12T12:00:00.000Z',
    usuario: 'Assistente',
    perfil: 'assistente',
    escolaId: '04.31.001',
    competencia: '2026-05',
    programaId: 'BASIC'
  }), /Justificativa/);

  assert.throws(() => Retificacoes.applyRetification(verification, {
    bonificacao: { extINV: 'Não' },
    justificativa: 'Sem mudança real.'
  }, {
    id: 'ret-2',
    at: '2026-07-12T12:00:00.000Z',
    usuario: 'Assistente',
    perfil: 'assistente',
    escolaId: '04.31.001',
    competencia: '2026-05',
    programaId: 'BASIC'
  }), /nenhuma alteração/i);
});

test('preserva estado anterior, registra depois e lista campos alterados', () => {
  const result = Retificacoes.applyRetification(verification, {
    bonificacao: { extINV: 'Sim' },
    resultadoBonif: 'APTA',
    justificativa: 'Documento apresentado dentro do prazo após revisão administrativa.'
  }, {
    id: 'ret-3',
    at: '2026-07-12T12:00:00.000Z',
    usuario: 'Assistente de Verbas Federais',
    perfil: 'assistente',
    escolaId: '04.31.001',
    competencia: '2026-05',
    programaId: 'BASIC'
  });

  assert.equal(result.verification.bonificacao.extINV, 'Sim');
  assert.equal(result.verification.analise.extINV, 'Incorreto');
  assert.equal(result.verification.resultadoBonif, 'APTA');
  assert.equal(result.retification.before.bonificacao.extINV, 'Não');
  assert.equal(result.retification.after.bonificacao.extINV, 'Sim');
  assert.deepEqual(result.retification.changedFields, ['bonificacao.extINV']);
  assert.equal(result.verification.retificacoes.length, 1);
});

test('não altera pendências nem análise técnica por efeito da retificação', () => {
  const withExtra = {
    ...verification,
    pendencias: ['pend-1'],
    analise: { ...verification.analise }
  };
  const result = Retificacoes.applyRetification(withExtra, {
    bonificacao: { extCC: 'Não' },
    justificativa: 'Correção de lançamento administrativo.'
  }, {
    id: 'ret-4',
    at: '2026-07-12T12:00:00.000Z',
    usuario: 'Assistente',
    perfil: 'assistente',
    escolaId: '04.31.001',
    competencia: '2026-05',
    programaId: 'BASIC'
  });

  assert.deepEqual(result.verification.analise, verification.analise);
  assert.deepEqual(result.verification.pendencias, ['pend-1']);
});
