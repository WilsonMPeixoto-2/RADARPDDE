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

function fixture() {
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
                    resultadoBonif: 'apta'
                }
            }
        }
    };
}

async function generate() {
    const model = modelApi.buildSmeMonthlyModel(fixture());
    const bytes = await renderer.renderWorkbook(model, {
        ExcelJS,
        templateBytes: fs.readFileSync(TEMPLATE)
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return { model, workbook, worksheet: workbook.worksheets[0] };
}

test('expõe somente as 27 colunas pertencentes ao arquivo original', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());

    assert.equal(model.columns.length, 27);
    assert.equal(
        model.columns.some(column => column.label === 'SISTEMÁTICA PREENCHIDA'),
        false
    );
    assert.equal(
        model.columns.some(column => /_systematic$/i.test(column.key)),
        false
    );
    assert.deepEqual(model.columns.slice(-5).map(column => column.key), [
        'status',
        'deliveryDate',
        'correctionDate',
        'opinion',
        'notes'
    ]);
});

test('gera workbook A:AA sem K, R e Y sistemáticas e preserva campos posteriores', async () => {
    const { model, worksheet } = await generate();
    const headers = model.columns.map((column, index) => (
        column.mergedHeader ? '' : (worksheet.getRow(1).getCell(index + 1).value || '')
    ));

    assert.equal(worksheet.columnCount, 27);
    assert.equal(headers.includes('SISTEMÁTICA PREENCHIDA'), false);
    assert.equal(worksheet.getCell('W1').value, 'STATUS');
    assert.equal(worksheet.getCell('Y1').value, 'DATA DA CORREÇÃO DOS DOCUMENTOS ENVIADOS');
    assert.equal(
        worksheet.getCell('Z1').value,
        'PARECER               (CORREÇÃO MENSAL DA PRESTAÇÃO DE CONTAS)'
    );
    assert.equal(worksheet.getCell('AA1').value, 'OBSERVAÇÕES');
    assert.equal(worksheet.autoFilter, 'A1:AA2');
    assert.equal(worksheet.pageSetup.printArea, 'A1:AA2');
});

test('grava designação como texto institucional sem formato decimal', async () => {
    const { worksheet } = await generate();

    assert.equal(renderer.formatDesignation('04.10.001'), '04.10.001');
    assert.equal(renderer.formatDesignation(410001), '04.10.001');
    assert.equal(worksheet.getCell('C2').value, '04.10.001');
    assert.equal(worksheet.getCell('C2').numFmt, '@');
});

test('aplica linhas divisórias em toda a área exportada', async () => {
    const { worksheet } = await generate();

    for (const address of ['A1', 'K1', 'AA1', 'A2', 'K2', 'AA2']) {
        const border = worksheet.getCell(address).border;
        assert.equal(border.left?.style, 'thin', `${address} sem borda esquerda`);
        assert.equal(border.right?.style, 'thin', `${address} sem borda direita`);
        assert.equal(border.top?.style, 'thin', `${address} sem borda superior`);
        assert.equal(border.bottom?.style, 'thin', `${address} sem borda inferior`);
    }
});

test('mantém parecer e observações alinhados como campos descritivos', async () => {
    const { worksheet } = await generate();
    const expected = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true,
        indent: 1
    };

    assert.deepEqual(worksheet.getCell('Z2').alignment, expected);
    assert.deepEqual(worksheet.getCell('AA2').alignment, expected);
});