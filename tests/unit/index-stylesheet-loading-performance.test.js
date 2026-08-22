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

test('estilos secundários não bloqueiam a primeira renderização', () => {
    const html = read('index.html');
    const expected = new Set([
        'src/styles/shared-interactions.css',
        'src/styles/global-search.css',
        'src/styles/floating-ui.css',
        'src/styles/view-transitions.css'
    ]);

    const markedTags = [...html.matchAll(/<link\b[^>]*data-radar-nonblocking-style=["']true["'][^>]*>/gi)];
    const local = markedTags
        .map(match => ({ tag: match[0], attrs: attributes(match[0]) }))
        .filter(item => expected.has(item.attrs.href));

    assert.equal(local.length, expected.size, 'todos os estilos secundários esperados devem usar carregamento não bloqueante.');
    local.forEach(item => {
        assert.equal(item.attrs.rel, 'preload');
        assert.equal(item.attrs.as, 'style');
        assert.match(item.tag, /\bonload\s*=/i, 'o preload deve se promover a stylesheet após o carregamento.');
    });
});
