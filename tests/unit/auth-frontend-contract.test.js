'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');

test('frontend inclui gate acessível, logout e scripts de autenticação em ordem segura', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const requiredIds = [
        'radar-auth-gate',
        'radar-auth-form',
        'radar-auth-email',
        'radar-auth-password',
        'radar-auth-status',
        'auth-logout-button'
    ];
    requiredIds.forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`)));
    assert.match(html, /aria-live=["']polite["']/);
    assert.match(html, /autocomplete=["']username["']/);
    assert.match(html, /autocomplete=["']current-password["']/);

    const contractIndex = html.indexOf('src/data/repository-contract.js');
    const sessionIndex = html.indexOf('src/auth/session-service.js');
    const bootstrapIndex = html.indexOf('src/integration/auth-bootstrap.js');
    const appIndex = html.indexOf('app.js');
    const gateIndex = html.indexOf('src/integration/auth-gate.js');
    assert.ok(contractIndex < sessionIndex);
    assert.ok(sessionIndex < bootstrapIndex);
    assert.ok(bootstrapIndex < appIndex);
    assert.ok(appIndex < gateIndex);
});

test('markup inicial oculta o formulário até a restauração da sessão ser concluída', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const formTag = html.match(/<form\b[^>]*id=["']radar-auth-form["'][^>]*>/i)?.[0] || '';

    assert.match(formTag, /\shidden(?:\s|>)/i);
    assert.match(formTag, /aria-hidden=["']true["']/i);
    assert.match(
        html,
        /id=["']radar-auth-description["'][^>]*>\s*Verificando[^<]*sessão/i
    );
});

test('bootstrap principal aplica identidade remota sem expor sessão no contexto público', () => {
    const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
    assert.match(app, /RadarAuthBootstrap\.prepareAuthenticatedClient/);
    assert.match(app, /authentication:\s*authentication/);
    assert.match(app, /RadarAuthGate\.applyAuthorization/);
    assert.doesNotMatch(app, /RadarDataContext[\s\S]{0,500}session\s*:/);
});
