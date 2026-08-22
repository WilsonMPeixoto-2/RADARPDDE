'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function attributes(tag) {
    return Object.fromEntries(
        [...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)]
            .map(match => [match[1].toLowerCase(), match[2]])
    );
}

test('fontes remotas e estilos secundários não bloqueiam a primeira renderização', () => {
    const html = read('index.html');
    const mainCss = read('styles.css');

    assert.doesNotMatch(
        mainCss,
        /@import\s+url\([^)]*fonts\.googleapis\.com/i,
        'Google Fonts não deve ser importado pelo CSS crítico.'
    );

    const expected = new Set([
        'src/styles/shared-interactions.css',
        'src/styles/global-search.css',
        'src/styles/floating-ui.css',
        'src/styles/view-transitions.css'
    ]);

    const marked = [...html.matchAll(/<link\b[^>]*data-radar-nonblocking-style=["']true["'][^>]*>/gi)]
        .map(match => attributes(match[0]));
    const local = marked.filter(item => expected.has(item.href));

    assert.equal(local.length, expected.size, 'todos os estilos secundários esperados devem usar carregamento não bloqueante.');
    local.forEach(item => {
        assert.equal(item.rel, 'preload');
        assert.equal(item.as, 'style');
        assert.match(item.onload || '', /rel\s*=\s*['"]stylesheet['"]/i);
    });

    const googleFonts = marked.find(item => /fonts\.googleapis\.com\/css2/i.test(item.href || ''));
    assert.ok(googleFonts, 'Google Fonts deve ser carregado de forma não bloqueante.');
    assert.equal(googleFonts.rel, 'preload');
    assert.equal(googleFonts.as, 'style');
});
