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

test('perfil Assistente fica integralmente legível no rodapé da sidebar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await waitForLayout(page);
  await page.evaluate(() => switchProfile('assistente'));

  const role = await page.evaluate(() => {
    const element = document.querySelector('#current-user-role');
    const style = getComputedStyle(element);
    return {
      text: element.textContent.trim(),
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      overflow: style.overflow,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    };
  });

  expect(role.text).toBe('Assistente de Verbas Federais');
  expect(role.whiteSpace).not.toBe('nowrap');
  expect(role.textOverflow).not.toBe('ellipsis');
  expect(role.overflow).not.toBe('hidden');
  expect(role.scrollHeight).toBeLessThanOrEqual(role.clientHeight + 1);
});

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

test('cards de Capital e Inventário usam composição premium e iconografia vetorial consistente', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await waitForLayout(page);
  await page.evaluate(() => {
    switchProfile('inventario');
    switchView('inventario');
  });

  const cards = page.locator('#main-container > .grid-stats .card-stat');
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toContainText('Sem encarte / pendente verbas federais');
  await expect(cards.nth(1)).toContainText('Aguardando inventariação');
  await expect(cards.nth(2)).toContainText('Já inventariados');
  await expect(cards.nth(3)).toContainText('Processos de Inventário');

  const metrics = await page.evaluate(() => {
    const cardNodes = Array.from(document.querySelectorAll('#main-container > .grid-stats .card-stat'));
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      cards: cardNodes.map((card, index) => {
        const style = getComputedStyle(card);
        const icon = card.querySelector('.stat-icon');
        const iconStyle = getComputedStyle(icon);
        const iconPseudo = getComputedStyle(icon, '::before');
        const value = card.querySelector('.stat-value');
        return {
          radius: Number.parseFloat(style.borderRadius),
          minHeight: card.getBoundingClientRect().height,
          iconWidth: icon.getBoundingClientRect().width,
          iconHeight: icon.getBoundingClientRect().height,
          iconRadius: Number.parseFloat(iconStyle.borderRadius),
          pseudoContent: iconPseudo.content,
          pseudoMask: iconPseudo.maskImage || iconPseudo.webkitMaskImage || '',
          valueSize: Number.parseFloat(getComputedStyle(value).fontSize),
          borderWidth: Number.parseFloat(style.borderLeftWidth),
          index
        };
      })
    };
  });

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  for (const card of metrics.cards) {
    expect(card.radius).toBeGreaterThanOrEqual(20);
    expect(card.minHeight).toBeGreaterThanOrEqual(160);
    expect(card.iconWidth).toBeGreaterThanOrEqual(60);
    expect(card.iconHeight).toBeGreaterThanOrEqual(60);
    expect(card.iconRadius).toBeGreaterThanOrEqual(14);
    expect(card.pseudoContent).not.toBe('none');
    expect(card.pseudoMask).not.toBe('none');
    expect(card.valueSize).toBeGreaterThanOrEqual(30);
  }
  expect(metrics.cards[3].borderWidth).toBeGreaterThanOrEqual(2);

  await page.screenshot({ path: testInfo.outputPath('inventory-cards-1366x768.png'), fullPage: true });
});

test('Capital e Inventário escala com nitidez em 4K sem deformar os cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto('/');
  await waitForLayout(page);
  await page.evaluate(() => {
    switchProfile('inventario');
    switchView('inventario');
  });

  const metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#main-container > .grid-stats .card-stat'));
    const first = cards[0];
    const icon = first.querySelector('.stat-icon');
    const value = first.querySelector('.stat-value');
    return {
      cardCount: cards.length,
      cardHeight: first.getBoundingClientRect().height,
      iconWidth: icon.getBoundingClientRect().width,
      valueSize: Number.parseFloat(getComputedStyle(value).fontSize),
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth
    };
  });

  expect(metrics.cardCount).toBe(4);
  expect(metrics.cardHeight).toBeGreaterThanOrEqual(220);
  expect(metrics.iconWidth).toBeGreaterThanOrEqual(80);
  expect(metrics.valueSize).toBeGreaterThanOrEqual(50);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);

  await page.screenshot({ path: testInfo.outputPath('inventory-cards-4k.png'), fullPage: true });
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
