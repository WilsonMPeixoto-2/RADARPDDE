'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const registryFile = path.join(root, 'docs/continuity/prontuario-t0-t6/registry.json');
const moduleUrl = pathToFileURL(path.join(root, 'scripts/check-prontuario-continuity.mjs')).href;

async function load() {
    return import(moduleUrl);
}
function registry() {
    return JSON.parse(fs.readFileSync(registryFile, 'utf8'));
}

test('T0–T6: registro consolidado e ponteiros canônicos são íntegros', async () => {
    const { checkContinuityRepository } = await load();
    assert.deepEqual(checkContinuityRepository(root), []);
});

test('T0–T6: entrada duplicada não pode sobrescrever decisões anteriores', async () => {
    const { validateContinuityRegistry } = await load();
    const draft = registry();
    draft.decisions.push(structuredClone(draft.decisions[0]));
    assert.ok(validateContinuityRegistry(draft).some(error => error.includes('duplicado')));
});

test('T0–T6: uma nova decisão que altera plano exige trilha explícita supersedes', async () => {
    const { validateContinuityRegistry } = await load();
    const draft = registry();
    const replacement = draft.decisions.find(row => row.id === 'T0T6-D006');
    replacement.supersedes = [];
    assert.ok(validateContinuityRegistry(draft).some(error => error.includes('sem sucessora')));
});

test('T0–T6: incorporação de agente sem referência de commit/PR é recusada', async () => {
    const { validateContinuityRegistry } = await load();
    const draft = registry();
    draft.contributions.find(row => row.status === 'incorporated').integratedRef = '';
    assert.ok(validateContinuityRegistry(draft).some(error => error.includes('sem prova GitHub')));
});

test('T0–T6: propostas rejeitadas não ganham referência de decisão inexistente', async () => {
    const { validateContinuityRegistry } = await load();
    const draft = registry();
    draft.contributions.find(row => row.status === 'rejected').decisionIds = ['T0T6-D999'];
    assert.ok(validateContinuityRegistry(draft).some(error => error.includes('decisão inexistente')));
});

test('T0–T6: fonte documental de uma decisão deve existir na árvore de trabalho', async () => {
    const { validateContinuityRegistry } = await load();
    const draft = registry();
    draft.decisions[0].sourcePath = 'docs/arquivo-inexistente.md';
    assert.ok(validateContinuityRegistry(draft, { rootDir: root }).some(error => error.includes('não encontrado')));
});

function lineage() {
    return JSON.parse(fs.readFileSync(path.join(root, 'docs/continuity/prontuario-t0-t6/lineage.json'), 'utf8'));
}

test('T0–T6: atlas de origem e requisitos passa pela validação de integridade', async () => {
    const { validateProntuarioLineage } = await load();
    assert.deepEqual(validateProntuarioLineage(lineage(), { rootDir: root, registry: registry() }), []);
});

test('T0–T6: alteração de fonte originária sem atualização da prova SHA bloqueia o gate', async () => {
    const { validateProntuarioLineage } = await load();
    const draft = lineage();
    draft.sources.find(s => s.location === 'release-branch').contentSha = '0'.repeat(40);
    assert.ok(validateProntuarioLineage(draft, { rootDir: root, registry: registry() })
      .some(error => error.includes('fingerprint divergente')));
});

test('T0–T6: referência antiga a serviço removido não pode passar como implementação atual', async () => {
    const { validateProntuarioLineage } = await load();
    const draft = lineage();
    draft.requirements.find(r => r.id === 'T0T6-R044').codePaths.push('src/application/operational-correction-service.js');
    assert.ok(validateProntuarioLineage(draft, { rootDir: root, registry: registry() })
      .some(error => error.includes('arquivo de código não existe')));
});

test('T0–T6: requisitos sem fonte existente não podem desaparecer na consolidação', async () => {
    const { validateProntuarioLineage } = await load();
    const draft = lineage();
    draft.requirements.find(r => r.id === 'T0T6-R053').sourceIds = ['S999'];
    assert.ok(validateProntuarioLineage(draft, { rootDir: root, registry: registry() })
      .some(error => error.includes('fonte inexistente')));
});

test('T0–T6: IDs duplicados impedem rastreabilidade de requisitos históricos', async () => {
    const { validateProntuarioLineage } = await load();
    const draft = lineage();
    draft.requirements.push(structuredClone(draft.requirements[0]));
    assert.ok(validateProntuarioLineage(draft, { rootDir: root, registry: registry() })
      .some(error => error.includes('ID duplicado')));
});

test('T0–T6: fontes externas devem ter versão e referência do GitHub verificáveis', async () => {
    const { validateProntuarioLineage } = await load();
    const draft = lineage();
    const external = draft.sources.find(s => s.location === 'external-branch');
    external.ref = '';
    assert.ok(validateProntuarioLineage(draft, { rootDir: root, registry: registry() })
      .some(error => error.includes('branch externa sem ref')));
});

test('T0–T6: lacunas conhecidas não podem ser excluídas por declarar a auditoria encerrada', async () => {
    const { validateProntuarioLineage } = await load();
    const draft = lineage();
    draft.gaps = [];
    assert.ok(validateProntuarioLineage(draft, { rootDir: root, registry: registry() })
      .some(error => error.includes('lacunas conhecidas')));
});
