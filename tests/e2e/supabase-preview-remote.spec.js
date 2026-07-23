const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const remoteEnabled = process.env.RADAR_E2E_SUPABASE_REMOTE === '1';
test.skip(!remoteEnabled, 'Esta suíte exige o workflow seguro de homologação do Preview Supabase remoto.');

const fixtureFile = process.env.RADAR_HML_FIXTURE_FILE;
const password = process.env.RADAR_HML_PASSWORD || '';
if (remoteEnabled && (!fixtureFile || !fs.existsSync(fixtureFile))) {
  throw new Error('Fixture remota de homologação ausente.');
}
if (remoteEnabled && password.length < 24) {
  throw new Error('Senha efêmera da homologação ausente.');
}

const fixture = remoteEnabled
  ? JSON.parse(fs.readFileSync(path.resolve(fixtureFile), 'utf8'))
  : { users: [], school: {}, records: {}, values: {} };
const users = Object.fromEntries(fixture.users.map(user => [user.key, user]));

test.describe.configure({ mode: 'serial' });

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function signIn(page, user) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(user.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
}

async function waitForApplication(page, role) {
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
  ), role, { timeout: 30000 });
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
  await expect(page.locator('#auth-logout-button')).toBeVisible();
}

async function authenticated(browser, key, options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = collectErrors(page);
  const user = users[key];
  await signIn(page, user);
  await waitForApplication(page, user.profileId);
  return { context, page, errors, user };
}

async function navigateSurfaces(page) {
  const items = page.locator('.sidebar .nav-item:visible');
  const count = await items.count();
  for (let index = 0; index < count; index += 1) {
    await items.nth(index).click();
    await expect(page.locator('#main-container')).toBeVisible();
  }
  return count;
}

async function openFixtureSchool(page) {
  await page.locator('#nav-escolas').click();
  const search = page.locator('#escola-search-input');
  await expect(search).toBeVisible();
  await search.fill(fixture.school.designation);
  const row = page.locator('#main-container table.data-table tbody tr').filter({
    hasText: fixture.school.denomination
  });
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: 'Ver Unidade', exact: true }).click();
  await expect(page.getByRole('heading', { name: new RegExp(fixture.school.denomination) })).toBeVisible();
}

function verificationRow(page, documentKey) {
  return page.locator(
    `#prontuario-verif-rows tr[data-program-id="${fixture.school.programId}"]`
      + `[data-document-key="${documentKey}"]`
  );
}

for (const key of ['technicalAdmin', 'assistant', 'controllerTuane', 'controllerAlzira', 'inventory', 'sme']) {
  test(`${key} autentica, preserva sessão, percorre superfícies e encerra acesso`, async ({ browser }) => {
    const { context, page, errors, user } = await authenticated(browser, key);
    const runtime = await page.evaluate(() => ({
      environment: window.RADAR_PDDE_CONFIG.environment,
      dataMode: window.RADAR_PDDE_CONFIG.dataMode,
      repository: window.RadarDataContext.capabilities.mode,
      role: window.RadarAuthContext.authorization.role,
      hasSessionInPublicContext: Object.hasOwn(window.RadarDataContext.authentication, 'session'),
      profileSwitcherHidden: document.querySelector('.profile-switcher')?.hidden
    }));
    expect(runtime).toEqual({
      environment: 'preview',
      dataMode: 'supabase-preview',
      repository: 'supabase',
      role: user.profileId,
      hasSessionInPublicContext: false,
      profileSwitcherHidden: key !== 'technicalAdmin'
    });

    expect(await navigateSurfaces(page)).toBeGreaterThan(0);
    await page.reload();
    await waitForApplication(page, user.profileId);
    await page.locator('#auth-logout-button').click();
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await expect(page.locator('#radar-auth-status')).toContainText(/sessão/i);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('administrador técnico navega em viewport móvel', async ({ browser }) => {
  const { context, page, errors } = await authenticated(browser, 'technicalAdmin', {
    viewport: { width: 412, height: 915 }
  });
  const menuButton = page.locator('#mobile-menu-button');
  await expect(menuButton).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  await menuButton.click();
  await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/);
  await page.locator('#nav-dashboard').click();
  await expect(page.locator('#main-container')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test('controladora executa operações reais pela interface e confirma persistência após recarga', async ({ browser }) => {
  const { context, page, errors } = await authenticated(browser, 'controllerTuane');
  await openFixtureSchool(page);

  await page.getByRole('button', { name: 'Editar Dados', exact: true }).click();
  await expect(page.locator('#modal-escola-edit')).toHaveClass(/show/);
  await page.locator('#edit-sici').fill(fixture.school.siciAfter);
  await page.locator('#form-escola-edit button[type="submit"]').click();
  await expect(page.locator('#modal-escola-edit')).not.toHaveClass(/show/);
  await expect(page.getByText(fixture.school.siciAfter, { exact: true })).toBeVisible();

  const noteRow = verificationRow(page, 'notaFiscal');
  await expect(noteRow).toHaveCount(1);
  await noteRow.getByRole('button', { name: 'Sim', exact: true }).click();
  await expect(noteRow.getByRole('button', { name: 'Adicionar Nota' })).toBeVisible();
  await noteRow.getByRole('button', { name: 'Adicionar Nota' }).click();
  await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
  await page.locator('#nota-desc').fill(fixture.values.invoiceDescription);
  await page.locator('#nota-tipo').selectOption('custeio');
  await page.locator('#nota-numero').fill(fixture.values.invoiceNumber);
  await page.locator('#nota-valor').fill('150.50');
  await page.locator('#form-dados-nota button[type="submit"]').click();
  await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
  await expect(verificationRow(page, 'notaFiscal')).toContainText(fixture.values.invoiceNumber);

  await page.locator('[data-tab="capital"]').click();
  const promptAnswers = [fixture.values.assetDescription, '2500', fixture.values.assetInvoiceNumber];
  const dialogHandler = async dialog => {
    const answer = promptAnswers.shift();
    if (dialog.type() === 'prompt') await dialog.accept(answer || '');
    else await dialog.accept();
  };
  page.on('dialog', dialogHandler);
  await page.getByRole('button', { name: 'Registrar Nova Compra', exact: true }).click();
  await expect(page.locator('#tab-capital tbody tr').filter({ hasText: fixture.values.assetDescription })).toBeVisible();
  page.off('dialog', dialogHandler);

  const assetRow = page.locator('#tab-capital tbody tr').filter({ hasText: fixture.values.assetDescription });
  await assetRow.getByRole('button', { name: 'Encaminhar', exact: true }).click();
  await expect(assetRow).toContainText('Encaminhada');

  await page.locator('[data-tab="verificacoes"]').click();
  const accountRow = verificationRow(page, 'extCC');
  await accountRow.locator('[data-action="open-document-pendency"]').click();
  const pendencyModal = page.locator('#modal-nova-pendencia');
  await expect(pendencyModal).toHaveClass(/show/);
  await pendencyModal.getByLabel('Documento ilegível', { exact: true }).check();
  await pendencyModal.locator('#pend-obs').fill(fixture.values.pendencyNote);
  await pendencyModal.locator('button[type="submit"]').click();
  await expect(pendencyModal).not.toHaveClass(/show/);

  const pendencyId = await page.evaluate(schoolId => {
    const item = pendencias.find(candidate => candidate.escolaId === schoolId && candidate.status === 'Aberta');
    if (!item) throw new Error('Pendência criada pela interface não foi carregada no estado.');
    return String(item.id);
  }, fixture.school.id);

  await page.locator('#nav-pendencias').click();
  const pendencyRow = page.locator(`[data-pendency-id="${pendencyId}"]:visible`).first();
  await expect(pendencyRow).toBeVisible();
  await pendencyRow.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
  const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
  await drawer.getByRole('button', { name: 'Registrar contato', exact: true }).click();
  const contactDialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
  await contactDialog.getByLabel('Canal').selectOption('Telefone');
  await contactDialog.getByLabel('Descrição do contato').fill(fixture.values.contactDescription);
  await contactDialog.getByRole('button', { name: 'Salvar contato', exact: true }).click();
  await expect(drawer).toContainText(fixture.values.contactDescription);

  await page.reload();
  await waitForApplication(page, users.controllerTuane.profileId);
  await openFixtureSchool(page);
  await expect(page.getByText(fixture.school.siciAfter, { exact: true })).toBeVisible();
  await expect(verificationRow(page, 'notaFiscal')).toContainText(fixture.values.invoiceNumber);
  await page.locator('[data-tab="capital"]').click();
  await expect(page.locator('#tab-capital tbody tr').filter({ hasText: fixture.values.assetDescription })).toContainText('Encaminhada');

  const persisted = await page.evaluate(async expected => {
    const client = window.RadarSessionContext.service.client;
    const [school, invoices, assets, pendenciesResult, contacts, verifications] = await Promise.all([
      client.from('schools').select('id,sici,row_version').eq('id', expected.schoolId).single(),
      client.from('registered_invoices').select('id,invoice_number,row_version').eq('school_id', expected.schoolId).eq('invoice_number', expected.invoiceNumber),
      client.from('assets').select('id,description,status,row_version').eq('school_id', expected.schoolId).eq('description', expected.assetDescription),
      client.from('pendencies').select('id,notes,status,row_version').eq('school_id', expected.schoolId).eq('notes', expected.pendencyNote),
      client.from('pendency_contacts').select('id,description,row_version').eq('school_id', expected.schoolId).eq('description', expected.contactDescription),
      client.from('verifications').select('id,row_version').eq('school_id', expected.schoolId)
    ]);
    return {
      errors: [school.error, invoices.error, assets.error, pendenciesResult.error, contacts.error, verifications.error]
        .filter(Boolean)
        .map(error => error.code || error.message),
      school: school.data,
      invoices: invoices.data || [],
      assets: assets.data || [],
      pendencies: pendenciesResult.data || [],
      contacts: contacts.data || [],
      verifications: verifications.data || []
    };
  }, {
    schoolId: fixture.school.id,
    invoiceNumber: fixture.values.invoiceNumber,
    assetDescription: fixture.values.assetDescription,
    pendencyNote: fixture.values.pendencyNote,
    contactDescription: fixture.values.contactDescription
  });

  expect(persisted.errors).toEqual([]);
  expect(persisted.school).toMatchObject({ id: fixture.school.id, sici: fixture.school.siciAfter });
  expect(persisted.school.row_version).toBeGreaterThan(0);
  expect(persisted.invoices).toHaveLength(1);
  expect(persisted.invoices[0].row_version).toBeGreaterThan(0);
  expect(persisted.assets).toHaveLength(1);
  expect(persisted.assets[0]).toMatchObject({ status: 'Encaminhada' });
  expect(persisted.assets[0].row_version).toBeGreaterThan(0);
  expect(persisted.pendencies).toHaveLength(1);
  expect(persisted.pendencies[0]).toMatchObject({ status: 'Aberta' });
  expect(persisted.contacts).toHaveLength(1);
  expect(persisted.verifications.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await context.close();
});

test('inventário conclui o bem pela interface e mantém o resultado após recarga', async ({ browser }) => {
  const { context, page, errors } = await authenticated(browser, 'inventory');
  await page.locator('#nav-inventario').click();
  const assetRow = page.locator('#main-container tbody tr').filter({ hasText: fixture.values.assetDescription }).first();
  await expect(assetRow).toBeVisible();
  await assetRow.getByRole('button', { name: /Marcar como Inventariado|Inventariar/ }).click();
  const modal = page.locator('#modal-inventario-confirm');
  await expect(modal).toHaveClass(/show/);
  await page.locator('#inventario-observacoes').fill(fixture.values.inventoryNote);
  await page.locator('#form-inventario-confirm button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);

  await page.reload();
  await waitForApplication(page, users.inventory.profileId);
  await page.locator('#nav-inventario').click();
  await expect(page.locator('#main-container tbody tr').filter({ hasText: fixture.values.assetDescription }).first()).toContainText('Inventariada');
  const stored = await page.evaluate(async expected => {
    const result = await window.RadarSessionContext.service.client
      .from('assets')
      .select('status,notes,inventoried_by_member_id,row_version')
      .eq('school_id', expected.schoolId)
      .eq('description', expected.description)
      .single();
    return { data: result.data, error: result.error?.code || null };
  }, { schoolId: fixture.school.id, description: fixture.values.assetDescription });
  expect(stored.error).toBeNull();
  expect(stored.data.status).toBe('Inventariada');
  expect(stored.data.notes).toContain(fixture.values.inventoryNote);
  expect(stored.data.inventoried_by_member_id).toBeTruthy();
  expect(stored.data.row_version).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await context.close();
});

test('Gestão SME enxerga a escola, não recebe ações operacionais e é bloqueada pela RLS', async ({ browser }) => {
  const { context, page, errors, user } = await authenticated(browser, 'sme');
  await openFixtureSchool(page);
  await expect(page.getByRole('button', { name: 'Editar Dados', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registrar Contato', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registrar Nova Compra', exact: true })).toHaveCount(0);

  const denied = await page.evaluate(async input => {
    const result = await window.RadarSessionContext.service.client.from('pendency_contacts').insert({
      id: input.id,
      school_id: input.schoolId,
      pendency_id: null,
      contact_type: 'Telefone',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${input.runId}] tentativa bloqueada da Gestão SME`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: input.runId },
      created_by: input.userId
    }).select('id');
    return { rows: result.data || [], error: result.error?.code || null };
  }, {
    id: fixture.records.deniedSmeContact,
    schoolId: fixture.school.id,
    runId: fixture.runId,
    userId: user.userId
  });
  expect(denied.rows).toEqual([]);
  expect(typeof denied.error).toBe('string');
  expect(errors).toEqual([]);
  await context.close();
});
