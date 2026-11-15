'use strict';
const { test, expect } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');

async function controlledDialog(page, options = {}) {
    await page.evaluate(async ({ failFirst, failRefresh }) => {
        await window.RadarProductExtensionsReady;
        window.__auditRpc = [];
        window.__auditRefresh = 0;
        window.__auditRendered = false;
        let failNext = Boolean(failFirst);
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__auditRpc.push({ name, args });
                if (name === 'preview_operational_change') {
                    return {
                        action: 'correct_analysis', planDigest: 'a'.repeat(64),
                        effects: { update: [{ entity: 'verifications', field: 'analysis.extCC',
                            before: 'Incorreto', after: args.p_request.changes.analysis }] },
                        blockers: [], warnings: [], preserved: { bonusResult: 'apta' }
                    };
                }
                if (name === 'apply_operational_change') {
                    if (failNext) {
                        failNext = false;
                        throw new Error('Falha de rede controlada');
                    }
                    return { committed: true, operationKey: args.p_operation_key };
                }
                throw new Error('RPC inesperada: ' + name);
            }
        };
        const root = {
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarDataContext: { dataService: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: { refreshSchool: async () => {
                window.__auditRefresh++;
                if (failRefresh) throw new Error('Recarga controlada');
                return { applied: true };
            } },
            rebuildOperationalIndexes() {},
            renderProntuario() { window.__auditRendered = true; },
            location: { reload() { window.__auditReload = true; } }
        };
        window.RadarOperationalCorrectionDialog.open(root, {
            context: { schoolId: 'ESC-1', competence: '2026-05',
                programId: 'BASIC', documentKey: 'extCC', documentLabel: 'Extrato Conta Corrente' },
            currentValue: 'Incorreto'
        });
    }, options);
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog.getByText('Incorreto → Incorreto')).toBeVisible();
    return dialog;
}

test('cancelar prévia não grava e observação é opcional', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page);
    await expect(dialog.getByLabel('Observação (opcional)')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__auditRpc.map(c => c.name)))
        .toEqual(['preview_operational_change']);
});

test('salvar sem justificativa confirma RPC e atualiza a interface', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page);
    await dialog.getByLabel('Novo resultado').selectOption('Correto');
    await expect(dialog.getByText('Incorreto → Correto')).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const state = await page.evaluate(() => ({
        writes: window.__auditRpc.filter(c => c.name === 'apply_operational_change'),
        refreshed: window.__auditRefresh, rendered: window.__auditRendered
    }));
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].args.p_request.note).toBeUndefined();
    expect(state.refreshed).toBe(1);
    expect(state.rendered).toBe(true);
});

test('falha de rede reutiliza exatamente a mesma operationKey', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page, { failFirst: true });
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog.getByRole('alert')).toContainText(/Falha|Não foi possível/);
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const keys = await page.evaluate(() => window.__auditRpc
        .filter(c => c.name === 'apply_operational_change').map(c => c.args.p_operation_key));
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
});

test('gravação confirmada sem recarga proíbe repetição e oferece atualizar', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page, { failRefresh: true });
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog.getByRole('alert')).toContainText(/confirmada pelo servidor/i);
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Atualizar página' })).toBeVisible();
    expect(await page.evaluate(() => window.__auditRpc.filter(c => c.name === 'apply_operational_change').length)).toBe(1);
});

test('flag sem Supabase impede gravação e não abre modal legado', async ({ page }) => {
    await prepareSchool(page);
    await page.evaluate(() => { window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true; });
    const edit = page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]')
        .getByRole('button', { name: 'Editar análise' });
    await edit.click();
    await expect(page.locator('#evaluation-retification-modal-layer')).toHaveCount(0);
    await expect(page.locator('#radar-operational-correction-layer')).toHaveCount(0);
    await expect(page.locator('#pendency-notice')).toContainText(/conexão autenticada/);
});

test('diálogo permanece dentro do viewport de 390 px em tema escuro', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.body.classList.add('dark-theme'));
    const dialog = await controlledDialog(page);
    const geometry = await dialog.evaluate(node => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right,
            viewport: document.documentElement.clientWidth,
            overflowY: getComputedStyle(node).overflowY };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.overflowY).toBe('auto');
});

test('botão real Editar análise usa prévia da RPC simulada sob flag', async ({ page }) => {
    await prepareSchool(page);
    await page.evaluate(() => {
        window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true;
        window.__remoteCalls = [];
        window.RadarDataContext = { dataService: { repository: {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__remoteCalls.push(name);
                if (name !== 'preview_operational_change') throw new Error('RPC inesperada');
                return { action: 'correct_analysis', planDigest: 'c'.repeat(64),
                    effects: { update: [{ entity: 'verifications', field: 'analysis.extCC',
                        before: 'Não analisado', after: args.p_request.changes.analysis }] },
                    blockers: [], warnings: [], preserved: {} };
            }
        } } };
    });
    await page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]')
        .getByRole('button', { name: 'Editar análise' }).click();
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog.getByText('Não analisado → Correto')).toBeVisible();
    expect(await page.evaluate(() => window.__remoteCalls)).toEqual(['preview_operational_change']);
});
