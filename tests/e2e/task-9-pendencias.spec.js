const fs = require('node:fs/promises');
const ExcelJS = require('exceljs');
const { test, expect } = require('@playwright/test');

async function seedFourPendencyStates(page) {
  return page.evaluate(() => {
    switchProfile('controlador');

    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, '2026-05')
    ));
    if (!school) throw new Error('Escola determinística para a Task 9 não encontrada.');

    const createOpen = ({ id, documentoKey, documentoNome, dataAbertura, erros }) => (
      RadarPendencias.createDocumentPendency({
        id,
        escolaId: school.id,
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey,
        item: `PDDE Básico - ${documentoNome}`,
        errosAtuais: erros,
        observacao: `Observação inicial da pendência ${id}.`,
        dataAbertura
      }, {
        eventId: `${id}-abertura`,
        at: `${dataAbertura}T12:00:00.000Z`,
        usuario: 'Controladora Task 9',
        perfil: 'Controlador'
      })
    );

    const open = createOpen({
      id: 'task9-open',
      documentoKey: 'extCC',
      documentoNome: 'Extrato Conta Corrente',
      dataAbertura: '2026-06-01',
      erros: ['Documento ilegível', 'Competência incorreta']
    });

    const awaitingBase = createOpen({
      id: 'task9-awaiting',
      documentoKey: 'extINV',
      documentoNome: 'Extrato Investimento',
      dataAbertura: '2026-06-02',
      erros: ['Documento incompleto']
    });
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'task9-awaiting-tentativa',
      dataDisponibilizacao: '2026-07-10',
      observacao: 'Arquivo corrigido disponibilizado no Drive.',
      link: 'https://drive.google.com/file/d/task9-awaiting/view'
    }, {
      eventId: 'task9-awaiting-envio',
      at: '2026-07-10T12:00:00.000Z',
      usuario: 'Escola Task 9',
      perfil: 'Escola'
    });

    const resolvedBase = createOpen({
      id: 'task9-resolved',
      documentoKey: 'notaFiscal',
      documentoNome: 'Notas Fiscais',
      dataAbertura: '2026-06-03',
      erros: ['Arquivo incompatível']
    });
    const resolvedAwaiting = RadarPendencias.registerCorrectiveSubmission(resolvedBase, {
      id: 'task9-resolved-tentativa',
      dataDisponibilizacao: '2026-07-08',
      observacao: 'Notas fiscais substituídas para conferência.'
    }, {
      eventId: 'task9-resolved-envio',
      at: '2026-07-08T12:00:00.000Z',
      usuario: 'Escola Task 9',
      perfil: 'Escola'
    });
    const resolved = RadarPendencias.recordReanalysis(resolvedAwaiting, {
      resultado: 'correto',
      observacao: 'Documentos conferidos e corretos.'
    }, {
      eventId: 'task9-resolved-reanalise',
      at: '2026-07-09T12:00:00.000Z',
      usuario: 'Controladora Task 9',
      perfil: 'Controlador'
    });

    const cancelledBase = createOpen({
      id: 'task9-cancelled',
      documentoKey: 'declBBAgil',
      documentoNome: 'Declaração BB Ágil',
      dataAbertura: '2026-06-04',
      erros: ['Dados divergentes']
    });
    const cancelled = RadarPendencias.cancelPendency(cancelledBase, {
      justificativa: 'Registro criado no documento incorreto.'
    }, {
      eventId: 'task9-cancelled-evento',
      at: '2026-07-07T12:00:00.000Z',
      usuario: 'Controladora Task 9',
      perfil: 'Controlador'
    });

    pendencias = [open, awaiting, resolved, cancelled];
    contatos = [
      {
        id: 'task9-contact',
        pendenciaId: open.id,
        escolaId: school.id,
        data: '2026-07-06',
        tipo: 'WhatsApp',
        descricao: 'Direção orientada sobre o documento ilegível.',
        responsavel: 'Controladora Task 9'
      }
    ];
    activePendencyDetailId = null;
    rebuildOperationalIndexes();
    persist();
    switchView('pendencias');

    return {
      schoolId: school.id,
      schoolName: school.denominação,
      schoolDesignation: school.designação
    };
  });
}

function visibleRecord(page, id) {
  return page.locator(`[data-pendency-id="${id}"]:visible`).first();
}

test.describe('Task 9 — página de Pendências Operacionais', () => {
  test('separa as quatro situações canônicas em abas acessíveis', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedFourPendencyStates(page);

    const tablist = page.getByRole('tablist', { name: 'Situações das pendências' });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Abertas\b/ })).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Aguardando reanálise\b/ })).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Resolvidas\b/ })).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Canceladas\b/ })).toBeVisible();

    const openTab = tablist.getByRole('tab', { name: /^Abertas\b/ });
    await expect(openTab).toHaveAttribute('aria-selected', 'true');
    await expect(visibleRecord(page, 'task9-open')).toBeVisible();
  });


  test('baixa planilha editorial respeitando a busca e os filtros da fila', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    test.setTimeout(90_000);

    await page.goto('/');
    const seeded = await seedFourPendencyStates(page);

    const button = page.getByRole('button', {
      name: 'Baixar planilha de pendências em formato Excel'
    });
    await expect(button).toBeVisible();
    await expect(button).toContainText('Baixar planilha');

    const search = page.getByRole('searchbox', { name: 'Buscar pendências' });
    await search.fill('dados divergentes');
    await expect(page.locator('.pendency-filter-result')).toContainText('1 de 4 registros encontrado.');

    const downloadPromise = page.waitForEvent('download');
    await button.click();
    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/^RELATORIO_PENDENCIAS_PDDE_\d{4}-\d{2}-\d{2}\.xlsx$/);

    const downloadPath = await download.path();
    const bytes = await fs.readFile(downloadPath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);

    expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(['RESUMO', 'PENDÊNCIAS']);
    const summary = workbook.getWorksheet('RESUMO');
    const data = workbook.getWorksheet('PENDÊNCIAS');
    expect(summary.getCell('A1').value).toBe('RELATÓRIO DE PENDÊNCIAS DO PDDE');
    expect(String(summary.getCell('C6').value)).toContain('Busca: dados divergentes');
    expect(data.getCell('A4').value).toBe('Situação');
    expect(data.getCell('A5').value).toBe('Cancelada');
    expect(data.getCell('B5').value).toBe(seeded.schoolName);
    expect(data.getCell('B6').value).toBeNull();
    await expect(button).toBeEnabled();
  });

  test('aplica busca global sem perder a separação das quatro filas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedFourPendencyStates(page);

    const search = page.getByRole('searchbox', { name: 'Buscar pendências' });
    await search.fill('dados divergentes');

    const tablist = page.getByRole('tablist', { name: 'Situações das pendências' });
    const openCounter = tablist.getByRole('tab', { name: /^Abertas\b/ }).locator('span');
    const cancelledCounter = tablist.getByRole('tab', { name: /^Canceladas\b/ }).locator('span');
    await expect(openCounter).toHaveText('0 de 1');
    await expect(openCounter).toHaveAttribute('aria-label', '0 de 1 registros');
    await expect(cancelledCounter).toHaveText('1 de 1');
    await expect(cancelledCounter).toHaveAttribute('aria-label', '1 de 1 registros');
    await expect(page.locator('.pendency-filter-result')).toContainText('1 de 4 registros encontrado.');

    await tablist.getByRole('tab', { name: /^Canceladas\b/ }).click();
    await expect(visibleRecord(page, 'task9-cancelled')).toContainText('Declaração BB Ágil');
    await expect(search).toHaveValue('dados divergentes');
  });

  test('abre o drawer com erros, tentativas, contatos e timeline e restaura o foco', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedFourPendencyStates(page);

    const record = visibleRecord(page, 'task9-open');
    const detailsButton = record.getByRole('button', { name: 'Ver detalhes' });
    await detailsButton.click();

    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Extrato Conta Corrente');
    await expect(drawer).toContainText('Documento ilegível');
    await expect(drawer).toContainText('Observação inicial da pendência task9-open.');
    await expect(drawer).toContainText('Direção orientada sobre o documento ilegível.');
    await expect(drawer.getByRole('heading', { name: 'Linha do tempo' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(detailsButton).toBeFocused();
  });

  test('preserva busca, aba, seleção e rolagem ao retornar do Prontuário', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const seeded = await seedFourPendencyStates(page);

    await page.evaluate(schoolId => {
      window.RadarNavigationHistory.navigate(window, {
        view: 'pendencias',
        filters: { escola: schoolId }
      });
    }, seeded.schoolId);
    await expect(page).toHaveURL(new RegExp(`/pendencias\\?escola=${seeded.schoolId}$`));
    await expect(page.locator('#pendency-filter-school')).toHaveValue(seeded.schoolId);

    const search = page.getByRole('searchbox', { name: 'Buscar pendências' });
    await search.fill(seeded.schoolDesignation);
    await visibleRecord(page, 'task9-open').getByRole('button', { name: 'Ver detalhes' }).click();

    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Abrir no Prontuário' }).click();

    await expect(page.getByRole('button', { name: 'Voltar às Pendências' })).toBeVisible();
    await expect(page.locator('#main-container')).toContainText(seeded.schoolName);
    await expect(page).toHaveURL(new RegExp(`/escolas/${seeded.schoolId}$`));
    await expect.poll(() => page.evaluate(() => window.RadarNavigationHistory.currentRoute(window).view))
      .toBe('prontuario');

    await page.getByRole('button', { name: 'Voltar às Pendências' }).click();
    await expect(page).toHaveURL(new RegExp(`/pendencias\\?escola=${seeded.schoolId}$`));
    await expect.poll(() => page.evaluate(() => (
      window.RadarNavigationHistory.currentRoute(window).filters.escola || ''
    ))).toBe(seeded.schoolId);
    await expect(page.locator('#pendency-filter-school')).toHaveValue(seeded.schoolId);
    await expect(search).toHaveValue(seeded.schoolDesignation);
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toBeVisible();
    await expect(visibleRecord(page, 'task9-open')).toHaveClass(/pendency-row-selected/);
  });

  test('permite percorrer as abas pelo teclado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedFourPendencyStates(page);

    const openTab = page.getByRole('tab', { name: /^Abertas\b/ });
    const awaitingTab = page.getByRole('tab', { name: /^Aguardando reanálise\b/ });
    await openTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(awaitingTab).toHaveAttribute('aria-selected', 'true');
    await expect(awaitingTab).toBeFocused();
  });

  test('substitui a tabela por cartões e abre o detalhe em tela inteira no celular', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'Cenário exclusivo dos projetos mobile.');

    await page.goto('/');
    await seedFourPendencyStates(page);

    const card = visibleRecord(page, 'task9-open');
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('display', 'grid');
    await card.getByRole('button', { name: 'Ver detalhes' }).click();

    const drawer = page.getByRole('dialog', { name: 'Detalhes da pendência' });
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.width - (await page.evaluate(() => innerWidth)))).toBeLessThanOrEqual(2);
  });
});

for (const width of [1280, 1440, 1920]) {
  test('tabela preenchida preserva largura e rolagem acessível em ' + width + 'px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Layout de tabela exclusivo do desktop.');
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const seeded = await seedFourPendencyStates(page);
    // Conteúdo populado e nome longo: a grade não pode despedaçar palavras.
    await page.evaluate(schoolId => {
      const school = escolas.find(record => record.id === schoolId);
      if (!school) throw new Error('Escola do teste visual não encontrada');
      school.denominação = 'Escola Municipal Professora Maria das Graças de Oliveira e Albuquerque';
      rebuildOperationalIndexes();
      window.RadarTask9PendencyPage.render();
    }, seeded.schoolId);

    const scroller = page.locator('.pendency-tab-panel.active .pendency-desktop-list.table-responsive');
    const table = scroller.locator('table.pendency-operations-table');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table).toContainText('Escola Municipal Professora Maria das Graças de Oliveira e Albuquerque');
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await expect(scroller).toHaveAttribute('role', 'region');
    await expect(scroller).toHaveAttribute('aria-label', /Tabela de pendências/);

    const before = await scroller.evaluate(node => ({
      viewport: node.clientWidth,
      content: node.scrollWidth,
      minTable: node.querySelector('table').getBoundingClientRect().width,
      scroll: getComputedStyle(node).overflowX,
      headerWrap: getComputedStyle(node.querySelector('th')).overflowWrap
    }));
    expect(before.scroll).toBe('auto');
    expect(before.minTable).toBeGreaterThanOrEqual(1319);
    expect(before.headerWrap).toBe('normal');

    if (before.viewport < before.minTable) {
      expect(before.content).toBeGreaterThan(before.viewport);
      await scroller.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => scroller.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
      await scroller.evaluate(node => { node.scrollLeft = 0; });
    }

    const tableShot = testInfo.outputPath('pendencias-populadas-tabela-fechada.png');
    await page.screenshot({ path: tableShot, animations: 'disabled' });
    await testInfo.attach('pendencias-populadas-tabela-fechada', { path: tableShot, contentType: 'image/png' });

    const record = visibleRecord(page, 'task9-open');
    await record.getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.locator('#pendency-detail-drawer');
    await expect(drawer).toHaveAttribute('role', 'complementary');
    await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
    const background = page.locator('.pendency-drawer-layer.is-desktop .pendency-drawer-backdrop');
    const veil = await background.evaluate(el => ({
      display: getComputedStyle(el).display,
      pointerEvents: getComputedStyle(el).pointerEvents,
      filter: getComputedStyle(el).backdropFilter,
      tabIndex: el.getAttribute('tabindex'),
      ariaHidden: el.getAttribute('aria-hidden')
    }));
    expect(veil.display).not.toBe('none');
    expect(veil.pointerEvents).toBe('none');
    expect(veil.filter).toContain('blur(');
    expect(veil.tabIndex).toBe('-1');
    expect(veil.ariaHidden).toBe('true');

    // Complementary desktop drawer: a página continua alcançável por clique e teclado.
    const search = page.getByRole('searchbox', { name: 'Buscar pendências' });
    await search.click();
    await expect(search).toBeFocused();
    await expect(drawer).toBeVisible();

    const shot = testInfo.outputPath('pendencias-com-registros-e-drawer.png');
    await page.screenshot({ path: shot, animations: 'disabled' });
    await testInfo.attach('pendencias-com-registros-e-drawer', { path: shot, contentType: 'image/png' });
    if (width === 1440) {
      await page.locator('#theme-toggle-btn').click();
      await expect(drawer).toBeVisible();
      const darkShot = testInfo.outputPath('pendencias-populadas-dark.png');
      await page.screenshot({ path: darkShot, animations: 'disabled' });
      await testInfo.attach('pendencias-populadas-dark', { path: darkShot, contentType: 'image/png' });
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
}

for (const width of [1440, 1280, 1920, 390]) {
  test(`detalhe legível e opaco em ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await seedFourPendencyStates(page);
    await page.getByRole('tab', { name: /^Aguardando reanálise/ }).click();
    await visibleRecord(page, 'task9-awaiting').getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.locator('#pendency-detail-drawer');
    await expect(drawer).toBeVisible();
    await drawer.locator('.is-attempts').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('drawer.png') });
    const geometry = await drawer.evaluate(el => {
      const attempt = el.querySelector('.pendency-attempt-list > li');
      const box = attempt.getBoundingClientRect();
      const body = el.querySelector('.pendency-drawer-body');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(el).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      const texts = [...attempt.querySelectorAll('dt, dd, p, strong, .badge')].map(child => {
        const range = document.createRange();
        range.selectNodeContents(child);
        return { text: child.textContent, bounds: range.getBoundingClientRect() };
      });
      const overlaps = texts.flatMap((a, i) => texts.slice(i + 1).filter(b => (
        Math.min(a.bounds.right, b.bounds.right) - Math.max(a.bounds.left, b.bounds.left) > 1
        && Math.min(a.bounds.bottom, b.bounds.bottom) - Math.max(a.bounds.top, b.bounds.top) > 1
      )).map(b => [a.text, b.text]));
      return {
        alpha: ctx.getImageData(0, 0, 1, 1).data[3],
        overlaps,
        overflow: body.scrollWidth - body.clientWidth,
        escaped: [...attempt.querySelectorAll('dt, dd, p, strong, .badge')].filter(child => {
          const range = document.createRange();
          range.selectNodeContents(child);
          const r = range.getBoundingClientRect();
          return r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom;
        }).map(child => child.textContent)
      };
    });
    expect.soft(geometry.alpha).toBe(255);
    expect.soft(geometry.overlaps).toEqual([]);
    expect.soft(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.escaped).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
}

for (const width of [1280, 1440, 1920, 390]) {
  test('ficha editorial prioriza a próxima ação e contém as operações em ' + width + 'px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await seedFourPendencyStates(page);
    await page.getByRole('tab', { name: /^Aguardando reanálise/ }).click();
    await visibleRecord(page, 'task9-awaiting').getByRole('button', { name: 'Ver detalhes' }).click();

    const drawer = page.locator('#pendency-detail-drawer');
    const nextStep = drawer.locator('.pendency-drawer-section.is-next-step');
    await expect(nextStep).toBeVisible();
    await expect(nextStep.getByRole('heading', { name: 'Próxima ação' })).toBeVisible();
    await expect(nextStep.locator('.pendency-next-action')).toContainText('Conferir o novo arquivo');

    const layout = await drawer.evaluate(el => {
      const header = el.querySelector('.pendency-drawer-header').getBoundingClientRect();
      const action = el.querySelector('.is-next-step').getBoundingClientRect();
      const body = el.querySelector('.pendency-drawer-body');
      const footer = el.querySelector('.pendency-drawer-footer');
      const sections = [...body.querySelectorAll(':scope > .pendency-drawer-section:not(.is-next-step)')];
      const buttons = [...footer.querySelectorAll('.pendency-row-actions .btn')];
      const buttonRects = buttons.map(button => button.getBoundingClientRect());
      const collisions = buttonRects.flatMap((a, i) => buttonRects.slice(i + 1)
        .filter(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
      return {
        bodyDisplay: getComputedStyle(body).display,
        sectionRadii: sections.map(section => getComputedStyle(section).borderTopLeftRadius),
        actionBelowHeader: action.top >= header.bottom - 1,
        footerHeight: footer.getBoundingClientRect().height,
        collisions: collisions.length,
        bodyOverflow: body.scrollWidth - body.clientWidth
      };
    });

    expect(layout.bodyDisplay).toBe('block');
    expect(layout.sectionRadii).toEqual(layout.sectionRadii.map(() => '0px'));
    expect(layout.actionBelowHeader).toBe(true);
    expect(layout.footerHeight).toBeLessThan(145);
    expect(layout.collisions).toBe(0);
    expect(layout.bodyOverflow).toBeLessThanOrEqual(1);

    if (width > 900) {
      await expect(page.locator('.pendency-desktop-list table.pendency-operations-table thead th').nth(1))
        .toHaveCSS('white-space', 'nowrap');
    }
    const topCapture = testInfo.outputPath('drawer-editorial-top.png');
    await page.screenshot({ path: topCapture, animations: 'disabled' });
    await testInfo.attach('drawer-editorial-top', { path: topCapture, contentType: 'image/png' });
    await drawer.locator('.is-attempts').scrollIntoViewIfNeeded();
    const historyCapture = testInfo.outputPath('drawer-editorial-history.png');
    await page.screenshot({ path: historyCapture, animations: 'disabled' });
    await testInfo.attach('drawer-editorial-history', { path: historyCapture, contentType: 'image/png' });
    await expect(drawer.locator('.pendency-attempt-list > li')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
}

test('metadados ficam no head e detalhes cancelados permanecem legíveis no tema escuro', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 768 });
  await page.goto('/');
  await expect(page).toHaveTitle('RADAR PDDE - Registro de Acompanhamento das Demandas, Análises e Regularizações');
  await expect(page.locator('head > meta[name="description"]')).toHaveAttribute('content', /Sistema institucional RADAR PDDE/);
  await seedFourPendencyStates(page);
  await page.evaluate(() => {
    const cancelled = pendencias.find(item => item.id === 'task9-cancelled');
    cancelled.cancelamento = {
      ...cancelled.cancelamento,
      tipo: 'retificacao_avaliacao',
      avaliacaoAnterior: 'Incorreto',
      avaliacaoNova: 'Correto',
      usuario: 'Controladora de teste',
      dataHora: '2026-07-07T12:00:00.000Z',
      justificativa: 'Avaliação corrigida após conferência do documento e do histórico preservado.'
    };
    rebuildOperationalIndexes();
    persist();
  });
  await page.locator('#theme-toggle-btn').click();
  await page.getByRole('tab', { name: /^Canceladas/ }).click();
  await visibleRecord(page, 'task9-cancelled').getByRole('button', { name: 'Ver detalhes' }).click();
  const drawer = page.locator('#pendency-detail-drawer');
  const summary = drawer.locator('.is-evaluation-retification-summary');
  await expect(drawer.locator('.is-next-step')).toHaveCount(0);
  await expect(summary).toContainText('Retificação da avaliação técnica');
  await summary.scrollIntoViewIfNeeded();
  const darkCapture = testInfo.outputPath('cancelled-dark.png');
  await page.screenshot({ path: darkCapture, animations: 'disabled' });
  await testInfo.attach('drawer-cancelled-dark', { path: darkCapture, contentType: 'image/png' });
  expect(await drawer.locator('.pendency-drawer-body').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await drawer.locator('.pendency-drawer-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(drawer.getByRole('heading', { name: 'Linha do tempo' })).toBeVisible();
  await drawer.locator('.btn-close').click();
  await expect(drawer).toBeHidden();
});
