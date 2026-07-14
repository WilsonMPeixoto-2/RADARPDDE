const { test, expect } = require('@playwright/test');

test.describe('serviços de aplicação ligados aos formulários institucionais', () => {
  test('cadastros de programa, controlador e inventário persistem no legado e no repositório canônico', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário administrativo exclusivo do desktop.');

    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarApplicationServices));
    await page.evaluate(() => {
      switchProfile('sme');
      switchView('sme-config');
    });

    await page.locator('#new-program-name').fill('Programa E2E');
    await page.locator('#new-program-desc').fill('Cadastro pelo serviço de diretório');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await page.waitForFunction(() => programas.some(item => item.name === 'Programa E2E'));

    await page.evaluate(() => abrirEditarControlador(null));
    await page.locator('#controlador-name').fill('Controlador E2E');
    await page.locator('#controlador-email').fill('controlador.e2e@rio.gov.br');
    await page.getByRole('button', { name: 'Salvar Controlador', exact: true }).click();
    await expect(page.locator('#modal-controlador-edit')).not.toHaveClass(/show/);

    await page.evaluate(() => abrirEditarInventariador(null));
    await page.locator('#inventariador-name').fill('Inventariadora E2E');
    await page.locator('#inventariador-email').fill('inventario.e2e@rio.gov.br');
    await page.getByRole('button', { name: 'Salvar Integrante', exact: true }).click();
    await expect(page.locator('#modal-inventariador-edit')).not.toHaveClass(/show/);

    const persisted = await page.evaluate(() => ({
      memory: {
        program: programas.find(item => item.name === 'Programa E2E'),
        controller: controladores.find(item => item.name === 'Controlador E2E'),
        member: equipeInventario.find(item => item.name === 'Inventariadora E2E')
      },
      legacy: {
        programs: JSON.parse(localStorage.getItem('radar_pdde_programas')),
        controllers: JSON.parse(localStorage.getItem('radar_pdde_controladores')),
        members: JSON.parse(localStorage.getItem('radar_pdde_equipe_inventario'))
      },
      canonical: {
        programs: JSON.parse(localStorage.getItem('radar_pdde_repository:programs')),
        controllers: JSON.parse(localStorage.getItem('radar_pdde_repository:controllers')),
        members: JSON.parse(localStorage.getItem('radar_pdde_repository:inventoryTeamMembers'))
      }
    }));

    expect(persisted.memory.program.active).toBe(true);
    expect(persisted.memory.controller.active).toBe(true);
    expect(persisted.memory.member.active).toBe(true);
    expect(persisted.legacy.programs.some(item => item.name === 'Programa E2E')).toBe(true);
    expect(persisted.legacy.controllers.some(item => item.name === 'Controlador E2E')).toBe(true);
    expect(persisted.legacy.members.some(item => item.name === 'Inventariadora E2E')).toBe(true);
    expect(persisted.canonical.programs.some(item => item.name === 'Programa E2E')).toBe(true);
    expect(persisted.canonical.controllers.some(item => item.name === 'Controlador E2E')).toBe(true);
    expect(persisted.canonical.members.some(item => item.name === 'Inventariadora E2E')).toBe(true);
  });

  test('edição de escola mantém modal e restaura memória quando a gravação falha', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário administrativo exclusivo do desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarApplicationServices));
    const schoolId = await page.evaluate(() => escolas[0].id);
    await page.evaluate(id => openEscolaEditModal(id), schoolId);
    await page.locator('#edit-email').fill('escola.gateway@rio.edu.br');
    await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
    await expect(page.locator('#modal-escola-edit')).not.toHaveClass(/show/);

    const saved = await page.evaluate(id => ({
      memory: escolas.find(item => item.id === id).email,
      legacy: JSON.parse(localStorage.getItem('radar_pdde_escolas')).find(item => item.id === id).email,
      canonical: JSON.parse(localStorage.getItem('radar_pdde_repository:schools')).find(item => item.id === id).email
    }), schoolId);
    expect(saved).toEqual({
      memory: 'escola.gateway@rio.edu.br',
      legacy: 'escola.gateway@rio.edu.br',
      canonical: 'escola.gateway@rio.edu.br'
    });

    await page.evaluate(id => openEscolaEditModal(id), schoolId);
    await page.locator('#edit-email').fill('nao.deve.persistir@rio.edu.br');
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      let failed = false;
      window.__restoreSchoolSetItem = () => {
        Storage.prototype.setItem = originalSetItem;
        delete window.__restoreSchoolSetItem;
      };
      Storage.prototype.setItem = function failSchoolRepositoryOnce(key, value) {
        if (!failed && key === 'radar_pdde_repository:schools') {
          failed = true;
          Storage.prototype.setItem = originalSetItem;
          throw new Error('Falha E2E ao persistir escola.');
        }
        return originalSetItem.call(this, key, value);
      };
    });

    try {
      await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
      await expect(page.locator('#modal-escola-edit')).toHaveClass(/show/);
      await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    } finally {
      await page.evaluate(() => window.__restoreSchoolSetItem?.());
    }

    const afterFailure = await page.evaluate(id => ({
      memory: escolas.find(item => item.id === id).email,
      legacy: JSON.parse(localStorage.getItem('radar_pdde_escolas')).find(item => item.id === id).email,
      errorCode: window.RADAR_LAST_DATA_ERROR?.code
    }), schoolId);
    expect(afterFailure).toEqual({
      memory: 'escola.gateway@rio.edu.br',
      legacy: 'escola.gateway@rio.edu.br',
      errorCode: 'TRANSACTION_FAILED'
    });
  });
});

