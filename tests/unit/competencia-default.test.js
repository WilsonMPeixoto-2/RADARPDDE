'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const competencia = require('../../src/domain/competencia.js');

test('competência operacional padrão usa o mês imediatamente anterior', () => {
    assert.equal(
        competencia.previousCompetenceKeyFromDate(new Date('2026-09-14T12:00:00')),
        '2026-08'
    );
});

test('competência operacional padrão atravessa a virada do ano', () => {
    assert.equal(
        competencia.previousCompetenceKeyFromDate(new Date('2026-01-10T12:00:00')),
        '2025-12'
    );
});

test('competência operacional padrão rejeita data inválida', () => {
    assert.throws(
        () => competencia.previousCompetenceKeyFromDate('não-é-data'),
        /data de referência da competência é inválida/i
    );
});
