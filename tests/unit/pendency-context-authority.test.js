'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const CRITICAL_LOOKUP_FILES = [
    'app.js',
    'src/application/pendency-service.js',
    'src/application/verification-service.js',
    'src/integration/atomic-analysis-pendency.js',
    'src/integration/service-advisory-pendency.js'
];

function source(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('arquivos críticos usam a fábrica canônica de contexto de Pendência', () => {
    for (const relativePath of CRITICAL_LOOKUP_FILES) {
        const body = source(relativePath);
        assert.match(
            body,
            /buildPendencyLookupContext/,
            `${relativePath} deve depender da fábrica canônica de contexto`
        );
    }
});

test('lookup crítico não recebe objeto literal montado diretamente', () => {
    const rawLookup = /findActivePendency(?:\?\.)?\s*\(\s*[^,]+,\s*\{/gs;

    for (const relativePath of CRITICAL_LOOKUP_FILES) {
        const body = source(relativePath);
        assert.equal(
            rawLookup.test(body),
            false,
            `${relativePath} não deve reconstruir contexto inline ao chamar findActivePendency()`
        );
        rawLookup.lastIndex = 0;
    }
});

test('fábrica canônica é a única responsável por aliases de identidade', () => {
    const body = source('src/domain/pendencias.js');
    assert.match(body, /function buildPendencyLookupContext\(input = \{\}\)/);
    assert.match(body, /input\.registeredInvoiceId \|\| input\.registered_invoice_id/);
    assert.match(body, /input\.schoolId/);
    assert.match(body, /input\.programId/);
    assert.match(body, /input\.documentKey/);
});
