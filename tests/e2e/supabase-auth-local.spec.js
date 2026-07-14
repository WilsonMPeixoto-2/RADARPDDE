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
        const before = await client.from('schools').select('id, name').order('id');
        if (before.error) throw before.error;
        const own = before.data.find(row => row.id === 'ESC-LOCAL');
        const readOnly = before.data.find(row => row.id === 'ESC-OTHER');
        const deniedName = `${readOnly.name} - alteração bloqueada`;
        const denied = await client.from('schools')
            .update({ name: deniedName })
            .eq('id', readOnly.id)
            .select('id, name');
        const readOnlyAfter = await client.from('schools')
            .select('id, name')
            .eq('id', readOnly.id)
            .single();

        const changedName = `${own.name} - teste RLS`;
        const allowed = await client.from('schools')
            .update({ name: changedName })
            .eq('id', own.id)
            .select('id, name')
            .single();
        const restored = await client.from('schools')
            .update({ name: own.name })
            .eq('id', own.id)
            .select('id, name')
            .single();

        return {
            visibleIds: before.data.map(row => row.id),
            deniedError: denied.error?.code || null,
            deniedRows: denied.data || [],
            readOnlyName: readOnly.name,
            readOnlyAfter: readOnlyAfter.data?.name,
            allowedError: allowed.error?.code || null,
            allowedName: allowed.data?.name,
            restoredError: restored.error?.code || null,
            restoredName: restored.data?.name
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

test('Gestão SME consulta a carteira, mas a política impede escrita operacional', async ({ page }) => {
    await signIn(page, fixtures.find(fixture => fixture.profileId === 'sme_management').email);
    await waitForApplication(page, 'sme_management');

    const result = await page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const before = await client.from('schools').select('id, name').eq('id', 'ESC-LOCAL').single();
        const attempted = `${before.data.name} - SME não deve salvar`;
        const write = await client.from('schools')
            .update({ name: attempted })
            .eq('id', 'ESC-LOCAL')
            .select('id, name');
        const after = await client.from('schools').select('id, name').eq('id', 'ESC-LOCAL').single();
        return {
            before: before.data.name,
            after: after.data.name,
            writeRows: write.data || [],
            writeError: write.error?.code || null
        };
    });

    expect(result.after).toBe(result.before);
    expect(result.writeRows).toEqual([]);
    expect(result.writeError === null || typeof result.writeError === 'string').toBe(true);
});
