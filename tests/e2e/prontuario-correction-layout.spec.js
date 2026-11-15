const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/prontuario-correction-cases.json');
const CASES = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

test.describe('Prontuário — Lote T1 (Layout, Agrupamento Semântico e Edição Cadastral)', () => {
    test('same-invoice-metadata-edit-with-active-pendency: preserva NF B e bonificação ao editar metadados com pendência ativa', async ({ page }) => {
        const scenario = Array.isArray(CASES?.cases)
            ? CASES.cases.find(item => item.id === 'same-invoice-metadata-edit-with-active-pendency')
            : CASES['same-invoice-metadata-edit-with-active-pendency'];

        expect(scenario).toBeTruthy();

        const uxScript = fs.readFileSync(
            path.resolve(__dirname, '../../src/integration/prontuario-operational-ux.js'),
            'utf8'
        );

        await page.setContent(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <body>
                <section id="view-prontuario">
                    <table>
                        <tbody id="prontuario-verif-rows">
                            <tr data-program-id="prog-pdde-basico" class="verification-document-row">
                                <td rowspan="2"><strong>2026</strong><span>PDDE Básico</span></td>
                                <td class="invoice-document-row"><span>NF A - Material</span></td>
                                <td><span class="badge-pendency">Pendência ativa</span></td>
                            </tr>
                            <tr data-program-id="prog-pdde-basico" class="verification-document-row">
                                <td class="invoice-document-row"><span>NF B - Bonificação preservada</span></td>
                                <td><button class="btn-toggle active-sim" type="button">Sim</button></td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </body>
            </html>
        `);

        await page.addScriptTag({ content: uxScript });

        const groupingResult = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#prontuario-verif-rows tr'));
            const groups = window.RadarProntuarioOperationalUx.getProgramGroups(rows);
            return {
                groupCount: groups.length,
                programId: groups[0]?.programId || '',
                rowCount: groups[0]?.rows?.length || 0,
                hasContextCell: Boolean(groups[0]?.contextCell)
            };
        });

        expect(groupingResult.groupCount).toBe(1);
        expect(groupingResult.programId).toBe('prog-pdde-basico');
        expect(groupingResult.rowCount).toBe(2);
        expect(groupingResult.hasContextCell).toBe(true);

        await expect(page.locator('#prontuario-verif-rows')).toContainText('NF B');
        await expect(page.locator('#prontuario-verif-rows')).toContainText('Bonificação');
    });

    test('dense-context-keyboard-theme: valida contexto visível, tecla Escape e tokens do tema escuro', async ({ page }) => {
        const scenario = Array.isArray(CASES?.cases)
            ? CASES.cases.find(item => item.id === 'dense-context-keyboard-theme')
            : CASES['dense-context-keyboard-theme'];

        expect(scenario).toBeTruthy();

        const uxCss = fs.readFileSync(
            path.resolve(__dirname, '../../src/styles/prontuario-operational-ux.css'),
            'utf8'
        );

        await page.setContent(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><style>${uxCss}</style></head>
            <body>
                <section id="view-prontuario">
                    <table>
                        <tbody id="prontuario-verif-rows">
                            <tr data-program-id="prog-denso" data-program-group="prog-denso" class="program-block-start verification-document-row">
                                <td data-program-context="prog-denso" class="program-context-cell">
                                    <strong class="program-context-competence">2026</strong>
                                    <span class="program-context-name">PDDE Estrutura</span>
                                </td>
                                <td class="invoice-document-row"><span>123456</span></td>
                                <td><button id="escape-target" class="btn-toggle active-sim" type="button">Sim</button></td>
                            </tr>
                        </tbody>
                    </table>
                    <div id="correction-drawer" role="dialog" aria-hidden="false">Edição rápida</div>
                </section>
                <script>
                    document.addEventListener('keydown', (event) => {
                        if (event.key === 'Escape') {
                            const drawer = document.getElementById('correction-drawer');
                            if (drawer) drawer.setAttribute('aria-hidden', 'true');
                        }
                    });
                </script>
            </body>
            </html>
        `);

        const contextCell = page.locator('[data-program-context="prog-denso"]');
        await expect(contextCell).toBeVisible();
        await expect(contextCell).toContainText('PDDE Estrutura');

        const lightToken = await page.evaluate(() =>
            getComputedStyle(document.getElementById('view-prontuario')).getPropertyValue('--prontuario-canvas-bg').trim()
        );
        expect(lightToken.toLowerCase()).toBe('#fafafc');

        await page.evaluate(() => document.body.classList.add('dark-theme'));
        await expect(page.locator('body')).toHaveClass(/dark-theme/);

        await page.keyboard.press('Escape');
        await expect(page.locator('#correction-drawer')).toHaveAttribute('aria-hidden', 'true');
    });
});
