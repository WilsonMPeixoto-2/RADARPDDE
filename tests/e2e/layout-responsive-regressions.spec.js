const { test, expect } = require('@playwright/test');

async function waitForLayout(page) {
  await page.waitForFunction(() => window.RadarProductExtensionsReady);
  await page.waitForFunction(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => (
    link.getAttribute('href') === '/src/styles/desktop-basic-monitors.css'
  )));
}

async function seedPendency(page) {
  await page.evaluate(() => {
    switchProfile('controlador');
    const competence = activeCompetenciaKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    if (!school) throw new Error('Unidade escolar para ensaio de Pendências não encontrada.');

    const pendency = RadarPendencias.createDocumentPendency({
      id: 'layout-responsive-regression-pendency',
      escolaId: school.id,
      competenciaOrigem: competence,
      programaId: 'BASIC',
      documentoKey: 'extCC',
      item: 'PDDE Básico - Extrato Conta Corrente',
      errosAtuais: ['Documento incompleto'],
      observacao: 'Pendência efêmera para homologação responsiva.',
      dataAbertura: '2026-08-17'
    }, {
      eventId: 'layout-responsive-regression-pendency-open',
      at: '2026-08-17T12:00:00.000Z',
      usuario: 'Controlador E2E',
      perfil: 'Controlador'
    });

    pendencias = [pendency];
    rebuildOperationalIndexes();
    switchView('pendencias');
  });
  await expect(page.locator('.pendency-operations-table')).toBeVisible();
}

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 }
]) {
  test(`cabeçalho do Assistente permanece íntegro em ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForLayout(page);
    await page.evaluate(() => switchProfile('assistente'));

    const geometry = await page.evaluate(() => {
      const button = document.querySelector('.profile-button');
      const label = document.querySelector('#profile-btn-label');
      const header = document.querySelector('header.top-header');
      const buttonRect = button.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      return {
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        buttonLeft: buttonRect.left,
        buttonRight: buttonRect.right,
        headerLeft: headerRect.left,
        headerRight: headerRect.right,
        label: label.textContent.trim(),
        labelClientWidth: label.clientWidth,
        labelScrollWidth: label.scrollWidth
      };
    });

    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.buttonLeft).toBeGreaterThanOrEqual(geometry.headerLeft - 1);
    expect(geometry.buttonRight).toBeLessThanOrEqual(geometry.headerRight + 1);
    expect(geometry.labelClientWidth).toBeGreaterThanOrEqual(geometry.labelScrollWidth);
    expect(geometry.label).toBe('Assistente de Verbas Federais');
  });
}

test('Pendências usa nove colunas legíveis e o drawer não reduz a largura da página', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await waitForLayout(page);
  await seedPendency(page);

  const before = await page.evaluate(() => {
    const main = document.querySelector('#main-container');
    const wrapper = document.querySelector('.pendency-desktop-list.table-responsive');
    const table = document.querySelector('.pendency-operations-table');
    const headers = Array.from(table.querySelectorAll('thead th'));
    return {
      mainWidth: main.getBoundingClientRect().width,
      wrapperWidth: wrapper.clientWidth,
      wrapperScrollWidth: wrapper.scrollWidth,
      tableWidth: table.getBoundingClientRect().width,
      headerCount: headers.length,
      headerTexts: headers.map(header => header.textContent.trim())
    };
  });

  expect(before.headerCount).toBe(9);
  expect(before.headerTexts).toEqual([
    'Unidade escolar',
    'Competência',
    'Programa e documento',
    'Erros atuais',
    'Situação',
    'Próxima ação',
    'Última movimentação',
    'Tentativas',
    'Ações'
  ]);
  expect(before.tableWidth).toBeLessThanOrEqual(before.wrapperWidth + 1);
  expect(before.wrapperScrollWidth).toBeLessThanOrEqual(before.wrapperWidth + 1);

  await page.locator('[data-action="open-pendency-detail"]').first().click();
  await expect(page.locator('#pendency-detail-drawer')).toBeVisible();

  const after = await page.evaluate(() => {
    const main = document.querySelector('#main-container');
    const wrapper = document.querySelector('.pendency-desktop-list.table-responsive');
    const drawer = document.querySelector('#pendency-detail-drawer');
    const drawerStyle = getComputedStyle(drawer);
    return {
      mainWidth: main.getBoundingClientRect().width,
      wrapperWidth: wrapper.clientWidth,
      wrapperScrollWidth: wrapper.scrollWidth,
      drawerPosition: drawerStyle.position,
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth
    };
  });

  expect(Math.abs(after.mainWidth - before.mainWidth)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.wrapperWidth - before.wrapperWidth)).toBeLessThanOrEqual(1);
  expect(after.wrapperScrollWidth).toBeLessThanOrEqual(after.wrapperWidth + 1);
  expect(after.drawerPosition).toBe('fixed');
  expect(after.documentWidth).toBeLessThanOrEqual(after.viewport + 1);
});

test('4K mantém escala legível, fundo OLED profundo e ausência de overflow global', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto('/');
  await waitForLayout(page);
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    switchProfile('controlador');
    switchView('dashboard');
  });

  const metrics = await page.evaluate(() => {
    const background = getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0, 3).map(Number);
    return {
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      background,
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      searchHeight: document.querySelector('.search-input').getBoundingClientRect().height,
      profileHeight: document.querySelector('.profile-button').getBoundingClientRect().height
    };
  });

  expect(metrics.rootFontSize).toBeGreaterThanOrEqual(17);
  expect(Math.max(...metrics.background)).toBeLessThanOrEqual(10);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.searchHeight).toBeGreaterThanOrEqual(42);
  expect(metrics.profileHeight).toBeGreaterThanOrEqual(42);
});
