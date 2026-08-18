#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
    buildRuntimeInput,
    renderRuntimeConfig
} from './generate-runtime-config.mjs';
import {
    MANIFEST_FILE_NAME as EXCEL_SME_ASSETS_MANIFEST_FILE,
    generateExcelSmeAssetsManifest
} from './generate-excel-sme-assets-manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const RUNTIME_ENTRIES = Object.freeze([
    'index.html',
    'app.js',
    'config.js',
    'styles.css',
    'assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx',
    'src',
    'vendor'
]);
const EXCEL_BOOTSTRAP_GUARD_PATH = '/src/integration/excel-export-bootstrap-guard.js';
const EXCEL_BOOTSTRAP_GUARD_TAG = `<script defer src="${EXCEL_BOOTSTRAP_GUARD_PATH}"></script>`;
const DEPLOYMENT_TARGET_INPUT_KEY = 'deploymentTarget';

const VERCEL_ENVIRONMENTS = new Set(['development', 'preview', 'production']);
const PRODUCTION_SUPABASE_URL = 'https://scnryinorqeucbfkioxo.supabase.co';
const PRODUCTION_SEED_DECLARATIONS = Object.freeze([
    'INITIAL_CONTROLADORES',
    'INITIAL_ESCOLAS'
]);
const PRODUCTION_LEGACY_FIXTURE_MARKERS = Object.freeze([
    'Escola Municipal Ema Negrão de Lima',
    'Érika Reis'
]);

// Preview de PR é deliberadamente isolado do banco institucional. Um Preview só
// usa Supabase quando URL/chave/modo são informados explicitamente para um projeto
// de desenvolvimento separado. Nunca há fallback silencioso para Production.
const PREVIEW_SUPABASE_PUBLIC_RUNTIME = Object.freeze({
    RADAR_DATA_MODE: 'local',
    RADAR_ENVIRONMENT: 'preview',
    RADAR_SUPABASE_REPOSITORY_ENABLED: 'false',
    RADAR_SUPABASE_URL: '',
    RADAR_SUPABASE_PUBLISHABLE_KEY: '',
    RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
});

const PRODUCTION_SUPABASE_PUBLIC_RUNTIME = Object.freeze({
    RADAR_DATA_MODE: 'supabase-production',
    RADAR_ENVIRONMENT: 'production',
    RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
    RADAR_SUPABASE_URL: PRODUCTION_SUPABASE_URL,
    RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_NJYBP3Mh2b_okdWKNypajQ_CYD8QQTO',
    RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'true'
});

const RADAR_RUNTIME_VARIABLES = Object.freeze(
    [...new Set([
        ...Object.keys(PREVIEW_SUPABASE_PUBLIC_RUNTIME),
        ...Object.keys(PRODUCTION_SUPABASE_PUBLIC_RUNTIME)
    ])]
);

function isPathInside(parent, candidate) {
    const relative = path.relative(parent, candidate);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function assertSafeOutputDirectory(rootDir, outputDir) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedOutput = path.resolve(outputDir);
    const resolvedTemporaryRoot = path.resolve(os.tmpdir());
    const isProjectOutput = isPathInside(resolvedRoot, resolvedOutput);
    const isIsolatedTestOutput = isPathInside(resolvedTemporaryRoot, resolvedOutput)
        && path.basename(path.dirname(resolvedOutput)).startsWith('radar-vercel-build-');

    if (path.basename(resolvedOutput).toLowerCase() !== 'dist') {
        throw new Error('O diretório público de saída deve se chamar dist.');
    }
    if (!isProjectOutput && !isIsolatedTestOutput) {
        throw new Error('O diretório de saída deve ficar dentro do projeto ou de uma área temporária isolada do build.');
    }
    return resolvedOutput;
}

function normalizeVercelEnvironment(environment = {}) {
    const value = String(environment.VERCEL_ENV || '').trim().toLowerCase();
    if (!value) return '';
    if (!VERCEL_ENVIRONMENTS.has(value)) {
        throw new Error('VERCEL_ENV possui valor não reconhecido pelo build público.');
    }
    return value;
}

function hasExplicitRadarRuntime(environment = {}) {
    return RADAR_RUNTIME_VARIABLES.some(name => (
        String(environment?.[name] ?? '').trim() !== ''
    ));
}

function resolveVercelRuntimeEnvironment(environment = {}) {
    const vercelEnvironment = normalizeVercelEnvironment(environment);

    if (vercelEnvironment === 'production') {
        return {
            ...environment,
            ...PRODUCTION_SUPABASE_PUBLIC_RUNTIME
        };
    }

    if (vercelEnvironment !== 'preview' || hasExplicitRadarRuntime(environment)) {
        return { ...environment };
    }

    return {
        ...environment,
        ...PREVIEW_SUPABASE_PUBLIC_RUNTIME
    };
}

function assertDeploymentTargetCompatibility(runtimeInput, environment = {}) {
    const vercelEnvironment = normalizeVercelEnvironment(environment);
    if (!vercelEnvironment) return '';

    if (vercelEnvironment === 'production'
        && (runtimeInput.dataMode !== 'supabase-production'
            || runtimeInput.environment !== 'production'
            || runtimeInput.features?.supabaseRepositoryEnabled !== true
            || runtimeInput.productionActivationApproved !== true)) {
        throw new Error('Production exige Supabase Production explicitamente habilitado e aprovado.');
    }

    if (vercelEnvironment === 'preview'
        && runtimeInput.dataMode === 'supabase-preview'
        && runtimeInput.environment !== 'preview') {
        throw new Error('Preview Supabase na Vercel exige RADAR_ENVIRONMENT=preview.');
    }

    if (vercelEnvironment === 'preview'
        && runtimeInput.features?.supabaseRepositoryEnabled
        && String(runtimeInput.supabase?.url || '').trim() === PRODUCTION_SUPABASE_URL) {
        throw new Error('Preview da Vercel não pode apontar para o Supabase Production do RADAR. Use um projeto Supabase de desenvolvimento separado ou o modo local isolado.');
    }

    if (vercelEnvironment !== 'production'
        && runtimeInput.dataMode === 'supabase-production') {
        throw new Error('Artefato Supabase de produção só pode ser construído para o alvo production da Vercel.');
    }

    return vercelEnvironment;
}

function sanitizeCommitSha(value) {
    const commitSha = String(value || '').trim().toLowerCase();
    return /^[0-9a-f]{7,40}$/.test(commitSha) ? commitSha : '';
}

function withDeploymentTarget(runtimeInput, vercelEnvironment) {
    const target = String(vercelEnvironment || '').trim();
    if (!['preview', 'production'].includes(target)) return Object.freeze({ ...runtimeInput });
    return Object.freeze({
        ...runtimeInput,
        [DEPLOYMENT_TARGET_INPUT_KEY]: target
    });
}

function createPublicBuildManifest(runtimeInput, environment = {}) {
    return Object.freeze({
        schemaVersion: 1,
        commitSha: sanitizeCommitSha(environment.VERCEL_GIT_COMMIT_SHA),
        vercelEnvironment: normalizeVercelEnvironment(environment),
        runtimeEnvironment: runtimeInput.environment,
        dataMode: runtimeInput.dataMode,
        supabaseRepositoryEnabled: runtimeInput.features.supabaseRepositoryEnabled,
        productionActivationApproved: runtimeInput.productionActivationApproved
    });
}

async function copyRuntimeEntry(rootDir, outputDir, entry) {
    const source = path.join(rootDir, entry);
    const destination = path.join(outputDir, entry);
    const metadata = await fs.stat(source).catch(() => null);
    if (!metadata) {
        throw new Error(`Artefato público obrigatório ausente: ${entry}`);
    }

    if (metadata.isDirectory()) {
        await fs.cp(source, destination, { recursive: true });
        return;
    }

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
}

function findArrayDeclarationRange(source, declarationName) {
    const marker = `const ${declarationName}`;
    const start = source.indexOf(marker);
    if (start < 0) {
        throw new Error(`Declaração ${declarationName} não encontrada no app.js.`);
    }

    const assignment = source.indexOf('=', start + marker.length);
    const openBracket = source.indexOf('[', assignment + 1);
    if (assignment < 0 || openBracket < 0) {
        throw new Error(`Declaração ${declarationName} não possui array reconhecível.`);
    }

    let depth = 0;
    let quote = '';
    let escaped = false;
    for (let index = openBracket; index < source.length; index += 1) {
        const character = source[index];
        if (quote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (character === '\\') {
                escaped = true;
                continue;
            }
            if (character === quote) quote = '';
            continue;
        }

        if (character === '"' || character === "'" || character === '`') {
            quote = character;
            continue;
        }
        if (character === '[') depth += 1;
        if (character === ']') {
            depth -= 1;
            if (depth === 0) {
                const semicolon = source.indexOf(';', index + 1);
                if (semicolon < 0) {
                    throw new Error(`Declaração ${declarationName} não termina com ponto e vírgula.`);
                }
                return { start, end: semicolon + 1 };
            }
        }
    }

    throw new Error(`Declaração ${declarationName} não pôde ser delimitada.`);
}

function sanitizeProductionAppSource(source) {
    let sanitized = String(source || '');
    PRODUCTION_SEED_DECLARATIONS.forEach(declarationName => {
        const range = findArrayDeclarationRange(sanitized, declarationName);
        sanitized = `${sanitized.slice(0, range.start)}const ${declarationName} = [];${sanitized.slice(range.end)}`;
    });
    return sanitized;
}

function assertProductionAppSanitized(source) {
    const value = String(source || '');
    PRODUCTION_SEED_DECLARATIONS.forEach(declarationName => {
        if (!value.includes(`const ${declarationName} = [];`)) {
            throw new Error(`Bundle Production ainda contém ${declarationName} operacional.`);
        }
    });
    PRODUCTION_LEGACY_FIXTURE_MARKERS.forEach(marker => {
        if (value.includes(marker)) {
            throw new Error(`Bundle Production ainda contém fixture legado: ${marker}.`);
        }
    });
    return true;
}

async function sanitizeProductionApp(outputDir) {
    const appPath = path.join(outputDir, 'app.js');
    const source = await fs.readFile(appPath, 'utf8');
    const sanitized = sanitizeProductionAppSource(source);
    assertProductionAppSanitized(sanitized);
    await fs.writeFile(appPath, sanitized, 'utf8');
    return true;
}

async function injectDeploymentTargetMarker(outputDir, vercelEnvironment) {
    const target = String(vercelEnvironment || '').trim();
    if (!['preview', 'production'].includes(target)) return false;
    const indexPath = path.join(outputDir, 'index.html');
    const html = await fs.readFile(indexPath, 'utf8');
    const markerSignature = `window.RADAR_PDDE_RUNTIME_INPUT=Object.freeze({${DEPLOYMENT_TARGET_INPUT_KEY}:`;
    if (html.includes(markerSignature)) return false;
    if (!/<head(?:\s[^>]*)?>/iu.test(html)) {
        throw new Error('index.html público não possui head para registrar o alvo do deployment.');
    }
    const marker = `<script>window.RADAR_PDDE_RUNTIME_INPUT=Object.freeze({${DEPLOYMENT_TARGET_INPUT_KEY}:${JSON.stringify(target)}});</script>`;
    const updated = html.replace(/<head(\s[^>]*)?>/iu, match => `${match}\n    ${marker}`);
    await fs.writeFile(indexPath, updated, 'utf8');
    return true;
}

async function injectExcelBootstrapGuard(outputDir) {
    const indexPath = path.join(outputDir, 'index.html');
    const html = await fs.readFile(indexPath, 'utf8');
    if (html.includes(EXCEL_BOOTSTRAP_GUARD_PATH)) return false;
    if (!/<\/body>/iu.test(html)) {
        throw new Error('index.html público não possui fechamento de body para injetar o guard Excel.');
    }
    const updated = html.replace(
        /<\/body>/iu,
        `    ${EXCEL_BOOTSTRAP_GUARD_TAG}\n</body>`
    );
    await fs.writeFile(indexPath, updated, 'utf8');
    return true;
}

async function buildVercelArtifact({
    rootDir = root,
    outputDir = path.join(rootDir, 'dist'),
    environment = process.env
} = {}) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedOutput = assertSafeOutputDirectory(resolvedRoot, outputDir);
    const resolvedEnvironment = resolveVercelRuntimeEnvironment(environment);

    const baseRuntimeInput = buildRuntimeInput(resolvedEnvironment);
    const vercelEnvironment = assertDeploymentTargetCompatibility(baseRuntimeInput, resolvedEnvironment);
    const runtimeInput = withDeploymentTarget(baseRuntimeInput, vercelEnvironment);

    await fs.rm(resolvedOutput, { recursive: true, force: true });
    await fs.mkdir(resolvedOutput, { recursive: true });

    for (const entry of RUNTIME_ENTRIES) {
        await copyRuntimeEntry(resolvedRoot, resolvedOutput, entry);
    }
    if (runtimeInput.environment === 'production') {
        await sanitizeProductionApp(resolvedOutput);
    }
    await injectDeploymentTargetMarker(resolvedOutput, vercelEnvironment);
    await injectExcelBootstrapGuard(resolvedOutput);

    await fs.writeFile(
        path.join(resolvedOutput, 'config.runtime.js'),
        renderRuntimeConfig(runtimeInput),
        'utf8'
    );

    const manifest = createPublicBuildManifest(runtimeInput, resolvedEnvironment);
    await fs.writeFile(
        path.join(resolvedOutput, 'radar-build-manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf8'
    );

    const excelSmeAssets = await generateExcelSmeAssetsManifest({
        rootDir: resolvedRoot,
        outputFile: path.join(resolvedOutput, EXCEL_SME_ASSETS_MANIFEST_FILE)
    });

    return Object.freeze({
        outputDir: resolvedOutput,
        runtimeInput,
        manifest,
        excelSmeAssets
    });
}

function parseArguments(argv) {
    const options = { outputDir: path.join(root, 'dist') };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--output') {
            const next = argv[index + 1];
            if (!next) throw new Error('--output exige um caminho.');
            options.outputDir = path.resolve(process.cwd(), next);
            index += 1;
        } else {
            throw new Error(`Argumento desconhecido: ${argument}`);
        }
    }
    return options;
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    const result = await buildVercelArtifact({ outputDir: options.outputDir });
    const relativeOutput = path.relative(root, result.outputDir) || '.';
    console.log(
        `Artefato Vercel gerado em ${relativeOutput}: `
        + `${result.manifest.dataMode} / repositório Supabase `
        + `${result.manifest.supabaseRepositoryEnabled ? 'habilitado' : 'desabilitado'}; `
        + `Excel SME ${result.excelSmeAssets.template.sha256.slice(0, 12)}.`
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha no build público da Vercel: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    DEPLOYMENT_TARGET_INPUT_KEY,
    EXCEL_BOOTSTRAP_GUARD_PATH,
    EXCEL_BOOTSTRAP_GUARD_TAG,
    EXCEL_SME_ASSETS_MANIFEST_FILE,
    PREVIEW_SUPABASE_PUBLIC_RUNTIME,
    PRODUCTION_LEGACY_FIXTURE_MARKERS,
    PRODUCTION_SEED_DECLARATIONS,
    PRODUCTION_SUPABASE_PUBLIC_RUNTIME,
    PRODUCTION_SUPABASE_URL,
    RADAR_RUNTIME_VARIABLES,
    RUNTIME_ENTRIES,
    assertProductionAppSanitized,
    assertSafeOutputDirectory,
    assertDeploymentTargetCompatibility,
    buildVercelArtifact,
    createPublicBuildManifest,
    findArrayDeclarationRange,
    hasExplicitRadarRuntime,
    injectDeploymentTargetMarker,
    injectExcelBootstrapGuard,
    normalizeVercelEnvironment,
    resolveVercelRuntimeEnvironment,
    sanitizeCommitSha,
    sanitizeProductionApp,
    sanitizeProductionAppSource,
    withDeploymentTarget
};
