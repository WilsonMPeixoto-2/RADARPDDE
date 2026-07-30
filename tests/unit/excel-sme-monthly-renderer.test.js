'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');

const modelApi = require('../../src/domain/excel-sme-export-model.js');
const renderer = require('../../src/domain/excel-sme-monthly-renderer.js');

function model() {
    return modelApi.buildSmeMonthlyModel({
        activeCompetenciaKey: '2026-07',
        escolas: [{
            id: 'school-1',
            designação: '04.31.001',
            denominação: 'Escola Municipal Ary Barroso',
            cre: '4ª CRE',
            programasIds: ['BASIC']
        }],
        programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verificacoes: {
            'school-1': {
                '2026-07_BASIC': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Sim',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'apta'
                }
            }
        }
    });
}

async function loadWorkbook() {
    const bytes = await renderer.renderWorkbook(model());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return { bytes, workbook, worksheet: workbook.worksheets[0] };
}

test('gera um XLSX ExcelJS válido com uma única aba mensal', async () => {
    const { bytes, workbook, worksheet } = await loadWorkbook();

    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
    assert.equal(workbook.worksheets.length, 1);
    assert.equal(worksheet.name, 'JULHO');
    assert.equal(renderer.VERSION, '2.0.0');
});

test('preserva os trinta cabeçalhos literais e a mesclagem CRE do original', async () => {
    const { worksheet } = await loadWorkbook();
    const headers = modelApi.ORIGINAL_HEADER_LABELS;

    assert.equal(worksheet.columnCount, 30);
    assert.deepEqual(
        headers.map((_, index) => worksheet.getRow(1).getCell(index + 1).value || ''),
        headers
    );
    assert.equal(worksheet.getCell('A1').isMerged, true);
    assert.equal(worksheet.getCell('B1').isMerged, true);
    assert.equal(worksheet.getCell('A1').value, 'CRE');
});

test('projeta dados canônicos sem descaracterizar designação, CRE ou denominação', async () => {
    const { worksheet } = await loadWorkbook();

    assert.equal(worksheet.getCell('A2').value, 1);
    assert.equal(worksheet.getCell('B2').value, '4ª');
    assert.equal(worksheet.getCell('C2').value, 431001);
    assert.equal(worksheet.getCell('D2').value, 'ESCOLA MUNICIPAL ARY BARROSO');
    assert.equal(worksheet.getCell('E2').value, 'SIM');
    assert.equal(worksheet.getCell('G2').value, 'NÃO SE APLICA');
    assert.equal(worksheet.getCell('K2').value, 'SIM');
    assert.equal(worksheet.getCell('Z2').value, 'APTA');
    assert.equal(worksheet.getCell('AA2').value, '');
    assert.equal(worksheet.getCell('AD2').value, '');
});

test('configura congelamento, filtro e impressão sem validações de dados', async () => {
    const { worksheet } = await loadWorkbook();
    const view = worksheet.views[0];

    assert.equal(view.state, 'frozen');
    assert.equal(view.xSplit, 4);
    assert.equal(view.ySplit, 1);
    assert.equal(view.topLeftCell, 'E2');
    assert.deepEqual(worksheet.autoFilter, 'A1:AD2');
    assert.equal(worksheet.pageSetup.orientation, 'landscape');
    assert.equal(worksheet.pageSetup.fitToWidth, 1);
    assert.equal(worksheet.pageSetup.fitToHeight, 0);
    assert.equal(worksheet.pageSetup.printArea, 'A1:AD2');
    assert.equal(worksheet.pageSetup.printTitlesRow, '1:1');
    assert.deepEqual(worksheet.dataValidations.model, {});
});

test('mantém a identidade cromática por bloco com leitura mais clara', async () => {
    const { worksheet } = await loadWorkbook();

    assert.equal(worksheet.getCell('A1').fill.fgColor.argb, renderer.COLORS.identity);
    assert.equal(worksheet.getCell('E1').fill.fgColor.argb, renderer.COLORS.basic);
    assert.equal(worksheet.getCell('L1').fill.fgColor.argb, renderer.COLORS.quality);
    assert.equal(worksheet.getCell('S1').fill.fgColor.argb, renderer.COLORS.equity);
    assert.equal(worksheet.getCell('Z1').fill.fgColor.argb, renderer.COLORS.status);
    assert.equal(worksheet.getCell('AD1').fill.fgColor.argb, renderer.COLORS.administrative);
    assert.equal(worksheet.getRow(1).height, 105);
    assert.equal(worksheet.getColumn(4).width, 60.29);
});
