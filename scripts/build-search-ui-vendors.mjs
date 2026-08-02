#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import packageJson from '../package.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'vendor');
const checkMode = process.argv.includes('--check');
const tempDirectory = checkMode
    ? await fs.mkdtemp(path.join(os.tmpdir(), 'radar-search-ui-'))
    : outputDirectory;

const targets = [
    {
        name: 'Fuse.js',
        version: packageJson.devDependencies?.['fuse.js'],
        entry: 'src/vendor/fuse-entry.js',
        output: 'vendor/fuse.js',
        globalMarker: 'globalThis.Fuse'
    },
    {
        name: 'Floating UI',
        version: packageJson.devDependencies?.['@floating-ui/dom'],
        entry: 'src/vendor/floating-ui-entry.js',
        output: 'vendor/floating-ui.js',
        globalMarker: 'FloatingUIDOM'
    }
];

await fs.mkdir(outputDirectory, { recursive: true });

try {
    for (const target of targets) {
        if (!target.version) {
            throw new Error(`Versão fixada de ${target.name} ausente no package.json.`);
        }
        const generatedFile = path.join(tempDirectory, path.basename(target.output));
        await build({
            entryPoints: [path.join(root, target.entry)],
            outfile: generatedFile,
            bundle: true,
            minify: true,
            format: 'iife',
            platform: 'browser',
            target: ['es2022'],
            legalComments: 'none',
            banner: {
                js: `/* RADAR PDDE | ${target.name} ${target.version} | arquivo gerado; não editar manualmente */`
            }
        });

        const generated = await fs.readFile(generatedFile, 'utf8');
        if (!generated.includes(target.globalMarker)) {
            throw new Error(`${target.name} não expôs o contrato global esperado.`);
        }

        const versionedFile = path.join(root, target.output);
        if (checkMode) {
            let versioned;
            try {
                versioned = await fs.readFile(versionedFile, 'utf8');
            } catch (error) {
                if (error?.code === 'ENOENT') {
                    throw new Error(`${target.output} ainda não foi gerado.`);
                }
                throw error;
            }
            if (versioned !== generated) {
                throw new Error(`${target.output} está divergente do bundle reproduzível.`);
            }
        }

        console.log(`${target.name} ${target.version} validado em ${target.output}.`);
    }
} finally {
    if (checkMode) await fs.rm(tempDirectory, { recursive: true, force: true });
}
