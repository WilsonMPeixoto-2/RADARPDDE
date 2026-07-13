#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_MIGRATIONS = Object.freeze([
    '202607130001_core_schema.sql',
    '202607130002_auth_and_rls.sql',
    '202607130003_audit_and_import.sql'
]);

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
    const localModePattern = /dataMode\s*:\s*(?:api\.)?DATA_MODES\.LOCAL|dataMode\s*:\s*['"]local['"]/;
    if (!localModePattern.test(text)) {
        findings.push('A configuração publicada deve permanecer em modo local.');
    }

    const repositoryDisabled = /supabaseRepositoryEnabled\s*:\s*false/;
    const bridgeDisabled = /legacyAppBridgeEnabled\s*:\s*false/;
    if (text.includes('RADAR_PDDE_CONFIG') && !repositoryDisabled.test(text)) {
        findings.push('A feature flag supabaseRepositoryEnabled deve permanecer false na configuração publicada.');
    }
    if (text.includes('RADAR_PDDE_CONFIG') && !bridgeDisabled.test(text)) {
        findings.push('A feature flag legacyAppBridgeEnabled deve permanecer false na configuração publicada.');
    }
    return findings;
}

function validateMigrationManifest(fileNames) {
    const available = new Set(fileNames || []);
    return REQUIRED_MIGRATIONS
        .filter(name => !available.has(name))
        .map(name => `Migration obrigatória ausente: ${name}`);
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
    const migrationsDir = path.join(rootDir, 'supabase', 'migrations');

    if (!fs.existsSync(configPath)) {
        findings.push('config.js não encontrado.');
    } else {
        const configSource = fs.readFileSync(configPath, 'utf8');
        findings.push(...validateRuntimeConfigSource(configSource));
        findings.push(...scanTextForSecrets(configSource, 'config.js'));
    }

    const migrationFiles = fs.existsSync(migrationsDir)
        ? fs.readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort()
        : [];
    findings.push(...validateMigrationManifest(migrationFiles));

    migrationFiles.forEach(name => {
        const source = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
        if (/service_role|sb_secret_/i.test(source)) {
            findings.push(`${name}: migration não deve conter credenciais ou nomes de chaves secretas.`);
        }
    });

    const scanRoots = [
        path.join(rootDir, 'src'),
        path.join(rootDir, 'scripts')
    ];
    scanRoots.flatMap(listFilesRecursively)
        .filter(filePath => /\.(?:js|mjs|cjs|json|env)$/i.test(filePath))
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

    return findings;
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
    scanTextForSecrets,
    validateRuntimeConfigSource,
    validateMigrationManifest,
    runReadinessChecks
});
