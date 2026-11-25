'use strict';

// Counts/status mix from operational-production-shape.sql; all identities and dates
// below are generated. This is an in-memory CPU workload, not a production snapshot.
const NOW = '2026-10-05T12:00:00.000Z';
const STATUS_COUNTS = [
  [28, 2, 4, 1], [23, 1, 3, 1], [25, 1, 3, 1], [24, 1, 3, 1],
  [25, 1, 4, 1], [31, 1, 4, 1], [37, 1, 4, 1], [80, 12, 19, 4],
  [11, 1, 5, 0], [0, 1, 0, 0]
];
const STATUSES = ['Aberta', 'Aguardando reanálise', 'Resolvida', 'Cancelada'];

function daysAgo(days) {
  return new Date(Date.parse(NOW) - days * 86400000).toISOString();
}

function createOperationalProjectionVolume(scale = 1) {
  if (!Number.isInteger(scale) || scale < 1) throw new Error('Scale must be a positive integer.');
  const escolas = Array.from({ length: 163 * scale }, (_, index) => ({
    id: `school-${index}`,
    denominação: `Escola Sintética ${index + 1}`,
    designação: `04.${String(index % 8 + 1).padStart(2, '0')}.${String(index + 1).padStart(3, '0')}`,
    ra: `${index % 8 + 1}ª R.A.`,
    controladorId: `ctrl-${index % 4}`,
    programasIds: index % 163 < 104 ? ['BASIC', 'P2', 'P3'] : ['BASIC', 'P2']
  }));
  const programas = [
    { id: 'BASIC', name: 'PDDE Básico' },
    { id: 'P2', name: 'Educação e Família' },
    { id: 'P3', name: 'Leitura' }
  ];
  const controladores = Array.from({ length: 4 }, (_, index) => ({
    id: `ctrl-${index}`, name: `Controlador Sintético ${index + 1}`
  }));
  const pendencias = [];
  for (let copy = 0; copy < scale; copy += 1) {
    STATUS_COUNTS.forEach((counts, month) => {
      let withinMonth = 0;
      counts.forEach((count, statusIndex) => {
        for (let row = 0; row < count; row += 1) {
          const index = pendencias.length;
          const escolaId = escolas[copy * 163 + (withinMonth * 17 + month * 11) % 163].id;
          withinMonth += 1;
          const openedAt = daysAgo(withinMonth + 30);
          pendencias.push({
            id: `p-${index}`, escolaId,
            competenciaOrigem: `2026-${String(month + 1).padStart(2, '0')}`,
            programaId: programas[withinMonth % 3].id,
            documentoKey: withinMonth % 2 ? 'notaFiscal' : 'extCC',
            item: withinMonth % 2 ? `NF: ${withinMonth}` : 'Extrato Conta Corrente',
            status: STATUSES[statusIndex],
            errosAtuais: ['Documento incompleto'],
            observacao: 'Massa sintética de medição em memória.',
            dataAbertura: openedAt,
            dataResolucao: statusIndex === 2 ? daysAgo(1) : null,
            cancelamento: statusIndex === 3
              ? { dataHora: daysAgo(1), justificativa: 'Massa sintética.' } : null,
            tentativas: statusIndex === 1 ? [{
              id: `a-${index}`, status: 'aguardando',
              dataRegistro: daysAgo(withinMonth % 9 + 1),
              dataDisponibilizacao: daysAgo(withinMonth % 9 + 2)
            }] : [],
            historico: [{ id: `h-${index}`, tipo: 'abertura', dataHora: openedAt, detalhe: 'Pendência sintética.' }]
          });
        }
      });
    });
  }
  let remainingAttempts = 83 * scale - pendencias.reduce((sum, item) => sum + item.tentativas.length, 0);
  for (const pendency of pendencias) {
    if (remainingAttempts > 0 && pendency.tentativas.length === 0) {
      pendency.tentativas.push({
        id: `a-${pendency.id}`, status: 'incorreto', resultado: 'incorreto',
        dataRegistro: daysAgo(12), dataAnalise: daysAgo(10)
      });
      remainingAttempts -= 1;
    }
  }
  const contatos = Array.from({ length: 99 * scale }, (_, index) => {
    const pendency = pendencias[index * 7 % pendencias.length];
    return {
      id: `c-${index}`, escolaId: pendency.escolaId, pendenciaId: pendency.id,
      dataHora: daysAgo(index % 10), tipo: 'Telefone', descricao: 'Contato sintético de medição.'
    };
  });
  return {
    escolas, programas, controladores, pendencias, contatos, now: NOW,
    getProgramBonificationStatus: () => 'nao-lancada',
    getProgramTechnicalStatus: () => 'nao-analisado'
  };
}

module.exports = { createOperationalProjectionVolume };
