const { test, expect } = require('@playwright/test');

async function seedCycleBCarteira(page) {
  return page.evaluate(() => {
    switchProfile('controlador');
    activeCompetenciaKey = '2026-05';
    activeEscolaFilters = { ...DEFAULT_ESCOLA_FILTERS };
    escolaSearchQuery = '';

    const candidates = escolas.filter(school => (
      Array.isArray(school.programasIds)
      && school.programasIds.includes('BASIC')
      && isCompetenceInScope(school.competenciaInicial, activeCompetenciaKey)
    )).slice(0, 3);
    if (candidates.length < 3) throw new Error('Três escolas não foram encontradas para a Carteira do Ciclo B.');

    const createOpen = (school, id, key, name, openedAt) => RadarPendencias.createDocumentPendency({
      id,
      escolaId: school.id,
      competenciaOrigem: activeCompetenciaKey,
      programaId: 'BASIC',
      documentoKey: key,
      item: `PDDE Básico - ${name}`,
      errosAtuais: ['Documento incompleto'],
      observacao: `Pendência operacional ${id}.`,
      dataAbertura: openedAt
    }, {
      eventId: `${id}-open`,
      at: `${openedAt}T12:00:00.000Z`,
      usuario: 'Controladora Ciclo B',
      perfil: 'controlador'
    });

    const open = createOpen(candidates[0], 'cycle-b-wallet-open', 'extCC', 'Extrato Conta Corrente', '2026-06-01');
    const awaitingBase = createOpen(candidates[1], 'cycle-b-wallet-awaiting', 'extINV', 'Extrato Investimento', '2026-06-02');
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'cycle-b-wallet-attempt',
      dataDisponibilizacao: '2026-07-01',
      observacao: 'Novo arquivo disponível.'
    }, {
      eventId: 'cycle-b-wallet-send',
      at: '2026-07-01T12:00:00.000Z',
      usuario: 'Escola Ciclo B',
      perfil: 'escola'
    });

    pendencias = [open, awaiting];
    contatos = [];
    rebuildOperationalIndexes();
    persist();
    switchView('escolas');

    return {
      open: {
        id: candidates[0].id,
        name: candidates[0].denominação,
        inep: candidates[0].inep
      },
      awaiting: {
        id: candidates[1].id,
        name: candidates[1].denominação,
        inep: candidates[1].inep
      },
      regular: {
        id: candidates[2].id,
        name: candidates[2].denominação,
        inep: candidates[2].inep
      }
    };
  });
}

test.describe('Ciclo B — Carteira operacional de Escolas', () => {
  test('filtra separadamente abertas, aguardando e sem pendência ativa', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBCarteira(page);

    const filter = page.locator('#filter-escola-pendencias');
    await expect(filter).toContainText('Pendência aberta');
    await expect(filter).toContainText('Aguardando reanálise');
    await expect(filter).toContainText('Sem pendência ativa');

    await filter.selectOption('aberta');
    await expect(page.getByText(seeded.open.name)).toBeVisible();
    await expect(page.getByText(seeded.awaiting.name)).toHaveCount(0);

    await filter.selectOption('aguardando');
    await expect(page.getByText(seeded.awaiting.name)).toBeVisible();
    await expect(page.getByText(seeded.open.name)).toHaveCount(0);

    await filter.selectOption('sem');
    await expect(page.getByText(seeded.regular.name)).toBeVisible();
  });

  test('pesquisa por INEP e exibe as dimensões operacionais em colunas próprias', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBCarteira(page);

    const table = page.locator('.cycle-b-wallet-table');
    await expect(table.getByRole('columnheader', { name: 'Situação documental' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Abertas' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Para reanalisar' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Última movimentação' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Próxima ação' })).toBeVisible();

    const search = page.locator('#escola-search-input');
    await search.fill(seeded.awaiting.inep);
    const row = table.locator('tbody tr').filter({ hasText: seeded.awaiting.name });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Aguardando reanálise');
    await expect(row).toContainText('Reanalisar Extrato Investimento');
  });

  test('abre a fila de Pendências preservando escola e situação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBCarteira(page);

    await page.locator('#filter-escola-pendencias').selectOption('aguardando');
    const row = page.locator('.cycle-b-wallet-table tbody tr').filter({ hasText: seeded.awaiting.name });
    await row.getByRole('button', { name: 'Abrir Pendências' }).click();

    await expect(page.getByRole('heading', { name: 'Pendências operacionais' })).toBeVisible();
    await expect(page.locator('#pendency-filter-school')).toHaveValue(seeded.awaiting.id);
    await expect(page.getByRole('tab', { name: /^Aguardando reanálise\b/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('usa cartões operacionais sem overflow global no celular', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'Cenário mobile.');
    await page.goto('/');
    await seedCycleBCarteira(page);

    await expect(page.locator('.cycle-b-wallet-mobile-card').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
});
