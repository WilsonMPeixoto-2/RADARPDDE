'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    compareCompetencias,
    formatCompetencia,
    formatCompetenciaContext,
    getBaseCompetenciaKey,
    isCompetenciaInRange,
    isValidCompetenciaKey,
    parseCompetencia,
    splitCompetenciaContext
} = require('../src/domain/competencia.js');

test('valida competências no padrão ISO mensal', () => {
    assert.equal(isValidCompetenciaKey('2026-01'), true);
    assert.equal(isValidCompetenciaKey('2026-12'), true);
    assert.equal(isValidCompetenciaKey('2026-00'), false);
    assert.equal(isValidCompetenciaKey('2026-13'), false);
    assert.equal(isValidCompetenciaKey('05/2026'), false);
    assert.equal(isValidCompetenciaKey(''), false);
});

test('aceita chave composta e preserva o contexto', () => {
    assert.equal(getBaseCompetenciaKey('2026-05_BASIC'), '2026-05');
    assert.deepEqual(splitCompetenciaContext('2026-05_BASIC'), {
        raw: '2026-05_BASIC',
        competenciaKey: '2026-05',
        contextId: 'BASIC'
    });
});

test('converte competência válida em estrutura ordenável', () => {
    assert.deepEqual(parseCompetencia('2026-05'), {
        key: '2026-05',
        year: 2026,
        month: '05',
        monthNumber: 5,
        monthName: 'Maio',
        sortValue: 202605
    });
    assert.equal(parseCompetencia('2026-13'), null);
});

test('formata a competência em todos os formatos canônicos', () => {
    assert.equal(formatCompetencia('2026-05'), 'Maio/2026');
    assert.equal(formatCompetencia('2026-05', 'numeric'), '05/2026');
    assert.equal(formatCompetencia('2026-05', 'long'), 'Maio de 2026');
    assert.equal(formatCompetencia('2026-05', 'iso'), '2026-05');
    assert.equal(formatCompetencia('2026-05', 'filename'), '2026-05');
    assert.equal(formatCompetencia('2026-05', 'compactFilename'), '2026_05');
});

test('mantém valor inválido como fallback seguro por padrão', () => {
    assert.equal(formatCompetencia('competência desconhecida'), 'competência desconhecida');
    assert.equal(formatCompetencia(null), '');
    assert.equal(formatCompetencia('x', 'display', { fallback: 'Não informada' }), 'Não informada');
    assert.throws(
        () => formatCompetencia('x', 'display', { strict: true }),
        /Competência inválida/
    );
});

test('formata chave composta com rótulo de programa resolvido externamente', () => {
    const result = formatCompetenciaContext('2026-05_BASIC', {
        resolveContextLabel: id => ({ BASIC: 'PDDE Básico' })[id]
    });

    assert.equal(result, 'Maio/2026 - PDDE Básico');
});

test('compara competências sem depender de comparação textual acidental', () => {
    assert.equal(compareCompetencias('2026-04', '2026-05'), -1);
    assert.equal(compareCompetencias('2026-05', '2026-05'), 0);
    assert.equal(compareCompetencias('2027-01', '2026-12'), 1);
    assert.throws(() => compareCompetencias('05/2026', '2026-05'), /padrão YYYY-MM/);
});

test('avalia intervalos inclusivos com limites opcionais', () => {
    assert.equal(isCompetenciaInRange('2026-05', '2026-04', '2026-06'), true);
    assert.equal(isCompetenciaInRange('2026-04', '2026-04', '2026-06'), true);
    assert.equal(isCompetenciaInRange('2026-06', '2026-04', '2026-06'), true);
    assert.equal(isCompetenciaInRange('2026-03', '2026-04', '2026-06'), false);
    assert.equal(isCompetenciaInRange('2026-07', '2026-04', '2026-06'), false);
    assert.equal(isCompetenciaInRange('2026-07', '2026-04'), true);
    assert.equal(isCompetenciaInRange('2026-03', null, '2026-06'), true);
    assert.throws(
        () => isCompetenciaInRange('2026-05', '2026-06', '2026-04'),
        /inicial não pode ser posterior/
    );
});
