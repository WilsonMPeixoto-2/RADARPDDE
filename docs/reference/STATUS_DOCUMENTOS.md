# Matriz de validade documental

**Atualizado em:** 7 de setembro de 2026  
**Classe documental:** Canônico

## 1. Finalidade

Este documento define quais arquivos podem orientar o estado presente e quais servem apenas como evidência/histórico.

O estado mutável fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md). O método permanente fica em [`ENGINEERING_METHOD.md`](ENGINEERING_METHOD.md). O gate permanente de validação pelo usuário fica em [`FRONTEND_USER_VALIDATION_GATE.md`](FRONTEND_USER_VALIDATION_GATE.md). O checkpoint source-first corrente é [`../handoff/2026-09-06-rebaseline-pos-pr279.md`](../handoff/2026-09-06-rebaseline-pos-pr279.md).

## 2. Precedência

Para determinar comportamento atual:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e Vercel efetivos;
3. decisões funcionais vigentes;
4. testes atuais que representam o contrato vigente;
5. documentos canônicos correntes;
6. auditorias, evidências, planos e checkpoints históricos.

PR aberto, Preview, documento histórico ou memória de conversa não altera a baseline da `main`/Production.

## 3. Classes

| Classe | Significado |
|---|---|
| **Canônico** | controla estado, prioridade, regra geral ou validade documental vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada de contrato executável; não editar manualmente |
| **Referência vigente** | descreve contrato técnico/funcional durável |
| **Runbook vigente** | procedimento operacional atual, sem autorizar execução automática |
| **Decisão vigente** | regra aprovada até substituição/revogação expressa |
| **Evidência** | comprova execução/achado em data, SHA e ambiente específicos |
| **Trabalho em andamento** | branch/PR não integrado; não altera baseline |
| **Histórico executado** | plano/handoff/auditoria preservado após sua etapa |
| **Superado** | não usar para orientar o presente salvo investigação histórica |

## 4. Rota canônica corrente

| Arquivo | Classe | Uso |
|---|---|---|
| `AGENTS.md` | Canônico | regras de trabalho, precedência e guardrails |
| `docs/CURRENT_STAGE.md` | Canônico | estado mutável, classificação R1–R9 e próxima etapa |
| `docs/reference/ENGINEERING_METHOD.md` | Canônico | método permanente de investigação/implementação/revisão |
| `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` | Canônico | gate permanente de validação pela interface real, persistência/releitura e inspeção visual em todas as frentes afetadas |
| `docs/handoff/2026-09-06-rebaseline-pos-pr279.md` | Canônico/checkpoint | evidência source-first e justificativa da fila pós-#279 |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | esta matriz de validade |
| `docs/reference/TEST_GOVERNANCE.md` | Canônico | interpretação proporcional de testes/falhas |
| `docs/PROJECT_CONTEXT.md` | Referência vigente | contratos funcionais/arquiteturais duráveis; parágrafos temporais antigos não substituem CURRENT_STAGE |
| `docs/DECISION_LOG.md` | Referência vigente | decisões duradouras; reconciliações temporais antigas cedem ao checkpoint corrente |
| `docs/decisions/*.md` | Decisão vigente conforme status | ADR específica prevalece no ponto especializado |
| `docs/reference/functional-contract-matrix.json` e módulos | Contrato executável | operações/cobertura; `sourceCommit` é evidência do SHA em que foi gerado, não declaração automática do HEAD atual |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão derivada da matriz JSON |

## 5. Documentos históricos que não controlam mais a fila

| Documento | Classe atual | Motivo |
|---|---|---|
| `docs/audits/2026-09-06-pr272-inventory-auth-review.md` | Evidência histórica | revisou #271/#272 como candidatos antes de ambos serem posteriormente corrigidos/integrados |
| `docs/handoff/2026-09-04-estabilizacao-funcional-pr260.md` | Histórico executado | antecede #265–#279 |
| `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` | Histórico de planejamento | critérios R1–R9 continuam úteis, mas cada premissa foi reclassificada pós-#279 |
| `docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md` | Evidência histórica | comprova o SHA daquela auditoria, não o código atual |
| `docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md` | Checkpoint histórico | antecede hotfixes e estabilizações posteriores |
| planos/handoffs anteriores de agosto | Histórico executado/Evidência | preservar para rastreabilidade, não reabrir tarefas automaticamente |

Os snapshots dos três roteadores anteriores a este rebaseline foram preservados em `docs/history/rebaseline-pre-pr279/`.

## 6. Trabalho em andamento e PRs abertos

- **PR #263:** Trabalho em andamento **superado como rota candidata**. Base antiga, Draft e divergente dos hotfixes posteriores. Não mergear; fechar após o rebaseline corrente estar integrado.
- **PR #264:** Trabalho em andamento de manutenção. Não altera baseline. Rebase/revalidação na etapa própria.
- **PR #5:** Histórico aberto; reavaliar e fechar se não existir decisão corrente que o reviva.

## 7. R1–R9

O plano de 03/09 é histórico, mas seus identificadores permanecem úteis para rastreabilidade. A classificação válida está em `CURRENT_STAGE.md`:

- R1: pendente real;
- R2A: parcialmente absorvido; R2B/R2C: pendentes reais;
- R3: materialmente atendido, fechamento formal pendente;
- R4: pendente real;
- R5: pendente real;
- R6: gate posterior;
- R7: pendente;
- R8: condicional;
- R9: pendente.

Nenhuma fase deve ser implementada sem revalidar o código atual e tentar refutar a premissa.

## 8. ADR-051 e hardening

A ADR-051 continua decisão vigente de adiamento até o fechamento funcional/R9. A revalidação de Production confirmou que a dívida estrutural ainda existe, sem evidência de corrupção atual.

O warning de Auth sobre leaked password protection e demais hardenings de segurança são frente separada; não devem ser misturados a um hotfix funcional apenas para “zerar” lista de avisos.

## 9. Testes, matriz e documentos gerados

- teste não cria regra de negócio sozinho;
- falha deve ser classificada antes de mudar produto;
- contrato superado deve ser atualizado/removido, não imposto ao runtime;
- arquivos gerados devem ser regenerados a partir da fonte canônica correspondente;
- `sourceCommit` em matriz/evidência indica o SHA de geração, não necessariamente o HEAD atual;
- prova anterior pode ser reaproveitada somente quando a superfície correspondente não mudou materialmente;
- alteração funcional, visual ou estrutural que possa afetar a experiência do usuário exige também a prova definida em `FRONTEND_USER_VALIDATION_GATE.md`; CI verde, serviço isolado verde ou gravação de banco isolada não encerram a tarefa por si sós.

## 10. Regra de preservação histórica

Não reescrever auditoria/ADR/handoff antigo para fazê-lo parecer atual. Quando o estado mudar:

1. criar novo checkpoint ou atualizar documento canônico mutável;
2. manter evidência histórica intacta;
3. registrar explicitamente qual documento deixou de controlar a fila;
4. preservar decisões superadas com seu status e contexto.