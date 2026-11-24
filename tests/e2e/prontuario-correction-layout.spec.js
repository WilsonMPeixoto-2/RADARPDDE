const { test, expect } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
test(`contexto horizontal mantém consolidação e análise após edição em ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    const context = await prepareSchool(page);
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.evaluate(({ schoolId, compKey }) => {
        const v = verificacoes[schoolId][compKey];
        for (const key of ['extCC', 'extINV', 'notaFiscal', 'declBBAgil']) v.bonificacao[key] = 'Sim';
        v.bonificacao.consAssessoria = 'Não se aplica';
        v.bonificacao.encampInventario = 'Não se aplica';
        rebuildOperationalIndexes();
        switchView('prontuario', schoolId);
    }, context);
    const header = page.locator('[data-program-header="BASIC"]');
    await expect(header).toBeVisible();
    await expect(header).toContainText('PDDE Básico');
    await expect(header).toContainText('Maio');
    await expect(header.locator('[data-status-dimension="analise"]')).toContainText('Não analisado');
    const consolidateButton = header.getByRole('button', { name: 'Consolidar bonificação', exact: true });
    await expect(consolidateButton).toHaveAttribute('data-tooltip', /calcula.*resultado/i);
    await consolidateButton.click();
    const confirmation = page.getByRole('alertdialog', { name: 'Consolidar bonificação', exact: true });
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('PDDE Básico');
    await expect(confirmation).toContainText('Apta ou Inapta');
    await expect(confirmation.locator('.bonification-preservation')).toContainText('Notas fiscais, análises técnicas e Pendências não serão alteradas.');
    await expect(confirmation.locator('.bonification-context-label')).toHaveText(['Escola', 'Mês de referência', 'Programa']);
    await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(confirmation).toBeHidden();
    await expect(consolidateButton).toBeEnabled();
    await expect(header.getByRole('button', { name: 'Consolidada', exact: true })).toHaveCount(0);
    await consolidateButton.click();
    await confirmation.getByRole('button', { name: 'Confirmar consolidação', exact: true }).click();
    await expect(confirmation).toBeHidden();
    await expect(header.getByRole('button', { name: 'Consolidada', exact: true })).toBeDisabled();
    await expect(header.locator('[data-status-dimension="bonificacao"]')).toHaveText(/^apta$/i);
    const row = page.locator('tr[data-program-id="BASIC"][data-document-key="extCC"]');
    await row.locator('select.select-analise').selectOption('Correto');
    await expect(row.locator('select.select-analise')).toHaveValue('Correto');
    await expect(header.locator('[data-status-dimension="bonificacao"]')).toHaveText(/^apta$/i);
    await expect(header.getByRole('button', { name: 'Consolidada', exact: true })).toBeDisabled();
    const state = await page.evaluate(({ schoolId, compKey }) => ({
        bonus: verificacoes[schoolId][compKey].resultadoBonif,
        analysis: verificacoes[schoolId][compKey].analise.extCC
    }), context);
    expect(state).toEqual({ bonus: 'apta', analysis: 'Correto' });
    if (viewport.width >= 1280) {
        const monthTops = await page.locator('#tab-verificacoes .comp-sub-tab').evaluateAll(nodes => (
            nodes.map(node => Math.round(node.getBoundingClientRect().top))
        ));
        expect(monthTops.length).toBeGreaterThanOrEqual(12);
        expect(Math.max(...monthTops) - Math.min(...monthTops), '12 competências em linha única').toBeLessThanOrEqual(4);
        const colAlign = await page.evaluate(() => {
            const heads = Array.from(document.querySelectorAll('.prontuario-evaluation-table > thead th'))
                .map(node => Math.round(node.getBoundingClientRect().left));
            const header = document.querySelector('[data-program-header="BASIC"]');
            const bonif = Math.round(header.querySelector('[data-status-dimension="bonificacao"]').closest('div').getBoundingClientRect().left);
            const analise = Math.round(header.querySelector('[data-status-dimension="analise"]').closest('div').getBoundingClientRect().left);
            const consolidate = Math.round(header.querySelector('.program-context-consolidate').getBoundingClientRect().left);
            return { heads, bonif, analise, consolidate };
        });
        expect(Math.abs(colAlign.bonif - colAlign.heads[1]), 'Bonificação alinhada à coluna 2').toBeLessThanOrEqual(6);
        expect(Math.abs(colAlign.analise - colAlign.heads[2]), 'Análise técnica alinhada à coluna 3').toBeLessThanOrEqual(6);
        expect(Math.abs(colAlign.consolidate - colAlign.heads[3]), 'Consolidar alinhado à coluna 4').toBeLessThanOrEqual(6);
        await expect(row.locator('td.verification-document-action-cell [data-evaluation-retification-action="analysis"]')).toBeVisible();
        await expect(row.locator('td.verification-document-analysis-cell [data-evaluation-retification-action="analysis"]')).toHaveCount(0);
    }
    if (viewport.width === 1440 && viewport.height === 900) {
        const fiscalTitle = page.locator(
            'tr[data-program-id="BASIC"][data-document-key="notaFiscal"] .invoice-document-panel-title strong'
        ).first();
        const fiscalBounds = await fiscalTitle.boundingBox();
        expect(fiscalBounds, 'título Notas Fiscais visível em 1440×900').not.toBeNull();
        expect(fiscalBounds.y + fiscalBounds.height, 'Notas Fiscais acima da dobra em 1440×900').toBeLessThanOrEqual(900);
    }
    await header.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('program-header.png'), animations: 'disabled' });
    const bounds = await page.locator('.prontuario-evaluation-table').boundingBox();
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(errors).toEqual([]);
});
}

test('programa com despesas mantém vínculos, acesso por teclado e leitura nos dois temas', async ({ page }, testInfo) => {
    const context = await prepareSchool(page, { withOpenUnidentified: true });
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.evaluate(async ({ schoolId, compKey }) => {
        const services = window.RadarApplicationServices;
        if (services.data.repository.capabilities().remote) throw new Error('Fixture exige ambiente local.');
        for (const [type, number, description, amount] of [
            ['consumo', 'NF-DEMO-01', 'Materiais de papelaria', 420],
            ['servico', 'NF-DEMO-02', 'Manutenção dos equipamentos', 850],
            ['permanente', 'NF-DEMO-03', 'Projetor multimídia', 2400]
        ]) {
            await services.invoices.save({ schoolId, compKey, expenseType: type,
                invoiceNumber: number, description, amount, profile: 'controlador' });
        }
        rebuildOperationalIndexes();
        persist();
        switchView('prontuario', schoolId);
    }, context);
    const header = page.locator('[data-program-header="BASIC"]');
    const activeMonthTab = page.locator('#tab-verificacoes .comp-sub-tab.active');
    await expect(activeMonthTab.locator('.comp-pendency-count')).toHaveText('1');
    const fiscal = page.locator('tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
    await expect(fiscal.locator('.invoice-document-row')).toHaveCount(4);
    const advisory = page.locator('tr[data-program-id="BASIC"][data-document-key="consAssessoria"]');
    await expect(advisory.locator('.invoice-document-row')).toHaveCount(1);
    await expect(advisory).toContainText('NF-DEMO-02');
    const consolidate = header.getByRole('button', { name: 'Consolidar bonificação', exact: true });
    await consolidate.focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('tr[data-program-id="BASIC"][data-document-key="extCC"]')
        .getByRole('button', { name: 'Sim', exact: true })).toBeFocused();
    for (const theme of ['light', 'dark']) {
        if (theme === 'dark') await page.getByRole('button', { name: 'Mudar para tema escuro', exact: true }).click();
        await header.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`dense-header-${theme}.png`), animations: 'disabled' });
        await fiscal.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`dense-invoices-${theme}.png`), animations: 'disabled' });
        await expect(fiscal.getByRole('button', { name: 'Visualizar pendência', exact: true })).toBeVisible();
    }
});

for (const viewport of [{ width: 390, height: 844 }, { width: 716, height: 900 }, { width: 980, height: 1000 }]) {
    test(`Prontuário compacto sem rolagem horizontal para consolidar em ${viewport.width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        const context = await prepareSchool(page, { withOpenUnidentified: true });
        await page.evaluate(async ({ schoolId, compKey }) => {
            await window.RadarProductExtensionsReady;
            const v = verificacoes[schoolId][compKey];
            for (const key of ['extCC', 'extINV', 'notaFiscal', 'declBBAgil']) v.bonificacao[key] = 'Sim';
            v.bonificacao.consAssessoria = 'Não se aplica';
            v.bonificacao.encampInventario = 'Não se aplica';
            rebuildOperationalIndexes();
            switchView('prontuario', schoolId);
        }, context);
        const header = page.locator('[data-program-header="BASIC"]');
        const action = header.getByRole('button', { name: 'Consolidar bonificação', exact: true });
        const wrapper = page.locator('.prontuario-evaluation-table-wrap');
        const row = page.locator('tr[data-program-id="BASIC"][data-document-key="extCC"]');
        for (const theme of ['light', 'dark']) {
            if (theme === 'dark') await page.getByRole('button', { name: 'Mudar para tema escuro', exact: true }).click();
            await action.scrollIntoViewIfNeeded();
            await expect(action).toBeInViewport({ ratio: 1 });
            expect(await wrapper.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
            const contentWidth = await wrapper.evaluate(el => el.clientWidth);
            if (contentWidth < 620) {
                await expect(row.locator('.prontuario-compact-label').first()).toBeVisible();
            } else {
                await expect(row.locator('.prontuario-compact-label').first()).toBeHidden();
                expect(await row.evaluate(el => getComputedStyle(el).display)).toBe('table-row');
            }
            const rects = await row.evaluate(el => [...el.querySelectorAll('td')].filter(x => x.getClientRects().length).map(x => {
                const r = x.getBoundingClientRect();
                return r.left >= -1 && r.right <= document.documentElement.clientWidth + 1;
            }));
            expect(rects.every(Boolean)).toBe(true);
            await testInfo.attach(`prontuario-compacto-${viewport.width}-${theme}`, {
                body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png'
            });
        }
        await action.click();
        await expect(page.getByRole('alertdialog', { name: 'Consolidar bonificação', exact: true })).toBeVisible();
        await page.getByRole('alertdialog', { name: 'Consolidar bonificação', exact: true }).getByRole('button', { name: 'Cancelar', exact: true }).click();
    });
}

test('modo PC em tela estreita conserva a grade e as ações da NF sem empilhamento desnecessário', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 980, height: 1050 });
    const context = await prepareSchool(page, { withOpenUnidentified: true });
    await page.evaluate(async ({ schoolId, compKey }) => {
        await window.RadarProductExtensionsReady;
        const services = window.RadarApplicationServices;
        if (services.data.repository.capabilities().remote) throw new Error('Fixture exige ambiente local.');
        await services.invoices.save({ schoolId, compKey, expenseType: 'consumo',
            invoiceNumber: 'PC-COMPACTO-01', description: 'Material de consumo', amount: 1068.10, profile: 'controlador' });
        rebuildOperationalIndexes();
        persist();
        switchView('prontuario', schoolId);
    }, context);
    const wrap = page.locator('.prontuario-evaluation-table-wrap');
    const program = page.locator('[data-program-header="BASIC"]');
    const regular = page.locator('tr[data-program-id="BASIC"][data-document-key="extCC"]');
    const nf = page.locator('tr[data-program-id="BASIC"][data-document-key="notaFiscal"] .invoice-document-row').filter({ hasText: 'PC-COMPACTO-01' });
    for (const theme of ['light', 'dark']) {
        if (theme === 'dark') await page.getByRole('button', { name: 'Mudar para tema escuro', exact: true }).click();
        await expect(nf).toBeVisible();
        const measure = await wrap.evaluate(el => {
            const header = el.querySelector('[data-program-header="BASIC"] .program-context-header');
            const row = el.querySelector('tr[data-program-id="BASIC"][data-document-key="extCC"]');
            const cells = [...row.cells].map(cell => cell.getBoundingClientRect());
            return { width: el.clientWidth, overflow: el.scrollWidth - el.clientWidth,
                display: getComputedStyle(row).display, rowHeight: row.offsetHeight,
                headerHeight: header.offsetHeight, aligned: cells.every(cell => Math.abs(cell.top - cells[0].top) <= 2) };
        });
        expect(measure.width).toBeGreaterThanOrEqual(620);
        expect(measure.overflow).toBeLessThanOrEqual(2);
        expect(measure.display).toBe('table-row');
        expect(measure.aligned).toBe(true);
        expect(measure.rowHeight).toBeLessThanOrEqual(150);
        expect(measure.headerHeight).toBeLessThanOrEqual(130);
        const invoice = await nf.evaluate(el => {
            const title = el.querySelector('.invoice-document-title-line > strong').getBoundingClientRect();
            const meta = el.querySelector('.invoice-document-meta').getBoundingClientRect();
            const actions = el.querySelector('.invoice-document-inline-actions').getBoundingClientRect();
            return { overflow: el.scrollWidth - el.clientWidth, height: el.offsetHeight,
                horizontal: meta.left > title.right, actionsBelow: actions.top >= title.bottom - 2 };
        });
        expect(invoice.overflow).toBeLessThanOrEqual(2);
        expect(invoice.horizontal).toBe(true);
        expect(invoice.actionsBelow).toBe(true);
        expect(invoice.height).toBeLessThanOrEqual(160);
        const bonus = page.locator('tr[data-program-id="BASIC"][data-document-key="notaFiscal"] .invoice-summary-block.is-bonification');
        expect(await bonus.evaluate(el => Math.abs(el.firstElementChild.getBoundingClientRect().left - el.lastElementChild.getBoundingClientRect().left))).toBeLessThanOrEqual(4);
        await program.scrollIntoViewIfNeeded();
        await testInfo.attach(`modo-pc-cabecalho-${theme}`, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await nf.scrollIntoViewIfNeeded();
        await testInfo.attach(`modo-pc-notas-${theme}`, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await expect(regular.locator('select.select-analise')).toBeVisible();
    }
});
