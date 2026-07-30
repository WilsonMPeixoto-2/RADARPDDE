#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANDIDATES = [
  'node_modules/write-excel-file/bundle/write-excel-file.min.js',
  'node_modules/write-excel-file/bundle/write-excel-file.js'
].map(candidate => path.join(ROOT, candidate));
const TARGET = path.join(ROOT, 'vendor/write-excel-file.min.js');

async function findSource() {
  for (const candidate of CANDIDATES) {
    try {
      const source = await fs.readFile(candidate, 'utf8');
      return { candidate, source };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  throw new Error('O bundle oficial de write-excel-file não foi encontrado no pacote instalado.');
}

async function main() {
  const { candidate, source } = await findSource();
  if (!source.includes('writeXlsxFile')) {
    throw new Error('O bundle oficial não expõe o contrato writeXlsxFile esperado no navegador.');
  }
  await fs.mkdir(path.dirname(TARGET), { recursive: true });
  await fs.writeFile(TARGET, source, 'utf8');
  process.stdout.write(`Bundle Excel gerado de ${path.relative(ROOT, candidate)} para ${path.relative(ROOT, TARGET)}\n`);
}

main().catch(error => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
