const { test, expect } = require('@playwright/test');

test('todas as áreas renderizadas mantêm handlers resolvíveis e IDs únicos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Inventário estrutural completo executado no desktop.');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await page.waitForFunction(() => (
    typeof switchView === 'function'
    && typeof switchProfile === 'function'
    && Array.isArray(escolas)
    && escolas.length > 0
  ));

  const report = await page.evaluate(() => {
    const profiles = ['controlador', 'assistente', 'inventario', 'sme'];
    const views = [
      'dashboard',
      'escolas',
      'competencias',
      'pendencias',
      'inventario',
      'auditoria',
      'equipe',
      'sme-config'
    ];
    const eventRoots = new Set(['event', 'this', 'window', 'document']);
    const unresolved = [];
    const navigationErrors = [];
    const visited = [];

    function inspect(context) {
      const attributes = ['onclick', 'onsubmit', 'onchange', 'oninput', 'onblur', 'onkeydown', 'onkeyup'];
      document.querySelectorAll(attributes.map(attribute => `[${attribute}]`).join(','))
        .forEach(element => {
          attributes.forEach(attribute => {
            const expression = element.getAttribute(attribute);
            if (!expression) return;
            expression.split(';').forEach(statement => {
              const normalized = statement.trim().replace(/^return\s+/, '');
              const match = normalized.match(/^([A-Za-z_$][\w$]*)\s*\(/);
              if (!match || eventRoots.has(match[1])) return;
              if (typeof window[match[1]] !== 'function') {
                unresolved.push({
                  context,
                  attribute,
                  handler: match[1],
                  element: element.id || element.tagName.toLowerCase(),
                  expression
                });
              }
            });
          });
        });
    }

    profiles.forEach(profile => {
      try {
        switchProfile(profile);
        inspect(`profile:${profile}`);
        views.forEach(view => {
          try {
            switchView(view);
            visited.push(`${profile}:${view}`);
            inspect(`${profile}:${view}`);
          } catch (error) {
            navigationErrors.push({ profile, view, message: error.message });
          }
        });
      } catch (error) {
        navigationErrors.push({ profile, view: '<profile>', message: error.message });
      }
    });

    try {
      switchProfile('controlador');
      const school = escolas.find(item => Array.isArray(item.programasIds) && item.programasIds.length > 0);
      activeProntuarioCompetencia = activeCompetenciaKey;
      switchView('prontuario', school.id);
      visited.push(`controlador:prontuario:${school.id}`);
      inspect('controlador:prontuario');
    } catch (error) {
      navigationErrors.push({
        profile: 'controlador',
        view: 'prontuario',
        message: error.message
      });
    }

    const idCounts = new Map();
    document.querySelectorAll('[id]').forEach(element => {
      idCounts.set(element.id, (idCounts.get(element.id) || 0) + 1);
    });
    const duplicateIds = [...idCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));

    const formsWithoutSubmissionPath = [...document.querySelectorAll('form')]
      .filter(form => (
        !form.getAttribute('onsubmit')
        && typeof form.onsubmit !== 'function'
        && !form.querySelector('button[type="submit"], input[type="submit"]')
      ))
      .map(form => form.id || '<form-sem-id>');

    const unresolvedUnique = [...new Map(
      unresolved.map(item => [`${item.handler}|${item.element}|${item.attribute}`, item])
    ).values()];

    return {
      unresolved: unresolvedUnique,
      navigationErrors,
      duplicateIds,
      formsWithoutSubmissionPath,
      visited
    };
  });

  expect(report.visited.length).toBeGreaterThanOrEqual(25);
  expect(report.unresolved).toEqual([]);
  expect(report.navigationErrors).toEqual([]);
  expect(report.duplicateIds).toEqual([]);
  expect(report.formsWithoutSubmissionPath).toEqual([]);
  expect(pageErrors).toEqual([]);
});
