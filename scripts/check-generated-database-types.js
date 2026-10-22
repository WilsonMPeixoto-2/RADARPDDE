'use strict';

// Mantém diferenças reais de tipo/campo/obrigatoriedade bloqueantes.
// A CLI 2.121 emite TS sintaticamente válido em outro layout; Prettier
// já é uma dependência de desenvolvimento do RADAR e analisa TypeScript.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const prettier = require('prettier');

const root = path.resolve(__dirname, '..');
const typePath = 'src/types/database.types.ts';
const options = {
  parser: 'typescript',
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf'
};

async function fingerprint(source) {
  // O parser rejeita TS inválido. Só divergências normalizadas são ignoradas.
  const normalized = await prettier.format(source, options);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function trackedVersion() {
  const git = spawnSync('git', ['show', 'HEAD:' + typePath], { cwd: root, encoding: 'utf8' });
  if (git.status !== 0) throw new Error('Falha ao ler versão do Git: ' + (git.stderr || '').trim());
  return git.stdout;
}

async function run() {
  const args = process.argv.slice(2);
  let expected;
  let actual;
  if (args.length === 1 && args[0] === '--tracked') {
    expected = trackedVersion();
    actual = fs.readFileSync(path.join(root, typePath), 'utf8');
  } else if (args.length === 2) {
    expected = fs.readFileSync(path.resolve(root, args[0]), 'utf8');
    actual = fs.readFileSync(path.resolve(root, args[1]), 'utf8');
  } else {
    throw new Error('Uso: check-generated-database-types.js --tracked OU <arquivo-esperado> <arquivo-gerado>');
  }
  const before = await fingerprint(expected);
  const after = await fingerprint(actual);
  if (before !== after) {
    throw new Error('Contrato TypeScript gerado diferente do versionado após formatação estável. ' +
      'Esperado SHA256=' + before + '; gerado SHA256=' + after);
  }
  console.log('Contrato TypeScript gerado compatível após normalização TypeScript/Prettier (SHA256=' + before + ').');
}

if (require.main === module) {
  run().catch(error => {
    console.error('Contratos Supabase: falha - ' + error.message);
    process.exitCode = 1;
  });
}

module.exports = { fingerprint };
