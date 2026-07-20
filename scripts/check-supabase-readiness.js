#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_MIGRATIONS = Object.freeze([
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
    '202607190001_team_management_auth_alignment.sql',
    '20260720030046_activation_basic_hardening.sql'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
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
    'scripts/export-local-snapshot.mjs',
    'scripts/lib/remote-bootstrap.mjs',
    'scripts/bootstrap-supabase-remote.mjs',
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
    'docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md',
    '.github/workflows/supabase-remote-validation.yml',
    '.github/workflows/supabase-remote-post-apply.yml',
    '.github/workflows/vercel-preview-prebuilt.yml',
    'supabase/verification/remote-preflight.sql',
    'supabase/verification/remote-post-apply.sql',
    'AGENTS.md',
    'docs/PROJECT_CONTEXT.md',
    'docs/CURRENT_STAGE.md',
    'docs/DECISION_LOG.md'
]);

function decodeJwtRole(token) {
    const parts = String(token || '').split('.');
    if (parts.length < 2 || !parts[1]) return '';
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return String(payload?.role || '').trim().toLowerCase();
    } catch (error) {
        return '';
    }
}

function scanTextForSecrets(text, label = 'arquivo') {
    const findings = [];
    const source = String(text || '');

    const serviceRoleAssignment = /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"]?([^\s'"#]+)['"]?/gi;
    let match;
    while ((match = serviceRoleAssignment.exec(source)) !== null) {
        const value = String(match[1] || '').trim();
        if (value && !['changeme', 'example', 'placeholder'].includes(value.toLowerCase())) {
            findings.push(`${label}: chave service role atribuída no repositório.`);
        }
    }

    const secretKeyPattern = /sb_secret_[A-Za-z0-9_-]{8,}/g;
    if (secretKeyPattern.test(source)) {
        findings.push(`${label}: chave sb_secret_ encontrada no repositório.`);
    }

    const jwtPattern = /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*\b/g;
    const jwtTokens = source.match(jwtPattern) || [];
    if (jwtTokens.some(token => decodeJwtRole(token) === 'service_role')) {
        findings.push(`${label}: JWT service_role encontrado no repositório.`);
    }

    const databasePasswordAssignment = /(?:SUPABASE_)?(?:DB|DATABASE)_PASSWORD\s*[:=]\s*['"]?([^\s'"#]+)['"]?/gi;
    while ((match = databasePasswordAssignment.exec(source)) !== null) {
        const value = String(match[1] || '').trim();
        if (value && !['changeme', 'example', 'placeholder'].includes(value.toLowerCase())) {
            findings.push(`${label}: senha de banco atribuída no repositório.`);
        }
    }

    return findings;
}

function validateRuntimeConfigSource(source) {
    const findings = [];
    const text = String(source || '');
    const localModePattern = /["']?dataMode["']?\s*:\s*['"]local['"]/;
    if (!localModePattern.test(text)) {
        findings.push('A configuração publicada deve permanecer em modo local.');
    }

    const repositoryDisabled = /["']?supabaseRepositoryEnabled["']?\s*:\s*false/;
    if (!text.includes('RADAR_PDDE_RUNTIME_INPUT')) {
        findings.push('config.runtime.js deve definir RADAR_PDDE_RUNTIME_INPUT.');
    }
    if (!repositoryDisabled.test(text)) {
        findings.push('A feature flag supabaseRepositoryEnabled deve permanecer false na configuração publicada.');
    }
    if (/legacyAppBridgeEnabled/i.test(text)) {
        findings.push('A configuração publicada não deve conter a ponte legada do Supabase.');
    }
    return findings;
}

function validateMigrationManifest(fileNames) {
    const available = new Set(fileNames || []);
    return REQUIRED_MIGRATIONS
        .filter(name => !available.has(name))
        .map(name => `Migration obrigatória ausente: ${name}`);
}

function validateReadinessArtifacts(fileNames) {
    const available = new Set(fileNames || []);
    return REQUIRED_ARTIFACTS
        .filter(name => !available.has(name))
        .map(name => `Artefato obrigatório ausente: ${name}`);
}

function validateMigrationDocumentation(source, migrationFileNames) {
    const findings = [];
    const text = String(source || '');
    const migrationCount = (migrationFileNames || []).filter(name => name.endsWith('.sql')).length;
    const documentedCount = text.match(/conjunto versionado contém atualmente \*\*(\d+)\*\* migrations/i);

    if (!documentedCount) {
        findings.push('SUPABASE_CONNECTION.md deve declarar a contagem versionada de migrations.');
    } else if (Number.parseInt(documentedCount[1], 10) !== migrationCount) {
        findings.push(
            `SUPABASE_CONNECTION.md declara ${documentedCount[1]} migrations, mas o diretório contém ${migrationCount}.`
        );
    }

    const commandLines = text.split(/\r?\n/).map(line => line.trim());
    const hasDryRun = commandLines.some(line => /^supabase db push --linked --dry-run\s*$/.test(line));
    const hasEffectivePush = commandLines.some(line => /^supabase db push --linked\s*$/.test(line));
    const hasMigrationList = commandLines.some(line => /^supabase migration list --linked\s*$/.test(line));
    if (!hasDryRun || !hasEffectivePush || !hasMigrationList) {
        findings.push('SUPABASE_CONNECTION.md deve usar o histórico do CLI como fonte de ordem das migrations.');
    }

    if (/Aplicar, nesta ordem:/i.test(text)) {
        findings.push('SUPABASE_CONNECTION.md não deve manter uma segunda lista manual de migrations.');
    }

    return findings;
}

function validateSupabaseApiSchemas(source) {
    const match = String(source || '').match(/^schemas\s*=\s*\[([^\]]*)\]/m);
    if (!match) return ['supabase/config.toml deve declarar explicitamente os schemas da Data API.'];

    const schemas = [...match[1].matchAll(/["']([^"']+)["']/g)].map(item => item[1]);
    if (schemas.length !== 1 || schemas[0] !== 'public') {
        return ['A Data API do RADAR deve expor somente o schema public; GraphQL não é uma dependência funcional.'];
    }
    return [];
}

function workflowCommandLines(source, command) {
    return String(source || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.includes(command));
}

function validateRemoteWorkflowContracts(preflightSource, postApplySource) {
    const findings = [];
    const preflight = String(preflightSource || '');
    const postApply = String(postApplySource || '');
    const preflightPushes = workflowCommandLines(preflight, 'supabase db push');
    const postApplyPushes = workflowCommandLines(postApply, 'supabase db push');

    [
        ['preflight', preflight],
        ['pós-aplicação', postApply]
    ].forEach(([name, workflow]) => {
        if (!/^\s{2}workflow_dispatch:\s*$/m.test(workflow)
            || /^\s{2}(?:push|pull_request|schedule|workflow_run):\s*$/m.test(workflow)) {
            findings.push(`O workflow de ${name} deve possuir somente acionamento manual.`);
        }
    });

    if (preflightPushes.length === 0 || preflightPushes.some(line => !line.includes('--dry-run'))) {
        findings.push('O workflow de preflight deve ser estritamente não destrutivo e usar apenas db push --dry-run.');
    }
    if (!preflight.includes('remote-preflight.sql') || !preflight.includes('supabase migration list')) {
        findings.push('O preflight remoto deve verificar capacidades e registrar o histórico de migrations.');
    }

    const dryRunIndex = postApplyPushes.findIndex(line => line.includes('--dry-run'));
    const applyIndex = postApplyPushes.findIndex(line => !line.includes('--dry-run'));
    if (dryRunIndex < 0 || applyIndex < 0 || dryRunIndex > applyIndex) {
        findings.push('O workflow pós-aplicação deve executar dry-run antes do db push efetivo.');
    }
    if (!postApply.includes('APLICAR_13_MIGRATIONS_EM_AMBIENTE_DESCARTAVEL')) {
        findings.push('O workflow pós-aplicação exige confirmação textual das 13 migrations no alvo descartável.');
    }
    if (applyIndex >= 0 && !postApplyPushes[applyIndex].includes('--yes')) {
        findings.push('O db push efetivo deve ser não interativo somente após a confirmação explícita.');
    }
    [
        'remote-post-apply.sql',
        'supabase db lint',
        'supabase test db',
        'supabase gen types',
        'supabase db advisors',
        'supabase functions deploy team-account-management'
    ].forEach(fragment => {
        if (!postApply.includes(fragment)) {
            findings.push(`Workflow pós-aplicação incompleto: ${fragment} ausente.`);
        }
    });

    if (/--include-seed\b/.test(preflight) || /--include-seed\b/.test(postApply)) {
        findings.push('Workflows remotos não podem executar seed local.');
    }

    return findings;
}

function validateRemoteVerificationSql(preflightSource, postApplySource) {
    const findings = [];
    [
        ['preflight', preflightSource, 'CAPABILITY_OK'],
        ['pós-aplicação', postApplySource, 'MIGRATION_OK']
    ].forEach(([name, source, evidenceMarker]) => {
        const sql = String(source || '').trim();
        const singleDoBlock = /^(?:--[^\r\n]*(?:\r?\n|$))*\s*do\s+\$\$[\s\S]*\$\$;\s*$/i;
        if (!singleDoBlock.test(sql)) {
            findings.push(`A verificação SQL de ${name} deve conter um único bloco executável.`);
        }
        if (!sql.includes(evidenceMarker)) {
            findings.push(`A verificação SQL de ${name} deve registrar evidências seguras.`);
        }
    });
    return findings;
}

function validateVercelBuildContract(vercelSource, packageSource) {
    const findings = [];
    let vercelConfig;
    let packageConfig;
    try {
        vercelConfig = JSON.parse(String(vercelSource || ''));
    } catch (error) {
        findings.push('vercel.json inválido.');
    }
    try {
        packageConfig = JSON.parse(String(packageSource || ''));
    } catch (error) {
        findings.push('package.json inválido.');
    }

    if (vercelConfig?.buildCommand !== 'npm run build:vercel') {
        findings.push('A Vercel deve executar npm run build:vercel.');
    }
    if (vercelConfig?.outputDirectory !== 'dist') {
        findings.push('A Vercel deve publicar exclusivamente o diretório dist.');
    }
    if (packageConfig?.scripts?.['build:vercel'] !== 'node scripts/build-vercel.mjs') {
        findings.push('package.json deve definir o build Vercel versionado.');
    }
    return findings;
}

function validateRemoteBootstrapCommands(packageSource) {
    let packageConfig;
    try {
        packageConfig = JSON.parse(String(packageSource || ''));
    } catch (error) {
        return ['package.json inválido.'];
    }
    const required = {
        'bootstrap:supabase:validate': 'node scripts/bootstrap-supabase-remote.mjs validate',
        'bootstrap:supabase:plan': 'node scripts/bootstrap-supabase-remote.mjs plan',
        'bootstrap:supabase:import': 'node scripts/bootstrap-supabase-remote.mjs import',
        'bootstrap:supabase:reconcile': 'node scripts/bootstrap-supabase-remote.mjs reconcile',
        'snapshot:export:local': 'node scripts/export-local-snapshot.mjs'
    };
    return Object.entries(required)
        .filter(([name, command]) => packageConfig?.scripts?.[name] !== command)
        .map(([name]) => `Comando obrigatório ausente ou divergente: ${name}.`);
}

function listFilesRecursively(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return listFilesRecursively(absolute);
        return [absolute];
    });
}

function relative(rootDir, filePath) {
    return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function runReadinessChecks(rootDir = path.resolve(__dirname, '..')) {
    const findings = [];
    const configPath = path.join(rootDir, 'config.js');
    const runtimeConfigPath = path.join(rootDir, 'config.runtime.js');
    const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
    const connectionRunbookPath = path.join(rootDir, 'docs', 'runbooks', 'SUPABASE_CONNECTION.md');
    const supabaseConfigPath = path.join(rootDir, 'supabase', 'config.toml');
    const preflightWorkflowPath = path.join(rootDir, '.github', 'workflows', 'supabase-remote-validation.yml');
    const postApplyWorkflowPath = path.join(rootDir, '.github', 'workflows', 'supabase-remote-post-apply.yml');
    const vercelConfigPath = path.join(rootDir, 'vercel.json');
    const packagePath = path.join(rootDir, 'package.json');
    const preflightSqlPath = path.join(rootDir, 'supabase', 'verification', 'remote-preflight.sql');
    const postApplySqlPath = path.join(rootDir, 'supabase', 'verification', 'remote-post-apply.sql');

    if (!fs.existsSync(configPath)) {
        findings.push('config.js não encontrado.');
    } else {
        const configSource = fs.readFileSync(configPath, 'utf8');
        findings.push(...scanTextForSecrets(configSource, 'config.js'));
        if (!/createRuntimeConfig\(root\.RADAR_PDDE_RUNTIME_INPUT\s*\|\|\s*\{\}\)/.test(configSource)) {
            findings.push('config.js deve consumir exclusivamente RADAR_PDDE_RUNTIME_INPUT.');
        }
        if (/legacyAppBridgeEnabled/i.test(configSource)) {
            findings.push('config.js ainda contém a ponte legada do Supabase.');
        }
    }

    if (!fs.existsSync(runtimeConfigPath)) {
        findings.push('config.runtime.js não encontrado.');
    } else {
        const runtimeConfigSource = fs.readFileSync(runtimeConfigPath, 'utf8');
        findings.push(...validateRuntimeConfigSource(runtimeConfigSource));
        findings.push(...scanTextForSecrets(runtimeConfigSource, 'config.runtime.js'));
    }

    const migrationFiles = fs.existsSync(migrationsDir)
        ? fs.readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort()
        : [];
    findings.push(...validateMigrationManifest(migrationFiles));

    const connectionRunbook = fs.existsSync(connectionRunbookPath)
        ? fs.readFileSync(connectionRunbookPath, 'utf8')
        : '';
    findings.push(...validateMigrationDocumentation(connectionRunbook, migrationFiles));

    const supabaseConfigSource = fs.existsSync(supabaseConfigPath)
        ? fs.readFileSync(supabaseConfigPath, 'utf8')
        : '';
    findings.push(...validateSupabaseApiSchemas(supabaseConfigSource));

    const preflightWorkflowSource = fs.existsSync(preflightWorkflowPath)
        ? fs.readFileSync(preflightWorkflowPath, 'utf8')
        : '';
    const postApplyWorkflowSource = fs.existsSync(postApplyWorkflowPath)
        ? fs.readFileSync(postApplyWorkflowPath, 'utf8')
        : '';
    findings.push(...validateRemoteWorkflowContracts(
        preflightWorkflowSource,
        postApplyWorkflowSource
    ));

    const preflightSqlSource = fs.existsSync(preflightSqlPath)
        ? fs.readFileSync(preflightSqlPath, 'utf8')
        : '';
    const postApplySqlSource = fs.existsSync(postApplySqlPath)
        ? fs.readFileSync(postApplySqlPath, 'utf8')
        : '';
    findings.push(...validateRemoteVerificationSql(preflightSqlSource, postApplySqlSource));

    const vercelConfigSource = fs.existsSync(vercelConfigPath)
        ? fs.readFileSync(vercelConfigPath, 'utf8')
        : '';
    const packageSource = fs.existsSync(packagePath)
        ? fs.readFileSync(packagePath, 'utf8')
        : '';
    findings.push(...validateVercelBuildContract(vercelConfigSource, packageSource));
    findings.push(...validateRemoteBootstrapCommands(packageSource));

    migrationFiles.forEach(name => {
        const source = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
        if (/sb_secret_/i.test(source)) {
            findings.push(`${name}: migration não deve conter credenciais secretas.`);
        }
    });

    const artifactFiles = REQUIRED_ARTIFACTS.filter(fileName => (
        fs.existsSync(path.join(rootDir, fileName))
    ));
    findings.push(...validateReadinessArtifacts(artifactFiles));

    const scanFiles = [
        path.join(rootDir, 'app.js'),
        path.join(rootDir, 'package.json'),
        ...listFilesRecursively(path.join(rootDir, 'src')),
        ...listFilesRecursively(path.join(rootDir, 'scripts')),
        ...listFilesRecursively(path.join(rootDir, 'supabase', 'functions')),
        ...listFilesRecursively(path.join(rootDir, '.github', 'workflows'))
    ];

    scanFiles
        .filter(filePath => fs.existsSync(filePath))
        .filter(filePath => /\.(?:js|mjs|cjs|ts|json|ya?ml|env)$/i.test(filePath))
        .forEach(filePath => {
            const source = fs.readFileSync(filePath, 'utf8');
            findings.push(...scanTextForSecrets(source, relative(rootDir, filePath)));
        });

    const envExample = path.join(rootDir, '.env.example');
    if (!fs.existsSync(envExample)) {
        findings.push('.env.example não encontrado.');
    } else {
        const envText = fs.readFileSync(envExample, 'utf8');
        findings.push(...scanTextForSecrets(envText, '.env.example'));
        if (!/^RADAR_DATA_MODE=local$/m.test(envText)) {
            findings.push('.env.example deve manter RADAR_DATA_MODE=local.');
        }
    }

    return [...new Set(findings)];
}

function main() {
    const findings = runReadinessChecks();
    if (findings.length > 0) {
        console.error('Supabase readiness: falha');
        findings.forEach(finding => console.error(`- ${finding}`));
        process.exitCode = 1;
        return;
    }
    console.log('Supabase readiness: aprovado — modo local preservado e artefatos presentes.');
}

if (require.main === module) {
    main();
}

module.exports = Object.freeze({
    REQUIRED_MIGRATIONS,
    REQUIRED_ARTIFACTS,
    decodeJwtRole,
    scanTextForSecrets,
    validateRuntimeConfigSource,
    validateMigrationManifest,
    validateMigrationDocumentation,
    validateRemoteWorkflowContracts,
    validateRemoteVerificationSql,
    validateReadinessArtifacts,
    validateSupabaseApiSchemas,
    validateVercelBuildContract,
    validateRemoteBootstrapCommands,
    runReadinessChecks
});
