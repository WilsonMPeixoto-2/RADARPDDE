#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const previewBuildPath = 'scripts/build-vercel.mjs';
const corsPolicyPath = 'supabase/functions/_shared/cors-policy.mjs';
const integrityMigrationPath = 'supabase/migrations/202608040001_production_integrity_monitor.sql';
const assignmentMigrationPath = 'supabase/migrations/202608050001_school_assignment_authorization.sql';
const teamAuthRepairMigrationPath = 'supabase/migrations/202608060001_team_auth_legacy_repair.sql';
const functionalIntegrityMigrationPath = 'supabase/migrations/202608060002_functional_integrity_remediation.sql';
const schoolIdentityMigrationPath = 'supabase/migrations/202608060003_school_institutional_identity.sql';
const pendencyReanalysisMigrationPath = 'supabase/migrations/20260809165500_restrict_pendency_reanalysis_roles.sql';
const serviceAdvisoryMigrationPath = 'supabase/migrations/20260811173612_individualize_service_invoice_advisory.sql';
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
    'supabase/migrations/202607220001_atomic_verification_operations.sql',
    'supabase/migrations/202607220002_atomic_operational_commands.sql',
    'supabase/migrations/202607230001_enable_pgtap_remote_validation.sql',
    'supabase/migrations/20260723043129_security_and_rls_hardening.sql',
    'supabase/migrations/20260728182226_sme_access_governance.sql',
    integrityMigrationPath,
    assignmentMigrationPath,
    teamAuthRepairMigrationPath,
    functionalIntegrityMigrationPath,
    schoolIdentityMigrationPath,
    pendencyReanalysisMigrationPath,
    serviceAdvisoryMigrationPath,
    'supabase/functions/_shared/team-account-domain.mjs',
    corsPolicyPath,
    'supabase/functions/team-account-management/index.ts',
    'supabase/tests/database/team-management-rpc.test.sql',
    'supabase/tests/database/inventory-capital-rls.test.sql',
    'supabase/tests/database/verification-rpc.test.sql',
    'supabase/tests/database/operational-command-rpc.test.sql',
    'supabase/tests/database/sme-access-governance.test.sql',
    'supabase/tests/database/production-integrity-monitor.test.sql',
    'supabase/tests/database/school-assignment-authorization.test.sql',
    'supabase/tests/database/functional-integrity-remediation.test.sql',
    'scripts/check-production-data-integrity.mjs',
    '.github/workflows/production-data-integrity.yml',
    'tests/unit/production-data-integrity.test.js',
    'tests/unit/production-data-integrity-workflow.test.js',
    'tests/unit/functional-integrity-migration.test.js',
    'tests/unit/school-institutional-identity-migration.test.js',
    'src/domain/access-policy.js',
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

    const teamAuthRepairMigration = read(teamAuthRepairMigrationPath);
    [
        /create or replace function public\.resolve_team_auth_user_id_by_email\(p_email text\)[\s\S]*security definer/i,
        /revoke all on function public\.resolve_team_auth_user_id_by_email\(text\) from anon/i,
        /revoke all on function public\.resolve_team_auth_user_id_by_email\(text\) from authenticated/i,
        /grant execute on function public\.resolve_team_auth_user_id_by_email\(text\) to service_role/i,
        /confirmation_token\s*=\s*coalesce\(confirmation_token, ''\)/i,
        /recovery_token\s*=\s*coalesce\(recovery_token, ''\)/i,
        /email_change_token_new\s*=\s*coalesce\(email_change_token_new, ''\)/i,
        /HML-SCHOOL-manual-20260723112802/,
        /hml_controller_20260723112802/,
        /hml_inventory_20260723112802/,
        /controlador HML possui escola fora do cenário sintético/,
        /integrante HML possui bem patrimonial associado/,
        /conta HML possui escopo sobre escola real/
    ].forEach(pattern => {
        if (!pattern.test(teamAuthRepairMigration)) {
            findings.push(`Reparação Auth da Gestão de Equipe incompleta: ${pattern}`);
        }
    });
    if (/alter\s+table\s+auth\.users/i.test(teamAuthRepairMigration)) {
        findings.push('Migration não pode alterar a estrutura da tabela Auth gerenciada.');
    }

    const config = read('supabase/config.toml');
    if (!/\[functions\.team-account-management\][\s\S]*?verify_jwt\s*=\s*true/i.test(config)) {
        findings.push('A Edge Function de contas deve exigir JWT válido.');
    }

    const edgeFunction = read('supabase/functions/team-account-management/index.ts');
    const corsPolicy = read(corsPolicyPath);
    const edgeUsesSharedCors = /from\s+["']\.\.\/_shared\/cors-policy\.mjs["']/.test(edgeFunction)
        && /corsHeadersForOrigin\s*\(/.test(edgeFunction)
        && /req\.headers\.get\(["']Origin["']\)/.test(edgeFunction)
        && !/requiredEnv\(["']RADAR_ALLOWED_ORIGIN["']\)/.test(edgeFunction);
    const policyIsFailClosed = /https:\/\/radarpdde-fix\.vercel\.app/.test(corsPolicy)
        && /throw new Error\(["']ORIGIN_DENIED: origem não autorizada["']\)/.test(corsPolicy)
        && /['"]Access-Control-Allow-Origin['"]\s*:\s*origin/.test(corsPolicy)
        && /['"]Access-Control-Allow-Methods['"]\s*:\s*['"]POST, OPTIONS['"]/.test(corsPolicy)
        && /['"]Vary['"]\s*:\s*['"]Origin['"]/.test(corsPolicy)
        && !/Access-Control-Allow-Origin[\s\S]{0,100}['"]\*['"]/.test(corsPolicy)
        && !/configuredOrigins\([\s\S]{0,300}['"]\*['"]/.test(corsPolicy);
    if (!edgeUsesSharedCors || !policyIsFailClosed) {
        findings.push('A Edge Function deve aplicar CORS fail-closed com allowlist explícita e política compartilhada.');
    }
    if (!/admin\.rpc\(["']resolve_team_auth_user_id_by_email["']/.test(edgeFunction)
        || /admin\.auth\.admin\.listUsers/.test(edgeFunction)) {
        findings.push('A Gestão de Equipe deve resolver somente o usuário Auth solicitado, sem varredura global.');
    }

    const securityMigration = read('supabase/migrations/20260723043129_security_and_rls_hardening.sql');
    [
        /create schema if not exists radar_private/i,
        /function public\.current_app_role\(\)[\s\S]*security invoker/i,
        /function public\.can_access_school\(p_school_id text\)[\s\S]*security invoker/i,
        /function public\.delete_invoice_with_effects[\s\S]*security invoker/i,
        /alter function radar_private\.delete_invoice_with_effects[\s\S]*rename to delete_invoice_with_effects_impl/i
    ].forEach(pattern => {
        if (!pattern.test(securityMigration)) findings.push(`Hardening Supabase incompleto: ${pattern}`);
    });

    const smeAccessMigration = read(
        'supabase/migrations/20260728182226_sme_access_governance.sql'
    );
    [
        /current_app_role\(\)\)\s*=\s*'sme_management'[\s\S]+actor_user_id\s*=\s*\(select auth\.uid\(\)\)/i,
        /current_app_role\(\)\)\s*=\s*'technical_admin'/i,
        /create policy administrative_logs_insert[\s\S]+actor_user_id\s*=\s*\(select auth\.uid\(\)\)/i
    ].forEach(pattern => {
        if (!pattern.test(smeAccessMigration)) {
            findings.push(`Governança de acesso da Gestão SME incompleta: ${pattern}`);
        }
    });

    const integrityMigration = read(integrityMigrationPath);
    [
        /function radar_private\.production_integrity_check\(\)[\s\S]*security definer/i,
        /function public\.production_integrity_check\(\)[\s\S]*security invoker/i,
        /revoke all on function public\.production_integrity_check\(\) from anon/i,
        /revoke all on function public\.production_integrity_check\(\) from authenticated/i,
        /grant execute on function public\.production_integrity_check\(\) to service_role/i,
        /'schemaVersion',\s*1/i,
        /'totalIssues'/i,
        /active_controllers_without_user_id/i,
        /linked_invoice_asset_context_mismatch/i
    ].forEach(pattern => {
        if (!pattern.test(integrityMigration)) {
            findings.push(`Auditoria de integridade de Production incompleta: ${pattern}`);
        }
    });

    const assignmentMigration = read(assignmentMigrationPath);
    [
        /function public\.enforce_school_controller_assignment_authorization\(\)[\s\S]*security invoker/i,
        /old\.controller_id is distinct from new\.controller_id/i,
        /v_role not in \('federal_assistant', 'technical_admin'\)/i,
        /create trigger schools_controller_assignment_authorization[\s\S]*before update of controller_id on public\.schools/i
    ].forEach(pattern => {
        if (!pattern.test(assignmentMigration)) {
            findings.push(`Autorização da carteira escolar incompleta: ${pattern}`);
        }
    });

    const pendencyReanalysisMigration = read(pendencyReanalysisMigrationPath);
    [
        /function public\.reanalyze_pendency_with_verification/i,
        /v_role\s+text\s*:=\s*public\.current_app_role\(\)/i,
        /v_role\s+not\s+in\s*\('technical_admin',\s*'federal_assistant',\s*'controller'\)/i,
        /AUTHORIZATION_DENIED:\s*perfil/i,
        /public\.can_write_school\(v_existing_pendency\.school_id\)/i
    ].forEach(pattern => {
        if (!pattern.test(pendencyReanalysisMigration)) {
            findings.push(`Autorização da reanálise de pendências incompleta: ${pattern}`);
        }
    });

    const serviceAdvisoryMigration = read(serviceAdvisoryMigrationPath);
    [
        /consultaAssessoriaEnviada/i,
        /analiseConsultaAssessoria/i,
        /service_invoice_count\s*=\s*1/i,
        /else false/i,
        /else 'Não analisado'/i,
        /bool_and\(advisory_sent\)/i,
        /bool_or\(advisory_analysis\s*=\s*'Incorreto'\)/i
    ].forEach(pattern => {
        if (!pattern.test(serviceAdvisoryMigration)) {
            findings.push(`Individualização da consulta contábil por NF incompleta: ${pattern}`);
        }
    });

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
    if (migrationCount !== 32) {
        findings.push(`Conjunto final deve conter 32 migrations; encontrado: ${migrationCount}.`);
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
