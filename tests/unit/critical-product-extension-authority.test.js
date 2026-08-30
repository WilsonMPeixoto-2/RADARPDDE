'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
    return fs.readFileSync(path.resolve(__dirname, '../..', relativePath), 'utf8');
}

test('bootstrap de navegação instala explicitamente o bootstrap das extensões críticas', () => {
    const body = source('src/integration/navigation-routes.js');
    assert.match(body, /const src = '\/src\/integration\/product-extensions-bootstrap\.js'/);
    assert.match(body, /installProductExtensionsBootstrap\(root\)/);
});

test('ordem crítica mantém Assessoria base antes do novo envio corretivo e antes dos wrappers diagnósticos', () => {
    const body = source('src/integration/product-extensions-bootstrap.js');
    const advisory = body.indexOf("'/src/integration/service-advisory-pendency.js'");
    const corrective = body.indexOf("'/src/integration/service-advisory-corrective-submission.js'");
    const diagnostics = body.indexOf("'/src/integration/operational-write-diagnostics.js'");
    const performance = body.indexOf("'/src/integration/operational-write-performance.js'");

    assert.ok(advisory >= 0, 'service-advisory-pendency deve integrar o bootstrap');
    assert.ok(corrective > advisory, 'novo envio corretivo deve envolver o serviço após a regra base da Assessoria');
    assert.ok(diagnostics > corrective, 'diagnóstico deve envolver o handler funcional final');
    assert.ok(performance > diagnostics, 'performance deve envolver o handler já diagnosticado');
});

test('autoridade de abertura/reanálise não volta a assumir registerAttempt', () => {
    const body = source('src/integration/service-advisory-pendency.js');
    assert.match(body, /pendencyService\.open = async function openWithServiceAdvisory/);
    assert.match(body, /pendencyService\.reanalyze = async function reanalyzeWithServiceAdvisory/);
    assert.doesNotMatch(body, /pendencyService\.registerAttempt\s*=/);
    assert.doesNotMatch(body, /register_service_advisory_attempt/);
});

test('autoridade de novo envio corretivo é única e delega Pendências não vinculadas', () => {
    const body = source('src/integration/service-advisory-corrective-submission.js');
    assert.match(body, /service\.registerAttempt = async function registerAttemptPerInvoice/);
    assert.match(body, /if \(!isLinkedPendency\(root, target\)\) return originalRegisterAttempt\(input\)/);
    assert.match(body, /'register_service_advisory_attempt'/);
    assert.match(body, /__radarServiceAdvisoryCorrectiveSubmission/);
});

test('handler base de Incorreto é fail-closed e exige extensão funcional instalada', () => {
    const body = source('app.js');
    assert.match(body, /if \(window\.RadarProductExtensionsReady[\s\S]+await window\.RadarProductExtensionsReady/);
    assert.match(body, /atomicHandler !== changeInvoiceAdvisoryAnalysis/);
    assert.match(body, /A proteção individual da Consulta Assessoria ainda não está disponível/);
});
