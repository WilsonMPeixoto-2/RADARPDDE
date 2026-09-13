const { test, expect } = require('@playwright/test');

async function openSchool(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.RadarCompetenceContext?.isInitialized?.());
  await page.evaluate(() => window.RadarProductExtensionsReady);
  await page.locator('#global-competence-select').selectOption('2026-09');
  return page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(item => item.programasIds?.includes('BASIC'));
    switchView('prontuario', school.id);
    return school.id;
  });
}

test('hidratação remota mantém escola e mostra o novo mês somente após a resposta', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const schoolId = await openSchool(page);
  await page.evaluate(() => {
    window.__contextReads = [];
    window.RadarApplicationServices = Object.freeze({ ...window.RadarApplicationServices, data: {
      repository: { capabilities: () => ({ remote: true }) },
      currentOperationalCompetence: '2026-09',
      loadOperationalContext(key) {
        window.__contextReads.push(key);
        return new Promise(resolve => { window.__confirmContext = () => resolve({ stale: false }); });
      }
    } });
  });
  await page.locator('#global-competence-select').selectOption('2026-08');
  await expect(page.locator('#main-container')).toHaveAttribute('aria-busy', 'true');
  expect(await page.evaluate(() => document.getElementById('main-container').inert)).toBe(true);
  expect(await page.evaluate(() => window.__contextReads)).toEqual(['2026-08']);
  await page.evaluate(() => window.__confirmContext());
  await expect(page.locator('#main-container')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  await expect(page.locator('#prontuario-verif-rows')).toContainText('Agosto');
  expect(await page.evaluate(() => ({ view: currentView, school: activeSchoolId })))
    .toEqual({ view: 'prontuario', school: schoolId });
  expect(errors).toEqual([]);
});

test('histórico consulta contatos somente ao abrir e apresenta registro sem pendência com texto seguro', async ({ page }) => {
  const schoolId = await openSchool(page);
  await page.evaluate(() => {
    window.__contactReads = [];
    window.RadarApplicationServices = Object.freeze({ ...window.RadarApplicationServices, data: {
      repository: { capabilities: () => ({ remote: true }) },
      async readSchoolContacts(id) {
        window.__contactReads.push(id);
        return [{ id: 'standalone', school_id: id, pendency_id: null, contact_type: 'E-mail',
          contact_date: '2025-02-01', created_at: '2025-02-01T12:00:00Z', description: 'Contato histórico <img src=x>' }];
      }
    } });
  });
  expect(await page.evaluate(() => window.__contactReads)).toEqual([]);
  await page.getByRole('tab', { name: 'Histórico de Contatos', exact: true }).click();
  await expect(page.locator('#tab-contatos .contact-desc')).toHaveText('Contato histórico <img src=x>');
  await expect(page.locator('#tab-contatos img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__contactReads)).toEqual([schoolId]);
});
