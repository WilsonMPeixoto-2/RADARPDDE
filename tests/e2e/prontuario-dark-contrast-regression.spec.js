'use strict';

const { test, expect } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');

function luminance(rgb) {
    return rgb.map(channel => {
        const s = channel / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
}

test('Prontuário: textos essenciais de NF e escola mantêm contraste AA no tema escuro', async ({ page }, testInfo) => {
    const context = await prepareSchool(page, { withOpenUnidentified: true });
    await page.evaluate(async ({ schoolId, compKey }) => {
        await window.RadarApplicationServices.invoices.save({
            schoolId, compKey, expenseType: 'consumo',
            invoiceNumber: 'NF-CONTRASTE-2026', description: 'Material de teste visual',
            amount: 150, profile: 'controlador'
        });
        rebuildOperationalIndexes();
        persist();
        switchView('prontuario', schoolId);
    }, context);
    await page.getByRole('button', { name: 'Mudar para tema escuro', exact: true }).click();
    await expect(page.locator('body.dark-theme')).toHaveCount(1);
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const transitions = document.getAnimations().filter(animation => animation instanceof CSSTransition);
        await Promise.allSettled(transitions.map(transition => transition.finished));
    });

    const readColors = () => page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const paint = canvas.getContext('2d', { willReadFrequently: true });
        const pixel = () => Array.from(paint.getImageData(0, 0, 1, 1).data).slice(0, 3);
        return [
            '.prontuario-school-header h1', '#prontuario-verif-rows .verification-document-copy strong',
            '.invoice-document-title-line > strong', '.invoice-document-meta strong',
            '.invoice-document-panel-title strong', '.invoice-summary-block.is-bonification > span',
            '.invoice-bonification-toggle button:not(.is-selected)',
            '.prontuario-flow-action:not(.prontuario-flow-action-primary)',
            '.prontuario-tablist .prontuario-flow-tab:not(.active)', '.invoice-add-primary',
            '.invoice-add-secondary', '.invoice-pendency-view-button', '.evaluation-retification-trigger'
        ].map(selector => {
            const element = document.querySelector(selector);
            if (!element) return { selector, missing: true };
            const layers = [];
            for (let node = element; node; node = node.parentElement) {
                layers.unshift(getComputedStyle(node).backgroundColor);
            }
            // O canvas resolve color(srgb), color-mix e as transparências da página.
            for (const color of ['white', ...layers]) {
                paint.fillStyle = color;
                paint.fillRect(0, 0, 1, 1);
            }
            const background = pixel();
            paint.fillStyle = getComputedStyle(element).color;
            paint.fillRect(0, 0, 1, 1);
            return { selector, text: pixel(), background };
        });
    });
    let actual;
    try {
        await expect(async () => {
            actual = await readColors();
            for (const item of actual) {
                expect(item.missing, item.selector + ' deve existir').not.toBe(true);
                const fg = luminance(item.text);
                const bg = luminance(item.background);
                const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
                expect(ratio, item.selector + ' contraste: ' + ratio.toFixed(2) + ' (' + item.text + ' sobre ' + item.background + ')')
                    .toBeGreaterThanOrEqual(4.5);
            }
        }).toPass({ timeout: 5000 });
    } finally {
        if (actual) await testInfo.attach('contraste-prontuario-escuro', {
            body: Buffer.from(JSON.stringify(actual)), contentType: 'application/json'
        });
        await testInfo.attach('acoes-fiscais-tema-escuro', {
            body: await page.locator('.invoice-document-footer').first().screenshot(), contentType: 'image/png'
        });
    }
});
