'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ExcelJS = require('exceljs');
const modelApi = require('../../src/domain/excel-sme-export-model.js');
const renderer = require('../../src/domain/excel-sme-template-renderer.js');

const TEMPLATE = path.resolve(
    __dirname,
    '../../assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx'
);

function input() {
    return {
        activeCompetenciaKey: '2026-12',
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
                '2026-12_BASIC': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Sim',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'inapta'
                }
            }
        }
    };
}

async function generate() {
    const templateBytes = fs.readFileSync(TEMPLATE);
    const model = modelApi.buildSmeMonthlyModel(input());
    const bytes = await renderer.renderWorkbook(model, { ExcelJS, templateBytes });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return { model, bytes, workbook, worksheet: workbook.worksheets[0] };
}

test('parte do template original e entrega somente a aba mensal solicitada', async () => {
    const { bytes, workbook, worksheet } = await generate();

    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
    assert.equal(workbook.worksheets.length, 1);
    assert.equal(worksheet.name, 'DEZEMBRO');
    assert.equal(worksheet.columnCount, 30);
});

test('preserva textos, mesclagem, larguras e validações do modelo original', async () => {
    const { model, worksheet } = await generate();

    const headers = model.columns.map((_, index) => worksheet.getRow(1).getCell(index + 1).value || '');
    assert.deepEqual(headers, modelApi.ORIGINAL_HEADER_LABELS);
    assert.equal(worksheet.getCell('A1').isMerged, true);
    assert.equal(worksheet.getCell('B1').isMerged, true);
    assert.equal(worksheet.getColumn(4).width, 60.28515625);
    assert.equal(worksheet.getCell('E2').dataValidation.type, 'list');
    assert.equal(worksheet.getCell('K2').dataValidation.type, 'list');
    assert.equal(worksheet.getCell('AC2').dataValidation.type, 'list');
});

test('traduz os dados do RADAR sem preencher campos administrativos sem fonte', async () => {
    const { worksheet } = await generate();

    assert.equal(worksheet.getCell('C2').value, 410001);
    assert.equal(worksheet.getCell('D2').value, 'EM EMA NEGRÃO DE LIMA');
    assert.equal(worksheet.getCell('E2').value, 'SIM');
    assert.equal(worksheet.getCell('F2').value, 'SIM');
    assert.equal(worksheet.getCell('G2').value, 'NÃO SE APLICA');
    assert.equal(worksheet.getCell('K2').value, 'SIM');
    assert.equal(worksheet.getCell('Z2').value, 'APTA');
    assert.deepEqual(
        ['AA2', 'AB2', 'AC2', 'AD2'].map(address => worksheet.getCell(address).value || ''),
        ['', '', '', '']
    );
});

test('aplica melhorias de navegação e impressão sem alterar o conteúdo do documento', async () => {
    const { worksheet } = await generate();
    const view = worksheet.views[0];

    assert.equal(view.state, 'frozen');
    assert.equal(view.xSplit, 4);
    assert.equal(view.ySplit, 1);
    assert.equal(view.topLeftCell, 'E2');
    assert.equal(worksheet.autoFilter, 'A1:AD164');
    assert.equal(worksheet.pageSetup.orientation, 'landscape');
    assert.equal(worksheet.pageSetup.fitToWidth, 1);
    assert.equal(worksheet.pageSetup.fitToHeight, 0);
    assert.equal(worksheet.pageSetup.printArea, 'A1:AD164');
    assert.equal(worksheet.pageSetup.printTitlesRow, '1:1');
});
