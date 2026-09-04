import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const rules = [
  {
    path: 'docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md',
    marker: 'HISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL',
    banner: '> **HISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL.** Este foi o plano correto do checkpoint de 03/09, mas foi posteriormente alterado pelos PRs #254, #256, #257, #258 e #260. A única fila vigente está em [`../../MASTER_PLAN_CURRENT.md`](../../MASTER_PLAN_CURRENT.md). Comece em [`../../../START_HERE.md`](../../../START_HERE.md).'
  },
  {
    path: 'docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md',
    marker: 'HISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL',
    banner: '> **HISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL.** Este plano foi substituído primeiro pelo plano source-first de 03/09 e depois pelo plano mestre corrente. Comece em [`../../../START_HERE.md`](../../../START_HERE.md) e use [`../../MASTER_PLAN_CURRENT.md`](../../MASTER_PLAN_CURRENT.md).'
  },
  {
    path: 'docs/CURRENT_STAGE.md',
    marker: 'CONTINUIDADE CORRENTE',
    banner: '> **CONTINUIDADE CORRENTE:** este arquivo preserva o histórico detalhado dos checkpoints. Para retomada e próxima ação, comece em [`../START_HERE.md`](../START_HERE.md), leia [`CURRENT_STATE.md`](CURRENT_STATE.md) e use somente [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) como fila executável.'
  },
  {
    path: 'docs/reference/STATUS_DOCUMENTOS.md',
    marker: 'ROTEAMENTO DE CONTINUIDADE',
    banner: '> **ROTEAMENTO DE CONTINUIDADE:** a classificação abaixo preserva a história documental, mas a retomada operacional começa obrigatoriamente em [`../../START_HERE.md`](../../START_HERE.md). O único plano executável vigente é [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).'
  },
  {
    path: 'docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md',
    marker: 'VIGENTE COM EMENDAS POSTERIORES',
    banner: '> **VIGENTE COM EMENDAS POSTERIORES.** O núcleo de individualização continua válido, mas regras de novo envio/reabertura/próximo ator foram especializadas pelos PRs #254/#256. Antes de usar este ADR para alterar código, leia [`../PLAN_TRACEABILITY.md`](../PLAN_TRACEABILITY.md) e [`../CURRENT_STATE.md`](../CURRENT_STATE.md).'
  },
  {
    path: 'docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md',
    marker: 'EVIDÊNCIA HISTÓRICA — NÃO DEFINE A FILA ATUAL',
    banner: '> **EVIDÊNCIA HISTÓRICA — NÃO DEFINE A FILA ATUAL.** Este handoff registra o checkpoint anterior aos hotfixes #254/#256/#257/#258/#260. Para continuidade, comece em [`../../START_HERE.md`](../../START_HERE.md).'
  },
  {
    path: 'docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md',
    marker: 'EVIDÊNCIA DO CHECKPOINT DE 03/09',
    banner: '> **EVIDÊNCIA DO CHECKPOINT DE 03/09.** Esta auditoria explica por que R1–R9 existiam naquele SHA, mas não define a fila pós-PR #260. Para estado corrente, leia [`../CURRENT_STATE.md`](../CURRENT_STATE.md) e [`../PLAN_TRACEABILITY.md`](../PLAN_TRACEABILITY.md).'
  },
  {
    path: 'docs/architecture/product-extensions-load-order.md',
    marker: 'CONFRONTAR COM O BOOTSTRAP ATUAL',
    banner: '> **CONFRONTAR COM O BOOTSTRAP ATUAL.** A ordem de extensões evoluiu posteriormente, inclusive com `critical-action-guard.js` no PR #260. Este documento é referência arquitetural, não substitui a leitura de `src/integration/product-extensions-bootstrap.js` no SHA corrente.'
  }
];

function insertAfterTitle(source, banner) {
  const lines = source.split('\n');
  const titleIndex = lines.findIndex(line => /^#\s/.test(line));
  if (titleIndex < 0) return `${banner}\n\n${source}`;
  lines.splice(titleIndex + 1, 0, '', banner);
  return lines.join('\n');
}

let changed = 0;
for (const rule of rules) {
  const absolute = path.join(root, rule.path);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Arquivo esperado não encontrado: ${rule.path}`);
  }
  const source = fs.readFileSync(absolute, 'utf8');
  if (source.includes(rule.marker)) continue;
  fs.writeFileSync(absolute, insertAfterTitle(source, rule.banner));
  changed += 1;
  console.log(`banner atualizado: ${rule.path}`);
}

console.log(`arquivos alterados: ${changed}`);
