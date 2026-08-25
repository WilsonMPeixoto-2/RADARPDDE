# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 24 de agosto de 2026
**Classe documental:** Canônico — estado corrente e retomada futura
**Situação:** diagnóstico das correções operacionais concluído; documentação/plano em versionamento; nenhuma correção iniciada

## 1. Porta de entrada atual

O checkpoint detalhado vigente é:

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md)

O plano executável é:

- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md)

O relatório integral, com linguagem não técnica, wireframes e imagens, é:

- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx)

O handoff pós-PR #193 permanece histórico e útil para compreender a estabilização anterior:

- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md)

## 2. Fonte de verdade

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. schema, migrations, Auth, RLS, RPCs, Edge Functions e dados efetivos do Supabase;
3. deployment efetivamente publicado na Vercel e seu manifesto;
4. decisões de negócio vigentes;
5. testes que representam o contrato atual;
6. documentação canônica;
7. auditorias, planos e handoffs históricos.

Nenhum documento ou teste antigo prevalece sobre código e ambiente atuais. Este arquivo descreve o checkpoint; valores voláteis devem ser revalidados antes de código, migration ou publicação.

## 3. Baseline analisado

```text
GitHub main:
4542bbfdba7b4a6073445c8f3ea6ceafbb660dba

Commit curto:
4542bbf

Origem:
merge do PR #194

Supabase Production:
scnryinorqeucbfkioxo
estado observado: ACTIVE_HEALTHY
PostgreSQL observado: 17.6.1
```

O PR #195 foi fechado sem merge por decisão do responsável pelo produto, pertence a outro assunto e está integralmente fora do diagnóstico e do plano. Não o usar como referência, código ou dependência.

O deployment Vercel deve ser consultado novamente antes do PR 1; este diagnóstico não usa um manifesto Vercel novo como premissa para alterar produto.

## 4. Snapshot read-only de Production

Consultas somente leitura realizadas em 24/08/2026 confirmaram:

| Entidade/estado | Quantidade observada |
|---|---:|
| Avaliações mensais | 113 |
| Despesas/notas | 17 |
| Históricos administrativos | 1.562 |
| Pendências | 22 |
| Abertas | 19 |
| Aguardando reanálise | 2 |
| Canceladas | 1 |
| Resolvidas | 0 |
| Tentativas | 5 |
| Contatos | 0 |

Concentração ativa observada:

- 12 registros em `04.10.001`, R.A. 10, Juliana Barbosa;
- 9 registros em `04.30.002`, R.A. 30, Mônica Chagas.

Essas contagens são evidência datada. Não as tratar como constantes nem executar reparo com base apenas nelas.

## 5. Defeitos e problemas confirmados

### 5.1 Gravação de despesas

- o formulário não possui trava síncrona de submissão;
- inclusão gera ID novo em cada execução;
- clique duplo pode persistir duas despesas;
- edição sempre alcança update/histórico, sem no-op verdadeiramente semântico;
- a dispensa de reler `administrativeLogs` em `invoice:save` depende hoje da instalação da extensão de desempenho;
- retry, duas abas e perda de resposta ainda não possuem chave idempotente de servidor.

Conclusão: o relato de duplicação é defeito real. O usuário repetir o clique diante da demora expõe uma falha que o sistema deve conter.

### 5.2 Consulta Assessoria e consolidação

Foram confirmados exatamente quatro contextos inconsistentes:

| Escola | Competência | Programa |
|---|---|---|
| `04.10.002` | `2026-03` | Educação Conectada |
| `04.10.002` | `2026-08` | PDDE Básico |
| `04.31.001` | `2026-08` | PDDE Básico |
| `04.31.804` | `2026-05` | PDDE Básico |

Todos possuem Consulta Assessoria vazia, nenhuma NF de serviço e análise `Não analisado`. Pela regra canônica, zero NF de serviço significa `Não se aplica`/`Correto`.

O defeito nasce porque `InvoiceService.syncServiceRequirement()` calcula a regra, mas outra transição em `VerificationService` consegue limpar o valor sem executar novamente a mesma função.

Não corrigir a consolidação para ignorar o vazio. Corrigir a origem e depois reparar somente as linhas ainda elegíveis.

### 5.3 Prontidão funcional

- `RadarProductExtensionsReady` confirma carregamento de scripts, não instalação funcional;
- módulos críticos e auxiliares usam polling e expiram depois de dez segundos;
- falha de um script pode interromper a cadeia dos posteriores;
- a correção exige readiness por módulo e falha isolada.

### 5.4 Gestão de Pendências

A ADR-044 permanece correta: todas as competências devem continuar visíveis.

As lacunas atuais são de operação e experiência:

- filtros operacionais insuficientes, especialmente R.A. e Controlador visível;
- select nativo de escola ruim no mobile;
- cartões repetidos, altos e sem hierarquia clara;
- excesso de ações simultâneas;
- ação/regra espalhada entre módulos e `MutationObserver`;
- aba inicial prioriza volume, não trabalho do perfil;
- tempo da etapa diverge depois de reabertura/reanálise incorreta;
- UI não permite reabrir Cancelada, embora PEND-05 permita;
- detalhes e reanálise apresentam contexto como texto corrido;
- pendência Cancelada ainda pode exibir rótulo `Erros atuais`.

## 6. Regras de negócio que não mudam

- Pendências continuam transversais a todas as competências.
- Bonificação, análise técnica, pendência e próxima ação são dimensões independentes.
- `Sim + Incorreto + pendência` continua permitido.
- Pendência ativa não bloqueia consolidação por si só.
- `Não analisado` não bloqueia consolidação por si só.
- Novo envio não resolve automaticamente; cria trabalho de reanálise.
- Não abrir duas pendências equivalentes para a mesma origem.
- Despesa `A identificar` não força Nota Fiscal, bem, Assessoria ou conclusão automática de análise.
- Duas despesas reais podem ter o mesmo conteúdo.

## 7. Sequência vigente antes de implementação

```text
Etapa 0 — congelar baseline
PR 1 — contenção imediata
PR 2 — regra e efeitos canônicos
PR 3 — prontidão crítica
PR 4 — reparo condicionado dos dados
PR 5 — idempotência de servidor
PR 6 — contrato funcional da fila
PR 7A — fila, filtros e cartões
PR 7B — detalhe, reanálise e agrupamento opcional
PR 8 — resposta autoritativa completa e desempenho
```

Gates:

- PR 4 somente depois de PR 2 publicado e validado;
- PR 7A/7B somente depois do contrato do PR 6;
- PR 8 somente depois da idempotência do PR 5 e do tratamento de `deleted_asset_id`;
- a guarda do PR 1 permanece em todas as fases;
- no-op semântico fica no PR 2, depois da regra canônica, e não no PR 1.

## 8. Decisões da futura experiência de Pendências

- abas continuam representando status; não adicionar filtro de status redundante;
- `Minha carteira` pode ser atalho, com `Todas` acessível em um gesto;
- filtro de R.A. pode usar `schools.ra`;
- não criar `Minha R.A.` sem relação formal usuário ↔ R.A.;
- Controlador passa para a área principal dos filtros;
- escola usa combobox pesquisável por nome/designação/código;
- faixas de tempo: Hoje, 1–3, 4–7, 8–15 e 16+ dias;
- cartão expõe uma ação principal; secundárias vão para menu;
- cancelamento é excepcional, protegido e confirmado;
- agrupamento por escola é opcional no primeiro release;
- não criar ainda ações ambíguas no cabeçalho do grupo.

## 9. Testes-base reproduzidos

Conjunto principal: 22 aprovados. Conjunto ampliado: os mesmos 22 mais nove de integração da instrumentação, totalizando 31 aprovados. Zero falhas nos dois recortes.

Comando ampliado:

```bash
node --test \
  tests/pendency-cancelled-reopen.test.js \
  tests/pendencias-view-model.test.js \
  tests/unit/pendency-service-access.test.js \
  tests/unit/pendency-reanalysis-roles.test.js \
  tests/unit/operational-write-diagnostics-integration.test.js
```

Sempre registrar arquivos/comando e resultado, não somente `22` ou `31`.

## 10. Estado executivo

O sistema permanece em Production e o diagnóstico não autorizou interrupção geral. Entretanto, existem:

- risco imediato de duplicação por submit repetido;
- risco residual de retry/tabs até o PR 5;
- quatro inconsistências derivadas conhecidas;
- possibilidade de módulos críticos não se instalarem em inicialização lenta;
- baixa clareza operacional na fila de Pendências.

Esses itens estão planejados, mas ainda não corrigidos no baseline deste documento.

## 11. Próxima ação autorizável

Depois que este pacote documental estiver integrado à `main`:

1. revalidar GitHub/Vercel/Supabase;
2. registrar a Etapa 0;
3. abrir branch isolada do PR 1;
4. implementar somente guarda de submit, feedback e refresh mínimo do núcleo;
5. executar testes focados e smoke desktop/mobile;
6. parar para revisão antes do PR 2.

Nenhuma migration, reparo de dados, idempotência ou redesign deve ser incluído no PR 1.

## 12. Histórico relevante

- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — checkpoint anterior;
- [`decisions/ADR-044-pendencias-passivo-transversal.md`](decisions/ADR-044-pendencias-passivo-transversal.md) — todas as competências;
- [`decisions/ADR-046-escritas-operacionais-incrementais-e-observaveis.md`](decisions/ADR-046-escritas-operacionais-incrementais-e-observaveis.md) — contrato de escrita e lacunas reclassificadas;
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md);
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md);
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md).
