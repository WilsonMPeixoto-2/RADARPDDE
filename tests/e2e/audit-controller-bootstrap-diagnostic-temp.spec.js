const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local, Auth e RLS reais.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function signIn(page, profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
  ), profileId, { timeout: 30000 });
}

test('captura a primeira falha ao abrir o Controlador após novo exercício global', async ({ browser }) => {
  const smeContext = await browser.newContext();
  const smePage = await smeContext.newPage();
  await signIn(smePage, 'sme_management');
  await expect(smePage.locator('#app-layout')).toBeVisible({ timeout: 15000 });

  const created = await smePage.evaluate(async stamp => {
    const usedYears = new Set((config.exercicios || []).map(String));
    const year = ['2099', '2098', '2097', '2096', '2095']
      .find(candidate => !usedYears.has(candidate));
    if (!year) throw new Error('Não há exercício reservado disponível.');
    const services = window.RadarApplicationServices;
    await services.configuration.createExercise({ year, initialMonth: '03' });
    await services.configuration.saveCalendar({
      closingCompetence: `${year}-04`,
      bonusWindowExtended: false
    });
    return { year, stamp };
  }, Date.now());
  await smeContext.close();

  const controllerContext = await browser.newContext();
  const controllerPage = await controllerContext.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  controllerPage.on('pageerror', error => {
    pageErrors.push(`${error.name}: ${error.message}\n${error.stack || ''}`);
  });
  controllerPage.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await signIn(controllerPage, 'controller');
  await controllerPage.waitForTimeout(2500);

  const diagnostics = await controllerPage.evaluate(() => {
    const app = document.getElementById('app-layout');
    const status = document.getElementById('radar-auth-status');
    return {
      dataReady: window.RadarDataContext?.ready === true,
      authRole: window.RadarAuthContext?.authorization?.role || null,
      authGatePhase: window.RadarAuthGate?.phase || null,
      authStatus: status?.textContent || '',
      authStatusType: status?.dataset?.type || '',
      htmlAuthRequired: document.documentElement.classList.contains('radar-auth-required'),
      appHidden: app?.hidden ?? null,
      appInert: app?.inert ?? null,
      appDisplay: app ? getComputedStyle(app).display : null,
      activeCompetence: typeof activeCompetenciaKey === 'undefined' ? null : activeCompetenciaKey,
      configClosing: typeof config === 'undefined' ? null : config.competenciaFechamento,
      competenceKeys: typeof COMPETENCIAS === 'undefined'
        ? []
        : COMPETENCIAS.map(item => item.key),
      currentProfile: typeof currentProfile === 'undefined' ? null : currentProfile,
      currentView: typeof currentView === 'undefined' ? null : currentView,
      lastNavigationError: window.RADAR_LAST_NAVIGATION_ERROR?.message || null
    };
  });

  const evidence = { created, diagnostics, pageErrors, consoleErrors };
  fs.mkdirSync(path.resolve('test-results/controller-bootstrap-diagnostic'), { recursive: true });
  fs.writeFileSync(
    path.resolve('test-results/controller-bootstrap-diagnostic/evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8'
  );
  console.log('AUDIT_CONTROLLER_BOOTSTRAP_DIAGNOSTIC', JSON.stringify(evidence));

  expect(pageErrors, JSON.stringify(evidence)).toEqual([]);
  await expect(controllerPage.locator('#app-layout')).toBeVisible({ timeout: 15000 });
  await controllerContext.close();
});
