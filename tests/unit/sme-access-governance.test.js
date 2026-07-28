'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const migration = fs.readFileSync(
    path.join(
        root,
        'supabase/migrations/20260728182226_sme_access_governance.sql'
    ),
    'utf8'
);

test('RLS limita a leitura da Gestão SME ao próprio auth.uid', () => {
    assert.match(
        migration,
        /current_app_role\(\)\)\s*=\s*'sme_management'[\s\S]*?actor_user_id\s*=\s*\(select auth\.uid\(\)\)/i
    );
    assert.doesNotMatch(
        migration,
        /current_app_role\(\)\s+in\s*\(\s*'technical_admin'\s*,\s*'sme_management'\s*\)/i
    );
});

test('RLS preserva a visão integral do administrador técnico e o escopo dos demais perfis', () => {
    assert.match(migration, /current_app_role\(\)\)\s*=\s*'technical_admin'/i);
    assert.match(
        migration,
        /current_app_role\(\)\)\s+not\s+in\s*\(\s*'technical_admin'\s*,\s*'sme_management'\s*\)[\s\S]*?can_access_school\(school_id\)/i
    );
});

test('gravações comuns de registros internos declaram o UUID autenticado', () => {
    const insertPolicy = migration.match(
        /create policy administrative_logs_insert[\s\S]*?with check\s*\(([\s\S]*?)\n\);/i
    )?.[1] || '';

    assert.match(insertPolicy, /actor_user_id\s*=\s*\(select auth\.uid\(\)\)/i);
    assert.match(insertPolicy, /current_app_role\(\)\)\s*=\s*'technical_admin'/i);
});

test('interface carrega a política antes dos serviços e do aplicativo principal', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const policyIndex = html.indexOf('src/domain/access-policy.js');
    const serviceIndex = html.indexOf('src/application/pendency-service.js');
    const appIndex = html.indexOf('app.js');

    assert.ok(policyIndex >= 0);
    assert.ok(policyIndex < serviceIndex);
    assert.ok(serviceIndex < appIndex);
});
