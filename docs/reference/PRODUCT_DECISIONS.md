# Decisões de produto do RADAR PDDE — índice histórico

**Classificação:** referência histórica substituída  
**Atualizado em:** 5 de setembro de 2026

> **Não usar este arquivo para retomar o projeto.** Comece em [`../../START_HERE.md`](../../START_HERE.md). Para decisões correntes, consulte [`../DECISION_LOG.md`](../DECISION_LOG.md); para a fila atual, use somente [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).

## 1. Finalidade

Este arquivo preserva os identificadores legados `PD-*`, `PS-*`, `PV-*` e `PG-*` usados em fases antigas. Ele não controla o estado atual e não recebe novas decisões.

## 2. Decisões de domínio legadas ainda úteis como índice

| ID | Conteúdo histórico | Situação atual |
|---|---|---|
| PD-001 | escola como entidade monitorada | preservada |
| PD-002 | bonificação, análise e Pendência independentes | preservada |
| PD-003 | novo envio não resolve | preservada; pré-condições ampliadas posteriormente pelo PR #254 |
| PD-004 | reanálise positiva resolve e negativa reabre | preservada |
| PD-005 | Pendência não altera bonificação automaticamente | preservada |
| PD-006 | retificação preserva estados independentes | preservada |
| PD-007 | Aberta e Aguardando reanálise são ativas | preservada |
| PD-008 | não existe estado canônico Vencida | preservada |
| PD-009 | indicadores podem se sobrepor | preservada |
| PD-010 | regularização não reescreve histórico | preservada |
| PD-011 | notas e bens possuem regras próprias | preservada e especializada pelos PRs #257/#258/#260 |

A descrição atual e suas pré-condições estão em `DECISION_LOG.md` e `CURRENT_STATE.md`.

## 3. Persistência

| ID | Decisão antiga | Situação |
|---|---|---|
| PS-001 | Production em LocalStorage | substituída pelo Supabase canônico |
| PS-002 | Supabase não implantado | substituída |
| PS-003 | Auth/RLS como etapa futura | substituída; Auth/RLS fazem parte do produto atual |
| PS-004 | segredo administrativo fora do frontend | preservada |
| PS-005 | migração com cópia, reconciliação e rollback | preservada |
| PS-006 | modo local sem requisição remota | preservada apenas no adaptador/local apropriado |
| PS-007 | banco vazio não autoriza seed implícito | preservada |
| PS-008 | repositórios compartilham contrato | preservada como arquitetura de dados |

Production atual é Supabase e opera fail-closed.

## 4. Visual, navegação e exportação

| ID | Conteúdo | Situação |
|---|---|---|
| PV-001 | mudança material exige proposta/aprovação | preservada |
| PV-002 | preservar informações, ações e permissões | preservada |
| PV-003 | mobile reorganiza sem perda de conteúdo/capacidade | preservada |
| PV-004 | Excel v2.1 congelado | substituída pelo contrato atual do Excel SME |
| PV-005 | superfícies conectadas | preservada e ampliada |
| PV-006 | modais controlam foco/teclado | preservada |
| PV-007 | polimento não empobrece o domínio | preservada |

Exportações atuais e suas permissões devem ser lidas no catálogo/matriz corrente, não inferidas deste índice histórico.

## 5. Governança legada

| ID | Conteúdo | Situação |
|---|---|---|
| PG-001 | auditar antes de alterar | preservada |
| PG-002 | classificar achados | preservada quando aplicável |
| PG-003 | dúvida material exige investigação | preservada e reforçada pela continuidade atual |
| PG-004 | merge e Production são autorizações distintas | preservada |
| PG-005 | não alterar pode ser resultado válido | preservada |

## 6. Decisões posteriores

As decisões posteriores deixaram de ser mantidas por IDs `PD/PS/PV/PG` neste arquivo. Elas estão em:

- `docs/DECISION_LOG.md`;
- `docs/decisions/ADR-*.md`;
- `docs/CURRENT_STATE.md`;
- `docs/PLAN_TRACEABILITY.md` para a sucessão recente do plano.

Casos especialmente sensíveis já reconciliados: competência global, Pendências transversais, BB Ágil N/A, individualização de Notas Fiscais/Assessoria, `a_identificar`, Boleto de Internet dentro de Notas Fiscais, vínculo NF ↔ patrimônio, Gestão de Equipe, comunicação externa e guards do PR #260.

## 7. Regra de manutenção

Não adicionar novas decisões aqui e não usar esta página como ordem de leitura. Ela existe apenas para decodificar referências históricas antigas.
