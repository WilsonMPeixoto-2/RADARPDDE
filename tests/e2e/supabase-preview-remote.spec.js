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
  : {
      users: [],
      records: {},
      expectations: {
        tuaneSchools: [],
        alziraSchools: [],
        inventorySchools: [],
        allHmlPendencies: []
      }
    };
const users = Object.fromEntries(fixture.users.map(user => [user.key, user]));
const candidateSchools = [
  ...fixture.expectations.tuaneSchools,
  ...fixture.expectations.alziraSchools
];

const controllerPendencies = [...fixture.expectations.allHmlPendencies].sort();
const controllerSchools = [...candidateSchools].sort();

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

async function authenticated(browser, key) {
  const context = await browser.newContext();
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
      profileSwitcherHidden: true
    });

    if (key === 'technicalAdmin') {
      await expect(page.getByRole('heading', { name: 'Acesso técnico' })).toBeVisible();
      await expect(page.locator('.sidebar')).toBeHidden();
    } else {
      expect(await navigateSurfaces(page)).toBeGreaterThan(0);
    }

    await page.reload();
    await waitForApplication(page, user.profileId);
    await page.locator('#auth-logout-button').click();
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await expect(page.locator('#radar-auth-status')).toContainText(/sessão/i);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('administrador técnico consulta toda a massa HML e a auditoria', async ({ browser }) => {
  const { context, page, errors } = await authenticated(browser, 'technicalAdmin');
  const result = await page.evaluate(async () => {
    const client = window.RadarSessionContext.service.client;
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const audit = await client.from('audit_events').select('id').limit(1);
    return {
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      pendencyError: pendencies.error?.code || null,
      auditReadable: Array.isArray(audit.data),
      auditError: audit.error?.code || null
    };
  });
  expect(result.pendencies).toEqual([...fixture.expectations.allHmlPendencies].sort());
  expect(result.pendencyError).toBeNull();
  expect(result.auditReadable).toBe(true);
  expect(result.auditError).toBeNull();
  expect(errors).toEqual([]);
  await context.close();
});

async function controllerScenario(browser, key, contactId, contactSchool, pendencyId) {
  const { context, page, errors, user } = await authenticated(browser, key);
  const result = await page.evaluate(async input => {
    const client = window.RadarSessionContext.service.client;
    const schools = await client.from('schools').select('id').in('id', input.candidateSchools);
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const allowed = await client.from('pendency_contacts').insert({
      id: input.contactId,
      school_id: input.contactSchool,
      pendency_id: input.pendencyId,
      contact_type: 'Telefone',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${input.runId}] cobertura colaborativa entre carteiras`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: input.runId, collaborativeCoverage: true },
      created_by: input.userId
    }).select('id, created_by').single();
    return {
      schools: (schools.data || []).map(row => row.id).sort(),
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      contactId: allowed.data?.id || null,
      createdBy: allowed.data?.created_by || null,
      contactError: allowed.error?.code || null
    };
  }, {
    candidateSchools,
    contactId,
    contactSchool,
    pendencyId,
    runId: fixture.runId,
    userId: user.userId
  });
  expect(result.schools).toEqual(controllerSchools);
  expect(result.pendencies).toEqual(controllerPendencies);
  expect(result.contactId).toBe(contactId);
  expect(result.createdBy).toBe(user.userId);
  expect(result.contactError).toBeNull();
  expect(errors).toEqual([]);
  await context.close();
}

test('controladora Tuane acessa toda a 4ª CRE e cobre a carteira de Alzira', async ({ browser }) => {
  await controllerScenario(
    browser,
    'controllerTuane',
    fixture.records.tuaneDeniedContact,
    '04.31.601',
    'HML-PEN-ALZIRA-RESOLVED'
  );
});

test('controladora Alzira acessa toda a 4ª CRE e cobre a carteira de Tuane', async ({ browser }) => {
  await controllerScenario(
    browser,
    'controllerAlzira',
    fixture.records.alziraContact,
    '04.11.001',
    'HML-PEN-TUANE-OPEN'
  );
});

test('assistente federal vê toda a massa e registra contato', async ({ browser }) => {
  const { context, page, errors, user } = await authenticated(browser, 'assistant');
  const result = await page.evaluate(async input => {
    const client = window.RadarSessionContext.service.client;
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const invoices = await client.from('registered_invoices').select('id').like('id', 'HML-%');
    const assets = await client.from('assets').select('id').like('id', 'HML-%');
    const contact = await client.from('pendency_contacts').insert({
      id: input.id,
      school_id: '04.31.601',
      pendency_id: 'HML-PEN-ALZIRA-RESOLVED',
      contact_type: 'E-mail',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${input.runId}] contato da Assistente`,
      official_charge: true,
      payload: { homologation: true, hmlRunId: input.runId },
      created_by: input.userId
    }).select('id').single();
    return {
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      invoices: (invoices.data || []).map(row => row.id),
      assets: (assets.data || []).map(row => row.id),
      contactId: contact.data?.id || null,
      contactError: contact.error?.code || null
    };
  }, { id: fixture.records.assistantContact, runId: fixture.runId, userId: user.userId });
  expect(result.pendencies).toEqual([...fixture.expectations.allHmlPendencies].sort());
  expect(result.invoices).toHaveLength(3);
  expect(result.assets).toHaveLength(2);
  expect(result.contactId).toBe(fixture.records.assistantContact);
  expect(result.contactError).toBeNull();
  expect(errors).toEqual([]);
  await context.close();
});

test('inventário vê escolas com bens e respeita o escopo', async ({ browser }) => {
  const { context, page, errors } = await authenticated(browser, 'inventory');
  const result = await page.evaluate(async input => {
    const client = window.RadarSessionContext.service.client;
    const schools = await client.from('schools').select('id').in('id', input.candidateSchools);
    const allowed = await client.from('assets').insert({
      id: input.allowedId,
      school_id: '04.11.001',
      competence_id: null,
      description: `[HML ${input.runId}] bem temporário do Inventário`,
      expense_type: 'permanente',
      invoice_number: `HML-E2E-${input.runId}`,
      amount: 1,
      status: 'Não encaminhada',
      inventory_process: '',
      notes: 'Registro temporário removido ao final do gate.',
      payload: { homologation: true, hmlRunId: input.runId }
    }).select('id').single();
    const denied = await client.from('assets').insert({
      id: input.deniedId,
      school_id: '04.11.002',
      competence_id: null,
      description: `[HML ${input.runId}] tentativa bloqueada do Inventário`,
      expense_type: 'permanente',
      invoice_number: `HML-E2E-DENIED-${input.runId}`,
      amount: 1,
      status: 'Não encaminhada',
      inventory_process: '',
      notes: '',
      payload: { homologation: true, hmlRunId: input.runId }
    }).select('id');
    return {
      schools: (schools.data || []).map(row => row.id).sort(),
      allowedId: allowed.data?.id || null,
      allowedError: allowed.error?.code || null,
      deniedRows: denied.data || [],
      deniedError: denied.error?.code || null
    };
  }, {
    candidateSchools,
    allowedId: fixture.records.inventoryAsset,
    deniedId: fixture.records.inventoryDeniedAsset,
    runId: fixture.runId
  });
  expect(result.schools).toEqual([...fixture.expectations.inventorySchools].sort());
  expect(result.allowedId).toBe(fixture.records.inventoryAsset);
  expect(result.allowedError).toBeNull();
  expect(result.deniedRows).toEqual([]);
  expect(typeof result.deniedError).toBe('string');
  expect(errors).toEqual([]);
  await context.close();
});

test('Gestão SME consulta visão global e não executa escrita operacional', async ({ browser }) => {
  const { context, page, errors, user } = await authenticated(browser, 'sme');
  const result = await page.evaluate(async input => {
    const client = window.RadarSessionContext.service.client;
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const audit = await client.from('audit_events').select('id').limit(1);
    const denied = await client.from('pendency_contacts').insert({
      id: input.id,
      school_id: '04.11.001',
      pendency_id: 'HML-PEN-TUANE-OPEN',
      contact_type: 'Telefone',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${input.runId}] tentativa bloqueada da Gestão SME`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: input.runId },
      created_by: input.userId
    }).select('id');
    return {
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      auditReadable: Array.isArray(audit.data),
      auditError: audit.error?.code || null,
      deniedRows: denied.data || [],
      deniedError: denied.error?.code || null
    };
  }, { id: fixture.records.smeDeniedContact, runId: fixture.runId, userId: user.userId });
  expect(result.pendencies).toEqual([...fixture.expectations.allHmlPendencies].sort());
  expect(result.auditReadable).toBe(true);
  expect(result.auditError).toBeNull();
  expect(result.deniedRows).toEqual([]);
  expect(typeof result.deniedError).toBe('string');
  expect(errors).toEqual([]);
  await context.close();
});
