'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const modelApi = require('../../src/domain/excel-sme-export-model.js');
const renderer = require('../../src/domain/excel-sme-template-renderer.js');
const zipApi = require('../../src/domain/excel-sme-zip.js');

const templateBase64 = Array.from({ length: 6 }, (_, index) => (
    fs.readFileSync(path.join(
        __dirname,
        `../../src/assets/templates/cre-04-controle-onedrive-2026.part${String(index + 1).padStart(2, '0')}.b64`
    ), 'utf8')
)).join('');
const templateBytes = Buffer.from(templateBase64, 'base64');
const decoder = new TextDecoder('utf-8');

function fixtureModel() {
    const state = {
        escolas: [{
            id: 'school-1',
            designação: '04.10.001',
            denominação: 'EM EMA NEGRÃO DE LIMA',
            programasIds: ['BASIC', 'QUALIDADE', 'EQUIDADE']
        }],
        competencias: [{ key: '2026-01' }, { key: '2026-12' }],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'QUALIDADE', name: 'PDDE Qualidade' },
            { id: 'EQUIDADE', name: 'PDDE Equidade' }
        ],
        verificacoes: { 'school-1': {} }
    };
    const bonificacao = {
        extCC: 'Sim',
        extINV: 'Não',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
    };
    for (const competence of ['2026-01', '2026-12']) {
        for (const program of ['BASIC', 'QUALIDADE', 'EQUIDADE']) {
            state.verificacoes['school-1'][`${competence}_${program}`] = {
                bonificacao: { ...bonificacao },
                resultadoBonif: 'apta'
            };
        }
    }
    return modelApi.buildSmeExportModel(state);
}

async function entriesByName(bytes) {
    const entries = await zipApi.readZipEntries(bytes);
    return new Map(entries.map(entry => [entry.name, entry.bytes]));
}

function textCell(xml, ref) {
    return renderer.readCellValue(xml, ref, []);
}

function extractTag(xml, tag) {
    return xml.match(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>|<${tag}\\b[^>]*/>`))?.[0] || '';
}

test('confere a integridade criptográfica do arquivo-base aprovado', () => {
    assert.equal(
        crypto.createHash('sha256').update(templateBytes).digest('hex'),
        modelApi.TEMPLATE_SHA256
    );
});

test('preenche somente células documentais e preserva fórmulas e estruturas do modelo SME', async () => {
    const model = fixtureModel();
    const original = await entriesByName(templateBytes);
    const outputBytes = await renderer.renderWorkbook(model, { templateBytes });
    const output = await entriesByName(outputBytes);

    assert.equal(outputBytes[0], 0x50);
    assert.equal(outputBytes[1], 0x4B);
    assert.deepEqual([...output.keys()], [...original.keys()]);

    const workbookOriginal = decoder.decode(original.get('xl/workbook.xml'));
    const workbookOutput = decoder.decode(output.get('xl/workbook.xml'));
    assert.match(workbookOutput, /<calcPr\b[^>]*calcMode="auto"[^>]*fullCalcOnLoad="1"[^>]*forceFullCalc="1"/);
    assert.equal(
        workbookOutput.replace(/<calcPr\b[^>]*\/>/, ''),
        workbookOriginal.replace(/<calcPr\b[^>]*\/>/, '')
    );

    const januaryOriginal = decoder.decode(original.get('xl/worksheets/sheet1.xml'));
    const january = decoder.decode(output.get('xl/worksheets/sheet1.xml'));
    assert.deepEqual(
        ['E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2', 'M2', 'N2', 'O2', 'P2', 'Q2', 'R2', 'S2', 'T2', 'U2', 'V2']
            .map(ref => textCell(january, ref)),
        [
            'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA',
            'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA',
            'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA'
        ]
    );
    assert.equal(textCell(january, 'E3'), '');
    assert.equal(renderer.countFormulas(january), renderer.countFormulas(januaryOriginal));
    assert.equal(extractTag(january, 'dataValidations'), extractTag(januaryOriginal, 'dataValidations'));
    assert.equal(extractTag(january, 'sheetProtection'), extractTag(januaryOriginal, 'sheetProtection'));
    assert.equal(extractTag(january, 'autoFilter'), extractTag(januaryOriginal, 'autoFilter'));

    const decemberOriginal = decoder.decode(original.get('xl/worksheets/sheet12.xml'));
    const december = decoder.decode(output.get('xl/worksheets/sheet12.xml'));
    assert.deepEqual(
        ['E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'L2', 'M2', 'N2', 'O2', 'P2', 'Q2', 'S2', 'T2', 'U2', 'V2', 'W2', 'X2']
            .map(ref => textCell(december, ref)),
        [
            'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA',
            'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA',
            'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA'
        ]
    );
    assert.equal(textCell(december, 'K2'), '');
    assert.equal(textCell(december, 'R2'), '');
    assert.equal(textCell(december, 'Y2'), '');
    assert.equal(renderer.countFormulas(december), renderer.countFormulas(decemberOriginal));

    const consolidatedOriginal = original.get('xl/worksheets/sheet13.xml');
    const consolidatedOutput = output.get('xl/worksheets/sheet13.xml');
    assert.deepEqual(consolidatedOutput, consolidatedOriginal);
    assert.equal(renderer.countFormulas(decoder.decode(consolidatedOutput)), 1956);

    assert.deepEqual(
        output.get('xl/printerSettings/printerSettings1.bin'),
        original.get('xl/printerSettings/printerSettings1.bin')
    );
});

test('rejeita arquivo-base adulterado antes de gerar o relatório', async () => {
    const altered = Buffer.from(templateBytes);
    altered[altered.length - 1] ^= 0x01;

    await assert.rejects(
        renderer.renderWorkbook(fixtureModel(), { templateBytes: altered }),
        error => error?.code === 'SME_TEMPLATE_HASH_MISMATCH'
    );
});

test('bloqueia escola consolidada ausente nas 163 designações do modelo', async () => {
    const model = fixtureModel();
    const alteredModel = {
        ...model,
        records: model.records.map((record, index) => (
            index === 0 ? { ...record, designationKey: '999999' } : record
        ))
    };

    await assert.rejects(
        renderer.renderWorkbook(alteredModel, { templateBytes }),
        error => error?.code === 'SCHOOL_NOT_IN_SME_TEMPLATE'
    );
});
