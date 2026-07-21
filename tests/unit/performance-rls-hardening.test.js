'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/20260720193000_performance_and_rls_hardening.sql'
);
const migration = fs.readFileSync(migrationPath, 'utf8');

const REQUIRED_INDEXES = Object.freeze([
    'administrative_logs_actor_user_id_idx',
    'app_config_closing_competence_idx',
    'assets_competence_id_idx',
    'data_import_runs_created_by_idx',
    'pendencies_program_id_idx',
    'pendency_attempts_created_by_idx',
    'pendency_contacts_created_by_idx',
    'pendency_contacts_pendency_id_idx',
    'registered_invoices_competence_id_idx',
    'schools_initial_competence_idx',
    'user_profiles_inventory_member_id_idx',
    'verifications_competence_id_idx'
]);

test('migration 15 cobre todas as chaves estrangeiras indicadas pelos Advisors', () => {
    REQUIRED_INDEXES.forEach(indexName => {
        assert.match(
            migration,
            new RegExp(`create index if not exists ${indexName}\\b`, 'i'),
            `Índice obrigatório ausente: ${indexName}`
        );
    });
});

test('políticas administrativas são separadas por operação sem SELECT duplicado', () => {
    ['profiles', 'user_profiles', 'user_school_scopes'].forEach(table => {
        assert.match(migration, new RegExp(`create policy ${table}_insert_admin`, 'i'));
        assert.match(migration, new RegExp(`create policy ${table}_update_admin`, 'i'));
        assert.match(migration, new RegExp(`create policy ${table}_delete_admin`, 'i'));
    });

    assert.doesNotMatch(migration, /create policy (?:profiles|user_profiles|user_school_scopes)_manage\b/i);
});

test('leituras do próprio usuário inicializam auth.uid uma única vez por consulta', () => {
    const selfReadPolicies = migration.match(
        /create policy (?:user_profiles|user_school_scopes)_self_read[\s\S]*?;(?:\r?\n)/gi
    ) || [];

    assert.equal(selfReadPolicies.length, 2);
    selfReadPolicies.forEach(policy => {
        assert.match(policy, /user_id\s*=\s*\(select auth\.uid\(\)\)/i);
        assert.doesNotMatch(policy, /user_id\s*=\s*auth\.uid\(\)/i);
    });
});

test('hardening não altera os RPCs SECURITY DEFINER funcionais', () => {
    assert.doesNotMatch(
        migration,
        /(?:drop|revoke|alter)\s+(?:function|execute)[\s\S]*?(?:current_app_role|current_controller_id|can_access_school|can_write_school|delete_invoice_with_effects)/i
    );
});
