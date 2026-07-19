'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    scanTextForSecrets,
    validateRuntimeConfigSource,
    validateMigrationManifest,
    validateMigrationDocumentation,
    validateReadinessArtifacts,
    validateRemoteWorkflowContracts,
    validateRemoteVerificationSql,
    validateSupabaseApiSchemas,
    validateVercelBuildContract
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
    '20260714180621_preconnection_auth_and_api_grants.sql',
    '20260714220136_preconnection_transactions_and_json_contracts.sql',
    '20260714220146_preconnection_reversible_import.sql',
    '202607190001_team_management_auth_alignment.sql'
];

const ARTIFACTS = [
    'config.runtime.js',
    'src/auth/session-service.js',
    'src/data/repository-contract.js',
    'src/data/local-storage-repository.js',
    'src/data/supabase-repository.js',
    'src/data/repository-factory.js',
    'src/data/snapshot-tools.js',
    'src/data/import-coordinator.js',
    'src/data/legacy-state-adapter.js',
    'src/domain/json-contracts.js',
    'src/data/state-bridge.js',
    'src/data/state-bridge-metadata.js',
    'src/integration/exercise-management.js',
    'src/integration/exercise-early-init.js',
    'src/integration/auth-bootstrap.js',
    'src/integration/auth-gate.js',
    'src/application/team-account-gateway.js',
    'src/vendor/supabase-client-entry.js',
    'src/types/database.types.ts',
    'vendor/supabase-client.js',
    'vendor/ajv.js',
    'scripts/bootstrap-local-auth-fixtures.mjs',
    'scripts/check-local-auth-fixtures.mjs',
    'scripts/audit-functional-persistence.js',
    'scripts/build-supabase-client.mjs',
    'scripts/build-ajv.mjs',
    'scripts/migration-cli.mjs',
    'scripts/generate-runtime-config.mjs',
    'scripts/build-vercel.mjs',
    'scripts/check-generated-artifacts.js',
    'scripts/check-supabase-final-alignment.js',
    'supabase/config.toml',
    'supabase/seed.sql',
    'supabase/fixtures/auth-users.json',
    'supabase/functions/_shared/team-account-domain.mjs',
    'supabase/functions/team-account-management/index.ts',
    'supabase/tests/database/schema.test.sql',
    'supabase/tests/database/rls.test.sql',
    'supabase/tests/database/invoice-rpc.test.sql',
    'supabase/tests/database/json-contracts.test.sql',
    'supabase/tests/database/operations-rpc.test.sql',
    'supabase/tests/database/team-management-rpc.test.sql',
    'tests/unit/auth-database-gate.test.js',
    'tests/unit/auth-bootstrap.test.js',
    'tests/unit/auth-frontend-contract.test.js',
    'tests/unit/auth-gate.test.js',
    'tests/unit/session-service.test.js',
    'tests/unit/team-account-gateway.test.js',
    'tests/unit/team-account-domain.test.js',
    'tests/unit/vercel-preview-workflow.test.js',
    'tests/e2e/supabase-auth-local.spec.js',
    'tests/e2e/supabase-full-contract.spec.js',
    'tests/e2e/data-error-ux.spec.js',
    'tsconfig.database-types.json',
    'docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md',
    'docs/reference/SUPABASE_INTEGRATION_AUDIT.md',
    'docs/reference/SUPABASE_PERMISSIONS_MATRIX.md',
    'docs/runbooks/SUPABASE_CONNECTION.md',
    'docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md',
    '.github/workflows/supabase-remote-validation.yml',
    '.github/workflows/supabase-remote-post-apply.yml',
    '.github/workflows/vercel-preview-prebuilt.yml',
    'supabase/verification/remote-preflight.sql',
    'supabase/verification/remote-post-apply.sql',
    'AGENTS.md',
    'docs/PROJECT_CONTEXT.md',
    'docs/CURRENT_STAGE.md',
    'docs/DECISION_LOG.md'
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
        /202607190001_team_management_auth_alignment\.sql/
    );
});

test('impede divergência entre a contagem documentada e o diretório de migrations', () => {
    const validRunbook = `
O conjunto versionado contém atualmente **13** migrations.
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
`;
    assert.deepEqual(validateMigrationDocumentation(validRunbook, MIGRATIONS), []);

    assert.match(
        validateMigrationDocumentation(
            validRunbook.replace('**13**', '**10**'),
            MIGRATIONS
        ).join(' '),
        /declara 10 migrations.*contém 13/i
    );
    assert.match(
        validateMigrationDocumentation(
            `${validRunbook}\nAplicar, nesta ordem:\n`,
            MIGRATIONS
        ).join(' '),
        /segunda lista manual/i
    );
    assert.match(
        validateMigrationDocumentation(
            validRunbook.replace(/^supabase db push --linked$/m, ''),
            MIGRATIONS
        ).join(' '),
        /histórico do CLI/i
    );
});

test('restringe a Data API ao schema public usado pelo RADAR', () => {
    assert.deepEqual(validateSupabaseApiSchemas('schemas = ["public"]'), []);
    assert.match(
        validateSupabaseApiSchemas('schemas = ["public", "graphql_public"]').join(' '),
        /somente o schema public/i
    );
});

test('separa preflight não destrutivo de aplicação remota confirmada', () => {
    const preflight = `
on:
  workflow_dispatch:
npx --no-install supabase migration list --linked
npx --no-install supabase db push --linked --dry-run
npx --no-install supabase db query --linked --file supabase/verification/remote-preflight.sql
`;
    const postApply = `
on:
  workflow_dispatch:
APLICAR_13_MIGRATIONS_EM_AMBIENTE_DESCARTAVEL
npx --no-install supabase db push --linked --dry-run
npx --no-install supabase db push --linked --yes
remote-post-apply.sql
supabase db lint
supabase test db
supabase gen types
supabase db advisors
supabase functions deploy team-account-management
`;
    assert.deepEqual(validateRemoteWorkflowContracts(preflight, postApply), []);

    assert.match(
        validateRemoteWorkflowContracts(
            `${preflight}\nnpx --no-install supabase db push --linked`,
            postApply
        ).join(' '),
        /estritamente não destrutivo/i
    );
    assert.match(
        validateRemoteWorkflowContracts(
            preflight,
            postApply.replace(
                'supabase db push --linked --yes',
                'supabase db push --linked --yes --include-seed'
            )
        ).join(' '),
        /seed local/i
    );
    assert.match(
        validateRemoteWorkflowContracts(
            preflight.replace('  workflow_dispatch:', '  push:'),
            postApply
        ).join(' '),
        /somente acionamento manual/i
    );
});

test('mantém cada verificação SQL compatível com a execução preparada do CLI', () => {
    const preflight = `-- comentário\ndo $$\nbegin\n  raise notice 'CAPABILITY_OK';\nend\n$$;`;
    const postApply = `-- comentário\ndo $$\nbegin\n  raise notice 'MIGRATION_OK';\nend\n$$;`;
    assert.deepEqual(validateRemoteVerificationSql(preflight, postApply), []);
    assert.match(
        validateRemoteVerificationSql(
            `${preflight}\nselect 1;`,
            postApply
        ).join(' '),
        /único bloco executável/i
    );
});

test('exige build versionado e diretório público isolado na Vercel', () => {
    const packageSource = JSON.stringify({
        scripts: { 'build:vercel': 'node scripts/build-vercel.mjs' }
    });
    const vercelSource = JSON.stringify({
        buildCommand: 'npm run build:vercel',
        outputDirectory: 'dist'
    });
    assert.deepEqual(validateVercelBuildContract(vercelSource, packageSource), []);
    assert.match(
        validateVercelBuildContract(
            JSON.stringify({ outputDirectory: '.' }),
            packageSource
        ).join(' '),
        /build:vercel|diretório dist/i
    );
});

test('valida presença dos artefatos essenciais de preparação', () => {
    assert.deepEqual(validateReadinessArtifacts(ARTIFACTS), []);
    assert.match(
        validateReadinessArtifacts(ARTIFACTS.filter(path => path !== 'vendor/supabase-client.js')).join(' '),
        /vendor\/supabase-client\.js/
    );
});
