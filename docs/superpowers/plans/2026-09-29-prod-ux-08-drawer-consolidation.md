# PROD-UX-08 Drawer de Pendências — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir clipping/sobreposição do drawer global em desktop consolidando a geometria em uma única autoridade CSS, sem redesign global e sem alterar regras funcionais.

**Architecture:** O drawer continua produzido por `task-9-pendencias-page.js` e sincronizado por `task-9-cross-view.js`. A correção deve mover a responsabilidade de largura/min-width/top/composição desktop para uma única seção de estilo do componente e remover overrides concorrentes nas demais folhas.

**Tech Stack:** CSS, JavaScript existente, Playwright, auditoria de precedência frontend.

**Spec:** `docs/superpowers/specs/2026-09-29-root-cause-consolidation-design.md`

## Global Constraints

- Escopo exclusivamente no drawer e composição diretamente afetada.
- Não alterar regras de negócio, persistência, Pendências ou ações.
- Não abrir revisão global de CSS.
- Não usar `!important` novo para vencer a cascata.
- Não atualizar golden visual só para obter verde.
- Desktop é o foco principal; validar transição de breakpoint.
- Handoff vigente: `docs/handoff/2026-09-28-prod-ux-08-drawer-clipping.md`.

## Review Focus

- Conteúdo longo em contexto/observação/tentativas não pode cortar ou sobrepor.
- Footer e ação principal devem permanecer acessíveis durante scroll.
- Lista atrás do drawer não pode aparecer por cima dele.
- Transição acima/abaixo de 1181 px não pode conservar classe/medida incorreta.
- Retificação e ações enriquecidas que decoram o drawer devem continuar legíveis.

---

### Task 1: Provar a precedência responsável

**Files:**
- Read/inspect: `src/styles/task-9-pendencias.css`
- Read/inspect: `src/styles/task-9-cross-view.css`
- Read/inspect: `src/styles/layout-responsive-2026.css`
- Read/inspect: `src/styles/desktop-basic-monitors.css`
- Test: `tests/e2e/layout-responsive-regressions.spec.js`
- Evidence: `docs/evidence/<date>-prod-ux-08/README.md`

**Interfaces:**
- Consumes: `.pendency-detail-drawer`, `.pendency-drawer-body`, `body.pendency-drawer-open-desktop`, `--pendency-docked-drawer-width`.
- Produces: causa demonstrada por computed style e screenshot.

- [ ] **Step 1: Reproduzir em estado populado**

Usar o registro já documentado no handoff, sem nova escrita.

- [ ] **Step 2: Capturar computed styles por viewport**

No mínimo:

- 1366×768;
- 1440×900;
- largura imediatamente abaixo e acima de 1181 px.

Registrar origem vencedora de `width`, `min-width`, `max-width`, `top`, grid interno e z-index.

- [ ] **Step 3: Escrever regressão falha pelo efeito observável**

O teste deve detectar:

- conteúdo ultrapassando bounds do drawer;
- sobreposição horizontal entre blocos;
- ação/footer inacessível;
- elemento da fila acima do drawer.

Não testar texto literal de regras CSS.

### Task 2: Consolidar a autoridade geométrica

**Files:**
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/task-9-cross-view.css`
- Modify: `src/styles/layout-responsive-2026.css`
- Modify: `src/styles/desktop-basic-monitors.css`

**Interfaces:**
- Produces: uma única origem para largura/min-width/max-width/top do drawer desktop.
- Consumes: breakpoint desktop de 1181 px já usado por `task-9-cross-view.js`.

- [ ] **Step 1: Escolher a folha autoridade**

`task-9-pendencias.css` deve possuir a geometria/composição própria do componente.

`task-9-cross-view.css` deve conservar somente regras que expressem integração cross-view/docking, sem definir uma segunda geometria concorrente.

`layout-responsive-2026.css` e `desktop-basic-monitors.css` devem remover overrides específicos que contrariem a autoridade escolhida.

- [ ] **Step 2: Alinhar composição interna à largura real**

A regra de duas colunas só permanece onde a largura mínima suportar o conteúdo. Quando não suportar, usar uma coluna antes de permitir clipping.

- [ ] **Step 3: Rodar regressão direcionada**

Run:

```bash
npx playwright test tests/e2e/layout-responsive-regressions.spec.js tests/e2e/task-9-cross-view.spec.js
npm run audit:frontend-precedence:check
npm run lint:css
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/styles/task-9-pendencias.css src/styles/task-9-cross-view.css   src/styles/layout-responsive-2026.css src/styles/desktop-basic-monitors.css   tests/e2e/layout-responsive-regressions.spec.js
git commit -m "fix: consolidate pendency drawer desktop geometry"
```

### Task 3: Validação outside-in

**Files:**
- Evidence: `docs/evidence/<date>-prod-ux-08/README.md`

- [ ] **Step 1: Capturar screenshots abertas do drawer**

Incluir:

- topo/contexto;
- corpo com conteúdo longo;
- tentativas;
- footer/ações;
- scroll intermediário;
- 1366×768 e 1440×900;
- transição de breakpoint.

- [ ] **Step 2: Verificar interação real**

Abrir/fechar, rolar, executar navegação permitida, reabrir depois de mudar largura.

- [ ] **Step 3: Rodar regressões relacionadas**

```bash
npx playwright test   tests/e2e/pendency-cycle.spec.js   tests/e2e/evaluation-retification-ui.spec.js   tests/e2e/canonical-routes.spec.js
npm run test:visual
```

- [ ] **Step 4: Confirmar em Production após publicação autorizada**

Testes verdes sem inspeção visual humana não encerram PROD-UX-08.
