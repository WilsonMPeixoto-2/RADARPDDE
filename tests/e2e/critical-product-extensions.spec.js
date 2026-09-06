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

  test('feedback pós-save alcança o DataService real na ordem real do bootstrap', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Composição real validada uma vez no desktop.');

    await page.goto('/');
    const state = await page.evaluate(async () => {
      await window.RadarProductExtensionsReady;
      const dataService = window.RadarApplicationServices?.invoices?.dataService;
      const notice = document.getElementById('pendency-notice');
      if (!dataService || !notice) throw new Error('DataService ou região de feedback indisponível.');
      const capabilities = dataService.repository.capabilities();
      if (capabilities.remote) throw new Error('Regressão de composição exige runtime local sem escrita remota.');

      notice.hidden = true;
      notice.textContent = '';
      delete notice.dataset.radarSaveFeedback;
      let persistCalls = 0;
      const result = await dataService.execute({
        name: 'invoice:save',
        changedEntities: ['schools'],
        mutate: () => ({ auditOnly: true }),
        persist: async () => {
          persistCalls += 1;
          return {};
        }
      });

      return {
        remote: capabilities.remote === true,
        persistCalls,
        resultOk: result.ok,
        ownExecute: Object.hasOwn(dataService, 'execute'),
        performanceInstalled: dataService.__radarOperationalWritePerformance === true,
        feedbackPrototypeInstalled:
          Object.getPrototypeOf(dataService).__radarOperationalSaveFeedbackWrapped === true,
        feedbackInstanceInstalled:
          dataService.__radarOperationalSaveFeedbackInstanceWrapped === true,
        notice: {
          hidden: notice.hidden,
          text: notice.textContent,
          kind: notice.dataset.radarSaveFeedback || null
        }
      };
    });

    expect(state).toEqual({
      remote: false,
      persistCalls: 1,
      resultOk: true,
      ownExecute: true,
      performanceInstalled: true,
      feedbackPrototypeInstalled: true,
      feedbackInstanceInstalled: true,
      notice: {
        hidden: false,
        text: 'Nota fiscal salva com sucesso.',
        kind: 'success'
      }
    });
  });
});
