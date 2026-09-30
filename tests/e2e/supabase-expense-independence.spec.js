'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
test.skip(process.env.RADAR_E2E_SUPABASE_LOCAL !== '1', 'Supabase/Auth reais descartáveis obrigatórios');
const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function openSchool(page, role, school) {
    const user = users.find(user => user.profileId === role && user.active);
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/');
    await page.locator('#radar-auth-email').fill(user.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await page.waitForFunction(role => window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === role, role);
    await page.goto(`/escolas/${school}`);
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
}
const row = (page, program = 'BASIC') => page.locator(`#prontuario-verif-rows tr[data-program-id="${program}"][data-document-key="notaFiscal"]`);
async function remote(page, table, school) {
    return page.evaluate(async ({ table, school }) => {
        const response = await window.RadarSessionContext.service.client.from(table).select('*').eq('school_id', school);
        if (response.error) throw new Error(response.error.message);
        return response.data;
    }, { table, school });
}
async function create(page, { type, number, description, program = 'BASIC', info }) {
    await row(page, program).getByRole('button', { name: type === 'a_identificar' ? 'Registrar despesa a identificar' : 'Adicionar Nota', exact: true }).click();
    const modal = page.locator('#modal-dados-nota');
    await expect(modal).toHaveClass(/show/);
    if (type !== 'a_identificar') await modal.locator('#nota-tipo').selectOption(type);
    await modal.locator('#nota-desc').fill(description);
    if (number) await modal.locator('#nota-numero').fill(number);
    await modal.locator('#nota-valor').fill('123.45');
    if (type === 'a_identificar') {
        await expect(modal.locator('[data-expense-context]')).toContainText('05/2026');
        await expect(modal.locator('[data-expense-context]')).toContainText(program === 'BASIC' ? 'PDDE Básico' : 'Educação Conectada');
        await modal.locator('#nota-unidentified-observation').fill('Documento ausente; aguardando identificação');
    }
    if (info) await capture(page, info, `modal-${type}-${program}`);
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);
    await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
}
async function capture(page, testInfo, name, program = 'BASIC') {
    const modal = page.locator('#modal-dados-nota');
    if (await page.locator('#modal-dados-nota.show').count()) {
        await expect(modal).toHaveCSS('opacity', '1');
        await expect(modal.locator('.modal-content')).toBeInViewport({ ratio: 1 });
    } else {
        await expect(modal).toHaveCSS('opacity', '0');
        if (!(await page.locator('#pendency-preview-drawer').isVisible())) {
            const panel = row(page, program).locator('[data-invoice-document-panel]');
            await panel.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
            await expect(panel).toBeInViewport({ ratio: 1 });
        }
    }
    await testInfo.attach(name, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
}
async function persistedContext(page, school) {
    const rows = await remote(page, 'verifications', school);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: `${school}::2026-05::BASIC`, competence_id: '2026-05', program_id: 'BASIC' });
    return rows[0];
}

test.describe.serial('PR397 — independência com UI/Auth/Supabase reais', () => {
    test('primeira NF por controles visíveis cria somente contexto estrutural, converge ao trocar competência e reload', async ({ page }, info) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openSchool(page, 'controller', 'ESC-INDEP');
        expect(await remote(page, 'verifications', 'ESC-INDEP')).toEqual([]);
        await expect(row(page).getByRole('button', { name: 'Adicionar Nota', exact: true })).toBeVisible();
        await capture(page, info, '01-primeira-despesa-sem-bonificacao-1440');
        await create(page, { type: 'consumo', number: 'NF-INDEP-UI', description: 'Material antes da bonificação', info });
        const invoices = await remote(page, 'registered_invoices', 'ESC-INDEP');
        expect(invoices).toHaveLength(1);
        expect(invoices[0]).toMatchObject({ competence_id: '2026-05', program_id: 'BASIC', expense_type: 'consumo',
            verification_id: 'ESC-INDEP::2026-05::BASIC', invoice_number: 'NF-INDEP-UI' });
        const verification = await persistedContext(page, 'ESC-INDEP');
        expect(verification.bonification.notaFiscal).toBe('');
        expect(verification.bonus_result).toBeNull();
        expect(await page.evaluate(() => getProgramBonificationStatus('ESC-INDEP', '2026-05', 'BASIC'))).toBe('nao-lancada');
        await page.locator('#global-competence-select').selectOption('2026-06');
        await expect(row(page)).not.toContainText('NF-INDEP-UI');
        await page.locator('#global-competence-select').selectOption('2026-05');
        await expect(row(page)).toContainText('NF-INDEP-UI');
        await page.reload();
        await expect(row(page)).toContainText('NF-INDEP-UI');
        await page.setViewportSize({ width: 1366, height: 768 });
        await capture(page, info, '02-primeira-despesa-persistida-1366');
        await info.attach('contexto-primeira-despesa.json', { body: Buffer.from(JSON.stringify({ invoices, verification }, null, 2)), contentType: 'application/json' });
    });
    test('primeira despesa a identificar de outro programa grava NF e Pendência atômicas no contexto selecionado', async ({ page }, info) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openSchool(page, 'controller', 'ESC-INDEP');
        const before = await remote(page, 'verifications', 'ESC-INDEP');
        expect(before.filter(item => item.program_id === 'CONECTADA')).toEqual([]);
        await create(page, { type: 'a_identificar', description: 'Débito sem documento Conectada', program: 'CONECTADA', info });
        await expect(page.locator('#pendency-preview-drawer')).toBeVisible();
        const invoices = await remote(page, 'registered_invoices', 'ESC-INDEP');
        const expense = invoices.find(item => item.description === 'Débito sem documento Conectada');
        expect(expense).toMatchObject({ competence_id: '2026-05', program_id: 'CONECTADA', expense_type: 'a_identificar',
            verification_id: 'ESC-INDEP::2026-05::CONECTADA' });
        const pending = await remote(page, 'pendencies', 'ESC-INDEP');
        expect(pending.filter(item => item.registered_invoice_id === expense.id)).toHaveLength(1);
        expect(pending.find(item => item.registered_invoice_id === expense.id)).toMatchObject({ program_id: 'CONECTADA', status: 'Aberta' });
        const verification = (await remote(page, 'verifications', 'ESC-INDEP')).find(item => item.program_id === 'CONECTADA');
        expect(verification.bonification.notaFiscal).toBe('');
        expect(verification.analysis.notaFiscal).toBe('Incorreto');
        expect(verification.bonus_result).toBeNull();
        expect(await page.evaluate(() => getProgramBonificationStatus('ESC-INDEP', '2026-05', 'CONECTADA'))).toBe('nao-lancada');
        await page.setViewportSize({ width: 1440, height: 900 });
        await capture(page, info, '03-despesa-identificar-programa-conectada-1440');
        await page.locator('#pendency-preview-drawer .pendency-preview-close').click();
        await page.reload();
        await expect(row(page, 'CONECTADA')).toContainText('Débito sem documento Conectada');
        await expect(row(page, 'BASIC')).toContainText('NF-INDEP-UI');
        await page.setViewportSize({ width: 1366, height: 768 });
        await capture(page, info, '04-despesa-identificar-persistida-conectada-1366', 'CONECTADA');
        await info.attach('contextos-e-pendencia.json', { body: Buffer.from(JSON.stringify({ invoices, pending, verification }, null, 2)), contentType: 'application/json' });
    });
    for (const role of ['controller', 'federal_assistant']) {
        test(`${role} opera despesas consolidadas sem alterar NF manual, resultado ou exportação`, async ({ page }, info) => {
            await page.setViewportSize({ width: 1366, height: 768 });
            await openSchool(page, role, 'ESC-INDEP-CONS');
            const before = await persistedContext(page, 'ESC-INDEP-CONS');
            await create(page, { type: role === 'controller' ? 'consumo' : 'servico',
                number: `NF-INDEP-${role}`, description: `Despesa consolidada ${role}` });
            const card = row(page).locator('.invoice-document-row').filter({ hasText: `NF: NF-INDEP-${role}` });
            await card.getByRole('button', { name: `Editar NF: NF-INDEP-${role}`, exact: true }).click();
            await page.locator('#nota-numero').fill(`NF-INDEP-${role}-EDIT`);
            await page.locator('#form-dados-nota button[type="submit"]').click();
            await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
            await page.reload();
            const after = await persistedContext(page, 'ESC-INDEP-CONS');
            expect(after.bonus_result).toBe(before.bonus_result);
            for (const key of ['notaFiscal', 'extCC', 'extINV', 'declBBAgil']) expect(after.bonification[key]).toBe(before.bonification[key]);
            if (role === 'federal_assistant') expect(after.bonification.consAssessoria).toBe('Não');
            const exported = await page.evaluate(() => {
                const input = { escolas, competencias: COMPETENCIAS, programas, verificacoes };
                return { result: getProgramBonificationStatus('ESC-INDEP-CONS', '2026-05', 'BASIC'),
                    rows: window.RadarExcelExportModel.buildBaseRows(input).filter(row => row.designacao === '04.00.398') };
            });
            expect(exported.result).toBe(before.bonus_result);
            expect(exported.rows).toHaveLength(1);
            expect(exported.rows[0].statusBonificacao).toBe(before.bonus_result.toUpperCase());
            await capture(page, info, `03-${role}-consolidacao-preservada`);
            const edited = row(page).locator('.invoice-document-row').filter({ hasText: `NF: NF-INDEP-${role}-EDIT` });
            await edited.getByRole('button', { name: `Excluir NF: NF-INDEP-${role}-EDIT`, exact: true }).click();
            await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
            const removed = await persistedContext(page, 'ESC-INDEP-CONS');
            expect(removed.bonus_result).toBe(before.bonus_result);
            expect(removed.bonification.notaFiscal).toBe('Não');
            await info.attach(`${role}-antes-depois.json`, { body: Buffer.from(JSON.stringify({ before, after, removed, exported }, null, 2)), contentType: 'application/json' });
        });
    }
});
