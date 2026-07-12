const { test, expect } = require('@playwright/test');

const DOCUMENT_KEYS = [
  'extCC',
  'extINV',
  'notaFiscal',
  'consAssessoria',
  'declBBAgil',
  'encampInventario'
];

const APTA_BONIFICATION = {
  extCC: 'Sim',
  extINV: 'Sim',
  notaFiscal: 'Não se aplica',
  consAssessoria: 'Não se aplica',
  declBBAgil: 'Sim',
  encampInventario: 'Não se aplica'
};

async function seedSeparatedIndicators(page, options = {}) {
  return page.evaluate(({ documentKeys, aptaBonification, seedOptions }) => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Escola determinística da Task 8 não encontrada.');

    verificacoes[escola.id] = {};
    escola.programasIds.forEach(programaId => {
      const compProgKey = `${competencia}_${programaId}`;
      const verification = RadarFluxoOperacional.createEmptyVerification();
      verification.bonificacao = { ...aptaBonification };
      verification.analise = Object.fromEntries(
        documentKeys.map(key => [key, 'Correto'])
      );
      verification.resultadoBonif = 'apta';
      verificacoes[escola.id][compProgKey] = verification;
    });

    const programaId = 'BASIC';
    const compProgKey = `${competencia}_${programaId}`;
    const targetVerification = verificacoes[escola.id][compProgKey];
    targetVerification.analise.extCC = seedOptions.analysisValue || 'Incorreto';
    if (seedOptions.bonusResult === 'inapta') {
      targetVerification.bonificacao.extCC = 'Não';
      targetVerification.resultadoBonif = 'inapta';
    }

    pendencias = pendencias.filter(item => item.escolaId !== escola.id);
    let pendencyId = null;
    if (seedOptions.withPendency) {
      const pendency = RadarPendencias.createDocumentPendency({
        id: 'pend-task-8-separation',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId,
        documentoKey: 'extCC',
        item: 'PDDE Básico - Extrato Conta Corrente',
        errosAtuais: ['Documento ilegível'],
        observacao: 'Pendência criada para provar a separação de dimensões.',
        dataAbertura: '2026-07-11'
      }, {
        eventId: 'event-task-8-separation',
        at: '2026-07-11T12:00:00.000Z',
        usuario: 'Controlador E2E',
        perfil: 'Controlador'
      });
      pendencias.push(pendency);
      pendencyId = pendency.id;
    }

    rebuildOperationalIndexes();
    persist();
    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);

    return {
      escolaId: escola.id,
      escolaDesignacao: escola.designação,
      competencia,
      programaId,
      compProgKey,
      pendencyId
    };
  }, {
    documentKeys: DOCUMENT_KEYS,
    aptaBonification: APTA_BONIFICATION,
    seedOptions: options
  });
}

function programSummary(page, programaId) {
  return page.locator(
    `[data-program-status-summary="${programaId}"]`
  ).first();
}

test.describe('Task 8 — indicadores independentes', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
    await page.goto('/');
  });

  test('mantém APTA com análise incorreta e pendência ativa', async ({ page }) => {
    const context = await seedSeparatedIndicators(page, { withPendency: true });
    const summary = programSummary(page, context.programaId);

    await expect(summary.locator('[data-status-dimension="bonificacao"]'))
      .toHaveText('APTA');
    await expect(summary.locator('[data-status-dimension="analise"]'))
      .toHaveText('Incorreto');
    await expect(page.locator('.tab-button[data-tab="pendencias"]'))
      .toHaveText('Pendências Ativas (1)');

    const aggregate = await page.evaluate(({ escolaId, competencia }) => {
      const escola = escolas.find(item => item.id === escolaId);
      return getSchoolAggregateStatus(escola, competencia);
    }, context);
    expect(aggregate).toBe('apto');
  });

  test('mantém INAPTA mesmo com análise técnica correta', async ({ page }) => {
    const context = await seedSeparatedIndicators(page, {
      bonusResult: 'inapta',
      analysisValue: 'Correto'
    });
    const summary = programSummary(page, context.programaId);

    await expect(summary.locator('[data-status-dimension="bonificacao"]'))
      .toHaveText('INAPTA');
    await expect(summary.locator('[data-status-dimension="analise"]'))
      .toHaveText('Correto');
  });

  test('exibe bonificação, análise e próxima ação em superfícies distintas', async ({ page }) => {
    const context = await seedSeparatedIndicators(page, { withPendency: true });

    await page.evaluate(() => switchView('competencias'));
    const competenceRow = page.locator('#main-container table.data-table tbody tr')
      .filter({ hasText: context.escolaDesignacao })
      .first();
    await expect(competenceRow).toContainText('APTA');
    await expect(competenceRow).toContainText('Incorreto');
    await expect(competenceRow).toContainText('1 Abertas');

    await page.evaluate(() => switchView('escolas'));
    const carteiraRow = page.locator('#main-container table.data-table tbody tr')
      .filter({ hasText: context.escolaDesignacao })
      .first();
    await expect(carteiraRow).toContainText('APTA');
    await expect(carteiraRow).toContainText('Incorreto');
    await expect(carteiraRow).toContainText('Próximo ator: Escola');
  });

  test('filtro APTA não exclui escola apenas por análise incorreta', async ({ page }) => {
    const context = await seedSeparatedIndicators(page, { withPendency: true });

    await page.evaluate(() => switchView('escolas'));
    await page.locator('#filter-escola-situacao').selectOption('apto');
    const carteiraRow = page.locator('#main-container table.data-table tbody tr')
      .filter({ hasText: context.escolaDesignacao });

    await expect(carteiraRow).toHaveCount(1);
    await expect(carteiraRow).toContainText('APTA');
    await expect(carteiraRow).toContainText('Incorreto');
  });
});
