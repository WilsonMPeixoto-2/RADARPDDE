'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');

test('Vercel reescreve as rotas canônicas aprovadas para o index', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const rewrites = config.rewrites || [];
    const applicationRewrites = rewrites.filter(item => item.destination === '/index.html');
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

    assert.deepEqual(applicationRewrites.map(item => item.source), expectedSources);
    assert.equal(config.git?.deploymentEnabled, false);
    assert.equal(rewrites.some(item => item.source === '/(.*)'), false);
});

test('URLs profundas de escola preservam os recursos relativos do index', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const rewrites = config.rewrites || [];
    const assetRewrites = new Map(rewrites
        .filter(item => item.destination !== '/index.html')
        .map(item => [item.source, item.destination]));

    assert.equal(assetRewrites.get('/escolas/:schoolId/src/:path*'), '/src/:path*');
    assert.equal(assetRewrites.get('/escolas/:schoolId/vendor/:path*'), '/vendor/:path*');
    assert.equal(assetRewrites.get('/escolas/:schoolId/styles.css'), '/styles.css');
    assert.equal(assetRewrites.get('/escolas/:schoolId/app.js'), '/app.js');
    assert.equal(assetRewrites.get('/escolas/:schoolId/config.js'), '/config.js');
    assert.equal(assetRewrites.get('/escolas/:schoolId/config.runtime.js'), '/config.runtime.js');
});
