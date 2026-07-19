#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const packageJson = require(path.join(root, 'package.json'));
const requiredFiles = [
    'config.runtime.js',
    'src/types/database.types.ts',
    'vendor/supabase-client.js',
    'vendor/ajv.js'
];

const findings = [];

for (const relativePath of requiredFiles) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
        findings.push(`${relativePath} não existe.`);
    } else if (fs.statSync(absolutePath).size === 0) {
        findings.push(`${relativePath} está vazio.`);
    }
}

const typeFile = path.join(root, 'src/types/database.types.ts');
if (fs.existsSync(typeFile)) {
    const types = fs.readFileSync(typeFile, 'utf8');
    if (!/export\s+type\s+Database|export\s+interface\s+Database/.test(types)) {
        findings.push('database.types.ts não contém o contrato Database gerado.');
    }
    [
        'registered_invoices',
        'assets',
        'verifications',
        'save_invoice_with_effects',
        'delete_invoice_with_effects',
        'upsert_team_member_account',
        'deactivate_controller_account',
        'deactivate_inventory_member_account'
    ].forEach(identifier => {
        if (!types.includes(identifier)) {
            findings.push(`database.types.ts não contém ${identifier}.`);
        }
    });
}

const runtimeConfigFile = path.join(root, 'config.runtime.js');
if (fs.existsSync(runtimeConfigFile)) {
    const source = fs.readFileSync(runtimeConfigFile, 'utf8');
    const globalAssignments = [...source.matchAll(/(?:window|globalThis)\.([A-Za-z0-9_$]+)\s*=/g)]
        .map(match => match[1]);
    if (globalAssignments.length !== 1 || globalAssignments[0] !== 'RADAR_PDDE_RUNTIME_INPUT') {
        findings.push('config.runtime.js deve definir somente window.RADAR_PDDE_RUNTIME_INPUT.');
    }
    if (!/["']dataMode["']\s*:\s*["']local["']/.test(source)
        || !/["']supabaseRepositoryEnabled["']\s*:\s*false/.test(source)) {
        findings.push('config.runtime.js versionado deve permanecer em modo local e com repositório remoto desativado.');
    }
    if (/legacyAppBridgeEnabled|sb_secret_|service_role/i.test(source)) {
        findings.push('config.runtime.js contém configuração legada ou material secreto proibido.');
    }
}

const ajvBundleFile = path.join(root, 'vendor/ajv.js');
if (fs.existsSync(ajvBundleFile)) {
    const bundle = fs.readFileSync(ajvBundleFile, 'utf8');
    const expectedVersion = packageJson.devDependencies?.ajv;
    if (!bundle.includes(`Ajv ${expectedVersion}`)) findings.push('O bundle Ajv não identifica a versão fixada.');
    if (!bundle.includes('RadarAjv')) findings.push('O bundle Ajv não expõe RadarAjv.');
}

const bundleFile = path.join(root, 'vendor/supabase-client.js');
if (fs.existsSync(bundleFile)) {
    const bundle = fs.readFileSync(bundleFile, 'utf8');
    const expectedVersion = packageJson.devDependencies?.['@supabase/supabase-js'];
    if (!bundle.includes(`@supabase/supabase-js ${expectedVersion}`)) {
        findings.push('O bundle não identifica a versão fixada de @supabase/supabase-js.');
    }
    if (!bundle.includes('RadarSupabaseClient')) {
        findings.push('O bundle não expõe RadarSupabaseClient.');
    }
}

if (findings.length === 0 && process.env.CI === 'true') {
    const diff = spawnSync(
        'git',
        ['diff', '--exit-code', '--', 'config.runtime.js', 'src/types/database.types.ts', 'vendor/supabase-client.js', 'vendor/ajv.js'],
        { cwd: root, encoding: 'utf8' }
    );
    if (diff.status !== 0) {
        findings.push('Artefatos gerados divergem do conteúdo versionado.');
        if (diff.stdout) process.stderr.write(diff.stdout);
        if (diff.stderr) process.stderr.write(diff.stderr);
    }
}

if (findings.length > 0) {
    console.error('Artefatos gerados: falha');
    findings.forEach(finding => console.error(`- ${finding}`));
    process.exitCode = 1;
} else {
    console.log('Artefatos gerados: aprovados.');
}
