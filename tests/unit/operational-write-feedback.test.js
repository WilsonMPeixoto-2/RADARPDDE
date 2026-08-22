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

test('feedback converte valores de análise técnica para a classe visual canônica', () => {
    const feedback = require(modulePath);

    assert.equal(feedback.analysisStateClass('Não analisado'), 'analise-não-analisado');
    assert.equal(feedback.analysisStateClass('Correto'), 'analise-correto');
    assert.equal(feedback.analysisStateClass('Correto (Atrasado)'), 'analise-correto-atrasado');
    assert.equal(feedback.analysisStateClass('Incorreto'), 'analise-incorreto');
});

test('settlePending remove estado de gravação sem destruir o controle', () => {
    const feedback = require(modulePath);
    const classes = new Set(['radar-write-pending', 'btn-group-toggle']);
    const attributes = new Map([['aria-busy', 'true']]);
    const control = {
        classList: {
            remove: name => classes.delete(name),
            contains: name => classes.has(name)
        },
        dataset: { radarWritePending: 'true' },
        removeAttribute: name => attributes.delete(name)
    };

    assert.equal(feedback.settlePending(control), true);
    assert.equal(classes.has('radar-write-pending'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(control.dataset, 'radarWritePending'), false);
    assert.equal(attributes.has('aria-busy'), false);
    assert.equal(classes.has('btn-group-toggle'), true);
});
