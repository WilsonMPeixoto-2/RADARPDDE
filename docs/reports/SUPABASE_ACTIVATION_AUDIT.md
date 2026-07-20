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
