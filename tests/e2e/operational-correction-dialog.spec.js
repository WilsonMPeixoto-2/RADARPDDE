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
                    if (!selected.length) {
                        return {
                            action: args.p_request.action,
                            planDigest: 'e'.repeat(64),
                            effects: { update: [{ entity: 'verifications', field: 'analysis.extINV', before: 'Incorreto', after: 'Correto' }] },
                            blockers: [{
                                code: 'AMBIGUOUS_CONSEQUENCE',
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
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Confirmar correção' }).click();
    await expect(dialog).toBeHidden();
    const applyCall = await page.evaluate(() => window.__ambiguousRpc.find(c => c.name === 'apply_operational_change'));
    expect(applyCall.args.p_request.selectedPendencyIds).toEqual(['PEND-CAND-2']);
});
