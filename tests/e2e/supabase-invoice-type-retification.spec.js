'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test.skip(process.env.RADAR_E2E_SUPABASE_LOCAL !== '1', 'Exige Auth/RLS/Supabase reais descartáveis.');
const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const controller = users.find(item => item.profileId === 'controller' && item.active);
async function read(page, table) {
    return page.evaluate(async tableName => {
        const response = await window.RadarSessionContext.service.client.from(tableName).select('*').eq('school_id', 'ESC-TYPE').order('id');
        if (response.error) throw new Error(response.error.message);
        return response.data;
    }, table);
}
function row(page, id) { return page.locator(`.invoice-document-row[data-invoice-id="${id}"]`); }

test('Controlador corrige classificação com histórico fiscal encerrado pela UI/Auth/RLS, preserva histórico e relê Supabase', async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/');
    await page.locator('#radar-auth-email').fill(controller.email);
    await page.locator('#radar-auth-password').fill(process.env.RADAR_AUTH_FIXTURE_PASSWORD);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await page.waitForFunction(() => window.RadarDataContext?.ready === true && window.RadarAuthContext?.authorization?.role === 'controller');
    await page.goto('/escolas/ESC-TYPE');
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
    const beforeHistory = await read(page, 'pendencies');
    const beforeVerification = (await read(page, 'verifications'))[0];
    let previous = (await read(page, 'registered_invoices')).find(item => item.id === 'TYPE-REMOTE');
    const modal = page.locator('#modal-dados-nota');
    const field = modal.locator('#nota-tipo');
    for (const type of ['servico', 'permanente', 'consumo']) {
        await row(page, 'TYPE-REMOTE').getByRole('button', { name: /Editar lançamento/ }).click();
        await expect(field).toBeEnabled();
        await field.selectOption(type);
        await modal.getByRole('button', { name: 'Confirmar nova classificação', exact: true }).click();
        await page.getByRole('dialog', { name: 'Confirmar alteração de classificação?' })
            .getByRole('button', { name: 'Confirmar alteração', exact: true }).click();
        await expect(modal).not.toHaveClass(/show/);
        const current = (await read(page, 'registered_invoices')).find(item => item.id === 'TYPE-REMOTE');
        expect(current).toMatchObject({ id: 'TYPE-REMOTE', expense_type: type, amount: 150,
            school_id: 'ESC-TYPE', competence_id: '2026-05', program_id: 'BASIC' });
        expect(current.row_version).toBeGreaterThan(previous.row_version);
        const assets = await read(page, 'assets');
        if (type === 'permanente') {
            expect(current.linked_asset_id).toBeTruthy();
            expect(assets).toHaveLength(1);
            expect(assets[0]).toMatchObject({ id: current.linked_asset_id, school_id: 'ESC-TYPE',
                competence_id: '2026-05', amount: 150, status: 'Encaminhada' });
        } else {
            expect(current.linked_asset_id).toBeNull();
            expect(assets).toEqual([]);
        }
        if (type === 'servico') {
            expect(current.payload).toMatchObject({ consultaAssessoriaEnviada: false,
                analiseConsultaAssessoria: 'Não analisado' });
        }
        expect(await read(page, 'pendencies')).toEqual(beforeHistory);
        const verification = (await read(page, 'verifications'))[0];
        expect(verification.bonification.notaFiscal).toBe(beforeVerification.bonification.notaFiscal);
        expect(verification.bonification.extCC).toBe(beforeVerification.bonification.extCC);
        expect(verification.bonus_result).toBe(beforeVerification.bonus_result);
        previous = current;
        await page.reload();
        await page.evaluate(() => window.RadarProductExtensionsReady);
        await row(page, 'TYPE-REMOTE').getByRole('button', { name: /Editar lançamento/ }).click();
        await expect(field).toHaveValue(type);
        await info.attach('classificacao-' + type, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
    }
    expect(await read(page, 'assets')).toEqual([]);
    const logs = await read(page, 'administrative_logs');
    expect(logs.filter(item => JSON.stringify(item.details).includes('Tipo de gasto:'))).toHaveLength(3);
    for (const [id, reason] of [
        ['TYPE-ACTIVE', 'Encerre a Pendência'],
        ['TYPE-ADVISORY', 'histórico de Consulta à Assessoria']
    ]) {
        await row(page, id).getByRole('button', { name: /Editar lançamento/ }).click();
        await expect(field).toBeDisabled();
        await expect(modal.locator('[data-auditable-retification-type-hint]')).toContainText(reason);
        await info.attach(id, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
    }
});

