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

const DARK_EQUITY_FILL = 'FF595959';
const LIGHT_EQUITY_FONT = 'FFFFFFFF';

function completeBonification() {
    return {
        extCC: 'Sim',
        extINV: 'Sim',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
    };
}

function input() {
    return {
        activeCompetenciaKey: '2026-08',
        escolas: [
            {
                id: 'school-without-equity',
                designação: '04.31.001',
                denominação: 'Escola Municipal Sem Equidade',
                cre: '4ª CRE',
                programasIds: ['BASIC', 'CONECTADA']
            },
            {
                id: 'school-with-equity',
                designação: '04.31.002',
                denominação: 'Escola Municipal Com Equidade',
                cre: '4ª CRE',
                programasIds: ['BASIC', 'RECURSOS']
            }
        ],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' },
            { id: 'RECURSOS', name: 'Sala de Recursos' }
        ],
        verificacoes: {
            'school-without-equity': {
                '2026-08_BASIC': { bonificacao: completeBonification() },
                '2026-08_CONECTADA': { bonificacao: completeBonification() }
            },
            'school-with-equity': {
                '2026-08_BASIC': { bonificacao: completeBonification() },
                '2026-08_RECURSOS': { bonificacao: completeBonification() }
            }
        }
    };
}

async function generate() {
    const model = modelApi.buildSmeMonthlyModel(input());
    const bytes = await renderer.renderWorkbook(model, {
        ExcelJS,
        templateBytes: fs.readFileSync(TEMPLATE)
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return workbook.worksheets[0];
}

test('marca Equidade como não aplicável com faixa cinza escura quando a escola não possui o programa', async () => {
    const worksheet = await generate();

    for (let column = 17; column <= 22; column += 1) {
        const cell = worksheet.getCell(2, column);
        assert.equal(cell.value, 'NÃO SE APLICA');
        assert.equal(cell.fill?.type, 'pattern');
        assert.equal(cell.fill?.pattern, 'solid');
        assert.equal(cell.fill?.fgColor?.argb, DARK_EQUITY_FILL);
        assert.equal(cell.font?.color?.argb, LIGHT_EQUITY_FONT);
    }

    assert.equal(worksheet.getCell('W2').value, 'APTA');
});

test('preserva os valores e a apresentação normal de Equidade quando a escola possui o programa', async () => {
    const worksheet = await generate();

    assert.deepEqual(
        ['Q3', 'R3', 'S3', 'T3', 'U3', 'V3'].map(address => worksheet.getCell(address).value),
        ['SIM', 'SIM', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA']
    );

    for (let column = 17; column <= 22; column += 1) {
        assert.notEqual(worksheet.getCell(3, column).fill?.fgColor?.argb, DARK_EQUITY_FILL);
    }
});
