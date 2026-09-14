'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.resolve(__dirname, '../../app.js'), 'utf8');
const cssSource = fs.readFileSync(path.resolve(__dirname, '../../styles.css'), 'utf8');

test('Prontuário possui cabeçalho persistente e consulta cadastral sob demanda', () => {
    assert.match(appSource, /class="page-header prontuario-school-header"/);
    assert.match(appSource, /id="school-registration-details"[^>]*hidden/);
    assert.match(appSource, /aria-controls="school-registration-details"/);
    assert.match(appSource, /aria-expanded="false"/);
    assert.match(appSource, />Exibir dados da unidade</);
    assert.match(appSource, /function toggleSchoolRegistrationDetails/);
    assert.match(cssSource, /\.prontuario-school-header\s*\{[\s\S]*position:\s*sticky/);
    assert.match(cssSource, /\.prontuario-school-grid\s*\{[\s\S]*display:\s*block/);
    assert.match(cssSource, /#school-registration-details\[hidden\]\s*\{[\s\S]*display:\s*none\s*!important/);
});

test('dados existentes continuam presentes no painel cadastral', () => {
    assert.match(appSource, />Dados da unidade</);
    assert.match(appSource, /class="info-item school-data-item is-quarter"/);
    assert.match(appSource, /class="school-program-list"/);
    assert.match(appSource, />Programas Vinculados</);
});
