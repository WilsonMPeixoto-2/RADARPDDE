const { test, expect } = require('@playwright/test');

async function waitForDesktopRefinements(page) {
  await page.waitForFunction(() => window.RadarProductExtensionsReady);
  await page.waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => (
    link.getAttribute('href') === '/src/styles/desktop-basic-monitors.css'
  )));
}

async function openControllerSchool(page) {
  const schoolId = await page.evaluate(() => {
    switchProfile('controlador');
    const competence = activeCompetenciaKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    if (!school) throw new Error('Unidade escolar em escopo não encontrada.');
    activeProntuarioCompetencia = competence;
    switchView('prontuario', school.id);
    return school.id;
  });
  await expect(page.locator('#main-container .school-grid')).toBeVisible();
  return schoolId;
}

function walletTable(page) {
  return page.locator('.panel-card').filter({
    has: page.locator('#carteira-competencia-select')
  }).locator('table.data-table');
}

function columnCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function contrastRatio(rgb, background = [255, 255, 255]) {
  const luminance = values => {
    const channels = values.map(value => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const foreground = luminance(rgb);
  const bg = luminance(background);
  return (Math.max(foreground, bg) + 0.05) / (Math.min(foreground, bg) + 0.05);
}

test.describe('Desktop — notebooks e monitores básicos', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
  });

  test('1366×768 prioriza largura útil do Prontuário sem overflow global', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await waitForDesktopRefinements(page);
    await openControllerSchool(page);

    const geometry = await page.evaluate(() => {
      const app = document.querySelector('#app-layout');
      const schoolGrid = document.querySelector('.school-grid');
      const sidebar = document.querySelector('.school-sidebar');
      return {
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        appColumns: getComputedStyle(app).gridTemplateColumns,
        schoolColumns: getComputedStyle(schoolGrid).gridTemplateColumns,
        schoolSidebarDisplay: getComputedStyle(sidebar).display
      };
    });

    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(columnCount(geometry.schoolColumns)).toBe(1);
    expect(geometry.schoolSidebarDisplay).toBe('grid');
    expect(Number.parseFloat(geometry.appColumns)).toBeLessThanOrEqual(235);
    await expect(page.locator('.prontuario-actions')).toBeVisible();
    await expect(page.locator('.prontuario-tablist')).toBeVisible();
  });

  test('1920×1080 preserva a composição ampla do Prontuário e da Carteira', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForDesktopRefinements(page);
    await openControllerSchool(page);

    const schoolColumns = await page.locator('.school-grid').evaluate(element => (
      getComputedStyle(element).gridTemplateColumns
    ));
    expect(columnCount(schoolColumns)).toBeGreaterThanOrEqual(2);

    await page.evaluate(() => switchView('escolas'));
    const table = walletTable(page);
    await expect(table).toBeVisible();
    const metrics = await table.evaluate(element => ({
      wrapperWidth: element.closest('.table-responsive')?.clientWidth || 0,
      tableWidth: element.getBoundingClientRect().width
    }));
    expect(metrics.tableWidth).toBeLessThanOrEqual(metrics.wrapperWidth + 1);
  });

  test('modal com carteira zerada não exibe instrução de transferência', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await waitForDesktopRefinements(page);

    await page.evaluate(() => {
      window.__radarDesktopDialogPromise = RadarSharedInteractions.requestControllerDeactivation({
        controller: { id: 'controller-zero', name: 'Controladora Teste' },
        schoolCount: 0,
        controllers: [
          { id: 'controller-zero', name: 'Controladora Teste', active: true },
          { id: 'controller-other', name: 'Outra Controladora', active: true }
        ],
        onConfirm: async () => true
      });
    });

    const dialog = page.locator('#radar-controller-deactivation-dialog');
    await expect(dialog).toHaveClass(/show/);
    await expect(dialog.locator('[data-controller-deactivation-impact]'))
      .toContainText('carteira está zerada');
    await expect(dialog.locator('[data-controller-deactivation-field]')).toBeHidden();
    await expect(dialog.getByText('Nova responsável', { exact: true })).toBeHidden();
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  });

  test('tabelas operacionais cabem melhor em notebook sem trocar a interface desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await waitForDesktopRefinements(page);

    await page.evaluate(() => {
      switchProfile('controlador');
      switchView('escolas');
    });
    const table = walletTable(page);
    await expect(table).toBeVisible();
    const walletMetrics = await table.evaluate(element => ({
      tableLayout: getComputedStyle(element).tableLayout,
      wrapperWidth: element.closest('.table-responsive')?.clientWidth || 0,
      tableWidth: element.getBoundingClientRect().width
    }));
    expect(walletMetrics.tableLayout).toBe('fixed');
    expect(walletMetrics.tableWidth).toBeLessThanOrEqual(walletMetrics.wrapperWidth + 1);
    await expect(page.locator('.cycle-b-wallet-mobile')).toHaveCount(0);

    await page.evaluate(() => switchView('pendencias'));
    const pendencyTable = page.locator('.pendency-operations-table');
    await expect(pendencyTable).toBeVisible();
    const pendencyMinWidth = await pendencyTable.evaluate(element => Number.parseFloat(getComputedStyle(element).minWidth));
    expect(pendencyMinWidth).toBeLessThanOrEqual(1040);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test('textos de estado no tema claro atingem contraste de leitura', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await waitForDesktopRefinements(page);

    const colors = await page.evaluate(() => {
      document.body.classList.remove('dark-theme');
      const host = document.createElement('div');
      host.innerHTML = `
        <span id="contrast-success" class="badge badge-success">Correto</span>
        <span id="contrast-warning" class="badge badge-warning">Atrasado</span>
        <span id="contrast-danger" class="badge badge-danger">Incorreto</span>
      `;
      document.body.appendChild(host);
      const read = id => getComputedStyle(document.getElementById(id)).color
        .match(/\d+/g)
        .slice(0, 3)
        .map(Number);
      return {
        success: read('contrast-success'),
        warning: read('contrast-warning'),
        danger: read('contrast-danger')
      };
    });

    expect(contrastRatio(colors.success)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.warning)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.danger)).toBeGreaterThanOrEqual(4.5);
  });
});
