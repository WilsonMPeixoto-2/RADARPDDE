# RADAR PDDE — Plano mestre vigente pós-hotfixes

**Atualizado em:** 4 de setembro de 2026  
**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**  
**Baseline documental:** `main` `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Baseline funcional:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Origem:** plano source-first do PR #253 reconciliado com #254, #256, #257, #258, #260 e #261.

> Leia primeiro [`../START_HERE.md`](../START_HERE.md). Se a `main` tiver avançado, reconcilie os PRs posteriores antes de executar este plano.

## 1. Objetivo

Concluir somente o trabalho técnico/funcional que continua real **depois** da estabilização do PR #260, preservando integralmente as decisões supervenientes dos hotfixes. Este plano substitui a fila R1–R9 de 03/09 como ordem de execução.

O objetivo não é “terminar o plano antigo”. É terminar o produto atual sem reintroduzir mecanismos ou regras que os hotfixes já substituíram.

## 2. Método obrigatório

Em cada frente:

1. confirmar que a `main` ainda corresponde à baseline documentada ou reconciliar o que mudou;
2. reabrir o código-fonte atual da premissa;
3. localizar consumidores e autoridades laterais;
4. congelar os guardrails posteriores listados em `CURRENT_STATE.md`;
5. reproduzir o problema atual com RED quando houver mudança de código;
6. implementar a menor mudança suficiente;
7. executar validação proporcional e jornadas reais afetadas;
8. atualizar `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md` no mesmo PR funcional;
9. atualizar este plano quando a entrega concluir, reformular ou substituir trabalho remanescente;
10. só então avançar.

**Proibido:** alterar uma regra atual apenas para satisfazer texto de plano/ADR/teste histórico.

## 3. Guardrails que prevalecem sobre o plano anterior

Antes de qualquer mudança nas superfícies correspondentes, preservar:

- novo envio/substituição e reabertura de Pendências conforme PR #254;
- próximo ator sincronizado por estado conforme PR #256;
- Consulta Assessoria individual por `registered_invoice_id`;
- `a_identificar` atômico e sem backfill heurístico;
- NF permanente + processo existente → bem `Encaminhada` / **Aguardando Inventariação**;
- NF permanente sem processo → bem `Não encaminhada`;
- `Não encaminhada` não pula para `Inventariada`;
- agregação `encampInventario` do PR #257;
- vínculo visual NF ↔ bem do PR #258;
- sincronização patrimonial atômica e bloqueio de edição isolada da NF do PR #260;
- guards de gesto repetido já instalados pelo PR #260;
- BB Ágil N/A, Boleto Internet como tipo de gasto, PDDE Básico primeiro apenas visualmente, comunicação externa sem nome interno e Production fail-closed;
- UI de Pendências, exportação XLSX e demais superfícies homologadas não entram em redesign por força de plano histórico.

A rastreabilidade completa está em [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md).

---

# Frente 1 — retirar autoridade funcional dos wrappers de performance

## Problema atual confirmado

No código da baseline:

- `src/integration/operational-write-performance.js` ainda injeta políticas de `remoteResultIsAuthoritative`, `remoteCommitIsAuthoritative`, `incrementalStateEntities` e refresh exemption;
- `src/integration/prontuario-conditional-reconciler.js` ainda exige `RadarOperationalWritePerformance` para instalar;
- portanto uma camada nominalmente de performance ainda participa da consistência funcional.

## Entrega

- mover políticas funcionais para serviços/DataService/StatePort adequados, preservando políticas já declaradas diretamente por serviços;
- mover/sanitizar a whitelist de refresh exemption para a camada de dados; somente entidades explicitamente seguras podem ser dispensadas de releitura;
- consolidar reconciliação funcional do Prontuário fora do módulo de performance, sem criar um terceiro reconciliador;
- deixar `operational-write-performance.js` como observador fail-open de medição/diagnóstico;
- provar que ausência do módulo de performance não muda persistência nem DOM funcional.

## Preservações adicionais pós-hotfix

A extração não pode romper:

- `critical-action-guard.js`;
- regras de novo envio/reanálise dos PRs #254/#256;
- projeção NF ↔ Inventário dos PRs #257/#258/#260;
- BB Ágil N/A e individualização fiscal/Assessoria.

## Gate

Mesmas escritas e mesmas projeções funcionais com módulo de performance presente e ausente; nenhuma política de consistência depende de monkey patch tardio.

---

# Frente 2 — readiness determinístico das capacidades

## Problema atual confirmado

A baseline ainda possui polling usado para instalação/readiness em diversas integrações e não possui registry sistêmico que represente `pending/ready/failed/degraded` por capacidade.

## Entrega

### 2A. Contrato mínimo e loader tolerante

- criar contrato mínimo de readiness com dependências e criticidade;
- preservar `RadarProductExtensionsReady` e `radar:application-services-ready` durante a migração;
- distinguir script carregado de capacidade instalada;
- permitir que falha opcional/restrita não interrompa capacidades independentes;
- manter fail-closed onde a ausência de capacidade crítica tornaria a operação insegura.

### 2B. Capacidades críticas

Migrar primeiro autenticação/dados/autorização/navegação necessária, proteção atômica `Incorreto + Pendência`, Pendências necessárias à operação segura e instaladores de Assessoria.

### 2C. Capacidades restritas/opcionais

Classificar polling restante e remover somente o que funciona como contrato de prontidão. `MutationObserver`, feedback visual, medição e outros timers legítimos não são dívida por definição.

## Preservação nova do PR #260

`critical-action-guard.js` e sua posição no bootstrap passam a fazer parte das capacidades funcionais que a migração deve preservar e provar instaladas.

## Gate

Nenhuma prontidão essencial escondida em polling arbitrário; falha induzida de módulo opcional não derruba operação independente; fluxo crítico continua protegido.

---

# Frente 3 — identidade segura e idempotência durável da NF normal

## O que já foi resolvido

O PR #260 protege repetição **imediata** enquanto uma operação crítica está em andamento. Não reimplementar esse guard.

## Dívida atual confirmada

- serviços ainda possuem fallbacks persistentes baseados em `Date.now()`;
- não existe `InvoiceSaveIntent` durável durante retry ambíguo;
- não existe storage server-side de idempotência para `invoice:save` normal;
- não existe `save_invoice_with_effects_v2` com operation key e resultado composto completo.

## Entrega

### 3A. IDs persistentes seguros

Criar autoridade compartilhada para IDs de negócio com `crypto.randomUUID()` preferencial, fallback criptográfico por `getRandomValues()` e falha explícita sem fonte segura. Inventariar cada uso antes de substituir; timestamps/IDs diagnósticos não entram automaticamente.

### 3B. Intenção de save

Quando o guard de NF aceita o gesto, congelar `operationKey`, payload normalizado, IDs, timestamp semântico e versões esperadas. Retry por resposta ambígua reutiliza a mesma intenção; novo gesto legítimo cria outra chave.

### 3C. Idempotência server-side

Mesma operation key + mesmo request + mesmo ator retorna o mesmo resultado; mesma chave com request diferente falha por conflito; duas chaves com conteúdo idêntico continuam podendo criar duas despesas legítimas.

### 3D. RPC v2 da NF normal

Criar uma única `save_invoice_with_effects_v2` com idempotência, optimistic concurrency e retorno das linhas efetivamente persistidas necessárias à reconciliação. Preservar v1 durante rollout.

As RPCs especializadas de novo envio/reanálise/Assessoria criadas ou endurecidas pelos hotfixes **não são substituídas por conveniência**.

## Gate

Retry ambíguo, concorrência com mesma chave, conflito de payload, isolamento por ator, rollback, RLS/grants e duas NFs iguais com chaves distintas.

---

# Frente 4 — projeção operacional única de Pendências

## O que os hotfixes já resolveram

Não mexer novamente, salvo defeito comprovado, em:

- estados/transições;
- substituição de envio em `Aguardando reanálise`;
- reabertura de `Resolvida`/`Cancelada`;
- `canceled_at` terminal;
- sincronização `responsavel`/`proximoAtor`.

## Dívida atual confirmada

`src/domain/pendencias-view-model.js` ainda calcula `NEXT_ACTIONS`, `waitingSince` e `ageDays`; `src/domain/operational-projection.js` possui cálculo próprio de data-base e próxima ação. Isso pode produzir divergência entre superfícies sem que o domínio de transição esteja errado.

## Entrega

Criar/explicitar um núcleo compartilhado de projeção que forneça, no mínimo:

- status normalizado;
- data-base operacional;
- idade;
- próximo ator;
- código semântico da próxima ação;
- prioridade quando realmente compartilhável.

A UI pode manter textos editoriais diferentes. Ordenações de apresentação podem permanecer diferentes quando deliberadas. Não redesenhar a tela de Pendências.

## Gate

Para a mesma Pendência, Dashboard/Carteira/Pendências/alertas devem concordar em data-base, idade, ator e ação semântica após abertura, novo envio, reanálise incorreta, resolução, cancelamento e reabertura.

---

# Frente 5 — save/remove normal de NF autoritativo e incremental

## Baseline que esta frente deve respeitar

Depois dos PRs #257/#258/#260, a NF normal não é apenas uma linha fiscal: ela pode produzir/remover/atualizar bem, alterar `encampInventario`, reabrir análise derivada e atualizar projeções no Prontuário. Qualquer convergência incremental precisa reproduzir **esse contrato atual inteiro**.

## Dívida atual confirmada

`invoice:save` e `invoice:remove` ainda usam o contrato remoto atual e não possuem a resposta v2 completa prevista na Frente 3 para fechar o caminho feliz sem refresh/render integral.

## Entrega

- usar a resposta v2 completa da Frente 3;
- normalizar remoções autoritativas de invoice/asset;
- aplicar invoice, asset upsert/remove, verification e log no StatePort sem releitura quando o retorno estiver completo;
- atualizar localmente lista fiscal, resumo técnico, vínculo patrimonial, Consulta Assessoria quando afetada e ações de consolidação;
- manter `renderProntuario()` integral como fallback degradado, não caminho normal;
- quando o commit estiver confirmado e a atualização local falhar, informar **salvo no servidor / atualização da tela pendente**, sem repetir escrita automaticamente.

## Gate

Criar/editar/remover e converter consumo ↔ permanente ↔ serviço, incluindo:

- permanente com processo já existente → `Encaminhada`;
- permanente sem processo → `Não encaminhada`;
- agregação `encampInventario` com múltiplos bens;
- remoção do último permanente → N/A;
- no-op;
- log;
- zero refresh das entidades cobertas no caminho feliz;
- fallback seguro quando retorno/aplicação estiver incompleto;
- jornadas reais de persistência/reload do PR #260 continuam verdes.

---

# Frente 6 — gate de equivalência das superfícies

Esta frente **não exige diff**.

Depois das Frentes 4 e 5, executar:

- unitários do view-model/projeção;
- cross-view e competência transversal;
- quatro abas, busca e filtros;
- drawer/timeline;
- novo envio/reanálise/substituição/reabertura;
- XLSX de Pendências;
- foco/teclado/mobile/acessibilidade;
- perfis funcionais;
- Prontuário fiscal/patrimonial e suas jornadas reais.

Se tudo passar e nenhuma divergência atual for encontrada, registrar a frente como concluída sem modificar o produto.

---

# Frente 7 — instrumentação causal e otimização condicionada

## 7A. Instrumentação

Depois do fechamento funcional anterior, medir localmente e de forma fail-open as fronteiras reais do startup, incluindo auth, sessão, cliente Supabase, grupos de leitura, normalização, StatePort, primeiro render, capacidades críticas e interação útil.

Regras: Performance API nativa; sem PII/token/payload; sem transmissão ou persistência externa; relatório reproduzível com mediana, pior caso e dispersão.

## 7B. Otimização somente se houver causa medida

Uma otimização entra apenas com fase dominante, mecanismo causal, baseline, ruído e orçamento definidos antes do código. Se nenhuma hipótese superar ruído/custo, esta etapa fecha sem diff.

Não relaxar thresholds. `web-vitals`/`Server-Timing` continuam condicionais a lacuna diagnóstica comprovada.

---

# Frente 8 — fechamento integral e novo rebaseline

No SHA final:

1. reconciliar `main`, Vercel e Supabase;
2. migrations/tipos;
3. unitários e integração;
4. pgTAP/RLS/Auth;
5. banco limpo;
6. backup/restauração;
7. Playwright completo e jornadas reais do PR #260;
8. perfis/viewports;
9. Excel;
10. CodeQL/dependências;
11. Lighthouse;
12. matriz funcional;
13. revisão adversarial;
14. documentação de continuidade.

A infraestrutura de gate já existente deve ser reutilizada. Não reconstruir o que o PR #260 já deixou funcionando.

A frente termina somente quando as Frentes 1–5 estiverem concluídas, a 6 estiver verde, a 7 estiver encerrada por evidência e não houver tarefa histórica ressuscitada.

## Depois do fechamento

ADR-051 permanece em frente separada. Não inseri-la como hardening oportunista neste plano.

---

## 4. Ordem executável

```text
Frente 1 — autoridade funcional fora de performance
→ Frente 2 — readiness determinístico
→ Frente 3 — IDs/intenção/idempotência NF normal
→ Frente 4 — projeção única de Pendências
→ Frente 5 — convergência autoritativa/incremental NF
→ Frente 6 — gate de equivalência
→ Frente 7A — instrumentação causal
→ Frente 7B — otimização somente se medida
→ Frente 8 — fechamento/rebaseline
```

Essa é a única fila vigente. As fases R1–R9 de 03/09 permanecem apenas como origem rastreável em `PLAN_TRACEABILITY.md`.
