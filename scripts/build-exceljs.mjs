#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'node_modules/exceljs/dist/exceljs.min.js');
const TARGET = path.join(ROOT, 'vendor/exceljs.min.js');

async function main() {
  const source = await fs.readFile(SOURCE, 'utf8');
  if (!source.includes('ExcelJS') || !source.includes('Workbook')) {
    throw new Error('O bundle oficial do ExcelJS não contém o contrato esperado para o navegador.');
  }
  await fs.mkdir(path.dirname(TARGET), { recursive: true });
  await fs.writeFile(TARGET, source, 'utf8');
  process.stdout.write(`Bundle ExcelJS gerado: ${path.relative(ROOT, TARGET)}\n`);
}

main().catch(error => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
