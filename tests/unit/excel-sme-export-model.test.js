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
                programasIds: ['BASIC', 'CONECTADA', 'PROEC']
            },
            {
                id: 'school-1',
                designação: '04.31.001',
                denominação: 'Escola Municipal Ary Barroso',
                cre: '4ª CRE',
                programasIds: ['BASIC', 'CONECTADA', 'RECURSOS']
            }
        ],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' },
            { id: 'PROEC', name: 'Programa Escola e Comunidade' },
            { id: 'ED_FAMILIA', name: 'Educação e Família' },
            { id: 'ADOLESCENCIAS', name: 'Escola das Adolescências' },
            { id: 'LEITURA', name: 'Cantinho da Leitura' },
            { id: 'TEMPO_APRENDER', name: 'Tempo de Aprender' },
            { id: 'RECURSOS', name: 'Sala de Recursos' }
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
                '2026-07_CONECTADA': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Sim',
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Sim'
                    },
                    resultadoBonif: 'apta'
                },
                '2026-07_RECURSOS': {
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
                '2026-07_CONECTADA': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Sim',
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Sim'
                    },
                    resultadoBonif: 'apta'
                },
                '2026-07_PROEC': {
                    bonificacao: {
                        extCC: 'Não',
                        extINV: 'Sim',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'Sim',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'inapta'
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
    assert.equal(model.columns.length, 30);
});

test('classifica os programas reais nas contas SME corretas', () => {
    assert.equal(modelApi.resolveProgramKey({ id: 'BASIC', name: 'PDDE Básico' }), 'BASIC');
    assert.equal(modelApi.resolveProgramKey({ id: 'CONECTADA', name: 'Educação Conectada' }), 'QUALIDADE');
    assert.equal(modelApi.resolveProgramKey({ id: 'PROEC', name: 'Programa Escola e Comunidade' }), 'QUALIDADE');
    assert.equal(modelApi.resolveProgramKey({ id: 'ED_FAMILIA', name: 'Educação e Família' }), 'QUALIDADE');
    assert.equal(modelApi.resolveProgramKey({ id: 'ADOLESCENCIAS', name: 'Escola das Adolescências' }), 'QUALIDADE');
    assert.equal(modelApi.resolveProgramKey({ id: 'LEITURA', name: 'Cantinho da Leitura' }), 'QUALIDADE');
    assert.equal(modelApi.resolveProgramKey({ id: 'TEMPO_APRENDER', name: 'Tempo de Aprender' }), 'QUALIDADE');
    assert.equal(modelApi.resolveProgramKey({ id: 'RECURSOS', name: 'Sala de Recursos' }), 'EQUIDADE');
});

test('ordena escolas pela designação e mantém campos administrativos sem fonte vazios', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());

    assert.deepEqual(model.rows.map(row => row.designation), [431001, 431026]);
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
        modelApi.DOCUMENT_KEYS.map(key => ary[`qualidade_${key}`]),
        ['SIM', 'SIM', 'SIM', 'NÃO SE APLICA', 'SIM', 'SIM']
    );
    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => ary[`equidade_${key}`]),
        ['SIM', 'SIM', 'SIM', 'NÃO SE APLICA', 'SIM', 'SIM']
    );
    assert.deepEqual(ary.sourcePrograms, {
        BASIC: ['BASIC'],
        QUALIDADE: ['CONECTADA'],
        EQUIDADE: ['RECURSOS']
    });
    assert.equal(ary.basic_systematic, 'SIM');
    assert.equal(ary.qualidade_systematic, 'SIM');
    assert.equal(ary.equidade_systematic, 'SIM');
    assert.equal(ary.status, 'INAPTA');
});

test('agrega programas da conta e faz NÃO prevalecer sobre SIM ou N/A', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());
    const herbert = model.rows[1];

    assert.deepEqual(herbert.sourcePrograms.QUALIDADE, ['CONECTADA', 'PROEC']);
    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => herbert[`qualidade_${key}`]),
        ['NÃO', 'SIM', 'SIM', 'SIM', 'SIM', 'SIM']
    );
    assert.equal(modelApi.aggregateSmeValues(['Não se aplica', 'Sim']), 'SIM');
    assert.equal(modelApi.aggregateSmeValues(['Sim', 'Não']), 'NÃO');
    assert.equal(herbert.status, 'INAPTA');
});

test('deixa vazio o bloco de conta sem programa consolidado', () => {
    const model = modelApi.buildSmeMonthlyModel(fixture());
    const herbert = model.rows[1];

    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => herbert[`equidade_${key}`]),
        ['', '', '', '', '', '']
    );
    assert.equal(herbert.equidade_systematic, '');
    assert.equal(model.diagnostics.schoolCount, 2);
});

test('bloqueia geração quando não há escolas carregadas', () => {
    assert.throws(
        () => modelApi.buildSmeMonthlyModel({ ...fixture(), escolas: [] }),
        error => error?.code === 'NO_SME_SCHOOLS'
    );
});
