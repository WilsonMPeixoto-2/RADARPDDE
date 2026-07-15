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

test('schema principal contém entidades, relacionamentos e id canônico', () => {
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
    assert.match(sql, /create\s+table\s+public\.competences\s*\(\s*id\s+text\s+primary\s+key/i);
    assert.match(sql, /create\s+table\s+public\.school_programs\s*\(\s*id\s+text\s+primary\s+key/i);
    assert.match(sql, /create\s+table\s+public\.pendency_attempts\s*\(\s*id\s+text\s+primary\s+key/i);
    assert.match(sql, /create\s+table\s+public\.pendency_contacts\s*\(\s*id\s+text\s+primary\s+key/i);
    assert.match(sql, /unique\s*\(school_id,\s*program_id\)/i);
    assert.match(sql, /check\s*\(status\s+in\s*\(/i);
    assert.match(sql, /create\s+index/i);
});

test('migration complementar preserva o prazo de bonificação por competência', () => {
    const sql = read('202607130004_competence_bonus_deadline.sql');
    assert.match(sql, /alter\s+table\s+public\.competences[\s\S]*?add\s+column\s+bonus_deadline\s+date/i);
    assert.match(sql, /competences_bonus_deadline_check/i);
    assert.match(sql, /competences_bonus_deadline_idx/i);
});

test('migration de verificações preserva extensões auditáveis do frontend', () => {
    const sql = read('202607140009_verification_payload.sql');
    assert.match(sql, /alter\s+table\s+public\.verifications/i);
    assert.match(sql, /add\s+column\s+if\s+not\s+exists\s+payload\s+jsonb\s+not\s+null/i);
});

test('migration operacional normaliza contexto de notas e inventário', () => {
    const sql = read('202607130005_operational_context.sql');

    assert.match(sql, /alter\s+table\s+public\.assets[\s\S]*?inventoried_by_member_id\s+text/i);
    assert.match(sql, /inventoried_by_member_id[\s\S]*?references\s+public\.inventory_team_members\s*\(id\)/i);
    assert.match(sql, /add\s+column\s+inventoried_at\s+timestamptz/i);
    assert.match(sql, /alter\s+table\s+public\.registered_invoices[\s\S]*?program_id\s+text/i);
    assert.match(sql, /verification_id\s+text[\s\S]*?references\s+public\.verifications\s*\(id\)/i);
    assert.match(sql, /source_context_key\s+text\s+not\s+null/i);
    assert.match(sql, /linked_asset_id\s+text[\s\S]*?references\s+public\.assets\s*\(id\)/i);
    assert.match(sql, /registered_at\s+timestamptz/i);
    assert.match(sql, /registered_invoices_context_idx/i);
});

test('migration de autenticação ativa RLS, define perfis e IDs removíveis', () => {
    const sql = read('202607130002_auth_and_rls.sql');
    ['profiles', 'user_profiles', 'user_school_scopes'].forEach(tableName => {
        assert.match(sql, new RegExp(`create\\s+table\\s+public\\.${tableName}`, 'i'));
    });
    assert.match(sql, /create\s+table\s+public\.user_profiles\s*\(\s*id\s+uuid\s+primary\s+key/i);
    assert.match(sql, /unique\s*\(user_id,\s*profile_id\)/i);
    assert.match(sql, /create\s+table\s+public\.user_school_scopes\s*\(\s*id\s+uuid\s+primary\s+key/i);
    assert.match(sql, /unique\s*\(user_id,\s*school_id\)/i);
    assert.match(sql, /create\s+or\s+replace\s+function\s+public\.current_app_role/i);
    assert.match(sql, /create\s+or\s+replace\s+function\s+public\.can_access_school/i);
    assert.match(sql, /auth\.uid\(\)/i);
    assert.match(sql, /enable\s+row\s+level\s+security/i);
    assert.match(sql, /create\s+policy/i);
    assert.match(sql, /technical_admin/i);
    assert.match(sql, /controller/i);
    assert.match(sql, /inventory/i);
});

test('políticas RLS separam escrita operacional de exclusão administrativa', () => {
    const authSql = read('202607130002_auth_and_rls.sql');
    const auditSql = read('202607130003_audit_and_import.sql');

    [
        'school_programs',
        'verifications',
        'pendencies',
        'pendency_attempts',
        'pendency_contacts',
        'assets',
        'registered_invoices'
    ].forEach(tableName => {
        assert.match(
            authSql,
            new RegExp(`create\\s+policy\\s+${tableName}_delete[\\s\\S]*?for\\s+delete[\\s\\S]*?technical_admin`, 'i')
        );
        assert.doesNotMatch(
            authSql,
            new RegExp(`create\\s+policy\\s+${tableName}_write[\\s\\S]*?for\\s+all`, 'i')
        );
    });

    assert.match(
        auditSql,
        /create\s+policy\s+data_import_runs_delete[\s\S]*?for\s+delete[\s\S]*?technical_admin/i
    );
    assert.doesNotMatch(
        auditSql,
        /create\s+policy\s+data_import_runs_manage[\s\S]*?for\s+all/i
    );
});

test('migration de auditoria usa sintaxe válida de triggers e leitura segura de headers', () => {
    const sql = read('202607130003_audit_and_import.sql');
    assert.match(sql, /create\s+table\s+public\.data_import_runs/i);
    assert.match(sql, /create\s+table\s+public\.audit_events/i);
    assert.match(sql, /import_id\s+text\s+not\s+null\s+unique/i);
    assert.match(sql, /create\s+or\s+replace\s+function\s+public\.touch_updated_at/i);
    assert.match(
        sql,
        /create\s+trigger\s+schools_capture_audit\s+after\s+insert\s+or\s+update\s+or\s+delete\s+on\s+public\.schools\s+for\s+each\s+row\s+execute\s+function/i
    );
    assert.doesNotMatch(
        sql,
        /create\s+trigger\s+\w+\s+for\s+each\s+row\s+after/i,
        'A cláusula AFTER deve vir antes de ON ... FOR EACH ROW.'
    );
    assert.match(
        sql,
        /nullif\s*\(\s*current_setting\s*\(\s*'request\.headers'\s*,\s*true\s*\)\s*,\s*''\s*\)\s*::jsonb/i
    );
});

test('bootstrap de smoke test reproduz dependências mínimas do Supabase', () => {
    const bootstrapPath = path.join(ROOT, 'supabase', 'tests', 'bootstrap.sql');
    const sql = fs.readFileSync(bootstrapPath, 'utf8');

    assert.match(sql, /create\s+schema\s+auth/i);
    assert.match(sql, /create\s+table\s+auth\.users/i);
    assert.match(sql, /create\s+or\s+replace\s+function\s+auth\.uid\(\)/i);
    assert.match(sql, /create\s+role\s+authenticated/i);
    assert.match(sql, /create\s+role\s+anon/i);
});
