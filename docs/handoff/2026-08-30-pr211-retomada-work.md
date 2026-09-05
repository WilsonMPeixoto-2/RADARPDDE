# PR #211 — retomada histórica entre sessões

> **HISTÓRICO — NÃO USAR COMO ROTEIRO ATUAL.** Este handoff pertence ao ciclo do PR #211, antes dos PRs #254/#256 e da reconciliação pós-#260. Para continuar o projeto, comece em [`../../START_HERE.md`](../../START_HERE.md).

**Data original:** 30 de agosto de 2026  
**Reclassificado em:** 5 de setembro de 2026

## 1. Finalidade histórica

Este arquivo foi criado para transferir o contexto do hotfix de individualização de Notas Fiscais entre sessões enquanto o PR #211 ainda estava em andamento.

A documentação corrente preserva o núcleo da decisão em:

- [`../decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](../decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- [`../CURRENT_STATE.md`](../CURRENT_STATE.md);
- [`../DECISION_LOG.md`](../DECISION_LOG.md).

## 2. Regra posterior que substituiu parte deste handoff

No checkpoint do PR #211, o texto dizia que **novo envio exigia Pendência `Aberta`**. Essa pré-condição mais estreita foi posteriormente substituída pelo PR #254.

Contrato atual:

```text
primeiro envio corretivo: Pendência Aberta
substituição de envio mais recente: também pode ocorrer em Aguardando reanálise
resultado do envio: permanece Aguardando reanálise
reanálise posterior decide a transição
```

O PR #256 também especializou a projeção do próximo ator:

```text
Aberta → Escola
Aguardando reanálise → Controlador
terminal → nenhum
```

Portanto, qualquer ocorrência antiga neste handoff de “novo envio somente em Aberta” é **histórica e superada**.

## 3. Núcleo do PR #211 que permanece relevante

- análise fiscal individual por `registered_invoice_id`;
- Consulta Assessoria individual por NF de serviço;
- Pendência da NF A não bloqueia NF B;
- `Incorreto + Pendência` exige operação protegida/atômica;
- reanálise trabalha sobre tentativa real e não reescreve conteúdo histórico;
- `a_identificar` legítimo não recebe backfill heurístico;
- Boleto Internet não é documento autônomo.

## 4. Rota corrente

```text
START_HERE.md
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md quando precisar da origem
```

O conteúdo detalhado original deste handoff continua preservado no histórico Git do arquivo.