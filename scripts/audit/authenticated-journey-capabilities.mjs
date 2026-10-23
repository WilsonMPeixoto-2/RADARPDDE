#!/usr/bin/env node
// Isolated A9 diagnostic. No production target, runtime patch, or performance gate.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { startFlow } from 'lighthouse';
import AxeBuilder from '@axe-core/playwright';
import { createRadarRequestHandler } from '../serve-radar.mjs';
import { buildRuntimeInput, renderRuntimeConfig } from '../generate-runtime-config.mjs';

const require = createRequire(import.meta.url);
const { installNetworkObserver, installRuntimeHooks, resetObservers, readObservation } = require('../../tests/support/performance-journey-observer.js');
const { observeOperationalSession } = require('../../tests/support/operational-session-observer.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inputFile = process.env.RADAR_A9_LOCAL_ACCESS_FILE;
const output = path.resolve(process.env.RADAR_A9_OUTPUT || 'artifacts/capabilities-a9');
const dbContainer = process.env.RADAR_A9_DB_CONTAINER;
if (!inputFile || !/^supabase_db_[a-z0-9_-]+$/.test(dbContainer || '')) throw new Error('Explicit local access file and disposable DB container required');
const access = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const api = new URL(access.API_URL);
if (api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname)) throw new Error('A9 refuses non-loopback Supabase');
if (!access.ANON_KEY || !access.SERVICE_ROLE_KEY) throw new Error('Local access incomplete');
fs.mkdirSync(output, { recursive: true });
const password = randomBytes(24).toString('base64url');
const runKey = `A9-${Date.now()}`;
const schoolId = runKey;
const schoolName = `Escola sintética ${runKey}`;
const baselineIterations = process.env.RADAR_A9_LIGHTHOUSE_ONLY === '1' ? 0 : 3;
const users = [];
const report = {
  schemaVersion: 2, generatedAt: new Date().toISOString(),
  checkout: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  environment: 'local-disposable-authenticated-small-fixture',
  versions: Object.fromEntries(['lighthouse', '@playwright/test', '@axe-core/playwright', '@supabase/supabase-js'].map(name => [name, JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version])),
  samples: [], accessibility: [], failures: [],
  limitations: [
    'Localhost, synthetic small fixture, headless Chromium; not Production latency/volume or a before/after upgrade comparison.',
    'Three samples; no population percentile or product budget.',
    'RPC completion is browser acknowledgement, not SQL execution time or precise commit time.',
    'DOM detection plus two requestAnimationFrame callbacks is not proof that an offscreen row was painted or perceived.',
    'Lighthouse passage is separate; profiler and audit overhead must not be pooled with baseline.',
    'Runtime instrumentation is test-only; hooks and durations may overlap.',
    'Existing disposable stack is not reset; only a new synthetic school and test identities are added.'
  ]
};
const sql = query => execFileSync('docker', ['exec', '-i', dbContainer, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: query, encoding: 'utf8' }).trim();
const writeJson = (name, value) => {
  const body = JSON.stringify(value, null, 2);
  for (const secret of [password, access.ANON_KEY, access.SERVICE_ROLE_KEY]) {
    if (body.includes(secret)) throw new Error('Sensitive value refused in report');
  }
  fs.writeFileSync(path.join(output, name), `${body}\n`);
};
const admin = createClient(api.href, access.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const must = async (operation, label) => {
  const result = await operation;
  if (result.error) throw new Error(`${label}: ${result.error.code || 'unknown'}`);
  return result.data;
};
const checkpoint = stage => { report.stage = stage; writeJson('result.json', report); console.log(`A9 ${stage}`); };
const dbStats = () => JSON.parse(sql(fs.readFileSync(path.join(root, 'scripts/operational-stat-snapshot.sql'), 'utf8')));
const ready = async page => {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true && window.RadarAuthContext?.authorization?.role === 'controller' && window.__radarNavigationHistoryInstalled === true, null, { timeout: 45000 });
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
};
const invoiceRow = page => page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
const twoFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const epoch = page => page.evaluate(() => performance.timeOrigin + performance.now());
const remoteInvoices = page => page.evaluate(async id => {
  const result = await window.RadarSessionContext.service.client.from('registered_invoices').select('id,invoice_number,expense_type,school_id,competence_id,program_id').eq('school_id', id);
  if (result.error) throw new Error(result.error.code);
  return result.data;
}, schoolId);
let server, puppet, browser, writer, observer;
try {
  report.database = JSON.parse(sql(`select json_build_object('version', version(), 'migrations', (select count(*) from supabase_migrations.schema_migrations), 'lastMigration', (select max(version) from supabase_migrations.schema_migrations), 'schoolsBefore', (select count(*) from public.schools), 'invoicesBefore', (select count(*) from public.registered_invoices));`));
  if (report.database.migrations !== 61 || report.database.lastMigration !== '20261011193500') throw new Error('Disposable schema does not match expected baseline');
  for (let index = 0; index < 2; index++) {
    const id = randomUUID();
    const controllerId = `${runKey}-C${index}`;
    const email = `${runKey.toLowerCase()}-${index}@radar.local`;
    const data = await must(admin.auth.admin.createUser({ id, email, password, email_confirm: true }), 'Create synthetic identity');
    users.push({ id: data.user.id, controllerId, email });
    sql(`insert into public.controllers(id,name,email,active,user_id) values ('${controllerId}','Controlador sintético A9 ${index}','${email}',true,'${data.user.id}');`);
    await must(admin.from('user_profiles').insert({ user_id: data.user.id, profile_id: 'controller', controller_id: controllerId, cre_scope: '4ª CRE', active: true }), 'Bind synthetic profile');
  }
  sql(`begin;
    insert into public.schools(id,designation,denomination,inep,cnpj,sici,cre,ra,controller_id,initial_competence,inventory_process)
      values ('${schoolId}',(select '04.98.' || lpad(n::text,3,'0') from generate_series(1,999) n where not exists (select 1 from public.schools where designation = '04.98.' || lpad(n::text,3,'0')) order by n limit 1),'${schoolName}','${runKey}','${runKey}','${runKey}','4ª CRE','A9','${users[0].controllerId}','2026-05','A9');
    insert into public.school_programs(id,school_id,program_id,active,starts_on) values ('${runKey}-SP','${schoolId}','BASIC',true,'2026-01-01');
    commit;`);
  const runtime = renderRuntimeConfig(buildRuntimeInput({ RADAR_ENVIRONMENT: 'test', RADAR_DATA_MODE: 'supabase-preview', RADAR_SUPABASE_REPOSITORY_ENABLED: 'true', RADAR_SUPABASE_URL: api.href, RADAR_SUPABASE_PUBLISHABLE_KEY: access.ANON_KEY }));
  const handler = createRadarRequestHandler({ root });
  server = http.createServer((req, res) => {
    if (new URL(req.url, 'http://localhost').pathname.endsWith('/config.runtime.js')) {
      res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' }); res.end(runtime);
    } else void handler(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  puppet = await puppeteer.launch({ executablePath: chromium.executablePath(), headless: true, defaultViewport: null, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  browser = await chromium.connectOverCDP(puppet.wsEndpoint());
  report.browser = browser.version();
  report.viewport = { width: 1440, height: 900 };
  for (const user of users) {
    const context = await browser.newContext({ viewport: report.viewport, baseURL });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await installNetworkObserver(page);
    await page.goto('/');
    await page.locator('#radar-auth-email').fill(user.email);
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await ready(page);
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await page.waitForFunction(() => window.RadarOperationalRealtimeInvalidationController?.getStatus?.() === 'SUBSCRIBED');
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
    await installRuntimeHooks(page);
    user.page = page;
  }
  [writer, observer] = users.map(u => u.page);
  checkpoint('authenticated-preflight-complete');
  const navigate = async page => {
    await page.locator('#nav-escolas').click();
    const row = page.getByRole('row').filter({ hasText: schoolName });
    await row.getByRole('link', { name: 'Ver Unidade', exact: true }).click();
    await expect(invoiceRow(page).getByRole('button', { name: 'Adicionar Nota', exact: true })).toBeVisible();
    await twoFrames(page);
    await expect(page).toHaveURL(new RegExp(`/escolas/${schoolId}(?:[/?#]|$)`));
  };
  for (let i = 1; i <= baselineIterations; i++) {
    await resetObservers(writer);
    const started = await epoch(writer);
    await navigate(writer);
    report.samples.push({ kind: 'portfolio-to-school', iteration: i, automationWallMs: (await epoch(writer)) - started, ...await readObservation(writer) });
    await writer.locator('#nav-dashboard').click();
  }
  await navigate(writer); await navigate(observer);
  const writerObservation = await observeOperationalSession(writer);
  const observerObservation = await observeOperationalSession(observer);
  for (const page of [writer, observer]) await page.evaluate(() => {
    const data = window.RadarApplicationServices.data;
    window.__A9_SCHOOL_OUTCOMES__ = [];
    const original = data.loadSchoolOperationalContext;
    data.loadSchoolOperationalContext = async function (...args) {
      const coverageBefore = Boolean(this.schoolOperationalCoverage);
      const result = await original.apply(this, args);
      window.__A9_SCHOOL_OUTCOMES__.push({ coverageBefore, fallback: result?.fallback || null, applied: result?.applied === true, stale: result?.stale === true });
      return result;
    };
  });
  const initialSql = dbStats();
  const armUi = async (page, number) => page.evaluate(value => {
    window.__A9_MATCH__ = null;
    window.__A9_MATCH_OBSERVER__?.disconnect();
    const test = () => {
      const row = document.querySelector('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
      if (row?.textContent.includes(value)) {
        const detectedAt = performance.timeOrigin + performance.now();
        window.__A9_MATCH_OBSERVER__.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(() => { window.__A9_MATCH__ = { detectedAt, twoFramesAt: performance.timeOrigin + performance.now() }; }));
      }
    };
    window.__A9_MATCH_OBSERVER__ = new MutationObserver(test);
    window.__A9_MATCH_OBSERVER__.observe(document.getElementById('main-container'), { subtree: true, childList: true, characterData: true });
    test();
  }, number);
  const fillInvoice = async (page, number) => {
    await invoiceRow(page).getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
    await page.locator('#nota-tipo').selectOption('consumo');
    await page.locator('#nota-desc').fill('Material sintético do experimento A9');
    await page.locator('#nota-numero').fill(number);
    await page.locator('#nota-valor').fill('123.45');
  };
  const save = async (number, label) => {
    await fillInvoice(writer, number);
    await armUi(writer, number); await armUi(observer, number);
    await writer.evaluate(() => {
      window.__A9_CLICK__ = null;
      document.querySelector('#form-dados-nota button[type="submit"]').addEventListener('click', () => { window.__A9_CLICK__ = performance.timeOrigin + performance.now(); }, { once: true, capture: true });
    });
    await resetObservers(writer); await resetObservers(observer);
    let ackAt = null;
    const ack = writer.waitForResponse(r => /\/rpc\/save_invoice_with_effects(?:_v2)?$/.test(new URL(r.url()).pathname)).then(async r => {
      await r.finished(); ackAt = await epoch(writer); expect(r.status()).toBe(200);
    });
    await writer.locator('#form-dados-nota button[type="submit"]').click();
    await ack;
    await writer.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
    await expect(writer.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    await observer.waitForFunction(() => Boolean(window.__A9_MATCH__), null, { timeout: 45000 });
    await writer.waitForFunction(() => Boolean(window.__A9_MATCH__));
    const clickedAt = await writer.evaluate(() => window.__A9_CLICK__);
    const own = await writer.evaluate(() => window.__A9_MATCH__);
    const other = await observer.evaluate(() => window.__A9_MATCH__);
    const sample = { kind: 'create-invoice', label, clickToAckObservedMs: ackAt - clickedAt, clickToWriterDomTwoRafMs: own.twoFramesAt - clickedAt, clickToObserverDomTwoRafMs: other.twoFramesAt - clickedAt,
      observerDomAfterAckMs: other.twoFramesAt - ackAt, writer: await readObservation(writer), observer: await readObservation(observer) };
    const stored = await remoteInvoices(writer);
    expect(stored.filter(r => r.invoice_number === number)).toHaveLength(1);
    expect(stored.find(r => r.invoice_number === number)).toMatchObject({ expense_type: 'consumo', school_id: schoolId, competence_id: '2026-05', program_id: 'BASIC' });
    report.samples.push(sample); checkpoint(label);
  };
  for (let i = 1; i <= baselineIterations; i++) await save(`${runKey}-NF-${i}`, `baseline-${i}`);
  report.baseline = { writer: await writerObservation.snapshot(), observer: await observerObservation.snapshot(), sqlBefore: initialSql, sqlAfter: dbStats() };
  const storedBeforeReload = await remoteInvoices(writer);
  const reloadStart = Date.now();
  await writer.reload(); await ready(writer);
  for (let i = 1; i <= baselineIterations; i++) await expect(invoiceRow(writer)).toContainText(`${runKey}-NF-${i}`);
  const ordered = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id));
  expect(ordered(await remoteInvoices(writer))).toEqual(ordered(storedBeforeReload));
  await expect(writer.locator('#global-competence-select')).toHaveValue('2026-05');
  report.reload = { automationWallMs: Date.now() - reloadStart, persistedInvoices: storedBeforeReload.length, ...await readObservation(writer) };
  await writer.screenshot({ path: path.join(output, 'prontuario-after-reload.png') });
  await installRuntimeHooks(writer);
  // Reload recreates DataService; reinstall only the small outcome recorder.
  await writer.evaluate(() => {
    const data = window.RadarApplicationServices.data;
    window.__A9_SCHOOL_OUTCOMES__ = [];
    const original = data.loadSchoolOperationalContext;
    data.loadSchoolOperationalContext = async function (...args) {
      const coverageBefore = Boolean(this.schoolOperationalCoverage);
      const result = await original.apply(this, args);
      window.__A9_SCHOOL_OUTCOMES__.push({ coverageBefore, fallback: result?.fallback || null, applied: result?.applied === true, stale: result?.stale === true });
      return result;
    };
  });
  // Browser-backed Lighthouse page: same authenticated tab, no second login or mock.
  await writer.evaluate(() => { window.__A9_LIGHTHOUSE_TARGET__ = true; });
  let puppetPage;
  for (const candidate of await puppet.pages()) {
    if (await candidate.evaluate(() => window.__A9_LIGHTHOUSE_TARGET__ === true)) puppetPage = candidate;
  }
  if (!puppetPage) throw new Error('Authenticated Lighthouse tab unavailable');
  const flow = await startFlow(puppetPage, { name: 'A9 authenticated invoice', flags: { formFactor: 'desktop', screenEmulation: { disabled: true }, throttlingMethod: 'provided', disableStorageReset: true, logLevel: 'error' } });
  await flow.startTimespan({ name: 'Create invoice and converge (instrumented)', onlyCategories: ['performance'] });
  await save(`${runKey}-NF-LH`, 'lighthouse-instrumented');
  await flow.endTimespan();
  report.schoolReadOutcomes = { writer: await writer.evaluate(() => window.__A9_SCHOOL_OUTCOMES__), observer: await observer.evaluate(() => window.__A9_SCHOOL_OUTCOMES__) };
  await invoiceRow(writer).getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
  await expect(writer.locator('#modal-dados-nota')).toHaveCSS('opacity', '1');
  await flow.snapshot({ name: 'Authenticated invoice modal', onlyCategories: ['accessibility'] });
  const lh = await flow.createFlowResult();
  // Store audit outputs, not the gather artifacts (which can include auth headers).
  report.lighthouse = lh.steps.map(step => ({ name: step.name, mode: step.lhr.gatherMode, warnings: step.lhr.runWarnings,
    categories: Object.fromEntries(Object.entries(step.lhr.categories).map(([k,v]) => [k,v.score])),
    audits: Object.fromEntries(Object.entries(step.lhr.audits).filter(([,v]) => typeof v.numericValue === 'number' || (v.score !== null && v.score < 1)).map(([k,v]) => [k, { score: v.score, value: v.numericValue ?? null, unit: v.numericUnit ?? null, title: v.title, display: v.displayValue ?? null }])) }));
  const axe = await new AxeBuilder({ page: writer }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  report.accessibility.push({ state: 'new-consumption-invoice-modal', passedRules: axe.passes.length, incompleteRules: axe.incomplete.length,
    incomplete: axe.incomplete.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })),
    violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
  await writer.screenshot({ path: path.join(output, 'invoice-modal.png') });
  const outputHtml = await flow.generateReport();
  if ([password, access.ANON_KEY, access.SERVICE_ROLE_KEY].some(v => outputHtml.includes(v))) throw new Error('Report contains local secret');
  fs.writeFileSync(path.join(output, 'lighthouse-flow.html'), outputHtml);
  report.convergence = { checked: true, invoices: (await remoteInvoices(observer)).length, competence: await observer.locator('#global-competence-select').inputValue(), realtime: await observer.evaluate(() => window.RadarOperationalRealtimeInvalidationController.getStatus()) };
  checkpoint('completed');
} catch (error) {
  report.failures.push({ message: error.message, stage: report.stage || 'preflight' });
  if (writer) await writer.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
  checkpoint('failed');
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  await puppet?.close().catch(() => {});
  await new Promise(resolve => server ? server.close(resolve) : resolve());
  // Keep synthetic financial fixtures for inspection; credentials are never persisted.
  let removed = 0;
  for (const user of users) {
    const result = await admin.auth.admin.deleteUser(user.id);
    if (result.error) report.failures.push({ stage: 'cleanup', message: `Auth cleanup: ${result.error.code || 'failed'}` });
    else removed++;
  }
  report.cleanup = { ephemeralAuthUsersRemoved: removed, syntheticSchoolRetained: schoolId };
  if (removed !== users.length) process.exitCode = 1;
  writeJson('result.json', report);
}
