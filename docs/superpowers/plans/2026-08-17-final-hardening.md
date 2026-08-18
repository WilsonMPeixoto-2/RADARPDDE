# RADAR PDDE 2026 — Final Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** remover o legado operacional do bundle público, tornar Production fail-closed, estabilizar Pendências, alinhar os testes às regras atuais e atualizar dependências/segurança sem alterar os dados reais do Supabase.

**Architecture:** preservar a arquitetura atual e deslocar as garantias para pontos canônicos: configuração bloqueia Production inválida, dados iniciais reais deixam de existir no artefato público, a página de Pendências inicializa sua própria visão transversal, e os módulos de integração permanecem auxiliares. Dependências são atualizadas em grupos pequenos e o lockfile é regenerado de forma reproduzível pelo npm em CI.

**Tech Stack:** JavaScript browser/Node 24, Supabase JS/CLI, Vercel, Playwright, Axe, esbuild, ESLint, GitHub Actions/CodeQL.

## Global Constraints

- Não alterar, resetar, recriar ou sobrescrever dados reais do Supabase Production.
- Não introduzir React, Vue, Vite, Webpack, Redux ou novo framework/bundler.
- Production deve usar exclusivamente `supabase-production` para dados operacionais.
- Fixtures locais continuam permitidas apenas em desenvolvimento/testes explicitamente locais.
- Não ativar CSP rígida enquanto handlers inline permanecerem no produto.
- Dependências alvo: `@supabase/supabase-js` 2.112.3, `supabase` 2.114.0, `@playwright/test` 1.62.1 e `@axe-core/playwright` 4.13.0.
- Não elevar artificialmente o teto de warnings de segurança.
- Nenhum merge para `main` antes da verificação dos fluxos alterados.

---

### Task 1: Production fail-closed e isolamento do seed

**Files:**
- Modify: `config.js`
- Modify: `src/integration/auth-bootstrap.js`
- Modify: `app.js`
- Create: `src/data/local-development-fixtures.js`
- Modify: `src/data/repository-factory.js`
- Modify: `scripts/build-vercel.mjs`
- Test: `tests/unit/runtime-config.test.js`
- Test: `tests/unit/repository-factory.test.js`
- Test: `tests/integration/production-build.test.js`

**Interfaces:**
- Produces: `RADAR_PDDE_CONFIG.productionBlocked: boolean` and diagnostics estáveis quando Production não puder ativar o Supabase.
- Produces: fixtures locais carregadas apenas quando `dataMode === 'local'` e ambiente não for Production.
- Production bundle must not contain names/telephones/e-mails/assignments from `INITIAL_ESCOLAS`/`INITIAL_CONTROLADORES`.

- [ ] **Step 1: Write failing tests** proving Production invalid Supabase configuration never resolves to local repository and Production build does not expose real school/controller fixture markers.
- [ ] **Step 2: Run the targeted unit/integration jobs in CI** and require RED for the new assertions.
- [ ] **Step 3: Move local-only school/controller fixtures out of `app.js`** into `src/data/local-development-fixtures.js`; leave canonical public program metadata separate.
- [ ] **Step 4: Make `createRuntimeConfig()` fail closed in Production** by returning blocked state rather than converting to local mode when production activation/configuration is invalid.
- [ ] **Step 5: Make repository/auth bootstrap honor the blocked state** and show the existing unavailable/auth gate instead of building a local operational repository.
- [ ] **Step 6: Exclude local fixture file from Vercel Production output** and add a build assertion that fails if fixture markers appear in `dist/app.js` or other public JS.
- [ ] **Step 7: Run unit, integration and build checks** and require GREEN.

### Task 2: Pendências transversal determinística

**Files:**
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/operational-readiness-bridge.js`
- Modify: `src/integration/pendency-passive-queue-ux.js`
- Test: `tests/e2e/pendency-operational-regression.spec.js`
- Test: `tests/unit/pendencias-view-model.test.js`

**Interfaces:**
- Produces: `RadarTask9PendencyPage` starts with `filters.competence === ''` when navigation has no explicit pendency-context filter.
- The global competence remains visible but does not auto-filter Pendências.

- [ ] **Step 1: Add regression test** with global `2026-08` and pendências in `2026-04`, `2026-05`, `2026-08`; first render must expose all active records.
- [ ] **Step 2: Verify RED** against current asynchronous bridge behavior.
- [ ] **Step 3: Initialize the Task 9 page canonically with all competences** and keep explicit contextual filter only when passed intentionally.
- [ ] **Step 4: Reduce the bridge to compatibility/deep-link synchronization**, removing responsibility for initial page state.
- [ ] **Step 5: Run targeted E2E and unit tests** and require GREEN.

### Task 3: Reconcile obsolete tests with current business rules

**Files:**
- Modify: relevant specs under `tests/e2e/` and `tests/unit/` identified by the current failing CI report.

**Interfaces:**
- Team deactivation contract: transfer portfolio first, then deactivate only when school count is zero.
- `a_identificar` assertion must target the actual `<select>` value.
- Numeric legacy IDs normalize to canonical string IDs.
- Reanalysis locator must target the current UI/control rather than a removed selector.

- [ ] **Step 1: Reproduce each pre-existing failure from the latest Playwright/readiness report.**
- [ ] **Step 2: For each obsolete expectation, update the test only; do not weaken runtime guards.**
- [ ] **Step 3: Add an explicit test for the accepted Team sequence and for `a_identificar`.**
- [ ] **Step 4: Run the full Playwright suite and readiness gates** and classify any remaining failure by changed/unrelated path.

### Task 4: Low-risk HTTP/browser security hardening

**Files:**
- Modify: `vercel.json`
- Modify: touched integration modules that still use avoidable `innerHTML`
- Create: `.github/workflows/codeql.yml`
- Test: `tests/integration/vercel-security-headers.test.js`
- Test: workflow reference checks.

**Interfaces:**
- Headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and framing protection compatible with the current app.
- CodeQL scans JavaScript/TypeScript and GitHub Actions on PR, push to main and schedule.

- [ ] **Step 1: Add failing header/workflow tests.**
- [ ] **Step 2: Add headers to `vercel.json` without CSP.**
- [ ] **Step 3: Replace avoidable `innerHTML` in files touched by this package with DOM/text APIs.**
- [ ] **Step 4: Add CodeQL workflow using current stable GitHub actions.**
- [ ] **Step 5: Run lint/security and workflow reference checks; warning count must not increase.**

### Task 5: Update browser-quality dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- `@playwright/test`: `1.62.1`
- `@axe-core/playwright`: `4.13.0`

- [ ] **Step 1: Apply the dependency versions.**
- [ ] **Step 2: Regenerate lockfile with Node 24/npm 11 in CI.**
- [ ] **Step 3: Run `npm ci`, E2E, accessibility and Lighthouse jobs.**
- [ ] **Step 4: Keep the update only if failures are not caused by the new versions.**

### Task 6: Update Supabase tooling/runtime dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Regenerate: `vendor/supabase.min.js` or current vendored Supabase browser artifact
- Modify: any pinned Supabase import/version contract tests discovered by `check:generated`.

**Interfaces:**
- `@supabase/supabase-js`: `2.112.3`
- `supabase`: `2.114.0`

- [ ] **Step 1: Update package versions and regenerate lockfile in CI.**
- [ ] **Step 2: Regenerate the browser Supabase client with the existing build script.**
- [ ] **Step 3: Update only version-contract expectations/import pins required by the generated artifact.**
- [ ] **Step 4: Run Supabase local reset, pgTAP, Auth/RLS, type generation/check, integration and remote-safe checks.**
- [ ] **Step 5: Keep the update only if schema/data behavior remains unchanged.**

### Task 7: Performance cleanup without framework migration

**Files:**
- Modify: `config.js`
- Modify: `src/integration/load-excel-export.js`
- Modify: product-extension/bootstrap loader files only where needed.
- Test: targeted unit/E2E and Lighthouse.

**Interfaces:**
- Excel/ExcelJS remains lazy until export request.
- Noncritical modules may be loaded at view entry, but all currently supported routes/roles remain functional.

- [ ] **Step 1: Measure current startup module list and identify only clearly deferable modules.**
- [ ] **Step 2: Keep Excel lazy and remove any eager duplicate load.**
- [ ] **Step 3: Defer only modules whose activation is already event/view based; avoid broad loader rewrite.**
- [ ] **Step 4: Run desktop Lighthouse and the profile/view gate; no regression in supported desktop UX.**

### Task 8: CI, npm script policy and final governance

**Files:**
- Modify: `package.json` only if the installed npm supports an explicit safe allowlist without breaking reproducibility.
- Modify: `.github/workflows/dependency-health.yml` or related workflow only if needed for the supported policy.
- No branch protection change until required checks are green and stable.

**Interfaces:**
- Install scripts remain allowed only for packages demonstrably required by the current build if the npm feature is stable in the project runner.

- [ ] **Step 1: Verify npm 11 support/behavior in the CI runner.**
- [ ] **Step 2: Add the minimal allowlist only if `npm ci` remains reproducible; otherwise record deferral in the PR.**
- [ ] **Step 3: Run dependency health, SBOM/audit policy, Knip and generated artifact checks.**
- [ ] **Step 4: Do not enable branch protection until the final required checks are green.**

### Task 9: Final verification, PR review and release

**Files:**
- Update: PR #188 description with exact evidence.
- No Production data mutations.

- [ ] **Step 1: Run/inspect all required GitHub Actions for the final head SHA.**
- [ ] **Step 2: Compare branch against `main`; confirm only intended files changed.**
- [ ] **Step 3: Review the PR patch for fixture leakage, Production fallback, permission broadening and accidental schema/data changes.**
- [ ] **Step 4: Mark PR ready only when changed flows are green and remaining failures, if any, are proven unrelated.**
- [ ] **Step 5: Merge after verification.**
- [ ] **Step 6: Verify Vercel Production manifest/health and Supabase Production integrity monitor after release.**
