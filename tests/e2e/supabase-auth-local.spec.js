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
            profileSwitcherHidden: true
        });

        await page.locator('#auth-logout-button').click();
        await expect(page.locator('#radar-auth-gate')).toBeVisible();
        await expect(page.locator('#radar-auth-status')).toContainText(/sessão/i);
        await context.close();
    });
}

test('Administrador técnico recebe superfície neutra e não herda o painel da Assistente', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'technical_admin').email);
    await waitForApplication(page, 'technical_admin');

    await expect(page.getByRole('heading', { name: 'Acesso técnico' })).toBeVisible();
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.getByText('Painel do Assistente de Verbas Federais')).toHaveCount(0);
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

test('RLS permite escrita na carteira do controlador e bloqueia escopos somente leitura', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'controller').email);
    await waitForApplication(page, 'controller');

    const result = await page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const before = await client.from('schools').select('id, denomination').order('id');
        if (before.error) throw before.error;
        const own = before.data.find(row => row.id === 'ESC-LOCAL');
        const readOnly = before.data.find(row => row.id === 'ESC-OTHER');
        const deniedName = `${readOnly.denomination} - alteração bloqueada`;
        const denied = await client.from('schools')
            .update({ denomination: deniedName })
            .eq('id', readOnly.id)
            .select('id, denomination');
        const readOnlyAfter = await client.from('schools')
            .select('id, denomination')
            .eq('id', readOnly.id)
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
            deniedError: denied.error?.code || null,
            deniedRows: denied.data || [],
            readOnlyName: readOnly.denomination,
            readOnlyAfter: readOnlyAfter.data?.denomination,
            allowedError: allowed.error?.code || null,
            allowedName: allowed.data?.denomination,
            restoredError: restored.error?.code || null,
            restoredName: restored.data?.denomination
        };
    });

    expect(result.visibleIds).toEqual(['ESC-LOCAL', 'ESC-OTHER']);
    expect(result.deniedError === null || typeof result.deniedError === 'string').toBe(true);
    expect(result.deniedRows).toEqual([]);
    expect(result.readOnlyAfter).toBe(result.readOnlyName);
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
