#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
    XLSX_CONTENT_TYPE,
    verifyExcelSmeTemplateFile
} from './verify-excel-sme-template.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const TEMPLATE_RELATIVE_PATH = 'assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx';
const TEST_TEMPORARY_PREFIXES = Object.freeze([
    'radar-vercel-build-',
    'radar-vercel-output-'
]);

function isPathInside(parent, candidate) {
    const relative = path.relative(parent, candidate);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isIsolatedTestOutput(outputDir) {
    const temporaryRoot = path.resolve(os.tmpdir());
    if (!isPathInside(temporaryRoot, outputDir)) return false;

    const relative = path.relative(temporaryRoot, outputDir);
    const firstSegment = relative.split(path.sep)[0] || '';
    return TEST_TEMPORARY_PREFIXES.some(prefix => firstSegment.startsWith(prefix));
}

function assertSafeVercelOutputDirectory(rootDir, outputDir) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedOutput = path.resolve(outputDir);

    if (path.basename(resolvedOutput).toLowerCase() !== 'output') {
        throw new Error('O diretório Build Output API deve se chamar output.');
    }
    if (path.basename(path.dirname(resolvedOutput)).toLowerCase() !== '.vercel') {
        throw new Error('O diretório Build Output API deve ficar sob .vercel/output.');
    }
    if (!isPathInside(resolvedRoot, resolvedOutput) && !isIsolatedTestOutput(resolvedOutput)) {
        throw new Error(
            'O diretório Build Output API deve ficar dentro do projeto ou de uma área temporária isolada.'
        );
    }

    return resolvedOutput;
}

function createVercelBuildOutputConfig() {
    return Object.freeze({
        version: 3,
        routes: [
            {
                src: '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026\\.xlsx',
                headers: {
                    'cache-control': 'public, max-age=0, must-revalidate',
                    'content-type': XLSX_CONTENT_TYPE,
                    'x-content-type-options': 'nosniff'
                },
                continue: true
            },
            { handle: 'filesystem' },
            { src: '/escolas/src/(.*)', dest: '/src/$1' },
            { src: '/escolas/vendor/(.*)', dest: '/vendor/$1' },
            { src: '/escolas/styles\\.css', dest: '/styles.css' },
            { src: '/escolas/app\\.js', dest: '/app.js' },
            { src: '/escolas/config\\.js', dest: '/config.js' },
            { src: '/escolas/config\\.runtime\\.js', dest: '/config.runtime.js' },
            { src: '/escolas/[^/]+/src/(.*)', dest: '/src/$1' },
            { src: '/escolas/[^/]+/vendor/(.*)', dest: '/vendor/$1' },
            { src: '/escolas/[^/]+/styles\\.css', dest: '/styles.css' },
            { src: '/escolas/[^/]+/app\\.js', dest: '/app.js' },
            { src: '/escolas/[^/]+/config\\.js', dest: '/config.js' },
            { src: '/escolas/[^/]+/config\\.runtime\\.js', dest: '/config.runtime.js' },
            { src: '/dashboard', dest: '/index.html' },
            { src: '/carteira', dest: '/index.html' },
            { src: '/competencias', dest: '/index.html' },
            { src: '/pendencias', dest: '/index.html' },
            { src: '/inventario', dest: '/index.html' },
            { src: '/auditoria', dest: '/index.html' },
            { src: '/equipe', dest: '/index.html' },
            { src: '/gestao-sme', dest: '/index.html' },
            { src: '/escolas/(.*)', dest: '/index.html' }
        ]
    });
}

async function assertSourceDirectory(sourceDir) {
    const metadata = await fs.stat(sourceDir).catch(() => null);
    if (!metadata?.isDirectory()) {
        throw new Error(`Diretório dist ausente: ${sourceDir}`);
    }
    await fs.access(path.join(sourceDir, 'index.html'));
}

async function buildVercelOutput({
    rootDir = root,
    sourceDir = path.join(rootDir, 'dist'),
    outputDir = path.join(rootDir, '.vercel', 'output')
} = {}) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedSource = path.resolve(sourceDir);
    const resolvedOutput = assertSafeVercelOutputDirectory(resolvedRoot, outputDir);
    const sourceTemplate = path.join(resolvedSource, TEMPLATE_RELATIVE_PATH);

    await assertSourceDirectory(resolvedSource);
    const sourceVerification = await verifyExcelSmeTemplateFile(sourceTemplate);

    await fs.rm(resolvedOutput, { recursive: true, force: true });
    const staticDirectory = path.join(resolvedOutput, 'static');
    await fs.mkdir(staticDirectory, { recursive: true });
    await fs.cp(resolvedSource, staticDirectory, { recursive: true });

    const deployedTemplate = path.join(staticDirectory, TEMPLATE_RELATIVE_PATH);
    const deployedVerification = await verifyExcelSmeTemplateFile(deployedTemplate);
    if (deployedVerification.byteLength !== sourceVerification.byteLength) {
        throw new Error('O template copiado para o Build Output API mudou de tamanho.');
    }

    const config = createVercelBuildOutputConfig();
    await fs.writeFile(
        path.join(resolvedOutput, 'config.json'),
        `${JSON.stringify(config, null, 2)}\n`,
        'utf8'
    );

    return Object.freeze({
        outputDir: resolvedOutput,
        staticDirectory,
        templatePath: deployedTemplate,
        templateVerification: deployedVerification,
        config
    });
}

async function main() {
    const result = await buildVercelOutput();
    const relativeOutput = path.relative(root, result.outputDir) || '.';
    console.log(
        `Build Output API gerado em ${relativeOutput}: `
        + `${result.templateVerification.byteLength} bytes, `
        + `${result.templateVerification.entryCount} entradas OOXML.`
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha ao gerar Build Output API da Vercel: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    TEMPLATE_RELATIVE_PATH,
    assertSafeVercelOutputDirectory,
    buildVercelOutput,
    createVercelBuildOutputConfig
};
