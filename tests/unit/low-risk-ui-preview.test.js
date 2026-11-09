'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function buttonById(id) {
    const candidate = html.match(new RegExp('<button\\b[^>]*id="' + id + '"[^>]*>[\\s\\S]*?<\\/button>'));
    assert.ok(candidate, 'Botão ausente: ' + id);
    return candidate[0];
}

function inputById(id) {
    const candidate = html.match(new RegExp('<input\\b[^>]*id="' + id + '"[^>]*>'));
    assert.ok(candidate, 'Campo ausente: ' + id);
    return candidate[0];
}

test('Dashboard trata controlador, R.A., competência e aba da carteira como texto, não HTML', () => {
    const start = app.indexOf('function renderDashboardControlador(container)');
    const end = app.indexOf('function renderDashboardAssistente(', start);
    assert.ok(start >= 0 && end > start);
    const source = app.slice(start, end);
    for (const fragment of [
        'escapeHtml(activeControladorName)',
        'escapeHtml(carteiraRAText)',
        'escapeHtml(activeCompetenciaLabel)',
        "escapeHtml(activeControladorName.split(' ')[0])"
    ]) {
        assert.ok(source.includes(fragment), 'Interpolação sem escape esperado: ' + fragment);
    }
});

test('Alertas e troca de perfil usam encerramento canônico do Floating UI', () => {
    const alertHandler = app.slice(app.indexOf('function handleAlertClick('), app.indexOf('function openSchoolTimeline('));
    const profileHandler = app.slice(app.indexOf('function switchProfile('), app.indexOf('function resetContentAreaScroll('));
    assert.match(alertHandler, /__radarFloatingUIController\?\.closeFloating\?\.\('alerts'\)/);
    assert.match(profileHandler, /__radarFloatingUIController\?\.closeFloating\?\.\('profile'\)/);
});

test('Controles de tema, alertas e perfil têm nomes e ícones decorativos acessíveis', () => {
    const theme = buttonById('theme-toggle-btn');
    assert.match(theme, /type="button"/);
    assert.match(theme, /aria-label="[^"]+"/);
    assert.match(theme, /<svg[^>]*aria-hidden="true"/);
    const bell = html.match(/<button class="bell-button"[^>]*onclick="toggleAlertsDropdown\(event\)"[^>]*>[\s\S]*?<\/button>/)?.[0];
    assert.ok(bell, 'Botão de alertas ausente');
    assert.match(bell, /aria-label="[^"]+"/);
    assert.match(bell, /type="button"/);
    assert.match(bell, /<svg[^>]*aria-hidden="true"/);
    const profile = html.match(/<button class="profile-button"[^>]*>[\s\S]*?<\/button>/)?.[0];
    assert.ok(profile, 'Botão de perfil ausente');
    assert.match(profile, /type="button"/);
    assert.match(profile, /<svg[^>]*aria-hidden="true"/);
    assert.match(app, /function updateThemeIcon\([\s\S]*?setAttribute\('aria-label'/);
    assert.match(app, /function updateAlertsBell\([\s\S]*?setAttribute\('aria-label'/);
});

test('Botões de fechar modais têm tipo e nome acessível no HTML inicial', () => {
    const closeButtons = [...html.matchAll(/<button\b[^>]*class="btn-close"[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]);
    assert.ok(closeButtons.length >= 10);
    for (const button of closeButtons) {
        assert.match(button, /type="button"/, 'Botão de fechar sem type');
        assert.match(button, /aria-label="[^"]+"/, 'Botão de fechar sem nome acessível');
    }
});

test('Campos telefônicos acionam teclado apropriado sem alterar a validação', () => {
    for (const id of [
        'edit-telefone-diretor',
        'edit-telefone-adjunto',
        'edit-telefone',
        'edit-celular-institucional'
    ]) {
        assert.match(inputById(id), /inputmode="tel"/, id);
    }
    assert.match(html, /<div class="search-bar-container">\s*<svg[^>]*aria-hidden="true"/);
});
