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

  test('preserva a tabela aprovada com programas, diretor e ações ao pesquisar por INEP', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBCarteira(page);

    const resultPanel = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: 'Resultado da carteira' })
    });
    const table = resultPanel.locator('table.data-table');
    await expect(page.locator('.cycle-b-wallet-table')).toHaveCount(0);
    await expect(table.getByRole('columnheader', { name: 'Diretor(a) Geral' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Controlador Responsável' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Pendência / próxima ação' })).toBeVisible();

    const search = page.locator('#escola-search-input');
    await search.fill(seeded.awaiting.inep);
    const row = table.locator('tbody tr').filter({ hasText: seeded.awaiting.name });
    await expect(row).toHaveCount(1);
    await expect(row.locator('.school-program-inline')).toContainText('PDDE Básico');
    await expect(row).toContainText('1 ativa(s)');
    await expect(row.getByRole('button', { name: 'Ver Unidade' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Editar' })).toBeVisible();
  });

  test('mantém a ação aprovada Ver Unidade após filtrar aguardando reanálise', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBCarteira(page);

    await page.locator('#filter-escola-pendencias').selectOption('aguardando');
    const row = page.locator('table.data-table tbody tr').filter({ hasText: seeded.awaiting.name });
    await row.getByRole('button', { name: 'Ver Unidade' }).click();

    await expect(page.getByRole('heading', { name: new RegExp(seeded.awaiting.name) })).toBeVisible();
  });

  test('mantém a tabela aprovada em rolagem local no celular', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'Cenário mobile.');
    await page.goto('/');
    await seedCycleBCarteira(page);

    await expect(page.locator('.cycle-b-wallet-mobile-card')).toHaveCount(0);
    const resultPanel = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: 'Resultado da carteira' })
    });
    await expect(resultPanel.locator('.table-responsive')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
});
