'use strict';

// A CLI Supabase 2.121 mudou apenas a escrita de certas definições.
// Validar sintaxe usando o parser TypeScript do Prettier 3, depois comparar
// tokens significativos. Mudanças reais de tipo, campo ou assinatura reprovam.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const prettier = require('prettier');

const root = path.resolve(__dirname, '..');
const typePath = 'src/types/database.types.ts';

function normalizedTokens(source) {
  const lexemes = source.match(
    /\s+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|=>|\.\.\.|[^\s]/gs
  ) || [];
  const raw = lexemes.filter(value => !/^\s+$/.test(value));
  const normalized = [];
  const contexts = [];
  for (let i = 0; i < raw.length; i += 1) {
    const current = raw[i], next = raw[i + 1], nextNext = raw[i + 2], previous = raw[i - 1];

    // "|" inicial opcional nas uniões geradas pelo Supabase.
    if (current === '|' && previous === '=' && next === 'string') continue;
    // Separadores de propriedades e vírgulas finais são intercambiáveis.
    if (current === ';') continue;
    if (current === ',' && (contexts[contexts.length - 1] === '{'
      || next === ']' || next === '}' || next === '>')) continue;
    // O novo typegen usa "(string)[]" em alguns pontos em vez de "string[]".
    if (current === '(' && raw[i + 2] === ')' && raw[i + 3] === '['
      && ['string', 'number', 'boolean', 'Json'].includes(raw[i + 1])) continue;
    if (current === ')' && raw[i - 2] === '(' && raw[i + 1] === '['
      && ['string', 'number', 'boolean', 'Json'].includes(raw[i - 1])) continue;

    if (['{', '[', '(', '<'].includes(current)) contexts.push(current);
    else if (['}', ']', ')', '>'].includes(current)) {
      const peer = { '}': '{', ']': '[', ')': '(', '>': '<' }[current];
      if (contexts[contexts.length - 1] === peer) contexts.pop();
    }
    if (/^(["']).*\1$/s.test(current)) {
      const value = current.slice(1, -1).replace(/\\([\\'"])/g, '$1');
      const isProperty = contexts[contexts.length - 1] === '{'
        && (next === ':' || (next === '?' && nextNext === ':'));
      normalized.push((isProperty && /^[A-Za-z_$][\w$]*$/.test(value) ? 'I:' : 'S:') + value);
    } else if (/^[A-Za-z_$][\w$]*$/.test(current)) {
      normalized.push('I:' + current);
    } else {
      normalized.push('P:' + current);
    }
  }
  return normalized;
}

async function fingerprint(source) {
  // O parser bloqueia arquivos inválidos, mesmo que os tokens coincidam.
  await prettier.format(source, { parser: 'typescript' });
  const tokens = normalizedTokens(source);
  return {
    digest: crypto.createHash('sha256').update(tokens.join('\u001f')).digest('hex'),
    tokenCount: tokens.length
  };
}

function trackedVersion() {
  const git = spawnSync('git', ['show', 'HEAD:' + typePath], { cwd: root, encoding: 'utf8' });
  if (git.status !== 0) throw new Error('Falha ao ler a versão Git: ' + (git.stderr || '').trim());
  return git.stdout;
}

async function run() {
  const args = process.argv.slice(2);
  let expected, actual;
  if (args.length === 1 && args[0] === '--tracked') {
    expected = trackedVersion();
    actual = fs.readFileSync(path.join(root, typePath), 'utf8');
  } else if (args.length === 2) {
    expected = fs.readFileSync(path.resolve(root, args[0]), 'utf8');
    actual = fs.readFileSync(path.resolve(root, args[1]), 'utf8');
  } else {
    throw new Error('Uso: check-generated-database-types.js --tracked OU <arquivo-versionado> <arquivo-gerado>');
  }
  const oldSig = await fingerprint(expected);
  const newSig = await fingerprint(actual);
  if (oldSig.digest !== newSig.digest || oldSig.tokenCount !== newSig.tokenCount) {
    throw new Error('Contrato TypeScript gerado diferente do versionado: campo, tipo, nulabilidade, '
      + 'opcionalidade ou assinatura. Versionado=' + oldSig.digest + ' ('
      + oldSig.tokenCount + ' tokens); gerado=' + newSig.digest + ' ('
      + newSig.tokenCount + ' tokens).');
  }
  console.log('Contrato TypeScript preservado: ' + oldSig.tokenCount
    + ' tokens significativos; SHA256=' + oldSig.digest);
}

if (require.main === module) {
  run().catch(error => {
    console.error('Contratos Supabase: falha - ' + error.message);
    process.exitCode = 1;
  });
}

module.exports = { fingerprint, normalizedTokens };
