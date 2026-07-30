'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const repositoryRoot = path.resolve(__dirname, '../..');
const canonicalMigration = path.join(
    repositoryRoot,
    'supabase/migrations/20260728182226_sme_access_governance.sql'
);
const derivedMigration = path.join(
    repositoryRoot,
    'supabase/migrations/20260728190344_sme_access_governance.sql'
);
const expectedSha256 = 'cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e';

test('preserva a versão canônica da migration SME no repositório', () => {
    assert.equal(
        fs.existsSync(canonicalMigration),
        true,
        'a migration canônica deve permanecer na versão criada e testada no GitHub'
    );
    assert.equal(
        fs.existsSync(derivedMigration),
        false,
        'o identificador derivado da aplicação remota não deve ser versionado'
    );

    const content = fs.readFileSync(canonicalMigration, 'utf8').replace(/\n$/, '');
    const sha256 = crypto.createHash('sha256').update(content).digest('hex');
    assert.equal(sha256, expectedSha256, 'o SQL canônico não pode ser alterado durante a reconciliação');
});
