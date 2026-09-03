# Reconciliação do plano mestre após os hotfixes de agosto/setembro

**Data:** 3 de setembro de 2026  
**Classe documental:** Canônico — reconciliação de retomada  
**Baseline de código:** `75237c6ec5c22e8f7be9eb39fd21481f6d608010` (PR #249)  
**Production Vercel:** `dpl_HfiKFNkTHc1f9ATZjgZ6Cn7CbWzz`, `READY`  
**Supabase Production:** `scnryinorqeucbfkioxo`, 44 migrations

## 1. Objetivo

Este documento reconcilia o plano mestre de 26/08 com o código, as migrations, os testes e as decisões incorporadas depois dele.

A regra de leitura é deliberadamente simples:

```text
código/Production/decisão vigente
> teste vigente
> documentação canônica
> plano histórico
```

O plano não deve ser executado literalmente quando uma entrega posterior já resolveu o problema por caminho melhor. Nesse caso, atualiza-se a tarefa do plano; não se restaura o desenho antigo.

## 2. Resultado executivo

O conjunto de hotfixes **adiantou uma parcela relevante do plano**, mas não concluiu tudo.

Classificação atual:

| Bloco do plano | Estado em 03/09 | Decisão |
|---|---|---|
| G0 / PR1 / PR2 | **Concluído** | Não reimplementar |
| PR3 — readiness/capacidades | **Parcial** | Preservar PR #222/ADR-052 e concluir apenas readiness remanescente |
| PR4 — reparo condicionado da Assessoria | **Pendente e ainda necessário** | Refazer preflight com dados atuais antes de qualquer migration |
| PR5 — IDs persistentes + idempotência real de NF | **Pendente** | Executar, revalidando o contrato atual de NF/Pendência |
| PR6 — semântica única da fila/ação | **Parcial** | Unificar sem substituir regras posteriores |
| PR6B — competência global × detalhe de Pendência | **Atendido funcionalmente** | Não criar segundo mecanismo |
| PR7A/PR7B — fila, filtros, hierarquia, mobile e acessibilidade | **Atendido em essência** | Não reimplementar; manter apenas lacunas de prova específicas se surgirem |
| PR8A/PR8B — resultado remoto autoritativo + reconciliação incremental | **Parcial** | Reduzir escopo ao contrato remoto/removal/degradação ainda ausente |
| PR9A — instrumentação causal de bootstrap | **Pendente** | Executar antes de novas otimizações estruturais |
| PR9B — metodologia estatística do Lighthouse | **Concluído antecipadamente no PR #239** | Não refazer nem alterar pisos |
| PR9C — otimização por hipótese medida | **Pendente** | Só após PR9A; partir do baseline atual |

A sequência futura original, portanto, **não deve mais ser lida como uma lista cega de PRs a criar**.

## 3. Entregas posteriores que passam a prevalecer sobre premissas antigas

### 3.1 Individualização fiscal e Consulta Assessoria

A ADR-050 e os PRs #211/#214/#215/#219/#221/#222 estabeleceram um contrato mais específico que o plano inicial:

- análise e Pendência fiscal por `registered_invoice_id`;
- Consulta Assessoria por NF de serviço;
- busca de Pendência individual deve preservar `registeredInvoiceId`;
- `a_identificar` novo nasce por fluxo atômico `Incorreto + Pendência`;
- `row_version` é metadado top-level e não volta para payload de negócio;
- abertura/reanálise da Assessoria pertence a `service-advisory-pendency.js`;
- novo envio corretivo pertence a `service-advisory-corrective-submission.js`;
- edição ordinária da Assessoria permanece em `InvoiceService.updateServiceAdvisory`;
- `RadarProductExtensionsReady` só pode considerar a cadeia crítica pronta depois da instalação real.

Qualquer tarefa do plano que pressuponha análise agregada compartilhada, lookup sem invoice, payload com `rowVersion` ou autoridade única diferente dessas divisões está **superada**.

### 3.2 Regra derivada da Consulta Assessoria

`src/domain/service-advisory.js` é a autoridade semântica atual:

- zero NF de serviço → `Não se aplica`, `sent=false`, análise `Correto`;
- existe NF de serviço e nenhuma foi enviada → `Não`;
- ao menos uma foi enviada → `Sim`;
- resumo técnico: `Incorreto > Não analisado > Correto (Atrasado) > Correto`.

O PR #225 transformou a projeção agregada em controle visual completo somente leitura. Não criar escrita agregada de volta.

### 3.3 Instalação de extensões críticas

O PR #222 resolveu o defeito de timeout de dez segundos **na cadeia crítica de Assessoria** com o evento `radar:application-services-ready` e instalação idempotente por instância real de serviço.

Essa solução deve ser preservada. O PR3 futuro não deve substituir esse mecanismo por polling genérico ou reintroduzir timeout arbitrário.

Ainda existem instaladores com polling/timeout de 10 s em módulos não migrados, entre eles:

- `operational-readiness-bridge.js`;
- `task-9-cross-view.js`;
- `operational-write-performance.js`;
- `prontuario-conditional-reconciler.js`.

Por isso PR3 está **parcial**, não concluído.

### 3.4 Pendências transversais e competência

A fila de Pendências é deliberadamente transversal:

- a competência global permanece contexto da aplicação;
- entrar em Pendências não filtra automaticamente a fila;
- filtros locais podem recortar por competência;
- abrir somente o detalhe da Pendência não deve mudar a competência global;
- a mudança explícita ocorre ao abrir a Pendência no Prontuário.

`operational-readiness-bridge.js`, `task-9-pendencias-page.js` e `pendency-cross-competence.spec.js` já implementam/protegem esse comportamento.

O PR6B antigo está, portanto, atendido funcionalmente. Não deve ser refeito com um segundo seletor ou novo contexto concorrente.

### 3.5 Fila operacional de Pendências

O produto atual já possui:

- quatro situações canônicas;
- busca;
- filtros por escola, competência, programa, documento, erro, responsável, controlador e antiguidade;
- ordenação temporal por situação;
- chips de filtros;
- detalhe/drawer;
- tentativas, contatos e timeline;
- restauração de foco;
- navegação por teclado das abas;
- cards mobile e detalhe em tela inteira;
- preservação de contexto no retorno do Prontuário;
- exportação XLSX editorial conforme busca/filtros (`EXP-03`).

Isso absorve a maior parte de PR7A/PR7B. Os nomes de arquivos previstos em 26/08 não devem ser usados como critério para recriar uma solução que já existe.

### 3.6 Declaração BB Ágil

O PR #241 definiu regra posterior ao plano:

- BB Ágil aceita `N/A`;
- N/A é válido para consolidação;
- análise fica neutra em `Correto`;
- seletor técnico fica bloqueado enquanto N/A;
- sair de N/A reabre análise em `Não analisado`;
- Pendência ativa impede neutralização por N/A.

Essa decisão é vigente e não pode ser atingida por refatoração futura de análise/consolidação.

### 3.7 Comunicação externa

ADR-053:

- `RADAR PDDE` é nome interno;
- não aparece em texto oficial gerado para escola;
- cobrança termina somente em `Atenciosamente`.

Refatorações de Pendências/cobrança devem preservar isso.

### 3.8 Apresentação do Prontuário

O PR #249 estabelece apenas apresentação:

- `PDDE Básico` aparece primeiro na avaliação;
- `programasIds` não é reordenado nem persistido por causa disso;
- os demais programas mantêm sua ordem relativa.

Não transformar essa preferência visual em regra de dados ou negócio.

## 4. Reconciliação detalhada do plano mestre

### PR3 — Readiness e capacidades

**Já feito:**

- autoridade/composição crítica formalizada pela ADR-052;
- `critical-product-extension-authority.test.js`;
- E2E real da instalação crítica;
- PR #222 eliminou polling limitado na cadeia de Assessoria e passou a aguardar a instância real de serviços;
- PR #221 canonizou contexto de lookup de Pendências críticas.

**Ainda falta:**

- inventariar os instaladores restantes que dependem de polling/timeout;
- substituir apenas os que possam falhar silenciosamente por readiness/eventos determinísticos;
- avaliar se um registry genérico `capability-readiness.js` ainda agrega valor. Ele não é objetivo por si só;
- distinguir capacidade crítica de extensão opcional/degradável.

**Mudança no plano:** o registry previsto passa de “arquivo obrigatório” para “opção arquitetural condicionada”. A obrigação real é eliminar readiness frágil sem substituir a solução determinística do PR #222.

### PR4 — reparo condicionado da Consulta Assessoria

**Estado:** genuinamente pendente.

Leitura read-only de Production em 03/09 encontrou:

- 158 verificações sem NF de serviço;
- 15 contextos com projeção mensal divergente da regra canônica atual;
- 14 com `consAssessoria=''`, `consEnviada=null`, análise `Não analisado`;
- 1 com `consAssessoria=''`, `consEnviada=false`, análise `Não analisado`;
- 0 desses 15 com Pendência ativa de `consAssessoria`.

O dado reforça o propósito do PR4, mas **não autoriza migration automática**.

A execução futura deve:

1. gerar novo preflight a partir da Production atual;
2. classificar cada candidato pelo contrato atual;
3. falhar fechado em ambiguidade;
4. aplicar, se ainda necessário, somente a projeção derivada `N/A / false / Correto`;
5. preservar histórico e não fabricar NF/Pendência.

Os números antigos do plano ficam históricos e não podem ser usados como lista fixa.

### PR5 — idempotência e IDs persistentes

**Estado:** genuinamente pendente.

Ausências verificadas no código:

- não existe `src/application/client-id.js`;
- não existe `src/domain/invoice-save-intent.js`;
- não existe `save_invoice_with_effects_v2`;
- não existe contrato `IDEMPOTENCY_KEY_REUSED` no runtime;
- `InvoiceService.createPersistence('save')` continua chamando `repository.saveInvoiceWithEffects(...)` sem chave de intenção;
- `DirectoryService`, `InvoiceService`, `PendencyService`, `InventoryService` e `VerificationService` ainda possuem fallback `prefix-Date.now()`.

**Preservar ao implementar:**

- notas novas com conteúdo igual continuam intenções legítimas diferentes;
- não deduplicar por número/valor/descrição;
- `a_identificar` continua atômico com Pendência;
- identidade `registered_invoice_id` e histórico individual não podem ser recriados;
- ADR-051 não deve ser misturada automaticamente nesta frente.

### PR6 — projeção e semântica da fila

**Estado:** parcial.

`operational-projection.js` já possui `getConcreteNextAction()`, ator, prioridade e ordenação. Porém `pendencias-view-model.js` mantém uma segunda tabela `NEXT_ACTIONS` e calcula de forma própria ação/idade/ordenação.

Essa duplicação é exatamente o tipo de divergência que o plano buscava remover.

**Ainda falta:**

- escolher uma única autoridade semântica para ator/ação/prioridade/antiguidade;
- fazer fila, Dashboard/Carteira e alertas consumirem a mesma projeção;
- manter o texto e as ações vigentes das jornadas individualizadas;
- evitar criar modelos artificiais apenas para reproduzir nomes de arquivos do plano.

### PR6B — preservação de competência

**Estado:** atendido funcionalmente.

O comportamento está implementado e coberto por testes transversais atuais. Não criar novo mecanismo concorrente. Se em futura alteração desta área surgir risco, acrescentar apenas uma regressão explícita de que abrir o drawer não muda `RadarCompetenceContext.activeKey`.

### PR7A/PR7B — produto da fila

**Estado:** atendido em essência.

Os hotfixes e evoluções de Task 9, especialmente PRs #235/#237/#247, entregaram o produto previsto e foram além dele.

Não criar `pendency-queue-model.js`/novas telas apenas porque constavam do plano. A única dívida associada permanece a **unificação semântica de PR6**, não a reconstrução visual da fila.

### PR8A/PR8B — resultado autoritativo e reconciliação

**Estado:** parcial.

Já existe:

- `StatePort.applyEntities()`;
- `DataService` com `remoteResultIsAuthoritative`, `remoteCommitIsAuthoritative`, aplicação incremental e fallback de refresh;
- política de comandos autoritativos em `operational-write-performance.js`;
- reconciliador condicional do Prontuário;
- supressão de alguns rerenders integrais após escrita.

Ainda não existe o contrato completo que o plano chamou de `invoice_authoritative_result_v2`, nem os testes/estrutura de remoção autoritativa previstos. A RPC principal de NF continua no contrato anterior.

**Escopo remanescente correto:**

- resultado remoto explícito para inclusão/edição/remoção de NF e efeitos patrimoniais;
- remoções representadas sem depender de inferência do snapshot local;
- estado degradado quando persistência confirmou mas aplicação local falhou;
- releitura mínima somente quando o resultado não for suficiente.

Não reimplementar `StatePort` nem voltar ao `renderProntuario()` integral como padrão.

### PR9A — instrumentação causal

**Estado:** pendente.

Os arquivos/evidências causais previstos não existem no baseline atual. Antes de nova rodada de otimização estrutural, medir custo real de bootstrap autenticado e identificar causa material.

### PR9B — metodologia Lighthouse

**Estado:** concluído antecipadamente.

O PR #239 alterou a auditoria para três execuções e mediana, preservando os mesmos pisos. Esta etapa não deve ser executada novamente como se estivesse pendente.

As oscilações recentes confirmam por que a metodologia foi necessária; elas não autorizam elevar limites.

### PR9C — otimização

**Estado:** pendente e condicionado a PR9A.

O produto recebeu otimizações incrementais, mas o bloco de otimização causal do plano continua sem baseline próprio. Quando retomado, deve comparar o código atual, não a aplicação de 26/08.

## 5. Reconciliação do plano de estabilização de 31/08

O plano `2026-08-31-estabilizacao-arquitetural-jornadas-criticas.md` também precisa ser lido à luz do código atual:

| Fase | Estado | Evidência |
|---|---|---|
| A — contexto canônico | **Concluída** | PR #221, `buildPendencyLookupContext()` |
| B — API por jornada | **Parcial** | serviços/RPCs individuais existem; UI ainda contém orquestração própria |
| C — retirar preflights de negócio do app.js | **Parcial** | lookup canônico é usado, mas `app.js` ainda decide preflight/estado em várias jornadas |
| D — reduzir wrappers | **Pendente** | cadeias de wrappers continuam e alguns ainda instalam por polling |
| E — composição por jornada | **Parcial/avançada** | muita cobertura E2E/pgTAP existe, mas matriz mantém operações P0 parciais por falta de algumas provas publicadas |
| F — fixture permanente de homologação | **Pendente** | não há fixture permanente dedicada equivalente |
| G — gate de fechamento | **Parcial** | governança/matriz existem; algumas operações continuam marcadas como parciais |

Esse plano **não é concorrente** ao plano mestre. Ele funciona como critério arquitetural para executar os remanescentes PR3/PR5/PR6/PR8.

## 6. Pendências reais após a reconciliação

A retomada correta fica reduzida a:

1. **PR3-R** — readiness remanescente: remover dependências frágeis de polling/timeout sem desfazer o PR #222;
2. **PR4-R** — novo preflight e, se confirmado, reparo fail-closed dos 15 contextos atualmente divergentes de Assessoria;
3. **PR5-R** — IDs persistentes seguros + idempotência server-side de intenção de NF;
4. **PR6-R** — autoridade semântica única de próxima ação/ator/prioridade/antiguidade;
5. **PR8-R** — completar resultado remoto autoritativo e reconciliação de remoções/degradação;
6. **PR9A-R** — medir bootstrap autenticado;
7. **PR9C-R** — otimizar somente hipóteses comprovadas pela medição;
8. **ADR-051** — permanece adiada conforme decisão vigente e não entra automaticamente nos itens acima.

PR6B, PR7A, PR7B e PR9B saem da fila de implementação porque seus objetivos já estão atendidos no produto atual.

## 7. Gates contra regressão do passado

Antes de qualquer PR remanescente, conferir explicitamente que a mudança **não**:

- remove `registered_invoice_id` da identidade de Pendências fiscais/Assessoria;
- reintroduz escrita agregada de análise da Assessoria;
- reintroduz `rowVersion` em payload de negócio;
- troca instalação determinística da cadeia crítica por timeout;
- resolve Pendência automaticamente ao registrar novo envio;
- cria `a_identificar` sem Pendência;
- reintroduz Boleto de Internet como documento avulso;
- retira N/A da Declaração BB Ágil;
- coloca `RADAR PDDE` em comunicação oficial externa;
- filtra a fila de Pendências pela competência global sem ação explícita do usuário;
- transforma PDDE Básico-primeiro em ordenação persistente;
- remove o XLSX de Pendências ou seus filtros;
- altera pisos do Lighthouse para “fazer passar”.

## 8. Próxima ordem de execução

A ordem de retomada recomendada é:

```text
PR3-R
→ PR4-R
→ PR5-R
→ PR6-R
→ PR8-R
→ PR9A-R
→ PR9C-R
→ reavaliar ADR-051
→ fechamento integral
```

PRs podem ser subdivididos quando o risco exigir, mas não devem recriar entregas já homologadas.

## 9. Documentos que este handoff torna superados como “próxima sequência”

Os documentos históricos continuam preservados, porém suas listas de próximos passos não são mais executáveis sem esta reconciliação:

- `handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`;
- `handoff/2026-08-30-pr215-fechamento-tecnico.md`;
- `handoff/2026-08-31-pr237-fechamento-visual-e-ci.md`;
- seções antigas de “próxima sequência” do próprio plano mestre.

Eles permanecem válidos como história e evidência do estado em que foram escritos.

## 10. Conclusão

Os hotfixes não foram um desvio perdido. Eles eliminaram defeitos que o plano pretendia atacar e, em alguns pontos, encontraram soluções melhores e mais específicas.

Ainda há trabalho real, principalmente readiness remanescente, reparo condicionado de Assessoria, idempotência/IDs, unificação semântica, contrato remoto autoritativo e instrumentação causal. O restante deve ser tratado como **já entregue ou superado**, não como uma obrigação de reproduzir a arquitetura imaginada em 26/08.
