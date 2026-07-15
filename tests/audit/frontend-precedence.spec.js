const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repositoryRoot = path.resolve(__dirname, '../..');
const analyzerUrl = pathToFileURL(path.join(repositoryRoot, 'scripts/audit/analyze-frontend-precedence.mjs')).href;

function localPathFromUrl(url) {
  return decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
}

test('ordem efetiva corresponde ao contrato estático de precedência', async ({ page }) => {
  const { analyzeFrontendPrecedence } = await import(analyzerUrl);
  const manifest = await analyzeFrontendPrecedence(repositoryRoot);
  const expectedScripts = new Set(manifest.scripts.expectedExecutionOrder);
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
    await route.fulfill({ response, body: `${instrumentation}${source}` });
  });

  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.RadarExcelExportIntegration));
  await page.waitForFunction(expected => (
    document.querySelectorAll('link[rel="stylesheet"]').length >= expected
  ), manifest.styles.loadOrder.length);

  const observedScripts = await page.evaluate(() => window.__RADAR_EXECUTION_ORDER__ || []);
  const observedStyles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => (
    links.map(link => decodeURIComponent(new URL(link.href).pathname).replace(/^\/+/, ''))
  ));

  expect(observedScripts).toEqual(manifest.scripts.expectedExecutionOrder);
  expect(observedScripts.filter(script => script === 'src/domain/retificacoes.js')).toHaveLength(1);
  expect(observedStyles).toEqual(manifest.styles.loadOrder);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
