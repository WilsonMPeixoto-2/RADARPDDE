const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repositoryRoot = path.resolve(__dirname, '../..');
const analyzerUrl = pathToFileURL(path.join(repositoryRoot, 'scripts/audit/analyze-frontend-precedence.mjs')).href;

function localPathFromUrl(url) {
  return decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
}

async function observeExecution(page, manifest, { delayCoreAfterConfig = false } = {}) {
  const expectedScripts = new Set([
    ...manifest.scripts.staticOrder,
    ...manifest.scripts.effectiveExtensions,
    ...manifest.scripts.chainedScripts
  ]);
  const configIndex = manifest.scripts.staticOrder.indexOf('config.js');
  const delayedCore = new Set(manifest.scripts.staticOrder.slice(configIndex + 1));
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.route('**/*.js', async route => {
    const relativePath = localPathFromUrl(route.request().url());
    if (!expectedScripts.has(relativePath)) {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const source = await response.text();
    const instrumentation = `window.__RADAR_EXECUTION_ORDER__ = window.__RADAR_EXECUTION_ORDER__ || []; window.__RADAR_EXECUTION_ORDER__.push(${JSON.stringify(relativePath)});\n`;
    if (delayCoreAfterConfig && delayedCore.has(relativePath)) {
      await new Promise(resolve => setTimeout(resolve, 180));
    }
    await route.fulfill({ response, body: `${instrumentation}${source}` });
  });

  await page.goto('/');
  await page.waitForFunction(() => Boolean(
    window.RadarTask9PendencyPage
      && window.RadarTask1011PendencyActions
      && window.RadarCycleBDashboard
      && window.RadarExcelExportIntegration
  ));
  await page.waitForFunction(expected => (
    document.querySelectorAll('link[rel="stylesheet"]').length >= expected
  ), manifest.styles.loadOrder.length);

  const observedScripts = await page.evaluate(() => window.__RADAR_EXECUTION_ORDER__ || []);
  const observedStyles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => (
    links.map(link => decodeURIComponent(new URL(link.href).pathname).replace(/^\/+/, ''))
  ));

  return { observedScripts, observedStyles, pageErrors, consoleErrors };
}

function expectExecutionContract(observation, manifest) {
  const asynchronous = new Set(manifest.scripts.asynchronousExtensions);
  const orderedObservation = observation.observedScripts.filter(path => !asynchronous.has(path));

  expect(orderedObservation).toEqual(manifest.scripts.expectedOrderedExecution);
  for (const asynchronousPath of asynchronous) {
    expect(observation.observedScripts.filter(path => path === asynchronousPath)).toHaveLength(1);
    expect(observation.observedScripts.indexOf(asynchronousPath))
      .toBeLessThan(observation.observedScripts.indexOf(manifest.scripts.chainedScripts[0]));
  }
  expect(observation.observedScripts.filter(script => script === 'src/domain/retificacoes.js')).toHaveLength(1);
  expect(observation.observedStyles).toEqual(manifest.styles.loadOrder);
  expect(observation.pageErrors).toEqual([]);
  expect(observation.consoleErrors).toEqual([]);
}

test('baseline do servidor de auditoria corresponde à ordem observada', async ({ page }) => {
  const { analyzeFrontendPrecedence } = await import(analyzerUrl);
  const manifest = await analyzeFrontendPrecedence(repositoryRoot);
  const observation = await observeExecution(page, manifest);

  expectExecutionContract(observation, manifest);
});

test('extensões ordenadas preservam contrato e inicializam com núcleo atrasado', async ({ page }) => {
  const { analyzeFrontendPrecedence } = await import(analyzerUrl);
  const manifest = await analyzeFrontendPrecedence(repositoryRoot);
  const observation = await observeExecution(page, manifest, { delayCoreAfterConfig: true });

  expectExecutionContract(observation, manifest);
});
