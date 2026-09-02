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

    const search = page.getByRole('searchbox', { name: 'Buscar pendências' });
    await search.fill(seeded.schoolDesignation);
    await visibleRecord(page, 'task9-open').getByRole('button', { name: 'Ver detalhes' }).click();

    const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
    await drawer.getByRole('button', { name: 'Abrir no Prontuário' }).click();

    await expect(page.getByRole('button', { name: 'Voltar às Pendências' })).toBeVisible();
    await expect(page.locator('#main-container')).toContainText(seeded.schoolName);

    await page.getByRole('button', { name: 'Voltar às Pendências' }).click();
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
