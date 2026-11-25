// Pure, narrow model-specific rules. No network, database, OCR, or RADAR writes.
import { createHash } from 'node:crypto';

export const RULE_VERSION = 'local-document-pilot/2';
const HASH = /^[a-f0-9]{64}$/;
const MONTHS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONEY_PATTERN = '(?:\\d{1,3}(?:\\.\\d{3})*|\\d+),\\d{2}';
const CNPJ = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const hashText = value => createHash('sha256').update(value, 'utf8').digest('hex');

export function dateBR(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
}

export function moneyBR(value) {
  if (!new RegExp(`^${MONEY_PATTERN}$`).test(value || '')) return null;
  const [whole, fraction] = value.replaceAll('.', '').split(',');
  const cents = BigInt(whole) * 100n + BigInt(fraction);
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}

export function verifyPdfIdentity(document, actualSha256) {
  if (!HASH.test(actualSha256 || '') || document.source.pdfSha256 !== actualSha256) {
    throw new Error('pdf-bytes-changed: extract again before reviewing');
  }
}

export function verifyManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !manifest.extractor?.version || !Array.isArray(manifest.documents)) {
    throw new Error('invalid-extraction-manifest');
  }
  const ids = new Set();
  for (const document of manifest.documents) {
    if (!document.id || ids.has(document.id) || !HASH.test(document.source?.pdfSha256 || '')
      || !document.source?.version || !Array.isArray(document.pages) || document.pages.length !== document.pageCount) {
      throw new Error('invalid-document-source');
    }
    ids.add(document.id);
    for (const [index, page] of document.pages.entries()) {
      if (page.page !== index + 1 || typeof page.text !== 'string' || hashText(page.text) !== page.textSha256) {
        throw new Error('page-text-integrity-mismatch');
      }
    }
    if (hashText(document.pages.map(page => page.text).join('\f')) !== document.textSha256) {
      throw new Error('document-text-integrity-mismatch');
    }
  }
}

function rows(document) {
  return document.pages.flatMap(page => page.text.split(/\r?\n/).map((text, index) => ({
    text, anchor: { documentId: document.id, page: page.page, line: index + 1, quote: text.trim() }
  }))).filter(row => row.text.trim());
}

function field(candidates = []) {
  const distinct = new Map();
  for (const candidate of candidates) {
    const key = JSON.stringify(candidate.value);
    const current = distinct.get(key) || { value: candidate.value, evidence: [] };
    current.evidence.push(candidate.anchor);
    distinct.set(key, current);
  }
  if (!distinct.size) return { status: 'not-found', value: null, evidence: [] };
  if (distinct.size > 1) return { status: 'ambiguous', value: null, candidates: [...distinct.values()] };
  return { status: 'extracted', ...[...distinct.values()][0] };
}

function classify(lines) {
  const all = normalize(lines.map(row => row.text).join('\n'));
  const matches = [];
  if (all.includes('termo de compromisso') && all.includes('bb gestao agil')) matches.push('bb-agil-commitment');
  if (all.includes('relacao de bens adquiridos ou produzidos')) matches.push('asset-list');
  if (all.includes('termo de doacao')) matches.push('donation-term');
  return matches.length === 1 ? matches[0] : matches.length ? 'ambiguous' : 'unrecognized';
}

function extractContext(lines, type) {
  const cnpjs = [];
  const institutions = [];
  const exercises = [];
  const programs = [];
  const periods = [];
  for (const row of lines) {
    for (const match of row.text.matchAll(CNPJ)) cnpjs.push({ value: match[0], anchor: row.anchor });
    if (type === 'bb-agil-commitment' || type === 'asset-list') {
      const institution = row.text.trim().match(/^(CEC\s+DO\/A\s+.+?)(?=\s+\d{2}\.\d{3}\.\d{3}\/|$)/i);
      if (institution) institutions.push({ value: institution[1].trim(), anchor: row.anchor });
    } else if (type === 'donation-term') {
      const institution = row.text.match(/pelo presente instrumento o\s+(CEC\s+DO\/A\s+.*?)\s+do\/a\s+/i);
      if (institution) institutions.push({ value: institution[1].trim(), anchor: row.anchor });
    }
    if (type === 'bb-agil-commitment') {
      const period = normalize(row.text).match(/periodo:\s*de\s+(\d{1,2})\s+a\s+(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/);
      if (period) {
        const month = MONTHS.indexOf(period[3]) + 1;
        const start = dateBR(`${period[1].padStart(2, '0')}/${String(month).padStart(2, '0')}/${period[4]}`);
        const end = dateBR(`${period[2].padStart(2, '0')}/${String(month).padStart(2, '0')}/${period[4]}`);
        periods.push({ value: { start, end, valid: Boolean(start && end && start <= end), raw: period[0] }, anchor: row.anchor });
        exercises.push({ value: Number(period[4]), anchor: row.anchor });
      }
    } else {
      const programYear = row.text.match(/PDDE\s*(?:\/\s*)?B[AÁ]SICO\s*(?:\/\s*)?(\d{4})/i);
      if (programYear) {
        programs.push({ value: 'PDDE BÁSICO', anchor: row.anchor });
        exercises.push({ value: Number(programYear[1]), anchor: row.anchor });
      }
    }
  }
  return { cnpj: field(cnpjs), institution: field(institutions), exercise: field(exercises), program: field(programs), period: field(periods) };
}

function extractTable(lines, type) {
  const items = [];
  const ignoredTemplateRows = [];
  const rejectedRows = [];
  const totals = [];
  if (!['asset-list', 'donation-term'].includes(type)) return { items, ignoredTemplateRows, rejectedRows, total: field() };
  const price = `(?<unit>${MONEY_PATTERN}|-)\\s+(?<total>${MONEY_PATTERN}|-)`;
  const rowPattern = type === 'asset-list'
    ? new RegExp(`^(?<documentType>[A-ZÀ-Ú]+|0)\\s+(?<invoiceNumber>\\S+)\\s+(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s+(?<quantity>\\d+)\\s+${price}$`, 'i')
    : new RegExp(`^(?<rowNumber>\\d+)\\s+(?<description>.+?)\\s+(?<quantity>\\d+)\\s+(?<invoiceNumber>\\S+)\\s+(?<date>\\d{2}/\\d{2}/\\d{4})\\s+${price}$`, 'i');
  const totalPattern = new RegExp(`^(?:\\d+\\s*[-–]\\s*TOTAL|TOTAL:)\\s+(${MONEY_PATTERN})$`, 'i');
  let inTable = false;
  for (const row of lines) {
    const plain = row.text.trim().replace(/\s+/g, ' ');
    const normalized = normalize(plain);
    if ((type === 'asset-list' && normalized.startsWith('bloco 2'))
      || (type === 'donation-term' && normalized.includes('descricao do bem'))) inTable = true;
    const total = plain.match(totalPattern);
    if (total) {
      totals.push({ value: moneyBR(total[1]), anchor: row.anchor });
      inTable = false;
      continue;
    }
    if (!inTable || !/\d{2}\/\d{2}\/\d{4}/.test(plain)) continue;
    const match = plain.match(rowPattern);
    if (!match) {
      rejectedRows.push({ reason: 'unrecognized-table-row', evidence: row.anchor });
      continue;
    }
    const values = match.groups;
    const placeholder = values.date === '00/01/1900' && values.invoiceNumber === '0'
      && values.description === '0' && values.quantity === '0' && values.unit === '-' && values.total === '-'
      && (!values.documentType || values.documentType === '0');
    if (placeholder) {
      ignoredTemplateRows.push({ reason: 'empty-template-row', invalidDate: values.date, evidence: row.anchor });
      continue;
    }
    const date = dateBR(values.date);
    const quantity = Number(values.quantity);
    const unitCents = moneyBR(values.unit);
    const totalCents = moneyBR(values.total);
    if (!date || !Number.isSafeInteger(quantity) || quantity <= 0 || unitCents == null || totalCents == null
      || !Number.isSafeInteger(quantity * unitCents)) {
      rejectedRows.push({ reason: !date ? 'invalid-calendar-date' : 'invalid-quantity-or-amount', evidence: row.anchor });
      continue;
    }
    items.push({
      row: items.length + 1, description: values.description, documentType: values.documentType || null,
      invoiceNumber: values.invoiceNumber, date, quantity, unitCents, totalCents,
      lineTotalConsistent: quantity * unitCents === totalCents, evidence: row.anchor
    });
  }
  const total = totals.some(candidate => candidate.value == null)
    ? { status: 'invalid', value: null, reason: 'amount-out-of-range', evidence: totals.map(candidate => candidate.anchor) }
    : field(totals);
  return { items, ignoredTemplateRows, rejectedRows, total };
}

function analyzeDocument(document, targetExercise) {
  const lines = rows(document);
  const type = classify(lines);
  const context = extractContext(lines, type);
  const table = extractTable(lines, type);
  const title = { 'bb-agil-commitment': 'termo de compromisso', 'asset-list': 'relacao de bens adquiridos ou produzidos', 'donation-term': 'termo de doacao' }[type];
  const exactItemTotal = table.items.reduce((sum, item) => sum + BigInt(item.totalCents), 0n);
  const sumItemTotalsCents = exactItemTotal <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(exactItemTotal) : null;
  const contentExercise = context.exercise.value;
  const exerciseMatch = Number.isInteger(contentExercise) ? contentExercise === targetExercise : null;
  const reasons = [];
  if (['ambiguous', 'unrecognized'].includes(type)) reasons.push('document-type-not-resolved');
  if (exerciseMatch === false) reasons.push('content-exercise-differs-from-target');
  if (exerciseMatch == null) reasons.push('content-exercise-not-resolved');
  if (context.institution.status !== 'extracted') reasons.push('institution-not-resolved');
  if (context.cnpj.status !== 'extracted') reasons.push('cnpj-not-resolved-no-inheritance');
  if (type === 'bb-agil-commitment' && context.period.value?.valid !== true) reasons.push('period-not-resolved-or-invalid');
  if (table.rejectedRows.length) reasons.push('table-rows-rejected');
  if (table.items.some(item => !item.lineTotalConsistent)) reasons.push('line-amount-mismatch');
  if (sumItemTotalsCents == null) reasons.push('item-total-sum-out-of-range');
  if (table.total.status === 'invalid') reasons.push('declared-total-out-of-range');
  if (table.total.value != null && sumItemTotalsCents != null && table.total.value !== sumItemTotalsCents) reasons.push('declared-total-differs-from-items');
  if (['asset-list', 'donation-term'].includes(type) && (!table.items.length || table.total.status !== 'extracted')) reasons.push('table-incomplete');
  return {
    id: document.id, type,
    classificationEvidence: title ? lines.filter(row => normalize(row.text).includes(title)).map(row => row.anchor) : [],
    context, ...table, sumItemTotalsCents,
    tableComplete: ['asset-list', 'donation-term'].includes(type) && table.items.length > 0
      && !table.rejectedRows.length && table.total.status === 'extracted' && sumItemTotalsCents != null,
    contextComparison: { targetExercise, contentExercise, exerciseMatch, metadataUsedForExercise: false },
    signature: {
      fields: structuredClone(document.signatureFieldsPresence || { present: false, count: 0 }),
      textLayerMarkersPresent: Boolean(document.signatureTextMarkersPresent),
      cryptographicValidation: 'not-performed', appearanceValidation: 'not-performed-by-parser'
    },
    reviewReasons: reasons, requiresHumanReview: true, administrativeConclusion: null,
    persistedToRadar: false, assetsCreated: 0
  };
}

function sameContext(left, right) {
  const a = left.context;
  const b = right.context;
  return a.institution.status === 'extracted' && b.institution.status === 'extracted'
    && normalize(a.institution.value) === normalize(b.institution.value)
    && a.exercise.value != null && a.exercise.value === b.exercise.value
    && a.program.value != null && a.program.value === b.program.value
    && ['not-found', 'extracted'].includes(a.cnpj.status) && ['not-found', 'extracted'].includes(b.cnpj.status)
    && !(a.cnpj.value && b.cnpj.value && a.cnpj.value !== b.cnpj.value);
}

function itemIdentity(item) {
  return JSON.stringify([item.invoiceNumber, item.date, normalize(item.description), item.quantity]);
}

export function comparePair(left, right) {
  const candidateRows = left.items.map(item => right.items.filter(other => itemIdentity(item) === itemIdentity(other)));
  const uses = new Map();
  candidateRows.forEach(candidates => candidates.forEach(item => uses.set(item.row, (uses.get(item.row) || 0) + 1)));
  const comparisons = left.items.map((item, index) => {
    const candidates = candidateRows[index];
    const ambiguous = candidates.length > 1 || candidates.some(other => uses.get(other.row) > 1);
    const outcome = ambiguous ? 'ambiguous' : !candidates.length ? 'no-supported-match'
      : candidates[0].unitCents !== item.unitCents || candidates[0].totalCents !== item.totalCents
        ? 'amount-mismatch' : 'matching-fields-for-review';
    return { leftRow: item.row, rightRows: candidates.map(other => other.row), outcome,
      evidence: [item.evidence, ...candidates.map(other => other.evidence)] };
  });
  const unpairedRightRows = right.items.filter(item => !uses.has(item.row)).map(item => item.row);
  const totalsMatch = left.total.value != null && right.total.value != null && left.total.value === right.total.value;
  const compatible = sameContext(left, right) && left.tableComplete && right.tableComplete && totalsMatch
    && left.total.value === left.sumItemTotalsCents && right.total.value === right.sumItemTotalsCents
    && left.items.every(item => item.lineTotalConsistent) && right.items.every(item => item.lineTotalConsistent)
    && comparisons.length > 0 && comparisons.every(item => item.outcome === 'matching-fields-for-review')
    && unpairedRightRows.length === 0;
  return {
    leftDocumentId: left.id, rightDocumentId: right.id,
    contextBasis: 'institution-program-exercise; absent CNPJ is not inherited',
    sameExtractedContext: sameContext(left, right), totalsMatch, comparisons, unpairedRightRows,
    targetExerciseMatch: left.contextComparison.exerciseMatch === true && right.contextComparison.exerciseMatch === true,
    outcome: compatible ? 'compatible-fields-for-review' : 'document-review-required',
    sourceItemRecords: left.items.length + right.items.length,
    matchedItemPairs: comparisons.filter(item => item.outcome === 'matching-fields-for-review').length,
    purchaseCount: null, assetsCreated: 0, requiresHumanReview: true, administrativeConclusion: null
  };
}

function sourceSnapshots(manifest) {
  return manifest.documents.map(document => ({
    id: document.id, pdfSha256: document.source.pdfSha256, textSha256: document.textSha256,
    sourceVersion: document.source.version, extractorVersion: manifest.extractor.version
  }));
}

export function analyzeManifest(manifest, { targetExercise } = {}) {
  verifyManifest(manifest);
  if (!Number.isInteger(targetExercise) || targetExercise < 2000 || targetExercise > 9999) throw new Error('Explicit target exercise required.');
  const documents = manifest.documents.map(document => analyzeDocument(document, targetExercise));
  const pairs = [];
  const candidateSets = documents.filter(document => document.type === 'asset-list').map(left => ({
    left, candidates: documents.filter(right => right.type === 'donation-term' && sameContext(left, right))
  }));
  const donationUses = new Map();
  for (const { candidates } of candidateSets) {
    for (const right of candidates) donationUses.set(right.id, (donationUses.get(right.id) || 0) + 1);
  }
  const pairSelections = candidateSets.map(({ left, candidates }) => {
    const ambiguous = candidates.length > 1 || candidates.some(right => donationUses.get(right.id) > 1);
    for (const right of candidates) {
      const pair = comparePair(left, right);
      pair.pairSelectionAmbiguous = candidates.length > 1 || donationUses.get(right.id) > 1;
      if (pair.pairSelectionAmbiguous) pair.outcome = 'ambiguous-document-pair';
      pairs.push(pair);
    }
    return { documentId: left.id, candidateDocumentIds: candidates.map(item => item.id),
      outcome: ambiguous ? 'ambiguous-document-pair' : candidates.length === 1 ? 'candidate-pair-for-review' : 'no-supported-pair',
      selectedAutomatically: false };
  });
  return {
    schemaVersion: 1, private: true, ruleVersion: RULE_VERSION, targetExercise,
    sourceSnapshots: sourceSnapshots(manifest), documents, pairSelections, pairs,
    requiresHumanReview: true, administrativeConclusion: null, persistedToRadar: false,
    automaticImports: 0, assetsCreated: 0, confidenceScore: null
  };
}

export function assertAnalysisCurrent(analysis, currentManifest) {
  verifyManifest(currentManifest);
  if (analysis.ruleVersion !== RULE_VERSION
    || JSON.stringify(analysis.sourceSnapshots) !== JSON.stringify(sourceSnapshots(currentManifest))) {
    throw new Error('source-or-rule-version-changed: rebuild the analysis before review');
  }
}
