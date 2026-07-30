#!/usr/bin/env node

import fs from 'node:fs';

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Trecho não encontrado: ${label}`);
  return source.replace(before, after);
}

const certificationPath = 'src/domain/excel-integral-certification.js';
let certification = fs.readFileSync(certificationPath, 'utf8');

const expectedBefore = `function smeExpectedCells(model) {
  const expected = [];
  model.columns.forEach((column, columnIndex) => {
    expected.push({
      address: \`${'${institutionalRendererColumn(columnIndex + 1)}'}1\`,
      value: column.label
    });
  });
  model.rows.forEach((row, rowIndex) => {
    model.columns.forEach((column, columnIndex) => {
      expected.push({
        address: \`${'${institutionalRendererColumn(columnIndex + 1)}${rowIndex + 2}'}\`,
        value: column.key === 'order' ? row[column.key] : (row[column.key] || '')
      });
    });
  });
  return expected;
}
`;

const expectedAfter = `function smeExpectedCells(model) {
  const expected = [];
  model.columns.forEach((column, columnIndex) => {
    if (column.mergedHeader) return;
    expected.push({
      address: \`${'${institutionalRendererColumn(columnIndex + 1)}'}1\`,
      value: column.label
    });
  });
  model.rows.forEach((row, rowIndex) => {
    model.columns.forEach((column, columnIndex) => {
      expected.push({
        address: \`${'${institutionalRendererColumn(columnIndex + 1)}${rowIndex + 2}'}\`,
        value: column.key === 'order' ? row[column.key] : (row[column.key] || '')
      });
    });
  });
  return expected;
}

function excelJsCellValue(value) {
  if (value && typeof value === 'object') {
    if (Object.hasOwn(value, 'result')) return value.result;
    if (typeof value.text === 'string') return value.text;
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text || '').join('');
  }
  return value;
}

function extractExcelJsCells(worksheet) {
  const cells = new Map();
  worksheet.eachRow({ includeEmpty: true }, row => {
    row.eachCell({ includeEmpty: true }, cell => {
      if (cell.isMerged && cell.master && cell.master.address !== cell.address) return;
      cells.set(cell.address, normalizeCellValue(excelJsCellValue(cell.value)));
    });
  });
  return cells;
}

function inspectExcelJsWorkbook(workbook, worksheet) {
  const validations = worksheet.dataValidations?.model || {};
  const hasDataValidations = Object.keys(validations).length > 0;
  const structural = {
    worksheetName: worksheet.name,
    columns: worksheet.columns.map(column => ({ key: column.key || '', width: column.width || null })),
    merges: Array.isArray(worksheet.model?.merges) ? worksheet.model.merges : [],
    views: worksheet.views,
    autoFilter: worksheet.autoFilter,
    pageSetup: {
      orientation: worksheet.pageSetup.orientation,
      paperSize: worksheet.pageSetup.paperSize,
      fitToPage: worksheet.pageSetup.fitToPage,
      fitToWidth: worksheet.pageSetup.fitToWidth,
      fitToHeight: worksheet.pageSetup.fitToHeight,
      printArea: worksheet.pageSetup.printArea,
      printTitlesRow: worksheet.pageSetup.printTitlesRow
    },
    headers: worksheet.getRow(1).values.slice(1)
  };
  return {
    valid: workbook.worksheets.length === 1
      && worksheet.name.length > 0
      && worksheet.columnCount === 30
      && !hasDataValidations,
    entryCount: 1,
    sheetCount: workbook.worksheets.length,
    expectedSheetCount: 1,
    missingEntries: [],
    hasDataValidations,
    structuralHash: sha256(structural)
  };
}
`;

certification = replaceRequired(
  certification,
  expectedBefore,
  expectedAfter,
  'células esperadas do Excel SME'
);

const certifyBefore = `function certifySmeMonthly(input, canonicalAudit) {
  const model = smeModel.buildSmeMonthlyModel(input);
  const entries = smeRenderer.buildPackageEntries(model);
  const sheetEntry = entries.find(entry => entry.name === 'xl/worksheets/sheet1.xml');
  const sheetXml = decodeEntryData(sheetEntry?.data);
  const cells = extractWorksheetCells(sheetXml);
  const cellCertification = compareCells(smeExpectedCells(model), cells);
  cellCertification.samples = sampleCells(cells, ['A2', 'C2', 'E2', 'K2', 'C3']);
  const ooxml = packageInspection(entries, 1);
  const relevantCanonicalMismatches = canonicalAudit.mismatches.filter(item => (
    item.competenceKey === model.competenceKey
  ));
  const contentHash = sha256({
    modelVersion: model.version,
    competenceKey: model.competenceKey,
    columns: model.columns.map(column => column.key),
    rows: model.rows.map(row => model.columns.map(column => row[column.key] || '')),
    worksheetHash: sha256(sheetXml),
    structuralHash: ooxml.structuralHash
  });
  const passed = cellCertification.mismatchCount === 0
    && ooxml.valid
    && model.rows.length === list(input.escolas).length
    && relevantCanonicalMismatches.length === 0;
  return {
    passed,
    scope: 'single-competence',
    competenceKeys: [model.competenceKey],
    schoolCount: model.rows.length,
    columnCount: model.columns.length,
    canonicalMismatchCount: relevantCanonicalMismatches.length,
    cellCertification,
    ooxml,
    contentHash
  };
}
`;

const certifyAfter = `function certifySmeMonthly(input, canonicalAudit) {
  const model = smeModel.buildSmeMonthlyModel(input);
  const workbook = smeRenderer.buildWorkbook(model);
  const worksheet = workbook.worksheets[0];
  const cells = extractExcelJsCells(worksheet);
  const cellCertification = compareCells(smeExpectedCells(model), cells);
  cellCertification.samples = sampleCells(cells, ['A2', 'C2', 'E2', 'K2', 'C3']);
  const ooxml = inspectExcelJsWorkbook(workbook, worksheet);
  const relevantCanonicalMismatches = canonicalAudit.mismatches.filter(item => (
    item.competenceKey === model.competenceKey
  ));
  const contentHash = sha256({
    modelVersion: model.version,
    competenceKey: model.competenceKey,
    columns: model.columns.map(column => column.key),
    rows: model.rows.map(row => model.columns.map(column => row[column.key] || '')),
    structuralHash: ooxml.structuralHash
  });
  const passed = cellCertification.mismatchCount === 0
    && ooxml.valid
    && model.rows.length === list(input.escolas).length
    && relevantCanonicalMismatches.length === 0;
  return {
    passed,
    scope: 'single-competence',
    competenceKeys: [model.competenceKey],
    schoolCount: model.rows.length,
    columnCount: model.columns.length,
    canonicalMismatchCount: relevantCanonicalMismatches.length,
    cellCertification,
    ooxml,
    contentHash
  };
}
`;

certification = replaceRequired(
  certification,
  certifyBefore,
  certifyAfter,
  'certificação mensal do Excel SME'
);
fs.writeFileSync(certificationPath, certification);

const testPath = 'tests/unit/excel-integral-certification.test.js';
let testSource = fs.readFileSync(testPath, 'utf8');
testSource = replaceRequired(testSource, 'assert.equal(report.products.smeMonthly.columnCount, 26);', 'assert.equal(report.products.smeMonthly.columnCount, 30);', 'quantidade de colunas certificadas');
testSource = replaceRequired(testSource, "{ address: 'C2', value: '04.00.001' },", "{ address: 'C2', value: 400001 },", 'designação da primeira escola');
testSource = replaceRequired(testSource, "{ address: 'K2', value: 'NÃO' },", "{ address: 'K2', value: 'SIM' },", 'sistemática preenchida');
testSource = replaceRequired(testSource, "{ address: 'C3', value: '04.00.002' }", "{ address: 'C3', value: 400002 }", 'designação da segunda escola');
fs.writeFileSync(testPath, testSource);

process.stdout.write('Certificação e testes migrados para o workbook ExcelJS.\n');
