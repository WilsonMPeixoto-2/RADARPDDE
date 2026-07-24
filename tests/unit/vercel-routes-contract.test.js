'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');

test('Vercel reescreve somente as rotas canônicas aprovadas para o index', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const rewrites = config.rewrites || [];
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

    assert.deepEqual(rewrites.map(item => item.source), expectedSources);
    rewrites.forEach(item => assert.equal(item.destination, '/index.html'));
    assert.equal(config.git?.deploymentEnabled, false);
    assert.equal(rewrites.some(item => item.source === '/(.*)'), false);
});
