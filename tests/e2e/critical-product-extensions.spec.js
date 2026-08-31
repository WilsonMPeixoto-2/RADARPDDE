const { test, expect } = require('@playwright/test');

test.describe('Contrato de extensões críticas', () => {
  test('carrega e instala a cadeia funcional de Assessoria antes do uso', async ({ page }, testInfo) => {
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
        correctiveApi: Boolean(window.RadarServiceAdvisoryCorrectiveSubmission)
      };
    });

    expect(state).toEqual({
      ready: true,
      lastError: null,
      advisoryInstalled: true,
      correctiveSubmissionInstalled: true,
      advisoryApi: true,
      correctiveApi: true
    });
  });
});
