const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const supabaseLocalEnabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(
    !supabaseLocalEnabled,
    'Esta suíte exige a pilha Supabase local e configuração runtime temporária do CI.'
);

const fixtures = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
    'utf8'
));
const fixturePassword = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (supabaseLocalEnabled && !fixturePassword) {
    throw new Error('A senha efêmera da fixture Auth local não foi fornecida.');
}

async function waitForApplication(page, role) {
    await page.waitForFunction(expectedRole => (
        window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === expectedRole
    ), role);
    await expect(page.locator('#app-layout')).toBeVisible();
    await expect(page.locator('#radar-auth-gate')).toBeHidden();
    await expect(page.locator('#auth-logout-button')).toBeVisible();
}

// Esta jornada cria histórico protegido de NF/Pendência. Os gates a executam
// depois do contrato de import/rollback, em processo separado, sem apagar o histórico.
test('login tardio preserva ações de Pendência na interface real', async ({ page }) => {
    // Auth + criação + contato + cancelamento + reabertura usam cinco commits reais.
    test.setTimeout(90000);
    const controller = fixtures.find(fixture => fixture.profileId === 'controller' && fixture.active);
    const invoiceNumber = `AUD-LATE-AUTH-${Date.now()}`;
    const description = `Documento para acesso tardio ${invoiceNumber}`;
    await page.clock.install();
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.waitForFunction(() => Boolean(window.RadarTask9PendencyPage));
    // Simula tempo humano na tela de login; não atrasa o servidor nem muda Auth/RLS.
    await page.clock.fastForward(11000);
    await page.locator('#radar-auth-email').fill(controller.email);
    await page.locator('#radar-auth-password').fill(fixturePassword);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await waitForApplication(page, 'controller');
    await page.clock.resume();
    await page.locator('#nav-escolas').click();
    await page.getByRole('row').filter({ hasText: 'Escola Local Autorizada' })
        .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
    const fiscal = page.locator('tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
    await fiscal.getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    const expense = page.locator('#modal-dados-nota');
    await expense.getByLabel('Tipo de Gasto', { exact: true }).selectOption('consumo');
    await expense.locator('#nota-numero').fill(invoiceNumber);
    await expense.locator('#nota-desc').fill(description);
    await expense.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('42');
    await expense.getByRole('button', { name: 'Salvar Gasto', exact: true }).click();
    await expect(expense).not.toHaveClass(/show/);
    const invoice = fiscal.locator('.invoice-document-row').filter({ hasText: invoiceNumber });
    await invoice.getByRole('combobox').selectOption('Incorreto');
    const opening = page.locator('#modal-nova-pendencia');
    await opening.getByLabel('Documento ausente', { exact: true }).check();
    await opening.getByLabel('Observações / Detalhes', { exact: true }).fill('Auditoria de login tardio.');
    await opening.getByRole('button', { name: 'Criar Pendência', exact: true }).click();
    await expect(opening).not.toHaveClass(/show/);
    await page.locator('#pendency-preview-drawer .pendency-preview-close').click();
    await page.locator('#nav-pendencias').click();
    const row = page.locator('tr[data-pendency-id]').filter({ hasText: description });
    await row.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await expect(drawer.getByRole('button', { name: 'Registrar contato', exact: true })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Cancelar pendência', exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Registrar contato', exact: true }).click();
    const contact = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await contact.getByLabel('Descrição do contato').fill('Contato interno após login tardio.');
    await contact.getByRole('button', { name: 'Salvar contato', exact: true }).click();
    await expect(contact).toBeHidden();
    await expect(drawer).toContainText('Contato interno após login tardio.');
    await drawer.getByRole('button', { name: 'Cancelar pendência', exact: true }).click();
    const cancellation = page.getByRole('dialog', { name: 'Cancelar pendência', exact: true });
    await cancellation.getByLabel('Justificativa do cancelamento').fill('Registro sintético da auditoria.');
    await cancellation.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
    await expect(cancellation).toBeHidden();
    await expect(drawer).toContainText('Cancelada');
    await drawer.getByRole('button', { name: 'Reabrir pendência', exact: true }).click();
    const reopening = page.getByRole('dialog', { name: 'Reabrir pendência', exact: true });
    await reopening.getByLabel('Documento ilegível', { exact: true }).check();
    await reopening.getByLabel('Justificativa da reabertura').fill('Reabertura sintética após login tardio.');
    await reopening.getByRole('button', { name: 'Confirmar reabertura', exact: true }).click();
    await expect(reopening).toBeHidden();
    await expect(drawer).toContainText('Aberta');
    // Nenhuma recarga entre Auth e ações: uma sessão restaurada esconderia o defeito.
});

