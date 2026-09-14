'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.resolve(__dirname, '../../app.js'), 'utf8');
const cssSource = fs.readFileSync(path.resolve(__dirname, '../../styles.css'), 'utf8');
const extensionsSource = fs.readFileSync(path.resolve(__dirname, '../../src/integration/product-extensions-bootstrap.js'), 'utf8');
const polishCssPath = path.resolve(__dirname, '../../src/styles/sidebar-prontuario-polish.css');

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

test('camada corretiva é carregada por último entre os estilos de produto', () => {
    assert.match(
        extensionsSource,
        /'\/src\/styles\/evaluation-retification-ui\.css',[\s\S]*'\/src\/styles\/sidebar-prontuario-polish\.css'/
    );
});

test('sidebar ganha identidade escura viva sem contraste híbrido no Dashboard', () => {
    assert.equal(fs.existsSync(polishCssPath), true);
    const polishCss = fs.readFileSync(polishCssPath, 'utf8');
    assert.match(
        polishCss,
        /body:not\(\.dark-theme\)\s+aside\.sidebar\s*\{[\s\S]*linear-gradient\(180deg,[\s\S]*#2a0f5f[\s\S]*#160b35/
    );
    assert.match(
        polishCss,
        /body\.radar-expressiva-institucional:not\(\.dark-theme\)\s+aside\.sidebar\s*\{[\s\S]*background:/
    );
    assert.match(
        polishCss,
        /aside\.sidebar::before\s*\{[\s\S]*border-top:/
    );
    assert.match(
        polishCss,
        /\.nav-item\.active[\s\S]*\{[\s\S]*background:\s*linear-gradient[\s\S]*box-shadow:/
    );
});

test('cabeçalho do Prontuário mantém título central e ações simétricas', () => {
    assert.equal(fs.existsSync(polishCssPath), true);
    const polishCss = fs.readFileSync(polishCssPath, 'utf8');
    assert.match(
        polishCss,
        /\.prontuario-school-header\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*2\.4fr\)\s+minmax\(0,\s*1fr\)/
    );
    assert.match(
        polishCss,
        /\.prontuario-school-header\s+\.page-title\s*\{[\s\S]*grid-column:\s*2;[\s\S]*text-align:\s*center/
    );
    assert.match(
        polishCss,
        /\.prontuario-school-header\s+\.prontuario-actions\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1;[\s\S]*justify-content:\s*center/
    );
    assert.match(
        polishCss,
        /\.prontuario-school-header\s+\.prontuario-next-school\s*\{[\s\S]*grid-column:\s*3;[\s\S]*justify-self:\s*end/
    );
});
