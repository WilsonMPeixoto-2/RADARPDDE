const test = require('node:test');
const assert = require('node:assert/strict');

const ViewModel = require('../src/domain/pendencias-view-model.js');

const SCHOOLS = [
  {
    id: '04.31.001',
    denominação: 'Escola Municipal Educação e Família',
    designação: '04.31.001',
    ra: '31ª R.A.',
    controladorId: 'ctrl-1'
  },
  {
    id: '04.10.002',
    denominação: 'Escola Municipal Ruy Barbosa',
    designação: '04.10.002',
    ra: '10ª R.A.',
    controladorId: 'ctrl-2'
  }
];

const PROGRAMS = [
  { id: 'BASIC', name: 'PDDE Básico' },
  { id: 'ED_FAMILIA', name: 'Educação e Família' }
];

const CONTROLLERS = [
  { id: 'ctrl-1', name: 'Wilson Peixoto' },
  { id: 'ctrl-2', name: 'Mônica Chagas' }
];

const CONTACTS = [
  {
    id: 'contato-1',
    pendenciaId: 'pend-open-old',
    escolaId: '04.31.001',
    data: '2026-07-08',
    tipo: 'WhatsApp',
    descricao: 'Direção orientada sobre o extrato.',
    responsavel: 'Wilson Peixoto'
  },
  {
    id: 'contato-2',
    pendenciaId: 'pend-awaiting',
    escolaId: '04.31.001',
    data: '2026-07-11',
    tipo: 'Telefone',
    descricao: 'Novo arquivo confirmado pela escola.',
    responsavel: 'Wilson Peixoto'
  }
];

const PENDENCIES = [
  {
    schemaVersion: 2,
    id: 'pend-open-old',
    tipo: 'documental',
    escolaId: '04.31.001',
    competencia: '2026-05',
    competenciaOrigem: '2026-05',
    programaId: 'ED_FAMILIA',
    documentoKey: 'extCC',
    item: 'Educação e Família - Extrato Conta Corrente',
    status: 'Aberta',
    errosAtuais: ['Documento ilegível', 'Competência incorreta', 'Sem assinatura'],
    motivo: 'Documento ilegível',
    observacao: 'Extrato sem condições de leitura.',
    responsavel: 'Escola',
    dataAbertura: '2026-06-01',
    dataResolucao: null,
    tentativas: [],
    historico: [
      {
        id: 'evt-open-old',
        tipo: 'abertura',
        dataHora: '2026-06-01T12:00:00.000Z',
        usuario: 'Wilson Peixoto',
        perfil: 'Controlador',
        detalhe: 'Pendência documental aberta.',
        erros: ['Documento ilegível', 'Competência incorreta', 'Sem assinatura'],
        tentativaId: null
      }
    ],
    cancelamento: null,
    contextoIncompleto: false
  },
  {
    schemaVersion: 2,
    id: 'pend-open-new',
    tipo: 'documental',
    escolaId: '04.10.002',
    competencia: '2026-06',
    competenciaOrigem: '2026-06',
    programaId: 'BASIC',
    documentoKey: 'extINV',
    item: 'PDDE Básico - Extrato Investimento',
    status: 'Aberta',
    errosAtuais: ['Documento incompleto'],
    motivo: 'Documento incompleto',
    observacao: 'Falta a página final.',
    responsavel: 'Escola',
    dataAbertura: '2026-07-01',
    tentativas: [],
    historico: [],
    cancelamento: null,
    contextoIncompleto: false
  },
  {
    schemaVersion: 2,
    id: 'pend-awaiting',
    tipo: 'documental',
    escolaId: '04.31.001',
    competencia: '2026-05',
    competenciaOrigem: '2026-05',
    programaId: 'ED_FAMILIA',
    documentoKey: 'declBBAgil',
    item: 'Educação e Família - Declaração BB Ágil',
    status: 'Aguardando reanálise',
    errosAtuais: ['Sem assinatura'],
    motivo: 'Sem assinatura',
    observacao: 'Declaração sem assinatura da direção.',
    responsavel: 'Controlador',
    dataAbertura: '2026-06-05',
    dataResolucao: null,
    tentativas: [
      {
        id: 'tent-1',
        numero: 1,
        dataDisponibilizacao: '2026-07-10',
        dataRegistro: '2026-07-10T14:00:00.000Z',
        observacao: 'Arquivo assinado enviado.',
        link: 'https://drive.google.com/file/d/exemplo/view',
        registradoPor: 'Escola',
        status: 'aguardando',
        dataAnalise: null,
        analisadoPor: null,
        resultado: null,
        errosEncontrados: [],
        observacaoAnalise: null
      }
    ],
    historico: [
      {
        id: 'evt-await-open',
        tipo: 'abertura',
        dataHora: '2026-06-05T10:00:00.000Z',
        usuario: 'Wilson Peixoto',
        perfil: 'Controlador',
        detalhe: 'Pendência documental aberta.',
        erros: ['Sem assinatura'],
        tentativaId: null
      },
      {
        id: 'evt-await-send',
        tipo: 'novo_envio',
        dataHora: '2026-07-10T14:00:00.000Z',
        usuario: 'Escola',
        perfil: 'Escola',
        detalhe: 'Novo envio corretivo registrado para reanálise.',
        erros: ['Sem assinatura'],
        tentativaId: 'tent-1'
      }
    ],
    cancelamento: null,
    contextoIncompleto: false
  },
  {
    schemaVersion: 2,
    id: 'pend-resolved',
    tipo: 'documental',
    escolaId: '04.10.002',
    competencia: '2026-04',
    competenciaOrigem: '2026-04',
    programaId: 'BASIC',
    documentoKey: 'extCC',
    item: 'PDDE Básico - Extrato Conta Corrente',
    status: 'Resolvida',
    errosAtuais: [],
    motivo: null,
    observacao: 'Extrato inicialmente ilegível.',
    responsavel: null,
    dataAbertura: '2026-05-01',
    dataResolucao: '2026-07-09',
    tentativas: [],
    historico: [
      {
        id: 'evt-resolved',
        tipo: 'reanalise_correta',
        dataHora: '2026-07-09T16:00:00.000Z',
        usuario: 'Mônica Chagas',
        perfil: 'Controlador',
        detalhe: 'Reanálise confirmou a correção do documento.',
        erros: [],
        tentativaId: 'tent-resolved'
      }
    ],
    cancelamento: null,
    contextoIncompleto: false
  },
  {
    schemaVersion: 2,
    id: 'pend-cancelled',
    tipo: 'documental',
    escolaId: '04.31.001',
    competencia: '2026-03',
    competenciaOrigem: '2026-03',
    programaId: 'ED_FAMILIA',
    documentoKey: 'notaFiscal',
    item: 'Educação e Família - Notas Fiscais',
    status: 'Cancelada',
    errosAtuais: ['Dados divergentes'],
    motivo: 'Dados divergentes',
    observacao: 'Registro criado no documento errado.',
    responsavel: null,
    dataAbertura: '2026-05-05',
    dataResolucao: null,
    tentativas: [],
    historico: [
      {
        id: 'evt-cancelled',
        tipo: 'cancelamento',
        dataHora: '2026-07-08T09:00:00.000Z',
        usuario: 'Wilson Peixoto',
        perfil: 'Controlador',
        detalhe: 'Pendência cancelada: documento incorreto.',
        erros: ['Dados divergentes'],
        tentativaId: null
      }
    ],
    cancelamento: {
      justificativa: 'Registro criado no documento errado.',
      dataHora: '2026-07-08T09:00:00.000Z',
      usuario: 'Wilson Peixoto',
      perfil: 'Controlador'
    },
    contextoIncompleto: false
  },
  {
    id: 'legacy-incomplete',
    escolaId: '04.31.001',
    competencia: '2026-02',
    item: 'Documento legado',
    motivo: 'Arquivo incompatível',
    observacao: 'Sem programa e documento estruturados.',
    status: 'Aberta',
    responsavel: 'Escola',
    dataAbertura: '2026-04-01',
    contextoIncompleto: true
  }
];

function baseInput(overrides = {}) {
  return {
    pendencias: PENDENCIES,
    escolas: SCHOOLS,
    programas: PROGRAMS,
    controladores: CONTROLLERS,
    contatos: CONTACTS,
    now: '2026-07-12T12:00:00.000Z',
    filters: {},
    ...overrides
  };
}

test('normaliza busca sem acentos, caixa ou espaços excedentes', () => {
  assert.equal(
    ViewModel.normalizeSearchText('  Educação e Família  '),
    'educacao e familia'
  );
});

test('compõe registro documental com contexto e próxima ação derivados', () => {
  const records = ViewModel.buildPendencyRecords(baseInput());
  const record = records.find(item => item.id === 'pend-open-old');

  assert.equal(record.schoolName, 'Escola Municipal Educação e Família');
  assert.equal(record.schoolDesignation, '04.31.001');
  assert.equal(record.programName, 'Educação e Família');
  assert.equal(record.documentName, 'Extrato Conta Corrente');
  assert.equal(record.controllerName, 'Wilson Peixoto');
  assert.equal(record.nextActor, 'Escola');
  assert.equal(record.nextAction, 'Entregar ou corrigir o documento');
  assert.equal(record.ageDays, 41);
  assert.equal(record.attemptCount, 0);
  assert.deepEqual(record.errors, ['Documento ilegível', 'Competência incorreta', 'Sem assinatura']);
});

test('preserva registro legado incompleto sem inventar programa ou documento', () => {
  const records = ViewModel.buildPendencyRecords(baseInput());
  const record = records.find(item => item.id === 'legacy-incomplete');

  assert.equal(record.contextIncomplete, true);
  assert.equal(record.programName, 'Programa não identificado');
  assert.equal(record.documentName, 'Documento legado');
  assert.equal(record.nextActor, 'Escola');
});

test('busca global ignora acentos e pesquisa contexto, erro e controlador', () => {
  const records = ViewModel.buildPendencyRecords(baseInput());

  assert.deepEqual(
    ViewModel.applyPendencyFilters(records, { query: 'educacao familia' }).map(item => item.id),
    ['pend-open-old', 'pend-awaiting', 'pend-cancelled', 'legacy-incomplete']
  );
  assert.deepEqual(
    ViewModel.applyPendencyFilters(records, { query: 'competencia incorreta' }).map(item => item.id),
    ['pend-open-old']
  );
  assert.deepEqual(
    ViewModel.applyPendencyFilters(records, { query: 'monica chagas' }).map(item => item.id),
    ['pend-open-new', 'pend-resolved']
  );
});

test('aplica filtros combinados por competência, programa, responsável e antiguidade', () => {
  const records = ViewModel.buildPendencyRecords(baseInput());
  const filtered = ViewModel.applyPendencyFilters(records, {
    competence: '2026-05',
    programId: 'ED_FAMILIA',
    nextActor: 'Escola',
    controllerId: 'ctrl-1',
    age: '30-plus'
  });

  assert.deepEqual(filtered.map(item => item.id), ['pend-open-old']);
});

test('agrupa os quatro estados e mantém abertas e aguardando como ativas', () => {
  const records = ViewModel.buildPendencyRecords(baseInput());
  const groups = ViewModel.groupPendencyRecords(records);

  assert.deepEqual(groups.aberta.map(item => item.id), [
    'legacy-incomplete',
    'pend-open-old',
    'pend-open-new'
  ]);
  assert.deepEqual(groups.aguardando.map(item => item.id), ['pend-awaiting']);
  assert.deepEqual(groups.resolvida.map(item => item.id), ['pend-resolved']);
  assert.deepEqual(groups.cancelada.map(item => item.id), ['pend-cancelled']);
  assert.equal(groups.aberta.length + groups.aguardando.length, 4);
});

test('ordena aguardando pelo envio pendente mais antigo e históricos pelos eventos mais recentes', () => {
  const extraAwaiting = {
    ...PENDENCIES.find(item => item.id === 'pend-awaiting'),
    id: 'pend-awaiting-newer',
    tentativas: [{
      ...PENDENCIES.find(item => item.id === 'pend-awaiting').tentativas[0],
      id: 'tent-newer',
      dataRegistro: '2026-07-11T10:00:00.000Z'
    }]
  };
  const records = ViewModel.buildPendencyRecords(baseInput({
    pendencias: [...PENDENCIES, extraAwaiting]
  }));

  assert.deepEqual(
    ViewModel.sortPendencyRecords(
      records.filter(item => item.status === 'Aguardando reanálise'),
      'Aguardando reanálise'
    ).map(item => item.id),
    ['pend-awaiting', 'pend-awaiting-newer']
  );
});

test('combina histórico e contatos na timeline da movimentação mais recente para a mais antiga', () => {
  const records = ViewModel.buildPendencyRecords(baseInput());
  const record = records.find(item => item.id === 'pend-awaiting');
  const timeline = ViewModel.buildPendencyTimeline(record);

  assert.deepEqual(timeline.map(item => item.type), [
    'contact',
    'novo_envio',
    'abertura'
  ]);
  assert.equal(timeline[1].attemptId, 'tent-1');
  assert.equal(timeline[2].user, 'Wilson Peixoto');
});

test('cria modelo de página com totais e contagens filtradas por aba', () => {
  const model = ViewModel.createPendencyPageModel(baseInput({
    filters: { query: 'educacao familia' }
  }));

  assert.deepEqual(model.groups.aberta.counts, { filtered: 2, total: 3 });
  assert.deepEqual(model.groups.aguardando.counts, { filtered: 1, total: 1 });
  assert.deepEqual(model.groups.resolvida.counts, { filtered: 0, total: 1 });
  assert.deepEqual(model.groups.cancelada.counts, { filtered: 1, total: 1 });
  assert.equal(model.activeTotal, 4);
  assert.equal(model.filteredTotal, 4);
});
