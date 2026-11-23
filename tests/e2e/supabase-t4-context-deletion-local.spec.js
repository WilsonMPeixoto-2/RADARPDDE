'use strict';

// T4 / Release 2: prova do clique real, Supabase local/Auth/RLS, persistência e
// outra sessão. A aplicação é em dados sintéticos, nunca no banco institucional.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_CORRECTION_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável com Auth/RLS e migração T4.');
test.describe.configure({ mode: 'default' });
const SCHOOL = 'ESC-T4-CONTEXT';
const COMPETENCE = '2026-05';
const FIXTURES = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Credencial sintética Auth ausente.');

async function login(page, profile) {
    const account = FIXTURES.find(a => a.profileId === profile && a.active);
    if (!account) throw new Error('Fixture sem perfil ' + profile);
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await page.waitForFunction(role =>
        window.RadarDataContext?.ready === true &&
        window.RadarAuthContext?.authorization?.role === role, profile);
    await expect(page.locator('#radar-auth-gate')).toBeHidden();
    await page.evaluate(() => window.RadarProductExtensionsReady);
    if (['controller', 'federal_assistant'].includes(profile)) {
        await page.locator('#global-competence-select').selectOption(COMPETENCE);
        await page.waitForFunction(key =>
            window.RadarApplicationServices.data.currentOperationalCompetence === key, COMPETENCE);
    }
}

async function openSchool(page) {
    await page.goto('/escolas/' + SCHOOL);
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
}

async function enablePilotAndOpen(page) {
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.RADAR_T4_CONTEXT_DELETION_PILOT = true;
        window.renderProntuario('ESC-T4-CONTEXT');
    });
    const action = page.locator('tr[data-program-header="BASIC"]')
        .getByRole('button', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(action).toBeVisible();
    await action.click();
    return page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
}

async function snapshot(page) {
    return page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const school = 'ESC-T4-CONTEXT';
        const [checks, invoices, pendencies, contacts, assets] = await Promise.all([
            client.from('verifications').select('id,competence_id,program_id').eq('school_id', school),
            client.from('registered_invoices').select('id,competence_id,program_id').eq('school_id', school),
            client.from('pendencies').select('id,competence_origin,program_id').eq('school_id', school),
            client.from('pendency_contacts').select('id,pendency_id').eq('school_id', school),
            client.from('assets').select('id,status').eq('school_id', school)
        ]);
        for (const result of [checks, invoices, pendencies, contacts, assets]) {
            if (result.error) throw new Error(result.error.message);
        }
        return {
            verifications: checks.data.map(x => x.id).sort(),
            invoices: invoices.data.map(x => x.id).sort(),
            pendencies: pendencies.data.map(x => x.id).sort(),
            contacts: contacts.data.map(x => x.id).sort(),
            assets: assets.data.map(x => x.id).sort()
        };
    });
}

test('T4 real: prévia e cancelamento não alteram escola, NFs, Pendências ou patrimônio', async ({ page }, testInfo) => {
    await login(page, 'controller');
    await openSchool(page);
    const before = await snapshot(page);
    const dialog = await enablePilotAndOpen(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Escola Fictícia de Correção de Contexto');
    await expect(dialog).toContainText('Maio');
    await expect(dialog).toContainText('PDDE Básico');
    await expect(dialog).toContainText('verificação do programa');
    await expect(dialog).toContainText('notas fiscais');
    await expect(dialog).toContainText('Pendências');
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão do contexto' })).toBeEnabled();
    await testInfo.attach('t4-context-preview-desktop', {
        body: await dialog.screenshot(), contentType: 'image/png'
    });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(await snapshot(page)).toEqual(before);
});

test('T4 real: excluir contexto pelo botão preserva programa/mês vizinhos e contato geral', async ({ page, browser }, testInfo) => {
    // A jornada inclui duas sessões independentes e uma recarga real.
    test.setTimeout(60_000);
    await login(page, 'controller');
    await openSchool(page);
    const before = await snapshot(page);
    expect(before.verifications).toContain('ESC-T4-CONTEXT::2026-05::BASIC');
    expect(before.invoices).toContain('T4-CTX-NF-A');
    expect(before.invoices).toContain('T4-CTX-NF-B');
    expect(before.invoices).toContain('T4-CTX-NF-NEIGHBOR');
    expect(before.invoices).toContain('T4-CTX-NF-JUNE');

    const dialog = await enablePilotAndOpen(page);
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão do contexto' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Confirmar exclusão do contexto' }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    const after = await snapshot(page);

    expect(after.verifications).not.toContain('ESC-T4-CONTEXT::2026-05::BASIC');
    expect(after.verifications).toEqual([
        'ESC-T4-CONTEXT::2026-05::CONECTADA',
        'ESC-T4-CONTEXT::2026-06::BASIC'
    ]);
    expect(after.invoices).toEqual(['T4-CTX-NF-JUNE', 'T4-CTX-NF-NEIGHBOR'].sort());
    expect(after.pendencies).toEqual(['T4-CTX-P-NEIGHBOR']);
    expect(after.contacts).toEqual(['T4-CTX-C-GENERAL']);
    expect(after.assets).toEqual([]);

    const second = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const other = await second.newPage();
        await login(other, 'federal_assistant');
        const independent = await snapshot(other);
        expect(independent).toEqual(after);
        await testInfo.attach('t4-context-preserved-neighbor', {
            body: await other.screenshot({ fullPage: false }), contentType: 'image/png'
        });
    } finally {
        await second.close();
    }
});
