'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '../..');
const canonicalMigration = path.join(
    repositoryRoot,
    'supabase/migrations/20260728190344_sme_access_governance.sql'
);
const obsoleteMigration = path.join(
    repositoryRoot,
    'supabase/migrations/20260728182226_sme_access_governance.sql'
);

test('alinha a migration SME ao identificador registrado em Production', () => {
    assert.equal(
        fs.existsSync(canonicalMigration),
        true,
        'a migration canônica deve usar a versão remota 20260728190344'
    );
    assert.equal(
        fs.existsSync(obsoleteMigration),
        false,
        'o identificador local divergente 20260728182226 não deve permanecer versionado'
    );
});
