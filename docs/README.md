# Documentação do RADAR PDDE

**Estado de referência:** 6 de setembro de 2026  
**Classe documental:** Canônico — índice

## 0. Frente ativa

A frente ativa é o **fechamento source-first pós-PR #279**. A cadeia funcional #265–#279 está integrada; o trabalho remanescente é classificado entre dívida arquitetural R1/R2/R4/R5, gates R3/R6, diagnóstico R7/R8, fechamento R9 e hardening posterior.

O estado atual fica em [CURRENT_STAGE.md](CURRENT_STAGE.md). O checkpoint que fundamenta essa classificação é [Rebaseline source-first pós-PR #279](handoff/2026-09-06-rebaseline-pos-pr279.md).

## 1. Onde começar

Ordem recomendada:

1. [AGENTS.md](../AGENTS.md) — regras de trabalho e precedência;
2. [CURRENT_STAGE.md](CURRENT_STAGE.md) — estado mutável e próxima etapa;
3. [ENGINEERING_METHOD.md](reference/ENGINEERING_METHOD.md) — método permanente;
4. [Rebaseline pós-#279](handoff/2026-09-06-rebaseline-pos-pr279.md) — evidência/classificação corrente;
5. [STATUS_DOCUMENTOS.md](reference/STATUS_DOCUMENTOS.md) — validade documental;
6. [ADR-050](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md), [ADR-052](decisions/ADR-052-autoridade-unica-fluxos-criticos.md) e [matriz funcional](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
7. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), [DECISION_LOG.md](DECISION_LOG.md) e [TEST_GOVERNANCE.md](reference/TEST_GOVERNANCE.md);
8. planos, auditorias e handoffs anteriores somente como evidência histórica.

## 2. Próxima sequência aprovada

```text
rebaseline documental pós-#279
→ limpar PRs antigos/ambíguos
→ tratar proteção da main
→ R1
→ R2
→ fechamento formal de R3
→ R4
→ R5
→ R6
→ R7
→ R8 se medição justificar
→ R9
→ ADR-051 / hardening
→ PR #264 / dependências
```

R1–R9 continuam sendo os identificadores do plano histórico de 03/09, mas **a classificação corrente está em CURRENT_STAGE.md**. Não executar literalmente uma fase antiga sem revalidar sua causa no código atual.

## 3. Contratos que continuam vigentes

- Supabase é a persistência canônica de Production e Production é fail-closed;
- competência mensal usa `RadarCompetenceContext` como contexto global;
- Pendências são passivo transversal entre competências;
- bonificação, análise técnica e Pendência são dimensões independentes;
- Notas Fiscais usam análise/Pendência individual por `registered_invoice_id`;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente; legados não recebem associação fabricada;
- Consulta Assessoria é individual por NF de serviço;
- `boleto_internet` é tipo de gasto dentro de Notas Fiscais para Educação Conectada;
- `Inventariada` é terminal;
- operações críticas remotas preservam atomicidade, optimistic concurrency e autoria/auditoria;
- commit remoto confirmado e sincronização local são fronteiras diferentes;
- layout aprovado de Prontuário/Pendências não deve regredir por plano histórico.

## 4. Documentos correntes

- [CURRENT_STAGE.md](CURRENT_STAGE.md) — estado corrente e ordem;
- [handoff/2026-09-06-rebaseline-pos-pr279.md](handoff/2026-09-06-rebaseline-pos-pr279.md) — checkpoint source-first pós-#279;
- [reference/ENGINEERING_METHOD.md](reference/ENGINEERING_METHOD.md) — método de engenharia/revisão adversarial;
- [reference/STATUS_DOCUMENTOS.md](reference/STATUS_DOCUMENTOS.md) — validade documental;
- [reference/TEST_GOVERNANCE.md](reference/TEST_GOVERNANCE.md) — interpretação dos testes;
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — contratos duráveis;
- [DECISION_LOG.md](DECISION_LOG.md) — decisões duradouras;
- [reference/functional-contract-matrix.json](reference/functional-contract-matrix.json) — contrato executável; conferir o `sourceCommit` antes de tratá-lo como evidência do SHA atual;
- [reference/FUNCTIONAL_CONTRACT_MATRIX.md](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada da matriz;
- [decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- [decisions/ADR-051-adiamento-hardening-registered-invoices.md](decisions/ADR-051-adiamento-hardening-registered-invoices.md);
- [decisions/ADR-052-autoridade-unica-fluxos-criticos.md](decisions/ADR-052-autoridade-unica-fluxos-criticos.md).

## 5. Histórico importante

Os documentos abaixo preservam decisões/evidências do seu checkpoint, mas não definem automaticamente o presente:

- [audits/2026-09-06-pr272-inventory-auth-review.md](audits/2026-09-06-pr272-inventory-auth-review.md) — revisão do estado pós-#267 e dos candidatos #271/#272 antes da integração posterior;
- [handoff/2026-09-04-estabilizacao-funcional-pr260.md](handoff/2026-09-04-estabilizacao-funcional-pr260.md) — estabilização anterior aos hotfixes #265–#279;
- [superpowers/plans/2026-09-03-plano-remanescente-source-first.md](superpowers/plans/2026-09-03-plano-remanescente-source-first.md) — plano R1–R9 original;
- [audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md](audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md) — auditoria que fundamentou aquele plano;
- `history/rebaseline-pre-pr279/` — cópia exata dos roteadores canônicos anteriores ao rebaseline atual.

## 6. PRs que não definem o estado corrente

- **#263:** Draft documental antigo; será supersedido pelo rebaseline pós-#279 e não deve ser mergeado;
- **#264:** manutenção de dependências sobre base anterior; rebase/revalidação somente na etapa própria;
- **#5:** frente histórica a reavaliar/encerrar se não houver decisão atual de retomada.

PR aberto, Preview, plano histórico ou memória de conversa não muda a baseline de Production.

## 7. Método de continuidade

```text
revalidar remoto
→ localizar autoridade real no código
→ tentar refutar a hipótese
→ classificar causa atual
→ branch isolada
→ RED quando houver defeito/código
→ menor mudança coerente
→ revisão adversarial proporcional
→ gates do SHA final
→ Production somente quando aplicável/autorizado
→ atualizar documentação afetada
```

Não alterar código correto para satisfazer um documento ou teste histórico.
