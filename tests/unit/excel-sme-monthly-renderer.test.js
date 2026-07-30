'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

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

test('gera um XLSX válido pelo pacote write-excel-file', async () => {
    const bytes = await renderer.renderWorkbook(model());

    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
    assert.ok(bytes.length > 1000);
    assert.equal(renderer.VERSION, '2.1.0');
});

test('preserva literalmente os trinta cabeçalhos e a mesclagem CRE do original', () => {
    const data = renderer.buildSheetData(model());
    const header = data[0];

    assert.equal(header.length, 30);
    assert.equal(header[0].value, 'CRE');
    assert.equal(header[0].columnSpan, 2);
    assert.equal(header[1], null);
    assert.deepEqual(
        header.map(cell => cell?.value || ''),
        modelApi.ORIGINAL_HEADER_LABELS
    );
});

test('projeta dados canônicos sem descaracterizar designação, CRE ou denominação', () => {
    const row = renderer.buildSheetData(model())[1];

    assert.equal(row[0].value, 1);
    assert.equal(row[1].value, '4ª');
    assert.equal(row[2].value, 431001);
    assert.equal(row[2].type, Number);
    assert.equal(row[2].format, '0');
    assert.equal(row[3].value, 'ESCOLA MUNICIPAL ARY BARROSO');
    assert.equal(row[4].value, 'SIM');
    assert.equal(row[6].value, 'NÃO SE APLICA');
    assert.equal(row[10].value, 'SIM');
    assert.equal(row[25].value, 'APTA');
    assert.equal(row[26].value, '');
    assert.equal(row[29].value, '');
});

test('configura congelamento, larguras e orientação sem inventar novos textos', () => {
    const currentModel = model();
    const options = renderer.buildSheetOptions(currentModel);

    assert.equal(options.sheet, 'JULHO');
    assert.equal(options.columns.length, 30);
    assert.equal(options.columns[0].width, 5);
    assert.equal(options.columns[3].width, 60.29);
    assert.equal(options.orientation, 'landscape');
    assert.equal(options.stickyRowsCount, 1);
    assert.equal(options.stickyColumnsCount, 4);
    assert.equal(options.showGridLines, false);
});

test('mantém a identidade cromática por bloco com leitura mais clara', () => {
    const header = renderer.buildSheetData(model())[0];

    assert.equal(header[0].backgroundColor, renderer.COLORS.identity);
    assert.equal(header[4].backgroundColor, renderer.COLORS.basic);
    assert.equal(header[11].backgroundColor, renderer.COLORS.quality);
    assert.equal(header[18].backgroundColor, renderer.COLORS.equity);
    assert.equal(header[25].backgroundColor, renderer.COLORS.status);
    assert.equal(header[29].backgroundColor, renderer.COLORS.administrative);
    assert.equal(header[0].height, 105);
    assert.equal(header[0].fontFamily, 'Arial');
});
