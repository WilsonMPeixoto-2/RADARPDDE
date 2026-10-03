'use strict';

const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test('refresh no mesmo Prontuário mantém o painel visível desde o primeiro frame', async ({ page }, testInfo) => {
  test.skip(process.env.RADAR_E2E_SUPABASE_LOCAL === '1', 'Prova visual isolada usa o modo local; cinco sessões provam o backend real.');
  await page.goto('/');
  await page.waitForFunction(() => window.RadarDataContext?.ready === true);
  await page.evaluate(async () => { await window.RadarProductExtensionsReady; });
  await selectFixtureCompetence(page, '2026-05');
  await page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(item => item.programasIds?.includes('BASIC')
      && isCompetenceInScope(item.competenciaInicial, '2026-05'));
    if (!school) throw new Error('Contexto local do teste visual ausente.');
    switchView('prontuario', school.id);
  });
  const panel = page.locator('#tab-verificacoes');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('opacity', '1');
  // Mesmo caminho de render usado pelo refresh Realtime. O Supabase/gestos
  // reais são provados pela jornada de cinco sessões; aqui isolamos a pintura.
  const frames = await page.evaluate(async () => {
    const samples = [];
    window.RadarGlobalCompetenceSelector.refreshCurrentView();
    for (let n = 0; n < 12; n += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const style = getComputedStyle(document.getElementById('tab-verificacoes'));
      samples.push({ opacity: Number(style.opacity), animation: style.animationName });
    }
    return samples;
  });
  await testInfo.attach('refresh-opacity-frames', {
    body: Buffer.from(JSON.stringify(frames, null, 2)), contentType: 'application/json'
  });
  expect(Math.min(...frames.map(frame => frame.opacity))).toBeGreaterThanOrEqual(0.95);
});
