'use strict';

// T4 / Release 2: prova do clique real, Supabase local/Auth/RLS, persistência e
// outra sessão. A aplicação é em dados sintéticos, nunca no banco institucional.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_CORRECTION_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável com Auth/RLS e migração T4.');
test.describe.configure({ mode: 'default' });
const SCHOOL = 'ESC-T4-CONTEXT';
const COMPETENCE = '2026-05';
const FIXTURES = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Credencial sintética Auth ausente.');

async function login(page, profile) {
    const account = FIXTURES.find(a => a.profileId === profile && a.active);
    if (!account) throw new Error('Fixture sem perfil ' + profile);
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill(account.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await page.waitForFunction(role =>
        window.RadarDataContext?.ready === true &&
        window.RadarAuthContext?.authorization?.role === role, profile);
    await expect(page.locator('#radar-auth-gate')).toBeHidden();
    await page.evaluate(() => window.RadarProductExtensionsReady);
    if (['controller', 'federal_assistant'].includes(profile)) {
        await page.locator('#global-competence-select').selectOption(COMPETENCE);
        await page.waitForFunction(key =>
            window.RadarApplicationServices.data.currentOperationalCompetence === key, COMPETENCE);
    }
}

async function openSchool(page) {
    await page.goto('/escolas/' + SCHOOL);
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
    // A visibilidade da grade antecede a hidratação do contexto escolar remoto.
    // Não tomar uma grade vazia por conclusão do carregamento canônico.
    await page.waitForFunction(({ school, competence }) =>
        typeof verificacoes !== 'undefined' &&
        Boolean(verificacoes[school]?.[`${competence}_BASIC`]),
        { school: SCHOOL, competence: COMPETENCE }, { timeout: 20000 });
}

async function enablePilotAndOpen(page) {
    const proof = await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.RADAR_T4_CONTEXT_DELETION_PILOT = true;
        const dialog = window.RadarOperationalCorrectionDialog;
        const repository = window.RadarApplicationServices?.data?.repository;
        const before = {
            pilot: window.RADAR_T4_CONTEXT_DELETION_PILOT,
            preview: window.RADAR_OPERATIONAL_CORRECTION_PREVIEW,
            canUse: dialog?.canUse?.(window),
            canDelete: dialog?.canDeleteContext?.(window),
            remote: repository?.capabilities?.().remote,
            executeRpc: typeof repository?.executeRpc === 'function',
            client: typeof window.RadarOperationalCorrectionClient?.createOperationalCorrectionClient === 'function',
            program: typeof verificacoes === 'undefined' ? null :
                Boolean(verificacoes['ESC-T4-CONTEXT']?.['2026-05_BASIC']),
            role: window.RadarAuthContext?.authorization?.role,
            competence: typeof activeProntuarioCompetencia === 'undefined' ? null : activeProntuarioCompetencia
        };
        window.renderProntuario('ESC-T4-CONTEXT');
        return {
            ...before,
            headers: [...document.querySelectorAll('tr[data-program-header]')]
                .map(row => row.getAttribute('data-program-header')),
            visibleActions: document.querySelectorAll('.program-context-delete-button').length,
            actionDetails: [...document.querySelectorAll('.program-context-delete-button')]
                .map(button => ({
                    program: button.closest('tr[data-program-header]')?.dataset.programHeader,
                    text: button.textContent?.trim(),
                    display: getComputedStyle(button).display,
                    visibility: getComputedStyle(button).visibility,
                    hasLayout: Boolean(button.getClientRects().length),
                    inertAncestor: Boolean(button.closest('[inert]')),
                    ariaHiddenAncestor: Boolean(button.closest('[aria-hidden="true"]'))
                }))
        };
    });
    expect(proof, 'Diagnóstico do piloto autenticado: ' + JSON.stringify(proof))
        .toMatchObject({ pilot: true, preview: true, canUse: true,
            canDelete: true, remote: true, executeRpc: true, client: true,
            program: true, role: 'controller', competence: '2026-05' });
    expect(proof.headers, 'Faltam cabeçalhos após renderizar').toContain('BASIC');
    expect(proof.visibleActions, 'Nenhuma ação de exclusão apareceu: ' + JSON.stringify(proof))
        .toBeGreaterThan(0);
    const targetButton = proof.actionDetails.find(item => item.program === 'BASIC');
    expect(targetButton, 'Botão PDDE Básico inexistente: ' + JSON.stringify(proof))
        .toBeDefined();
    expect(!targetButton.inertAncestor && !targetButton.ariaHiddenAncestor,
        'Ação PDDE Básico não pode ficar inacessível: ' + JSON.stringify(proof))
        .toBe(true);
    const program = page.locator('tr[data-program-header="BASIC"]');
    const action = program.getByRole('button', { name: 'Excluir lançamentos deste programa', exact: true });
    await expect(action).toBeVisible();
    await expect(program.locator('details.program-context-options')).toHaveCount(0);
    await action.focus();
    await expect(action).toBeFocused();
    await page.keyboard.press('Enter');
    return page.getByRole('dialog', { name: 'Excluir lançamentos deste programa' });
}

async function snapshot(page) {
    return page.evaluate(async () => {
        const client = window.RadarSessionContext.service.client;
        const school = 'ESC-T4-CONTEXT';
        const [checks, invoices, pendencies, contacts, assets] = await Promise.all([
            client.from('verifications').select('id,competence_id,program_id').eq('school_id', school),
            client.from('registered_invoices').select('id,competence_id,program_id').eq('school_id', school),
            client.from('pendencies').select('id,competence_origin,program_id').eq('school_id', school),
            client.from('pendency_contacts').select('id,pendency_id').eq('school_id', school),
            client.from('assets').select('id,status').eq('school_id', school)
        ]);
        for (const result of [checks, invoices, pendencies, contacts, assets]) {
            if (result.error) throw new Error(result.error.message);
        }
        return {
            verifications: checks.data.map(x => x.id).sort(),
            invoices: invoices.data.map(x => x.id).sort(),
            pendencies: pendencies.data.map(x => x.id).sort(),
            contacts: contacts.data.map(x => x.id).sort(),
            assets: assets.data.map(x => x.id).sort()
        };
    });
}

test('T4 real: prévia e cancelamento não alteram escola, NFs, Pendências ou patrimônio', async ({ page }, testInfo) => {
    await login(page, 'controller');
    await openSchool(page);
    const before = await snapshot(page);
    const dialog = await enablePilotAndOpen(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Escola Fictícia de Correção de Contexto');
    await expect(dialog).toContainText('Maio');
    await expect(dialog).toContainText('PDDE Básico');
    await expect(dialog).toContainText('avaliação mensal do programa');
    await expect(dialog).toContainText('notas fiscais');
    await expect(dialog).toContainText('Pendências');
    await expect(dialog).toContainText('NF T4-CTX-001');
    await expect(dialog).toContainText('Bem lançado no mês e programa errados');
    await expect(dialog).toContainText('NF T4-CTX-002');
    await expect(dialog).toContainText('Pendência: Nota fiscal');
    await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeEnabled();
    const scroll = dialog.getByRole('region', { name: 'Prévia completa da operação' });
    const viewport = page.viewportSize();
    const initialDark = await page.evaluate(() => document.body.classList.contains('dark-theme'));
    try {
        for (const variant of [
            { name: 'desktop-claro', width: 1440, height: 900, dark: false },
            { name: 'desktop-escuro', width: 1280, height: 720, dark: true },
            { name: 'celular-escuro', width: 390, height: 844, dark: true }
        ]) {
            await page.setViewportSize({ width: variant.width, height: variant.height });
            await page.evaluate(dark => document.body.classList.toggle('dark-theme', dark), variant.dark);
            await scroll.evaluate(el => { el.scrollTop = 0; });
            for (const name of ['Cancelar', 'Conferir novamente', 'Excluir estes lançamentos']) {
                await expect(dialog.getByRole('button', { name, exact: true })).toBeInViewport({ ratio: 1 });
            }
            await testInfo.attach('t4-context-preview-' + variant.name, {
                body: await page.screenshot(), contentType: 'image/png'
            });
            await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
            expect(await scroll.evaluate(el => el.scrollTop + el.clientHeight >= el.scrollHeight - 2)).toBe(true);
            await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeInViewport({ ratio: 1 });
            await testInfo.attach('t4-context-preview-final-' + variant.name, {
                body: await page.screenshot(), contentType: 'image/png'
            });
        }
    } finally {
        if (viewport) await page.setViewportSize(viewport);
        await page.evaluate(dark => document.body.classList.toggle('dark-theme', dark), initialDark);
    }
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(await snapshot(page)).toEqual(before);
});

test('T4 real: perfil somente leitura não pode prever nem confirmar exclusão com digest válido do Controlador', async ({ page, browser }, testInfo) => {
    test.setTimeout(60_000);
    await login(page, 'controller');
    await openSchool(page);
    const before = await snapshot(page);
    expect(before.invoices).toContain('T4-CTX-NF-A');
    expect(before.verifications).toContain('ESC-T4-CONTEXT::2026-05::BASIC');

    const request = {
        contractVersion: 1,
        action: 'delete_context',
        target: { kind: 'program_context', schoolId: SCHOOL, competence: COMPETENCE, programId: 'BASIC' }
    };
    const plan = await page.evaluate(async p_request => {
        const { data, error } = await window.RadarSessionContext.service.client.rpc(
            'preview_operational_change', { p_request });
        if (error) throw new Error(error.message);
        return data;
    }, request);
    expect(plan.planDigest).toMatch(/^[a-f0-9]{64}$/i);
    expect(plan.blockers).toEqual([]);
    expect(plan.effects.delete.registered_invoices).toContain('T4-CTX-NF-A');

    const second = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const reader = await second.newPage();
        await login(reader, 'sme_management');
        await reader.goto('/escolas/' + SCHOOL);
        await reader.waitForFunction(() => window.RadarDataContext?.ready === true &&
            window.RadarAuthContext?.authorization?.role === 'sme_management');
        await expect(reader.locator('#prontuario-verif-rows')).toBeVisible();
        await reader.evaluate(async school => {
            await window.RadarProductExtensionsReady;
            window.RADAR_T4_CONTEXT_DELETION_PILOT = true;
            window.renderProntuario(school);
        }, SCHOOL);
        await expect(reader.locator('.program-context-delete-button')).toHaveCount(0);

        // Testa a autoridade do servidor, não apenas a ausência do botão.
        // O digest legítimo é obtido na outra sessão; não é inventado nem adulterado.
        const denied = await reader.evaluate(async ({ p_request, p_plan_digest }) => {
            const client = window.RadarSessionContext.service.client;
            const preview = await client.rpc('preview_operational_change', { p_request });
            const apply = await client.rpc('apply_operational_change', {
                p_request, p_plan_digest,
                p_operation_key: '00000000-0000-4000-8000-000000000546'
            });
            return [preview, apply].map(result => ({
                data: result.data, error: result.error?.message || null
            }));
        }, { p_request: request, p_plan_digest: plan.planDigest });
        for (const attempt of denied) {
            expect(attempt.data).toBeNull();
            expect(attempt.error).toMatch(/AUTHORIZATION_DENIED/);
        }
    } finally {
        await second.close();
    }
    expect(await snapshot(page)).toEqual(before);
});

test('T4 real: mudança de uma NF em outra sessão invalida a prévia e impede exclusão parcial', async ({ page, browser }, testInfo) => {
    test.setTimeout(60_000);
    await login(page, 'controller');
    await openSchool(page);
    const before = await snapshot(page);
    const dialog = await enablePilotAndOpen(page);
    const save = dialog.getByRole('button', { name: 'Excluir estes lançamentos' });
    await expect(save).toBeEnabled();
    await expect(dialog).toContainText('Material de expediente no contexto errado');

    const second = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const changedDescription = 'Material de expediente — retificado em outra sessão';
    let original;
    let changed = false;
    try {
        const other = await second.newPage();
        await login(other, 'controller');
        original = await other.evaluate(async () => {
            const { data, error } = await window.RadarSessionContext.service.client
                .from('registered_invoices').select('description,row_version')
                .eq('id', 'T4-CTX-NF-B').single();
            if (error) throw new Error(error.message);
            return data;
        });
        const updated = await other.evaluate(async description => {
            const { data, error } = await window.RadarSessionContext.service.client
                .from('registered_invoices').update({ description })
                .eq('id', 'T4-CTX-NF-B').select('description,row_version').single();
            if (error) throw new Error(error.message);
            return data;
        }, changedDescription);
        changed = true;
        expect(updated.description).toBe(changedDescription);
        expect(updated.row_version).toBeGreaterThan(original.row_version);

        // O primeiro Controlador confirma a prévia antiga pelo botão real.
        await save.click();
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('alert')).toContainText(
            'Os registros mudaram desde a conferência. Confira novamente antes de excluir.');
        await expect(save).toBeDisabled();
        expect(await snapshot(page)).toEqual(before);

        await dialog.getByRole('button', { name: 'Conferir novamente' }).click();
        await expect(dialog).toContainText(changedDescription);
        await expect(save).toBeEnabled();
        await dialog.getByRole('button', { name: 'Cancelar' }).click();
        await expect(dialog).toBeHidden();
        expect(await snapshot(page)).toEqual(before);
    } finally {
        try {
            if (changed) {
                const other = second.pages()[0];
                await other.evaluate(async description => {
                    const { error } = await window.RadarSessionContext.service.client
                        .from('registered_invoices').update({ description })
                        .eq('id', 'T4-CTX-NF-B');
                    if (error) throw new Error(error.message);
                }, original.description);
            }
        } finally {
            await second.close();
        }
    }
});

test('T4 real: excluir contexto pelo botão preserva programa/mês vizinhos e contato geral', async ({ page, browser }, testInfo) => {
    // A jornada inclui duas sessões independentes e uma recarga real.
    test.setTimeout(60_000);
    await login(page, 'controller');
    await openSchool(page);
    const before = await snapshot(page);
    expect(before.verifications).toContain('ESC-T4-CONTEXT::2026-05::BASIC');
    expect(before.invoices).toContain('T4-CTX-NF-A');
    expect(before.invoices).toContain('T4-CTX-NF-B');
    expect(before.invoices).toContain('T4-CTX-NF-NEIGHBOR');
    expect(before.invoices).toContain('T4-CTX-NF-JUNE');

    const dialog = await enablePilotAndOpen(page);
    await expect(dialog.getByRole('button', { name: 'Excluir estes lançamentos' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Excluir estes lançamentos' }).click();
    await expect(dialog).toBeHidden();
    // Prova de convergência imediata na UI ANTES do reload (AGENTS.md §7):
    // a exclusão precisa refletir na tela e preservar foco lógico sem exigir F5.
    await expect(page.locator('tr[data-program-header="BASIC"] .program-context-delete-button')).toHaveCount(0);
    await expect(page.locator('#prontuario-verif-rows')).not.toContainText('T4-CTX-001');
    await expect(page.locator('#prontuario-verif-rows')).not.toContainText('T4-CTX-002');
    const focusAfterDelete = await page.evaluate(() => ({
        tag: document.activeElement?.tagName || null,
        isBody: document.activeElement === document.body
    }));
    expect(focusAfterDelete.isBody, 'Foco não deve cair em document.body após exclusão').toBe(false);

    await page.reload();
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        window.RADAR_T4_CONTEXT_DELETION_PILOT = true;
        window.renderProntuario('ESC-T4-CONTEXT');
    });
    await expect(page.locator('tr[data-program-header="BASIC"] .program-context-delete-button')).toHaveCount(0);
    const after = await snapshot(page);

    expect(after.verifications).not.toContain('ESC-T4-CONTEXT::2026-05::BASIC');
    expect(after.verifications).toEqual([
        'ESC-T4-CONTEXT::2026-05::CONECTADA',
        'ESC-T4-CONTEXT::2026-06::BASIC'
    ]);
    expect(after.invoices).toEqual(['T4-CTX-NF-JUNE', 'T4-CTX-NF-NEIGHBOR'].sort());
    expect(after.pendencies).toEqual(['T4-CTX-P-NEIGHBOR']);
    expect(after.contacts).toEqual(['T4-CTX-C-GENERAL']);
    expect(after.assets).toEqual([]);

    const second = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const other = await second.newPage();
        await login(other, 'federal_assistant');
        const independent = await snapshot(other);
        expect(independent).toEqual(after);
        await testInfo.attach('t4-context-preserved-neighbor', {
            body: await other.screenshot({ fullPage: false }), contentType: 'image/png'
        });
    } finally {
        await second.close();
    }
});
