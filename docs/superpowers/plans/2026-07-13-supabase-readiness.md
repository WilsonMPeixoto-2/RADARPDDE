# Supabase Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o RADAR PDDE pronto para futura integração segura com Supabase, mantendo produção exclusivamente em `localStorage` e sem alterar interface ou regras de negócio.

**Architecture:** A entrega adiciona configuração bloqueada por modo e feature flags, contrato de persistência com adaptadores local e Supabase, utilitários de snapshot/reconciliação, migrations PostgreSQL/RLS e validações de CI. O `app.js` continuará operando pelo fluxo local legado; os novos componentes serão carregados apenas como infraestrutura preparada e não executarão chamadas de rede.

**Tech Stack:** JavaScript ES2020 sem bundler, Node.js test runner, Playwright existente, PostgreSQL/Supabase SQL, GitHub Actions, Vercel estático.

## Global Constraints

- Produção permanece em `dataMode: "local"`.
- `supabaseRepositoryEnabled` e `legacyAppBridgeEnabled` permanecem `false`.
- Nenhuma alteração visual, de navegação, regras, cálculos ou permissões simuladas existentes.
- Nenhuma chave `service_role`, `sb_secret_`, senha ou token administrativo no repositório.
- Nenhum seed automático será introduzido nos novos adaptadores.
- PR em rascunho; sem merge ou publicação em produção sem autorização expressa.

---

### Task 1: Configuração segura e bloqueio de conexão

**Files:**
- Modify: `config.js`
- Create: `.env.example`
- Test: `tests/unit/runtime-config.test.js`

**Interfaces:**
- Produces: `createRuntimeConfig(input)`, `DATA_MODES`, `isForbiddenSupabaseKey(value)` exportados em CommonJS e `window.RadarRuntimeConfig`.
- Produces: `window.RADAR_PDDE_CONFIG` com `dataMode`, `features`, `supabase` e `diagnostics`.

- [ ] Escrever testes que exijam modo local por padrão, sanitização de URL/chave, dupla autorização para conexão e rejeição de chaves secretas.
- [ ] Executar `node --test tests/unit/runtime-config.test.js` e confirmar falha por ausência das APIs.
- [ ] Reestruturar `config.js` como módulo testável, preservando o carregamento atual de extensões e mantendo credenciais vazias no modo local.
- [ ] Criar `.env.example` apenas com nomes de variáveis e valores seguros.
- [ ] Executar o teste novamente e confirmar aprovação.
- [ ] Commitar como `feat: bloquear ativacao acidental do Supabase`.

### Task 2: Contrato e adaptador local

**Files:**
- Create: `src/data/repository-contract.js`
- Create: `src/data/local-storage-repository.js`
- Test: `tests/unit/local-storage-repository.test.js`

**Interfaces:**
- Produces: `RADAR_ENTITIES`, `RepositoryError`, `assertKnownEntity(entity)`.
- Produces: `LocalStorageRepository({ storage, keyPrefix, schemaVersion })` com `load`, `save`, `remove`, `exportSnapshot`, `restoreSnapshot` e `healthCheck`.

- [ ] Escrever testes para clonagem defensiva, persistência por entidade, remoção, snapshot, restauração, versão e erro de entidade desconhecida.
- [ ] Executar `node --test tests/unit/local-storage-repository.test.js` e confirmar falha.
- [ ] Implementar contrato e adaptador com serialização JSON e sem dependência do DOM.
- [ ] Executar os testes e confirmar aprovação.
- [ ] Commitar como `feat: adicionar contrato de persistencia local`.

### Task 3: Adaptador Supabase desativado e injetável

**Files:**
- Create: `src/data/supabase-repository.js`
- Create: `src/data/repository-factory.js`
- Test: `tests/unit/supabase-repository.test.js`

**Interfaces:**
- Produces: `SupabaseRepository({ client, tableMap })` com o mesmo contrato do adaptador local.
- Produces: `createRepository(runtimeConfig, dependencies)`; retorna local salvo quando modo local ou flags incompletas e só cria Supabase com dupla autorização.

- [ ] Escrever cliente simulado e testes para seleção, upsert, delete, falhas tipadas, ausência de seed e bloqueio da factory.
- [ ] Executar `node --test tests/unit/supabase-repository.test.js` e confirmar falha.
- [ ] Implementar o adaptador por injeção, sem importar SDK e sem ler credenciais diretamente.
- [ ] Implementar a factory fail-closed.
- [ ] Executar os testes e confirmar aprovação.
- [ ] Commitar como `feat: preparar adaptador Supabase bloqueado`.

### Task 4: Snapshot, validação e reconciliação

**Files:**
- Create: `src/data/snapshot-tools.js`
- Test: `tests/unit/snapshot-tools.test.js`

**Interfaces:**
- Produces: `createSnapshot`, `validateSnapshot`, `buildImportBatches`, `reconcileSnapshots`.
- Snapshot: `{ format, version, importId, exportedAt, entities }`.

- [ ] Escrever testes para snapshot determinístico, validação estrutural, lotes, duplicidade de IDs e relatório de diferenças.
- [ ] Executar `node --test tests/unit/snapshot-tools.test.js` e confirmar falha.
- [ ] Implementar funções puras sem acesso a rede ou armazenamento.
- [ ] Executar testes e confirmar aprovação.
- [ ] Commitar como `feat: preparar snapshot e reconciliacao de dados`.

### Task 5: Schema PostgreSQL e políticas RLS

**Files:**
- Create: `supabase/migrations/202607130001_core_schema.sql`
- Create: `supabase/migrations/202607130002_auth_and_rls.sql`
- Create: `supabase/migrations/202607130003_audit_and_import.sql`
- Test: `tests/unit/supabase-artifacts.test.js`

**Interfaces:**
- Produces: tabelas normalizadas para configuração, programas, usuários, perfis, escolas, competências, verificações, pendências, tentativas, contatos, bens, notas, logs, importações e auditoria.
- Produces: funções SQL `current_app_role()`, `can_access_school(text)` e `touch_updated_at()`.

- [ ] Escrever testes estáticos que exijam todas as tabelas, FKs, constraints, índices, RLS e políticas essenciais.
- [ ] Executar `node --test tests/unit/supabase-artifacts.test.js` e confirmar falha.
- [ ] Criar migration de esquema principal idempotente por histórico de migrations, sem dados reais.
- [ ] Criar perfis e políticas RLS futuras baseadas em `auth.uid()`.
- [ ] Criar auditoria e controle de importação idempotente.
- [ ] Executar os testes e confirmar aprovação.
- [ ] Commitar como `feat: versionar schema e RLS do Supabase`.

### Task 6: Validações, scripts e CI

**Files:**
- Create: `scripts/check-supabase-readiness.js`
- Modify: `package.json`
- Create: `.github/workflows/supabase-readiness.yml`
- Test: `tests/unit/readiness-check.test.js`

**Interfaces:**
- Produces: comando `npm run test:unit`.
- Produces: comando `npm run check:supabase`.
- Produces: workflow `Supabase readiness` sem credenciais externas.

- [ ] Escrever testes para detectar chave secreta atribuída, migration ausente e modo de produção indevido.
- [ ] Executar `node --test tests/unit/readiness-check.test.js` e confirmar falha.
- [ ] Implementar verificador estático com mensagens determinísticas e código de saída não zero.
- [ ] Atualizar scripts do pacote sem remover comandos existentes.
- [ ] Criar workflow para Node 22 executando sintaxe, unitários e verificador.
- [ ] Executar `npm run test:unit` e `npm run check:supabase`.
- [ ] Commitar como `ci: validar preparacao para Supabase`.

### Task 7: Documentação operacional e carregamento passivo

**Files:**
- Modify: `config.js`
- Create: `docs/architecture/supabase-readiness.md`
- Create: `docs/reference/SUPABASE_DATA_DICTIONARY.md`
- Create: `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`
- Create: `docs/runbooks/SUPABASE_CONNECTION.md`
- Create: `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`
- Modify: `README.md`

**Interfaces:**
- Carrega passivamente os módulos de dados sem instanciar repositório nem fazer chamadas de rede.
- Documenta o procedimento futuro de aplicação das migrations, Preview, reconciliação, RLS, homologação e rollback.

- [ ] Adicionar ao carregador de extensões os cinco módulos novos em ordem de dependência.
- [ ] Documentar arquitetura, tabelas, campos centrais, perfis, permissões e runbooks.
- [ ] Atualizar README para registrar `local` como modo vigente e a preparação desativada.
- [ ] Executar `npm run check`, `npm run test:unit`, `npm run check:supabase` e `npm run test:e2e`.
- [ ] Confirmar que a página de produção/Preview não realiza requisições Supabase no modo local por teste automatizado.
- [ ] Commitar como `docs: consolidar prontidao para Supabase`.

### Task 8: PR, CI e validação final

**Files:**
- No new source files.

**Interfaces:**
- Produces: PR em rascunho da branch `feature/supabase-readiness` para `main`.

- [ ] Criar PR em rascunho com escopo, riscos, salvaguardas e checklist.
- [ ] Aguardar workflows e inspecionar falhas.
- [ ] Corrigir apenas problemas dentro do escopo e repetir validações.
- [ ] Confirmar que Vercel Preview está READY e que `main`/produção permanecem inalteradas.
- [ ] Apresentar resultado para autorização posterior de merge.
