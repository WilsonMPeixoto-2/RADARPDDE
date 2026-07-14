'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
    path.resolve(
        __dirname,
        '../../supabase/migrations/202607130006_authorization_hardening.sql'
    ),
    'utf8'
);

test('mantém apenas um perfil ativo por usuário', () => {
    assert.match(
        migration,
        /create\s+unique\s+index\s+user_profiles_one_active_per_user_idx[\s\S]*?on\s+public\.user_profiles\s*\(user_id\)[\s\S]*?where\s+active\s*=\s*true/i
    );
});

test('controlador escreve na própria carteira ou em exceção com can_write explícito', () => {
    assert.match(
        migration,
        /when\s+public\.current_app_role\(\)\s*=\s*'controller'[\s\S]*?s\.controller_id\s*=\s*public\.current_controller_id\(\)[\s\S]*?or\s+exists[\s\S]*?uss\.can_write\s*=\s*true/i
    );
    assert.doesNotMatch(
        migration,
        /when\s+public\.current_app_role\(\)\s*=\s*'controller'\s+then\s+public\.can_access_school/i
    );
});

test('escopo somente leitura não é tratado como autorização de escrita', () => {
    const writeScopeChecks = migration.match(/uss\.can_write\s*=\s*true/gi) || [];
    assert.ok(writeScopeChecks.length >= 2);
    assert.match(migration, /revoke\s+all\s+on\s+function\s+public\.can_write_school\(text\)\s+from\s+public/i);
    assert.match(migration, /grant\s+execute\s+on\s+function\s+public\.can_write_school\(text\)\s+to\s+authenticated/i);
});
