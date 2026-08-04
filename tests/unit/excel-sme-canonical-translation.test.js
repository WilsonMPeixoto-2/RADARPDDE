'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modelApi = require('../../src/domain/excel-sme-export-model.js');

const ORIGINAL_HEADERS = Object.freeze([
    'CRE',
    '',
    'DESIGNAÇÃO',
    'ESCOLA',
    'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                 BÁSICO',
    ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               BÁSICO',
    'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)               BÁSICO',
    'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)           BÁSICO',
    'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 BÁSICO',
    'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               BÁSICO',
    'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                QUALIDADE',
    ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               QUALIDADE',
    'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              QUALIDADE',
    'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          QUALIDADE',
    'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 QUALIDADE',
    'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               QUALIDADE',
    'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                EQUIDADE',
    ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               EQUIDADE',
    'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              EQUIDADE',
    'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          EQUIDADE',
    'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 EQUIDADE',
    'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               EQUIDADE',
    'STATUS',
    'DATA DA ENTREGA DE DOCUMENTOS',
    'DATA DA CORREÇÃO DOS DOCUMENTOS ENVIADOS',
    'PARECER               (CORREÇÃO MENSAL DA PRESTAÇÃO DE CONTAS)',
    'OBSERVAÇÕES'
]);

function complete(overrides = {}) {
    return {
        extCC: 'Sim',
        extINV: 'Sim',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica',
        ...overrides
    };
}

function state() {
    return {
        activeCompetenciaKey: '2026-12',
        escolas: [
            {
                id: 'partial',
                designação: '04.31.001',
                denominação: 'Escola Municipal Parcial',
                cre: '4ª CRE',
                programasIds: ['BASIC', 'CONECTADA', 'PROEC', 'RECURSOS']
            },
            {
                id: 'inapta',
                designação: '04.31.002',
                denominação: 'Escola Municipal Inapta',
                cre: '4ª CRE',
                programasIds: ['BASIC']
            },
            {
                id: 'apta',
                designação: '04.31.003',
                denominação: 'Escola Municipal Apta',
                cre: '4ª CRE',
                programasIds: ['BASIC']
            }
        ],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' },
            { id: 'PROEC', name: 'Programa Escola e Comunidade' },
            { id: 'RECURSOS', name: 'Sala de Recursos' }
        ],
        verificacoes: {
            partial: {
                '2026-12_BASIC': {
                    bonificacao: complete(),
                    resultadoBonif: 'inapta'
                },
                '2026-12_CONECTADA': {
                    bonificacao: complete({ notaFiscal: 'Sim' }),
                    resultadoBonif: 'apta'
                },
                '2026-12_PROEC': {
                    bonificacao: { extCC: 'Não' },
                    resultadoBonif: ''
                }
            },
            inapta: {
                '2026-12_BASIC': {
                    bonificacao: complete({ extCC: 'Não' }),
                    resultadoBonif: 'apta'
                }
            },
            apta: {
                '2026-12_BASIC': {
                    bonificacao: complete(),
                    resultadoBonif: 'inapta'
                }
            }
        }
    };
}

test('preserva literalmente as vinte e sete colunas do arquivo original', () => {
    const model = modelApi.buildSmeMonthlyModel(state());

    assert.equal(model.columns.length, 27);
    assert.deepEqual(model.columns.map(column => column.label), ORIGINAL_HEADERS);
    assert.equal(model.columns[0].mergeAcross, 2);
    assert.equal(model.columns.some(column => column.label === 'SISTEMÁTICA PREENCHIDA'), false);
});

test('mantém lançamentos parciais e traduz campos ausentes sem inventar valores', () => {
    const row = modelApi.buildSmeMonthlyModel(state()).rows[0];

    assert.deepEqual(
        modelApi.DOCUMENT_KEYS.map(key => row[`qualidade_${key}`]),
        ['NÃO', 'SIM', 'SIM', 'NÃO SE APLICA', 'SIM', 'NÃO SE APLICA']
    );
    assert.equal(Object.hasOwn(row, 'basic_systematic'), false);
    assert.equal(Object.hasOwn(row, 'qualidade_systematic'), false);
    assert.equal(Object.hasOwn(row, 'equidade_systematic'), false);
    assert.deepEqual(
        [row.deliveryDate, row.correctionDate, row.opinion, row.notes],
        ['', '', '', '']
    );
});

test('usa a avaliação canônica do RADAR para APTA, INAPTA e resultado ainda indeterminado', () => {
    const rows = modelApi.buildSmeMonthlyModel(state()).rows;
    const byDesignation = Object.fromEntries(rows.map(row => [row.designation, row]));

    assert.equal(byDesignation['04.31.001'].status, '');
    assert.equal(byDesignation['04.31.002'].status, 'INAPTA');
    assert.equal(byDesignation['04.31.003'].status, 'APTA');
});

test('mantém programas vinculados sem lançamento fora do resultado consolidado', () => {
    const row = modelApi.buildSmeMonthlyModel(state()).rows[0];

    assert.deepEqual(row.sourcePrograms.BASIC, ['BASIC']);
    assert.deepEqual(row.sourcePrograms.QUALIDADE, ['CONECTADA', 'PROEC']);
    assert.deepEqual(row.sourcePrograms.EQUIDADE, ['RECURSOS']);
    assert.equal(row.status, '');
});
