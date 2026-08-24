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
  await expect(page.locator('.school-dossier.radar-school-summary-v4')).toBeVisible();
  await expect(page.locator('#prontuario-verif-rows.radar-program-ledger-body-v4')).toBeVisible();
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

test.describe('direção estrutural v4 do prontuário no desktop', () => {
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

  test('ficha institucional usa leitura de formulário e ocupa menos altura', async ({ page }, testInfo) => {
    await openControladorSchool(page);

    const metrics = await page.evaluate(() => {
      const dossier = document.querySelector('.school-dossier');
      const sections = dossier.querySelector('.school-dossier-sections');
      const field = dossier.querySelector('.radar-info-field');
      const label = field.querySelector('.radar-info-label');
      const value = field.querySelector('.radar-info-value');
      const fieldStyle = getComputedStyle(field);
      return {
        dossierHeight: dossier.getBoundingClientRect().height,
        sectionColumns: getComputedStyle(sections).gridTemplateColumns.split(' ').filter(Boolean).length,
        fieldDisplay: fieldStyle.display,
        fieldColumns: fieldStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
        labelFont: parseFloat(getComputedStyle(label).fontSize),
        valueFont: parseFloat(getComputedStyle(value).fontSize)
      };
    });

    await expect(page.locator('.radar-school-summary-kicker')).toHaveText('Ficha institucional');
    expect(metrics.dossierHeight).toBeLessThan(560);
    expect(metrics.sectionColumns).toBe(2);
    expect(metrics.fieldDisplay).toBe('grid');
    expect(metrics.fieldColumns).toBe(2);
    expect(metrics.labelFont).toBeGreaterThanOrEqual(11);
    expect(metrics.valueFont).toBeGreaterThanOrEqual(15);

    await attachPng(testInfo, 'ficha-institucional-v4.png', await page.locator('.school-dossier').screenshot());
  });

  test('acompanhamento mensal vira blocos visuais por programa sem mover controles do tbody', async ({ page }, testInfo) => {
    await openControladorSchool(page);

    const tbody = page.locator('#prontuario-verif-rows');
    const rows = tbody.locator(':scope > tr[data-program-id]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThanOrEqual(1);

    const firstProgram = tbody.locator('.radar-program-row-v4--first').first();
    const meta = firstProgram.locator(':scope > .radar-program-meta-v4');
    await expect(firstProgram).toBeVisible();
    await expect(meta).toBeVisible();
    await expect(meta.locator('.radar-program-meta-name-v4')).not.toHaveText('');
    await expect(firstProgram.locator('.radar-program-field-v4').first()).toBeVisible();

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('main.content-area');
      const tbodyElement = document.querySelector('#prontuario-verif-rows');
      const firstRow = tbodyElement.querySelector('.radar-program-row-v4--first');
      const metaCell = firstRow.querySelector('.radar-program-meta-v4');
      const originalRowspan = tbodyElement.querySelector('tr[data-program-id] td[rowspan]');
      const controlsInsideOriginalTbody = tbodyElement.querySelectorAll('button, input, select, textarea').length;
      return {
        hasHorizontalOverflow: main.scrollWidth > main.clientWidth + 1,
        rowDisplay: getComputedStyle(firstRow).display,
        metaFullWidth: getComputedStyle(metaCell).gridColumnEnd === '-1',
        originalRowspanStillPresent: Boolean(originalRowspan),
        controlsInsideOriginalTbody
      };
    });

    expect(geometry.hasHorizontalOverflow).toBe(false);
    expect(geometry.rowDisplay).toBe('grid');
    expect(geometry.metaFullWidth).toBe(true);
    expect(geometry.originalRowspanStillPresent).toBe(true);
    expect(geometry.controlsInsideOriginalTbody).toBeGreaterThan(0);

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

  test('em 820px ficha e acompanhamento assumem leitura de duas colunas sem overflow', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 820, height: 1100 });
    await openControladorSchool(page);

    const metrics = await page.evaluate(() => {
      const selector = document.querySelector('#global-competence-badge');
      const select = selector.querySelector('select');
      const main = document.querySelector('main.content-area');
      const sections = document.querySelector('.school-dossier-sections');
      const row = document.querySelector('.radar-program-row-v4');
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
    expect(metrics.dossierColumns).toBe(1);
    expect(metrics.reviewRowDisplay).toBe('grid');
    expect(metrics.reviewRowColumns).toBe(2);
    expect(metrics.hasHorizontalOverflow).toBe(false);

    await attachPng(testInfo, 'prontuario-820-v4.png', await page.screenshot({ fullPage: true }));
  });
});