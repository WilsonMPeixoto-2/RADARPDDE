'use strict';

const { test, expect } = require('@playwright/test');

async function openContextDialog(page, options = {}) {
    await page.goto('/');
    await page.evaluate(async ({ enabled, failPreview }) => {
        await window.RadarProductExtensionsReady;
        window.__t4ContextCalls = [];
        window.__t4ContextRefreshes = 0;
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__t4ContextCalls.push({ name, args });
                if (name === 'preview_operational_change') {
                    if (failPreview) throw new Error('Prévia indisponível');
                    return {
                        action: 'delete_context',
                        target: args.p_request.target,
                        planDigest: 'd'.repeat(64),
                        effects: {
                            delete: {
                                verifications: ['VER-SET'],
                                registered_invoices: ['NF-SET'],
                                pendencies: ['P-SET'],
                                pendency_attempts: ['ATT-SET'],
                                pendency_contacts: ['CONT-SET'],
                                assets: []
                            },
                            update: [{ entity: 'quality_provisional_movements', id: 'MOV-1',
                                field: 'status', before: 'identified', after: 'open' }]
                        },
                        blockers: [],
                        warnings: [],
                        preserved: { otherContexts: true, generalContacts: true }
                    };
                }
                if (name === 'apply_operational_change') {
                    return { committed: true, operationKey: args.p_operation_key };
                }
                throw new Error('RPC inesperada: ' + name);
            }
        };
        const root = {
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RADAR_T4_CONTEXT_DELETION_PILOT: enabled,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: {
                refreshSchool: async () => { window.__t4ContextRefreshes++; return { applied: true }; }
            },
            rebuildOperationalIndexes() {},
            renderProntuario() {},
            updateAlertsBell() {}
        };
        window.__t4ContextOpened = window.RadarOperationalCorrectionDialog.open(root, {
            mode: 'delete_context',
            context: {
                schoolId: 'ESC-1', schoolName: 'Escola Exemplo',
                competence: '2026-09', competenceLabel: 'Setembro de 2026',
                programId: 'BASIC', programName: 'PDDE Básico'
            }
        });
    }, { enabled: options.enabled !== false, failPreview: Boolean(options.failPreview) });
}

test('T4: ação de contexto não abre sem piloto explicitamente habilitado', async ({ page }) => {
    await openContextDialog(page, { enabled: false });
    expect(await page.evaluate(() => window.__t4ContextOpened)).toBe(false);
    await expect(page.getByRole('dialog', { name: /Excluir lançamentos deste programa neste mês/ })).toHaveCount(0);
    expect(await page.evaluate(() => window.__t4ContextCalls)).toEqual([]);
});

test('T4: prévia apresenta contexto completo e não grava ao cancelar', async ({ page }) => {
    await openContextDialog(page);
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Escola Exemplo');
    await expect(dialog).toContainText('Setembro de 2026');
    await expect(dialog).toContainText('PDDE Básico');
    await expect(dialog).toContainText('verificação do programa');
    await expect(dialog).toContainText('nota fiscal');
    await expect(dialog).toContainText('Pendência');
    await expect(dialog).toContainText(/não (?:serão )?transferid/i);
    await expect(dialog).toContainText(/outros meses e programas|outros programas e meses/i);
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    const calls = await page.evaluate(() => window.__t4ContextCalls);
    expect(calls.map(call => call.name)).toEqual(['preview_operational_change']);
    expect(calls[0].args.p_request.target).toEqual({
        kind: 'program_context', schoolId: 'ESC-1',
        competence: '2026-09', programId: 'BASIC'
    });
});

test('T4: confirmar exclui exatamente o contexto pré-visualizado e atualiza uma vez', async ({ page }) => {
    await openContextDialog(page);
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão do contexto' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Confirmar exclusão do contexto' }).click();
    await expect(dialog).toBeHidden();
    const record = await page.evaluate(() => ({
        calls: window.__t4ContextCalls, refreshed: window.__t4ContextRefreshes
    }));
    const writes = record.calls.filter(call => call.name === 'apply_operational_change');
    expect(writes).toHaveLength(1);
    expect(writes[0].args.p_request.action).toBe('delete_context');
    expect(writes[0].args.p_request.target).toEqual({
        kind: 'program_context', schoolId: 'ESC-1',
        competence: '2026-09', programId: 'BASIC'
    });
    expect(writes[0].args.p_plan_digest).toBe('d'.repeat(64));
    expect(record.refreshed).toBe(1);
});

test('T4: falha de prévia mantém confirmação indisponível', async ({ page }) => {
    await openContextDialog(page, { failPreview: true });
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão do contexto' })).toBeDisabled();
    await expect(dialog).toContainText('Prévia indisponível');
    expect(await page.evaluate(() => window.__t4ContextCalls.map(c => c.name)))
        .toEqual(['preview_operational_change']);
});

test('T4: modal mantém foco, Escape e largura em celular com tema escuro', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openContextDialog(page);
    await page.evaluate(() => document.body.classList.add('dark-theme'));
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(dialog).toBeVisible();
    const rect = await dialog.evaluate(el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, viewport: document.documentElement.clientWidth };
    });
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(rect.viewport);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
});
