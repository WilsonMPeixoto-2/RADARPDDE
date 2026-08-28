# ADR-047 — análise e Pendência individual por registro de Notas Fiscais

**Status:** Aceita  
**Data:** 28 de agosto de 2026  
**Escopo:** hotfix PR #211

## Contexto

`notaFiscal` representa uma dimensão documental agregada, mas pode conter vários registros financeiros independentes. O modelo anterior permitia apenas uma análise técnica e uma Pendência ativa por escola + competência + programa + documento, produzindo bloqueio cruzado entre NFs distintas.

## Decisão

1. A bonificação de `notaFiscal` permanece agregada.
2. A análise técnica passa a existir por `registered_invoice_id`.
3. O resumo técnico mensal é derivado.
4. Pendência individual usa `registered_invoice_id` como parte da identidade.
5. NFs distintas podem possuir Pendências simultâneas.
6. A mesma NF não pode possuir duas Pendências ativas equivalentes.
7. `boleto_internet` permanece tipo de gasto de `notaFiscal`.
8. `a_identificar` nasce necessariamente `Incorreto + Pendência`, de forma atômica.
9. A identificação posterior de `a_identificar` preserva o ID.
10. O Prontuário apenas avalia e visualiza a Pendência; novo envio e reanálise pertencem à tela de Pendências.
11. O hotfix é temporariamente prioritário, mas não substitui o plano mestre.

## Consequências

- `registered_invoices.payload` passa a transportar o estado técnico individual durante esta fase arquitetural;
- `verification.analysis.notaFiscal` permanece como projeção agregada;
- `pendencies.registered_invoice_id` passa a admitir `notaFiscal` além de `consAssessoria`;
- a unicidade ativa por invoice torna-se parte do contrato;
- migrations e RPCs precisam validar contexto de escola/competência/programa;
- históricos sem identidade individual não recebem backfill heurístico;
- o caso conhecido do boleto pode ser reparado somente com preflight determinístico.

## Retorno ao plano mestre

Após o PR #211, a retomada do plano mestre exige re-baseline. Nenhuma etapa futura deve ser executada assumindo que os arquivos e premissas de 26/08 permaneceram inalterados.
