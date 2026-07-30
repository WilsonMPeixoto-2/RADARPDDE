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
    'SISTEMÁTICA PREENCHIDA',
    'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                QUALIDADE',
    ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               QUALIDADE',
    'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              QUALIDADE',
    'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          QUALIDADE',
    'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 QUALIDADE',
    'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               QUALIDADE',
    'SISTEMÁTICA PREENCHIDA',
    'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                EQUIDADE',
    ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               EQUIDADE',
    'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              EQUIDADE',
    'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          EQUIDADE',
    'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 EQUIDADE',
    'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               EQUIDADE',
    'SISTEMÁTICA PREENCHIDA',
    'STATUS',
    'DATA DA ENTREGA DE DOCUMENTOS',
    'DATA DA CORREÇÃO DOS DOCUMENTOS ENVIADOS',
    'PARECER               (CORREÇÃO MENSAL DA PRESTAÇÃO DE CONTAS)',
    'OBSERVAÇÕES'
]);

function fixture() {
    return {
        activeCompetenciaKey: '2026-12',
        escolas: [{
            id: 'school-1',
            designação: '04.31.001',
            denominação: 'Escola Municipal Ary Barroso',
            cre: '4ª CRE',
            programasIds: ['BASIC', 'CONECTADA']
        }],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
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
                    resultadoBonif: 'apta'
                },
                '2026-12_CONECTADA': {
                    bonificacao: {
                        extCC: 'Não',
                        extINV: 'Sim',
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Sim'
                    },
                    resultadoBonif: 'inapta'
                }
            }
        }
    };
}

test('preserva literalmente os trinta cabeçalhos do modelo original da SME', () => {
    const columns = modelApi.buildColumns();
    assert.equal(columns.length, 30);
    assert.deepEqual(columns.map(column => column.label), ORIGINAL_HEADERS);
    assert.equal(columns[0].mergeAcross, 2);
});

test('preserva a estrutura original e projeta somente dados canônicos do RADAR', () => {
    const row = modelApi.buildSmeMonthlyModel(fixture()).rows[0];

    assert.equal(row.order, 1);
    assert.equal(row.cre, '4ª');
    assert.equal(row.designation, 431001);
    assert.equal(row.denomination, 'ESCOLA MUNICIPAL ARY BARROSO');
    assert.equal(row.basic_systematic, 'SIM');
    assert.equal(row.qualidade_systematic, 'SIM');
    assert.equal(row.equidade_systematic, '');
    assert.equal(row.status, 'INAPTA');
    assert.deepEqual(
        [row.deliveryDate, row.correctionDate, row.opinion, row.notes],
        ['', '', '', '']
    );
});
