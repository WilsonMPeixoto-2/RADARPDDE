# ADR-050 — análise e Pendência individual por registro de Notas Fiscais

**Status:** Aceita; correções finais implementadas no PR #211, ainda em Draft e com gates finais em reexecução  
**Data:** 28 de agosto de 2026  
**Escopo:** hotfix PR #211  
**Substitui:** nenhuma ADR; formaliza as decisões finais do hotfix sem conflitar com ADR-047, ADR-048 e ADR-049 já existentes

## Contexto

`notaFiscal` é um requisito documental agregado para bonificação, mas pode conter várias despesas independentes. Um único estado técnico e uma única Pendência agregada não conseguem representar corretamente situações em que uma NF está correta, outra incorreta e uma terceira ainda não foi analisada.

O hotfix também precisa representar corretamente débitos do extrato cuja documentação não foi apresentada, sem perder a identidade da despesa quando ela for posteriormente esclarecida.

## Decisão funcional

1. A bonificação de `notaFiscal` permanece agregada.
2. A análise técnica passa a existir por `registered_invoice_id`.
3. O resumo técnico agregado é derivado e não aceita edição direta.
4. A precedência do resumo é: `Incorreto → Não analisado → Correto (Atrasado) → Correto`.
5. Toda nova Pendência de Notas Fiscais precisa estar vinculada à despesa específica.
6. Invoices diferentes podem possuir Pendências ativas simultâneas.
7. A mesma invoice não pode possuir duas Pendências ativas equivalentes.
8. `boleto_internet` permanece tipo de gasto de `notaFiscal` e somente em `CONECTADA`.
9. `a_identificar` nasce obrigatoriamente `Incorreto + Pendência` na mesma operação.
10. O editor comum não pode criar nem transformar despesa identificada em `a_identificar`.
11. A identificação posterior de `a_identificar` ocorre em **Pendências → Registrar novo envio**.
12. A identificação preserva o mesmo `registered_invoice_id`.
13. O novo envio leva a Pendência para `Aguardando reanálise` e o documento identificado para `Não analisado`.
14. A simples apresentação do documento não resolve a Pendência.
15. A reanálise exige tentativa válida da mesma Pendência, no mesmo contexto de escola, competência e programa.
16. Resultado correto resolve a Pendência; resultado incorreto mantém o ciclo de regularização.
17. Se a despesa for identificada como serviço, a dimensão de Consulta Assessoria é criada e tratada separadamente.
18. Se for identificada como bem permanente, o registro patrimonial é criado e vinculado na mesma operação.
19. Pendência ativa bloqueia edição estrutural comum da despesa no Prontuário.
20. Pendências históricas sem identidade individual não recebem associação automática por número, valor, descrição ou heurística.

### Consulta Assessoria

A dimensão de Consulta Assessoria continua separada da análise documental da Nota Fiscal, mas também usa a identidade da NF de serviço quando precisa registrar análise e Pendência.

Regras consolidadas:

- somente `servico` participa da matriz de Assessoria;
- cada NF de serviço possui seu próprio `sent` e sua própria análise;
- Pendência de Assessoria é identificada por escola + competência + programa + `consAssessoria` + `registered_invoice_id`;
- Pendência da NF A não bloqueia análise ou Pendência da NF B;
- selecionar `Incorreto` abre o fluxo de Pendência antes da gravação; análise e Pendência são persistidas atomicamente;
- o resumo mensal de bonificação da Assessoria é `Sim` se pelo menos uma consulta exigível foi enviada, `Não` se existem NFs de serviço e nenhuma foi enviada, e `Não se aplica` se não existe NF de serviço;
- enquanto houver Pendência ativa da própria NF, o Prontuário apresenta **Visualizar pendência**;
- novo envio e reanálise permanecem na tela de Pendências.

## Decisão visual

O hotfix altera o bloco de Notas Fiscais do Prontuário, o drawer lateral e, de forma estritamente necessária à individualização, o bloco de Consulta Assessoria das NFs de serviço. Não há redesign geral do Prontuário ou da tela de Pendências.

No desktop, cada sublinha possui quatro áreas:

`Documento | Tipo · Valor | Situação técnica | Ação`

Matriz de apresentação:

| Estado | Apresentação | Ação no Prontuário |
|---|---|---|
| Não analisado | seletor | analisar |
| Correto | estado verde | Editar análise por ação deliberada |
| Correto (Atrasado) | estado concluído | Editar análise por ação deliberada |
| Incorreto + Pendência | estado estático | Visualizar pendência |
| Aguardando reanálise | estado estático | Visualizar pendência |
| a_identificar | Incorreto | Visualizar pendência |

Regras adicionais:

- contador de Pendências só aparece quando maior que zero;
- com Pendência ativa, controles normais de edição documental não competem com a ação operacional;
- `Abrir pendência` não é etapa normal de um estado que deve nascer atomicamente;
- `Registrar novo envio` e `Reanalisar` pertencem exclusivamente à tela de Pendências;
- o drawer permite somente **Visualizar → Editar → Salvar**;
- desktop é o alvo deste hotfix; mobile não é gate bloqueante desta entrega.

## Limite entre aplicação e banco

Os serviços de domínio/aplicação continuam sendo a autoridade das regras do RADAR.

O banco deve proteger:

- identidade;
- vínculo entre despesa e Pendência;
- escola, competência e programa;
- status necessário da Pendência;
- tentativa correspondente;
- versão/concorrência;
- atomicidade.

O banco não deve duplicar toda a lógica funcional já existente nos serviços.

## Histórico, fixtures e Production

A consulta inicial encontrou 20 registros históricos `a_identificar` sem análise individual explícita e sem Pendência individual vinculada. A investigação posterior de autoria refinou essa classificação.

Decisão vigente:

- **16 registros legítimos de Controladores** permanecem preservados;
- esses 16 não recebem análise ou Pendência retroativa;
- o novo layout os identifica como **Registro legado**, sem alterar seu conteúdo;
- **4 `a_identificar` de teste** integram uma limpeza fail-closed;
- a mesma limpeza inclui outras 8 NFs/despesas dos cenários de teste do hotfix, totalizando 12 registros;
- três Pendências fiscais genéricas antigas criadas nesses testes também são removidas;
- logs administrativos são preservados;
- a limpeza só ocorre quando IDs, autoria, contexto e ausência de história real forem novamente comprovados.

A antiga exceção “reparar o vínculo do Boleto 1234” está **superada**. Boleto e Pendência foram atribuídos à conta técnica de teste e passam a ser removidos como fixtures.

A classificação autoritativa está em `docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`.

### Fronteira canônica de Consulta Assessoria

Para evitar regressões e interpretações divergentes entre futuras sessões:

- a renderização individual por NF de serviço pertence ao bloco `consAssessoria` de `app.js`;
- a busca de Pendência ativa usa obrigatoriamente `registered_invoice_id` da NF;
- a busca genérica por escola + competência + programa + documento **não pode** ser usada para bloquear uma NF de serviço individual;
- selecionar `Incorreto` na UI não grava o estado isoladamente;
- `app.js` delega esse caminho à integração `src/integration/service-advisory-pendency.js`;
- essa integração mantém o contexto da NF e confirma `Incorreto + Pendência` de forma atômica;
- Pendência de uma NF jamais bloqueia outra NF de serviço.

Uma auditoria que proponha voltar ao lookup genérico ou abrir o modal de Assessoria por um caminho paralelo deve ser tratada como incompatível com esta decisão vigente.

## Evidências e referências

- plano do hotfix: `docs/superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`;
- handoff: `docs/handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`;
- referências visuais: `docs/evidence/2026-08-28-pr211-referencias-visuais.md`;
- preflight Production: `docs/evidence/2026-08-28-pr211-production-preflight.md`;
- classificação de legados/fixtures: `docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`;
- matriz funcional: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`.

## Retorno ao plano mestre

Após eventual publicação do PR #211, executar re-baseline de `main`, Supabase Production e Vercel Production, reconciliar o plano mestre de 26/08 e somente então iniciar PR3.1.
