# PR #239 — gatilho controlado de Production

**Data:** 31 de agosto de 2026 / virada operacional para 1º de setembro  
**Natureza:** evidência operacional e push convencional em `main`; nenhuma alteração funcional

## Estado aprovado

- PR: #239 — `fix: sanear CI temporal, Assessoria, docs e dependências`;
- head aprovado: `39f5d32e2a1c68881c54d7ced70834df79c70462`;
- merge funcional: `197f873e89529886c6e2a32e2a321525d163667d`;
- Testes E2E Playwright: **157 aprovados, 39 ignorados, 0 falhas**;
- Homologação integral pré-Production: **aprovada**;
- Supabase readiness, Auth, RLS, pgTAP e migrations: **aprovados**;
- Gate remoto de perfis × desktop/Android/iPhone: **aprovado**;
- CodeQL, dependências, Excel SME e backup/restauração: **aprovados**;
- Lighthouse desktop: **LCP mediano 3,48 s**, dentro do limite bloqueante de 3,50 s;
- Lighthouse mobile: **LCP mediano 15,81 s**, dívida conhecida e não bloqueante desta frente, preservada como evidência; nenhum limite foi ampliado.

## Motivo deste commit

O projeto Vercel `radarpdde-fix` não promoveu automaticamente o merge do PR #239 para Production. O último deployment Production continuava no commit `9d31eb40a1b18be6526ed6425e521b6cd15aadaf` (PR #234), embora a `main` já contivesse os PRs #235, #237 e #239.

O projeto já possui precedente documentado no PR #235: um push convencional em `main` é usado como gatilho controlado da integração Git quando o merge não produz deployment Production.

Este arquivo existe exclusivamente para:

1. registrar o SHA funcional previamente aprovado;
2. produzir um push convencional e rastreável em `main`;
3. acionar a publicação do conteúdo já homologado;
4. permitir a conferência posterior de que o deployment Vercel corresponde à `main` atual.

Nenhum código de aplicação, migration, dado, RLS, Auth, Edge Function ou regra de negócio é alterado por este commit.

## Critério de encerramento

A publicação só pode ser declarada concluída depois de existir deployment Vercel com:

- `target: production`;
- estado `READY`;
- commit correspondente a este gatilho ou descendente direto sem alteração funcional;
- alias oficial `https://radarpdde-fix.vercel.app` apontando para o deployment publicado.
