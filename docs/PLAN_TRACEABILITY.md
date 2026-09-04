# RADAR PDDE — Rastreabilidade do plano pós-hotfixes

**Atualizado em:** 4 de setembro de 2026  
**Baseline de planejamento:** PR #253, plano source-first de 03/09/2026  
**Baseline funcional posterior:** PR #260, merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Main documental reconciliada:** `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Classe:** Rastreabilidade canônica de continuidade. Não é fila executável.

> Para executar trabalho, leia primeiro [`../START_HERE.md`](../START_HERE.md) e use [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md). Este arquivo explica por que itens do plano de 03/09 foram mantidos, reduzidos, reformulados ou transformados em gates.

## 1. Ponto de corte

O PR #253 foi o último checkpoint que reconciliou corretamente o plano anterior com o código, os hotfixes e as decisões existentes até aquele momento. Depois dele, novos hotfixes alteraram o produto antes que a fila R1–R9 fosse retomada.

A sequência posterior que deve ser absorvida é:

| Ordem | PR | Data | Papel na baseline atual |
|---|---:|---|---|
| 1 | #254 | 03/09 | Corrige novo envio, substituição de envio, reabertura e integridade de Pendências/Assessoria. |
| 2 | #256 | 03/09 | Sincroniza `responsavel`/`proximoAtor` nas transições de Pendências. |
| 3 | #257 | 03/09 | Deriva `Encaminhado para Inventariação` a partir das aquisições permanentes. |
| 4 | #258 | 03/09 | Torna explícito no Prontuário o vínculo NF permanente ↔ bem patrimonial. |
| 5 | #260 | 04/09 | Estabiliza persistência/reload, sequência patrimonial, sincronização e gestos repetidos; adiciona migration #46. |
| 6 | #261 | 04/09 | Fecha documentalmente #260 em Production e produz a `main` `876c597...`. |

Os números #255 e #259 não correspondem a PRs dessa sequência. O PR #262 foi abortado, não teve merge e **não define regra vigente**.

## 2. Regras posteriores que têm precedência

### 2.1 Pendências e novo envio

Os PRs #254 e #256 especializaram regras que não podem ser revertidas por textos anteriores:

- Pendência documental ativa pode estar `Aberta` ou `Aguardando reanálise`;
- um novo envio corretivo pode ser registrado a partir de `Aberta` e uma substituição mais recente pode ser registrada enquanto já está `Aguardando reanálise`;
- reanálise correta resolve; reanálise incorreta retorna a Pendência para `Aberta`;
- Pendência `Resolvida` **ou `Cancelada`** pode ser reaberta quando a operação for autorizada;
- `canceled_at` representa cancelamento terminal atual, não deve renascer a partir de histórico após reabertura;
- projeção do próximo ator é sincronizada em toda transição documental: `Aberta → Escola`, `Aguardando reanálise → Controlador`, estados terminais → sem próximo ator;
- Consulta Assessoria continua individual por `registered_invoice_id`; ao recalcular o agregado, uma NF irmã ainda `Incorreto` preserva o agregado incorreto;
- não fabricar análise para universo legado vazio e não fazer backfill heurístico de `a_identificar`.

### 2.2 Nota Fiscal permanente e Inventário

Os PRs #257, #258 e #260 formam uma única regra atual. Ela **não** pode ser reduzida à frase “todo bem nasce Não encaminhada”.

Contrato vigente:

1. a NF/despesa `permanente` cria e vincula o bem patrimonial na mesma operação;
2. se a escola já possui `processoInventario` e a NF possui número, o bem novo entra como `Encaminhada`, apresentado ao usuário como **Aguardando Inventariação**;
3. se falta processo de inventário, o bem entra como `Não encaminhada`;
4. um bem que esteja `Não encaminhada` não pode pular diretamente para `Inventariada`: nesse ramo vale `Não encaminhada → Encaminhada → Inventariada`;
5. `Encaminhado para Inventariação` é derivado pelo conjunto de aquisições permanentes do mesmo contexto escola + competência + programa:
   - nenhuma aquisição permanente → `Não se aplica`;
   - alguma aquisição não encaminhada → `Não`;
   - todas `Encaminhada`/`Inventariada` → `Sim`;
6. mudança do conjunto/situação patrimonial não aprova análise técnica por herança; quando aplicável, volta a `Não analisado`;
7. o Prontuário mostra a identidade NF ↔ bem pelo vínculo técnico `bemId`/`linked_asset_id`, com número, descrição, valor e status patrimonial;
8. encaminhamento posterior de um bem inicialmente não encaminhado sincroniza bem + verificação + log de forma atômica;
9. bem derivado de NF não permite editar isoladamente o número da NF;
10. encaminhamento e inventariação têm contenção contra repetição do mesmo gesto enquanto a primeira operação está em andamento.

A frase do PR #260 sobre sequência patrimonial é uma proteção contra **pular etapa quando o bem está `Não encaminhada`**. Ela não revoga a entrada automática em `Encaminhada` estabelecida no PR #257 quando o processo já existe.

### 2.3 Confiabilidade funcional

O PR #260 acrescentou provas reais com Supabase local descartável e Auth real para:

- ciclo criar/editar/converter/excluir NF;
- persistência → leitura → reload → releitura;
- verificação mensal e consolidação;
- NF permanente + patrimônio + Prontuário;
- novo envio/reanálise já cobertos por jornadas autenticadas;
- proteção contra gestos repetidos em novo envio, reanálise, encaminhamento e inventariação.

Essas provas passam a ser baseline e devem ser **reutilizadas** nos próximos trabalhos. Não são justificativa para declarar concluída uma fase arquitetural cuja premissa continua presente no código.

## 3. Matriz R1–R9 × estado pós-hotfixes

| Fase do PR #253 | Estado após #261 | Evidência atual | Impacto dos hotfixes posteriores | Destino no plano sucessor |
|---|---|---|---|---|
| **R1 — retirar autoridade funcional de wrappers de performance** | **AINDA PENDENTE** | `operational-write-performance.js` ainda injeta `remoteResultIsAuthoritative`, `remoteCommitIsAuthoritative`, entidades incrementais e refresh exemptions; `prontuario-conditional-reconciler.js` ainda exige `RadarOperationalWritePerformance`. | #254–#261 não removeram essa autoridade. #257/#260 adicionaram novas regras que o futuro desacoplamento deve preservar. | Manter, com guardrails novos de Inventário, Pendências e `critical-action-guard`. |
| **R2 — readiness sistêmico** | **AINDA PENDENTE / REFORMULADO** | Há polling/instalação tardia em integrações e não existe o registry sistêmico previsto no plano. | #260 acrescentou `critical-action-guard.js` ao bootstrap e tornou seus wrappers parte da confiabilidade atual. | Manter, incluindo o guard novo como capacidade funcional a preservar; não confundir timers legítimos com readiness. |
| **R3 — IDs persistentes + intent + idempotência NF + RPC v2** | **AINDA PENDENTE / ESCOPO REDUZIDO** | Serviços ainda possuem fallbacks persistentes com `Date.now()`; não existe `InvoiceSaveIntent`, `save_invoice_with_effects_v2` nem storage de idempotência da NF normal. | #260 resolveu **duplicação imediata enquanto a primeira chamada está em andamento**, mas não retry após resposta ambígua. #254 criou RPCs corretivas especializadas que devem permanecer separadas. | Manter somente a dívida durável: IDs seguros, intenção reutilizável em retry ambíguo, idempotência server-side e contrato v2 da NF normal. Não refazer guard de clique já existente. |
| **R4 — semântica única de Pendências** | **PARCIAL / REFORMULADO** | `pendencias-view-model.js` ainda possui `NEXT_ACTIONS`, cálculo próprio de `waitingSince/ageDays`; `operational-projection.js` possui `getOperationalBaseDate()` e `getConcreteNextAction()` próprios. | #254/#256 corrigiram transições, substituição, reabertura, próximo ator persistido e cancelamento. | Reduzir R4 à projeção compartilhada de data-base/idade/ação/ator entre superfícies. **Não** reabrir regras de transição corrigidas pelos hotfixes. |
| **R5 — save/remove NF remoto autoritativo e incremental** | **AINDA PENDENTE / REFORMULADO** | `invoice:save` e `invoice:remove` ainda usam o contrato atual `save_invoice_with_effects` e não declaram resultado remoto completo/incremental no caminho normal; a v2 não existe. | #257 acrescentou efeitos derivados de Inventário; #258 acrescentou projeção visual vinculada; #260 acrescentou sincronização atômica de encaminhamento e jornadas reais de lifecycle. | Manter após a futura v2, mas tratar os efeitos NF ↔ asset ↔ verification e a UX pós-#258 como baseline que a convergência incremental deve reproduzir exatamente. |
| **R6 — gate de equivalência de Pendências** | **GATE FUTURO** | Muitos requisitos já possuem cobertura atual, mas R4/R5 ainda não fecharam. | #254 e #260 aumentaram a evidência de novo envio/reanálise; layout/exportação existentes continuam protegidos. | Executar depois das frentes semântica/incremental. Se tudo passar, concluir sem diff. |
| **R7 — instrumentação causal do bootstrap** | **AINDA PENDENTE** | Não há o relatório causal de fronteiras `page-init → useful-interaction-ready` previsto em R7. | #260 melhorou provas funcionais, não substituiu instrumentação causal de startup. | Manter, adaptado ao readiness final. |
| **R8 — otimizações por hipótese medida** | **CONDICIONAL / GATE FUTURO** | Não pode começar sem R7 e sem hipótese causal medida. | Nenhum hotfix posterior autoriza otimização especulativa ou relaxamento de threshold. | Preservar como fase condicional; se nenhuma hipótese superar ruído/custo, concluir sem alteração. |
| **R9 — fechamento funcional e rebaseline** | **PARCIAL COMO INFRAESTRUTURA / GATE FUTURO** | #260 executou uma estabilização extensa e deixou workflows/gates reais, mas critérios arquiteturais de R1–R5 ainda não estão todos atendidos. | #260/#261 estabeleceram nova baseline funcional e Production saudável; isso evita reconstruir gates. | No fechamento futuro, **reutilizar** a infraestrutura e provas atuais e reexecutar no SHA final. Não declarar R9 concluído antes das frentes remanescentes. |

## 4. O que o plano sucessor NÃO deve refazer

Os seguintes resultados já existem e não retornam como tarefas autônomas:

- correção atômica `Incorreto + Pendência`;
- individualização fiscal/Assessoria por `registered_invoice_id`;
- novo envio/substituição e reabertura corrigidos por #254;
- sincronização de próximo ator do #256;
- derivação `encampInventario` do #257;
- vínculo visual NF ↔ bem do #258;
- RPC patrimonial e sequência segura do #260;
- proteção de gesto repetido já implementada pelo #260;
- jornadas reais de persistência/reload do #260;
- 46 migrations e verificação pós-apply atualizadas;
- PR4 antigo de reparo automático;
- PR6B, PR7B e PR9B já absorvidos anteriormente;
- redesign histórico de Pendências;
- documento autônomo de Boleto Internet;
- deduplicação de NF por conteúdo;
- backfill heurístico de `a_identificar` legítimo;
- hardening ADR-051 dentro desta frente.

## 5. Linha de decisão para novos PRs

Quando um novo PR funcional for integrado depois desta baseline:

1. comparar o PR com `MASTER_PLAN_CURRENT.md`;
2. registrar em `CURRENT_STATE.md` o novo baseline funcional quando aplicável;
3. registrar aqui se o PR **concluiu, alterou, substituiu ou não afetou** item do plano;
4. atualizar `MASTER_PLAN_CURRENT.md` quando o trabalho remanescente mudar;
5. somente depois considerar a documentação reconciliada.

Um hotfix posterior sempre prevalece sobre a redação anterior do plano na superfície que ele alterou. O plano deve ser atualizado para alcançar o produto atual, nunca o produto revertido para caber no plano.
