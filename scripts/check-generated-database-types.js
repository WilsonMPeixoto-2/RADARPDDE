'use strict';

// Compara a estrutura TypeScript de dois contratos, sem transformar formato em regra de negócio.
// Mantém diferenças reais de tipo, campo, obrigatoriedade e assinatura como bloqueantes.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const typePath = 'src/types/database.types.ts';

function nameOf(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return node.getText();
}

function signatureNode(node) {
  // Parênteses redundantes em tipos, p.ex. (string)[], não mudam o contrato.
  if (ts.isParenthesizedTypeNode(node)) return signatureNode(node.type);
  if (ts.isPropertySignature(node)) {
    return [
      'property', nameOf(node.name),
      Boolean(node.questionToken),
      (node.modifiers || []).map(signatureNode),
      node.type ? signatureNode(node.type) : null
    ];
  }
  if (ts.isPropertyAssignment(node)) {
    return ['property-value', nameOf(node.name), signatureNode(node.initializer)];
  }
  if (ts.isIdentifier(node)) return ['identifier', node.text];
  if (ts.isStringLiteral(node)) return ['string', node.text];
  if (ts.isNumericLiteral(node)) return ['number', node.text];
  const children = [];
  ts.forEachChild(node, child => children.push(signatureNode(child)));
  return [node.kind, children];
}

function fingerprint(source) {
  const parsed = ts.createSourceFile(typePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (parsed.parseDiagnostics.length) {
    throw new Error('TypeScript inválido: ' + parsed.parseDiagnostics.map(d =>
      ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; '));
  }
  const shape = JSON.stringify(signatureNode(parsed));
  return crypto.createHash('sha256').update(shape).digest('hex');
}

function trackedVersion() {
  const git = spawnSync('git', ['show', 'HEAD:' + typePath], { cwd: root, encoding: 'utf8' });
  if (git.status !== 0) throw new Error('Falha ao ler versão do Git: ' + (git.stderr || '').trim());
  return git.stdout;
}

function run() {
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
  const before = fingerprint(expected);
  const after = fingerprint(actual);
  if (before !== after) {
    throw new Error('Contrato TypeScript gerado diferente do versionado (estrutura, não formatação). ' +
      'Esperado SHA256=' + before + '; gerado SHA256=' + after);
  }
  console.log('Contrato TypeScript gerado compatível com o versionado (assinatura estrutural SHA256=' + before + ').');
}

if (require.main === module) {
  try { run(); } catch (error) {
    console.error('Contratos Supabase: falha - ' + error.message);
    process.exitCode = 1;
  }
}

module.exports = { fingerprint };
