const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function waitForRadarRoute(page, expected) {
  await page.waitForFunction(target => {
    const route = window.RadarNavigationHistory?.currentRoute?.(window);
    if (window.RadarDataContext?.ready !== true || !route) return false;
    if (target.view && route.view !== target.view) return false;
    if (Object.hasOwn(target, 'param') && route.param !== target.param) return false;
    return true;
  }, expected);
}

async function contentScrollTop(page) {
  return page.evaluate(() => (
    Math.round(Number(document.querySelector('main.content-area')?.scrollTop) || 0)
  ));
}

async function openScrolledCarteiraSchool(page) {
  await page.goto('/carteira');
  await waitForRadarRoute(page, { view: 'escolas' });

  const links = page.locator('a[data-radar-route="true"][href^="/escolas/"]');
  await expect(links.first()).toBeVisible();
  const linkCount = await links.count();
  const link = links.nth(Math.min(20, Math.max(0, linkCount - 1)));
  await link.evaluate(element => {
    element.scrollIntoView({ block: 'center' });
    element.focus({ preventScroll: true });
  });

  const href = await link.getAttribute('href');
  const schoolId = decodeURIComponent(href.split('/').filter(Boolean).at(-1));
  const scrollTop = await contentScrollTop(page);
  return { href, link, schoolId, scrollTop };
}

async function openProfileSchool(page, profile = 'controlador', options = {}) {
  await page.goto('/');
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && Boolean(window.RadarNavigationHistory?.currentRoute?.(window))
  ));

  const schoolId = await page.evaluate(({ nextProfile, requireOutOfScope }) => {
    switchProfile(nextProfile);
    if (requireOutOfScope) {
      config.competenciaFechamento = '2026-12';
      window.RadarCompetenceContext.select('2026-08', {
        source: 'e2e-prontuario-desktop-out-of-scope'
      });
    }
    const activeKey = window.RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, activeKey)
    ));
    if (!school) throw new Error('Nenhuma escola compatível com o cenário desktop.');
    if (requireOutOfScope) school.competenciaInicial = '2026-06';
    activeProntuarioCompetencia = activeKey;
    switchView('prontuario', school.id);
    return school.id;
  }, { nextProfile: profile, requireOutOfScope: options.requireOutOfScope === true });

  await waitForRadarRoute(page, { view: 'prontuario', param: schoolId });
  await expect(page.locator('#main-container .school-grid')).toBeVisible();
  await expect(page.locator('[data-tab="historico"]')).toBeVisible();
  return schoolId;
}

test.describe('Prontuário operacional no desktop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Entrega homologada no desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('abre o Prontuário no topo e restaura a Carteira no retorno', async ({ page }) => {
    const { href, link, schoolId, scrollTop } = await openScrolledCarteiraSchool(page);
    expect(scrollTop).toBeGreaterThan(0);

    const capturedOriginTop = await link.evaluate(element => {
      const contentArea = document.querySelector('main.content-area');
      const top = Math.round(Number(contentArea?.scrollTop) || 0);
      element.click();
      return top;
    });
    expect(capturedOriginTop).toBe(scrollTop);
    await waitForRadarRoute(page, { view: 'prontuario', param: schoolId });
    await expect(page.locator('#main-container .school-grid')).toBeVisible();
    await expect.poll(() => contentScrollTop(page)).toBe(0);

    const backButton = page.locator('[data-radar-contextual-back="true"]');
    await expect(backButton).toBeVisible();
    await backButton.click();

    await waitForRadarRoute(page, { view: 'escolas' });
    await expect.poll(() => contentScrollTop(page))
      .toBeGreaterThanOrEqual(Math.max(1, capturedOriginTop - 2));
    await expect(page.locator(`a[data-radar-route="true"][href="${href}"]`)).toBeFocused();
  });

  test('mantém conteúdo, ações e abas dentro da área desktop', async ({ page }) => {
    await openProfileSchool(page, 'controlador');

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('main.content-area');
      const actionButtons = Array.from(document.querySelectorAll('.prontuario-actions .btn'));
      const tabs = Array.from(document.querySelectorAll('.prontuario-tablist .tab-button'));
      const mainRect = main.getBoundingClientRect();
      return {
        mainClientWidth: main.clientWidth,
        mainScrollWidth: main.scrollWidth,
        actionsInside: actionButtons.every(button => {
          const rect = button.getBoundingClientRect();
          return rect.left >= mainRect.left && rect.right <= mainRect.right + 1;
        }),
        tabsInside: tabs.every(tab => {
          const rect = tab.getBoundingClientRect();
          return rect.left >= mainRect.left && rect.right <= mainRect.right + 1;
        })
      };
    });

    expect(geometry.mainScrollWidth).toBeLessThanOrEqual(geometry.mainClientWidth + 1);
    const actions = page.locator('.prontuario-actions');
    await expect(actions).toHaveAttribute('role', 'group');
    await expect(actions).toHaveAttribute('aria-label', 'Ações da unidade escolar');
    await expect(actions.locator('.btn')).toHaveCount(3);
    await expect(actions.locator('.btn:not([type="button"])')).toHaveCount(0);
    await expect(page.locator('.prontuario-tablist .tab-button')).toHaveCount(6);
    expect(geometry.actionsInside).toBe(true);
    expect(geometry.tabsInside).toBe(true);
  });

  test('expõe programas vinculados como informação estática', async ({ page }) => {
    await openProfileSchool(page, 'controlador');

    const programList = page.locator('.school-program-list');
    await expect(programList).toHaveAttribute('role', 'list');
    await expect(programList.locator('.school-program-item')).not.toHaveCount(0);
    await expect(programList.locator('button, a')).toHaveCount(0);
  });

  test('compõe o resumo da unidade sem título duplicado, compressão ou marcadores sobrepostos', async ({ page }) => {
    await openProfileSchool(page, 'controlador');

    await expect(page.getByRole('heading', { name: 'Dados da unidade', exact: true })).toHaveCount(1);
    await expect(page.locator('.school-data-section')).toHaveCount(3);
    await expect(page.locator('.school-data-item')).toHaveCount(14);

    const geometry = await page.evaluate(() => {
      const dataCard = document.querySelector('.school-data-card');
      const programsCard = document.querySelector('.school-programs-card');
      const sections = Array.from(document.querySelectorAll('.school-data-fields'));
      const fields = Array.from(document.querySelectorAll('.school-data-item'));
      const programs = Array.from(document.querySelectorAll('.school-program-item'));
      const dataRect = dataCard.getBoundingClientRect();
      const programsRect = programsCard.getBoundingClientRect();
      const beforeContent = getComputedStyle(dataCard, '::before').content;

      return {
        beforeContent,
        dataWiderThanPrograms: dataRect.width >= programsRect.width * 1.8,
        cardsTopAligned: Math.abs(dataRect.top - programsRect.top) <= 1,
        sectionsUseCardWidth: sections.every(section => {
          const rect = section.getBoundingClientRect();
          return rect.left >= dataRect.left + 20
            && rect.right <= dataRect.right - 20
            && rect.width >= dataRect.width - 52;
        }),
        fieldsStayInsideCard: fields.every(field => {
          const rect = field.getBoundingClientRect();
          return rect.left >= dataRect.left + 20 && rect.right <= dataRect.right - 20;
        }),
        programMarkersClearText: programs.every(program => {
          const style = getComputedStyle(program);
          const marker = getComputedStyle(program, '::before');
          const paddingLeft = Number.parseFloat(style.paddingLeft);
          const markerRight = Number.parseFloat(marker.left) + Number.parseFloat(marker.width);
          return paddingLeft >= 30 && markerRight <= paddingLeft - 8;
        })
      };
    });

    expect(['none', 'normal']).toContain(geometry.beforeContent);
    expect(geometry.dataWiderThanPrograms).toBe(true);
    expect(geometry.cardsTopAligned).toBe(true);
    expect(geometry.sectionsUseCardWidth).toBe(true);
    expect(geometry.fieldsStayInsideCard).toBe(true);
    expect(geometry.programMarkersClearText).toBe(true);
  });

  test('sincroniza abas, painéis e navegação por teclado', async ({ page }) => {
    await openProfileSchool(page, 'controlador');

    const tablist = page.locator('.prontuario-tablist');
    await expect(tablist).toHaveAttribute('role', 'tablist');
    await expect(tablist).toHaveAttribute('aria-label', 'Seções do prontuário da unidade');

    const tabs = tablist.locator('[role="tab"]');
    await expect(tabs).toHaveCount(6);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.first()).toHaveAttribute('tabindex', '0');

    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.first()).toHaveAttribute('tabindex', '-1');

    const secondPanelId = await tabs.nth(1).getAttribute('aria-controls');
    const secondPanel = page.locator(`#${secondPanelId}`);
    await expect(secondPanel).toHaveAttribute('role', 'tabpanel');
    await expect(secondPanel).not.toHaveAttribute('hidden', '');
    await expect(page.locator('#tab-verificacoes')).toHaveAttribute('hidden', '');

    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tab-historico')).not.toHaveAttribute('hidden', '');
    await expect(page.locator('#tab-historico')).toHaveAttribute(
      'aria-labelledby',
      await tabs.last().getAttribute('id')
    );

    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();
    await expect(page.locator('#tab-verificacoes')).not.toHaveAttribute('hidden', '');
  });

  test('não oferece meses fora do escopo como ações', async ({ page }) => {
    await openProfileSchool(page, 'controlador', { requireOutOfScope: true });

    const disabledMonths = page.locator('.comp-sub-tab.disabled');
    expect(await disabledMonths.count()).toBeGreaterThan(0);
    for (const month of await disabledMonths.all()) {
      await expect(month).toBeDisabled();
      await expect(month).toHaveAttribute('aria-disabled', 'true');
      await expect(month).toHaveAttribute('aria-pressed', 'false');
    }

    const activeMonth = page.locator('.comp-sub-tab[aria-pressed="true"]');
    await expect(activeMonth).toHaveCount(1);
    await expect(activeMonth).toBeEnabled();

    const nextMonth = page.locator('.comp-sub-tab:not(.disabled):not(.active)').first();
    await expect(nextMonth).toBeEnabled();
    const nextCompetence = await nextMonth.getAttribute('data-competence');
    await nextMonth.click();
    await expect(page.locator(`.comp-sub-tab[data-competence="${nextCompetence}"]`))
      .toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.comp-sub-tab[aria-pressed="true"]')).toHaveCount(1);
  });

  test('abre e fecha as ações operacionais com foco restaurado', async ({ page }) => {
    await openProfileSchool(page, 'controlador');

    const scenarios = [
      { button: 'Registrar Contato', modal: '#modal-contato' },
      { button: 'Gerar Cobrança', modal: '#modal-cobranca' },
      { button: 'Editar Dados', modal: '#modal-escola-edit' }
    ];

    for (const scenario of scenarios) {
      const trigger = page.getByRole('button', { name: scenario.button, exact: true });
      const modal = page.locator(scenario.modal);
      await trigger.click();
      await expect(modal).toHaveClass(/show/);
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      await expect.poll(() => page.evaluate(selector => {
        const element = document.querySelector(selector);
        return Boolean(element && element.contains(document.activeElement));
      }, scenario.modal)).toBe(true);

      await page.keyboard.press('Escape');
      await expect(modal).not.toHaveClass(/show/);
      await expect(trigger).toBeFocused();
    }
  });

  test('preserva ações e abas autorizadas por perfil', async ({ page }) => {
    const scenarios = [
      { profile: 'controlador', actions: 3, tabs: 6 },
      { profile: 'assistente', actions: 3, tabs: 6 },
      { profile: 'sme', actions: 0, tabs: 2 },
      { profile: 'inventario', actions: 0, tabs: 2 }
    ];

    for (const scenario of scenarios) {
      await openProfileSchool(page, scenario.profile);
      await expect(page.locator('.prontuario-actions .btn')).toHaveCount(scenario.actions);
      const tabs = page.locator('.prontuario-tablist [role="tab"]');
      await expect(tabs).toHaveCount(scenario.tabs);
      for (const tab of await tabs.all()) await expect(tab).toBeVisible();
      await expect(page.locator('.prontuario-tablist [aria-selected="true"]')).toHaveCount(1);
      await expect(page.locator('.school-workspace [role="tabpanel"]:not([hidden])')).toHaveCount(1);
    }
  });

  test('não introduz violações sérias ou críticas no conteúdo do Prontuário', async ({ page }) => {
    await openProfileSchool(page, 'controlador');

    const results = await new AxeBuilder({ page })
      .include('#main-container')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const seriousOrCritical = results.violations.filter(violation => (
      violation.impact === 'serious' || violation.impact === 'critical'
    ));

    expect(seriousOrCritical).toEqual([]);
  });
});
