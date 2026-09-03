# RADAR PDDE — reconciliação documental e do plano mestre pós-hotfixes

**Data:** 3 de setembro de 2026  
**Classe documental:** Canônico — estado corrente, reconciliação do plano e proteção contra regressão  
**Baseline funcional de código analisado:** `75237c6ec5c22e8f7be9eb39fd21481f6d608010`  
**Vercel Production do baseline funcional auditado:** `dpl_HfiKFNkTHc1f9ATZjgZ6Cn7CbWzz`, `READY`, SHA `75237c6ec5c22e8f7be9eb39fd21481f6d608010`  
**Supabase Production:** `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, 44 migrations  
**Nota de temporalidade:** merges exclusivamente documentais posteriores podem alterar o HEAD de `main` e o deployment da Vercel sem mudar o runtime. SHA/deployment correntes devem ser consultados ao vivo; os valores acima identificam o baseline funcional auditado nesta reconciliação.

## 1. Finalidade

Este documento fecha a reconciliação que o plano mestre de 26/08 exigia depois do conjunto de hotfixes e melhorias posteriores.

A regra desta reconciliação é deliberadamente conservadora:

1. código da `main`, Supabase e Vercel atuais prevalecem sobre planos anteriores;
2. decisões supervenientes não podem ser revertidas para “cumprir” redação antiga;
3. tarefa do plano só permanece pendente quando o problema ou objetivo ainda existe no código atual;
4. trabalho já realizado por hotfix, refatoração equivalente ou evolução posterior não deve ser reimplementado;
5. quando a solução posterior é melhor ou mais específica, o plano é que deve ser atualizado;
6. histórico não é apagado: planos e handoffs antigos permanecem como evidência do raciocínio da época.

## 2. Primeira verificação — estado da documentação

A documentação não estava integralmente atualizada no início desta revisão.

Os principais documentos canônicos ainda terminavam em 31/08 e tratavam o PR #237 como porta de entrada, embora a `main` e Production já tivessem avançado até o PR #249.

Também foram encontradas afirmações objetivamente superadas, entre elas:

- `README.md` ainda dizia que a próxima Production dependia de fechamento de CI/dependências;
- `docs/CURRENT_STAGE.md` ainda descrevia a reconciliação pós-PR #211/#214/#215 como tarefa futura;
- `docs/reference/STATUS_DOCUMENTOS.md` ainda roteava novas sessões pelo handoff pós-PR #237;
- `docs/architecture/avaliacao-mensal.md` ainda trazia no cabeçalho a implementação do Boleto como “candidata no PR #203, ainda não publicada”;
- o README ainda falava em matriz funcional de 43 operações, embora `EXP-03` tenha elevado o contrato executável para 44 operações.

A documentação específica criada nos PRs recentes está correta, mas não havia sido incorporada à porta de entrada canônica.

## 3. Entregas posteriores ao PR #237 que passam a integrar o baseline

### PR #241 — Declaração BB Ágil com N/A

Merge `c3903f924aecd7a67df286a9b6e8c019a8db855b`.

Contrato vigente:

- Declaração BB Ágil aceita `Não se aplica` quando cabível;
- N/A neutraliza a análise técnica como `Correto`;
- sair de N/A reinicia a análise para `Não analisado`;
- Pendência ativa precisa ser resolvida/cancelada antes de N/A;
- análise técnica direta fica bloqueada enquanto o documento estiver N/A.

### PRs #242 e #244 — dependências e governança

Merges `c25936f41e229d1de956654eb7835c0b227dee74` e `ce1555493ac563c5cd55e7ac8a608f0cb36d133a`.

Estado vigente:

- ESLint `10.9.1`;
- Knip `6.33.0`;
- TypeScript `7.0.2` preservado;
- Supabase CLI `2.114.0` preservado;
- `2.116.0` bloqueado exatamente por regressão pgTAP/RLS;
- `@types/node` permanece na linha Node 24;
- `fast-uri` corrigido para `^3.1.6`;
- `qs` corrigido para `^6.16.0`;
- previews Dependabot não consomem quota da Vercel;
- bundle Ajv e lockfile reconciliados.

### PR #246 — comunicação externa

Merge `d5b45184eaa513352db0806f6d41c5e0568c6baf`.

Regra vigente:

- `RADAR PDDE` é nome do sistema interno;
- textos oficiais externos gerados para escola não devem citar o nome do sistema;
- cobrança termina somente em `Atenciosamente`.

### PR #247 — exportação de Pendências

Merge `bf57c0a32d75fdc511ca435272aabc400843d5c2`.

A tela de Pendências possui exportação XLSX própria:

- respeita busca e filtros;
- abas `RESUMO` e `PENDÊNCIAS`;
- identidade editorial profissional;
- sem IDs/UUIDs técnicos;
- ExcelJS sob demanda;
- auditoria antes e depois do download;
- contrato funcional `EXP-03`.

### PR #249 — ordem visual e polimento

Última mudança funcional do baseline analisado em `75237c6ec5c22e8f7be9eb39fd21481f6d608010`.

Regra vigente:

- `PDDE Básico` é o primeiro programa **na ordem visual da avaliação**;
- `programasIds` não é reordenado nem persistido;
- os demais programas mantêm ordem estável;
- tipografia, contraste e alinhamento da avaliação foram refinados;
- botão de planilha usa verde estilo Excel;
- alteração não muda regra de negócio.

## 4. Segunda verificação — plano mestre de 26/08 versus código atual

Classificação usada:

- **CONCLUÍDO:** objetivo já atendido; não executar novamente.
- **CONCLUÍDO POR CAMINHO EQUIVALENTE:** objetivo entregue depois, com nomes/arquivos diferentes.
- **PARCIAL:** parte relevante existe, mas o objetivo arquitetural ainda não está completo.
- **ALTERADO/SUPERADO:** decisão posterior torna a redação antiga incorreta ou perigosa.
- **PENDENTE:** lacuna continua comprovável no código atual.

| Etapa do plano | Estado em 03/09 | Evidência atual | Tratamento |
|---|---|---|---|
| G0 | **CONCLUÍDO** | baseline, governança e gates existem e são usados | não reexecutar |
| PR1 | **CONCLUÍDO** | guard de submit/no-op inicial e refresh mínimo já integrados | não reimplementar |
| PR2 | **CONCLUÍDO** | `service-advisory.js` e `invoice-effects.js` são autoridades vigentes | preservar ADR-050 e decisões posteriores |
| PR3.1–3.3 | **PARCIAL / PENDENTE** | extensão crítica possui Promise/ordem determinística, mas `capability-readiness.js` não existe e ainda há polling em `auth-gate.js`, `operational-readiness-bridge.js`, Task 9 e wrappers | executar somente o readiness sistêmico remanescente; não desfazer ADR-052/PR #222 |
| PR4 | **ALTERADO/SUPERADO** | Production não possui mais estado legado não vazio inconsistente sem NF de serviço | não criar migration de reparo com a regra antiga |
| PR5 | **PENDENTE** | `InvoiceService` ainda possui fallback `prefix-Date.now()`; não existem `client-id.js`, `invoice-save-intent.js`, chave idempotente server-side ou RPC v2 | implementar idempotência real sem deduplicar por conteúdo |
| PR6 | **PARCIAL** | `operational-projection.js` já calcula data/ator/ação/prioridade, mas `pendencias-view-model.js` ainda mantém `NEXT_ACTIONS`, `waitingSince` e ordenação próprios | concluir autoridade semântica única sem redesenhar a UI aprovada |
| PR6B | **CONCLUÍDO POR CAMINHO EQUIVALENTE** | detalhe de Pendência não troca competência; abrir no Prontuário troca explicitamente; regressões atuais cobrem contexto | não reimplementar |
| PR7A | **PARCIAL / ALTERADO** | fila, busca, filtros, contagens, quatro estados e exportação já existem; desenho atual foi visualmente aprovado | preservar tabs/layout atuais; revisar apenas gaps funcionais depois de PR6 |
| PR7B | **CONCLUÍDO POR CAMINHO EQUIVALENTE** | drawer, mobile cards, foco, teclado, detalhe, reanálise e estados finais já estão no render atual e gates Desktop/Android/iPhone passam | não redesenhar; sobras de polling pertencem a PR3 |
| PR8A/PR8B | **PARCIAL** | `StatePort.applyEntities`, flags de resultado remoto autoritativo e reconciliação incremental já existem; entretanto repositório continua em `save_invoice_with_effects` v1 e não existe `invoice_authoritative_result_v2`/reconciliador dedicado/degraded E2E planejado | completar contrato remoto sem reintroduzir render integral nem duplicar reconciliadores |
| PR9A | **PENDENTE** | não existem `bootstrap-performance-diagnostics.js`, relatório causal ou baseline autenticado planejado | medir antes de otimizar |
| PR9B | **CONCLUÍDO POR CAMINHO EQUIVALENTE** | Lighthouse usa 3 rodadas, mediana e preserva artefatos; `tooling-contract.test.js` protege o contrato | não refazer nem relaxar thresholds |
| PR9C | **PENDENTE** | não há baseline causal de PR9A para escolher hipótese | executar somente após PR9A |
| ADR-051 | **ADIADO POR DECISÃO VIGENTE** | hardening direto de `registered_invoices` não é defeito funcional atual | retomar somente após fechar frentes funcionais |

## 5. Achado crítico — PR4 não pode ser executado como escrito

Foi executada uma consulta **somente leitura** em Supabase Production em 03/09/2026 para o universo sem NF de serviço.

Resultado:

- **143** verificações sem NF de serviço já estão no estado canônico `Não se aplica / Correto`;
- **15** verificações estão vazias/não iniciadas, com Consulta Assessoria em branco e análise `Não analisado`;
- **0** contextos possuem estado legado **não vazio** inconsistente no universo sem NF de serviço.

A redação antiga do PR4 trataria qualquer divergência de `Não se aplica / Correto` como candidata e, portanto, poderia capturar as 15 avaliações ainda não iniciadas. Isso seria uma regressão: transformaria ausência de avaliação em correção técnica de dados.

Conclusão:

> O PR4 original está superado. Não criar migration, não “normalizar” as 15 avaliações vazias e não fabricar histórico. Se no futuro surgir divergência real não vazia, abrir um novo preflight somente leitura com regra compatível com o contrato vigente.

## 6. Achado estrutural — PR6 ainda é real, mas o alvo mudou

A autoridade `src/domain/operational-projection.js` já existe e contém:

- `getOperationalBaseDate`;
- `getConcreteNextAction`;
- `sortOperationalActions`;
- ator;
- ação;
- prioridade.

Porém `src/domain/pendencias-view-model.js` ainda contém:

- `NEXT_ACTIONS` próprio;
- cálculo próprio de `waitingSince`;
- cálculo de idade;
- ordenação por status.

Portanto a tarefa legítima não é “refazer Pendências”. A tarefa é **remover a duplicidade semântica residual**, mantendo intactos:

- quatro abas atuais;
- drawer aprovado;
- mobile cards;
- filtros atuais;
- exportação XLSX;
- navegação transversal;
- novo envio/reanálise individual;
- identidade visual aprovada.

## 7. Achado estrutural — PR3 continua necessário, mas deve absorver ADR-052

O plano antigo previa um registry sistêmico de capacidades. Ele ainda não existe.

Ao mesmo tempo, os hotfixes posteriores melhoraram a arquitetura:

- `RadarPendencias.buildPendencyLookupContext()` já é a fábrica canônica de contexto;
- PRs #218/#219/#221 consolidaram contexto e autoridade;
- `product-extensions-bootstrap.js` instala extensões críticas em ordem explícita;
- `RadarProductExtensionsReady` e testes de composição protegem a cadeia crítica;
- ADR-052 exige autoridade pesquisável e prova de composição.

A retomada de PR3 não deve remover isso para instalar uma arquitetura “do plano”. Deve usar essas entregas como baseline e migrar apenas a prontidão residual baseada em polling/símbolos globais.

## 8. Achado estrutural — PR7 não autoriza regressão visual

A tela atual de Pendências passou por refinamentos posteriores e foi aprovada visualmente.

O plano antigo continha detalhes de hierarquia como “Para reanalisar” como primeiro segmento e estrutura específica de filtros. Esses detalhes não são autoridade para desfazer a superfície vigente.

Na retomada:

- nenhuma mudança de tabs, ordem ou hierarquia visual será feita apenas porque o plano antigo dizia diferente;
- primeiro PR6 elimina semântica duplicada;
- depois, qualquer gap funcional de PR7A deve ser provado no código/tela atuais;
- PR7B é considerado funcionalmente atendido; eventual limpeza de decorator/polling é arquitetura de PR3/ADR-052.

## 9. Sequência restante reconciliada

A sequência antiga é substituída, para fins de execução futura, por:

```text
PR3.1
→ PR3.2
→ PR3.3
→ PR5
→ PR6
→ revisão focada dos gaps remanescentes de PR7A, sem redesenho automático
→ PR8A
→ PR8B
→ PR9A
→ PR9C usando a metodologia estatística de PR9B já vigente
→ encerramento funcional
→ reavaliar ADR-051 em frente própria
```

Itens retirados da sequência:

- PR4 antigo: superado pelo estado atual dos dados e pelas decisões posteriores;
- PR6B: já atendido;
- PR7B: já atendido funcionalmente;
- PR9B: já atendido por caminho equivalente.

## 10. Regras que o plano atualizado não pode regredir

1. Notas Fiscais mantêm bonificação agregada e análise/Pendência individual por `registered_invoice_id`.
2. `a_identificar` nova nasce `Incorreto + Pendência`; legados legítimos não recebem backfill heurístico.
3. Consulta Assessoria é individual por NF de serviço e usa contexto canônico com `registered_invoice_id`.
4. Boleto de Internet existe somente como tipo de gasto de Notas Fiscais em Educação Conectada.
5. Declaração BB Ágil aceita N/A sob o contrato vigente.
6. Pendência, análise e bonificação são dimensões independentes.
7. abrir detalhe de Pendência não muda a competência global; ir ao Prontuário muda explicitamente.
8. Production é fail-closed.
9. `renderProntuario()` integral não volta a ser caminho feliz de toda escrita.
10. o nome `RADAR PDDE` não aparece em comunicação oficial externa gerada.
11. exportação de Pendências e identidade editorial vigente são preservadas.
12. PDDE Básico permanece primeiro **somente na apresentação**, sem reordenar dados persistidos.
13. Supabase CLI `2.116.0` continua rejeitado até nova versão ser homologada.
14. Lighthouse não terá threshold enfraquecido para obter verde.

## 11. Estado da frente de estabilização arquitetural de 31/08

A frente `2026-08-31-estabilizacao-arquitetural-jornadas-criticas.md` também precisa ser lida pelo código atual:

- **Fase A — contexto canônico:** concluída; `buildPendencyLookupContext()` está em domínio e seus consumidores críticos foram migrados.
- **Fases B/C — APIs por jornada e retirada de preflights do app.js:** parcialmente atendidas nos fluxos fiscal/Assessoria, ainda não encerradas como princípio geral.
- **Fase D — reduzir wrappers:** pendente; wrappers de readiness/performance/reconciliação ainda existem e alguns usam polling.
- **Fase E — composição por jornada:** parcialmente/concretamente atendida nos fluxos críticos por ADR-052 e regressões de composição.
- **Fase F — fixture permanente:** não há evidência de fechamento integral dessa frente.
- **Fase G — gate de fechamento:** não concluído globalmente.

Essa frente não cria uma segunda ordem concorrente. Ela passa a funcionar como **regra de implementação** para PR3, PR6 e PR8 restantes.

## 12. Próximo ponto real de implementação

Depois desta reconciliação documental, o primeiro item realmente pendente continua sendo o **readiness sistêmico de PR3**, mas com escopo reduzido:

- preservar `RadarProductExtensionsReady`, ADR-052 e a ordem crítica atual durante a migração;
- criar o registry de capacidades somente se ele eliminar polling e tornar falhas localizadas/observáveis;
- migrar primeiro as esperas essenciais;
- não mover regras funcionais de volta para wrappers;
- não tocar UI aprovada sem defeito comprovado.

PR5 só começa depois do fechamento de PR3 conforme a sequência reconciliada.

## 13. Documentos que esta reconciliação supera como porta de entrada

Continuam preservados como histórico/evidência:

- `handoff/2026-08-31-pr237-fechamento-visual-e-ci.md`;
- `handoff/2026-08-30-pr215-fechamento-tecnico.md`;
- `handoff/2026-08-30-pr211-publicacao-concluida.md`;
- `handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`.

O plano mestre de 26/08 **não é apagado**. Ele continua contendo contexto, contratos, gates e reversões úteis, mas sua matriz de execução passa a ser lida segundo este documento e a atualização adicionada ao próprio plano.

