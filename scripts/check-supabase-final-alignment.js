#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const previewBuildPath = 'scripts/build-vercel.mjs';
const requiredFiles = Object.freeze([
    'src/application/team-account-gateway.js',
    'supabase/migrations/202607190001_team_management_auth_alignment.sql',
    'supabase/migrations/20260720030046_activation_basic_hardening.sql',
    'supabase/functions/_shared/team-account-domain.mjs',
    'supabase/functions/team-account-management/index.ts',
    'supabase/tests/database/team-management-rpc.test.sql',
    previewBuildPath,
    'tests/unit/vercel-preview-workflow.test.js',
    'tests/unit/vercel-preview-defaults.test.js'
]);

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function check() {
    const findings = [];
    requiredFiles.forEach(relativePath => {
        if (!fs.existsSync(path.join(root, relativePath))) {
            findings.push(`Artefato final pré-Supabase ausente: ${relativePath}`);
        }
    });
    if (findings.length > 0) return findings;

    const migration = read('supabase/migrations/202607190001_team_management_auth_alignment.sql');
    const managementPolicies = migration.match(
        /create policy (?:controllers|inventory_members)_(?:insert|update)[\s\S]*?;/gi
    ) || [];
    if (managementPolicies.length !== 4) {
        findings.push('A migration deve recriar quatro políticas de manutenção da equipe.');
    }
    managementPolicies.forEach(policy => {
        if (!/federal_assistant/i.test(policy) || !/technical_admin/i.test(policy)) {
            findings.push('Política de equipe sem Assistente e Administrador técnico.');
        }
        if (/sme_management/i.test(policy)) {
            findings.push('Gestão SME recebeu escrita indevida no diretório da equipe.');
        }
    });

    [
        'upsert_team_member_account',
        'deactivate_controller_account',
        'deactivate_inventory_member_account'
    ].forEach(functionName => {
        if (!new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${functionName}`, 'i').test(migration)) {
            findings.push(`RPC administrativa ausente: ${functionName}`);
        }
        if (!new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${functionName}[\\s\\S]*?to\\s+service_role`, 'i').test(migration)) {
            findings.push(`RPC ${functionName} não está restrita ao service_role.`);
        }
    });
    if (/grant\s+execute[\s\S]*?to\s+(?:authenticated|anon)/i.test(migration)) {
        findings.push('RPC administrativa foi exposta diretamente ao navegador.');
    }

    const config = read('supabase/config.toml');
    if (!/\[functions\.team-account-management\][\s\S]*?verify_jwt\s*=\s*true/i.test(config)) {
        findings.push('A Edge Function de contas deve exigir JWT válido.');
    }

    const authGate = read('src/integration/auth-gate.js');
    if (/technical_admin\s*:\s*['"]assistente['"]/.test(authGate)) {
        findings.push('Administrador técnico ainda herda o perfil da Assistente.');
    }
    if (!/ROLE_TO_OPERATIONAL_PROFILE/.test(authGate) || !/isTechnicalRole/.test(authGate)) {
        findings.push('Separação entre perfis funcionais e papel técnico ausente.');
    }

    const previewBuild = read(previewBuildPath);
    [
        /PREVIEW_SUPABASE_PUBLIC_RUNTIME/,
        /VERCEL_ENVIRONMENTS/,
        /vercelEnvironment\s*!==\s*['"]preview['"]/,
        /RADAR_DATA_MODE:\s*['"]supabase-preview['"]/,
        /RADAR_ENVIRONMENT:\s*['"]preview['"]/,
        /RADAR_SUPABASE_REPOSITORY_ENABLED:\s*['"]true['"]/,
        /https:\/\/scnryinorqeucbfkioxo\.supabase\.co/,
        /RADAR_SUPABASE_PUBLISHABLE_KEY:\s*['"]sb_publishable_/,
        /RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED:\s*['"]false['"]/,
        /buildRuntimeInput\(resolvedEnvironment\)/,
        /createPublicBuildManifest\(runtimeInput, resolvedEnvironment\)/
    ].forEach(pattern => {
        if (!pattern.test(previewBuild)) findings.push(`Build Vercel incompleto: ${pattern}`);
    });
    if (/VERCEL_TOKEN|VERCEL_ORG_ID|VERCEL_PROJECT_ID/.test(previewBuild)) {
        findings.push('Build automático de Preview não deve depender de segredos operacionais da Vercel.');
    }
    if (/sb_secret_/i.test(previewBuild)) {
        findings.push('Build público do Preview contém chave secreta do Supabase.');
    }

    const migrationCount = fs.readdirSync(path.join(root, 'supabase/migrations'))
        .filter(name => name.endsWith('.sql')).length;
    if (migrationCount !== 14) {
        findings.push(`Conjunto final deve conter 14 migrations; encontrado: ${migrationCount}.`);
    }

    return [...new Set(findings)];
}

function main() {
    const findings = check();
    if (findings.length > 0) {
        console.error('Alinhamento final pré-Supabase: falha');
        findings.forEach(finding => console.error(`- ${finding}`));
        process.exitCode = 1;
        return;
    }
    console.log('Alinhamento final pré-Supabase: aprovado.');
}

if (require.main === module) main();

module.exports = Object.freeze({ requiredFiles, check });
