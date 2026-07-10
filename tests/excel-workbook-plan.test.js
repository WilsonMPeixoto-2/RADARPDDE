'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createWorkbookPlan } = require('../src/domain/excel-workbook-plan.js');

const columns = [
    ['inep', 'INEP', 'INEP', 'A', 12, 'center'],
    ['denominacao', 'Denominacao', 'Denominação', 'B', 34, 'left'],
    ['designacao', 'Designacao', 'Designação', 'C', 14, 'center'],
    ['competencia', 'Competencia', 'Competência', 'D', 13, 'center'],
    ['programa', 'Programa', 'Programa', 'E', 24, 'left'],
    ['contaCorrente', 'CC', 'Conta corrente', 'F', 17, 'center'],
    ['investimento', 'Investimento', 'Investimento', 'G', 17, 'center'],
    ['notaFiscal', 'NF', 'Nota fiscal', 'H', 17, 'center'],
    ['assessoria', 'Assessoria', 'Assessoria', 'I', 17, 'center'],
    ['bbAgil', 'BBAgil', 'BB Ágil', 'J', 17, 'center'],
    ['encaminhadoInventario', 'EncaminhadoInventario', 'Encaminhado ao inventário', 'K', 20, 'center'],
    ['statusBonificacao', 'StatusBonificacao', 'Status da bonificação', 'L', 21, 'center']
].map(([key, legacyLabel, label, column, width, alignment]) => ({
    key, legacyLabel, label, column, width, alignment, dataType: 'text'
}));

const qualityColumns = [
    { key: 'linhaBase', label: 'Linha na base', column: 'A', width: 17, alignment: 'center', dataType: 'integer' },
    { key: 'inep', label: 'INEP', column: 'B', width: 14, alignment: 'center', dataType: 'text' },
    { key: 'designacao', label: 'Designação', column: 'C', width: 16, alignment: 'center', dataType: 'text' },
    { key: 'competencia', label: 'Competência', column: 'D', width: 14, alignment: 'center', dataType: 'text' },
    { key: 'programa', label: 'Programa', column: 'E', width: 26, alignment: 'left', dataType: 'text' },
    { key: 'camposAusentes', label: 'Campos ausentes', column: 'F', width: 17, alignment: 'center', dataType: 'integer' },
    { key: 'detalhamento', label: 'Detalhamento', column: 'G', width: 40, alignment: 'left', dataType: 'text' },
    { key: 'situacao', label: 'Situação', column: 'H', width: 15, alignment: 'center', dataType: 'text' }
];

const baseRows = [
    {
        inep: '33000001', denominacao: 'Escola Municipal A', designacao: '04.31.001',
        competencia: '01-2026', programa: 'PDDE Básico', contaCorrente: 'Sim',
        investimento: 'Sim', notaFiscal: 'Não se aplica', assessoria: 'Não se aplica',
        bbAgil: 'Sim', encaminhadoInventario: 'Não se aplica', statusBonificacao: 'APTA'
    },
    {
        inep: '33000001', denominacao: 'Escola Municipal A', designacao: '04.31.001',
        competencia: '01-2026', programa: 'Educação Conectada', contaCorrente: 'Sim',
        investimento: 'Não', notaFiscal: 'Sim', assessoria: 'Não se aplica',
        bbAgil: 'Sim', encaminhadoInventario: '-', statusBonificacao: 'INAPTA'
    }
];

const model = {
    version: '0.2.0',
    equivalence: { equivalent: true, legacyCount: 2, baseCount: 2, mismatches: [] },
    layout: {
        palette: {
            structural: '#17324D', informational: '#2F6FA5', positive: '#287B78',
            attention: '#C98512', critical: '#B43A3A', analytical: '#6658A6',
            functionalGray: '#64748B', lightBackground: '#F5F7FA', border: '#D8DEE6'
        },
        sheets: {
            BONIFICACOES: { metadataLabelRow: 4, metadataValueRow: 5, headerRow: 8, firstDataRow: 9, freezeRows: 8, freezeColumns: 3 },
            QUALIDADE_DADOS: { headerRow: 5, firstDataRow: 6, freezeRows: 5 }
        }
    },
    base: { name: 'BONIFICACOES', columns, rows: baseRows },
    optional: {
        summary: {
            name: 'SINTESE',
            byCompetencia: [{ key: '2026-01', label: 'Janeiro/2026', totalConsolidadas: 2, aptas: 1, inaptas: 1, taxaAptidao: 0.5 }],
            byPrograma: [
                { key: 'BASIC', label: 'PDDE Básico', totalConsolidadas: 1, aptas: 1, inaptas: 0, taxaAptidao: 1 },
                { key: 'CONECTADA', label: 'Educação Conectada', totalConsolidadas: 1, aptas: 0, inaptas: 1, taxaAptidao: 0 }
            ]
        },
        dataQuality: {
            name: 'QUALIDADE_DADOS', columns: qualityColumns,
            rows: [
                { linhaBase: 9, inep: '33000001', designacao: '04.31.001', competencia: '01-2026', programa: 'PDDE Básico', camposAusentes: 0, detalhamento: '', situacao: 'Completa' },
                { linhaBase: 10, inep: '33000001', designacao: '04.31.001', competencia: '01-2026', programa: 'Educação Conectada', camposAusentes: 1, detalhamento: 'Encaminhado ao inventário', situacao: 'Revisar' }
            ]
        },
        metadata: {
            name: 'METADADOS', values: {
                modelVersion: '0.2.0',
                inclusionRule: 'Somente registros com resultadoBonif consolidado.',
                granularity: 'Uma linha por escola, competência e programa.',
                competenceScope: 'Todas as competências disponíveis, como no relatório original.'
            }
        }
    }
};

function plan() {
    return createWorkbookPlan(model, {
        generatedAt: '2026-07-10T06:00:00.000Z', source: 'Fixture de teste',
        temporalScope: 'Todas as competências', fileName: 'teste.xlsx'
    });
}

test('bloqueia geração quando a equivalência com o CSV não foi comprovada', () => {
    assert.throws(() => createWorkbookPlan({ ...model, equivalence: { equivalent: false } }), /equivalência com o CSV não foi comprovada/);
});

test('mantém a ordem aprovada das quatro abas', () => {
    assert.deepEqual(plan().sheetOrder, ['BONIFICACOES', 'SINTESE', 'QUALIDADE_DADOS', 'METADADOS']);
});

test('preserva cabeçalho na linha 8, dados na linha 9 e congelamento aprovado', () => {
    const base = plan().sheets[0];
    assert.equal(base.table.headerRow, 8);
    assert.equal(base.table.firstDataRow, 9);
    assert.equal(base.table.lastDataRow, 10);
    assert.deepEqual(base.freeze, { rows: 8, columns: 3 });
});

test('transporta os mesmos doze valores lógicos da base', () => {
    const base = plan().sheets[0];
    assert.equal(base.table.headers.length, 12);
    assert.deepEqual(base.table.rows[1], [
        '33000001', 'Escola Municipal A', '04.31.001', '01-2026', 'Educação Conectada',
        'Sim', 'Não', 'Sim', 'Não se aplica', 'Sim', '-', 'INAPTA'
    ]);
});

test('mantém larguras e alinhamentos aprovados da aba principal', () => {
    const planColumns = plan().sheets[0].table.columns;
    assert.deepEqual(
        planColumns.map(column => [column.column, column.width, column.alignment]),
        columns.map(column => [column.column, column.width, column.alignment])
    );
});

test('define fórmulas de síntese sobre o intervalo real da base', () => {
    const summary = plan().sheets[1];
    assert.equal(summary.kpis[0][2], '=COUNTA(BONIFICACOES!A9:A10)');
    assert.equal(summary.kpis[1][2], '=COUNTIF(BONIFICACOES!L9:L10,"APTA")');
    assert.equal(summary.kpis[3][4], '0.0%');
});

test('mantém competência e programa na mesma aba de síntese', () => {
    const summary = plan().sheets[1];
    assert.equal(summary.competenceTable.rows.length, 1);
    assert.equal(summary.programTable.rows.length, 2);
    assert.equal(summary.charts[0].sourceRange, 'A10:D11');
});

test('preserva referência correta à linha da base na qualidade de dados', () => {
    const quality = plan().sheets[2];
    assert.deepEqual(quality.table.rows.map(row => row[0]), [9, 10]);
    assert.equal(quality.table.columns[0].width, 17);
    assert.equal(quality.table.columns[6].alignment, 'left');
});

test('registra metadados e dicionário dos doze campos', () => {
    const metadata = plan().sheets[3];
    assert.equal(metadata.dictionary.rows.length, 12);
    assert.equal(metadata.dictionary.rows[0][0], 'INEP');
    assert.equal(metadata.properties[1][1], '2026-07-10T06:00:00.000Z');
});

test('produz estrutura inteiramente serializável para qualquer renderizador XLSX', () => {
    const original = plan();
    assert.deepEqual(JSON.parse(JSON.stringify(original)), original);
});
