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

const identities = fixtures
    .filter(fixture => fixture.profileId && fixture.active)
    .map(fixture => [fixture.email, fixture.profileId]);

async function signIn(page, email) {
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(email);
    await page.locator('#radar-auth-password').fill(fixturePassword);
    await page.locator('#radar-auth-form button[type="submit"]').click();
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

for (const [email, role] of identities) {
    test(`${role} autentica, recebe contexto seguro e encerra a sessão`, async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await signIn(page, email);
        await waitForApplication(page, role);

        const state = await page.evaluate(() => ({
            dataMode: window.RADAR_PDDE_CONFIG.dataMode,
            repository: window.RadarDataContext.capabilities.mode,
            role: document.body.dataset.authRole,
            hasSessionInPublicContext: Object.hasOwn(window.RadarDataContext.authentication, 'session'),
            profileSwitcherHidden: document.querySelector('.profile-switcher').hidden
        }));
        expect(state).toEqual({
            dataMode: 'supabase-preview',
            repository: 'supabase',
            role,
            hasSessionInPublicContext: false,
            profileSwitcherHidden: role !== 'technical_admin'
        });

        await page.locator('#auth-logout-button').click();
        await expect(page.locator('#radar-auth-gate')).toBeVisible();
        await expect(page.locator('#radar-auth-status')).toHaveText('Entre para acessar o RADAR PDDE.');
        await context.close();
    });
}

test('Administrador técnico recebe navegação completa e alterna entre os quatro perfis funcionais', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'technical_admin').email);
    await waitForApplication(page, 'technical_admin');

    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.profile-switcher')).toBeVisible();
    await expect(page.locator('.sidebar .nav-item:visible').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acesso técnico' })).toHaveCount(0);

    const simulatedProfiles = [
        ['assistente', /Assistente/i],
        ['sme', /SME/i],
        ['inventario', /Inventário/i],
        ['controlador', /Controlador/i]
    ];

    for (const [profile, expectedLabel] of simulatedProfiles) {
        const state = await page.evaluate(simulatedProfile => {
            window.switchProfile(simulatedProfile);
            return {
                label: document.getElementById('profile-btn-label')?.textContent || '',
                authRole: window.RadarAuthContext?.authorization?.role,
                bodyRole: document.body.dataset.authRole
            };
        }, profile);
        expect(state.label).toMatch(expectedLabel);
        expect(state.authRole).toBe('technical_admin');
        expect(state.bodyRole).toBe('technical_admin');
        await expect(page.locator('.sidebar')).toBeVisible();
    }

    await expect(page.locator('#auth-logout-button')).toBeVisible();
});

const deniedIdentities = fixtures
    .filter(fixture => !fixture.profileId || !fixture.active)
    .map(fixture => [
        fixture.email,
        fixture.profileId ? /inativo/i : /não possui perfil/i
    ]);

for (const [email, expectedMessage] of deniedIdentities) {
    test(`${email} permanece fora dos dados institucionais`, async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await signIn(page, email);
        await expect(page.locator('#radar-auth-status')).toContainText(expectedMessage);
        await expect(page.locator('#radar-auth-gate')).toBeVisible();
        expect(await page.evaluate(() => Boolean(window.RadarDataContext?.ready))).toBe(false);
        await context.close();
    });
}

test('RLS permite escrita na carteira própria e colaboração em outra carteira da mesma CRE', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'controller').email);
    await waitForApplication(page, 'controller');

    const result = await page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const before = await client.from('schools').select('id, denomination').order('id');
        if (before.error) throw before.error;
        const own = before.data.find(row => row.id === 'ESC-LOCAL');
        const colleague = before.data.find(row => row.id === 'ESC-OTHER');

        const collaborativeName = `${colleague.denomination} - cobertura colaborativa`;
        const collaborative = await client.from('schools')
            .update({ denomination: collaborativeName })
            .eq('id', colleague.id)
            .select('id, denomination')
            .single();
        const collaborativeRestored = await client.from('schools')
            .update({ denomination: colleague.denomination })
            .eq('id', colleague.id)
            .select('id, denomination')
            .single();

        const changedName = `${own.denomination} - teste RLS`;
        const allowed = await client.from('schools')
            .update({ denomination: changedName })
            .eq('id', own.id)
            .select('id, denomination')
            .single();
        const restored = await client.from('schools')
            .update({ denomination: own.denomination })
            .eq('id', own.id)
            .select('id, denomination')
            .single();

        return {
            visibleIds: before.data.map(row => row.id),
            collaborativeError: collaborative.error?.code || null,
            collaborativeName: collaborative.data?.denomination,
            collaborativeRestoreError: collaborativeRestored.error?.code || null,
            collaborativeRestoredName: collaborativeRestored.data?.denomination,
            allowedError: allowed.error?.code || null,
            allowedName: allowed.data?.denomination,
            restoredError: restored.error?.code || null,
            restoredName: restored.data?.denomination
        };
    });

    expect(result.visibleIds).toEqual(['ESC-LOCAL', 'ESC-OTHER']);
    expect(result.collaborativeError).toBeNull();
    expect(result.collaborativeName).toContain('cobertura colaborativa');
    expect(result.collaborativeRestoreError).toBeNull();
    expect(result.collaborativeRestoredName).not.toContain('cobertura colaborativa');
    expect(result.allowedError).toBeNull();
    expect(result.allowedName).toContain('teste RLS');
    expect(result.restoredError).toBeNull();
    expect(result.restoredName).not.toContain('teste RLS');
});

test('Assistente mantém controladores e Equipe de Inventário pela RLS', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'federal_assistant').email);
    await waitForApplication(page, 'federal_assistant');

    const result = await page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const suffix = crypto.randomUUID().slice(0, 8);
        const controllerId = `CTRL-E2E-${suffix}`;
        const inventoryId = `INV-E2E-${suffix}`;
        const controllerInsert = await client.from('controllers').insert({
            id: controllerId,
            name: 'Controlador E2E',
            email: `controller-${suffix}@example.test`,
            active: true
        }).select('id, active').single();
        const controllerUpdate = await client.from('controllers')
            .update({ active: false })
            .eq('id', controllerId)
            .select('id, active')
            .single();
        const inventoryInsert = await client.from('inventory_team_members').insert({
            id: inventoryId,
            name: 'Inventário E2E',
            email: `inventory-${suffix}@example.test`,
            active: true
        }).select('id, active').single();
        const inventoryUpdate = await client.from('inventory_team_members')
            .update({ active: false })
            .eq('id', inventoryId)
            .select('id, active')
            .single();
        return {
            controllerInsertError: controllerInsert.error?.code || null,
            controllerUpdateError: controllerUpdate.error?.code || null,
            controllerActive: controllerUpdate.data?.active,
            inventoryInsertError: inventoryInsert.error?.code || null,
            inventoryUpdateError: inventoryUpdate.error?.code || null,
            inventoryActive: inventoryUpdate.data?.active
        };
    });

    expect(result).toEqual({
        controllerInsertError: null,
        controllerUpdateError: null,
        controllerActive: false,
        inventoryInsertError: null,
        inventoryUpdateError: null,
        inventoryActive: false
    });
});

test('Gestão SME consulta a carteira e a equipe, mas não executa escrita operacional', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'sme_management').email);
    await waitForApplication(page, 'sme_management');

    const result = await page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const before = await client.from('schools').select('id, denomination').eq('id', 'ESC-LOCAL').single();
        const attempted = `${before.data.denomination} - SME não deve salvar`;
        const write = await client.from('schools')
            .update({ denomination: attempted })
            .eq('id', 'ESC-LOCAL')
            .select('id, denomination');
        const after = await client.from('schools').select('id, denomination').eq('id', 'ESC-LOCAL').single();
        const controllers = await client.from('controllers').select('id').limit(1);
        const existingControllerId = controllers.data?.[0]?.id;
        const controllerWrite = existingControllerId
            ? await client.from('controllers')
                .update({ name: 'SME não deve alterar' })
                .eq('id', existingControllerId)
                .select('id')
            : { data: [], error: null };
        const inventory = await client.from('inventory_team_members').select('id').limit(1);
        const existingInventoryId = inventory.data?.[0]?.id;
        const inventoryWrite = existingInventoryId
            ? await client.from('inventory_team_members')
                .update({ name: 'SME não deve alterar' })
                .eq('id', existingInventoryId)
                .select('id')
            : { data: [], error: null };
        return {
            before: before.data.denomination,
            after: after.data.denomination,
            writeRows: write.data || [],
            writeError: write.error?.code || null,
            controllersReadable: Array.isArray(controllers.data),
            controllerWriteRows: controllerWrite.data || [],
            controllerWriteError: controllerWrite.error?.code || null,
            inventoryReadable: Array.isArray(inventory.data),
            inventoryWriteRows: inventoryWrite.data || [],
            inventoryWriteError: inventoryWrite.error?.code || null
        };
    });

    expect(result.after).toBe(result.before);
    expect(result.writeRows).toEqual([]);
    expect(result.writeError === null || typeof result.writeError === 'string').toBe(true);
    expect(result.controllersReadable).toBe(true);
    expect(result.controllerWriteRows).toEqual([]);
    expect(result.controllerWriteError === null || typeof result.controllerWriteError === 'string').toBe(true);
    expect(result.inventoryReadable).toBe(true);
    expect(result.inventoryWriteRows).toEqual([]);
    expect(result.inventoryWriteError === null || typeof result.inventoryWriteError === 'string').toBe(true);
});
