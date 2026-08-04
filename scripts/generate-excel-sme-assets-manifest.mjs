#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const MANIFEST_FILE_NAME = 'excel-sme-assets.json';
const ASSETS = Object.freeze({
    template: 'assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx',
    exceljs: 'vendor/exceljs.min.js'
});

async function describeAsset(rootDir, relativePath) {
    const absolutePath = path.join(rootDir, relativePath);
    const bytes = await fs.readFile(absolutePath).catch(error => {
        if (error?.code === 'ENOENT') {
            throw new Error(`Asset obrigatório do Excel SME ausente: ${relativePath}`);
        }
        throw error;
    });
    return Object.freeze({
        path: `/${relativePath.replaceAll(path.sep, '/')}`,
        bytes: bytes.length,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex')
    });
}

async function generateExcelSmeAssetsManifest({
    rootDir = DEFAULT_ROOT,
    outputFile = null
} = {}) {
    const resolvedRoot = path.resolve(rootDir);
    const manifest = Object.freeze({
        schemaVersion: 1,
        template: await describeAsset(resolvedRoot, ASSETS.template),
        exceljs: await describeAsset(resolvedRoot, ASSETS.exceljs)
    });

    if (outputFile) {
        const resolvedOutput = path.resolve(outputFile);
        await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
        await fs.writeFile(resolvedOutput, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    }

    return manifest;
}

async function main() {
    const outputFile = process.argv[2]
        ? path.resolve(process.cwd(), process.argv[2])
        : path.join(DEFAULT_ROOT, MANIFEST_FILE_NAME);
    const manifest = await generateExcelSmeAssetsManifest({ outputFile });
    console.log(
        `Manifesto Excel SME gerado: template ${manifest.template.sha256.slice(0, 12)}, `
        + `ExcelJS ${manifest.exceljs.sha256.slice(0, 12)}.`
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha ao gerar manifesto do Excel SME: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    ASSETS,
    DEFAULT_ROOT,
    MANIFEST_FILE_NAME,
    describeAsset,
    generateExcelSmeAssetsManifest
};
