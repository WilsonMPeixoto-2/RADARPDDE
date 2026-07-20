# Auditoria de ativação Supabase

## Escopo desta alteração

- Projeto: `scnryinorqeucbfkioxo`.
- Região: `sa-east-1`.
- PostgreSQL: 17.
- O preflight remoto anterior encontrou 13 migrations, 20 tabelas, RLS em 20 tabelas, 70 políticas e zero usuários.
- A Edge Function `team-account-management` permanece ativa com `verify_jwt=true`.

## Hardening versionado

A migration `20260720030046_activation_basic_hardening.sql` é a 14ª migration e foi aplicada com sucesso no projeto remoto. Ela revoga `EXECUTE` de `PUBLIC`, `anon` e `authenticated` para `public.capture_audit_event()` e preserva o privilégio administrativo de `service_role`.

O ACL foi verificado e está sanitizado: `anon=false`, `authenticated=false` e `service_role=true` para `EXECUTE` em `capture_audit_event()`. O Advisor específico relacionado a esse privilégio foi removido.

## Evidência sanitizada pós-aplicação — 2026-07-20

- `list_migrations` retornou `version=20260720030046` e `name=activation_basic_hardening`.
- A consulta a `pg_proc`/`has_function_privilege` retornou ACL `{postgres=X/postgres,service_role=X/postgres}`, `anon_execute=false`, `authenticated_execute=false` e `service_role_execute=true`.
- O Advisor de segurança pós-DDL não retornou mais `capture_audit_event`; restaram somente avisos de outras funções intencionais, não alterados nesta tarefa.
