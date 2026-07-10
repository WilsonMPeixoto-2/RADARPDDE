const test = require('node:test');
const assert = require('node:assert/strict');

const exportModel = require('../src/domain/excel-export-model.js');
const workbookPlan = require('../src/domain/excel-workbook-plan.js');
const renderer = require('../src/domain/excel-xlsx-renderer.js');

function buildFixture() {
    return {
        escolas: [
            {
                id: 'e1',
                inep: '33070440',
                denominação: 'Escola Municipal Ary Barroso',
                designação: '04.31.001',
                programasIds: ['BASIC', 'CONECTADA']
            },
            {
                id: 'e2',
                inep: '33070539',
                denominação: 'Escola Municipal David Perez',
                designação: '04.31.002',
                programasIds: ['BASIC']
            }
        ],
        competencias: [
            { key: '2026-01', label: 'Janeiro/2026' },
            { key: '2026-02', label: 'Fevereiro/2026' }
        ],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
        verificacoes: {
            e1: {
                '2026-01_BASIC': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim', encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'apta'
                },
                '2026-01_CONECTADA': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Não', notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim', encampInventario: ''
                    },
                    resultadoBonif: 'inapta'
                },
                '2026-02_BASIC': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim', encampInventario: 'Sim'
                    }
                }
            },
            e2: {
                '2026-02_BASIC': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim', encampInventario: 'Sim'
                    },
                    resultadoBonif: 'apta'
                }
            }
        }
    };
}

function createPlan() {
    const model = exportModel.buildExportModel(buildFixture());
    return workbookPlan.createWorkbookPlan(model, {
        generatedAt: '2026-07-10T12:00:00.000Z',
        source: 'Teste automatizado',
        temporalScope: 'Todas as competências consolidadas',
        fileName: 'RADAR_PDDE_TESTE.xlsx'
    });
}

function decode(entries, name) {
    assert.ok(entries[name], `Parte ausente no pacote: ${name}`);
    return new TextDecoder().decode(entries[name]);
}

test('gera pacote XLSX com as quatro abas aprovadas', () => {
    const bytes = renderer.renderWorkbook(createPlan());
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);

    const entries = renderer.inspectStoredZip(bytes);
    const workbook = decode(entries, 'xl/workbook.xml');
    assert.match(workbook, /sheet name="BONIFICACOES" sheetId="1"/);
    assert.match(workbook, /sheet name="SINTESE" sheetId="2"/);
    assert.match(workbook, /sheet name="QUALIDADE_DADOS" sheetId="3"/);
    assert.match(workbook, /sheet name="METADADOS" sheetId="4"/);
    assert.ok(entries['xl/styles.xml']);
    assert.ok(entries['xl/tables/table1.xml']);
    assert.ok(entries['xl/tables/table2.xml']);
});

test('preserva os 12 campos e os registros consolidados na aba principal', () => {
    const entries = renderer.inspectStoredZip(renderer.renderWorkbook(createPlan()));
    const sheet = decode(entries, 'xl/worksheets/sheet1.xml');
    const table = decode(entries, 'xl/tables/table1.xml');

    assert.match(sheet, /xSplit="3" ySplit="8"/);
    assert.match(sheet, /INEP/);
    assert.match(sheet, /Denominação/);
    assert.match(sheet, /Status da bonificação/);
    assert.match(sheet, /33070440/);
    assert.match(sheet, /Educação Conectada/);
    assert.match(sheet, />APTA</);
    assert.match(sheet, />INAPTA</);
    assert.doesNotMatch(sheet, /2026-02_BASIC/);
    assert.match(table, /tableColumns count="12"/);
    assert.match(table, /ref="A8:L11"/);
});

test('inclui fórmulas, valores em cache e gráfico na síntese', () => {
    const entries = renderer.inspectStoredZip(renderer.renderWorkbook(createPlan()));
    const sheet = decode(entries, 'xl/worksheets/sheet2.xml');
    const chart = decode(entries, 'xl/charts/chart1.xml');

    assert.match(sheet, /COUNTA\(BONIFICACOES!A9:A11\)/);
    assert.match(sheet, /COUNTIF\(BONIFICACOES!L9:L11,&quot;APTA&quot;\)/);
    assert.match(sheet, /Janeiro\/2026/);
    assert.match(sheet, /Fevereiro\/2026/);
    assert.match(chart, /Resultados consolidados por competência/);
    assert.match(chart, /<c:v>Consolidadas<\/c:v>/);
    assert.match(chart, /<c:v>Aptas<\/c:v>/);
    assert.match(chart, /<c:v>Inaptas<\/c:v>/);
    assert.match(chart, /<c:strCache>/);
    assert.match(chart, /<c:numCache>/);
});

test('mantém qualidade de dados e metadados como abas opcionais', () => {
    const entries = renderer.inspectStoredZip(renderer.renderWorkbook(createPlan()));
    const quality = decode(entries, 'xl/worksheets/sheet3.xml');
    const metadata = decode(entries, 'xl/worksheets/sheet4.xml');

    assert.match(quality, /Linha na base/);
    assert.match(quality, /Campos ausentes/);
    assert.match(quality, /Encaminhado ao inventário/);
    assert.match(quality, /Revisar/);
    assert.match(metadata, /Granularidade/);
    assert.match(metadata, /Campo original/);
    assert.match(metadata, /Denominacao/);
});

test('rejeita plano que não preserve a estrutura aprovada', () => {
    assert.throws(
        () => renderer.renderWorkbook({ sheets: [] }),
        /Plano de workbook inválido/
    );

    const plan = createPlan();
    plan.sheets = [...plan.sheets].reverse();
    assert.throws(
        () => renderer.renderWorkbook(plan),
        /ordem das abas aprovadas/
    );
});
