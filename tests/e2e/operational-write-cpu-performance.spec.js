'use strict';

// Read-only with respect to Production: only the existing disposable CI stack.
// Diagnostic data, not performance acceptance thresholds nor a proposed fix.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1'
  && process.env.RADAR_E2E_SUSTAINED_OPERATIONAL === '1';
test.skip(!enabled, 'Requires ephemeral Supabase/Auth/production-shaped fixture.');

const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && password.length < 24) throw new Error('Ephemeral Auth credential missing.');

function row(page, key) {
  return page.locator(
    'tr[data-program-id="BASIC"][data-document-key="' + key + '"]'
  ).first();
}

async function twoFrames(page) {
  await page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function loginAndOpen(page) {
  await page.goto('/');
  const runtime = await page.evaluate(() => window.RADAR_PDDE_RUNTIME_INPUT);
  expect(runtime.environment).toBe('test');
  expect(runtime.dataMode).toBe('supabase-preview');
  expect(['localhost', '127.0.0.1', '[::1]'])
    .toContain(new URL(runtime.supabase.url).hostname);
  await page.locator('#radar-auth-email').fill('operational-1@radar.local');
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices), null, { timeout: 45000 });
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
  await page.goto('/escolas/OPS-SESSION-1');
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices), null, { timeout: 45000 });
  await page.locator('#global-competence-select').selectOption('2026-08');
  await expect(row(page, 'extCC')).toBeVisible();
  await page.waitForFunction(() => document.getElementById('main-container')?.inert !== true,
    null, { timeout: 30000 });
  await twoFrames(page);
}

function summarizeCpu(profile) {
  const nodes = new Map((profile.nodes || []).map(item => [item.id, item.callFrame || {}]));
  const durations = new Map();
  const samples = profile.samples || [];
  const deltas = profile.timeDeltas || [];
  for (let i = 0; i < samples.length; i += 1) {
    const fn = nodes.get(samples[i]);
    if (!fn) continue;
    const name = fn.functionName || '(anonymous)';
    const location = String(fn.url || '').split('/').pop().split('?')[0];
    const key = name + (location ? ' [' + location + ']' : '');
    durations.set(key, (durations.get(key) || 0) + (deltas[i] || 0));
  }
  return {
    samples: samples.length,
    sampledTotalMs: Math.round(deltas.reduce((a, b) => a + b, 0) / 1000),
    topSelfSampled: [...durations.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 18)
      .map(([functionName, microseconds]) => ({
        functionName, approximateSampledMs: Math.round(microseconds / 1000)
      }))
  };
}

async function installBrowserProbe(page) {
  await page.evaluate(() => {
    const probe = window.__radarWriteCpuProbe = {
      longTasks: [], mutations: 0, mainReplacements: 0
    };
    if (typeof PerformanceObserver === 'function'
      && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      probe.tasksObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) probe.longTasks.push(entry.duration);
      });
      probe.tasksObserver.observe({ type: 'longtask', buffered: false });
    }
    const main = document.getElementById('main-container');
    probe.domObserver = new MutationObserver(records => {
      probe.mutations += records.length;
      for (const record of records) {
        if (record.type === 'childList' && record.target === main) {
          probe.mainReplacements += 1;
        }
      }
    });
    probe.domObserver.observe(main, {
      childList: true, attributes: true, subtree: true
    });
  });
}

async function captureGesture({ page, cdp, label, action, visible, network }) {
  const before = await page.evaluate(() => {
    const probe = window.__radarWriteCpuProbe;
    return {
      longTasksIndex: probe.longTasks.length,
      mutations: probe.mutations,
      mainReplacements: probe.mainReplacements
    };
  });
  const networkIndex = network.length;
  await cdp.send('Profiler.start');
  let cpu;
  const start = Date.now();
  try {
    await action();
    await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
    await visible();
    await twoFrames(page);
  } finally {
    cpu = (await cdp.send('Profiler.stop')).profile;
  }
  const totalMs = Date.now() - start;
  const after = await page.evaluate(() => ({
    longTasks: window.__radarWriteCpuProbe.longTasks.slice(),
    mutations: window.__radarWriteCpuProbe.mutations,
    mainReplacements: window.__radarWriteCpuProbe.mainReplacements,
    mainReady: document.getElementById('main-container')?.inert !== true
  }));
  return {
    action: label,
    clickToVisibleAndCommittedMs: totalMs,
    longTaskCount: after.longTasks.length - before.longTasksIndex,
    longTaskMs: Math.round(after.longTasks.slice(before.longTasksIndex)
      .reduce((sum, duration) => sum + duration, 0)),
    domMutationRecords: after.mutations - before.mutations,
    mainReplacements: after.mainReplacements - before.mainReplacements,
    contextReads: network.slice(networkIndex)
      .filter(entry => entry.path.endsWith('read_operational_context')
        || entry.path.endsWith('read_school_operational_context')).length,
    restCalls: network.slice(networkIndex),
    mainReady: after.mainReady,
    cpu: summarizeCpu(cpu)
  };
}

test('CPU real após bonificação, análise técnica e NF na mesma escola', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const browserErrors = [];
  const network = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  page.on('response', response => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/rest/v1/')) return;
    network.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status()
    });
  });
  await loginAndOpen(page);
  await installBrowserProbe(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  const samples = [];
  try {
    const delivery = row(page, 'extCC');
    const currentSim = await delivery.getByRole('button', { name: 'Sim', exact: true })
      .evaluate(element => element.classList.contains('active-sim'));
    const next = currentSim ? 'Não' : 'Sim';
    samples.push(await captureGesture({
      page, cdp, label: 'bonification',
      action: () => delivery.getByRole('button', { name: next, exact: true }).click(),
      visible: async () => expect(row(page, 'extCC')
        .getByRole('button', { name: next, exact: true }))
        .toHaveClass(next === 'Sim' ? /active-sim/ : /active-nao/),
      network
    }));
    await testInfo.attach('profile-bonification', {
      body: await page.screenshot(), contentType: 'image/png'
    });

    const analysis = row(page, 'extCC').locator('select.select-analise');
    await expect(analysis).toBeEnabled();
    const beforeAnalysis = await analysis.inputValue();
    const afterAnalysis = beforeAnalysis === 'Correto' ? 'Não analisado' : 'Correto';
    samples.push(await captureGesture({
      page, cdp, label: 'technical-analysis',
      action: () => analysis.selectOption(afterAnalysis),
      visible: async () => expect(row(page, 'extCC')
        .locator('select.select-analise')).toHaveValue(afterAnalysis),
      network
    }));
    await testInfo.attach('profile-technical-analysis', {
      body: await page.screenshot(), contentType: 'image/png'
    });

    await row(page, 'notaFiscal')
      .getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    const modal = page.locator('#modal-dados-nota');
    await expect(modal).toHaveClass(/show/);
    await modal.locator('#nota-tipo').selectOption('consumo');
    await modal.locator('#nota-numero').fill('CPU-PROBE-LOCAL-01');
    await modal.locator('#nota-desc').fill('Material sintético para diagnóstico CPU');
    await modal.locator('#nota-valor').fill('250');
    samples.push(await captureGesture({
      page, cdp, label: 'invoice-create',
      action: () => modal.locator('button[type="submit"]').click(),
      visible: async () => {
        await expect(modal).not.toHaveClass(/show/);
        await expect(page.locator('.invoice-document-row')
          .filter({ hasText: 'CPU-PROBE-LOCAL-01' })).toBeVisible();
      },
      network
    }));
    await testInfo.attach('profile-invoice-create', {
      body: await page.screenshot(), contentType: 'image/png'
    });
  } finally {
    await page.evaluate(() => {
      window.__radarWriteCpuProbe?.domObserver?.disconnect();
      window.__radarWriteCpuProbe?.tasksObserver?.disconnect();
    }).catch(() => undefined);
    await cdp.send('Profiler.disable').catch(() => undefined);
    await cdp.detach().catch(() => undefined);
  }

  // A diagnostic success requires correct visible state; there are no timing
  // thresholds, because one CI browser run cannot establish Production SLOs.
  expect(browserErrors).toEqual([]);
  expect(samples).toHaveLength(3);
  expect(samples.every(item => item.mainReady)).toBe(true);
  const report = {
    schemaVersion: 1, kind: 'cpu-write-journey',
    variant: process.env.RADAR_OPERATIONAL_VARIANT || 'unknown',
    fixture: 'disposable-production-shaped',
    note: 'One sample per action: compare functions and DOM, not speed ratios as causal proof',
    samples, browserErrors
  };
  const directory = path.resolve('test-results/operational-sustained');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'cpu-write-' + report.variant + '.json'),
    JSON.stringify(report, null, 2));
  console.log('[cpu-write-journey]', JSON.stringify(samples.map(x => ({
    action: x.action, durationMs: x.clickToVisibleAndCommittedMs,
    longTaskMs: x.longTaskMs, mutations: x.domMutationRecords,
    mainReplacements: x.mainReplacements,
    topFunctions: x.cpu.topSelfSampled.slice(0, 5)
  }))));
});