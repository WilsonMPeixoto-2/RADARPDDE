# RADAR PDDE — Rastreabilidade do plano pós-hotfixes

**Atualizado em:** 5 de setembro de 2026  
**Baseline de planejamento:** PR #253, plano source-first de 03/09/2026  
**Baseline funcional posterior:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Classe:** rastreabilidade canônica de continuidade; não é fila executável.

> Para executar trabalho, comece em [`../START_HERE.md`](../START_HERE.md) e use somente [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md). Esta página explica como o plano de 03/09 foi absorvido pelos hotfixes posteriores.

## 1. Ponto de corte

O PR #253 foi o último checkpoint que havia reconciliado corretamente o plano anterior com código, hotfixes e decisões existentes naquele momento.

Depois dele foram integrados, antes da retomada literal de R1–R9:

| Ordem | PR | Papel na baseline atual |
|---|---:|---|
| 1 | #254 | novo envio/substituição, reabertura e integridade de Pendências/Assessoria |
| 2 | #256 | sincronização de responsável/próximo ator nas transições |
| 3 | #257 | derivação de `Encaminhado para Inventariação` pelas aquisições permanentes |
| 4 | #258 | vínculo visual NF permanente ↔ bem no Prontuário |
| 5 | #260 | persistência/reload, sequência patrimonial, sincronização atômica e guards de gesto repetido; migration #46 |
| 6 | #261 | fechamento documental da estabilização, sem mudança de runtime |

#255 e #259 não correspondem a PRs dessa sequência. **PR #262 foi abortado e fechado sem merge** e não define regra vigente.

O PR #263 é a reconciliação documental/governança desta linha e não altera regra funcional, runtime ou banco.

## 2. Regras posteriores que têm precedência

### 2.1 Pendências e novo envio

PRs #254/#256 especializaram o contrato:

- `Aberta` e `Aguardando reanálise` são estados ativos;
- primeiro envio corretivo pode ser registrado a partir de `Aberta`;
- substituição da tentativa mais recente pode ser registrada enquanto já está `Aguardando reanálise`;
- novo envio não resolve;
- reanálise correta resolve; incorreta/arquivo indisponível volta a `Aberta`;
- `Resolvida` e `Cancelada` podem ser reabertas quando autorizado;
- `canceled_at` representa cancelamento terminal atual;
- próximo ator: `Aberta → Escola`, `Aguardando reanálise → Controlador`, terminal → nenhum;
- Consulta Assessoria permanece individual por `registered_invoice_id`;
- universo legado não recebe análise/Pendência inventada por heurística.

### 2.2 Nota Fiscal permanente e Inventário

PRs #257/#258/#260 formam o contrato atual:

1. NF/despesa permanente cria e vincula bem;
2. com número fiscal e processo de inventário já existente, o bem novo entra `Encaminhada`, mostrado como **Aguardando Inventariação**;
3. sem processo, entra `Não encaminhada`;
4. se está `Não encaminhada`, não pode pular para `Inventariada`; nesse ramo vale `Não encaminhada → Encaminhada → Inventariada`;
5. `encampInventario`: nenhuma permanente = `Não se aplica`; alguma não encaminhada = `Não`; todas encaminhadas/inventariadas = `Sim`;
6. mudança patrimonial não aprova análise técnica por herança;
7. Prontuário mostra NF ↔ bem por identidade técnica;
8. encaminhamento posterior persiste bem + verificação + log atomicamente;
9. número fiscal do bem derivado não é editado isoladamente;
10. encaminhamento/inventariação têm guard contra repetição imediata.

A frase resumida do PR #260 sobre sequência patrimonial protege o **ramo não encaminhado**. Ela não revoga a entrada automática em `Encaminhada` estabelecida pelo comportamento já existente e comprovada no #257/#258.

### 2.3 Confiabilidade funcional do PR #260

O PR #260 deixou como baseline jornadas reais com Supabase/Auth para:

- criar/editar/converter/excluir NF;
- persistir, ler, recarregar e reler;
- avaliação mensal e consolidação;
- NF permanente + patrimônio + Prontuário;
- novo envio/reanálise em jornada autenticada correlata;
- guards de gesto repetido.

Essas provas devem ser reutilizadas. Elas não transformam uma dívida arquitetural ainda presente em “concluída”, nem um teste isolado em nova regra.

## 3. Matriz R1–R9 × estado pós-hotfixes

| Fase do PR #253 | Estado após #261/#260 | Efeito dos hotfixes | Destino no plano atual |
|---|---|---|---|
| **R1 — retirar autoridade funcional de wrappers de performance** | **AINDA PENDENTE** | #254–#261 não removeram a autoridade; novos guards/regras precisam ser preservados | **Frente 1** |
| **R2 — readiness sistêmico** | **AINDA PENDENTE / REFORMULADO** | #260 acrescentou `critical-action-guard.js` à cadeia atual; não remover timers legítimos por ritual | **Frente 2** |
| **R3 — IDs + intent + idempotência NF + RPC v2** | **PENDENTE COM ESCOPO REDUZIDO** | #260 resolveu repetição imediata durante chamada, não retry ambíguo/idempotência durável | **Frente 3** |
| **R4 — semântica única de Pendências** | **PARCIAL / REFORMULADO** | #254/#256 resolveram transições/reabertura/próximo ator; ainda há projeções duplicadas de data/idade/ação | **Frente 4**, sem reabrir transições |
| **R5 — save/remove NF remoto autoritativo/incremental** | **AINDA PENDENTE / REFORMULADO** | #257/#258/#260 ampliaram o contrato NF ↔ bem ↔ verificação que a convergência futura precisa reproduzir | **Frente 5** |
| **R6 — gate de equivalência de Pendências/superfícies** | **GATE FUTURO** | há mais cobertura após #254/#260, mas depende do fechamento das frentes semântica/incremental | **Frente 6** |
| **R7 — instrumentação causal do bootstrap** | **AINDA PENDENTE** | #260 aumentou provas funcionais, não substituiu instrumentação causal | **Frente 7A** |
| **R8 — otimizações medidas** | **CONDICIONAL** | nenhum hotfix autoriza otimização especulativa ou relaxamento de threshold | **Frente 7B** |
| **R9 — fechamento funcional/rebaseline** | **INFRAESTRUTURA JÁ EXISTE; GATE FUTURO** | #260 deixou muitos gates reais; não precisam ser reconstruídos | **Frente 8** |

## 4. O que os hotfixes já fizeram e não volta como tarefa autônoma

- `Incorreto + Pendência` atômicos;
- individualização fiscal/Assessoria por invoice;
- novo envio/substituição e reabertura do #254;
- próximo ator do #256;
- `encampInventario` do #257;
- vínculo visual NF ↔ bem do #258;
- sincronização patrimonial atômica e bloqueio de edição isolada do #260;
- guards de gesto repetido já implementados;
- jornadas reais de persistência/reload;
- 46 migrations da baseline funcional;
- antigo reparo automático PR4;
- PR6B, PR7B e PR9B já absorvidos anteriormente;
- redesign histórico de Pendências;
- documento autônomo Boleto Internet;
- deduplicação de NF por conteúdo;
- backfill heurístico dos `a_identificar` legítimos;
- hardening ADR-051 dentro da frente funcional atual.

## 5. Auditoria semântica de fechamento

A auditoria completa de 05/09 confrontou documentação corrente, linha #253→#261 e código da baseline em competência/navegação, perfis/autorização, avaliação/retificações, NF/`a_identificar`/Assessoria, Pendências, patrimônio, escolas/carteira, Gestão de Equipe, exportações, bootstrap/readiness e Supabase.

Resultado e correções estão em:

[`audits/2026-09-05-continuity-semantic-traceability-complete.md`](audits/2026-09-05-continuity-semantic-traceability-complete.md)

Foram corrigidos documentos que ainda continham instruções ou cláusulas anteriores aos hotfixes, inclusive `PROJECT_CONTEXT`, `DECISION_LOG`, `STATUS_DOCUMENTOS`, ADR-050, ordem das extensões, roadmap antigo, `CURRENT_STAGE` e referências Supabase.

## 6. Regra para próximos PRs

Quando um novo PR funcional for integrado depois da baseline:

1. comparar seu efeito com `MASTER_PLAN_CURRENT.md`;
2. atualizar `CURRENT_STATE.md`;
3. registrar aqui se concluiu, reduziu, reformulou, substituiu ou não afetou uma frente;
4. atualizar `MASTER_PLAN_CURRENT.md` se o trabalho remanescente mudou;
5. atualizar documentos correntes diretamente afetados;
6. só depois retomar a fila planejada.

O plano deve acompanhar a decisão posterior aprovada. **Não reverter o produto para caber num plano histórico.**