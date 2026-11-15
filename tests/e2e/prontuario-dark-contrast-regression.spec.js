'use strict';

const { test, expect } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');

function luminance(rgb) {
    return rgb.map(channel => {
        const s = channel / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
}

function parseRGB(value) {
    const match = value.match(/[\d.]+/g);
    return match?.slice(0, 3).map(Number);
}

test('Prontuário: textos essenciais de NF e escola mantêm contraste AA no tema escuro', async ({ page }) => {
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
    // Aguarda a transição de background (150ms), antes de medir o estado estável.
    await page.waitForTimeout(300);

    const actual = await page.evaluate(() => {
        return [
            '.prontuario-school-header h1',
            '#prontuario-verif-rows .verification-document-copy strong',
            '.invoice-document-title-line > strong',
            '.invoice-document-meta strong'
        ].map(selector => {
            const element = document.querySelector(selector);
            if (!element) return { selector, missing: true };
            let background, ancestor = element;
            while (ancestor) {
                const computed = getComputedStyle(ancestor);
                const bg = computed.backgroundColor;
                if (bg.startsWith('rgb(')) {
                    background = bg;
                    break;
                }
                ancestor = ancestor.parentElement;
            }
            return {
                selector,
                text: getComputedStyle(element).color,
                background,
                backgroundElement: ancestor?.className || ancestor?.tagName
            };
        });
    });
    for (const item of actual) {
        expect(item.missing, item.selector + ' deve existir').not.toBe(true);
        const fg = luminance(parseRGB(item.text));
        const bg = luminance(parseRGB(item.background));
        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        expect(ratio, item.selector + ' contraste: ' + ratio.toFixed(2) + ' (' + item.text + ' sobre ' + item.background + ')')
            .toBeGreaterThanOrEqual(4.5);
    }
});
