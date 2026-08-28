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


## 5. Evidência de gates do hotfix

Checkpoint funcional consolidado: `3b10c2a97fd2142dbfd1e120dad0bf2bbd712d57`.

| Gate | Resultado |
|---|---|
| Validar RADAR PDDE | PASS |
| CodeQL | PASS |
| Saúde das dependências | PASS |
| Snapshot canônico | PASS |
| Excel SME / contratos-fonte | PASS |
| E2E Playwright | PASS |
| Gate remoto de perfis e viewports | PASS |
| Backup e restauração descartáveis | PASS |
| migration-smoke | PASS |
| readiness estático | PASS |
| preflight pós-apply | PASS |
| pgTAP | **25 arquivos / 357 testes / PASS** |
| lint do schema | PASS |
| Vercel Preview | PASS |
| Lighthouse desktop | PASS — performance 79%, FCP 1,02 s, LCP 3,49 s / limite 3,50 s |
| Lighthouse mobile | FAIL — LCP 15,98 s / limite 15,00 s |
| Supabase readiness agregado | FAIL externo após provas de banco: `Rate exceeded` ao baixar `postgres-meta` para regenerar tipos |
| Homologação integral pré-Production | FAIL agregado por rate limit externo no job Supabase e Lighthouse mobile |

### Classificação das falhas externas

Na execução Supabase, migration, preflight, pgTAP e lint foram concluídos com sucesso antes da tentativa de regeneração dos tipos falhar por indisponibilidade/rate limit do registry de imagens.

Na homologação pré-Production, Playwright completo, prontidão, migrations limpas, dependências, Excel e backup/restauração passaram. O job Supabase falhou ao iniciar/recriar containers por `Rate exceeded`.

Esses eventos não autorizam ignorar o gate, mas também não constituem evidência de defeito funcional do hotfix. A ação correta é reexecutar quando a infraestrutura externa estiver disponível.

### Classificação do Lighthouse móvel

Mobile não é critério bloqueante deste hotfix, conforme decisão aprovada. O desktop é o alvo funcional e visual desta entrega e passou no orçamento.

O threshold móvel não foi alterado.

Esta seção registra somente evidência de CI. Não altera a conclusão do preflight de Production e não autoriza qualquer escrita em Production.
