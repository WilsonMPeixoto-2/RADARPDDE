'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_CORRECTION_LOCAL === '1';
test.skip(
    !enabled,
    'Exige Supabase local com Auth/RLS reais e flag RADAR_OPERATIONAL_CORRECTION_PREVIEW=true.'
);

const fixtures = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
    'utf8'
));
const fixturePassword = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !fixturePassword) {
    throw new Error('A senha efêmera da fixture Auth local não foi fornecida.');
}

const SCHOOL_ID = 'ESC-OTHER';
const COMPETENCE = '2026-05';
const PROGRAM_ID = 'BASIC';

test.describe.configure({ mode: 'serial' });

async function loginAs(page, profileId) {
    const account = fixtures.find(item => item.profileId === profileId && item.active);
    if (!account) throw new Error(`Fixture Auth não encontrada para ${profileId}.`);
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(fixturePassword);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await waitForApp(page, profileId);
}

async function waitForApp(page, role) {
    await page.waitForFunction(expectedRole => (
        window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === expectedRole
    ), role);
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await expect(page.locator('#app-layout')).toBeVisible();
    await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

async function openSchool(page, role, schoolId = SCHOOL_ID) {
    await page.goto(`/escolas/${schoolId}`);
    await waitForApp(page, role);
    await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
}

async function settleWrites(page) {
    await page.evaluate(() => window.RadarApplicationServices?.data?.remoteExecutionTail);
}

async function closePreviewDrawerIfOpen(page) {
    await page.evaluate(() => {
        const drawer = document.getElementById('pendency-preview-drawer');
        if (drawer && !drawer.hidden) window.closePendencyDrawer?.();
    });
}

async function ensureConsolidatedFixtureBonification(page) {
    return page.evaluate(async ({ schoolId, competence, programId }) => {
        const client = window.RadarSessionContext.service.client;
        const { data: current, error: readError } = await client
            .from('verifications')
            .select('id, bonification, analysis, bonus_result')
            .eq('school_id', schoolId)
            .eq('competence_id', competence)
            .eq('program_id', programId)
            .single();
        if (readError) throw new Error(readError.message);
        const nextBonification = {
            ...(current.bonification || {}),
            extCC: 'Sim',
            notaFiscal: 'Sim'
        };
        const { data: updated, error: updateError } = await client
            .from('verifications')
            .update({ bonification: nextBonification })
            .eq('id', current.id)
            .select('id, bonification, analysis, bonus_result')
            .single();
        if (updateError) throw new Error(updateError.message);
        return updated;
    }, { schoolId: SCHOOL_ID, competence: COMPETENCE, programId: PROGRAM_ID });
}

async function readVerificationFromDb(page) {
    return page.evaluate(async ({ schoolId, competence, programId }) => {
        const { data, error } = await window.RadarSessionContext.service.client
            .from('verifications')
            .select('id, bonification, analysis, bonus_result, row_version')
            .eq('school_id', schoolId)
            .eq('competence_id', competence)
            .eq('program_id', programId)
            .single();
        if (error) throw new Error(error.message);
        return data;
    }, { schoolId: SCHOOL_ID, competence: COMPETENCE, programId: PROGRAM_ID });
}

async function readInvoiceFromDb(page, invoiceNumber) {
    return page.evaluate(async ({ schoolId, number }) => {
        const { data, error } = await window.RadarSessionContext.service.client
            .from('registered_invoices')
            .select('id, invoice_number, expense_type, payload, row_version')
            .eq('school_id', schoolId)
            .eq('invoice_number', number);
        if (error) throw new Error(error.message);
        return data || [];
    }, { schoolId: SCHOOL_ID, number: invoiceNumber });
}

async function readPendenciesForInvoice(page, invoiceId) {
    return page.evaluate(async id => {
        const { data, error } = await window.RadarSessionContext.service.client
            .from('pendencies')
            .select('id, document_key, status, registered_invoice_id, payload')
            .eq('registered_invoice_id', id);
        if (error) throw new Error(error.message);
        return data || [];
    }, invoiceId);
}

async function createInvoice(page, { type, number, description, amount }) {
    const fiscalRow = page.locator(`tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"]`);
    await fiscalRow.getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    const modal = page.locator('#modal-dados-nota');
    await expect(modal).toHaveClass(/show/);
    await modal.getByLabel('Tipo de Gasto', { exact: true }).selectOption(type);
    await modal.locator('#nota-numero').fill(number);
    await modal.locator('#nota-desc').fill(description);
    await modal.getByLabel('Valor do Gasto (R$)', { exact: true }).fill(String(amount));
    await modal.getByRole('button', { name: 'Salvar Gasto', exact: true }).click();
    await expect(modal).not.toHaveClass(/show/);
    await settleWrites(page);
}

test('T2 documental (correct_analysis e clear_analysis): RPC real, F5 e segunda sessão autenticada', async ({ page, browser }, testInfo) => {
    test.setTimeout(90000);
    const pageErrors = [];
    const rpcCalls = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/rest/v1/rpc/preview_operational_change')) rpcCalls.push('preview');
        if (url.includes('/rest/v1/rpc/apply_operational_change')) rpcCalls.push('apply');
    });

    await loginAs(page, 'controller');
    const runtime = await page.evaluate(() => ({
        dataMode: window.RADAR_PDDE_CONFIG?.dataMode,
        repoMode: window.RadarDataContext?.capabilities?.mode,
        pilotFlag: window.RADAR_OPERATIONAL_CORRECTION_PREVIEW === true,
        canUseDialog: window.RadarOperationalCorrectionDialog?.canUse?.(window) === true
    }));
    expect(runtime).toEqual({
        dataMode: 'supabase-preview',
        repoMode: 'supabase',
        pilotFlag: true,
        canUseDialog: true
    });

    // ESC-OTHER já possui bonificação consolidada ('apta') da suíte anterior, mas
    // com campos de entrega vazios; completamos extCC/notaFiscal = 'Sim' para
    // manter um estado consolidado realista e provar ADR-055 (bonus_result = 'apta' preservado).
    const preparedDb = await ensureConsolidatedFixtureBonification(page);
    expect(preparedDb.bonus_result).toBe('apta');
    expect(preparedDb.bonification.extCC).toBe('Sim');
    expect(preparedDb.bonification.notaFiscal).toBe('Sim');

    await openSchool(page, 'controller');
    const extRow = page.locator(`#prontuario-verif-rows tr[data-program-id="${PROGRAM_ID}"][data-document-key="extCC"]`);

    // 1ª análise em 1 clique sem modal T2:
    const extSelect = extRow.locator('select.select-analise');
    await extSelect.selectOption('Correto');
    await settleWrites(page);
    await expect(extSelect).toHaveValue('Correto');
    expect(rpcCalls).toEqual([]);

    // Retificação pelo botão Editar análise (sem justificativa obrigatória):
    await extRow.getByRole('button', { name: 'Editar análise', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#app-layout')).toHaveJSProperty('inert', true);
    await dialog.getByLabel('Novo resultado').selectOption('Correto (Atrasado)');
    await expect(dialog.getByText('Correto → Correto (Atrasado)')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Confirmar correção', exact: true })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Confirmar correção', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#app-layout')).toHaveJSProperty('inert', false);
    await expect(extSelect).toHaveValue('Correto (Atrasado)');
    expect(rpcCalls).toContain('preview');
    expect(rpcCalls).toContain('apply');

    // F5 real confirma persistência no banco e preservação de bonus_result (ADR-055):
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(extRow.locator('select.select-analise')).toHaveValue('Correto (Atrasado)');
    const afterCorrectDb = await readVerificationFromDb(page);
    expect(afterCorrectDb.analysis.extCC).toBe('Correto (Atrasado)');
    expect(afterCorrectDb.bonus_result).toBe('apta');

    // Segunda sessão autenticada (Assistente) vê o mesmo estado persistido:
    const secondContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistantPage = await secondContext.newPage();
        await loginAs(assistantPage, 'federal_assistant');
        await openSchool(assistantPage, 'federal_assistant');
        const assistantExtRow = assistantPage.locator(
            `#prontuario-verif-rows tr[data-program-id="${PROGRAM_ID}"][data-document-key="extCC"]`
        );
        await expect(assistantExtRow.locator('select.select-analise')).toHaveValue('Correto (Atrasado)');

        // Limpar análise (clear_analysis) pela sessão do Assistente:
        await assistantExtRow.getByRole('button', { name: 'Editar análise', exact: true }).click();
        const clearDialog = assistantPage.getByRole('dialog', { name: 'Corrigir análise técnica' });
        await expect(clearDialog).toBeVisible();
        await clearDialog.getByRole('button', { name: 'Limpar análise', exact: true }).click();
        await expect(clearDialog.getByText('Correto (Atrasado) → Não analisado')).toBeVisible();
        await clearDialog.getByRole('button', { name: 'Confirmar correção', exact: true }).click();
        await expect(clearDialog).toBeHidden();
        await expect(assistantExtRow.locator('select.select-analise')).toHaveValue('Não analisado');

        await assistantPage.reload();
        await waitForApp(assistantPage, 'federal_assistant');
        await expect(assistantExtRow.locator('select.select-analise')).toHaveValue('Não analisado');
    } finally {
        await secondContext.close();
    }

    // F5 na sessão original do Controlador confirma limpeza refletida e bonificação preservada:
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(extRow.locator('select.select-analise')).toHaveValue('Não analisado');
    const afterClearDb = await readVerificationFromDb(page);
    expect(afterClearDb.analysis?.extCC ?? null).toBeNull();
    expect(afterClearDb.bonus_result).toBe('apta');
    expect(pageErrors).toEqual([]);
});

test('T2 Consulta à Assessoria + A-01 real + Corrigir análise pela gaveta: RPC real, F5 e segunda sessão', async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const pageErrors = [];
    const rpcUrls = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('request', request => {
        if (request.url().includes('/rest/v1/rpc/preview_operational_change')
            || request.url().includes('/rest/v1/rpc/apply_operational_change')) {
            rpcUrls.push(request.url());
        }
    });

    const serviceNumber = `OCC-SVC-${Date.now()}`;
    await loginAs(page, 'controller');
    await openSchool(page, 'controller');
    await createInvoice(page, {
        type: 'servico',
        number: serviceNumber,
        description: 'Serviço elétrico piloto T2',
        amount: 650
    });

    // Analisar a NF fiscal como Correto para manter agregado consistente nos testes seguintes:
    const fiscalInvoiceRow = page.locator(`tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"] .invoice-document-row`)
        .filter({ hasText: serviceNumber });
    await fiscalInvoiceRow.getByRole('combobox').selectOption('Correto');
    await settleWrites(page);

    const advisoryRow = page.locator('.service-advisory-row').filter({ hasText: `NF ${serviceNumber}` });
    await expect(advisoryRow).toBeVisible();
    const advisorySelect = advisoryRow.getByLabel(`Análise da consulta à Assessoria para a NF ${serviceNumber}`);
    const advisoryCheckbox = advisoryRow.getByLabel(`Consulta enviada à Assessoria para a NF ${serviceNumber}`);
    await expect(advisoryRow.getByRole('button', { name: 'Editar análise', exact: true })).toHaveCount(0);

    // Marcar envio à Assessoria antes da análise para que bonification.consAssessoria = 'Sim'
    // (evitando normalização automática para Correto (Atrasado) sob bonus_result = 'apta'):
    await advisoryCheckbox.check();
    await settleWrites(page);
    await expect(advisoryCheckbox).toBeChecked();

    // 1ª análise em 1 clique ('Não analisado' -> 'Correto') grava direto e reconcilia Editar análise:
    await advisorySelect.selectOption('Correto');
    await settleWrites(page);
    await expect(advisorySelect).toHaveValue('Correto');
    await expect(advisoryRow.getByRole('button', { name: 'Editar análise', exact: true })).toBeVisible();
    expect(rpcUrls).toEqual([]);

    // Retificação pelo <select> ('Correto' -> 'Correto (Atrasado)') abre diálogo T2 real:
    await advisorySelect.selectOption('Correto (Atrasado)');
    await expect(advisorySelect).toHaveValue('Correto');
    const retifyDialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(retifyDialog).toBeVisible();
    await expect(retifyDialog.getByLabel('Novo resultado')).toHaveValue('Correto (Atrasado)');
    await expect(retifyDialog.getByText(
        'Consulta à Assessoria da nota fiscal / Resumo da Assessoria do programa — Correto → Correto (Atrasado)',
        { exact: true }
    )).toBeVisible();
    await retifyDialog.getByRole('button', { name: 'Confirmar correção', exact: true }).click();
    await expect(retifyDialog).toBeHidden();
    await expect(advisorySelect).toHaveValue('Correto (Atrasado)');

    // Abrir Pendência real via Incorreto na Assessoria e provar A-01 real (sem reload):
    await advisorySelect.selectOption('Incorreto');
    const opening = page.locator('#modal-nova-pendencia');
    await expect(opening).toHaveClass(/show/);
    await opening.getByLabel('Documento incompleto', { exact: true }).check();
    await opening.getByLabel('Observações / Detalhes', { exact: true }).fill('Auditoria real A-01 na Assessoria.');
    await opening.getByRole('button', { name: 'Criar Pendência', exact: true }).click();
    await expect(opening).not.toHaveClass(/show/);
    await settleWrites(page);
    await closePreviewDrawerIfOpen(page);

    await expect(advisoryCheckbox).toBeDisabled();
    await expect(advisoryRow.getByRole('button', { name: 'Editar análise', exact: true })).toHaveCount(0);
    const viewPendencyBtn = advisoryRow.getByRole('button', { name: 'Visualizar pendência', exact: true });
    await expect(viewPendencyBtn).toBeVisible();

    const [createdSvc] = await readInvoiceFromDb(page, serviceNumber);
    expect(createdSvc).toBeTruthy();
    expect(await readPendenciesForInvoice(page, createdSvc.id)).toHaveLength(1);

    // Abrir gaveta lateral -> acionar Corrigir análise -> remover Pendência e voltar a Correto:
    await viewPendencyBtn.click();
    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Excluir pendência', exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Corrigir análise', exact: true }).click();

    const fixDialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await expect(fixDialog).toBeVisible();
    await fixDialog.getByLabel('Novo resultado').selectOption('Correto');
    await expect(fixDialog.getByText('Incorreto → Correto')).toBeVisible();
    await expect(fixDialog.getByText(/1 Pendência/)).toBeVisible();
    await fixDialog.getByRole('button', { name: 'Confirmar correção', exact: true }).click();
    await expect(fixDialog).toBeHidden();

    // Reconciliação pós-apply restaura controles e Editar análise:
    await expect(advisoryRow.getByRole('button', { name: 'Visualizar pendência', exact: true })).toHaveCount(0);
    await expect(advisoryRow.getByRole('button', { name: 'Editar análise', exact: true })).toBeVisible();
    await expect(advisoryRow.getByLabel(`Análise da consulta à Assessoria para a NF ${serviceNumber}`)).toHaveValue('Correto');

    // F5 + conferência direta no PostgreSQL:
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(page.locator('.service-advisory-row').filter({ hasText: `NF ${serviceNumber}` })
        .getByLabel(`Análise da consulta à Assessoria para a NF ${serviceNumber}`)).toHaveValue('Correto');
    const [persistedSvc] = await readInvoiceFromDb(page, serviceNumber);
    expect(persistedSvc.payload.analiseConsultaAssessoria).toBe('Correto');
    expect(await readPendenciesForInvoice(page, persistedSvc.id)).toHaveLength(0);
    const verifDb = await readVerificationFromDb(page);
    expect(verifDb.analysis.consAssessoria).toBe('Correto');

    // Segunda sessão autenticada (Assistente) confirma o estado persistido:
    const secondContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistantPage = await secondContext.newPage();
        await loginAs(assistantPage, 'federal_assistant');
        await openSchool(assistantPage, 'federal_assistant');
        const assistantAdvisory = assistantPage.locator('.service-advisory-row')
            .filter({ hasText: `NF ${serviceNumber}` });
        await expect(assistantAdvisory.getByLabel(`Análise da consulta à Assessoria para a NF ${serviceNumber}`))
            .toHaveValue('Correto');
        await expect(assistantAdvisory.getByRole('button', { name: 'Visualizar pendência', exact: true }))
            .toHaveCount(0);
    } finally {
        await secondContext.close();
    }

    expect(pageErrors).toEqual([]);
});

test('T3 exclusão de NF (delete_invoice) com Pendência preserva NF vizinha e bonificação após F5 e segunda sessão', async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const pageErrors = [];
    const nativeDialogs = [];
    const rpcActions = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', async dialog => {
        nativeDialogs.push(dialog.message());
        await dialog.dismiss();
    });
    page.on('request', request => {
        if (request.url().includes('/rest/v1/rpc/preview_operational_change')) rpcActions.push('preview');
        if (request.url().includes('/rest/v1/rpc/apply_operational_change')) rpcActions.push('apply');
    });

    const keepNumber = `OCC-KEEP-${Date.now()}`;
    const deleteNumber = `OCC-DEL-${Date.now()}`;

    await loginAs(page, 'controller');
    await openSchool(page, 'controller');
    const fiscalRow = page.locator(`tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"]`);

    await createInvoice(page, {
        type: 'consumo',
        number: keepNumber,
        description: 'Material de consumo preservado T3',
        amount: 210
    });
    const keepInvoiceRow = fiscalRow.locator('.invoice-document-row').filter({ hasText: keepNumber });
    await keepInvoiceRow.getByRole('combobox').selectOption('Correto');
    await settleWrites(page);

    await createInvoice(page, {
        type: 'consumo',
        number: deleteNumber,
        description: 'Material de consumo lançado por engano T3',
        amount: 330
    });
    const delInvoiceRow = fiscalRow.locator('.invoice-document-row').filter({ hasText: deleteNumber });
    await delInvoiceRow.getByRole('combobox').selectOption('Incorreto');
    const opening = page.locator('#modal-nova-pendencia');
    await expect(opening).toHaveClass(/show/);
    await opening.getByLabel('Documento ausente', { exact: true }).check();
    await opening.getByLabel('Observações / Detalhes', { exact: true }).fill('Pendência dependente para exclusão T3.');
    await opening.getByRole('button', { name: 'Criar Pendência', exact: true }).click();
    await expect(opening).not.toHaveClass(/show/);
    await settleWrites(page);
    await closePreviewDrawerIfOpen(page);

    const [delBeforeDb] = await readInvoiceFromDb(page, deleteNumber);
    expect(delBeforeDb).toBeTruthy();
    expect(await readPendenciesForInvoice(page, delBeforeDb.id)).toHaveLength(1);

    // Acionar exclusão integrada (sem confirm nativo):
    await page.getByRole('button', { name: `Excluir NF: ${deleteNumber}`, exact: true }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Excluir nota fiscal' });
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog.getByText(/1 nota fiscal/)).toBeVisible();
    await expect(deleteDialog.getByText(/1 Pendência/)).toBeVisible();
    await expect(deleteDialog.getByText('Incorreto → Correto')).toBeVisible();
    await expect(deleteDialog.getByText(/bonificação já consolidada será preservado/i)).toBeVisible();
    await expect(deleteDialog.getByRole('button', { name: 'Confirmar exclusão', exact: true })).toBeEnabled();
    await deleteDialog.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
    await expect(deleteDialog).toBeHidden();

    expect(nativeDialogs).toEqual([]);
    expect(rpcActions).toContain('preview');
    expect(rpcActions).toContain('apply');
    await expect(fiscalRow.locator('.invoice-document-row').filter({ hasText: deleteNumber })).toHaveCount(0);
    await expect(fiscalRow.locator('.invoice-document-row').filter({ hasText: keepNumber })).toBeVisible();

    // F5 + conferência direta no PostgreSQL (incluindo preservação ADR-055 de bonus_result):
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(fiscalRow.locator('.invoice-document-row').filter({ hasText: deleteNumber })).toHaveCount(0);
    await expect(fiscalRow.locator('.invoice-document-row').filter({ hasText: keepNumber })).toBeVisible();
    expect(await readInvoiceFromDb(page, deleteNumber)).toHaveLength(0);
    expect(await readPendenciesForInvoice(page, delBeforeDb.id)).toHaveLength(0);
    expect(await readInvoiceFromDb(page, keepNumber)).toHaveLength(1);
    const verifAfterDelete = await readVerificationFromDb(page);
    expect(verifAfterDelete.analysis.notaFiscal).toBe('Correto');
    expect(verifAfterDelete.bonus_result).toBe('apta');

    // Segunda sessão autenticada (Assistente) confirma NF excluída e NF vizinha preservada:
    const secondContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistantPage = await secondContext.newPage();
        await loginAs(assistantPage, 'federal_assistant');
        await openSchool(assistantPage, 'federal_assistant');
        const assistantFiscal = assistantPage.locator(`tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"]`);
        await expect(assistantFiscal.locator('.invoice-document-row').filter({ hasText: deleteNumber })).toHaveCount(0);
        await expect(assistantFiscal.locator('.invoice-document-row').filter({ hasText: keepNumber })).toBeVisible();
    } finally {
        await secondContext.close();
    }

    expect(pageErrors).toEqual([]);
});

test('RLS e perfil somente leitura (SME): sem controles de correção/exclusão na UI e RPC rejeitada com AUTHORIZATION_DENIED', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await loginAs(page, 'sme_management');
    await openSchool(page, 'sme_management');

    await expect(page.getByRole('button', { name: 'Editar análise', exact: true })).toHaveCount(0);
    await expect(page.locator('button[aria-label^="Excluir NF:"]')).toHaveCount(0);
    await expect(page.locator('.service-advisory-row .invoice-pendency-view-button')).toHaveCount(0);

    const rpcDenial = await page.evaluate(async ({ schoolId, competence, programId }) => {
        const { data, error } = await window.RadarSessionContext.service.client.rpc(
            'preview_operational_change',
            {
                p_request: {
                    contractVersion: 1,
                    action: 'correct_analysis',
                    target: {
                        kind: 'analysis',
                        schoolId,
                        competence,
                        programId,
                        documentKey: 'extCC'
                    },
                    changes: { analysis: 'Correto' }
                }
            }
        );
        return {
            data,
            errorMessage: error?.message || null
        };
    }, { schoolId: SCHOOL_ID, competence: COMPETENCE, programId: PROGRAM_ID });

    expect(rpcDenial.data).toBeNull();
    expect(rpcDenial.errorMessage).toMatch(/AUTHORIZATION_DENIED/);
    expect(pageErrors).toEqual([]);
});

test('T3 devolve a saída do Qualidade ao painel e permite nova identificação pela Assistente', async ({ page, browser }, testInfo) => {
    test.setTimeout(90000);
    const schoolId = 'ESC-QUALITY';
    const reference = `QUAL-T3-${Date.now()}`;
    const nextNumber = `${reference}-R`;
    const impact = 'A saída provisória do PDDE Qualidade voltará para “Programa a identificar” e poderá ser identificada novamente.';
    const panel = currentPage => currentPage.getByRole('region', { name: 'Saídas sem ação definida' });
    const card = currentPage => panel(currentPage).getByRole('article').filter({ hasText: reference });

    async function identify(currentPage, number) {
        const movement = card(currentPage);
        await expect(movement.getByText('Programa a identificar', { exact: true })).toBeVisible();
        await movement.getByRole('combobox').selectOption('CONECTADA');
        await movement.getByRole('button', { name: 'Identificar despesa', exact: true }).click();
        const form = currentPage.locator('#modal-dados-nota');
        await form.getByLabel('Tipo de Gasto', { exact: true }).selectOption('consumo');
        await form.locator('#nota-numero').fill(number);
        await form.getByRole('button', { name: 'Identificar despesa', exact: true }).click();
        await expect(form).not.toHaveClass(/show/);
        await expect(movement.getByText('Identificada', { exact: true })).toBeVisible();
    }

    async function readLink(currentPage) {
        return currentPage.evaluate(async ({ schoolId, competence, reference, nextNumber }) => {
            const db = window.RadarSessionContext.service.client;
            const movement = await db.from('quality_provisional_movements')
                .select('id,status,registered_invoice_id,identification_operation_key')
                .eq('school_id', schoolId).eq('competence_id', competence).eq('document_reference', reference).single();
            if (movement.error) throw new Error(movement.error.message);
            const invoices = await db.from('registered_invoices').select('id,invoice_number,program_id')
                .eq('school_id', schoolId).eq('competence_id', competence).in('invoice_number', [reference, nextNumber]);
            if (invoices.error) throw new Error(invoices.error.message);
            return { movement: movement.data, invoices: invoices.data };
        }, { schoolId, competence: COMPETENCE, reference, nextNumber });
    }

    await loginAs(page, 'controller');
    await openSchool(page, 'controller', schoolId);
    await panel(page).getByRole('button', { name: 'Registrar saída', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Registrar saída sem programa definido' });
    await editor.getByLabel('Referência (opcional)', { exact: true }).fill(reference);
    await editor.getByLabel('Descrição (opcional)', { exact: true }).fill('Materiais para atividades escolares');
    await editor.getByLabel('Valor em R$ (opcional)', { exact: true }).fill('42.50');
    await editor.getByRole('button', { name: 'Salvar movimentação', exact: true }).click();
    await identify(page, reference);
    const first = await readLink(page);
    expect(first.invoices).toEqual([{ id: first.movement.registered_invoice_id, invoice_number: reference, program_id: 'CONECTADA' }]);
    expect(first.movement.identification_operation_key).toBeTruthy();

    await page.getByRole('button', { name: `Excluir NF: ${reference}`, exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Excluir nota fiscal' });
    await expect(confirmation.getByText(impact, { exact: true })).toBeVisible();
    await testInfo.attach('qualidade-previa-exclusao', { body: await confirmation.screenshot(), contentType: 'image/png' });
    await confirmation.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
    await expect(confirmation).toBeHidden();
    const identifyButton = { name: 'Identificar despesa', exact: true };
    await expect(card(page).getByRole('button', identifyButton)).toBeVisible();
    await expect(page.locator('.invoice-document-row').filter({ hasText: reference })).toHaveCount(0);
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(card(page).getByRole('button', identifyButton)).toBeVisible();
    const reopened = { id: first.movement.id, status: 'open', registered_invoice_id: null, identification_operation_key: null };
    expect(await readLink(page)).toEqual({ movement: reopened, invoices: [] });

    const secondContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistantPage = await secondContext.newPage();
        await loginAs(assistantPage, 'federal_assistant');
        await openSchool(assistantPage, 'federal_assistant', schoolId);
        await expect(card(assistantPage).getByRole('button', identifyButton)).toBeVisible();
        await testInfo.attach('qualidade-saida-reaberta', { body: await card(assistantPage).screenshot(), contentType: 'image/png' });
        await identify(assistantPage, nextNumber);
        const final = await readLink(assistantPage);
        expect(final.movement).toMatchObject({ id: first.movement.id, status: 'identified' });
        expect(final.movement.identification_operation_key).toBeTruthy();
        expect(final.movement.identification_operation_key).not.toBe(first.movement.identification_operation_key);
        expect(final.movement.registered_invoice_id).not.toBe(first.movement.registered_invoice_id);
        expect(final.invoices).toEqual([{ id: final.movement.registered_invoice_id, invoice_number: nextNumber, program_id: 'CONECTADA' }]);
    } finally {
        await secondContext.close();
    }
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(card(page).getByText('Identificada', { exact: true })).toBeVisible();
    await expect(page.locator('.invoice-document-row').filter({ hasText: nextNumber })).toBeVisible();
});

test('T1/T2 preserva a NF retificada e seu histórico ao excluir somente a Pendência pela fila', async ({ page, browser }, testInfo) => {
    test.setTimeout(90000);
    const number = `T2-FILA-${Date.now()}`;
    const revised = `${number}-R`;
    await loginAs(page, 'controller');
    await openSchool(page, 'controller');
    const before = await readVerificationFromDb(page);
    await createInvoice(page, { type: 'consumo', number, description: 'Material de sala', amount: 85 });
    const [invoice] = await readInvoiceFromDb(page, number);
    const rowFor = currentPage => currentPage.locator(`.invoice-document-row[data-invoice-id="${invoice.id}"]`);
    const controllerRow = rowFor(page);
    await controllerRow.getByRole('combobox').selectOption('Incorreto');
    const opening = page.locator('#modal-nova-pendencia');
    await opening.getByLabel('Documento ausente', { exact: true }).check();
    await opening.getByLabel('Observações / Detalhes', { exact: true }).fill('Conferir o documento fiscal.');
    await opening.getByRole('button', { name: 'Criar Pendência', exact: true }).click();
    await expect(opening).not.toHaveClass(/show/);
    await settleWrites(page);
    await closePreviewDrawerIfOpen(page);
    const [original] = await readPendenciesForInvoice(page, invoice.id);
    expect(original).toMatchObject({ status: 'Aberta', payload: { documentSnapshot: { numero: number } } });

    await controllerRow.getByRole('button', { name: /Editar lançamento/ }).click();
    const form = page.locator('#modal-dados-nota');
    await form.locator('#nota-numero').fill(revised);
    await form.locator('#nota-desc').fill('Material de sala conferido');
    await form.locator('button[type="submit"]').click();
    await expect(form).not.toHaveClass(/show/);
    await expect(controllerRow).toContainText(revised);
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(controllerRow).toContainText(revised);
    const [stillOpen] = await readPendenciesForInvoice(page, invoice.id);
    expect(stillOpen).toMatchObject({ id: original.id, status: 'Aberta', payload: { documentSnapshot: original.payload.documentSnapshot } });

    const secondContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistantPage = await secondContext.newPage();
        await loginAs(assistantPage, 'federal_assistant');
        await assistantPage.locator('#nav-pendencias').click();
        const search = assistantPage.getByRole('searchbox', { name: 'Buscar pendências' });
        await search.fill(revised);
        const queueRow = assistantPage.getByRole('row').filter({ hasText: revised });
        await expect(queueRow).toContainText('Material de sala conferido');
        await queueRow.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
        const drawer = assistantPage.locator('#pendency-detail-drawer');
        await expect(drawer).toContainText(revised);
        await drawer.getByRole('button', { name: 'Excluir pendência', exact: true }).click();
        const confirmation = assistantPage.getByRole('dialog', { name: 'Excluir pendência' });
        await expect(confirmation.getByText(/1 Pendência/)).toBeVisible();
        await testInfo.attach('fila-previa-excluir-pendencia', { body: await confirmation.screenshot(), contentType: 'image/png' });
        await confirmation.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
        await expect(confirmation).toBeHidden();
        await expect(search).toBeVisible();
        await expect(search).toHaveValue(revised);
        await expect(queueRow).toHaveCount(0);
        expect(await readPendenciesForInvoice(assistantPage, invoice.id)).toHaveLength(0);
    } finally {
        await secondContext.close();
    }

    await page.reload();
    await waitForApp(page, 'controller');
    await expect(controllerRow.getByRole('combobox')).toHaveValue('Não analisado');
    const [preserved] = await readInvoiceFromDb(page, revised);
    expect(preserved).toMatchObject({ id: invoice.id, payload: { analiseDocumentoFiscal: 'Não analisado' } });
    expect((await readVerificationFromDb(page)).bonus_result).toBe(before.bonus_result);
});
