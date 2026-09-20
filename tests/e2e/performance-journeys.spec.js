'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  round,
  summarizeSamples,
  installNetworkObserver,
  installRuntimeHooks,
  resetObservers,
  readObservation
} = require('../support/performance-journey-observer.js');

const enabled = process.env.RADAR_E2E_PERFORMANCE_BASELINE === '1'
  && process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Baseline executado somente na pilha Supabase local autenticada da homologação integral.');
test.describe.configure({ mode: 'serial' });

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
const controller = fixtures.find(item => item.profileId === 'controller' && item.active);
if (enabled && (!controller || password.length < 24)) {
  throw new Error('Fixture do Controlador ou credencial efêmera ausente para baseline de performance.');
}

async function twoFrames(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function waitApplicationReady(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && window.RadarCompetenceContext?.isInitialized?.() === true
    && window.__radarNavigationHistoryInstalled === true
    && Boolean(window.RadarApplicationServices?.data)
  ), null, { timeout: 45000 });
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
  await expect(page.locator('#app-layout')).toBeVisible();
  await page.waitForFunction(() => (
    document.getElementById('nav-dashboard')?.classList.contains('active') === true
    && document.getElementById('main-container')?.childElementCount > 0
  ));
  if (window?.RadarProductExtensionsReady) {
    // eslint-disable-next-line no-undef
  }
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
  await twoFrames(page);
}

async function signIn(page, { measured = false } = {}) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(controller.email);
  await page.locator('#radar-auth-password').fill(password);
  if (measured) await resetObservers(page);
  const started = await page.evaluate(() => performance.now());
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitApplicationReady(page);
  const ended = await page.evaluate(() => performance.now());
  return { started, ended };
}

async function captureJourney(page, label, action, settle) {
  await resetObservers(page);
  const started = await page.evaluate(() => performance.now());
  await action();
  await settle();
  await twoFrames(page);
  const ended = await page.evaluate(() => performance.now());
  const observation = await readObservation(page);
  return {
    label,
    totalMs: round(ended - started),
    ...observation
  };
}

function extCCRow(page) {
  return page.locator(
    '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
  );
}

async function openLocalSchool(page) {
  await page.locator('#nav-escolas').click();
  await expect(page.getByRole('heading', { name: 'Resultado da carteira' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'Escola Local Autorizada' });
  await row.getByRole('link', { name: 'Ver Unidade', exact: true }).click();
  await expect(page).toHaveURL(/\/escolas\/ESC-LOCAL(?:[/?#]|$)/);
  await expect(extCCRow(page)).toBeVisible();
}

function aggregateByLabel(samples) {
  const labels = [...new Set(samples.map(item => item.label))];
  return Object.fromEntries(labels.map(label => {
    const selected = samples.filter(item => item.label === label);
    return [label, summarizeSamples(selected)];
  }));
}

test('mede jornadas críticas do baseline atual sem alterar runtime', async ({ browser }, testInfo) => {
  test.setTimeout(180000);
  const samples = [];

  // Login frio: três contextos independentes para reduzir ruído de uma única execução.
  for (let iteration = 1; iteration <= 3; iteration += 1) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await installNetworkObserver(page);
    const timing = await signIn(page, { measured: true });
    const observation = await readObservation(page);
    samples.push({
      label: 'login-dashboard-usable',
      iteration,
      totalMs: round(timing.ended - timing.started),
      ...observation
    });
    await context.close();
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await installNetworkObserver(page);
  await signIn(page);
  await installRuntimeHooks(page);

  // Quatro trocas reais de competência para mediana/p95.
  const competenceSequence = ['2026-08', '2026-05', '2026-08', '2026-05'];
  for (let index = 0; index < competenceSequence.length; index += 1) {
    const target = competenceSequence[index];
    samples.push(await captureJourney(
      page,
      'competence-change',
      () => page.locator('#global-competence-select').selectOption(target),
      async () => {
        await expect(page.locator('#global-competence-select')).toHaveValue(target);
        await page.waitForFunction(expected => (
          window.RadarCompetenceContext?.getState?.()?.activeKey === expected
          && document.getElementById('main-container')?.getAttribute('aria-busy') !== 'true'
        ), target);
      }
    ));
  }

  await page.locator('#nav-dashboard').click();
  await twoFrames(page);

  for (let iteration = 1; iteration <= 3; iteration += 1) {
    samples.push(await captureJourney(
      page,
      'dashboard-to-portfolio',
      () => page.locator('#nav-escolas').click(),
      () => expect(page.getByRole('heading', { name: 'Resultado da carteira' })).toBeVisible()
    ));

    samples.push(await captureJourney(
      page,
      'portfolio-to-prontuario',
      async () => {
        const row = page.getByRole('row').filter({ hasText: 'Escola Local Autorizada' });
        await row.getByRole('link', { name: 'Ver Unidade', exact: true }).click();
      },
      async () => {
        await expect(page).toHaveURL(/\/escolas\/ESC-LOCAL(?:[/?#]|$)/);
        await expect(extCCRow(page)).toBeVisible();
      }
    ));

    await page.locator('#nav-dashboard').click();
    await twoFrames(page);
  }

  for (let iteration = 1; iteration <= 3; iteration += 1) {
    samples.push(await captureJourney(
      page,
      'open-pendencies',
      () => page.locator('#nav-pendencias').click(),
      () => expect(page.getByRole('heading', { name: /Pendências operacionais/i })).toBeVisible()
    ));
    await page.locator('#nav-dashboard').click();
    await twoFrames(page);
  }

  await openLocalSchool(page);
  const original = await page.evaluate(() => (
    verificacoes?.['ESC-LOCAL']?.['2026-05_BASIC']?.bonificacao?.extCC || ''
  ));
  let current = original;
  for (let iteration = 1; iteration <= 3; iteration += 1) {
    const next = current === 'Sim' ? 'Não' : 'Sim';
    const beforeMetrics = await page.evaluate(() => (
      window.RadarOperationalWriteMetrics?.snapshot?.().length || 0
    ));
    const journey = await captureJourney(
      page,
      'write-bonification-stable',
      () => extCCRow(page).getByRole('button', { name: next, exact: true }).click(),
      async () => {
        await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
        const button = extCCRow(page).getByRole('button', { name: next, exact: true });
        await expect(button).toHaveClass(next === 'Sim' ? /active-sim/ : /active-nao/);
      }
    );
    const writeMetrics = await page.evaluate(offset => (
      (window.RadarOperationalWriteMetrics?.snapshot?.() || []).slice(offset)
    ), beforeMetrics);
    const metric = writeMetrics.at(-1)?.durations || {};
    samples.push({
      ...journey,
      writeRpcMs: Number.isFinite(metric.rpc) ? round(metric.rpc) : null,
      writeApplyMs: Number.isFinite(metric.apply) ? round(metric.apply) : null,
      writeClickToStableMs: Number.isFinite(metric.clickToStable) ? round(metric.clickToStable) : null
    });
    current = next;
  }

  if (current !== original) {
    await extCCRow(page).getByRole('button', { name: original || current, exact: true }).click();
    await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
  }

  const report = {
    schemaVersion: 1,
    environment: 'supabase-local-authenticated',
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    summary: aggregateByLabel(samples),
    samples
  };
  const serialized = JSON.stringify(report, null, 2);

  expect(serialized).not.toContain(password);
  expect(serialized).not.toContain(controller.email);
  expect(report.summary['login-dashboard-usable'].sampleCount).toBe(3);
  expect(report.summary['competence-change'].sampleCount).toBe(4);
  expect(report.summary['write-bonification-stable'].sampleCount).toBe(3);

  const outputDir = path.resolve('test-results/performance-journeys');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'baseline.json'), serialized + '\n', 'utf8');
  await testInfo.attach('performance-journey-baseline', {
    body: Buffer.from(serialized, 'utf8'),
    contentType: 'application/json'
  });

  await context.close();
});
