'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = fs.readdirSync(path.resolve('supabase/migrations'))
    .find(name => name.endsWith('_preconnection_transactions_and_json_contracts.sql'));
const sql = fs.readFileSync(path.resolve('supabase/migrations', migrationPath), 'utf8');

test('migration habilita pg_jsonschema e protege todas as colunas JSONB críticas', () => {
    assert.match(sql, /pg_jsonschema/i);
    for (const fragment of [
        'verifications_bonification_json_contract',
        'verifications_analysis_json_contract',
        'pendency_attempts_errors_json_contract',
        'administrative_logs_details_json_contract',
        'data_import_runs_counts_json_contract'
    ]) assert.match(sql, new RegExp(fragment));
});

test('RPCs compostas restantes usam SECURITY INVOKER e autorização explícita', () => {
    for (const name of [
        'save_exercise_with_competences',
        'save_school_with_programs',
        'reanalyze_pendency_with_verification'
    ]) {
        const start = sql.indexOf(`function public.${name}`);
        assert.notEqual(start, -1, `${name} ausente`);
        const block = sql.slice(start, start + 12000);
        assert.match(block, /security invoker/i);
        assert.match(block, /can_write_school|current_app_role/i);
        assert.match(block, /revoke all on function/i);
    }
});
