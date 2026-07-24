'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modelApi = require('../../src/domain/excel-sme-export-model.js');

function fixture() {
    return {
        escolas: [{
            id: 'school-1',
            designação: '04.10.001',
            denominação: 'EM EMA NEGRÃO DE LIMA',
            programasIds: ['BASIC', 'QUALIDADE', 'EQUIDADE', 'CONECTADA']
        }],
        competencias: [
            { key: '2026-01' },
            { key: '2026-12' },
            { key: '2027-01' }
        ],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'QUALIDADE', name: 'PDDE Qualidade' },
            { id: 'EQUIDADE', name: 'PDDE Equidade' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
        verificacoes: { 'school-1': {} }
    };
}

function completeBonification() {
    return {
        extCC: 'Sim',
        extINV: 'Não',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'N/A',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
    };
}

function addConsolidated(state, competence, programId, overrides = {}) {
    state.verificacoes['school-1'][`${competence}_${programId}`] = {
        bonificacao: { ...completeBonification(), ...(overrides.bonificacao || {}) },
        resultadoBonif: Object.prototype.hasOwnProperty.call(overrides, 'resultadoBonif')
            ? overrides.resultadoBonif
            : 'apta'
    };
}

test('mapeia competências, programas e colunas exatamente para o modelo SME de 2026', () => {
    const state = fixture();
    ['BASIC', 'QUALIDADE', 'EQUIDADE', 'CONECTADA'].forEach(program => {
        addConsolidated(state, '2026-01', program);
        addConsolidated(state, '2026-12', program);
        addConsolidated(state, '2027-01', program);
    });

    const model = modelApi.buildSmeExportModel(state);

    assert.equal(model.fileName, 'RADAR_PDDE_EXCEL_SME_2026.xlsx');
    assert.equal(model.records.length, 6);
    assert.deepEqual(
        model.records.map(record => [record.sheetName, record.programKey]),
        [
            ['JANEIRO', 'BASIC'],
            ['JANEIRO', 'EQUIDADE'],
            ['JANEIRO', 'QUALIDADE'],
            ['DEZEMBRO', 'BASIC'],
            ['DEZEMBRO', 'EQUIDADE'],
            ['DEZEMBRO', 'QUALIDADE']
        ]
    );
    assert.deepEqual(model.records[0].values, [
        'SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA'
    ]);
    assert.deepEqual(model.diagnostics.ignoredPrograms, [{ name: 'Educação Conectada', count: 2 }]);
    assert.deepEqual(model.diagnostics.ignoredExercises, [2027]);
});

test('normaliza a designação pontuada para a chave numérica usada na planilha', () => {
    assert.equal(modelApi.normalizeDesignation('04.10.001'), '410001');
    assert.equal(modelApi.normalizeDesignation(410001), '410001');
    assert.equal(modelApi.normalizeDesignation('E/CRE (04.31.026)'), '431026');
});

test('respeita as colunas deslocadas de dezembro sem ocupar as colunas de sistemática', () => {
    assert.deepEqual(modelApi.getProgramColumns('JANEIRO', 'QUALIDADE'), ['K', 'L', 'M', 'N', 'O', 'P']);
    assert.deepEqual(modelApi.getProgramColumns('DEZEMBRO', 'QUALIDADE'), ['L', 'M', 'N', 'O', 'P', 'Q']);
    assert.deepEqual(modelApi.getProgramColumns('DEZEMBRO', 'EQUIDADE'), ['S', 'T', 'U', 'V', 'W', 'X']);
});

test('bloqueia registro consolidado com campo documental inválido ou ausente', () => {
    const state = fixture();
    addConsolidated(state, '2026-01', 'BASIC', { bonificacao: { extINV: '' } });

    assert.throws(
        () => modelApi.buildSmeExportModel(state),
        error => error?.code === 'INVALID_SME_DATA'
            && error.details[0].missing.includes('extINV')
    );
});

test('não exporta verificações ainda não consolidadas', () => {
    const state = fixture();
    addConsolidated(state, '2026-01', 'BASIC', { resultadoBonif: '' });

    assert.throws(
        () => modelApi.buildSmeExportModel(state),
        error => error?.code === 'NO_SME_ROWS'
    );
});
