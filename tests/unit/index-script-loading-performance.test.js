'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexPath = path.resolve(__dirname, '../../index.html');
const stylesPath = path.resolve(__dirname, '../../styles.css');

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

test('fontes institucionais não bloqueiam a primeira renderização nem são carregadas duas vezes', () => {
    const html = fs.readFileSync(indexPath, 'utf8');
    const styles = fs.readFileSync(stylesPath, 'utf8');
    const fontLinks = [...html.matchAll(/<link\s+([^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2[^>]*?)>/gi)];
    const preloadLinks = fontLinks.filter(match => /\brel=["']preload["']/i.test(match[1]));

    assert.doesNotMatch(
        styles,
        /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com/i,
        'styles.css não deve repetir a requisição de fontes já declarada no HTML'
    );
    assert.equal(preloadLinks.length, 1, 'deve existir uma única carga normal e não bloqueante da folha de fontes');

    const attributes = preloadLinks[0][1];
    assert.match(attributes, /\bas=["']style["']/i);
    assert.match(attributes, /\bdata-radar-nonblocking-font=["']true["']/i);
    assert.match(attributes, /\bonload=["'][^"']*rel=['"]stylesheet['"][^"']*["']/i);
    assert.match(
        html,
        /<noscript>[\s\S]*?<link\s+[^>]*rel=["']stylesheet["'][^>]*fonts\.googleapis\.com\/css2[^>]*>[\s\S]*?<\/noscript>/i,
        'o fallback sem JavaScript deve preservar as fontes institucionais'
    );
    assert.equal(fontLinks.length, 2, 'somente preload normal e fallback noscript devem referenciar a folha de fontes');
});

test('index não contém escapes \\n literais entre scripts do bootstrap', () => {
    const html = fs.readFileSync(indexPath, 'utf8');

    assert.doesNotMatch(
        html,
        /<\/script>\\n\s*<script\b/,
        'quebras de linha entre scripts devem ser caracteres reais, não texto \\n'
    );
});
