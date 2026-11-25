'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
// Gate Auth real separado do piloto de correção; a fixture não altera a base anterior.
// eslint-disable-next-line playwright/no-skipped-test
test.skip(!enabled, 'Exige Supabase local descartável e operational-guidance-local.sql.');
const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Credencial efêmera da fixture Auth não fornecida.');
const SCHOOL = 'ESC-GUIDANCE-LOCAL';
const COMPETENCE = '2026-05';

async function ready(page) {
    await page.waitForFunction(() => window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === 'controller');
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await expect(page.locator('#app-layout')).toBeVisible();
}

async function login(page) {
    const account = users.find(user => user.profileId === 'controller' && user.active);
    await page.goto('/');
    const runtime = await page.evaluate(() => ({
        mode: window.RADAR_PDDE_CONFIG?.dataMode,
        url: window.RADAR_PDDE_CONFIG?.supabase?.url,
        correctionPilot: window.RADAR_PDDE_CONFIG?.features?.operationalCorrectionPilot === true,
        historyPilots: Boolean(window.RADAR_T4_CONTEXT_DELETION_PILOT
            || window.RADAR_T4_ITEM_HISTORY_PILOT || window.RADAR_T5_HISTORY_PILOT)
    }));
    expect(runtime.mode).toBe('supabase-preview');
    expect(['localhost', '127.0.0.1']).toContain(new URL(runtime.url).hostname);
    expect(runtime.correctionPilot).toBe(false);
    expect(runtime.historyPilots).toBe(false);
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await ready(page);
    await page.locator('#global-competence-select').selectOption(COMPETENCE);
    await page.waitForFunction(() => window.RadarApplicationServices.data.currentOperationalCompetence === '2026-05');
}

async function openSchool(page) {
    await page.goto('/escolas/' + SCHOOL);
    await ready(page);
    const panel = page.locator('#operational-school-guidance');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-guidance-school-id', SCHOOL);
    await expect(panel.locator('[data-action="toggle-operational-guidance"]')).toHaveAttribute('aria-expanded', 'false');
    return panel;
}

async function showGroup(page, group) {
    const panel = await openSchool(page);
    await panel.locator('[data-action="toggle-operational-guidance"]').click();
    const content = panel.locator('#operational-school-guidance-content');
    await expect(content).toBeVisible();
    await content.locator(`[data-guidance-filter="${group}"]`).click();
    return content;
}

async function snapshot(page) {
    return page.evaluate(async schoolId => {
        const client = window.RadarSessionContext.service.client;
        const tables = ['verifications', 'registered_invoices', 'pendencies', 'assets'];
        const results = await Promise.all(tables.map(table => client.from(table).select('*').eq('school_id', schoolId).order('id')));
        const state = {};
        results.forEach((result, index) => {
            if (result.error) throw new Error(result.error.message);
            state[tables[index]] = result.data;
        });
        const attempts = await client.from('pendency_attempts').select('*').eq('pendency_id', 'GUIDANCE-REVIEW').order('id');
        if (attempts.error) throw new Error(attempts.error.message);
        state.pendency_attempts = attempts.data;
        return state;
    }, SCHOOL);
}

async function setTheme(page, dark) {
    const current = await page.locator('body').evaluate(node => node.classList.contains('dark-theme'));
    if (current !== dark) await page.locator('#theme-toggle-btn').click();
    await expect.poll(() => page.locator('body').evaluate(node => node.classList.contains('dark-theme'))).toBe(dark);
}

async function capture(page, testInfo, name, locator = null) {
    await testInfo.attach(name, { body: locator ? await locator.screenshot() : await page.screenshot(), contentType: 'image/png' });
}

test('orientação autenticada sem pilotos nasce compacta e conserva a área fiscal no desktop, escuro e celular', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    const before = await snapshot(page);
    const dashboard = page.locator('[data-operational-guidance="dashboard"]');
    await expect(dashboard).toHaveCount(1);
    await expect(dashboard).toBeVisible();
    const analysisFilter = dashboard.locator('[data-guidance-filter="analysis"]');
    await analysisFilter.click();
    await expect(analysisFilter).toHaveAttribute('aria-pressed', 'true');
    const queueItems = dashboard.locator('[data-guidance-group]');
    await expect(queueItems.first()).toBeVisible();
    expect(await queueItems.evaluateAll(items => items.every(item => item.dataset.guidanceGroup === 'analysis'))).toBe(true);
    await capture(page, testInfo, 'orientacao-dashboard-fila-analise', dashboard);

    const panel = await openSchool(page);
    await expect(panel.locator('#operational-school-guidance-content')).toBeHidden();
    const invoice = page.locator('.invoice-document-row[data-invoice-id="GUIDANCE-FISCAL"]');
    await expect(invoice).toBeVisible();
    const composition = await page.evaluate(() => {
        const bounds = node => {
            const box = node.getBoundingClientRect();
            return { top: box.top, bottom: box.bottom, height: box.height, left: box.left, right: box.right };
        };
        const invoice = document.querySelector('.invoice-document-row[data-invoice-id="GUIDANCE-FISCAL"]');
        const heading = invoice?.querySelector('.invoice-document-title, .invoice-document-identity') || invoice;
        return { scrollY: window.scrollY, viewport: { width: window.innerWidth, height: window.innerHeight },
            compact: bounds(document.querySelector('#operational-school-guidance')),
            invoice: bounds(invoice), invoiceIdentity: bounds(heading) };
    });
    await testInfo.attach('orientacao-composicao-1440x900', {
        body: Buffer.from(JSON.stringify(composition, null, 2)), contentType: 'application/json'
    });
    await capture(page, testInfo, 'orientacao-prontuario-recolhida-desktop');
    // Preservar também as capturas seguintes se a composição precisar de ajuste;
    // soft mantém a falha do gate, sem interromper a coleta somente de leitura.
    expect.soft(composition.scrollY).toBe(0);
    expect.soft(composition.invoiceIdentity.top).toBeGreaterThanOrEqual(0);
    expect.soft(composition.invoiceIdentity.top).toBeLessThan(composition.viewport.height);
    await panel.locator('[data-action="toggle-operational-guidance"]').click();
    await expect(panel.locator('#operational-school-guidance-content')).toBeVisible();
    await capture(page, testInfo, 'orientacao-prontuario-expandida-desktop', panel);
    await setTheme(page, true);
    await capture(page, testInfo, 'orientacao-prontuario-expandida-escuro', panel);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await capture(page, testInfo, 'orientacao-prontuario-expandida-celular', panel);
    await page.setViewportSize({ width: 1440, height: 900 });
    await setTheme(page, false);
    expect(await snapshot(page)).toEqual(before);
});

test('orientação abre IDs exatos após hidratação, distingue relógios e conserva o resultado consolidado', async ({ page }) => {
    test.setTimeout(120000);
    await login(page);
    const before = await snapshot(page);

    const fiscal = await showGroup(page, 'analysis');
    const fiscalCard = fiscal.locator('[data-guidance-group="analysis"][data-guidance-target-id="GUIDANCE-FISCAL"]');
    await expect(fiscalCard).toContainText('Não há uma conclusão fiscal individual aplicável');
    await expect(fiscal.locator('[data-guidance-group="analysis"][data-guidance-target-id="GUIDANCE-IDENTIFY"]')).toHaveCount(0);
    await fiscalCard.locator('[data-action="open-operational-guidance"]').click();
    await expect(page.locator('.invoice-document-row[data-invoice-id="GUIDANCE-FISCAL"]')).toBeFocused();
    await expect(page.locator('#prontuario-tab-verificacoes')).toHaveAttribute('aria-selected', 'true');

    const identify = await showGroup(page, 'identify');
    const identifyCard = identify.locator('[data-guidance-group="identify"][data-guidance-target-id="GUIDANCE-IDENTIFY"]');
    await expect(identifyCard).toContainText('registro provisório');
    await identifyCard.locator('[data-action="open-operational-guidance"]').click();
    await expect(page.locator('.invoice-document-row[data-invoice-id="GUIDANCE-IDENTIFY"]')).toBeFocused();

    const review = await showGroup(page, 'review');
    const reviewCard = review.locator('[data-guidance-group="review"][data-guidance-target-id="GUIDANCE-REVIEW"]');
    await expect(reviewCard).toContainText('Desde a abertura');
    await expect(reviewCard).toContainText('Espera da etapa atual');
    const clockLabels = await reviewCard.locator('.operational-guidance-ages dd').allTextContents();
    const [historical, current] = clockLabels.map(label => Number.parseInt(label, 10));
    expect(historical).toBeGreaterThan(current + 30);
    await reviewCard.locator('[data-action="open-operational-guidance"]').click();
    const drawer = page.locator('#pendency-detail-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-pendency-ref', /GUIDANCE-REVIEW/);
    await expect(drawer).toBeFocused();

    const inventory = await showGroup(page, 'inventory');
    const assetCard = inventory.locator('[data-guidance-group="inventory"][data-guidance-target-id="GUIDANCE-ASSET"]');
    await expect(assetCard).toContainText('Encaminhada');
    await assetCard.locator('[data-action="open-operational-guidance"]').click();
    await expect(page.locator('tr[data-asset-id="GUIDANCE-ASSET"]')).toBeFocused();
    await expect(page.locator('#prontuario-tab-capital')).toHaveAttribute('aria-selected', 'true');

    const bonus = await showGroup(page, 'bonus');
    const bonusCard = bonus.locator('[data-guidance-group="bonus"]');
    await expect(bonusCard).toHaveCount(1);
    await expect(bonusCard).toContainText('Consolidar alterações da bonificação');
    await expect(bonusCard).toContainText('resultado histórico Apta continua registrado');
    await expect(bonusCard.locator('[data-action="open-operational-guidance"]')).toHaveAttribute('data-guidance-target-id', '2026-05_BASIC');
    await bonusCard.locator('[data-action="open-operational-guidance"]').click();
    await expect(page.locator('tr[data-program-header="BASIC"]')).toBeFocused();
    expect(await snapshot(page)).toEqual(before);
});
