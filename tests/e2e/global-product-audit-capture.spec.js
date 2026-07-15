const { test, expect } = require('@playwright/test');

async function stabilize(page) {
  await page.waitForTimeout(350);
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
  });
}

async function capture(page, testInfo, name) {
  await stabilize(page);
  await testInfo.attach(`${testInfo.project.name}-${name}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
}

async function openView(page, view, argument) {
  await page.evaluate(({ view, argument }) => {
    switchView(view, argument);
  }, { view, argument });
  await expect(page.locator('#main-container')).not.toBeEmpty();
}

test('captura as principais superfícies operacionais do RADAR', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#main-container')).not.toBeEmpty();

  await page.evaluate(() => switchProfile('controlador'));

  await openView(page, 'dashboard');
  await capture(page, testInfo, '01-dashboard-controlador');

  await openView(page, 'escolas');
  await capture(page, testInfo, '02-carteira-escolas');

  await openView(page, 'competencias');
  await capture(page, testInfo, '03-competencias');

  await openView(page, 'pendencias');
  await capture(page, testInfo, '04-pendencias');

  await openView(page, 'inventario');
  await capture(page, testInfo, '05-inventario');

  await openView(page, 'auditoria');
  await capture(page, testInfo, '06-registros-internos');

  const schoolId = await page.evaluate(() => {
    const competence = activeCompetenciaKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    activeProntuarioCompetencia = competence;
    return school.id;
  });
  await openView(page, 'prontuario', schoolId);
  await capture(page, testInfo, '07-prontuario');

  await page.evaluate(() => switchProfile('sme'));
  await openView(page, 'dashboard');
  await capture(page, testInfo, '08-dashboard-sme');

  await openView(page, 'sme-config');
  await capture(page, testInfo, '09-configuracoes-sme');
});
