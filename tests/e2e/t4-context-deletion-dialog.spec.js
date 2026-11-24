'use strict';

const { test, expect } = require('@playwright/test');

async function openContextDialog(page, options = {}) {
    await page.goto('/');
    await page.evaluate(async ({ enabled, failPreview, previewOverride }) => {
        await window.RadarProductExtensionsReady;
        window.__t4ContextCalls = [];
        window.__t4ContextRefreshes = 0;
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__t4ContextCalls.push({ name, args });
                if (name === 'preview_operational_change') {
                    if (failPreview) throw new Error('Prévia indisponível');
                    if (previewOverride) {
                        return {
                            ...previewOverride,
                            action: 'delete_context',
                            target: args.p_request.target,
                            planDigest: 'd'.repeat(64)
                        };
                    }
                    return {
                        action: 'delete_context',
                        target: args.p_request.target,
                        planDigest: 'd'.repeat(64),
                        effects: {
                            delete: {
                                verifications: ['VER-SET'],
                                registered_invoices: ['NF-SET'],
                                pendencies: ['P-SET', 'P-INV'],
                                pendency_attempts: ['ATT-SET'],
                                pendency_contacts: ['CONT-SET'],
                                assets: []
                            },
                            update: [{ entity: 'quality_provisional_movements', id: 'MOV-1',
                                field: 'status', before: 'identified', after: 'open' }]
                        },
                        blockers: [],
                        warnings: [],
                        affectedRecords: {
                            invoices: [{ id: 'NF-SET', invoiceNumber: '1245', description: 'Material para a secretaria', amount: 189.50, expenseType: 'consumo' }],
                            pendencies: [
                                { id: 'P-SET', documentKey: 'notaFiscal', status: 'Aberta' },
                                { id: 'P-INV', documentKey: 'extINV', status: 'Aguardando reanálise' }
                            ],
                            assets: []
                        },
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
            RADAR_PDDE_CONFIG: { deploymentTarget: 'local', features: { operationalCorrectionPilot: true } },
            location: window.location,
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
    }, {
        enabled: options.enabled !== false,
        failPreview: Boolean(options.failPreview),
        previewOverride: options.previewOverride || null
    });
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
    await expect(dialog).toContainText('avaliação mensal do programa');
    await expect(dialog).toContainText('nota fiscal');
    await expect(dialog).toContainText('Pendência');
    await expect(dialog).toContainText('NF 1245');
    await expect(dialog).toContainText('Material para a secretaria');
    await expect(dialog).toContainText('Pendência: Nota fiscal');
    await expect(dialog).toContainText('Pendência: Extrato de investimentos');
    await expect(dialog).toContainText('Você vai excluir os registros listados abaixo.');
    await expect(dialog).toContainText('Para registrar no lugar correto, faça um novo lançamento.');
    await expect(dialog).not.toContainText('Correção de contexto');
    await expect(dialog).not.toContainText('O servidor identificará');
    await expect(dialog.locator('.context-deletion-impact-list li')).toHaveCount(5);
    await expect(dialog.locator('.correction-impact-tile .correction-impact-count')).toHaveCount(5);
    await expect(dialog.locator('.correction-scope-field dt')).toHaveText(['Escola', 'Mês de referência', 'Programa']);
    await expect(dialog.locator('.correction-preservation-panel')).toContainText('O que será preservado');
    expect(await dialog.locator('.correction-preservation-panel').evaluate(panel =>
        Boolean(panel.compareDocumentPosition(panel.parentElement.querySelector('.context-deletion-details')) & Node.DOCUMENT_POSITION_FOLLOWING)
    )).toBe(true);
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
    await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Excluir estes lançamentos' }).click();
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
    await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeDisabled();
    await expect(dialog.getByRole('alert')).toContainText('Não foi possível conferir os lançamentos. Nada foi excluído.');
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

test('T4: prévia usa linguagem clara para Despesa a identificar, Boleto Internet e múltiplas saídas provisórias', async ({ page }) => {
    await openContextDialog(page, {
        previewOverride: {
            effects: {
                delete: {
                    verifications: ['VER-SET'],
                    registered_invoices: ['NF-A-ID', 'NF-NET'],
                    pendencies: ['P-NET'],
                    pendency_attempts: [],
                    pendency_contacts: [],
                    assets: ['BEM-1']
                },
                update: [
                    { entity: 'quality_provisional_movements', id: 'MOV-1', field: 'status', before: 'identified', after: 'open' },
                    { entity: 'quality_provisional_movements', id: 'MOV-2', field: 'status', before: 'identified', after: 'open' }
                ]
            },
            blockers: [],
            warnings: [],
            affectedRecords: {
                invoices: [
                    { id: 'NF-A-ID', invoiceNumber: '', description: 'Débito sem documento', amount: 80, expenseType: 'a_identificar' },
                    { id: 'NF-NET', invoiceNumber: '9001', description: 'Link banda larga', amount: 249.9, expenseType: 'boleto_internet' }
                ],
                pendencies: [
                    { id: 'P-NET', documentKey: 'boletoInternet', status: 'Aberta' }
                ],
                assets: [
                    { id: 'BEM-1', description: 'Roteador escolar', status: 'Inventariada' }
                ]
            },
            preserved: { otherContexts: true, generalContacts: true }
        }
    });
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Despesa a identificar · Débito sem documento');
    await expect(dialog).toContainText('Boleto Internet 9001 · Link banda larga');
    await expect(dialog).toContainText('Pendência: Boleto de pagamento de Internet · Aberta');
    await expect(dialog).toContainText('Roteador escolar · Inventariada');
    await expect(dialog).toContainText('2 saídas provisórias do PDDE Qualidade voltarão para “Programa a identificar”');
    await expect(dialog).not.toContainText('boletoInternet');
    await expect(dialog).not.toContainText('NF sem número');
    await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeEnabled();
});

test('T4: prévia com bem patrimonial omitido em affectedRecords bloqueia exclusão (fail-closed)', async ({ page }) => {
    await openContextDialog(page, {
        previewOverride: {
            effects: {
                delete: {
                    verifications: ['VER-SET'],
                    registered_invoices: ['NF-SET'],
                    pendencies: [],
                    pendency_attempts: [],
                    pendency_contacts: [],
                    assets: ['BEM-OCULTO']
                },
                update: []
            },
            blockers: [],
            warnings: [],
            affectedRecords: {
                invoices: [{ id: 'NF-SET', invoiceNumber: '1245', description: 'Compra', amount: 189.5, expenseType: 'permanente' }],
                pendencies: [],
                assets: []
            },
            preserved: { otherContexts: true }
        }
    });
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeDisabled();
    await expect(dialog.getByRole('alert')).toContainText('Não é possível excluir esses lançamentos agora.');
});

test('T4: menu Ações do programa fecha com Escape e clique fora sem deixar painel aberto', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        const wrap = document.createElement('div');
        wrap.id = 'test-t4-menu-host';
        wrap.innerHTML = `
            <details class="program-context-options" name="program-context-options">
                <summary>Ações do programa</summary>
                <div class="program-context-options-list">
                    <button type="button" class="program-context-delete-button">Excluir lançamentos deste programa neste mês</button>
                </div>
            </details>
            <button type="button" id="test-t4-outside">Fora do menu</button>
        `;
        document.body.appendChild(wrap);
    });
    const menu = page.locator('#test-t4-menu-host details.program-context-options');
    const summary = menu.locator('summary');
    await summary.click();
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();

    await summary.click();
    await expect(menu).toHaveAttribute('open', '');
    await page.locator('#test-t4-outside').click();
    await expect(menu).not.toHaveAttribute('open', '');
});


test('T4: confirmação permanece no campo de visão sem rolagem da janela em 1280x720', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openContextDialog(page);
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    const confirm = dialog.getByRole('button', { name: 'Excluir estes lançamentos' });
    await expect(confirm).toBeEnabled();
    const geometry = await confirm.evaluate(button => {
        const host = button.closest('[role="dialog"]');
        const rect = button.getBoundingClientRect();
        const shell = host.getBoundingClientRect();
        return {
            top: rect.top,
            bottom: rect.bottom,
            withinDialog: rect.top >= shell.top && rect.bottom <= shell.bottom,
            withinViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
            initialDialogScroll: host.scrollTop
        };
    });
    expect(geometry.initialDialogScroll, 'nenhuma rolagem automática antecedeu a conferência visual').toBe(0);
    expect(geometry.withinDialog && geometry.withinViewport,
        'o botão destrutivo precisa ficar visível sem rolar a janela de confirmação').toBe(true);
    await testInfo.attach('t4-footer-visible-720', {
        body: await page.screenshot({ fullPage: false }), contentType: 'image/png'
    });
});


test('T4: ações da confirmação têm explicações visíveis ao passar o mouse e navegar pelo teclado', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openContextDialog(page);
    const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
    const confirm = dialog.getByRole('button', { name: 'Excluir estes lançamentos' });
    await expect(confirm).toBeEnabled();
    await expect(confirm).toHaveAttribute('aria-description', /mês.*programa/i);
    await expect(confirm).toHaveAttribute('data-tooltip', /mês.*programa/i);
    await confirm.hover();
    await expect.poll(() => confirm.evaluate(button => getComputedStyle(button, '::after').visibility)).toBe('visible');
    await testInfo.attach('t4-confirmation-tooltip-desktop', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.mouse.move(0, 0);
    await dialog.getByRole('button', { name: 'Cancelar' }).focus();
    await page.keyboard.press('Tab');
    const review = dialog.getByRole('button', { name: 'Conferir novamente' });
    await expect(review).toBeFocused();
    await expect.poll(() => review.evaluate(button => getComputedStyle(button, '::after').visibility)).toBe('visible');
    expect(await page.evaluate(() => window.__t4ContextCalls.map(c => c.name))).toEqual(['preview_operational_change']);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => window.__t4ContextCalls.map(c => c.name))).toEqual(['preview_operational_change']);
});

test('T4: decisão e feedback permanecem visíveis durante rolagem da prévia em desktop curto e celular', async ({ page }) => {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 390, height: 540 }]) {
        await page.setViewportSize(viewport);
        await openContextDialog(page);
        const dialog = page.getByRole('dialog', { name: 'Excluir lançamentos deste programa neste mês' });
        const scroll = dialog.getByRole('region', { name: 'Prévia completa da operação' });
        const save = dialog.getByRole('button', { name: 'Excluir estes lançamentos' });
        const cancel = dialog.getByRole('button', { name: 'Cancelar' });
        const review = dialog.getByRole('button', { name: 'Conferir novamente' });
        await expect(save).toBeEnabled();
        const assertActions = async () => {
            for (const control of [save, cancel, review]) {
                await expect(control).toBeInViewport({ ratio: 1 });
                const visible = await control.evaluate(el => {
                    const r = el.getBoundingClientRect();
                    const d = el.closest('[role="dialog"]').getBoundingClientRect();
                    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                    return r.top >= d.top && r.bottom <= d.bottom &&
                        r.left >= d.left && r.right <= d.right && el.contains(hit);
                });
                expect(visible, 'Ação não pode estar cortada ou coberta pelo conteúdo').toBe(true);
            }
        };
        await assertActions();
        await cancel.focus();
        await page.keyboard.press('Shift+Tab');
        await expect(scroll).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(cancel).toBeFocused();
        await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
        await expect(scroll).toBeFocused();
        expect(await scroll.evaluate(el => el.scrollTop + el.clientHeight >= el.scrollHeight - 2)).toBe(true);
        await assertActions();
        await cancel.click();
        await expect(dialog).toBeHidden();
    }
});
