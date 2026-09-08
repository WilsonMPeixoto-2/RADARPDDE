'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  installBootstrapObserver,
  markMilestone,
  readBootstrapObservation,
  sanitizeDiagnosticReport,
  summarizeCoverageEntries,
  median
} = require('../support/desktop-bootstrap-observer.js');

const enabled = process.env.RADAR_E2E_DESKTOP_BOOTSTRAP_OBSERVABILITY === '1';
test.skip(!enabled, 'Diagnóstico executado somente pelo gate isolado de observabilidade desktop.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && password.length < 24) {
  throw new Error('Credencial efêmera local ausente para o diagnóstico desktop.');
}

const users = {
  controller: fixtures.find(item => item.profileId === 'controller' && item.active),
  technicalAdmin: fixtures.find(item => item.profileId === 'technical_admin' && item.active)
};
const outputDir = path.resolve('test-results/desktop-bootstrap-observability');
const outputFile = path.join(outputDir, 'desktop-bootstrap-observability.json');

function errorCounter(page) {
  let count = 0;
  page.on('pageerror', () => { count += 1; });
  page.on('console', message => {
    if (message.type() === 'error') count += 1;
  });
  return () => count;
}

function milestoneAt(report, name) {
  return report.milestones.find(item => item.name === name)?.atMs ?? null;
}

function relativeMilestones(report) {
  const login = milestoneAt(report, 'login-submit-start');
  if (login == null) return [];
  return report.milestones
    .filter(item => item.atMs >= login)
    .map(item => ({ name: item.name, atMs: Math.round((item.atMs - login) * 1000) / 1000 }));
}

async function signInObserved(page, user) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(user.email);
  await page.locator('#radar-auth-password').fill(password);
  await markMilestone(page, 'login-submit-start');
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
      && window.RadarAuthContext?.authorization?.role === expectedRole
      && window.RadarCompetenceContext?.isInitialized?.() === true
      && window.__radarNavigationHistoryInstalled === true
  ), user.profileId, { timeout: 45000 });
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
  await page.waitForFunction(() => (
    window.__RADAR_BOOTSTRAP_OBSERVER__?.snapshot?.().milestones
      ?.some(item => item.name === 'dashboard-usable') === true
  ), null, { timeout: 10000 });
}

async function visitAllDesktopSurfaces(page) {
  const scenarios = [
    ['controlador', ['dashboard', 'escolas', 'competencias', 'pendencias', 'inventario', 'auditoria']],
    ['assistente', ['dashboard', 'escolas', 'competencias', 'pendencias', 'inventario', 'auditoria', 'equipe']],
    ['sme', ['dashboard', 'escolas', 'competencias', 'pendencias', 'inventario', 'auditoria', 'sme-config']],
    ['inventario', ['dashboard', 'escolas', 'inventario']]
  ];
  const visited = [];
  for (const [profile, views] of scenarios) {
    await page.evaluate(value => window.switchProfile(value), profile);
    for (const view of views) {
      await page.evaluate(value => window.switchView(value), view);
      await expect(page.locator('#main-container')).toBeVisible();
      await page.waitForTimeout(60);
      visited.push(`${profile}:${view}`);
    }
  }
  return visited;
}

function sanitizeRun(raw, { kind, profile, iteration = 0, coverage = [] } = {}) {
  const milestones = relativeMilestones(raw);
  const login = milestoneAt(raw, 'login-submit-start');
  const dashboard = milestoneAt(raw, 'dashboard-usable');
  const totalDurationMs = login != null && dashboard != null ? dashboard - login : 0;
  return sanitizeDiagnosticReport({
    run: { kind, profile, iteration, totalDurationMs },
    milestones,
    requests: raw.requests,
    resources: raw.resources,
    timers: raw.timers,
    longTasks: raw.longTasks,
    coverage
  });
}

function sanitizedDynamicResources(raw, profile) {
  return sanitizeDiagnosticReport({
    run: { kind: 'dynamic-dom-resources', profile },
    resources: (raw.resourcesAdded || []).map(item => ({
      type: item.type,
      url: item.url,
      durationMs: 0,
      transferSize: 0
    }))
  });
}

function aggregateMilestoneMedians(runs) {
  const names = new Set(runs.flatMap(run => run.milestones.map(item => item.name)));
  return [...names].sort().map(name => ({
    name,
    medianAtMs: median(runs.map(run => run.milestones.find(item => item.name === name)?.atMs).filter(Number.isFinite))
  }));
}

function assertNoSecrets(serialized) {
  expect(serialized).not.toContain(password);
  for (const user of fixtures) {
    if (user?.email) expect(serialized).not.toContain(user.email);
    if (user?.id) expect(serialized).not.toContain(user.id);
    if (user?.profileRowId) expect(serialized).not.toContain(user.profileRowId);
  }
}

function assertSanitized(serialized) {
  assertNoSecrets(serialized);
  expect(serialized).not.toMatch(/[?](?:select|school_id|grant_type|apikey|token|email)=/i);
  expect(serialized).not.toMatch(/requestBody|responseBody|payload|password|service_role/i);
}

async function timingRun(browser, iteration) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = errorCounter(page);
  await installBootstrapObserver(page, { observeTimers: false });
  const user = users.controller;
  await signInObserved(page, user);
  const raw = await readBootstrapObservation(page);
  expect(errors()).toBe(0);
  await context.close();
  return sanitizeRun(raw, {
    kind: 'login-to-dashboard-timing',
    profile: user.profileId,
    iteration
  });
}

async function loadGraphRun(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = errorCounter(page);
  await installBootstrapObserver(page, { observeTimers: true });
  const user = users.technicalAdmin;
  await signInObserved(page, user);
  const visited = await visitAllDesktopSurfaces(page);
  const raw = await readBootstrapObservation(page);
  expect(errors()).toBe(0);
  await context.close();
  return {
    visitedSurfaceCount: visited.length,
    runtime: sanitizeRun(raw, {
      kind: 'desktop-load-graph',
      profile: user.profileId
    }),
    dynamicDom: sanitizedDynamicResources(raw, user.profileId)
  };
}

async function coverageRun(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = errorCounter(page);
  await installBootstrapObserver(page, { observeTimers: false });
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });
  const user = users.technicalAdmin;
  await signInObserved(page, user);
  const visited = await visitAllDesktopSurfaces(page);
  const js = await page.coverage.stopJSCoverage();
  const css = await page.coverage.stopCSSCoverage();
  const coverage = [
    ...summarizeCoverageEntries(js, 'script'),
    ...summarizeCoverageEntries(css, 'style')
  ].filter(item => item.url.startsWith('http://127.0.0.1:4175/') || item.url.startsWith('/'));
  const raw = await readBootstrapObservation(page);
  expect(errors()).toBe(0);
  await context.close();
  return {
    visitedSurfaceCount: visited.length,
    report: sanitizeRun(raw, {
      kind: 'desktop-surface-coverage',
      profile: user.profileId,
      coverage
    })
  };
}

test('registros internos atrasados não bloqueiam Dashboard e a própria tela aguarda dados completos', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = errorCounter(page);
  await installBootstrapObserver(page, { observeTimers: false });

  let releaseAdministrativeLogs;
  const administrativeLogsReleased = new Promise(resolve => {
    releaseAdministrativeLogs = resolve;
  });
  let administrativeLogReads = 0;
  await page.route('**/rest/v1/administrative_logs**', async route => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    administrativeLogReads += 1;
    await administrativeLogsReleased;
    await route.continue();
  });

  await signInObserved(page, users.controller);
  expect(administrativeLogReads).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.RadarDataContext?.ready === true)).toBe(true);
  expect(await page.evaluate(() => window.RadarApplicationReadiness?.isReady?.('audit-data') === true)).toBe(false);

  await page.evaluate(() => window.switchView('auditoria'));
  await expect(page.locator('#main-container')).toContainText('Carregando registros internos…');

  releaseAdministrativeLogs();
  await page.waitForFunction(() => window.RadarApplicationReadiness?.isReady?.('audit-data') === true, null, {
    timeout: 15000
  });
  await expect(page.locator('#main-container')).toContainText('Registros Internos');
  await expect(page.locator('#main-container')).not.toContainText('Carregando registros internos…');
  expect(errors()).toBe(0);
  await context.close();
});

test('mede bootstrap autenticado desktop sem alterar o comportamento da aplicação', async ({ browser }) => {
  expect(users.controller?.email).toBeTruthy();
  expect(users.technicalAdmin?.email).toBeTruthy();

  const timingRuns = [];
  for (let iteration = 1; iteration <= 3; iteration += 1) {
    timingRuns.push(await timingRun(browser, iteration));
  }
  const loadGraph = await loadGraphRun(browser);
  const coverage = await coverageRun(browser);

  const result = {
    schemaVersion: 1,
    target: 'current-branch-local-ui-with-disposable-real-supabase',
    desktopOnly: true,
    timing: {
      iterations: timingRuns,
      medianLoginToDashboardMs: median(timingRuns.map(run => run.run.totalDurationMs)),
      milestoneMedians: aggregateMilestoneMedians(timingRuns)
    },
    loadGraph,
    coverage
  };

  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  assertSanitized(serialized);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, serialized, 'utf8');

  expect(result.timing.medianLoginToDashboardMs).toBeGreaterThan(0);
  expect(result.loadGraph.visitedSurfaceCount).toBeGreaterThan(0);
  expect(result.coverage.visitedSurfaceCount).toBeGreaterThan(0);
  expect(result.coverage.report.coverage.length).toBeGreaterThan(0);
});
