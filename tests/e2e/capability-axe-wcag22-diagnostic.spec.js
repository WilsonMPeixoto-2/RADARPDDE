'use strict';
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { selectFixtureCompetence } = require('../support/e2e-competence');
const legacyTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function summary(scan) {
  return {
    engine: scan.testEngine?.version || null,
    ruleCount: scan.passes.length + scan.violations.length + scan.incomplete.length + scan.inapplicable.length,
    violations: scan.violations.map(rule => ({
      id: rule.id, impact: rule.impact, count: rule.nodes.length,
      targets: rule.nodes.slice(0, 8).map(node => node.target)
    })),
    incomplete: scan.incomplete.map(rule => ({ id: rule.id, count: rule.nodes.length }))
  };
}

async function compare(page, stage) {
  const legacy = await new AxeBuilder({ page }).withTags(legacyTags).analyze();
  const modern = await new AxeBuilder({ page }).withTags([...legacyTags, 'wcag22aa']).analyze();
  const prev = new Set(legacy.violations.map(item => item.id));
  return {
    stage, before: summary(legacy), after: summary(modern),
    newRuleViolations: modern.violations.filter(item => !prev.has(item.id))
      .map(item => ({ id: item.id, impact: item.impact, count: item.nodes.length }))
  };
}

test('diagnosticar WCAG 2.2 no Dashboard Prontuário e Pendências desktop', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.waitForFunction(() => window.RadarDataContext?.ready === true);
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady) await window.RadarProductExtensionsReady;
    switchProfile('controlador');
    switchView('dashboard');
  });
  await expect(page.locator('#main-container')).toBeVisible();
  const results = [await compare(page, 'dashboard')];

  await selectFixtureCompetence(page, '2026-05');
  const schoolId = await page.evaluate(() => {
    const key = window.RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(s => Array.isArray(s.programasIds)
      && s.programasIds.includes('BASIC')
      && isCompetenceInScope(s.competenciaInicial, key));
    if (!school) throw new Error('Fixture sem escola BASIC em 2026-05');
    switchView('prontuario', school.id);
    return school.id;
  });
  await expect(page.locator('#main-container .school-grid')).toBeVisible();
  results.push(await compare(page, 'prontuario'));

  await page.evaluate(() => switchView('pendencias'));
  await expect.poll(() => page.evaluate(() => window.RadarNavigationHistory
    ?.currentRoute?.(window)?.view)).toBe('pendencias');
  await expect(page.locator('#main-container')).toContainText('Pendências');
  results.push(await compare(page, 'pendencias'));

  const report = {
    kind: 'axe-4.14-wcag22-diagnostic',
    schoolFixturePresent: Boolean(schoolId),
    results,
    limits: ['Somente fixture desktop local.', 'Não equivale a conformidade WCAG humana.']
  };
  await testInfo.attach('axe-wcag22-diagnostic.json', {
    body: Buffer.from(JSON.stringify(report, null, 2), 'utf8'),
    contentType: 'application/json'
  });
  console.log('RADAR_AXE_WCAG22_DIAGNOSTIC=' + JSON.stringify(report));
  expect(results).toHaveLength(3);
  expect(results.every(v => v.after.ruleCount > 0)).toBe(true);
});
