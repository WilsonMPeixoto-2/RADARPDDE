'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/20260822040642_invoice_asset_transition_integrity.sql'
);

function migration() {
    return fs.readFileSync(migrationPath, 'utf8');
}

test('migração move a implementação patrimonial para helper privado com wrapper público invoker', () => {
    const source = migration();
    assert.match(source, /create\s+or\s+replace\s+function\s+radar_private\.save_invoice_with_effects_impl\s*\(/i);
    assert.match(source, /security\s+definer/i);
    assert.match(source, /create\s+or\s+replace\s+function\s+public\.save_invoice_with_effects\s*\(/i);
    assert.match(source, /language\s+sql[\s\S]*?security\s+invoker/i);
    assert.match(source, /public\.can_write_school\s*\(v_school_id\)/i);
});

test('transição não patrimonial valida a versão antes de desvincular e confirma a exclusão feita pelo trigger', () => {
    const source = migration();
    assert.match(source, /v_target_expense_type\s*<>\s*'permanente'/i);
    assert.match(source, /v_asset_to_remove\.row_version\s*<>\s*p_expected_asset_version/i);
    assert.match(source, /other_invoice\.linked_asset_id\s*=\s*v_previous_asset_id/i);

    const updateIndex = source.search(/update\s+public\.registered_invoices/i);
    const postconditionIndex = source.search(/if\s+exists\s*\(\s*select\s+1\s+from\s+public\.assets\s+where\s+id\s*=\s*v_previous_asset_id/i);
    assert.ok(updateIndex >= 0, 'update da nota deve existir');
    assert.ok(
        postconditionIndex > updateIndex,
        'a exclusão derivada deve ser confirmada somente depois da nota perder o vínculo'
    );
    assert.doesNotMatch(
        source,
        /delete\s+from\s+public\.assets\s+where\s+id\s*=\s*v_previous_asset_id/i,
        'a RPC não deve duplicar o DELETE já executado pelo trigger de desvinculação'
    );
    assert.match(source, /'deleted_asset_id'\s*,\s*v_removed_asset_id/i);
});
