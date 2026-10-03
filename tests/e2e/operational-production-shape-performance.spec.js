'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  percentile,
  round,
  installNetworkObserver,
  installRuntimeHooks,
  resetObservers,
  readObservation
} = require('../support/performance-journey-observer.js');

const enabled = process.env.RADAR_E2E_PRODUCTION_SHAPE === '1'
  && process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Gate executado somente em Supabase descartável com massa sintética production-shaped.');
test.describe.configure({ mode: 'serial' });

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
const controller = fixtures.find(item => item.profileId === 'controller' && item.active);
const TARGET_SHAPE = Object.freeze({
  verifications: 473,
  registeredInvoices: 193,
  pendencies: 329,
  pendencyAttempts: 48,
  pendencyContacts: 5,
  assets: 21
});
const DIRECT_SAMPLES = 20;
const APPLICATION_SAMPLES = 4;

if (enabled && (!controller || password.length < 24)) {
  throw new Error('Fixture do Controlador ou credencial efêmera ausente para o gate production-shaped.');
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
    && Boolean(window.RadarApplicationServices?.data)
  ), null, { timeout: 45000 });
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
  await expect(page.locator('#app-layout')).toBeVisible();
  await twoFrames(page);
}

async function signIn(page) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(controller.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitApplicationReady(page);
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
}

function shapeOf(data) {
  const entities = data?.entities || {};
  return {
    verifications: Array.isArray(entities.verifications) ? entities.verifications.length : -1,
    registeredInvoices: Array.isArray(entities.registeredInvoices) ? entities.registeredInvoices.length : -1,
    pendencies: Array.isArray(entities.pendencies) ? entities.pendencies.length : -1,
    pendencyAttempts: Array.isArray(entities.pendencyAttempts) ? entities.pendencyAttempts.length : -1,
    pendencyContacts: Array.isArray(entities.pendencyContacts) ? entities.pendencyContacts.length : -1,
    assets: Array.isArray(entities.assets) ? entities.assets.length : -1
  };
}

function summarizeDurations(values) {
  return {
    sampleCount: values.length,
    p50: percentile(values, 0.50),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    max: values.length ? round(Math.max(...values)) : null
  };
}

function observedRequestCount(sample, method, requestPath) {
  return (sample.requests || [])
    .filter(item => item.method === method && item.path === requestPath)
    .reduce((total, item) => total + Number(item.count || 0), 0);
}

function directOperationalGetCount(sample) {
  const paths = new Set([
    '/rest/v1/verifications',
    '/rest/v1/registered_invoices',
    '/rest/v1/pendencies',
    '/rest/v1/pendency_attempts',
    '/rest/v1/pendency_contacts',
    '/rest/v1/assets'
  ]);
  return (sample.requests || [])
    .filter(item => item.method === 'GET' && paths.has(item.path))
    .reduce((total, item) => total + Number(item.count || 0), 0);
}

test('mede leitura operacional autenticada com forma e volume de Production', async ({ browser }, testInfo) => {
  test.setTimeout(180000);
  const context = await browser.newContext();
  const page = await context.newPage();
  await installNetworkObserver(page);

  try {
    await signIn(page);

    const direct = await page.evaluate(async ({ samples, expectedShape }) => {
      const client = window.RadarSessionContext?.service?.client;
      if (!client) throw new Error('Cliente Supabase autenticado ausente.');
      const encoder = new TextEncoder();
      const durations = [];
      const payloadBytes = [];
      let firstShape = null;

      for (let index = 0; index < samples; index += 1) {
        const startedAt = performance.now();
        const { data, error } = await client.rpc('read_operational_context', {
          p_competence_id: '2026-08',
          p_history_statuses: []
        });
        const endedAt = performance.now();
        if (error) throw new Error(`read_operational_context falhou: ${error.message || error.code}`);
        durations.push(endedAt - startedAt);
        payloadBytes.push(encoder.encode(JSON.stringify(data)).byteLength);
        const entities = data?.entities || {};
        const shape = {
          verifications: Array.isArray(entities.verifications) ? entities.verifications.length : -1,
          registeredInvoices: Array.isArray(entities.registeredInvoices) ? entities.registeredInvoices.length : -1,
          pendencies: Array.isArray(entities.pendencies) ? entities.pendencies.length : -1,
          pendencyAttempts: Array.isArray(entities.pendencyAttempts) ? entities.pendencyAttempts.length : -1,
          pendencyContacts: Array.isArray(entities.pendencyContacts) ? entities.pendencyContacts.length : -1,
          assets: Array.isArray(entities.assets) ? entities.assets.length : -1
        };
        if (JSON.stringify(shape) !== JSON.stringify(expectedShape)) {
          throw new Error(`Forma inesperada da RPC: ${JSON.stringify(shape)}`);
        }
        if (!firstShape) firstShape = shape;
      }
      return { durations, payloadBytes, firstShape };
    }, { samples: DIRECT_SAMPLES, expectedShape: TARGET_SHAPE });

    expect(direct.firstShape).toEqual(TARGET_SHAPE);
    expect(direct.payloadBytes).toHaveLength(DIRECT_SAMPLES);
    expect(Math.min(...direct.payloadBytes)).toBeGreaterThan(900000);
    expect(Math.max(...direct.payloadBytes)).toBeLessThan(1800000);

    // Coloca a própria aplicação na competência pesada para medir refresh, parse,
    // aplicação do snapshot e rerender pelo caminho usado por uma sessão real.
    await page.evaluate(() => {
      window.RadarCompetenceContext.select('2026-08', { source: 'production-shape-gate' });
    });
    await page.evaluate(async () => {
      if (window.RadarGlobalCompetenceSelector?.whenHydrated) {
        await window.RadarGlobalCompetenceSelector.whenHydrated();
      }
    });
    await page.waitForFunction(() => (
      window.RadarCompetenceContext?.getState?.()?.activeKey === '2026-08'
      && document.getElementById('main-container')?.getAttribute('aria-busy') !== 'true'
    ));
    await installRuntimeHooks(page);

    const applicationSamples = [];
    for (let index = 0; index < APPLICATION_SAMPLES; index += 1) {
      await resetObservers(page);
      const startedAt = await page.evaluate(() => performance.now());
      const result = await page.evaluate(() => (
        window.RadarOperationalContextRefreshController.refresh(
          'production-shape-performance',
          { force: true }
        )
      ));
      expect(result?.ok).not.toBe(false);
      await page.waitForFunction(() => (
        window.RadarOperationalContextRefreshController?.hasPendingRefresh?.() === false
      ));
      await twoFrames(page);
      const endedAt = await page.evaluate(() => performance.now());
      const observation = await readObservation(page);
      const sample = {
        iteration: index + 1,
        totalMs: round(endedAt - startedAt),
        ...observation
      };
      expect(observedRequestCount(
        sample,
        'POST',
        '/rest/v1/rpc/read_operational_context'
      )).toBe(1);
      expect(directOperationalGetCount(sample)).toBe(0);
      expect(sample.pendingFetchCount).toBe(0);
      applicationSamples.push(sample);
    }

    const directDurations = direct.durations.map(value => round(value));
    const appDurations = applicationSamples.map(item => item.totalMs);
    const report = {
      schemaVersion: 1,
      environment: 'supabase-local-production-shaped',
      generatedAt: new Date().toISOString(),
      productionReference: {
        observedAt: '2026-10-02',
        competence: '2026-08',
        payloadBytes: 1245553,
        shape: TARGET_SHAPE
      },
      syntheticShape: direct.firstShape,
      directRpc: {
        durationMs: summarizeDurations(directDurations),
        payloadBytes: {
          min: Math.min(...direct.payloadBytes),
          max: Math.max(...direct.payloadBytes),
          p50: percentile(direct.payloadBytes, 0.50),
          p95: percentile(direct.payloadBytes, 0.95),
          p99: percentile(direct.payloadBytes, 0.99)
        },
        samples: directDurations
      },
      applicationRefresh: {
        durationMs: summarizeDurations(appDurations),
        samples: applicationSamples
      },
      limits: [
        'Massa inteiramente sintética; somente contagens e tamanhos agregados vieram de Production.',
        'Latência local não representa a rede/Vercel/Supabase Production; esta primeira rodada mede baseline antes de fixar SLA temporal.',
        'O gate exige forma, payload, ausência de fan-out e estabilidade das 20 leituras; orçamento de latência será definido somente após repetibilidade.'
      ]
    };

    const serialized = JSON.stringify(report, null, 2);
    expect(serialized).not.toContain(password);
    expect(serialized).not.toContain(controller.email);
    const outputDir = path.resolve('test-results/operational-production-shape');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'performance.json'), serialized + '\n', 'utf8');
    await testInfo.attach('operational-production-shape-performance', {
      body: Buffer.from(serialized, 'utf8'),
      contentType: 'application/json'
    });
  } finally {
    await context.close();
  }
});
