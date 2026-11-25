'use strict';

// T5: botões reais, Auth/RLS e persistência na stack local descartável.
// Nenhum RPC simulado, nenhum seed ou usuário do ambiente institucional.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_CORRECTION_LOCAL === '1';
// A suíte obrigatória é executada com este opt-in no job Supabase real.
// eslint-disable-next-line playwright/no-skipped-test
test.skip(!enabled, 'Exige Supabase local descartável com Auth real e migration T5.');
test.describe.configure({ mode: 'default' });
const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Credencial efêmera da fixture Auth não fornecida.');

const TITLES = {
    correct_attempt: 'Corrigir envio', delete_attempt: 'Excluir envio',
    correct_review: 'Corrigir reanálise', delete_review: 'Excluir reanálise',
    correct_contact: 'Corrigir contato', delete_contact: 'Excluir contato',
    correct_inventory: 'Corrigir registro patrimonial', delete_asset: 'Excluir registro patrimonial'
};

function fixture(scenario, testInfo) {
    const prefix = `T5-${scenario}-R${testInfo.retry}`;
    return { prefix, school: 'ESC-' + prefix, id: suffix => prefix + '-' + suffix };
}

async function installPilot(page) {
    await page.addInitScript(() => {
        window.RADAR_T4_CONTEXT_DELETION_PILOT = true;
        window.RADAR_T4_ITEM_HISTORY_PILOT = true;
        window.RADAR_T5_HISTORY_PILOT = true;
    });
}

async function ready(page, role) {
    await page.waitForFunction(expected => window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === expected, role);
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await expect(page.locator('#app-layout')).toBeVisible();
}

async function login(page, role) {
    await installPilot(page);
    const account = users.find(user => user.profileId === role && user.active);
    if (!account) throw new Error('Identidade sintética ausente: ' + role);
    await page.goto('/');
    const runtime = await page.evaluate(() => ({
        mode: window.RADAR_PDDE_CONFIG?.dataMode,
        url: window.RADAR_PDDE_CONFIG?.supabase?.url
    }));
    expect(runtime.mode).toBe('supabase-preview');
    expect(['127.0.0.1', 'localhost']).toContain(new URL(runtime.url).hostname);
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await ready(page, role);
    if (['controller', 'federal_assistant'].includes(role)) {
        await page.locator('#global-competence-select').selectOption('2026-05');
        await page.waitForFunction(() => window.RadarApplicationServices.data.currentOperationalCompetence === '2026-05');
    }
}

async function openPendency(page, data, suffix = 'P', tab = 'resolvida', role = 'controller') {
    await page.goto('/pendencias');
    await ready(page, role);
    await page.locator('#pendency-tab-' + tab).click();
    await page.locator('#pendency-filter-school').selectOption(data.school);
    // A mesma Pendência possui marcação desktop e celular; apenas uma está visível.
    const record = page.locator(`.pendency-tab-panel:visible [data-pendency-id="${data.id(suffix)}"]:visible`);
    await expect(record).toHaveCount(1);
    const trigger = record.getByRole('button', { name: 'Ver detalhes', exact: true });
    await expect(trigger).toHaveCount(1);
    await trigger.click();
    const drawer = page.locator('#pendency-detail-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-pendency-ref', new RegExp(data.id(suffix)));
    return drawer;
}

async function openSchoolTab(page, data, tab, role = 'controller') {
    await page.goto('/escolas/' + data.school);
    await ready(page, role);
    await page.locator('#prontuario-tab-' + tab).click();
    await expect(page.locator('#tab-' + tab)).toBeVisible();
}

async function openCorrection(page, action, id) {
    const trigger = page.locator(`[data-action="${action.replaceAll('_', '-')}"][data-correction-target-id="${id}"]`);
    await expect(trigger).toHaveCount(1);
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: TITLES[action], exact: true });
    await expect(dialog).toBeVisible();
    return dialog;
}

async function reviewPreview(dialog) {
    await dialog.getByRole('button', { name: 'Revisar prévia', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Confirmar correção', exact: true })).toBeEnabled();
}

async function confirm(page, dialog, deleting = false) {
    const button = dialog.getByRole('button', { name: deleting ? 'Confirmar exclusão' : 'Confirmar correção', exact: true });
    // fill() emite input; a tela descarta a prévia anterior até o operador revisá-la.
    if (!deleting) await reviewPreview(dialog);
    await expect(button).toBeEnabled();
    const responsePromise = page.waitForResponse(response => response.url().endsWith('/rpc/apply_operational_change'));
    await button.click();
    const response = await responsePromise;
    const receipt = await response.json();
    expect(response.ok(), JSON.stringify(receipt)).toBe(true);
    expect(receipt.committed).toBe(true);
    await expect(dialog).toBeHidden();
    return receipt;
}

async function snapshot(page, school) {
    return page.evaluate(async schoolId => {
        const db = window.RadarSessionContext.service.client;
        const tables = ['pendencies', 'pendency_contacts', 'registered_invoices', 'assets', 'verifications'];
        const results = await Promise.all(tables.map(table => db.from(table).select('*').eq('school_id', schoolId)));
        const state = {};
        results.forEach((result, index) => {
            if (result.error) throw new Error(result.error.message);
            state[tables[index]] = result.data.sort((left, right) => left.id.localeCompare(right.id));
        });
        const ids = state.pendencies.map(item => item.id);
        const attempts = ids.length ? await db.from('pendency_attempts').select('*').in('pendency_id', ids) : { data: [] };
        if (attempts.error) throw new Error(attempts.error.message);
        state.pendency_attempts = attempts.data.sort((left, right) => left.id.localeCompare(right.id));
        return state;
    }, school);
}

function row(state, table, id) {
    return state[table].find(item => item.id === id);
}

function bonus(state) {
    return state.verifications.map(value => ({ id: value.id, bonification: value.bonification, bonus_result: value.bonus_result }));
}

async function rpc(page, name, args) {
    return page.evaluate(async ({ rpcName, parameters }) => {
        const result = await window.RadarSessionContext.service.client.rpc(rpcName, parameters);
        return { data: result.data, error: result.error && { code: result.error.code, message: result.error.message } };
    }, { rpcName: name, parameters: args });
}

async function screenshot(testInfo, locator, name) {
    await testInfo.attach(name, { body: await locator.screenshot(), contentType: 'image/png' });
}

async function setTheme(page, dark) {
    const current = await page.locator('body').evaluate(node => node.classList.contains('dark-theme'));
    if (current !== dark) await page.locator('#theme-toggle-btn').click();
    await expect.poll(() => page.locator('body').evaluate(node => node.classList.contains('dark-theme'))).toBe(dark);
}

test('T5 histórico real: texto/link preservam resultado e autoria; data recalcula só análise fiscal; outra sessão converge', async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const data = fixture('TEXT', testInfo);
    await login(page, 'controller');
    await openPendency(page, data);
    const before = await snapshot(page, data.school);
    const original = row(before, 'pendency_attempts', data.id('A2'));
    const old = row(before, 'pendency_attempts', data.id('A1'));
    const originalNeighbor = row(before, 'registered_invoices', data.id('NEIGHBOR'));

    let dialog = await openCorrection(page, 'correct_attempt', data.id('A2'));
    await dialog.locator('#radar-granular-field-driveUrl').fill('https://example.test/t5/documento-corrigido');
    await dialog.locator('#radar-granular-field-observation').fill('');
    await expect(dialog.locator('#radar-granular-field-observation')).not.toHaveAttribute('required', '');
    await reviewPreview(dialog);
    await screenshot(testInfo, dialog, 't5-envio-texto-link-real');
    const receipt = await confirm(page, dialog);
    let after = await snapshot(page, data.school);
    let attempt = row(after, 'pendency_attempts', data.id('A2'));
    expect(attempt.drive_url).toBe('https://example.test/t5/documento-corrigido');
    expect(attempt.observation).toBe('');
    expect(attempt.result).toBe(original.result);
    expect(attempt.analyzed_at).toBe(original.analyzed_at);
    expect(attempt.submitted_at).toBe(original.submitted_at);
    expect(attempt.created_by).toBe(original.created_by);
    expect(row(after, 'pendency_attempts', data.id('A1'))).toEqual(old);
    expect(after.verifications).toEqual(before.verifications);
    const actor = await page.evaluate(async auditId => {
        const response = await window.RadarSessionContext.service.client.from('administrative_logs')
            .select('actor_user_id').eq('id', auditId).single();
        if (response.error) throw new Error(response.error.message);
        return response.data.actor_user_id;
    }, receipt.auditId);
    expect(actor).toBe(users.find(user => user.profileId === 'controller').id);

    await page.reload();
    await ready(page, 'controller');
    await openPendency(page, data);
    await expect(page.locator('#pendency-detail-drawer a[href="https://example.test/t5/documento-corrigido"]')).toBeVisible();
    dialog = await openCorrection(page, 'correct_attempt', data.id('A2'));
    await dialog.locator('#radar-granular-field-availableAt').fill('2026-06-20');
    await confirm(page, dialog);
    after = await snapshot(page, data.school);
    expect(row(after, 'registered_invoices', data.id('NF')).payload).toMatchObject({
        analiseDocumentoFiscal: 'Correto (Atrasado)', analiseConsultaAssessoria: 'Correto'
    });
    expect(row(after, 'registered_invoices', data.id('NEIGHBOR'))).toEqual(originalNeighbor);
    expect(bonus(after)).toEqual(bonus(before));
    expect(row(after, 'pendency_attempts', data.id('A2')).submitted_at).toBe(original.submitted_at);

    await openPendency(page, data);
    dialog = await openCorrection(page, 'correct_review', data.id('A2'));
    await dialog.locator('#radar-granular-field-result').selectOption('incorreto');
    await dialog.getByLabel('Sem assinatura', { exact: true }).check();
    await dialog.locator('#radar-granular-field-observation').fill('');
    await confirm(page, dialog);
    after = await snapshot(page, data.school);
    expect(row(after, 'pendencies', data.id('P'))).toMatchObject({ status: 'Aberta', next_actor: 'Escola', resolved_at: null });
    expect(row(after, 'pendency_attempts', data.id('A2'))).toMatchObject({ result: 'incorreto', errors: ['Sem assinatura'] });
    expect(after.pendency_attempts).toHaveLength(2);
    expect(row(after, 'registered_invoices', data.id('NF')).payload.analiseConsultaAssessoria).toBe('Correto');
    expect(bonus(after)).toEqual(bonus(before));

    const context = await browser.newContext();
    try {
        const colleague = await context.newPage();
        await login(colleague, 'federal_assistant');
        const drawer = await openPendency(colleague, data, 'P', 'aberta', 'federal_assistant');
        await expect(drawer).toContainText('Sem assinatura');
        expect(await snapshot(colleague, data.school)).toEqual(after);
    } finally { await context.close(); }
});

test('T5 exclusões reais: revisão antiga preserva cancelamento/envio posterior; excluir última revisão e envio não revive substituído', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const data = fixture('EVENTS', testInfo);
    await login(page, 'controller');
    await openPendency(page, data, 'CANCELED', 'cancelada');
    const before = await snapshot(page, data.school);
    let dialog = await openCorrection(page, 'delete_review', data.id('OLD'));
    await confirm(page, dialog, true);
    let after = await snapshot(page, data.school);
    const canceled = row(after, 'pendencies', data.id('CANCELED'));
    expect(canceled.status).toBe('Cancelada');
    expect(canceled.canceled_at).toBe(row(before, 'pendencies', data.id('CANCELED')).canceled_at);
    expect(canceled.payload.historico.map(event => event.id)).toEqual([
        data.id('LATER-SEND'), data.id('LATER-REVIEW'), data.id('CANCEL-EVENT')
    ]);
    expect(row(after, 'pendency_attempts', data.id('LATER'))).toEqual(row(before, 'pendency_attempts', data.id('LATER')));

    await openPendency(page, data, 'LAST', 'resolvida');
    dialog = await openCorrection(page, 'delete_review', data.id('CURRENT'));
    await screenshot(testInfo, dialog, 't5-excluir-reanalise-real');
    await confirm(page, dialog, true);
    after = await snapshot(page, data.school);
    expect(row(after, 'pendencies', data.id('LAST'))).toMatchObject({ status: 'Aguardando reanálise', next_actor: 'Controlador', resolved_at: null });
    expect(after.verifications[0].analysis.extINV).toBe('Não analisado');
    expect(row(after, 'pendency_attempts', data.id('CURRENT')).payload.analisadoPorId).toBeFalsy();
    await openPendency(page, data, 'LAST', 'aguardando');
    dialog = await openCorrection(page, 'delete_attempt', data.id('CURRENT'));
    await confirm(page, dialog, true);
    after = await snapshot(page, data.school);
    expect(row(after, 'pendencies', data.id('LAST'))).toMatchObject({ status: 'Aberta', next_actor: 'Escola', resolved_at: null });
    expect(row(after, 'pendency_attempts', data.id('CURRENT'))).toBeUndefined();
    expect(row(after, 'pendency_attempts', data.id('SUPERSEDED'))).toMatchObject({ attempt_number: 1, result: null, payload: { status: 'substituida_antes_da_analise' } });
    expect(bonus(after)).toEqual(bonus(before));
    await page.reload();
    await ready(page, 'controller');
    expect(await snapshot(page, data.school)).toEqual(after);
});

test('T5 ambiguidade real: nenhum efeito sem escolha; alcance completo explícito preserva contato geral', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const data = fixture('AMBIG', testInfo);
    await login(page, 'controller');
    await openPendency(page, data, 'P', 'aguardando');
    const before = await snapshot(page, data.school);
    let dialog = await openCorrection(page, 'delete_review', data.id('OLD'));
    await expect(dialog.getByRole('button', { name: 'Confirmar exclusão', exact: true })).toBeDisabled();
    const fullScope = dialog.locator('[data-operational-correction-alt="delete_pendency"]');
    await expect(fullScope).toBeVisible();
    await expect(fullScope).toContainText('Pendência');
    expect(await snapshot(page, data.school)).toEqual(before);
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot(testInfo, dialog, 't5-ambiguidade-alcance-celular-real');
    await dialog.locator('.radar-operational-correction-body').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await screenshot(testInfo, dialog, 't5-ambiguidade-efeitos-celular-real');
    expect(await dialog.locator('.radar-operational-correction-effects')
        .evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(await snapshot(page, data.school)).toEqual(before);

    await page.setViewportSize({ width: 1280, height: 900 });
    // A correção fecha sua gaveta de origem; após cancelar, o operador abre os detalhes novamente.
    await openPendency(page, data, 'P', 'aguardando');
    dialog = await openCorrection(page, 'delete_review', data.id('OLD'));
    const completePreview = page.waitForResponse(response => response.url().endsWith('/rpc/preview_operational_change')
        && response.request().postDataJSON()?.p_request?.action === 'delete_pendency');
    await dialog.locator('[data-operational-correction-alt="delete_pendency"]').click();
    const deletion = page.getByRole('dialog', { name: /Excluir pendência/i });
    await expect(deletion).toBeVisible();
    const completePlan = await (await completePreview).json();
    expect(completePlan.target.id).toBe(data.id('P'));
    expect(completePlan.effects.delete.pendency_attempts.sort()).toEqual([data.id('OLD'), data.id('WAITING')].sort());
    expect(completePlan.effects.delete.pendency_contacts).toEqual([data.id('LINKED')]);
    await confirm(page, deletion, true);
    const after = await snapshot(page, data.school);
    expect(after.pendencies).toEqual([]);
    expect(after.pendency_attempts).toEqual([]);
    expect(after.pendency_contacts.map(contact => contact.id)).toEqual([data.id('GENERAL')]);
    expect(row(after, 'pendency_contacts', data.id('GENERAL'))).toEqual(row(before, 'pendency_contacts', data.id('GENERAL')));
    expect(bonus(after)).toEqual(bonus(before));
});

test('T5 contatos e manual reais: limpar detalhes é permitido e comunicação não resolve pendência', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const data = fixture('CONTACT', testInfo);
    await login(page, 'controller');
    await openPendency(page, data, 'P', 'aberta');
    const before = await snapshot(page, data.school);
    let dialog = await openCorrection(page, 'correct_contact', data.id('LINKED'));
    await dialog.locator('#radar-granular-field-description').fill('');
    await dialog.locator('#radar-granular-field-officialCharge').uncheck();
    await dialog.getByLabel('Desvincular desta Pendência e manter no histórico da escola', { exact: true }).check();
    await confirm(page, dialog);
    let after = await snapshot(page, data.school);
    expect(row(after, 'pendency_contacts', data.id('LINKED'))).toMatchObject({ description: '', official_charge: false, pendency_id: null });
    expect(after.pendencies).toEqual(before.pendencies);
    await page.reload();
    await ready(page, 'controller');
    await openSchoolTab(page, data, 'contatos');
    await expect(page.locator(`[data-action="correct-contact"][data-correction-target-id="${data.id('LINKED')}"]`)).toBeVisible();
    expect(await snapshot(page, data.school)).toEqual(after);

    await openPendency(page, data, 'P', 'aberta');
    await expect(page.locator(`#pendency-detail-drawer [data-correction-target-id="${data.id('LINKED')}"]`)).toHaveCount(0);
    await page.locator('#pendency-detail-drawer').getByRole('button', { name: 'Editar detalhes', exact: true }).click();
    const manual = page.locator('#pendency-preview-drawer');
    await expect(manual).toBeVisible();
    await expect(manual).toHaveAttribute('data-mode', 'edit');
    await manual.locator('#pendency-preview-observation').fill('');
    await manual.locator('#pendency-preview-item').selectOption('Extrato Conta Corrente');
    await manual.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect.poll(async () => row(await snapshot(page, data.school), 'pendencies', data.id('P')).notes).toBe('');
    after = await snapshot(page, data.school);
    const correctedManual = row(after, 'pendencies', data.id('P'));
    expect(correctedManual).toMatchObject({ document_key: 'Outro', status: 'Aberta', notes: '' });
    expect(correctedManual.payload.item).toBe('Extrato Conta Corrente');
    expect(correctedManual.payload.tipo).not.toBe('documental');

    await openSchoolTab(page, data, 'contatos');
    dialog = await openCorrection(page, 'delete_contact', data.id('LINKED'));
    await expect(dialog).toContainText(/mensagens|e-mails|comunicação externa/i);
    await confirm(page, dialog, true);
    after = await snapshot(page, data.school);
    expect(row(after, 'pendency_contacts', data.id('LINKED'))).toBeUndefined();
    expect(row(after, 'pendencies', data.id('P'))).toEqual(correctedManual);

    await openSchoolTab(page, data, 'contatos');
    dialog = await openCorrection(page, 'correct_contact', data.id('GENERAL'));
    await dialog.locator('#radar-granular-field-description').fill('Contato geral corrigido sem vínculo documental');
    await confirm(page, dialog);
    after = await snapshot(page, data.school);
    expect(row(after, 'pendency_contacts', data.id('GENERAL'))).toMatchObject({ pendency_id: null, description: 'Contato geral corrigido sem vínculo documental' });
    expect(bonus(after)).toEqual(bonus(before));
    await page.reload();
    await ready(page, 'controller');
    expect(await snapshot(page, data.school)).toEqual(after);
});

test('T5 Inventário real: corrige conclusão e exclui bem independente sem poder apagar despesa fiscal', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const data = fixture('ASSET', testInfo);
    await login(page, 'inventory');
    await openSchoolTab(page, data, 'capital', 'inventory');
    await setTheme(page, false);
    const before = await snapshot(page, data.school);
    expect(before.assets).toHaveLength(3);
    expect(before.verifications).toHaveLength(1);
    expect(before.registered_invoices).toHaveLength(1);
    let dialog = await openCorrection(page, 'correct_inventory', data.id('EDIT'));
    await dialog.locator('#radar-granular-field-inventoryProcess').fill('PROCESSO-CORRIGIDO');
    await dialog.locator('#radar-granular-field-notes').fill('');
    await confirm(page, dialog);
    let after = await snapshot(page, data.school);
    expect(row(after, 'assets', data.id('EDIT'))).toMatchObject({ status: 'Inventariada', inventory_process: 'PROCESSO-CORRIGIDO', notes: '' });
    await openSchoolTab(page, data, 'capital', 'inventory');
    dialog = await openCorrection(page, 'correct_inventory', data.id('EDIT'));
    await dialog.locator('#radar-granular-field-status').selectOption('Encaminhada');
    await expect(dialog.getByRole('button', { name: 'Confirmar correção', exact: true })).toBeEnabled();
    await screenshot(testInfo, dialog, 't5-correcao-inventariada-real');
    // O seletor de tema pertence à página. Cancelar a prévia mantém o mesmo
    // registro/versão; o botão real muda o tema antes de reabrir a correção.
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await setTheme(page, true);
    dialog = await openCorrection(page, 'correct_inventory', data.id('EDIT'));
    await dialog.locator('#radar-granular-field-status').selectOption('Encaminhada');
    await expect(dialog.getByRole('button', { name: 'Confirmar correção', exact: true })).toBeEnabled();
    await screenshot(testInfo, dialog, 't5-correcao-inventariada-escuro-real');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await screenshot(testInfo, dialog, 't5-correcao-inventariada-celular-real');
    await dialog.locator('.radar-operational-correction-body').evaluate(node => { node.scrollTop = node.scrollHeight; });
    await screenshot(testInfo, dialog, 't5-correcao-inventariada-efeitos-celular-real');
    expect(await dialog.locator('.radar-operational-correction-effects')
        .evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await confirm(page, dialog);
    after = await snapshot(page, data.school);
    expect(row(after, 'assets', data.id('EDIT'))).toMatchObject({ status: 'Encaminhada', inventoried_at: null, inventoried_by_member_id: null });
    expect(bonus(after)).toEqual(bonus(before));

    await openSchoolTab(page, data, 'capital', 'inventory');
    dialog = await openCorrection(page, 'delete_asset', data.id('DELETE'));
    await expect(dialog).toContainText(/SIGMA/);
    await confirm(page, dialog, true);
    const blocked = await rpc(page, 'preview_operational_change', {
        p_request: { contractVersion: 1, action: 'delete_asset', target: { kind: 'asset', id: data.id('LINKED'), schoolId: data.school } }
    });
    expect(Boolean(blocked.error) || blocked.data?.canApply === false || blocked.data?.blockers?.length > 0).toBe(true);
    const forbiddenFiscal = await rpc(page, 'preview_operational_change', {
        p_request: { contractVersion: 1, action: 'delete_invoice', target: { kind: 'invoice', id: data.id('NF'), schoolId: data.school, competence: '2026-05' } }
    });
    expect(forbiddenFiscal.error?.message).toMatch(/AUTHORIZATION_DENIED|PERMISSION_DENIED/);
    after = await snapshot(page, data.school);
    expect(row(after, 'assets', data.id('DELETE'))).toBeUndefined();
    expect(row(after, 'assets', data.id('LINKED'))).toEqual(row(before, 'assets', data.id('LINKED')));
    expect(after.registered_invoices).toEqual(before.registered_invoices);
    expect(bonus(after)).toEqual(bonus(before));
    await page.reload();
    await ready(page, 'inventory');
    expect(await snapshot(page, data.school)).toEqual(after);
});

test('T5 Auth real: SME negado; edição de colega invalida prévia e retry repete somente a intenção confirmada', async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const data = fixture('CONFLICT', testInfo);
    await login(page, 'controller');
    await openPendency(page, data, 'P', 'aberta');
    const before = await snapshot(page, data.school);
    const dialog = await openCorrection(page, 'correct_contact', data.id('LINKED'));
    await dialog.locator('#radar-granular-field-description').fill('Texto do controlador após conferência');
    await reviewPreview(dialog);
    const confirmButton = dialog.getByRole('button', { name: 'Confirmar correção', exact: true });
    await expect(confirmButton).toBeEnabled();
    const context = await browser.newContext();
    const readerContext = await browser.newContext();
    try {
        const colleague = await context.newPage();
        await login(colleague, 'federal_assistant');
        await openPendency(colleague, data, 'P', 'aberta', 'federal_assistant');
        const colleagueDialog = await openCorrection(colleague, 'correct_contact', data.id('LINKED'));
        await colleagueDialog.locator('#radar-granular-field-description').fill('Texto novo registrado pela colega');
        await confirm(colleague, colleagueDialog);
        const changedByColleague = await snapshot(colleague, data.school);

        const rejectedResponse = page.waitForResponse(response => response.url().endsWith('/rpc/apply_operational_change'));
        await confirmButton.click();
        const rejected = await rejectedResponse;
        expect(rejected.ok()).toBe(false);
        expect((await rejected.json()).message).toMatch(/STALE_PLAN|OPTIMISTIC_CONFLICT/);
        await expect(dialog).toBeVisible();
        expect(await snapshot(page, data.school)).toEqual(changedByColleague);

        const reader = await readerContext.newPage();
        await login(reader, 'sme_management');
        await openPendency(reader, data, 'P', 'aberta', 'sme_management');
        await expect(reader.locator(`[data-correction-target-id="${data.id('LINKED')}"]`)).toHaveCount(0);
        const denied = await rpc(reader, 'preview_operational_change', {
            p_request: { contractVersion: 1, action: 'delete_contact', target: { kind: 'contact', id: data.id('LINKED'), schoolId: data.school } }
        });
        expect(denied.error?.message).toMatch(/AUTHORIZATION_DENIED|PERMISSION_DENIED/);

        await dialog.getByRole('button', { name: 'Revisar prévia', exact: true }).click();
        await expect(confirmButton).toBeEnabled();
        const applyRequest = page.waitForRequest(request => request.url().endsWith('/rpc/apply_operational_change'));
        const receipt = await confirm(page, dialog);
        const parameters = (await applyRequest).postDataJSON();
        const committed = await snapshot(page, data.school);
        expect(row(committed, 'pendency_contacts', data.id('LINKED')).description).toBe('Texto do controlador após conferência');
        expect(committed.pendencies).toEqual(before.pendencies);
        const replay = await rpc(page, 'apply_operational_change', parameters);
        expect(replay.error).toBeNull();
        expect(replay.data.operationKey).toBe(receipt.operationKey);
        expect(replay.data.auditId).toBe(receipt.auditId);
        expect(await snapshot(page, data.school)).toEqual(committed);
        const conflict = await rpc(page, 'apply_operational_change', {
            ...parameters, p_request: { ...parameters.p_request, changes: { description: 'Outra intenção com chave repetida' } }
        });
        expect(conflict.error?.message).toMatch(/IDEMPOTENCY_CONFLICT/);
        expect(await snapshot(page, data.school)).toEqual(committed);
    } finally {
        await context.close();
        await readerContext.close();
    }
});
