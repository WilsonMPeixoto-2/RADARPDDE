#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const GUIDE_ASSET_ROOT = path.join('docs', 'evidence', 'global-baseline', 'desktop');
const GUIDE_SCREENSHOTS = Object.freeze([
    'controlador__dashboard__padrao__desktop.png',
    'controlador__carteira__resultado__desktop.png',
    'controlador__competencias__padrao__desktop.png',
    'controlador__pendencias__padrao__desktop.png',
    'controlador__inventario__padrao__desktop.png',
    'controlador__registros-internos__padrao__desktop.png'
]);

async function copyControllerGuideAssets({
    rootDir = root,
    outputDir = path.join(rootDir, 'dist')
} = {}) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedOutput = path.resolve(outputDir);
    const destinationRoot = path.join(resolvedOutput, GUIDE_ASSET_ROOT);

    await fs.mkdir(destinationRoot, { recursive: true });

    for (const filename of GUIDE_SCREENSHOTS) {
        const source = path.join(resolvedRoot, GUIDE_ASSET_ROOT, filename);
        const destination = path.join(destinationRoot, filename);
        const metadata = await fs.stat(source).catch(() => null);
        if (!metadata?.isFile()) {
            throw new Error(`Print obrigatório do Guia ausente: ${filename}`);
        }
        await fs.copyFile(source, destination);
    }

    return Object.freeze({
        outputDir: resolvedOutput,
        assetRoot: GUIDE_ASSET_ROOT,
        screenshots: GUIDE_SCREENSHOTS
    });
}

async function main() {
    const outputArgument = process.argv[2];
    const outputDir = outputArgument
        ? path.resolve(process.cwd(), outputArgument)
        : path.join(root, 'dist');
    const result = await copyControllerGuideAssets({ outputDir });
    console.log(`Guia do Controlador: ${result.screenshots.length} prints publicados no artefato Vercel.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha ao publicar os prints do Guia do Controlador: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    GUIDE_ASSET_ROOT,
    GUIDE_SCREENSHOTS,
    copyControllerGuideAssets
};
