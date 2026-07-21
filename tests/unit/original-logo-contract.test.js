'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const source = fs.readFileSync(
    path.join(projectRoot, 'src/integration/mobile-navigation.js'),
    'utf8'
);

test('marca usa integralmente a imagem original fornecida, sem redesign automático', () => {
    const expectedSources = [
        'part-1.js',
        'part-2.js',
        'part-3.js',
        'part-4.js',
        'bundle-5-8.js',
        'bundle-9-12.js',
        'bundle-13-16.js',
        'bundle-17-20.js'
    ];

    expectedSources.forEach(file => assert.match(source, new RegExp(file.replace('.', '\\.'))));
    assert.match(source, /parts\.length !== 20/);
    assert.match(source, /data:image\/webp;base64/);
    assert.match(source, /className = 'radar-original-logo'/);
    assert.match(source, /authBrand\.replaceChildren/);
    assert.match(source, /sidebarLogo\.replaceChildren/);
    assert.match(source, /applyOriginalBrand\(document, dataUrl\)/);
});
