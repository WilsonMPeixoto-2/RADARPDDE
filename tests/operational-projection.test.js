const test = require('node:test');
const assert = require('node:assert/strict');

const Projection = require('../src/domain/operational-projection.js');

const schools = [{
  id: '04.31.001',
  denominação: 'Escola Municipal Exemplo',
  designação: '04.31.001',
  ra: '31ª R.A.',
  controladorId: 'ctrl-1',
  programasIds: ['BASIC']
}];

const programs = [{ id: 'BASIC', name: 'PDDE Básico' }];
const controllers = [{ id: 'ctrl-1', name: 'Wilson Peixoto' }];

const pendencias = [
  {
    id: 'open-1',
    escolaId: '04.31.001',
    competenciaOrigem: '2026-05',
    programaId: 'BASIC',
    documentoKey: 'extCC',
    item: 'PDDE Básico - Extrato Conta Corrente',
    status: 'Aberta',
    errosAtuais: ['Documento ilegível'],
    dataAbertura: '2026-06-01',
    tentativas: [],
    historico: [{
      id: 'open-event',
      tipo: 'abertura',
      dataHora: '2026-06-01T10:00:00.000Z',
      usuario: 'Controlador',
      perfil: 'controlador',
      detalhe: 'Pendência aberta.'
    }]
  },
  {
    id: 'await-1',
    escolaId: '04.31.001',
    competenciaOrigem: '2026-05',
    programaId: 'BASIC',
    documentoKey: 'extINV',
    item: 'PDDE Básico - Extrato Investimento',
    status: 'Aguardando reanálise',
    errosAtuais: ['Sem assinatura'],
    dataAbertura: '2026-06-02',
    tentativas: [{
      id: 'attempt-1',
      numero: 1,
      status: 'aguardando',
      dataRegistro: '2026-07-10T12:00:00.000Z',
      dataDisponibilizacao: '2026-07-10',
      observacao: 'Arquivo assinado enviado.'
    }],
    historico: [{
      id: 'send-event',
      tipo: 'novo_envio',
      dataHora: '2026-07-10T12:00:00.000Z',
      usuario: 'Escola',
      perfil: 'escola',
      detalhe: 'Novo envio registrado.'
    }]
  }
];

const contatos = [{
  id: 'contact-1',
  pendenciaId: 'open-1',
  escolaId: '04.31.001',
  dataHora: '2026-07-11T09:00:00.000Z',
  tipo: 'Telefone',
  descricao: 'Direção orientada.',
  responsavel: 'Wilson Peixoto'
}];

function baseInput(overrides = {}) {
  return {
    escolas: schools,
    programas: programs,
    controladores: controllers,
    pendencias,
    contatos,
    competencia: '2026-05',
    now: '2026-07-12T12:00:00.000Z',
    getProgramBonificationStatus: () => 'apta',
    getProgramTechnicalStatus: () => 'incorreto',
    ...overrides
  };
}

test('separa abertas e aguardando reanálise sem duplicar o total ativo', () => {
  const model = Projection.buildOperationalProjection(baseInput());
  const school = model.schools[0];

  assert.equal(school.openCount, 1);
  assert.equal(school.awaitingCount, 1);
  assert.equal(school.activeCount, 2);
  assert.equal(model.totals.schoolsWithOpen, 1);
  assert.equal(model.totals.schoolsAwaitingReview, 1);
});

test('deriva próxima ação concreta do registro ativo mais antigo', () => {
  const model = Projection.buildOperationalProjection(baseInput());
  const school = model.schools[0];

  assert.equal(school.nextAction.label, 'Registrar novo envio do Extrato Conta Corrente');
  assert.equal(school.nextAction.actor, 'Escola');
  assert.equal(school.nextAction.pendencyId, 'open-1');
  assert.equal(school.nextAction.documentKey, 'extCC');
});

test('expõe todas as pendências ativas na fila global sem perder a ação principal da escola', () => {
  const model = Projection.buildOperationalProjection(baseInput());

  assert.equal(model.schools[0].nextAction.pendencyId, 'open-1');
  assert.deepEqual(
    model.actions.map(action => action.pendencyId).sort(),
    ['await-1', 'open-1']
  );
});

test('usa o último envio aguardando como data-base da reanálise', () => {
  const awaiting = Projection.getOperationalBaseDate(pendencias[1]);
  assert.equal(awaiting, '2026-07-10T12:00:00.000Z');

  const open = Projection.getOperationalBaseDate(pendencias[0]);
  assert.equal(open, '2026-06-01');
});

test('considera contato como última movimentação sem mudar o estado', () => {
  const model = Projection.buildOperationalProjection(baseInput());
  const school = model.schools[0];

  assert.equal(school.latestMovement.type, 'contato');
  assert.equal(school.latestMovement.at, '2026-07-11T09:00:00.000Z');
  assert.equal(school.openCount, 1);
  assert.equal(school.awaitingCount, 1);
});

test('mantém bonificação, situação técnica e pendências como dimensões independentes', () => {
  const model = Projection.buildOperationalProjection(baseInput());
  const school = model.schools[0];

  assert.equal(school.bonificationStatus, 'apta');
  assert.equal(school.technicalStatus, 'incorreto');
  assert.equal(school.documentaryStatus, 'Ação da escola e reanálise pendentes');
});

test('ordena ações pela maior espera e usa R.A. e designação como desempate', () => {
  const records = [
    { waitingDays: 5, priority: 1, ra: '31ª R.A.', schoolDesignation: '04.31.002' },
    { waitingDays: 12, priority: 2, ra: '31ª R.A.', schoolDesignation: '04.31.003' },
    { waitingDays: 12, priority: 2, ra: '10ª R.A.', schoolDesignation: '04.10.001' }
  ];

  assert.deepEqual(
    Projection.sortOperationalActions(records).map(item => item.schoolDesignation),
    ['04.10.001', '04.31.003', '04.31.002']
  );
});

test('índices da chamada preservam escola, competência e última movimentação sem alterar a entrada', () => {
  const input = baseInput({
    competencia: ' 2026-05 ',
    pendencias: [
      ...pendencias,
      { ...pendencias[0], id: 'other-school', escolaId: '04.10.002' },
      { ...pendencias[0], id: 'other-month', competenciaOrigem: '2026-06' }
    ],
    contatos: [...contatos, {
      id: 'newer-other-school', escolaId: '04.10.002', dataHora: '2026-07-12T10:00:00.000Z'
    }]
  });
  const before = JSON.stringify(input);
  const model = Projection.buildOperationalProjection(input);

  assert.deepEqual(model.schools[0], Projection.buildSchoolProjection({
    ...input, school: schools[0], competence: input.competencia
  }));
  assert.equal(model.totals.activePendencies, 2);
  assert.deepEqual(model.schools[0].activePendencies.map(item => item.id), ['open-1', 'await-1']);
  assert.equal(model.schools[0].latestMovement.at, contatos[0].dataHora);
  assert.equal(JSON.stringify(input), before);
});

test('recalcula após corrigir, acrescentar contato e excluir sem cache entre chamadas', () => {
  const input = baseInput({
    pendencias: structuredClone([pendencias[0]]), contatos: [],
    getProgramTechnicalStatus: () => 'correto'
  });
  assert.equal(Projection.buildOperationalProjection(input).schools[0].nextAction.actor, 'Escola');

  input.pendencias[0].status = 'Aguardando reanálise';
  input.pendencias[0].tentativas.push({
    id: 'new-send', status: 'aguardando', dataRegistro: '2026-07-11T12:00:00.000Z'
  });
  input.contatos.push({ escolaId: schools[0].id, dataHora: '2026-07-12T10:00:00.000Z', descricao: 'Novo contato.' });
  const corrected = Projection.buildOperationalProjection(input).schools[0];
  assert.equal(corrected.nextAction.actor, 'Controlador');
  assert.equal(corrected.nextAction.waitingDays, 1);
  assert.equal(corrected.latestMovement.detail, 'Novo contato.');

  input.pendencias.splice(0);
  input.contatos.splice(0);
  const removed = Projection.buildOperationalProjection(input).schools[0];
  assert.equal(removed.activeCount, 0);
  assert.equal(removed.latestMovement, null);
  assert.equal(removed.nextAction.label, 'Sem ação pendente');
});

test('desempate português conserva ordem estável de acentos e caixa com comparação numérica', () => {
  const records = [
    { id: 'ra-10', waitingDays: 2, priority: 1, ra: '10ª R.A.', schoolDesignation: 'Escola 1' },
    { id: 'school-10', waitingDays: 2, priority: 1, ra: '2ª R.A.', schoolDesignation: 'Escola 10' },
    { id: 'school-2', waitingDays: 2, priority: 1, ra: '2ª R.A.', schoolDesignation: 'Escola 2' },
    { id: 'accented-2', waitingDays: 2, priority: 1, ra: '2ª R.A.', schoolDesignation: 'ÉSCOLA 2' }
  ];
  const before = structuredClone(records);
  assert.deepEqual(Projection.sortOperationalActions(records).map(item => item.id), [
    'school-2', 'accented-2', 'school-10', 'ra-10'
  ]);
  assert.deepEqual(records, before);
});
