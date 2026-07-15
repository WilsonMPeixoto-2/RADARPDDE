#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import packageJson from '../package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'vendor');
const outputFile = path.join(outputDirectory, 'supabase-client.js');
const supabaseVersion = packageJson.devDependencies['@supabase/supabase-js'];

await fs.mkdir(outputDirectory, { recursive: true });

await build({
    entryPoints: [path.join(root, 'src/vendor/supabase-client-entry.js')],
    outfile: outputFile,
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    legalComments: 'none',
    banner: {
        js: `/* RADAR PDDE | @supabase/supabase-js ${supabaseVersion} | arquivo gerado; não editar manualmente */`
    }
});

console.log(`Cliente Supabase empacotado em ${path.relative(root, outputFile)}.`);
