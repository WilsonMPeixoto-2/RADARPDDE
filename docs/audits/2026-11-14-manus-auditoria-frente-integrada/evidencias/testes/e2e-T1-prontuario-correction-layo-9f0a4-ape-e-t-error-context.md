# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prontuario-correction-layout.spec.js >> Prontuário — Lote T1 (Layout, Agrupamento Semântico e Edição Cadastral) >> dense-context-keyboard-theme: valida contexto visível, tecla Escape e tokens do tema escuro
- Location: tests/e2e/prontuario-correction-layout.spec.js:66:5

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const fs = require('fs');
  3   | const path = require('path');
  4   | 
  5   | const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/prontuario-correction-cases.json');
  6   | const CASES = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  7   | 
  8   | test.describe('Prontuário — Lote T1 (Layout, Agrupamento Semântico e Edição Cadastral)', () => {
  9   |     test('same-invoice-metadata-edit-with-active-pendency: preserva NF B e bonificação ao editar metadados com pendência ativa', async ({ page }) => {
  10  |         const scenario = Array.isArray(CASES?.cases)
  11  |             ? CASES.cases.find(item => item.id === 'same-invoice-metadata-edit-with-active-pendency')
  12  |             : CASES['same-invoice-metadata-edit-with-active-pendency'];
  13  | 
  14  |         expect(scenario).toBeTruthy();
  15  | 
  16  |         const uxScript = fs.readFileSync(
  17  |             path.resolve(__dirname, '../../src/integration/prontuario-operational-ux.js'),
  18  |             'utf8'
  19  |         );
  20  | 
  21  |         await page.setContent(`
  22  |             <!DOCTYPE html>
  23  |             <html lang="pt-BR">
  24  |             <body>
  25  |                 <section id="view-prontuario">
  26  |                     <table>
  27  |                         <tbody id="prontuario-verif-rows">
  28  |                             <tr data-program-id="prog-pdde-basico" class="verification-document-row">
  29  |                                 <td rowspan="2"><strong>2026</strong><span>PDDE Básico</span></td>
  30  |                                 <td class="invoice-document-row"><span>NF A - Material</span></td>
  31  |                                 <td><span class="badge-pendency">Pendência ativa</span></td>
  32  |                             </tr>
  33  |                             <tr data-program-id="prog-pdde-basico" class="verification-document-row">
  34  |                                 <td class="invoice-document-row"><span>NF B - Bonificação preservada</span></td>
  35  |                                 <td><button class="btn-toggle active-sim" type="button">Sim</button></td>
  36  |                             </tr>
  37  |                         </tbody>
  38  |                     </table>
  39  |                 </section>
  40  |             </body>
  41  |             </html>
  42  |         `);
  43  | 
  44  |         await page.addScriptTag({ content: uxScript });
  45  | 
  46  |         const groupingResult = await page.evaluate(() => {
  47  |             const rows = Array.from(document.querySelectorAll('#prontuario-verif-rows tr'));
  48  |             const groups = window.RadarProntuarioOperationalUx.getProgramGroups(rows);
  49  |             return {
  50  |                 groupCount: groups.length,
  51  |                 programId: groups[0]?.programId || '',
  52  |                 rowCount: groups[0]?.rows?.length || 0,
  53  |                 hasContextCell: Boolean(groups[0]?.contextCell)
  54  |             };
  55  |         });
  56  | 
  57  |         expect(groupingResult.groupCount).toBe(1);
  58  |         expect(groupingResult.programId).toBe('prog-pdde-basico');
  59  |         expect(groupingResult.rowCount).toBe(2);
  60  |         expect(groupingResult.hasContextCell).toBe(true);
  61  | 
  62  |         await expect(page.locator('#prontuario-verif-rows')).toContainText('NF B');
  63  |         await expect(page.locator('#prontuario-verif-rows')).toContainText('Bonificação');
  64  |     });
  65  | 
  66  |     test('dense-context-keyboard-theme: valida contexto visível, tecla Escape e tokens do tema escuro', async ({ page }) => {
  67  |         const scenario = Array.isArray(CASES?.cases)
  68  |             ? CASES.cases.find(item => item.id === 'dense-context-keyboard-theme')
  69  |             : CASES['dense-context-keyboard-theme'];
  70  | 
> 71  |         expect(scenario).toBeTruthy();
      |                          ^ Error: expect(received).toBeTruthy()
  72  | 
  73  |         const uxCss = fs.readFileSync(
  74  |             path.resolve(__dirname, '../../src/styles/prontuario-operational-ux.css'),
  75  |             'utf8'
  76  |         );
  77  | 
  78  |         await page.setContent(`
  79  |             <!DOCTYPE html>
  80  |             <html lang="pt-BR">
  81  |             <head><style>${uxCss}</style></head>
  82  |             <body>
  83  |                 <section id="view-prontuario">
  84  |                     <table>
  85  |                         <tbody id="prontuario-verif-rows">
  86  |                             <tr data-program-id="prog-denso" data-program-group="prog-denso" class="program-block-start verification-document-row">
  87  |                                 <td data-program-context="prog-denso" class="program-context-cell">
  88  |                                     <strong class="program-context-competence">2026</strong>
  89  |                                     <span class="program-context-name">PDDE Estrutura</span>
  90  |                                 </td>
  91  |                                 <td class="invoice-document-row"><span>123456</span></td>
  92  |                                 <td><button id="escape-target" class="btn-toggle active-sim" type="button">Sim</button></td>
  93  |                             </tr>
  94  |                         </tbody>
  95  |                     </table>
  96  |                     <div id="correction-drawer" role="dialog" aria-hidden="false">Edição rápida</div>
  97  |                 </section>
  98  |                 <script>
  99  |                     document.addEventListener('keydown', (event) => {
  100 |                         if (event.key === 'Escape') {
  101 |                             const drawer = document.getElementById('correction-drawer');
  102 |                             if (drawer) drawer.setAttribute('aria-hidden', 'true');
  103 |                         }
  104 |                     });
  105 |                 </script>
  106 |             </body>
  107 |             </html>
  108 |         `);
  109 | 
  110 |         const contextCell = page.locator('[data-program-context="prog-denso"]');
  111 |         await expect(contextCell).toBeVisible();
  112 |         await expect(contextCell).toContainText('PDDE Estrutura');
  113 | 
  114 |         const lightToken = await page.evaluate(() =>
  115 |             getComputedStyle(document.getElementById('view-prontuario')).getPropertyValue('--prontuario-canvas-bg').trim()
  116 |         );
  117 |         expect(lightToken.toLowerCase()).toBe('#fafafc');
  118 | 
  119 |         await page.evaluate(() => document.body.classList.add('dark-theme'));
  120 |         await expect(page.locator('body')).toHaveClass(/dark-theme/);
  121 | 
  122 |         await page.keyboard.press('Escape');
  123 |         await expect(page.locator('#correction-drawer')).toHaveAttribute('aria-hidden', 'true');
  124 |     });
  125 | });
  126 | 
```