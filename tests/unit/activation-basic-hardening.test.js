'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const migrationsDir = path.join(root, 'supabase', 'migrations');

test('migration de hardening restringe a execução direta da trigger de auditoria', () => {
    const migrationName = fs.readdirSync(migrationsDir)
        .find(name => name.endsWith('_activation_basic_hardening.sql'));

    assert.ok(migrationName, 'A migration de hardening deve existir.');

    const sql = fs.readFileSync(path.join(migrationsDir, migrationName), 'utf8');
    assert.match(sql, /revoke\s+execute\s+on\s+function\s+public\.capture_audit_event\(\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
    assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.capture_audit_event\(\)\s+to\s+service_role/i);
    assert.doesNotMatch(sql, /create\s+or\s+replace\s+function\s+public\.capture_audit_event/i);
});
