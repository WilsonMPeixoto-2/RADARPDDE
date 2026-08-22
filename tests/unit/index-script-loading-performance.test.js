'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexPath = path.resolve(__dirname, '../../index.html');

function localExternalScripts(html) {
    return [...html.matchAll(/<script\s+([^>]*\bsrc=["']([^"']+)["'][^>]*)><\/script>/gi)]
        .map(match => ({ attributes: match[1], src: match[2] }))
        .filter(script => !/^(?:https?:)?\/\//i.test(script.src));
}

test('scripts locais do bootstrap usam defer para não bloquear a primeira renderização', () => {
    const html = fs.readFileSync(indexPath, 'utf8');
    const scripts = localExternalScripts(html);

    assert.ok(scripts.length > 20, 'o contrato deve cobrir a cadeia principal de scripts do RADAR');

    const blocking = scripts
        .filter(script => !/(?:^|\s)defer(?:\s|$|=)/i.test(script.attributes))
        .map(script => script.src);

    assert.deepEqual(
        blocking,
        [],
        `scripts parser-blocking encontrados: ${blocking.join(', ')}`
    );
});
