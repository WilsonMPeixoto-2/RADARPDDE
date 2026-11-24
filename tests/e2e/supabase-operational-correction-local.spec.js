'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const ExcelJS = require('exceljs');

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

// A ordem da pilha é preservada; só a jornada que falhou é repetida.
test.describe.configure({ mode: 'default' });

async function loginAs(page, profileId) {
    const account = fixtures.find(item => item.profileId === profileId && item.active);
    if (!account) throw new Error(`Fixture Auth não encontrada para ${profileId}.`);
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(fixturePassword);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await waitForApp(page, profileId);
    if (['controller', 'federal_assistant'].includes(profileId)) await selectCompetence(page, COMPETENCE);
}

async function selectCompetence(page, key) {
    const month = page.locator('#global-competence-select');
    await month.selectOption(key);
    await expect(month).toHaveValue(key);
    await expect(month).toBeEnabled();
    await page.waitForFunction(expected => window.RadarApplicationServices.data.currentOperationalCompetence === expected, key);
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

async function exportSmeSchoolRow(assistantPage, schoolId) {
    await assistantPage.goto('/dashboard');
    await waitForApp(assistantPage, 'federal_assistant');
    const designation = await assistantPage.evaluate(async id => {
        const result = await window.RadarSessionContext.service.client.from('schools')
            .select('designation').eq('id', id).single();
        if (result.error) throw new Error(result.error.message);
        return result.data.designation;
    }, schoolId);
    const button = assistantPage.locator('[data-radar-assistant-export="sme"]');
    await expect(button).toHaveAttribute('data-radar-competence-key', COMPETENCE);
    const downloadEvent = assistantPage.waitForEvent('download');
    await button.click();
    const download = await downloadEvent;
    expect(await download.failure()).toBeNull();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(await download.path());
    const sheet = workbook.getWorksheet('MAIO');
    expect(sheet).toBeTruthy();
    const normalize = value => String(value).replace(/\D/g, '');
    const rows = sheet.getRows(2, sheet.rowCount - 1).filter(row =>
        normalize(row.getCell(3).text) === normalize(designation));
    expect(rows).toHaveLength(1);
    const row = rows[0];
    return { extrato: row.getCell('E').text, notasFiscais: row.getCell('G').text, status: row.getCell('W').text };
}

// Verifica o arquivo XLSX realmente baixado no fluxo autenticado do Assistente.
// A planilha só apresenta resultados consolidados atuais (uma linha por programa).
async function exportInstitutionalSchoolResults(assistantPage, schoolId, testInfo, artifactSuffix) {
    await assistantPage.goto('/dashboard');
    await waitForApp(assistantPage, 'federal_assistant');
    const designation = await assistantPage.evaluate(async id => {
        const result = await window.RadarSessionContext.service.client.from('schools')
            .select('designation').eq('id', id).single();
        if (result.error) throw new Error(result.error.message);
        return result.data.designation;
    }, schoolId);
    const button = assistantPage.locator('[data-radar-assistant-export="institutional"]');
    await expect(button).toBeVisible();
    const downloadPromise = assistantPage.waitForEvent('download');
    await button.click();
    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/^RADAR_PDDE_BONIFICACOES_05-2026\.xlsx$/);
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(downloadedPath);
    expect(workbook.worksheets.map(sheet => sheet.name)).toEqual([
        'BONIFICACOES', 'SINTESE', 'QUALIDADE_DADOS', 'METADADOS'
    ]);
    const sheet = workbook.getWorksheet('BONIFICACOES');
    const normalize = value => String(value || '').replace(/\D/g, '');
    const rows = (sheet.getRows(9, Math.max(1, sheet.rowCount - 8)) || [])
        .filter(row => normalize(row.getCell(3).text) === normalize(designation))
        .map(row => ({ program: row.getCell(5).text, status: row.getCell(12).text }));
    await testInfo.attach(`t4-excel-${artifactSuffix}`, {
        path: downloadedPath,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    return rows;
}

async function createInvoice(page, { type, number, description, amount, programId = PROGRAM_ID }) {
    const fiscalRow = page.locator(`tr[data-program-id="${programId}"][data-document-key="notaFiscal"]`);
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

    await page.getByRole('tab', { name: 'Registros Internos', exact: true }).click();
    const history = page.locator('#tab-auditoria tbody tr').filter({ hasText: 'Extrato Conta Corrente' });
    const corrected = history.filter({ hasText: 'Análise técnica corrigida' });
    const cleared = history.filter({ hasText: 'Análise técnica limpa' });
    await expect(corrected).toHaveCount(1);
    await expect(corrected).toContainText('Correto → Correto (Atrasado)');
    await expect(cleared).toHaveCount(1);
    await expect(cleared).toContainText('Correto (Atrasado) → Não analisado');
    await testInfo.attach('historico-da-correcao', { body: await page.locator('#tab-auditoria').screenshot(), contentType: 'image/png' });
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
    const advisoryTransition = retifyDialog.locator('.correction-effect-transition').filter({
        has: retifyDialog.getByText('Consulta à Assessoria da nota fiscal / Resumo da Assessoria do programa', { exact: true })
    });
    await expect(advisoryTransition).toHaveCount(1);
    await expect(advisoryTransition.locator('.correction-effect-label')).toHaveText(
        'Consulta à Assessoria da nota fiscal / Resumo da Assessoria do programa');
    await expect(advisoryTransition.locator('strong')).toHaveText('Correto → Correto (Atrasado)');
    await expect(advisoryTransition).toBeVisible();
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

    // Uma tentativa interrompida pode deixar a própria NF incorreta no banco
    // descartável. Não permitir que esse resíduo altere a prévia do retry.
    // O escopo é somente o par de NFs sintéticas criado por esta jornada.
    if (testInfo.retry) {
        execFileSync('psql', ['postgresql://postgres:postgres@127.0.0.1:54322/postgres',
            '-X', '-1', '-v', 'ON_ERROR_STOP=1', '-c', `
                create temp table t3_retry_invoices on commit drop as
                select id from public.registered_invoices
                 where school_id = 'ESC-OTHER' and competence_id = '2026-05'
                   and program_id = 'BASIC' and expense_type = 'consumo'
                   and (invoice_number ~ '^OCC-KEEP-[0-9]+$'
                        or invoice_number ~ '^OCC-DEL-[0-9]+$');
                delete from public.pendency_contacts
                 where pendency_id in (select id from public.pendencies
                    where registered_invoice_id in (select id from t3_retry_invoices));
                delete from public.pendencies
                 where registered_invoice_id in (select id from t3_retry_invoices);
                delete from public.registered_invoices
                 where id in (select id from t3_retry_invoices);
            `]);
    }
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

    let beforeExport;
    const beforeExportContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistant = await beforeExportContext.newPage();
        await loginAs(assistant, 'federal_assistant');
        beforeExport = await exportSmeSchoolRow(assistant, SCHOOL_ID);
        expect(beforeExport).toMatchObject({ extrato: 'SIM', notasFiscais: 'SIM' });
    } finally {
        await beforeExportContext.close();
    }

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
        const afterExport = await exportSmeSchoolRow(assistantPage, SCHOOL_ID);
        expect(afterExport).toEqual(beforeExport);
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
    const lateContact = `Contato posterior à prévia ${number}`;
    async function readLateContact(currentPage) {
        return currentPage.evaluate(async ({ school, description }) => {
            const result = await window.RadarSessionContext.service.client.from('pendency_contacts')
                .select('id, pendency_id').eq('school_id', school).eq('description', description);
            if (result.error) throw new Error(result.error.message);
            return result.data;
        }, { school: SCHOOL_ID, description: lateContact });
    }
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
        const globalSearch = assistantPage.locator('#global-search');
        const globalResults = assistantPage.getByRole('listbox', { name: 'Resultados da busca global' });
        const globalEntry = globalResults.getByRole('option').filter({ hasText: revised });
        await globalSearch.fill(revised);
        await expect(globalEntry).toContainText('Material de sala conferido');
        await globalSearch.press('Escape');
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
        const confirm = confirmation.getByRole('button', { name: 'Confirmar exclusão', exact: true });
        await expect(confirm).toBeEnabled();
        await expect(confirmation.getByText(/1 contato registrado/)).toHaveCount(0);

        // Enquanto a Assistente lê a prévia, o Controlador registra um contato pela rota normal.
        await page.getByRole('button', { name: 'Registrar contato', exact: true }).click();
        const contact = page.locator('#modal-contato');
        await contact.getByLabel('Tipo de Contato', { exact: true }).selectOption('WhatsApp');
        await contact.getByLabel('Vincular a uma Pendência (Opcional)', { exact: true }).selectOption(original.id);
        await contact.getByLabel('Descrição do Atendimento', { exact: true }).fill(lateContact);
        await contact.getByRole('button', { name: 'Registrar', exact: true }).click();
        await expect(contact).not.toHaveClass(/show/);
        const linked = await readLateContact(page);
        expect(linked).toHaveLength(1);
        expect(linked[0].pendency_id).toBe(original.id);

        await confirm.click();
        await expect(confirmation.getByRole('alert')).toContainText('Os dados mudaram');
        await expect(confirm).toBeDisabled();
        expect(await readLateContact(assistantPage)).toEqual(linked);
        expect(await readPendenciesForInvoice(assistantPage, invoice.id)).toHaveLength(1);

        await confirmation.getByRole('button', { name: 'Revisar prévia' }).click();
        await expect(confirmation.getByText(/1 contato registrado/)).toBeVisible();
        await testInfo.attach('fila-previa-excluir-pendencia', { body: await confirmation.screenshot(), contentType: 'image/png' });
        await confirm.click();
        await expect(confirmation).toBeHidden();
        await expect(search).toBeVisible();
        await expect(search).toHaveValue(revised);
        await expect(queueRow).toHaveCount(0);
        expect(await readPendenciesForInvoice(assistantPage, invoice.id)).toHaveLength(0);
        expect(await readLateContact(assistantPage)).toHaveLength(0);
        await globalSearch.fill('');
        await globalSearch.fill(revised);
        await expect(globalResults).toBeVisible();
        await expect(globalEntry).toHaveCount(0);
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

test('T3 retira o bem exclusivo inventariado do Capital e do Inventário e conserva a aquisição vizinha', async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const schoolId = 'ESC-LOCAL';
    const stamp = Date.now();
    const target = `INV-ALVO-${stamp}`;
    const neighbor = `INV-VIZINHA-${stamp}`;
    const capital = page.getByRole('tabpanel', { name: 'Registro de Capital' });
    const capitalTab = page.getByRole('tab', { name: 'Registro de Capital', exact: true });
    async function records(currentPage, number) {
        return currentPage.evaluate(async ({ schoolId, number }) => {
            const db = window.RadarSessionContext.service.client;
            const invoices = await db.from('registered_invoices').select('id, linked_asset_id, amount')
                .eq('school_id', schoolId).eq('invoice_number', number);
            const assets = await db.from('assets').select('id, status, inventory_process, amount')
                .eq('school_id', schoolId).eq('invoice_number', number);
            if (invoices.error || assets.error) throw new Error((invoices.error || assets.error).message);
            return { invoices: invoices.data, assets: assets.data };
        }, { schoolId, number });
    }

    await loginAs(page, 'controller');
    await openSchool(page, 'controller', schoolId);
    const capitalRow = number => capital.getByRole('row').filter({
        has: page.locator(`input[value="${number}"]`)
    });
    await createInvoice(page, { type: 'permanente', number: target, description: 'Projetor da sala de leitura', amount: 900 });
    await createInvoice(page, { type: 'permanente', number: neighbor, description: 'Armário da biblioteca', amount: 440 });
    await capitalTab.click();
    await expect(capitalRow(target)).toContainText('Projetor da sala de leitura');
    await expect(capitalRow(neighbor)).toContainText('Armário da biblioteca');
    const survivor = await records(page, neighbor);
    expect(survivor.assets).toHaveLength(1);
    expect(survivor.invoices).toEqual([{ id: expect.any(String), linked_asset_id: survivor.assets[0].id, amount: 440 }]);

    const inventoryContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const inventory = await inventoryContext.newPage();
        await loginAs(inventory, 'inventory');
        await inventory.locator('#nav-inventario').click();
        const row = number => inventory.getByRole('row').filter({ hasText: number });
        await expect(row(neighbor)).toBeVisible();
        await row(target).getByRole('button', { name: 'Marcar como Inventariado', exact: true }).click();
        const form = inventory.locator('#modal-inventario-confirm');
        await form.locator('#inventario-observacoes').fill('Conferência do bem de teste.');
        await form.getByRole('button', { name: 'Confirmar Inventariação', exact: true }).click();
        await expect(form).not.toHaveClass(/show/);
        const terminal = await records(page, target);
        expect(terminal.assets).toMatchObject([{ id: terminal.invoices[0].linked_asset_id, status: 'Inventariada' }]);

        await openSchool(page, 'controller', schoolId);
        await page.getByRole('button', { name: `Excluir NF: ${target}`, exact: true }).click();
        const preview = page.getByRole('dialog', { name: 'Excluir nota fiscal' });
        await expect(preview.getByText(/1 bem patrimonial/)).toBeVisible();
        await expect(preview.getByText(/já está Inventariado e também será excluído/)).toBeVisible();
        await testInfo.attach('inventario-previa-exclusao-causal', { body: await preview.screenshot(), contentType: 'image/png' });
        await preview.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
        await expect(preview).toBeHidden();
        await page.reload();
        await waitForApp(page, 'controller');
        await capitalTab.click();
        await expect(capitalRow(target)).toHaveCount(0);
        await expect(capitalRow(neighbor)).toContainText('Armário da biblioteca');
        expect(await records(page, target)).toEqual({ invoices: [], assets: [] });
        expect(await records(page, neighbor)).toEqual(survivor);

        await inventory.reload();
        await waitForApp(inventory, 'inventory');
        await expect(row(neighbor)).toBeVisible();
        await expect(row(target)).toHaveCount(0);
    } finally {
        await inventoryContext.close();
    }
});

test('T3 atualiza a escola no Dashboard, na Carteira e no Passivo de junho após a exclusão da NF de maio', async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const school = 'ESC-QUALITY';
    const schoolName = 'Escola da Conta PDDE Qualidade';
    const number = `CONSUMIDORES-${Date.now()}`;
    const observerContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const observer = await observerContext.newPage();
        await loginAs(page, 'federal_assistant');
        await openSchool(page, 'federal_assistant', school);
        await createInvoice(page, { type: 'consumo', programId: 'CONECTADA', number, description: 'Tinta para a sala de leitura', amount: 72 });
        const invoiceRow = page.locator('.invoice-document-row').filter({ hasText: number });
        await invoiceRow.getByRole('combobox').selectOption('Incorreto');
        const form = page.locator('#modal-nova-pendencia');
        await form.getByLabel('Documento ausente', { exact: true }).check();
        await form.getByLabel('Observações / Detalhes', { exact: true }).fill('Conferir a nota da aquisição.');
        await form.getByRole('button', { name: 'Criar Pendência', exact: true }).click();
        await expect(form).not.toHaveClass(/show/);
        await settleWrites(page);
        await closePreviewDrawerIfOpen(page);

        await loginAs(observer, 'controller');
        const wallet = observer.getByRole('row').filter({ hasText: schoolName });
        const passivo = observer.locator('#passivo-competencias-list');
        const passivoRow = passivo.getByRole('row').filter({ hasText: schoolName });
        const dashboardCard = observer.getByRole('button', { name: /Pendências abertas/ }).locator('.stat-value');
        await observer.locator('#nav-dashboard').click();
        await expect(dashboardCard).toHaveText(/^[0-9]+ Escolas?$/);
        const openSchoolCount = Number.parseInt(await dashboardCard.textContent(), 10);
        expect(openSchoolCount).toBeGreaterThan(0);
        await observer.locator('#nav-escolas').click();
        await expect(wallet).toContainText('1 ativa(s)');
        await observer.locator('#nav-competencias').click();
        await selectCompetence(observer, '2026-06');
        await expect(passivoRow).toContainText(number);
        await expect(passivoRow).toContainText('Aberta');

        await invoiceRow.getByRole('button', { name: `Excluir NF: ${number}`, exact: true }).click();
        const preview = page.getByRole('dialog', { name: 'Excluir nota fiscal' });
        await expect(preview.getByText(/1 Pendência/)).toBeVisible();
        await preview.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
        await expect(preview).toBeHidden();
        await expect(invoiceRow).toHaveCount(0);

        await observer.reload();
        await waitForApp(observer, 'controller');
        await selectCompetence(observer, '2026-06');
        await expect(passivo).toBeVisible();
        await expect(passivoRow).toHaveCount(0);
        await selectCompetence(observer, COMPETENCE);
        await observer.locator('#nav-escolas').click();
        await expect(wallet).toContainText('Sem pendência ativa');
        await observer.locator('#nav-dashboard').click();
        const remaining = openSchoolCount - 1;
        await expect(dashboardCard).toHaveText(`${remaining} ${remaining === 1 ? 'Escola' : 'Escolas'}`);
    } finally {
        await observerContext.close();
    }
});

test('G3 compatibilidade: cliente sem flag convive com schema atualizado e RPC rejeita prévia obsoleta', async ({ page, browser }, testInfo) => {
    test.setTimeout(90000);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const legacyNumber = `OCC-LEG-${Date.now()}`;
    const legacyContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        await legacyContext.route('**/config.runtime.js', async route => {
            const response = await route.fetch();
            const source = await response.text();
            const patched = source.replace(/"operationalCorrectionPilot"\s*:\s*true/g, '"operationalCorrectionPilot": false');
            await route.fulfill({ response, body: patched });
        });
        const legacyPage = await legacyContext.newPage();
        const legacyRpcCalls = [];
        legacyPage.on('request', request => {
            if (request.url().includes('/rest/v1/rpc/preview_operational_change')
                || request.url().includes('/rest/v1/rpc/apply_operational_change')) {
                legacyRpcCalls.push(request.url());
            }
        });

        await loginAs(legacyPage, 'controller');
        const legacyFlags = await legacyPage.evaluate(() => ({
            previewFlag: window.RADAR_OPERATIONAL_CORRECTION_PREVIEW === true,
            canUseDialog: window.RadarOperationalCorrectionDialog?.canUse?.(window) === true
        }));
        expect(legacyFlags).toEqual({ previewFlag: false, canUseDialog: false });

        await openSchool(legacyPage, 'controller');
        await createInvoice(legacyPage, {
            type: 'consumo',
            number: legacyNumber,
            description: 'Despesa criada por cliente legado sem flag',
            amount: 145
        });
        const legacyFiscalRow = legacyPage.locator(`tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"]`);
        await legacyFiscalRow.locator('.invoice-document-row').filter({ hasText: legacyNumber })
            .getByRole('combobox').selectOption('Correto');
        await settleWrites(legacyPage);
        await legacyPage.reload();
        await waitForApp(legacyPage, 'controller');
        await selectCompetence(legacyPage, COMPETENCE);
        await expect(
            legacyFiscalRow.locator('.invoice-document-row')
                .filter({ hasText: legacyNumber })
                .locator('.invoice-document-status')
        ).toHaveText('Correto');
        expect(legacyRpcCalls).toEqual([]);

        // Cliente novo gera prévia; cliente legado altera a mesma NF; apply obsoleto deve falhar atomicamente.
        await loginAs(page, 'controller');
        const [targetInvoice] = await readInvoiceFromDb(page, legacyNumber);
        expect(targetInvoice).toBeTruthy();

        const previewPlan = await page.evaluate(async ({ schoolId, competence, programId, invoiceId }) => {
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
                            documentKey: 'notaFiscal',
                            id: invoiceId
                        },
                        changes: { analysis: 'Correto (Atrasado)' }
                    }
                }
            );
            if (error) throw new Error(error.message);
            return data;
        }, { schoolId: SCHOOL_ID, competence: COMPETENCE, programId: PROGRAM_ID, invoiceId: targetInvoice.id });
        expect(previewPlan?.planDigest).toMatch(/^[0-9a-f]{64}$/);

        // Cliente legado muta a mesma NF antes do apply da sessão nova:
        await legacyPage.evaluate(async invoiceId => {
            const { error } = await window.RadarSessionContext.service.client
                .from('registered_invoices')
                .update({ description: 'Atualizada por cliente legado durante prévia' })
                .eq('id', invoiceId);
            if (error) throw new Error(error.message);
        }, targetInvoice.id);

        const staleApply = await page.evaluate(async ({ schoolId, competence, programId, invoiceId, planDigest }) => {
            const { data, error } = await window.RadarSessionContext.service.client.rpc(
                'apply_operational_change',
                {
                    p_request: {
                        contractVersion: 1,
                        action: 'correct_analysis',
                        target: {
                            kind: 'analysis',
                            schoolId,
                            competence,
                            programId,
                            documentKey: 'notaFiscal',
                            id: invoiceId
                        },
                        changes: { analysis: 'Correto (Atrasado)' }
                    },
                    p_plan_digest: planDigest,
                    p_operation_key: crypto.randomUUID()
                }
            );
            return { data, errorMessage: error?.message || null };
        }, {
            schoolId: SCHOOL_ID,
            competence: COMPETENCE,
            programId: PROGRAM_ID,
            invoiceId: targetInvoice.id,
            planDigest: previewPlan.planDigest
        });
        expect(staleApply.data).toBeNull();
        expect(staleApply.errorMessage).toMatch(/STALE_PLAN|OPTIMISTIC_CONFLICT/);

        const persisted = await page.evaluate(async invoiceId => {
            const { data, error } = await window.RadarSessionContext.service.client
                .from('registered_invoices')
                .select('description, payload')
                .eq('id', invoiceId)
                .single();
            if (error) throw new Error(error.message);
            return data;
        }, targetInvoice.id);
        expect(persisted.description).toBe('Atualizada por cliente legado durante prévia');
        expect(persisted.payload.analiseDocumentoFiscal).toBe('Correto');
    } finally {
        await legacyContext.close();
    }

    expect(pageErrors).toEqual([]);
});

test('T2 mantém o resumo antigo na nota única e permite a primeira análise de cada nota quando há duas', async ({ page }, testInfo) => {
    // O Playwright reutiliza o banco local na repetição. Restaurar a mesma massa de junho.
    execFileSync('psql', ['postgresql://postgres:postgres@127.0.0.1:54322/postgres',
        '-X', '-1', '-v', 'ON_ERROR_STOP=1', '-c', `
            update public.registered_invoices set payload = '{}'
             where school_id = 'ESC-OCC-LEGACY' and competence_id = '2026-06'
               and id in ('OCC-LEG-JUN-A','OCC-LEG-JUN-B') and payload <> '{}';
            update public.verifications set analysis = '{"notaFiscal":"Correto"}'
             where id = 'ESC-OCC-LEGACY::2026-06::BASIC' and analysis <> '{"notaFiscal":"Correto"}';
        `]);
    await loginAs(page, 'controller');
    await openSchool(page, 'controller', 'ESC-OCC-LEGACY');
    const may = page.locator('.invoice-document-row[data-invoice-id="OCC-LEG-MAI"]');
    await may.getByRole('button', { name: 'Editar análise', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Corrigir análise técnica' });
    await dialog.getByRole('button', { name: 'Limpar análise', exact: true }).click();
    await expect(dialog.getByText('Correto → Não analisado')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Confirmar correção' })).toBeEnabled();
    await testInfo.attach('previa-da-unica-nota-antiga', { body: await dialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();

    await selectCompetence(page, '2026-06');
    const first = page.locator('.invoice-document-row[data-invoice-id="OCC-LEG-JUN-A"]');
    const second = page.locator('.invoice-document-row[data-invoice-id="OCC-LEG-JUN-B"]');
    await expect(first.getByRole('combobox')).toHaveValue('Não analisado');
    await expect(second.getByRole('combobox')).toHaveValue('Não analisado');
    await first.getByRole('combobox').selectOption('Correto (Atrasado)');
    await settleWrites(page);
    await expect(dialog).toHaveCount(0);
    await expect(first.locator('.invoice-document-status')).toHaveText('Correto (Atrasado)');
    await page.reload();
    await waitForApp(page, 'controller');
    await selectCompetence(page, '2026-06');
    await expect(first.locator('.invoice-document-status')).toHaveText('Correto (Atrasado)');
    await expect(second.getByRole('combobox')).toHaveValue('Não analisado');
});

test('T4 · corrigir bonificação fiscal, preservar notas e consolidar o programa', async ({ page, browser }, testInfo) => {
    // Jornada integrada: duas sessões autenticadas, exportação e capturas em dois temas.
    // O timeout padrão de 30 s interrompia a captura escura antes de testar a consolidação.
    test.setTimeout(90_000);
    const school = 'ESC-T4-BONUS';
    if (testInfo.retry) {
        execFileSync('psql', ['postgresql://postgres:postgres@127.0.0.1:54322/postgres',
            '-X', '-1', '-v', 'ON_ERROR_STOP=1', '-c', `
                update public.verifications
                   set bonification = jsonb_set(bonification, '{notaFiscal}', '"Sim"'), bonus_result = 'apta'
                 where id = 'ESC-T4-BONUS::2026-05::BASIC';
            `]);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, 'controller');
    await openSchool(page, 'controller', school);
    const header = page.locator('[data-program-header="BASIC"]');
    const neighbor = page.locator('[data-program-header="CONECTADA"]');
    const fiscal = page.locator('tr[data-program-id="BASIC"][data-document-key="notaFiscal"] [data-invoice-document-panel]');
    const edit = fiscal.getByRole('button', { name: 'Corrigir consolidação' });
    const dialog = page.getByRole('dialog', { name: 'Corrigir consolidação da bonificação' });
    const confirm = dialog.getByRole('button', { name: 'Confirmar correção' });
    const choice = dialog.getByLabel('Nova avaliação — Notas Fiscais');

    await edit.click();
    await expect(dialog).toContainText('Escola Horizonte');
    await expect(dialog.getByText('Nesta etapa, você pode corrigir apenas a avaliação de Notas Fiscais.')).toBeVisible();
    await expect(dialog).toContainText('Alterações pendentes de consolidação');
    await expect(dialog).toContainText('Consolidar bonificação');
    await expect(dialog.getByText('Avaliação atual: Sim')).toBeVisible();
    await expect(confirm).toBeDisabled();
    await choice.selectOption('Não se aplica');
    await expect(dialog.getByText('As notas fiscais, as análises individuais e as pendências serão preservadas.')).toBeVisible();
    await expect(confirm).toBeEnabled();
    await testInfo.attach('t4-previa-clara', { body: await dialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.evaluate(() => document.body.classList.add('dark-theme'));
    await testInfo.attach('t4-previa-escura', { body: await dialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.evaluate(() => document.body.classList.remove('dark-theme'));
    await confirm.click();
    await expect(header.getByText('Alterações pendentes de consolidação')).toBeVisible();
    await expect(fiscal.locator('.fiscal-bonus-control strong')).toHaveText('Não se aplica');
    await expect(fiscal.locator('.invoice-document-row')).toHaveCount(2);
    await expect(neighbor.getByRole('button', { name: 'Consolidada' })).toBeDisabled();
    await testInfo.attach('t4-notas-preservadas', { body: await fiscal.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    // O cabeçalho da unidade é fixo. Centralizar a linha preserva o contexto
    // do programa na captura e aproxima a janela da leitura real do operador.
    await header.evaluate(row => row.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await testInfo.attach('t4-prontuario', { body: await page.screenshot(), contentType: 'image/png' });
    await testInfo.attach('t4-programa-pendente', { body: await header.screenshot({ animations: 'disabled' }), contentType: 'image/png' });

    const session = await browser.newContext();
    try {
        const other = await session.newPage();
        await loginAs(other, 'federal_assistant');
        await openSchool(other, 'federal_assistant', school);
        await expect(other.locator('[data-program-header="BASIC"]')).toContainText('Alterações pendentes de consolidação');
        await expect(other.locator('.invoice-document-row[data-invoice-id="T4-NF1"]')).toBeVisible();
        await expect(other.locator('.invoice-document-row[data-invoice-id="T4-NF2"]')).toBeVisible();
        const pendingResults = await exportInstitutionalSchoolResults(other, school, testInfo, 'pendente');
        expect(pendingResults.some(row => /Básico/i.test(row.program))).toBe(false);
        expect(pendingResults.filter(row => /Conectada/i.test(row.program))).toEqual([
            { program: 'Educação Conectada', status: 'APTA' }
        ]);
    } finally {
        await session.close();
    }

    await page.reload();
    await waitForApp(page, 'controller');
    await edit.click();
    await choice.selectOption('Limpar resposta');
    await confirm.click();
    const consolidate = header.getByRole('button', { name: 'Consolidar bonificação', exact: true });
    await expect(header).toContainText('Preencha para consolidar: Notas Fiscais');
    await expect(consolidate).toBeDisabled();
    await testInfo.attach('t4-marca-limpa', { body: await header.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await edit.click();
    await choice.selectOption('Sim');
    await confirm.click();
    await expect(consolidate).toBeEnabled();
    await consolidate.click();
    const consolidationDialog = page.getByRole('alertdialog', { name: 'Consolidar bonificação', exact: true });
    await expect(consolidationDialog).toBeVisible();
    await expect(consolidationDialog).toContainText('Escola Horizonte');
    await expect(consolidationDialog).toContainText('PDDE Básico');
    await expect(consolidationDialog).toContainText('Notas fiscais, análises técnicas e Pendências não serão alteradas.');
    await consolidationDialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(consolidationDialog).toBeHidden();
    await expect(header).toContainText('Alterações pendentes de consolidação');
    await expect(consolidate).toBeEnabled();
    await consolidate.click();
    await testInfo.attach('t4-confirmacao-reconsolidacao', { body: await consolidationDialog.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await consolidationDialog.getByRole('button', { name: 'Confirmar consolidação', exact: true }).click();
    await expect(consolidationDialog).toBeHidden();
    await expect(header.getByRole('button', { name: 'Consolidada', exact: true })).toBeDisabled();
    await page.reload();
    await waitForApp(page, 'controller');
    await expect(header.getByRole('button', { name: 'Consolidada', exact: true })).toBeDisabled();
    await expect(header).not.toContainText('Alterações pendentes de consolidação');
    await expect(fiscal.locator('.invoice-document-row')).toHaveCount(2);

    const afterSession = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const assistant = await afterSession.newPage();
        await loginAs(assistant, 'federal_assistant');
        const consolidatedResults = await exportInstitutionalSchoolResults(assistant, school, testInfo, 'reconsolidado');
        expect(consolidatedResults.filter(row => /Básico/i.test(row.program))).toEqual([
            { program: 'PDDE Básico', status: 'APTA' }
        ]);
        expect(consolidatedResults.filter(row => /Conectada/i.test(row.program))).toEqual([
            { program: 'Educação Conectada', status: 'APTA' }
        ]);
    } finally {
        await afterSession.close();
    }
});
