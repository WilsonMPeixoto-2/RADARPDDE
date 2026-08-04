# Monitoramento Geral de Production — Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implantar uma verificação horária e pós-deployment, não destrutiva, do shell público, manifesto, assets, Supabase anônimo e Edge Function do RADAR PDDE em Production.

**Architecture:** Um módulo puro concentra descoberta e validação de recursos; um CLI executa requisições com timeout, repetição e diagnóstico estruturado; um workflow do GitHub Actions executa o CLI e o preflight existente. A solução usa apenas APIs nativas do Node.js 24 e reaproveita contratos já existentes.

**Tech Stack:** Node.js 24, `node:test`, Fetch API nativa, GitHub Actions, Vercel Production e Supabase Production.

## Global Constraints

- Não instalar dependências.
- Não modificar banco, Auth, RLS, migrations ou dados reais.
- Não registrar chaves, tokens, senhas ou conteúdo sensível.
- Usar `https://radarpdde-fix.vercel.app` como alias oficial.
- Exigir `runtimeEnvironment=production`, `dataMode=supabase-production`, `supabaseRepositoryEnabled=true` e `productionActivationApproved=true`.
- Manter o preflight CORS fail-closed, sem wildcard na Edge Function administrativa.
- Executar a verificação em `push` para `main`, cron horário e `workflow_dispatch`.

---

### Task 1: Contratos puros do smoke de Production

**Files:**
- Create: `tests/unit/production-system-smoke.test.js`
- Create: `scripts/lib/production-system-smoke.mjs`

**Interfaces:**
- Produces: `extractLocalAssetPaths(html: string): string[]`
- Produces: `validateProductionManifest(value: unknown, expectedCommitSha?: string): object`
- Produces: `validateProductionShell(html: string): void`
- Produces: `validateAssetResponse(path: string, response: { status: number, contentType: string, bytes: number, textSample: string }): void`

- [ ] **Step 1: Write failing unit tests**

Cover local asset discovery, exclusion of external/data/hash links, production manifest requirements, login shell requirements and rejection of HTML returned for JavaScript/CSS.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/unit/production-system-smoke.test.js`
Expected: FAIL because `scripts/lib/production-system-smoke.mjs` does not exist.

- [ ] **Step 3: Implement minimal pure contracts**

Implement only the exported functions required by the tests, using `URL`, regular expressions limited to HTML attribute discovery and explicit validation errors with stable `code` properties.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/unit/production-system-smoke.test.js`
Expected: PASS with zero failures.

- [ ] **Step 5: Commit**

Commit message: `test: definir contratos do smoke geral de Production`

### Task 2: CLI não destrutivo de Production

**Files:**
- Create: `scripts/check-production-system.mjs`
- Modify: `package.json`
- Test: `tests/unit/production-system-smoke.test.js`

**Interfaces:**
- Consumes: exports from `scripts/lib/production-system-smoke.mjs`
- Produces: CLI `node scripts/check-production-system.mjs --base-url <url> --expected-commit <sha> --attempts <n> --interval-ms <ms>`

- [ ] **Step 1: Add failing tests for argument parsing and retry eligibility**

Test that positive integer parameters are required and that only deployment propagation failures are retryable.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/unit/production-system-smoke.test.js`
Expected: FAIL because the CLI helpers do not exist.

- [ ] **Step 3: Implement the CLI**

The CLI must:

1. fetch `/radar-build-manifest.json` with cache busting;
2. wait for the expected commit when requested;
3. fetch `/` and validate the login shell;
4. discover every local `src` and stylesheet/icon `href` in the HTML;
5. fetch every discovered asset with timeout and reject empty, failed or HTML-substituted JavaScript/CSS responses;
6. read the public runtime through `config.runtime.js` only to obtain the Supabase URL and publishable key without printing the key;
7. call `/rest/v1/schools?select=id&limit=1` and require an empty anonymous result;
8. print a JSON summary containing commit, checked asset count, anonymous RLS status and duration.

- [ ] **Step 4: Add package scripts and syntax coverage**

Add `check:production-system` and include the new files in the existing `check` script.

- [ ] **Step 5: Run unit and syntax checks**

Run:

```bash
node --check scripts/lib/production-system-smoke.mjs
node --check scripts/check-production-system.mjs
node --test tests/unit/production-system-smoke.test.js
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

Commit message: `feat: adicionar smoke geral não destrutivo de Production`

### Task 3: Workflow horário e pós-deployment

**Files:**
- Create: `.github/workflows/production-system-smoke.yml`
- Modify: `.github/workflows/production-team-account-preflight.yml`
- Test: `scripts/check-workflow-references.mjs`

**Interfaces:**
- Consumes: `npm run check:production-system` and `scripts/check-production-team-account-preflight.mjs`
- Produces: workflow `Monitoramento contínuo de Production`

- [ ] **Step 1: Add workflow contract test**

Extend an existing unit/contract test or add a focused unit test requiring `push` on `main`, hourly `schedule`, `workflow_dispatch`, permissions read-only except issues if incident automation is later enabled, timeout and both smoke commands.

- [ ] **Step 2: Run test to verify RED**

Run the focused test and confirm it fails because the workflow is absent.

- [ ] **Step 3: Create workflow**

Use pinned SHAs for `actions/checkout` and `actions/setup-node`. Run the core smoke with 60 attempts and 10-second interval on `push`, and one attempt on scheduled/manual checks. Run the CORS preflight after the core smoke. Publish a Markdown summary even on failure.

- [ ] **Step 4: Keep the specific preflight workflow PR-scoped**

Do not duplicate its hourly schedule; the general monitor becomes the scheduled owner, while the existing workflow remains a focused PR gate.

- [ ] **Step 5: Validate workflow references**

Run: `node scripts/check-workflow-references.mjs`
Expected: all workflow references valid.

- [ ] **Step 6: Commit**

Commit message: `ci: monitorar Production do RADAR a cada hora`

### Task 4: Remote verification and integration

**Files:**
- No additional production files unless validation exposes a defect.

- [ ] **Step 1: Execute full readiness on the branch**

Run: `npm run test:readiness`
Expected: exit 0.

- [ ] **Step 2: Execute the new smoke against Production**

Run with the current production commit and confirm all public assets, manifest, anonymous RLS and CORS pass.

- [ ] **Step 3: Review logs for secret exposure**

Confirm the output contains no publishable key, bearer token, password, service-role key or database credentials.

- [ ] **Step 4: Merge through PR**

Require successful CI and Vercel preview before merging to `main`.

- [ ] **Step 5: Verify the post-merge production run**

Confirm the workflow triggered by `push` reaches success against the commit now exposed by `/radar-build-manifest.json`.
