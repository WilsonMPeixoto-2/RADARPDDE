const { test, expect } = require('@playwright/test');

async function seedCrossCompetencePendencies(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);

  return page.evaluate(() => {
    switchProfile('controlador');

    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
    ));
    if (!school) throw new Error('Escola com PDDE Básico não encontrada para o cenário transversal.');

    const createOpen = ({ id, competence, openedAt, documentKey }) => (
      RadarPendencias.createDocumentPendency({
        id,
        escolaId: school.id,
        competenciaOrigem: competence,
        programaId: 'BASIC',
        documentoKey: documentKey,
        item: `PDDE Básico - ${documentKey}`,
        errosAtuais: ['Documento pendente de regularização'],
        observacao: `Pendência ${id}.`,
        dataAbertura: openedAt
      }, {
        eventId: `${id}-abertura`,
        at: `${openedAt}T12:00:00.000Z`,
        usuario: 'Controladora Teste',
        perfil: 'Controlador'
      })
    );

    const april = createOpen({
      id: 'cross-open-april',
      competence: '2026-04',
      openedAt: '2026-04-10',
      documentKey: 'extCC'
    });
    const august = createOpen({
      id: 'cross-open-august',
      competence: '2026-08',
      openedAt: '2026-08-05',
      documentKey: 'extINV'
    });
    const awaitingBase = createOpen({
      id: 'cross-awaiting-may',
      competence: '2026-05',
      openedAt: '2026-05-12',
      documentKey: 'notaFiscal'
    });
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'cross-awaiting-may-attempt',
      dataDisponibilizacao: '2026-06-02',
      observacao: 'Novo arquivo disponibilizado.'
    }, {
      eventId: 'cross-awaiting-may-submission',
      at: '2026-06-02T12:00:00.000Z',
      usuario: 'Escola Teste',
      perfil: 'Escola'
    });

    pendencias = [august, awaiting, april];
    contatos = [];
    activePendencyDetailId = null;
    rebuildOperationalIndexes();

    RadarCompetenceContext.select('2026-08', { source: 'pendency-cross-competence-test' });
    switchView('pendencias');

    return { schoolName: school.denominação };
  });
}

function visibleRecord(page, id) {
  return page.locator(`[data-pendency-id="${id}"]:visible`).first();
}

test.describe('Pendências Operacionais — passivo transversal', () => {
  test('mantém a competência global como contexto sem filtrar a fila', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedCrossCompetencePendencies(page);

    expect(await page.evaluate(() => RadarCompetenceContext.getState().activeKey)).toBe('2026-08');
    expect(await page.evaluate(() => RadarTask9PendencyPage.getState().filters.competence)).toBe('');

    await expect(page.locator('#pendency-cross-competence-notice')).toContainText('Visão de todas as competências');
    await expect(page.locator('#pendency-cross-competence-notice')).toContainText('Agosto de 2026');
    await expect(page.locator('#pendency-filter-competence option').first()).toHaveText('Todas as competências');

    await expect(visibleRecord(page, 'cross-open-april')).toBeVisible();
    await expect(visibleRecord(page, 'cross-open-august')).toBeVisible();

    const openRows = page.locator('#p-abertas .pendency-operations-table tbody tr:visible');
    await expect(openRows).toHaveCount(2);
    await expect(openRows.nth(0)).toHaveAttribute('data-pendency-id', 'cross-open-april');
    await expect(openRows.nth(1)).toHaveAttribute('data-pendency-id', 'cross-open-august');

    await page.evaluate(() => RadarCompetenceContext.select('2026-09', { source: 'pendency-cross-competence-test-change' }));
    expect(await page.evaluate(() => RadarTask9PendencyPage.getState().filters.competence)).toBe('');
    await expect(visibleRecord(page, 'cross-open-april')).toBeVisible();
    await expect(page.locator('#pendency-cross-competence-notice')).toContainText('Setembro de 2026');
  });

  test('permite filtro local opcional e abre o detalhe ao clicar no registro', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedCrossCompetencePendencies(page);

    const april = visibleRecord(page, 'cross-open-april');
    await expect(april).toHaveAttribute('tabindex', '0');
    await april.locator('td').first().click();
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toBeVisible();

    await page.keyboard.press('Escape');
    await page.selectOption('#pendency-filter-competence', '2026-08');
    expect(await page.evaluate(() => RadarTask9PendencyPage.getState().filters.competence)).toBe('2026-08');
    await expect(visibleRecord(page, 'cross-open-april')).toBeHidden();
    await expect(visibleRecord(page, 'cross-open-august')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    expect(await page.evaluate(() => RadarTask9PendencyPage.getState().filters.competence)).toBe('');
    await expect(visibleRecord(page, 'cross-open-april')).toBeVisible();
  });
});
