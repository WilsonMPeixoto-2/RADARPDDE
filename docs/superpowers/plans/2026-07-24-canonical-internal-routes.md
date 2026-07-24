# Canonical Internal Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Representar as principais telas e escolas do RADAR PDDE por URLs canônicas, restauráveis e autorizadas, preservando o fluxo atual de autenticação, History API e renderização.

**Architecture:** Criar um módulo puro de tradução URL ↔ estado, adaptar o módulo atual de histórico para utilizar esse contrato e integrar o estado de rota ao bootstrap já existente. O `app.js` continuará sendo a autoridade de renderização, recebendo apenas pequenas extensões para seção de Prontuário, filtro de escola em Pendências e links canônicos.

**Tech Stack:** JavaScript ES2022 em navegador e Node.js 24, History API, HTML/CSS legados, Node Test Runner, Playwright 1.61, Vercel rewrites.

## Global Constraints

- Não introduzir React Router ou outro framework.
- Não alterar o modelo de autorização do Supabase.
- Não exibir dados de escola antes da autenticação e da carga autorizada.
- Manter `switchView()` como ponto central de renderização.
- Preservar botão Voltar/Avançar e evitar entradas duplicadas.
- Usar TDD: teste falhando, implementação mínima, teste passando.
- As rotas aprovadas são exatamente as descritas na especificação de 24/07/2026.
- `deploymentEnabled` deve permanecer `false` fora da janela controlada de publicação.

---

### Task 1: Contrato puro de rotas

**Files:**
- Create: `src/integration/navigation-routes.js`
- Create: `tests/unit/navigation-routes.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseRoute(pathname, search)`, `buildRoute(navigationState)`, `normalizeRoute(route)`, `STATIC_ROUTE_TO_VIEW`, `VIEW_TO_STATIC_ROUTE`.

- [ ] **Step 1: Write the failing tests**

Cobrir:

```js
parseRoute('/dashboard', '')
parseRoute('/carteira', '')
parseRoute('/competencias', '')
parseRoute('/pendencias', '?escola=04.31.026')
parseRoute('/inventario', '')
parseRoute('/auditoria', '')
parseRoute('/equipe', '')
parseRoute('/gestao-sme', '')
parseRoute('/escolas/04.31.026', '')
parseRoute('/escolas/04.31.026/pendencias', '')
buildRoute({ view: 'prontuario', param: '04.31.026', section: 'pendencias' })
```

Também testar barra final, segmentos extras, escola vazia, URL codificada e canonicalização para `/dashboard`.

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
node --test tests/unit/navigation-routes.test.js
```

Expected: FAIL porque `navigation-routes.js` ainda não existe.

- [ ] **Step 3: Implement the route contract**

Criar módulo UMD compatível com Node e navegador. O estado retornado deve usar:

```js
{
  valid: true,
  view: 'prontuario',
  param: '04.31.026',
  section: 'pendencias',
  filters: Object.freeze({})
}
```

URLs inválidas devem retornar `valid: false` e rota canônica `/dashboard` via `normalizeRoute()`.

- [ ] **Step 4: Add syntax checking**

Adicionar `node --check src/integration/navigation-routes.js` ao script `check`.

- [ ] **Step 5: Run tests**

```bash
node --test tests/unit/navigation-routes.test.js
npm run check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/integration/navigation-routes.js tests/unit/navigation-routes.test.js package.json
git commit -m "feat: adicionar contrato de rotas canônicas"
```

---

### Task 2: History API com URLs canônicas

**Files:**
- Modify: `src/integration/navigation-history.js`
- Modify: `tests/unit/navigation-history.test.js`

**Interfaces:**
- Consumes: `RadarNavigationRoutes.parseRoute`, `RadarNavigationRoutes.buildRoute`.
- Produces: `createNavigationState(view, param, section, filters)`, `applyPendingRoute()`, `install()`.

- [ ] **Step 1: Extend failing tests**

Testar que:

```js
root.switchView('escolas')
```

chama `pushState(..., '', '/carteira')`, e que:

```js
root.switchView('prontuario', '04.31.026')
```

usa `/escolas/04.31.026`.

Adicionar testes para rota inicial profunda, `popstate`, seção `pendencias`, query de escola e ausência de duplicação.

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/unit/navigation-history.test.js
```

Expected: FAIL porque o módulo ainda reutiliza `location.href`.

- [ ] **Step 3: Implement URL-aware history**

- interpretar `location.pathname` e `location.search` na instalação;
- registrar estado inicial com `replaceState` e URL canônica;
- gerar a URL por `buildRoute()` em cada navegação;
- expor rota inicial pendente;
- restaurar `section` e `filters` no `popstate`;
- impedir nova entrada durante restauração.

- [ ] **Step 4: Run tests**

```bash
node --test tests/unit/navigation-history.test.js tests/unit/navigation-routes.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/integration/navigation-history.js tests/unit/navigation-history.test.js
git commit -m "feat: sincronizar histórico com URLs canônicas"
```

---

### Task 3: Bootstrap seguro da rota após autenticação

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `tests/unit/auth-frontend-contract.test.js`
- Create: `tests/unit/navigation-bootstrap.test.js`

**Interfaces:**
- Consumes: `RadarNavigationHistory.applyPendingRoute()`.
- Produces: `applyAuthorizedNavigationRoute(route)` no escopo do navegador.

- [ ] **Step 1: Write failing contract tests**

Exigir ordem:

```text
app.js
navigation-routes.js
navigation-history.js
auth-gate.js
```

O histórico pode instalar após `app.js`, mas deve manter instalação diferida segura.

Testar uma função pura/adaptador que:

- aplica escola existente;
- rejeita escola invisível;
- bloqueia `sme-config`, `equipe`, `competencias`, `pendencias` ou `auditoria` conforme perfil;
- usa `/carteira` ou `/dashboard` como fallback.

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/unit/auth-frontend-contract.test.js tests/unit/navigation-bootstrap.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement authorized route application**

No final do bootstrap:

```js
window.RadarAuthGate.applyAuthorization(dataContext.authentication);
window.RadarNavigationHistory.applyPendingRoute();
```

A aplicação da rota deve ocorrer apenas depois de `RadarDataContext.ready === true` e depois da autorização visual do perfil.

- [ ] **Step 4: Run tests**

```bash
node --test tests/unit/auth-frontend-contract.test.js tests/unit/navigation-bootstrap.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js tests/unit/auth-frontend-contract.test.js tests/unit/navigation-bootstrap.test.js
git commit -m "feat: restaurar rota autorizada após login"
```

---

### Task 4: Seção de Pendências no Prontuário e filtro geral

**Files:**
- Modify: `app.js`
- Modify: `tests/integration/task-12-13-retificacoes.test.js` ou criar teste de integração específico
- Create: `tests/unit/pendency-route-filter.test.js`

**Interfaces:**
- Produces: `activePendencySchoolFilter`, `setPendencySchoolFilter(schoolId)`, `clearPendencySchoolFilter()`, `openSchoolPendenciesRoute(schoolId)`.

- [ ] **Step 1: Write failing tests**

Cobrir:

- `/escolas/:id/pendencias` ativa `tab-pendencias`;
- `/pendencias?escola=:id` filtra ativas e resolvidas;
- limpar filtro restaura `/pendencias`;
- sair da tela remove o filtro;
- o Prontuário apresenta ação com `href="/pendencias?escola=..."`.

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/unit/pendency-route-filter.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement filter and section behavior**

- aplicar `section: 'pendencias'` após `renderProntuario()`;
- filtrar coleções no início de `renderPendencias()`;
- mostrar faixa com escola selecionada e botão "Limpar filtro";
- criar ação "Ver todas as pendências desta escola" na aba do Prontuário;
- sincronizar a URL pelo roteador.

- [ ] **Step 4: Run tests**

```bash
node --test tests/unit/pendency-route-filter.test.js tests/unit/navigation-history.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/unit/pendency-route-filter.test.js tests/integration
git commit -m "feat: adicionar rotas de pendências por escola"
```

---

### Task 5: Links reais para escolas

**Files:**
- Modify: `app.js`
- Modify: `src/integration/navigation-history.js`
- Create: `tests/unit/navigation-link-contract.test.js`

**Interfaces:**
- Produces: `buildSchoolHref(schoolId, section)`, `handleInternalRouteClick(event)`.

- [ ] **Step 1: Write failing tests**

Verificar links com `href` canônico em:

- Carteira;
- Competências;
- Pendências gerais;
- ação do Prontuário.

Testar que clique comum é interceptado e `Ctrl/Cmd`, botão central, `target` ou nova aba permanecem nativos.

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/unit/navigation-link-contract.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement link helper and interception**

O helper deve gerar HTML seguro e o interceptor deve navegar internamente apenas para clique primário sem modificadores.

- [ ] **Step 4: Run tests**

```bash
node --test tests/unit/navigation-link-contract.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js src/integration/navigation-history.js tests/unit/navigation-link-contract.test.js
git commit -m "feat: tornar escolas acessíveis por links diretos"
```

---

### Task 6: Deep links na Vercel

**Files:**
- Modify: `vercel.json`
- Create: `tests/unit/vercel-routes-contract.test.js`

**Interfaces:**
- Produces: rewrites explícitos das rotas aprovadas para `/index.html`.

- [ ] **Step 1: Write failing test**

Validar exatamente:

```text
/dashboard
/carteira
/competencias
/pendencias
/inventario
/auditoria
/equipe
/gestao-sme
/escolas/:path*
```

- [ ] **Step 2: Run test to verify failure**

```bash
node --test tests/unit/vercel-routes-contract.test.js
```

Expected: FAIL.

- [ ] **Step 3: Add rewrites**

Manter `deploymentEnabled: false` e acrescentar somente as rewrites necessárias.

- [ ] **Step 4: Run tests and build**

```bash
node --test tests/unit/vercel-routes-contract.test.js
npm run build:vercel
```

Expected: PASS e build concluído.

- [ ] **Step 5: Commit**

```bash
git add vercel.json tests/unit/vercel-routes-contract.test.js
git commit -m "feat: habilitar deep links na Vercel"
```

---

### Task 7: E2E e validação completa

**Files:**
- Create: `tests/e2e/canonical-routes.spec.js`
- Modify: documentação de arquitetura se necessário

**Interfaces:**
- Consumes: todas as rotas implementadas.

- [ ] **Step 1: Add E2E scenarios**

Cenários:

- navegação Carteira → escola → Pendências;
- URL muda sem recarga;
- atualização direta do Prontuário;
- `/escolas/:id/pendencias` ativa aba correta;
- `/pendencias?escola=:id` mantém filtro;
- abrir link em nova aba;
- Voltar e Avançar;
- rota inválida;
- escola inexistente;
- perfil Inventário em rota proibida;
- perfil SME em `/gestao-sme`.

- [ ] **Step 2: Run targeted E2E**

```bash
npx playwright test tests/e2e/canonical-routes.spec.js
```

Expected: PASS em desktop, Android e iPhone configurados pelo projeto.

- [ ] **Step 3: Run full verification**

```bash
npm run test:readiness
npm run test:e2e
npm run test:mobile
npm run build:vercel
```

Expected: todos os comandos com exit code 0.

- [ ] **Step 4: Review diff**

Confirmar:

- nenhuma alteração de RLS ou schema;
- nenhuma credencial adicionada;
- `deploymentEnabled` ainda `false`;
- rotas canônicas cobrem apenas o escopo aprovado.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/canonical-routes.spec.js docs
git commit -m "test: homologar rotas internas canônicas"
```

---

### Task 8: PR, CI e publicação controlada

**Files:**
- Modify temporariamente: `vercel.json` em branch operacional separada após merge funcional.

- [ ] **Step 1: Open functional PR**

Descrever arquitetura, rotas, autorização, testes e comportamento de fallback.

- [ ] **Step 2: Wait for CI**

Exigir checks verdes de Playwright e Supabase readiness.

- [ ] **Step 3: Merge functional PR**

Somente após CI verde.

- [ ] **Step 4: Open controlled deployment PR**

Alterar apenas `deploymentEnabled` para `true`, mergear, aguardar deployment Production `READY`, verificar rotas profundas e assets.

- [ ] **Step 5: Restore deployment lock**

Restaurar `deploymentEnabled: false` imediatamente após validação.

- [ ] **Step 6: Production smoke test**

Verificar:

```text
/dashboard
/carteira
/escolas/04.31.026
/escolas/04.31.026/pendencias
/pendencias?escola=04.31.026
```

Expected: HTTP 200, Auth Gate estável e rota preservada.
