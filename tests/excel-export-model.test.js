'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    BASE_SHEET_NAME,
    DATA_QUALITY_COLUMNS,
    ORIGINAL_COLUMNS,
    SHEET_NAMES,
    WORKBOOK_LAYOUT,
    buildBaseRows,
    buildEquivalenceReport,
    buildExportModel,
    buildLegacyLogicalRows,
    compareLogicalRows,
    formatCompetenciaDisplay,
    formatCompetenciaLegacy,
    toOriginalColumnValues
} = require('../src/domain/excel-export-model.js');

const fixture = {
    escolas: [
        {
            id: 'escola-1',
            inep: '33000001',
            denominação: 'Escola Municipal A',
            designação: '04.31.001',
            programasIds: ['BASIC', 'CONECTADA']
        },
        {
            id: 'escola-2',
            inep: '33000002',
            denominação: 'Escola Municipal B',
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
        'escola-1': {
            '2026-01_BASIC': {
                bonificacao: {
                    extCC: 'Sim',
                    extINV: 'Sim',
                    notaFiscal: 'Não se aplica',
                    consAssessoria: 'Não se aplica',
                    declBBAgil: 'Sim',
                    encampInventario: 'Não se aplica'
                },
                resultadoBonif: 'apta'
            },
            '2026-01_CONECTADA': {
                bonificacao: {
                    extCC: 'Sim',
                    extINV: 'Não',
                    notaFiscal: 'Sim',
                    consAssessoria: 'Não se aplica',
                    declBBAgil: 'Sim'
                },
                resultadoBonif: 'inapta'
            },
            '2026-02_BASIC': {
                bonificacao: {
                    extCC: 'Sim'
                },
                resultadoBonif: ''
            }
        },
        'escola-2': {
            '2026-02_BASIC': {
                bonificacao: {
                    extCC: 'Sim',
                    extINV: 'Sim',
                    notaFiscal: 'Sim',
                    consAssessoria: 'Não se aplica',
                    declBBAgil: 'Sim',
                    encampInventario: 'Sim'
                },
                resultadoBonif: 'apta'
            }
        }
    }
};

test('preserva os doze campos e a ordem do relatório CSV original', () => {
    assert.deepEqual(
        ORIGINAL_COLUMNS.map(column => column.legacyLabel),
        [
            'INEP',
            'Denominacao',
            'Designacao',
            'Competencia',
            'Programa',
            'CC',
            'Investimento',
            'NF',
            'Assessoria',
            'BBAgil',
            'EncaminhadoInventario',
            'StatusBonificacao'
        ]
    );
});

test('mantém a granularidade escola, competência e programa', () => {
    const rows = buildBaseRows(fixture);

    assert.equal(rows.length, 3);
    assert.deepEqual(
        rows.map(row => [row.designacao, row.competencia, row.programa]),
        [
            ['04.31.001', '01-2026', 'PDDE Básico'],
            ['04.31.001', '01-2026', 'Educação Conectada'],
            ['04.31.002', '02-2026', 'PDDE Básico']
        ]
    );
});

test('inclui somente bonificações consolidadas e não limita à competência ativa', () => {
    const rows = buildBaseRows({ ...fixture, activeCompetenciaKey: '2026-02' });

    assert.equal(
        rows.some(row => row.designacao === '04.31.001' && row.competencia === '02-2026'),
        false
    );
    assert.deepEqual(
        [...new Set(rows.map(row => row.competencia))],
        ['01-2026', '02-2026']
    );
});

test('preserva os valores documentais e o traço legado de inventário ausente', () => {
    const rows = buildBaseRows(fixture);
    const conectada = rows.find(row => row.programaId === 'CONECTADA');

    assert.deepEqual(
        toOriginalColumnValues(conectada),
        [
            '33000001',
            'Escola Municipal A',
            '04.31.001',
            '01-2026',
            'Educação Conectada',
            'Sim',
            'Não',
            'Sim',
            'Não se aplica',
            'Sim',
            '-',
            'INAPTA'
        ]
    );
});

test('produz equivalência integral entre a lógica atual e a nova aba principal', () => {
    const legacyRows = buildLegacyLogicalRows(fixture);
    const baseRows = buildBaseRows(fixture).map(toOriginalColumnValues);
    const report = buildEquivalenceReport(fixture);

    assert.deepEqual(baseRows, legacyRows);
    assert.deepEqual(report, {
        equivalent: true,
        expectedRowCount: 3,
        actualRowCount: 3,
        mismatches: []
    });
});

test('o comparador de equivalência aponta alteração de valor ou ausência de linha', () => {
    const expected = [['33000001', 'Escola A'], ['33000002', 'Escola B']];
    const actual = [['33000001', 'Escola alterada']];
    const report = compareLogicalRows(expected, actual);

    assert.equal(report.equivalent, false);
    assert.equal(report.expectedRowCount, 2);
    assert.equal(report.actualRowCount, 1);
    assert.equal(report.mismatches.length, 2);
    assert.equal(report.mismatches[0].column, 'Denominacao');
    assert.equal(report.mismatches[1].reason, 'missing-row');
});

test('adota exatamente as quatro abas aprovadas e mantém as adicionais opcionais', () => {
    const model = buildExportModel(fixture);

    assert.equal(model.base.name, BASE_SHEET_NAME);
    assert.deepEqual(model.sheetOrder, [
        SHEET_NAMES.base,
        SHEET_NAMES.summary,
        SHEET_NAMES.dataQuality,
        SHEET_NAMES.metadata
    ]);
    assert.equal(model.base.required, true);
    assert.equal(model.optional.summary.required, false);
    assert.equal(model.optional.dataQuality.required, false);
    assert.equal(model.optional.metadata.required, false);
});

test('reúne sínteses por competência e programa na aba SINTESE aprovada', () => {
    const model = buildExportModel(fixture);
    const janeiro = model.optional.summary.byCompetencia.find(row => row.key === '2026-01');
    const conectada = model.optional.summary.byPrograma.find(row => row.key === 'CONECTADA');

    assert.equal(model.optional.summary.name, 'SINTESE');
    assert.deepEqual(
        { total: janeiro.totalConsolidadas, aptas: janeiro.aptas, inaptas: janeiro.inaptas, taxa: janeiro.taxaAptidao },
        { total: 2, aptas: 1, inaptas: 1, taxa: 0.5 }
    );
    assert.deepEqual(
        { total: conectada.totalConsolidadas, aptas: conectada.aptas, inaptas: conectada.inaptas },
        { total: 1, aptas: 0, inaptas: 1 }
    );
});

test('a qualidade dos dados referencia as linhas reais da aba principal a partir da linha 9', () => {
    const model = buildExportModel(fixture);

    assert.deepEqual(
        model.optional.dataQuality.rows.map(row => row.linhaBase),
        [9, 10, 11]
    );
    assert.equal(model.optional.dataQuality.rows[1].camposAusentes, 1);
    assert.equal(model.optional.dataQuality.rows[1].detalhamento, 'Encaminhado ao inventário');
    assert.equal(model.optional.dataQuality.rows[1].situacao, 'Revisar');
});

test('o contrato visual registra larguras e alinhamentos aprovados', () => {
    const byKey = Object.fromEntries(ORIGINAL_COLUMNS.map(column => [column.key, column]));
    const qualityByKey = Object.fromEntries(DATA_QUALITY_COLUMNS.map(column => [column.key, column]));

    assert.equal(WORKBOOK_LAYOUT.sheets.BONIFICACOES.headerRow, 8);
    assert.equal(WORKBOOK_LAYOUT.sheets.BONIFICACOES.firstDataRow, 9);
    assert.equal(WORKBOOK_LAYOUT.sheets.BONIFICACOES.freezeColumns, 3);
    assert.deepEqual(
        {
            denominacao: byKey.denominacao.alignment,
            programa: byKey.programa.alignment,
            inep: byKey.inep.alignment,
            status: byKey.statusBonificacao.alignment,
            inventarioWidth: byKey.encaminhadoInventario.width,
            statusWidth: byKey.statusBonificacao.width
        },
        {
            denominacao: 'left',
            programa: 'left',
            inep: 'center',
            status: 'center',
            inventarioWidth: 20,
            statusWidth: 21
        }
    );
    assert.deepEqual(
        {
            lineWidth: qualityByKey.linhaBase.width,
            lineAlignment: qualityByKey.linhaBase.alignment,
            programAlignment: qualityByKey.programa.alignment,
            detailWidth: qualityByKey.detalhamento.width
        },
        {
            lineWidth: 17,
            lineAlignment: 'center',
            programAlignment: 'left',
            detailWidth: 40
        }
    );
});

test('registra metadados de inclusão, granularidade e estrutura aprovada', () => {
    const model = buildExportModel(fixture);

    assert.equal(
        model.optional.metadata.values.inclusionRule,
        'Somente registros com resultadoBonif consolidado.'
    );
    assert.equal(
        model.optional.metadata.values.competenceScope,
        'Todas as competências disponíveis, como no relatório original.'
    );
    assert.deepEqual(
        model.optional.metadata.values.approvedWorkbookStructure,
        ['BONIFICACOES', 'SINTESE', 'QUALIDADE_DADOS', 'METADADOS']
    );
});

test('mantém formatos legado e amigável de competência separados', () => {
    assert.equal(formatCompetenciaLegacy('2026-05'), '05-2026');
    assert.equal(formatCompetenciaDisplay('2026-05'), 'Maio/2026');
    assert.equal(formatCompetenciaLegacy('valor-livre'), 'valor-livre');
});
