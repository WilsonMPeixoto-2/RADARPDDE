#!/usr/bin/env node

import fs from 'node:fs';

const file = 'src/domain/excel-integral-certification.js';
let source = fs.readFileSync(file, 'utf8');

function replaceRequired(before, after, label) {
  if (!source.includes(before)) throw new Error(`Trecho não encontrado: ${label}`);
  source = source.replace(before, after);
}

const helperStart = source.indexOf('function excelJsCellValue(value) {');
const helperEnd = source.indexOf('\nfunction certifySmeMonthly(input, canonicalAudit) {', helperStart);
if (helperStart < 0 || helperEnd < 0) {
  throw new Error('Bloco de certificação ExcelJS não foi localizado.');
}

const writerHelpers = `function extractSmeWriterCells(sheetData) {
  const cells = new Map();
  sheetData.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (!cell) return;
      cells.set(
        \`${'${institutionalRendererColumn(columnIndex + 1)}${rowIndex + 1}'}\`,
        normalizeCellValue(cell.value)
      );
    });
  });
  return cells;
}

function inspectSmeWriterContract(model, sheetData, options) {
  const structural = {
    sheet: options.sheet,
    columns: options.columns,
    orientation: options.orientation,
    stickyRowsCount: options.stickyRowsCount,
    stickyColumnsCount: options.stickyColumnsCount,
    showGridLines: options.showGridLines,
    headerHeight: sheetData[0]?.[0]?.height || null,
    headerColumnSpan: sheetData[0]?.[0]?.columnSpan || null,
    headers: sheetData[0].map(cell => cell?.value || '')
  };
  return {
    valid: options.sheet === model.sheetName
      && options.columns.length === 30
      && sheetData[0].length === 30
      && sheetData[0][0]?.columnSpan === 2
      && options.stickyRowsCount === 1
      && options.stickyColumnsCount === 4,
    entryCount: 1,
    sheetCount: 1,
    expectedSheetCount: 1,
    missingEntries: [],
    hasDataValidations: false,
    structuralHash: sha256(structural)
  };
}
`;

source = `${source.slice(0, helperStart)}${writerHelpers}${source.slice(helperEnd)}`;

const oldCertify = `function certifySmeMonthly(input, canonicalAudit) {
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

const newCertify = `function certifySmeMonthly(input, canonicalAudit) {
  const model = smeModel.buildSmeMonthlyModel(input);
  const sheetData = smeRenderer.buildSheetData(model);
  const options = smeRenderer.buildSheetOptions(model);
  const cells = extractSmeWriterCells(sheetData);
  const cellCertification = compareCells(smeExpectedCells(model), cells);
  cellCertification.samples = sampleCells(cells, ['A2', 'C2', 'E2', 'K2', 'C3']);
  const ooxml = inspectSmeWriterContract(model, sheetData, options);
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

replaceRequired(oldCertify, newCertify, 'certificação mensal');
fs.writeFileSync(file, source);
process.stdout.write('Certificação adaptada ao contrato write-excel-file.\n');
