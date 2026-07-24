#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function copyExcelJsBrowserBundle({
    rootDir = root,
    outputDir = path.join(rootDir, 'dist')
} = {}) {
    const source = path.join(rootDir, 'node_modules', 'exceljs', 'dist', 'exceljs.min.js');
    const destination = path.join(outputDir, 'vendor', 'exceljs.min.js');
    const sourceMetadata = await fs.stat(source).catch(() => null);
    if (!sourceMetadata?.isFile()) {
        throw new Error('Bundle de navegador do ExcelJS não foi localizado em node_modules.');
    }
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    const destinationMetadata = await fs.stat(destination);
    if (!destinationMetadata.isFile() || destinationMetadata.size === 0) {
        throw new Error('Falha ao publicar o bundle de navegador do ExcelJS.');
    }
    return Object.freeze({ source, destination, size: destinationMetadata.size });
}

async function main() {
    const result = await copyExcelJsBrowserBundle();
    console.log(`ExcelJS publicado em ${path.relative(root, result.destination)} (${result.size} bytes).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha ao publicar ExcelJS: ${error.message}`);
        process.exitCode = 1;
    });
}

export { copyExcelJsBrowserBundle };
