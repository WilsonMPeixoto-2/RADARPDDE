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
    'supabase/migrations/20260720193000_performance_and_rls_hardening.sql',
    'supabase/migrations/20260721090000_controller_collaborative_cre_access.sql',
    'supabase/migrations/20260721152515_inventory_cre_read_access.sql',
    'supabase/migrations/20260721152634_inventory_capital_section_scope.sql',
    'supabase/migrations/20260721153758_inventory_capital_section_inline_scope.sql',
    'supabase/migrations/20260721160056_inventory_generic_asset_scope_by_cre.sql',
    'supabase/functions/_shared/team-account-domain.mjs',
    'supabase/functions/team-account-management/index.ts',
    'supabase/tests/database/team-management-rpc.test.sql',
    'supabase/tests/database/inventory-capital-rls.test.sql',
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

    const collaborativeMigration = read('supabase/migrations/20260721090000_controller_collaborative_cre_access.sql');
    if (!/profile_id\s*=\s*'controller'/i.test(collaborativeMigration)
        || !/s\.cre\s*=\s*up\.cre_scope/i.test(collaborativeMigration)) {
        findings.push('Acesso colaborativo dos Controladores por CRE não está formalizado.');
    }
    if (/s\.controller_id\s*=\s*public\.current_controller_id\(\)/i.test(collaborativeMigration)) {
        findings.push('A migration colaborativa ainda usa a carteira como fronteira de autorização.');
    }

    const inventoryMigration = read('supabase/migrations/20260721153758_inventory_capital_section_inline_scope.sql');
    [
        /create policy schools_read[\s\S]+profile_id\s*=\s*'inventory'[\s\S]+schools\.cre\s*=\s*up\.cre_scope/i,
        /create policy school_programs_read[\s\S]+profile_id\s*=\s*'inventory'[\s\S]+s\.cre\s*=\s*up\.cre_scope/i,
        /create policy assets_read[\s\S]+profile_id\s*=\s*'inventory'[\s\S]+s\.cre\s*=\s*up\.cre_scope/i,
        /create policy assets_update[\s\S]+current_app_role\(\)\s*=\s*'inventory'/i,
        /drop function if exists public\.inventory_can_access_cre_school\(text\)/i
    ].forEach(pattern => {
        if (!pattern.test(inventoryMigration)) {
            findings.push(`Escopo final de Capital e Inventário incompleto: ${pattern}`);
        }
    });
    if (/create\s+or\s+replace\s+function\s+public\.can_write_school/i.test(inventoryMigration)) {
        findings.push('A migration patrimonial ampliou indevidamente a escrita cadastral do Inventário.');
    }

    const inventoryBoundaryMigration = read(
        'supabase/migrations/20260721160056_inventory_generic_asset_scope_by_cre.sql'
    );
    [
        /current_app_role\(\)\s*=\s*'inventory'/i,
        /join public\.assets a[\s\S]+a\.school_id\s*=\s*s\.id/i,
        /up\.profile_id\s*=\s*'inventory'/i,
        /s\.cre\s*=\s*up\.cre_scope/i
    ].forEach(pattern => {
        if (!pattern.test(inventoryBoundaryMigration)) {
            findings.push(`Fronteira de CRE do Inventário incompleta: ${pattern}`);
        }
    });

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
    if (migrationCount !== 20) {
        findings.push(`Conjunto final deve conter 20 migrations; encontrado: ${migrationCount}.`);
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
