'use strict';

/**
 * AUDITORIA INDEPENDENTE — OUTRO AGENTE (2026-10-12)
 * Não é trabalho do Codex e não altera código funcional do RADAR.
 * Objetivo: capturar cronologia autêntica e sintomas observados para validação
 * ou contestação do Codex. A suíte exige Supabase LOCAL com usuários efêmeros.
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Diagnóstico exclusivo do Supabase Auth local descartável.');
const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && !password) throw new Error('Fixture Auth efêmera indisponível.');

async function installTimeline(page) {
  await page.addInitScript(() => {
    const trace = [];
    const t0 = performance.now();
    let previous = '';
    function capture(label) {
      const currentRoute = (() => {
        try {
          const route = window.RadarNavigationHistory?.currentRoute?.(window);
          return route ? { view: route.view, escola: route.filters?.escola || '' } : null;
        } catch (_error) { return null; }
      })();
      const school = (() => {
        try { return window.RadarTask9PendencyPage?.getState?.()?.filters?.schoolId || ''; }
        catch (_error) { return ''; }
      })();
      const item = {
        tMs: Math.round(performance.now() - t0), label,
        readyState: document.readyState,
        path: location.pathname + location.search,
        task9: !!window.RadarTask9PendencyPage,
        focus: !!window.RadarTask9FocusBridge,
        crossView: !!window.RadarTask9CrossView,
        navBootstrap: !!window.__radarNavigationBootstrapInstalled,
        navHistory: !!window.__radarNavigationHistoryInstalled,
        dataReady: window.RadarDataContext?.ready === true,
        role: window.RadarAuthContext?.authorization?.role || '',
        route: currentRoute,
        stateSchool: window.history.state?.filters?.escola || '',
        pageSchool: school,
        domSchool: document.querySelector('#pendency-filter-school')?.value ?? null
      };
      const next = JSON.stringify(item, (key, value) => key === 'tMs' || key === 'label' ? undefined : value);
      if (label !== 'poll' || next !== previous) {
        if (trace.length < 400) trace.push(item);
        previous = next;
      }
    }
    Object.defineProperty(window, '__independentAgentNavigationTimeline', {
      value: trace, configurable: false, enumerable: false
    });
    ['radar:application-services-ready', 'radar:pendency-page-ready',
      'radar:navigation-committed', 'radar:auth-resolved', 'radar:auth-required',
      'radar:competence-change'].forEach(name => {
      window.addEventListener(name, () => capture(name), { capture: true });
    });
    capture('init-script');
    const interval = window.setInterval(() => {
      if (trace.length >= 400 || performance.now() - t0 > 90000) {
        clearInterval(interval);
      } else {
        capture('poll');
      }
    }, 50);
  });
}

async function snapshot(page, label) {
  return page.evaluate(name => {
    const route = window.RadarNavigationHistory?.currentRoute?.(window);
    return {
      label: name,
      timeMs: Math.round(performance.now()),
      path: location.pathname + location.search,
      historySchool: history.state?.filters?.escola || '',
      routeView: route?.view || '',
      routeSchool: route?.filters?.escola || '',
      pageSchool: window.RadarTask9PendencyPage?.getState?.()?.filters?.schoolId || '',
      domSchool: document.querySelector('#pendency-filter-school')?.value ?? null,
      hasPage: !!window.RadarTask9PendencyPage,
      hasFocus: !!window.RadarTask9FocusBridge,
      hasNavigation: !!window.__radarNavigationHistoryInstalled
    };
  }, label);
}

for (const delayed of [false, true]) {
  test('AUDITORIA OUTRO AGENTE: cronologia Auth/Task9 ' +
    (delayed ? 'com app.js retido 11s' : 'com app.js normal'), async ({ page }, testInfo) => {
    test.setTimeout(110000);
    const observations = [];
    const problems = [];
    const errors = [];
    page.on('pageerror', error => errors.push(String(error?.message || error)));
    const fixture = fixtures.find(f => f.profileId === 'controller' && f.active);
    let releaseApp;
    const appReleased = new Promise(resolve => { releaseApp = resolve; });
    try {
      await installTimeline(page);
      if (delayed) {
        await page.route('**/app.js', async route => {
          await appReleased;
          await route.continue();
        });
        const extension = page.waitForResponse(res =>
          res.url().endsWith('/src/integration/task-9-pendencias-page.js') && res.ok());
        const navigation = page.goto('/pendencias?escola=ESC-LOCAL');
        try {
          await extension;
          await new Promise(resolve => setTimeout(resolve, 11000));
        } finally {
          releaseApp();
        }
        await navigation;
      } else {
        await page.goto('/pendencias?escola=ESC-LOCAL');
      }
      observations.push(await snapshot(page, 'before-login'));
      await page.locator('#radar-auth-email').fill(fixture.email);
      await page.locator('#radar-auth-password').fill(password);
      await page.locator('#radar-auth-form button[type="submit"]').click();
      await page.waitForFunction(() =>
        window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === 'controller', null, { timeout: 20000 }
      );
      await expect(page.locator('#app-layout')).toBeVisible();
      await page.locator('#pendency-filter-school').waitFor({ state: 'visible', timeout: 8000 });
      observations.push(await snapshot(page, 'after-login'));

      const clear = page.getByRole('button', { name: 'Limpar filtro de unidade' });
      if (await clear.count()) {
        await clear.click();
        observations.push(await snapshot(page, 'after-clear-button'));
        await page.goBack();
        observations.push(await snapshot(page, 'after-back'));
        await page.goForward();
        observations.push(await snapshot(page, 'after-forward'));
      } else {
        problems.push('O botão Limpar filtro de unidade não estava disponível');
      }

      // Testa o caminho realmente visível em Pendências sem navegação:
      // se a rota ainda estiver escolar, verifica que limpar não ressuscita o filtro.
      await page.evaluate(() => window.clearPendencyFilters?.());
      observations.push(await snapshot(page, 'after-clear-all'));
      await page.evaluate(() => window.renderPendencias?.());
      observations.push(await snapshot(page, 'after-rerender'));

      const initial = observations.find(x => x.label === 'after-login');
      const forward = observations.find(x => x.label === 'after-forward');
      const clearing = observations.find(x => x.label === 'after-clear-all');
      const rerender = observations.find(x => x.label === 'after-rerender');
      if (initial?.routeSchool !== 'ESC-LOCAL' || initial?.pageSchool !== 'ESC-LOCAL'
        || initial?.domSchool !== 'ESC-LOCAL') {
        problems.push('A rota escolar autorizada não foi reconciliada com Task9/DOM após login');
      }
      if (forward && (forward.path !== '/pendencias'
        || forward.routeSchool || forward.pageSchool || forward.domSchool)) {
        problems.push('Avançar restaurou estado escolar divergente de /pendencias');
      }
      if (clearing && (clearing.routeSchool || clearing.historySchool)) {
        problems.push('Limpar filtros preservou route/history.state escolar obsoleto');
      }
      if (rerender && (rerender.pageSchool || rerender.domSchool)) {
        problems.push('Após limpar, renderização ressuscitou escola anterior');
      }
    } catch (error) {
      problems.push('Falha de execução antes do fim: ' + String(error?.message || error));
    } finally {
      if (releaseApp) releaseApp();
      let timeline = [];
      try {
        timeline = await page.evaluate(() => window.__independentAgentNavigationTimeline || []);
      } catch (error) {
        errors.push('Não foi possível recuperar timeline: ' + String(error));
      }
      const report = {
        provenance: 'AUDITORIA INDEPENDENTE / OUTRO AGENTE / NÃO CODEX',
        commit: '53f2fe991f0c4460576346cbca3a2375bf8c9890',
        delayedAppMs: delayed ? 11000 : 0,
        observations, problems, pageErrors: errors, timeline
      };
      await testInfo.attach('independent-navigation-timeline-' + (delayed ? 'delayed' : 'normal') + '.json', {
        body: Buffer.from(JSON.stringify(report, null, 2)), contentType: 'application/json'
      });
      if (problems.length) {
        console.log('INDEPENDENT_NAVIGATION_RED: ' + JSON.stringify({ delayed, problems, observations }));
      }
    }
    expect(problems).toEqual([]);
  });
}
