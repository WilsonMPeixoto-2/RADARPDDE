'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const ExcelJS = require('exceljs');
const modelApi = require('../../src/domain/excel-sme-export-model.js');
const renderer = require('../../src/domain/excel-sme-template-renderer.js');

const TEMPLATE = path.resolve(
    __dirname,
    '../../assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx'
);

function complete(overrides = {}) {
    return {
        extCC: 'Sim',
        extINV: 'Sim',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica',
        ...overrides
    };
}

function fixture(activeCompetenciaKey = '2026-05') {
    return {
        activeCompetenciaKey,
        escolas: [{
            id: 'school-1',
            designação: '04.10.001',
            denominação: 'Escola Municipal Ema Negrão de Lima',
            cre: '4ª CRE',
            programasIds: ['BASIC']
        }],
        programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verificacoes: {
            'school-1': {
                '2026-05_BASIC': {
                    bonificacao: complete({ extCC: 'Não' }),
                    resultadoBonif: 'apta'
                },
                '2026-12_BASIC': {
                    bonificacao: complete(),
                    resultadoBonif: 'inapta'
                }
            }
        }
    };
}

function readZipEntry(bytes, entry) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-excel-sme-'));
    const file = path.join(directory, 'candidate.xlsx');
    try {
        fs.writeFileSync(file, bytes);
        return execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8' });
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

async function generate(activeCompetenciaKey = '2026-05') {
    const templateBytes = fs.readFileSync(TEMPLATE);
    const model = modelApi.buildSmeMonthlyModel(fixture(activeCompetenciaKey));
    const bytes = await renderer.renderWorkbook(model, { ExcelJS, templateBytes });
    const workbookXml = readZipEntry(bytes, 'xl/workbook.xml');
    const sheetXml = readZipEntry(bytes, 'xl/worksheets/sheet1.xml');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return { model, workbook, workbookXml, sheetXml };
}

function occurrences(text, pattern) {
    return [...text.matchAll(pattern)].length;
}

test('a competência ativa controla aba, nome do arquivo e conjunto de dados', async () => {
    const { model, workbook } = await generate('2026-05');
    const worksheet = workbook.worksheets[0];

    assert.equal(model.competenceKey, '2026-05');
    assert.equal(model.fileName, 'RADAR_PDDE_EXCEL_SME_05-2026.xlsx');
    assert.equal(worksheet.name, 'MAIO');
    assert.equal(worksheet.getCell('E2').value, 'NÃO');
    assert.equal(worksheet.getCell('Z2').value, 'INAPTA');
});

test('grava uma visualização válida da pasta de trabalho', async () => {
    const { workbookXml } = await generate();

    assert.match(workbookXml, /<bookViews><workbookView\b[^>]*activeTab="0"[^>]*\/><\/bookViews>/);
});

test('grava área de impressão com referências integralmente absolutas', async () => {
    const { workbookXml } = await generate();

    assert.match(workbookXml, /(?:'|&apos;)MAIO(?:'|&apos;)!\$A\$1:\$AD\$164/);
    assert.doesNotMatch(workbookXml, /(?:'|&apos;)MAIO(?:'|&apos;)!\$A1:\$AD164/);
});

test('grava exatamente sete validações sem intervalos duplicados ou sobrepostos', async () => {
    const { sheetXml } = await generate();
    const expectedRanges = [
        'E2:J164',
        'K2:K164',
        'L2:Q164',
        'R2:R164',
        'S2:X164',
        'Y2:Y164',
        'AC2:AC164'
    ];

    assert.match(sheetXml, /<dataValidations count="7">/);
    expectedRanges.forEach(range => {
        const escaped = range.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        assert.equal(occurrences(sheetXml, new RegExp(`sqref="${escaped}"`, 'g')), 1);
    });
    assert.doesNotMatch(sheetXml, /sqref="(?:E|K|L|R|S|Y|AC)10:/);
});
