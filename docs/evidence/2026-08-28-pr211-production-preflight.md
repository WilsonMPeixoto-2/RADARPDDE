# PR #211 — preflight somente leitura de Production

**Data:** 28 de agosto de 2026  
**Ambiente consultado:** Supabase Production `scnryinorqeucbfkioxo`  
**Natureza:** somente leitura; nenhuma mutação executada

## 1. Objetivo

Verificar os dados existentes que podem ser afetados pela nova regra de análise individual de `notaFiscal`, especialmente:

- registros `a_identificar`;
- a Pendência conhecida do boleto de Internet que originou o hotfix.

Este preflight não autoriza reparos genéricos nem backfill.

## 2. Registros `a_identificar`

Consulta de Production em 28/08/2026:

| Medida | Resultado |
|---|---:|
| Total de `a_identificar` | 20 |
| Escolas distintas | 5 |
| Contextos competência + programa | 11 |
| Com Pendência ativa vinculada por `registered_invoice_id` | 0 |
| Com qualquer histórico de Pendência vinculado por `registered_invoice_id` | 0 |
| Já com `analiseDocumentoFiscal = Incorreto` explícito | 0 |
| Sem análise individual explícita | 20 |

### Decisão

Os 20 registros **não serão alterados automaticamente** pela migration do hotfix.

Motivo:

- foram criados antes do novo contrato;
- não possuem identidade de Pendência individual;
- não existe evidência suficiente para reconstruir retrospectivamente motivo, observação e histórico de uma Pendência;
- fabricar Pendências ou estado individual retroativo contaminaria a rastreabilidade.

O novo contrato `a_identificar = Incorreto + Pendência` vale para novas operações e para transições futuras executadas pelo fluxo canônico.

## 3. Caso conhecido do Boleto Internet

O preflight confirmou a coexistência exata dos registros esperados:

### Pendência

- ID: `pend-384d9cc0-634f-4e74-9eac-f22da3b6e2c5`
- escola: `04.31.001`
- competência: `2026-08`
- programa: `CONECTADA`
- documento: `notaFiscal`
- `registered_invoice_id`: nulo
- status: `Aberta`
- motivo: `Outro`

### Despesa

- ID: `nota-a2da969c-2e29-41f9-a9fc-f34a306e00ed`
- tipo: `boleto_internet`
- número atualmente armazenado: `Boteto 1234`
- valor: R$ 100,00

Esse é o único reparo de vínculo previamente aprovado no hotfix.

A migration deve continuar usando preflight fail-closed: se qualquer atributo esperado divergir no momento da aplicação, deve falhar em vez de associar registros por aproximação.

## 4. Resultado operacional

O preflight reforça duas decisões:

1. o reparo conhecido do boleto é determinístico e pode permanecer na migration, condicionado ao preflight;
2. os 20 `a_identificar` permanecem intocados.

Nenhuma modificação foi executada em Production durante esta verificação.
