const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const fixtureFile = process.env.RADAR_HML_FIXTURE_FILE;
const password = process.env.RADAR_HML_PASSWORD || '';
if (!fixtureFile || !fs.existsSync(fixtureFile)) {
  throw new Error('Fixture remota de homologação ausente.');
}
if (password.length < 24) throw new Error('Senha efêmera da homologação ausente.');

const fixture = JSON.parse(fs.readFileSync(path.resolve(fixtureFile), 'utf8'));
const users = Object.fromEntries(fixture.users.map(user => [user.key, user]));
const candidateSchools = [
  ...fixture.expectations.tuaneSchools,
  ...fixture.expectations.alziraSchools
];

test.describe.configure({ mode: 'serial' });

function attachErrorCollection(page) {
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

async function openAuthenticatedPage(browser, key) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = attachErrorCollection(page);
  const user = users[key];
  await signIn(page, user);
  await waitForApplication(page, user.profileId);
  return { context, page, errors, user };
}

async function navigateVisibleSurfaces(page) {
  const navigation = page.locator('.sidebar .nav-item:visible');
  const total = await navigation.count();
  for (let index = 0; index < total; index += 1) {
    const item = navigation.nth(index);
    await item.click();
    await expect(page.locator('#main-container')).toBeVisible();
    await page.waitForTimeout(75);
  }
  return total;
}

for (const key of ['technicalAdmin', 'assistant', 'controllerTuane', 'controllerAlzira', 'inventory', 'sme']) {
  test(`${key} autentica, preserva sessão, percorre superfícies e encerra acesso`, async ({ browser }) => {
    const { context, page, errors, user } = await openAuthenticatedPage(browser, key);

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
      expect(await navigateVisibleSurfaces(page)).toBeGreaterThan(0);
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
  const { context, page, errors } = await openAuthenticatedPage(browser, 'technicalAdmin');
  const result = await page.evaluate(async () => {
    const client = window.RadarSessionContext.service.client;
    const pendencies = await client.from('pendencies').select('id, school_id').like('id', 'HML-%');
    const audit = await client.from('audit_events').select('id').limit(1);
    return {
      pendencyIds: (pendencies.data || []).map(row => row.id).sort(),
      pendencyError: pendencies.error?.code || null,
      auditReadable: Array.isArray(audit.data),
      auditError: audit.error?.code || null
    };
  });
  expect(result.pendencyError).toBeNull();
  expect(result.pendencyIds).toEqual([...fixture.expectations.allHmlPendencies].sort());
  expect(result.auditReadable).toBe(true);
  expect(result.auditError).toBeNull();
  expect(errors).toEqual([]);
  await context.close();
});

test('controladora Tuane vê e escreve somente em sua carteira', async ({ browser }) => {
  const { context, page, errors, user } = await openAuthenticatedPage(browser, 'controllerTuane');
  const result = await page.evaluate(async ({ candidateSchools, fixture, user }) => {
    const client = window.RadarSessionContext.service.client;
    const schools = await client.from('schools').select('id').in('id', candidateSchools);
    const pendencies = await client.from('pendencies').select('id, school_id').like('id', 'HML-%');
    const contactDate = new Date().toISOString().slice(0, 10);
    const allowed = await client.from('pendency_contacts').insert({
      id: fixture.records.tuaneContact,
      school_id: '04.11.001',
      pendency_id: 'HML-PEN-TUANE-OPEN',
      contact_type: 'Telefone',
      contact_date: contactDate,
      description: `[HML ${fixture.runId}] contato permitido da controladora Tuane`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: fixture.runId },
      created_by: user.userId
    }).select('id').single();
    const denied = await client.from('pendency_contacts').insert({
      id: fixture.records.tuaneDeniedContact,
      school_id: '04.31.601',
      pendency_id: 'HML-PEN-ALZIRA-RESOLVED',
      contact_type: 'Telefone',
      contact_date: contactDate,
      description: `[HML ${fixture.runId}] tentativa bloqueada da controladora Tuane`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: fixture.runId },
      created_by: user.userId
    }).select('id');
    return {
      schools: (schools.data || []).map(row => row.id).sort(),
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      allowedId: allowed.data?.id || null,
      allowedError: allowed.error?.code || null,
      deniedRows: denied.data || [],
      deniedError: denied.error?.code || null
    };
  }, { candidateSchools, fixture, user });
  expect(result.schools).toEqual([...fixture.expectations.tuaneSchools].sort());
  expect(result.pendencies).toEqual(['HML-PEN-TUANE-OPEN', 'HML-PEN-TUANE-REANALYSIS']);
  expect(result.allowedId).toBe(fixture.records.tuaneContact);
  expect(result.allowedError).toBeNull();
  expect(result.deniedRows).toEqual([]);
  expect(typeof result.deniedError).toBe('string');
  expect(errors).toEqual([]);
  await context.close();
});

test('controladora Alzira vê e escreve somente em sua carteira', async ({ browser }) => {
  const { context, page, errors, user } = await openAuthenticatedPage(browser, 'controllerAlzira');
  const result = await page.evaluate(async ({ candidateSchools, fixture, user }) => {
    const client = window.RadarSessionContext.service.client;
    const schools = await client.from('schools').select('id').in('id', candidateSchools);
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const allowed = await client.from('pendency_contacts').insert({
      id: fixture.records.alziraContact,
      school_id: '04.31.601',
      pendency_id: 'HML-PEN-ALZIRA-RESOLVED',
      contact_type: 'E-mail',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${fixture.runId}] contato permitido da controladora Alzira`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: fixture.runId },
      created_by: user.userId
    }).select('id').single();
    return {
      schools: (schools.data || []).map(row => row.id).sort(),
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      allowedId: allowed.data?.id || null,
      allowedError: allowed.error?.code || null
    };
  }, { candidateSchools, fixture, user });
  expect(result.schools).toEqual([...fixture.expectations.alziraSchools].sort());
  expect(result.pendencies).toEqual(['HML-PEN-ALZIRA-CANCELED', 'HML-PEN-ALZIRA-RESOLVED']);
  expect(result.allowedId).toBe(fixture.records.alziraContact);
  expect(result.allowedError).toBeNull();
  expect(errors).toEqual([]);
  await context.close();
});

test('assistente federal vê toda a massa e registra contato em qualquer carteira', async ({ browser }) => {
  const { context, page, errors, user } = await openAuthenticatedPage(browser, 'assistant');
  const result = await page.evaluate(async ({ fixture, user }) => {
    const client = window.RadarSessionContext.service.client;
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const invoices = await client.from('registered_invoices').select('id').like('id', 'HML-%');
    const assets = await client.from('assets').select('id').like('id', 'HML-%');
    const contact = await client.from('pendency_contacts').insert({
      id: fixture.records.assistantContact,
      school_id: '04.31.601',
      pendency_id: 'HML-PEN-ALZIRA-RESOLVED',
      contact_type: 'E-mail',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${fixture.runId}] contato da Assistente`,
      official_charge: true,
      payload: { homologation: true, hmlRunId: fixture.runId },
      created_by: user.userId
    }).select('id').single();
    return {
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      invoices: (invoices.data || []).map(row => row.id).sort(),
      assets: (assets.data || []).map(row => row.id).sort(),
      contactId: contact.data?.id || null,
      contactError: contact.error?.code || null
    };
  }, { fixture, user });
  expect(result.pendencies).toEqual([...fixture.expectations.allHmlPendencies].sort());
  expect(result.invoices).toHaveLength(3);
  expect(result.assets).toHaveLength(2);
  expect(result.contactId).toBe(fixture.records.assistantContact);
  expect(result.contactError).toBeNull();
  expect(errors).toEqual([]);
  await context.close();
});

test('inventário vê escolas com bens, inclui bem autorizado e é bloqueado fora do escopo', async ({ browser }) => {
  const { context, page, errors } = await openAuthenticatedPage(browser, 'inventory');
  const result = await page.evaluate(async ({ candidateSchools, fixture }) => {
    const client = window.RadarSessionContext.service.client;
    const schools = await client.from('schools').select('id').in('id', candidateSchools);
    const allowed = await client.from('assets').insert({
      id: fixture.records.inventoryAsset,
      school_id: '04.11.001',
      competence_id: null,
      description: `[HML ${fixture.runId}] bem temporário do Inventário`,
      expense_type: 'permanente',
      invoice_number: `HML-E2E-${fixture.runId}`,
      amount: 1,
      status: 'Não encaminhada',
      inventory_process: '',
      notes: 'Registro temporário removido ao final do gate.',
      payload: { homologation: true, hmlRunId: fixture.runId }
    }).select('id').single();
    const denied = await client.from('assets').insert({
      id: fixture.records.inventoryDeniedAsset,
      school_id: '04.11.002',
      competence_id: null,
      description: `[HML ${fixture.runId}] tentativa bloqueada do Inventário`,
      expense_type: 'permanente',
      invoice_number: `HML-E2E-DENIED-${fixture.runId}`,
      amount: 1,
      status: 'Não encaminhada',
      inventory_process: '',
      notes: '',
      payload: { homologation: true, hmlRunId: fixture.runId }
    }).select('id');
    return {
      schools: (schools.data || []).map(row => row.id).sort(),
      allowedId: allowed.data?.id || null,
      allowedError: allowed.error?.code || null,
      deniedRows: denied.data || [],
      deniedError: denied.error?.code || null
    };
  }, { candidateSchools, fixture });
  expect(result.schools).toEqual([...fixture.expectations.inventorySchools].sort());
  expect(result.allowedId).toBe(fixture.records.inventoryAsset);
  expect(result.allowedError).toBeNull();
  expect(result.deniedRows).toEqual([]);
  expect(typeof result.deniedError).toBe('string');
  expect(errors).toEqual([]);
  await context.close();
});

test('Gestão SME consulta visão global e não executa escrita operacional', async ({ browser }) => {
  const { context, page, errors, user } = await openAuthenticatedPage(browser, 'sme');
  const result = await page.evaluate(async ({ fixture, user }) => {
    const client = window.RadarSessionContext.service.client;
    const pendencies = await client.from('pendencies').select('id').like('id', 'HML-%');
    const audit = await client.from('audit_events').select('id').limit(1);
    const denied = await client.from('pendency_contacts').insert({
      id: fixture.records.smeDeniedContact,
      school_id: '04.11.001',
      pendency_id: 'HML-PEN-TUANE-OPEN',
      contact_type: 'Telefone',
      contact_date: new Date().toISOString().slice(0, 10),
      description: `[HML ${fixture.runId}] tentativa bloqueada da Gestão SME`,
      official_charge: false,
      payload: { homologation: true, hmlRunId: fixture.runId },
      created_by: user.userId
    }).select('id');
    return {
      pendencies: (pendencies.data || []).map(row => row.id).sort(),
      auditReadable: Array.isArray(audit.data),
      auditError: audit.error?.code || null,
      deniedRows: denied.data || [],
      deniedError: denied.error?.code || null
    };
  }, { fixture, user });
  expect(result.pendencies).toEqual([...fixture.expectations.allHmlPendencies].sort());
  expect(result.auditReadable).toBe(true);
  expect(result.auditError).toBeNull();
  expect(result.deniedRows).toEqual([]);
  expect(typeof result.deniedError).toBe('string');
  expect(errors).toEqual([]);
  await context.close();
});
