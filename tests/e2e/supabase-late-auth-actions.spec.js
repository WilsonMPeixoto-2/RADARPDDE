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

test('carregamento tardio do app preserva a página operacional de Pendências', async ({ page }) => {
    test.setTimeout(60000);
    const controller = fixtures.find(fixture => fixture.profileId === 'controller' && fixture.active);
    let releaseApp;
    const appReleased = new Promise(resolve => { releaseApp = resolve; });
    await page.route('**/app.js', async route => {
        await appReleased;
        await route.continue();
    });
    const extensionLoaded = page.waitForResponse(response =>
        response.url().endsWith('/src/integration/task-9-pendencias-page.js') && response.ok());
    const navigation = page.goto('/pendencias?escola=ESC-LOCAL');
    try {
        await extensionLoaded;
        // Rede lenta do script principal, sem modificar globals, Auth ou dados.
        // O deadline histórico da extensão expira enquanto app.js está em trânsito.
        await new Promise(resolve => setTimeout(resolve, 11000));
    } finally {
        releaseApp();
    }
    await navigation;
    await page.locator('#radar-auth-email').fill(controller.email);
    await page.locator('#radar-auth-password').fill(fixturePassword);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await waitForApplication(page, 'controller');
    await expect(page.getByRole('heading', { name: 'Pendências operacionais', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Baixar planilha de pendências em formato Excel' })).toBeVisible();
    await expect(page.getByRole('tablist', { name: 'Situações das pendências' })).toBeVisible();
    await expect(page.locator('#pendency-filter-school')).toHaveValue('ESC-LOCAL');
    await expect(page.getByRole('region', { name: 'Filtro ativo por unidade escolar' }))
        .toContainText('Escola Local Autorizada');
    await page.getByRole('button', { name: 'Limpar filtro de unidade' }).click();
    await expect(page).toHaveURL(/\/pendencias$/);
    await expect(page.locator('#pendency-filter-school')).toHaveValue('');
    await page.goBack();
    await expect(page.locator('#pendency-filter-school')).toHaveValue('ESC-LOCAL');
    await page.goForward();
    await expect(page.locator('#pendency-filter-school')).toHaveValue('');
});

test('filtro escolar da fila tem uma única rota ao selecionar e limpar', async ({ page }) => {
    test.setTimeout(60000);
    const controller = fixtures.find(fixture => fixture.profileId === 'controller' && fixture.active);
    await page.goto('/pendencias?escola=ESC-LOCAL');
    await page.locator('#radar-auth-email').fill(controller.email);
    await page.locator('#radar-auth-password').fill(fixturePassword);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await waitForApplication(page, 'controller');
    const school = page.getByLabel('Unidade escolar', { exact: true });
    const query = page.getByRole('searchbox', { name: 'Buscar pendências' });
    const competence = await page.locator('#global-competence-select').inputValue();
    for (const schoolId of ['ESC-LOCAL', 'ESC-OTHER']) {
        await school.selectOption(schoolId);
        await expect(school).toHaveValue(schoolId);
        await query.fill('Escola');
        await page.locator('.pendency-filter-header').getByRole('button', { name: 'Limpar filtros' }).click();
        await expect(school).toHaveValue('');
        await expect(query).toHaveValue('');
        await expect(page).toHaveURL(/\/pendencias$/);
        await expect.poll(() => page.evaluate(() =>
            window.RadarNavigationHistory.currentRoute(window).filters.escola || '')).toBe('');

        await school.selectOption(schoolId);
        await expect(page).toHaveURL(new RegExp(`/pendencias\\?escola=${schoolId}$`));
        await page.goBack();
        await expect(school).toHaveValue('');
        await page.goForward();
        await expect(school).toHaveValue(schoolId);
        await query.fill('Escola');
        await page.getByRole('button', { name: /^Remover filtro Unidade:/ }).click();
        await expect(school).toHaveValue('');
        await expect(query).toHaveValue('Escola');
        await expect(page).toHaveURL(/\/pendencias$/);
        await school.selectOption(schoolId);
        await page.reload();
        await waitForApplication(page, 'controller');
        await expect(school).toHaveValue(schoolId);
        await expect(page.locator('#global-competence-select')).toHaveValue(competence);
    }
});

// Esta jornada cria histórico protegido de NF/Pendência. Os gates a executam
// depois do contrato de import/rollback, em processo separado, sem apagar o histórico.
test('login tardio preserva ações de Pendência na interface real', async ({ page }) => {
    // Auth, NF/Pendência, dois contatos, cancelamento e reabertura usam o backend real.
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
    const contactRequests = [];
    page.on('request', request => {
        if (request.url().endsWith('/rest/v1/rpc/save_pendency_contact_with_log')) {
            contactRequests.push(request);
        }
    });
    // Dois cliques físicos na mesma intenção não podem criar dois históricos.
    await contact.getByRole('button', { name: 'Salvar contato', exact: true }).dblclick();
    await expect(contact).toBeHidden();
    await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
    await expect(drawer).toContainText('Contato interno após login tardio.');
    expect(contactRequests).toHaveLength(1);
    const pendencyId = await row.getAttribute('data-pendency-id');
    const savedContacts = await page.evaluate(async id => {
        const result = await window.RadarSessionContext.service.client
            .from('pendency_contacts').select('id, description').eq('pendency_id', id);
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }, pendencyId);
    expect(savedContacts).toHaveLength(1);
    expect(savedContacts[0].description).toBe('Contato interno após login tardio.');

    // Uma nova intenção deliberada permanece permitida depois do primeiro commit.
    await drawer.getByRole('button', { name: 'Registrar contato', exact: true }).click();
    await contact.getByLabel('Descrição do contato').fill('Segundo contato deliberado após o commit.');
    await contact.getByRole('button', { name: 'Salvar contato', exact: true }).click();
    await expect(contact).toBeHidden();
    await expect(drawer).toContainText('Segundo contato deliberado após o commit.');
    expect(contactRequests).toHaveLength(2);
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
    await page.reload();
    await waitForApplication(page, 'controller');
    await page.locator('#nav-pendencias').click();
    await page.locator(`tr[data-pendency-id="${pendencyId}"]`)
        .getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await expect(drawer).toContainText('Contato interno após login tardio.');
    await expect(drawer).toContainText('Segundo contato deliberado após o commit.');
    const contactsAfterReload = await page.evaluate(async id => {
        const result = await window.RadarSessionContext.service.client
            .from('pendency_contacts').select('id').eq('pendency_id', id);
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }, pendencyId);
    expect(contactsAfterReload).toHaveLength(2);
});

