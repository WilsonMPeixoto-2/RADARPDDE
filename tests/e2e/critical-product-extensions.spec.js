const { test, expect } = require('@playwright/test');

test.describe('Contrato de extensões críticas', () => {
  test('carrega e instala a cadeia funcional crítica antes do uso', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato estrutural validado uma vez no desktop.');

    await page.goto('/');
    const state = await page.evaluate(async () => {
      const ready = await window.RadarProductExtensionsReady;
      const pendencies = window.RadarApplicationServices?.pendencies;
      return {
        ready,
        lastError: window.RADAR_LAST_PRODUCT_EXTENSION_ERROR
          ? String(window.RADAR_LAST_PRODUCT_EXTENSION_ERROR.message || window.RADAR_LAST_PRODUCT_EXTENSION_ERROR)
          : null,
        advisoryInstalled: pendencies?.__radarServiceAdvisoryPendency === true,
        correctiveSubmissionInstalled:
          pendencies?.__radarServiceAdvisoryCorrectiveSubmission === true,
        advisoryApi: Boolean(window.RadarServiceAdvisoryPendency),
        correctiveApi: Boolean(window.RadarServiceAdvisoryCorrectiveSubmission),
        criticalGuardApi: Boolean(window.RadarCriticalActionGuard),
        submissionGuarded: window.confirmarRegistrarNovoEnvio?.__radarCriticalActionGuard === true,
        reanalysisGuarded: window.confirmarReanalisePendencia?.__radarCriticalActionGuard === true,
        forwardGuarded: window.encaminharCapital?.__radarCriticalActionGuard === true,
        inventoryGuarded: window.salvarInventariacao?.__radarCriticalActionGuard === true
      };
    });

    expect(state).toEqual({
      ready: true,
      lastError: null,
      advisoryInstalled: true,
      correctiveSubmissionInstalled: true,
      advisoryApi: true,
      correctiveApi: true,
      criticalGuardApi: true,
      submissionGuarded: true,
      reanalysisGuarded: true,
      forwardGuarded: true,
      inventoryGuarded: true
    });
  });
});
