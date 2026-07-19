# Alinhamento funcional final pré-Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** alinhar frontend, serviços, Auth, RLS, migrations, Vercel e documentação ao contrato consolidado de quatro perfis funcionais, papel técnico separado e gestão plena da equipe pela Assistente.

**Architecture:** preservar `DirectoryService` e o contrato único de repositório. Operações de equipe usam persistência padrão no modo local e uma Edge Function autenticada no modo Supabase; a função usa Auth Admin e RPCs PostgreSQL transacionais, com compensação de falhas. Um workflow manual de Preview executa o build Vercel versionado e publica somente artefato prebuilt.

**Tech Stack:** JavaScript UMD no navegador, Node.js 24 `node:test`, Supabase JS 2.110.5, Edge Functions TypeScript/Deno, PostgreSQL 17, RLS/pgTAP, GitHub Actions e Vercel CLI 56.2.0.

## Global Constraints

- Production permanece em `dataMode: local`, sem URL, chave ou repositório Supabase habilitado.
- O seletor apresenta exatamente quatro perfis funcionais.
- `technical_admin` não herda a interface da Assistente.
- `federal_assistant` possui gestão plena de controladores e Inventário.
- `sme_management` não mantém a equipe da CRE.
- Chaves secretas nunca são publicadas no navegador, artefatos ou logs.
- Nenhum projeto Supabase remoto é criado ou alterado por este plano.
- O conjunto final contém 13 migrations.
- Alterações visuais não relacionadas permanecem fora do pacote.

---

### Task 1: Criar testes vermelhos do contrato funcional

**Files:**
- Modify: `tests/unit/auth-gate.test.js`
- Modify: `tests/unit/directory-service.test.js`
- Create: `tests/unit/team-account-gateway.test.js`
- Create: `tests/unit/team-account-domain.test.js`
- Create: `tests/unit/vercel-preview-workflow.test.js`
- Modify: `tests/unit/auth-database-gate.test.js`

**Interfaces:**
- Produces: contrato esperado para `operationalProfileForRole`, `isTechnicalRole`, `TeamAccountGateway` e persistência remota do `DirectoryService`.

- [ ] **Step 1: testar quatro perfis operacionais e papel técnico separado**

Esperar `technical_admin` fora do mapa operacional e `isTechnicalRole('technical_admin') === true`.

- [ ] **Step 2: testar o gateway remoto**

Validar `client.functions.invoke('team-account-management', { body })`, normalização de erros e rejeição quando o cliente não oferece Functions.

- [ ] **Step 3: testar o DirectoryService remoto**

O harness deve executar `command.persist`; cadastro e desativação devem chamar o gateway com controlador/integrante, log e redistribuição corretos. O harness sem gateway deve continuar usando `defaultPersist`.

- [ ] **Step 4: testar o domínio compartilhado da Edge Function**

Validar operações aceitas, e-mail, papel gestor, metadados de convite e rejeição de payload incompleto.

- [ ] **Step 5: testar o workflow Vercel**

Exigir `workflow_dispatch`, alvo Preview, `vercel build`, manifesto e `vercel deploy --prebuilt`; rejeitar `--prod`.

- [ ] **Step 6: testar o gate de banco**

Exigir a 13ª migration, a Edge Function e as novas RPCs/políticas no conjunto de artefatos.

- [ ] **Step 7: publicar o commit e confirmar CI vermelha pela ausência das implementações**

Commit: `test: definir contrato final de perfis e gestão de equipe`.

---

### Task 2: Separar o papel técnico no frontend autenticado

**Files:**
- Modify: `src/integration/auth-gate.js`
- Modify: `tests/unit/auth-gate.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `ROLE_TO_OPERATIONAL_PROFILE`, `operationalProfileForRole(role)`, `isTechnicalRole(role)` e renderização técnica neutra.

- [ ] **Step 1: remover `technical_admin` do mapa operacional**

O mapa deve conter somente `controller`, `federal_assistant`, `inventory` e `sme_management`.

- [ ] **Step 2: implementar tratamento técnico explícito**

`applyAuthorization` deve definir o contexto autenticado e, para `technical_admin`, esconder a navegação operacional, renderizar aviso técnico neutro e liberar o layout sem chamar `switchProfile('assistente')`.

- [ ] **Step 3: manter o fluxo atual dos quatro perfis**

Perfis operacionais continuam chamando `switchProfile` com os valores legados existentes.

- [ ] **Step 4: executar a suíte dirigida e confirmar verde**

Run: `node --test tests/unit/auth-gate.test.js`.

- [ ] **Step 5: commit**

Commit: `fix: separar administrador técnico dos perfis operacionais`.

---

### Task 3: Implementar gateway e persistência composta da Gestão de Equipe

**Files:**
- Create: `src/application/team-account-gateway.js`
- Modify: `src/application/directory-service.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `package.json`
- Modify: `tests/unit/directory-service.test.js`
- Create: `tests/unit/team-account-gateway.test.js`

**Interfaces:**
- `new TeamAccountGateway({ client, enabled })`
- `saveController(input)`
- `deactivateController(input)`
- `saveInventoryMember(input)`
- `deactivateInventoryMember(input)`

- [ ] **Step 1: implementar o gateway mínimo**

Cada método chama `team-account-management`, envia `operation` e converte falhas em `RepositoryError` com códigos públicos.

- [ ] **Step 2: injetar o gateway no bootstrap**

`initializeRadarData` deve guardar o cliente remoto; `initializeRadarApplicationServices` cria o gateway somente quando a conexão Supabase está ativa e o injeta no `DirectoryService`.

- [ ] **Step 3: adicionar persistência remota aos quatro comandos**

Cada comando captura o log retornado por `appendLog` e define `persist` apenas quando o gateway existe. A mutação local permanece idêntica e o modo local usa `defaultPersist`.

- [ ] **Step 4: carregar o novo módulo**

Adicionar script antes de `app.js` e incluir `node --check` no gate estático.

- [ ] **Step 5: executar testes dirigidos**

Run: `node --test tests/unit/directory-service.test.js tests/unit/team-account-gateway.test.js`.

- [ ] **Step 6: commit**

Commit: `feat: integrar gestão de equipe ao provisionamento remoto`.

---

### Task 4: Criar migration, RLS e RPCs de contas de equipe

**Files:**
- Create: `supabase/migrations/202607190001_team_management_auth_alignment.sql`
- Modify: `supabase/tests/database/rls.test.sql`
- Create: `supabase/tests/database/team-management-rpc.test.sql`
- Modify: `supabase/tests/smoke.sql`
- Modify: `scripts/check-supabase-readiness.js`
- Modify: `supabase/verification/remote-post-apply.sql`

**Interfaces:**
- `public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb)`
- `public.deactivate_controller_account(text, text, uuid, jsonb)`
- `public.deactivate_inventory_member_account(text, uuid, jsonb)`

- [ ] **Step 1: corrigir políticas RLS**

Recriar políticas de `INSERT`/`UPDATE` de controladores e Inventário para `technical_admin` e `federal_assistant`; manter leitura autenticada e delete técnico.

- [ ] **Step 2: criar helper interno de log**

Converter o log legado recebido em `administrative_logs`, fixando `actor_user_id`, perfil e instante.

- [ ] **Step 3: criar RPC de provisionamento**

Em uma transação, fazer upsert do integrante, associar `user_id`, criar/reativar `user_profiles` com perfil correto e inserir log. Restringir execução a `service_role`.

- [ ] **Step 4: criar RPCs de desativação**

Controlador: validar substituto, redistribuir escolas, desativar controlador e perfil, inserir log. Inventário: impedir desativação do último integrante, desativar membro e perfil, inserir log.

- [ ] **Step 5: ampliar pgTAP**

Testar privilégios, execução por `service_role`, bloqueio de `authenticated`/`anon`, efeitos transacionais e matriz Assistente/SME.

- [ ] **Step 6: atualizar manifesto e smoke**

Registrar 13 migrations e verificar funções/políticas no pós-aplicação.

- [ ] **Step 7: commit**

Commit: `feat: alinhar RLS e RPCs à gestão plena da assistente`.

---

### Task 5: Implementar Edge Function de convite e ciclo de acesso

**Files:**
- Create: `supabase/functions/_shared/team-account-domain.mjs`
- Create: `supabase/functions/team-account-management/index.ts`
- Modify: `supabase/config.toml`
- Create: `tests/unit/team-account-domain.test.js`
- Modify: `scripts/check-supabase-readiness.js`
- Modify: `package.json`

**Interfaces:**
- Operations: `save_controller`, `deactivate_controller`, `save_inventory_member`, `deactivate_inventory_member`.
- Auth Admin: `inviteUserByEmail`, `updateUserById`, `deleteUser`.

- [ ] **Step 1: implementar domínio puro**

Normalizar e validar payloads, e-mails, papéis gestores e metadados de convite em módulo testável por Node.

- [ ] **Step 2: autenticar e autorizar a chamada**

A função obtém o usuário pelo JWT, confirma `current_app_role()` e aceita somente `federal_assistant` ou `technical_admin`.

- [ ] **Step 3: implementar cadastro/edição**

Convidar usuário novo; editar Auth quando já vinculado; chamar RPC transacional; excluir convite recém-criado ou restaurar e-mail quando a RPC falhar.

- [ ] **Step 4: implementar desativação**

Banir o usuário antes da RPC e desfazer o banimento se a transação falhar. Integrantes sem `user_id` ainda são desativados no banco.

- [ ] **Step 5: configurar função protegida**

Adicionar `[functions.team-account-management]` com verificação de JWT e sem segredo versionado.

- [ ] **Step 6: executar testes dirigidos e checks estáticos**

Run: `node --test tests/unit/team-account-domain.test.js` e `node --check supabase/functions/_shared/team-account-domain.mjs`.

- [ ] **Step 7: commit**

Commit: `feat: provisionar convites e acessos da equipe`.

---

### Task 6: Garantir deployment Vercel pelo build versionado

**Files:**
- Create: `.github/workflows/vercel-preview-prebuilt.yml`
- Create: `tests/unit/vercel-preview-workflow.test.js`
- Modify: `scripts/check-supabase-readiness.js`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`

**Interfaces:**
- Inputs: commit/ref autorizado e confirmação `PUBLICAR_PREVIEW_PREBUILT`.
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

- [ ] **Step 1: criar workflow manual de Preview**

Executar checkout, Node 24, `npm ci`, `vercel pull --environment=preview`, `vercel build`, validar manifesto e `vercel deploy --prebuilt`.

- [ ] **Step 2: bloquear Production**

Não aceitar `--prod`, não configurar Production e não alterar `git.deploymentEnabled`.

- [ ] **Step 3: registrar evidências sem segredos**

Publicar somente manifesto e metadados públicos do build.

- [ ] **Step 4: executar teste de contrato**

Run: `node --test tests/unit/vercel-preview-workflow.test.js`.

- [ ] **Step 5: commit**

Commit: `ci: publicar Preview somente por build prebuilt verificado`.

---

### Task 7: Consolidar documentação canônica e remover estados contraditórios

**Files:**
- Create: `AGENTS.md`
- Create: `docs/PROJECT_CONTEXT.md`
- Create: `docs/CURRENT_STAGE.md`
- Create: `docs/DECISION_LOG.md`
- Modify: `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`
- Modify: `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`
- Modify: `.github/workflows/supabase-remote-post-apply.yml`

**Interfaces:**
- Produces: fonte versionada estável, estado transitório pós-correção e sequência exclusiva para criação/preflight.

- [ ] **Step 1: registrar quatro perfis funcionais e um papel técnico**

- [ ] **Step 2: registrar Gestão de Equipe plena e convite obrigatório**

- [ ] **Step 3: atualizar contagem para 13 migrations e implantação da Edge Function**

- [ ] **Step 4: atualizar workflow pós-aplicação**

Alterar confirmação para 13 migrations e incluir deployment protegido da função após validação do schema.

- [ ] **Step 5: registrar a próxima etapa única**

Após merge: criar projeto exclusivo e executar somente preflight não destrutivo.

- [ ] **Step 6: commit**

Commit: `docs: consolidar estado final da preparação pré-Supabase`.

---

### Task 8: Verificação final, PR, merge e limpeza de governança

**Files:** todos os arquivos alterados.

- [ ] **Step 1: executar CI completa no HEAD**

Exigir `Validar RADAR PDDE`, `Supabase readiness` e `Testes E2E Playwright` verdes.

- [ ] **Step 2: revisar diff e segredos**

Confirmar ausência de chave, senha, token, URL real e ativação de Production.

- [ ] **Step 3: revisar cobertura do contrato**

Conferir Assistente, SME, Controlador, Inventário e papel técnico em frontend, serviço, Auth, RLS e testes.

- [ ] **Step 4: marcar PR como pronto e incorporar por squash**

Somente após todos os gates verdes.

- [ ] **Step 5: encerrar PRs 29 e 32 como substituídos**

Registrar que as conclusões funcionais e o estado transitório foram consolidados pelo novo pacote; não incorporar documentação contraditória.

- [ ] **Step 6: confirmar Production preservada**

Nenhum deployment Supabase ou alteração de Production nesta tarefa.
