// Sonda de auditoria (Manus): contraste de textos do Prontuário no tema escuro.
const { test } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');
const fs = require('fs');
const OUT = process.env.AUDIT_OUT || '/tmp';
const LABEL = process.env.AUDIT_LABEL || 'versao';

async function measure(page) {
    return page.evaluate(() => {
        const parse = c => (c.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
        const lum = ([r, g, b]) => {
            const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
            return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const bgOf = el => {
            for (let n = el; n; n = n.parentElement) {
                const c = parse(getComputedStyle(n).backgroundColor);
                if (c.length === 3 || (c.length === 4 && c[3] > 0.5)) return c;
            }
            return [255, 255, 255];
        };
        const pick = [
            ['nome do documento', '#prontuario-verif-rows .verification-document-name-cell, #prontuario-verif-rows td:first-child strong'],
            ['número da NF', '#prontuario-verif-rows .invoice-document-row strong, #prontuario-verif-rows .invoice-document-row td:first-child'],
            ['nome da escola (cabeçalho)', '.prontuario-school-header h1, .prontuario-school-header h2, .prontuario-school-header .school-title'],
            ['título Notas Fiscais', '#prontuario-verif-rows h4, #prontuario-verif-rows .fiscal-notes-title']
        ];
        const theme = document.documentElement.getAttribute('data-theme') || document.body.className;
        return { theme, items: pick.map(([label, sel]) => {
            const el = Array.from(document.querySelectorAll(sel)).find(e => e.offsetParent && e.textContent.trim());
            if (!el) return { label, found: false };
            const fg = parse(getComputedStyle(el).color);
            const bg = bgOf(el);
            const L1 = lum(fg), L2 = lum(bg);
            const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
            return { label, text: el.textContent.trim().slice(0, 40), color: getComputedStyle(el).color, bg: `rgb(${bg.join(',')})`, ratio: Math.round(ratio * 100) / 100 };
        }) };
    });
}

test('contraste tema escuro', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    page.on('dialog', d => d.accept());
    const context = await prepareSchool(page, { withOpenUnidentified: true });
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.evaluate(async ({ schoolId, compKey }) => {
        const s = window.RadarApplicationServices;
        await s.invoices.save({ schoolId, compKey, expenseType: 'consumo', invoiceNumber: 'NF-DEMO-01', description: 'Papelaria', amount: 420, profile: 'controlador' });
        rebuildOperationalIndexes(); persist(); switchView('prontuario', schoolId);
    }, context);
    const result = { claro: await measure(page) };
    await page.getByRole('button', { name: 'Mudar para tema escuro', exact: true }).click();
    await page.waitForTimeout(500);
    result.escuroAposTroca = await measure(page);
    await page.reload();
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.evaluate(({ schoolId }) => switchView('prontuario', schoolId), context);
    await page.waitForTimeout(800);
    result.escuroAposRecarregar = await measure(page);
    await page.screenshot({ path: `${OUT}/${LABEL}-escuro-recarregado.png` });
    fs.writeFileSync(`${OUT}/${LABEL}-contraste.json`, JSON.stringify(result, null, 2));
});
