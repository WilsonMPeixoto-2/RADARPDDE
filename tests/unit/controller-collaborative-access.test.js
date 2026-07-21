'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('migration 16 usa a CRE como fronteira e não a carteira individual', () => {
    const migration = read('supabase/migrations/20260721090000_controller_collaborative_cre_access.sql');

    assert.match(migration, /up\.profile_id\s*=\s*'controller'/i);
    assert.match(migration, /s\.cre\s*=\s*up\.cre_scope/i);
    assert.match(migration, /up\.cre_scope\s+is\s+not\s+null/i);
    assert.doesNotMatch(
        migration,
        /s\.controller_id\s*=\s*public\.current_controller_id\(\)/i
    );
    assert.match(migration, /user_school_scopes[\s\S]+can_write\s*=\s*true/i);
});

test('readiness exige a migration colaborativa e aceita referências ao secret store', () => {
    const {
        REQUIRED_MIGRATIONS,
        scanTextForSecrets
    } = require('../../scripts/check-supabase-readiness.js');

    assert.ok(REQUIRED_MIGRATIONS.includes(
        '20260721090000_controller_collaborative_cre_access.sql'
    ));
    assert.deepEqual(
        scanTextForSecrets(
            'RADAR_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.RADAR_SUPABASE_SERVICE_ROLE_KEY }}',
            'workflow.yml'
        ),
        []
    );
    assert.match(
        scanTextForSecrets(
            'RADAR_SUPABASE_SERVICE_ROLE_KEY: valor-real-versionado',
            'workflow.yml'
        ).join(' '),
        /service role/i
    );
});
