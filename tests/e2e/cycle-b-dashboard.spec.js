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
    )).slice(0, 2);
    if (candidates.length < 2) throw new Error('Duas escolas não foram encontradas para o Dashboard do Ciclo B.');

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

    const open = createOpen(
      candidates[0],
      'cycle-b-dashboard-open',
      'extCC',
      'Extrato Conta Corrente',
      '2026-06-01'
    );
    const awaitingBase = createOpen(
      candidates[1],
      'cycle-b-dashboard-awaiting',
      'extINV',
      'Extrato Investimento',
      '2026-06-02'
    );
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

    pendencias = [open, awaiting];
    contatos = [];
    bens = [];
    rebuildOperationalIndexes();
    persist();
    switchView('dashboard');

    return {
      openSchoolId: candidates[0].id,
      awaitingSchoolId: candidates[1].id,
      awaitingSchoolName: candidates[1].denominação
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
    await expect(openCard).toContainText('1');
    await expect(awaitingCard).toContainText('1');
    await expect(page.getByText(/contagens podem se sobrepor/i)).toBeVisible();

    const queue = page.getByRole('region', { name: 'Próximas ações operacionais' });
    await expect(queue).toContainText('Registrar novo envio do Extrato Conta Corrente');
    await expect(queue).toContainText('Reanalisar Extrato Investimento');

    const awaitingAction = queue.locator('[data-pendency-id="cycle-b-dashboard-awaiting"]');
    await awaitingAction.getByRole('button', { name: 'Abrir pendência' }).click();
    await expect(page.getByRole('heading', { name: 'Pendências operacionais' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toContainText('Extrato Investimento');
  });

  test('transporta o recorte de aguardando reanálise para a Carteira', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedCycleBDashboard(page);

    await page.getByRole('button', { name: /Aguardando reanálise/ }).click();
    await expect(page.getByRole('heading', { name: 'Escolas e Carteiras' })).toBeVisible();
    await expect(page.locator('#filter-escola-pendencias')).toHaveValue('aguardando');
    await expect(page.getByText(seeded.awaitingSchoolName)).toBeVisible();
  });
});
