const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

const evidenceRoot = path.resolve(__dirname, '../../docs/evidence/global-baseline');
const MAX_FULL_PAGE_HEIGHT = 30000;
const scenarios = [
  { profile: 'controlador', surface: 'dashboard', state: 'padrao', view: 'dashboard' },
  { profile: 'controlador', surface: 'carteira', state: 'resultado', view: 'escolas' },
  { profile: 'controlador', surface: 'competencias', state: 'padrao', view: 'competencias' },
  { profile: 'controlador', surface: 'pendencias', state: 'padrao', view: 'pendencias' },
  { profile: 'controlador', surface: 'inventario', state: 'padrao', view: 'inventario' },
  { profile: 'controlador', surface: 'registros-internos', state: 'padrao', view: 'auditoria' },
  { profile: 'sme', surface: 'dashboard', state: 'padrao', view: 'dashboard' },
  { profile: 'sme', surface: 'configuracoes', state: 'padrao', view: 'sme-config' }
];

function captureName(scenario, viewport) {
  return `${scenario.profile}__${scenario.surface}__${scenario.state}__${viewport}.png`;
}

async function sanitizeVisibleEvidence(page) {
  await page.evaluate(() => {
    const userName = document.querySelector('#current-user-name');
    if (userName) userName.textContent = 'Usuário de teste';

    document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').forEach(element => {
      element.textContent = 'dado protegido';
      element.removeAttribute('href');
    });
    document.querySelectorAll('input[type="email"], input[type="tel"]').forEach(element => {
      element.value = '';
      element.setAttribute('placeholder', 'dado protegido');
    });

    const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const phonePattern = /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-.\s]?\d{4}/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      node.nodeValue = node.nodeValue.replace(emailPattern, 'dado protegido').replace(phonePattern, 'dado protegido');
    }
  });
}

async function capturePage(page, file) {
  const documentHeight = await page.evaluate(() => Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight || 0
  ));
  const fullPage = documentHeight <= MAX_FULL_PAGE_HEIGHT;
  if (!fullPage) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: file, fullPage });
  await fs.writeFile(file.replace(/\.png$/, '.meta.json'), JSON.stringify({
    captureMode: fullPage ? 'full-page' : 'viewport-bounded',
    documentHeight
  }));
}

test.describe('linha de base visual global', () => {
  for (const scenario of scenarios) {
    test(`${scenario.profile} — ${scenario.surface}`, async ({ page }, testInfo) => {
      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });

      await page.goto('/');
      await expect(page.locator('#app-layout')).toBeVisible();
      await page.waitForFunction(() => document.querySelectorAll('link[data-radar-extension]').length >= 9);
      await page.evaluate(({ profile, view }) => {
        localStorage.removeItem('radar_cycle_b_dashboard_filter');
        localStorage.removeItem('radar_cycle_b_wallet_filters');
        switchProfile(profile);
        switchView(view);
      }, scenario);

      await expect(page.locator('#main-container')).toBeVisible();
      await page.waitForTimeout(300);
      await sanitizeVisibleEvidence(page);
      const viewport = testInfo.project.name;
      const file = path.join(evidenceRoot, viewport, captureName(scenario, viewport));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await capturePage(page, file);

      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});
