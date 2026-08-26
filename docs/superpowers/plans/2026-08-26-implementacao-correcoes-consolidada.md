# RADAR PDDE 2026 — Plano completo de implementação das correções

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar este plano tarefa por tarefa. Cada entrega usa branch/worktree isolada, TDD quando aplicável, revisão adversarial e gate próprio.

**Goal:** Executar, em ordem segura e verificável, todas as correções funcionais remanescentes consolidadas após o PR #199, as auditorias independentes e o hotfix PR #200, reduzindo duplicidade, inconsistência semântica, fragilidade de inicialização, problemas operacionais de Pendências, reconciliação local e lentidão mensurável sem misturar modernização geral de stack ou temas expressamente excluídos.

**Architecture:** O trabalho é dividido em entregas independentes e cumulativas. Primeiro congela-se o baseline e contém-se o incidente de submit repetido; depois centralizam-se regras derivadas e readiness; somente então reparam-se dados, adiciona-se idempotência de servidor, unifica-se o contrato de Pendências, corrige-se a navegação transversal, redesenha-se a superfície operacional, completa-se a escrita autoritativa e, por último, mede-se e otimiza-se o bootstrap. Cada PR deve deixar o sistema funcional por si só e não pode depender de monkey patches ou extensões opcionais para garantir invariantes centrais.

**Tech Stack:** JavaScript UMD/browser, Node.js 24, `node:test`, Playwright, Supabase/PostgreSQL/RPC, pgTAP/database tests, AJV já existente, Vercel, CSS responsivo, Performance API, Lighthouse e GitHub Actions.

**Spec:** `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-consolidado.md`

**Baseline de referência ao escrever este plano:** `main` em `0965ba8d5749f2ed25b3563a65ebc5da413e7fa5`, merge do PR #200. Esse SHA deve ser revalidado antes de qualquer execução.

---

## 0. Decisões vinculantes e limites de escopo

Estas decisões já foram deliberadas e **não devem ser reabertas durante a execução** sem nova instrução explícita do responsável pelo produto.

### 0.1 Fora do trabalho

- PR #195 permanece integralmente fora desta frente.
- O item anteriormente classificado como **P20 — autoridade de regra mais forte no frontend do que no servidor** está excluído desta sequência.
- Qualquer frente sobre **proteção contra senhas vazadas / leaked-password protection** está excluída.
- Não realizar auditoria genérica de segurança como subproduto desta execução.
- A frente visual ampla VIS-01 a VIS-07 permanece separada. Somente as alterações visuais estritamente necessárias às correções de Pendências e feedback de escrita entram aqui.
- Não iniciar modernização geral de stack, migração de framework, TypeScript abrangente ou substituição arquitetural de UMD/globals nesta frente.

### 0.2 Novas dependências

A regra é **não instalar nova dependência por padrão**.

Nova ferramenta só poderá ser proposta se:

1. existir lacuna concreta não atendida pela stack atual;
2. a necessidade for demonstrada durante a implementação;
3. forem comparadas alternativas sem dependência nova;
4. benefício, risco, custo de manutenção e impacto de bundle forem explicitados antes da adoção.

Decisões já tomadas:

- **não instalar Zod**; usar domínio canônico + AJV existente;
- **não instalar biblioteca de readiness**; usar Promise/eventos nativos;
- `web-vitals` somente poderá ser avaliado depois da instrumentação nativa de PERF-BOOT e se houver necessidade comprovada de RUM;
- `Server-Timing` não entra por padrão e só poderá ser considerado se medições mostrarem gargalo material no servidor/RPC.

### 0.3 IDs

O runtime atual já injeta `createPendencyClientId`, baseado em `crypto.randomUUID()` com fallback, em `InvoiceService`, `PendencyService` e `InventoryService` por `transactionalDependencies`.

Portanto:

- colisão por `Date.now()` **não é a causa atual da duplicidade de despesas**;
- os fallbacks internos `prefix-Date.now()` continuam sendo dívida de consistência;
- a eliminação desses fallbacks entra no **PR5**, junto da intenção estável/idempotência, para evitar duas soluções concorrentes de geração de identidade.

### 0.4 Regras de negócio invariáveis

- Pendências permanecem visíveis independentemente da competência global.
- Pendência, análise técnica e bonificação são dimensões distintas.
- `Sim + Incorreto + pendência` continua sendo combinação válida.
- Novo envio continua conduzindo à reanálise.
- Despesa `A identificar` não vira automaticamente `Não` ou `Incorreto`.
- Pendência ativa, isoladamente, não bloqueia consolidação.
- `Não analisado`, isoladamente, não bloqueia consolidação.
- Consulta Assessoria sem NF de serviço converge para `Não se aplica` pela regra canônica.
- NF não será deduplicada por conteúdo.
- Contato permanece ação de Pendência ativa, salvo regra de negócio futura expressamente aprovada.
- Reabertura continua válida para `Resolvida` e `Cancelada` conforme contrato vigente.

---

## 1. Metodologia obrigatória de execução

Cada PR segue o mesmo ciclo. Não pular etapas porque o diff parece pequeno; software tem talento particular para punir esse tipo de otimismo.

### 1.1 Revalidar premissa

Antes de tocar no código:

```bash
git fetch origin
git rev-parse origin/main
git status --short --branch
```

Registrar:

- SHA da `main`;
- deployment Production correspondente;
- estado do Supabase Production quando a tarefa depender de dados/RPC;
- se o defeito ainda é reproduzível no SHA atual.

Se o problema tiver desaparecido por mudança posterior, **parar e reclassificar**. Não implementar correção para fantasma histórico.

### 1.2 Branch/worktree isolada

Cada entrega nasce da `main` vigente, nunca da branch do PR anterior ainda não integrado.

Padrão de nome:

```text
fix/pr1-invoice-submit-guard
fix/pr2-service-advisory-noop
fix/pr3-readiness-events
fix/pr4-service-advisory-data-repair
fix/pr5-invoice-idempotency
fix/pr6-pendency-contract
fix/pr6b-pendency-navigation-context
feat/pr7a-pendency-queue
feat/pr7b-pendency-detail-a11y
fix/pr8-authoritative-invoice-state
perf/pr9-bootstrap-measurement
```

### 1.3 TDD/regressão

Quando o defeito for reproduzível automaticamente:

1. escrever teste que falha;
2. executar e registrar o RED;
3. implementar a menor correção;
4. executar o teste até GREEN;
5. executar regressões adjacentes.

Para migration:

1. criar fixture de estado problemático;
2. provar falha/estado inconsistente;
3. aplicar migration em stack descartável;
4. provar pós-condição e rerun.

### 1.4 Revisão adversarial

Antes de considerar PR pronto, perguntar como a solução pode falhar. Verificar conforme a frente:

- duplo clique;
- Enter + clique;
- duas abas;
- dois navegadores;
- retry;
- resposta perdida depois do commit;
- latência elevada;
- erro de dependência;
- perfil diferente;
- mobile;
- estado remoto/local divergente;
- migration executada novamente;
- drift entre preflight e update.

### 1.5 Gate por PR

Todo PR deve ter:

- revisão do diff completo;
- testes focados;
- testes unitários/integrados adjacentes;
- Playwright quando houver jornada de UI;
- Supabase local/pgTAP quando houver SQL/RPC;
- `npm run check` e gates de arquitetura pertinentes;
- Preview Vercel quando houver frontend;
- registro de rollback.

### 1.6 Merge e Production

O plano **não autoriza automaticamente merge ou escrita em Production**.

Para cada PR:

1. concluir branch e validações;
2. abrir PR;
3. verificar CI/Preview;
4. apresentar resultado;
5. obter autorização de merge quando exigida;
6. após merge, confirmar SHA da `main`;
7. confirmar deployment Production;
8. executar smoke não destrutivo;
9. somente então considerar a entrega concluída.

PR com migration/reparo de dados exige autorização explícita antes de escrita em Production.

---

## 2. Estado já concluído — H0 / PR #200

**Não reimplementar.**

O PR #200 já:

- moveu `Incorreto + pendência` para `PendencyService.open()` como operação atômica;
- preservou `PENDENCY_REQUIRED` como barreira contra `Incorreto` isolado;
- fez a integração de UI delegar ao núcleo;
- removeu a desistência aos 10 segundos;
- antecipou `atomic-analysis-pendency.js` antes das extensões opcionais;
- adicionou regressão E2E com falha induzida de extensão posterior.

O PR3 deverá **integrar esse fluxo ao novo registry de readiness**, não desfazer o comportamento já corrigido.

---

## 3. Ordem cronológica obrigatória

```text
H0 / PR200 ✅
   ↓
G0 — baseline e gates
   ↓
PR1 — submit repetido + refresh mínimo
   ↓
PR2 — Assessoria canônica + AJV + no-op
   ↓
PR3 — readiness Promise/event-driven
   ↓
PR4 — reparo condicionado dos dados
   ↓
PR5 — idempotência + intent estável + IDs
   ↓
PR6 — semântica única das Pendências
   ↓
PR6B — competência global / navegação transversal
   ↓
PR7A — fila operacional
   ↓
PR7B — detalhe, reanálise, mobile, a11y
   ↓
PR8 — resultado remoto autoritativo + reconciliação local
   ↓
PR9 / PERF-BOOT — medir e otimizar
   ↓
H1 restrito — CI/governança ainda necessária
```

**Nota:** PR4 depende tecnicamente apenas do PR2 já publicado. Mesmo assim, a ordem operacional adotada é PR3 → PR4 para evitar reparo de dados enquanto a camada de inicialização ainda está sendo alterada e para manter uma sequência linear fácil de auditar.

---

## 4. Mapa de responsabilidades após a execução

| Arquivo/módulo | Responsabilidade final |
|---|---|
| `app.js` | composição de UI e guards de gesto; não decide regra canônica de Assessoria |
| `src/domain/service-advisory.js` | valores permitidos e agregação canônica da Consulta Assessoria |
| `src/domain/invoice-effects.js` | plano puro de efeitos persistentes e decisão de no-op |
| `src/domain/json-contracts.js` | contratos AJV de borda sem introduzir Zod |
| `src/application/invoice-service.js` | orquestra efeitos, persistência, intent e retorno |
| `src/application/verification-service.js` | transições de avaliação consumindo regra compartilhada |
| `src/integration/product-extension-readiness.js` | registry Promise/event-driven de capacidades |
| `src/integration/product-extensions-bootstrap.js` | carregamento com falhas isoladas; não define semântica de negócio |
| `src/domain/operational-projection.js` | fonte canônica de etapa, idade, ator, ação e prioridade das Pendências |
| `src/domain/pendency-queue-model.js` | filtros, ordenação, aba inicial e agrupamento sem duplicar semântica |
| `src/domain/pendency-action-model.js` | matriz de ações por estado/capacidade |
| `src/domain/pendencias-view-model.js` | projeção para UI consumindo domínio canônico |
| `src/integration/task-9-pendencias-page.js` | renderização e interação da fila |
| `src/integration/task-10-11-pendency-actions.js` | execução das ações autorizadas pelo action model |
| `src/integration/global-search.js` | navegação por resultado sem alterar competência para detalhe transversal |
| `src/application/state-port.js` | aplicação incremental explícita, inclusive remoções |
| `src/application/data-service.js` | coordena persistência, resultado remoto e estado degradado |
| `src/data/supabase-repository.js` | RPC versionada, intent/idempotência e normalização do resultado remoto |
| `src/integration/operational-write-diagnostics.js` | métricas de escrita; fail-open |
| novo módulo de bootstrap diagnostics | marcas de performance da inicialização; sem dados de negócio |
| `supabase/migrations/` | reparo condicionado, idempotência e contrato de resposta em migrations separadas |

---

# Task 0 — G0: congelar baseline e preparar gates

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Create: `docs/evidence/2026-08-26-correcoes-consolidadas-baseline.md`
- Reference: `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-consolidado.md`
- Reference: este plano

**Produces:** baseline reproduzível para PR1; nenhuma alteração funcional.

- [ ] **Step 1: confirmar SHA e deployment**

Registrar `origin/main`, SHA Production e URL pública. Se a `main` não for mais `0965ba8...`, comparar commits posteriores e atualizar o baseline documental antes de continuar.

- [ ] **Step 2: registrar estado read-only de Production**

Capturar, sem escrever:

```text
verifications total
registered_invoices total
administrative_logs total
pendencies por status
candidatos atuais a Assessoria vazia sem NF de serviço
```

Não assumir que o conjunto histórico de quatro registros continua igual.

- [ ] **Step 3: capturar baseline do fluxo de NF**

Medir/reproduzir em Preview/local autenticado:

```text
clique simples → número de RPCs
duplo clique → número de RPCs
Enter + clique → número de RPCs
RPC → refresh de entidades
tempo clique → feedback
tempo clique → estado estável
```

- [ ] **Step 4: executar baseline de testes**

```bash
npm run check
npm run test:unit
npm run test:integration
npm run check:functional-matrix
```

Para Supabase, quando o ambiente descartável estiver disponível:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Registrar comandos e resultados; não registrar apenas contagem de testes.

- [ ] **Step 5: governança**

Verificar branch protection/ruleset. Se ainda não houver enforcement, registrar no baseline que nenhum PR desta sequência será mergeado com gate funcional relevante vermelho.

- [ ] **Step 6: commit documental**

```bash
git add docs/CURRENT_STAGE.md docs/evidence/2026-08-26-correcoes-consolidadas-baseline.md
git commit -m "docs: congelar baseline das correcoes consolidadas"
```

**Gate de saída:** baseline registrado, nenhuma escrita em Production, nenhum defeito novo classificado como bloqueador não resolvido.

---

# Task 1 — PR1: conter submit repetido e tornar refresh mínimo parte do núcleo

**Files:**
- Modify: `app.js` — função `salvarDadosNota`
- Modify: `src/application/invoice-service.js`
- Create: `tests/unit/invoice-submit-guard.test.js`
- Modify/Create: `tests/unit/operational-write-refresh-policy.test.js`
- Create/Modify: `tests/e2e/prontuario-invoice-submit.spec.js`

**Consumes:** `radarInvoiceService.save(input)`, `DataService.execute()` e `remoteRefreshExemptEntities`.

**Produces:** um gesto em andamento gera uma chamada; `invoice:save`/`invoice:remove` não dependem da extensão de performance para evitar releitura integral de `administrativeLogs`.

- [ ] **Step 1: escrever RED de duplo gesto**

No E2E, atrasar a RPC e testar separadamente:

```text
duplo clique
Enter + clique
clique enquanto botão já está busy
```

Assert principal: contador de chamadas RPC permanece `1`.

- [ ] **Step 2: confirmar RED no baseline**

```bash
npx playwright test tests/e2e/prontuario-invoice-submit.spec.js --project=chromium
```

Esperado antes da correção: cenário repetido alcança o serviço mais de uma vez.

- [ ] **Step 3: implementar guard síncrono antes do primeiro `await`**

A trava deve ser **local à intenção/formulário**, não uma variável que impeça operações independentes em outras superfícies.

Contrato de UI:

```text
primeiro submit → marca busy imediatamente
segundo submit da mesma intenção → retorna false sem chamar serviço
finally → restaura UI
```

Botão:

```text
disabled=true
aria-busy=true
texto="Salvando…"
```

- [ ] **Step 4: preservar erros e reentrada legítima**

Se a primeira chamada falhar:

- botão volta a habilitar;
- `aria-busy` é removido;
- usuário pode corrigir dados e tentar novamente;
- nenhuma trava fica presa após exceção.

- [ ] **Step 5: mover política de refresh para `InvoiceService`**

Nos comandos de `save` e `remove`, declarar `administrativeLogs` como entidade dispensada de refetch quando o caminho de persistência já fornece/produz o log necessário.

Não remover `administrativeLogs` de `changedEntities`; apenas impedir releitura integral desnecessária.

- [ ] **Step 6: testar sem `operational-write-performance.js`**

O teste unitário deve construir o serviço sem a extensão opcional e confirmar que o comando ainda carrega a política central.

- [ ] **Step 7: regressões**

```bash
node --test \
  tests/unit/invoice-submit-guard.test.js \
  tests/unit/operational-write-refresh-policy.test.js \
  tests/unit/invoice-asset-transition-persistence.test.js
npx playwright test tests/e2e/prontuario-invoice-submit.spec.js --project=chromium
```

- [ ] **Step 8: revisão adversarial**

Testar inclusão, edição, despesa comum, `A identificar`, serviço e permanente. Confirmar que duas despesas legitimamente iguais em gestos distintos continuam permitidas.

- [ ] **Step 9: commit**

```bash
git add app.js src/application/invoice-service.js tests/
git commit -m "fix: conter envios repetidos de despesas"
```

**Rollback:** reverter guard e política de refresh; não existe migration.

**Gate de saída:** uma chamada por gesto; feedback imediato; nenhuma mudança de regra de negócio.

---

# Task 2 — PR2: regra canônica da Assessoria, contratos AJV e no-op semântico

**Files:**
- Create: `src/domain/service-advisory.js`
- Create: `src/domain/invoice-effects.js`
- Modify: `src/domain/json-contracts.js`
- Modify: `src/application/invoice-service.js`
- Modify: `src/application/verification-service.js`
- Modify: `src/integration/product-extensions-bootstrap.js` somente para ordem/carregamento do novo domínio, se necessário
- Create: `tests/unit/service-advisory-domain.test.js`
- Create: `tests/unit/invoice-effects.test.js`
- Create: `tests/unit/invoice-service-semantic-noop.test.js`
- Create/Modify: `tests/unit/json-contracts-service-advisory.test.js`
- Modify: `tests/unit/invoice-asset-transition-persistence.test.js`

**Produces:** `RadarServiceAdvisory`, `RadarInvoiceEffects.plan()`, enums/constantes de domínio e no-op real.

- [ ] **Step 1: escrever matriz RED da Assessoria**

Cobrir no mínimo:

```text
0 NF serviço → entrega Não se aplica / sent false / análise Correto
1 NF serviço não enviada → entrega Não / análise Não analisado
1 NF serviço enviada correta → entrega Sim / análise Correto
múltiplas NFs, uma Incorreta → análise Incorreto
múltiplas NFs, uma Não analisada → análise Não analisado se nenhuma Incorreta
Correto (Atrasado) preservado conforme prioridade definida
```

- [ ] **Step 2: centralizar valores permitidos**

`service-advisory.js` deve exportar constantes congeladas para entrega e análise. Nenhum consumidor novo deve comparar literals próprios quando puder usar o módulo.

- [ ] **Step 3: criar `aggregate(invoices)` puro**

A função recebe apenas dados e retorna um objeto imutável com:

```text
delivery
sent
analysis
invoiceCount
```

Não acessa DOM, estado global, Supabase ou perfil.

- [ ] **Step 4: migrar `InvoiceService`**

Remover a implementação privada concorrente de agregação. `syncServiceRequirement()` passa a chamar o domínio compartilhado.

- [ ] **Step 5: migrar `VerificationService`**

Toda transição que afete `consAssessoria` deve consumir a mesma regra canônica. Transição sem NF de serviço nunca pode deixar o campo vazio por efeito lateral.

- [ ] **Step 6: estreitar AJV sem quebrar legado**

O projeto já possui `json-contracts.js`. Adicionar contratos específicos para os campos de Assessoria/bonificação somente onde puderem ser validados sem invalidar payloads legados não relacionados.

Rejeitar valores fora dos enums no ponto de borda escolhido; não converter silenciosamente valor inválido em outro válido.

- [ ] **Step 7: escrever RED do no-op**

Cenários obrigatórios:

```text
invoice igual + asset igual + verification coerente → unchanged
invoice igual + Assessoria incoerente → changed
invoice igual + asset deveria ser removido/criado → changed
invoice igual + consolidação exige efeito → changed
```

- [ ] **Step 8: criar `RadarInvoiceEffects.plan(input)`**

O plano deve comparar estado atual e desejado, ignorando apenas metadados técnicos gerados pelo servidor (`row_version`, `created_at`, `updated_at` ou equivalentes definidos explicitamente).

Saída mínima:

```text
changed.invoice
changed.asset
changed.verification
changed.consolidation
unchanged
```

- [ ] **Step 9: retornar antes de qualquer efeito no no-op verdadeiro**

No no-op:

- não criar log;
- não reabrir consolidação;
- não gerar nova versão;
- não chamar RPC;
- retornar `unchanged: true` com snapshot lógico atual.

- [ ] **Step 10: regressões**

```bash
node --test \
  tests/unit/service-advisory-domain.test.js \
  tests/unit/invoice-effects.test.js \
  tests/unit/invoice-service-semantic-noop.test.js \
  tests/unit/json-contracts-service-advisory.test.js \
  tests/unit/invoice-asset-transition-persistence.test.js
```

- [ ] **Step 11: commits pequenos**

```bash
git add src/domain/service-advisory.js src/domain/json-contracts.js tests/unit/service-advisory-domain.test.js tests/unit/json-contracts-service-advisory.test.js
git commit -m "refactor: centralizar regra da assessoria"

git add src/domain/invoice-effects.js src/application/invoice-service.js src/application/verification-service.js tests/
git commit -m "fix: aplicar no-op semantico a despesas"
```

**Rollback:** reverter código; nenhum dado real é reparado neste PR.

**Gate de saída:** uma única regra de Assessoria no domínio; no-op não escreve; inconsistência derivada não é mascarada como no-op.

---

# Task 3 — PR3: readiness sistêmico orientado a Promise/evento

**Files:**
- Create: `src/integration/product-extension-readiness.js`
- Modify: `src/integration/product-extensions-bootstrap.js`
- Modify: `src/integration/atomic-analysis-pendency.js`
- Modify: `src/integration/navigation-context-bootstrap.js`
- Modify: `src/integration/operational-readiness-bridge.js`
- Modify: `src/integration/service-advisory-pendency.js`
- Modify: `src/integration/service-advisory-corrective-submission.js`
- Modify: `src/integration/operational-write-performance.js`
- Modify: módulos adicionais identificados no inventário de polling/timeout
- Create: `tests/unit/product-extension-readiness.test.js`
- Create: `tests/unit/product-extension-bootstrap-failure-isolation.test.js`
- Modify: `tests/unit/atomic-analysis-readiness.test.js`
- Modify: `tests/e2e/atomic-analysis-pendency.spec.js`

**Produces:** registry central de capacidades com Promise por estado final e bootstrap tolerante a falhas independentes.

- [ ] **Step 1: inventariar todos os mecanismos de espera**

Buscar no SHA atual:

```text
setInterval
setTimeout com install/retry
MutationObserver usado para instalar regra funcional
loops de dependenciesReady()
loaders sequenciais com catch global
```

Registrar módulo, dependências, criticidade e consequência da falha no documento de evidência do PR.

- [ ] **Step 2: escrever API RED do registry**

Contrato recomendado:

```javascript
const registry = createRegistry();
registry.register('pendency-domain', { criticality: 'critical', dependencies: [] });
registry.register('atomic-analysis-ui', {
    criticality: 'critical',
    dependencies: ['pendency-domain', 'application-services']
});

registry.ready('pendency-domain', api);
const result = await registry.when('atomic-analysis-ui');
```

`when(name)` resolve com estado final `ready`, `failed` ou `degraded`; não faz polling.

- [ ] **Step 3: implementar estados e transições**

Estados permitidos:

```text
pending
ready
failed
degraded
```

Regras:

- transição final é idempotente;
- `ready` não volta a `pending`;
- falha de dependência propaga ao dependente;
- módulo independente não recebe falha alheia;
- snapshot público é somente leitura.

- [ ] **Step 4: substituir cadeia que morre no primeiro `reject`**

`product-extensions-bootstrap.js` deve continuar tentando scripts independentes. Usar fluxo equivalente a `Promise.allSettled()` ou sequência com captura por item, respeitando dependências declaradas quando houver ordem real.

Não confundir “script carregou” com “capacidade funcional está pronta”.

- [ ] **Step 5: migrar `atomic-analysis-pendency.js`**

Remover o `setInterval(..., 100)` introduzido como hotfix de sobrevivência no PR #200. Instalação deve ocorrer quando as capacidades dependentes notificarem `ready`.

Preservar integralmente a operação atômica já corrigida.

Adicionar regressão para o caso de Pendência ativa: o fluxo não pode delegar `Incorreto` ao handler-base e cair novamente em `PENDENCY_REQUIRED`; deve encaminhar para a ação compatível com o estado da Pendência existente ou impedir duplicidade com mensagem operacional específica.

- [ ] **Step 6: migrar demais módulos críticos/localizados**

Cada integração deve declarar se é:

```text
critical
restricted
optional
```

Falha `optional` é fail-open. Falha `restricted` desabilita apenas a capacidade dependente. Falha crítica não deve deixar controle funcional ativo sem suporte.

- [ ] **Step 7: testar falha isolada**

Cenários:

```text
extensão opcional A falha → B/C independentes instalam
capacidade crítica depende de X e X falha → controle dependente fica indisponível
X fica pronta após demora longa → dependente instala sem timeout arbitrário
atomic-analysis continua funcionando com outra extensão quebrada
```

- [ ] **Step 8: regressões**

```bash
node --test \
  tests/unit/product-extension-readiness.test.js \
  tests/unit/product-extension-bootstrap-failure-isolation.test.js \
  tests/unit/atomic-analysis-readiness.test.js
npx playwright test tests/e2e/atomic-analysis-pendency.spec.js --project=chromium
```

- [ ] **Step 9: commit**

```bash
git add src/integration/ tests/
git commit -m "fix: tornar readiness de extensoes orientado a eventos"
```

**Rollback:** voltar ao bootstrap anterior. Nenhuma migration.

**Gate de saída:** zero timeout arbitrário como requisito de instalação das capacidades migradas; falha isolada não derruba cadeia; PR200 continua funcional.

---

# Task 4 — PR4: reparar somente os dados de Assessoria comprovadamente inconsistentes

**Files:**
- Create: `supabase/migrations/20260826000100_reconcile_empty_service_advisory.sql`
- Create: `supabase/tests/database/service-advisory-data-repair.test.sql`
- Create: `docs/evidence/2026-08-26-service-advisory-data-repair.md`

**Precondition:** PR2 já publicado e validado em Production.

**Produces:** somente os contextos aprovados pelo preflight convergem para a regra canônica.

- [ ] **Step 1: executar preflight read-only imediatamente antes de preparar a migration**

Identificar verificações que simultaneamente:

```text
possuem consAssessoria vazio/inconsistente
não possuem NF de serviço no contexto
correspondem ao defeito histórico, e não a verificação ainda incompleta legítima
```

Registrar para cada candidato:

```text
school_id
competence_id
program_id
verification id
row_version
bonification atual
analysis atual
contagem de NFs de serviço
```

- [ ] **Step 2: congelar o conjunto esperado na migration**

A migration recebe uma CTE/`VALUES` com os candidatos efetivamente aprovados no preflight e suas versões/estado esperado. Não codificar “quatro” como regra permanente.

- [ ] **Step 3: implementar drift detection**

Antes do update, verificar:

- todos os candidatos ainda têm a versão/estado esperado;
- nenhum candidato deixou de satisfazer o predicado;
- não surgiu candidato adicional equivalente fora do conjunto congelado que exija revisão humana.

Se houver drift relevante: `RAISE EXCEPTION` e zero update.

- [ ] **Step 4: aplicar somente a pós-condição canônica**

Para zero NF de serviço:

```text
bonificacao.consAssessoria = "Não se aplica"
bonificacao.consEnviada = false
analise.consAssessoria = "Correto"
```

Preservar todos os demais campos.

- [ ] **Step 5: teste de banco**

Fixtures:

```text
A elegível → corrige
B já correto → preserva
C contexto inesperado → aborta
D candidato muda de versão entre preflight e update → aborta
segunda execução após estado correto → idempotente/zero alteração
```

- [ ] **Step 6: stack descartável**

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

- [ ] **Step 7: preparar evidência e reversão**

Documento deve conter valores antes/depois e SQL de reversão baseado no snapshot prévio. Reversão nunca deve depender de “voltar tudo para vazio” sem identificar exatamente as linhas alteradas.

- [ ] **Step 8: commit**

```bash
git add supabase/migrations/20260826000100_reconcile_empty_service_advisory.sql \
  supabase/tests/database/service-advisory-data-repair.test.sql \
  docs/evidence/2026-08-26-service-advisory-data-repair.md
git commit -m "fix: reconciliar assessoria sem nota de servico"
```

**Gate de Production:** autorização explícita, preflight reexecutado imediatamente antes da aplicação e conjunto idêntico ao aprovado.

---

# Task 5 — PR5: idempotência de servidor, intent estável e geração robusta de IDs

**Files:**
- Create: `src/domain/operation-intent.js`
- Modify: `src/application/invoice-service.js`
- Modify: `src/data/supabase-repository.js`
- Create: `supabase/migrations/20260826000200_invoice_operation_idempotency_v2.sql`
- Create: `supabase/tests/database/invoice-idempotency-v2.test.sql`
- Create: `tests/unit/operation-intent.test.js`
- Create: `tests/unit/invoice-idempotency.test.js`
- Modify: `tests/unit/supabase-repository.test.js`
- Modify: serviços com fallback `Date.now()` para usar gerador compartilhado, sem alterar API externa

**Produces:** uma intenção imutável por gesto e `save_invoice_with_effects_v2` idempotente.

- [ ] **Step 1: escrever contrato RED do intent**

Uma intenção nasce uma vez e contém:

```text
operationKey
invoiceId
assetId se necessário
logId
timestamp semântico
payload normalizado
expectedInvoiceVersion
expectedAssetVersion
expectedVerificationVersion
```

Retry recebe o mesmo objeto/identificadores.

- [ ] **Step 2: criar gerador compartilhado robusto**

Usar `crypto.randomUUID()` quando disponível e fallback com entropia suficiente alinhado ao padrão vigente. Serviços não devem possuir fallback `prefix-Date.now()` independente.

O teste deve provar unicidade em chamadas consecutivas e injeção determinística para testes.

- [ ] **Step 3: criar armazenamento privado de idempotência**

Usar o schema já existente `radar_private`, não uma tabela pública exposta.

Estrutura mínima:

```text
operation_name
operation_key uuid
actor_user_id uuid
request_hash
status
result jsonb
created_at
completed_at
```

Chave única por operação/chave/ator.

- [ ] **Step 4: criar RPC versionada**

Criar `public.save_invoice_with_effects_v2(...)` em vez de overload ambíguo da função atual.

A v1 permanece durante rollout. A v2 recebe o intent/chave e executa reserva + efeitos + armazenamento do resultado na mesma transação.

- [ ] **Step 5: mesma chave + mesmo hash**

Se a operação já estiver concluída, devolver o resultado persistido sem novo efeito.

- [ ] **Step 6: mesma chave + hash diferente**

Rejeitar com código explícito de conflito de idempotência. Nunca “aceitar o mais recente”.

- [ ] **Step 7: concorrência real**

Teste de banco deve provar que duas chamadas concorrentes da mesma intenção resultam em:

```text
1 invoice
0 ou 1 asset conforme tipo
1 administrative log
1 efeito na verification
mesmo resultado lógico para ambas
```

Duas chaves diferentes com payload igual continuam podendo criar duas despesas, porque conteúdo não é chave de negócio.

- [ ] **Step 8: perda de resposta depois do commit**

No teste de integração, simular primeira chamada concluída no banco mas resposta perdida. Retry com mesmo intent deve apenas recuperar resultado.

- [ ] **Step 9: migrar repositório/serviço para v2**

Somente o cliente novo usa v2. Manter fallback v1 temporário apenas para compatibilidade controlada durante rollout; não misturar semântica de intent entre versões.

- [ ] **Step 10: gates**

```bash
node --test \
  tests/unit/operation-intent.test.js \
  tests/unit/invoice-idempotency.test.js \
  tests/unit/supabase-repository.test.js
npm run supabase:test:db
npm run supabase:lint:db
```

- [ ] **Step 11: commit**

```bash
git add src/ supabase/migrations/20260826000200_invoice_operation_idempotency_v2.sql \
  supabase/tests/database/invoice-idempotency-v2.test.sql tests/
git commit -m "feat: tornar gravacao de despesas idempotente por intencao"
```

**Rollback:** cliente pode voltar à v1 enquanto a v2 permanece instalada; remover estrutura privada somente em migration posterior, após confirmar ausência de consumidores.

**Gate de saída:** retry não duplica; concorrência não duplica; duas intenções distintas continuam independentes.

---

# Task 6 — PR6: contrato semântico único das Pendências

**Files:**
- Modify: `src/domain/operational-projection.js`
- Create: `src/domain/pendency-queue-model.js`
- Create: `src/domain/pendency-action-model.js`
- Modify: `src/domain/pendencias-view-model.js`
- Modify: `src/integration/task-9-cross-view.js`
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Create: `tests/unit/pendency-queue-model.test.js`
- Create: `tests/unit/pendency-action-model.test.js`
- Modify: `tests/pendencias-view-model.test.js`
- Modify: `tests/pendency-cancelled-reopen.test.js`

**Produces:** uma única semântica de etapa/idade/ator/ação/priority usada por todas as telas.

- [ ] **Step 1: escrever RED de idade operacional**

Casos:

```text
Aberta original → base dataAbertura
Aguardando reanálise → base última tentativa aguardando
reabertura → base evento de reabertura
reanálise incorreta → base evento atual
arquivo indisponível → base evento atual
Resolvida/Cancelada → base evento de encerramento correspondente
```

- [ ] **Step 2: declarar `operational-projection.js` como autoridade**

`pendency-queue-model` não calcula idade por conta própria; chama `getOperationalBaseDate()` e projeções correlatas.

- [ ] **Step 3: criar action model sem DOM**

Matriz mínima:

```text
Aberta → primary Registrar novo envio
Aguardando reanálise → primary Reanalisar
Resolvida → detail/history + Reabrir + Prontuário
Cancelada → detail/history + Reabrir + Prontuário
```

Contato só aparece para estados ativos e perfis/capacidades compatíveis.

- [ ] **Step 4: corrigir reabertura de Cancelada na UI**

O handler não mantém lista de estados divergente do domínio. Se o action model expõe `reopen`, a camada de UI executa a ação autorizada.

- [ ] **Step 5: alinhar `pendencias-view-model.js` e `task-9-cross-view.js`**

Remover/reduzir cálculos duplicados de:

```text
waitingDays
nextActor
nextAction
priority
```

- [ ] **Step 6: aba inicial orientada ao trabalho**

Para perfil que pode reanalisar e possui registros aguardando reanálise, o modelo inicial prioriza esse trabalho. Seleção explícita do usuário prevalece.

- [ ] **Step 7: regressões**

```bash
node --test \
  tests/unit/pendency-queue-model.test.js \
  tests/unit/pendency-action-model.test.js \
  tests/pendency-cancelled-reopen.test.js \
  tests/pendencias-view-model.test.js \
  tests/unit/pendency-service-access.test.js \
  tests/unit/pendency-reanalysis-roles.test.js
```

- [ ] **Step 8: commit**

```bash
git add src/domain/ src/integration/task-9-cross-view.js \
  src/integration/task-9-pendencias-page.js src/integration/task-10-11-pendency-actions.js tests/
git commit -m "refactor: unificar contrato operacional de pendencias"
```

**Gate de saída:** mesma Pendência apresenta mesma idade, ator e ação em qualquer superfície.

---

# Task 6B — PR6B: preservar competência global ao navegar por Pendência transversal

**Files:**
- Modify: `src/integration/global-search.js`
- Modify: `src/integration/navigation-context.js` ou `navigation-history.js` somente se necessário para transportar contexto sem mudar estado global
- Modify: `src/integration/operational-readiness-bridge.js` se ele ainda interferir no transporte de contexto
- Create: `tests/e2e/global-search-pendency-context.spec.js`
- Modify: testes de competência global existentes

**Produces:** detalhe transversal recebe sua competência como contexto local sem trocar a competência global.

- [ ] **Step 1: escrever RED do bug atual**

```text
selecionar Agosto
buscar Pendência de Março
abrir detalhe
fechar detalhe
assert competência global == Agosto
```

O baseline atual deve falhar porque `global-search.js` chama `selectCompetenceContext()` para resultados de Pendência.

- [ ] **Step 2: separar destino transversal de destino mensal**

Para resultado `pendency`, navegar para a fila/detalhe com `pendencyId` e contexto local, **sem** chamar `selectCompetenceContext()`.

- [ ] **Step 3: preservar caminho para Prontuário**

A ação explícita `Abrir no Prontuário` pode selecionar a competência da Pendência antes de navegar, porque o Prontuário é mensal.

- [ ] **Step 4: testar histórico/back**

Abrir/fechar/voltar não pode produzir troca silenciosa de mês.

- [ ] **Step 5: regressões**

```bash
npx playwright test tests/e2e/global-search-pendency-context.spec.js --project=chromium
```

Executar também testes existentes do seletor global/Carteira/Prontuário.

- [ ] **Step 6: commit**

```bash
git add src/integration/global-search.js src/integration/navigation-*.js tests/
git commit -m "fix: preservar competencia ao abrir pendencia transversal"
```

**Gate de saída:** detalhe não muda mês; Prontuário muda somente por ação explícita.

---

# Task 7A — PR7A: reorganizar fila operacional, filtros e cartões

**Files:**
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/pendency-passive-queue-ux.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/pendency-passive-queue.css`
- Create: `tests/unit/pendency-filter-options.test.js`
- Create: `tests/e2e/pendency-queue-filters.spec.js`
- Create: `tests/e2e/pendency-queue-mobile.spec.js`

**Consumes:** modelos do PR6/PR6B.

- [ ] **Step 1: escrever testes RED dos filtros**

Cobrir:

```text
Minha carteira / Todas
R.A.
Controlador conforme perfil
escola
idade da etapa
competência
programa
documento
erro
```

- [ ] **Step 2: definir faixas canônicas de idade**

```text
Hoje
1–3 dias
4–7 dias
8–15 dias
16 dias ou mais
```

Todas usam a idade operacional do PR6.

- [ ] **Step 3: promover filtros de maior uso**

Visíveis:

```text
Minha carteira/Todas
busca
R.A.
Controlador quando aplicável
Escola
Tempo na etapa
```

Em `Mais filtros`:

```text
competência
programa
documento
erro
```

Não criar segundo filtro de status se as abas já representam status.

- [ ] **Step 4: nomear corretamente o escopo**

Usar `Minha carteira`, não `Minhas pendências`. Não criar `Minha R.A.` sem relação formal usuário↔R.A.

- [ ] **Step 5: cartão com uma ação principal**

Ordem visual mínima:

```text
status + tempo
escola + designação + R.A.
competência + programa
documento
próxima ação + ator atual
erro/tentativa
primary action
Mais ações
```

Somente a ação principal recebe destaque dominante.

- [ ] **Step 6: agrupamento por escola continua opcional**

Não transformar agrupamento em única visão. Não colocar ação de contato/prontuário no cabeçalho do grupo quando não houver contexto único de competência/Pendência.

- [ ] **Step 7: mobile**

Testar 360, 390, 412 e 768 px. Sem scroll horizontal, overlap ou botões comprimidos a ponto de perder legibilidade.

- [ ] **Step 8: regra transversal**

Mudar competência global e abrir Pendências. A fila continua cobrindo todas as competências até aplicação de filtro local.

- [ ] **Step 9: gates**

```bash
node --test tests/unit/pendency-filter-options.test.js
npx playwright test tests/e2e/pendency-queue-filters.spec.js --project=chromium
npx playwright test tests/e2e/pendency-queue-mobile.spec.js
```

- [ ] **Step 10: commit**

```bash
git add src/integration/task-9-pendencias-page.js \
  src/integration/pendency-passive-queue-ux.js src/styles/ tests/
git commit -m "feat: reorganizar fila e filtros de pendencias"
```

**Gate de saída:** encontrar trabalho para reanálise é mais direto; filtros existentes não são duplicados; mobile continua funcional.

---

# Task 7B — PR7B: detalhe, reanálise, base interativa, mobile e acessibilidade

**Files:**
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `app.js` apenas onde o modal base exigir composição
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/pendency-passive-queue.css`
- Create: `tests/unit/pendency-detail-content.test.js`
- Create: `tests/e2e/pendency-detail-reanalysis.spec.js`
- Create/Modify: `tests/e2e/pendency-accessibility.spec.js`

- [ ] **Step 1: preservar `Ver detalhes` até a base estar acessível**

Antes de remover qualquer botão redundante, o cartão/render base deve possuir:

```text
click
tabindex
focus visível
Enter
Space
accessible name
proteção contra propagação de botões internos
retorno de foco ao fechar detalhe
```

- [ ] **Step 2: escrever RED de teclado/foco**

Testar cartão com mouse, Tab+Enter e Tab+Space. Botão `Mais ações` não pode também abrir o detalhe por bubbling.

- [ ] **Step 3: reestruturar detalhe por informação**

Seções:

```text
cabeçalho: documento/escola/status/competência/programa
resumo operacional: próxima ação/ator/controlador/tempo
situação/erro atual
observação de abertura
tentativas
contatos
linha do tempo
ação principal + Mais ações
```

Para Cancelada/Resolvida, rótulos devem refletir histórico/encerramento e não fingir que existe “erro atual”.

- [ ] **Step 4: reestruturar reanálise sem reconstruir sua lógica**

Separar visualmente:

```text
Situação atual
Último envio
Decisão
Efeito da decisão
```

Eliminar competência duplicada do tipo `Junho/2026 (2026-06)` quando ambos representam o mesmo contexto.

- [ ] **Step 5: decisão sobre `Ver detalhes`**

Somente depois dos testes de base interativa, avaliar remoção. Se o cartão não for inequívoco no mobile ou para tecnologia assistiva, manter o botão.

- [ ] **Step 6: regressões**

```bash
node --test tests/unit/pendency-detail-content.test.js
npx playwright test tests/e2e/pendency-detail-reanalysis.spec.js
npx playwright test tests/e2e/pendency-accessibility.spec.js
```

- [ ] **Step 7: homologação humana visual curta**

Comparar pelo menos:

```text
Aberta
Aguardando reanálise
Cancelada
mobile
```

Registrar somente ajustes visuais necessários ao fluxo, sem expandir para a frente VIS geral.

- [ ] **Step 8: commit**

```bash
git add app.js src/integration/ src/styles/ tests/
git commit -m "feat: orientar detalhe e reanalise de pendencias"
```

---

# Task 8 — PR8: resposta remota autoritativa, aplicação incremental e estado degradado

**Files:**
- Create: `supabase/migrations/20260826000300_expand_invoice_v2_authoritative_result.sql`
- Modify: `src/data/supabase-repository.js`
- Modify: `src/application/data-service.js`
- Modify: `src/application/state-port.js`
- Modify: `src/application/invoice-service.js`
- Modify: `src/integration/operational-write-feedback.js`
- Create: `tests/unit/invoice-authoritative-result.test.js`
- Modify: `tests/unit/data-service-authoritative-commit.test.js`
- Modify: `tests/unit/invoice-asset-transition-persistence.test.js`
- Modify: `tests/unit/supabase-repository.test.js`
- Create: `supabase/tests/database/invoice-authoritative-result-v2.test.sql`

**Consumes:** RPC/idempotência v2 do PR5 e efeito semântico do PR2.

- [ ] **Step 1: escrever contrato RED da resposta**

A resposta deve conter explicitamente:

```text
operationKey
invoice
asset | null
deletedAssetId | null
verification | null
administrativeLog | null
changedEntities
rowVersions
```

Ausência deve ser `null`, não campo omitido ambiguamente.

- [ ] **Step 2: cobrir permanente → não permanente antes de ativar modo autoritativo**

Se servidor removeu asset, `deletedAssetId` precisa remover o item da memória local.

- [ ] **Step 3: ampliar resposta da RPC v2**

Não alterar a v1 para criar nova ambiguidade. A v2 passa a retornar todas as entidades/remoções/versões produzidas no commit.

- [ ] **Step 4: normalizar no repositório**

`supabase-repository.js` transforma snake_case em contrato canônico único do frontend.

- [ ] **Step 5: ampliar `StatePort` minimamente**

Adicionar primitivas explícitas, por exemplo:

```text
upsertRecords(entity, records)
removeRecords(entity, ids)
```

ou uma única `applyEntityChanges({upserts, removals})` pequena e testável.

Evitar construir patch engine genérico.

- [ ] **Step 6: corrigir `mergePersistedResult`/DataService para remoções**

Hoje o merge é orientado a upsert. Incluir instruções de remoção provenientes do contrato v2 antes de considerar todas as entidades autoritativas.

- [ ] **Step 7: tratar `refreshPending` e `stateApplyErrorCode` como estado degradado explícito**

Quando commit remoto foi confirmado e aplicação local falhou:

```text
persistência = sucesso
UI = degradada
```

A UI deve informar que os dados foram salvos e que a tela precisa reconciliar, sem convidar o usuário a clicar novamente.

- [ ] **Step 8: reconciliação segura**

Tentar refresh das entidades necessárias. Durante a reconciliação, impedir repetição da mesma intenção. Se refresh falhar, oferecer atualização controlada da tela.

- [ ] **Step 9: ativar `remoteResultIsAuthoritative` somente após cobertura completa**

Não ativar enquanto log, versões ou remoções estiverem incompletos.

- [ ] **Step 10: gates**

```bash
node --test \
  tests/unit/invoice-authoritative-result.test.js \
  tests/unit/data-service-authoritative-commit.test.js \
  tests/unit/invoice-asset-transition-persistence.test.js \
  tests/unit/supabase-repository.test.js
npm run supabase:test:db
npm run supabase:lint:db
```

- [ ] **Step 11: commit**

```bash
git add src/ supabase/migrations/20260826000300_expand_invoice_v2_authoritative_result.sql \
  supabase/tests/database/invoice-authoritative-result-v2.test.sql tests/
git commit -m "perf: aplicar resultado completo da gravacao de despesas"
```

**Rollback:** desligar flags autoritativas no cliente antes de reverter qualquer contrato SQL; o caminho conservador de refresh deve permanecer disponível durante rollout.

---

# Task 9 — PR9 / PERF-BOOT: instrumentar causalidade antes de otimizar

**Files:**
- Create: `src/integration/bootstrap-performance-diagnostics.js`
- Modify: `src/integration/auth-bootstrap.js`
- Modify: `src/integration/auth-gate.js`
- Modify: `src/application/data-service.js` apenas para marcas de fase, sem acoplar domínio a telemetria
- Modify: `src/integration/product-extension-readiness.js` para expor momento de readiness agregado
- Modify: `scripts/run-lighthouse-baseline.mjs`
- Create: `tests/unit/bootstrap-performance-diagnostics.test.js`
- Create/Modify: teste E2E de bootstrap/performance sintética

**Produces:** decomposição mensurável do tempo inicial sem nova dependência.

- [ ] **Step 1: criar API fail-open de marcação**

Reaproveitar o padrão de `operational-write-diagnostics.js`:

```text
performance.now
performance.mark
performance.measure
PerformanceObserver
```

Falha de diagnóstico nunca bloqueia produto.

- [ ] **Step 2: marcar fases**

No mínimo:

```text
pageInit
authStart/authEnd
sessionReady
supabaseClientReady
bootstrapFetchStart/bootstrapFetchEnd
normalizationEnd
stateApplyEnd
firstRender
extensionsReady
stable
usefulInteraction
```

- [ ] **Step 3: não incluir dados de negócio**

Métrica local não deve carregar:

```text
escola
usuário
NF
pendência
competência
programa
texto livre
```

- [ ] **Step 4: executar baseline múltiplo**

Desktop e mobile sintético, no mínimo três execuções comparáveis. Registrar mediana e pior caso; não concluir regressão por diferença minúscula de uma execução isolada.

- [ ] **Step 5: localizar gargalo antes de otimizar**

Classificar tempo material em:

```text
auth/session
rede/Supabase
normalização/state
render
extensões
recursos estáticos
```

- [ ] **Step 6: criar PR de otimização somente para causas comprovadas**

Dentro do próprio PR9, aceitar apenas otimizações diretamente sustentadas pelas medições e de baixo risco. Se o diagnóstico apontar uma mudança arquitetural grande, parar e criar plano separado; não esconder reforma dentro de “performance”.

- [ ] **Step 7: decisão sobre `web-vitals`**

Somente se o problema exigir medição de campo real, documentar decisão contendo:

```text
métrica necessária
destino de coleta
retenção
volume
privacidade
impacto de bundle
```

Sem isso, não instalar.

- [ ] **Step 8: decisão sobre `Server-Timing`**

Somente se tempo material estiver dentro de RPC/servidor e a decomposição do cliente for insuficiente. Não criar Edge Function/proxy apenas para produzir header sem benefício comprovado.

- [ ] **Step 9: gates**

```bash
node --test tests/unit/bootstrap-performance-diagnostics.test.js
npm run audit:lighthouse
```

Executar também Playwright do bootstrap conforme teste criado.

- [ ] **Step 10: commit**

```bash
git add src/integration/ scripts/run-lighthouse-baseline.mjs tests/
git commit -m "perf: instrumentar bootstrap do radar"
```

**Gate de saída:** sabemos onde o tempo é gasto; qualquer otimização aplicada possui evidência antes/depois.

---

# Task 10 — H1 restrito: qualidade operacional após estabilização funcional

**Executar somente depois de PR9 e apenas se ainda necessário.**

Escopo permitido:

- estabilizar metodologia Lighthouse/CI;
- branch protection/ruleset e critérios obrigatórios de merge;
- pequenas dívidas técnicas explicitamente aprovadas e diretamente relacionadas aos gates.

Escopo proibido:

- P20 excluído;
- leaked-password protection;
- auditoria genérica de segurança;
- modernização geral da stack;
- dependências novas sem justificativa específica.

Se a única pendência restante for branch protection/configuração do GitHub, tratar como tarefa de governança e não misturar com código funcional.

---

## 5. Matriz de aceite fim a fim

| Cenário | Resultado obrigatório | Entrega |
|---|---|---|
| duplo clique | uma chamada | PR1 |
| Enter + clique | uma chamada | PR1 |
| erro da primeira gravação | botão restaura e nova tentativa é possível | PR1 |
| `administrativeLogs` | não depende de extensão opcional para evitar refetch desnecessário | PR1 |
| zero NF serviço | Assessoria = `Não se aplica` | PR2 |
| múltiplas NFs serviço | agregação única e determinística | PR2 |
| save semanticamente idêntico | `unchanged: true`, zero RPC/log/versão | PR2 |
| invoice igual, derivado incoerente | reconcilia; não é no-op | PR2 |
| extensão opcional falha | módulos independentes continuam | PR3 |
| dependência demora | capacidade instala por evento, sem timeout arbitrário | PR3 |
| fluxo `Incorreto` | hotfix PR200 continua funcionando | PR3 |
| dados históricos de Assessoria | só candidatos aprovados são corrigidos | PR4 |
| drift antes da migration | aborta sem alteração | PR4 |
| retry mesma intenção | sem novo efeito | PR5 |
| resposta perdida após commit | retry recupera resultado | PR5 |
| duas chamadas concorrentes mesma intenção | um único efeito | PR5 |
| duas intenções distintas iguais | duas despesas permitidas | PR5 |
| Pendência reaberta | idade reinicia na etapa atual | PR6 |
| Cancelada | reabertura disponível conforme contrato | PR6 |
| mesma Pendência em telas distintas | ator/ação/idade iguais | PR6 |
| Agosto → detalhe Pendência Março | continua Agosto | PR6B |
| Agosto → Prontuário Pendência Março | muda explicitamente para Março | PR6B |
| perfil com reanálise pendente | trabalho para reanalisar priorizado | PR7A |
| Minha carteira | sem inventar atribuição individual inexistente | PR7A |
| mobile | sem overflow e com hierarquia legível | PR7A/7B |
| cartão por teclado | Enter/Space abrem detalhe com foco correto | PR7B |
| permanente → outro tipo | asset removido também da memória | PR8 |
| commit remoto + apply local falha | mensagem de estado degradado, sem reenvio cego | PR8 |
| bootstrap lento | fases internas mensuradas | PR9 |
| Lighthouse flutua | decisão baseada em conjunto de execuções, não uma amostra isolada | PR9/H1 |

---

## 6. Matriz de risco e rollback

| Entrega | Risco principal | Mitigação | Rollback |
|---|---|---|---|
| PR1 | travar formulário indevidamente | `finally` + testes de erro | revert frontend |
| PR2 | alterar regra derivada | domínio puro + matriz de casos | revert código, sem data repair |
| PR3 | capability não instalar | registry testado + fail isolation | revert bootstrap |
| PR4 | corrigir linha legítima | whitelist de preflight + row version + abort | snapshot/SQL específico |
| PR5 | deadlock/conflito idempotência | testes concorrentes + v2 paralela | cliente volta à v1 |
| PR6 | divergência de ações | action model puro + regressões | revert modelos/UI |
| PR6B | quebrar contexto do Prontuário | dois caminhos explícitos | revert navegação |
| PR7A | filtros/UX esconderem registro | testes combinatórios + regra transversal | revert superfície |
| PR7B | regressão de teclado/foco | Playwright/a11y | revert UI |
| PR8 | estado local incorreto | não ativar autoritativo antes de cobertura | desligar flags e usar refresh |
| PR9 | telemetria afetar app | fail-open, sem dados de negócio | remover instrumentation |

---

## 7. Condições de parada obrigatórias

Parar a execução e revisar o plano se ocorrer qualquer um destes eventos:

1. Production divergir materialmente do baseline de forma que invalide a premissa do PR;
2. migration encontrar contexto inesperado;
3. CI revelar regressão funcional fora do escopo e causalmente ligada ao PR;
4. correção exigir nova dependência não prevista;
5. uma tarefa aparentemente pequena exigir mudança arquitetural ampla;
6. novo achado independente de gravidade alta/crítica surgir;
7. PR precisar reabrir P20 ou leaked-password protection para “funcionar” — isso exige nova decisão explícita, não workaround silencioso.

Novo achado deve ser classificado como:

```text
1. já mapeado no PR199/plano atual
2. extensão de problema já mapeado
3. novo achado independente
4. hipótese descartada/sem evidência
```

---

## 8. Critério de conclusão da frente

A frente somente pode ser declarada concluída quando:

- PR1 a PR9 aplicáveis estiverem integrados e Production confirmada;
- reparos de dados aprovados tiverem pós-condição verificada;
- fluxo de NF estiver protegido em gesto e servidor;
- Consulta Assessoria tiver uma única regra canônica;
- readiness crítico não depender de polling/timeout arbitrário nos módulos migrados;
- Pendências usarem uma única semântica operacional;
- abrir detalhe transversal não trocar competência global;
- fila/detail/reanálise estiverem funcionais em desktop/mobile/teclado;
- resposta autoritativa lidar com upsert e remoção;
- commit remoto + falha local tiver UX segura;
- bootstrap tiver causalidade mensurada e otimizações comprovadas, se necessárias;
- não houver gate funcional relevante vermelho;
- itens expressamente excluídos permaneçam fora do trabalho.

---

## 9. Sequência de documentação por PR

Cada PR deve atualizar apenas o necessário:

```text
docs/CURRENT_STAGE.md → estado mutável após merge
docs/evidence/<data>-<pr>.md → evidência técnica do PR
FUNCTIONAL_CONTRACT_MATRIX → somente se contrato funcional mudar
DECISION_LOG/ADR → somente se houver decisão duradoura nova
```

Evitar produzir documentação redundante a cada commit. O objetivo é continuidade e prova, não uma burocracia que comece a competir com o produto.

---

## 10. Handoff de execução

O executor deve começar por **Task 0/G0** e seguir linearmente. Não agrupar PR1–PR9 em um único pacote. O modo recomendado é uma entrega por vez, com revisão entre gates.

Antes de cada PR, ler:

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-consolidado.md`;
4. este plano;
5. código atual da `main` e ambientes correspondentes.

Este documento define a metodologia e a ordem. A `main`, Production e Supabase continuam sendo fontes de verdade superiores ao plano quando houver divergência factual posterior.