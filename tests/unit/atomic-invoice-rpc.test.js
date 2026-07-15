'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const MIGRATION = path.join(ROOT, 'supabase', 'migrations', '202607130008_atomic_invoice_operations.sql');

function sql() {
    return fs.readFileSync(MIGRATION, 'utf8');
}

test('migration cria RPCs atômicas para salvar e remover notas', () => {
    const source = sql();
    assert.match(source, /create\s+or\s+replace\s+function\s+public\.save_invoice_with_effects\s*\(/i);
    assert.match(source, /create\s+or\s+replace\s+function\s+public\.delete_invoice_with_effects\s*\(/i);
    assert.match(source, /language\s+plpgsql/i);
    assert.match(source, /security\s+invoker/i);
    assert.match(source, /delete_invoice_with_effects[\s\S]*?security\s+definer/i);
    assert.match(source, /set\s+search_path\s*=\s*pg_catalog,\s*public/i);
});

test('RPC de salvamento aplica concorrência e mantém nota, bem e verificação na mesma transação', () => {
    const source = sql();
    assert.match(source, /p_expected_invoice_version\s+integer/i);
    assert.match(source, /p_expected_asset_version\s+integer/i);
    assert.match(source, /p_expected_verification_version\s+integer/i);
    assert.match(source, /raise\s+exception[\s\S]*OPTIMISTIC_CONFLICT/i);
    assert.match(source, /insert\s+into\s+public\.registered_invoices/i);
    assert.match(source, /insert\s+into\s+public\.assets/i);
    assert.match(source, /update\s+public\.verifications/i);
    assert.match(source, /linked_asset_id/i);
    assert.match(source, /p_administrative_log\s+jsonb/i);
    assert.match(source, /insert\s+into\s+public\.administrative_logs/i);
});

test('RPC de remoção exige autorização e pode remover bem vinculado e ajustar verificação', () => {
    const source = sql();
    assert.match(source, /public\.can_write_school\s*\(/i);
    assert.doesNotMatch(source, /current_app_role\(\)\s*<>\s*'technical_admin'/i);
    assert.match(source, /delete\s+from\s+public\.registered_invoices/i);
    assert.match(source, /delete\s+from\s+public\.assets/i);
    assert.match(source, /update\s+public\.verifications/i);
    assert.match(source, /grant\s+execute\s+on\s+function\s+public\.save_invoice_with_effects/i);
    assert.match(source, /grant\s+execute\s+on\s+function\s+public\.delete_invoice_with_effects/i);
});
