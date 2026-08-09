# Autoridade e Pendências Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar autoridade autenticada de apresentação, conceder à Assistente e ao administrador técnico o contrato operacional aprovado e tornar o ciclo documental completo persistente, auditável, pesquisável e utilizável no desktop.

**Architecture:** `RadarAccessPolicy` passa a resolver um contexto com papel autenticado, perfil visual de atuação e capacidades. A interface usa o perfil visual apenas para apresentação e capacidades para autorização. `PendencyService` é a fronteira de autorização transacional; o domínio valida estados e conteúdo, não rótulos localizados de perfil. Eventos, tentativas e logs preservam autoria real e perfil de atuação. A fila desktop agrupa informação em cinco colunas, mantém a ação primária visível e usa drawer e modais contidos.

**Tech Stack:** JavaScript legado/IIFE, serviços de aplicação, adaptador de estado legado, repositório Supabase, CSS existente, Node.js 24.x, `node:test`, Playwright 1.62 e pgTAP.

## Global Constraints

- Baseline funcional: `85971e948e1b012df8af6f10fca663ba97f184f3`.
- Design aprovado: `docs/superpowers/specs/2026-08-08-estabilizacao-desktop-funcional-integral-design.md`.
- O administrador técnico mantém JWT, `auth.uid()`, autoria e papel real `technical_admin`; alternar o perfil visual não reduz nem eleva sua autoridade.
- Usuários funcionais comuns não podem elevar autoridade escolhendo outro perfil visual.
- Controladores obedecem ao escopo autorizado de escola/CRE; Assistente e administrador técnico têm o alcance operacional aprovado.
- SME e Inventário comuns permanecem somente nas operações expressamente autorizadas.
- A autorização ocorre antes de `DataService.execute()`; uma negação não inicia transação nem gera log.
- Não apagar histórico para limpar estado atual. Resolução/cancelamento históricos permanecem na timeline.
- `dataDisponibilizacao` é data de negócio; `dataRegistro`/`submitted_at` é instante técnico.
- O visual existente é preservado. Desktop deve funcionar em 1440 × 900 e 1280 × 720 sem overflow da página.
- Não escrever em Production. Qualquer prova remota mutável usa apenas Supabase descartável/Preview controlado.
- Não criar migration antes de um teste pgTAP RED demonstrar uma lacuna real.

---

### Task 1: Separate authenticated authority from acting presentation

**Files:**

- Modify: `src/domain/access-policy.js`
- Modify: `app.js`
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `tests/unit/access-policy.test.js`
- Modify: `tests/unit/auth-gate.test.js`

**Interfaces:**

```js
resolveAccessContext(actingProfile, authenticatedRole);
hasCapability(accessContextOrProfile, capability);
```

The resolved value is frozen and includes:

```js
{
  authenticatedRole: 'technical_admin',
  actingProfile: 'sme',
  authorityProfile: 'technical_admin'
}
```

For local/mock mode without an authenticated role, `authorityProfile` and `actingProfile` both normalize from the local profile. For a functional authenticated user, both are forced to the role mapping. Only `technical_admin` keeps the selected visual profile while authority remains technical.

- [ ] **Step 1: replace the obsolete RED access expectations**

```js
test('Assistente e technical_admin possuem todas as capacidades de pendência', () => {
  const capabilities = [
    CAPABILITIES.OPEN_PENDENCY,
    CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
    CAPABILITIES.REANALYZE_PENDENCY,
    CAPABILITIES.REGISTER_PENDENCY_CONTACT,
    CAPABILITIES.CANCEL_PENDENCY,
    CAPABILITIES.REOPEN_PENDENCY
  ];

  for (const capability of capabilities) {
    assert.equal(
      policy.hasCapability(
        policy.resolveAccessContext('assistente', 'federal_assistant'),
        capability
      ),
      true
    );
    assert.equal(
      policy.hasCapability(policy.resolveAccessContext('sme', 'technical_admin'), capability),
      true
    );
  }
});
```

Also require technical admin authority for each acting profile and prove `sme_management` cannot elevate itself by requesting `controlador`.

Run: `node --test tests/unit/access-policy.test.js tests/unit/auth-gate.test.js`

Expected: FAIL because `resolveAccessContext()` does not exist, Assistente lacks `REANALYZE_PENDENCY`, and `technical_admin` is currently aliased to `controlador`.

- [ ] **Step 2: implement the access context and compatibility API**

- Add `REANALYZE_PENDENCY` to Assistente.
- Add `PROFILE_CAPABILITIES.technical_admin` containing every declared capability.
- Remove `technical_admin: 'controlador'` from authority normalization.
- Keep `resolveEffectiveProfile()` for compatibility, returning `resolveAccessContext(...).actingProfile`.
- Make `hasCapability()` accept either a legacy profile string or the context object and use `authorityProfile` for the latter.

In `app.js` expose:

```js
function getRadarAccessContext() {
  return window.RadarAccessPolicy.resolveAccessContext(
    currentProfile,
    window.RadarAuthContext?.authorization?.role
  );
}

function getRadarAccessProfile() {
  return getRadarAccessContext().actingProfile;
}

function hasRadarCapability(capability) {
  return window.RadarAccessPolicy.hasCapability(getRadarAccessContext(), capability);
}
```

The two Pendências integrations must call `root.hasRadarCapability()` or the context-aware fallback, never authorize from `getRadarAccessProfile()`.

- [ ] **Step 3: verify and commit**

Run: `node --test tests/unit/access-policy.test.js tests/unit/auth-gate.test.js`

Run: `npm run check`

Commit: `refactor(auth): separate authenticated authority from acting profile`

### Task 2: Authorize reanalysis and preserve real audit identity

**Files:**

- Modify: `src/application/pendency-service.js`
- Modify: `src/domain/pendencias.js`
- Modify: `app.js`
- Modify: `src/data/legacy-state-adapter.js`
- Modify: `src/data/state-bridge.js`
- Modify: `tests/unit/pendency-service-access.test.js`
- Modify: `tests/unit/pendency-service.test.js`
- Modify: `tests/pendencias.test.js`
- Modify: `tests/unit/legacy-state-adapter.test.js`
- Modify: `tests/unit/state-bridge.test.js`

**Interfaces:**

- `PendencyService` receives `getAccessContext()` instead of authorizing with `getCurrentProfile()`.
- `audit(prefix)` emits `actorUserId`, `usuario`, `perfil`, `authenticatedRole` and `actingProfile`.
- History events preserve the structured identity fields.
- Reviewed attempts preserve `analisadoPorId`, `authenticatedRoleAnalise` and `actingProfileAnalise`.
- Legacy text `detalhes` remains available while canonical JSON `details` preserves structured metadata.

- [ ] **Step 1: write RED service and domain tests**

Require reanalysis to reach the transaction for these contexts:

```js
[
  {
    authenticatedRole: 'federal_assistant',
    actingProfile: 'assistente',
    authorityProfile: 'assistente'
  },
  {
    authenticatedRole: 'technical_admin',
    actingProfile: 'sme',
    authorityProfile: 'technical_admin'
  }
];
```

In the domain, call `recordReanalysis()` with a complete Assistant audit object and assert the resolved attempt/history retain the real user ID and roles. Add the same assertions for technical admin acting as Controlador.

Run: `node --test tests/unit/pendency-service-access.test.js tests/unit/pendency-service.test.js tests/pendencias.test.js`

Expected: FAIL because the service denies Assistente and the domain throws the literal “somente ao perfil Controlador” guard; structured identity fields are absent.

- [ ] **Step 2: write RED adapter/bridge round-trip tests**

Persist a log with:

```js
details: {
  text: 'Reanálise registrada.',
  authenticatedRole: 'technical_admin',
  actingProfile: 'controlador'
}
```

Require that the restored record has the same `details` and `detalhes === 'Reanálise registrada.'`.

Expected: FAIL because structured details are currently reduced to text.

- [ ] **Step 3: implement authorization at service and validation at domain**

- Remove only the localized role guard from `recordReanalysis()`; keep state, pending-attempt, result, observation and error validation.
- Use `getAccessContext()` in `assertCapability()`.
- Build audit identity from authenticated user/authorization, not the acting label.
- Use neutral authorization error copy in `app.js`.
- Preserve structured audit fields in attempts, history, adapters and state bridge.

- [ ] **Step 4: verify and commit**

Run: `node --test tests/unit/pendency-service-access.test.js tests/unit/pendency-service.test.js tests/pendencias.test.js tests/unit/legacy-state-adapter.test.js tests/unit/state-bridge.test.js`

Commit: `fix(pendencies): authorize reviews with real audit identity`

### Task 3: Reopen resolved and cancelled records without stale terminal markers

**Files:**

- Modify: `src/domain/pendencias.js`
- Modify: `src/application/pendency-service.js`
- Modify: `src/data/legacy-state-adapter.js`
- Modify: `src/data/state-bridge.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `tests/pendencias.test.js`
- Modify: `tests/unit/pendency-service.test.js`
- Modify: `tests/unit/legacy-state-adapter.test.js`
- Modify: `tests/unit/state-bridge.test.js`
- Modify: `tests/e2e/task-10-11-pendencias.spec.js`

**State invariant:**

```text
Resolvida  <=> resolved_at/dataResolucao set; canceled_at/cancelamento clear
Cancelada <=> canceled_at/cancelamento set; resolved_at/dataResolucao clear
Aberta or Aguardando reanálise <=> both current terminal markers clear
```

- [ ] **Step 1: write RED domain tests for both terminal states**

Call `reopenPendency()` with resolved and cancelled fixtures, require `status === 'Aberta'`, both markers null and original history unchanged except for an appended `reabertura`. Require active states to throw `/Resolvida ou Cancelada/i`.

Run: `node --test --test-name-pattern="reabre pendência resolvida ou cancelada" tests/pendencias.test.js`

Expected: FAIL because Cancelada is rejected and stale `cancelamento` can survive.

- [ ] **Step 2: write RED persistence/reload tests**

Require canonical `resolved_at` and `canceled_at` both null after reopening, then restore and assert history types `['cancelamento', 'reabertura']`. In Playwright, reload and require the reopened record is still active with null terminal markers.

Expected: FAIL because the adapter can derive `canceled_at` from stale payload.

- [ ] **Step 3: implement current-state-derived terminal fields**

`reopenPendency()` accepts only resolved/cancelled, sets both current terminal fields to null and appends history. The adapter sets each canonical terminal timestamp only when current status matches it. The bridge must not resurrect payload cancellation into an active record. Expose “Reabrir pendência” for both terminal statuses.

- [ ] **Step 4: verify and commit**

Run: `node --test tests/pendencias.test.js tests/unit/pendency-service.test.js tests/unit/legacy-state-adapter.test.js tests/unit/state-bridge.test.js`

Run: `npx playwright test tests/e2e/task-10-11-pendencias.spec.js --project=desktop-chromium -g "reabre pendência cancelada"`

Commit: `fix(pendencies): reopen cancelled records without stale markers`

### Task 4: Preserve availability date separately from registration time

**Files:**

- Modify: `src/data/legacy-state-adapter.js`
- Modify: `src/data/state-bridge.js`
- Modify: `tests/unit/legacy-state-adapter.test.js`
- Modify: `tests/unit/state-bridge.test.js`
- Modify: `tests/unit/state-bridge-row-version.test.js`
- Modify: `tests/unit/pendency-service.test.js`
- Modify: `tests/e2e/pendency-cycle.spec.js`

**Contract:** `submitted_at` stores `dataRegistro`; `payload.dataDisponibilizacao` stores the user-provided business date. Reading uses payload first and only falls back to `dateOnly(submitted_at)` for legacy rows.

- [ ] **Step 1: write the RED round-trip fixture**

Use different literal values:

```js
{
  dataDisponibilizacao: '2026-06-10',
  dataRegistro: '2026-06-14T18:30:00.000Z'
}
```

Require canonical `submitted_at` to remain June 14, payload availability to remain June 10, and both restored fields to remain distinct.

Run: `node --test tests/unit/legacy-state-adapter.test.js tests/unit/state-bridge.test.js tests/unit/state-bridge-row-version.test.js tests/unit/pendency-service.test.js`

Expected: FAIL because reload currently changes availability to the registration day.

- [ ] **Step 2: implement payload-first restoration**

Do not compute the technical result using the registration date. Add an E2E assertion whose expected “Correto” or “Correto (Atrasado)” is calculated manually from the literal deadline and availability date.

- [ ] **Step 3: verify and commit**

Run: `npx playwright test tests/e2e/pendency-cycle.spec.js --project=desktop-chromium -g "data de disponibilização"`

Commit: `fix(pendencies): preserve availability date across reload`

### Task 5: Expose complete review evidence in search, detail and timeline

**Files:**

- Modify: `src/domain/pendencias-view-model.js`
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `tests/pendencias-view-model.test.js`
- Modify: `tests/e2e/task-9-pendencias.spec.js`

**Interfaces:**

```js
const REANALYSIS_RESULT_LABELS = Object.freeze({
  correto: 'Correto',
  incorreto: 'Incorreto',
  arquivo_indisponivel: 'Arquivo indisponível'
});

getReanalysisResultLabel(result);
```

Search text indexes submission/review observations, result and human label, reviewer/submitter, errors, role context and history. Timeline entries expose `resultLabel`, `reviewObservation`, `reviewedAt`, reviewer IDs/roles and `actorContextLabel`.

- [ ] **Step 1: write RED view-model search/timeline tests**

Require one reviewed record to be found by “arquivo não localizado”, “conferência técnica detalhada”, reviewer name, “arquivo indisponível” and “Administrador técnico”. Require the timeline to pair event and attempt by `tentativaId` and produce “Administrador técnico · atuando como Controlador”.

Run: `node --test tests/pendencias-view-model.test.js`

Expected: FAIL because review observation and structured identity are omitted.

- [ ] **Step 2: render paired submission and analysis evidence**

In one attempt card show availability, registration, submitter, submission note, human result, review time, reviewer, review note and errors. Never show raw `arquivo_indisponivel` to users.

- [ ] **Step 3: verify reload/search and commit**

Run: `npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium -g "reanálise"`

Require the drawer after reload to show human result, observation and acting-context label and not the raw slug.

Commit: `feat(pendencies): expose complete review evidence`

### Task 6: Reorganize the desktop queue into five functional groups

**Files:**

- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/task-9-cross-view.css`
- Modify: `src/styles/task-10-11-pendency-actions.css`
- Modify: `tests/e2e/task-9-pendencias.spec.js`
- Modify: `tests/e2e/task-9-cross-view.spec.js`

**Markup contract:** five columns named `Unidade`, `Contexto`, `Situação`, `Movimentação` and `Ações`. Each row has one visible primary action and a `Mais ações` menu whose extension point is `data-pendency-secondary-actions`.

- [ ] **Step 1: write RED geometry and semantics tests**

At both approved viewports open the queue and drawer, assert document `scrollWidth <= innerWidth + 1`, five headers, visible primary action, visible drawer and all bounding boxes within the viewport. Open `Mais ações` and require `Registrar contato` there.

Run: `npx playwright test tests/e2e/task-9-pendencias.spec.js tests/e2e/task-9-cross-view.spec.js --project=desktop-chromium -g "cinco grupos|drawer|1440|1280"`

Expected: FAIL with nine headers, `min-width: 1320px` and an off-screen action/drawer combination.

- [ ] **Step 2: implement grouped cells and extension slots**

Use:

```css
.pendency-operations-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}
```

Remove the 1320 px minimum. Keep drawer width within `clamp(360px, 32vw, 440px)`. Ensure long school/document/error text wraps. Inject contact/cancel/reopen only into the secondary-action container.

- [ ] **Step 3: verify and commit**

Run: `npx playwright test tests/e2e/task-9-pendencias.spec.js tests/e2e/task-9-cross-view.spec.js --project=desktop-chromium`

Commit: `feat(pendencies): keep queue and drawer actionable on desktop`

### Task 7: Make all six operation modals viewport-safe and retry-safe

**Files:**

- Modify: `index.html`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/styles/task-10-11-pendency-actions.css`
- Reuse: `src/integration/modal-accessibility.js`
- Modify: `tests/e2e/modal-accessibility.spec.js`
- Modify: `tests/e2e/pendency-cycle.spec.js`
- Modify: `tests/e2e/task-10-11-pendencias.spec.js`

**Contract:** open, submit, reanalyze, contact, cancel and reopen modals use a sticky header/footer grid with scrollable body. Submits set `aria-busy`, disable before awaiting, ignore duplicate submit, preserve fields on recoverable error, and close/reset only after confirmed persistence/reread.

- [ ] **Step 1: write RED tests for geometry, duplicate submission and recovery**

At 1440 × 900 and 1280 × 720, require header/footer and primary button inside viewport. Double-click primary and require exactly one persistence call. Force a recoverable conflict and require the modal/field values remain, `aria-busy` clears and submit re-enables. Verify initial focus, Escape and focus return.

Run: `npx playwright test tests/e2e/modal-accessibility.spec.js tests/e2e/pendency-cycle.spec.js tests/e2e/task-10-11-pendencias.spec.js --project=desktop-chromium -g "modal|envio duplo|preserva"`

Expected: FAIL for at least the 720 px footer, double-submit or field-preservation contract.

- [ ] **Step 2: implement one shared modal layout and operation guard**

```css
.pendency-operation-modal {
  max-height: min(90dvh, calc(100dvh - 32px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.pendency-operation-modal > .modal-body {
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

Reuse the existing accessibility installer; do not introduce a competing focus trap.

- [ ] **Step 3: verify and commit**

Run the focused command above and `npm run lint:e2e`.

Commit: `fix(pendencies): make operation modals desktop-safe`

### Task 8: Certify the complete lifecycle by authorized role and reload

**Files:**

- Modify: `tests/e2e/pendency-cycle.spec.js`
- Modify: `tests/e2e/task-9-pendencias.spec.js`
- Modify: `tests/e2e/task-10-11-pendencias.spec.js`

- [ ] **Step 1: write the serial Controller journey**

Execute with run-specific IDs:

```text
open → reject active duplicate → submit → replace before review
→ incorrect review → new submit → unavailable-file review
→ new submit → correct review/resolution → reload
→ reopen resolved → cancel → reload → reopen cancelled
→ contact → reload → search by review observation → inspect full timeline
```

Require four ordered attempts, expected history event types, current open status with both terminal markers null, and the contact linked to the pendency.

- [ ] **Step 2: replace the obsolete Assistant denial with a positive journey**

Require Assistant submission/reanalysis and event identity `authenticatedRole === 'federal_assistant'`, `actingProfile === 'assistente'`.

- [ ] **Step 3: add the technical-admin acting-profile journey and negative roles**

Authenticate as technical admin, act visually as Controlador, reanalyze and assert real actor UUID/role plus acting profile in state and drawer. SME/Inventory common identities must fail before transaction and leave state unchanged.

- [ ] **Step 4: run the complete desktop cycle and commit**

Run: `npx playwright test tests/e2e/pendency-cycle.spec.js tests/e2e/task-9-pendencias.spec.js tests/e2e/task-10-11-pendencias.spec.js --project=desktop-chromium`

Run: `npm run lint:e2e`

Commit: `test(pendencies): certify full desktop lifecycle by role`

### Task 9: Prove existing RPC/RLS authority and audit authorship before considering a migration

**Files:**

- Modify: `supabase/tests/database/operational-command-rpc.test.sql`
- Modify if the closest existing suite is the correct boundary: `supabase/tests/database/rls.test.sql`
- Create only after a genuine pgTAP RED: a new migration via `npx supabase migration new enforce_authenticated_audit_identity`

**Backend assertions:** technical admin completes the pendency cycle; Assistant can reanalyze; SME/Inventory are denied; `pendency_attempts.created_by` and `administrative_logs.actor_user_id` equal `auth.uid()`; acting visual data cannot replace real authorship; stale `row_version` leaves no partial effect.

- [ ] **Step 1: add pgTAP proof against the current schema**

Run in disposable Supabase:

```powershell
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
```

An authorization/authorship assertion that already passes is useful characterization. Do not manufacture RED by changing correct backend behavior.

- [ ] **Step 2: create a migration only for a proven failing invariant**

If `profile_name` or actor IDs trust a client-supplied visual label, keep the failing pgTAP test, create a new migration using the official command, make the database derive identity from `auth.uid()`/`current_app_role()`, then rerun reset/pgTAP/lint/types. Otherwise, make no schema change.

- [ ] **Step 3: run local database gates and commit**

Run: `npm run supabase:lint:db`

Run: `npm run supabase:gen:types`

Run: `npm run typecheck:database`

Run: `npm run supabase:stop`

Commit: `test(supabase): prove pendency authority and audit identity`

### Task 10: Align executable contracts and close the pendency slice

**Files:**

- Modify: `docs/reference/functional-contract-matrix/operations.json`
- Regenerate: `docs/reference/functional-contract-matrix.json`
- Regenerate: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`
- Modify: `docs/PROJECT_CONTEXT.md`
- Modify: `docs/DECISION_LOG.md`
- Modify: `docs/reference/PRODUCT_SURFACE_CATALOG.md`
- Modify: `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`
- Modify after evidence: `docs/CURRENT_STAGE.md`
- Modify after evidence: `docs/ROADMAP_ATUALIZACOES_2026.md`

- [ ] **Step 1: align PEND-01 through PEND-06 after executable proof**

Use allow roles `controller`, `federal_assistant`, `technical_admin`; deny `anonymous`, `sme_management`, `inventory`. Do not mark coverage `covered` until authenticated service/RPC/reread/reload/audit/compensation and negative no-mutation proofs are green.

- [ ] **Step 2: supersede, do not erase, the old technical-admin decision**

Add a new ADR that explicitly separates visual presentation, JWT, authority and authorship and marks the prior narrower operational rule as superseded.

- [ ] **Step 3: regenerate and run the full local gate**

Run: `npm run generate:functional-matrix`

Run: `npm run check:functional-matrix`

Run: `npm run check:workflow-references`

Run: `npm run audit:frontend-precedence:check`

Run: `npm run test:frontend-precedence`

Run: `npm run test:readiness`

Run: `git diff --check`

Commit: `docs(pendencies): align authority lifecycle and evidence`
