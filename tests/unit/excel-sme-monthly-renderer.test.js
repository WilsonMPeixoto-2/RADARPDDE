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

test('cria workbook com uma única aba mensal e 26 colunas', () => {
    const workbook = renderer.createWorkbook(model(), { ExcelJS, generatedAt: '2026-07-24T12:00:00Z' });

    assert.equal(workbook.worksheets.length, 1);
    const worksheet = workbook.worksheets[0];
    assert.equal(worksheet.name, 'JULHO');
    assert.equal(worksheet.columnCount, 26);
    assert.equal(worksheet.getRow(1).height, 72);
    assert.equal(worksheet.getCell('A1').value, 'Nº');
    assert.equal(worksheet.getCell('D1').value, 'UNIDADE ESCOLAR');
    assert.equal(worksheet.getCell('E1').value, 'EXTRATO CONTA CORRENTE');
    assert.equal(worksheet.getCell('Z1').value, 'OBSERVAÇÕES');
});

test('preenche dados do RADAR e mantém campos administrativos vazios', () => {
    const worksheet = renderer.createWorkbook(model(), { ExcelJS }).worksheets[0];

    assert.equal(worksheet.getCell('A2').value, 1);
    assert.equal(worksheet.getCell('C2').value, '04.31.001');
    assert.equal(worksheet.getCell('D2').value, 'Escola Municipal Ary Barroso');
    assert.deepEqual(
        ['E2', 'F2', 'G2', 'H2', 'I2', 'J2'].map(ref => worksheet.getCell(ref).value),
        ['SIM', 'SIM', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA']
    );
    assert.deepEqual(
        ['W2', 'X2', 'Y2', 'Z2'].map(ref => worksheet.getCell(ref).value || ''),
        ['', '', '', '']
    );
});

test('configura autofiltro, congelamento e impressão em paisagem', () => {
    const worksheet = renderer.createWorkbook(model(), { ExcelJS }).worksheets[0];

    assert.deepEqual(worksheet.autoFilter, { from: 'A1', to: 'Z2' });
    assert.equal(worksheet.views[0].state, 'frozen');
    assert.equal(worksheet.views[0].xSplit, 4);
    assert.equal(worksheet.views[0].ySplit, 1);
    assert.equal(worksheet.pageSetup.orientation, 'landscape');
    assert.equal(worksheet.pageSetup.fitToWidth, 1);
    assert.equal(worksheet.pageSetup.printArea, 'A1:Z2');
});

test('gera binário XLSX válido', async () => {
    const bytes = await renderer.renderWorkbook(model(), { ExcelJS });

    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    assert.equal(workbook.worksheets.length, 1);
    assert.equal(workbook.worksheets[0].name, 'JULHO');
});
