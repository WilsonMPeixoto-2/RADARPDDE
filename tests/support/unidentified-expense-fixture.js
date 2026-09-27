'use strict';

const { selectFixtureCompetence } = require('./e2e-competence');

async function prepareSchool(page, { withOpenUnidentified = false } = {}) {
  await page.goto('/');
  await selectFixtureCompetence(page, '2026-05');

  return page.evaluate(async ({ seedOpen }) => {
    switchProfile('controlador');
    const competence = window.RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    if (!school) throw new Error('Escola de fixture não encontrada.');

    const compKey = competence + '_BASIC';
    verificacoes[school.id] ||= {};
    const verification = RadarFluxoOperacional.createEmptyVerification('BASIC');
    verification.bonificacao.notaFiscal = 'Não';
    verification.analise.notaFiscal = 'Não analisado';
    verificacoes[school.id][compKey] = verification;

    notasRegistradas = notasRegistradas.filter(item => !(
      item.escolaId === school.id && item.compKey === compKey
    ));
    pendencias = pendencias.filter(item => !(
      String(item.escolaId) === String(school.id)
      && String(item.competenciaOrigem || item.competencia) === competence
      && String(item.programaId || '') === 'BASIC'
      && item.documentoKey === 'notaFiscal'
    ));

    let seeded = null;
    if (seedOpen) {
      seeded = await window.RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
        schoolId: school.id,
        compKey,
        description: 'Débito bancário ainda sem documento',
        expenseType: 'a_identificar',
        invoiceNumber: '',
        amount: 145.67,
        profile: 'controlador',
        pendencyObservation: 'Aguardando documento para identificar a despesa.'
      });
    }

    rebuildOperationalIndexes();
    persist();
    activeProntuarioCompetencia = competence;
    switchView('prontuario', school.id);

    return {
      schoolId: school.id,
      competence,
      compKey,
      seededPendencyId: seeded?.value?.pendency?.id || null
    };
  }, { seedOpen: withOpenUnidentified });
}

module.exports = { prepareSchool };
