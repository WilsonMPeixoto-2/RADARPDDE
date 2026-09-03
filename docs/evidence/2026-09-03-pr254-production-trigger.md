# PR #254 — gatilho controlado de Production

**Data:** 3 de setembro de 2026  
**Natureza:** evidência operacional e push convencional em `main`; nenhuma alteração funcional

## Estado aprovado

- PR: #254 — `hotfix: corrigir novo envio e integridade da aba Pendências`;
- head aprovado: `8d4399b4c448925fccf9cb1b74841a089a26a450`;
- merge funcional: `cf9ac1a713d7dc27a1e5e9b6ed2e420ed208ea84`;
- Testes E2E Playwright: **aprovados**;
- Homologação integral pré-Production: **aprovada**;
- Supabase readiness, Auth, RLS, pgTAP e migrations: **aprovados**;
- Gate remoto de perfis × viewports: **aprovado**;
- CodeQL, dependências, Excel SME e backup/restauração: **aprovados**;
- Lighthouse independente: **aprovado**;
- repetição do Lighthouse da homologação integral: **aprovada**, sem relaxar thresholds;
- Supabase Production: migration canônica `20260903175000_corrective_submission_integrity` aplicada;
- Supabase Production: **45 migrations**, sem migration órfã de aplicação.

## Motivo deste commit

O merge do PR #254 foi concluído e o Supabase Production foi atualizado, mas a integração Git da Vercel não criou o deployment de Production correspondente porque a conta atingiu `build-rate-limit`.

Este arquivo existe exclusivamente para:

1. registrar o SHA funcional previamente aprovado;
2. produzir um push convencional e rastreável em `main`;
3. acionar novamente a publicação do conteúdo já homologado;
4. permitir a conferência posterior de que o deployment Vercel contém o hotfix do PR #254.

Nenhum código de aplicação, migration, dado, RLS, Auth, Edge Function ou regra de negócio é alterado por este commit.

## Critério de encerramento

A publicação só pode ser declarada concluída depois de existir deployment Vercel com:

- `target: production`;
- estado `READY`;
- commit correspondente a este gatilho ou descendente direto sem alteração funcional;
- manifesto público em `/radar-build-manifest.json` com o mesmo commit;
- alias oficial `https://radarpdde-fix.vercel.app` apontando para o deployment publicado.
