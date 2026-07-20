# RADAR PDDE Supabase Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carregar e reconciliar os dados canônicos do RADAR, criar o primeiro administrador técnico e ativar Preview e Production do projeto Vercel existente sobre o Supabase `scnryinorqeucbfkioxo`.

**Architecture:** O estado inicial versionado em `app.js` é materializado por uma instância local limpa e exportado pelo contrato canônico já existente. Ferramentas administrativas separadas usam apenas variáveis de ambiente para carga e bootstrap de Auth; a aplicação pública continua recebendo somente URL e chave `sb_publishable_`, primeiro em Preview e depois em Production. Operações remotas são executadas somente após revisão dos commits locais e sempre seguidas de reconciliação direta.

**Tech Stack:** Node.js 24, JavaScript ESM/CommonJS, Supabase JS 2.110.7, Supabase CLI 2.109.1, PostgreSQL 17/pgTAP, Playwright 1.61.1, Vercel static build.

## Global Constraints

- Repositório: `WilsonMPeixoto-2/RADARPDDE`; branch: `activation/finalizar-supabase`.
- Projeto Supabase único: `scnryinorqeucbfkioxo`; não criar outro projeto, não resetar o banco e não reaplicar as 13 migrations de base.
- Projeto Vercel: `radarpdde-fix`; project ID `prj_GfXuUuO3dF2jykpp9QgyqIDsxg4U`; team ID `team_EFJunPOtGozS99jZ6zkIQXHF`.
- Não executar nem aguardar o workflow de preflight do GitHub Actions.
- Não atualizar dependências e não instalar Analytics, Realtime, Storage, React, Next.js, Vite ou outro framework.
- Não inventar escolas, programas, competências, controladores, integrantes ou contatos; a fonte é o estado inicial real da aplicação em `app.js` materializado pelo contrato local.
- Não versionar snapshot operacional, senha, token, service role, senha do banco ou chave publicável completa.
- Somente a URL do projeto e uma chave ativa `sb_publishable_` podem chegar ao navegador.
- Cadastro público e login anônimo permanecem desabilitados; `team-account-management` permanece com `verify_jwt=true`.
- Production só muda para `supabase-production` após banco reconciliado, primeiro administrador funcional e smoke test aprovado em Preview.
- `LocalStorageRepository` e snapshot permanecem disponíveis como fallback técnico, sem fallback silencioso nem escrita paralela em Production.
- Cada alteração de código segue TDD: teste falhando, implementação mínima, teste passando e commit coerente.

---

### Task 1: Migration de hardening e auditoria remota versionada

**Files:**
- Create via `supabase migration new activation_basic_hardening`: caminho exato impresso pela CLI sob `supabase/migrations/`, com sufixo `_activation_basic_hardening.sql`
- Create: `tests/unit/activation-basic-hardening.test.js`
- Modify: `supabase/tests/database/rls.test.sql`
- Modify: `scripts/check-supabase-final-alignment.js`
- Modify: `scripts/check-supabase-readiness.js`
- Modify: `tests/unit/auth-database-gate.test.js`
- Modify: `tests/unit/audit-tools.test.js`
- Create: `docs/reports/SUPABASE_ACTIVATION_AUDIT.md`

**Interfaces:**
- Consumes: a função `public.capture_audit_event()` criada em `202607130003_audit_and_import.sql` e usada somente por triggers institucionais.
- Produces: a 14ª migration, com `EXECUTE` negado a `PUBLIC`, `anon` e `authenticated`, preservado para `service_role`, mais gates que reconhecem exatamente 14 migrations.

- [ ] **Step 1: Consultar a ajuda da CLI e criar o arquivo pela CLI**

Run:

```powershell
npx --no-install supabase migration new --help
npx --no-install supabase migration new activation_basic_hardening
```

Expected: a CLI imprime um único arquivo novo com sufixo `_activation_basic_hardening.sql`.

- [ ] **Step 2: Escrever testes que falham**

O teste estático deve localizar o arquivo pelo sufixo e exigir:

```js
assert.match(sql, /revoke\s+execute\s+on\s+function\s+public\.capture_audit_event\(\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.capture_audit_event\(\)\s+to\s+service_role/i);
assert.doesNotMatch(sql, /create\s+or\s+replace\s+function\s+public\.capture_audit_event/i);
```

O pgTAP deve acrescentar:

```sql
select ok(
  not has_function_privilege('anon', 'public.capture_audit_event()', 'EXECUTE'),
  'anon não executa capture_audit_event diretamente'
);
select ok(
  not has_function_privilege('authenticated', 'public.capture_audit_event()', 'EXECUTE'),
  'authenticated não executa capture_audit_event diretamente'
);
select ok(
  has_function_privilege('service_role', 'public.capture_audit_event()', 'EXECUTE'),
  'service_role preserva execução administrativa'
);
```

- [ ] **Step 3: Confirmar RED**

Run:

```powershell
npm run test:unit
```

Expected: FAIL porque a migration ainda está vazia e os gates ainda esperam 13 migrations.

- [ ] **Step 4: Implementar a migration mínima e alinhar gates**

Conteúdo integral da migration:

```sql
-- Restringe a chamada direta da função trigger SECURITY DEFINER sem alterar sua lógica.
revoke execute on function public.capture_audit_event() from public, anon, authenticated;
grant execute on function public.capture_audit_event() to service_role;
```

Atualizar gates ativos de 13 para 14 e registrar no relatório somente: projeto, região, PostgreSQL, 13 migrations encontradas antes desta alteração, 20 tabelas, 20 com RLS, 70 políticas, função ativa/`verify_jwt=true`, zero usuários e ACL sanitizada.

- [ ] **Step 5: Confirmar GREEN e commit**

Run:

```powershell
npm run test:unit
npm run check:supabase
npm run check:supabase-final
```

Expected: PASS.

Commit:

```powershell
git add supabase/migrations supabase/tests/database/rls.test.sql tests/unit/activation-basic-hardening.test.js scripts/check-supabase-final-alignment.js scripts/check-supabase-readiness.js tests/unit/auth-database-gate.test.js tests/unit/audit-tools.test.js docs/reports/SUPABASE_ACTIVATION_AUDIT.md
git commit -m "fix: restringir função de auditoria remota"
```

---

### Task 2: Exportador canônico e importador remoto idempotente

**Files:**
- Create: `scripts/export-local-snapshot.mjs`
- Create: `scripts/lib/remote-bootstrap.mjs`
- Create: `scripts/bootstrap-supabase-remote.mjs`
- Create: `tests/unit/remote-bootstrap.test.js`
- Create: `tests/integration/remote-bootstrap-flow.test.js`
- Modify: `package.json`
- Modify: `scripts/check-supabase-readiness.js`
- Modify: `.gitignore`
- Create: `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md`

**Interfaces:**
- Consumes: `window.RadarLocalStorageRepository.LocalStorageRepository`, `window.RadarDataContext.ready`, `validateSnapshot`, `reconcileSnapshots`, `RADAR_ENTITIES`, `SupabaseRepository` e `IMPORT_ORDER`.
- Produces: `sanitizeBootstrapSnapshot(snapshot)`, `inspectDestination(repository)`, `bootstrapRemoteSnapshot({ repository, snapshot, mode, batchSize })` e três comandos npm que usam `RADAR_SUPABASE_URL`, `RADAR_SUPABASE_SERVICE_ROLE_KEY` e `RADAR_SNAPSHOT_FILE`.

- [ ] **Step 1: Escrever testes do exportador/importador**

Cobrir, com cliente Supabase falso e repositório injetável:

```js
test('rejeita snapshot inválido', async () => { /* expect VALIDATION_FAILED */ });
test('rejeita variável administrativa ausente sem imprimir segredo', async () => { /* expect env error */ });
test('aceita destino vazio ou contendo somente cinco profiles', async () => { /* expect compatible */ });
test('interrompe em IDs ou conteúdo incompatível', async () => { /* expect DESTINATION_CONFLICT */ });
test('grava na ordem canônica em lotes', async () => { /* compare calls to IMPORT_ORDER */ });
test('reconcilia e permite reexecução idempotente', async () => { /* second run writes zero rows */ });
```

- [ ] **Step 2: Confirmar RED**

Run:

```powershell
node --test tests/unit/remote-bootstrap.test.js tests/integration/remote-bootstrap-flow.test.js
```

Expected: FAIL porque os módulos ainda não existem.

- [ ] **Step 3: Implementar o exportador sobre uma aplicação limpa**

O exportador deve abrir `http://127.0.0.1:4175` por padrão, aguardar `window.RadarDataContext?.ready === true`, instanciar o repositório canônico e retornar:

```js
const repository = new window.RadarLocalStorageRepository.LocalStorageRepository({
  storage: window.localStorage,
  schemaVersion: '1'
});
return repository.exportSnapshot({ includeEmpty: true, importId, exportedAt });
```

Antes de escrever o arquivo, definir como listas vazias `userProfiles`, `userSchoolScopes`, `auditEvents` e `dataImportRuns`. O destino vem de `RADAR_SNAPSHOT_FILE`; diretórios são criados com permissão local e o snapshot nunca é commitado.

- [ ] **Step 4: Implementar o núcleo remoto**

`bootstrapRemoteSnapshot` deve:

```js
validateSnapshot(snapshot);
const sanitized = sanitizeBootstrapSnapshot(snapshot);
const before = await repository.exportSnapshot({ includeEmpty: true });
assertDestinationCompatible(before, sanitized);
if (mode === 'validate' || mode === 'plan') return createSanitizedReport(...);
for (const entity of IMPORT_ORDER) {
  for (const batch of createBatches(sanitized.entities[entity] || [], batchSize)) {
    await repository.save(entity, batch);
  }
}
const after = await repository.exportSnapshot({ includeEmpty: true });
const reconciliation = reconcileSnapshots(sanitized, after);
if (!reconciliation.ok) throw new Error('RECONCILIATION_FAILED');
return createSanitizedReport(...);
```

Não executar `remove`, `restoreSnapshot({replace:true})` ou qualquer exclusão automática.

- [ ] **Step 5: Implementar CLI, comandos e documentação**

Adicionar:

```json
"bootstrap:supabase:validate": "node scripts/bootstrap-supabase-remote.mjs validate",
"bootstrap:supabase:plan": "node scripts/bootstrap-supabase-remote.mjs plan",
"bootstrap:supabase:import": "node scripts/bootstrap-supabase-remote.mjs import",
"bootstrap:supabase:reconcile": "node scripts/bootstrap-supabase-remote.mjs reconcile",
"snapshot:export:local": "node scripts/export-local-snapshot.mjs"
```

O CLI cria `createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })`, não imprime as variáveis e filtra mensagens que contenham `service_role`, `sb_secret_`, `password` ou `access_token`.

- [ ] **Step 6: Confirmar GREEN e commit**

Run:

```powershell
npm run check
node --test tests/unit/remote-bootstrap.test.js
node --test tests/integration/remote-bootstrap-flow.test.js
npm run test:unit
npm run test:integration
```

Expected: PASS.

Commit:

```powershell
git add .gitignore package.json scripts/export-local-snapshot.mjs scripts/lib/remote-bootstrap.mjs scripts/bootstrap-supabase-remote.mjs scripts/check-supabase-readiness.js tests/unit/remote-bootstrap.test.js tests/integration/remote-bootstrap-flow.test.js docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md
git commit -m "feat: adicionar bootstrap remoto de dados"
```

---

### Task 3: Bootstrap idempotente do primeiro administrador técnico

**Files:**
- Create: `scripts/lib/remote-admin-bootstrap.mjs`
- Create: `scripts/bootstrap-remote-admin.mjs`
- Create: `tests/unit/remote-admin-bootstrap.test.js`
- Modify: `package.json`
- Modify: `scripts/check-supabase-readiness.js`
- Create: `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md`

**Interfaces:**
- Consumes: Supabase Auth Admin, `profiles.id='technical_admin'`, `public.user_profiles` e `public.administrative_logs`.
- Produces: `bootstrapRemoteAdmin({ client, email, password })` e `npm run bootstrap:supabase:admin`, exclusivamente por `RADAR_SUPABASE_URL`, `RADAR_SUPABASE_SERVICE_ROLE_KEY`, `RADAR_BOOTSTRAP_ADMIN_EMAIL` e `RADAR_BOOTSTRAP_ADMIN_PASSWORD`.

- [ ] **Step 1: Escrever testes que falham**

Cobrir criação, usuário existente, reexecução, falta de variável, não exposição de senha/segredo, perfil `technical_admin`, ausência de carteira e compensação lógica quando o vínculo falhar.

- [ ] **Step 2: Confirmar RED**

Run:

```powershell
node --test tests/unit/remote-admin-bootstrap.test.js
```

Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Implementar bootstrap mínimo**

Fluxo obrigatório:

```js
const existing = await findAuthUserByEmail(client, email);
const user = existing ?? await createConfirmedUser(client, email, password);
await upsertTechnicalAdminProfile(client, user.id);
await writeSanitizedBootstrapLog(client, user.id);
return { ok: true, created: !existing, userId: user.id, profileId: 'technical_admin', active: true };
```

`user_profiles` deve ter `controller_id=null`, `inventory_member_id=null`, `cre_scope='4ª CRE'` e `active=true`. Em falha após criação do Auth, banir/desativar ou remover apenas o usuário recém-criado; nunca alterar um usuário preexistente como compensação.

- [ ] **Step 4: Implementar CLI e documentação**

Adicionar:

```json
"bootstrap:supabase:admin": "node scripts/bootstrap-remote-admin.mjs"
```

O relatório deve conter apenas `ok`, `created`, `userId`, `profileId` e `active`.

- [ ] **Step 5: Confirmar GREEN e commit**

Run:

```powershell
npm run check
node --test tests/unit/remote-admin-bootstrap.test.js
npm run check:team-account-function
```

Expected: PASS.

Commit:

```powershell
git add package.json scripts/lib/remote-admin-bootstrap.mjs scripts/bootstrap-remote-admin.mjs scripts/check-supabase-readiness.js tests/unit/remote-admin-bootstrap.test.js docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md
git commit -m "feat: adicionar bootstrap do administrador técnico"
```

---

### Task 4: Aplicação remota, carga e reconciliação

**Files:**
- Modify: `docs/reports/SUPABASE_ACTIVATION_AUDIT.md`
- Create: `docs/reports/SUPABASE_DATA_RECONCILIATION.md`

**Interfaces:**
- Consumes: migration da Task 1, snapshot gerado pela Task 2 e importador revisado.
- Produces: 14 migrations remotas, dados canônicos reconciliados e contagens sanitizadas por entidade.

- [ ] **Step 1: Aplicar somente a 14ª migration**

Usar `apply_migration`/CLI apontando para `scnryinorqeucbfkioxo` e confirmar que as 13 versões anteriores permanecem inalteradas.

- [ ] **Step 2: Exportar a fonte canônica limpa**

Run:

```powershell
npm start
$env:RADAR_SNAPSHOT_FILE = '<arquivo temporário fora do repositório>'
npm run snapshot:export:local
```

Expected: snapshot `radar-pdde-snapshot` versão `1`, com os dados reais da 4ª CRE e entidades de identidade/auditoria artificial vazias.

- [ ] **Step 3: Validar, planejar, importar e reconciliar**

Executar o importador com credenciais somente no ambiente seguro. Se a service role não estiver disponível ao processo local, usar o conector oficial Supabase para DML equivalente, preservando a mesma ordem, sem exclusões e a partir do mesmo snapshot sanitizado.

Expected: `app_config`, `programs`, `competences`, `controllers`, `inventory_team_members`, `schools` e `school_programs` com contagens idênticas à origem; `auth.users`, `user_profiles` e `user_school_scopes` ainda vazios.

- [ ] **Step 4: Verificar acesso e Advisors**

Confirmar anon sem leitura operacional, `capture_audit_event()` sem `EXECUTE` por anon/authenticated, Edge Function ativa com JWT e nenhum Advisor de segurança impeditivo.

- [ ] **Step 5: Registrar evidência e commit**

O relatório não contém registros individuais nem chaves completas.

Commit:

```powershell
git add docs/reports/SUPABASE_ACTIVATION_AUDIT.md docs/reports/SUPABASE_DATA_RECONCILIATION.md
git commit -m "docs: registrar carga reconciliada do Supabase"
```

---

### Task 5: Auth remoto, primeiro administrador e Edge Function

**Files:**
- Modify: `docs/reports/SUPABASE_ACTIVATION_AUDIT.md`
- Modify: `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md`

**Interfaces:**
- Consumes: banco carregado, script da Task 3, e-mail/senha administrativos fornecidos em canal seguro e URLs finais.
- Produces: um Auth user confirmado com perfil ativo `technical_admin`, login funcional e configuração Auth alinhada ao domínio oficial.

- [ ] **Step 1: Configurar Auth**

Aplicar:

```text
Site URL: https://radarpdde-fix.vercel.app
Redirect URLs: https://radarpdde-fix.vercel.app/** e http://localhost:4175/**
Public signup: disabled
Anonymous sign-in: disabled
```

Adicionar também a URL exata do Preview quando existir.

- [ ] **Step 2: Executar bootstrap administrativo**

Executar `npm run bootstrap:supabase:admin` com as quatro variáveis somente no ambiente seguro. Confirmar um registro correspondente em `auth.users` e `user_profiles`, perfil `technical_admin`, ativo e sem carteira.

- [ ] **Step 3: Validar login e sessão**

Confirmar login válido, inválido rejeitado, restauração após reload, logout e recuperação apontando ao domínio oficial.

- [ ] **Step 4: Validar Edge Function**

Confirmar: sem JWT rejeita; usuário comum rejeita; `technical_admin` é autorizado nas operações permitidas; `verify_jwt=true` permanece. Uma conta controlada de teste deve ser desativada/removida após o teste.

- [ ] **Step 5: Registrar evidência e commit**

Commit:

```powershell
git add docs/reports/SUPABASE_ACTIVATION_AUDIT.md docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md
git commit -m "docs: registrar validação do Auth remoto"
```

---

### Task 6: Preview Vercel e homologação E2E

**Files:**
- Modify only if a real defect is found: implementation/test files directly responsible for that defect
- Create: `docs/reports/VERCEL_SUPABASE_SMOKE_TEST.md`

**Interfaces:**
- Consumes: branch publicada, banco reconciliado, administrador funcional, URL Supabase e chave moderna publicável.
- Produces: Preview `READY` com manifesto `supabase-preview` e smoke test aprovado por browser real.

- [ ] **Step 1: Configurar variáveis somente em Preview**

```text
RADAR_ENVIRONMENT=preview
RADAR_DATA_MODE=supabase-preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://scnryinorqeucbfkioxo.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=<valor obtido diretamente do Supabase, nunca versionado ou logado>
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

- [ ] **Step 2: Publicar a branch e conferir manifesto**

Expected:

```json
{
  "vercelEnvironment": "preview",
  "runtimeEnvironment": "preview",
  "dataMode": "supabase-preview",
  "supabaseRepositoryEnabled": true,
  "productionActivationApproved": false
}
```

- [ ] **Step 3: Executar smoke test de administrador em desktop e mobile**

Cobrir login válido/inválido, reload, logout, Dashboard, Carteira, filtros, unidade escolar, pendência controlada com persistência e limpeza, Gestão de Equipe, Edge Function, console sem erro grave, sem loop/tela vazia/fallback local.

- [ ] **Step 4: Executar matriz negativa mínima**

Cobrir acesso anônimo, usuário sem perfil, usuário desativado, controlador fora da carteira, Inventário sem administração e SME conforme matriz vigente. Usar contas temporárias e removê-las/desativá-las ao final.

- [ ] **Step 5: Corrigir somente defeitos reais, repetir e commit**

Run após qualquer correção:

```powershell
npm run check
npm run test:unit
npm run test:integration
npm run check:team-account-function
npm run check:supabase
npm run check:supabase-final
```

Commit do relatório/correções:

```powershell
git add docs/reports/VERCEL_SUPABASE_SMOKE_TEST.md
git commit -m "test: registrar homologação do Preview Supabase"
```

---

### Task 7: Documentação, PR, merge e ativação da Production

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/DECISION_LOG.md`
- Modify: `README.md`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`
- Modify or Create: runbook de operação/recuperação localizado no repositório
- Modify: `docs/reports/VERCEL_SUPABASE_SMOKE_TEST.md`

**Interfaces:**
- Consumes: evidências das Tasks 1–6 e Preview aprovado.
- Produces: PR revisado/mergeado, Production `READY` em `supabase-production` e documentação sem estado pré-Supabase obsoleto.

- [ ] **Step 1: Atualizar documentação final**

Registrar projeto ref, 14 migrations, dados reconciliados, Edge Function ativa, Auth/administrador, procedimento de usuários/snapshot, rollback temporário para local e decisão que substitui ADR-002/ADR-003 na data de 20 de julho de 2026.

- [ ] **Step 2: Rodar todos os gates locais**

Run:

```powershell
npm ci
npm run check
npm run test:unit
npm run test:integration
npm run check:team-account-function
npm run check:supabase
npm run check:supabase-final
npm run check:generated
npm run typecheck:database
```

Expected: PASS em todos.

- [ ] **Step 3: Revisão final, push e PR**

O PR deve afirmar que as 13 migrations de base não foram reaplicadas, listar somente contagens sanitizadas e não conter qualquer segredo.

- [ ] **Step 4: Configurar Production após Preview aprovado**

```text
RADAR_ENVIRONMENT=production
RADAR_DATA_MODE=supabase-production
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://scnryinorqeucbfkioxo.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=<mesma chave moderna ativa>
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=true
```

Não configurar qualquer service role, token, senha de banco ou database URL na Vercel.

- [ ] **Step 5: Fazer merge e verificar Production**

Expected: deployment automático da `main` em `READY` e manifesto:

```json
{
  "vercelEnvironment": "production",
  "runtimeEnvironment": "production",
  "dataMode": "supabase-production",
  "supabaseRepositoryEnabled": true,
  "productionActivationApproved": true
}
```

- [ ] **Step 6: Repetir smoke essencial em Production**

Confirmar login, Dashboard, Carteira, unidade, persistência, Gestão de Equipe, logout, mobile, rede apontando para `scnryinorqeucbfkioxo` e nenhum segredo em HTML/JavaScript/localStorage/manifesto.

