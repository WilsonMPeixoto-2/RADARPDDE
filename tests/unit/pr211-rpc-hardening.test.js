'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/20260828023000_invoice_document_analysis_pendency.sql'
);

function migrationSource() {
    return fs.readFileSync(migrationPath, 'utf8');
}

function latestFunctionBody(name) {
    const source = migrationSource();
    const marker = `create or replace function public.${name}`;
    const start = source.lastIndexOf(marker);
    assert.notEqual(start, -1, `a migration do PR #211 deve redefinir ${name}`);
    const end = source.indexOf('\nrevoke all on function', start);
    assert.notEqual(end, -1, `a migration deve encerrar ${name} antes dos grants`);
    return source.slice(start, end);
}

test('RPC de abertura da Assessoria trava registros reais e não persiste o objeto amplo do cliente', () => {
    const body = latestFunctionBody('save_service_advisory_with_pendency');

    assert.match(body, /from public\.registered_invoices[\s\S]+for update/i);
    assert.match(body, /from public\.verifications[\s\S]+for update/i);
    assert.match(body, /v_actual_invoice\.row_version\s*<>\s*p_expected_invoice_version/i);
    assert.match(body, /v_actual_verification\.row_version\s*<>\s*p_expected_verification_version/i);
    assert.match(body, /v_invoice_patch/i);
    assert.match(body, /v_verification_patch/i);
    assert.doesNotMatch(body, /save_invoice_with_effects\(\s*p_invoice\s*,/i);
});

test('RPC de novo envio da Assessoria exige Pendência Aberta e próxima tentativa imutável', () => {
    const body = latestFunctionBody('register_service_advisory_attempt');

    assert.match(body, /from public\.pendencies[\s\S]+for update/i);
    assert.match(body, /v_actual_pendency\.status\s*<>\s*'Aberta'/i);
    assert.match(body, /max\(attempt_number\)/i);
    assert.match(body, /p_attempt\s*->>\s*'attempt_number'[\s\S]+v_next_attempt_number/i);
    assert.match(body, /nullif\(p_attempt\s*->>\s*'result'/i);
    assert.match(body, /nullif\(p_attempt\s*->>\s*'analyzed_at'/i);
    assert.match(body, /v_invoice_patch/i);
    assert.match(body, /v_pendency_patch/i);
    assert.match(body, /v_verification_patch/i);
    assert.doesNotMatch(body, /save_pendency_command\(\s*'register_attempt'\s*,\s*p_pendency/i);
});

test('RPC de reanálise da Assessoria exige a tentativa real mais recente e congela o envio', () => {
    const body = latestFunctionBody('reanalyze_service_advisory_pendency');

    assert.match(body, /p_attempt\s+is\s+null/i);
    assert.match(body, /v_actual_pendency\.status\s*<>\s*'Aguardando reanálise'/i);
    assert.match(body, /from public\.pendency_attempts[\s\S]+order by attempt_number desc[\s\S]+for update/i);
    assert.match(body, /v_actual_attempt\.id\s+is\s+distinct\s+from\s+nullif\(p_attempt\s*->>\s*'id'/i);
    assert.match(body, /v_attempt_patch/i);
    assert.match(body, /v_pendency_patch/i);
    assert.match(body, /v_verification_patch/i);
    assert.doesNotMatch(body, /reanalyze_pendency_with_verification\(\s*p_pendency\s*,\s*p_attempt/i);
});

test('primeira abertura fiscal altera somente análise e resumo do registro real', () => {
    const body = latestFunctionBody('save_invoice_document_with_pendency');

    assert.match(body, /from public\.registered_invoices[\s\S]+for update/i);
    assert.match(body, /from public\.verifications[\s\S]+for update/i);
    assert.match(body, /v_invoice_patch/i);
    assert.match(body, /v_verification_patch/i);
    assert.match(body, /abertura fiscal não pode alterar os dados da despesa/i);
    assert.doesNotMatch(body, /save_invoice_with_effects\(\s*p_invoice\s*,/i);
});

test('identificação patrimonial cria bem novo correspondente e proíbe vínculo oculto', () => {
    const body = latestFunctionBody('register_invoice_document_attempt');

    assert.match(body, /p_expected_asset_version\s+is\s+not\s+null/i);
    assert.match(body, /exists\s*\([\s\S]+from public\.assets[\s\S]+p_asset\s*->>\s*'id'/i);
    assert.match(body, /p_invoice\s*->>\s*'linked_asset_id'[\s\S]+p_asset\s*->>\s*'id'/i);
    assert.match(body, /p_asset\s*->>\s*'competence_id'[\s\S]+v_actual_invoice\.competence_id/i);
    assert.match(body, /p_asset\s*->>\s*'description'[\s\S]+p_invoice\s*->>\s*'description'/i);
    assert.match(body, /p_asset\s*->>\s*'invoice_number'[\s\S]+p_invoice\s*->>\s*'invoice_number'/i);
    assert.match(body, /p_invoice\s*->>\s*'linked_asset_id'[\s\S]+is\s+not\s+null[\s\S]+somente bem permanente/i);
});

test('reanálise fiscal congela o conteúdo do novo envio e aplica patches mínimos', () => {
    const body = latestFunctionBody('reanalyze_invoice_document_pendency');

    assert.match(body, /v_attempt_patch/i);
    assert.match(body, /v_invoice_patch/i);
    assert.match(body, /v_pendency_patch/i);
    assert.match(body, /v_verification_patch/i);
    assert.match(body, /reanálise fiscal não pode reescrever o novo envio/i);
    assert.doesNotMatch(body, /reanalyze_pendency_with_verification\(\s*p_pendency\s*,\s*p_attempt/i);
});
