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

test.describe('Ciclo B3 — desativação de controladores em duas etapas', () => {
  test('orienta a transferência e bloqueia a remoção enquanto houver escolas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Escopo desktop aprovado para este pacote.');

    await openTeamManagement(page);
    const card = controllerCard(page, 'Alzira de Souza');
    await expect(card).toContainText('13 escolas');
    await expect(card).toContainText('Transfira as escolas antes de remover');

    const removeButton = card.getByRole('button', {
      name: 'Remoção indisponível: transfira as 13 escolas primeiro'
    });
    await expect(removeButton).toBeDisabled();
    await expect(removeButton).toHaveAttribute('title', 'Transfira as 13 escolas antes de remover');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });

  test('habilita a remoção após a carteira ser zerada e explica os efeitos', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Escopo desktop aprovado para este pacote.');

    await openTeamManagement(page);
    await page.evaluate(() => {
      escolas.forEach(school => {
        if (school.controladorId === 'alzira_de_souza') school.controladorId = 'erica';
      });
      renderEquipe();
    });

    const card = controllerCard(page, 'Alzira de Souza');
    await expect(card).toContainText('0 escolas');
    await expect(card).toContainText('Pronto para remover');

    const removeButton = card.getByRole('button', { name: 'Remover Alzira de Souza' });
    await expect(removeButton).toBeEnabled();
    await removeButton.click();

    const dialog = page.getByRole('alertdialog', { name: 'Desativar Alzira de Souza' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('A carteira está zerada. A desativação pode ser concluída com segurança.');
    await expect(dialog).toContainText('O acesso será desativado e a controladora deixará de aparecer nas listas operacionais.');
    await expect(dialog).toContainText('Os registros históricos de Alzira de Souza serão mantidos.');
    await expect(dialog.getByLabel('Nova responsável')).toBeHidden();
    await expect(dialog.getByRole('button', { name: 'Desativar controladora' })).toBeEnabled();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(removeButton).toBeFocused();
  });
});
