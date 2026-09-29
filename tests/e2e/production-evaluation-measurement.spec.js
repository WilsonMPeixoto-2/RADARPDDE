'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const accountsFile = process.env.RADAR_PRODUCTION_READ_ACCOUNTS_FILE || '';
if (!accountsFile || !fs.existsSync(accountsFile)) {
  throw new Error('Arquivo protegido de contas técnicas não foi disponibilizado.');
}

const raw = JSON.parse(fs.readFileSync(path.resolve(accountsFile), 'utf8'));
const accounts = Array.isArray(raw) ? raw : raw.accounts;
const account = accounts.find(item => item.profileId === 'technical_admin');
if (!account) throw new Error('Conta técnica technical_admin não localizada.');

const ARTIFACT_DIR = path.resolve('artifacts/production-evaluation-measurement');
const REPORT_PATH = path.join(ARTIFACT_DIR, 'measurement.json');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test.describe.configure({ mode: 'serial' });

async function ready(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'technical_admin'
    && Boolean(window.RadarCompetenceContext?.isInitialized?.())
  ), null, { timeout: 60000 });
  await expect(page.locator('#app-layout')).toBeVisible();
}

async function signIn(page) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(account.email);
  await page.locator('#radar-auth-password').fill(account.password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await ready(page);
}

async function chooseSchool(page) {
  return page.evaluate(async () => {
    const client = window.RadarSessionContext?.service?.client;
    if (!client) throw new Error('Cliente Supabase autenticado indisponível.');
    const result = await client
      .from('school_programs')
      .select('school_id,program_id,active')
      .eq('active', true)
      .eq('program_id', 'BASIC')
      .order('school_id', { ascending: true })
      .limit(20);
    if (result.error) throw result.error;
    const schoolId = result.data?.[0]?.school_id;
    if (!schoolId) throw new Error('Nenhuma escola BASIC ativa encontrada.');
    return schoolId;
  });
}

async function installProbe(page) {
  await page.evaluate(() => {
    const root = window;
    const main = document.getElementById('main-container');
    if (!main) throw new Error('main-container ausente.');

    const probe = {
      installedAt: performance.now(),
      lastMutationAt: performance.now(),
      mutationBatches: 0,
      mutationRecords: 0,
      addedNodes: 0,
      removedNodes: 0,
      switchView: [],
      loadContext: [],
      events: [],
      layoutShifts: [],
      reset() {
        this.lastMutationAt = performance.now();
        this.mutationBatches = 0;
        this.mutationRecords = 0;
        this.addedNodes = 0;
        this.removedNodes = 0;
        this.switchView.length = 0;
        this.loadContext.length = 0;
        this.events.length = 0;
        this.layoutShifts.length = 0;
        performance.clearResourceTimings();
      },
      snapshot() {
        return {
          mutationBatches: this.mutationBatches,
          mutationRecords: this.mutationRecords,
          addedNodes: this.addedNodes,
          removedNodes: this.removedNodes,
          switchView: [...this.switchView],
          loadContext: [...this.loadContext],
          events: [...this.events],
          layoutShifts: [...this.layoutShifts],
          lastMutationAgeMs: Math.round(performance.now() - this.lastMutationAt)
        };
      }
    };

    const observer = new MutationObserver(records => {
      probe.mutationBatches += 1;
      probe.mutationRecords += records.length;
      for (const record of records) {
        probe.addedNodes += record.addedNodes?.length || 0;
        probe.removedNodes += record.removedNodes?.length || 0;
      }
      probe.lastMutationAt = performance.now();
    });
    observer.observe(main, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: false
    });

    if (typeof PerformanceObserver === 'function') {
      try {
        const layoutObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              probe.layoutShifts.push({
                value: Number(entry.value.toFixed(6)),
                at: Number(entry.startTime.toFixed(1))
              });
            }
          }
        });
        layoutObserver.observe({ type: 'layout-shift', buffered: false });
      } catch (_error) {}
    }

    const originalSwitchView = root.switchView;
    if (typeof originalSwitchView === 'function') {
      root.switchView = function measuredSwitchView(...args) {
        const started = performance.now();
        try {
          return originalSwitchView.apply(this, args);
        } finally {
          probe.switchView.push({
            view: String(args[0] ?? ''),
            durationMs: Number((performance.now() - started).toFixed(1))
          });
        }
      };
    }

    const service = root.RadarApplicationServices?.data;
    if (service && typeof service.loadOperationalContext === 'function') {
      const originalLoad = service.loadOperationalContext.bind(service);
      service.loadOperationalContext = async function measuredLoadOperationalContext(...args) {
        const started = performance.now();
        try {
          const result = await originalLoad(...args);
          probe.loadContext.push({
            competence: String(args[0] ?? ''),
            durationMs: Number((performance.now() - started).toFixed(1)),
            stale: result?.stale === true
          });
          return result;
        } catch (error) {
          probe.loadContext.push({
            competence: String(args[0] ?? ''),
            durationMs: Number((performance.now() - started).toFixed(1)),
            error: String(error?.code || error?.message || 'error').slice(0, 120)
          });
          throw error;
        }
      };
    }

    for (const name of ['radar:competence-change', 'radar:operational-context-refreshed']) {
      root.addEventListener(name, event => {
        probe.events.push({
          name,
          competence: String(event?.detail?.competenceKey || event?.detail?.activeKey || ''),
          source: String(event?.detail?.source || ''),
          at: Number(performance.now().toFixed(1))
        });
      });
    }

    root.__radarEvaluationMeasurementProbe = probe;
  });
}

async function resetProbe(page) {
  await page.evaluate(() => window.__radarEvaluationMeasurementProbe.reset());
}

async function startVisualFrameProbe(page) {
  return page.evaluate(() => {
    const main = document.getElementById('main-container');
    const rows = document.querySelectorAll('#prontuario-verif-rows tr[data-program-id]');
    if (!main) throw new Error('main-container ausente para amostragem visual.');

    const baselineTextLength = (main.innerText || '').trim().length;
    const baselineRowCount = rows.length;
    const baselineRect = main.getBoundingClientRect();
    const state = {
      running: true,
      startedAt: performance.now(),
      frameCount: 0,
      busyFrames: 0,
      hiddenFrames: 0,
      emptyFrames: 0,
      degradedFrames: 0,
      baselineTextLength,
      baselineRowCount,
      minTextLength: baselineTextLength,
      minRowCount: baselineRowCount,
      minHeight: baselineRect.height,
      maxHeight: baselineRect.height,
      currentDegradedStart: null,
      maxDegradedDurationMs: 0,
      lastFrameAt: performance.now()
    };

    const sample = timestamp => {
      if (!state.running) return;
      const currentMain = document.getElementById('main-container');
      const currentRows = document.querySelectorAll('#prontuario-verif-rows tr[data-program-id]');
      if (!currentMain) {
        state.hiddenFrames += 1;
        state.emptyFrames += 1;
        state.degradedFrames += 1;
        if (state.currentDegradedStart == null) state.currentDegradedStart = timestamp;
        state.frameCount += 1;
        state.lastFrameAt = timestamp;
        requestAnimationFrame(sample);
        return;
      }

      const style = getComputedStyle(currentMain);
      const rect = currentMain.getBoundingClientRect();
      const textLength = (currentMain.innerText || '').trim().length;
      const rowCount = currentRows.length;
      const busy = currentMain.inert === true || currentMain.getAttribute('aria-busy') === 'true';
      const hidden = style.display === 'none'
        || style.visibility === 'hidden'
        || Number.parseFloat(style.opacity || '1') < 0.5
        || rect.width <= 1
        || rect.height <= 1;
      const textRatio = state.baselineTextLength > 0 ? textLength / state.baselineTextLength : 1;
      const rowRatio = state.baselineRowCount > 0 ? rowCount / state.baselineRowCount : 1;
      const empty = textLength < 20 || (state.baselineRowCount > 0 && rowCount === 0);
      const degraded = hidden || empty || textRatio < 0.5 || rowRatio < 0.5;

      state.frameCount += 1;
      if (busy) state.busyFrames += 1;
      if (hidden) state.hiddenFrames += 1;
      if (empty) state.emptyFrames += 1;
      if (degraded) {
        state.degradedFrames += 1;
        if (state.currentDegradedStart == null) state.currentDegradedStart = timestamp;
      } else if (state.currentDegradedStart != null) {
        state.maxDegradedDurationMs = Math.max(
          state.maxDegradedDurationMs,
          timestamp - state.currentDegradedStart
        );
        state.currentDegradedStart = null;
      }

      state.minTextLength = Math.min(state.minTextLength, textLength);
      state.minRowCount = Math.min(state.minRowCount, rowCount);
      state.minHeight = Math.min(state.minHeight, rect.height);
      state.maxHeight = Math.max(state.maxHeight, rect.height);
      state.lastFrameAt = timestamp;
      requestAnimationFrame(sample);
    };

    window.__radarVisualFrameProbe = state;
    requestAnimationFrame(sample);
    return {
      baselineTextLength,
      baselineRowCount,
      baselineHeight: Number(baselineRect.height.toFixed(1))
    };
  });
}

async function stopVisualFrameProbe(page) {
  return page.evaluate(() => {
    const state = window.__radarVisualFrameProbe;
    if (!state) return null;
    state.running = false;
    const stoppedAt = performance.now();
    if (state.currentDegradedStart != null) {
      state.maxDegradedDurationMs = Math.max(
        state.maxDegradedDurationMs,
        stoppedAt - state.currentDegradedStart
      );
    }
    const textRatio = state.baselineTextLength > 0
      ? state.minTextLength / state.baselineTextLength
      : 1;
    const rowRatio = state.baselineRowCount > 0
      ? state.minRowCount / state.baselineRowCount
      : 1;
    const result = {
      sampledDurationMs: Number((stoppedAt - state.startedAt).toFixed(1)),
      frameCount: state.frameCount,
      busyFrames: state.busyFrames,
      hiddenFrames: state.hiddenFrames,
      emptyFrames: state.emptyFrames,
      degradedFrames: state.degradedFrames,
      maxDegradedDurationMs: Number(state.maxDegradedDurationMs.toFixed(1)),
      baselineTextLength: state.baselineTextLength,
      minTextLength: state.minTextLength,
      minTextRatio: Number(textRatio.toFixed(3)),
      baselineRowCount: state.baselineRowCount,
      minRowCount: state.minRowCount,
      minRowRatio: Number(rowRatio.toFixed(3)),
      minHeight: Number(state.minHeight.toFixed(1)),
      maxHeight: Number(state.maxHeight.toFixed(1))
    };
    delete window.__radarVisualFrameProbe;
    return result;
  });
}

async function waitForStable(page) {
  await page.waitForFunction(() => {
    const probe = window.__radarEvaluationMeasurementProbe;
    const main = document.getElementById('main-container');
    if (!probe || !main) return false;
    const busy = main.inert === true || main.getAttribute('aria-busy') === 'true';
    return !busy && (performance.now() - probe.lastMutationAt) >= 800;
  }, null, { timeout: 60000 });
}

function tableFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const match = /^\/rest\/v1\/([^/?]+)/.exec(url.pathname);
    return match ? match[1] : null;
  } catch (_error) {
    return null;
  }
}

test('mede jornadas reais da Avaliação em Production sem alterar dados', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  const runs = [];
  const requestMeta = new Map();
  let activeRun = null;

  page.on('request', request => {
    if (!activeRun) return;
    const table = tableFromUrl(request.url());
    if (!table) return;
    const item = {
      table,
      method: request.method(),
      startedAt: Date.now(),
      durationMs: null,
      failed: false
    };
    activeRun.requests.push(item);
    activeRun.pending += 1;
    activeRun.lastNetworkAt = Date.now();
    requestMeta.set(request, { run: activeRun, item });
  });

  page.on('requestfinished', request => {
    const meta = requestMeta.get(request);
    if (!meta) return;
    meta.item.durationMs = Date.now() - meta.item.startedAt;
    meta.run.pending = Math.max(0, meta.run.pending - 1);
    meta.run.lastNetworkAt = Date.now();
    requestMeta.delete(request);
  });

  page.on('requestfailed', request => {
    const meta = requestMeta.get(request);
    if (!meta) return;
    meta.item.durationMs = Date.now() - meta.item.startedAt;
    meta.item.failed = true;
    meta.run.pending = Math.max(0, meta.run.pending - 1);
    meta.run.lastNetworkAt = Date.now();
    requestMeta.delete(request);
  });

  async function waitNetworkIdle(run) {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (run.pending === 0 && Date.now() - run.lastNetworkAt >= 500) return;
      await page.waitForTimeout(100);
    }
    throw new Error('Rede operacional não estabilizou em 30 s.');
  }

  async function measure(label, action) {
    await resetProbe(page);
    const sampleVisualFrames = label.startsWith('global-competence:')
      || label.startsWith('evaluation-month-tab:');
    if (sampleVisualFrames) await startVisualFrameProbe(page);

    const run = {
      label,
      requests: [],
      pending: 0,
      lastNetworkAt: Date.now(),
      startedAt: Date.now()
    };
    activeRun = run;
    await action();
    await waitForStable(page);
    await waitNetworkIdle(run);
    const totalMs = Date.now() - run.startedAt;
    const probe = await page.evaluate(() => window.__radarEvaluationMeasurementProbe.snapshot());
    const visualFrames = sampleVisualFrames ? await stopVisualFrameProbe(page) : null;
    activeRun = null;

    const byTable = {};
    for (const item of run.requests) {
      byTable[item.table] = (byTable[item.table] || 0) + 1;
    }
    const durations = run.requests
      .map(item => item.durationMs)
      .filter(value => Number.isFinite(value))
      .sort((a, b) => a - b);
    const p95 = durations.length
      ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
      : 0;

    runs.push({
      label,
      totalMs,
      requestCount: run.requests.length,
      requestFailures: run.requests.filter(item => item.failed).length,
      requestP95Ms: p95,
      requestsByTable: byTable,
      visualFrames,
      ...probe
    });
  }

  await signIn(page);
  const schoolId = await chooseSchool(page);
  await page.goto('/escolas/' + encodeURIComponent(schoolId));
  await ready(page);
  await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
  await installProbe(page);
  await waitForStable(page);

  const competenceInfo = await page.locator('#global-competence-select').evaluate(select => ({
    selected: select.value,
    options: Array.from(select.options).map(option => option.value).filter(Boolean)
  }));
  const earlier = competenceInfo.options.filter(value => value < competenceInfo.selected).slice(-3).reverse();
  const switchTargets = [...earlier.slice(0, 2), competenceInfo.selected];

  for (const target of switchTargets) {
    await measure('global-competence:' + target, async () => {
      await page.locator('#global-competence-select').selectOption(target);
      await page.waitForFunction(value => (
        window.RadarCompetenceContext?.getState?.().activeKey === value
      ), target);
      await page.evaluate(() => window.RadarGlobalCompetenceSelector?.whenHydrated?.());
      await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
    });
  }

  const localTabs = page.locator('.comp-sub-tab:not(.disabled)');
  const localCount = await localTabs.count();
  if (localCount > 1) {
    const currentPressed = await page.locator('.comp-sub-tab[aria-pressed="true"]').getAttribute('data-competence');
    let targetIndex = 0;
    for (let i = 0; i < localCount; i += 1) {
      const value = await localTabs.nth(i).getAttribute('data-competence');
      if (value && value !== currentPressed) {
        targetIndex = i;
        break;
      }
    }
    const target = await localTabs.nth(targetIndex).getAttribute('data-competence');
    if (target) {
      await measure('evaluation-month-tab:' + target, async () => {
        await localTabs.nth(targetIndex).click();
        await page.waitForFunction(value => (
          window.RadarCompetenceContext?.getState?.().activeKey === value
        ), target);
        await page.evaluate(() => window.RadarGlobalCompetenceSelector?.whenHydrated?.());
        await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
      });
    }
  }

  const tablist = page.locator('.prontuario-tablist');
  const tabs = tablist.locator('[role="tab"]');
  if (await tabs.count() > 1) {
    const evaluationTab = tabs.filter({ hasText: /Competências e Análises/i }).first();
    const otherTab = tabs.nth(1);
    await measure('leave-evaluation-tab', async () => {
      await otherTab.click();
      const panelId = await otherTab.getAttribute('aria-controls');
      if (panelId) await expect(page.locator('#' + panelId)).toBeVisible();
    });
    await measure('return-evaluation-tab', async () => {
      await evaluationTab.click();
      await expect(page.locator('#tab-verificacoes')).toBeVisible();
      await expect(page.locator('#prontuario-verif-rows')).toBeVisible();
    });
  }

  const report = {
    capturedAt: new Date().toISOString(),
    environment: 'production',
    profile: 'technical_admin',
    viewport: { width: 1440, height: 900 },
    competenceOptionCount: competenceInfo.options.length,
    measuredTransitions: runs.length,
    runs
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log('RADAR_EVALUATION_MEASUREMENT=' + JSON.stringify(report));
  expect(runs.length).toBeGreaterThanOrEqual(3);
  await context.close();
});
