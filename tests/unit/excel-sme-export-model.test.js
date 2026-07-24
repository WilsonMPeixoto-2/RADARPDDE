'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modelApi = require('../../src/domain/excel-sme-export-model.js');

function fixture() {
    return {
        activeCompetenciaKey: '2026-07',
        escolas: [
            {
                id: 'school-2',
                designação: '04.31.026',
                denominação: 'Escola Municipal Herbert Moses',
                cre: '4ª CRE',
                programasIds: ['BASIC', 'QUALIDADE']
            },
            {
                id: 'school-1',
                designação: '04.31.001',
                denominação: 'Escola Municipal Ary Barroso',
                cre: '4ª CRE',
                programasIds: ['BASIC', 'EQUIDADE']
            }
        ],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'QUALIDADE', name: 'PDDE Qualidade' },
            { id: 'EQUIDADE', name: 'PDDE Equidade' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
        verificacoes: {
            'school-1': {
                '2026-07_BASIC': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Não',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'N/A',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'inapta'
                },
                '2026-06_BASIC': {
                    bonificacao: { extCC: 'Não' },
                    resultadoBonif: 'inapta'
                },
                '2026-07_EQUIDADE': {
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
            },
            'school-2': {
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
                },
                '2026-07_QUALIDADE': {
                    bonificacao: { extCC: 'Sim' },
                    resultadoBonif: ''
                }
            }
        }
    };
}

test('bloqueia geração quando a competência está em TODAS ou é inválida', () => {
    assert.throws(
        () => modelApi.buildSmeMonthlyModel({ ...fixture(), activeCompetenciaKey: 'TODAS' }),
        error => error?.code === 'INVALID_SME_COMPETENCE'
    );
    assert.throws(
        () => modelApi.buildSmeMonthlyModel({ ...fixture(), activeCompetenciaKey: '2026-13' }),
        error => error?.code === 'INVALID_SME_COMPETENCE'
    );
});

test('gera nome do arquivo e da única aba a partir da competência selecionada', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());

    assert.equal(model.competenceKey, '2026-07');
    assert.equal(model.sheetName, 'JULHO');
    assert.equal(model.fileName, 'RADAR_PDDE_EXCEL_SME_07-2026.xlsx');
    assert.equal(model.columns.length, 26);
});

test('ordena escolas pela designação e mantém campos administrativos vazios', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());

    assert.deepEqual(model.rows.map(row => row.designation), ['04.31.001', '04.31.026']);
    assert.deepEqual(model.rows.map(row => row.order), [1, 2]);
    assert.deepEqual(
        {
            deliveryDate: model.rows[0].deliveryDate,
            correctionDate: model.rows[0].correctionDate,
            opinion: model.rows[0].opinion,
            notes: model.rows[0].notes
        },
        { deliveryDate: '', correctionDate: '', opinion: '', notes: '' }
    );
});

test('preenche somente a competência selecionada e normaliza valores do RADAR', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());
    const ary = model.rows[0];

    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => ary[`basic_${key}`]),
        ['SIM', 'NÃO', 'NÃO SE APLICA', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA']
    );
    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => ary[`equidade_${key}`]),
        ['SIM', 'SIM', 'SIM', 'NÃO SE APLICA', 'SIM', 'SIM']
    );
});

test('deixa vazio o bloco de programa sem consolidação na competência', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());
    const herbert = model.rows[1];

    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => herbert[`qualidade_${key}`]),
        ['', '', '', '', '', '']
    );
    assert.equal(model.diagnostics.schoolCount, 2);
});

test('bloqueia geração quando não há escolas carregadas', () => {
    assert.throws(
        () => modelApi.buildSmeMonthlyModel({ ...fixture(), escolas: [] }),
        error => error?.code === 'NO_SME_SCHOOLS'
    );
});
