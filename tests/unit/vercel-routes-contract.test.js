'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');

test('Vercel reescreve as rotas canônicas aprovadas para a raiz SPA', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const rewrites = config.rewrites || [];
    const applicationRewrites = rewrites.filter(item => item.destination === '/');
    const expectedSources = [
        '/dashboard',
        '/carteira',
        '/competencias',
        '/pendencias',
        '/inventario',
        '/auditoria',
        '/equipe',
        '/gestao-sme',
        '/escolas/:path*'
    ];

    assert.equal(config.cleanUrls, true);
    assert.deepEqual(applicationRewrites.map(item => item.source), expectedSources);
    assert.equal(config.git?.deploymentEnabled, true);
    assert.equal(rewrites.some(item => item.source === '/(.*)'), false);
});

test('URLs profundas de escola preservam os recursos relativos do index', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const rewrites = config.rewrites || [];
    const assetRewrites = new Map(rewrites
        .filter(item => item.destination !== '/')
        .map(item => [item.source, item.destination]));

    const expected = new Map([
        ['/escolas/src/:path*', '/src/:path*'],
        ['/escolas/vendor/:path*', '/vendor/:path*'],
        ['/escolas/styles.css', '/styles.css'],
        ['/escolas/app.js', '/app.js'],
        ['/escolas/config.js', '/config.js'],
        ['/escolas/config.runtime.js', '/config.runtime.js'],
        ['/escolas/:schoolId/src/:path*', '/src/:path*'],
        ['/escolas/:schoolId/vendor/:path*', '/vendor/:path*'],
        ['/escolas/:schoolId/styles.css', '/styles.css'],
        ['/escolas/:schoolId/app.js', '/app.js'],
        ['/escolas/:schoolId/config.js', '/config.js'],
        ['/escolas/:schoolId/config.runtime.js', '/config.runtime.js']
    ]);

    expected.forEach((destination, source) => {
        assert.equal(assetRewrites.get(source), destination, source);
    });
});
