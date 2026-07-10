'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildStatisticsSnapshot,
    calculateProgramStats,
    calculateRate,
    calculateSchoolStats,
    normalizeStatus,
    summarizeStatuses
} = require('../src/domain/estatisticas.js');

test('normaliza os rótulos usados atualmente sem misturar unidades de análise', () => {
    assert.equal(normalizeStatus('apto'), 'apta');
    assert.equal(normalizeStatus('inapta'), 'inapta');
    assert.equal(normalizeStatus('em-andamento'), 'emAndamento');
    assert.equal(normalizeStatus('naoAnalisado'), 'naoAnalisada');
    assert.equal(normalizeStatus('fora-escopo'), 'foraEscopo');
    assert.equal(normalizeStatus('desconhecido'), null);
});

test('calcula percentuais com arredondamento estável e proteção contra divisão por zero', () => {
    assert.equal(calculateRate(1, 3), 33.33);
    assert.equal(calculateRate(2, 4), 50);
    assert.equal(calculateRate(1, 0), 0);
    assert.equal(calculateRate(Number.NaN, 10), 0);
});

test('resume situações e exclui fora de escopo do denominador operacional', () => {
    const result = summarizeStatuses([
        { status: 'apta' },
        { status: 'inapta' },
        { status: 'emAndamento' },
        { status: 'naoAnalisada' },
        { status: 'foraEscopo' }
    ]);

    assert.deepEqual(result, {
        apta: 1,
        inapta: 1,
        emAndamento: 1,
        naoAnalisada: 1,
        foraEscopo: 1,
        total: 5,
        activeTotal: 4,
        rates: {
            apta: 25,
            inapta: 25,
            emAndamento: 25,
            naoAnalisada: 25,
            foraEscopo: 20
        }
    });
});

test('ignora registros sem situação reconhecida em vez de alterar o denominador', () => {
    const result = summarizeStatuses([
        { status: 'apta' },
        { status: '' },
        { status: null },
        { status: 'situação futura' }
    ]);

    assert.equal(result.apta, 1);
    assert.equal(result.total, 1);
    assert.equal(result.activeTotal, 1);
    assert.equal(result.rates.apta, 100);
});

test('aceita seletor de situação sem conhecer a estrutura interna do registro', () => {
    const result = summarizeStatuses([
        { situacaoCalculada: 'apto' },
        { situacaoCalculada: 'inapto' }
    ], {
        getStatus: item => item.situacaoCalculada
    });

    assert.equal(result.apta, 1);
    assert.equal(result.inapta, 1);
    assert.equal(result.total, 2);
});

test('mantém estatísticas de escolas e programas em objetos independentes', () => {
    const schoolStats = calculateSchoolStats([
        { status: 'apta' },
        { status: 'inapta' },
        { status: 'foraEscopo' }
    ]);
    const programStats = calculateProgramStats([
        { status: 'apta' },
        { status: 'apta' },
        { status: 'emAndamento' },
        { status: 'naoAnalisada' }
    ]);

    assert.equal(schoolStats.total, 3);
    assert.equal(schoolStats.activeTotal, 2);
    assert.equal(programStats.total, 4);
    assert.equal(programStats.apta, 2);
    assert.equal(programStats.rates.apta, 50);
});

test('gera snapshot explícito sem somar escolas e programas no mesmo total', () => {
    const snapshot = buildStatisticsSnapshot({
        schools: [
            { status: 'apta' },
            { status: 'inapta' }
        ],
        programRecords: [
            { status: 'apta' },
            { status: 'apta' },
            { status: 'emAndamento' }
        ]
    });

    assert.equal(snapshot.schools.total, 2);
    assert.equal(snapshot.programs.total, 3);
    assert.equal(snapshot.schools.apta, 1);
    assert.equal(snapshot.programs.apta, 2);
});

test('retorna estrutura vazia previsível para entradas ausentes', () => {
    const snapshot = buildStatisticsSnapshot();

    assert.equal(snapshot.schools.total, 0);
    assert.equal(snapshot.schools.activeTotal, 0);
    assert.equal(snapshot.programs.total, 0);
    assert.equal(snapshot.programs.rates.apta, 0);
});
