const { test, expect } = require('@playwright/test');

async function seedTask10Alerts(page) {
  return page.evaluate(() => {
    switchProfile('controlador');
    activeCompetenciaKey = '2026-05';
    const schools = escolas.filter(item => item.programasIds?.includes('BASIC')).slice(0, 2);
    if (schools.length < 2) throw new Error('Escolas para alertas não encontradas.');

    const create = (school, id, key, name, openedAt) => RadarPendencias.createDocumentPendency({
      id,
      escolaId: school.id,
      competenciaOrigem: activeCompetenciaKey,
      programaId: 'BASIC',
      documentoKey: key,
      item: `PDDE Básico - ${name}`,
      errosAtuais: ['Documento incompleto'],
      observacao: `Pendência ${id}.`,
      dataAbertura: openedAt
    }, {
      eventId: `${id}-open`,
      at: `${openedAt}T12:00:00.000Z`,
      usuario: 'Controladora Task 10',
      perfil: 'controlador'
    });

    const open = create(schools[0], 'task10-alert-open', 'extCC', 'Extrato Conta Corrente', '2026-05-01');
    const awaitingBase = create(schools[1], 'task10-alert-awaiting', 'extINV', 'Extrato Investimento', '2026-05-02');
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'task10-alert-attempt',
      dataDisponibilizacao: '2026-06-01',
      observacao: 'Novo documento disponibilizado.'
    }, {
      eventId: 'task10-alert-send',
      at: '2026-06-01T12:00:00.000Z',
      usuario: 'Escola Task 10',
      perfil: 'escola'
    });

    pendencias = [open, awaiting];
    contatos = [];
    rebuildOperationalIndexes();
    persist();
    updateAlertsBell();
    switchView('competencias');

    return {
      openSchool: schools[0].denominação,
      awaitingSchool: schools[1].denominação
    };
  });
}

test.describe('Task 10 — alertas e Competências alinhados ao ciclo operacional', () => {
  test('distingue providência da escola e reanálise sem perigo automático por antiguidade', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedTask10Alerts(page);

    await page.locator('#alerts-bell-container > .bell-button').click();
    const openAlert = page.locator('[data-pendency-ref*="task10-alert-open"]');
    const awaitingAlert = page.locator('[data-pendency-ref*="task10-alert-awaiting"]');

    await expect(openAlert).toContainText('Registrar novo envio do Extrato Conta Corrente');
    await expect(openAlert).toHaveClass(/alert-warning/);
    await expect(openAlert).not.toHaveClass(/alert-danger/);

    await expect(awaitingAlert).toContainText('Reanalisar Extrato Investimento');
    await expect(awaitingAlert).toHaveClass(/alert-info/);
    await expect(awaitingAlert).not.toHaveClass(/alert-danger/);
  });

  test('mantém abertas e aguardando separadas na Visão por Competência', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedTask10Alerts(page);

    const panel = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: /Lista de Entrega e Bonificação/ })
    });
    await expect(panel.getByRole('row').filter({ hasText: seeded.openSchool })).toContainText('1 aberta');
    await expect(panel.getByRole('row').filter({ hasText: seeded.awaitingSchool })).toContainText('1 para reanalisar');
  });
});
