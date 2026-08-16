'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fluxo = require('../../src/domain/fluxo-operacional.js');

test('ignora despesa a identificar ao verificar existência de Nota Fiscal válida', () => {
    assert.equal(fluxo.shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Correto',
        fiscalNotes: [{ tipo: 'a_identificar', numero: '' }]
    }), true);
});
