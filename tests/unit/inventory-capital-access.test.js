'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('perfil inventory é direcionado à interface Equipe de Inventário', () => {
    const authGate = read('src/integration/auth-gate.js');
    const index = read('index.html');
    const app = read('app.js');

    assert.match(authGate, /inventory\s*:\s*['"]inventario['"]/i);
    assert.match(index, /id=["']nav-inventario["'][\s\S]+Capital e Inventário/i);
    assert.match(app, /profile\s*===\s*['"]inventario['"][\s\S]+navCompetencias\.style\.display\s*=\s*['"]none['"]/i);
    assert.match(app, /currentProfile\s*===\s*['"]inventario['"][\s\S]+inventariarBem\(/i);
});

test('migration 19 limita a ampliação às políticas patrimoniais da própria CRE', () => {
    const migration = read(
        'supabase/migrations/20260721153758_inventory_capital_section_inline_scope.sql'
    );

    ['schools_read', 'school_programs_read', 'assets_read', 'assets_insert', 'assets_update']
        .forEach(policyName => assert.match(
            migration,
            new RegExp(`create\\s+policy\\s+${policyName}`, 'i'),
            `Política ausente: ${policyName}`
        ));

    assert.match(migration, /up\.profile_id\s*=\s*'inventory'/i);
    assert.match(migration, /up\.cre_scope\s+is\s+not\s+null/i);
    assert.match(migration, /(?:schools|s)\.cre\s*=\s*up\.cre_scope/i);
    assert.match(migration, /current_app_role\(\)\s*=\s*'inventory'/i);
    assert.doesNotMatch(
        migration,
        /create\s+or\s+replace\s+function\s+public\.can_write_school/i
    );
    assert.match(
        migration,
        /drop\s+function\s+if\s+exists\s+public\.inventory_can_access_cre_school\(text\)/i
    );
});

test('migration 20 impede acesso genérico do Inventário a outra CRE', () => {
    const migration = read(
        'supabase/migrations/20260721160100_inventory_generic_asset_scope_by_cre.sql'
    );

    assert.match(migration, /current_app_role\(\)\s*=\s*'inventory'/i);
    assert.match(migration, /join\s+public\.assets\s+a[\s\S]+a\.school_id\s*=\s*s\.id/i);
    assert.match(migration, /up\.profile_id\s*=\s*'inventory'/i);
    assert.match(migration, /up\.cre_scope\s+is\s+not\s+null/i);
    assert.match(migration, /s\.cre\s*=\s*up\.cre_scope/i);
    assert.doesNotMatch(
        migration,
        /create\s+or\s+replace\s+function\s+public\.can_write_school/i
    );
});

test('readiness exige o histórico patrimonial completo e o pgTAP específico', () => {
    const { REQUIRED_MIGRATIONS, REQUIRED_ARTIFACTS } = require(
        '../../scripts/check-supabase-readiness.js'
    );

    [
        '20260721152515_inventory_cre_read_access.sql',
        '20260721152634_inventory_capital_section_scope.sql',
        '20260721153758_inventory_capital_section_inline_scope.sql',
        '20260721160100_inventory_generic_asset_scope_by_cre.sql'
    ].forEach(name => assert.ok(REQUIRED_MIGRATIONS.includes(name), `Migration não exigida: ${name}`));

    assert.ok(REQUIRED_ARTIFACTS.includes(
        'supabase/tests/database/inventory-capital-rls.test.sql'
    ));
});
