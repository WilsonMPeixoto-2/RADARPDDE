'use strict';

// Prova Auth/RLS + frontend real + Supabase descartável. Sem dados institucionais.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_CORRECTION_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável com migrações T4 e Auth real.');
test.describe.configure({ mode: 'default' });

const SCHOOL = 'ESC-T4-HISTORY';
const COMPETENCE = '2026-05';
const FIXTURES = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Credencial de Auth sintética ausente.');

async function login(page, profile) {
    const user = FIXTURES.find(item => item.profileId === profile && item.active);
    if (!user) throw new Error('Identidade sintética ausente: ' + profile);
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(user.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await page.waitForFunction(role =>
        window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === role, profile);
    await expect(page.locator('#radar-auth-gate')).toBeHidden();
    if (['controller', 'federal_assistant'].includes(profile)) {
        await page.locator('#global-competence-select').selectOption(COMPETENCE);
        await page.waitForFunction(key =>
            window.RadarApplicationServices.data.currentOperationalCompetence === key, COMPETENCE);
    }
}

async function openSchool(page) {
    await page.goto('/escolas/' + SCHOOL);
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await page.waitForFunction(() => Boolean(
        typeof verificacoes !== 'undefined' && verificacoes['ESC-T4-HISTORY']?.['2026-05_BASIC']
    ));
    await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
}

async function openHistoryByRealButton(page, documentKey = 'extCC', invoiceId = null) {
    const state = await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.RADAR_T4_ITEM_HISTORY_PILOT = true;
        const root = window.RadarOperationalCorrectionDialog;
        const repository = window.RadarApplicationServices?.data?.repository;
        window.renderProntuario('ESC-T4-HISTORY');
        return {
            canUse: root?.canUse?.(window),
            canClearHistory: root?.canClearHistory?.(window),
            role: window.RadarAuthContext?.authorization?.role,
            remote: repository?.capabilities?.().remote
        };
    });
    expect(state).toMatchObject({
        canUse: true, canClearHistory: true, role: 'controller', remote: true
    });
    const row = page.locator(`tr[data-program-id="BASIC"][data-document-key="${documentKey}"]`);
    const invoice = invoiceId
        ? row.locator(`[data-invoice-id="${invoiceId}"], [data-service-advisory-invoice="${invoiceId}"]`)
        : row;
    const button = invoice.locator('.invoice-history-clear-button, .prontuario-history-clear-button');
    await expect(button).toBeVisible();
    await button.click();
    return page.getByRole('dialog', { name: 'Limpar todo o histórico deste item' });
}

async function readState(page) {
    return page.evaluate(async () => {
        const db = window.RadarSessionContext.service.client;
        const school = 'ESC-T4-HISTORY';
        const [pendency, attempts, contacts, invoices, verifications] = await Promise.all([
            db.from('pendencies').select('id').eq('school_id', school),
            db.from('pendency_attempts').select('id,pendency_id'),
            db.from('pendency_contacts').select('id').eq('school_id', school),
            db.from('registered_invoices').select('id').eq('school_id', school),
            db.from('verifications').select('id,analysis,bonification,bonus_result').eq('school_id', school)
        ]);
        for (const result of [pendency, attempts, contacts, invoices, verifications]) {
            if (result.error) throw new Error(result.error.message);
        }
        return {
            pendencies: pendency.data.map(item => item.id).filter(id => id.startsWith('T4H-')).sort(),
            attempts: attempts.data.map(item => item.id).filter(id => id.startsWith('T4H-')).sort(),
            contacts: contacts.data.map(item => item.id).filter(id => id.startsWith('T4H-')).sort(),
            invoices: invoices.data.map(item => item.id).sort(),
            verifications: verifications.data.sort((a,b) => a.id.localeCompare(b.id))
        };
    });
}

test('T4 histórico real: botão visível, prévia exata e cancelamento sem efeitos', async ({ page }, testInfo) => {
    test.setTimeout(70_000);
    await login(page, 'controller');
    await openSchool(page);
    const before = await readState(page);
    const dialog = await openHistoryByRealButton(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Escola Fictícia de Histórico do Item');
    await expect(dialog).toContainText('PDDE Básico');
    await expect(dialog).toContainText('Extrato Conta Corrente');
    await expect(dialog).toContainText('Pendências — inclusive resolvidas e canceladas (3)');
    await expect(dialog).toContainText('Envios documentais vinculados (1)');
    await expect(dialog).toContainText('Contatos vinculados às Pendências (1)');
    await expect(dialog).not.toContainText('T4H-P-OTHER-DOC');
    await expect(dialog.getByRole('button', { name: 'Limpar histórico deste item' })).toBeEnabled();
    await testInfo.attach('t4-history-real-preview-desktop', {
        body: await page.screenshot({ fullPage: false }), contentType: 'image/png'
    });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(await readState(page)).toEqual(before);
});

test('T4 histórico real: confirma, preserva vizinhos, converge antes do F5 e em outra sessão', async ({ page, browser }, testInfo) => {
    test.setTimeout(90_000);
    await login(page, 'controller');
    await openSchool(page);
    const before = await readState(page);
    expect(before.pendencies).toContain('T4H-P-RES');
    expect(before.verifications.find(v => v.id.endsWith('2026-05::BASIC')).bonus_result).toBe('apta');
    const dialog = await openHistoryByRealButton(page);
    await expect(dialog.getByRole('button', { name: 'Limpar histórico deste item' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Limpar histórico deste item' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('tr[data-program-id="BASIC"][data-document-key="extCC"]');
    await expect(row.locator('select.select-analise')).toHaveValue('Não analisado');
    const after = await readState(page);
    for (const id of ['T4H-P-ACT','T4H-P-RES','T4H-P-CAN']) expect(after.pendencies).not.toContain(id);
    for (const id of ['T4H-P-OTHER-DOC','T4H-P-OTHER-PROG','T4H-P-OTHER-MONTH','T4H-P-LEGACY','T4H-P-INVOICE'])
        expect(after.pendencies).toContain(id);
    expect(after.attempts).not.toContain('T4H-ATT-1');
    expect(after.contacts).not.toContain('T4H-CONTACT-1');
    expect(after.contacts).toContain('T4H-GENERAL');
    expect(after.invoices).toEqual(before.invoices);
    const same = after.verifications.find(v => v.id.endsWith('2026-05::BASIC'));
    expect(same.analysis?.extCC).toBeUndefined();
    expect(same.analysis?.extINV).toBe('Correto');
    expect(same.bonus_result).toBe('apta');

    await testInfo.attach('t4-history-after-commit', {
        body: await page.screenshot({ fullPage: false }), contentType: 'image/png'
    });
    await page.reload();
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    const reloaded = await readState(page);
    expect(reloaded).toEqual(after);

    const another = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const second = await another.newPage();
        await login(second, 'federal_assistant');
        const independent = await readState(second);
        expect(independent).toEqual(after);
    } finally {
        await another.close();
    }
});


async function readInvoice(page, id) {
    return page.evaluate(async invoiceId => {
        const result = await window.RadarSessionContext.service.client.from('registered_invoices')
            .select('id,payload').eq('id', invoiceId).single();
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }, id);
}

test('T4 histórico real: NF individual é preservada, histórico removido e foco retorna à NF', async ({ page }, testInfo) => {
    await login(page, 'controller');
    await openSchool(page);
    const before = await readState(page);
    const dialog = await openHistoryByRealButton(page, 'notaFiscal', 'T4H-NF-1');
    await expect(dialog.getByRole('button', { name: 'Limpar histórico deste item' })).toBeEnabled();
    await testInfo.attach('t4-nf-historico-real', { body: await dialog.screenshot(), contentType: 'image/png' });
    await dialog.getByRole('button', { name: 'Limpar histórico deste item' }).click();
    await expect(dialog).toBeHidden();
    const after = await readState(page);
    expect(after.invoices).toEqual(before.invoices);
    expect(after.pendencies).not.toContain('T4H-P-INVOICE');
    expect(after.pendencies).toContain('T4H-P-AID');
    expect(after.pendencies).toContain('T4H-P-SVC-ACT');
    await expect.poll(async () => (await readInvoice(page, 'T4H-NF-1')).payload.analiseDocumentoFiscal).toBe('Não analisado');
    await expect.poll(() => page.evaluate(() =>
        document.activeElement?.closest('[data-invoice-id]')?.dataset.invoiceId)).toBe('T4H-NF-1');
    expect(after.verifications.find(v => v.id.endsWith('2026-05::BASIC')).bonus_result).toBe('apta');
    await page.reload();
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    expect(await readState(page)).toEqual(after);
});

test('T4 histórico real: Assessoria preserva análise fiscal, NF vizinha e bonificação', async ({ page }, testInfo) => {
    await login(page, 'controller');
    await openSchool(page);
    const before = await readState(page);
    const neighbor = await readInvoice(page, 'T4H-NF-SVC-2');
    const dialog = await openHistoryByRealButton(page, 'consAssessoria', 'T4H-NF-SVC');
    await expect(dialog.getByRole('button', { name: 'Limpar histórico deste item' })).toBeEnabled();
    await testInfo.attach('t4-assessoria-historico-real', { body: await dialog.screenshot(), contentType: 'image/png' });
    await dialog.getByRole('button', { name: 'Limpar histórico deste item' }).click();
    await expect(dialog).toBeHidden();
    const after = await readState(page);
    expect(after.invoices).toEqual(before.invoices);
    expect(after.pendencies).not.toContain('T4H-P-SVC-ACT');
    expect(after.pendencies).not.toContain('T4H-P-SVC-RES');
    expect(after.attempts).not.toContain('T4H-ATT-SVC-1');
    expect(after.contacts).not.toContain('T4H-CONTACT-SVC-1');
    expect(after.contacts).toContain('T4H-GENERAL');
    expect(after.pendencies).toContain('T4H-P-AID');
    const invoice = await readInvoice(page, 'T4H-NF-SVC');
    expect(invoice.payload.analiseConsultaAssessoria).toBe('Não analisado');
    expect(invoice.payload.analiseDocumentoFiscal).toBe('Correto');
    expect(await readInvoice(page, 'T4H-NF-SVC-2')).toEqual(neighbor);
    const monthly = after.verifications.find(v => v.id.endsWith('2026-05::BASIC'));
    expect(monthly.analysis.consAssessoria).toBe('Não analisado');
    expect(monthly.bonus_result).toBe('apta');
    expect(monthly.bonification.consAssessoria).toBe('Sim');
    await expect.poll(() => page.evaluate(() =>
        document.activeElement?.closest('[data-service-advisory-invoice]')?.dataset.serviceAdvisoryInvoice)).toBe('T4H-NF-SVC');
});

test('T4 histórico real: despesa a identificar protegida no Prontuário e no RPC autenticado', async ({ page }) => {
    await login(page, 'controller');
    await openSchool(page);
    await page.evaluate(() => {
        window.RADAR_T4_ITEM_HISTORY_PILOT = true;
        window.renderProntuario('ESC-T4-HISTORY');
    });
    const row = page.locator('[data-invoice-id="T4H-NF-AID"]');
    await expect(row).toBeVisible();
    await expect(row.locator('.invoice-history-clear-button')).toHaveCount(0);
    const before = await readState(page);
    const result = await page.evaluate(async () => {
        const db = window.RadarSessionContext.service.client;
        const request = {
            contractVersion: 1, action: 'clear_item_history',
            target: { kind: 'analysis', schoolId: 'ESC-T4-HISTORY', competence: '2026-05',
                programId: 'BASIC', documentKey: 'notaFiscal', id: 'T4H-NF-AID' }
        };
        const preview = await db.rpc('preview_operational_change', { p_request: request });
        if (preview.error) throw new Error(preview.error.message);
        const apply = await db.rpc('apply_operational_change', {
            p_request: request, p_plan_digest: preview.data.planDigest, p_operation_key: crypto.randomUUID()
        });
        return { blockers: preview.data.blockers, error: apply.error?.message };
    });
    expect(result.blockers).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'MANDATORY_ANALYSIS' })]));
    expect(result.error).toContain('PLAN_BLOCKED');
    expect(await readState(page)).toEqual(before);
});
