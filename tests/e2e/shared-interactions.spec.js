const { test, expect } = require('@playwright/test');

async function openTeamManagement(page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.RadarApplicationServices));
  await page.evaluate(() => {
    switchProfile('assistente');
    switchView('equipe');
  });
}

function controllerCard(page, name) {
  return page.locator('.ctrl-card').filter({ hasText: name });
}

test.describe('Ciclo B3 — interações compartilhadas', () => {
  test('solicita destinatário antes de desativar e restaura o foco ao cancelar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Escopo desktop aprovado para este pacote.');

    const nativeDialogs = [];
    page.on('dialog', async dialog => {
      nativeDialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await openTeamManagement(page);
    await expect(page.getByRole('heading', { name: 'Érika Reis', exact: true })).toBeVisible();

    const alziraCard = controllerCard(page, 'Alzira de Souza');
    const removeButton = alziraCard.getByTitle('Remover controlador');
    await removeButton.click();

    const dialog = page.getByRole('alertdialog', { name: 'Desativar Alzira de Souza' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('13 escolas precisam de nova responsável.');
    await expect(dialog.getByLabel('Nova responsável')).toHaveValue('');
    await expect(dialog.getByLabel('Nova responsável').locator('option')).toHaveText([
      'Selecione uma pessoa',
      'Érika Reis',
      'Mônica Chagas',
      'Tuane Coutinho',
      'Wilson Peixoto'
    ]);
    await expect(dialog.getByRole('button', { name: 'Desativar e transferir 13 escolas' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(removeButton).toBeFocused();
    await expect(alziraCard).toBeVisible();

    await removeButton.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    await expect(removeButton).toBeFocused();
    expect(nativeDialogs).toEqual([]);
  });

  test('transfere a carteira para a pessoa escolhida e preserva o histórico', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Escopo desktop aprovado para este pacote.');

    const nativeDialogs = [];
    page.on('dialog', async dialog => {
      nativeDialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await openTeamManagement(page);
    const before = await page.evaluate(() => ({
      schoolIds: escolas.filter(item => item.controladorId === 'alzira_de_souza').map(item => item.id),
      erikaCount: escolas.filter(item => item.controladorId === 'erica').length
    }));

    await controllerCard(page, 'Alzira de Souza').getByTitle('Remover controlador').click();
    const dialog = page.getByRole('alertdialog', { name: 'Desativar Alzira de Souza' });
    await dialog.getByLabel('Nova responsável').selectOption('erica');
    await expect(dialog.getByRole('button', { name: 'Desativar e transferir 13 escolas' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Desativar e transferir 13 escolas' }).click();

    await expect(dialog).toBeHidden();
    await expect(controllerCard(page, 'Alzira de Souza')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText(
      'Alzira de Souza foi desativada. 13 escolas foram transferidas para Érika Reis.'
    );
    await expect(page.getByRole('heading', { name: 'Gestão de Equipe' })).toBeFocused();

    const after = await page.evaluate(schoolIds => ({
      targetActive: controladores.find(item => item.id === 'alzira_de_souza')?.active,
      recipientCount: escolas.filter(item => item.controladorId === 'erica').length,
      allTransferred: schoolIds.every(id => escolas.find(item => item.id === id)?.controladorId === 'erica'),
      history: logs.find(item => item.acao === 'Gestão de Equipe' && item.detalhes.includes('Alzira de Souza'))?.detalhes || ''
    }), before.schoolIds);

    expect(before.schoolIds).toHaveLength(13);
    expect(after.targetActive).toBe(false);
    expect(after.recipientCount).toBe(before.erikaCount + 13);
    expect(after.allTransferred).toBe(true);
    expect(after.history).toContain('13 escolas foram transferidas para Érika Reis');
    expect(nativeDialogs).toEqual([]);
  });

  test('mantém o diálogo e a escolha quando a transação falha', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Escopo desktop aprovado para este pacote.');

    await openTeamManagement(page);
    await page.evaluate(() => {
      const service = window.RadarApplicationServices.directory;
      service.deactivateController = async () => {
        const error = new Error('Falha controlada de persistência.');
        error.code = 'TRANSACTION_FAILED';
        throw error;
      };
    });

    await controllerCard(page, 'Alzira de Souza').getByTitle('Remover controlador').click();
    const dialog = page.getByRole('alertdialog', { name: 'Desativar Alzira de Souza' });
    const recipient = dialog.getByLabel('Nova responsável');
    const confirm = dialog.getByRole('button', { name: 'Desativar e transferir 13 escolas' });
    await recipient.selectOption('erica');
    await confirm.click();

    await expect(dialog).toBeVisible();
    await expect(recipient).toHaveValue('erica');
    const alert = dialog.getByRole('alert');
    await expect(alert).toContainText(
      'Não foi possível confirmar a conclusão da operação. Recarregue os dados antes de tentar novamente.'
    );
    await expect(alert).toContainText(/Código do incidente: RADAR-[A-Z0-9-]+\./);
    await expect(confirm).toBeFocused();
    await expect(controllerCard(page, 'Alzira de Souza')).toBeVisible();
  });
});
