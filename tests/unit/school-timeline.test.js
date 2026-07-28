'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const timeline = require('../../src/domain/school-timeline.js');

function fixture() {
  return {
    schoolId: 'school-1',
    competenceKey: '2026-08',
    programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
    verifications: {
      'school-1': {
        '2026-08_BASIC': {
          resultadoBonif: 'apta',
          consolidatedAt: '2026-08-31T17:00:00.000Z',
          updatedByName: 'Controlador A'
        }
      }
    },
    pendencies: [{
      id: 'pendency-1',
      escolaId: 'school-1',
      competenciaOrigem: '2026-08',
      programaId: 'BASIC',
      documentoKey: 'extCC',
      item: 'Extrato Conta Corrente',
      status: 'Resolvida',
      dataAbertura: '2026-08-10T10:00:00.000Z',
      dataResolucao: '2026-08-20T15:00:00.000Z',
      justificativaResolucao: 'Documento correto.',
      historico: [{
        id: 'history-open-1',
        tipo: 'abertura',
        dataHora: '2026-08-10T10:00:00.000Z',
        detalhe: 'Pendência aberta.',
        usuario: 'Controlador A'
      }],
      tentativas: [{
        id: 'attempt-1',
        status: 'analisada',
        resultado: 'correto',
        dataRegistro: '2026-08-19T11:00:00.000Z',
        dataAnalise: '2026-08-20T14:30:00.000Z',
        observacao: 'Novo arquivo conferido.',
        analisadoPorNome: 'Controlador B'
      }]
    }],
    contacts: [{
      id: 'contact-1',
      escolaId: 'school-1',
      pendenciaId: 'pendency-1',
      tipo: 'Telefone',
      dataHora: '2026-08-15T12:00:00.000Z',
      descricao: 'Orientação prestada à direção.',
      responsavel: 'Controlador A'
    }],
    invoices: [{
      id: 'invoice-1',
      escolaId: 'school-1',
      compKey: '2026-08_BASIC',
      numero: 'NF-100',
      desc: 'Material pedagógico',
      dataRegistro: '2026-08-12T09:00:00.000Z'
    }],
    assets: [{
      id: 'asset-1',
      escolaId: 'school-1',
      competencia: '2026-08',
      item: 'Projetor',
      status: 'Inventariado',
      dataRegistro: '2026-08-13T09:00:00.000Z',
      dataInventariacao: '2026-08-25T16:00:00.000Z',
      responsavelInventario: 'Inventariador A'
    }],
    logs: [{
      id: 'log-1',
      escolaId: 'school-1',
      acao: 'Bonificação Consolidada',
      detalhes: 'Consolidação registrada.',
      dataHora: '2026-08-31T17:00:00.000Z',
      usuario: 'Controlador A',
      perfil: 'Controlador'
    }]
  };
}

test('ordena eventos do mais recente para o mais antigo com desempate estável', () => {
  assert.equal(typeof timeline.buildSchoolTimeline, 'function');
  const events = timeline.buildSchoolTimeline({ ...fixture(), accessProfile: 'controlador' });

  assert.ok(events.length >= 7);
  for (let index = 1; index < events.length; index += 1) {
    assert.ok(
      new Date(events[index - 1].occurredAt).getTime()
        >= new Date(events[index].occurredAt).getTime()
    );
  }
  assert.equal(events[0].occurredAt, '2026-08-31T17:00:00.000Z');
  assert.ok(events[0].id < events[1].id, 'o desempate deve usar id estável');
});

test('não duplica a abertura presente na pendência e no histórico incorporado', () => {
  const events = timeline.buildSchoolTimeline({ ...fixture(), accessProfile: 'controlador' });
  const openings = events.filter(event => (
    event.type === 'pendency_opened' && event.pendencyId === 'pendency-1'
  ));

  assert.equal(openings.length, 1);
  assert.equal(openings[0].sourceEntity, 'pendencies');
});

test('preserva tentativa, contato, nota, inventariação e consolidação com seus vínculos', () => {
  const events = timeline.buildSchoolTimeline({ ...fixture(), accessProfile: 'controlador' });
  const types = new Set(events.map(event => event.type));

  for (const expected of [
    'verification_consolidated',
    'pendency_attempt_reviewed',
    'pendency_contact',
    'invoice_registered',
    'asset_inventoried',
    'pendency_resolved'
  ]) {
    assert.equal(types.has(expected), true, `evento ausente: ${expected}`);
  }
  assert.equal(
    events.find(event => event.type === 'pendency_contact').pendencyId,
    'pendency-1'
  );
  assert.equal(
    events.find(event => event.type === 'invoice_registered').competenceKey,
    '2026-08'
  );
});

test('aplica competência e escola sem misturar eventos de outros contextos', () => {
  const input = fixture();
  input.contacts.push({
    id: 'contact-other-school',
    escolaId: 'school-2',
    dataHora: '2026-08-30T12:00:00.000Z',
    descricao: 'Outro contexto.'
  });
  input.invoices.push({
    id: 'invoice-other-month',
    escolaId: 'school-1',
    compKey: '2026-07_BASIC',
    dataRegistro: '2026-08-30T12:00:00.000Z'
  });

  const events = timeline.buildSchoolTimeline({ ...input, accessProfile: 'controlador' });
  assert.equal(events.some(event => event.sourceId === 'contact-other-school'), false);
  assert.equal(events.some(event => event.sourceId === 'invoice-other-month'), false);
});

test('Gestão SME recebe eventos gerenciais sem detalhes técnicos restritos', () => {
  const input = fixture();
  input.logs.push({
    id: 'log-technical',
    escolaId: 'school-1',
    acao: 'Análise Técnica Alterada',
    detalhes: 'Documento marcado como incorreto.',
    dataHora: '2026-08-18T13:00:00.000Z',
    usuario: 'Controlador A'
  });

  const events = timeline.buildSchoolTimeline({ ...input, accessProfile: 'sme' });
  assert.equal(events.some(event => event.sourceId === 'log-technical'), false);
  assert.equal(events.some(event => event.type === 'verification_consolidated'), true);
  assert.equal(events.some(event => event.type === 'pendency_contact'), true);
});

test('cada evento expõe contrato completo e serializável', () => {
  const events = timeline.buildSchoolTimeline({ ...fixture(), accessProfile: 'controlador' });
  const required = [
    'id', 'occurredAt', 'type', 'title', 'description', 'actor', 'status',
    'competenceKey', 'programId', 'pendencyId', 'visibility', 'sourceEntity', 'sourceId'
  ];

  events.forEach(event => {
    required.forEach(key => assert.ok(Object.hasOwn(event, key), `${key} ausente`));
    assert.doesNotThrow(() => JSON.stringify(event));
  });
});
