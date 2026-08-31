'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pendencias = require('../../src/domain/pendencias.js');

function source(relativePath) {
    return fs.readFileSync(path.resolve(__dirname, '../..', relativePath), 'utf8');
}

test('preflight de reanálise preserva registeredInvoiceId no lookup exato', () => {
    const body = source('app.js');
    const marker = 'const exactActive = window.RadarPendencias.findActivePendency(';
    const start = body.indexOf(marker);
    assert.ok(start >= 0, 'preflight de reanálise deve existir');

    const snippet = body.slice(start, start + 700);
    assert.match(
        snippet,
        /window\.RadarPendencias\.buildPendencyLookupContext\(current\)/
    );
});

test('fábrica canônica normaliza aliases e preserva identidade individual', () => {
    const context = pendencias.buildPendencyLookupContext({
        schoolId: ' ESC-1 ',
        competence: '2026-08',
        programId: ' BASIC ',
        documentKey: ' consAssessoria ',
        registered_invoice_id: ' NF-A ',
        item: ' Consulta Assessoria — NF 100 '
    });

    assert.deepEqual(context, {
        escolaId: 'ESC-1',
        competencia: '2026-08',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'NF-A',
        item: 'Consulta Assessoria — NF 100'
    });
});

test('fábrica canônica não inventa invoice para contexto agregado', () => {
    const context = pendencias.buildPendencyLookupContext({
        escolaId: 'ESC-1',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'extCC'
    });

    assert.equal(Object.hasOwn(context, 'registeredInvoiceId'), false);
    assert.equal(context.competencia, '2026-08');
    assert.equal(context.competenciaOrigem, '2026-08');
});

test('lookup agregado não pode localizar Pendência individualizada, mas lookup com invoice deve localizar', () => {
    const pendency = {
        id: 'PEND-A',
        tipo: 'documental',
        schemaVersion: 2,
        escolaId: 'ESC-1',
        competencia: '2026-08',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'NF-A',
        status: 'Aguardando reanálise',
        item: 'Consulta Assessoria — NF 100',
        errosAtuais: ['Outro'],
        tentativas: []
    };

    const generic = pendencias.findActivePendency([pendency], {
        escolaId: 'ESC-1',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        item: pendency.item
    });
    assert.equal(generic, undefined);

    const exact = pendencias.findActivePendency([pendency], {
        escolaId: 'ESC-1',
        competenciaOrigem: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'NF-A',
        item: pendency.item
    });
    assert.equal(exact?.id, 'PEND-A');
});
