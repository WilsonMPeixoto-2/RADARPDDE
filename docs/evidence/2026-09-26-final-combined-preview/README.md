# Candidato combinado — checkpoint de auditoria

**Data:** 26/09/2026  
**Finalidade:** registrar o candidato atual sem reescrever evidências visuais históricas.

## Candidato

- runtime/UI: `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`
- #375 incorporado: `d591b231eb06e95a1c09ba2fb6e40d2c7bb83f7d`
- Preview branch: `preview/final-combined-current-2026-09-26`
- commit temporário da branch: `4f8aca3cc9cf58b7da5cbb1eb7c3ba9d4f933dd4`
- deployment: `dpl_9wLYQYVKszqwX4rZbCS6WQAJcfec`
- estado Vercel: `READY`
- URL: `https://radarpdde-5rjsbtb4x-wilson-m-peixotos-projects.vercel.app`

A diferença da branch Preview está em `vercel.json` e não deve ser integrada.

## Prova técnica disponível

- Playwright desktop: 182 passed, 54 skipped, 1 flaky, 0 falhas finais;
- flaky classificado como sincronização incompleta do teste de layout e corrigido sem alterar runtime;
- validação geral, snapshot, retificação, Lighthouse e Excel SME: verdes;
- Supabase SQL: 34 arquivos / 486 testes PASS;
- Supabase lint: nenhum erro de schema;
- falha final de `supabase-local`: rate limit externo do registry ao baixar `postgres-meta:v0.97.0`.

## Limite desta evidência

Este arquivo **não declara homologação visual**. As capturas anteriores em `../2026-09-26-postfix-preview/` pertencem a runtime anterior e não provam os commits posteriores.

Ainda é necessário navegar o Preview combinado e registrar evidência visual do mesmo runtime para:
- limpeza do filtro escolar;
- URL/retorno do Prontuário;
- contenção da ação longa;
- abertura da reanálise pelo topo;
- feedback ao lado do drawer.
