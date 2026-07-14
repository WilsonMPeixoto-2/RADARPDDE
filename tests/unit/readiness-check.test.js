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

const MIGRATIONS = [
    '202607130001_core_schema.sql',
    '202607130002_auth_and_rls.sql',
    '202607130003_audit_and_import.sql',
    '202607130004_competence_bonus_deadline.sql',
    '202607130005_operational_context.sql',
    '202607130006_authorization_hardening.sql',
    '202607130007_configuration_audit_coverage.sql',
    '202607130008_atomic_invoice_operations.sql',
    '202607140009_verification_payload.sql',
    '20260714180621_preconnection_auth_and_api_grants.sql'
];

const ARTIFACTS = [
    'config.runtime.js',
    'src/auth/session-service.js',
    'src/data/repository-contract.js',
    'src/data/local-storage-repository.js',
    'src/data/supabase-repository.js',
    'src/data/repository-factory.js',
    'src/data/snapshot-tools.js',
    'src/data/legacy-state-adapter.js',
    'src/data/state-bridge.js',
    'src/data/state-bridge-metadata.js',
    'src/integration/exercise-management.js',
    'src/integration/exercise-early-init.js',
    'src/integration/auth-bootstrap.js',
    'src/integration/auth-gate.js',
    'src/vendor/supabase-client-entry.js',
    'src/types/database.types.ts',
    'vendor/supabase-client.js',
    'scripts/bootstrap-local-auth-fixtures.mjs',
    'scripts/check-local-auth-fixtures.mjs',
    'scripts/audit-functional-persistence.js',
    'scripts/build-supabase-client.mjs',
    'scripts/generate-runtime-config.mjs',
    'scripts/check-generated-artifacts.js',
    'supabase/config.toml',
    'supabase/seed.sql',
    'supabase/fixtures/auth-users.json',
    'supabase/tests/database/schema.test.sql',
    'supabase/tests/database/rls.test.sql',
    'supabase/tests/database/invoice-rpc.test.sql',
    'tests/unit/auth-database-gate.test.js',
    'tests/unit/auth-bootstrap.test.js',
    'tests/unit/auth-frontend-contract.test.js',
    'tests/unit/auth-gate.test.js',
    'tests/unit/session-service.test.js',
    'tests/e2e/supabase-auth-local.spec.js',
    'tsconfig.database-types.json',
    'docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md',
    'docs/reference/SUPABASE_INTEGRATION_AUDIT.md',
    'docs/runbooks/SUPABASE_CONNECTION.md',
    'docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md'
];

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
    const localSource = `window.RADAR_PDDE_RUNTIME_INPUT = {
        dataMode: 'local',
        features: { supabaseRepositoryEnabled: false }
    };`;
    assert.deepEqual(validateRuntimeConfigSource(localSource), []);
    assert.match(
        validateRuntimeConfigSource(`window.RADAR_PDDE_RUNTIME_INPUT = {
            dataMode: 'supabase-production',
            features: { supabaseRepositoryEnabled: true }
        };`).join(' '),
        /modo local/i
    );
});

test('valida conjunto obrigatório de migrations', () => {
    assert.deepEqual(validateMigrationManifest(MIGRATIONS), []);
    assert.match(
        validateMigrationManifest(MIGRATIONS.slice(0, -1)).join(' '),
        /20260714180621_preconnection_auth_and_api_grants\.sql/
    );
});

test('valida presença dos artefatos essenciais de preparação', () => {
    assert.deepEqual(validateReadinessArtifacts(ARTIFACTS), []);
    assert.match(
        validateReadinessArtifacts(ARTIFACTS.filter(path => path !== 'vendor/supabase-client.js')).join(' '),
        /vendor\/supabase-client\.js/
    );
});
