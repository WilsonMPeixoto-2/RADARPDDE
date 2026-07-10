const test = require('node:test');
const assert = require('node:assert/strict');
const Jornada = require('../src/domain/jornada-operacional.js');

const DOCS = [
  { key: 'extCC', label: 'Extrato Conta Corrente' },
  { key: 'extINV', label: 'Extrato Investimento' },
  { key: 'notaFiscal', label: 'Notas Fiscais' },
  { key: 'consAssessoria', label: 'Consulta Assessoria' },
  { key: 'declBBAgil', label: 'Declaração BB Ágil' },
  { key: 'encampInventario', label: 'Encaminhado para Inventariação' }
];

function emptyVerification() {
  return {
    bonificacao: Object.fromEntries(DOCS.map(doc => [doc.key, ''])),
    analise: Object.fromEntries(DOCS.map(doc => [doc.key, 'Não analisado'])),
    resultadoBonif: ''
  };
}

test('classifica programa sem qualquer registro como não iniciado', () => {
  const summary = Jornada.getProgramOperationalSummary({
    escolaId: 'e1',
    competenciaKey: '2026-06',
    programa: { id: 'BASIC', name: 'PDDE Básico' },
    verificacao: undefined,
    pendencias: [],
    documentos: DOCS,
    inScope: true
  });

  assert.equal(summary.state, 'nao-iniciado');
  assert.equal(summary.nextAction.label, 'Iniciar análise do PDDE Básico');
});

test('pendência aberta prevalece como estado operacional do programa', () => {
  const verification = emptyVerification();
  verification.bonificacao.extCC = 'Sim';
  verification.analise.extCC = 'Incorreto';

  const summary = Jornada.getProgramOperationalSummary({
    escolaId: 'e1',
    competenciaKey: '2026-06',
    programa: { id: 'ED_FAMILIA', name: 'Educação e Família' },
    verificacao: verification,
    pendencias: [{
      id: 'p1',
      escolaId: 'e1',
      competencia: '2026-06',
      programaId: 'ED_FAMILIA',
      documentoKey: 'extCC',
      item: 'Educação e Família - Extrato Conta Corrente',
      status: 'Aberta',
      dataAbertura: '2026-07-01'
    }],
    documentos: DOCS,
    inScope: true
  });

  assert.equal(summary.state, 'com-pendencia');
  assert.equal(summary.openPendencies, 1);
  assert.equal(summary.nextAction.label, 'Aguardar regularização de Extrato Conta Corrente');
});

test('pendência resolvida com análise reiniciada gera aguardando reanálise', () => {
  const verification = emptyVerification();
  verification.bonificacao.extCC = 'Sim';
  verification.analise.extCC = 'Não analisado';

  const summary = Jornada.getProgramOperationalSummary({
    escolaId: 'e1',
    competenciaKey: '2026-06',
    programa: { id: 'ED_FAMILIA', name: 'Educação e Família' },
    verificacao: verification,
    pendencias: [{
      id: 'p1',
      escolaId: 'e1',
      competencia: '2026-06',
      programaId: 'ED_FAMILIA',
      documentoKey: 'extCC',
      item: 'Educação e Família - Extrato Conta Corrente',
      status: 'Resolvida',
      dataAbertura: '2026-07-01',
      dataResolucao: '2026-07-05'
    }],
    documentos: DOCS,
    inScope: true
  });

  assert.equal(summary.state, 'aguardando-reanalise');
  assert.equal(summary.awaitingReanalysis, 1);
  assert.equal(summary.nextAction.label, 'Reanalisar Extrato Conta Corrente');
  assert.equal(summary.nextAction.documentoKey, 'extCC');
});

test('documento incorreto sem pendência gera ação de formalização', () => {
  const verification = emptyVerification();
  verification.bonificacao.extINV = 'Sim';
  verification.analise.extINV = 'Incorreto';

  const summary = Jornada.getProgramOperationalSummary({
    escolaId: 'e1',
    competenciaKey: '2026-06',
    programa: { id: 'BASIC', name: 'PDDE Básico' },
    verificacao: verification,
    pendencias: [],
    documentos: DOCS,
    inScope: true
  });

  assert.equal(summary.state, 'inapto');
  assert.equal(summary.nextAction.label, 'Abrir pendência para Extrato Investimento');
});

test('análises corretas sem consolidação geram ação de consolidar', () => {
  const verification = emptyVerification();
  for (const doc of DOCS) {
    verification.bonificacao[doc.key] = doc.key === 'consAssessoria' ? 'Não se aplica' : 'Sim';
    verification.analise[doc.key] = 'Correto';
  }

  const summary = Jornada.getProgramOperationalSummary({
    escolaId: 'e1',
    competenciaKey: '2026-06',
    programa: { id: 'BASIC', name: 'PDDE Básico' },
    verificacao: verification,
    pendencias: [],
    documentos: DOCS,
    inScope: true
  });

  assert.equal(summary.state, 'em-analise');
  assert.equal(summary.readyToConsolidate, true);
  assert.equal(summary.nextAction.label, 'Consolidar PDDE Básico');
});

test('agregação da escola conta cada escola em uma única fila', () => {
  const summaries = [
    { state: 'apto', nextAction: { priority: 99, label: 'Nenhuma ação pendente' }, openPendencies: 0, awaitingReanalysis: 0 },
    { state: 'aguardando-reanalise', nextAction: { priority: 1, label: 'Reanalisar documento' }, openPendencies: 0, awaitingReanalysis: 1 },
    { state: 'em-analise', nextAction: { priority: 4, label: 'Concluir análise' }, openPendencies: 0, awaitingReanalysis: 0 }
  ];

  const school = Jornada.aggregateSchoolOperationalSummary({
    escola: { id: 'e1', designação: '04.31.501', denominação: 'E.M. Exemplo' },
    programSummaries: summaries,
    pendencias: []
  });

  assert.equal(school.state, 'aguardando-reanalise');
  assert.equal(school.nextAction.label, 'Reanalisar documento');
});

test('filas operacionais apresentam as cinco categorias do dashboard', () => {
  const schools = [
    { state: 'nao-iniciado' },
    { state: 'em-analise' },
    { state: 'com-pendencia' },
    { state: 'aguardando-reanalise' },
    { state: 'apto' },
    { state: 'inapto' }
  ];

  const queues = Jornada.buildWorkQueues(schools);

  assert.deepEqual(queues, {
    'nao-iniciado': 1,
    'em-analise': 1,
    'com-pendencia': 1,
    'aguardando-reanalise': 1,
    concluido: 2
  });
});

test('pendência escolar não estruturada continua visível sem duplicar programas', () => {
  const school = Jornada.aggregateSchoolOperationalSummary({
    escola: { id: 'e1', designação: '04.31.501', denominação: 'E.M. Exemplo' },
    programSummaries: [{
      state: 'nao-iniciado',
      nextAction: { priority: 5, label: 'Iniciar análise do PDDE Básico' },
      openPendencies: 0,
      awaitingReanalysis: 0
    }],
    pendencias: [{
      id: 'p-legada',
      escolaId: 'e1',
      competencia: '2026-06',
      item: 'Documento geral',
      status: 'Aberta',
      dataAbertura: '2026-07-01'
    }]
  });

  assert.equal(school.state, 'com-pendencia');
  assert.equal(school.openPendencies, 1);
  assert.equal(school.nextAction.label, 'Aguardar regularização de Documento geral');
});