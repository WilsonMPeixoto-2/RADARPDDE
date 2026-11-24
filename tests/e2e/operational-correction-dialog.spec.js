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
                        action: args.p_request.action, planDigest: 'a'.repeat(64),
                        effects: { update: [{ entity: 'verifications', field: 'analysis.extCC',
                            before: 'Incorreto', after: args.p_request.changes?.analysis ?? 'Não analisado' }] },
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

test('salvar sem justificativa confirma RPC e atualiza a interface', async ({ page }, testInfo) => {
    await page.goto('/');
    const dialog = await controlledDialog(page);
    await dialog.getByLabel('Novo resultado').selectOption('Correto');
    await expect(dialog.getByText('Incorreto → Correto')).toBeVisible();
    await expect(dialog.locator('.correction-scope-fields')).toBeVisible();
    await expect(dialog.locator('.correction-effect-transition strong')).toHaveText('Incorreto → Correto');
    await testInfo.attach('t4-correcao-analise-design', { body: await dialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
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
    await expect(dialog.getByRole('alert')).toContainText(/Falha|Não foi possível|Estado incerto/);
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
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('alert')).toContainText(/Alteração gravada/i);
    await expect(page.getByRole('button', { name: 'Atualizar página' })).toBeVisible();
    expect(await page.evaluate(() => window.__auditRpc.filter(c => c.name === 'apply_operational_change').length)).toBe(1);
});

test('flag sem Supabase impede gravação e não abre modal legado', async ({ page }) => {
    await prepareSchool(page);
    await page.evaluate(() => { window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true; });
    const edit = page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]')
        .getByRole('button', { name: 'Corrigir análise técnica' });
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
        const body = node.querySelector('.radar-operational-correction-body');
        return { left: r.left, right: r.right,
            viewport: document.documentElement.clientWidth,
            overflowY: getComputedStyle(node).overflowY,
            bodyOverflowY: getComputedStyle(body).overflowY,
            bodyHeight: body.clientHeight, bodyWidth: body.clientWidth,
            bodyScrollWidth: body.scrollWidth };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.overflowY).toBe('hidden');
    expect(geometry.bodyOverflowY).toBe('auto');
    expect(geometry.bodyHeight).toBeGreaterThan(0);
    expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.bodyWidth + 1);
    await expect(dialog.getByRole('region', { name: 'Prévia completa da operação' })).toHaveAttribute('tabindex', '0');
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeInViewport();
});

test('RadarDataContext artificial não substitui repositório canônico local', async ({ page }) => {
    await prepareSchool(page);
    await page.evaluate(() => {
        window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true;
        window.__spoofedCalls = [];
        window.RadarDataContext = { dataService: { repository: {
            capabilities: () => ({ remote: true }),
            async executeRpc(name) { window.__spoofedCalls.push(name); }
        } } };
    });
    await page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]')
        .getByRole('button', { name: 'Corrigir análise técnica' }).click();
    await expect(page.getByRole('dialog', { name: 'Corrigir análise técnica' })).toHaveCount(0);
    await expect(page.locator('#pendency-notice')).toContainText(/conexão autenticada/);
    expect(await page.evaluate(() => window.__spoofedCalls)).toEqual([]);
});

test('botão real encontra o repositório em RadarApplicationServices.data', async ({ page }) => {
    await prepareSchool(page);
    await page.evaluate(() => {
        const repository = window.RadarApplicationServices?.data?.repository;
        if (!repository) throw new Error('Repositório canônico não localizado.');
        if (window.RadarDataContext?.repository || window.RadarDataContext?.dataService) {
            throw new Error('O teste exige a composição verdadeira do app.js.');
        }
        window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true;
        window.__canonicalCalls = [];
        repository.capabilities = () => ({ remote: true });
        repository.executeRpc = async (name, args) => {
            window.__canonicalCalls.push(name);
            if (name !== 'preview_operational_change') throw new Error('RPC inesperada');
            return {
                action: 'correct_analysis', planDigest: 'd'.repeat(64),
                effects: { update: [{ entity: 'verifications', field: 'analysis.extCC',
                    before: 'Não analisado', after: args.p_request.changes.analysis }] },
                blockers: [], warnings: [], preserved: {}
            };
        };
    });
    await page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]')
        .getByRole('button', { name: 'Corrigir análise técnica' }).click();
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog.getByText('Não analisado → Correto')).toBeVisible();
    expect(await page.evaluate(() => window.__canonicalCalls)).toEqual(['preview_operational_change']);
});


test('resultado incerto de rede conserva intenção integral no retry e bloqueia nova prévia', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page, { failFirst: true });
    await dialog.getByLabel('Novo resultado').selectOption('Correto');
    await expect(dialog.getByText('Incorreto → Correto')).toBeVisible();
    await dialog.getByLabel('Observação (opcional)').fill('Observação inicial');
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog.getByRole('alert')).toContainText(/Falha|Não foi possível|Estado incerto/i);
    await expect(dialog.getByLabel('Novo resultado')).toBeDisabled();
    await expect(dialog.getByLabel('Observação (opcional)')).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Revisar prévia' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const attempts = await page.evaluate(() => window.__auditRpc
        .filter(call => call.name === 'apply_operational_change')
        .map(call => ({ key: call.args.p_operation_key, payload: call.args.p_request })));
    expect(attempts).toHaveLength(2);
    expect(attempts[1]).toEqual(attempts[0]);
    expect(attempts[0].payload.note).toBe('Observação inicial');
    expect(attempts[0].payload.changes.analysis).toBe('Correto');
});

test('G-02: limpar análise utiliza clear_analysis existente e preserva observação opcional', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page);
    await expect(dialog.getByLabel('Novo resultado').locator('option', { hasText: 'Não analisado' })).toHaveCount(1);
    await dialog.getByLabel('Novo resultado').selectOption('Não analisado');
    await expect(dialog.getByText('Incorreto → Não analisado')).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const calls = await page.evaluate(() => window.__auditRpc);
    const preview = calls.filter(call => call.name === 'preview_operational_change').at(-1);
    const apply = calls.find(call => call.name === 'apply_operational_change');
    expect(preview.args.p_request.action).toBe('clear_analysis');
    expect(preview.args.p_request.changes).toBeUndefined();
    expect(apply.args.p_request.action).toBe('clear_analysis');
    expect(apply.args.p_request.changes).toBeUndefined();
    expect(apply.args.p_request.note).toBeUndefined();
});

test('AMBIGUOUS_CONSEQUENCE exige seleção explícita de Pendências candidatas sem pré-selecionar automaticamente', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.__ambiguousRpc = [];
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__ambiguousRpc.push({ name, args });
                if (name === 'preview_operational_change') {
                    const selected = args.p_request.selectedPendencyIds || [];
                    if (selected.length < 2) {
                        return {
                            action: args.p_request.action,
                            planDigest: 'e'.repeat(64),
                            effects: { update: [{ entity: 'verifications', field: 'analysis.extINV', before: 'Incorreto', after: 'Correto' }] },
                            blockers: [{
                                code: selected.length === 0 ? 'AMBIGUOUS_CONSEQUENCE' : 'INCOMPLETE_PENDENCY_SELECTION',
                                message: 'Há mais de uma Pendência ativa para esta análise; selecione quais serão excluídas.',
                                candidates: ['PEND-CAND-1', 'PEND-CAND-2']
                            }],
                            warnings: [],
                            preserved: {}
                        };
                    }
                    return {
                        action: args.p_request.action,
                        planDigest: 'f'.repeat(64),
                        effects: {
                            delete: { pendencies: selected },
                            update: [{ entity: 'verifications', field: 'analysis.extINV', before: 'Incorreto', after: 'Correto' }]
                        },
                        blockers: [],
                        warnings: [],
                        preserved: {}
                    };
                }
                if (name === 'apply_operational_change') {
                    return { committed: true, operationKey: args.p_operation_key };
                }
                throw new Error('RPC inesperada');
            }
        };
        const root = {
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: { refreshSchool: async () => ({ applied: true }) },
            rebuildOperationalIndexes() {},
            renderProntuario() {}
        };
        window.RadarOperationalCorrectionDialog.open(root, {
            context: { schoolId: 'ESC-1', competence: '2026-05', programId: 'BASIC', documentKey: 'extINV', documentLabel: 'Extrato Investimento' },
            currentValue: 'Correto'
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog.getByText(/Há mais de uma Pendência ativa/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeDisabled();
    const cand1 = dialog.getByLabel('Excluir Pendência PEND-CAND-1');
    const cand2 = dialog.getByLabel('Excluir Pendência PEND-CAND-2');
    await expect(cand1).not.toBeChecked();
    await expect(cand2).not.toBeChecked();
    await cand2.check();
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeDisabled();
    await cand1.check();
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const applyCall = await page.evaluate(() => window.__ambiguousRpc.find(c => c.name === 'apply_operational_change'));
    expect(applyCall.args.p_request.selectedPendencyIds).toEqual(['PEND-CAND-1', 'PEND-CAND-2']);
});

test('botão Redefinir como não analisado prepara a prévia do que vai mudar e pede confirmação antes de gravar', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page);
    await expect(dialog.getByRole('heading', { name: 'O que vai mudar ao confirmar' })).toBeVisible();
    const clearButton = dialog.getByRole('button', { name: 'Redefinir como não analisado' });
    await expect(clearButton).toBeEnabled();
    await clearButton.click();
    await expect(dialog.getByText('Incorreto → Não analisado')).toBeVisible();
    await expect(dialog.getByText(/Análise pronta para ser limpa/)).toBeVisible();
    await expect(clearButton).toBeDisabled();
    // Ainda não gravou nada antes da confirmação explícita:
    expect(await page.evaluate(() => window.__auditRpc.filter(c => c.name === 'apply_operational_change').length)).toBe(0);
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const applyCall = await page.evaluate(() => window.__auditRpc.find(c => c.name === 'apply_operational_change'));
    expect(applyCall.args.p_request.action).toBe('clear_analysis');
});


test('diálogo de exclusão de NF mostra efeitos reais antes de confirmar', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.__deleteRequests = [];
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__deleteRequests.push({ name, args });
                if (name === 'preview_operational_change') return {
                    action: 'delete_invoice', planDigest: 'b'.repeat(64),
                    effects: { delete: {
                        registered_invoices: ['NF-100'],
                        pendencies: ['PEND-100'],
                        pendency_attempts: ['ENV-100'],
                        pendency_contacts: [],
                        assets: ['BEM-100']
                    }, update: [{ entity: 'verifications', field: 'analysis.notaFiscal',
                        before: 'Incorreto', after: 'Não analisado' }] },
                    blockers: [], warnings: [], preserved: { bonusResult: 'apta' }
                };
                if (name === 'apply_operational_change') return { committed: true };
                throw new Error('RPC inesperada');
            }
        };
        const root = {
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: { refreshSchool: async () => ({ ok: true }) },
            rebuildOperationalIndexes() {}, renderProntuario() {}
        };
        window.RadarOperationalCorrectionDialog.open(root, {
            mode: 'delete_invoice',
            context: { schoolId: 'ESC-1', competence: '2026-05', programId: 'BASIC',
                invoiceId: 'NF-100', documentKey: 'notaFiscal', documentLabel: 'NF nº 100' }
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Excluir nota fiscal' });
    await expect(dialog.getByText(/1 nota fiscal/)).toBeVisible();
    await expect(dialog.getByText(/1 Pendência/)).toBeVisible();
    await expect(dialog.getByText(/1 bem patrimonial/)).toBeVisible();
    await expect(dialog.locator('.correction-impact-count')).toHaveCount(4);
    await expect(dialog.locator('.correction-scope-field dt')).toHaveText(['Escola', 'Mês de referência', 'Programa', 'Documento']);
    await expect(dialog.locator('.correction-preservation-panel')).toContainText('bonificação já consolidada será preservado');
    await expect(dialog.locator('.correction-effect-transition strong')).toHaveText('Incorreto → Não analisado');
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão' })).toHaveClass(/btn-danger/);
    await testInfo.attach('t4-exclusao-nota-fiscal-design', { body: await dialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await expect(dialog.getByLabel('Novo resultado')).toHaveCount(0);
    expect(await page.evaluate(() => window.__deleteRequests.filter(x => x.name === 'apply_operational_change'))).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Confirmar exclusão' }).click();
    await expect(dialog).toBeHidden();
    const calls = await page.evaluate(() => window.__deleteRequests);
    expect(calls.find(x => x.name === 'apply_operational_change').args.p_request.action).toBe('delete_invoice');
    expect(calls.find(x => x.name === 'apply_operational_change').args.p_request.target.id).toBe('NF-100');
});

test('diálogo de exclusão de Pendência preserva decisão do usuário antes da escrita', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.__pendDeleteCalls = [];
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__pendDeleteCalls.push({ name, args });
                if (name === 'preview_operational_change') return {
                    action: 'delete_pendency', planDigest: 'c'.repeat(64),
                    effects: { delete: { pendencies: ['P-10'], pendency_attempts: ['ENV-10'],
                        registered_invoices: [], pendency_contacts: [], assets: [] }, update: [] },
                    blockers: [], warnings: [], preserved: {}
                };
                if (name === 'apply_operational_change') return { committed: true };
                throw new Error('RPC inesperada');
            }
        };
        window.RadarOperationalCorrectionDialog.open({
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: { refreshSchool: async () => ({ ok: true }) },
            renderProntuario() {}, rebuildOperationalIndexes() {}
        }, {
            mode: 'delete_pendency',
            context: { schoolId: 'ESC-1', competence: '2026-05', programId: 'BASIC',
                pendencyId: 'P-10', documentLabel: 'Pendência do extrato' }
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Excluir pendência' });
    await expect(dialog.getByText(/1 Pendência/)).toBeVisible();
    await expect(dialog.locator('.correction-impact-count')).toHaveText(['1', '1']);
    await expect(dialog.locator('.correction-scope-field dt')).toHaveText(['Escola', 'Mês de referência', 'Programa', 'Documento']);
    await expect(dialog.locator('.correction-preservation-panel')).toContainText('Nenhuma outra informação será alterada.');
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão' })).toHaveClass(/btn-danger/);
    await testInfo.attach('t4-exclusao-pendencia-design', { body: await dialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.body.classList.add('dark-theme'));
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão' })).toBeInViewport();
    await testInfo.attach('t4-exclusao-pendencia-mobile-dark', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__pendDeleteCalls.filter(x => x.name === 'apply_operational_change'))).toHaveLength(0);
});

test('refresh não ocorre enquanto o próprio diálogo de correção está aberto', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.__refreshWasBlocked = null;
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name) {
                if (name === 'preview_operational_change') return {
                    action: 'clear_analysis', planDigest: 'd'.repeat(64),
                    effects: { delete: {}, update: [] }, blockers: [], warnings: []
                };
                return { committed: true };
            }
        };
        window.RadarOperationalCorrectionDialog.open({
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: {
                refreshSchool: async () => {
                    window.__refreshWasBlocked = Boolean(document.querySelector('#radar-operational-correction-layer'));
                    return window.__refreshWasBlocked ? { skipped: true, reason: 'editing' } : { ok: true };
                }
            },
            rebuildOperationalIndexes() {}, renderProntuario() {}
        }, {
            context: { schoolId: 'ESC-1', competence: '2026-05',
                programId: 'BASIC', documentKey: 'extCC', documentLabel: 'Extrato' },
            currentValue: 'Incorreto'
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await dialog.getByLabel('Novo resultado').selectOption('Não analisado');
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__refreshWasBlocked)).toBe(false);
});


test('Pendência obrigatória orienta excluir a despesa e a Pendência juntas', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.__guidedDeletion = [];
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name) {
                if (name !== 'preview_operational_change') throw new Error('Nenhuma exclusão deve ocorrer.');
                return {
                    action: 'delete_pendency', planDigest: 'e'.repeat(64),
                    effects: { delete: {}, update: [] },
                    blockers: [{ code: 'MANDATORY_PENDENCY',
                        message: 'A Pendência é obrigatória para esta despesa. Exclua o conjunto.' }],
                    warnings: []
                };
            }
        };
        window.RadarOperationalCorrectionDialog.open({
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            removerNotaRegistrada(...args) { window.__guidedDeletion.push(args); }
        }, {
            mode: 'delete_pendency',
            context: { schoolId: 'ESC-1', competence: '2026-05', programId: 'BASIC',
                pendencyId: 'P-1', linkedInvoiceId: 'NF-1', documentKey: 'notaFiscal',
                documentLabel: 'Despesa a identificar' }
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Excluir pendência' });
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Excluir despesa e Pendência juntas' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__guidedDeletion)).toEqual([['NF-1', 'ESC-1']]);
});

test('orientação para Incorreto na Assessoria abre seu fluxo, não a Pendência fiscal', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.__advisoryOpens = [];
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name) {
                if (name !== 'preview_operational_change') throw new Error('Não deve gravar.');
                return { action: 'correct_analysis', planDigest: 'b'.repeat(64),
                    effects: { update: [], delete: {} },
                    blockers: [{ code: 'OPEN_PENDENCY_FLOW_REQUIRED',
                        message: 'Abra a Pendência com os apontamentos.' }], warnings: [] };
            }
        };
        window.RadarOperationalCorrectionDialog.open({
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            openInvoiceDocumentPendencyModal() { throw new Error('Abertura fiscal indevida'); },
            changeInvoiceAdvisoryAnalysis(...args) { window.__advisoryOpens.push(args); }
        }, {
            context: { schoolId: 'ESC-1', competence: '2026-05',
                programId: 'BASIC', invoiceId: 'NF-SVC', documentKey: 'consAssessoria',
                documentLabel: 'Consulta Assessoria' },
            currentValue: 'Correto'
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await dialog.getByRole('button', { name: 'Ir para abertura de Pendência' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__advisoryOpens))
        .toEqual([['NF-SVC', 'ESC-1', 'Incorreto']]);
});

test('confirmação acionada na fila de Pendências re-renderiza renderPendencias sem sobrescrever com renderProntuario', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        switchView('pendencias');
        window.__renderedViews = [];
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name) {
                if (name === 'preview_operational_change') {
                    return {
                        action: 'delete_pendency',
                        planDigest: 'f'.repeat(64),
                        effects: { delete: { pendencies: ['P-99'] }, update: [] },
                        blockers: [],
                        warnings: [],
                        preserved: {}
                    };
                }
                return { committed: true };
            }
        };
        window.RadarOperationalCorrectionDialog.open({
            document,
            RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
            RadarApplicationServices: { data: { repository } },
            RadarOperationalCorrectionClient: window.RadarOperationalCorrectionClient,
            RadarOperationalContextRefreshController: { refreshSchool: async () => ({ ok: true }) },
            rebuildOperationalIndexes() {},
            renderPendencias() { window.__renderedViews.push('pendencias'); },
            renderProntuario() { window.__renderedViews.push('prontuario'); }
        }, {
            mode: 'delete_pendency',
            context: {
                schoolId: 'ESC-1',
                competence: '2026-05',
                programId: 'BASIC',
                pendencyId: 'P-99',
                documentLabel: 'Pendência de teste'
            }
        });
    });
    const dialog = page.getByRole('dialog', { name: 'Excluir pendência' });
    await dialog.getByRole('button', { name: 'Confirmar exclusão' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__renderedViews)).toEqual(['pendencias']);
});

test('linha de Consulta à Assessoria preserva 1ª análise em 1 clique, reconcilia botão Corrigir análise técnica com aria-describedby e intercepta retificação no select e no botão para abrir diálogo T2', async ({ page }) => {
    const { schoolId, competence, compKey } = await prepareSchool(page);
    await page.evaluate(({ sid, comp, cKey }) => {
        const repository = window.RadarApplicationServices?.data?.repository;
        window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true;
        window.__advisoryPreviewRequests = [];
        repository.capabilities = () => ({ remote: true, atomicInvoiceEffects: true });
        repository.saveInvoiceWithEffects = async () => ({ ok: true });
        repository.executeRpc = async (name, args) => {
            if (name === 'preview_operational_change') {
                window.__advisoryPreviewRequests.push(args.p_request);
                return {
                    action: args.p_request.action,
                    planDigest: 'c'.repeat(64),
                    effects: {
                        update: [{
                            entity: 'registered_invoices',
                            id: 'NF-SVC-77',
                            field: 'payload.analiseConsultaAssessoria',
                            before: 'Correto',
                            after: args.p_request.changes?.analysis || 'Não analisado'
                        }]
                    },
                    blockers: [],
                    warnings: [],
                    preserved: {}
                };
            }
            return { committed: true };
        };
        notasRegistradas.push({
            id: 'NF-SVC-77',
            escolaId: sid,
            compKey: cKey,
            competencia: comp,
            programaId: 'BASIC',
            tipo: 'servico',
            numero: '777',
            desc: 'Manutenção predial',
            descricao: 'Manutenção predial',
            valor: 1200,
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Não analisado'
        });
        rebuildOperationalIndexes();
        renderProntuario(sid);
    }, { sid: schoolId, comp: competence, cKey: compKey });

    const advisoryRow = page.locator('.service-advisory-row[data-service-advisory-invoice="NF-SVC-77"]');
    await expect(advisoryRow).toBeVisible();
    const advisorySelect = advisoryRow.getByLabel('Análise da consulta à Assessoria para a NF 777');
    await expect(advisorySelect).toHaveValue('Não analisado');
    await expect(advisoryRow.getByRole('button', { name: 'Corrigir análise técnica', exact: true })).toHaveCount(0);

    // 1ª análise em 1 clique ('Não analisado' -> 'Correto') grava direto e reconcilia o botão Corrigir análise técnica sem reload:
    await advisorySelect.selectOption('Correto');
    await expect(advisorySelect).toHaveValue('Correto');
    await expect(advisorySelect).toHaveClass(/is-correct/);
    expect(await page.evaluate(() => window.__advisoryPreviewRequests)).toEqual([]);

    const editBtn = advisoryRow.getByRole('button', { name: 'Corrigir análise técnica', exact: true });
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toHaveAttribute('aria-describedby', 'advisory-invoice-title-NF-SVC-77');
    await expect(advisoryRow.locator('#advisory-invoice-title-NF-SVC-77')).toHaveText('NF 777');

    // Retificação pelo <select> ('Correto' -> 'Correto (Atrasado)') restaura o select e abre o diálogo T2 com sugestão:
    await advisorySelect.selectOption('Correto (Atrasado)');
    await expect(advisorySelect).toHaveValue('Correto');
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Novo resultado')).toHaveValue('Correto (Atrasado)');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();

    // Retificação pelo botão explícito Corrigir análise técnica:
    await editBtn.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Novo resultado')).toHaveValue('Correto');
    expect(await page.evaluate(() => window.__advisoryPreviewRequests.map(req => ({
        action: req.action,
        target: req.target,
        analysis: req.changes?.analysis
    })))).toEqual([
        {
            action: 'correct_analysis',
            target: expect.objectContaining({
                id: 'NF-SVC-77',
                programId: 'BASIC',
                documentKey: 'consAssessoria'
            }),
            analysis: 'Correto (Atrasado)'
        },
        {
            action: 'correct_analysis',
            target: expect.objectContaining({
                id: 'NF-SVC-77',
                programId: 'BASIC',
                documentKey: 'consAssessoria'
            }),
            analysis: 'Correto'
        }
    ]);
});

test('A-01 em navegador: reconciliação incremental da Assessoria substitui Corrigir análise técnica por Visualizar pendência, mantém acesso a Corrigir análise na gaveta e aplica inert no modal T2', async ({ page }) => {
    const { schoolId, competence, compKey } = await prepareSchool(page);
    await page.evaluate(({ sid, comp, cKey }) => {
        const repository = window.RadarApplicationServices?.data?.repository;
        window.RADAR_OPERATIONAL_CORRECTION_PREVIEW = true;
        window.__a01Previews = [];
        repository.capabilities = () => ({ remote: true, atomicInvoiceEffects: true });
        repository.executeRpc = async (name, args) => {
            if (name === 'preview_operational_change') {
                window.__a01Previews.push(args.p_request);
                return {
                    action: args.p_request.action,
                    planDigest: 'e'.repeat(64),
                    effects: {
                        delete: { pendencies: ['PEND-SVC-88'] },
                        update: [{
                            entity: 'registered_invoices',
                            id: 'NF-SVC-88',
                            field: 'payload.analiseConsultaAssessoria',
                            before: 'Incorreto',
                            after: args.p_request.changes?.analysis || 'Não analisado'
                        }]
                    },
                    blockers: [],
                    warnings: [],
                    preserved: {}
                };
            }
            return { committed: true };
        };
        notasRegistradas.push({
            id: 'NF-SVC-88',
            escolaId: sid,
            compKey: cKey,
            competencia: comp,
            programaId: 'BASIC',
            tipo: 'servico',
            numero: '888',
            desc: 'Serviço elétrico',
            descricao: 'Serviço elétrico',
            valor: 950,
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Correto'
        });
        rebuildOperationalIndexes();
        renderProntuario(sid);
    }, { sid: schoolId, comp: competence, cKey: compKey });

    const advisoryRow = page.locator('.service-advisory-row[data-service-advisory-invoice="NF-SVC-88"]');
    const advisorySelect = advisoryRow.getByLabel('Análise da consulta à Assessoria para a NF 888');
    const advisoryCheckbox = advisoryRow.getByLabel('Consulta enviada à Assessoria para a NF 888');
    await expect(advisoryRow.getByRole('button', { name: 'Corrigir análise técnica', exact: true })).toBeVisible();
    await expect(advisorySelect).toBeEnabled();
    await expect(advisoryCheckbox).toBeEnabled();

    // Surge uma Pendência ativa na mesma NF e roda APENAS a reconciliação incremental (sem renderProntuario):
    await page.evaluate(({ sid, comp, cKey }) => {
        const note = notasRegistradas.find(item => item.id === 'NF-SVC-88');
        note.analiseConsultaAssessoria = 'Incorreto';
        pendencias.push({
            id: 'PEND-SVC-88',
            escolaId: sid,
            competencia: comp,
            competenciaOrigem: comp,
            programaId: 'BASIC',
            documentoKey: 'consAssessoria',
            registeredInvoiceId: 'NF-SVC-88',
            item: 'Consulta Assessoria — NF 888',
            motivo: 'Documento incompleto',
            observacao: 'Falta assinatura da Assessoria.',
            dataAbertura: '2026-05-15',
            status: 'Aberta',
            tipo: 'documental',
            tentativas: []
        });
        window.RadarProntuarioConditionalReconciler.reconcile(window, sid, cKey);
    }, { sid: schoolId, comp: competence, cKey: compKey });

    await expect(advisorySelect).toBeDisabled();
    await expect(advisoryCheckbox).toBeDisabled();
    await expect(advisoryRow.getByRole('button', { name: 'Corrigir análise técnica', exact: true })).toHaveCount(0);

    const viewBtn = advisoryRow.getByRole('button', { name: 'Visualizar pendência', exact: true });
    await expect(viewBtn).toBeVisible();
    await expect(viewBtn).toHaveAttribute('aria-describedby', 'advisory-invoice-title-NF-SVC-88');
    await expect(viewBtn.locator('svg path')).toHaveCount(1);
    await expect(viewBtn.locator('svg circle')).toHaveCount(1);

    // Coerência funcional: a gaveta da Pendência oferece Corrigir análise e Excluir pendência:
    await viewBtn.click();
    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Excluir pendência', exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Corrigir análise', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog).toBeVisible();
    // Acessibilidade (modern-web-guidance): overlay customizado marca o fundo ativo como inert
    // e preserva elementos já inert (modais fechados) ao restaurar:
    const appShellInertWhileOpen = await page.evaluate(() => {
        const layer = document.getElementById('radar-operational-correction-layer');
        const appShell = document.getElementById('app-layout');
        const siblings = Array.from(document.body.children).filter(el => el !== layer);
        return Boolean(appShell?.inert) && siblings.every(el => el.inert === true);
    });
    expect(appShellInertWhileOpen).toBe(true);

    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(dialog).toBeHidden();
    const appShellInertAfterClose = await page.evaluate(() => (
        Boolean(document.getElementById('app-layout')?.inert)
    ));
    expect(appShellInertAfterClose).toBe(false);

    // Resolver a Pendência e reconciliar restaura Corrigir análise técnica e destrava os controles:
    await page.evaluate(({ sid, cKey }) => {
        const note = notasRegistradas.find(item => item.id === 'NF-SVC-88');
        note.analiseConsultaAssessoria = 'Correto';
        const pend = pendencias.find(item => item.id === 'PEND-SVC-88');
        pend.status = 'Resolvida';
        window.RadarProntuarioConditionalReconciler.reconcile(window, sid, cKey);
    }, { sid: schoolId, cKey: compKey });

    await expect(advisorySelect).toBeEnabled();
    await expect(advisoryCheckbox).toBeEnabled();
    await expect(advisoryRow.getByRole('button', { name: 'Visualizar pendência', exact: true })).toHaveCount(0);
    await expect(advisoryRow.getByRole('button', { name: 'Corrigir análise técnica', exact: true })).toBeVisible();

    // Contraprova de perfil SME com Pendência ativa: nenhum botão de ação é exposto na reconciliação:
    await page.evaluate(({ sid, cKey }) => {
        const pend = pendencias.find(item => item.id === 'PEND-SVC-88');
        pend.status = 'Aberta';
        const originalProfile = window.getRadarAccessProfile;
        window.getRadarAccessProfile = () => 'sme';
        try {
            window.RadarProntuarioConditionalReconciler.reconcile(window, sid, cKey);
        } finally {
            window.getRadarAccessProfile = originalProfile;
        }
    }, { sid: schoolId, cKey: compKey });

    await expect(advisorySelect).toBeDisabled();
    await expect(advisoryCheckbox).toBeDisabled();
    await expect(advisoryRow.getByRole('button', { name: 'Visualizar pendência', exact: true })).toHaveCount(0);
    await expect(advisoryRow.getByRole('button', { name: 'Corrigir análise técnica', exact: true })).toHaveCount(0);
});

