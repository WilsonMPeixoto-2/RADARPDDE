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
  test('contato em voo contém duplo clique e submit repetido, mas aceita uma intenção posterior', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);
    await page.locator('[data-pendency-id="task10-open"]:visible').first()
      .getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    const dialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await dialog.getByLabel('Descrição do contato').fill('Uma intenção de contato.');
    await page.evaluate(() => {
      const service = RadarApplicationServices.pendencies;
      const original = service.registerContact.bind(service);
      window.__contactCalls = 0;
      const pending = new Promise(resolve => { window.__releaseContact = resolve; });
      // Retém só a fronteira assíncrona; a gravação usa o serviço real ao liberar.
      service.registerContact = async input => {
        window.__contactCalls++;
        await pending;
        return original(input);
      };
    });
    const submit = dialog.locator('button[type="submit"]');
    await submit.dblclick();
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText('Registrando…');
    await page.locator('#form-pendency-contact').dispatchEvent('submit');
    expect(await page.evaluate(() => window.__contactCalls)).toBe(1);
    await page.evaluate(() => window.__releaseContact());
    await expect(dialog).toBeHidden();
    await expect(drawer).toContainText('Uma intenção de contato.');
    expect(await page.evaluate(() => contatos.filter(item => item.pendenciaId === 'task10-open').length)).toBe(1);
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    await dialog.getByLabel('Descrição do contato').fill('Contato posterior deliberado.');
    await expect(submit).toBeEnabled();
    // Enter no botão é o mesmo submit acessível, sem depender apenas de mouse.
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(drawer).toContainText('Contato posterior deliberado.');
    expect(await page.evaluate(() => contatos.filter(item => item.pendenciaId === 'task10-open').length)).toBe(2);
  });

  test('falha comprovada do contato preserva dados, libera o formulário e permite nova tentativa', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);
    await page.locator('[data-pendency-id="task10-open"]:visible').first()
      .getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    const dialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await dialog.getByLabel('Descrição do contato').fill('Descrição preservada após rejeição.');
    await page.evaluate(() => {
      const service = RadarApplicationServices.pendencies;
      const original = service.registerContact.bind(service);
      let first = true;
      service.registerContact = input => {
        if (first) {
          first = false;
          return Promise.reject(new Error('Rejeição antes da gravação.'));
        }
        return original(input);
      };
    });
    const submit = dialog.getByRole('button', { name: 'Salvar contato' });
    await submit.click();
    await expect(page.locator('#task-10-11-live-region')).toContainText('Rejeição antes da gravação.');
    await expect(dialog).toBeVisible();
    await expect(submit).toBeEnabled();
    await expect(submit).toHaveText('Salvar contato');
    await expect(dialog.getByLabel('Descrição do contato')).toHaveValue('Descrição preservada após rejeição.');
    expect(await page.evaluate(() => contatos.length)).toBe(0);
    await submit.click();
    await expect(dialog).toBeHidden();
    await expect(drawer).toContainText('Descrição preservada após rejeição.');
    expect(await page.evaluate(() => contatos.length)).toBe(1);
  });

  test('contato em andamento não permite substituir o formulário por outra pendência', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);
    await page.evaluate(() => {
      const originalPendency = pendencias.find(item => item.id === 'task10-open');
      pendencias.push(RadarPendencias.createDocumentPendency({
        id: 'task10-other-open', escolaId: originalPendency.escolaId,
        competenciaOrigem: '2026-05', programaId: 'BASIC', documentoKey: 'encamp',
        item: 'PDDE Básico - Encaminhamento', errosAtuais: ['Documento incompleto'],
        observacao: 'Outra pendência ativa.', dataAbertura: '2026-06-01'
      }, { eventId: 'task10-other-open-event', at: '2026-06-01T12:00:00.000Z', usuario: 'Controlador', perfil: 'controlador' }));
      rebuildOperationalIndexes();
      renderPendencias();
    });
    await page.locator('[data-pendency-id="task10-open"]:visible').first()
      .getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    const dialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await dialog.getByLabel('Descrição do contato').fill('Primeiro contato retido em gravação.');
    await page.evaluate(() => {
      const service = RadarApplicationServices.pendencies;
      const original = service.registerContact.bind(service);
      const pending = new Promise(resolve => { window.__releaseContact = resolve; });
      service.registerContact = async input => { await pending; return original(input); };
    });
    await dialog.getByRole('button', { name: 'Salvar contato' }).click();
    await expect(dialog.locator('button[type="submit"]')).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(dialog).toBeHidden();
    await drawer.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.locator('[data-pendency-id="task10-other-open"]:visible').first()
      .getByRole('button', { name: 'Ver detalhes' }).click();
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#task-10-11-live-region')).toContainText('Aguarde o registro do contato em andamento.');
    await page.evaluate(() => window.__releaseContact());
    await expect(drawer).toContainText('Primeiro contato retido em gravação.');
    expect(await page.evaluate(() => contatos.map(item => item.pendenciaId))).toEqual(['task10-open']);
    // Depois de concluir a primeira gravação, outra pendência pode receber contato.
    await drawer.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
    await page.locator('[data-pendency-id="task10-other-open"]:visible').first()
      .getByRole('button', { name: 'Ver detalhes' }).click();
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Descrição do contato').fill('Contato da segunda pendência.');
    await dialog.getByRole('button', { name: 'Salvar contato' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => contatos.map(item => item.pendenciaId))).toEqual(['task10-open', 'task10-other-open']);
  });

  test('guard crítico indisponível bloqueia contato com orientação e preserva o formulário', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);
    await page.locator('[data-pendency-id="task10-open"]:visible').first()
      .getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Registrar contato' }).click();
    const dialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await dialog.getByLabel('Descrição do contato').fill('Contato ainda não gravado.');
    await page.evaluate(() => {
      window.__savedCriticalGuard = window.RadarCriticalActionGuard;
      window.RadarCriticalActionGuard = {};
    });
    await dialog.getByRole('button', { name: 'Salvar contato' }).click();
    await expect(page.locator('#task-10-11-live-region')).toContainText('Recarregue a página e tente novamente.');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Salvar contato' })).toBeEnabled();
    await expect(dialog.getByLabel('Descrição do contato')).toHaveValue('Contato ainda não gravado.');
    expect(await page.evaluate(() => contatos.length)).toBe(0);
    await page.evaluate(() => { window.RadarCriticalActionGuard = window.__savedCriticalGuard; });
    await dialog.getByRole('button', { name: 'Salvar contato' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => contatos.length)).toBe(1);
  });

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

  test('reabre pendência cancelada sem manter marcador terminal de cancelamento', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedOperations(page);

    const row = page.locator('[data-pendency-id="task10-open"]:visible').first();
    await row.getByRole('button', { name: 'Ver detalhes' }).click();
    let drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Cancelar pendência' }).click();

    let dialog = page.getByRole('dialog', { name: 'Cancelar pendência' });
    await dialog.getByLabel('Justificativa do cancelamento').fill('Registro indevido.');
    await dialog.getByRole('button', { name: 'Confirmar cancelamento' }).click();
    await page.evaluate(() => closePendencyDetail());

    await page.getByRole('tab', { name: /^Canceladas\b/ }).click();
    const cancelledRow = page.locator('[data-pendency-id="task10-open"]:visible').first();
    await cancelledRow.getByRole('button', { name: 'Ver detalhes' }).click();
    drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await expect(drawer.getByRole('button', { name: 'Reabrir pendência' })).toBeVisible();
    await drawer.getByRole('button', { name: 'Reabrir pendência' }).click();

    dialog = page.getByRole('dialog', { name: 'Reabrir pendência' });
    await dialog.getByLabel('Documento ilegível').check();
    await dialog.getByLabel('Justificativa da reabertura').fill('Nova conferência exigida.');
    await dialog.getByRole('button', { name: 'Confirmar reabertura' }).click();

    await expect(page.getByRole('tab', { name: /^Abertas\b/ })).toHaveAttribute('aria-selected', 'true');
    const state = await page.evaluate(() => {
      const item = pendencias.find(pendency => pendency.id === 'task10-open');
      return {
        status: item.status,
        cancellationHistory: item.cancelamento,
        historyTypes: item.historico.map(event => event.tipo)
      };
    });

    expect(state.status).toBe('Aberta');
    expect(state.cancellationHistory).toBeTruthy();
    expect(state.historyTypes).toContain('cancelamento');
    expect(state.historyTypes).toContain('reabertura');
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
    expect(data.historyTypes).toContain('reanalise_correta');
    expect(data.historyTypes).toContain('reabertura');
  });
});
