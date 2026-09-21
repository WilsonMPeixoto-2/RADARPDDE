'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
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
  const contexts = [];
  let restoreBonification = null;
  const createContext = async () => {
    const context = await browser.newContext();
    contexts.push(context);
    return context;
  };

  // Login frio: três contextos independentes para reduzir ruído de uma única execução.
  try {
    for (let iteration = 1; iteration <= 3; iteration += 1) {
      const context = await createContext();
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

    const context = await createContext();
    const page = await context.newPage();
    await installNetworkObserver(page);
    await signIn(page);
    // As extensões são necessárias às jornadas seguintes, mas não fazem parte do
    // critério "Dashboard utilizável". Aguardar aqui evita inflar artificialmente
    // a métrica de login com módulos que carregam em background.
    await page.evaluate(async () => {
      if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
    });
    await installRuntimeHooks(page);

    // A fixture Supabase pode expor somente uma competência. Em vez de inventar
    // uma segunda competência, medimos diretamente o refresh operacional real,
    // que é a jornada relevante para decidir se uma RPC única ainda se justifica.
    for (let iteration = 1; iteration <= 4; iteration += 1) {
      samples.push(await captureJourney(
        page,
        'operational-context-refresh',
        () => page.evaluate(() => (
          window.RadarOperationalContextRefreshController.refresh(
            'performance-baseline',
            { force: true }
          )
        )),
        async () => {
          await page.waitForFunction(() => (
            document.getElementById('main-container')?.getAttribute('aria-busy') !== 'true'
            && window.RadarOperationalContextRefreshController?.hasPendingRefresh?.() === false
          ));
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
    restoreBonification = async () => {
      await page.evaluate(async originalValue => {
        await window.RadarApplicationServices.verifications.setBonification({
          schoolId: 'ESC-LOCAL',
          compKey: '2026-05_BASIC',
          documentKey: 'extCC',
          value: originalValue,
          profile: 'controlador'
        });
        await window.RadarApplicationServices.data.remoteExecutionTail;
      }, original);
    };
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
        writeDiagnosticsRpcMs: Number.isFinite(metric.rpc) ? round(metric.rpc) : null,
        writeApplyMs: Number.isFinite(metric.apply) ? round(metric.apply) : null,
        writeClickToStableMs: Number.isFinite(metric.clickToStable) ? round(metric.clickToStable) : null
      });
      current = next;
    }

    const report = {
      schemaVersion: 2,
      checkoutCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      browserVersion: browser.version(),
      limitations: [
        'Fixture pequena de Supabase local; não mede latência, volume ou ganho pós-RLS de Production.',
        '3 ou 4 amostras por jornada: p95 é o máximo observado, não estimativa populacional.',
        'Login começa no clique após carregar o shell; contextos novos, servidor compartilhado.',
        'fetchHeadersWallMs mede fetch até cabeçalhos; exclui corpo, scripts/CSS e WebSocket.',
        'Tempos de contexto, render e rede se sobrepõem; não somar como parcelas exclusivas.',
        'totalMs inclui chamadas, auto-wait e asserções Playwright; não é tempo puro do evento de UI.',
        'writeRpcClientMs mede saveVerificationWithLog completo no cliente, não execução SQL.',
        'Métrica ausente é null; zero indica hook disponível sem execução observada.',
        'Troca de competência não foi medida: fixture expõe somente Maio/2026.'
      ],
      environment: 'supabase-local-authenticated',
      generatedAt: new Date().toISOString(),
      sampleCount: samples.length,
      summary: aggregateByLabel(samples),
      samples
    };
    const serialized = JSON.stringify(report, null, 2);

    expect(serialized).not.toContain(password);
    expect(serialized).not.toContain(controller.email);
    const outputDir = path.resolve('test-results/performance-journeys');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'baseline.json'), serialized + '\n', 'utf8');
    await testInfo.attach('performance-journey-baseline', {
      body: Buffer.from(serialized, 'utf8'),
      contentType: 'application/json'
    });

    // Preservar evidência sanitizada mesmo quando um contrato de medição falhar.
    expect(report.summary['login-dashboard-usable'].sampleCount).toBe(3);
    expect(report.summary['operational-context-refresh'].sampleCount).toBe(4);
    expect(report.summary['write-bonification-stable'].sampleCount).toBe(3);
    expect(
      samples
        .filter(item => item.label === 'write-bonification-stable')
        .every(item => Number.isFinite(item.writeRpcClientMs) && item.writeRpcClientMs > 0)
    ).toBe(true);

    for (const sample of samples.filter(item => item.label === 'operational-context-refresh')) {
      expect(sample.contextLoadMs).toBeGreaterThan(0);
      expect(sample.requestCount).toBeGreaterThan(0);
    }
    await testInfo.attach('performance-prontuario-baseline', {
      body: await page.screenshot(), contentType: 'image/png'
    });
  } finally {
    // Contextos e requests são descartáveis, inclusive quando uma asserção falha.
    try {
      await restoreBonification?.();
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  }
});
