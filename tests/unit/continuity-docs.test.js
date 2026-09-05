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
        'Baseline funcional: PR #260 / `8fc58926565a72465980143f253f0a2fee4b8fc2`',
        'docs/CURRENT_STATE.md',
        'docs/MASTER_PLAN_CURRENT.md',
        'docs/PLAN_TRACEABILITY.md',
        'PR #262 foi ABORTADO E FECHADO SEM MERGE.',
        'PR #263 é documental e não muda regra funcional.'
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
        'R9 — GATE FUTURO',
        '#254 #256 #257 #258 #260 #261',
        'PR #262 abortado sem merge'
    ].join('\n'));
    write(root, 'docs/audits/2026-09-05-continuity-semantic-traceability-complete.md', [
        '# Auditoria completa',
        'PR #260',
        'NF permanente + número + processo existente → Encaminhada / Aguardando Inventariação',
        'PR #254: novo envio/substituição em Aberta ou Aguardando reanálise'
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

test('rejeita ausência da auditoria semântica completa', async () => {
    const { validateContinuityDocuments } = await loadChecker();
    const root = fixtureRoot();
    fs.rmSync(path.join(root, 'docs/audits/2026-09-05-continuity-semantic-traceability-complete.md'));

    const errors = validateContinuityDocuments(root);
    assert.ok(errors.some(error => error.includes('2026-09-05-continuity-semantic-traceability-complete.md')));
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

test('documentos correntes não ressuscitam a fila source-first nem a regra antiga de novo envio', () => {
    const root = path.resolve(__dirname, '../..');
    const projectContext = fs.readFileSync(path.join(root, 'docs/PROJECT_CONTEXT.md'), 'utf8');
    const decisionLog = fs.readFileSync(path.join(root, 'docs/DECISION_LOG.md'), 'utf8');
    const statusDocs = fs.readFileSync(path.join(root, 'docs/reference/STATUS_DOCUMENTOS.md'), 'utf8');
    const adr050 = fs.readFileSync(path.join(root, 'docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md'), 'utf8');

    assert.match(projectContext, /START_HERE\.md/);
    assert.match(projectContext, /MASTER_PLAN_CURRENT\.md/);
    assert.doesNotMatch(projectContext, /porta de entrada executável canônica é .*2026-09-03-plano-remanescente-source-first/i);

    assert.match(decisionLog, /MASTER_PLAN_CURRENT\.md/);
    assert.doesNotMatch(statusDocs, /plano source-first de 03\/09 é \*\*Canônico — plano executável corrente\*\*/i);
    assert.doesNotMatch(statusDocs, /fila atual é exclusivamente R1[–-]R9 no plano source-first/i);
    assert.doesNotMatch(adr050, /novo envio exige Pendência `Aberta` e cria/i);
});

test('documentação de bootstrap contém a extensão crítica efetivamente carregada pelo código', () => {
    const root = path.resolve(__dirname, '../..');
    const documentation = fs.readFileSync(path.join(root, 'docs/architecture/product-extensions-load-order.md'), 'utf8');
    const bootstrap = fs.readFileSync(path.join(root, 'src/integration/product-extensions-bootstrap.js'), 'utf8');

    assert.match(bootstrap, /\/src\/integration\/critical-action-guard\.js/);
    assert.match(documentation, /14\. src\/integration\/critical-action-guard\.js/);
    assert.match(documentation, /18\. src\/integration\/operational-write-feedback\.js/);
});

test('catálogo corrente preserva os dois ramos legítimos de NF permanente', () => {
    const root = path.resolve(__dirname, '../..');
    const catalog = fs.readFileSync(path.join(root, 'docs/reference/PRODUCT_SURFACE_CATALOG.md'), 'utf8');

    assert.match(catalog, /processo já cadastrado[\s\S]{0,160}Encaminhada/i);
    assert.match(catalog, /NF permanente sem processo[\s\S]{0,160}Não encaminhada/i);
    assert.match(catalog, /não é etapa obrigatória de toda NF permanente/i);
});

test('START_HERE usa baseline funcional e não exige que a main permaneça no SHA documental de entrada', () => {
    const root = path.resolve(__dirname, '../..');
    const start = fs.readFileSync(path.join(root, 'START_HERE.md'), 'utf8');

    assert.match(start, /8fc58926565a72465980143f253f0a2fee4b8fc2/);
    assert.match(start, /não existe mais um SHA documental fixo/i);
    assert.doesNotMatch(start, /compare o SHA atual com `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`/i);
});
