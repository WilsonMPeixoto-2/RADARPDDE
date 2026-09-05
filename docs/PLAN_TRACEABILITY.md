# RADAR PDDE — Rastreabilidade do plano pós-hotfixes

**Atualizado em:** 5 de setembro de 2026  
**Baseline de planejamento:** PR #253, plano source-first de 03/09/2026  
**Baseline funcional posterior:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Classe:** rastreabilidade canônica de continuidade; não é fila executável.

> Para executar trabalho, comece em [`../START_HERE.md`](../START_HERE.md), aplique o [`método adversarial`](architecture/adversarial-analysis-and-implementation-method.md) e use somente [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md).

## 1. Ponto de corte

O PR #253 foi o último checkpoint que havia reconciliado corretamente o plano anterior com código, hotfixes e decisões existentes naquele momento.

Depois dele foram integrados:

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
- primeiro envio corretivo pode partir de `Aberta`;
- substituição pode ocorrer em `Aguardando reanálise`;
- novo envio não resolve;
- reanálise correta resolve; incorreta/arquivo indisponível volta a `Aberta`;
- `Resolvida` e `Cancelada` podem ser reabertas;
- `canceled_at` representa cancelamento terminal atual;
- próximo ator: `Aberta → Escola`, `Aguardando reanálise → Controlador`, terminal → nenhum;
- Consulta Assessoria permanece individual por `registered_invoice_id`;
- universo legado não recebe análise/Pendência inventada por heurística.

### 2.2 Nota Fiscal permanente e Inventário

PRs #257/#258/#260 formam o contrato atual:

1. NF/despesa permanente cria e vincula bem;
2. com número fiscal e processo existente, bem novo entra `Encaminhada` / **Aguardando Inventariação**;
3. sem processo, entra `Não encaminhada`;
4. se está `Não encaminhada`, não pode pular para `Inventariada`;
5. `encampInventario`: nenhuma permanente = N/A; alguma não encaminhada = Não; todas encaminhadas/inventariadas = Sim;
6. mudança patrimonial não aprova análise técnica por herança;
7. Prontuário mostra NF ↔ bem por identidade técnica;
8. encaminhamento posterior persiste bem + verificação + log atomicamente;
9. número fiscal do bem derivado não é editado isoladamente;
10. encaminhamento/inventariação têm guard contra repetição imediata.

A auditoria adversarial posterior revelou um defeito **não previsto por essa linha de decisão**: salvar novamente uma NF de bem já `Inventariada` pode reaplicar a regra de nascimento e rebaixar o status para `Encaminhada`. Isso não altera a regra aprovada; é bug da implementação atual a corrigir em PR funcional próprio.

### 2.3 Confiabilidade funcional do PR #260

O PR #260 deixou jornadas reais para NF, patrimônio, avaliação, Pendências e reload. Essas provas permanecem válidas para os cenários que exercitam.

A auditoria adversarial mostrou, porém, que **não podem ser usadas como prova de cobertura de combinações não exercitadas**. Exemplo: uma suíte verde de NF↔Inventário não cobria necessariamente `inventariar → voltar à NF → salvar novamente`.

## 3. Matriz R1–R9 × estado pós-hotfixes e pós-auditoria adversarial

| Fase do PR #253 | Estado atual | Efeito posterior | Destino |
|---|---|---|---|
| **R1 — retirar autoridade funcional de wrappers de performance** | **PENDENTE** | Astra confirmou que performance ainda participa de correção | **Frente 1** |
| **R2 — readiness sistêmico** | **PENDENTE / REFORMULADO** | preservar guards e provar capacidade instalada, não só Promise/script | **Frente 2** |
| **R3 — IDs + intent + idempotência NF + RPC v2** | **PENDENTE COM ESCOPO REDUZIDO** | #260 resolveu repetição imediata; retry/idempotência durável continuam | **Frente 3** |
| **R4 — semântica única de Pendências** | **PARCIAL / EXIGE DECISÃO** | transições estão corretas; data/idade divergem em contraexemplo real | **Frente 0D → Frente 4** |
| **R5 — save/remove NF remoto autoritativo/incremental** | **PENDENTE / REFORMULADO** | novo bug prova necessidade de preservar estados patrimoniais avançados | **Frente 0B → Frente 5** |
| **R6 — gate de equivalência** | **GATE FUTURO** | agora precisa incluir cross-view e cross-flow adversarial | **Frente 6** |
| **R7 — instrumentação causal** | **PENDENTE** | unchanged | **Frente 7A** |
| **R8 — otimizações medidas** | **CONDICIONAL** | unchanged | **Frente 7B** |
| **R9 — fechamento/rebaseline** | **GATE FUTURO** | fechamento exige “o que tentamos para provar que ainda estava errado?” | **Frente 8** |

## 4. O que os hotfixes já fizeram e não volta como tarefa autônoma

- `Incorreto + Pendência` atômicos;
- individualização fiscal/Assessoria por invoice;
- novo envio/substituição e reabertura do #254;
- próximo ator do #256;
- `encampInventario` do #257;
- vínculo visual NF ↔ bem do #258;
- sincronização patrimonial atômica e bloqueio de edição isolada do #260;
- guards de gesto repetido;
- jornadas reais de persistência/reload;
- 46 migrations da baseline funcional;
- redesign histórico de Pendências;
- documento autônomo Boleto Internet;
- deduplicação de NF por conteúdo;
- backfill heurístico dos `a_identificar` legítimos;
- hardening ADR-051 dentro da frente funcional atual.

Os novos achados não autorizam reabrir esses contratos sem evidência específica.

## 5. Auditoria semântica de continuidade × auditoria adversarial

A auditoria de continuidade de 05/09 reconstruiu corretamente a linha de decisões e corrigiu grande parte da documentação concorrente:

[`audits/2026-09-05-continuity-semantic-traceability-complete.md`](audits/2026-09-05-continuity-semantic-traceability-complete.md)

Ela permanece válida como **reconciliação histórica/semântica**, mas sua condição de “completa” não deve ser interpretada como prova de ausência de bugs desconhecidos.

A auditoria adversarial posterior encontrou problemas adicionais ao procurar contraexemplos, paths paralelos e combinações entre fluxos:

[`audits/2026-09-05-astra-adversarial-findings.md`](audits/2026-09-05-astra-adversarial-findings.md)

Principais efeitos no plano:

- **Frente 0B:** bug patrimonial `Inventariada → Encaminhada`;
- **Frente 0C:** bypass de auditoria pré-download no Excel SME;
- **Frente 0D:** decisão sobre idade total × espera do ator e política CSV × XLSX;
- Frontes 1–8 passam a usar método adversarial obrigatório;
- gates verdes deixam de ser critério suficiente de encerramento.

## 6. Achados documentais/testes a absorver

A auditoria adversarial também identificou:

- matriz apontando para migration/RPC superada;
- documento de competências anterior à exceção transversal de Pendências;
- documentação de exportação ainda descrevendo histórico multicompetência;
- títulos de testes ativos com regra revogada (`somente resolvida`);
- expectativa histórica de desativação de Controlador com transferência;
- teste que manipula `activeCompetenciaKey` diretamente;
- planos históricos de `a_identificar` ainda reutilizáveis fora de contexto;
- renderer legado de Pendências potencialmente executável por composição.

Esses itens são rastreados como documentação/teste/dívida arquitetural; não viram hotfix funcional automaticamente.

## 7. Regra para próximos PRs

Quando um novo PR funcional for integrado:

1. comparar seu efeito com `MASTER_PLAN_CURRENT.md`;
2. atualizar `CURRENT_STATE.md`;
3. registrar aqui se concluiu, reduziu, reformulou, substituiu ou não afetou uma frente;
4. atualizar `MASTER_PLAN_CURRENT.md`;
5. atualizar o ledger de achados adversariais correspondente;
6. atualizar documentos correntes diretamente afetados;
7. só depois retomar a fila planejada.

O plano deve acompanhar a decisão posterior aprovada. **Não reverter o produto para caber num plano histórico.**