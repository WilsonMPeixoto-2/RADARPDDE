const { test, expect } = require('@playwright/test');

async function seedCycleBDashboard(page) {
  return page.evaluate(() => {
    switchProfile('controlador');
    activeControladorRAFilter = 'todas';
    activeControladorSubFilter = 'all';
    activeCompetenciaKey = '2026-05';

    const candidates = escolas.filter(school => (
      Array.isArray(school.programasIds)
      && school.programasIds.includes('BASIC')
      && isCompetenceInScope(school.competenciaInicial, activeCompetenciaKey)
    )).slice(0, 3);
    if (candidates.length < 3) throw new Error('Três escolas não foram encontradas para o Dashboard do Ciclo B.');

    candidates[2].denominação = 'Escola Municipal de Educação Integral Professora Maria da Conceição';

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

    const open = createOpen(candidates[0], 'cycle-b-dashboard-open', 'extCC', 'Extrato Conta Corrente', '2026-06-01');
    const awaitingBase = createOpen(candidates[1], 'cycle-b-dashboard-awaiting', 'extINV', 'Extrato Investimento', '2026-06-02');
    const longNameOpen = createOpen(candidates[2], 'cycle-b-dashboard-open-long', 'parecerTEC', 'Parecer Técnico', '2026-06-15');
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'cycle-b-dashboard-attempt',
      dataDisponibilizacao: '2026-07-01',
      observacao: 'Novo extrato disponibilizado.'
    }, {
      eventId: 'cycle-b-dashboard-send',
      at: '2026-07-01T12:00:00.000Z',
      usuario: 'Escola Ciclo B',
      perfil: 'escola'
    });

    pendencias = [open, awaiting, longNameOpen];
    contatos = [];
    bens = [];
    rebuildOperationalIndexes();
    persist();
    switchView('dashboard');

    return {
      openSchoolName: candidates[0].denominação,
      awaitingSchoolName: candidates[1].denominação,
      longSchoolName: candidates[2].denominação
    };
  });
}

test.describe('Ciclo B — Dashboard operacional do Controlador', () => {
  test('separa abertas e aguardando reanálise e apresenta fila concreta de trabalho', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedCycleBDashboard(page);

    const openCard = page.getByRole('button', { name: /Pendências abertas/ });
    const awaitingCard = page.getByRole('button', { name: /Aguardando reanálise/ });
    await expect(openCard).toContainText('2');
    await expect(awaitingCard).toContainText('1');
    await expect(page.getByText(/podem se sobrepor/i)).toBeVisible();

    const queue = page.getByRole('region', { name: 'Próximas ações operacionais' });
    await expect(queue).toContainText('Registrar novo envio do Extrato Conta Corrente');
    await expect(queue).toContainText('Reanalisar Extrato Investimento');
    await expect(queue).toContainText('Registrar novo envio do Parecer Técnico');
    await expect(queue).toContainText('Escola Municipal de Educação Integral Professora Maria da Conceição');
    await expect(queue.locator('.cycle-b-action-item')).toHaveCount(3);
    await expect(page.locator('#controlador-gargalos')).toHaveCount(0);

    const queueMetrics = await queue.evaluate((element) => {
      const heading = element.querySelector('.panel-header h2');
      const headingStyle = getComputedStyle(heading);
      const lineHeight = Number.parseFloat(headingStyle.lineHeight);
      return {
        width: element.getBoundingClientRect().width,
        overflows: element.scrollWidth > element.clientWidth,
        headingLines: Math.round(heading.getBoundingClientRect().height / lineHeight)
      };
    });
    expect(queueMetrics.width).toBeGreaterThanOrEqual(320);
    expect(queueMetrics.overflows).toBe(false);
    expect(queueMetrics.headingLines).toBeLessThanOrEqual(2);

    const headerAlignments = await page.locator('.dash-layout table.data-table thead th').evaluateAll((headers) => (
      headers.map((header) => getComputedStyle(header).textAlign)
    ));
    expect(headerAlignments).toEqual(['left', 'center', 'center', 'center', 'center']);

    const awaitingAction = queue.locator('.cycle-b-action-item').filter({ hasText: 'Reanalisar Extrato Investimento' });
    await awaitingAction.getByRole('button', { name: 'Abrir pendência' }).click();
    await expect(page.getByRole('heading', { name: 'Pendências operacionais' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toContainText('Extrato Investimento');
  });

  test('filtra a lista e as próximas ações no próprio Dashboard e desfaz no segundo clique', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBDashboard(page);

    const awaitingCard = page.getByRole('button', { name: /Aguardando reanálise/ });
    await awaitingCard.click();

    await expect(page.getByRole('heading', { name: 'Painel do Controlador' })).toBeVisible();
    await expect(awaitingCard).toHaveAttribute('aria-pressed', 'true');

    const table = page.locator('.dash-layout table.data-table').first();
    await expect(table.locator('tbody tr').filter({ hasText: seeded.awaitingSchoolName })).toHaveCount(1);
    await expect(table.locator('tbody tr').filter({ hasText: seeded.openSchoolName })).toHaveCount(0);

    const queue = page.getByRole('region', { name: 'Próximas ações operacionais' });
    await expect(queue.locator('.cycle-b-action-item')).toHaveCount(1);
    await expect(queue).toContainText('Reanalisar Extrato Investimento');
    await expect(queue).not.toContainText('Registrar novo envio do Extrato Conta Corrente');

    await awaitingCard.click();
    await expect(awaitingCard).toHaveAttribute('aria-pressed', 'false');
    await expect(table.locator('tbody tr').filter({ hasText: seeded.awaitingSchoolName })).toHaveCount(1);
    await expect(table.locator('tbody tr').filter({ hasText: seeded.openSchoolName })).toHaveCount(1);
    await expect(queue.locator('.cycle-b-action-item')).toHaveCount(3);
  });

  test('abre a pendência correta pela linha da escola filtrada', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBDashboard(page);

    await page.getByRole('button', { name: /Aguardando reanálise/ }).click();
    const row = page.locator('.dash-layout table.data-table tbody tr').filter({ hasText: seeded.awaitingSchoolName });

    await row.getByRole('button', { name: 'Reanalisar documento' }).click();
    await expect(page.getByRole('heading', { name: 'Pendências operacionais' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toContainText('Extrato Investimento');
  });
});
