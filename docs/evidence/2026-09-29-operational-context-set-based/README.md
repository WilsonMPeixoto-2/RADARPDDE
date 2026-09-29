# Candidato — contexto operacional set-based

**Data:** 29 de setembro de 2026  
**PR:** #396  
**Baseline:** `main@eb6f33f2ec123c5f2f6bdf08f63ab0e18cbc4fa2`

## Objetivo

Eliminar o fan-out de centenas de leituras REST observado na troca de competência e na sincronização pós-gravação, preservando o contrato funcional do contexto operacional.

## Implementação do candidato

- nova RPC `public.read_operational_context(text,text[])`, `SECURITY INVOKER`;
- fechamento set-based de verificações, notas fiscais, Pendências, tentativas, contatos e bens;
- `OperationalSupabaseRepository.queryOperationalContext()` mantém sua interface e passa a consumir a RPC canônica;
- `SupabaseRepository.executeRpc()` aceita `AbortSignal` opcional para leituras canceláveis sem alterar RPCs de escrita;
- `queryContextDependencies()` foi removida do caminho operacional;
- gate E2E de performance exige uma única RPC contextual e rejeita o fan-out antigo;
- E2E Realtime foi reconciliado para interceptar a nova RPC canônica sem enfraquecer o contrato de abort + reconvergência.

## Segurança de dependências

Durante a execução surgiu, independentemente da mudança funcional, novo advisory de alta severidade em `fast-uri@3.1.6`.

O candidato fixa `fast-uri@3.1.7` e regenera de forma reproduzível `vendor/ajv.js`.

## Baseline anterior à correção

- 172–292 requests REST por troca de competência;
- 5,69–9,50 s por troca;
- ~89% do tempo em `loadOperationalContext()`;
- escrita isolada de 301 ms seguida por 997 GETs operacionais em ~16 s.

Fonte: `docs/evidence/2026-09-29-production-evaluation-performance/README.md` no PR documental #395.

## Gate atual

Este arquivo registra o **candidato**, não a conclusão.

Antes de merge:

1. CI integral no head final;
2. pgTAP/RLS verdes;
3. E2E Realtime verde sobre a RPC set-based;
4. gate de dependências sem advisory conhecido;
5. medição autenticada pós-correção;
6. confirmação de redução de requests/latência sem regressão funcional.
