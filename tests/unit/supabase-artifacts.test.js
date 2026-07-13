'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');

function read(name) {
    return fs.readFileSync(path.join(MIGRATIONS, name), 'utf8');
}

test('schema principal contém todas as entidades e relacionamentos essenciais', () => {
    const sql = read('202607130001_core_schema.sql');
    const requiredTables = [
        'app_config', 'programs', 'controllers', 'inventory_team_members',
        'schools', 'school_programs', 'competences', 'verifications',
        'pendencies', 'pendency_attempts', 'pendency_contacts', 'assets',
        'registered_invoices', 'administrative_logs'
    ];

    requiredTables.forEach(tableName => {
        assert.match(sql, new RegExp(`create\\s+table\\s+public\\.${tableName}`, 'i'));
    });
    assert.match(sql, /references\s+public\.schools\s*\(id\)/i);
    assert.match(sql, /references\s+public\.programs\s*\(id\)/i);
    assert.match(sql, /unique\s*\(school_id,\s*program_id\)/i);
    assert.match(sql, /check\s*\(status\s+in\s*\(/i);
    assert.match(sql, /create\s+index/i);
});

test('migration de autenticação ativa RLS e define políticas por perfil', () => {
    const sql = read('202607130002_auth_and_rls.sql');
    ['profiles', 'user_profiles', 'user_school_scopes'].forEach(tableName => {
        assert.match(sql, new RegExp(`create\\s+table\\s+public\\.${tableName}`, 'i'));
    });
    assert.match(sql, /create\s+or\s+replace\s+function\s+public\.current_app_role/i);
    assert.match(sql, /create\s+or\s+replace\s+function\s+public\.can_access_school/i);
    assert.match(sql, /auth\.uid\(\)/i);
    assert.match(sql, /enable\s+row\s+level\s+security/i);
    assert.match(sql, /create\s+policy/i);
    assert.match(sql, /technical_admin/i);
    assert.match(sql, /controller/i);
    assert.match(sql, /inventory/i);
});

test('migration de auditoria controla importações e alterações', () => {
    const sql = read('202607130003_audit_and_import.sql');
    assert.match(sql, /create\s+table\s+public\.data_import_runs/i);
    assert.match(sql, /create\s+table\s+public\.audit_events/i);
    assert.match(sql, /import_id\s+text\s+not\s+null\s+unique/i);
    assert.match(sql, /create\s+or\s+replace\s+function\s+public\.touch_updated_at/i);
    assert.match(sql, /create\s+trigger/i);
});
