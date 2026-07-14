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

test('migration fecha Data API anônima e concede somente operações sujeitas a RLS', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    assert.match(sql, /revoke\s+all\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon/i);
    assert.match(sql, /revoke\s+all\s+on\s+all\s+sequences\s+in\s+schema\s+public\s+from\s+anon/i);
    assert.match(sql, /grant\s+usage\s+on\s+schema\s+public\s+to\s+authenticated/i);
    assert.match(sql, /grant\s+select[\s\S]+profiles[\s\S]+user_profiles[\s\S]+user_school_scopes[\s\S]+to\s+authenticated/i);
    assert.match(sql, /grant\s+select,\s*insert,\s*update,\s*delete[\s\S]+to\s+authenticated/i);
    assert.match(sql, /alter\s+default\s+privileges[\s\S]+revoke\s+all[\s\S]+from\s+anon/i);
    assert.doesNotMatch(sql, /service_role/i);
});

test('fixture local contém cinco identidades e vínculos institucionais determinísticos', () => {
    const seed = fs.readFileSync(path.join(root, 'supabase/seed.sql'), 'utf8');

    ['controller', 'federal_assistant', 'inventory', 'sme_management', 'technical_admin']
        .forEach(profile => assert.match(seed, new RegExp(`['\"]${profile}['\"]`)));
    assert.match(seed, /insert\s+into\s+auth\.users/i);
    assert.match(seed, /insert\s+into\s+auth\.identities/i);
    assert.match(seed, /insert\s+into\s+public\.user_profiles/i);
    assert.match(seed, /insert\s+into\s+public\.user_school_scopes/i);
});
