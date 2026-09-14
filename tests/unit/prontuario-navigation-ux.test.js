'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.resolve(__dirname, '../../app.js'), 'utf8');
const cssSource = fs.readFileSync(path.resolve(__dirname, '../../styles.css'), 'utf8');

test('Prontuário oferece navegação para a próxima unidade preservando a competência', () => {
    assert.match(appSource, /function\s+getNextProntuarioSchool\s*\(/);
    assert.match(appSource, /function\s+navigateToNextProntuarioSchool\s*\(/);
    assert.match(appSource, /Próxima unidade/);
    assert.match(appSource, /const\s+preservedCompetence\s*=\s*activeProntuarioCompetencia/);
    assert.match(appSource, /activeProntuarioCompetencia\s*=\s*preservedCompetence/);
});

test('controle cadastral fica junto das ações da unidade e recebe maior destaque', () => {
    assert.match(appSource, /class="prontuario-actions"[\s\S]*Editar Dados[\s\S]*prontuario-data-toggle/);
    assert.match(appSource, /prontuario-data-toggle[\s\S]*Exibir dados da unidade/);
    assert.match(cssSource, /\.prontuario-data-toggle\s*\{[\s\S]*background:/);
});

test('sidebar clara ganha tratamento escuro com contraste próprio', () => {
    assert.match(cssSource, /body:not\(\.dark-theme\)\s+aside\.sidebar\s*\{[\s\S]*background:/);
    assert.match(cssSource, /body:not\(\.dark-theme\)\s+aside\.sidebar\s+\.nav-item\s*\{[\s\S]*color:/);
});
