# Correção P0 da Gestão de Equipe e Resíduos Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restabelecer cadastro, transição de perfil, desativação e redistribuição na Gestão de Equipe, impedindo que usuários Auth legados malformados bloqueiem operações não relacionadas e conciliando os resíduos HML de forma rastreável.

**Architecture:** A Edge Function deixará de percorrer todo o catálogo Auth com `listUsers` e consultará somente o UUID correspondente ao e-mail por RPC administrativa `SECURITY DEFINER`, executável apenas por `service_role`. Uma migration normalizará campos textuais nulos incompatíveis com o GoTrue e eliminará exclusivamente o conjunto sintético HML conhecido; a conciliação funcional de Juliana será executada separadamente, sem transferir as escolas reais da Érika automaticamente.

**Tech Stack:** TypeScript/Deno Edge Runtime, Supabase JS 2.110.9, PostgreSQL 17, Supabase CLI 2.110.0, pgTAP, Node.js 24 e GitHub Actions.

## Global Constraints

- Baseline: `main` em `4a95c9074d00c29310aea6544f287ea15e3ced8a`.
- Código e estado remoto comprovado prevalecem sobre documentação.
- Não mover automaticamente as 39 escolas reais da Érika.
- Preservar o histórico inativo de Inventário da Juliana.
- Não relaxar RLS, grants ou autorização da Gestão de Equipe.
- Não expor e-mail, tokens, credenciais ou causas internas nas respostas públicas da Edge Function.
- TDD obrigatório: teste RED comprovado antes da implementação.
- A limpeza deve atingir somente os identificadores sintéticos HML confirmados.
- Toda mutação em Production exige releitura e prova de ausência de resíduos.

---

### Task 1: Fixar a reprodução e o contrato RED

**Files:**
- Modify: `tests/unit/team-account-role-transition.test.js`
- Modify: `tests/unit/team-account-edge-contract.test.js`
- Modify: `supabase/tests/database/team-management-rpc.test.sql`
- Create: `docs/audits/2026-08-06-incidente-gestao-equipe-residuos-auth.md`

**Interfaces:**
- Consumes: Edge Function `team-account-management`, Auth Admin e RPCs atuais de equipe.
- Produces: contrato para `resolve_team_auth_user_id_by_email(p_email text) returns uuid` e evidência do incidente.

- [ ] **Step 1: Escrever o teste unitário RED do lookup isolado**

Substituir o contrato que exige `admin.auth.admin.listUsers` por:

```javascript
test('Edge Function resolve conta por RPC sem percorrer todo o catálogo Auth', () => {
    assert.match(edgeSource, /resolve_team_auth_user_id_by_email/);
    assert.match(edgeSource, /await admin\.rpc\("resolve_team_auth_user_id_by_email"/);
    assert.doesNotMatch(edgeSource, /admin\.auth\.admin\.listUsers/);
});
```

- [ ] **Step 2: Escrever o pgTAP RED da RPC administrativa**

Adicionar testes que comprovem:

```sql
select has_function(
  'public',
  'resolve_team_auth_user_id_by_email',
  array['text'],
  'lookup administrativo por e-mail existe'
);

select function_privs_are(
  'public',
  'resolve_team_auth_user_id_by_email',
  array['text'],
  'service_role',
  array['EXECUTE'],
  'service_role executa o lookup'
);
```

Também comprovar ausência de `EXECUTE` para `anon` e `authenticated`, retorno do UUID correto e conflito quando houver mais de uma conta normalizada para o mesmo e-mail.

- [ ] **Step 3: Registrar a evidência do incidente**

Documentar:

- POST 500 da Edge Function versão 110;
- falha de GoTrue em `confirmation_token = NULL`;
- somente dois usuários HML afetados entre treze contas;
- Juliana com Inventário inativo, Auth bloqueado e ausência em `controllers`;
- escola HML e suas dependências sintéticas;
- distinção entre o incidente real e os preflights anônimos de `schools`.

- [ ] **Step 4: Executar o RED**

```bash
node --test \
  tests/unit/team-account-role-transition.test.js \
  tests/unit/team-account-edge-contract.test.js
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
```

Expected: falha exclusivamente porque a Edge Function ainda usa `listUsers` e a nova RPC não existe.

- [ ] **Step 5: Commit RED**

```bash
git add \
  tests/unit/team-account-role-transition.test.js \
  tests/unit/team-account-edge-contract.test.js \
  supabase/tests/database/team-management-rpc.test.sql \
  docs/audits/2026-08-06-incidente-gestao-equipe-residuos-auth.md
git commit -m "test: reproduzir bloqueio da Gestão de Equipe por Auth legado"
```

### Task 2: Implementar lookup Auth isolado e normalização legada

**Files:**
- Create: `supabase/migrations/202608060001_team_auth_legacy_repair.sql`
- Modify: `supabase/functions/team-account-management/index.ts`
- Regenerate: `src/types/database.types.ts`

**Interfaces:**
- Produces: `public.resolve_team_auth_user_id_by_email(p_email text) returns uuid`.
- Consumes: cliente administrativo `service_role` da Edge Function.

- [ ] **Step 1: Criar a RPC administrativa mínima**

A migration deve:

```sql
create or replace function public.resolve_team_auth_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_ids uuid[];
begin
  if v_email = '' then
    raise exception 'VALIDATION_ERROR: e-mail obrigatório';
  end if;

  select array_agg(u.id order by u.created_at, u.id)
  into v_ids
  from auth.users u
  where lower(btrim(coalesce(u.email, ''))) = v_email;

  if coalesce(array_length(v_ids, 1), 0) > 1 then
    raise exception 'ACCOUNT_CONFLICT: mais de uma conta Auth encontrada para o mesmo e-mail';
  end if;

  return v_ids[1];
end
$$;
```

Revogar de `public`, `anon` e `authenticated`; conceder `EXECUTE` somente a `service_role`.

- [ ] **Step 2: Normalizar campos textuais nulos incompatíveis com GoTrue**

Aplicar somente onde nulo:

```sql
update auth.users
set confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, '')
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null;
```

Não alterar senha, identidade, e-mail, confirmação, metadata ou bloqueio.

- [ ] **Step 3: Remover o conjunto sintético HML conhecido**

Na mesma migration, remover exclusivamente:

```text
HML-SCHOOL-manual-20260723112802
hml_controller_20260723112802
hml_inventory_20260723112802
fd288b37-90e2-40b8-a5cd-e563d6cd05eb
ee7d73d2-ff51-48f3-84af-061da3ac3c5e
```

A ordem deve preservar integridade referencial e manter logs administrativos históricos com referências anuladas pelas FKs existentes.

- [ ] **Step 4: Trocar `listUsers` pela RPC**

Implementar:

```typescript
async function authUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string> {
  const { data, error } = await admin.rpc("resolve_team_auth_user_id_by_email", {
    p_email: normalizeEmail(email),
  });
  if (error) throw error;
  return String(data || "").trim();
}
```

Em `saveMember`, consultar o UUID e somente então chamar `authUser(admin, userId)`. Remover integralmente o loop de `listUsers`.

- [ ] **Step 5: Regenerar tipos e executar GREEN**

```bash
npm run supabase:reset
npm run supabase:gen:types
node --test \
  tests/unit/team-account-role-transition.test.js \
  tests/unit/team-account-edge-contract.test.js
npm run supabase:test:db
npm run check:supabase
npm run check:supabase-final
npm run typecheck:database
```

Expected: PASS.

- [ ] **Step 6: Commit da implementação**

```bash
git add \
  supabase/migrations/202608060001_team_auth_legacy_repair.sql \
  supabase/functions/team-account-management/index.ts \
  src/types/database.types.ts
git commit -m "fix: isolar lookup Auth e limpar resíduos HML"
```

### Task 3: Provar o ciclo completo da Gestão de Equipe

**Files:**
- Modify: `scripts/check-team-account-function.mjs`
- Test: `tests/unit/team-account-role-transition.test.js`
- Test: `tests/unit/team-account-gateway.test.js`
- Test: `tests/unit/directory-service.test.js`
- Test: `tests/e2e/supabase-full-contract.spec.js`

**Interfaces:**
- Consumes: RPC de lookup, Edge Function corrigida e RPCs de equipe.
- Produces: prova de cadastro, transição, desativação, redistribuição e limpeza.

- [ ] **Step 1: Adicionar cenário com usuário Auth legado não relacionado**

No ambiente descartável, inserir uma conta sintética com tokens nulos antes de cadastrar outro controlador. Confirmar que o cadastro do controlador válido continua funcionando porque não há varredura global de Auth.

- [ ] **Step 2: Executar transição Inventário → Controlador**

Com dados sintéticos:

1. cadastrar Inventário;
2. desativar Inventário;
3. cadastrar a mesma pessoa como Controlador;
4. confirmar uma única função ativa;
5. confirmar histórico de Inventário inativo;
6. transferir uma escola sintética;
7. desativar o controlador de origem;
8. reler tudo após nova sessão.

- [ ] **Step 3: Executar negativas**

Confirmar:

- perfil não autorizado bloqueado;
- controlador substituto obrigatório quando há carteira;
- conta com outro perfil ativo gera `ACCOUNT_CONFLICT`;
- erro do backend mantém código e mensagem funcional;
- nenhuma operação válida mostra falsa indisponibilidade.

- [ ] **Step 4: Limpar e provar ausência de resíduos**

A consulta final deve retornar zero para os prefixos sintéticos do teste em `auth.users`, diretórios, perfis, escolas e logs descartáveis.

- [ ] **Step 5: Executar gates integrais**

```bash
npm run test:readiness
npm run test:e2e
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

- [ ] **Step 6: Commit da prova**

```bash
git add scripts/check-team-account-function.mjs tests
git commit -m "test: homologar integralmente a Gestão de Equipe"
```

### Task 4: Publicar e reconciliar Production

**Files:**
- Modify: `docs/audits/2026-08-06-incidente-gestao-equipe-residuos-auth.md`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`

**Interfaces:**
- Consumes: PR aprovado, migration e Edge Function corrigida.
- Produces: Production sem resíduos HML e Gestão de Equipe funcional.

- [ ] **Step 1: Revisar diff e abrir PR**

A descrição deve separar:

- causa do Auth legado;
- alcance restrito aos dois HML;
- falha de transição real da Juliana;
- regra preservada de redistribuição;
- evidências RED/GREEN;
- plano de rollback.

- [ ] **Step 2: Aplicar migration e publicar Edge Function**

Somente após merge e gates verdes. Confirmar a nova versão ativa com JWT obrigatório.

- [ ] **Step 3: Verificar limpeza HML**

Confirmar ausência de:

- escola HML;
- controlador HML;
- integrante HML;
- perfis HML;
- usuários Auth HML;
- tokens textuais nulos em `auth.users`.

- [ ] **Step 4: Conciliar Juliana sem mover escolas**

Após autorização operacional expressa, executar o fluxo seguro de cadastro de Juliana como Controladora, com:

```text
nome: Juliana Barbosa
e-mail: j.barbosa@rioeduca.net
escopo: 4ª CRE
```

Confirmar:

- Auth desbloqueado;
- `controllers` ativo;
- perfil `controller` ativo;
- perfil `inventory` preservado inativo;
- Juliana disponível no seletor de transferência;
- nenhuma escola alterada nesta etapa.

- [ ] **Step 5: Transferir as 39 escolas somente pela interface**

A transferência da carteira da Érika para Juliana será uma decisão operacional visível e separada, executada pelo usuário após conferir a lista e o destino. Não automatizar essa mutação na release.

- [ ] **Step 6: Reexecutar monitores e documentar**

Confirmar Vercel, Edge Function, migrations, Auth, integridade, logs e releitura autenticada antes de encerrar o incidente.
