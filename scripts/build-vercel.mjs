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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const RUNTIME_ENTRIES = Object.freeze([
    'index.html',
    'app.js',
    'config.js',
    'styles.css',
    'src',
    'vendor'
]);

const VERCEL_ENVIRONMENTS = new Set(['development', 'preview', 'production']);

const PREVIEW_SUPABASE_PUBLIC_RUNTIME = Object.freeze({
    RADAR_DATA_MODE: 'supabase-preview',
    RADAR_ENVIRONMENT: 'preview',
    RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
    RADAR_SUPABASE_URL: 'https://scnryinorqeucbfkioxo.supabase.co',
    RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_NJYBP3Mh2b_okdWKNypajQ_CYD8QQTO',
    RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
});

const RADAR_RUNTIME_VARIABLES = Object.freeze(
    Object.keys(PREVIEW_SUPABASE_PUBLIC_RUNTIME)
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
        && runtimeInput.dataMode === 'supabase-preview') {
        throw new Error('Artefato Supabase de Preview não pode ser construído para o alvo production da Vercel.');
    }

    if (vercelEnvironment === 'production'
        && runtimeInput.dataMode === 'local'
        && runtimeInput.environment !== 'local') {
        throw new Error('Produção em modo local exige RADAR_ENVIRONMENT=local.');
    }

    if (vercelEnvironment === 'preview'
        && runtimeInput.dataMode === 'supabase-preview'
        && runtimeInput.environment !== 'preview') {
        throw new Error('Preview Supabase na Vercel exige RADAR_ENVIRONMENT=preview.');
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

async function buildVercelArtifact({
    rootDir = root,
    outputDir = path.join(rootDir, 'dist'),
    environment = process.env
} = {}) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedOutput = assertSafeOutputDirectory(resolvedRoot, outputDir);
    const resolvedEnvironment = resolveVercelRuntimeEnvironment(environment);

    const runtimeInput = buildRuntimeInput(resolvedEnvironment);
    assertDeploymentTargetCompatibility(runtimeInput, resolvedEnvironment);

    await fs.rm(resolvedOutput, { recursive: true, force: true });
    await fs.mkdir(resolvedOutput, { recursive: true });

    for (const entry of RUNTIME_ENTRIES) {
        await copyRuntimeEntry(resolvedRoot, resolvedOutput, entry);
    }

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

    return Object.freeze({
        outputDir: resolvedOutput,
        runtimeInput,
        manifest
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
        + `${result.manifest.supabaseRepositoryEnabled ? 'habilitado' : 'desabilitado'}.`
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha no build público da Vercel: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    PREVIEW_SUPABASE_PUBLIC_RUNTIME,
    RADAR_RUNTIME_VARIABLES,
    RUNTIME_ENTRIES,
    assertSafeOutputDirectory,
    assertDeploymentTargetCompatibility,
    buildVercelArtifact,
    createPublicBuildManifest,
    hasExplicitRadarRuntime,
    normalizeVercelEnvironment,
    resolveVercelRuntimeEnvironment,
    sanitizeCommitSha
};
