# Supabase, Operações P0 e Fechamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provar e corrigir todas as principais escritas do produto com Auth real, serviços reais, RPC/RLS, releitura, recarga, auditoria e compensação em ambiente descartável, e então fechar matriz, desktop, Preview e Production somente leitura sem regressão.

**Architecture:** Um harness serial e bloqueado para loopback prepara uma fixture própria, multiusuário e multi-CRE com `service_role` somente no processo Node de setup/cleanup. Os testes entram pela interface/serviços com sessões Auth reais e anon key. Cada operação positiva é relida no repositório e na tela após reload e compensada; cada negativa compara digest, versões, efeitos e logs. Serviços de aplicação recebem o contexto de acesso aprovado, enquanto RPC/RLS continuam a impor o escopo. A matriz só muda de `partial` para `covered` depois de evidência executada no mesmo SHA.

**Tech Stack:** Node.js 24.x, Supabase CLI 2.110.0, `@supabase/supabase-js` 2.110.9, PostgreSQL/pgTAP, serviços JavaScript, Playwright 1.62, GitHub Actions e Vercel.

## Global Constraints

- Baseline funcional: `85971e948e1b012df8af6f10fca663ba97f184f3`.
- Design aprovado: `docs/superpowers/specs/2026-08-08-estabilizacao-desktop-funcional-integral-design.md`.
- Production é estritamente somente leitura durante testes e smoke; nenhuma suíte de escrita recebe URL ou segredo de Production.
- `service_role` existe somente em preparação/limpeza protegida; nunca chega ao navegador, runtime config, storage state, trace, screenshot, vídeo ou relatório.
- A suíte mutável exige simultaneamente flag explícita, `RADAR_ENVIRONMENT=test` e URL loopback.
- IDs, e-mails e registros são sintéticos e prefixados pelo run ID. Não usar contas ou dados pessoais.
- Uma prova positiva é: Auth real → serviço real → RPC/RLS → releitura → auditoria → `page.reload()` → localização/compreensão visual → compensação → nova releitura/reload.
- Uma prova negativa compara conteúdo, `row_version`, efeitos associados e logs antes/depois. Ausência de erro ou zero linhas não é evidência suficiente.
- Não apagar logs na compensação, não repetir automaticamente mutação não idempotente e não criar `SECURITY DEFINER` para contornar RLS.
- Não criar migration preventivamente. Primeiro manter o teste pgTAP/E2E RED; depois usar `npx supabase migration new <nome>`.
- Assistente tem leitura/escrita operacional transversal. Administrador técnico tem leitura/escrita total com identidade técnica real. Controlador permanece limitado ao escopo autorizado. SME e Inventário mantêm contratos específicos.
- Desktop é homologado em 1440 × 900 e 1280 × 720. Mobile recebe apenas smoke de não regressão.

---

### Task 1: Build an immutable safety barrier and proof helpers

**Files:**

- Create: `tests/support/supabase-authenticated-write-contract.js`
- Create: `tests/unit/supabase-authenticated-write-contract.test.js`
- Modify: `package.json`

**Interfaces:**

```js
assertAuthenticatedWriteEnvironment({ enabled, supabaseUrl, runtimeEnvironment });
stableEntityDigest(records, options);
captureRemoteProof(repository, { entities, select });
assertNoMutation(before, after, { entities, includeVersions, includeLogs });
waitForAuthenticatedApplication(page, expectedRole);
reloadAndWaitForAuthenticatedApplication(page, expectedRole);
```

- [ ] **Step 1: write RED safety tests**

Require rejection for a missing opt-in flag, empty/invalid URL, non-loopback host, Production URL, environment other than `test`, and any attempt to expose `SERVICE_ROLE_KEY` to browser configuration.

Run: `node --test tests/unit/supabase-authenticated-write-contract.test.js`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 2: implement the fail-closed barrier**

Require all of:

```text
RADAR_E2E_SUPABASE_AUTHENTICATED_WRITE=1
RADAR_ALLOW_LOCAL_AUTHENTICATED_WRITE=true
RADAR_ENVIRONMENT=test
URL host in localhost, 127.0.0.1 or ::1
```

Run this assertion before `page.goto()`. Stable digest sorts objects recursively and includes versions, related-effect IDs and log IDs/counts unless a scenario explicitly declares a proven volatile field.

- [ ] **Step 3: verify and commit**

Run: `node --test tests/unit/supabase-authenticated-write-contract.test.js`

Commit: `test(supabase): protect authenticated write contract`

### Task 2: Prepare a separate multi-user, multi-CRE fixture

**Files:**

- Create: `supabase/fixtures/authenticated-write-contract.json`
- Create: `scripts/manage-authenticated-write-contract.mjs`
- Create: `tests/unit/authenticated-write-fixture.test.js`
- Preserve: `supabase/fixtures/auth-users.json`
- Preserve: `scripts/bootstrap-local-auth-fixtures.mjs`
- Preserve: `scripts/check-local-auth-fixtures.mjs`

**Command interface:**

```powershell
node scripts/manage-authenticated-write-contract.mjs prepare
node scripts/manage-authenticated-write-contract.mjs verify
node scripts/manage-authenticated-write-contract.mjs cleanup
```

- [ ] **Step 1: write RED manifest-contract tests**

Require two authenticated Controllers; Assistant; SME; Inventory; technical admin; inactive and profile-less identities; two schools in the same CRE assigned to different Controllers; one school in another CRE; program, competence, `app_config`, school-program link, verification, pendency, attempt, contact, invoice, asset and positive initial versions. Require synthetic data and no Production URL.

Run: `node --test tests/unit/authenticated-write-fixture.test.js`

Expected: FAIL because the dedicated manifest/script do not exist.

- [ ] **Step 2: implement run-scoped prepare, verify and cleanup**

Prefix every identifier with `E2E-WRITE-${RADAR_AUTH_WRITE_RUN_ID}`. Admin operations use a Node client with session persistence/refresh disabled. `verify` signs in each identity with anon key and `signInWithPassword`. `cleanup` operates only on exact run-prefixed IDs and deletes in dependency order while retaining no cross-run access.

- [ ] **Step 3: verify fixture consistency and commit**

Run: `node --test tests/unit/authenticated-write-fixture.test.js`

Commit: `test(supabase): add multi-user authenticated write fixture`

### Task 3: Expand capability boundaries across application services

**Files:**

- Modify: `src/domain/access-policy.js`
- Modify: `src/application/verification-service.js`
- Modify: `src/application/school-service.js`
- Modify: `src/application/invoice-service.js`
- Modify: `src/application/inventory-service.js`
- Modify: `src/application/configuration-service.js`
- Modify: `src/application/directory-service.js`
- Modify: `app.js`
- Modify: `src/integration/navigation-policy.js`
- Modify: `tests/unit/access-policy.test.js`
- Modify: `tests/unit/verification-service.test.js`
- Modify: `tests/unit/school-service.test.js`
- Modify: `tests/unit/invoice-service.test.js`
- Modify: `tests/unit/inventory-service.test.js`
- Modify: `tests/unit/configuration-service.test.js`
- Modify: `tests/unit/directory-service.test.js`
- Modify: `tests/unit/navigation-policy.test.js`

**Capability groups:**

```js
MANAGE_VERIFICATIONS;
RETIFY_VERIFICATIONS;
MANAGE_SCHOOLS;
ASSIGN_CONTROLLERS;
MANAGE_INVOICES;
MANAGE_ASSETS;
COMPLETE_INVENTORY;
MANAGE_CONFIGURATION;
MANAGE_DIRECTORY;
RUN_TECHNICAL_IMPORTS;
```

`technical_admin` receives all groups. Assistente receives every functional/operational group, including cross-school help, reanalysis, retification and reassignment. Controller receives operational groups subject to scope. SME/Inventory receive only their existing institutional/patrimonial groups. `RUN_TECHNICAL_IMPORTS` remains technical-admin-only unless the approved matrix explicitly says otherwise.

- [ ] **Step 1: write RED table-driven service tests**

For every service operation, execute the authorization preflight with:

- technical admin acting as each visual profile: allowed;
- Assistente: allowed for functional operations;
- Controller: allowed only for its operation and later constrained by DB scope;
- SME/Inventory: allowed only for their declared contracts;
- anonymous/inactive/profile-less: denied before transaction.

Require `dataService.execute` call count to remain zero for denied cases.

Run: `node --test tests/unit/access-policy.test.js tests/unit/verification-service.test.js tests/unit/school-service.test.js tests/unit/invoice-service.test.js tests/unit/inventory-service.test.js tests/unit/configuration-service.test.js tests/unit/directory-service.test.js tests/unit/navigation-policy.test.js`

Expected: FAIL because several services authorize by acting profile strings and therefore deny admin in SME/Inventory presentation; navigation can hide capabilities even when backend permits them.

- [ ] **Step 2: migrate service preflights to the access context**

Each service receives `getAccessContext()` and asks `RadarAccessPolicy.hasCapability(context, capability)`. Input `profile` remains compatibility metadata only and cannot grant authority. Use the same capability checks for navigation/action visibility; do not branch admin authority on `getRadarAccessProfile()`.

- [ ] **Step 3: preserve domain-specific locks**

Capability does not bypass business invariants: active pendency locks analysis; consolidated verification still needs retification; school identity uniqueness, versions, invoice effects, inventory transitions and configuration validation remain enforced.

- [ ] **Step 4: verify and commit**

Run the focused unit command above and `npm run check`.

Commit: `refactor(auth): apply access context across operational services`

### Task 4: Create the serial authenticated write harness and certify VER/PEND

**Files:**

- Create: `tests/e2e/supabase-authenticated-write-contract.spec.js`
- Modify: `package.json`
- Modify as needed after a real backend failure: `supabase/tests/database/verification-rpc.test.sql`
- Modify as needed after a real backend failure: `supabase/tests/database/operations-rpc.test.sql`
- Modify as needed after a real backend failure: `supabase/tests/database/rls.test.sql`
- Modify as needed after a real backend failure: `supabase/tests/database/functional-integrity-remediation.test.sql`

**Script:**

```json
"test:supabase:authenticated-write": "playwright test tests/e2e/supabase-authenticated-write-contract.spec.js --project=desktop-chromium --workers=1"
```

- [ ] **Step 1: establish a serial RED proof skeleton**

Use `test.describe.configure({ mode: 'serial' })`. The first test must fail closed outside the explicit loopback environment. Within it, sign in through the real interface and require `RadarDataContext.ready` and the expected `RadarAuthContext.authorization.role`.

- [ ] **Step 2: certify VER-01 through VER-04**

Use real `RadarApplicationServices.verifications` methods. Prove permitted writes for scoped Controller, Assistente and technical admin; other-school/other-CRE denial; active-pendency analysis lock; incomplete consolidation rejection; retification authority; stale versions and negative digests; reread/reload/audit/compensation.

- [ ] **Step 3: certify PEND-01 through PEND-06**

Use real `RadarApplicationServices.pendencies` methods. Prove duplicate rejection, distinct availability/registration times, three reanalysis results, Assistant/admin authorship, resolve/cancel/reopen both terminal states, idempotent contact operation, stale-version atomicity, reload and compensation.

- [ ] **Step 4: add pgTAP RED only where the E2E proof exposes a database gap**

Do not edit old migrations. If a test fails due to schema/RPC/RLS behavior, reproduce it in the closest existing SQL suite, then create one new migration and rerun the entire disposable reset.

- [ ] **Step 5: verify and commit**

Run in the disposable environment:

```powershell
npm run supabase:start
npm run supabase:reset
node scripts/manage-authenticated-write-contract.mjs prepare
node scripts/manage-authenticated-write-contract.mjs verify
$env:RADAR_E2E_SUPABASE_AUTHENTICATED_WRITE='1'
$env:RADAR_ALLOW_LOCAL_AUTHENTICATED_WRITE='true'
$env:RADAR_ENVIRONMENT='test'
npm run test:supabase:authenticated-write
node scripts/manage-authenticated-write-contract.mjs cleanup
npm run supabase:stop
```

Commit: `test(supabase): certify verification and pendency writes`

### Task 5: Certify schools and controller portfolios, SCH-01 through SCH-03

**Files:**

- Modify: `tests/e2e/supabase-authenticated-write-contract.spec.js`
- Modify if a DB RED exists: `supabase/tests/database/operational-command-rpc.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/rls.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/school-assignment-authorization.test.sql`

- [ ] **Step 1: write RED authenticated school journeys**

Through `RadarApplicationServices.schools`, prove:

- Assistente and technical admin create/edit a school;
- scoped Controller edits an authorized school;
- duplicate designação, INEP, CNPJ or SICI creates no mutation/log;
- other-CRE Controller cannot edit;
- identity rereads and displays correctly after reload.

- [ ] **Step 2: prove single and bulk reassignment atomicity**

Assistente/admin reassign A → B; both portfolios update after reload; compensate B → A. Controller cannot reassign. For bulk, force one stale version and prove no school changes partially and no success log exists.

- [ ] **Step 3: verify and commit**

Run: `npm run test:supabase:authenticated-write -- --grep "SCH-0"`

Commit: `test(supabase): certify schools and portfolios`

### Task 6: Certify invoices, expenses and linked effects, INV-01 through INV-02

**Files:**

- Modify: `tests/e2e/supabase-authenticated-write-contract.spec.js`
- Modify if a DB RED exists: `supabase/tests/database/invoice-rpc.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/rls.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/functional-integrity-remediation.test.sql`

- [ ] **Step 1: write authenticated create/edit/delete journeys**

Use `RadarApplicationServices.invoices.save/remove`. Cover a custeio invoice, permanent invoice with derived asset, permanent → custeio conversion removing the orphaned asset, value/description edits and requirement restoration after deletion.

- [ ] **Step 2: prove role, scope and conflict behavior**

Scoped Controller, Assistente and technical admin are positive. Denied roles and other-scope Controller retain the exact digest. A stale version must leave no partial invoice, residual asset, verification patch or log.

- [ ] **Step 3: verify UI reload/compensation and commit**

Locate invoice and derived asset after reload in Prontuário/Inventário; compensate by authorized delete/recreation without deleting logs.

Run: `npm run test:supabase:authenticated-write -- --grep "INV-0"`

Commit: `test(supabase): certify invoices and linked effects`

### Task 7: Certify assets and inventory, ASSET-01 through ASSET-04

**Files:**

- Modify: `tests/e2e/supabase-authenticated-write-contract.spec.js`
- Modify if a DB RED exists: `supabase/tests/database/inventory-capital-rls.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/rls.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/operational-command-rpc.test.sql`

- [ ] **Step 1: write lifecycle tests through `RadarApplicationServices.inventory`**

Cover manual creation, permitted patrimonial-field edit, rejection of an unapproved field, forwarding with valid invoice/process, rejection without prerequisites, and inventory completion with real responsible identity.

- [ ] **Step 2: prove role and scope matrix**

Require approved Controller/Assistente/technical-admin operations, Inventory-specific completion, other-CRE denial where the contract requires it, and SME denial outside assigned contracts. Every negative includes unchanged versions/effects/logs.

- [ ] **Step 3: prove reload, conflict and compensation**

Locate understandable state in the Inventário UI after reload. Force a version conflict and prove no partial transition. Restore the functional state by an authorized compensating command where supported; retain history.

Run: `npm run test:supabase:authenticated-write -- --grep "ASSET-0"`

Commit: `test(supabase): certify assets and inventory`

### Task 8: Certify configuration and directory, CFG-01 through CFG-04

**Files:**

- Modify: `tests/e2e/supabase-authenticated-write-contract.spec.js`
- Modify if a DB RED exists: `supabase/tests/database/operational-command-rpc.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/sme-access-governance.test.sql`
- Modify if a DB RED exists: `supabase/tests/database/functional-integrity-remediation.test.sql`

- [ ] **Step 1: prove calendar persistence without changing active selection**

Through `RadarApplicationServices.configuration.saveCalendar`, approved SME, Assistente and technical admin update closing/window, reread/reload, and compensate. The user-selected active month remains unchanged when still valid.

- [ ] **Step 2: prove exercise and program operations**

Create an exercise with exactly 12 competences; duplicate creates no config/competence/log mutation. Create/edit/deactivate a program, preserve relations/history and protect `BASIC`. Verify role denials and versions.

- [ ] **Step 3: verify and commit**

Run: `npm run test:supabase:authenticated-write -- --grep "CFG-0"`

Commit: `test(supabase): certify configuration and directory writes`

### Task 9: Certify technical import, reconciliation and rollback, TECH-01

**Files:**

- Modify: `tests/e2e/supabase-full-contract.spec.js`
- Modify: `tests/e2e/supabase-authenticated-write-contract.spec.js`
- Modify as required by a proven gap: `scripts/migration-cli.mjs`
- Reuse: `scripts/verify-supabase-backup-restore.mjs`
- Reuse: `.github/workflows/backup-restore-disposable.yml`

- [ ] **Step 1: preserve existing import/reconcile/rollback coverage**

Do not duplicate or weaken `supabase-full-contract.spec.js`. Add assertions that plan/validate/dry-run do not mutate and that interrupted import resumes by the same `importId`.

- [ ] **Step 2: prove authenticated technical authority and atomic rejection**

Technical admin keeps the same `auth.uid()` through plan/import/promote/reconcile/rollback. Reload reads the promoted state; rollback restores the prior functional digest while retaining `data_import_runs` and logs. Other functional roles cannot initiate/promote/rollback and create no run/staging rows. Divergent hash/counts cannot promote partially.

- [ ] **Step 3: verify and commit**

Run: `npx playwright test tests/e2e/supabase-full-contract.spec.js tests/e2e/supabase-authenticated-write-contract.spec.js --project=desktop-chromium --workers=1 -g "TECH-01|importação|rollback"`

Commit: `test(supabase): certify reversible technical imports`

### Task 10: Wire the disposable CI gate and preserve Production read-only

**Files:**

- Modify: `.github/workflows/supabase-readiness.yml`
- Modify: `.github/workflows/gate-remoto-perfis-viewports.yml`
- Modify: `.github/workflows/preproduction-full-validation.yml`
- Modify: `package.json`
- Create: `tests/unit/supabase-authenticated-write-workflow.test.js`
- Modify if required: `scripts/check-workflow-references.mjs`
- Preserve functionally: `.github/workflows/production-authenticated-read.yml`
- Preserve functionally: `playwright.production-authenticated-read.config.js`
- Preserve functionally: `tests/e2e/production-authenticated-read.spec.js`

- [ ] **Step 1: write RED workflow-contract tests**

Require start/reset before fixture preparation; serial Playwright with explicit flags; service-role only in setup/cleanup; cleanup and stop in `if: always()`; no write suite, service role or mutating RPC in Production workflow. Require the stale step label to say “migrations versionadas”, not “vinte e sete migrations”.

Run: `node --test tests/unit/supabase-authenticated-write-workflow.test.js`

Expected: FAIL because the new suite is not wired and the count label is stale.

- [ ] **Step 2: wire the local/disposable job**

Derive URL/keys from `supabase status -o env`; do not depend on Kong/container names. Add prepare, verify and test steps. In `always()`, cleanup fixtures, remove function env, restore runtime config and stop Supabase. Add new paths to workflow filters.

- [ ] **Step 3: verify workflow references and commit**

Run: `node --test tests/unit/supabase-authenticated-write-workflow.test.js`

Run: `npm run check:workflow-references`

Run: `npm run test:readiness`

Commit: `ci(supabase): run authenticated writes only on disposable stack`

### Task 11: Reconcile coverage only after executed evidence

**Files:**

- Modify: `docs/reference/functional-contract-matrix/operations.json`
- Modify: `docs/reference/functional-contract-matrix/configuration.json`
- Modify: `docs/reference/functional-contract-matrix/technical.json`
- Regenerate: `docs/reference/functional-contract-matrix.json`
- Regenerate: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`
- Modify: `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`
- Modify: `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`
- Modify: `docs/architecture/supabase-readiness.md`
- Modify: `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md`
- Modify: `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`

- [ ] **Step 1: update role contracts and coverage from the green SHA**

Align technical admin across every functional operation. Align Assistente with transverse operational authority. Preserve Controller scope and SME/Inventory-specific contracts. Promote an operation to `covered` only when the green evidence contains Auth, service, RPC/RLS, reread, reload, visible understanding, audit, compensation and negative no-mutation proof.

- [ ] **Step 2: regenerate and validate**

Run: `npm run generate:functional-matrix`

Run: `npm run check:functional-matrix`

Run: `npm run audit:functional`

Run: `npm run test:readiness`

Commit: `docs: reconcile authenticated operational coverage`

### Task 12: Run desktop, mobile-smoke, Preview and Production closeout

**Files:**

- Modify only for proven regression: files from Tasks 1–11.
- Update evidence/checkpoint documents only after all checks run on the final SHA.

- [ ] **Step 1: run all local static and test gates**

Run: `npm run test:readiness`

Run: `npm run test:e2e -- --project=desktop-chromium`

Run: `npx playwright test tests/e2e/mobile-smoke.spec.js tests/e2e/mobile-header-controls.spec.js --project=mobile-chromium`

Run: `npm run format:check`

Run: `git diff --check`

- [ ] **Step 2: run the disposable Linux/Supabase gate**

Run start/reset, database preflight/post-apply SQL, pgTAP, lint, fixture verify, team-account check, authenticated write suite, cleanup and stop. All must run on the same commit.

- [ ] **Step 3: perform main-agent code and visual review**

Review every subagent patch against the approved design, source truth and tests. At 1440 × 900 and 1280 × 720 inspect Dashboard, Carteira, Competências, Pendências with drawer, all six pendency modals, Prontuário, Inventário and SME/configuration flows. Confirm existing design language, no page overflow, actions discoverable and persisted values understandable after reload.

- [ ] **Step 4: publish a controlled Preview and verify it**

Build with `npm run build:vercel`, publish only after local/disposable gates pass, then run authenticated Preview checks with reversible synthetic records and cleanup. Do not use Production secrets for write validation.

- [ ] **Step 5: merge only after required GitHub checks, then verify Production read-only**

After review and required checks, merge via the repository’s protected workflow. Confirm Production deployment SHA/READY state, runtime logs, authenticated read-only smoke and integrity checks. Perform no Production mutation.

- [ ] **Step 6: record exact final evidence and commit documentation if needed**

Record PR/merge lineage, disposable-suite result, Preview result, Production deployment identity, read-only smoke and integrity outcome without freezing volatile values in the mutable canonical baseline.
