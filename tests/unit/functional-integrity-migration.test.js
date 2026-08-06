'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/202608060002_functional_integrity_remediation.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8');

test('exige row_version e conflito otimista na criação de exercício', () => {
    assert.match(sql, /creation of exercise requires row_version positive|criação de exercício exige row_version positivo/i);
    assert.match(sql, /v_existing\.row_version <> v_expected_version/);
    assert.match(sql, /OPTIMISTIC_CONFLICT: app_config/);
    assert.match(sql, /generate_series\(1, 12\)/);
});

test('remove o bem derivado quando a nota perde o vínculo', () => {
    assert.match(sql, /create or replace function public\.delete_unlinked_invoice_asset/);
    assert.match(sql, /after update of linked_asset_id on public\.registered_invoices/);
    assert.match(sql, /delete from public\.assets/);
});

test('sincroniza e reconcilia o status das tentativas', () => {
    assert.match(sql, /create or replace function public\.sync_pendency_attempt_statuses/);
    assert.match(sql, /new\.payload -> 'tentativas'/);
    assert.match(sql, /update public\.pendency_attempts attempt/);
    assert.match(sql, /from public\.pendencies pendency/);
});
