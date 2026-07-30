'use strict';

const crypto = require('node:crypto');

const flow = require('./fluxo-operacional.js');
const institutionalModel = require('./excel-export-model.js');
const institutionalPlan = require('./excel-workbook-plan.js');
const institutionalRenderer = require('./excel-xlsx-renderer.js');
const smeModel = require('./excel-sme-export-model.js');
const smeRenderer = require('./excel-sme-monthly-renderer.js');

const VERSION = '1.0.0';
const DEFAULT_GENERATED_AT = '1970-01-01T00:00:00.000Z';

function text(value) {
  return value == null ? '' : String(value).trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value) {
  const input = value instanceof Uint8Array || Buffer.isBuffer(value)
    ? value
    : Buffer.from(typeof value === 'string' ? value : stableStringify(value), 'utf8');
  return crypto.createHash('sha256').update(input).digest('hex');
}

function decodeEntryData(value) {
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Buffer.from(value).toString('utf8');
  }
  return String(value == null ? '' : value);
}

function xmlUnescape(value) {
  return String(value == null ? '' : value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractWorksheetCells(xml) {
  const cells = new Map();
  const expression = /<c\s+([^>]*\br="([A-Z]+\d+)"[^>]*)>([\s\S]*?)<\/c>/g;
  let match;
  while ((match = expression.exec(String(xml || ''))) !== null) {
    const attributes = match[1];
    const address = match[2];
    const body = match[3];
    const inline = /\bt="inlineStr"/.test(attributes);
    if (inline) {
      const textMatch = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(body);
      cells.set(address, xmlUnescape(textMatch ? textMatch[1] : ''));
      continue;
    }
    const valueMatch = /<v>([\s\S]*?)<\/v>/.exec(body);
    const raw = xmlUnescape(valueMatch ? valueMatch[1] : '');
    const number = Number(raw);
    cells.set(address, raw !== '' && Number.isFinite(number) ? number : raw);
  }
  return cells;
}

function normalizeCellValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return value == null ? '' : String(value);
}

function compareCells(expected, actualCells) {
  const mismatches = [];
  expected.forEach(item => {
    const expectedValue = normalizeCellValue(item.value);
    const actualValue = normalizeCellValue(actualCells.get(item.address));
    if (!Object.is(expectedValue, actualValue)) {
      mismatches.push({
        address: item.address,
        expected: expectedValue,
        actual: actualValue,
        code: actualCells.has(item.address) ? 'CELL_VALUE_MISMATCH' : 'CELL_MISSING'
      });
    }
  });
  return {
    checkedCellCount: expected.length,
    actualCellCount: actualCells.size,
    mismatchCount: mismatches.length,
    mismatches
  };
}

function packageInspection(entries, expectedSheetCount) {
  const decoded = entries.map(entry => ({
    name: entry.name,
    data: decodeEntryData(entry.data)
  }));
  const names = decoded.map(entry => entry.name).sort();
  const worksheetEntries = names.filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  const requiredNames = [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml'
  ];
  const missingEntries = requiredNames.filter(name => !names.includes(name));
  const hasDataValidations = decoded.some(entry => /<dataValidations\b/i.test(entry.data));
  const structuralEntries = decoded
    .filter(entry => entry.name !== 'docProps/core.xml')
    .sort((left, right) => left.name.localeCompare(right.name, 'en'))
    .map(entry => ({ name: entry.name, hash: sha256(entry.data) }));
  return {
    valid: missingEntries.length === 0
      && worksheetEntries.length === expectedSheetCount
      && !hasDataValidations,
    entryCount: names.length,
    sheetCount: worksheetEntries.length,
    expectedSheetCount,
    missingEntries,
    hasDataValidations,
    structuralHash: sha256(structuralEntries)
  };
}

function splitCompoundKey(compoundKey) {
  const candidate = text(compoundKey);
  const separator = candidate.indexOf('_');
  return separator < 0
    ? { competenceKey: candidate, programId: '' }
    : {
        competenceKey: candidate.slice(0, separator),
        programId: candidate.slice(separator + 1)
      };
}

function pendenciesForContext(input, schoolId, competenceKey, programId) {
  return list(input.pendencias || input.pendencies).filter(pendency => {
    const pendencySchool = text(pendency?.escolaId || pendency?.school_id);
    const pendencyCompetence = text(
      pendency?.competenciaOrigem
      || pendency?.competencia
      || pendency?.competence_origin
      || pendency?.competence_id
    );
    const pendencyProgram = text(pendency?.programaId || pendency?.program_id);
    return pendencySchool === schoolId
      && (!pendencyCompetence || pendencyCompetence === competenceKey)
      && (!pendencyProgram || pendencyProgram === programId);
  });
}

function auditCanonicalResults(input) {
  const records = [];
  const mismatches = [];
  const verifications = input.verificacoes || input.verifications || {};
  Object.entries(verifications).forEach(([schoolId, byContext]) => {
    Object.entries(byContext || {}).forEach(([compoundKey, verification]) => {
      const stored = text(verification?.resultadoBonif || verification?.bonus_result).toLowerCase();
      if (!stored) return;
      const { competenceKey, programId } = splitCompoundKey(compoundKey);
      const evaluation = flow.evaluateMonthlyEvaluation({
        bonification: verification?.bonificacao || verification?.bonification || {},
        analysis: verification?.analise || verification?.analysis || {},
        pendencies: pendenciesForContext(input, schoolId, competenceKey, programId)
      });
      const canonical = text(evaluation.bonusResult).toLowerCase();
      const contextHash = sha256(`${schoolId}|${competenceKey}|${programId}`).slice(0, 16);
      records.push({ contextHash, competenceKey, programId, stored, canonical });
      if (stored !== canonical) {
        mismatches.push({
          code: 'STORED_RESULT_DIFFERS_FROM_CANONICAL',
          contextHash,
          competenceKey,
          programId,
          stored,
          canonical: canonical || null
        });
      }
    });
  });
  records.sort((left, right) => (
    left.competenceKey.localeCompare(right.competenceKey, 'en')
    || left.programId.localeCompare(right.programId, 'en')
    || left.contextHash.localeCompare(right.contextHash, 'en')
  ));
  mismatches.sort((left, right) => left.contextHash.localeCompare(right.contextHash, 'en'));
  return {
    auditedCount: records.length,
    mismatchCount: mismatches.length,
    mismatches,
    records
  };
}

function uniqueInOrder(values) {
  const seen = new Set();
  return values.filter(value => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function institutionalExpectedCells(plan) {
  const sheet = plan.sheets[0];
  const expected = [];
  sheet.table.rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      expected.push({
        address: `${institutionalRendererColumn(columnIndex + 1)}${sheet.table.firstDataRow + rowIndex}`,
        value
      });
    });
  });
  return expected;
}

function institutionalRendererColumn(number) {
  let current = number;
  let result = '';
  while (current > 0) {
    current -= 1;
    result = String.fromCharCode(65 + (current % 26)) + result;
    current = Math.floor(current / 26);
  }
  return result;
}

function sampleCells(cells, addresses) {
  return addresses.filter(address => cells.has(address)).map(address => ({
    address,
    value: cells.get(address)
  }));
}

function certifyInstitutional(input, canonicalAudit, generatedAt) {
  const model = institutionalModel.buildExportModel(input);
  const plan = institutionalPlan.createWorkbookPlan(model, {
    generatedAt,
    temporalScope: 'Todas as competências consolidadas',
    source: 'Massa sanitizada de certificação'
  });
  const entries = institutionalRenderer.buildPackageEntries(plan);
  const sheetEntry = entries.find(entry => entry.name === 'xl/worksheets/sheet1.xml');
  const sheetXml = decodeEntryData(sheetEntry?.data);
  const cells = extractWorksheetCells(sheetXml);
  const cellCertification = compareCells(institutionalExpectedCells(plan), cells);
  cellCertification.samples = sampleCells(cells, ['A9', 'D9', 'L9', 'D10', 'L11']);
  const ooxml = packageInspection(entries, 4);
  const competenceKeys = uniqueInOrder(model.base.rows.map(row => row.competenciaKey));
  const relevantCanonicalMismatches = canonicalAudit.mismatches;
  const passed = model.equivalence.equivalent
    && cellCertification.mismatchCount === 0
    && ooxml.valid
    && relevantCanonicalMismatches.length === 0;
  const contentHash = sha256({
    modelVersion: model.version,
    rows: model.base.rows.map(institutionalModel.toOriginalColumnValues),
    summary: model.optional.summary,
    worksheetHash: sha256(sheetXml),
    structuralHash: ooxml.structuralHash
  });
  return {
    passed,
    scope: 'historical-multi-competence',
    competenceKeys,
    logicalRowCount: model.base.rows.length,
    legacyEquivalence: {
      equivalent: model.equivalence.equivalent,
      expectedRowCount: model.equivalence.expectedRowCount,
      actualRowCount: model.equivalence.actualRowCount,
      mismatchCount: model.equivalence.mismatches.length
    },
    canonicalMismatchCount: relevantCanonicalMismatches.length,
    cellCertification,
    ooxml,
    contentHash
  };
}

function smeExpectedCells(model) {
  const expected = [];
  model.columns.forEach((column, columnIndex) => {
    if (column.mergedHeader) return;
    expected.push({
      address: `${institutionalRendererColumn(columnIndex + 1)}1`,
      value: column.label
    });
  });
  model.rows.forEach((row, rowIndex) => {
    model.columns.forEach((column, columnIndex) => {
      expected.push({
        address: `${institutionalRendererColumn(columnIndex + 1)}${rowIndex + 2}`,
        value: column.key === 'order' ? row[column.key] : (row[column.key] || '')
      });
    });
  });
  return expected;
}

function extractSmeWriterCells(sheetData) {
  const cells = new Map();
  sheetData.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (!cell) return;
      cells.set(
        `${institutionalRendererColumn(columnIndex + 1)}${rowIndex + 1}`,
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

function certifySmeMonthly(input, canonicalAudit) {
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

function publicCanonicalAudit(audit) {
  return {
    auditedCount: audit.auditedCount,
    mismatchCount: audit.mismatchCount,
    mismatches: audit.mismatches
  };
}

function certifyExcelProducts(input = {}) {
  const generatedAt = text(input.generatedAt) || DEFAULT_GENERATED_AT;
  const canonicalAudit = auditCanonicalResults(input);
  const institutional = certifyInstitutional(input, canonicalAudit, generatedAt);
  const smeMonthly = certifySmeMonthly(input, canonicalAudit);
  const report = {
    version: VERSION,
    generatedAt,
    passed: institutional.passed && smeMonthly.passed,
    canonicalResults: publicCanonicalAudit(canonicalAudit),
    products: {
      institutional,
      smeMonthly
    }
  };
  return Object.freeze({
    ...report,
    manifestHash: sha256(report)
  });
}

module.exports = Object.freeze({
  VERSION,
  auditCanonicalResults,
  certifyExcelProducts,
  extractWorksheetCells,
  packageInspection,
  sha256,
  stableStringify
});
