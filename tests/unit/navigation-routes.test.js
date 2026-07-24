'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    parseRoute,
    buildRoute,
    normalizeRoute
} = require('../../src/integration/navigation-routes.js');

const staticCases = [
    ['/dashboard', 'dashboard'],
    ['/carteira', 'escolas'],
    ['/competencias', 'competencias'],
    ['/pendencias', 'pendencias'],
    ['/inventario', 'inventario'],
    ['/auditoria', 'auditoria'],
    ['/equipe', 'equipe'],
    ['/gestao-sme', 'sme-config']
];

test('interpreta as rotas estáticas aprovadas', () => {
    for (const [pathname, view] of staticCases) {
        assert.deepEqual(parseRoute(pathname, ''), {
            valid: true,
            view,
            param: null,
            section: null,
            filters: {},
            canonicalPath: pathname
        });
    }
});

test('interpreta a raiz e barras finais usando a forma canônica', () => {
    assert.deepEqual(parseRoute('/', ''), {
        valid: true,
        view: 'dashboard',
        param: null,
        section: null,
        filters: {},
        canonicalPath: '/dashboard'
    });
    assert.equal(parseRoute('/carteira/', '').canonicalPath, '/carteira');
    assert.equal(parseRoute('/escolas/04.31.026/', '').canonicalPath, '/escolas/04.31.026');
});

test('interpreta prontuário e seção de pendências por escola', () => {
    assert.deepEqual(parseRoute('/escolas/04.31.026', ''), {
        valid: true,
        view: 'prontuario',
        param: '04.31.026',
        section: null,
        filters: {},
        canonicalPath: '/escolas/04.31.026'
    });
    assert.deepEqual(parseRoute('/escolas/04.31.026/pendencias', ''), {
        valid: true,
        view: 'prontuario',
        param: '04.31.026',
        section: 'pendencias',
        filters: {},
        canonicalPath: '/escolas/04.31.026/pendencias'
    });
});

test('decodifica e recodifica identificadores de escola com segurança', () => {
    const parsed = parseRoute('/escolas/04.31.026%20A', '');
    assert.equal(parsed.param, '04.31.026 A');
    assert.equal(parsed.canonicalPath, '/escolas/04.31.026%20A');
    assert.equal(buildRoute(parsed), '/escolas/04.31.026%20A');
});

test('preserva somente o filtro suportado na tela geral de pendências', () => {
    assert.deepEqual(parseRoute('/pendencias', '?escola=04.31.026&ignorar=1'), {
        valid: true,
        view: 'pendencias',
        param: null,
        section: null,
        filters: { escola: '04.31.026' },
        canonicalPath: '/pendencias?escola=04.31.026'
    });
    assert.equal(buildRoute({
        view: 'pendencias',
        filters: { escola: '04.31.026' }
    }), '/pendencias?escola=04.31.026');
});

test('gera as URLs canônicas a partir do estado interno', () => {
    for (const [pathname, view] of staticCases) {
        assert.equal(buildRoute({ view }), pathname);
    }
    assert.equal(buildRoute({ view: 'prontuario', param: '04.31.026' }), '/escolas/04.31.026');
    assert.equal(buildRoute({
        view: 'prontuario',
        param: '04.31.026',
        section: 'pendencias'
    }), '/escolas/04.31.026/pendencias');
});

test('rejeita caminhos desconhecidos ou incompletos', () => {
    for (const pathname of [
        '/desconhecida',
        '/escolas',
        '/escolas/',
        '/escolas/04.31.026/extra',
        '/escolas/04.31.026/pendencias/extra'
    ]) {
        const route = parseRoute(pathname, '');
        assert.equal(route.valid, false, pathname);
        assert.equal(normalizeRoute(route).canonicalPath, '/dashboard');
        assert.equal(buildRoute(normalizeRoute(route)), '/dashboard');
    }
});

test('normaliza estado incompleto ou inválido para o dashboard', () => {
    assert.deepEqual(normalizeRoute(null), {
        valid: true,
        view: 'dashboard',
        param: null,
        section: null,
        filters: {},
        canonicalPath: '/dashboard'
    });
    assert.equal(buildRoute({ view: 'inexistente' }), '/dashboard');
    assert.equal(buildRoute({ view: 'prontuario', param: '' }), '/dashboard');
});
