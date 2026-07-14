'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    scanTextForSecrets,
    validateRuntimeConfigSource,
    validateMigrationManifest,
    validateReadinessArtifacts
} = require('../../scripts/check-supabase-readiness.js');

function jwtWithRole(role) {
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`;
}

test('detecta atribuição real de segredo Supabase', () => {
    const findings = scanTextForSecrets("SUPABASE_SERVICE_ROLE_KEY='super-secret-value'");
    assert.equal(findings.length, 1);
    assert.match(findings[0], /service role/i);

    assert.deepEqual(scanTextForSecrets('SUPABASE_SERVICE_ROLE_KEY='), []);
    assert.deepEqual(scanTextForSecrets('Nunca use service_role no frontend.'), []);
});

test('detecta JWT legado com role service_role sem bloquear JWT anon', () => {
    assert.match(
        scanTextForSecrets(`const key = '${jwtWithRole('service_role')}';`, 'config.js').join(' '),
        /jwt service_role/i
    );
    assert.deepEqual(
        scanTextForSecrets(`const key = '${jwtWithRole('anon')}';`, 'config.js'),
        []
    );
});

test('recusa configuração publicada fora do modo local', () => {
    assert.deepEqual(validateRuntimeConfigSource("dataMode: 'local'"), []);
    assert.match(
        validateRuntimeConfigSource("dataMode: 'supabase-production'").join(' '),
        /modo local/i
    );
});

test('valida conjunto obrigatório de migrations', () => {
    assert.deepEqual(validateMigrationManifest([
        '202607130001_core_schema.sql',
        '202607130002_auth_and_rls.sql',
        '202607130003_audit_and_import.sql',
        '202607130004_competence_bonus_deadline.sql',
        '202607130005_operational_context.sql'
    ]), []);

    assert.match(
        validateMigrationManifest(['202607130001_core_schema.sql']).join(' '),
        /202607130002_auth_and_rls\.sql/
    );
    assert.match(
        validateMigrationManifest([
            '202607130001_core_schema.sql',
            '202607130002_auth_and_rls.sql',
            '202607130003_audit_and_import.sql',
            '202607130004_competence_bonus_deadline.sql'
        ]).join(' '),
        /202607130005_operational_context\.sql/
    );
});

test('valida presença dos artefatos essenciais de preparação', () => {
    assert.deepEqual(validateReadinessArtifacts([
        'src/data/repository-contract.js',
        'src/data/local-storage-repository.js',
        'src/data/supabase-repository.js',
        'src/data/repository-factory.js',
        'src/data/snapshot-tools.js',
        'src/data/legacy-state-adapter.js',
        'src/data/state-bridge.js',
        'src/data/state-bridge-metadata.js',
        'src/integration/exercise-management.js',
        'scripts/audit-functional-persistence.js',
        'docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md',
        'docs/runbooks/SUPABASE_CONNECTION.md',
        'docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md'
    ]), []);

    assert.match(
        validateReadinessArtifacts(['src/data/repository-contract.js']).join(' '),
        /state-bridge-metadata\.js/
    );
});
