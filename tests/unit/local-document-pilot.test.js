'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const enginePromise = import('../../ops/document-intelligence-poc/local-pdf-pilot/analyze.mjs');
const INSTITUTION = 'CEC DO/A ESCOLA SINTÉTICA ALFA';
const COMMITMENT = `${INSTITUTION}\nCNPJ 00.000.000/0000-00\nTERMO DE COMPROMISSO\nPERÍODO: de 01 a 31 de agosto de 2025\nDeclaração para a Solução BB Gestão Ágil. Referência legal de 2024.\n`;
const LIST = `RELAÇÃO DE BENS ADQUIRIDOS OU PRODUZIDOS\n01 Programa/Ação 02 Exercício\nPDDE BÁSICO 2025\n${INSTITUTION} 00.000.000/0000-00\nBLOCO 2 – IDENTIFICAÇÃO DOS BENS\nTipo Número Data Descrição Quantidade Unitário TOTAL\nDANF SYN-901 09/08/2025 CADEIRA MODELO A 1 100,00 100,00\nDANF SYN-901 09/08/2025 MESA MODELO B 1 50,00 50,00\n${Array(12).fill('0 0 00/01/1900 0 0 - -').join('\n')}\n12 - TOTAL 150,00\n`;
const DONATION = `TERMO DE DOAÇÃO\nPelo presente instrumento o ${INSTITUTION} do/a ESCOLA SINTÉTICA ALFA\nPrograma Dinheiro Direto na Escola PDDE/BÁSICO/2025\nDESCRIÇÃO DO BEM QTDE. NOTA FISCAL DATA UNITÁRIO TOTAL\n1 CADEIRA MODELO A 1 SYN-901 09/08/2025 100,00 100,00\n2 MESA MODELO B 1 SYN-901 09/08/2025 50,00 50,00\n${Array.from({ length: 12 }, (_, index) => `${index + 3} 0 0 0 00/01/1900 - -`).join('\n')}\nTOTAL: 150,00\n`;

async function fixture(texts = [COMMITMENT, LIST, DONATION]) {
  const { hashText } = await enginePromise;
  return {
    schemaVersion: 1, synthetic: true, extractor: { version: 'synthetic-native-extractor/1' },
    documents: texts.map((text, index) => ({
      id: `synthetic-${index + 1}`,
      source: { pdfSha256: hashText(`synthetic bytes ${index}`), version: 'synthetic-source/v1', uploadedAt: '2026-11-01' },
      pageCount: 1, pages: [{ page: 1, text, textSha256: hashText(text) }], textSha256: hashText(text),
      signatureFieldsPresence: { present: index === 0, count: index === 0 ? 1 : 0, cryptographicValidation: 'not-performed' },
      signatureTextMarkersPresent: false
    }))
  };
}

test('piloto extrai três modelos com âncoras, não herda CNPJ e diferencia conteúdo de metadado de upload', async () => {
  const { analyzeManifest } = await enginePromise;
  const manifest = await fixture();
  const before = structuredClone(manifest);
  const result = analyzeManifest(manifest, { targetExercise: 2026 });
  assert.deepEqual(result.documents.map(document => document.type), ['bb-agil-commitment', 'asset-list', 'donation-term']);
  assert.deepEqual(result.documents.map(document => document.context.exercise.value), [2025, 2025, 2025]);
  assert.ok(result.documents.every(document => document.contextComparison.exerciseMatch === false));
  assert.equal(result.documents[0].context.period.value.start, '2025-08-01');
  assert.equal(result.documents[0].context.period.value.end, '2025-08-31');
  assert.equal(result.documents[2].context.cnpj.status, 'not-found');
  assert.equal(result.documents[2].context.cnpj.value, null);
  for (const document of result.documents) {
    const source = manifest.documents.find(item => item.id === document.id);
    const anchors = [
      ...document.classificationEvidence,
      ...Object.values(document.context).flatMap(value => value.evidence || []),
      ...document.items.map(item => item.evidence)
    ];
    assert.ok(anchors.length > 0);
    for (const anchor of anchors) {
      assert.equal(source.pages[anchor.page - 1].text.split('\n')[anchor.line - 1].trim(), anchor.quote);
    }
  }
  assert.deepEqual(manifest, before);
  assert.equal(result.confidenceScore, null);
  assert.equal(result.administrativeConclusion, null);
});

test('linhas-modelo não viram bens; relação e doação formam dois pares de itens e não quatro compras', async () => {
  const { analyzeManifest } = await enginePromise;
  const result = analyzeManifest(await fixture(), { targetExercise: 2026 });
  for (const document of result.documents.slice(1)) {
    assert.equal(document.items.length, 2);
    assert.equal(document.ignoredTemplateRows.length, 12);
    assert.equal(document.rejectedRows.length, 0);
    assert.equal(document.total.value, 15000);
    assert.equal(document.sumItemTotalsCents, 15000);
    assert.equal(document.assetsCreated, 0);
  }
  assert.equal(result.pairs.length, 1);
  assert.equal(result.pairs[0].matchedItemPairs, 2);
  assert.equal(result.pairs[0].sourceItemRecords, 4);
  assert.equal(result.pairs[0].purchaseCount, null);
  assert.equal(result.pairs[0].targetExerciseMatch, false);
  assert.equal(result.pairs[0].outcome, 'compatible-fields-for-review');
  assert.equal(result.automaticImports, 0);
});

test('datas impossíveis e placeholders preenchidos são rejeitados, sem normalização automática de calendário', async () => {
  const { analyzeManifest, dateBR } = await enginePromise;
  assert.equal(dateBR('31/02/2025'), null);
  assert.equal(dateBR('29/02/2025'), null);
  assert.equal(dateBR('00/01/1900'), null);
  assert.equal(dateBR('29/02/2024'), '2024-02-29');
  const invalid = LIST.replace('09/08/2025', '31/02/2025').replace('0 0 00/01/1900 0 0 - -', 'DANF SYN-902 00/01/1900 CADEIRA NOVA 1 10,00 10,00');
  const result = analyzeManifest(await fixture([invalid]), { targetExercise: 2025 }).documents[0];
  assert.equal(result.items.length, 1);
  assert.equal(result.ignoredTemplateRows.length, 11);
  assert.equal(result.rejectedRows.length, 2);
  assert.ok(result.rejectedRows.every(row => row.reason === 'invalid-calendar-date'));
  assert.equal(result.tableComplete, false);
});

test('valor diferente é divergência; igualdade de valor isolada não cria correspondência', async () => {
  const { analyzeManifest } = await enginePromise;
  const different = DONATION.replace('100,00 100,00', '101,00 101,00').replace('TOTAL: 150,00', 'TOTAL: 151,00');
  const result = analyzeManifest(await fixture([LIST, different]), { targetExercise: 2025 });
  assert.equal(result.pairs[0].comparisons[0].outcome, 'amount-mismatch');
  assert.equal(result.pairs[0].totalsMatch, false);
  assert.equal(result.pairs[0].outcome, 'document-review-required');
  const unsupported = analyzeManifest(await fixture([LIST, DONATION.replaceAll('SYN-901', 'SYN-999')]), { targetExercise: 2025 });
  assert.equal(unsupported.pairs[0].matchedItemPairs, 0);
  assert.ok(unsupported.pairs[0].comparisons.every(item => item.outcome === 'no-supported-match'));
});

test('correspondências múltiplas de linhas ou documentos permanecem ambíguas', async () => {
  const { analyzeManifest } = await enginePromise;
  const duplicated = DONATION.replace('TOTAL: 150,00', '15 CADEIRA MODELO A 1 SYN-901 09/08/2025 100,00 100,00\nTOTAL: 250,00');
  const rows = analyzeManifest(await fixture([LIST, duplicated]), { targetExercise: 2025 });
  assert.equal(rows.pairs[0].comparisons[0].outcome, 'ambiguous');
  const documents = analyzeManifest(await fixture([LIST, DONATION, DONATION]), { targetExercise: 2025 });
  assert.equal(documents.pairSelections[0].outcome, 'ambiguous-document-pair');
  assert.equal(documents.pairSelections[0].selectedAutomatically, false);
  assert.ok(documents.pairs.every(pair => pair.pairSelectionAmbiguous && pair.outcome === 'ambiguous-document-pair'));
});

test('duas relações candidatas à mesma doação permanecem ambíguas em ambas as direções', async () => {
  const { analyzeManifest } = await enginePromise;
  const result = analyzeManifest(await fixture([LIST, LIST, DONATION]), { targetExercise: 2025 });
  assert.equal(result.pairs.length, 2);
  assert.ok(result.pairs.every(pair => pair.pairSelectionAmbiguous && pair.outcome === 'ambiguous-document-pair'));
  assert.ok(result.pairSelections.every(selection => selection.outcome === 'ambiguous-document-pair' && !selection.selectedAutomatically));
});

test('CNPJ ambíguo não equivale a CNPJ ausente nem autoriza par compatível', async () => {
  const { analyzeManifest } = await enginePromise;
  const result = analyzeManifest(await fixture([
    `${LIST}CNPJ 11.111.111/1111-11\n`,
    `${DONATION}CNPJ 22.222.222/2222-22\n`
  ]), { targetExercise: 2025 });
  assert.equal(result.documents[0].context.cnpj.status, 'ambiguous');
  assert.equal(result.documents[0].context.cnpj.candidates.length, 2);
  assert.equal(result.documents[1].context.cnpj.status, 'extracted');
  assert.equal(result.pairs.length, 0);
  assert.equal(result.pairSelections[0].outcome, 'no-supported-pair');
});

test('soma e total fora do limite seguro são rejeitados sem arredondamento ou tabela completa', async () => {
  const { analyzeManifest, moneyBR } = await enginePromise;
  const large = LIST.replace('100,00 100,00', '90071992547409,90 90071992547409,90')
    .replace('50,00 50,00', '0,05 0,05').replace('12 - TOTAL 150,00', '12 - TOTAL 90071992547409,95');
  const overflow = analyzeManifest(await fixture([large]), { targetExercise: 2025 }).documents[0];
  assert.equal(overflow.sumItemTotalsCents, null);
  assert.equal(overflow.tableComplete, false);
  assert.ok(overflow.reviewReasons.includes('item-total-sum-out-of-range'));
  assert.equal(overflow.total.status, 'invalid');
  assert.equal(overflow.total.value, null);
  assert.equal(overflow.total.reason, 'amount-out-of-range');
  assert.equal(overflow.total.evidence.length, 1);
  assert.ok(overflow.reviewReasons.includes('declared-total-out-of-range'));
  const invalidTotal = analyzeManifest(await fixture([
    LIST.replace('12 - TOTAL 150,00', '12 - TOTAL 90071992547409,95')
  ]), { targetExercise: 2025 }).documents[0];
  assert.equal(invalidTotal.sumItemTotalsCents, 15000);
  assert.equal(invalidTotal.total.status, 'invalid');
  assert.equal(invalidTotal.tableComplete, false);
  const boundary = analyzeManifest(await fixture([
    large.replace('0,05 0,05', '0,01 0,01').replace('TOTAL 90071992547409,95', 'TOTAL 90071992547409,91')
  ]), { targetExercise: 2025 }).documents[0];
  assert.equal(boundary.sumItemTotalsCents, Number.MAX_SAFE_INTEGER);
  assert.equal(boundary.total.value, Number.MAX_SAFE_INTEGER);
  assert.equal(boundary.tableComplete, true);
  assert.deepEqual(boundary.reviewReasons, []);
  assert.equal(moneyBR('90071992547409,92'), null);
});

test('CLI de análise sanitiza falhas de leitura e JSON sem imprimir caminhos ou conteúdo privado', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'radar-document-pilot-synthetic-'));
  const marker = 'SYNTHETIC-PRIVATE-SCHOOL-NAME';
  const cli = path.resolve(__dirname, '../../ops/document-intelligence-poc/local-pdf-pilot/run.mjs');
  try {
    const missing = path.join(directory, `${marker}-missing.json`);
    const malformed = path.join(directory, 'malformed.json');
    writeFileSync(malformed, `not-json-${marker}`);
    const manifest = await fixture([LIST]);
    manifest.documents[0].source.path = path.join(directory, `${marker}-missing.pdf`);
    const missingPdf = path.join(directory, 'missing-pdf.json');
    writeFileSync(missingPdf, JSON.stringify(manifest));
    for (const input of [missing, malformed, missingPdf]) {
      const execution = spawnSync(process.execPath, [cli, '--manifest', input,
        '--output', path.join(directory, 'analysis.json'), '--target-exercise', '2025'], { encoding: 'utf8' });
      assert.equal(execution.status, 1);
      assert.equal(execution.stdout, '');
      assert.equal(JSON.parse(execution.stderr).error, 'local-document-analysis-failed');
      assert.ok(!execution.stderr.includes(marker));
      assert.ok(!execution.stderr.includes(directory));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('presença estrutural de /Sig não depende da camada de texto e não valida assinatura', async () => {
  const { analyzeManifest } = await enginePromise;
  const result = analyzeManifest(await fixture([COMMITMENT]), { targetExercise: 2025 });
  const signature = result.documents[0].signature;
  assert.equal(signature.fields.present, true);
  assert.equal(signature.textLayerMarkersPresent, false);
  assert.equal(signature.cryptographicValidation, 'not-performed');
  assert.equal(signature.appearanceValidation, 'not-performed-by-parser');
  assert.equal(result.documents[0].requiresHumanReview, true);
});

test('bytes, texto, versão de origem e versão do extrator invalidam uma análise anterior', async () => {
  const { analyzeManifest, assertAnalysisCurrent, hashText, verifyPdfIdentity } = await enginePromise;
  const manifest = await fixture();
  const result = analyzeManifest(manifest, { targetExercise: 2025 });
  assert.doesNotThrow(() => assertAnalysisCurrent(result, manifest));
  assert.throws(() => verifyPdfIdentity(manifest.documents[0], hashText('changed bytes')), /pdf-bytes-changed/);
  for (const mutate of [
    current => { current.documents[0].source.version = 'synthetic-source/v2'; },
    current => { current.documents[0].source.pdfSha256 = hashText('changed bytes'); },
    current => { current.extractor.version = 'synthetic-native-extractor/2'; }
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    assert.throws(() => assertAnalysisCurrent(result, changed), /source-or-rule-version-changed/);
  }
  const tamperedText = structuredClone(manifest);
  tamperedText.documents[0].pages[0].text += '\ntexto adulterado';
  assert.throws(() => analyzeManifest(tamperedText, { targetExercise: 2025 }), /page-text-integrity-mismatch/);
});
