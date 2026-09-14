# Pós-login, Prontuário e Competência Padrão Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir a espera pós-login sem reduzir garantias, reorganizar o Prontuário para priorizar a avaliação e abrir por padrão na competência do mês anterior.

**Architecture:** O bootstrap remoto continuará usando o mesmo repositório, RLS e state port, mas poderá iniciar em paralelo a leitura estrutural e a leitura contextual quando a competência inicial já for conhecida. O Prontuário continuará sendo renderizado pelo fluxo atual, com mudança apenas de composição e CSS. A regra temporal será centralizada em `RadarCompetencia` e reutilizada pelo bootstrap/seletor.

**Tech Stack:** JavaScript browser/Node 24, Supabase JS, Playwright 1.63, node:test, CSS.

**Spec:** `docs/superpowers/specs/2026-09-14-pos-login-prontuario-competencia-design.md`

## Global Constraints

- Nenhuma migration de banco.
- Nenhum relaxamento de RLS ou autorização.
- Nenhum cache persistente de dados operacionais para acelerar login.
- Nenhuma nova arquitetura de bundle/lazy-loading nesta entrega.
- Desktop permanece alvo primário; mobile não pode sofrer regressão funcional.
- Competência padrão deriva da data e nunca é fixada em `2026-08`.
- Navegação na mesma sessão preserva seleção manual de competência.

---

### Task 1: Regra temporal canônica do mês anterior

**Files:**
- Modify: `src/domain/competencia.js`
- Modify: `src/application/data-service.js`
- Modify: `src/integration/global-competence-selector.js`
- Test: `tests/unit/competencia.test.js`
- Test: `tests/unit/remote-context-bootstrap.test.js`
- Test: `tests/unit/global-competence-remote-hydration.test.js`

**Interfaces:**
- Produces: `previousCompetenceKeyFromDate(referenceDate): string`.
- Consumes: `competenceKeyFromDate` e calendário de competências existente.

- [ ] **Step 1: Write failing unit tests**

Adicionar casos que exijam `previousCompetenceKeyFromDate(new Date('2026-09-14T12:00:00')) === '2026-08'` e `previousCompetenceKeyFromDate(new Date('2026-01-10T12:00:00')) === '2025-12'`. Adicionar ao bootstrap remoto caso sem competência explícita que escolha o mês anterior quando disponível.

- [ ] **Step 2: Run RED tests**

Run: `node --test tests/unit/competencia.test.js tests/unit/remote-context-bootstrap.test.js tests/unit/global-competence-remote-hydration.test.js`
Expected: FAIL nos novos contratos.

- [ ] **Step 3: Implement minimal temporal rule**

Adicionar em `competencia.js`:

```js
function previousCompetenceKeyFromDate(referenceDate = new Date()) {
    const date = referenceDate instanceof Date ? new Date(referenceDate.getTime()) : new Date(referenceDate);
    if (Number.isNaN(date.getTime())) throw new TypeError('A data de referência da competência é inválida.');
    date.setMonth(date.getMonth() - 1);
    return competenceKeyFromDate(date);
}
```

Exportar a função. No seletor global, usar essa função para a competência de calendário inicial. No `DataService`, o fallback temporal sem `competenceId` deve representar o mês anterior e continuar validando existência no conjunto de competências antes de aplicar fallback de fechamento/última disponível.

- [ ] **Step 4: Run GREEN tests**

Run: `node --test tests/unit/competencia.test.js tests/unit/remote-context-bootstrap.test.js tests/unit/global-competence-remote-hydration.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: abrir competência operacional no mês anterior`

---

### Task 2: Bootstrap remoto paralelo e métricas de entrada

**Files:**
- Modify: `src/application/data-service.js`
- Modify: `src/data/repository-factory.js`
- Modify: `src/integration/auth-gate.js`
- Modify: `app.js`
- Test: `tests/unit/remote-context-bootstrap.test.js`
- Test: `tests/unit/remote-operational-context-query.test.js`
- Test: `tests/unit/auth-gate.test.js` (ou teste de contrato equivalente existente)

**Interfaces:**
- `DataService.bootstrap({ competenceId })` mantém o mesmo retorno.
- Métricas ficam apenas em `performance`/`window.RADAR_STARTUP_TIMINGS`, sem envio externo.

- [ ] **Step 1: Write failing concurrency tests**

No harness de `remote-context-bootstrap`, bloquear artificialmente `exportSnapshot` e comprovar que `queryOperationalContext({ competenceId })` já iniciou antes de liberar a leitura estrutural. Adicionar caso em que a competência pré-carregada não existe no calendário estrutural e o serviço descarta o prefetch e usa o fallback canônico.

- [ ] **Step 2: Run RED tests**

Run: `node --test tests/unit/remote-context-bootstrap.test.js tests/unit/remote-operational-context-query.test.js`
Expected: FAIL no contrato de concorrência.

- [ ] **Step 3: Parallelize bootstrap safely**

Quando `options.competenceId` for YYYY-MM e o repositório remoto oferecer `queryOperationalContext`, iniciar em paralelo:

```js
const structuralPromise = repository.exportSnapshot(...);
const contextPromise = repository.queryOperationalContext({ competenceId: requested });
const current = await structuralPromise;
```

Após validar o calendário estrutural, usar `contextPromise` somente se `requested` for a competência resolvida; caso contrário, descartar o resultado e consultar o fallback correto. Nunca aplicar contexto antes da validação estrutural.

- [ ] **Step 4: Reduce independent serial work inside operational query**

Depois da primeira bateria mensal/ativa, iniciar `assetInvoices` em paralelo com tentativas, contatos, verificações dependentes e notas históricas, pois depende apenas de `activeAssets`. Iniciar `dependencyInvoices` assim que `assetInvoices` estiver disponível, sem aguardar trabalho não relacionado. Preservar exatamente as coleções retornadas e `uniqueById`.

- [ ] **Step 5: Add browser timing marks**

Marcar `radar:login-submit`, `radar:auth-ready`, `radar:bootstrap-start`, `radar:bootstrap-ready`, `radar:workspace-ready`. Publicar um resumo somente em memória em `window.RADAR_STARTUP_TIMINGS` após liberação do workspace.

- [ ] **Step 6: Run focused GREEN tests**

Run: `node --test tests/unit/remote-context-bootstrap.test.js tests/unit/remote-operational-context-query.test.js tests/unit/auth-gate*.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

Commit: `perf: reduzir espera serial no pós-login`

---

### Task 3: Cabeçalho sticky e dados cadastrais recolhíveis

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `src/styles/prontuario-operational-ux.css` se necessário para regras específicas da superfície
- Modify: `tests/unit/prontuario-integridade-ui-contract.test.js`
- Modify: `tests/unit/prontuario-layout-polish.test.js`
- Modify: `tests/e2e/school-details-desktop.spec.js`
- Modify: `tests/e2e/desktop-basic-monitors.spec.js`

**Interfaces:**
- Novo botão: `Exibir dados da unidade` / `Ocultar dados da unidade`.
- Painel: `id="school-registration-details"`, fechado por padrão.
- Cabeçalho: `.prontuario-school-header`, sticky dentro da área de conteúdo.

- [ ] **Step 1: Update tests first**

Alterar os contratos que hoje exigem `.school-data-card` sempre visível. Exigir painel cadastral presente porém fechado, `aria-expanded="false"`, 14 campos preservados, programas preservados e nenhuma ação mutável adicional para perfis somente leitura.

- [ ] **Step 2: Add E2E RED behavior**

Em `school-details-desktop.spec.js`, verificar:

```js
const toggle = page.getByRole('button', { name: 'Exibir dados da unidade' });
await expect(page.locator('#school-registration-details')).toBeHidden();
await toggle.click();
await expect(toggle).toHaveAttribute('aria-expanded', 'true');
await expect(page.locator('#school-registration-details')).toBeVisible();
```

Depois rolar `main.content-area` e comprovar que o retângulo do cabeçalho permanece no topo útil da área.

- [ ] **Step 3: Implement markup**

Manter nome/identificação da escola e ações existentes no cabeçalho. Mover a composição cadastral e Programas vinculados para um único painel expansível. Perfis SME/Inventário recebem somente ações permitidas já existentes mais consulta cadastral.

- [ ] **Step 4: Implement sticky CSS**

Usar `position: sticky` com `top` compatível com o chrome atual, `z-index` suficiente e fundo opaco/sem opacidade que prejudique leitura. Garantir que abas e conteúdo não fiquem cobertos.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/unit/prontuario-integridade-ui-contract.test.js tests/unit/prontuario-layout-polish.test.js`
Run: `npx playwright test tests/e2e/school-details-desktop.spec.js tests/e2e/desktop-basic-monitors.spec.js --project=desktop-chromium`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: priorizar avaliação no cabeçalho do prontuário`

---

### Task 4: Persistência da seleção manual na navegação

**Files:**
- Modify: `tests/e2e/global-competence-carteira.spec.js`
- Modify: `tests/e2e/monthly-evaluation-journey.spec.js`
- Modify runtime apenas se o teste revelar regressão real.

- [ ] **Step 1: Add navigation regression test**

Selecionar competência diferente do padrão, abrir uma escola, voltar à Carteira, abrir outra escola e exigir que `RadarCompetenceContext.getState().activeKey` permaneça na seleção manual.

- [ ] **Step 2: Run test**

Run: `npx playwright test tests/e2e/global-competence-carteira.spec.js tests/e2e/monthly-evaluation-journey.spec.js --project=desktop-chromium`
Expected: PASS sem mudança de runtime; se falhar, corrigir apenas o ponto real de reset.

- [ ] **Step 3: Commit test/runtime if needed**

Commit: `test: preservar competência manual entre escolas`

---

### Task 5: Validação integrada e comparação de tempo

**Files:**
- Create/Modify: evidência em `docs/evidence/2026-09-14-pos-login-prontuario-competencia.md`

- [ ] **Step 1: Run syntax and unit suite**

Run: `npm run check && npm run test:unit && npm run test:integration`
Expected: PASS.

- [ ] **Step 2: Run architecture/security**

Run: `npm run check:architecture && npm run lint`
Expected: PASS dentro da política vigente.

- [ ] **Step 3: Run desktop Playwright**

Run: `npx playwright test --project=desktop-chromium`
Expected: PASS.

- [ ] **Step 4: Run real Supabase gates**

Executar workflows canônicos de ciclos funcionais reais, confiabilidade com Supabase real, Supabase readiness/RLS, perfis/viewports e backup/restauração.

- [ ] **Step 5: Compare startup timing**

Registrar os tempos de `login-submit → auth-ready`, `auth-ready → bootstrap-ready` e `bootstrap-ready → workspace-ready` em ambiente equivalente antes/depois. Não declarar ganho se a comparação não for comparável.

- [ ] **Step 6: Document findings and residual debt**

Registrar ganho real e qualquer gargalo remanescente. Se a meta ainda não for satisfatória, recomendar a próxima frente sem ampliar este PR.

- [ ] **Step 7: Final commit**

Commit: `docs: registrar validação da nova entrada e prontuário`
