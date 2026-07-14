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
    '20260714180621_preconnection_auth_and_api_grants.sql'
]);

const REQUIRED_ARTIFACTS = Object.freeze([
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
    'scripts/check-local-auth-fixtures.mjs',
    'scripts/audit-functional-persistence.js',
    'scripts/build-supabase-client.mjs',
    'scripts/generate-runtime-config.mjs',
    'scripts/check-generated-artifacts.js',
    'supabase/config.toml',
    'supabase/seed.sql',
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
        ...listFilesRecursively(path.join(rootDir, '.github', 'workflows'))
    ];

    scanFiles
        .filter(filePath => fs.existsSync(filePath))
        .filter(filePath => /\.(?:js|mjs|cjs|json|ya?ml|env)$/i.test(filePath))
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
    validateReadinessArtifacts,
    runReadinessChecks
});
