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
