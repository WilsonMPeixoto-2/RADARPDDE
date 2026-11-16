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
        .getByRole('button', { name: 'Editar análise' }).click();
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
        .getByRole('button', { name: 'Editar análise' }).click();
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

test('botão Limpar análise prepara a prévia do que vai mudar e pede confirmação antes de gravar', async ({ page }) => {
    await page.goto('/');
    const dialog = await controlledDialog(page);
    await expect(dialog.getByRole('heading', { name: 'O que vai mudar ao confirmar' })).toBeVisible();
    const clearButton = dialog.getByRole('button', { name: 'Limpar análise' });
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


test('diálogo de exclusão de NF mostra efeitos reais antes de confirmar', async ({ page }) => {
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
    await expect(dialog.getByLabel('Novo resultado')).toHaveCount(0);
    expect(await page.evaluate(() => window.__deleteRequests.filter(x => x.name === 'apply_operational_change'))).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Confirmar exclusão' }).click();
    await expect(dialog).toBeHidden();
    const calls = await page.evaluate(() => window.__deleteRequests);
    expect(calls.find(x => x.name === 'apply_operational_change').args.p_request.action).toBe('delete_invoice');
    expect(calls.find(x => x.name === 'apply_operational_change').args.p_request.target.id).toBe('NF-100');
});

test('diálogo de exclusão de Pendência preserva decisão do usuário antes da escrita', async ({ page }) => {
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
