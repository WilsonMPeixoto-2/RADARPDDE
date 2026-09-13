'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const servicePath = path.resolve(__dirname, '../../src/application/pendency-service.js');
const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/20260903175000_corrective_submission_integrity.sql'
);

function source(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function registerAttemptCall() {
    const service = source(servicePath);
    const start = service.indexOf("repository.executeRpc('register_invoice_document_attempt'");
    assert.notEqual(start, -1, 'PendencyService deve chamar register_invoice_document_attempt');
    const end = service.indexOf("}, 'registerInvoiceDocumentAttempt');", start);
    assert.notEqual(end, -1, 'a chamada RPC deve possuir fronteira identificável');
    return service.slice(start, end);
}

test('novo envio fiscal envia explicitamente versão patrimonial nula quando não existe bem vinculado', () => {
    const call = registerAttemptCall();

    assert.match(
        call,
        /p_expected_asset_version:\s*persistence\.expectedAssetVersion\s*\?\?\s*null/,
        'undefined é omitido pelo JSON e muda a assinatura RPC resolvida pelo PostgREST; o parâmetro deve ser null quando não houver patrimônio'
    );
});

test('a assinatura SQL continua exigindo p_expected_asset_version como argumento nomeado', () => {
    const migration = source(migrationPath);
    const start = migration.indexOf('create or replace function public.register_invoice_document_attempt(');
    assert.notEqual(start, -1);
    const signatureEnd = migration.indexOf(')\nreturns jsonb', start);
    assert.notEqual(signatureEnd, -1);
    const signature = migration.slice(start, signatureEnd);

    assert.match(signature, /p_asset\s+jsonb,\s*\n\s*p_expected_asset_version\s+integer,/i);
});
