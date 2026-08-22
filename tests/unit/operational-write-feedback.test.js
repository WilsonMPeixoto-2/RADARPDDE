'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(
    __dirname,
    '../../src/integration/operational-write-feedback.js'
);

test('módulo de feedback imediato classifica valores da avaliação mensal', () => {
    assert.equal(
        fs.existsSync(modulePath),
        true,
        'O feedback imediato dos lançamentos inline ainda não foi implementado.'
    );
    const feedback = require(modulePath);
    assert.equal(feedback.bonificationActiveClass('Sim'), 'active-sim');
    assert.equal(feedback.bonificationActiveClass('Não'), 'active-nao');
    assert.equal(feedback.bonificationActiveClass('Não se aplica'), 'active-naoseaplica');
    assert.equal(feedback.bonificationActiveClass(''), '');
});

test('feedback reconhece somente controles inline de gravação operacional', () => {
    assert.equal(fs.existsSync(modulePath), true);
    const feedback = require(modulePath);

    assert.equal(feedback.inlineOperationFromHandler("toggleBonif('04.10.001','2026-08_BASIC','extCC','Sim')"), 'bonification');
    assert.equal(feedback.inlineOperationFromHandler("toggleConsEnviada('04.10.001','2026-08_BASIC',this.checked)"), 'write');
    assert.equal(feedback.inlineOperationFromHandler("changeAnaliseTecnica('04.10.001','2026-08_BASIC','extCC',this.value,this)"), 'write');
    assert.equal(feedback.inlineOperationFromHandler("switchView('dashboard')"), '');
});
