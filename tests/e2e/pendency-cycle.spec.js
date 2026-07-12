const { test, expect } = require('@playwright/test');

const DOCUMENT_CONTEXT = {
  programaId: 'ED_FAMILIA',
  documentoKey: 'extCC',
  documentoNome: 'Extrato Conta Corrente'
};

const PERSISTED_LOCAL_STORAGE_KEYS = [
  'radar_pdde_escolas',
  'radar_pdde_pendencias',
  'radar_pdde_contatos',
  'radar_pdde_logs',
  'radar_pdde_bens',
  'radar_pdde_verificacoes',
  'radar_pdde_config',
  'radar_pdde_programas',
  'radar_pdde_controladores',
  'radar_pdde_equipe_inventario',
  'radar_pdde_notas_registradas',
  'radar_pdde_data_version'
];

function targetDocumentRow(page) {
  return page.locator(
    `[data-program-id="${DOCUMENT_CONTEXT.programaId}"]`
      + `[data-document-key="${DOCUMENT_CONTEXT.documentoKey}"]`
  );
}

async function seedAwaitingReanalysis(page, options = {}) {
  return page.evaluate(({ target, seedOptions }) => {
    switchProfile('controlador');

    const competencia = seedOptions.competencia || activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes(target.programaId)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) {
      throw new Error('Escola determinística para reanálise não encontrada.');
    }

    const programa = programas.find(candidate => candidate.id === target.programaId);
    const programaNome = programa ? programa.name : target.programaId;
    const compProgKey = competencia + '_' + target.programaId;
    const unrelatedCompProgKey = competencia + '_BASIC';
    const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
      compProgKey,
      programaNome,
      documentoKey: target.documentoKey,
      documentoNome: target.documentoNome
    });

    pendencias = [];
    verificacoes[escola.id] = verificacoes[escola.id] || {};

    const verification = RadarFluxoOperacional.createEmptyVerification();
    verification.bonificacao = seedOptions.bonusResult === 'apta'
      ? {
          extCC: 'Sim',
          extINV: 'Sim',
          notaFiscal: 'Não se aplica',
          consAssessoria: 'Não se aplica',
          declBBAgil: 'Sim',
          encampInventario: 'Não se aplica'
        }
      : {
          extCC: 'Sim',
          extINV: 'Não',
          notaFiscal: 'Não se aplica',
          consAssessoria: 'Sim',
          declBBAgil: 'Sim',
          encampInventario: 'Não se aplica'
        };
    if (seedOptions.completeTechnicalAnalysis) {
      Object.keys(verification.analise).forEach(key => {
        verification.analise[key] = 'Correto';
      });
    } else {
      verification.analise.extINV = 'Correto';
    }
    verification.analise[target.documentoKey] = 'Não analisado';
    verification.resultadoBonif = seedOptions.bonusResult || 'inapta';
    verificacoes[escola.id][compProgKey] = verification;

    const unrelatedVerification = RadarFluxoOperacional.createEmptyVerification();
    unrelatedVerification.bonificacao.extCC = 'Sim';
    unrelatedVerification.analise.extCC = 'Correto';
    unrelatedVerification.resultadoBonif = 'apta';
    verificacoes[escola.id][unrelatedCompProgKey] = unrelatedVerification;

    const opened = RadarPendencias.createDocumentPendency({
      id: seedOptions.pendencyId || 'pend-e2e-reanalise',
      escolaId: escola.id,
      competenciaOrigem: competencia,
      programaId: target.programaId,
      documentoKey: target.documentoKey,
      item: pendencyContext.item,
      errosAtuais: ['Documento ilegível', 'Competência incorreta'],
      observacao: 'Erros originais preservados no histórico.',
      dataAbertura: '2026-06-01'
    }, {
      eventId: (seedOptions.pendencyId || 'pend-e2e-reanalise') + '-abertura',
      at: '2026-06-01T12:00:00.000Z',
      usuario: 'Controladora E2E',
      perfil: 'Controlador'
    });
    const awaiting = RadarPendencias.registerCorrectiveSubmission(opened, {
      id: (seedOptions.pendencyId || 'pend-e2e-reanalise') + '-tentativa',
      dataDisponibilizacao: seedOptions.availabilityDate || '2026-06-10',
      observacao: seedOptions.submissionObservation
        || 'Arquivo corrigido disponibilizado para conferência.',
      link: Object.prototype.hasOwnProperty.call(seedOptions, 'link')
        ? seedOptions.link
        : 'https://drive.google.com/file/d/reanalise-e2e/view'
    }, {
      eventId: (seedOptions.pendencyId || 'pend-e2e-reanalise') + '-envio',
      at: '2026-06-10T12:00:00.000Z',
      usuario: 'Escola E2E',
      perfil: 'Escola'
    });

    pendencias.push(awaiting);
    rebuildOperationalIndexes();
    persist();
    if (seedOptions.view === 'prontuario') {
      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
    } else {
      switchView('pendencias');
    }

    return {
      pendencyId: awaiting.id,
      escolaId: escola.id,
      escolaNome: escola.denominação,
      competencia,
      compProgKey,
      unrelatedCompProgKey,
      programaId: target.programaId,
      programaNome,
      documentoKey: target.documentoKey,
      documentoNome: target.documentoNome,
      availabilityDate: awaiting.tentativas.at(-1).dataDisponibilizacao,
      submissionObservation: awaiting.tentativas.at(-1).observacao,
      submissionLink: awaiting.tentativas.at(-1).link,
      user: getCurrentUser(),
      oldHistory: JSON.parse(JSON.stringify(awaiting.historico)),
      verificationBefore: JSON.parse(JSON.stringify(verification)),
      unrelatedBefore: JSON.parse(JSON.stringify(unrelatedVerification)),
      reanalysisLogsBefore: logs.filter(log => log.acao === 'Reanálise registrada').length
    };
  }, { target: DOCUMENT_CONTEXT, seedOptions: options });
}

// Full file content omitted in this tool call due to transport constraints.
