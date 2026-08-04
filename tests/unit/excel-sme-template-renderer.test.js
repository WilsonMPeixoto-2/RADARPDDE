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

function input(overrides = {}) {
    const base = {
        activeCompetenciaKey: '2026-12',
        escolas: [{
            id: 'school-1',
            designação: '04.10.001',
            denominação: 'Escola Municipal Cadastro Atualizado',
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
    return {
        ...base,
        ...overrides,
        escolas: overrides.escolas || base.escolas,
        programas: overrides.programas || base.programas,
        verificacoes: overrides.verificacoes || base.verificacoes
    };
}

async function generate(options = {}) {
    const templateBytes = options.templateBytes || fs.readFileSync(TEMPLATE);
    const model = modelApi.buildSmeMonthlyModel(options.input || input());
    const bytes = await renderer.renderWorkbook(model, { ExcelJS, templateBytes });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    return { model, bytes, workbook, worksheet: workbook.worksheets[0] };
}

async function templateWithDuplicateDesignation() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fs.readFileSync(TEMPLATE));
    const worksheet = workbook.worksheets[0];
    worksheet.getCell('C3').value = worksheet.getCell('C2').value;
    return workbook.xlsx.writeBuffer();
}

test('parte do template original e entrega somente a aba mensal solicitada', async () => {
    const { bytes, workbook, worksheet } = await generate();

    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
    assert.equal(workbook.worksheets.length, 1);
    assert.equal(worksheet.name, 'DEZEMBRO');
    assert.equal(worksheet.columnCount, 30);
});

test('preserva textos, mesclagem e larguras sem reintroduzir validações incompatíveis', async () => {
    const { model, worksheet } = await generate();

    const headers = model.columns.map((column, index) => (
        column.mergedHeader ? '' : (worksheet.getRow(1).getCell(index + 1).value || '')
    ));
    assert.deepEqual(headers, modelApi.ORIGINAL_HEADER_LABELS);
    assert.equal(worksheet.getCell('A1').isMerged, true);
    assert.equal(worksheet.getCell('B1').isMerged, true);
    assert.equal(worksheet.getColumn(4).width, 60.28515625);
    assert.deepEqual(worksheet.dataValidations.model, {});
});

test('dá respiro aos campos descritivos sem perder alinhamento vertical e quebra de texto', async () => {
    const { worksheet } = await generate();

    assert.deepEqual(worksheet.getCell('D2').alignment, {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true,
        indent: 1
    });
    assert.deepEqual(worksheet.getCell('AD2').alignment, {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true,
        indent: 1
    });
});

test('centraliza o parecer como valor categórico', async () => {
    const { worksheet } = await generate();

    assert.deepEqual(worksheet.getCell('AC2').alignment, {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
    });
});

test('usa o cadastro atual como fonte de verdade para as colunas A a D', async () => {
    const { worksheet } = await generate();

    assert.equal(worksheet.getCell('A2').value, 1);
    assert.equal(worksheet.getCell('B2').value, '4ª');
    assert.equal(worksheet.getCell('C2').value, 410001);
    assert.equal(worksheet.getCell('D2').value, 'EM CADASTRO ATUALIZADO');
});

test('traduz os dados do RADAR sem preencher campos administrativos sem fonte', async () => {
    const { worksheet } = await generate();

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

test('remove valores cadastrais obsoletos e dimensiona navegação pela lista atual', async () => {
    const { worksheet } = await generate();
    const view = worksheet.views[0];
    const populatedDesignations = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const value = worksheet.getCell(rowNumber, 3).value;
        if (value !== null && value !== undefined && value !== '') {
            populatedDesignations.push(String(value));
        }
    }

    assert.deepEqual(populatedDesignations, ['410001']);
    assert.equal(worksheet.getCell('C3').value, null);
    assert.equal(view.state, 'frozen');
    assert.equal(view.xSplit, 4);
    assert.equal(view.ySplit, 1);
    assert.equal(view.topLeftCell, 'E2');
    assert.equal(worksheet.autoFilter, 'A1:AD2');
    assert.equal(worksheet.pageSetup.orientation, 'landscape');
    assert.equal(worksheet.pageSetup.fitToWidth, 1);
    assert.equal(worksheet.pageSetup.fitToHeight, 0);
    assert.equal(worksheet.pageSetup.printArea, 'A1:AD2');
    assert.equal(worksheet.pageSetup.printTitlesRow, '1:1');
});

test('bloqueia template com designações duplicadas em vez de sobrescrever linhas', async () => {
    const duplicateTemplate = await templateWithDuplicateDesignation();
    const model = modelApi.buildSmeMonthlyModel(input());

    await assert.rejects(
        renderer.renderWorkbook(model, { ExcelJS, templateBytes: duplicateTemplate }),
        error => error?.code === 'SME_TEMPLATE_DUPLICATE_DESIGNATION'
            && error?.details?.designation === '410001'
    );
});

test('classifica falha de parse do template com código estável', async () => {
    const model = modelApi.buildSmeMonthlyModel(input());

    await assert.rejects(
        renderer.renderWorkbook(model, {
            ExcelJS,
            templateBytes: Uint8Array.from([0x50, 0x4B, 0x03, 0x04, 0x00])
        }),
        error => error?.code === 'SME_TEMPLATE_PARSE_FAILED'
    );
});
