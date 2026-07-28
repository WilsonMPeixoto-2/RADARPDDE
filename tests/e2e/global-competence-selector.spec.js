const { test, expect } = require('@playwright/test');

const PROFILE_CASES = [
  { profile: 'controlador', views: ['dashboard', 'escolas', 'competencias', 'pendencias', 'auditoria'] },
  { profile: 'assistente', views: ['dashboard', 'escolas', 'competencias', 'pendencias', 'equipe', 'auditoria'] },
  { profile: 'sme', views: ['dashboard', 'escolas', 'competencias', 'pendencias', 'auditoria', 'sme-config'] },
  { profile: 'inventario', views: ['dashboard', 'escolas', 'inventario', 'auditoria'] }
];

test.describe('competência mensal global', () => {
  test('oferece janeiro a dezembro, altera todas as superfícies e preserva a seleção', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarCompetenceContext));

    const selector = page.locator('#global-competence-select');
    await expect(selector).toBeVisible();
    await expect(selector.locator('option')).toHaveCount(12);
    await selector.selectOption('2026-08');

    await expect(selector).toHaveValue('2026-08');
    await expect(page.locator('#global-competence-label')).toContainText('Agosto');

    for (const { profile, views } of PROFILE_CASES) {
      await page.evaluate(nextProfile => switchProfile(nextProfile), profile);
      for (const view of views) {
        await page.evaluate(nextView => switchView(nextView), view);
        await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
        expect(await page.evaluate(() => activeCompetenciaKey)).toBe('2026-08');
      }
    }

    await page.reload();
    await page.waitForFunction(() => Boolean(window.RadarCompetenceContext));
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    expect(await page.evaluate(() => activeCompetenciaKey)).toBe('2026-08');
  });

  test('mantém exercício e competência sincronizados sem seleção concorrente na página mensal', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarCompetenceContext));

    await page.locator('#global-competence-select').selectOption('2026-12');
    await page.evaluate(() => switchView('competencias'));

    await expect(page.locator('#global-competence-select')).toHaveValue('2026-12');
    await expect(page.locator('#comp-select-view')).toHaveCount(0);
    expect(await page.evaluate(() => ({
      currentExercise,
      activeCompetenciaKey,
      context: window.RadarCompetenceContext.getState()
    }))).toEqual({
      currentExercise: '2026',
      activeCompetenciaKey: '2026-12',
      context: {
        exercise: '2026',
        activeKey: '2026-12',
        availableKeys: [
          '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
          '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
        ],
        closingKey: '2026-05'
      }
    });
  });
});
