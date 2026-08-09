const { test, expect } = require('@playwright/test');

async function deferGlobalCompetenceSelector(page) {
  await page.route('**/src/integration/global-competence-selector.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({
      response,
      body: `
        window.__task3ReleaseGlobalCompetenceSelector = function releaseGlobalCompetenceSelector() {
          const source = ${JSON.stringify(source)};
          delete window.__task3ReleaseGlobalCompetenceSelector;
          const script = document.createElement('script');
          script.textContent = source;
          document.head.appendChild(script);
          script.remove();
        };
      `
    });
  });
}

test.describe('competência global entre Carteira e Competências', () => {
  test('seleciona agosto na Carteira e preserva contexto e dados ao navegar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário mensal exclusivo do desktop.');

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await page.waitForFunction(() => (
      window.RadarCompetenceContext?.isInitialized?.()
      && Boolean(window.RadarCycleBCarteira)
    ));

    const seeded = await page.evaluate(() => {
      const mayKey = '2026-05';
      const augustKey = '2026-08';
      const school = escolas.find(item => (
        Array.isArray(item.programasIds)
        && item.programasIds.length > 0
        && isCompetenceInScope(item.competenciaInicial, mayKey)
      ));
      if (!school) throw new Error('Escola apta ao cenário mensal da Carteira não encontrada.');

      verificacoes[school.id] = verificacoes[school.id] || {};
      school.programasIds.forEach(programId => {
        verificacoes[school.id][`${mayKey}_${programId}`] = {
          bonificacao: {},
          resultadoBonif: 'inapta'
        };
        verificacoes[school.id][`${augustKey}_${programId}`] = {
          bonificacao: {},
          resultadoBonif: 'apta'
        };
      });

      RadarCompetenceContext.select(mayKey, { source: 'task-3-test-setup' });
      switchProfile('controlador');
      switchView('escolas');

      return { schoolName: school.denominação };
    });

    const carteiraRow = page.locator('table.data-table tbody tr')
      .filter({ hasText: seeded.schoolName })
      .first();
    await expect(page.locator('#carteira-competencia-select')).toHaveValue('2026-05');
    await expect(carteiraRow.locator('td').nth(4)).toHaveText(/INAPTA/);

    await page.locator('#carteira-competencia-select').selectOption('2026-08');

    await expect(page.locator('#carteira-competencia-select')).toHaveValue('2026-08');
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    await expect(page.locator('#global-competence-label')).toHaveText('Agosto 2026');
    await expect(carteiraRow.locator('td').nth(4)).toHaveText(/APTA/);
    expect(await page.evaluate(() => ({
      contextKey: RadarCompetenceContext.getState().activeKey,
      mirror: activeCompetenciaKey,
      prontuarioMirror: activeProntuarioCompetencia
    }))).toEqual({
      contextKey: '2026-08',
      mirror: '2026-08',
      prontuarioMirror: '2026-08'
    });

    await page.locator('#nav-competencias').click();

    const heading = page.getByRole('heading', {
      name: /Lista de Entrega e Bonificação - Competência Agosto\/2026/
    });
    const competenceRow = page.locator('table.data-table tbody tr')
      .filter({ hasText: seeded.schoolName })
      .first();
    await expect(heading).toBeVisible();
    await expect(competenceRow.locator('td').nth(2)).toContainText('APTA');
    await expect(page.locator('#comp-select-view')).toHaveCount(0);
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    expect(pageErrors).toEqual([]);
  });

  for (const viewCase of [
    { view: 'escolas', path: '/carteira', heading: 'Escolas e Carteiras' },
    { view: 'competencias', path: '/competencias', heading: 'Visão por Competência' }
  ]) {
    test(`recupera ${viewCase.view} uma única vez após o bootstrap canônico`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário de bootstrap exclusivo do desktop.');

      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await deferGlobalCompetenceSelector(page);
      await page.goto(viewCase.path);
      await page.waitForFunction(() => (
        typeof window.switchView === 'function'
        && typeof window.__task3ReleaseGlobalCompetenceSelector === 'function'
        && Boolean(window.RadarNavigationReady)
        && window.RadarDataContext?.ready === true
        && window.RadarCompetenceContext?.isInitialized?.() !== true
      ));

      expect(await page.evaluate(async () => Promise.race([
        window.RadarNavigationReady.then(() => true),
        new Promise(resolve => window.setTimeout(() => resolve(false), 100))
      ]))).toBe(false);

      await page.evaluate(() => {
        window.__task3BootstrapRender = { completed: 0 };
        const container = document.getElementById('main-container');
        const observer = new MutationObserver(() => {
          const heading = container.querySelector('.page-title h1')?.textContent?.trim();
          if (heading === 'Escolas e Carteiras' || heading === 'Visão por Competência') {
            window.__task3BootstrapRender.completed += 1;
          }
        });
        observer.observe(container, { childList: true });
        window.__task3BootstrapObserver = observer;
      });

      await page.evaluate(() => window.__task3ReleaseGlobalCompetenceSelector());
      await page.evaluate(() => window.RadarNavigationReady);
      await page.waitForFunction(() => window.RadarCompetenceContext?.isInitialized?.());
      await expect(page.getByRole('heading', { name: viewCase.heading })).toBeVisible();

      expect(await page.evaluate(() => {
        window.__task3BootstrapObserver.disconnect();
        return window.__task3BootstrapRender.completed;
      })).toBe(1);
      expect(pageErrors).toEqual([]);
    });
  }
});
