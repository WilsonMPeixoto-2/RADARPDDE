'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.resolve(__dirname, '../../app.js'), 'utf8');

test('Prontuário mantém acesso explícito à Pendência fiscal agregada legada preservada', () => {
    assert.match(appSource, /activeLegacyInvoicePendencies/);
    assert.match(appSource, /Visualizar pendência legada/);
    assert.match(appSource, /Pendência legada de Notas Fiscais/);
    assert.match(appSource, /Registro agregado anterior à individualização/);
});
