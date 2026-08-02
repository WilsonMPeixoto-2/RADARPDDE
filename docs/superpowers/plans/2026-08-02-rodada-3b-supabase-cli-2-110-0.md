# Supabase CLI 2.110.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o Supabase CLI do RADAR PDDE de `2.109.1` para `2.110.0` com lockfile reproduzível e comprovação integral de compatibilidade, sem alterar produto, banco ou Production.

**Architecture:** A alteração fica isolada em uma branch e um PR. O `package-lock.json` é regenerado por npm em Node 24, e a nova CLI é validada em stacks Supabase locais descartáveis pelos workflows existentes. O PR só é integrado após todos os gates obrigatórios e uma revisão final do diff.

**Tech Stack:** Node.js 24.x, npm, Supabase CLI 2.110.0, Docker, PostgreSQL/pgTAP, GitHub Actions, Playwright, TypeScript, Vercel build.

## Global Constraints

- A versão-alvo é exatamente `supabase@2.110.0`.
- Não atualizar `@supabase/supabase-js` nem qualquer outro pacote intencionalmente.
- Não modificar migrations, schema, seeds, RLS, Auth, Edge Functions ou dados.
- Não executar `db push`, deploy de Edge Function ou qualquer escrita no Supabase remoto.
- Não abrir a janela de deployment da Vercel.
- Manter `vercel.json` com `git.deploymentEnabled: false`.
- Rejeitar a atualização se surgir vulnerabilidade alta ou crítica nova.
- Rejeitar diferenças inexplicadas em tipos, schema ou artefatos canônicos.
- Manter as 25 migrations e os cinco perfis como gates obrigatórios.

---

### Task 1: Registrar baseline e contratos da atualização

**Files:**
- Create: `docs/audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md`
- Test: `.github/workflows/dependency-health.yml`
- Test: `.github/workflows/supabase-local-readiness.yml`

**Interfaces:**
- Consumes: `package.json`, `package-lock.json`, scripts npm e workflows atuais.
- Produces: baseline documentado da versão 2.109.1 e lista exata dos gates obrigatórios.

- [ ] **Step 1: Registrar o baseline atual**

Documentar no arquivo de auditoria:

```markdown
- main de origem: 0718bd984ef9db4d6c52e40d43067599b4fb8a39
- versão anterior: 2.109.1
- versão-alvo: 2.110.0
- migrations esperadas: 25
- escopo de dependência: package.json e package-lock.json
- Production: fora do escopo
```

- [ ] **Step 2: Confirmar scripts que exercitam a CLI**

Verificar que permanecem presentes:

```text
supabase:start
supabase:stop
supabase:reset
supabase:test:db
supabase:lint:db
supabase:gen:types
check:supabase
check:supabase-final
test:backup-restore
test:readiness
```

- [ ] **Step 3: Confirmar os workflows obrigatórios**

Registrar os workflows de dependências, Supabase local/readiness, backup/restauração, Excel SME, Lighthouse e matrizes Playwright.

- [ ] **Step 4: Commit**

```bash
git add docs/audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md
git commit -m "docs: registrar baseline do Supabase CLI 2.110.0"
```

### Task 2: Atualizar a dependência e regenerar o lockfile

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm em Node 24 e o lockfile atual.
- Produces: instalação reproduzível de `supabase@2.110.0` sem atualização intencional de outros pacotes.

- [ ] **Step 1: Instalar a versão exata**

Run:

```bash
npm install --save-dev --save-exact supabase@2.110.0
```

Expected:

```text
package.json contém "supabase": "2.110.0"
package-lock.json resolve node_modules/supabase para 2.110.0
```

- [ ] **Step 2: Confirmar a versão efetiva**

Run:

```bash
npx supabase --version
```

Expected:

```text
2.110.0
```

- [ ] **Step 3: Validar instalação limpa**

Run:

```bash
rm -rf node_modules
npm ci
npx supabase --version
```

Expected: instalação concluída e versão `2.110.0`.

- [ ] **Step 4: Auditar o diff de dependências**

Run:

```bash
git diff -- package.json package-lock.json
npm audit --audit-level=high
npm run analyze:unused
```

Expected: nenhuma atualização intencional além de `supabase`; nenhuma vulnerabilidade alta ou crítica nova; análise de dependências aprovada.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: atualizar Supabase CLI para 2.110.0"
```

### Task 3: Validar a nova shell e a stack local

**Files:**
- Test: `supabase/config.toml`
- Test: `.github/workflows/supabase-local-readiness.yml`
- Modify only if a regression test is missing: `tests/integration/supabase-cli-stack.test.js`

**Interfaces:**
- Consumes: comandos `start`, `status` e `stop` da CLI 2.110.0.
- Produces: evidência de inicialização, consulta, interrupção, recuperação e encerramento da stack.

- [ ] **Step 1: Iniciar e consultar a stack**

Run:

```bash
npx supabase start
npx supabase status
```

Expected: todos os serviços necessários ficam saudáveis e `status` retorna sem erro.

- [ ] **Step 2: Encerrar sem backup**

Run:

```bash
npx supabase stop --no-backup
```

Expected: encerramento limpo, sem processo ou contêiner órfão do projeto.

- [ ] **Step 3: Validar recuperação após interrupção**

Run:

```bash
npx supabase start
# interromper somente o contêiner local do banco identificado pelo status
# executar novamente sem remover volumes
npx supabase start
npx supabase status
```

Expected: a segunda execução recupera a stack e o banco volta a ficar saudável sem reset destrutivo.

- [ ] **Step 4: Encerrar a stack**

Run:

```bash
npx supabase stop --no-backup
```

Expected: encerramento limpo.

- [ ] **Step 5: Adicionar teste somente se o comportamento não estiver coberto**

O teste deve executar a sequência `start → status → stop → start` e falhar explicitamente se qualquer comando retornar código diferente de zero.

- [ ] **Step 6: Commit se houver teste novo**

```bash
git add tests/integration/supabase-cli-stack.test.js
git commit -m "test: cobrir ciclo da stack no Supabase CLI 2.110.0"
```

### Task 4: Validar migrations, schema, pgTAP e tipos

**Files:**
- Test: `supabase/migrations/*.sql`
- Test: `supabase/tests/database/**`
- Test: `src/types/database.types.ts`

**Interfaces:**
- Consumes: stack local saudável e 25 migrations canônicas.
- Produces: schema reconstruído, pgTAP aprovado e tipos equivalentes.

- [ ] **Step 1: Executar reset local**

Run:

```bash
npx supabase start
npx supabase db reset --local
```

Expected: configuração validada, reset concluído e 25 migrations aplicadas sem alteração.

- [ ] **Step 2: Executar pgTAP**

Run:

```bash
npm run supabase:test:db
```

Expected: todos os testes do banco aprovados.

- [ ] **Step 3: Executar lint do banco**

Run:

```bash
npm run supabase:lint:db
```

Expected: nenhum erro bloqueante; eventual detecção nova deve ser investigada, não ignorada.

- [ ] **Step 4: Regenerar tipos em arquivo temporário**

Run:

```bash
npx supabase gen types typescript --local --schema public > /tmp/database.types.2.110.0.ts
diff -u src/types/database.types.ts /tmp/database.types.2.110.0.ts
```

Expected: diff vazio. Se houver diferença legítima de formatação, comprová-la semanticamente e atualizar o contrato somente com teste correspondente.

- [ ] **Step 5: Executar os checks canônicos**

Run:

```bash
npm run check:supabase
npm run check:supabase-final
npm run typecheck:database
```

Expected: todos aprovados.

- [ ] **Step 6: Encerrar a stack**

Run:

```bash
npx supabase stop --no-backup
```

Expected: encerramento limpo.

### Task 5: Validar Auth, RLS e Edge Function

**Files:**
- Test: `scripts/bootstrap-local-auth-fixtures.mjs`
- Test: `scripts/check-local-auth-fixtures.mjs`
- Test: `scripts/check-team-account-function.mjs`
- Test: `supabase/functions/**`

**Interfaces:**
- Consumes: schema local reconstruído e fixtures canônicas.
- Produces: autenticação, isolamento RLS e função de gestão de contas aprovados.

- [ ] **Step 1: Inicializar a stack e as fixtures**

Run:

```bash
npx supabase start
npm run bootstrap:auth-fixtures
npm run check:auth-fixtures
```

Expected: identidades e perfis locais disponíveis e verificados.

- [ ] **Step 2: Validar a função de gestão de contas**

Run:

```bash
npm run check:team-account-function
```

Expected: domínio, autorização e respostas da função aprovados.

- [ ] **Step 3: Validar bundling da Edge Function**

Executar o comando de bundle já usado pelo workflow do repositório com a CLI 2.110.0, sem `functions deploy`.

Expected: bundle concluído pelo caminho Docker restaurado, sem publicação remota.

- [ ] **Step 4: Executar testes de RLS e integração**

Run:

```bash
npm run test:integration
npm run audit:functional
```

Expected: isolamento por perfil/escola e persistência aprovados.

- [ ] **Step 5: Encerrar a stack**

Run:

```bash
npx supabase stop --no-backup
```

Expected: encerramento limpo.

### Task 6: Validar backup, restauração e regressão integral

**Files:**
- Test: `scripts/verify-supabase-backup-restore.mjs`
- Test: `playwright.config.js`
- Test: `playwright.audit.config.js`
- Test: workflows obrigatórios do repositório

**Interfaces:**
- Consumes: dependência e stack validadas nas tarefas anteriores.
- Produces: decisão final de compatibilidade da atualização.

- [ ] **Step 1: Executar backup e restauração descartáveis**

Run:

```bash
npm run test:backup-restore
```

Expected: backup criado, restauração concluída e contratos pós-restauração aprovados.

- [ ] **Step 2: Executar readiness integral**

Run:

```bash
npm run test:readiness
```

Expected: todos os checks de sintaxe, workflows, bundles, lint, unidade, Excel, integração, Supabase, tipos e auditoria aprovados.

- [ ] **Step 3: Executar E2E completo**

Run:

```bash
npm run test:e2e
npm run test:mobile
```

Expected: cinco perfis aprovados em desktop, Android e iPhone.

- [ ] **Step 4: Executar Lighthouse e build**

Run:

```bash
npm run audit:lighthouse
npm run build:vercel
```

Expected: pisos atuais preservados e build concluído sem deployment.

- [ ] **Step 5: Confirmar ausência de alterações geradas**

Run:

```bash
git status --short
git diff --check
```

Expected: árvore limpa, exceto evidências explicitamente versionadas; nenhum erro de whitespace.

### Task 7: Registrar evidências, abrir PR e integrar

**Files:**
- Modify: `docs/audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md`
- Create: `docs/evidence/releases/2026-08-02-supabase-cli-2-110-0.json`

**Interfaces:**
- Consumes: resultados de todas as tarefas e workflows.
- Produces: PR auditável e `main` atualizada sem deployment Production.

- [ ] **Step 1: Registrar resultados objetivos**

A auditoria deve conter versão efetiva, SHA da branch, comandos executados, número de migrations, resultados de pgTAP/lint/tipos/Auth/RLS/Edge Function/backup/E2E/Lighthouse e declaração explícita de ausência de ações remotas.

- [ ] **Step 2: Criar evidência JSON**

Usar a estrutura:

```json
{
  "release": "supabase-cli-2.110.0-2026-08-02",
  "from": "2.109.1",
  "to": "2.110.0",
  "migrations": 25,
  "productionChanged": false,
  "databaseChanged": false,
  "vercelDeployment": false,
  "gates": {}
}
```

Preencher `gates` somente com resultados comprovados.

- [ ] **Step 3: Commit da evidência**

```bash
git add docs/audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md docs/evidence/releases/2026-08-02-supabase-cli-2-110-0.json
git commit -m "docs: registrar validação do Supabase CLI 2.110.0"
```

- [ ] **Step 4: Abrir PR**

O corpo do PR deve listar escopo, benefícios, diff de dependências, gates, riscos validados e limites de Production.

- [ ] **Step 5: Aguardar e revisar todos os workflows**

Não integrar enquanto houver job pendente, cancelado ou falho. Investigar falhas reais; rerun somente para falha comprovadamente transitória.

- [ ] **Step 6: Revisar o diff final**

Expected: atualização da CLI, lockfile, especificação, plano, auditoria, evidência e testes estritamente necessários; nenhum arquivo funcional ou de banco alterado.

- [ ] **Step 7: Integrar o PR**

Integrar somente com todos os gates verdes. Como `git.deploymentEnabled` permanece `false`, o merge não deve produzir deployment Production.

- [ ] **Step 8: Verificação pós-merge**

Confirmar o SHA de `main`, `package.json` com `2.110.0`, ausência de novo deployment Production e permanência do bloqueio da Vercel.
