'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const adapterPath = path.resolve(__dirname, '../../src/data/legacy-state-adapter.js');
const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/20260830223000_payload_row_version_boundary.sql'
);

function source(file) {
    return fs.readFileSync(file, 'utf8');
}

function functionBody(sql, name) {
    const marker = `create or replace function public.${name}`;
    const start = sql.indexOf(marker);
    assert.notEqual(start, -1, `migration deve redefinir ${name}`);
    const end = sql.indexOf('\nrevoke all on function', start);
    assert.notEqual(end, -1, `migration deve encerrar ${name} antes dos grants`);
    return sql.slice(start, end);
}

test('adapter mantém row_version canônico fora dos payloads de compatibilidade', () => {
    const body = source(adapterPath);

    assert.match(body, /function versionlessPayload\(value\)/);
    assert.match(body, /delete payload\.rowVersion/);
    assert.match(body, /delete payload\.row_version/);
    assert.match(body, /'rowVersion',[\s\S]*'row_version'/);
    assert.match(body, /payload: versionlessPayload\(pendency\)/);
    assert.match(body, /payload: versionlessPayload\(attempt\)/);
    assert.match(body, /payload: versionlessPayload\(contact\)/);
    assert.match(body, /payload: versionlessPayload\(asset\)/);
    assert.match(body, /payload: versionlessPayload\(invoice\)/);
});

test('migration remove somente metadados de versão dos payloads já persistidos', () => {
    const sql = source(migrationPath);

    for (const table of [
        'registered_invoices',
        'verifications',
        'pendencies',
        'pendency_attempts',
        'pendency_contacts',
        'assets'
    ]) {
        assert.match(
            sql,
            new RegExp(`update public\\.${table}[\\s\\S]+payload = coalesce\\(payload, '\\\{\\\}'::jsonb\\) - 'rowVersion' - 'row_version'`, 'i')
        );
    }
});

test('abertura fiscal ignora versão técnica mas continua congelando dados reais', () => {
    const body = functionBody(source(migrationPath), 'save_invoice_document_with_pendency');

    assert.match(body, /analiseDocumentoFiscal' - 'rowVersion' - 'row_version'/);
    assert.match(body, /p_invoice\s*->>\s*'amount'[\s\S]+v_actual_invoice\.amount/);
    assert.match(body, /p_invoice\s*->>\s*'invoice_number'[\s\S]+v_actual_invoice\.invoice_number/);
    assert.match(body, /p_expected_invoice_version[\s\S]+v_actual_invoice\.row_version/);
    assert.match(body, /p_verification_patch\s*->\s*'payload'[\s\S]+rowVersion[\s\S]+row_version/);
});

test('abertura da Assessoria ignora versão técnica mas preserva as demais travas', () => {
    const body = functionBody(source(migrationPath), 'save_service_advisory_with_pendency');

    assert.match(body, /analiseConsultaAssessoria' - 'rowVersion' - 'row_version'/);
    assert.match(body, /v_actual_invoice\.expense_type\s*<>\s*'servico'/);
    assert.match(body, /p_invoice\s*->>\s*'amount'[\s\S]+v_actual_invoice\.amount/);
    assert.match(body, /p_expected_verification_version[\s\S]+v_actual_verification\.row_version/);
    assert.match(body, /p_verification_patch\s*->\s*'payload'[\s\S]+rowVersion[\s\S]+row_version/);
});
