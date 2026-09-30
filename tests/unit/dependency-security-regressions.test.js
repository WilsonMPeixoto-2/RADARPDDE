'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const rootRequire = createRequire(path.join(ROOT, 'package.json'));
const consumers = [
    { name: 'ESLint/minimatch 10', load: rootRequire },
    { name: 'glob/minimatch 3', load: createRequire(rootRequire.resolve('glob')) },
    { name: 'readdir-glob/minimatch 5', load: createRequire(rootRequire.resolve('readdir-glob')) }
];

// Run potentially unsafe parsing in a bounded child, through the consumer's actual
// braceExpand API. A crashing parser cannot interrupt the other regression cases.
const childSource = String.raw`
    const assert = require('node:assert/strict');
    const minimatch = require(process.argv[1]);
    const { pattern, mode } = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
    const values = minimatch.braceExpand(pattern);
    assert.ok(Array.isArray(values));
    assert.ok(values.every(value => typeof value === 'string'));
    if (mode === 'rewrite') assert.deepEqual(values, [pattern]);
    if (mode === 'comma-tail') {
        assert.equal(values.length, 16001);
        assert.equal(values.at(-1), 'b');
    }
    console.log(JSON.stringify({ count: values.length }));
`;

function expandInChild(consumer, pattern, mode) {
    assert.ok(pattern.length < 65536, 'the payload must reach the parser below minimatch length limits');
    const result = spawnSync(process.execPath, [
        '-e', childSource, consumer.load.resolve('minimatch')
    ], { input: JSON.stringify({ pattern, mode }), encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return JSON.parse(result.stdout);
}

for (const consumer of consumers) {
    test(consumer.name + ': limita recursão em conjuntos únicos aninhados', () => {
        expandInChild(consumer, '{'.repeat(7000) + 'a,b' + '}'.repeat(7000), 'nested');
    });

    test(consumer.name + ': limita recursão entre alternativas aninhadas', () => {
        expandInChild(consumer, '{a,'.repeat(7000) + 'z' + '}'.repeat(7000), 'nested');
    });

    test(consumer.name + ': interpreta cauda de grupos sem estourar a pilha do parser', () => {
        expandInChild(consumer, '{' + '{a},'.repeat(16000) + 'b}', 'comma-tail');
    });

    test(consumer.name + ': limita reescritas patológicas mantendo a entrada residual literal', () => {
        expandInChild(consumer, '{a}' + '}'.repeat(8000) + ',z}', 'rewrite');
    });

    test(consumer.name + ': preserva padrões legítimos, sequências, escapes e opções', () => {
        const minimatch = consumer.load('minimatch');
        const expand = minimatch.braceExpand;
        assert.deepEqual(expand('src/{domain,application}/*.js'), [
            'src/domain/*.js', 'src/application/*.js'
        ]);
        assert.deepEqual(expand('reports/{01..03}.json'), [
            'reports/01.json', 'reports/02.json', 'reports/03.json'
        ]);
        assert.deepEqual(expand('x{a,{b,c}}y'), ['xay', 'xby', 'xcy']);
        assert.deepEqual(expand(String.raw`x\{a,b\}y`), ['x{a,b}y']);
        assert.deepEqual(expand('{a},b}'), ['a}', 'b']);
        assert.deepEqual(expand('src/{a,b}.js', { nobrace: true }), ['src/{a,b}.js']);
        const match = typeof minimatch === 'function' ? minimatch : minimatch.minimatch;
        assert.equal(match('src/domain/invoice.js', 'src/{domain,application}/*.js'), true);
        assert.equal(match('src/private/invoice.js', 'src/{domain,application}/*.js'), false);
    });
}

const browser = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'vendor/ajv.js'), 'utf8'), browser);
const resolvers = [
    { name: 'fast-uri Node', resolver: rootRequire('fast-uri') },
    { name: 'Ajv browser versionado', resolver: new browser.window.RadarAjv().opts.uriResolver }
];

for (const { name, resolver } of resolvers) {
    test(name + ': normaliza hosts relativos com octetos codificados equivalentes', () => {
        for (const [reference, host] of [
            ['//%41.com', 'a.com'],
            ['//%4A.com', 'j.com'],
            ['//%41%42.com', 'ab.com'],
            ['//%45XAMPLE.com', 'example.com']
        ]) {
            assert.equal(resolver.parse(reference).host, host, reference);
            assert.equal(resolver.normalize(reference), '//' + host, reference);
            assert.equal(resolver.equal(reference, '//' + host), true, reference);
        }
    });

    test(name + ': preserva grafias normais e distingue caminho e hosts diferentes', () => {
        assert.equal(resolver.parse('//EXAMPLE.com').host, 'example.com');
        assert.equal(resolver.normalize('https://EXAMPLE.com/InvoiceA?x=A'),
            'https://example.com/InvoiceA?x=A');
        assert.equal(resolver.equal('//example.com/InvoiceA', '//example.com/invoicea'), false);
        assert.equal(resolver.equal('//example.com', '//other.example.com'), false);
        assert.equal(resolver.parse('radar://contracts/analysis').host, 'contracts');
        assert.equal(resolver.parse('radar://contracts/analysis').path, '/analysis');
    });
}
