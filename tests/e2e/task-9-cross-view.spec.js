const { test, expect } = require('@playwright/test');

async function seedCompetencePendencies(page) {
  return page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, '2026-04')
    ));
    if (!school) throw new Error('Escola para correções cruzadas da Task 9 não encontrada.');

    const createOpen = (id, documentoKey, documentoNome, dataAbertura) => (
      RadarPendencias.createDocumentPendency({
        id,
        escolaId: school.id,
        competenciaOrigem: '2026-04',
        programaId: 'BASIC',
        documentoKey,
        item: `PDDE Básico - ${documentoNome}`,
        errosAtuais: ['Documento incompleto'],
        observacao: `Pendência ${id} usada na visão por competência.`,
        dataAbertura
      }, {
        eventId: `${id}-abertura`,
        at: `${dataAbertura}T12:00:00.000Z`,
        usuario: 'Controladora Task 9',
        perfil: 'Controlador'
      })
    );

    const open = createOpen('task9-cross-open', 'extCC', 'Extrato Conta Corrente', '2026-05-01');
    const awaitingBase = createOpen('task9-cross-awaiting', 'extINV', 'Extrato Investimento', '2026-05-02');
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'task9-cross-attempt',
      dataDisponibilizacao: '2026-06-01',
      observacao: 'Novo extrato disponibilizado.'
    }, {
      eventId: 'task9-cross-submission',
      at: '2026-06-01T12:00:00.000Z',
      usuario: 'Escola Task 9',
      perfil: 'Escola'
    });

    pendencias = [open, awaiting];
    activeCompetenciaKey = '2026-04';
    activePendencyDetailId = null;
    rebuildOperationalIndexes();
    persist();
    switchView('competencias');

    return {
      schoolId: school.id,
      schoolName: school.denominação,
      schoolDesignation: school.designação
    };
  });
}

test.describe('Task 9 — encontrabilidade entre Competências e Pendências', () => {
  test('distingue abertas e aguardando e inclui ambas no passivo anterior', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const seeded = await seedCompetencePendencies(page);

    const competenceTable = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: /Lista de Entrega e Bonificação/ })
    });
    await expect(competenceTable.getByRole('columnheader', { name: 'Pendências ativas' })).toBeVisible();

    const schoolRow = competenceTable.getByRole('row').filter({ hasText: seeded.schoolName });
    await expect(schoolRow).toContainText('1 aberta');
    await expect(schoolRow).toContainText('1 para reanalisar');

    await schoolRow.getByRole('button', { name: '1 para reanalisar' }).click();
    await expect(page.getByRole('tab', { name: /^Aguardando reanálise\b/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pendency-filter-school')).toHaveValue(seeded.schoolId);
    await expect(page.locator('#pendency-filter-competence')).toHaveValue('2026-04');

    await page.evaluate(() => {
      activeCompetenciaKey = '2026-05';
      switchView('competencias');
    });
    const passivo = page.locator('#passivo-competencias-list');
    await expect(passivo.locator('[data-pendency-ref]')).toHaveCount(2);
    await expect(passivo).toContainText('Aberta');
    await expect(passivo).toContainText('Aguardando reanálise');
  });

  test('mantém as ações da lista e o cabeçalho global acessíveis com o drawer aberto no desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedCompetencePendencies(page);
    await page.evaluate(() => switchView('pendencias'));

    const record = page.locator('[data-pendency-id="task9-cross-open"]:visible').first();
    await record.getByRole('button', { name: 'Ver detalhes' }).click();
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/pendency-drawer-open-desktop/);

    await page.locator('#alerts-bell-container > .bell-button').click();
    await expect(page.locator('#alerts-dropdown')).toHaveClass(/show/);
    await page.locator('#alerts-bell-container > .bell-button').click();

    const action = record.getByRole('button', { name: 'Registrar novo envio' });
    await action.click();
    await expect(page.locator('#modal-registrar-envio')).toHaveClass(/show/);
  });
});
