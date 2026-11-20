'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const fileUrl = pathToFileURL(path.join(root, 'scripts/check-prontuario-impact.mjs')).href;
const impactPath = path.join(root, 'docs/continuity/prontuario-t0-t6/decision-impact.json');
const registryPath = path.join(root, 'docs/continuity/prontuario-t0-t6/registry.json');
const lineagePath = path.join(root, 'docs/continuity/prontuario-t0-t6/lineage.json');

async function load() { return import(fileUrl); }
function fixtures() {
  return {
    impact: JSON.parse(fs.readFileSync(impactPath, 'utf8')),
    registry: JSON.parse(fs.readFileSync(registryPath, 'utf8')),
    lineage: JSON.parse(fs.readFileSync(lineagePath, 'utf8'))
  };
}

test('impacto T0–T6: toda decisão aprovada alcança obrigações persistentes e válidas', async () => {
  const { validateDecisionImpact } = await load();
  assert.deepEqual(validateDecisionImpact(fixtures(), { rootDir: root }), []);
});

test('impacto T0–T6: uma decisão nova sem propagação não pode passar', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  f.registry.decisions.push({
    id: 'T0T6-D999', date: '2026-11-20', status: 'approved',
    stage: 'T5', title: 'Nova mudança transversal', decision: 'Obrigações por fase', supersedes: []
  });
  assert.ok(validateDecisionImpact(f, { rootDir: root }).some(x => x.includes('D999') && x.includes('sem mapa')));
});

test('impacto T0–T6: uma obrigação aprovada e ainda pendente não pode sumir por reclassificação silenciosa', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  f.impact.records.find(x => x.decisionId === 'T0T6-D002').obligations = [];
  assert.ok(validateDecisionImpact(f, { rootDir: root }).some(x => x.includes('D002') && x.includes('sem obrigações')));
});

test('impacto T0–T6: implementação futura não pode ser declarada concluída sem evidência', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  const entry = f.impact.records.find(x => x.decisionId === 'T0T6-D014');
  entry.obligations[0].status = 'verified';
  entry.obligations[0].evidenceRefs = [];
  assert.ok(validateDecisionImpact(f, { rootDir: root }).some(x => x.includes('verified') && x.includes('evidência')));
});

test('impacto T0–T6: erro em alvo ou requisito impede falso verde', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  const entry = f.impact.records.find(x => x.decisionId === 'T0T6-D015');
  entry.obligations[0].requirementIds = ['T0T6-R999'];
  entry.obligations[0].targetPaths = ['src/integration/inventado-nao-existe.js'];
  const err = validateDecisionImpact(f, { rootDir: root });
  assert.ok(err.some(x => x.includes('R999')));
  assert.ok(err.some(x => x.includes('inventado-nao-existe.js')));
});

test('impacto T0–T6: consulta de design deve recuperar obrigações da regra patrimonial futura', async () => {
  const { queryDecisionImpact } = await load();
  const f = fixtures();
  const found = queryDecisionImpact(f.impact, { phase: 'T5', surface: 'ui' });
  assert.ok(found.some(x => x.decisionId === 'T0T6-D002'
    && x.obligation.requirementIds.includes('T0T6-R038')
    && x.obligation.status === 'planned'));
});

test('impacto T0–T6: decisões válidas devem ser consultáveis em várias fases, sem fechar pendência futura', async () => {
  const { queryDecisionImpact } = await load();
  const f = fixtures();
  const t3 = queryDecisionImpact(f.impact, { phase: 'T3', surface: 'ui' });
  const t5 = queryDecisionImpact(f.impact, { phase: 'T5', surface: 'ui' });
  assert.ok(t3.some(x => x.decisionId === 'T0T6-D002'));
  assert.ok(t5.some(x => x.decisionId === 'T0T6-D002'));
  assert.ok(f.impact.records.find(x => x.decisionId === 'T0T6-D002')
    .obligations.some(x => x.phase === 'T5' && x.status === 'planned'));
});

test('impacto T0–T6: obrigação com dois registros de mesmo ID deve falhar', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  const entry = f.impact.records.find(x => x.decisionId === 'T0T6-D002');
  entry.obligations.push(structuredClone(entry.obligations[0]));
  assert.ok(validateDecisionImpact(f, { rootDir: root }).some(x => x.includes('duplicada')));
});

test('política transversal deve permanecer acessível a agentes, ADRs e contratos de UI', () => {
  const policy = 'docs/reference/DECISION_IMPACT_POLICY.md';
  assert.ok(fs.existsSync(path.join(root, policy)));
  for (const [file,marker] of [
    ['AGENTS.md','docs/reference/DECISION_IMPACT_POLICY.md'],
    ['docs/DECISION_LOG.md','reference/DECISION_IMPACT_POLICY.md'],
    ['docs/reference/SYSTEM_CANONICAL_MODEL.md','DECISION_IMPACT_POLICY.md'],
    ['docs/reference/PRODUCT_SURFACE_CATALOG.md','DECISION_IMPACT_POLICY.md']
  ]) {
    assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes(marker), file);
  }
});

test('impacto T0–T6: obrigação individual não pode desaparecer enquanto outras permanecem', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  const item = f.impact.records.find(x => x.decisionId === 'T0T6-D002');
  const removed = item.obligations.pop();
  assert.ok(item.obligations.length > 0);
  assert.ok(validateDecisionImpact(f, { rootDir: root }).some(x =>
    x.includes(removed.id) && x.includes('obrigação perdida')));
});

test('impacto T0–T6: obrigação nova sem registro persistente não pode ser invisível', async () => {
  const { validateDecisionImpact } = await load();
  const f = fixtures();
  const item = f.impact.records.find(x => x.decisionId === 'T0T6-D002');
  item.obligations.push({ ...structuredClone(item.obligations[0]), id: 'T0T6-I002-99' });
  assert.ok(validateDecisionImpact(f, { rootDir: root }).some(x =>
    x.includes('T0T6-I002-99') && x.includes('não registrada')));
});
