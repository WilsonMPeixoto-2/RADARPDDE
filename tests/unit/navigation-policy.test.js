'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    resolveAuthorizedRoute
} = require('../../src/integration/navigation-policy.js');

const schools = [
    { id: '04.31.026', denominação: 'EM Herbert Moses' },
    { id: '04.31.018', denominação: 'EM República do Líbano' }
];

function resolve(route, profile = 'controlador') {
    return resolveAuthorizedRoute(route, { profile, schools });
}

test('mantém rotas permitidas e escolas visíveis', () => {
    assert.deepEqual(resolve({
        valid: true,
        view: 'prontuario',
        param: '04.31.026',
        section: 'pendencias',
        filters: {}
    }), {
        valid: true,
        view: 'prontuario',
        param: '04.31.026',
        section: 'pendencias',
        filters: {},
        canonicalPath: '/escolas/04.31.026/pendencias'
    });
});

test('envia escola inexistente ou fora do escopo para a carteira', () => {
    assert.equal(resolve({
        valid: true,
        view: 'prontuario',
        param: '04.31.999',
        filters: {}
    }).view, 'escolas');
    assert.equal(resolve({
        valid: true,
        view: 'pendencias',
        filters: { escola: '04.31.999' }
    }).view, 'escolas');
});

test('restringe rotas por perfil operacional', () => {
    assert.equal(resolve({ valid: true, view: 'sme-config' }, 'controlador').view, 'dashboard');
    assert.equal(resolve({ valid: true, view: 'sme-config' }, 'sme').view, 'sme-config');
    assert.equal(resolve({ valid: true, view: 'equipe' }, 'controlador').view, 'dashboard');
    assert.equal(resolve({ valid: true, view: 'equipe' }, 'assistente').view, 'equipe');

    for (const view of ['competencias', 'pendencias', 'auditoria']) {
        assert.equal(resolve({ valid: true, view }, 'inventario').view, 'dashboard');
    }
});

test('remove a seção de pendências do prontuário para perfis sem essa aba', () => {
    for (const profile of ['inventario', 'sme']) {
        const route = resolve({
            valid: true,
            view: 'prontuario',
            param: '04.31.026',
            section: 'pendencias',
            filters: {}
        }, profile);
        assert.equal(route.view, 'prontuario');
        assert.equal(route.section, null);
        assert.equal(route.canonicalPath, '/escolas/04.31.026');
    }
});

test('preserva filtro válido de escola na tela geral de pendências', () => {
    assert.deepEqual(resolve({
        valid: true,
        view: 'pendencias',
        filters: { escola: '04.31.018' }
    }), {
        valid: true,
        view: 'pendencias',
        param: null,
        section: null,
        filters: { escola: '04.31.018' },
        canonicalPath: '/pendencias?escola=04.31.018'
    });
});
