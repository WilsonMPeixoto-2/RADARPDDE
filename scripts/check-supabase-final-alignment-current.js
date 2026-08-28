#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const legacyAlignment = require('./check-supabase-final-alignment.js');

const root = path.resolve(__dirname, '..');
const EXPECTED_MIGRATION_COUNT = 43;
const OBSOLETE_FINDINGS = Object.freeze([
    'Build Vercel incompleto: /RADAR_DATA_MODE:\\s*[\'\"]supabase-preview[\'\"]/',
    'Conjunto final deve conter 33 migrations; encontrado:'
]);

function isObsoleteFinding(finding) {
    const value = String(finding || '');
    return OBSOLETE_FINDINGS.some(marker => value.startsWith(marker));
}

function currentAlignmentFindings() {
    const findings = legacyAlignment.check().filter(finding => !isObsoleteFinding(finding));
    const build = fs.readFileSync(path.join(root, 'scripts/build-vercel.mjs'), 'utf8');

    const previewIsIsolated = /PREVIEW_SUPABASE_PUBLIC_RUNTIME/.test(build)
        && /RADAR_DATA_MODE:\s*['"]local['"]/.test(build)
        && /RADAR_ENVIRONMENT:\s*['"]preview['"]/.test(build)
        && /RADAR_SUPABASE_REPOSITORY_ENABLED:\s*['"]false['"]/.test(build)
        && /Preview da Vercel não pode apontar para o Supabase Production/.test(build);
    if (!previewIsIsolated) {
        findings.push('Build Vercel deve manter Preview isolado do Supabase Production por padrão.');
    }

    const productionIsFailClosed = /PRODUCTION_SUPABASE_PUBLIC_RUNTIME/.test(build)
        && /RADAR_DATA_MODE:\s*['"]supabase-production['"]/.test(build)
        && /RADAR_ENVIRONMENT:\s*['"]production['"]/.test(build)
        && /RADAR_SUPABASE_REPOSITORY_ENABLED:\s*['"]true['"]/.test(build)
        && /Production exige Supabase Production explicitamente habilitado e aprovado/.test(build)
        && !/PRODUCTION_LOCAL_ROLLBACK_RUNTIME/.test(build);
    if (!productionIsFailClosed) {
        findings.push('Build Production deve operar em Supabase Production fail-closed.');
    }

    const migrationCount = fs.readdirSync(path.join(root, 'supabase/migrations'))
        .filter(name => name.endsWith('.sql')).length;
    if (migrationCount !== EXPECTED_MIGRATION_COUNT) {
        findings.push(
            `Conjunto canônico deve conter ${EXPECTED_MIGRATION_COUNT} migrations; encontrado: ${migrationCount}.`
        );
    }

    return [...new Set(findings)];
}

function main() {
    const findings = currentAlignmentFindings();
    if (findings.length > 0) {
        console.error('Alinhamento final atual do Supabase: falha');
        findings.forEach(finding => console.error(`- ${finding}`));
        process.exitCode = 1;
        return;
    }
    console.log('Alinhamento final atual do Supabase: aprovado.');
}

if (require.main === module) main();

module.exports = Object.freeze({
    EXPECTED_MIGRATION_COUNT,
    currentAlignmentFindings,
    isObsoleteFinding
});
