'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    BASE_SHEET_NAME,
    ORIGINAL_COLUMNS,
    buildBaseRows,
    buildExportModel,
    formatCompetenciaDisplay,
    formatCompetenciaLegacy
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

test('inclui somente bonificações consolidadas, como a exportação original', () => {
    const rows = buildBaseRows(fixture);

    assert.equal(
        rows.some(row => row.designacao === '04.31.001' && row.competencia === '02-2026'),
        false
    );
});

test('não limita a aba principal à competência ativa', () => {
    const rows = buildBaseRows({ ...fixture, activeCompetenciaKey: '2026-02' });

    assert.deepEqual(
        [...new Set(rows.map(row => row.competencia))],
        ['01-2026', '02-2026']
    );
});

test('preserva os valores documentais de bonificação e normaliza ausência como traço', () => {
    const rows = buildBaseRows(fixture);
    const conectada = rows.find(row => row.programaId === 'CONECTADA');

    assert.equal(conectada.contaCorrente, 'Sim');
    assert.equal(conectada.investimento, 'Não');
    assert.equal(conectada.notaFiscal, 'Sim');
    assert.equal(conectada.assessoria, 'Não se aplica');
    assert.equal(conectada.bbAgil, 'Sim');
    assert.equal(conectada.encaminhadoInventario, '-');
    assert.equal(conectada.statusBonificacao, 'INAPTA');
});

test('cria análises opcionais sem alterar a base original', () => {
    const model = buildExportModel(fixture);

    assert.equal(model.base.name, BASE_SHEET_NAME);
    assert.equal(model.base.rows.length, 3);
    assert.equal(model.optional.summaryByCompetencia.rows.length, 2);
    assert.equal(model.optional.summaryByPrograma.rows.length, 2);
    assert.equal(model.optional.dataQuality.rows.length, 3);
    assert.equal(model.base.rows[0].statusBonificacao, 'APTA');
});

test('calcula síntese por competência sobre o universo de linhas consolidadas', () => {
    const model = buildExportModel(fixture);
    const janeiro = model.optional.summaryByCompetencia.rows.find(row => row.key === '2026-01');
    const fevereiro = model.optional.summaryByCompetencia.rows.find(row => row.key === '2026-02');

    assert.deepEqual(
        {
            total: janeiro.totalConsolidadas,
            aptas: janeiro.aptas,
            inaptas: janeiro.inaptas,
            taxa: janeiro.taxaAptidao
        },
        { total: 2, aptas: 1, inaptas: 1, taxa: 0.5 }
    );

    assert.deepEqual(
        {
            total: fevereiro.totalConsolidadas,
            aptas: fevereiro.aptas,
            inaptas: fevereiro.inaptas,
            taxa: fevereiro.taxaAptidao
        },
        { total: 1, aptas: 1, inaptas: 0, taxa: 1 }
    );
});

test('registra no metadado a regra de inclusão e o escopo temporal original', () => {
    const model = buildExportModel(fixture);

    assert.equal(
        model.optional.metadata.values.inclusionRule,
        'Somente registros com resultadoBonif consolidado.'
    );
    assert.equal(
        model.optional.metadata.values.competenceScope,
        'Todas as competências disponíveis, como no relatório original.'
    );
});

test('mantém formatos legado e amigável de competência separados', () => {
    assert.equal(formatCompetenciaLegacy('2026-05'), '05-2026');
    assert.equal(formatCompetenciaDisplay('2026-05'), 'Maio/2026');
    assert.equal(formatCompetenciaLegacy('valor-livre'), 'valor-livre');
});
