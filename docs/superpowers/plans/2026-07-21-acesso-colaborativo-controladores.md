# Acesso Colaborativo dos Controladores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que qualquer Controlador autenticado opere todas as escolas da mesma CRE, mantendo sua carteira como filtro inicial e responsabilidade principal.

**Architecture:** Uma migration aditiva redefine as duas funções centrais de autorização com base em `user_profiles.cre_scope` e `schools.cre`. Todas as políticas RLS e RPCs existentes continuam consumindo `can_access_school` e `can_write_school`, de modo que a mudança se propaga sem recriar políticas ou alterar tabelas. Testes locais e remotos comprovam colaboração entre carteiras, autoria individual e bloqueio entre CREs.

**Tech Stack:** PostgreSQL/Supabase RLS, pgTAP, Node.js 24, Playwright 1.61, Supabase JS 2.110.

## Global Constraints

- `schools.controller_id` continua sendo responsabilidade principal e filtro padrão, não autorização.
- Controladores têm leitura e escrita operacional em todas as escolas cujo `cre` corresponda ao `cre_scope` ativo.
- Controlador sem `cre_scope` falha de forma fechada, salvo `user_school_scopes` explícito.
- Acesso anônimo continua proibido.
- Production permanece `local`; nenhuma ativação remota de produção.
- A montagem da branch mantém deployments desativados; apenas a revisão final pode gerar um único Preview.

---

### Task 1: Fixar o novo contrato com testes SQL

**Files:**
- Modify: `supabase/tests/smoke.sql`
- Modify: `supabase/tests/database/schema.test.sql`

**Interfaces:**
- Consumes: `public.can_access_school(text)`, `public.can_write_school(text)`.
- Produces: contrato verificável para acesso transversal na mesma CRE e bloqueio fora da CRE.

- [x] Criar duas escolas de carteiras diferentes na 4ª CRE.
- [x] Criar escolas de outra CRE com e sem exceção explícita.
- [x] Exigir leitura e escrita na carteira da colega da mesma CRE.
- [x] Exigir bloqueio fora da CRE e preservar exceções de leitura/escrita.
- [x] Atualizar o contrato para 16 migrations.

### Task 2: Implementar a migration colaborativa mínima

**Files:**
- Create: `supabase/migrations/20260721090000_controller_collaborative_cre_access.sql`

**Interfaces:**
- Replaces: `public.can_access_school(text) returns boolean`.
- Replaces: `public.can_write_school(text) returns boolean`.

- [x] Para `controller`, autorizar escola quando `schools.cre` corresponde ao `cre_scope` do perfil ativo.
- [x] Preservar papéis amplos, Inventário e `user_school_scopes`.
- [x] Preservar `SECURITY DEFINER`, `search_path`, revogações e grants.
- [x] Documentar que carteira é responsabilidade e filtro, não barreira.

### Task 3: Corrigir a homologação remota

**Files:**
- Modify: `tests/e2e/supabase-preview-remote.spec.js`

**Interfaces:**
- Consumes: massa HML das carteiras de Tuane e Alzira.
- Produces: prova de leitura e escrita cruzadas nos dois sentidos.

- [x] Exigir que ambas recebam as quatro escolas e quatro pendências HML.
- [x] Fazer Tuane registrar contato em escola de Alzira.
- [x] Fazer Alzira registrar contato em escola de Tuane.
- [x] Exigir `created_by` igual à usuária executora.
- [x] Preservar testes dos demais perfis.

### Task 4: Atualizar contratos e documentação canônica

**Files:**
- Modify: `scripts/check-supabase-final-alignment.js`
- Modify: `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`
- Modify: `supabase/verification/remote-post-apply.sql`
- Create: `docs/superpowers/specs/2026-07-21-acesso-colaborativo-controladores-design.md`
- Create: `docs/superpowers/plans/2026-07-21-acesso-colaborativo-controladores.md`

- [x] Tornar a migration colaborativa obrigatória no alinhamento final.
- [x] Registrar 16 migrations no runbook e no contrato remoto.
- [x] Corrigir matriz, casos obrigatórios e linguagem institucional.
- [x] Preservar Production local e ativação não autorizada.

### Task 5: Validação e entrega controlada

**Files:**
- Review: todos os arquivos das Tasks 1–4.

- [ ] Executar validação sintática dos arquivos JavaScript e SQL.
- [ ] Executar os gates locais disponíveis.
- [ ] Restaurar `vercel.json` para a configuração canônica.
- [ ] Abrir um único PR e aguardar os gates remotos.
- [ ] Não aplicar a migration no Preview nem ativar Production sem etapa operacional separada.
