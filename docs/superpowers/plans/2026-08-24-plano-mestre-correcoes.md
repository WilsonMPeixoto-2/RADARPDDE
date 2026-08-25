# Plano mestre de correções operacionais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir duplicação/latência de despesas, restaurar a coerência canônica da Consulta Assessoria, tornar módulos funcionais determinísticos e transformar a fila de Pendências em uma superfície operacional encontrável e orientada à ação.

**Architecture:** A implementação é dividida em nove PRs independentes e verificáveis. Primeiro contém o incidente; depois estabiliza regras derivadas e bootstrap; somente então repara dados, adiciona idempotência, consolida o contrato funcional da fila, redesenha a experiência e amplia a resposta autoritativa. Interfaces criadas em PRs anteriores são consumidas pelos posteriores para evitar lógica duplicada.

**Tech Stack:** JavaScript UMD/browser e Node.js 24, `node:test`, Playwright, Supabase/PostgreSQL/RPC/RLS, Vercel, CSS responsivo, Performance API.

**Spec:** `docs/handoff/2026-08-24-pre-implementacao-plano-mestre.md`

## Global Constraints

- Não usar, recuperar ou depender do PR #195.
- Não voltar a filtrar Pendências pela competência global; preservar ADR-044.
- Não deduplicar despesas por conteúdo.
- Não converter automaticamente despesa `A identificar` em `Não`/`Incorreto`.
- Não bloquear consolidação apenas por pendência ativa ou análise `Não analisado`.
- Preservar `Sim + Incorreto + pendência` como combinação possível.
- Não ampliar o timeout fixo de dez segundos como solução de prontidão.
- Não transformar todo `administrativeLogs` em lazy loading.
- Não ativar resposta autoritativa completa sem tratar remoções, inclusive `deleted_asset_id`.
- Não modificar schema/dados no PR 1, PR 2, PR 3, PR 6, PR 7A ou PR 7B.
- Toda migration deve ter predicado, prova antes/depois e reversão proporcional.
- Falha de diagnóstico/métricas é fail-open; falha funcional crítica bloqueia somente controles dependentes.
- Executar cada PR em branch isolada, com revisão e gate próprios.
- Não iniciar PR posterior antes de satisfazer o gate explícito do anterior.

---

## 1. Mapa de arquivos e responsabilidades futuras

| Arquivo | Responsabilidade depois do plano |
|---|---|
| `app.js` | Guarda de submit e composição visual dos modais; não decide regra canônica |
| `src/domain/service-advisory.js` | Única função pura de normalização/agregação da Assessoria |
| `src/domain/invoice-effects.js` | Planejamento semântico dos efeitos de inclusão/edição de despesa |
| `src/application/invoice-service.js` | Orquestra plano de efeitos, persistência, no-op e retorno |
| `src/application/verification-service.js` | Transições de avaliação consumindo a regra compartilhada |
| `src/integration/product-extension-readiness.js` | Registro de instalação/falha/prontidão por módulo |
| `src/integration/product-extensions-bootstrap.js` | Carregamento sequencial com falha isolada e gates críticos |
| `src/domain/pendency-queue-model.js` | Ordenação, tempo da etapa, escopo e aba inicial |
| `src/domain/pendency-action-model.js` | Ação primária/secundárias/destrutiva por estado, perfil e capacidade |
| `src/domain/pendencias-view-model.js` | Projeção de dados sem reimplementar tempo/ações |
| `src/integration/task-9-pendencias-page.js` | Renderização, filtros e eventos consumindo os dois modelos |
| `src/integration/task-10-11-pendency-actions.js` | Execução das ações autorizadas pelo action model |
| `src/integration/pendency-passive-queue-ux.js` | Apenas aprimoramento visual não crítico |
| `src/styles/task-9-pendencias.css` e `src/styles/pendency-passive-queue.css` | Layout responsivo, hierarquia e estados |
| `src/data/supabase-repository.js` | Contrato de RPC, chave de operação e resposta normalizada |
| `src/application/data-service.js` | Aplicação incremental explícita, inclusive remoções |
| `supabase/migrations/` | Reparo condicionado, idempotência e ampliação de RPC em PRs separados |

## 2. Dependências entre entregas

```text
Etapa 0
  ↓
PR 1 — contenção
  ↓
PR 2 — regra/efeitos canônicos ──→ PR 4 — reparo
  ↓
PR 3 — prontidão crítica
  ↓
PR 5 — idempotência ─────────────→ PR 8 — resposta completa
  ↓
PR 6 — contrato da fila ─────────→ PR 7A — fila/filtros
                                  └→ PR 7B — detalhe/reanálise
```

PR 4 pode ser preparado depois do PR 2, mas só executado após publicação e validação do código canônico. PR 7A e PR 7B não começam antes do modelo do PR 6. PR 8 não começa antes do PR 5 e da cobertura de remoção patrimonial.

---

### Task 0: Congelar a linha de base antes de código

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Create: `docs/evidence/2026-08-24-correcoes-operacionais-baseline.md`
- Reference: `docs/handoff/2026-08-24-pre-implementacao-plano-mestre.md`

**Interfaces:**
- Consumes: SHA remoto, manifesto Vercel, consultas read-only, comandos de teste e métricas locais.
- Produces: baseline reproduzível usado em todos os PRs; não produz código nem escrita de dados.

- [ ] **Step 1: Confirmar o remoto e registrar os identificadores**

Run:

```bash
git fetch origin
git rev-parse origin/main
git status --short --branch
```

Expected: árvore limpa e SHA explicitamente registrado. Se for diferente de `4542bbf`, comparar as mudanças materiais antes de continuar.

- [ ] **Step 2: Reexecutar os testes-base uma única vez**

Run:

```bash
node --test \
  tests/pendency-cancelled-reopen.test.js \
  tests/pendencias-view-model.test.js \
  tests/unit/pendency-service-access.test.js \
  tests/unit/pendency-reanalysis-roles.test.js \
  tests/unit/operational-write-diagnostics-integration.test.js
```

Expected: 31 testes aprovados no baseline original; em SHA posterior, registrar o total real e os arquivos, não comparar apenas contagens.

- [ ] **Step 3: Consultar Production sem escrita**

Registrar, com data/hora:

```text
contagem de verifications
contagem de registered_invoices
contagem de administrative_logs
pendências por status, escola, R.A. e Controlador
contextos com consAssessoria vazia e zero NFs de serviço
```

Expected: a consulta de inconsistência retorna somente zero a quatro contextos previamente aprovados; qualquer novo contexto interrompe o preparo do reparo.

- [ ] **Step 4: Capturar baseline de UX/performance**

Medir em desktop e Android/Chrome:

```text
clique → feedback
clique → fim da RPC
fim da RPC → estado estável
quantidade de chamadas após invoice:save
tempo para localizar uma pendência definida no roteiro
```

Expected: evidência antes/depois comparável, sem conteúdo de negócio em telemetria.

- [ ] **Step 5: Commit documental do baseline**

```bash
git add docs/CURRENT_STAGE.md docs/evidence/
git commit -m "docs: congelar baseline das correcoes operacionais"
```

---

### Task 1: PR 1 — Conter submit repetido e releitura de históricos

**Files:**
- Modify: `app.js:10270-10340`
- Modify: `src/application/invoice-service.js:265-285`
- Create: `tests/unit/invoice-submit-guard.test.js`
- Modify: `tests/unit/operational-write-refresh-policy.test.js`
- Test: `tests/e2e/prontuario-invoice-submit.spec.js`

**Interfaces:**
- Consumes: `radarInvoiceService.save(input)` e política existente `remoteRefreshExemptEntities`.
- Produces: um gesto em andamento gera uma chamada; `invoice:save` declara no núcleo que `administrativeLogs` não precisa ser relido.

- [ ] **Step 1: Escrever teste RED da guarda síncrona**

O teste de navegador deve atrasar a primeira resposta e emitir clique duplo e Enter + clique:

```javascript
let calls = 0;
await page.route('**/rest/v1/rpc/save_invoice_with_effects', async route => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.continue();
});

await page.getByRole('button', { name: /salvar/i }).dblclick();
await expect(page.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
expect(calls).toBe(1);
```

- [ ] **Step 2: Confirmar RED**

Run:

```bash
npx playwright test tests/e2e/prontuario-invoice-submit.spec.js --project=chromium
```

Expected: FAIL porque o segundo submit ainda alcança o serviço.

- [ ] **Step 3: Implementar a guarda no início do handler**

Manter o estado fora do ciclo assíncrono e restaurá-lo em `finally`:

```javascript
let invoiceSaveInFlight = false;

async function salvarDadosNota(event) {
    event.preventDefault();
    if (invoiceSaveInFlight) return false;

    const form = event.currentTarget;
    const submit = form?.querySelector('button[type="submit"]');
    const originalLabel = submit?.textContent || 'Salvar';
    invoiceSaveInFlight = true;
    if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
        submit.textContent = 'Salvando…';
    }

    try {
        return await salvarDadosNotaUmaVez(form);
    } finally {
        invoiceSaveInFlight = false;
        if (submit) {
            submit.disabled = false;
            submit.removeAttribute('aria-busy');
            submit.textContent = originalLabel;
        }
    }
}
```

Na implementação real, extrair o corpo atual para `salvarDadosNotaUmaVez()` sem mudar suas regras.

- [ ] **Step 4: Declarar dispensa de refresh diretamente no comando**

Em `InvoiceService.save()`:

```javascript
return this.dataService.execute({
    name: 'invoice:save',
    changedEntities: [
        'registeredInvoices',
        'assets',
        'verifications',
        'administrativeLogs'
    ],
    remoteRefreshExemptEntities: ['administrativeLogs'],
    persist: this.createPersistence('save'),
    mutate: () => {
        // corpo vigente, sem no-op neste PR
    }
});
```

- [ ] **Step 5: Provar que a política funciona sem a extensão opcional**

O teste unitário deve capturar o comando enviado ao DataService:

```javascript
assert.deepEqual(captured.remoteRefreshExemptEntities, ['administrativeLogs']);
assert.equal(captured.name, 'invoice:save');
```

- [ ] **Step 6: Rodar gate focado**

```bash
node --test \
  tests/unit/invoice-submit-guard.test.js \
  tests/unit/operational-write-refresh-policy.test.js \
  tests/unit/invoice-asset-transition-persistence.test.js
npx playwright test tests/e2e/prontuario-invoice-submit.spec.js --project=chromium
```

Expected: uma chamada por gesto; botão bloqueado; erro restaura o botão; inclusão e edição continuam funcionando; caminho normal não busca `administrativeLogs`.

- [ ] **Step 7: Commit**

```bash
git add app.js src/application/invoice-service.js tests/
git commit -m "fix: conter envios repetidos de despesas"
```

**Rollback:** restaurar handler e declaração de refresh. Não existe migration nem reparo a reverter.

---

### Task 2: PR 2 — Criar regra única da Assessoria e no-op semântico

**Files:**
- Create: `src/domain/service-advisory.js`
- Create: `src/domain/invoice-effects.js`
- Modify: `src/application/invoice-service.js`
- Modify: `src/application/verification-service.js`
- Modify: `src/integration/product-extensions-bootstrap.js`
- Create: `tests/unit/service-advisory-domain.test.js`
- Create: `tests/unit/invoice-effects.test.js`
- Create: `tests/unit/invoice-service-semantic-noop.test.js`
- Modify: `tests/unit/invoice-asset-transition-persistence.test.js`

**Interfaces:**
- Consumes: NFs do contexto, avaliação vigente, bem vinculado e entrada normalizada.
- Produces: `RadarServiceAdvisory.aggregate(invoices)` e `RadarInvoiceEffects.plan(input)`; `InvoiceService.save()` retorna `{ unchanged: true }` somente sem efeitos persistentes.

- [ ] **Step 1: Escrever testes RED da regra canônica**

```javascript
assert.deepEqual(advisory.aggregate([]), {
    delivery: 'Não se aplica',
    sent: false,
    analysis: 'Correto',
    invoiceCount: 0
});

assert.equal(advisory.aggregate([{ tipo: 'servico' }]).delivery, 'Não');
assert.equal(advisory.aggregate([
    { tipo: 'servico', consultaAssessoriaEnviada: true, analiseConsultaAssessoria: 'Correto' }
]).delivery, 'Sim');
```

- [ ] **Step 2: Criar `service-advisory.js` como módulo UMD puro**

```javascript
(function install(root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarServiceAdvisory = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createApi() {
    function aggregate(invoices = []) {
        const serviceInvoices = invoices.filter(invoice => invoice?.tipo === 'servico');
        if (serviceInvoices.length === 0) {
            return Object.freeze({
                delivery: 'Não se aplica', sent: false,
                analysis: 'Correto', invoiceCount: 0
            });
        }
        const sent = serviceInvoices.every(invoice => invoice.consultaAssessoriaEnviada === true);
        const analyses = serviceInvoices.map(invoice => invoice.analiseConsultaAssessoria || 'Não analisado');
        const analysis = analyses.includes('Incorreto') ? 'Incorreto'
            : analyses.includes('Não analisado') ? 'Não analisado'
                : analyses.includes('Correto (Atrasado)') ? 'Correto (Atrasado)'
                    : 'Correto';
        return Object.freeze({
            delivery: sent ? 'Sim' : 'Não', sent, analysis,
            invoiceCount: serviceInvoices.length
        });
    }
    return Object.freeze({ aggregate });
}));
```

- [ ] **Step 3: Fazer os dois serviços consumirem a mesma função**

Remover `aggregateServiceAdvisories()` privado de `invoice-service.js`. `syncServiceRequirement()` e a transição de Nota Fiscal em `VerificationService` devem chamar `RadarServiceAdvisory.aggregate()` depois de qualquer mudança relevante.

Resultado obrigatório da transição N/A → Sim/Não sem NF de serviço:

```javascript
verification.bonificacao.consAssessoria = 'Não se aplica';
verification.bonificacao.consEnviada = false;
verification.analise.consAssessoria = 'Correto';
```

- [ ] **Step 4: Escrever o planejador de efeitos**

`RadarInvoiceEffects.plan()` deve devolver flags explícitas:

```javascript
const plan = invoiceEffects.plan({
    currentInvoice,
    desiredInvoice,
    currentAsset,
    desiredAsset,
    currentVerification,
    desiredVerification
});

assert.deepEqual(Object.keys(plan.changed).sort(), [
    'asset', 'invoice', 'verification'
]);
assert.equal(plan.unchanged,
    !plan.changed.invoice && !plan.changed.asset && !plan.changed.verification);
```

Comparar valores de domínio normalizados; ignorar somente metadados gerados pelo servidor (`row_version`, timestamps técnicos). Não ignorar tipo, vínculo patrimonial, estado da Assessoria ou consolidação.

- [ ] **Step 5: Implementar no-op somente depois do plano**

Antes de criar log, reabrir consolidação ou chamar a RPC:

```javascript
if (effectPlan.unchanged) {
    return {
        operation: 'unchanged',
        unchanged: true,
        invoice: cloneValue(existing),
        asset: currentAsset ? cloneValue(currentAsset) : null,
        verification: context.verification ? cloneValue(context.verification) : null,
        warnings: []
    };
}
```

Se campos visíveis forem iguais, mas Assessoria/bem/consolidação estiver incoerente, `effectPlan.unchanged` deve ser `false` e a operação deve reconciliar o derivado.

- [ ] **Step 6: Rodar testes focados**

```bash
node --test \
  tests/unit/service-advisory-domain.test.js \
  tests/unit/invoice-effects.test.js \
  tests/unit/invoice-service-semantic-noop.test.js \
  tests/unit/invoice-asset-transition-persistence.test.js
```

Expected: zero/uma/várias NFs cobertas; N/A → Sim/Não nunca deixa Assessoria vazia; no-op não cria RPC/log/versão; derivado incoerente é corrigido.

- [ ] **Step 7: Commit em ordem segura**

```bash
git add src/domain/service-advisory.js tests/unit/service-advisory-domain.test.js
git commit -m "refactor: centralizar regra da assessoria"
git add src/domain/invoice-effects.js src/application/ tests/unit/
git commit -m "fix: aplicar no-op semantico a despesas"
```

**Rollback:** reverter o PR restaura a implementação anterior. Nenhum dado é reparado neste PR.

---

### Task 3: PR 3 — Substituir polling por prontidão funcional seletiva

**Files:**
- Create: `src/integration/product-extension-readiness.js`
- Modify: `src/integration/product-extensions-bootstrap.js`
- Modify: `src/integration/atomic-analysis-pendency.js`
- Modify: `src/integration/service-advisory-pendency.js`
- Modify: `src/integration/service-advisory-corrective-submission.js`
- Modify: `src/integration/operational-write-performance.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Create: `tests/unit/product-extension-readiness.test.js`
- Modify: `tests/unit/operational-write-diagnostics-integration.test.js`

**Interfaces:**
- Consumes: nome do módulo, criticidade e resultado real de `install(root)`.
- Produces: `RadarProductExtensionReadiness.markInstalled()`, `.markFailed()`, `.whenReady()` e `.snapshot()`.

- [ ] **Step 1: Escrever testes RED**

```javascript
const registry = readiness.createRegistry();
registry.declare('atomic-analysis-pendency', { critical: true });
registry.declare('operational-write-diagnostics', { critical: false });
registry.markFailed('operational-write-diagnostics', new Error('offline'));
registry.markInstalled('atomic-analysis-pendency');

assert.equal((await registry.whenReady('atomic-analysis-pendency')).status, 'installed');
assert.equal(registry.snapshot()['operational-write-diagnostics'].status, 'failed');
```

Adicionar teste de carga simulada de 15 s sem timeout artificial e teste em que um script auxiliar falha, mas o crítico posterior carrega.

- [ ] **Step 2: Implementar registro de estados**

Estados permitidos:

```javascript
const STATES = new Set(['declared', 'loaded', 'installed', 'failed']);
```

`whenReady(name)` resolve em `installed` ou `failed`; não usa polling e não possui prazo arbitrário. `snapshot()` retorna cópia congelada sem expor mutadores.

- [ ] **Step 3: Isolar falhas no bootstrap sequencial**

Substituir o `reduce(...).catch(...)` que encerra toda a cadeia por sequência que continua:

```javascript
async function loadScriptsSequentially(scripts) {
    const results = [];
    for (const src of scripts) {
        try {
            await loadScriptOnce(src);
            results.push({ src, loaded: true });
        } catch (error) {
            results.push({ src, loaded: false, error });
            console.error(`Falha ao carregar ${src}.`, error);
        }
    }
    return results;
}
```

`RadarProductExtensionsReady` continua informando carregamento geral, mas controles críticos consultam o registry funcional.

- [ ] **Step 4: Remover os timers de dez segundos dos módulos migrados**

Cada módulo chama `markInstalled(name)` somente se `install(root) === true`. Ao falhar, chama `markFailed(name, error)`. Diagnóstico e performance são auxiliares; pendência atômica e Assessoria são críticos para seus controles.

- [ ] **Step 5: Desabilitar somente o controle dependente**

Exemplo para análise incorreta:

```javascript
const state = readiness.snapshot()['atomic-analysis-pendency'];
control.disabled = state?.status !== 'installed';
control.setAttribute('aria-describedby', 'atomic-analysis-readiness-message');
```

Não bloquear Dashboard, Carteira ou todo o RADAR por falha de um módulo localizado.

- [ ] **Step 6: Rodar testes**

```bash
node --test \
  tests/unit/product-extension-readiness.test.js \
  tests/unit/operational-write-diagnostics-integration.test.js \
  tests/unit/operational-write-performance-policy.test.js
```

Expected: carga de 15 s instala; falha auxiliar não interrompe a cadeia; controle crítico não fica ativo sem módulo; diagnóstico ausente não bloqueia operação.

- [ ] **Step 7: Commit**

```bash
git add src/integration/ tests/unit/
git commit -m "fix: tornar extensoes criticas deterministicamente prontas"
```

**Rollback:** restaurar bootstrap anterior e módulos; não existe migration.

---

### Task 4: PR 4 — Reparar somente contextos ainda inconsistentes

**Files:**
- Create: `supabase/migrations/20260825000100_reconcile_empty_service_advisory.sql`
- Create: `tests/db/20260825000100_reconcile_empty_service_advisory.test.sql`
- Create: `docs/evidence/2026-08-25-service-advisory-data-fix.md`

**Interfaces:**
- Consumes: regra do PR 2 já publicada e conjunto autorizado de quatro identidades.
- Produces: zero a quatro avaliações reconciliadas para `Não se aplica`; nenhuma linha fora do conjunto.

- [ ] **Step 1: Escrever teste de banco RED em ambiente descartável**

O teste deve criar três categorias:

```text
A: linha autorizada, Assessoria vazia, zero NF serviço → deve corrigir
B: linha autorizada, Assessoria não vazia → deve preservar
C: linha não autorizada, Assessoria vazia, zero NF serviço → migration deve abortar
```

- [ ] **Step 2: Criar predicado explícito da migration**

O conjunto permitido é:

```sql
VALUES
  ('04.10.002', '2026-03', 'CONECTADA'),
  ('04.10.002', '2026-08', 'BASIC'),
  ('04.31.001', '2026-08', 'BASIC'),
  ('04.31.804', '2026-05', 'BASIC')
```

Antes de usar os IDs de programa acima, confirmar os identificadores canônicos no remoto e nos dados do SHA. Se o valor real divergir, atualizar o teste e a migration no mesmo PR antes da execução.

- [ ] **Step 3: Fazer a migration falhar diante de contexto inesperado**

A migration deve contar qualquer avaliação vazia sem NF de serviço fora do conjunto e executar `RAISE EXCEPTION` se a contagem for maior que zero. Dentro do conjunto, atualizar somente valores vazios.

Resultado desejado:

```json
{
  "consAssessoria": "Não se aplica",
  "consEnviada": false
}
```

e análise:

```json
{
  "consAssessoria": "Correto"
}
```

- [ ] **Step 4: Rodar banco descartável**

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Expected: caso A corrigido; B preservado; C aborta; segunda execução é idempotente.

- [ ] **Step 5: Preparar consulta antes/depois e rollback**

O documento de evidência deve registrar IDs, valores anteriores, valores posteriores, quantidade elegível e comando de reversão baseado no snapshot. Não executar reversão nem reparo sem janela/autorização operacional.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/ tests/db/ docs/evidence/
git commit -m "fix: reconciliar assessoria sem nota de servico"
```

**Gate de publicação:** PR 2 já publicado; consulta final sem divergência; caso `04.10.002/2026-03/CONECTADA` consolidável quando os demais itens estiverem completos.

---

### Task 5: PR 5 — Adicionar idempotência de servidor por intenção

**Files:**
- Create: `supabase/migrations/20260825000200_invoice_operation_idempotency.sql`
- Modify: `src/application/invoice-service.js`
- Modify: `src/data/supabase-repository.js`
- Create: `src/domain/operation-key.js`
- Create: `tests/unit/operation-key.test.js`
- Create: `tests/unit/invoice-idempotency.test.js`
- Create: `tests/db/20260825000200_invoice_operation_idempotency.test.sql`
- Modify: `tests/unit/supabase-repository.test.js`

**Interfaces:**
- Consumes: uma chave UUID gerada uma vez por intenção e reutilizada em retry.
- Produces: `RadarOperationKey.create()`; RPC aceita `p_operation_key` opcional e devolve o mesmo resultado para a mesma operação/chave/payload.

- [ ] **Step 1: Escrever testes RED da chave no cliente**

```javascript
const first = operationKey.create();
assert.match(first, /^[0-9a-f-]{36}$/i);
assert.equal(operationKey.reuse(first), first);
assert.notEqual(operationKey.create(), first);
```

A chave deve nascer ao iniciar a intenção, não dentro de cada tentativa de `save()`.

- [ ] **Step 2: Escrever teste concorrente RED da RPC**

Duas transações simultâneas com a mesma chave e payload devem produzir:

```text
1 registered_invoice
1 administrative_log
1 resultado compartilhado
```

Duas chaves diferentes com conteúdo igual devem produzir duas despesas.

- [ ] **Step 3: Criar armazenamento privado de operações**

Migration:

```sql
create table if not exists public.operation_idempotency (
  operation_name text not null,
  operation_key uuid not null,
  actor_user_id uuid not null,
  request_hash text not null,
  result jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (operation_name, operation_key, actor_user_id)
);

revoke all on public.operation_idempotency from anon, authenticated;
```

O acesso ocorre apenas dentro da RPC autorizada. A mesma chave com `request_hash` diferente deve falhar com erro explícito.

- [ ] **Step 4: Reservar e reutilizar dentro da transação da RPC**

`save_invoice_with_effects` recebe `p_operation_key uuid default null`. Cliente antigo sem chave segue o contrato anterior durante rollout. Com chave:

```sql
insert into public.operation_idempotency (
  operation_name, operation_key, actor_user_id, request_hash
) values (
  'invoice:save', p_operation_key, auth.uid(), v_request_hash
)
on conflict do nothing;
```

Depois, selecionar a linha `for update`; se `completed_at` estiver preenchido e o hash coincidir, retornar `result`. Caso contrário, executar os efeitos uma vez e gravar o resultado antes do commit.

- [ ] **Step 5: Encaminhar a chave pelo serviço e repositório**

```javascript
return repository.saveInvoiceWithEffects({
    invoice,
    asset,
    verificationPatch,
    administrativeLog,
    operationKey: value.operationKey,
    expectedInvoiceVersion,
    expectedAssetVersion,
    expectedVerificationVersion
});
```

```javascript
p_operation_key: input.operationKey || null
```

- [ ] **Step 6: Testar falha depois do commit + retry**

Simular perda da primeira resposta e repetir a mesma chave. Expected: o segundo retorno recupera o resultado persistido sem nova despesa/log.

- [ ] **Step 7: Rodar gates**

```bash
node --test \
  tests/unit/operation-key.test.js \
  tests/unit/invoice-idempotency.test.js \
  tests/unit/supabase-repository.test.js
npm run supabase:test:db
npm run supabase:lint:db
```

- [ ] **Step 8: Commit**

```bash
git add src/ supabase/migrations/ tests/
git commit -m "feat: tornar gravacao de despesas idempotente por intencao"
```

**Rollback:** cliente volta a omitir chave; migration de rollback remove o parâmetro/estrutura somente depois de confirmar ausência de clientes dependentes.

---

### Task 6: PR 6 — Consolidar contrato funcional da fila de Pendências

**Files:**
- Create: `src/domain/pendency-queue-model.js`
- Create: `src/domain/pendency-action-model.js`
- Modify: `src/domain/operational-projection.js`
- Modify: `src/domain/pendencias-view-model.js`
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Create: `tests/unit/pendency-queue-model.test.js`
- Create: `tests/unit/pendency-action-model.test.js`
- Modify: `tests/pendency-cancelled-reopen.test.js`
- Modify: `tests/pendencias-view-model.test.js`

**Interfaces:**
- Consumes: registros projetados, perfil/capacidades e `getOperationalBaseDate(pendency)`.
- Produces: `RadarPendencyQueueModel.create(input)` e `RadarPendencyActionModel.forRecord(record, access)`.

- [ ] **Step 1: Escrever teste RED do tempo canônico**

```javascript
const reopened = {
    status: 'Aberta',
    dataAbertura: '2026-01-01T00:00:00Z',
    historico: [{ tipo: 'reabertura', dataHora: '2026-08-24T12:00:00Z' }]
};
assert.equal(queue.operationalBaseDate(reopened), '2026-08-24T12:00:00Z');
```

Lista, filtro e ordenação devem usar a mesma função de `operational-projection.js`.

- [ ] **Step 2: Escrever teste RED da aba inicial orientada ao trabalho**

```javascript
const model = queue.create({
    records: [openRecord, awaitingRecord],
    access: { canReanalyze: true }
});
assert.equal(model.initialTab, 'aguardando');
```

Se o perfil não puder reanalisar, abrir `aberta` quando houver trabalho correspondente. Registro explicitamente selecionado prevalece.

- [ ] **Step 3: Escrever matriz RED das ações**

```javascript
assert.equal(actions.forRecord(openRecord, controller).primary.id, 'register-attempt');
assert.equal(actions.forRecord(awaitingRecord, controller).primary.id, 'reanalyze');
assert.equal(actions.forRecord(cancelledRecord, controller).primary.id, 'view-history');
assert(actions.forRecord(cancelledRecord, controller).secondary.some(a => a.id === 'reopen'));
assert.equal(actions.forRecord(resolvedRecord, sme).destructive, null);
```

- [ ] **Step 4: Implementar `PendencyActionModel` sem DOM**

Formato:

```javascript
{
    primary: { id: 'reanalyze', label: 'Reanalisar' },
    secondary: [
        { id: 'view-details', label: 'Ver detalhes' },
        { id: 'open-record', label: 'Abrir no Prontuário' },
        { id: 'register-contact', label: 'Registrar contato' }
    ],
    destructive: { id: 'cancel', label: 'Cancelar pendência' }
}
```

Capacidade/perfil remove ações antes de renderizar. `MutationObserver` não pode acrescentar regra essencial depois.

- [ ] **Step 5: Alinhar PEND-05**

`task-10-11-pendency-actions.js` deve aceitar `Resolvida` e `Cancelada` quando `actionModel` expuser `reopen`. O handler não mantém uma lista própria divergente.

- [ ] **Step 6: Rodar testes**

```bash
node --test \
  tests/unit/pendency-queue-model.test.js \
  tests/unit/pendency-action-model.test.js \
  tests/pendency-cancelled-reopen.test.js \
  tests/pendencias-view-model.test.js \
  tests/unit/pendency-service-access.test.js \
  tests/unit/pendency-reanalysis-roles.test.js
```

Expected: domínio, lista, filtro, ordenação, aba inicial e permissões mostram a mesma verdade.

- [ ] **Step 7: Commit**

```bash
git add src/domain/ src/integration/task-9-pendencias-page.js \
  src/integration/task-10-11-pendency-actions.js tests/
git commit -m "refactor: unificar contrato operacional de pendencias"
```

**Rollback:** restaurar projeção e ações anteriores; nenhuma migration.

---

### Task 7A: PR 7A — Redesenhar fila, filtros e cartões

**Files:**
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/pendency-passive-queue-ux.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/pendency-passive-queue.css`
- Create: `tests/e2e/pendency-queue-filters.spec.js`
- Create: `tests/e2e/pendency-queue-mobile.spec.js`
- Create: `tests/unit/pendency-filter-options.test.js`

**Interfaces:**
- Consumes: `PendencyQueueModel` e `PendencyActionModel` do PR 6.
- Produces: fila pesquisável, combinável e visualmente hierárquica sem alterar persistência.

- [ ] **Step 1: Escrever testes RED dos filtros operacionais**

Cobrir combinações:

```text
Minha carteira/Todas
R.A.
Controlador
escola pesquisável
competência
programa
documento
tempo na etapa
```

As faixas canônicas são:

```javascript
const AGE_BUCKETS = [
    { id: 'today', min: 0, max: 0, label: 'Hoje' },
    { id: '1-3', min: 1, max: 3, label: '1–3 dias' },
    { id: '4-7', min: 4, max: 7, label: '4–7 dias' },
    { id: '8-15', min: 8, max: 15, label: '8–15 dias' },
    { id: '16+', min: 16, max: null, label: '16 dias ou mais' }
];
```

- [ ] **Step 2: Promover os filtros essenciais**

Visíveis sem abrir `Mais filtros`:

```text
Minha carteira/Todas
Busca global
R.A.
Controlador
Escola
Tempo na etapa
```

Competência, programa e documento permanecem disponíveis na área expandida. Não criar filtro de status; as abas já cumprem essa função.

- [ ] **Step 3: Substituir select nativo de escola por combobox acessível**

O combobox deve buscar por nome, designação e código, suportar teclado e anunciar resultados:

```html
<input role="combobox"
       aria-autocomplete="list"
       aria-expanded="false"
       aria-controls="pendency-school-options">
<ul id="pendency-school-options" role="listbox"></ul>
```

- [ ] **Step 4: Renderizar cartão compacto com hierarquia fixa**

Ordem visual:

```text
status + tempo na etapa
escola + designação + R.A.
competência + programa
documento
próxima ação + responsável atual
erro atual + tentativas
ação principal + menu Mais ações
```

Somente `actionModel.primary` vira botão dominante. Secundárias entram em menu; cancelamento fica separado e exige confirmação.

- [ ] **Step 5: Validar mobile e acessibilidade**

```bash
npx playwright test tests/e2e/pendency-queue-filters.spec.js --project=chromium
npx playwright test tests/e2e/pendency-queue-mobile.spec.js
```

Viewports mínimos: 360, 390, 412 e 768 px. Expected: sem corte, sobreposição ou rolagem horizontal; foco visível; retorno de foco ao fechar menus.

- [ ] **Step 6: Testar a regra transversal**

Selecionar outra competência global e reabrir Pendências. Expected: a fila continua em Todas as competências até o usuário aplicar filtro local.

- [ ] **Step 7: Commit**

```bash
git add src/integration/task-9-pendencias-page.js \
  src/integration/pendency-passive-queue-ux.js src/styles/ tests/
git commit -m "feat: reorganizar fila e filtros de pendencias"
```

**Rollback:** reverter somente superfície/CSS; modelos do PR 6 permanecem válidos.

---

### Task 7B: PR 7B — Estruturar detalhe, reanálise e agrupamento opcional

**Files:**
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `app.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/pendency-passive-queue.css`
- Create: `tests/e2e/pendency-detail-reanalysis.spec.js`
- Create: `tests/e2e/pendency-grouping.spec.js`
- Create: `tests/unit/pendency-detail-content.test.js`

**Interfaces:**
- Consumes: modelos do PR 6 e filtros/cartões do PR 7A.
- Produces: detalhe com divulgação progressiva, reanálise orientada à decisão e agrupamento por escola sem perder prioridade global.

- [ ] **Step 1: Escrever teste RED do conteúdo por estado**

```javascript
assert.equal(detail.sectionTitle(cancelledRecord, 'errors'), 'Motivo e registro da pendência');
assert.equal(detail.sectionTitle(openRecord, 'errors'), 'Erro atual');
```

Pendência cancelada não usa título `Erros atuais`. Resolvida/cancelada preserva histórico, mas reduz peso operacional.

- [ ] **Step 2: Reestruturar detalhe em drawer**

Seções:

```text
Cabeçalho: documento, escola, status, competência, programa
Resumo: próxima ação, responsável, Controlador, abertura, última movimentação, tempo
Situação/erro
Observação de abertura
Tentativas de envio
Contatos
Linha do tempo
Rodapé: uma ação principal + Mais ações
```

Tentativas, contatos e linha do tempo podem iniciar recolhidos quando longos, mantendo contagem e acesso.

- [ ] **Step 3: Reestruturar modal de reanálise**

Cabeçalho:

```text
Reanalisar pendência documental
Escola · competência · programa · documento
```

Painel A `Situação atual`: estado, próximo ator, erro e data de disponibilização. Painel B `Último envio`: tentativa, data e observação. Painel C `Decisão`: resultado e observação. Painel D `Efeito da decisão`:

```text
Correto encerra a pendência.
Incorreto inicia novo ciclo e devolve a providência à escola.
```

Eliminar apresentação duplicada como `Junho/2026 (2026-06)`.

- [ ] **Step 4: Implementar agrupamento opcional por escola**

O padrão inicial permanece lista cronológica. Alternância `Agrupar por escola` cria cabeçalhos com contagens e expande registros já ordenados pelo modelo. Não adicionar ações de contato/prontuário no grupo.

- [ ] **Step 5: Validar jornadas**

```bash
npx playwright test tests/e2e/pendency-detail-reanalysis.spec.js
npx playwright test tests/e2e/pendency-grouping.spec.js
```

Expected: usuário identifica contexto e efeito da decisão; histórico preservado; ação correta aparece; agrupamento pode ser desligado sem perder filtros/rolagem.

- [ ] **Step 6: Homologação humana curta**

Executar roteiro com pelo menos um Controlador e uma Assistente:

```text
localizar pendência definida
identificar escola/competência/documento
abrir detalhe
executar ou descrever a ação principal
reanalisar tentativa de teste
retornar à fila
```

Registrar tempo, erros de interpretação e comparação com baseline.

- [ ] **Step 7: Commit**

```bash
git add app.js src/integration/ src/styles/ tests/
git commit -m "feat: orientar detalhe e reanalise de pendencias"
```

**Rollback:** reverter drawer/modal/agrupamento; fila e modelos continuam operacionais.

---

### Task 8: PR 8 — Completar resposta autoritativa e aplicação incremental

**Files:**
- Create: `supabase/migrations/20260825000300_expand_invoice_authoritative_result.sql`
- Modify: `src/data/supabase-repository.js`
- Modify: `src/application/data-service.js`
- Modify: `src/application/invoice-service.js`
- Modify: `src/integration/operational-write-diagnostics.js`
- Create: `tests/unit/invoice-authoritative-result.test.js`
- Modify: `tests/unit/data-service-authoritative-commit.test.js`
- Modify: `tests/unit/invoice-asset-transition-persistence.test.js`
- Modify: `tests/unit/supabase-repository.test.js`
- Create: `tests/db/20260825000300_expand_invoice_authoritative_result.test.sql`

**Interfaces:**
- Consumes: operação idempotente do PR 5 e planejador de efeitos do PR 2.
- Produces: resposta completa com entidades alteradas/retiradas e aplicação local sem refetch global.

- [ ] **Step 1: Escrever contrato RED da resposta**

Formato obrigatório:

```javascript
{
    operationKey: 'uuid',
    invoice: {},
    asset: {},
    deletedAssetId: null,
    verification: {},
    administrativeLog: {},
    changedEntities: ['registeredInvoices', 'assets', 'verifications', 'administrativeLogs'],
    rowVersions: {
        invoice: 2,
        asset: 3,
        verification: 8,
        administrativeLog: null
    }
}
```

Campos sem entidade devem ser `null`, não omitidos ambiguamente.

- [ ] **Step 2: Cobrir remoção patrimonial antes de ativar modo autoritativo**

Transição `permanente → consumo/serviço/a_identificar` deve devolver `deletedAssetId`. O teste do DataService começa com o bem na coleção e verifica sua ausência depois da aplicação incremental.

```javascript
assert.equal(state.assets.some(asset => asset.id === result.deletedAssetId), false);
```

- [ ] **Step 3: Ampliar a RPC na migration**

`save_invoice_with_effects` e a normalização do repositório devem devolver a despesa, o bem atual, o ID removido, a avaliação, o log criado, versões, chave de operação e entidades alteradas dentro do mesmo commit.

- [ ] **Step 4: Normalizar nomes no repositório**

```javascript
return {
    operationKey: row.operation_key || null,
    invoice: row.invoice || null,
    asset: row.asset || null,
    deletedAssetId: row.deleted_asset_id || null,
    verification: row.verification || null,
    administrativeLog: row.administrative_log || null,
    changedEntities: Array.isArray(row.changed_entities) ? row.changed_entities : [],
    rowVersions: row.row_versions || {}
};
```

- [ ] **Step 5: Aplicar entidades e remoções explicitamente**

O DataService deve aceitar instrução de remoção separada de upsert:

```javascript
await statePort.applyEntityChanges({
    upserts: {
        registeredInvoices: [result.invoice],
        assets: result.asset ? [result.asset] : [],
        verifications: [result.verification],
        administrativeLogs: [result.administrativeLog]
    },
    removals: {
        assets: result.deletedAssetId ? [result.deletedAssetId] : []
    },
    source: 'invoice-authoritative-result'
});
```

- [ ] **Step 6: Ativar resposta autoritativa somente após os testes de remoção**

Em `InvoiceService.save()`:

```javascript
remoteResultIsAuthoritative: true,
incrementalStateEntities: [
    'registeredInvoices', 'assets', 'verifications', 'administrativeLogs'
]
```

Não ativar se log, versões ou remoções estiverem incompletos.

- [ ] **Step 7: Centralizar métricas agregadas sem dados de negócio**

Enviar somente tempos e resultado técnico agregados para destino aprovado. Payload proibido: escola, usuário, competência, programa, NF, pendência, texto ou UUID de entidade. O diagnóstico local continua funcionando se o envio central falhar.

- [ ] **Step 8: Rodar gates**

```bash
node --test \
  tests/unit/invoice-authoritative-result.test.js \
  tests/unit/data-service-authoritative-commit.test.js \
  tests/unit/invoice-asset-transition-persistence.test.js \
  tests/unit/supabase-repository.test.js
npm run supabase:test:db
npm run supabase:lint:db
```

Expected: nenhuma releitura global no sucesso; estado local correto em todas as transições; retry idempotente; auditoria disponível imediatamente.

- [ ] **Step 9: Commit**

```bash
git add src/ supabase/migrations/ tests/
git commit -m "perf: aplicar resultado completo da gravacao de despesas"
```

**Rollback:** desligar flags autoritativas antes de reverter a migration; o caminho conservador de refresh continua disponível.

---

## 3. Matriz final de aceite

| Cenário | Resultado obrigatório | PR |
|---|---|---:|
| Clique duplo ou Enter + clique | Uma operação; feedback imediato | 1 |
| Edição igual, derivados coerentes | `unchanged: true`; zero RPC/log/versão | 2 |
| Campos iguais, derivado incoerente | Reconciliar; não retornar no-op | 2 |
| Sem NF de serviço | Assessoria persistida como N/A | 2 |
| N/A → Sim/Não | Assessoria nunca vazia | 2 |
| Carga de 15 s | Módulo crítico instala e ação funciona | 3 |
| Falha auxiliar | Não bloqueia módulo crítico posterior | 3 |
| Quatro contextos auditados | Zero divergências depois do reparo | 4 |
| Mesma chave repetida | Mesmo resultado, sem novo efeito | 5 |
| Duas chaves/conteúdo igual | Duas despesas permitidas | 5 |
| Pendência reaberta | Tempo reinicia na transição mais recente | 6 |
| Cancelada autorizada | Reabrir disponível conforme PEND-05 | 6 |
| Todas as competências | Competência global não filtra implicitamente | 7A |
| Minha carteira | Um gesto alterna para Todas | 7A |
| Cartão aberto | Uma ação principal, secundárias em menu | 7A |
| Modal de reanálise | Contexto separado da decisão e efeito explicado | 7B |
| Agrupamento por escola | Opcional; prioridade global preservada | 7B |
| Permanente → outro tipo | Bem removido também do estado local | 8 |
| Sucesso da RPC | Sem refetch global; log/versões disponíveis | 8 |

## 4. Self-review do plano

### Cobertura da especificação

- duplicação e lentidão: Tasks 1, 5 e 8;
- regra e reparo da Assessoria: Tasks 2 e 4;
- prontidão >10 s: Task 3;
- coerência de domínio/ações de Pendências: Task 6;
- filtros, hierarquia e mobile: Task 7A;
- detalhes, reanálise e agrupamento: Task 7B;
- métricas centralizadas sem dados de negócio: Task 8;
- ADR-044, histórico e regras independentes: Global Constraints e matriz de aceite.

### Consistência de interfaces

- `RadarServiceAdvisory.aggregate()` nasce no PR 2 e é consumido pelos dois serviços;
- `RadarInvoiceEffects.plan()` nasce no PR 2 e sustenta no-op e resposta incremental;
- a chave nasce no PR 5 e é incorporada à resposta no PR 8;
- `PendencyQueueModel` e `PendencyActionModel` nascem no PR 6 e são consumidos por 7A/7B;
- `deletedAssetId` é testado antes de `remoteResultIsAuthoritative: true` no PR 8.

### Escopo deliberadamente adiado

- importação direta de todas as extensões no bootstrap principal;
- migração de framework/state library;
- lazy loading global de histórico;
- `Minha R.A.` sem relação usuário ↔ R.A.;
- ações de contato/prontuário no cabeçalho de grupo;
- Figma como dependência;
- qualquer assunto do PR #195.

## 5. Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-24-plano-mestre-correcoes.md`.

Opções para uma sessão futura, depois do merge desta documentação:

1. **Subagent-Driven** — usar `superpowers:subagent-driven-development`, com um agente por tarefa e revisão entre gates.
2. **Inline Execution** — usar `superpowers:executing-plans`, executar um PR por vez e parar para validação entre entregas.

Independentemente do modo, começar pela Task 0 e PR 1. Não agrupar os nove PRs em uma única mudança.
