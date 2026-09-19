#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { transform } from 'esbuild';

const DEFAULT_TARGET = 'es2020';
const SKIPPED_TOP_LEVEL_DIRECTORIES = Object.freeze(new Set([
    'vendor',
    'assets'
]));

function isOptimizable(relativePath) {
    const normalized = relativePath.split(path.sep).join('/');
    const firstSegment = normalized.split('/')[0] || '';
    if (SKIPPED_TOP_LEVEL_DIRECTORIES.has(firstSegment)) return false;
    return normalized.endsWith('.js') || normalized.endsWith('.css');
}

async function collectOptimizableFiles(rootDir, currentDir = rootDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolutePath = path.join(currentDir, entry.name);
        const relativePath = path.relative(rootDir, absolutePath);
        const firstSegment = relativePath.split(path.sep)[0] || '';

        if (entry.isDirectory()) {
            if (SKIPPED_TOP_LEVEL_DIRECTORIES.has(firstSegment)) continue;
            files.push(...await collectOptimizableFiles(rootDir, absolutePath));
            continue;
        }
        if (entry.isFile() && isOptimizable(relativePath)) files.push(absolutePath);
    }

    return files.sort((left, right) => left.localeCompare(right, 'en'));
}

async function optimizePublicFile(rootDir, absolutePath, options = {}) {
    const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/');
    const loader = relativePath.endsWith('.css') ? 'css' : 'js';
    const source = await fs.readFile(absolutePath, 'utf8');
    const beforeBytes = Buffer.byteLength(source, 'utf8');
    const result = await transform(source, {
        loader,
        sourcefile: relativePath,
        target: options.target || DEFAULT_TARGET,
        charset: 'utf8',
        legalComments: 'none',
        minifyWhitespace: true,
        minifySyntax: true,
        minifyIdentifiers: false
    });
    const code = result.code;
    const afterBytes = Buffer.byteLength(code, 'utf8');

    if (afterBytes <= beforeBytes) {
        await fs.writeFile(absolutePath, code, 'utf8');
    }

    return Object.freeze({
        path: relativePath,
        kind: loader,
        beforeBytes,
        afterBytes: Math.min(beforeBytes, afterBytes),
        savedBytes: Math.max(0, beforeBytes - afterBytes)
    });
}

async function optimizePublicAssets(outputDir, options = {}) {
    const rootDir = path.resolve(outputDir);
    const files = await collectOptimizableFiles(rootDir);
    const records = [];

    for (const file of files) {
        records.push(await optimizePublicFile(rootDir, file, options));
    }

    const byKind = records.reduce((summary, record) => {
        const current = summary[record.kind] || {
            files: 0,
            beforeBytes: 0,
            afterBytes: 0,
            savedBytes: 0
        };
        current.files += 1;
        current.beforeBytes += record.beforeBytes;
        current.afterBytes += record.afterBytes;
        current.savedBytes += record.savedBytes;
        summary[record.kind] = current;
        return summary;
    }, {});

    const totals = records.reduce((summary, record) => {
        summary.files += 1;
        summary.beforeBytes += record.beforeBytes;
        summary.afterBytes += record.afterBytes;
        summary.savedBytes += record.savedBytes;
        return summary;
    }, { files: 0, beforeBytes: 0, afterBytes: 0, savedBytes: 0 });

    return Object.freeze({
        target: options.target || DEFAULT_TARGET,
        files: Object.freeze(records),
        byKind: Object.freeze(byKind),
        totals: Object.freeze(totals)
    });
}

export {
    DEFAULT_TARGET,
    SKIPPED_TOP_LEVEL_DIRECTORIES,
    collectOptimizableFiles,
    isOptimizable,
    optimizePublicAssets,
    optimizePublicFile
};
