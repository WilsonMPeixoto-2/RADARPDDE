#!/usr/bin/env node
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'vendor/ajv.js');
const version = packageJson.devDependencies?.ajv;
if (!version) throw new Error('A versão fixada de Ajv não foi encontrada no package.json.');

await build({
    entryPoints: [path.join(root, 'src/vendor/ajv-entry.js')],
    bundle: true,
    format: 'iife',
    globalName: 'RadarAjvBundle',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    legalComments: 'none',
    outfile: output,
    banner: { js: `/* Ajv ${version} — bundle fixado para validação JSON no navegador. */` }
});

const source = await fs.readFile(output, 'utf8');
if (!source.includes('RadarAjv')) throw new Error('O bundle Ajv não expôs RadarAjv.');
console.log(`Ajv ${version} empacotado em vendor/ajv.js.`);
