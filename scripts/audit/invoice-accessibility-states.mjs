#!/usr/bin/env node
// F06 bounded diagnostic: authenticated invoice form, native validation and browser zoom.
// No product mutation; only disposable local fixture setup/cleanup uses admin access.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createClient } from '@supabase/supabase-js';
import { createRadarRequestHandler } from '../serve-radar.mjs';
import { buildRuntimeInput, renderRuntimeConfig } from '../generate-runtime-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const accessFile = process.env.RADAR_F06_LOCAL_ACCESS_FILE;
const dbContainer = process.env.RADAR_F06_DB_CONTAINER;
if (!accessFile || !/^supabase_db_[a-z0-9_-]+$/.test(dbContainer || '')) throw new Error('Explicit disposable local access and DB container required');
const access = JSON.parse(fs.readFileSync(accessFile, 'utf8'));
const api = new URL(access.API_URL);
if (api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname)) throw new Error('F06 refuses non-loopback Supabase');
if (!access.ANON_KEY || !access.SERVICE_ROLE_KEY) throw new Error('Local access incomplete');
const output = path.resolve(process.env.RADAR_F06_OUTPUT || 'artifacts/tooling/f06-invoice-accessibility');
fs.mkdirSync(output, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-f06-'));
const password = randomBytes(24).toString('base64url');
const runKey = `F06-${Date.now()}`;
const schoolId = runKey;
const schoolName = `Escola sintética ${runKey}`;
const users = [];
const sql = query => execFileSync('docker', ['exec', '-i', dbContainer, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: query, encoding: 'utf8' }).trim();
const admin = createClient(api.href, access.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const must = async (operation, label) => {
  const result = await operation;
  if (result.error) throw new Error(`${label}: ${result.error.code || 'unknown'}`);
  return result.data;
};
const counts = () => JSON.parse(sql(`select json_build_object(
  'users',(select count(*) from auth.users), 'profiles',(select count(*) from public.user_profiles),
  'schools',(select count(*) from public.schools), 'controllers',(select count(*) from public.controllers),
  'invoices',(select count(*) from public.registered_invoices));`));
const report = {
  schemaVersion: 1, generatedAt: new Date().toISOString(),
  checkout: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  environment: 'local-disposable-authenticated-source-headless',
  inputHashes: Object.fromEntries(['src/styles/global-visual-polish.css', 'scripts/audit/invoice-accessibility-states.mjs', 'index.html'].map(name => [name, createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex')])),
  versions: Object.fromEntries(['@playwright/test', '@axe-core/playwright', '@supabase/supabase-js'].map(name => [name, JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version])),
  cases: [], failures: [], browserErrors: [], invoiceWriteRequests: 0,
  limitations: ['One existing consumption invoice form and one controller profile; not all forms or WCAG certification.',
    'Native browser zoom via chrome.tabs.setZoom; headless Chromium, not a screen reader or personal desktop session.',
    'No valid invoice is submitted. Saving/server errors/reanalysis are outside this bounded round.',
    'Local disposable PostgreSQL may differ from hosted Production; not a performance benchmark.']
};
const write = () => {
  const body = JSON.stringify(report, null, 2);
  if ([password, access.ANON_KEY, access.SERVICE_ROLE_KEY].some(secret => body.includes(secret))) throw new Error('Secret refused in diagnostic');
  fs.writeFileSync(path.join(output, 'result.json'), `${body}\n`);
};
let context, page, server, cdp;
const screenshot = async name => {
  // No clip: Playwright's configured device scale is not updated by native tab zoom.
  const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(output, name), Buffer.from(capture.data, 'base64'));
};
try {
  report.before = counts();
  report.database = JSON.parse(sql(`select json_build_object('version',version(),'migrations',(select count(*) from supabase_migrations.schema_migrations),'lastMigration',(select max(version) from supabase_migrations.schema_migrations));`));
  if (report.database.migrations !== 61 || report.database.lastMigration !== '20261011193500') throw new Error('Unexpected disposable schema');
  for (let index = 0; index < 1; index++) {
    const id = randomUUID();
    const controllerId = `${runKey}-C${index}`;
    const email = `${runKey.toLowerCase()}-${index}@radar.local`;
    const data = await must(admin.auth.admin.createUser({ id, email, password, email_confirm: true }), 'Create synthetic identity');
    users.push({ id: data.user.id, controllerId, email });
    sql(`insert into public.controllers(id,name,email,active,user_id) values ('${controllerId}','Controlador sintético F06 ${index}','${email}',true,'${data.user.id}');`);
    await must(admin.from('user_profiles').insert({ user_id: data.user.id, profile_id: 'controller', controller_id: controllerId, cre_scope: '4ª CRE', active: true }), 'Bind synthetic profile');
  }
  sql(`begin;
    insert into public.schools(id,designation,denomination,inep,cnpj,sici,cre,ra,controller_id,initial_competence,inventory_process)
      values ('${schoolId}',(select '04.98.' || lpad(n::text,3,'0') from generate_series(1,999) n where not exists (select 1 from public.schools where designation = '04.98.' || lpad(n::text,3,'0')) order by n limit 1),'${schoolName}','${runKey}','${runKey}','${runKey}','4ª CRE','F06','${users[0].controllerId}','2026-05','F06');
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
  const extension = path.join(temporary, 'extension');
  fs.mkdirSync(extension);
  fs.writeFileSync(path.join(extension, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'Disposable F06 browser zoom', version: '1.0', permissions: ['tabs'], background: { service_worker: 'worker.js' } }));
  fs.writeFileSync(path.join(extension, 'worker.js'), 'chrome.runtime.onInstalled.addListener(() => {});');
  context = await chromium.launchPersistentContext(path.join(temporary, 'profile'), { headless: true, channel: 'chromium', viewport: null, args: ['--no-sandbox', '--window-size=1440,900', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  page = context.pages()[0];
  cdp = await context.newCDPSession(page);
  page.setDefaultTimeout(15000);
  report.browser = context.browser().version();
  page.on('pageerror', error => report.browserErrors.push(error.message));
  page.on('request', request => {
    if (request.method() === 'POST' && /\/rpc\/(?:save|register).*invoice/.test(request.url())) report.invoiceWriteRequests++;
  });
  await page.goto(baseURL);
  await page.locator('#radar-auth-email').fill(users[0].email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => window.RadarDataContext?.ready === true && window.RadarAuthContext?.authorization?.role === 'controller' && window.__radarNavigationHistoryInstalled === true, null, { timeout: 45000 });
  await page.evaluate(() => window.RadarProductExtensionsReady);
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
  await page.locator('#nav-escolas').click();
  await page.getByRole('row').filter({ hasText: schoolName }).getByRole('link', { name: 'Ver Unidade', exact: true }).click();
  const trigger = page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="notaFiscal"]').getByRole('button', { name: 'Adicionar Nota', exact: true });
  const modal = page.locator('#modal-dados-nota');
  const geometry = () => page.evaluate(() => {
    const a = document.activeElement;
    const r = a.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const unobscured = [[cx, cy], [cx, r.top + 2], [cx, r.bottom - 2], [r.left + 2, cy], [r.right - 2, cy]].every(([x, y]) => {
      const target = document.elementFromPoint(x, y);
      return target === a || a.contains(target);
    });
    return { id: a.id, tag: a.tagName, text: a.textContent?.trim().slice(0, 100), insideModal: Boolean(a.closest('#modal-dados-nota')), visibleInViewport: r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, hit: hit === a || a.contains(hit), unobscured, hitElement: { tag: hit?.tagName, id: hit?.id, className: hit?.className }, rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
  });
  const scan = async () => {
    const axe = await new AxeBuilder({ page }).include('#modal-dados-nota').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const compact = results => results.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
    return { violations: compact(axe.violations), incomplete: compact(axe.incomplete), passes: axe.passes.length };
  };
  for (const zoom of [1, 2]) {
    const sample = { zoom, keyboard: [] }; report.cases.push(sample);
    sample.actualZoom = await worker.evaluate(async ({ url, factor }) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(t => t.url?.startsWith(url));
      if (!tab) throw new Error('App tab missing');
      await chrome.tabs.setZoom(tab.id, factor);
      return chrome.tabs.getZoom(tab.id);
    }, { url: baseURL, factor: zoom });
    await page.waitForFunction(factor => devicePixelRatio === factor && innerWidth === 1440 / factor, zoom);
    sample.viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, pinchScale: visualViewport.scale }));
    await trigger.focus(); await page.keyboard.press('Enter');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveCSS('opacity', '1');
    await screenshot(`invoice-${zoom * 100}-normal.png`);
    sample.initialFocus = await geometry();
    sample.normal = await scan();
    // Traverse actual controls by Tab, including browser scrolling at 200%.
    for (let i = 0; i < 9; i++) {
      // Let the browser present the focus scroll before measuring its settled position.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      sample.keyboard.push(await geometry());
      if (zoom === 2) await screenshot(`invoice-200-tab-${i}.png`);
      await page.keyboard.press('Tab');
    }
    const submit = modal.locator('button[type="submit"]');
    // Reach submit using keyboard from the current cycle, never force a hidden element.
    for (let i = 0; i < 10 && !(await submit.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(submit).toBeFocused();
    sample.submitFocus = await geometry();
    await page.keyboard.press('Enter');
    await expect(page.locator('#nota-desc')).toBeFocused();
    sample.validation = await page.locator('#nota-desc').evaluate(el => ({ valueMissing: el.validity.valueMissing, message: el.validationMessage, invalid: el.matches(':invalid') }));
    await screenshot(`invoice-${zoom * 100}-invalid.png`);
    sample.invalid = await scan();
    // Correct fields, then cancel: no legitimate invoice should be persisted by an accessibility probe.
    await page.locator('#nota-desc').fill('Papelaria — diagnóstico descartável');
    await page.locator('#nota-numero').fill('F06-NF-001');
    await page.locator('#nota-valor').fill('123.45');
    sample.correctedFormValid = await page.locator('#form-dados-nota').evaluate(el => el.checkValidity());
    await page.keyboard.press('Escape');
    // Legacy overlays close with opacity/pointer-events, not display:none.
    // Playwright's visibility predicate deliberately includes opacity:0 elements.
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');
    await expect(modal).toHaveCSS('opacity', '0');
    await expect(modal).toHaveCSS('pointer-events', 'none');
    await expect(trigger).toBeFocused();
    sample.returnFocus = true;
    sample.competence = await page.locator('#global-competence-select').inputValue();
    write(); console.log(`F06 completed zoom ${zoom * 100}%`);
  }
  report.persistedInvoices = Number(sql(`select count(*) from public.registered_invoices where school_id = '${schoolId}';`));
  if (report.persistedInvoices || report.invoiceWriteRequests) throw new Error('Unexpected invoice write');
  for (const sample of report.cases) {
    const obscured = sample.keyboard.filter(item => !item.insideModal || !item.visibleInViewport || !item.unobscured);
    expect(obscured, `Keyboard focus must remain visible and unobscured at ${sample.zoom * 100}%`).toEqual([]);
    expect(sample.normal.violations).toEqual([]);
    expect(sample.invalid.violations).toEqual([]);
  }
  report.completed = true;
} catch (error) {
  report.failures.push(error.message);
  if (cdp) await screenshot('failure.png').catch(() => {});
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await new Promise(resolve => server ? server.close(resolve) : resolve());
  for (const user of users) {
    const result = await admin.auth.admin.deleteUser(user.id);
    if (result.error) { report.failures.push(`Auth cleanup: ${result.error.code}`); process.exitCode = 1; }
  }
  try {
    sql(`begin; delete from public.schools where id = '${schoolId}'; delete from public.controllers where id = '${runKey}-C0'; commit;`);
    report.after = counts();
    if (JSON.stringify(report.before) !== JSON.stringify(report.after)) throw new Error('Fixture counts not restored');
  } catch (error) { report.failures.push(error.message); process.exitCode = 1; }
  fs.rmSync(temporary, { recursive: true, force: true });
  write();
  console.log(JSON.stringify({ completed: report.completed || false, failures: report.failures, cases: report.cases.length, output }));
}
