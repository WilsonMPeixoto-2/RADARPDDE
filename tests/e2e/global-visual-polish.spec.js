'use strict';

const { test, expect } = require('@playwright/test');

async function waitForApp(page) {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true);
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady) await window.RadarProductExtensionsReady;
  });
}

async function shot(page, testInfo, name) {
  await page.mouse.move(12, 12);
  await page.waitForTimeout(140);
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png'
  });
}

async function openProntuario(page) {
  return page.evaluate(() => {
    switchProfile('controlador');
    const activeKey = window.RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, activeKey)
    ));
    if (!school) throw new Error('Nenhuma escola com PDDE Básico disponível para auditoria visual.');

    const compKey = activeKey + '_BASIC';
    verificacoes[school.id] ||= {};
    if (!verificacoes[school.id][compKey]) {
      verificacoes[school.id][compKey] = RadarFluxoOperacional.createEmptyVerification('BASIC');
    }
    verificacoes[school.id][compKey].bonificacao.notaFiscal = 'Não';
    verificacoes[school.id][compKey].analise.notaFiscal = 'Não analisado';
    rebuildOperationalIndexes();

    activeProntuarioCompetencia = activeKey;
    switchView('prontuario', school.id);
    return { schoolId: school.id, competence: activeKey, compKey };
  });
}

test.describe('Polimento visual global', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Auditoria visual homologada no desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForApp(page);
  });

  test('camada final é carregada e mantém as superfícies principais legíveis', async ({ page }, testInfo) => {
    await expect(
      page.locator('link[data-radar-product-style="/src/styles/global-visual-polish.css"]')
    ).toHaveCount(1);

    await page.evaluate(() => {
      switchProfile('controlador');
      switchView('dashboard');
    });
    await expect(page.locator('#main-container')).toBeVisible();

    const globalVisual = await page.evaluate(() => {
      const sidebar = document.querySelector('aside.sidebar');
      const search = document.querySelector('#global-search');
      const panel = document.querySelector('.panel-card');
      const styles = element => element ? getComputedStyle(element) : null;
      return {
        sidebarRadius: styles(sidebar)?.borderRadius || '',
        searchRadius: styles(search)?.borderRadius || '',
        panelRadius: styles(panel)?.borderRadius || '',
        bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    expect(Number.parseFloat(globalVisual.searchRadius)).toBeGreaterThanOrEqual(10);
    expect(Number.parseFloat(globalVisual.panelRadius)).toBeGreaterThanOrEqual(16);
    expect(globalVisual.bodyOverflow).toBeLessThanOrEqual(1);
    await shot(page, testInfo, '01-dashboard-polido');

    await page.locator('#nav-escolas').click();
    await expect(page.getByRole('heading', { name: 'Escolas e Carteiras', exact: true }))
      .toBeVisible();
    await shot(page, testInfo, '02-carteira-escolas-polida');

    await page.locator('#nav-competencias').click();
    await expect(page.getByRole('heading', { name: 'Visão por Competência', exact: true }))
      .toBeVisible();
    await shot(page, testInfo, '03-competencias-polidas');

    await page.locator('#nav-pendencias').click();
    await expect(page.getByRole('heading', { name: /Pendências operacionais/i }))
      .toBeVisible();
    await shot(page, testInfo, '04-pendencias-polidas');
  });

  test('Prontuário, abas, formulários e modais preservam elementos e ganham acabamento', async ({ page }, testInfo) => {
    await openProntuario(page);
    await expect(page.locator('.prontuario-school-header')).toBeVisible();
    await expect(page.locator('.prontuario-flowbar')).toBeVisible();

    const coreLabels = [
      'Competências e Análises',
      'Pendências Ativas',
      'Gerar comunicação',
      'Registrar contato',
      'Histórico de Contatos',
      'Registro de Capital',
      'Registros Internos',
      'Histórico cronológico'
    ];
    const flowText = (await page.locator('.prontuario-flowbar').innerText()).replace(/\s+/g, ' ');
    for (const label of coreLabels) {
      expect(flowText).toContain(label);
    }
    await shot(page, testInfo, '05-prontuario-visao-geral');

    const contactButton = page.getByRole('button', { name: 'Registrar contato', exact: true });
    await contactButton.click();
    const contactModal = page.locator('#modal-contato');
    await expect(contactModal).toHaveClass(/show/);
    const contactFooter = contactModal.locator('.modal-footer');
    await expect(contactFooter).toBeVisible();
    const sticky = await contactFooter.evaluate(element => getComputedStyle(element).position);
    expect(sticky).toBe('sticky');
    await shot(page, testInfo, '06-modal-contato-polido');
    await contactModal.locator('.btn-close').click();

    await page.getByRole('tab', { name: 'Histórico de Contatos', exact: true }).click();
    await expect(page.locator('#tab-contatos')).toBeVisible();
    await shot(page, testInfo, '07-historico-contatos-polido');

    await page.getByRole('tab', { name: 'Registro de Capital', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Registro de Capital', exact: true }))
      .toHaveAttribute('aria-selected', 'true');
    await shot(page, testInfo, '08-registro-capital-polido');

    await page.getByRole('tab', { name: 'Registros Internos', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Registros Internos', exact: true }))
      .toHaveAttribute('aria-selected', 'true');
    await shot(page, testInfo, '09-registros-internos-polidos');

    await page.getByRole('tab', { name: 'Histórico cronológico', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Histórico cronológico', exact: true }))
      .toHaveAttribute('aria-selected', 'true');
    await shot(page, testInfo, '10-historico-cronologico-polido');
  });

  test('fluxo de despesa a identificar mantém conteúdo e melhora modal, drawer e comunicação', async ({ page }, testInfo) => {
    const context = await openProntuario(page);

    await page.getByRole('tab', { name: 'Competências e Análises', exact: true }).click();
    const start = page.getByRole('button', {
      name: 'Registrar despesa a identificar',
      exact: true
    });
    await expect(start).toBeVisible();
    await start.click();

    const expenseModal = page.locator('#modal-dados-nota');
    await expect(expenseModal).toHaveClass(/show/);
    await expect(expenseModal.getByRole('heading', {
      name: 'Registrar despesa a identificar',
      exact: true
    })).toBeVisible();
    await expect(expenseModal.getByLabel(
      'Número da Nota Fiscal (opcional neste estágio)',
      { exact: true }
    )).toBeVisible();
    await shot(page, testInfo, '11-modal-despesa-a-identificar-polido');
    await expenseModal.locator('.btn-close').click();

    await page.evaluate(async ({ schoolId, competence }) => {
      const school = escolas.find(candidate => String(candidate.id) === String(schoolId));
      const programId = Array.isArray(school?.programasIds) && school.programasIds.includes('BASIC')
        ? 'BASIC'
        : school?.programasIds?.[0];
      if (!programId) throw new Error('Programa não encontrado para o cenário visual.');
      const compKey = competence + '_' + programId;
      verificacoes[schoolId] ||= {};
      if (!verificacoes[schoolId][compKey]) {
        verificacoes[schoolId][compKey] = RadarFluxoOperacional.createEmptyVerification(programId);
      }
      await RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
        schoolId,
        compKey,
        description: 'Débito para auditoria visual',
        expenseType: 'a_identificar',
        invoiceNumber: '',
        amount: 123.45,
        profile: 'controlador',
        pendencyObservation: 'Aguardando documento para identificar a despesa.'
      });
      rebuildOperationalIndexes();
      activeProntuarioCompetencia = competence;
      switchView('prontuario', schoolId);
    }, context);

    const viewPendency = page.getByRole('button', { name: /Visualizar pendência/i }).first();
    await expect(viewPendency).toBeVisible();
    await viewPendency.click();
    await expect(page.locator('#pendency-preview-drawer')).toBeVisible();
    await expect(page.getByText('Próximo passo', { exact: true })).toBeVisible();
    await shot(page, testInfo, '12-drawer-pendencia-polido');

    const registerSubmission = page.locator('#pendency-preview-drawer')
      .getByRole('button', { name: 'Registrar novo envio', exact: true });
    await registerSubmission.click();
    const submissionModal = page.locator('#modal-registrar-envio');
    await expect(submissionModal).toHaveClass(/show/);
    await expect(submissionModal.locator('.modal-footer')).toBeVisible();
    expect(
      await submissionModal.locator('.modal-footer').evaluate(element => getComputedStyle(element).position)
    ).toBe('sticky');
    await shot(page, testInfo, '13-modal-novo-envio-polido');
    await submissionModal.locator('.btn-close').click();

    await page.getByRole('button', { name: 'Gerar comunicação', exact: true }).click();
    const communicationModal = page.locator('#modal-cobranca');
    await expect(communicationModal).toHaveClass(/show/);
    await expect(communicationModal.getByText('Pré-visualização da mensagem', { exact: true }))
      .toBeVisible();
    await shot(page, testInfo, '14-modal-comunicacao-polido');
  });
});
