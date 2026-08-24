const { test, expect } = require('@playwright/test');

async function waitForAuthorizedRadar(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarCompetenceContext?.isInitialized?.() === true
    && typeof window.switchProfile === 'function'
    && typeof window.switchView === 'function'
  ));
}

async function openControladorSchool(page, competenceKey = '2026-08') {
  await page.goto('/');
  await waitForAuthorizedRadar(page);
  await page.evaluate(key => {
    switchProfile('controlador');
    RadarCompetenceContext.select(key, { source: 'editorial-form-v5' });
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, key)
    ));
    if (!school) throw new Error('Escola compatível com o Prontuário não encontrada.');
    activeProntuarioCompetencia = key;
    switchView('prontuario', school.id);
  }, competenceKey);
  await expect(page.locator('.school-dossier.radar-school-summary-v4')).toBeVisible();
  await expect(page.locator('#prontuario-verif-rows.radar-program-ledger-body-v4')).toBeVisible();
  return competenceKey;
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

async function attachPng(testInfo, name, buffer) {
  await testInfo.attach(name, { body: buffer, contentType: 'image/png' });
}

test.describe('ficha institucional e contexto operacional v5', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato visual exclusivo do desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Dashboard mantém a competência dentro do campo de visão com destaque próprio', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForAuthorizedRadar(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      RadarCompetenceContext.select('2026-08', { source: 'editorial-form-v5' });
      switchView('dashboard');
    });

    const context = page.locator('[data-radar-competence-context]').first();
    await expect(context).toBeVisible();
    await expect(context).toContainText('Competência ativa');
    await expect(context).toContainText('Agosto 2026');

    const metrics = await context.evaluate(element => {
      const style = getComputedStyle(element);
      const value = element.querySelector('.radar-context-value');
      return {
        height: element.getBoundingClientRect().height,
        backgroundImage: style.backgroundImage,
        accent: parseFloat(style.borderLeftWidth),
        valueFont: value ? parseFloat(getComputedStyle(value).fontSize) : 0
      };
    });
    expect(metrics.height).toBeGreaterThanOrEqual(72);
    expect(metrics.backgroundImage).toContain('linear-gradient');
    expect(metrics.accent).toBeGreaterThanOrEqual(5);
    expect(metrics.valueFont).toBeGreaterThanOrEqual(24);

    await attachPng(testInfo, 'competencia-contextual-v5.png', await page.screenshot({ fullPage: true }));
  });

  test('Prontuário mostra competência perto do título e antes da ficha', async ({ page }, testInfo) => {
    await openControladorSchool(page);
    const context = page.locator('.radar-prontuario-context');
    await expect(context).toBeVisible();
    await expect(context).toContainText('Competência ativa');
    await expect(context).toContainText('Agosto 2026');
    await expect(context).toContainText('Exercício 2026');

    const order = await page.evaluate(() => {
      const header = document.querySelector('#main-container > .page-header');
      const context = document.querySelector('.radar-prontuario-context');
      const dossier = document.querySelector('.school-dossier');
      return {
        contextAfterHeader: context.getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1,
        contextBeforeDossier: context.getBoundingClientRect().bottom <= dossier.getBoundingClientRect().top + 1
      };
    });
    expect(order).toEqual({ contextAfterHeader: true, contextBeforeDossier: true });
  });

  test('ficha institucional usa campos visuais de formulário somente leitura', async ({ page }, testInfo) => {
    await openControladorSchool(page);

    const field = page.locator('.school-dossier .radar-info-field').first();
    const value = field.locator('.radar-info-value');
    const label = field.locator('.radar-info-label');
    await expect(label).toBeVisible();
    await expect(value).toBeVisible();

    const metrics = await page.evaluate(() => {
      const dossier = document.querySelector('.school-dossier');
      const identification = dossier.querySelector('[data-section="identificacao"] .radar-info-grid');
      const firstField = dossier.querySelector('.radar-info-field');
      const label = firstField.querySelector('.radar-info-label');
      const value = firstField.querySelector('.radar-info-value');
      const fieldStyle = getComputedStyle(firstField);
      const valueStyle = getComputedStyle(value);
      return {
        fieldDisplay: fieldStyle.display,
        identificationColumns: getComputedStyle(identification).gridTemplateColumns.split(' ').filter(Boolean).length,
        labelFont: parseFloat(getComputedStyle(label).fontSize),
        valueFont: parseFloat(valueStyle.fontSize),
        valueHeight: value.getBoundingClientRect().height,
        valueBorder: parseFloat(valueStyle.borderTopWidth),
        valueRadius: parseFloat(valueStyle.borderTopLeftRadius),
        valueBackground: valueStyle.backgroundColor
      };
    });

    expect(metrics.fieldDisplay).toBe('block');
    expect(metrics.identificationColumns).toBeGreaterThanOrEqual(4);
    expect(metrics.labelFont).toBeGreaterThanOrEqual(12);
    expect(metrics.valueFont).toBeGreaterThanOrEqual(15);
    expect(metrics.valueHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.valueBorder).toBeGreaterThanOrEqual(1);
    expect(metrics.valueRadius).toBeGreaterThanOrEqual(8);
    expect(metrics.valueBackground).not.toBe('rgba(0, 0, 0, 0)');

    await attachPng(testInfo, 'ficha-formulario-v5.png', await page.locator('.school-dossier').screenshot());
  });

  test('acompanhamento mantém controles no tbody original com leitura por programa', async ({ page }, testInfo) => {
    await openControladorSchool(page);
    const tbody = page.locator('#prontuario-verif-rows');
    const rows = tbody.locator(':scope > tr[data-program-id]');
    await expect(rows.first()).toBeVisible();

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('main.content-area');
      const tbodyElement = document.querySelector('#prontuario-verif-rows');
      const firstRow = tbodyElement.querySelector('.radar-program-row-v4--first');
      const metaCell = firstRow?.querySelector('.radar-program-meta-v4');
      return {
        rowDisplay: firstRow ? getComputedStyle(firstRow).display : '',
        metaFullWidth: metaCell ? getComputedStyle(metaCell).gridColumnEnd === '-1' : false,
        rowspanStillPresent: Boolean(tbodyElement.querySelector('tr[data-program-id] td[rowspan]')),
        controlsInsideOriginalTbody: tbodyElement.querySelectorAll('button, input, select, textarea').length,
        hasHorizontalOverflow: main.scrollWidth > main.clientWidth + 1
      };
    });
    expect(geometry.rowDisplay).toBe('grid');
    expect(geometry.metaFullWidth).toBe(true);
    expect(geometry.rowspanStillPresent).toBe(true);
    expect(geometry.controlsInsideOriginalTbody).toBeGreaterThan(0);
    expect(geometry.hasHorizontalOverflow).toBe(false);

    await attachPng(testInfo, 'acompanhamento-v5.png', await page.locator('#tab-verificacoes').screenshot());
  });

  test('modal de cobrança continua confortável e funcional', async ({ page }, testInfo) => {
    await openSchoolWithCollectionPendencies(page);
    const preview = page.locator('#modal-cobranca .cobranca-preview');
    await expect(preview).toContainText('Extrato Conta Corrente');
    const metrics = await preview.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        font: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight)
      };
    });
    expect(metrics.font).toBeGreaterThanOrEqual(15);
    expect(metrics.lineHeight).toBeGreaterThanOrEqual(24);
    await attachPng(testInfo, 'modal-cobranca-v5.png', await page.locator('#modal-cobranca .modal-content').screenshot());
  });

  test('em 820px a ficha usa duas colunas e não cria overflow', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 820, height: 1100 });
    await openControladorSchool(page);

    const metrics = await page.evaluate(() => {
      const main = document.querySelector('main.content-area');
      const grid = document.querySelector('.school-dossier [data-section="identificacao"] .radar-info-grid');
      const context = document.querySelector('.radar-prontuario-context');
      const row = document.querySelector('.radar-program-row-v4');
      return {
        dossierColumns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        contextVisible: getComputedStyle(context).display !== 'none',
        contextValueFont: parseFloat(getComputedStyle(context.querySelector('.radar-context-value')).fontSize),
        reviewColumns: getComputedStyle(row).gridTemplateColumns.split(' ').filter(Boolean).length,
        hasHorizontalOverflow: main.scrollWidth > main.clientWidth + 1
      };
    });
    expect(metrics.dossierColumns).toBe(2);
    expect(metrics.contextVisible).toBe(true);
    expect(metrics.contextValueFont).toBeGreaterThanOrEqual(22);
    expect(metrics.reviewColumns).toBe(2);
    expect(metrics.hasHorizontalOverflow).toBe(false);

    await attachPng(testInfo, 'prontuario-820-v5.png', await page.screenshot({ fullPage: true }));
  });
});
