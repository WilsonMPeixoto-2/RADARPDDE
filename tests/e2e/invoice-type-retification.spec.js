'use strict';
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function prepare(page, { type = 'consumo', status = 'Resolvida', key = 'notaFiscal', assetStatus = 'Encaminhada' } = {}) {
    await page.goto('/');
    await page.evaluate(() => window.RadarProductExtensionsReady);
    return page.evaluate(async options => {
        switchProfile('controlador');
        const competencia = activeCompetenciaKey;
        const school = escolas.find(item => item.programasIds?.length && isCompetenceInScope(item.competenciaInicial, competencia));
        const program = school.programasIds[0];
        const compKey = `${competencia}_${program}`;
        const invoiceId = 'TYPE-RETIFICATION-UI';
        for (let i = notasRegistradas.length - 1; i >= 0; i--) {
            if (notasRegistradas[i].escolaId === school.id && notasRegistradas[i].compKey === compKey) notasRegistradas.splice(i, 1);
        }
        pendencias.splice(0, pendencias.length);
        const invoice = { id: invoiceId, escolaId: school.id, compKey, competencia, programaId: program,
            tipo: options.type, numero: 'NF-150', desc: 'Lançamento para correção de classificação',
            descricao: 'Lançamento para correção de classificação', valor: 150,
            analiseDocumentoFiscal: 'Correto', rowVersion: 3, bemId: options.type === 'permanente' ? 'TYPE-BEM' : null };
        notasRegistradas.push(invoice);
        if (invoice.bemId) bens.push({ id: invoice.bemId, escolaId: school.id, competencia,
            item: 'Bem de teste', tipo: 'permanente', valor: 150, notaFiscal: 'NF-150',
            status: options.assetStatus, rowVersion: 4, processoInventario: 'PROC-1' });
        pendencias.push({ id: 'TYPE-PEND', escolaId: school.id, competencia, competenciaOrigem: competencia,
            programaId: program, registeredInvoiceId: invoiceId, documentoKey: options.key, item: 'Nota Fiscal',
            status: options.status, dataAbertura: '2026-05-01', motivo: 'Dados divergentes',
            documentSnapshot: { tipo: options.type, numero: 'NF-150', valor: 150 }, historico: [] });
        verificacoes[school.id] = verificacoes[school.id] || {};
        verificacoes[school.id][compKey] = {
            bonificacao: { notaFiscal: 'Não', consAssessoria: 'Não se aplica', encampInventario: 'Não se aplica' },
            analise: { notaFiscal: 'Correto', consAssessoria: 'Correto', encampInventario: 'Correto' },
            resultadoBonif: 'APTA', rowVersion: 8 };
        await persist();
        activeProntuarioCompetencia = competencia;
        rebuildOperationalIndexes();
        switchView('prontuario', school.id);
        return { invoiceId, schoolId: school.id, compKey };
    }, { type, status, key, assetStatus });
}
function row(page) { return page.locator('.invoice-document-row[data-invoice-id="TYPE-RETIFICATION-UI"]'); }
async function edit(page) { await row(page).getByRole('button', { name: /Editar lançamento/ }).click(); }
async function capture(page, info, name) {
    await info.attach(name, { body: await page.screenshot({ path: info.outputPath(name + '.png'), animations: 'disabled' }), contentType: 'image/png' });
}

test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.setViewportSize({ width: 1440, height: 900 });
});

test('corrige classificação por UI, permite cancelar e confirma antes de salvar; releitura preserva histórico', async ({ page }, info) => {
    const context = await prepare(page);
    await edit(page);
    const modal = page.locator('#modal-dados-nota');
    await expect(modal.getByRole('heading', { name: 'Editar lançamento', exact: true })).toBeVisible();
    await expect(modal.locator('#invoice-edit-context')).toContainText('NF-150');
    await expect(modal.locator('#nota-tipo')).toBeEnabled();
    await modal.locator('#nota-tipo').selectOption('servico');
    await expect(modal.locator('#invoice-classification-preview')).toContainText('Consulta à Assessoria');
    await capture(page, info, '01-classificacao-assistida');
    await modal.getByRole('button', { name: 'Confirmar nova classificação', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Confirmar alteração de classificação?' });
    await expect(confirmation).toBeVisible();
    const dialogBox = await confirmation.boundingBox();
    expect(Math.abs(dialogBox.x + dialogBox.width / 2 - 720)).toBeLessThan(2);
    expect(Math.abs(dialogBox.y + dialogBox.height / 2 - 450)).toBeLessThan(2);
    await capture(page, info, '02-confirmacao');
    const accessibility = await new AxeBuilder({ page }).include('#invoice-type-retification-confirmation').analyze();
    expect(accessibility.violations).toEqual([]);
    await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(await page.evaluate(() => notasRegistradas.find(item => item.id === 'TYPE-RETIFICATION-UI').tipo)).toBe('consumo');
    await expect(modal.locator('#nota-tipo')).toHaveValue('servico');
    await modal.getByRole('button', { name: 'Confirmar nova classificação', exact: true }).click();
    await confirmation.getByRole('button', { name: 'Confirmar alteração', exact: true }).click();
    await expect(modal).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-notice')).toContainText('Classificação atualizada');
    await expect(row(page)).toContainText('Prestação de serviço');
    await page.reload();
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.goto(`/escolas/${context.schoolId}`);
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await expect(row(page)).toContainText('Prestação de serviço');
    const after = await page.evaluate(() => ({
        invoice: notasRegistradas.find(item => item.id === 'TYPE-RETIFICATION-UI'),
        pendency: pendencias.find(item => item.id === 'TYPE-PEND')
    }));
    expect(after.invoice).toMatchObject({ id: context.invoiceId, tipo: 'servico', valor: 150 });
    expect(after.pendency).toMatchObject({ status: 'Resolvida', documentSnapshot: { tipo: 'consumo', valor: 150 } });
    await capture(page, info, '03-apos-releitura');
});

for (const scenario of [
    { status: 'Aberta', text: 'Encerre a Pendência' },
    { type: 'servico', key: 'consAssessoria', status: 'Cancelada', text: 'histórico de Consulta à Assessoria' },
    { type: 'permanente', assetStatus: 'Inventariada', text: 'bem vinculado já foi inventariado' }
]) {
    test(`classificação protegida explica o motivo: ${scenario.text}`, async ({ page }, info) => {
        await prepare(page, scenario);
        await edit(page);
        const modal = page.locator('#modal-dados-nota');
        await expect(modal.locator('#nota-tipo')).toBeDisabled();
        await expect(modal.locator('[data-auditable-retification-type-hint]')).toContainText(scenario.text);
        await modal.locator('#nota-valor').fill('160');
        await modal.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
        await expect(modal).not.toHaveClass(/show/);
        await expect(page.locator('#pendency-notice')).toContainText('Valor alterado');
        await edit(page);
        await capture(page, info, 'classificacao-protegida');
    });
}

test('preview permanente explica patrimônio e o editor seguinte remove a confirmação anterior', async ({ page }, info) => {
    await prepare(page, { status: 'Cancelada' });
    await edit(page);
    const modal = page.locator('#modal-dados-nota');
    await modal.locator('#nota-tipo').selectOption('permanente');
    await expect(modal.locator('#invoice-classification-preview')).toContainText('Capital e Inventário');
    await modal.locator('#nota-tipo').selectOption('consumo');
    await expect(modal.locator('#invoice-classification-preview')).toHaveCount(0);
    await expect(modal.getByRole('button', { name: 'Salvar Alterações', exact: true })).toBeVisible();
    await capture(page, info, '04-sem-mudanca-de-classificacao');
});

for (const size of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    test(`formulário e confirmação preservam ações no viewport ${size.width}×${size.height}`, async ({ page }, info) => {
        await page.setViewportSize(size);
        await prepare(page);
        await edit(page);
        const modal = page.locator('#modal-dados-nota');
        await modal.locator('#nota-tipo').selectOption('permanente');
        await expect(modal.getByRole('heading', { name: 'Editar lançamento', exact: true })).toBeInViewport({ ratio: 1 });
        await expect(modal.getByRole('button', { name: 'Confirmar nova classificação', exact: true })).toBeInViewport({ ratio: 1 });
        await capture(page, info, 'modal-' + size.width);
        await modal.getByRole('button', { name: 'Confirmar nova classificação', exact: true }).click();
        const confirmation = page.getByRole('dialog', { name: 'Confirmar alteração de classificação?' });
        await expect(confirmation).toBeInViewport({ ratio: 1 });
        await confirmation.press('Escape');
        await expect(confirmation).toHaveCount(0);
        await expect(modal).toHaveClass(/show/);
    });
}

