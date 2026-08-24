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
  const schoolId = await page.evaluate(() => {
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
    return school.id;
  });
  await expect(page.locator('#main-container .school-grid')).toBeVisible();
  return schoolId;
}

async function openSchoolWithCollectionPendencies(page) {
  await page.goto('/');
  await waitForAuthorizedRadar(page);
  return page.evaluate(() => {
    switchProfile('controlador');
    const competenceKey = '2026-08';
    RadarCompetenceContext.select(competenceKey, { source: 'visual-hierarchy-cobranca-e2e' });
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
      createPendency('visual-cobranca-conta', 'extCC', 'Extrato Conta Corrente'),
      createPendency('visual-cobranca-investimento', 'extINV', 'Extrato Investimento')
    ];
    rebuildOperationalIndexes();
    activeProntuarioCompetencia = competenceKey;
    switchView('prontuario', school.id);
    return { schoolId: school.id, schoolName: school.denominação };
  });
}

test.describe('hierarquia visual operacional no desktop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato visual exclusivo do desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('torna a competência o contexto dominante sem criar outro estado', async ({ page }) => {
    await page.goto('/');
    await waitForAuthorizedRadar(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      RadarCompetenceContext.select('2026-08', { source: 'visual-hierarchy-e2e' });
      switchView('dashboard');
    });

    await expect(page.getByRole('heading', { name: 'Painel do Controlador' })).toBeVisible();

    const selector = page.locator('#global-competence-badge');
    const context = page.locator('[data-radar-competence-context]');
    await expect(selector).toContainText('Competência ativa');
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    await expect(context).toHaveCount(1);
    await expect(context).toContainText('Agosto 2026');

    const prominence = await selector.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const select = element.querySelector('select');
      const selectStyle = select ? window.getComputedStyle(select) : null;
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        selectFontSize: selectStyle ? Number.parseFloat(selectStyle.fontSize) : 0
      };
    });

    expect(prominence.width).toBeGreaterThanOrEqual(240);
    expect(prominence.height).toBeGreaterThanOrEqual(52);
    expect(prominence.selectFontSize).toBeGreaterThanOrEqual(15);
    expect(await page.evaluate(() => RadarCompetenceContext.getState().activeKey)).toBe('2026-08');
  });

  test('repete o contexto ativo na Visão por Competência sem seletor local', async ({ page }) => {
    await page.goto('/');
    await waitForAuthorizedRadar(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      RadarCompetenceContext.select('2026-08', { source: 'visual-hierarchy-e2e' });
      switchView('competencias');
    });

    await expect(page.getByRole('heading', { name: 'Visão por Competência' })).toBeVisible();
    const context = page.locator('[data-radar-competence-context]');
    await expect(context).toHaveCount(1);
    await expect(context).toContainText('Competência ativa');
    await expect(context).toContainText('Agosto 2026');
    await expect(page.getByRole('heading', {
      name: 'Lista de Entrega e Bonificação - Competência Agosto/2026'
    })).toBeVisible();
    await expect(page.locator('#comp-select-view')).toHaveCount(0);
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  });

  test('organiza os dados da escola em um dossiê institucional de largura integral', async ({ page }) => {
    await openControladorSchool(page);

    const dossier = page.locator('.school-dossier');
    await expect(dossier).toBeVisible();
    await expect(dossier.getByRole('heading', { name: 'Informações institucionais' })).toBeVisible();
    await expect(dossier.getByRole('heading', { name: 'Identificação' })).toBeVisible();
    await expect(dossier.getByRole('heading', { name: 'Gestão escolar' })).toBeVisible();
    await expect(dossier.getByRole('heading', { name: 'Contatos' })).toBeVisible();
    await expect(dossier.getByRole('heading', { name: 'Vinculação administrativa' })).toBeVisible();
    await expect(dossier.getByRole('heading', { name: 'Programas vinculados' })).toBeVisible();
    await expect(dossier.locator('dt')).toHaveText([
      'INEP',
      'Designação',
      'SICI',
      'CNPJ',
      'Diretor(a)',
      'Diretor(a) Adjunto(a)',
      'Telefone do Diretor(a)',
      'Telefone do Adjunto(a)',
      'Telefone da Unidade',
      'Celular Institucional',
      'E-mail Institucional',
      'Coordenadoria / RA',
      'Controlador Responsável',
      'Processo Inventário (Exercício)'
    ]);
    await expect(dossier.locator('dd')).toHaveCount(14);
    await expect(dossier.locator('.school-program-list')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const main = document.querySelector('main.content-area');
      const dossierElement = document.querySelector('.school-dossier');
      const workspace = document.querySelector('.school-workspace');
      const identificationGrid = document.querySelector(
        '.radar-info-section[data-section="identificacao"] .radar-info-grid'
      );
      return {
        workspaceBelow: workspace.getBoundingClientRect().top >= dossierElement.getBoundingClientRect().bottom,
        dossierWidth: Math.round(dossierElement.getBoundingClientRect().width),
        mainWidth: Math.round(main.getBoundingClientRect().width),
        columns: window.getComputedStyle(identificationGrid).gridTemplateColumns.split(' ').length,
        hasHorizontalOverflow: main.scrollWidth > main.clientWidth + 1
      };
    });

    expect(geometry.workspaceBelow).toBe(true);
    expect(geometry.dossierWidth).toBeGreaterThan(geometry.mainWidth * 0.9);
    expect(geometry.columns).toBeGreaterThanOrEqual(2);
    expect(geometry.hasHorizontalOverflow).toBe(false);
  });

  test('separa seleção e prévia da cobrança sem alterar a mensagem', async ({ page }) => {
    const seeded = await openSchoolWithCollectionPendencies(page);
    await expect(page.getByRole('heading', {
      name: new RegExp(`Unidade Escolar: ${seeded.schoolName}`)
    })).toBeVisible();

    await page.getByRole('button', { name: 'Gerar Cobrança', exact: true }).click();
    const modal = page.locator('#modal-cobranca');
    await expect(modal).toHaveClass(/show/);
    await expect(modal.getByRole('button', { name: 'Fechar mensagem de cobrança' })).toBeVisible();
    await expect(modal.locator('.cobranca-option')).toHaveCount(2);
    await expect(modal.locator('.chk-cobranca-item:checked')).toHaveCount(2);

    const preview = modal.locator('#cobranca-preview-text');
    await expect(preview).toContainText(`Prezado(a) Diretor(a) de ${seeded.schoolName}`);
    await expect(preview).toContainText('Extrato Conta Corrente');
    await expect(preview).toContainText('Extrato Investimento');
    await expect(preview).toContainText('Atenciosamente');

    const layout = await modal.evaluate(element => {
      const workspace = element.querySelector('.cobranca-workspace').getBoundingClientRect();
      const selection = element.querySelector('.cobranca-selection-panel').getBoundingClientRect();
      const previewPanel = element.querySelector('.cobranca-preview-panel').getBoundingClientRect();
      const footer = element.querySelector('.modal-footer').getBoundingClientRect();
      return {
        sideBySide: previewPanel.left > selection.right,
        footerBelow: footer.top >= workspace.bottom - 1,
        footerVisible: footer.bottom <= window.innerHeight
      };
    });
    expect(layout).toEqual({ sideBySide: true, footerBelow: true, footerVisible: true });

    await modal.locator('.chk-cobranca-item').last().uncheck();
    await expect(preview).toContainText('Extrato Conta Corrente');
    await expect(preview).not.toContainText('Extrato Investimento');
    await expect(preview).toContainText(`Prezado(a) Diretor(a) de ${seeded.schoolName}`);
    await expect(preview).toContainText('Atenciosamente');
  });
});
