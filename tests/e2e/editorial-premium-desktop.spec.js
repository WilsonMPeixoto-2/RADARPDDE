const { test, expect } = require('@playwright/test');

async function waitForAuthorizedRadar(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarCompetenceContext?.isInitialized?.() === true
    && typeof window.switchProfile === 'function'
    && typeof window.switchView === 'function'
  ));
}

async function openControladorSchool(page) {
  await page.goto('/');
  await waitForAuthorizedRadar(page);
  await page.evaluate(() => {
    switchProfile('controlador');
    const competenceKey = RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competenceKey)
    ));
    if (!school) throw new Error('Escola compatível com o Prontuário não encontrada.');
    activeProntuarioCompetencia = competenceKey;
    switchView('prontuario', school.id);
  });
  await expect(page.locator('.school-dossier')).toBeVisible();
  await expect(page.locator('.radar-program-review-stack')).toBeVisible();
}

async function openSchoolWithCollectionPendencies(page) {
  await page.goto('/');
  await waitForAuthorizedRadar(page);
  await page.evaluate(() => {
    switchProfile('controlador');
    const competenceKey = '2026-08';
    RadarCompetenceContext.select(competenceKey, { source: 'editorial-premium-cobranca-e2e' });
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competenceKey)
    ));
    if (!school) throw new Error('Escola compatível com a cobrança não encontrada.');

    const createPendency = (id, documentKey, item) => RadarPendencias.createDocumentPendency({
      id,
      escolaId: school.id,
      competenciaOrigem: competenceKey,
      programaId: 'BASIC',
      documentoKey: documentKey,
      item: `PDDE Básico - ${item}`,
      errosAtuais: ['Documento ausente'],
      observacao: `Regularizar ${item}.`,
      dataAbertura: '2026-08-10'
    }, {
      eventId: `${id}-open`,
      at: '2026-08-10T12:00:00.000Z',
      usuario: 'Controlador Visual',
      perfil: 'controlador'
    });

    pendencias = [
      createPendency('editorial-cobranca-conta', 'extCC', 'Extrato Conta Corrente'),
      createPendency('editorial-cobranca-investimento', 'extINV', 'Extrato Investimento')
    ];
    rebuildOperationalIndexes();
    activeProntuarioCompetencia = competenceKey;
    switchView('prontuario', school.id);
  });
  await page.getByRole('button', { name: 'Gerar Cobrança', exact: true }).click();
  await expect(page.locator('#modal-cobranca')).toHaveClass(/show/);
}

function alphaFromColor(color) {
  const match = color.match(/rgba?\([^,]+,[^,]+,[^,]+(?:,\s*([\d.]+))?\)/);
  if (!match) return 1;
  return match[1] === undefined ? 1 : Number.parseFloat(match[1]);
}

async function attachPng(testInfo, name, buffer) {
  await testInfo.attach(name, { body: buffer, contentType: 'image/png' });
}

test.describe('direção estrutural do prontuário no desktop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato visual exclusivo do desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('competência ativa tem presença visual inequívoca no topo sem repetição visual', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForAuthorizedRadar(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      RadarCompetenceContext.select('2026-08', { source: 'editorial-premium-e2e' });
      switchView('dashboard');
    });

    const selector = page.locator('#global-competence-badge');
    const context = page.locator('[data-radar-competence-context]');
    const metrics = await page.evaluate(() => {
      const selectorElement = document.querySelector('#global-competence-badge');
      const label = selectorElement.querySelector('label');
      const select = selectorElement.querySelector('select');
      const selectorStyle = getComputedStyle(selectorElement);
      return {
        selectorHeight: selectorElement.getBoundingClientRect().height,
        selectorBackground: selectorStyle.backgroundColor,
        selectorBackgroundImage: selectorStyle.backgroundImage,
        selectorAccentWidth: parseFloat(selectorStyle.borderLeftWidth),
        selectorLabelFont: parseFloat(getComputedStyle(label).fontSize),
        selectorValueFont: parseFloat(getComputedStyle(select).fontSize)
      };
    });

    await expect(selector).toContainText('Competência ativa');
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    await expect(context).toHaveCount(1);
    await expect(context).toBeHidden();
    expect(metrics.selectorHeight).toBeGreaterThanOrEqual(60);
    expect(metrics.selectorLabelFont).toBeGreaterThanOrEqual(12);
    expect(metrics.selectorValueFont).toBeGreaterThanOrEqual(18);
    expect(metrics.selectorAccentWidth).toBeGreaterThanOrEqual(5);
    expect(metrics.selectorBackgroundImage).toContain('linear-gradient');
    expect(alphaFromColor(metrics.selectorBackground)).toBeGreaterThanOrEqual(0.18);

    await attachPng(testInfo, 'competencia-dashboard.png', await page.screenshot({ fullPage: true }));
  });

  test('resumo institucional abandona banner pesado e mini-cards, ficando compacto', async ({ page }, testInfo) => {
    await openControladorSchool(page);

    const metrics = await page.evaluate(() => {
      const dossier = document.querySelector('.school-dossier');
      const header = dossier.querySelector('.school-dossier-header');
      const sections = dossier.querySelector('.school-dossier-sections');
      const section = dossier.querySelector('.radar-info-section[data-section="identificacao"]');
      const field = section.querySelector('.radar-info-field');
      const label = field.querySelector('.radar-info-label');
      const value = field.querySelector('.radar-info-value');
      return {
        dossierHeight: dossier.getBoundingClientRect().height,
        sectionColumns: getComputedStyle(sections).gridTemplateColumns.split(' ').filter(Boolean).length,
        headerColor: getComputedStyle(header).color,
        headerBackground: getComputedStyle(header).backgroundImage,
        sectionRadius: parseFloat(getComputedStyle(section).borderTopLeftRadius),
        sectionShadow: getComputedStyle(section).boxShadow,
        fieldRadius: parseFloat(getComputedStyle(field).borderTopLeftRadius),
        fieldAccent: parseFloat(getComputedStyle(field).borderLeftWidth),
        labelFont: parseFloat(getComputedStyle(label).fontSize),
        valueFont: parseFloat(getComputedStyle(value).fontSize)
      };
    });

    await expect(page.locator('.radar-school-summary-kicker')).toHaveText('Cadastro da unidade');
    expect(metrics.dossierHeight).toBeLessThan(520);
    expect(metrics.sectionColumns).toBeGreaterThanOrEqual(4);
    expect(metrics.headerBackground).toContain('linear-gradient');
    expect(metrics.sectionRadius).toBeLessThanOrEqual(1);
    expect(metrics.sectionShadow).toBe('none');
    expect(metrics.fieldRadius).toBeLessThanOrEqual(1);
    expect(metrics.fieldAccent).toBeLessThanOrEqual(1);
    expect(metrics.labelFont).toBeGreaterThanOrEqual(11);
    expect(metrics.valueFont).toBeGreaterThanOrEqual(15);

    await attachPng(testInfo, 'dossie-institucional-v4.png', await page.locator('.school-dossier').screenshot());
  });

  test('acompanhamento mensal é agrupado por programa em vez de uma tabela monolítica', async ({ page }, testInfo) => {
    await openControladorSchool(page);

    const stack = page.locator('.radar-program-review-stack');
    const programs = stack.locator('.radar-program-review');
    await expect(programs.first()).toBeVisible();
    expect(await programs.count()).toBeGreaterThanOrEqual(1);

    await expect(stack.locator('td[rowspan]')).toHaveCount(0);
    await expect(stack.locator('.radar-program-review-header').first()).toBeVisible();
    await expect(stack.locator('.radar-program-review-title').first()).not.toHaveText('');
    await expect(stack.locator('.radar-program-review-table').first()).toBeVisible();

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('main.content-area');
      const stackElement = document.querySelector('.radar-program-review-stack');
      const firstProgram = stackElement.querySelector('.radar-program-review');
      const originalMonolithicTable = document.querySelector('#tab-verificacoes .table-responsive > table.data-table tbody > tr td[rowspan]');
      return {
        hasHorizontalOverflow: main.scrollWidth > main.clientWidth + 1,
        firstProgramWidth: firstProgram.getBoundingClientRect().width,
        stackWidth: stackElement.getBoundingClientRect().width,
        originalRowspanStillPresent: Boolean(originalMonolithicTable)
      };
    });

    expect(geometry.hasHorizontalOverflow).toBe(false);
    expect(geometry.firstProgramWidth).toBeGreaterThan(geometry.stackWidth * 0.95);
    expect(geometry.originalRowspanStillPresent).toBe(false);

    await attachPng(testInfo, 'acompanhamento-programas-v4.png', await page.locator('#tab-verificacoes').screenshot());
  });

  test('modal de cobrança prioriza leitura confortável da seleção e da mensagem', async ({ page }, testInfo) => {
    await openSchoolWithCollectionPendencies(page);
    const metrics = await page.evaluate(() => {
      const modal = document.querySelector('#modal-cobranca');
      const modalHeader = modal.querySelector('.modal-header');
      const heading = modal.querySelector('.cobranca-preview-panel h4');
      const option = modal.querySelector('.cobranca-option');
      const optionTitle = modal.querySelector('.cobranca-option-title');
      const optionDetail = modal.querySelector('.cobranca-option-detail');
      const preview = modal.querySelector('.cobranca-preview');
      const optionStyle = getComputedStyle(option);
      const previewStyle = getComputedStyle(preview);
      return {
        modalHeaderBackground: getComputedStyle(modalHeader).backgroundImage,
        panelHeadingFont: parseFloat(getComputedStyle(heading).fontSize),
        optionTitleFont: parseFloat(getComputedStyle(optionTitle).fontSize),
        optionDetailFont: parseFloat(getComputedStyle(optionDetail).fontSize),
        optionPaddingTop: parseFloat(optionStyle.paddingTop),
        previewFont: parseFloat(previewStyle.fontSize),
        previewLineHeight: parseFloat(previewStyle.lineHeight)
      };
    });

    expect(metrics.modalHeaderBackground).toContain('linear-gradient');
    expect(metrics.panelHeadingFont).toBeGreaterThanOrEqual(15);
    expect(metrics.optionTitleFont).toBeGreaterThanOrEqual(14);
    expect(metrics.optionDetailFont).toBeGreaterThanOrEqual(13);
    expect(metrics.optionPaddingTop).toBeGreaterThanOrEqual(14);
    expect(metrics.previewFont).toBeGreaterThanOrEqual(15);
    expect(metrics.previewLineHeight).toBeGreaterThanOrEqual(24);

    await attachPng(testInfo, 'modal-cobranca-v4.png', await page.locator('#modal-cobranca .modal-content').screenshot());
  });

  test('em 820px o prontuário troca a tabela larga por linhas de documento em grade', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 820, height: 1100 });
    await openControladorSchool(page);

    const metrics = await page.evaluate(() => {
      const selector = document.querySelector('#global-competence-badge');
      const select = selector.querySelector('select');
      const main = document.querySelector('main.content-area');
      const sections = document.querySelector('.school-dossier-sections');
      const row = document.querySelector('.radar-program-review-row');
      const rowStyle = getComputedStyle(row);
      return {
        selectorAccent: parseFloat(getComputedStyle(selector).borderLeftWidth),
        selectorValueFont: parseFloat(getComputedStyle(select).fontSize),
        dossierColumns: getComputedStyle(sections).gridTemplateColumns.split(' ').filter(Boolean).length,
        reviewRowDisplay: rowStyle.display,
        reviewRowColumns: rowStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
        hasHorizontalOverflow: main.scrollWidth > main.clientWidth + 1
      };
    });

    expect(metrics.selectorAccent).toBeGreaterThanOrEqual(5);
    expect(metrics.selectorValueFont).toBeGreaterThanOrEqual(17);
    expect(metrics.dossierColumns).toBe(2);
    expect(metrics.reviewRowDisplay).toBe('grid');
    expect(metrics.reviewRowColumns).toBe(2);
    expect(metrics.hasHorizontalOverflow).toBe(false);

    await attachPng(testInfo, 'prontuario-820-v4.png', await page.screenshot({ fullPage: true }));
  });
});