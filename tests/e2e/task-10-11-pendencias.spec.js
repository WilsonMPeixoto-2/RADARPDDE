const { test, expect } = require('@playwright/test');

async function seedOperations(page) {
  return page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(item => item.programasIds?.includes('BASIC'));
    if (!school) throw new Error('Escola para Task 10–11 não encontrada.');

    const create = (id, key, name, date) => RadarPendencias.createDocumentPendency({
      id,
      escolaId: school.id,
      competenciaOrigem: '2026-05',
      programaId: 'BASIC',
      documentoKey: key,
      item: `PDDE Básico - ${name}`,
      errosAtuais: ['Documento incompleto'],
      observacao: `Pendência ${id}.`,
      dataAbertura: date
    }, {
      eventId: `${id}-open`,
      at: `${date}T12:00:00.000Z`,
      usuario: 'Controladora de teste',
      perfil: 'controlador'
    });

    const open = create('task10-open', 'extCC', 'Extrato Conta Corrente', '2026-06-01');
    const resolvedBase = create('task11-resolved', 'extINV', 'Extrato Investimento', '2026-06-02');
    const awaiting = RadarPendencias.registerCorrectiveSubmission(resolvedBase, {
      id: 'task11-attempt',
      dataDisponibilizacao: '2026-07-01',
      observacao: 'Arquivo corrigido.'
    }, {
      eventId: 'task11-send',
      at: '2026-07-01T12:00:00.000Z',
      usuario: 'Escola',
      perfil: 'escola'
    });
    const resolved = RadarPendencias.recordReanalysis(awaiting, {
      resultado: 'correto',
      observacao: 'Documento conferido.'
    }, {
      eventId: 'task11-review',
      at: '2026-07-02T12:00:00.000Z',
      usuario: 'Controladora de teste',
      perfil: 'controlador'
    });

    pendencias = [open, resolved];
    contatos = [];
    activePendencyDetailId = null;
    rebuildOperationalIndexes();
    persist();
    switchView('pendencias');
    return { schoolId: school.id };
  });
}

test.describe('Tasks 10–11 — contatos, cancelamento e reabertura', () => {
  test('registra contato em pendência aberta sem alterar o status', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);

    const row = page.locator('[data-pendency-id="task10-open"]:visible').first();
    await row.getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();

    const dialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await dialog.getByLabel('Canal').selectOption('Telefone');
    await dialog.getByLabel('Descrição do contato').fill('Direção orientada sobre o extrato.');
    await dialog.getByRole('button', { name: 'Salvar contato' }).click();

    await expect(drawer).toContainText('Direção orientada sobre o extrato.');
    const stored = await page.evaluate(() => ({
      status: pendencias.find(item => item.id === 'task10-open').status,
      contacts: contatos.filter(item => item.pendenciaId === 'task10-open').length
    }));
    expect(stored).toEqual({ status: 'Aberta', contacts: 1 });
  });

  test('cancela uma pendência ativa e a move para Canceladas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);

    const row = page.locator('[data-pendency-id="task10-open"]:visible').first();
    await row.getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Cancelar pendência' }).click();

    const dialog = page.getByRole('dialog', { name: 'Cancelar pendência' });
    await dialog.getByLabel('Justificativa do cancelamento').fill('Registro criado no documento incorreto.');
    await dialog.getByRole('button', { name: 'Confirmar cancelamento' }).click();

    await expect(page.getByRole('tab', { name: /^Canceladas\b/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-pendency-id="task10-open"]:visible').first()).toContainText('Cancelada');
  });

  test('reabre pendência resolvida preservando o histórico', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);

    await page.getByRole('tab', { name: /^Resolvidas\b/ }).click();
    const row = page.locator('[data-pendency-id="task11-resolved"]:visible').first();
    await row.getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Reabrir pendência' }).click();

    const dialog = page.getByRole('dialog', { name: 'Reabrir pendência' });
    await dialog.getByLabel('Documento ilegível').check();
    await dialog.getByLabel('Justificativa da reabertura').fill('Nova conferência identificou baixa legibilidade.');
    await dialog.getByRole('button', { name: 'Confirmar reabertura' }).click();

    await expect(page.getByRole('tab', { name: /^Abertas\b/ })).toHaveAttribute('aria-selected', 'true');
    const data = await page.evaluate(() => {
      const item = pendencias.find(pendency => pendency.id === 'task11-resolved');
      return { status: item.status, historyTypes: item.historico.map(event => event.tipo) };
    });
    expect(data.status).toBe('Aberta');
    expect(data.historyTypes).toContain('reanálise_correta');
    expect(data.historyTypes).toContain('reabertura');
  });
});
