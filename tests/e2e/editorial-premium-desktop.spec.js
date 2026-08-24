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

test.describe('direção editorial premium no desktop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato visual exclusivo do desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('competência ativa tem presença visual inequívoca no topo e no contexto da página', async ({ page }) => {
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
      const contextElement = document.querySelector('[data-radar-competence-context]');
      const contextLabel = contextElement.querySelector('.radar-context-label');
      const contextValue = contextElement.querySelector('.radar-context-value');
      const selectorStyle = getComputedStyle(selectorElement);
      const contextStyle = getComputedStyle(contextElement);
      return {
        selectorHeight: selectorElement.getBoundingClientRect().height,
        selectorBackground: selectorStyle.backgroundColor,
        selectorLabelFont: parseFloat(getComputedStyle(label).fontSize),
        selectorValueFont: parseFloat(getComputedStyle(select).fontSize),
        contextLabelFont: parseFloat(getComputedStyle(contextLabel).fontSize),
        contextValueFont: parseFloat(getComputedStyle(contextValue).fontSize),
        contextAccentWidth: parseFloat(contextStyle.borderLeftWidth)
      };
    });

    await expect(selector).toContainText('Competência ativa');
    await expect(context).toContainText('Agosto 2026');
    expect(metrics.selectorHeight).toBeGreaterThanOrEqual(60);
    expect(metrics.selectorLabelFont).toBeGreaterThanOrEqual(12);
    expect(metrics.selectorValueFont).toBeGreaterThanOrEqual(17);
    expect(alphaFromColor(metrics.selectorBackground)).toBeGreaterThanOrEqual(0.18);
    expect(metrics.contextLabelFont).toBeGreaterThanOrEqual(12);
    expect(metrics.contextValueFont).toBeGreaterThanOrEqual(20);
    expect(metrics.contextAccentWidth).toBeGreaterThanOrEqual(5);
  });

  test('dossiê escolar diferencia claramente seção, rótulo e valor', async ({ page }) => {
    await openControladorSchool(page);
    const metrics = await page.evaluate(() => {
      const section = document.querySelector('.radar-info-section[data-section="identificacao"]');
      const title = section.querySelector('h3');
      const field = section.querySelector('.radar-info-field');
      const label = field.querySelector('.radar-info-label');
      const value = field.querySelector('.radar-info-value');
      const fieldStyle = getComputedStyle(field);
      return {
        sectionTitleFont: parseFloat(getComputedStyle(title).fontSize),
        labelFont: parseFloat(getComputedStyle(label).fontSize),
        valueFont: parseFloat(getComputedStyle(value).fontSize),
        valueWeight: Number.parseInt(getComputedStyle(value).fontWeight, 10),
        fieldDivider: parseFloat(fieldStyle.borderBottomWidth),
        fieldPaddingBottom: parseFloat(fieldStyle.paddingBottom)
      };
    });

    expect(metrics.sectionTitleFont).toBeGreaterThanOrEqual(15);
    expect(metrics.labelFont).toBeGreaterThanOrEqual(12);
    expect(metrics.valueFont).toBeGreaterThanOrEqual(15);
    expect(metrics.valueWeight).toBeGreaterThanOrEqual(600);
    expect(metrics.fieldDivider).toBeGreaterThanOrEqual(1);
    expect(metrics.fieldPaddingBottom).toBeGreaterThanOrEqual(10);
  });

  test('modal de cobrança prioriza leitura confortável da seleção e da mensagem', async ({ page }) => {
    await openSchoolWithCollectionPendencies(page);
    const metrics = await page.evaluate(() => {
      const modal = document.querySelector('#modal-cobranca');
      const heading = modal.querySelector('.cobranca-preview-panel h4');
      const option = modal.querySelector('.cobranca-option');
      const optionTitle = modal.querySelector('.cobranca-option-title');
      const optionDetail = modal.querySelector('.cobranca-option-detail');
      const preview = modal.querySelector('.cobranca-preview');
      const optionStyle = getComputedStyle(option);
      const previewStyle = getComputedStyle(preview);
      return {
        panelHeadingFont: parseFloat(getComputedStyle(heading).fontSize),
        optionTitleFont: parseFloat(getComputedStyle(optionTitle).fontSize),
        optionDetailFont: parseFloat(getComputedStyle(optionDetail).fontSize),
        optionPaddingTop: parseFloat(optionStyle.paddingTop),
        previewFont: parseFloat(previewStyle.fontSize),
        previewLineHeight: parseFloat(previewStyle.lineHeight)
      };
    });

    expect(metrics.panelHeadingFont).toBeGreaterThanOrEqual(15);
    expect(metrics.optionTitleFont).toBeGreaterThanOrEqual(14);
    expect(metrics.optionDetailFont).toBeGreaterThanOrEqual(13);
    expect(metrics.optionPaddingTop).toBeGreaterThanOrEqual(14);
    expect(metrics.previewFont).toBeGreaterThanOrEqual(15);
    expect(metrics.previewLineHeight).toBeGreaterThanOrEqual(24);
  });
});
