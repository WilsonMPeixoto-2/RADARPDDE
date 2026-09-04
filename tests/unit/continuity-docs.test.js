'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function loadChecker() {
    return import('../../scripts/check-continuity-docs.mjs');
}

function write(root, relativePath, content) {
    const absolute = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
}

function fixtureRoot() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-continuity-'));
    write(root, 'START_HERE.md', [
        '# START',
        'Baseline: `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`',
        'docs/CURRENT_STATE.md',
        'docs/MASTER_PLAN_CURRENT.md',
        'docs/PLAN_TRACEABILITY.md',
        'PR #262 foi ABORTADO E FECHADO SEM MERGE.'
    ].join('\n'));
    write(root, 'README.md', '# README\n\nPrimeira leitura: [START_HERE.md](START_HERE.md)\n');
    write(root, 'AGENTS.md', '# AGENTS\n\nPrimeira leitura: [START_HERE.md](START_HERE.md)\n');
    write(root, 'docs/README.md', '# Docs\n\nPrimeira leitura: [START_HERE.md](../START_HERE.md)\n');
    write(root, 'docs/CURRENT_STATE.md', '# Estado\n');
    write(root, 'docs/MASTER_PLAN_CURRENT.md', '# Plano\n\n**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**\n');
    write(root, 'docs/PLAN_TRACEABILITY.md', [
        '# Trace',
        'R1 — AINDA PENDENTE',
        'R2 — AINDA PENDENTE',
        'R3 — PARCIAL',
        'R4 — PARCIAL',
        'R5 — AINDA PENDENTE',
        'R6 — GATE FUTURO',
        'R7 — AINDA PENDENTE',
        'R8 — CONDICIONAL',
        'R9 — GATE FUTURO'
    ].join('\n'));
    write(root, 'docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md', '# Antigo\n\nHISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL\n');
    write(root, 'docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md', '# Mais antigo\n\nHISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL\n');
    return root;
}

test('estrutura corrente de continuidade do repositório é válida', async () => {
    const { validateContinuityDocuments } = await loadChecker();
    const errors = validateContinuityDocuments(path.resolve(__dirname, '../..'));
    assert.deepEqual(errors, []);
});

test('rejeita ponto de entrada que não orienta START_HERE antes de plano histórico', async () => {
    const { validateContinuityDocuments } = await loadChecker();
    const root = fixtureRoot();
    write(root, 'README.md', [
        '# README',
        'Execute docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md',
        'Depois leia START_HERE.md'
    ].join('\n'));

    const errors = validateContinuityDocuments(root);
    assert.ok(errors.some(error => error.includes('README.md') && error.includes('START_HERE')));
});

test('rejeita mais de um documento marcado como plano executável vigente', async () => {
    const { validateContinuityDocuments } = await loadChecker();
    const root = fixtureRoot();
    write(root, 'docs/outro-plano.md', '# Outro\n\n**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**\n');

    const errors = validateContinuityDocuments(root);
    assert.ok(errors.some(error => error.includes('mais de um') && error.includes('plano executável')));
});

test('rejeita plano histórico sem banner inequívoco', async () => {
    const { validateContinuityDocuments } = await loadChecker();
    const root = fixtureRoot();
    write(root, 'docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md', '# Antigo\n\nPlano executável corrente\n');

    const errors = validateContinuityDocuments(root);
    assert.ok(errors.some(error => error.includes('2026-09-03') && error.includes('HISTÓRICO')));
});

test('rejeita rastreabilidade sem destino explícito para qualquer R1 a R9', async () => {
    const { validateContinuityDocuments } = await loadChecker();
    const root = fixtureRoot();
    write(root, 'docs/PLAN_TRACEABILITY.md', '# Trace\nR1 AINDA PENDENTE\nR2 AINDA PENDENTE\n');

    const errors = validateContinuityDocuments(root);
    assert.ok(errors.some(error => error.includes('R9')));
});

test('PR com alteração funcional exige atualização de estado e rastreabilidade', async () => {
    const { validatePullRequestContinuityImpact } = await loadChecker();

    const errors = validatePullRequestContinuityImpact([
        'src/application/invoice-service.js',
        'tests/unit/invoice-service.test.js'
    ]);

    assert.ok(errors.some(error => error.includes('docs/CURRENT_STATE.md')));
    assert.ok(errors.some(error => error.includes('docs/PLAN_TRACEABILITY.md')));
});

test('PR funcional fica estruturalmente reconciliado quando atualiza estado e rastreabilidade', async () => {
    const { validatePullRequestContinuityImpact } = await loadChecker();

    const errors = validatePullRequestContinuityImpact([
        'src/application/invoice-service.js',
        'tests/unit/invoice-service.test.js',
        'docs/CURRENT_STATE.md',
        'docs/PLAN_TRACEABILITY.md'
    ]);

    assert.deepEqual(errors, []);
});
