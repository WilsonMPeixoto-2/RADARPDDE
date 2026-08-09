const { test, expect } = require('@playwright/test');

const BOOTSTRAP_DASHBOARD_CASES = [
  {
    profile: 'controlador',
    renderer: 'renderDashboardControlador',
    heading: 'Painel do Controlador'
  },
  {
    profile: 'assistente',
    renderer: 'renderDashboardAssistente',
    heading: 'Painel do Assistente de Verbas Federais'
  },
  {
    profile: 'sme',
    renderer: 'renderDashboardSME',
    heading: 'Painel da Subsecretaria (SME)'
  }
];

async function deferGlobalCompetenceSelector(page) {
  await page.route('**/src/integration/global-competence-selector.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({
      response,
      body: `
        window.__task2ReleaseGlobalCompetenceSelector = function releaseGlobalCompetenceSelector() {
          const source = ${JSON.stringify(source)};
          delete window.__task2ReleaseGlobalCompetenceSelector;
          const script = document.createElement('script');
          script.textContent = source;
          document.head.appendChild(script);
          script.remove();
        };
      `
    });
  });
}

test.describe('competência global nos dashboards', () => {
  test('controle mensal SME comanda contexto, cabeçalho, cards e tabela', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário mensal exclusivo do desktop.');

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await page.waitForFunction(() => window.RadarCompetenceContext?.isInitialized?.());

    const seeded = await page.evaluate(() => {
      const mayKey = '2026-05';
      const augustKey = '2026-08';
      const targetSchool = escolas.find(school => (
        school.cre
        && Array.isArray(school.programasIds)
        && school.programasIds.length > 0
        && isCompetenceInScope(school.competenciaInicial, mayKey)
      ));
      if (!targetSchool) throw new Error('Escola apta ao cenário mensal SME não encontrada.');

      const targetSchools = escolas.filter(school => school.cre === targetSchool.cre);
      targetSchools.forEach(school => {
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
      });

      RadarCompetenceContext.select(mayKey, { source: 'dashboard-test-setup' });
      switchProfile('sme');
      switchView('dashboard');

      return {
        cre: targetSchool.cre,
        schoolName: targetSchool.denominação,
        expectedAptSchools: targetSchools.length
      };
    });

    await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
    await page.locator('table.data-table tbody tr')
      .filter({ hasText: seeded.cre })
      .first()
      .getByRole('button', { name: 'Detalhamento' })
      .click();
    await expect(page.locator('#sme-detail-table')).toBeVisible();
    const detailRow = page.locator('#sme-detail-table tbody tr')
      .filter({ hasText: seeded.schoolName })
      .first();
    await expect(detailRow.locator('td').last()).toHaveText(/^\s*inapta\s*$/i);

    const local = page.locator('select[data-radar-sme-competence="true"]');
    await local.selectOption('2026-08');

    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    await expect(page.locator('#global-competence-label')).toHaveText('Agosto 2026');
    await expect(local).toHaveValue('2026-08');
    const aptCard = page.locator('.card-stat')
      .filter({ hasText: 'Unidades Aptas (Agosto 2026)' });
    await expect(aptCard).toBeVisible();
    await expect(aptCard.locator('.stat-value')).toHaveText(`${seeded.expectedAptSchools} Escolas`);
    await expect(page.getByRole('columnheader', { name: 'Aptas (Agosto 2026)', exact: true })).toBeVisible();
    await expect(detailRow.locator('td').last()).toHaveText(/^\s*apta\s*$/i);

    expect(await page.evaluate(() => ({
      contextKey: RadarCompetenceContext.getState().activeKey,
      mirror: activeCompetenciaKey,
      prontuarioMirror: activeProntuarioCompetencia
    }))).toEqual({
      contextKey: '2026-08',
      mirror: '2026-08',
      prontuarioMirror: '2026-08'
    });
    expect(pageErrors).toEqual([]);
  });

  for (const dashboardCase of BOOTSTRAP_DASHBOARD_CASES) {
    test(`recupera o primeiro Dashboard de ${dashboardCase.profile} após o bootstrap canônico`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário de bootstrap exclusivo do desktop.');

      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      await deferGlobalCompetenceSelector(page);
      await page.goto('/');
      await page.waitForFunction(() => (
        typeof window.switchProfile === 'function'
        && typeof window.__task2ReleaseGlobalCompetenceSelector === 'function'
        && Boolean(window.RadarNavigationReady)
        && window.RadarDataContext?.ready === true
        && window.RadarCompetenceContext?.isInitialized?.() !== true
      ));
      expect(await page.evaluate(async () => ({
        cycleBDashboardInstalled: Boolean(window.RadarCycleBDashboard),
        navigationSettled: await Promise.race([
          window.RadarNavigationReady.then(() => true),
          new Promise(resolve => window.setTimeout(() => resolve(false), 100))
        ])
      }))).toEqual({
        cycleBDashboardInstalled: true,
        navigationSettled: false
      });

      await page.evaluate(({ profile, renderer }) => {
        switchProfile(profile);
        const originalRenderer = window[renderer];
        if (typeof originalRenderer !== 'function') {
          throw new Error(`Renderer ${renderer} indisponível no bootstrap.`);
        }
        window.__task2DashboardBootstrap = {
          rendererCalls: 0,
          profileSwitchesAfterSelection: 0
        };
        window[renderer] = function countRecoveredDashboard(...args) {
          window.__task2DashboardBootstrap.rendererCalls += 1;
          return originalRenderer.apply(this, args);
        };
        const originalSwitchProfile = window.switchProfile;
        window.switchProfile = function countUnexpectedProfileSwitch(...args) {
          window.__task2DashboardBootstrap.profileSwitchesAfterSelection += 1;
          return originalSwitchProfile.apply(this, args);
        };
      }, dashboardCase);

      await page.evaluate(() => window.__task2ReleaseGlobalCompetenceSelector());
      await page.evaluate(() => window.RadarNavigationReady);
      await page.waitForFunction(() => (
        window.RadarCompetenceContext?.isInitialized?.()
        && Boolean(window.RadarCycleBDashboard)
      ));

      expect(await page.evaluate(() => ({
        rendererCalls: window.__task2DashboardBootstrap.rendererCalls,
        profileSwitchesAfterSelection: window.__task2DashboardBootstrap.profileSwitchesAfterSelection,
        profile: currentProfile,
        view: currentView,
        heading: document.querySelector('#main-container .page-title h1')?.textContent?.trim() || ''
      }))).toEqual({
        rendererCalls: 1,
        profileSwitchesAfterSelection: 0,
        profile: dashboardCase.profile,
        view: 'dashboard',
        heading: dashboardCase.heading
      });
      expect(pageErrors).toEqual([]);
    });
  }
});
