const fs = require('node:fs/promises');
const ExcelJS = require('exceljs');
const { test, expect } = require('@playwright/test');
const modelApi = require('../../src/domain/excel-sme-export-model.js');

async function openDownloadedWorkbook(download) {
  expect(await download.failure()).toBeNull();
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const bytes = await fs.readFile(downloadPath);
  expect(bytes.length).toBeGreaterThan(1000);
  expect(Array.from(bytes.subarray(0, 4))).toEqual([0x50, 0x4B, 0x03, 0x04]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  return { bytes, workbook, worksheet: workbook.worksheets[0] };
}

async function selectSmeJuly(page) {
  await page.goto('/');
  await page.evaluate(() => switchProfile('sme'));
  await page.evaluate(() => changeSMEMonth('2026-07'));
  return page.getByRole('button', {
    name: 'Gerar relatório no modelo Excel da SME'
  });
}

test.describe('ações institucionais de geração do Excel', () => {
  test('preserva o Excel atual e adiciona Excel SME mensal e CSV como alternativas independentes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(() => switchProfile('sme'));

    const excelButton = page.getByRole('button', {
      name: 'Gerar relatório Excel completo em formato XLSX'
    });
    await expect(excelButton).toBeVisible();
    await expect(excelButton).toContainText('Gerar relatório Excel (.xlsx)');
    await expect(excelButton).toHaveClass(/btn-primary/);

    const smeButton = page.getByRole('button', {
      name: 'Gerar relatório no modelo Excel da SME'
    });
    await expect(smeButton).toBeVisible();
    await expect(smeButton).toContainText('Excel SME');
    await expect(smeButton).toHaveClass(/btn-secondary/);

    await page.evaluate(() => {
      const button = document.querySelector('[data-radar-sme-export="true"]');
      RadarExcelExportIntegration.updateSmeButtonState(button, 'TODAS');
    });
    await expect(smeButton).toBeDisabled();
    await expect(smeButton).toHaveAttribute('title', /Selecione uma competência mensal/);

    await page.evaluate(() => {
      const button = document.querySelector('[data-radar-sme-export="true"]');
      RadarExcelExportIntegration.updateSmeButtonState(button, '2026-07');
    });
    await expect(smeButton).toBeEnabled();
    await expect(smeButton).toHaveAttribute('title', /07-2026/);

    const csvButton = page.getByRole('button', { name: 'Baixar CSV legado' });
    await expect(csvButton).toBeVisible();
    await expect(csvButton).toHaveClass(/btn-secondary/);

    await expect.poll(() => page.evaluate(() => Boolean(
      window.RadarExcelXlsxRenderer?.createZip
      && window.RadarExcelSmeMonthlyRenderer?.renderWorkbook
    ))).toBe(true);
  });

  test('gera, baixa e valida semanticamente o arquivo Excel SME pelo botão real', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    test.setTimeout(90_000);

    const smeButton = await selectSmeJuly(page);
    await expect(smeButton).toBeVisible();
    await expect(smeButton).toBeEnabled();
    const expectedSchoolCount = await page.evaluate(() => escolas.length);

    const downloadPromise = page.waitForEvent('download');
    await smeButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('RADAR_PDDE_EXCEL_SME_07-2026.xlsx');
    const { workbook, worksheet } = await openDownloadedWorkbook(download);

    expect(workbook.worksheets).toHaveLength(1);
    expect(worksheet.name).toBe('JULHO');
    expect(worksheet.columnCount).toBe(30);
    expect(worksheet.rowCount).toBe(expectedSchoolCount + 1);

    const headers = modelApi.ORIGINAL_HEADER_LABELS.map((expected, index) => (
      expected === '' ? '' : (worksheet.getRow(1).getCell(index + 1).value || '')
    ));
    expect(headers).toEqual(modelApi.ORIGINAL_HEADER_LABELS);
    expect(worksheet.getCell('A1').isMerged).toBe(true);
    expect(worksheet.getCell('B1').isMerged).toBe(true);
    expect(worksheet.autoFilter).toBe(`A1:AD${expectedSchoolCount + 1}`);
    expect(worksheet.views[0]).toMatchObject({
      state: 'frozen',
      xSplit: 4,
      ySplit: 1,
      topLeftCell: 'E2'
    });

    const designations = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const designation = String(worksheet.getCell(rowNumber, 3).value || '').replace(/\D/g, '');
      expect(designation).not.toBe('');
      expect(String(worksheet.getCell(rowNumber, 4).value || '').trim()).not.toBe('');
      designations.push(designation);
    }
    expect(new Set(designations).size).toBe(designations.length);
  });

  test('repete o template após 404 inicial e conclui o download sem recarregar a página', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    test.setTimeout(90_000);

    let templateRequests = 0;
    await page.route('**/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx*', async route => {
      templateRequests += 1;
      if (templateRequests === 1) {
        await route.fulfill({ status: 404, body: 'Not Found' });
        return;
      }
      await route.continue();
    });

    const smeButton = await selectSmeJuly(page);
    const downloadPromise = page.waitForEvent('download');
    await smeButton.click();
    const download = await downloadPromise;
    const { worksheet } = await openDownloadedWorkbook(download);

    expect(templateRequests).toBe(2);
    expect(worksheet.name).toBe('JULHO');
    await expect(smeButton).toBeEnabled();
  });

  test('recupera falha inicial do ExcelJS e permite nova tentativa sem refresh', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    test.setTimeout(90_000);

    let excelJsRequests = 0;
    await page.route('**/vendor/exceljs.min.js*', async route => {
      excelJsRequests += 1;
      if (excelJsRequests === 1) {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    const smeButton = await selectSmeJuly(page);
    const dialogPromise = page.waitForEvent('dialog');
    const firstClick = smeButton.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/Não foi possível carregar o motor ExcelJS/);
    await dialog.accept();
    await firstClick;
    await expect(smeButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await smeButton.click();
    const download = await downloadPromise;
    const { worksheet } = await openDownloadedWorkbook(download);

    expect(excelJsRequests).toBe(2);
    expect(worksheet.name).toBe('JULHO');
  });

  test('rejeita HTML no lugar do template, reabilita o botão e aceita nova tentativa', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    test.setTimeout(90_000);

    let invalidTemplate = true;
    let invalidRequests = 0;
    await page.route('**/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx*', async route => {
      if (invalidTemplate) {
        invalidRequests += 1;
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: '<html><body>fallback incorreto</body></html>'
        });
        return;
      }
      await route.continue();
    });

    const smeButton = await selectSmeJuly(page);
    const dialogPromise = page.waitForEvent('dialog');
    const firstClick = smeButton.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/não é um arquivo XLSX válido/);
    await dialog.accept();
    await firstClick;
    expect(invalidRequests).toBe(2);
    await expect(smeButton).toBeEnabled();

    invalidTemplate = false;
    const downloadPromise = page.waitForEvent('download');
    await smeButton.click();
    const download = await downloadPromise;
    const { worksheet } = await openDownloadedWorkbook(download);

    expect(worksheet.name).toBe('JULHO');
    await expect(smeButton).toBeEnabled();
  });
});
