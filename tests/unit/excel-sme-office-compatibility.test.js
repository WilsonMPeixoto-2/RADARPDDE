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
        const command = process.platform === 'win32' ? 'tar.exe' : 'unzip';
        const args = process.platform === 'win32'
            ? ['-xOf', file, entry]
            : ['-p', file, entry];
        return execFileSync(command, args, { encoding: 'utf8' });
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

test('remove outlinePr sem agrupamentos para manter sheetPr válido no Excel', async () => {
    const { sheetXml } = await generate();

    assert.match(sheetXml, /<sheetPr><pageSetUpPr fitToPage="1"\/><\/sheetPr>/);
    assert.doesNotMatch(sheetXml, /<outlinePr\b/);
});

test('não grava dataValidations que provoquem reparo ou planilha vazia no Excel', async () => {
    const { sheetXml } = await generate();

    assert.doesNotMatch(sheetXml, /<dataValidations\b/i);
    assert.doesNotMatch(sheetXml, /<dataValidation\b/i);
});
