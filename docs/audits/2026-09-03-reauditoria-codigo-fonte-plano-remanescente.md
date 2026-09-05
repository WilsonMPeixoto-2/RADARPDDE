# Reauditoria do código-fonte para o plano remanescente

> **EVIDÊNCIA DO CHECKPOINT DE 03/09.** Esta auditoria explica por que R1–R9 existiam naquele SHA, mas não define a fila pós-PR #260. Para estado corrente, leia [`../CURRENT_STATE.md`](../CURRENT_STATE.md) e [`../PLAN_TRACEABILITY.md`](../PLAN_TRACEABILITY.md).

**Data:** 3 de setembro de 2026  
**Classe documental:** Auditoria técnica corrente — evidência para planejamento  
**SHA de `main` reauditorado:** `18150cc9ef7e15e2e777041fce541b847af517e1`  
**Último SHA funcional dentro desse estado:** `75237c6ec5c22e8f7be9eb39fd21481f6d608010` (PR #249)  
**Vercel Production no momento da reauditoria:** `dpl_HVkoBtt9WkM97XJZN7hYzB1aL8Tw`, `READY`, SHA `18150cc9ef7e15e2e777041fce541b847af517e1`  
**Supabase Production:** `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, 44 migrations

## 1. Finalidade

Esta reauditoria foi executada diretamente sobre o código-fonte atual para responder a uma pergunta mais restrita do que a reconciliação documental anterior:

> **O que ainda precisa ser implementado hoje, considerando que hotfixes e evoluções posteriores já resolveram, especializaram ou substituíram partes do plano de 26/08?**

A resposta não foi derivada dos checkboxes do plano antigo. Foram reabertos os serviços, integrações, RPCs, state adapters, testes e loaders que materializam as frentes remanescentes.

O resultado desta auditoria é a base do novo plano em:

- `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md`.

## 2. Regra de precedência aplicada

A classificação usou:

```text
código-fonte do SHA atual
→ Supabase/Vercel efetivos
→ ADRs e decisões posteriores
→ testes atuais que representam o contrato vigente
→ documentação canônica
→ planos, auditorias e handoffs históricos
```

Quando uma solução posterior é mais avançada do que a prevista no plano antigo, a solução atual é preservada e o plano é reduzido. Não se refatora o produto para voltar ao desenho de agosto.

## 3. Conclusões executivas

### 3.1 Trabalho que saiu definitivamente da fila

Não há justificativa para reimplementar:

- G0;
- PR1;
- PR2;
- PR4 antigo de reparo da Consulta Assessoria;
- PR6B;
- PR7B;
- PR9B.

O PR4 antigo permanece especialmente proibido: o preflight de Production já demonstrou **0 estados legados não vazios inconsistentes** no universo sem NF de serviço; as 15 avaliações vazias/não iniciadas não podem ser convertidas artificialmente em avaliação técnica.

### 3.2 Trabalho ainda real, mas com desenho diferente

Continuam existindo lacunas em:

1. **autoridade de consistência ainda alojada em wrappers de performance**;
2. **readiness sistêmico e polling de instalação**;
3. **identificadores persistentes e idempotência durável do save de NF**;
4. **duplicidade semântica residual de Pendências**;
5. **convergência remota/autoritativa do save/remove normal de NF**;
6. **instrumentação causal do bootstrap**;
7. **otimização posterior somente por hipótese medida**.

A antiga PR7A deixa de ser uma entrega obrigatória de redesign. A superfície atual de Pendências já possui cobertura executável suficiente para que o trabalho remanescente seja um **gate de equivalência**, com código novo somente se uma regressão atual for provada.

## 4. Achado A — consistência crítica ainda depende de um wrapper chamado “performance”

O arquivo `src/integration/operational-write-performance.js` não contém apenas medição.

Ele ainda:

- define `RESULT_AUTHORITATIVE_COMMANDS`;
- define `COMMIT_AUTHORITATIVE_COMMANDS`;
- injeta `remoteResultIsAuthoritative` ou `remoteCommitIsAuthoritative`;
- injeta `incrementalStateEntities`;
- sanitiza `remoteRefreshExemptEntities`;
- envolve `DataService.execute()`;
- contém sincronização incremental de partes do Prontuário.

A reauditoria dos serviços confirmou que vários comandos **não declaram no próprio núcleo** a política que recebem desse decorator. Exemplos:

- `configuration:save-calendar`;
- `directory:save-program`;
- `directory:deactivate-program`;
- `school:assign-controller`;
- `school:bulk-assign-controller`;
- `pendency:register-attempt`;
- `pendency:reanalyze`;
- `pendency:register-contact`;
- `inventory:update-asset`;
- `inventory:forward`;
- `inventory:complete`;
- `inventory:create`;
- `invoice:update-service-advisory` recebe pelo wrapper a política de commit autoritativo e a aplicação incremental.

Mesmo comandos que já declaram resultado autoritativo no serviço, como verificações, ainda recebem do wrapper parte da política incremental.

Isso é incompatível com a intenção arquitetural atual: **a ausência de um módulo de performance não pode mudar semântica de persistência ou consistência**.

Há ainda uma dependência artificial em `prontuario-conditional-reconciler.js`: o instalador exige `RadarOperationalWritePerformance`, embora a lógica de reconciliação não utilize essa API como autoridade de negócio.

### Inventário efetivo confirmado antes da implementação

A leitura dos objetos reais enviados a `DataService.execute()` permite reduzir R1 sem criar um novo registry de políticas por nome.

Políticas hoje injetadas pelo wrapper e que devem passar a ser **declarações explícitas do próprio comando/serviço**:

- `remoteResultIsAuthoritative`: calendário; cadastro/desativação de programa; atribuição individual/em lote de Controlador; abertura, novo envio, cancelamento, reabertura e contato de Pendência; quatro operações de Inventário;
- `remoteCommitIsAuthoritative`: `school:save`, `pendency:reanalyze` e `invoice:update-service-advisory`;
- `incrementalStateEntities`: bonificação, análise técnica e consolidação em `VerificationService`, além de `invoice:update-service-advisory`;
- `remoteRefreshExemptEntities: ['administrativeLogs']`: `configuration:create-exercise`; `invoice:save` e `invoice:remove` já declaram essa exceção diretamente e não devem ser reescritos.

A regra global que permite isentar **somente** `administrativeLogs` de releitura não pertence a um serviço específico. Hoje ela é aplicada pelo wrapper de performance por `sanitizeRefreshExemptEntities()`. Ao retirar o wrapper, essa proteção deve migrar para o **DataService**, preservando o comportamento de ignorar isenções inseguras em vez de permitir que uma entidade mutável deixe de ser reconciliada.

A inspeção também mostrou que criar outro mapa central por nome de comando apenas mudaria o esconderijo da mesma autoridade. A solução preferida de R1 é, portanto:

1. política específica declarada no comando que a conhece;
2. invariantes globais de reconciliação aplicadas pelo DataService;
3. nenhuma tabela paralela de nomes em módulo opcional ou novo “registry de consistência”.

### Consolidação da reconciliação visual

`operational-write-performance.js` e `prontuario-conditional-reconciler.js` envolvem os mesmos cinco handlers em camadas sucessivas. O primeiro suprime `renderProntuario()` e sincroniza o programa; o segundo sincroniza ações condicionais e Pendências.

Criar um terceiro reconciliador seria aumentar a composição justamente quando o objetivo é reduzi-la. A solução preferida é **absorver a sincronização funcional hoje presente no módulo de performance em `prontuario-conditional-reconciler.js`**, mantendo um único wrapper funcional para esses handlers. O módulo de performance conserva apenas a correlação/medição da persistência. A instrumentação de aplicação/estabilidade pode ser chamada pelo reconciliador de forma fail-open, sem tornar diagnóstico uma dependência funcional.

### Decisão de planejamento

Antes de tornar performance/readiness opcional:

- declarar a política específica diretamente nos comandos/serviços atuais;
- mover a whitelist global de refresh exemption para o DataService;
- consolidar a reconciliação visual no `prontuario-conditional-reconciler.js`;
- retirar a dependência de instalação em `RadarOperationalWritePerformance`;
- deixar `operational-write-performance.js` somente com medição/tracing fail-open.



## 5. Achado B — readiness melhorou nos fluxos críticos, mas a inicialização sistêmica continua fragmentada

### Soluções atuais que devem ser preservadas

`product-extensions-bootstrap.js` já possui:

- ordem explícita de scripts;
- `atomic-analysis-pendency.js` carregado primeiro;
- `RadarProductExtensionsReady`;
- instalação crítica de Assessoria;
- espera pelo evento `radar:application-services-ready`.

`service-advisory-pendency.js` e `service-advisory-corrective-submission.js` já reagem ao evento de serviços e a ADR-052 protege a autoridade por operação.

Essa solução é mais avançada do que o polling cego original e **não deve ser substituída**.

### Lacunas atuais

O carregamento de extensões ainda usa uma cadeia sequencial de Promises. Uma falha de transporte em um script anterior interrompe a cadeia e pode impedir o carregamento de extensões independentes posteriores.

A busca atual encontrou `setInterval` em integrações como:

- `atomic-analysis-pendency.js`;
- `auth-gate.js`;
- `controller-session-context.js`;
- `cycle-b-carteira.js`;
- `cycle-b-dashboard.js`;
- `global-competence-selector.js`;
- `invoice-history-lock.js`;
- `modal-accessibility.js`;
- `navigation-context-bootstrap.js`;
- `navigation-history.js`;
- `operational-readiness-bridge.js`;
- `operational-write-performance.js`;
- `prontuario-conditional-reconciler.js`;
- `school-form-integrity.js`;
- `task-10-11-pendency-actions.js`;
- `task-10-alerts-competence.js`;
- `task-12-13-retificacoes.js`;
- `task-9-cross-view.js`;
- `task-9-focus-bridge.js`;
- `task-9-pendencias-page.js`.

Nem todo `setInterval`, `setTimeout` ou `MutationObserver` é defeito. O plano novo proíbe a remoção mecânica dessas APIs.

A classificação correta é:

- **readiness crítico**: ausência pode tornar gravação, autorização ou regra essencial insegura;
- **readiness restrito**: ausência desabilita uma superfície específica;
- **opcional/diagnóstico/estética**: ausência pode degradar sem corromper estado;
- **runtime legítimo**: observação de DOM, aviso temporário ou temporização que não declara prontidão.

### Casos que exigem cuidado especial

- `atomic-analysis-pendency.js` atualmente continua tentando instalar e **não desiste silenciosamente após 10 s**. A regressão existente protege exatamente esse comportamento. A migração só pode retirar o polling quando houver um sinal determinístico equivalente e fail-closed.
- `auth-gate.js` espera conjuntamente dados, autorização, competência e histórico de navegação antes de aplicar rota pendente.
- `task-9-pendencias-page.js`, cross-view e ações posteriores sustentam uma superfície operacional já aprovada.
- `invoice-history-lock.js` hoje é marcador de compatibilidade: a autoridade de bloqueio já está no `InvoiceService`. Seu polling pode sair depois de uma prova de que nenhum consumidor depende do marcador.
- `MutationObserver` usado para nós criados depois da instalação não é readiness e pode permanecer.

## 6. Achado C — IDs persistentes ainda possuem fallbacks fracos

O runtime principal já injeta `createPendencyClientId` em vários serviços e prefere `crypto.randomUUID()`.

Entretanto:

- o fallback de `createPendencyClientId` combina relógio e aleatoriedade não criptográfica;
- `DirectoryService` é criado antes de `transactionalDependencies` e ainda pode cair em `prefix-Date.now()`;
- `InvoiceService`, `InventoryService`, `PendencyService` e `VerificationService` ainda conservam fallbacks `prefix-Date.now()`;
- `src/domain/retificacoes.js` possui fallback `retificacao-${Date.now()}`;
- `task-12-13-retificacoes.js` possui gerador próprio baseado em `Date.now() + Math.random()`;
- há caminhos diretos em `app.js` que geram identificador/operação de contato/cobrança fora da autoridade compartilhada.

Ao mesmo tempo, outros usos de `Date.now()` pertencem a incidentes, importações, diagnóstico ou timestamps e **não devem ser alterados sem classificação**.

### Decisão de planejamento

Criar uma autoridade compartilhada para **IDs persistentes de negócio e chaves idempotentes**, usando `crypto.randomUUID()` ou `crypto.getRandomValues()`, com injeção de teste. Não transformar a fase em substituição indiscriminada de qualquer relógio do repositório.

## 7. Achado D — o guard de submit existe, a idempotência durável não

`RadarSharedInteractions.guardInvoiceSubmission()` já:

- bloqueia novo submit do mesmo formulário enquanto a Promise está pendente;
- desabilita controles;
- libera a trava no `finally`.

Isso resolve o duplo clique imediato e deve ser preservado.

Ele **não** cobre:

- resposta perdida depois de commit;
- retry posterior;
- duas abas;
- dois clientes enviando a mesma intenção;
- reuso estável da mesma chave após erro ambíguo.

O `InvoiceService.save()` também já possui no-op semântico e `invoice-effects.js` já calcula efeitos. Nenhum desses componentes deve ser refeito.

### Padrão já disponível no projeto

`pendency_contacts.operation_id` e a RPC correspondente já demonstram um contrato útil:

- operação identificada;
- repetição idêntica é tolerada;
- reuso incompatível gera conflito de idempotência.

O novo contrato de NF pode reutilizar **o padrão conceitual**, sem acoplar as duas tabelas.

## 8. Achado E — PR5 e PR8A antigos sobrepunham evolução de RPC

O save normal ainda chama:

- `public.save_invoice_with_effects`.

A RPC atual já retorna:

- `invoice`;
- `asset`;
- `deleted_asset_id`;
- `verification`.

Mas não retorna o `administrative_log` persistido.

A remoção atual devolve IDs removidos e verificação, também sem um resultado integral de log.

O plano antigo previa:

1. criar uma RPC v2 para idempotência em PR5;
2. depois criar/ampliar outra camada v2 para resultado autoritativo em PR8A.

Depois das evoluções atuais de `DataService` e `StatePort`, isso não é mais a melhor decomposição.

### Decisão de planejamento

A nova RPC v2 do **save** deve nascer uma única vez com:

- idempotência durável;
- resultado completo das linhas efetivamente persistidas;
- remoções confirmadas;
- versões/entidades necessárias à reconciliação.

Isso prepara a ativação autoritativa posterior sem uma segunda evolução redundante do mesmo contrato.

A remoção pode receber um wrapper v2 de resultado completo na mesma frente, mas **não ganha idempotência por chave sem RED que demonstre essa necessidade**.

## 9. Achado F — DataService/StatePort já adiantaram grande parte do antigo PR8

O código atual já possui:

- `remoteResultIsAuthoritative`;
- `remoteCommitIsAuthoritative`;
- `incrementalStateEntities`;
- `DataService.mergePersistedResult()`;
- `StatePort.applyEntities()`;
- testes de resultado/commit autoritativo e aplicação incremental.

Logo, o novo plano **não deve criar outra arquitetura genérica paralela de reconciliação**.

Lacunas reais:

- `mergePersistedResult()` ainda não interpreta `deleted_asset_id` / `deleted_invoice_id` como remoções autoritativas;
- o save/remove normal de NF não está ativado como resultado remoto integralmente autoritativo;
- o resultado v1 é incompleto para log;
- o caminho normal de salvar/remover NF ainda termina em renderização integral da tela;
- parte da sincronização funcional do DOM ainda vive em wrappers de performance/reconciliação.

### Decisão de planejamento

Primeiro tentar completar **os mecanismos já existentes**. Uma nova API genérica de patches por entidade ou um novo reconciliador só entra se um RED demonstrar que `applyEntities()` e as rotinas funcionais atuais não conseguem representar com segurança o caso requerido.

## 10. Achado G — Pendências ainda possui duplicidade semântica, mas a UI não precisa ser refeita

`operational-projection.js` já possui:

- `getOperationalBaseDate()`;
- `getConcreteNextAction()`;
- prioridade operacional;
- ordenação para projeções de Dashboard/Carteira.

`pendencias-view-model.js` mantém em paralelo:

- `NEXT_ACTIONS` próprio;
- cálculo próprio de `waitingSince`;
- cálculo próprio de idade;
- regras próprias de ordenação.

Há divergência concreta: para estado aberto, a projeção operacional pode considerar reabertura/retorno/reanálise incorreta como nova base operacional; o view-model ainda usa `dataAbertura`.

Isso é dívida real.

Ao mesmo tempo, a apresentação pode legitimamente usar:

- textos diferentes para o mesmo `actionCode`;
- ordenação específica dentro de uma aba;
- agrupamento por quatro situações.

### Decisão de planejamento

Unificar **semântica**, não apresentação:

- código da próxima ação;
- ator;
- data-base operacional;
- idade;
- prioridade/estado necessário para comparação.

Manter rótulos editoriais e hierarquia visual específicos de cada superfície quando não representam regra de negócio.

## 11. Achado H — a antiga PR7A vira gate, não redesign

A suíte atual já prova na tela de Pendências:

- quatro situações canônicas em abas acessíveis;
- busca;
- filtros;
- exportação XLSX respeitando filtros;
- drawer com erros, tentativas, contatos e timeline;
- restauração de foco;
- preservação de busca/aba/seleção/rolagem;
- navegação por teclado;
- cartões mobile e detalhe em tela inteira;
- competência global preservada e filtro local opcional.

Portanto, não há base para um pacote obrigatório de redesign.

Depois da unificação semântica, executar um gate focado. Se todos os requisitos atuais continuarem verdes e nenhum defeito for demonstrado, a entrega é **no-op documentado**.

## 12. Achado I — PR9B foi concluído, PR9A não

`lighthouserc.cjs` usa:

- 3 execuções;
- thresholds atuais preservados.

`scripts/run-lighthouse-baseline.mjs` usa mediana para gate e conserva relatórios individuais.

Logo, PR9B não volta.

Já a instrumentação causal de bootstrap não existe no runtime atual:

- não existe `bootstrap-performance-diagnostics.js`;
- não existem marcas `useful-interaction-ready`, `entity-fetch-start` ou equivalentes;
- `operational-write-diagnostics.js` mede **escritas operacionais**, não o startup.

Também já existem otimizações que não devem ser reimplementadas:

- validação de perfil/papel/escopos em paralelo;
- leituras remotas concorrentes com limite;
- bootstrap remoto restrito às entidades operacionais;
- CSS não crítico adiado;
- Lighthouse estatístico.

PR9A deve medir o que resta **depois** das fases funcionais, e PR9C só pode otimizar uma causa comprovada.

## 13. Mapeamento do plano antigo para o trabalho real

| Plano de 26/08 | Estado fonte atual | Tratamento no plano novo |
|---|---|---|
| G0 | concluído | fora da fila |
| PR1 | concluído | fora da fila |
| PR2 | concluído | fora da fila |
| PR3 | parcial | dividido entre R1 e R2 |
| PR4 | superado | proibido executar como escrito |
| PR5 | pendente, com partes já adiantadas | R3, absorvendo o contrato remoto v2 útil ao antigo PR8A |
| PR6 | parcial | R4 |
| PR6B | concluído | fora da fila |
| PR7A | superfície já entregue em essência | R6 vira gate sem diff obrigatório |
| PR7B | concluído | fora da fila |
| PR8 | muito adiantado em DataService/StatePort, incompleto no save/remove de NF | R1 + R3 + R5 |
| PR9A | pendente | R7 |
| PR9B | concluído | fora da fila |
| PR9C | pendente | R8 |
| ADR-051 | risco aceito/adiado | reavaliar somente após R9 |

## 14. Guardrails contra regressão confirmados novamente

O plano novo não pode alterar, salvo nova decisão expressa:

1. análise/Pendência fiscal individual por `registered_invoice_id`;
2. bonificação de Notas Fiscais agregada;
3. `a_identificar` novo = `Incorreto + Pendência`, sem backfill heurístico dos legados legítimos;
4. Consulta Assessoria individual por NF de serviço;
5. autoridades atuais de ADR-052 por operação;
6. Boleto Internet apenas como tipo de gasto de Notas Fiscais em Educação Conectada;
7. Declaração BB Ágil com N/A no contrato vigente;
8. Pendência, análise e bonificação como dimensões independentes;
9. Pendências transversais a competências;
10. detalhe de Pendência não muda competência global; ida ao Prontuário pode mudar explicitamente;
11. Production fail-closed;
12. render integral do Prontuário como fallback, não objetivo do caminho feliz;
13. comunicação externa sem o nome interno do sistema;
14. exportação XLSX e identidade visual aprovadas de Pendências;
15. PDDE Básico primeiro somente na apresentação;
16. Supabase CLI 2.116.0 rejeitado até nova homologação;
17. thresholds do Lighthouse não são relaxados para obter verde;
18. duas NFs de conteúdo igual continuam válidas quando representam intenções distintas;
19. ADR-051 continua adiada até o fechamento funcional.

## 15. Conclusão

A dívida remanescente é menor e mais específica do que o plano de 26/08 sugere.

O erro a evitar agora seria tratar o plano antigo como lista de construção. A abordagem correta é usar o código atual como baseline, consolidar autoridade onde ainda existe duplicação real, completar apenas os contratos incompletos e transformar antigas entregas de UI/infraestrutura já atendidas em gates de não regressão.
