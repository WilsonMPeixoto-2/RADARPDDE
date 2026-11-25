'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
// Gate Auth real separado do piloto de correção; a fixture não altera a base anterior.
// eslint-disable-next-line playwright/no-skipped-test
test.skip(!enabled, 'Exige Supabase local descartável e operational-guidance-local.sql.');
test.use({ locale: 'pt-BR' });
const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Credencial efêmera da fixture Auth não fornecida.');
const SCHOOL = 'ESC-GUIDANCE-LOCAL';
const COMPETENCE = '2026-05';

async function visualAssetsReady(page) {
    // Os bootstraps aguardam scripts; as folhas de estilo e a marca são carregadas à parte.
    try {
        await page.waitForFunction(() => {
            const links = [...document.querySelectorAll('link[rel="stylesheet"], link[data-radar-nonblocking-style]')]
                .filter(link => new URL(link.href, location.href).origin === location.origin);
            const required = ['/src/styles/painel-controlador-expressiva.css',
                '/src/styles/global-visual-polish.css', '/src/styles/operational-guidance.css'];
            return required.every(pathname => links.some(link => {
                const declared = link.getAttribute('href');
                return declared === pathname || declared === pathname.slice(1)
                    || new URL(link.href, location.href).pathname === pathname;
            })) && links.every(link => link.rel === 'stylesheet' && link.sheet !== null);
        }, undefined, { timeout: 15000 });
    } catch (error) {
        const styles = await page.locator('link[rel="stylesheet"], link[data-radar-nonblocking-style]').evaluateAll(links => (
            links.map(link => ({
                declared: link.getAttribute('href'), resolved: link.href,
                rel: link.rel, sheetLoaded: link.sheet !== null
            }))
        ));
        throw new Error(`Folhas de estilo não ficaram prontas em 15 s: ${JSON.stringify(styles)}`, { cause: error });
    }
    const brand = page.locator('.sidebar-logo img.radar-original-logo');
    await expect(brand).toHaveCount(1);
    await expect.poll(() => brand.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await brand.evaluate(image => image.decode());
    await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
}

async function ready(page, role = 'controller') {
    await page.waitForFunction(expected => window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === expected, role);
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await expect(page.locator('#app-layout')).toBeVisible();
    await visualAssetsReady(page);
}

async function login(page, role = 'controller') {
    const account = users.find(user => user.profileId === role && user.active);
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
    await ready(page, role);
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
        const tables = ['verifications', 'registered_invoices', 'pendencies', 'assets', 'quality_provisional_movements'];
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
    await visualAssetsReady(page);
    const options = { animations: 'disabled' };
    await testInfo.attach(name, { body: locator ? await locator.screenshot(options) : await page.screenshot(options), contentType: 'image/png' });
}

async function ensureMobileMenuClosed(page) {
    const menu = page.locator('#mobile-menu-button');
    const sidebar = page.locator('aside.sidebar');
    await expect(menu).toBeVisible();
    if (await menu.getAttribute('aria-expanded') === 'true') {
        await sidebar.getByRole('button', { name: 'Fechar menu de navegação', exact: true }).click();
    }
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    await expect(sidebar).toHaveCSS('visibility', 'hidden');
    await expect.poll(() => sidebar.evaluate(node => node.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
}

test('Inventário recebe orientação no recorte patrimonial e abre o bem exato após reload no celular e desktop', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, 'inventory');
    const before = await page.evaluate(async schoolId => {
        const result = await window.RadarSessionContext.service.client.from('assets').select('*').eq('school_id', schoolId).order('id');
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }, SCHOOL);
    const dashboard = page.locator('[data-operational-guidance="dashboard"]');
    const card = dashboard.locator('[data-guidance-target-id="GUIDANCE-ASSET"][data-guidance-group="inventory"]');
    await expect(dashboard).toHaveCount(1);
    await expect(card).toContainText('Conferir inventariação');
    await expect(card).toContainText('Escola Sintética de Orientação');
    await expect(dashboard.locator('[data-guidance-filter="analysis"], [data-guidance-filter="bonus"]')).toHaveCount(0);
    await expect(dashboard.locator('[data-guidance-group]:not([data-guidance-group="inventory"])')).toHaveCount(0);
    await page.getByText('Já Inventariados', { exact: true }).click();
    await expect(card).toHaveCount(0);
    await page.getByText('Aguardando Inventariação', { exact: true }).click();
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeInViewport({ ratio: 1 });
    await capture(page, testInfo, 'orientacao-inventario-dashboard-desktop');
    await page.reload();
    await ready(page, 'inventory');
    await expect(card).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await ensureMobileMenuClosed(page);
    await setTheme(page, true);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeInViewport({ ratio: 1 });
    const box = await card.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await capture(page, testInfo, 'orientacao-inventario-dashboard-celular');
    await card.locator('[data-action="open-operational-guidance"]').click();
    const asset = page.locator('#tab-capital tr[data-asset-id="GUIDANCE-ASSET"]');
    await expect(asset).toBeFocused();
    await expect(page.locator('#prontuario-tab-capital')).toHaveAttribute('aria-selected', 'true');
    await expect(asset.getByText('Mesa sintética para conferência', { exact: true })).toBeVisible();

    async function captureAssetDestination(name) {
        await visualAssetsReady(page);
        const geometry = await asset.evaluate(row => {
            const bounds = node => {
                const { x, y, width, height } = node.getBoundingClientRect();
                return { x, y, width, height };
            };
            const tableViewport = row.closest('.table-responsive');
            return { viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
                focused: document.activeElement === row, row: bounds(row),
                identity: bounds(row.querySelector('td:first-child strong')), tableViewport: bounds(tableViewport),
                tableScroll: { left: tableViewport.scrollLeft, width: tableViewport.scrollWidth, visibleWidth: tableViewport.clientWidth } };
        });
        await testInfo.attach(`orientacao-inventario-destino-${name}-geometria`, {
            body: Buffer.from(JSON.stringify(geometry, null, 2)), contentType: 'application/json'
        });
        await capture(page, testInfo, `orientacao-inventario-destino-${name}`);
        expect.soft(geometry.focused).toBe(true);
        expect.soft(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport.width + 1);
        // A tabela pode rolar horizontalmente; a identidade e sua área visível não podem ficar cortadas.
        for (const [label, bounds] of [['Identidade do bem', geometry.identity], ['Área da tabela', geometry.tableViewport]]) {
            expect.soft(bounds.width, label).toBeGreaterThan(0);
            expect.soft(bounds.height, label).toBeGreaterThan(0);
            expect.soft(bounds.x, label).toBeGreaterThanOrEqual(0);
            expect.soft(bounds.x + bounds.width, label).toBeLessThanOrEqual(geometry.viewport.width + 1);
            expect.soft(bounds.y, label).toBeGreaterThanOrEqual(0);
            expect.soft(bounds.y + bounds.height, label).toBeLessThanOrEqual(geometry.viewport.height + 1);
        }
    }

    await captureAssetDestination('celular');
    await page.setViewportSize({ width: 1440, height: 900 });
    await asset.scrollIntoViewIfNeeded();
    await captureAssetDestination('desktop');
    const after = await page.evaluate(async schoolId => {
        const result = await window.RadarSessionContext.service.client.from('assets').select('*').eq('school_id', schoolId).order('id');
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }, SCHOOL);
    expect(after).toEqual(before);
});

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
    await queueItems.first().scrollIntoViewIfNeeded();
    await expect(queueItems.first()).toBeInViewport({ ratio: 1 });
    await capture(page, testInfo, 'orientacao-dashboard-fila-analise');

    const panel = await openSchool(page);
    await expect(panel.locator('#operational-school-guidance-content')).toBeHidden();
    const quality = page.getByRole('region', { name: 'Saídas sem ação definida', exact: true });
    await expect(quality).toHaveClass(/is-empty/);
    const qualityDetails = quality.locator('[data-quality-details]');
    await expect(qualityDetails).toHaveAttribute('aria-expanded', 'false');
    const fiscalSection = page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
    await expect(fiscalSection).toHaveCount(1);
    const fiscalTitle = fiscalSection.locator('.invoice-document-panel-title strong');
    await expect(fiscalTitle).toHaveText('Notas Fiscais');
    await expect(fiscalSection.locator('.invoice-bonification-toggle button')).toHaveText(['Sim', 'Não', 'N/A']);
    const invoice = page.locator('.invoice-document-row[data-invoice-id="GUIDANCE-FISCAL"]');
    await expect(invoice).toBeVisible();
    const composition = await page.evaluate(() => {
        const bounds = node => {
            const box = node.getBoundingClientRect();
            return { top: box.top, bottom: box.bottom, height: box.height, width: box.width, left: box.left, right: box.right };
        };
        const fiscal = document.querySelector('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
        const quality = document.getElementById('quality-provisional-panel');
        const invoice = document.querySelector('.invoice-document-row[data-invoice-id="GUIDANCE-FISCAL"]');
        const heading = invoice?.querySelector('.invoice-document-title, .invoice-document-identity') || invoice;
        return { scrollY: window.scrollY, contentScrollTop: document.querySelector('main.content-area').scrollTop,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            compact: bounds(document.querySelector('#operational-school-guidance')),
            quality: { ...bounds(quality), empty: quality.classList.contains('is-empty'),
                expanded: quality.querySelector('[data-quality-details]').getAttribute('aria-expanded') === 'true' },
            monthlyCard: bounds(quality.closest('.panel-card')),
            monthlyHeader: bounds(quality.closest('.panel-card').querySelector('.panel-header')),
            fiscalTitle: bounds(fiscal.querySelector('.invoice-document-panel-title strong')),
            bonificationControls: Array.from(fiscal.querySelectorAll('.invoice-bonification-toggle button'))
                .map(button => ({ label: button.textContent.trim(), ...bounds(button) })),
            invoice: bounds(invoice), invoiceIdentity: bounds(heading) };
    });
    await testInfo.attach('orientacao-composicao-1440x900', {
        body: Buffer.from(JSON.stringify(composition, null, 2)), contentType: 'application/json'
    });
    await capture(page, testInfo, 'orientacao-prontuario-recolhida-desktop');
    // Preservar também as capturas seguintes se a composição precisar de ajuste;
    // soft mantém a falha do gate, sem interromper a coleta somente de leitura.
    expect.soft(composition.scrollY).toBe(0);
    expect.soft(composition.contentScrollTop).toBe(0);
    // O contrato da primeira tela cobre a seção fiscal e seus controles.
    // A identidade e o foco de cada nota são exercitados na jornada seguinte.
    for (const [label, bounds] of [['Título da seção Notas Fiscais', composition.fiscalTitle],
        ...composition.bonificationControls.map(control => [`Bonificação: ${control.label}`, control])]) {
        expect.soft(bounds.height, label).toBeGreaterThan(0);
        expect.soft(bounds.width, label).toBeGreaterThan(0);
        expect.soft(bounds.top, label).toBeGreaterThanOrEqual(0);
        expect.soft(bounds.bottom, label).toBeLessThanOrEqual(composition.viewport.height);
        expect.soft(bounds.left, label).toBeGreaterThanOrEqual(0);
        expect.soft(bounds.right, label).toBeLessThanOrEqual(composition.viewport.width);
    }
    await qualityDetails.click();
    await expect(qualityDetails).toHaveAttribute('aria-expanded', 'true');
    await expect(quality.getByText('Registre saídas do extrato enquanto a Ação Integrada correspondente ainda não foi identificada.', { exact: true })).toBeVisible();
    await expect(quality.getByText('Nenhuma saída provisória registrada nesta competência.', { exact: true })).toBeVisible();
    await expect(quality.getByRole('button', { name: 'Atualizar', exact: true })).toBeVisible();
    await expect(quality.getByRole('button', { name: 'Registrar saída', exact: true })).toBeVisible();
    await capture(page, testInfo, 'orientacao-quality-vazio-expandido-desktop');
    await qualityDetails.click();
    await expect(qualityDetails).toHaveAttribute('aria-expanded', 'false');
    await expect(quality.getByText('Nenhuma saída provisória registrada nesta competência.', { exact: true })).toBeHidden();
    await panel.locator('[data-action="toggle-operational-guidance"]').click();
    await expect(panel.locator('#operational-school-guidance-content')).toBeVisible();
    await capture(page, testInfo, 'orientacao-prontuario-expandida-desktop', panel);
    await setTheme(page, true);
    await capture(page, testInfo, 'orientacao-prontuario-expandida-escuro', panel);
    await page.setViewportSize({ width: 390, height: 844 });
    await ensureMobileMenuClosed(page);
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
