// Sonda de auditoria (Manus, 15/11/2026): regra CSS que define a cor do texto
// da linha de NF no Prontuário depois de alternar para o tema escuro.
const { test } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');
const fs = require('fs');
const OUT = process.env.AUDIT_OUT || '/tmp';
const LABEL = process.env.AUDIT_LABEL || 'versao';
test('regra de cor da linha de NF no tema escuro', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    page.on('dialog', d => d.accept());
    const context = await prepareSchool(page, { withOpenUnidentified: true });
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.evaluate(async ({ schoolId, compKey }) => {
        const s = window.RadarApplicationServices;
        await s.invoices.save({ schoolId, compKey, expenseType: 'consumo', invoiceNumber: 'NF-DEMO-01', description: 'Papelaria', amount: 420, profile: 'controlador' });
        rebuildOperationalIndexes(); persist(); switchView('prontuario', schoolId);
    }, context);
    await page.getByRole('button', { name: 'Mudar para tema escuro', exact: true }).click();
    await page.waitForTimeout(3000);
    const report = await page.evaluate(() => {
        const els = [...document.querySelectorAll('#prontuario-verif-rows .invoice-document-row strong, #prontuario-verif-rows .invoice-document-row td:first-child')];
        return els.slice(0, 4).map(el => {
            const rules = [];
            for (const sheet of document.styleSheets) {
                let list; try { list = sheet.cssRules; } catch (_) { continue; }
                for (const rule of list || []) {
                    if (!rule.selectorText || !rule.style || !rule.style.color) continue;
                    try { if (el.matches(rule.selectorText)) rules.push({ sheet: (sheet.href || 'inline').split('/').slice(-1)[0], selector: rule.selectorText.slice(0, 220), color: rule.style.color }); } catch (_) {}
                }
            }
            return { tag: el.tagName + '.' + el.className, text: el.textContent.trim().slice(0, 50), color: getComputedStyle(el).color, inline: el.getAttribute('style'), rules };
        });
    });
    fs.writeFileSync(`${OUT}/${LABEL}-regra-nf.json`, JSON.stringify(report, null, 2));
    await page.screenshot({ path: `${OUT}/${LABEL}-escuro-pos-troca.png` });
});
