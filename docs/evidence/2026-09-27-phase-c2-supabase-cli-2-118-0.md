# Fase C2 — homologação do Supabase CLI 2.118.0

**Data:** 27/09/2026  
**PR:** #385  
**Baseline:** `main@70e3d7e601b9157940dba0d2cbbc8a0d7cf90ad3`  
**Versão em avaliação:** `supabase@2.118.0`  
**Resultado:** **REPROVADA — manter `2.114.0`**

## Objetivo

Avaliar a versão 2.118.0 isoladamente, sem alterar SDK, migrations, schema, RLS, pgTAP ou regras de negócio para acomodar a ferramenta.

## Materialização do experimento

O lockfile foi gerado em GitHub Actions com Node 24/npm 11. A mudança alcançou apenas:

- pacote raiz;
- `supabase` 2.114.0 → 2.118.0;
- oito binários `@supabase/cli-*` 2.114.0 → 2.118.0;
- `jose` 6.2.9 → 6.2.12, exigência transitiva do CLI 2.118.0.

O bootstrap confirmou `npm ci --ignore-scripts` com o lock gerado.

## Primeiro vermelho: defeito do teste, não do produto

O primeiro SHA experimental falhou em `Validar RADAR PDDE` porque o teste novo chamava um helper inexistente, `readJson()`.

Causa:

`ReferenceError: readJson is not defined`

Correção aplicada somente ao teste:

`JSON.parse(read('package-lock.json'))`

Nenhum arquivo de produto, SQL, migration, RLS ou configuração Supabase foi alterado nessa correção.

## Resultado do Supabase local

No SHA experimental e novamente no SHA corrigido `125732a950287fc172add804391d1ae3504cbcb7`:

- instalação reproduzível: verde;
- readiness lógico: verde;
- migration-smoke: verde;
- `supabase start`: verde;
- `db reset --local`: verde;
- todas as migrations: verdes;
- preflight remoto: verde;
- pgTAP: **484/486 testes verdes**;
- falhas: somente `rls.test.sql`, testes 32 e 33.

Falhas reproduzidas:

1. `service_role não remove perfis pelo bootstrap`;
2. `service_role não remove escopos pelo bootstrap`.

São exatamente as duas garantias que já haviam reprovado Supabase CLI 2.116.0 e 2.117.0.

## Classificação causal

A regressão acompanha a versão da CLI e reaparece sem qualquer mudança de RLS/migrations no RADAR. O baseline 2.114.0 permanece homologado.

Portanto, **não alterar RLS, pgTAP, migrations ou lógica funcional para obter verde com 2.118.0**. A versão é considerada incompatível com as garantias atuais do RADAR.

## Decisão

- preservar `supabase@2.114.0`;
- bloquear exatamente `2.118.0` no Dependabot, além de 2.116.0 e 2.117.0;
- manter o bloqueio específico, permitindo que versões posteriores sejam avaliadas;
- registrar esta evidência para impedir que um agente futuro interprete o vermelho como defeito funcional do RADAR.
