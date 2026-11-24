'use strict';

const { test, expect } = require('@playwright/test');

async function openHistory(page, options = {}) {
    await page.goto('/');
    const opts = {
        enabled: options.enabled !== false,
        many: Boolean(options.many),
        corrupt: Boolean(options.corrupt)
    };
    await page.evaluate(async ({ enabled, many, corrupt }) => {
        await window.RadarProductExtensionsReady;
        window.__t4HistoryCalls = [];
        window.__t4HistoryRefreshed = 0;
        const recordCount = many ? 16 : 2;
        const pendencyIds = Array.from({ length: recordCount }, (_, i) => 'H-P-' + (i + 1));
        const pendencies = pendencyIds.map((id, i) => ({
            id, documentKey: 'extCC',
            status: i === 0 ? 'Aberta' : i === 1 ? 'Resolvida' : 'Cancelada'
        }));
        const affectedRecords = {
            pendencies, attempts: [{ id: 'H-A-1', pendencyId: 'H-P-2', attemptNumber: 1 }],
            contacts: [{ id: 'H-C-1', pendencyId: 'H-P-2', contactType: 'email', description: 'Pedido de complemento' }]
        };
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__t4HistoryCalls.push({ name, args });
                if (name === 'preview_operational_change') {
                    return {
                        action: 'clear_item_history',
                        target: {
                            ...args.p_request.target,
                            ...(corrupt ? { programId: 'OTHER' } : {})
                        },
                        planDigest: 'b'.repeat(64),
                        effects: {
                            delete: {
                                verifications: [],
                                registered_invoices: [],
                                assets: [],
                                pendencies: pendencyIds,
                                pendency_attempts: ['H-A-1'],
                                pendency_contacts: ['H-C-1']
                            },
                            update: [{ entity: 'verifications', id: 'H-V-1',
                                field: 'analysis.extCC', before: 'Incorreto', after: null }]
                        },
                        affectedRecords, warnings: [], blockers: [],
                        preserved: { otherItems: true, generalContacts: true, bonusResult: 'apta' }
                    };
                }
                if (name === 'apply_operational_change') {
                    return { committed: true, replayed: false, operationKey: args.p_operation_key };
                }
                throw new Error('RPC inesperada ' + name);
            }
        };
        const root = {
            document, location: window.location,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RADAR_T4_ITEM_HISTORY_PILOT: enabled,
            RADAR_PDDE_CONFIG: {
                deploymentTarget: 'local',
                features: { operationalCorrectionPilot: true }
            },
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: {
                refreshSchool: async () => { window.__t4HistoryRefreshed++; return { ok: true }; }
            },
            rebuildOperationalIndexes() {},
            renderProntuario() {},
            updateAlertsBell() {},
            RadarSharedInteractions: { notify() {} }
        };
        window.__t4HistoryOpened = window.RadarOperationalCorrectionDialog.open(root, {
            mode: 'clear_item_history',
            context: {
                schoolId: 'ESC-T4', schoolName: 'Escola Teste T4',
                competence: '2026-10', competenceLabel: 'Outubro 2026',
                programId: 'BASIC', programName: 'PDDE Básico',
                documentKey: 'extCC', documentLabel: 'Extrato Conta Corrente'
            }
        });
    }, opts);
    return page.getByRole('dialog', { name: 'Limpar todo o histórico deste item' });
}

test('T4 histórico: recurso OFF não abre janela nem chama RPC', async ({ page }) => {
    const dialog = await openHistory(page, { enabled: false });
    expect(await page.evaluate(() => window.__t4HistoryOpened)).toBe(false);
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => window.__t4HistoryCalls)).toEqual([]);
});

test('T4 histórico: prévia legível e Cancelar preserva a operação', async ({ page }) => {
    const dialog = await openHistory(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Escola Teste T4');
    await expect(dialog).toContainText('Outubro 2026');
    await expect(dialog).toContainText('PDDE Básico');
    await expect(dialog).toContainText('Extrato Conta Corrente');
    await expect(dialog).toContainText('Pendências — inclusive resolvidas e canceladas (2)');
    await expect(dialog).toContainText('Envios documentais vinculados (1)');
    await expect(dialog).toContainText('Contatos vinculados às Pendências (1)');
    await expect(dialog).toContainText('Notas fiscais, bens, outros documentos, programas');
    await expect(dialog).toContainText('Extrato da conta corrente');
    await expect(dialog).not.toContainText('· extCC');
    await expect(dialog).not.toContainText('H-P-2');
    const confirm = dialog.getByRole('button', { name: 'Limpar histórico deste item' });
    await expect(confirm).toBeEnabled();
    await expect(confirm).toHaveAttribute('data-tooltip', /Pendências.*preserva a despesa/i);
    await expect(confirm).toHaveAttribute('aria-description', /preserva a despesa/i);
    await expect(dialog.getByRole('button', { name: 'Conferir novamente' })).toHaveAttribute('data-tooltip', /não exclui/i);
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('data-tooltip', /sem alterar/i);
    expect((await page.evaluate(() => window.__t4HistoryCalls)).map(x => x.name)).toEqual(['preview_operational_change']);
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
    expect((await page.evaluate(() => window.__t4HistoryCalls)).map(x => x.name))
        .toEqual(['preview_operational_change']);
});

test('T4 histórico: prévia de outro programa bloqueia gravação', async ({ page }) => {
    const dialog = await openHistory(page, { corrupt: true });
    await expect(dialog.getByRole('button', { name: 'Limpar histórico deste item' })).toBeDisabled();
    expect(await page.evaluate(() => window.__t4HistoryCalls.length)).toBe(1);
});

test('T4 histórico: confirmação usa um único RPC, alvo exato, e sincroniza a escola', async ({ page }) => {
    const dialog = await openHistory(page);
    await expect(dialog.getByRole('button', { name: 'Limpar histórico deste item' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Limpar histórico deste item' }).click();
    await expect(dialog).toHaveCount(0);
    const saved = await page.evaluate(() => ({
        calls: window.__t4HistoryCalls,
        refreshed: window.__t4HistoryRefreshed
    }));
    const writes = saved.calls.filter(x => x.name === 'apply_operational_change');
    expect(writes).toHaveLength(1);
    expect(writes[0].args.p_request).toMatchObject({
        action: 'clear_item_history',
        target: {
            kind: 'analysis',
            schoolId: 'ESC-T4',
            competence: '2026-10',
            programId: 'BASIC',
            documentKey: 'extCC'
        }
    });
    expect(saved.refreshed).toBe(1);
});

test('T4 histórico: lista extensa mantém botão visível, desktop', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const dialog = await openHistory(page, { many: true });
    const action = dialog.getByRole('button', { name: 'Limpar histórico deste item' });
    await expect(action).toBeEnabled();
    const rect = await action.evaluate(button => {
        const dialogRect = button.closest('[role="dialog"]').getBoundingClientRect();
        const r = button.getBoundingClientRect();
        return { buttonTop: r.top, buttonBottom: r.bottom, dialogBottom: dialogRect.bottom,
            height: window.innerHeight };
    });
    expect(rect.buttonTop).toBeGreaterThanOrEqual(0);
    expect(rect.buttonBottom).toBeLessThanOrEqual(rect.dialogBottom);
    expect(rect.buttonBottom).toBeLessThanOrEqual(rect.height);
    await testInfo.attach('t4-history-desktop-720px', {
        body: await page.screenshot({ fullPage: false }), contentType: 'image/png'
    });
});

test('T4 histórico: tela móvel preserva contexto, ação, rolagem e teclado', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const dialog = await openHistory(page, { many: true });
    const action = dialog.getByRole('button', { name: 'Limpar histórico deste item' });
    await expect(action).toBeEnabled();
    const rect = await action.evaluate(button => {
        const r = button.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, width: r.width,
            viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
    });
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.bottom).toBeLessThanOrEqual(rect.viewportHeight);
    expect(rect.width).toBeGreaterThan(60);
    await testInfo.attach('t4-history-mobile-390px', {
        body: await page.screenshot({ fullPage: false }), contentType: 'image/png'
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
});
