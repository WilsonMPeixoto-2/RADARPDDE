'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const migrationPath = path.join(
    root,
    'supabase/migrations/20260714180621_preconnection_auth_and_api_grants.sql'
);

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('migration fecha Data API anônima e concede somente operações sujeitas a RLS', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.match(sql, /revoke\s+all\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon/i);
    assert.match(sql, /revoke\s+all\s+on\s+all\s+sequences\s+in\s+schema\s+public\s+from\s+anon/i);
    assert.match(sql, /grant\s+usage\s+on\s+schema\s+public\s+to\s+authenticated/i);
    assert.match(sql, /grant\s+select[\s\S]+profiles[\s\S]+user_profiles[\s\S]+user_school_scopes[\s\S]+to\s+authenticated/i);
    assert.match(sql, /grant\s+select,\s*insert,\s*update,\s*delete[\s\S]+to\s+authenticated/i);
    assert.match(sql, /alter\s+default\s+privileges[\s\S]+revoke\s+all[\s\S]+from\s+anon/i);
    assert.match(sql, /grant\s+usage\s+on\s+schema\s+public\s+to\s+service_role/i);
    assert.match(sql, /grant\s+select,\s*update\s+on\s+table[\s\S]+controllers[\s\S]+inventory_team_members[\s\S]+to\s+service_role/i);
    assert.match(sql, /grant\s+select,\s*insert,\s*update\s+on\s+table[\s\S]+user_profiles[\s\S]+user_school_scopes[\s\S]+to\s+service_role/i);
    const serviceRoleGrants = sql
        .replace(/--.*$/gm, '')
        .split(';')
        .filter(statement => /\bgrant\b/i.test(statement) && /to\s+service_role\s*$/i.test(statement.trim()));
    serviceRoleGrants.forEach(statement => {
        assert.doesNotMatch(statement, /grant\s+all/i);
        assert.doesNotMatch(statement, /\bdelete\b/i);
    });
});

test('bootstrap PostgreSQL reproduz os três papéis mínimos do Supabase', () => {
    const bootstrap = read('supabase/tests/bootstrap.sql');

    assert.match(bootstrap, /create\s+role\s+authenticated\s+nologin/i);
    assert.match(bootstrap, /create\s+role\s+anon\s+nologin/i);
    assert.match(bootstrap, /create\s+role\s+service_role\s+nologin\s+bypassrls/i);
});

test('configuração local habilita login por email sem abrir cadastro público', () => {
    const config = read('supabase/config.toml');
    const authSection = config.match(/\[auth\]([\s\S]*?)(?:\n\[|$)/i);
    const emailSection = config.match(/\[auth\.email\]([\s\S]*?)(?:\n\[|$)/i);

    assert.ok(authSection, 'A seção [auth] deve existir.');
    assert.ok(emailSection, 'A seção [auth.email] deve existir.');
    assert.match(authSection[1], /^\s*enable_signup\s*=\s*false\s*$/mi);
    assert.match(emailSection[1], /^\s*enable_signup\s*=\s*true\s*$/mi);
    assert.doesNotMatch(emailSection[1], /^\s*enabled\s*=/mi);
});

test('manifesto local contém sete identidades e cinco papéis ativos determinísticos', () => {
    const seed = read('supabase/seed.sql');
    const fixtures = JSON.parse(read('supabase/fixtures/auth-users.json'));

    ['controller', 'federal_assistant', 'inventory', 'sme_management', 'technical_admin']
        .forEach(profile => assert.ok(fixtures.some(fixture => fixture.profileId === profile)));
    assert.equal(fixtures.length, 7);
    assert.equal(fixtures.filter(fixture => fixture.profileId && fixture.active).length, 5);
    assert.equal(fixtures.filter(fixture => fixture.profileId && !fixture.active).length, 1);
    assert.equal(fixtures.filter(fixture => !fixture.profileId).length, 1);
    assert.equal(new Set(fixtures.map(fixture => fixture.id)).size, fixtures.length);
    assert.equal(new Set(fixtures.map(fixture => fixture.email)).size, fixtures.length);
    assert.doesNotMatch(seed, /auth\.(?:users|identities)/i);
    assert.doesNotMatch(seed, /encrypted_password|gen_salt|crypt\s*\(/i);
});

test('bootstrap cria usuários pela API Admin e só aceita a pilha local com autorização explícita', () => {
    const source = read('scripts/bootstrap-local-auth-fixtures.mjs');

    assert.match(source, /auth\.admin\.createUser/);
    assert.match(source, /RADAR_ALLOW_LOCAL_AUTH_BOOTSTRAP/);
    assert.match(source, /localhost/);
    assert.match(source, /127\.0\.0\.1/);
    assert.doesNotMatch(source, /role:\s*['"]authenticated['"]/);
    assert.doesNotMatch(source, /console\.log\([^\n]*(?:password|key|token)/i);
});

test('login-probe isola sessões, repete apenas falhas transitórias e preserva diagnóstico', () => {
    const source = read('scripts/check-local-auth-fixtures.mjs');

    assert.match(source, /MAX_AUTH_PROBE_ATTEMPTS\s*=\s*4/);
    assert.match(source, /createProbeClient\(\)/);
    assert.match(source, /signOut\(\{\s*scope:\s*['"]local['"]\s*\}\)/);
    assert.match(source, /error\?\.status/);
    assert.match(source, /error\?\.code/);
    assert.match(source, /error\?\.message/);
});

test('CI valida as credenciais locais antes de iniciar o Playwright', () => {
    const pkg = JSON.parse(read('package.json'));
    const workflow = read('.github/workflows/supabase-readiness.yml');

    assert.equal(
        pkg.scripts['bootstrap:auth-fixtures'],
        'node scripts/bootstrap-local-auth-fixtures.mjs'
    );
    assert.equal(
        pkg.scripts['check:auth-fixtures'],
        'node scripts/check-local-auth-fixtures.mjs'
    );
    assert.ok(
        workflow.indexOf('npm run bootstrap:auth-fixtures')
            < workflow.indexOf('npm run check:auth-fixtures'),
        'O bootstrap Auth deve executar antes do login-probe.'
    );
    assert.ok(
        workflow.indexOf('npm run check:auth-fixtures')
            < workflow.indexOf('npx playwright test tests/e2e/supabase-auth-local.spec.js'),
        'O login-probe deve executar antes da suíte E2E Auth/RLS.'
    );
});

test('alinhamento final concede gestão de equipe à Assistente e restringe RPCs administrativas', () => {
    const sql = read('supabase/migrations/202607190001_team_management_auth_alignment.sql');

    assert.match(sql, /controllers_insert[\s\S]+technical_admin[\s\S]+federal_assistant/i);
    assert.match(sql, /controllers_update[\s\S]+technical_admin[\s\S]+federal_assistant/i);
    assert.match(sql, /inventory_members_insert[\s\S]+technical_admin[\s\S]+federal_assistant/i);
    assert.match(sql, /inventory_members_update[\s\S]+technical_admin[\s\S]+federal_assistant/i);

    const managementPolicies = sql.match(/create policy (?:controllers|inventory_members)_(?:insert|update)[\s\S]*?;/gi) || [];
    assert.equal(managementPolicies.length, 4);
    managementPolicies.forEach(policy => assert.doesNotMatch(policy, /sme_management/i));

    [
        'upsert_team_member_account',
        'deactivate_controller_account',
        'deactivate_inventory_member_account'
    ].forEach(functionName => {
        assert.match(sql, new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${functionName}`, 'i'));
        assert.match(sql, new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${functionName}[\\s\\S]+to\\s+service_role`, 'i'));
    });
    assert.doesNotMatch(sql, /grant\s+execute[\s\S]+to\s+(?:authenticated|anon)/i);
});

test('gate final exige a décima quarta migration e a Edge Function protegida', () => {
    const readiness = read('scripts/check-supabase-final-alignment.js');
    const config = read('supabase/config.toml');

    assert.match(readiness, /202607190001_team_management_auth_alignment\.sql/);
    assert.match(readiness, /activation_basic_hardening\.sql/);
    assert.match(readiness, /14 migrations/);
    assert.match(readiness, /supabase\/functions\/_shared\/team-account-domain\.mjs/);
    assert.match(readiness, /supabase\/functions\/team-account-management\/index\.ts/);
    assert.match(readiness, /src\/application\/team-account-gateway\.js/);
    assert.match(config, /\[functions\.team-account-management\][\s\S]*verify_jwt\s*=\s*true/i);
});
