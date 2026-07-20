# Auditoria de ativação Supabase

## Escopo desta alteração

- Projeto: `scnryinorqeucbfkioxo`.
- Região: `sa-east-1`.
- PostgreSQL: 17.
- O preflight remoto anterior encontrou 13 migrations, 20 tabelas, RLS em 20 tabelas, 70 políticas e zero usuários.
- A Edge Function `team-account-management` permanece ativa com `verify_jwt=true`.

## Hardening versionado

A migration `20260720025125_activation_basic_hardening.sql` é a 14ª migration local. Ela revoga `EXECUTE` de `PUBLIC`, `anon` e `authenticated` para `public.capture_audit_event()` e preserva o privilégio administrativo de `service_role`.

O ACL está sanitizado: a função trigger não é executável diretamente por papéis expostos pela Data API. Nenhuma migration foi aplicada ao projeto remoto nesta tarefa.
