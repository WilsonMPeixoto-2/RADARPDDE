# Continuidade — PR 22 / Gate de Pré-conexão Supabase

## Estado preservado

- Branch: `feature/supabase-readiness`
- PR: `https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/22`
- O PR deve permanecer em rascunho; não fazer merge nem publicar em produção sem autorização.
- Produção continua em `localStorage`; Supabase remoto não está conectado.
- Deploy automático da Vercel permanece desativado.
- Todo o trabalho deste gate está salvo no remoto; não há dependência de alterações apenas locais.

## Decisões obrigatórias

- Não usar subagentes neste projeto.
- Trabalhar somente com o agente principal.
- Não alterar regras de bonificação, pendências, retificação, Excel ou demais regras consolidadas.
- Não colocar `service_role`, senha, token ou segredo no GitHub, no navegador ou nos logs.
- Consolidar alterações antes do push para não provocar tempestade de deployments.

## Último diagnóstico e correção

O bootstrap pela API Admin já cria as sete identidades Auth locais. A execução anterior falhava ao vincular os usuários às tabelas públicas com erro PostgreSQL `42501` em `controllers`.

Foi adicionada concessão mínima ao papel `service_role`:

- `SELECT, UPDATE` em `controllers` e `inventory_team_members`;
- `SELECT, INSERT, UPDATE` em `user_profiles` e `user_school_scopes`;
- nenhum `DELETE` e nenhum privilégio amplo.

Também foi corrigida a suíte E2E para usar a coluna real `schools.denomination`, em vez da coluna inexistente `schools.name`.

## Validação e próximo passo

1. Confirmar que os checks do commit mais recente estão verdes no GitHub.
2. Se o workflow `Supabase readiness` falhar, ler primeiro o passo exato após `bootstrap:auth-fixtures`; não contornar RLS nem ampliar privilégios sem prova.
3. Quando a pilha local passar, concluir a Task 7 no plano:
   - autenticação real local;
   - cinco perfis ativos;
   - usuário inativo e usuário sem perfil bloqueados;
   - RLS de leitura/escrita comprovada pelo Playwright.
4. Prosseguir pela Task 8 do plano `docs/superpowers/plans/2026-07-14-supabase-preconnection-gate.md`.
5. Antes de declarar conclusão, executar as verificações finais previstas no plano e manter o PR em rascunho.

## Comandos iniciais

```powershell
git checkout feature/supabase-readiness
git pull --ff-only origin feature/supabase-readiness
npm ci
npm run test:readiness
gh pr checks 22 --watch
```

Para reproduzir Auth/RLS, usar exclusivamente a pilha Supabase local e o workflow versionado. A senha das fixtures é efêmera e deve ser fornecida por variável de ambiente, nunca commitada.
