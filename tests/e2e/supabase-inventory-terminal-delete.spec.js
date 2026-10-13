const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase descartável, Auth, RLS e duas sessões reais.');
const fixtures = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function login(page, profileId) {
    const account = fixtures.find(item => item.profileId === profileId && item.active);
    await page.goto('/');
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await page.waitForFunction(role => window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === role, profileId);
}

// Cria patrimônio terminal: executar depois do contrato de import/rollback.
test('inventariação em outra sessão impede exclusão da NF e permite correção cadastral', async ({ page, browser }, testInfo) => {
    test.setTimeout(90000);
    const number = `AUD-TERMINAL-${Date.now()}`;
    await login(page, 'controller');
    await page.locator('#nav-escolas').click();
    await page.getByRole('row').filter({ hasText: 'Escola Local Autorizada' })
        .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
    const fiscal = page.locator('tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
    await fiscal.getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    const form = page.locator('#modal-dados-nota');
    await form.getByLabel('Tipo de Gasto', { exact: true }).selectOption('permanente');
    await form.locator('#nota-numero').fill(number);
    await form.locator('#nota-desc').fill('Patrimônio preservado pela auditoria');
    await form.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('900');
    await form.getByRole('button', { name: 'Salvar Gasto', exact: true }).click();
    await expect(form).not.toHaveClass(/show/);
    const record = await page.evaluate(async invoiceNumber => {
        const result = await window.RadarSessionContext.service.client.from('registered_invoices')
            .select('id,linked_asset_id').eq('invoice_number', invoiceNumber).single();
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }, number);

    const inventoryContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const inventoryPage = await inventoryContext.newPage();
        await login(inventoryPage, 'inventory');
        await inventoryPage.locator('#nav-inventario').click();
        await inventoryPage.getByRole('row').filter({ hasText: number })
            .getByRole('button', { name: 'Marcar como Inventariado', exact: true }).click();
        await inventoryPage.locator('#inventario-observacoes').fill('Conferência terminal de teste.');
        await inventoryPage.getByRole('button', { name: 'Confirmar Inventariação', exact: true }).click();
        await expect(inventoryPage.locator('#modal-inventario-confirm')).not.toHaveClass(/show/);
        await expect.poll(() => page.evaluate(id => bens.find(item => item.id === id)?.status,
            record.linked_asset_id)).toBe('Inventariada');

        const deleteRequests = [];
        page.on('request', request => {
            if (request.url().endsWith('/rpc/delete_invoice_with_effects')) deleteRequests.push(request);
        });
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: `Excluir NF: ${number}`, exact: true }).click();
        await expect(page.locator('[role="alert"]').filter({ hasText: 'bem já inventariado' })).toBeVisible();
        await expect(fiscal.locator('.invoice-document-row').filter({ hasText: number })).toBeVisible();
        expect(deleteRequests).toHaveLength(0);
        await page.screenshot({ path: testInfo.outputPath('terminal-delete-blocked.png') });

        await page.getByRole('button', { name: `Editar NF: ${number}`, exact: true }).click();
        await form.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('950');
        await form.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
        await expect(form).not.toHaveClass(/show/);
        await page.reload();
        await page.waitForFunction(() => window.RadarDataContext?.ready === true
            && window.RadarAuthContext?.authorization?.role === 'controller');
        const persisted = await page.evaluate(async ids => {
            const client = window.RadarSessionContext.service.client;
            const invoice = await client.from('registered_invoices').select('id,amount,linked_asset_id').eq('id', ids.id).single();
            const asset = await client.from('assets').select('id,status,amount,inventory_process,inventoried_by_member_id,inventoried_at').eq('id', ids.linked_asset_id).single();
            if (invoice.error || asset.error) throw new Error(invoice.error?.message || asset.error.message);
            return { invoice: invoice.data, asset: asset.data };
        }, record);
        expect(persisted.invoice).toEqual({ ...record, amount: 950 });
        expect(persisted.asset.status).toBe('Inventariada');
        expect(persisted.asset.amount).toBe(950);
        expect(persisted.asset.inventory_process).toBe('PROC-LOCAL-1');
        expect(persisted.asset.inventoried_by_member_id).toBe('inventory-local');
        expect(persisted.asset.inventoried_at).toBeTruthy();
        await expect(page.locator('.invoice-document-row').filter({ hasText: number })).toContainText('950,00');
        await testInfo.attach('terminal-delete-persisted.json', {
            body: JSON.stringify({ number, ...persisted, deleteRequests: deleteRequests.length }),
            contentType: 'application/json'
        });
    } finally {
        await inventoryContext.close();
    }
});
