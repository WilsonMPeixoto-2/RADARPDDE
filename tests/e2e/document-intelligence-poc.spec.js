const { test, expect } = require('@playwright/test');

test('demonstração documental preserva evidências, recusa coincidência por valor e exige revisão humana', async ({ page }, testInfo) => {
  const externalRequests = [];
  page.on('request', request => {
    if (new URL(request.url()).hostname !== '127.0.0.1') externalRequests.push(request.url());
  });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/ops/document-intelligence-poc/index.html');
    await expect(page.getByRole('heading', { name: 'Cinco situações para conferir' })).toBeVisible();
    await expect(page.locator('#queue button')).toHaveCount(5);
    await expect(page.locator('#status')).toHaveText('Correspondência a conferir');

    await page.getByRole('button', { name: /^Nota DEMO-004/ }).click();
    await expect(page.locator('#detail-title')).toBeFocused();
    await expect(page.locator('#status')).toHaveText('Sem correspondência suficiente');
    await expect(page.locator('#explanation')).toContainText('Um valor igual, sozinho, não identifica um pagamento.');
    await expect(page.getByRole('button', { name: 'Confirmar correspondência no exemplo' })).toBeDisabled();

    await page.getByRole('button', { name: /^Nota DEMO-003/ }).click();
    await expect(page.locator('#payment-amount')).toHaveText('2 débitos possíveis');
    await expect(page.getByRole('button', { name: 'Confirmar correspondência no exemplo' })).toBeDisabled();

    await page.getByRole('button', { name: /^Nota DEMO-002/ }).click();
    await expect(page.locator('#status')).toHaveText('Diferença de valores');
    await page.getByLabel('Sua observação').fill('Conferir a diferença nas fontes fictícias antes de qualquer conclusão.');
    await page.getByRole('button', { name: 'Encaminhar para revisão documental' }).click();
    await expect(page.getByRole('status')).toHaveText('Revisão documental indicada no exemplo. Nenhuma Pendência foi criada.');

    await page.getByRole('button', { name: /^Nota DEMO-005/ }).click();
    await expect(page.locator('#status')).toHaveText('Extração precisa de revisão');
    await expect(page.getByRole('button', { name: 'Confirmar correspondência no exemplo' })).toBeDisabled();

    await page.getByRole('button', { name: /^Nota DEMO-001/ }).click();
    await page.getByRole('button', { name: 'Confirmar correspondência no exemplo' }).click();
    await expect(page.getByLabel('Sua observação')).toBeFocused();
    await expect(page.getByRole('status')).toContainText('Escreva uma breve observação');
    await page.locator('#sources summary').first().click();
    await expect(page.locator('#sources pre').first()).toContainText('DOCUMENTO SINTÉTICO — NÃO É NOTA FISCAL');
    await page.getByLabel('Sua observação').fill('Comparei referência, beneficiário, contexto e valor nas duas fontes fictícias.');
    await page.getByRole('button', { name: 'Confirmar correspondência no exemplo' }).click();
    await expect(page.getByRole('status')).toHaveText('Correspondência conferida no exemplo. Nenhuma decisão administrativa foi criada.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await testInfo.attach(`document-intelligence-${width}.png`, {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
    });
    await page.reload();
    await expect(page.locator('#queue button')).toHaveCount(5);
    await expect(page.getByLabel('Sua observação')).toHaveValue('');
    await expect(page.getByRole('status')).toBeEmpty();
  }
  expect(externalRequests).toEqual([]);
});
