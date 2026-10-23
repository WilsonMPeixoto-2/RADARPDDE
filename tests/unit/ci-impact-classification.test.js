'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const KNIP_COMMAND = 'node scripts/audit/inspect-knip-deep.mjs && node scripts/audit/verify-knip-dynamic-references.mjs';
const original = Object.freeze({name:'radar-pdde',version:'1.0.0',scripts:{start:'node scripts/serve-radar.mjs'}});
const knipAdded = Object.freeze({name:'radar-pdde',version:'1.0.0',scripts:{
  start:'node scripts/serve-radar.mjs','analyze:unused:deep': KNIP_COMMAND
}});
async function classify(paths,opts={}) {
  const {classifyDiff} = await import('../../scripts/ci/classify-pr-impact.mjs');
  return classifyDiff(paths,opts);
}

test('docs em Markdown, sem fixtures e sem outros arquivos, permite docs-only', async () => {
  assert.equal((await classify(['docs/runbooks/NOTAS.md','README.md'])).scope,'docs-only');
});

test('diferencia o PR #475: script novo conhecido, auditoria Knip e Markdown', async () => {
  const result=await classify([
    'package.json','scripts/audit/inspect-knip-deep.mjs',
    'scripts/audit/verify-knip-dynamic-references.mjs',
    'docs/runbooks/KNIP_DEEP_DIAGNOSTIC.md'
  ],{beforePackage: original,afterPackage: knipAdded});
  assert.equal(result.scope,'tooling-only');
});

test('sem package anterior verificado, nao reduz validacao', async () => {
  assert.equal((await classify(['package.json'],{afterPackage:knipAdded})).scope,'full');
});

test('alteracao de dependencia continua full, mesmo adicionando Knip', async () => {
  assert.equal((await classify(['package.json'],{
    beforePackage:original,afterPackage:{...knipAdded,dependencies:{lodash:'1.0.0'}}
  })).scope,'full');
});

test('alteracao de script operacional continua full', async () => {
  assert.equal((await classify(['package.json'],{
    beforePackage:original,afterPackage:{...knipAdded,scripts:{...knipAdded.scripts,start:'node script-malicioso.js'}}
  })).scope,'full');
});

test('mudancas SQL, runtime, CI, fixtures e testes nunca sao ignoradas', async () => {
  for(const file of [
    'supabase/migrations/202610230000_auth.sql','src/application/invoice-service.js',
    '.github/workflows/preproduction-full-validation.yml',
    'docs/evidence/excel-certification/synthetic-manifest.json',
    'tests/e2e/supabase-auth-local.spec.js','package-lock.json'
  ]) assert.equal((await classify([file])).scope,'full',file);
});

test('diff desconhecido ou vazio executa full', async () => {
  assert.equal((await classify([])).scope,'full');
  assert.equal((await classify(['docs/arquivo.md','config.js'])).scope,'full');
  assert.equal((await classify(['../docs/arquivo.md'])).scope,'full');
});

test('diff de instalacao de classificador ou mudanca de CI nao permite skip', async () => {
  assert.equal((await classify(['scripts/ci/classify-pr-impact.mjs'])).scope,'full');
  assert.equal((await classify(['.github/workflows/validate.yml'])).scope,'full');
});

test('nao aceitar comando Knip alterado ou remocao de outros scripts', async () => {
  const wrong = {...knipAdded,scripts:{...knipAdded.scripts,'analyze:unused:deep':'node some-other-script.mjs'}};
  assert.equal((await classify(['package.json'],{beforePackage:original,afterPackage:wrong})).scope,'full');
  const removed = {...knipAdded,scripts:{'analyze:unused:deep':KNIP_COMMAND}};
  assert.equal((await classify(['package.json'],{beforePackage:original,afterPackage:removed})).scope,'full');
});


test('A6: somente docs/audits/*.md admite atalho de ciclo Supabase', async () => {
  const {maySkipLifecycleForAuditDocs} = await import('../../scripts/ci/classify-pr-impact.mjs');
  const files=['docs/audits/2026-10-23-a5-ci-classification.md'];
  const classified=await classify(files);
  assert.equal(classified.scope,'docs-only');
  assert.equal(maySkipLifecycleForAuditDocs({...classified,files}),true);
  assert.equal(maySkipLifecycleForAuditDocs({...classified,files:[...files,'docs/audits/notes.md']}),true);
});

test('A6: docs operacionais, scripts e bases incertas mantem Supabase real', async () => {
  const {maySkipLifecycleForAuditDocs} = await import('../../scripts/ci/classify-pr-impact.mjs');
  for(const files of [
    ['README.md'],['docs/reference/TEST_GOVERNANCE.md'],
    ['docs/runbooks/KNIP_DEEP_DIAGNOSTIC.md'],
    ['docs/audits/a.md','src/application/invoice-service.js'],
    ['docs/audits/a.md','supabase/migrations/20261023000000.sql'],
    ['docs/audits/a.md','.github/workflows/functional-reliability-lifecycle.yml'],
    ['docs/audits/a.md','package-lock.json'],
    ['docs/audits/a.md','scripts/audit/inspect-knip-deep.mjs']
  ]) {
    const report=await classify(files);
    assert.equal(maySkipLifecycleForAuditDocs({...report,files}),false,JSON.stringify(files));
  }
  assert.equal(maySkipLifecycleForAuditDocs(null),false);
  assert.equal(maySkipLifecycleForAuditDocs({scope:'docs-only',files:[]}),false);
  assert.equal(maySkipLifecycleForAuditDocs({scope:'docs-only',files:['docs/audits/../repo.js']}),false);
  assert.equal(maySkipLifecycleForAuditDocs({scope:'full',files:['docs/audits/a.md']}),false);
});

test('A6: pathname alterado para nome Markdown nao vira atalho se origem mudou', async () => {
  const {maySkipLifecycleForAuditDocs} = await import('../../scripts/ci/classify-pr-impact.mjs');
  // Um rename src -> docs aparece em duas entradas com git diff --no-renames.
  const files=['src/domain/operation-key.js','docs/audits/operation-key.md'];
  const report=await classify(files);
  assert.equal(report.scope,'full');
  assert.equal(maySkipLifecycleForAuditDocs({...report,files}),false);
});
