# Remediação Integral Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restaurar e tornar confiável toda gravação operacional do RADAR PDDE, eliminando a incompatibilidade de contratos, escritas parciais, falsos rollbacks, perda de versões e gates de homologação que contornam o aplicativo real.

**Architecture:** O frontend continuará usando os serviços de aplicação existentes, mas toda operação remota composta será encaminhada a comandos RPC explícitos e atômicos. O repositório validará registros canônicos com a API real de contratos, preservará códigos de erro e retornos do banco, e o estado local deixará de ser fonte de verdade para confirmar sucesso remoto. A homologação executará botões reais e verificará persistência após reload.

**Tech Stack:** JavaScript UMD no navegador, Node.js 24, Supabase JS, PostgreSQL 17, PL/pgSQL, RLS, Edge Functions Deno, Playwright, node:test, pgTAP, GitHub Actions e Vercel.

## Global Constraints

- Nunca editar diretamente `main`.
- Toda mudança de comportamento deve seguir RED → GREEN → verificação acumulada.
- Nenhuma migration pode apagar ou reimportar a massa funcional existente.
- RPCs operacionais devem usar `SECURITY INVOKER`, `SET search_path = pg_catalog, public` e validar `current_app_role()`.
- A mensagem pública não pode afirmar rollback sem confirmação transacional.
- Preservar desktop, Android e iPhone.
- Preservar os estados de pendência: Aberta, Aguardando reanálise, Resolvida e Cancelada.
- Preservar a unicidade escola × competência × programa × documento para pendências ativas.
- Não remover dados duplicados preexistentes sem ação administrativa separada.

---

### Task 1: Contrato canônico de verificações

**Files:**
- Modify: `src/data/supabase-repository.js`
- Test: `tests/unit/supabase-verification-contract.test.js`

**Interfaces:**
- Consumes: `RadarJsonContracts.assertCanonicalRecords(entity, records, options)`.
- Produces: validação uniforme em `save`, `insertOnly` e `updateWithVersion`, sem chamar APIs inexistentes.

- [ ] **Step 1: Write the failing test**

Criar teste que instancia `SupabaseRepository`, salva uma verificação canônica e exige que a chamada chegue ao `upsert`; o teste deve falhar com `validateVerification is not a function` no estado atual.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/supabase-verification-contract.test.js`
Expected: FAIL no método inexistente.

- [ ] **Step 3: Write minimal implementation**

Substituir os blocos específicos de `verifications` por uma função comum que invoque `assertCanonicalRecords(entity, collection, { operation })` para todas as entidades com campos JSON declarados.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/supabase-verification-contract.test.js`
Expected: PASS.

### Task 2: Erros preservados e exclusão verificável

**Files:**
- Modify: `src/data/supabase-repository.js`
- Modify: `src/application/error-mapper.js`
- Test: `tests/unit/supabase-repository-errors.test.js`

**Interfaces:**
- Produces: `RepositoryError` com `status`, `postgresCode`, `requestId`, `details` e causa original; `remove()` exige uma linha retornada.

- [ ] Criar testes falhos para RLS/403, conflito 409/23505, validação 22P02/23514, rede e exclusão zero-linhas.
- [ ] Implementar classificação sem apagar código e metadados originais.
- [ ] Alterar `remove()` para usar `.select('id')` e lançar `NOT_FOUND_OR_FORBIDDEN` quando nenhuma linha for afetada.
- [ ] Executar testes unitários novos e existentes.

### Task 3: RPC atômica de verificação e log

**Files:**
- Create: `supabase/migrations/202607220001_atomic_verification_operations.sql`
- Modify: `src/data/supabase-repository.js`
- Modify: `src/application/verification-service.js`
- Test: `supabase/tests/database/verification-rpc.test.sql`
- Test: `tests/unit/verification-remote-persistence.test.js`

**Interfaces:**
- Produces: `save_verification_with_log(p_verification jsonb, p_expected_version integer, p_administrative_log jsonb)`.
- Retorna: JSON com verificação persistida e log inserido.

- [ ] Escrever pgTAP falho para autorização, insert, update versionado, conflito e rollback integral.
- [ ] Escrever teste unitário falho exigindo que `VerificationService` use `repository.saveVerificationWithLog`.
- [ ] Implementar RPC `SECURITY INVOKER` com autorização Controlador/Assistente/Administrador técnico, validação dos JSONs e controle otimista.
- [ ] Implementar método de repositório e persist callback explícito no serviço.
- [ ] Confirmar que bonificação, análise, consolidação e retificação usam a mesma transação.

### Task 4: Comandos atômicos para pendências, contatos e patrimônio

**Files:**
- Create: `supabase/migrations/202607220002_atomic_operational_commands.sql`
- Modify: `src/data/supabase-repository.js`
- Modify: `src/application/pendency-service.js`
- Modify: `src/application/inventory-service.js`
- Modify: `src/application/configuration-service.js`
- Modify: `src/application/directory-service.js`
- Modify: `src/application/school-service.js`
- Test: `supabase/tests/database/operational-command-rpc.test.sql`
- Test: `tests/unit/remote-operational-commands.test.js`

**Interfaces:**
- Produces RPCs para contato + log; pendência/tentativa/log; bem + log; programa + log; calendário + log; atribuição de controlador + log.

- [ ] Definir um comando RPC por agregado, sem RPC genérica de tabela arbitrária.
- [ ] Validar autoria no banco com `auth.uid()` e não aceitar `created_by` de outro usuário.
- [ ] Garantir idempotência de contatos por `operation_id` e constraint única.
- [ ] Adicionar índice único parcial para pendência ativa estruturada.
- [ ] Migrar serviços para callbacks `persist` explícitos.
- [ ] Testar falha induzida e comprovar zero escrita parcial.

### Task 5: Concorrência e estado remoto

**Files:**
- Modify: `src/data/state-bridge.js`
- Modify: `src/data/legacy-state-adapter.js`
- Modify: `src/application/data-service.js`
- Modify: `src/application/unit-of-work.js`
- Modify: `src/application/state-port.js`
- Modify: `app.js`
- Test: `tests/unit/state-bridge-row-version.test.js`
- Test: `tests/unit/remote-state-authority.test.js`

**Interfaces:**
- Produces: `row_version` preservado em toda entidade editável e sucesso remoto não condicionado ao snapshot completo em `localStorage`.

- [ ] Escrever testes falhos para escola versão 2 e múltiplas edições.
- [ ] Preservar versões de escolas, programas, equipe e vínculos.
- [ ] Aplicar retorno do banco ao estado em vez de assumir o snapshot local como confirmação.
- [ ] Remover `toggleConsEnviada()` do caminho `persist()` legado e encaminhar ao `VerificationService`.
- [ ] Restringir cache remoto a preferências e estado não autoritativo.

### Task 6: Observabilidade e mensagens verdadeiras

**Files:**
- Modify: `src/application/error-mapper.js`
- Modify: `src/application/unit-of-work.js`
- Modify: `src/integration/shared-interactions.js`
- Modify: `app.js`
- Test: `tests/e2e/data-error-ux.spec.js`
- Test: `tests/unit/error-observability.test.js`

**Interfaces:**
- Produces: código de incidente, fase, operação e mensagem compatível com o resultado real.

- [ ] Criar testes falhos para erro antes da rede, erro RLS, conflito e falha após commit remoto.
- [ ] Gerar `incidentId` por comando.
- [ ] Nunca usar “desfeitas com segurança” sem `rollbackConfirmed === true`.
- [ ] Exibir mensagem específica e manter detalhes técnicos apenas no console estruturado.

### Task 7: Segurança Supabase e Auth

**Files:**
- Create: `supabase/migrations/202607220003_security_and_rls_hardening.sql`
- Modify: `supabase/functions/team-account-management/index.ts`
- Modify: `supabase/config.toml`
- Test: `supabase/tests/database/security-hardening.test.sql`
- Test: `tests/unit/team-account-domain.test.js`

**Interfaces:**
- Produces: helpers internos não invocáveis pela Data API, RLS otimizada e CORS fail-closed.

- [ ] Revogar EXECUTE direto de helpers `SECURITY DEFINER` desnecessários ao navegador.
- [ ] Avaliar e converter `delete_invoice_with_effects` para invoker ou encapsular seus acessos com autorização explícita.
- [ ] Otimizar chamadas Auth nas policies com subselect quando aplicável.
- [ ] Exigir `RADAR_ALLOWED_ORIGIN` em ambiente remoto; não usar `*` como fallback.
- [ ] Criar verificação operacional para Auth sem perfil.
- [ ] Registrar como etapa manual obrigatória a ativação da proteção de senha vazada no painel.

### Task 8: Homologação integral obrigatória

**Files:**
- Create: `tests/e2e/supabase-operational-ui-remote.spec.js`
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/supabase-readiness.yml`
- Modify: `scripts/check-supabase-readiness.js`
- Modify: `scripts/check-supabase-final-alignment.js`
- Modify: `scripts/audit/generate-repository-inventory.mjs`
- Test: `tests/unit/readiness-check.test.js`

**Interfaces:**
- Produces: gate obrigatório para toda alteração em frontend, persistência, migrations, funções ou workflows.

- [ ] Criar usuário e massa efêmeros em ambiente Supabase de Preview/branch.
- [ ] Executar botões reais de avaliação, contato, escola, pendência, nota e inventário.
- [ ] Recarregar e confirmar os valores pela UI e pelo banco.
- [ ] Confirmar que SHA do Vercel corresponde ao SHA do workflow.
- [ ] Remover URL de Preview fixa e branch-name especial.
- [ ] Tornar o inventário técnico reproduzível e verificado no CI.

### Task 9: Verificação final, PR e implantação

**Files:**
- Modify: documentação operacional e matriz de permissões afetadas.

- [ ] Run: `npm ci`
- [ ] Run: `npm run check`
- [ ] Run: `npm test`
- [ ] Run: `npm run test:integration`
- [ ] Run: `npm run audit:functional`
- [ ] Run: `supabase db reset`
- [ ] Run: `supabase test db`
- [ ] Run: `supabase db lint`
- [ ] Run: suíte Playwright local completa.
- [ ] Run: suíte remota contra Preview/branch Supabase.
- [ ] Revisar diff completo e advisors.
- [ ] Abrir PR, aguardar todos os checks e revisar artefatos.
- [ ] Aplicar migrations em produção uma única vez.
- [ ] Publicar uma única implantação Vercel.
- [ ] Executar smoke funcional autenticado em produção e confirmar reload.
- [ ] Somente então declarar o incidente encerrado.
