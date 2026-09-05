# RADAR PDDE — Roadmap de atualizações 2026

> **HISTÓRICO — NÃO EXECUTAR COMO ROADMAP CORRENTE.** Este arquivo registrou a frente de agosto de 2026 até o PR #162. A continuidade atual começa em [`../START_HERE.md`](../START_HERE.md) e a única fila vigente é [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md).

**Checkpoint original:** 7 de agosto de 2026  
**Reclassificado em:** 5 de setembro de 2026  
**Classe documental:** histórico de evolução anterior ao plano reconciliado de 03/09

## 1. O que este roadmap representou

Este documento organizou uma fase anterior de:

- confiabilidade funcional ponta a ponta;
- saúde operacional e integridade;
- manutenção técnica;
- evolução do produto;
- fechamento do Excel SME, Gestão de Equipe, monitoramento, matriz funcional e remediações até o PR #162.

Ele foi válido como roadmap naquele checkpoint. Depois dele, o produto avançou por muitos PRs, incluindo os ciclos de individualização fiscal, Pendências, UX, reconciliação source-first e estabilização funcional.

## 2. Por que não é mais executável

A sequência deste arquivo parava em um estado muito anterior à baseline atual. Ela não conhece integralmente:

- PR #211 e a individualização por Nota Fiscal;
- PRs #214/#215 e seus refinamentos;
- PRs #218–#249 e as decisões incorporadas ao plano de 03/09;
- PR #253 e o plano source-first reconciliado;
- PRs #254/#256 e as regras posteriores de Pendências;
- PRs #257/#258 e a integração NF permanente ↔ Inventário/Prontuário;
- PR #260 e a estabilização de persistência, sequência patrimonial e gestos repetidos;
- PR #261 e o fechamento documental dessa baseline.

Executar a antiga “próxima frente” deste roadmap hoje poderia reabrir trabalho já concluído ou ignorar decisões mais recentes.

## 3. Resultados históricos que permanecem incorporados

O fato de o roadmap não ser mais executável **não desfaz** entregas daquele ciclo. Entre os resultados preservados na história do produto estão:

- Excel SME de 27 colunas e seus gates;
- Gestão de Equipe com backend protegido;
- monitoramento geral de Production e incidentes;
- auditoria de integridade;
- matriz funcional;
- regras de identidade institucional das escolas;
- correções de criação de exercício;
- proteção da redistribuição de carteira;
- edição patrimonial versionada/auditada;
- auditoria de exportações;
- infraestrutura de Auth/RLS/backup/restauração e demais gates daquele período.

O estado exato de cada resultado deve ser consultado nos documentos correntes e no código da baseline atual.

## 4. Linha de sucessão

A sucessão documental relevante passou por:

```text
roadmap/agosto
→ plano mestre de 26/08
→ reconciliação e plano source-first do PR #253 em 03/09
→ hotfixes #254/#256/#257/#258/#260
→ reconciliação atual
→ docs/MASTER_PLAN_CURRENT.md
```

## 5. Uso permitido deste arquivo

Use este roadmap apenas para:

- entender por que determinada infraestrutura existe;
- localizar a origem de uma entrega antiga;
- reconstruir decisões de agosto quando `PLAN_TRACEABILITY.md` ou um ADR apontar para esse período.

Não use para decidir a próxima tarefa, reabrir PRs antigos ou declarar uma regra vigente.

## 6. Rota corrente

```text
START_HERE.md
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md se precisar da origem
```

Qualquer referência histórica interna a “sequência vigente”, “próxima frente” ou “baseline mutável em CURRENT_STAGE” pertence ao checkpoint anterior e está substituída pela rota acima.
