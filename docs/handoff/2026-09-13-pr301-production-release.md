# Handoff final — PR #301 e reabertura de Production

**Data:** 13/09/2026  
**Classe:** Handoff corrente / fechamento operacional

## Estado que deve ser assumido

- PR #301: **merged**;
- merge funcional: `39cd984206b33c7d2a6d7084e23597f964235c9a`;
- candidato funcional certificado: `452d97267348957f7155fc77bb139a4adafd766b`;
- commit documental pós-merge publicado: `de336d20f514818c42a3ad403720c6b606065868`;
- Vercel Production: `dpl_DKGa7PqP6KqiDrrWeevReEhyrKLS`, **READY**;
- domínio oficial: `https://radarpdde-fix.vercel.app/`;
- Supabase Production `RADAR PDDE 2026`: `ACTIVE_HEALTHY`.

## O que foi corrigido

A UAT encontrou um defeito real no novo envio de Pendência fiscal sem patrimônio: `p_expected_asset_version` era omitido quando `undefined`, quebrando a assinatura de `register_invoice_document_attempt` e gerando 404.

Correção integrada:

```text
p_expected_asset_version: persistence.expectedAssetVersion ?? null
```

Há teste de regressão específico. Sem migration e sem mudança de regra de negócio.

Também permanece integrada a correção dos assets do logo por caminho absoluto.

## O que foi comprovado

A UAT real com Supabase descartável/Auth/RLS comprovou UI → banco → UI → reload para avaliação, consumo, serviço/Assessoria, `a_identificar`, Boleto Internet e ciclo administrativo de Pendência, incluindo novo envio, reanálise, contato, cancelamento e reabertura.

Os gates funcionais, Playwright completo, readiness, confiabilidade remota, perfis/viewports, CodeQL e dependências passaram. O único vermelho do gate integral foi Lighthouse, que não bloqueia esta reabertura.

O build Production pós-merge executou 1020 testes, todos aprovados, e gerou artefato `supabase-production`.

## Smoke de Production

- HTTP 200 no domínio oficial;
- tela de login institucional correta;
- nenhum erro/fatal nos logs do deployment novo no intervalo observado;
- TinyFish independente confirmou acesso público e tela de login sem bloqueios;
- TinyFish não autenticou porque não havia sessão/credencial segura disponível;
- Work/Astra havia comprovado login real anterior e acesso ao Prontuário da Ary Barroso.

Nunca registrar o TinyFish como smoke autenticado: ele **não autenticou**.

## Decisão

**RADAR liberado para reabertura aos usuários.**

Não há bug funcional conhecido bloqueando as jornadas certificadas. Itens `partial` da matriz permanecem dívida de evidência específica, não regressão conhecida.

## Limites e próximos cuidados

- não restaurar PR #299;
- não misturar incidentes futuros com Lighthouse, upgrade de dependências, remoção de índices ou hardening de senha;
- não executar mutações de teste em Production sem necessidade explícita;
- se surgir falha real, reproduzir a jornada, confrontar UI/Supabase/reload e corrigir a causa raiz;
- manter os monitores de Production e a observabilidade existentes.

Advisors atuais do Supabase registram apenas aviso de proteção contra senha vazada desativada e oito índices ainda não utilizados; tratar em frentes próprias se priorizado.
