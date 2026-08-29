# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 29 de agosto de 2026

**Classe documental:** Canônico — estado corrente e retomada futura

**Situação:** PR #211 em Draft na branch `hotfix/individualizar-analise-notas-fiscais`; hotfix de individualização de Notas Fiscais temporariamente prioritário; Production permanece no estado anterior ao PR #211; o plano mestre continua vigente e será retomado após reconciliação pós-hotfix

## 0. Hotfix ativo — PR #211

O estado corrente não é mais “iniciar PR3.1”. Antes disso existe um hotfix isolado em andamento:

- plano específico: [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md);
- handoff corrente: [`handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](handoff/2026-08-28-pr211-hotfix-notas-fiscais.md);
- decisão arquitetural: [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- referências visuais: [`evidence/2026-08-28-pr211-referencias-visuais.md`](evidence/2026-08-28-pr211-referencias-visuais.md).

O PR #211 **não substitui o plano mestre**. Ele é um parêntese operacional necessário para corrigir uma inconsistência funcional descoberta depois das entregas anteriores.

Após o merge e o smoke de Production, é obrigatório executar:

```text
revalidar main
→ revalidar Supabase Production
→ revalidar Vercel Production
→ comparar o diff completo do PR #211 com o plano mestre
→ marcar tarefas futuras já atendidas/parcialmente atendidas/afetadas
→ atualizar documentação
→ só então iniciar PR3.1
```

Os gates do SHA `ff8453c8fd0c4e5707d656b4520051962a48df96` comprovaram a estabilidade do núcleo anterior, mas **não autorizam merge do HEAD atual**. Em 29/08 houve nova decisão de dados: 16 `a_identificar` legítimos de Controladores devem ser preservados como Registro legado; 4 `a_identificar` e outras 8 despesas/NFs dos cenários de teste, além de três Pendências fiscais genéricas, foram comprovados por autoria como fixtures da conta técnica. A migration foi alterada para limpeza fail-closed dessas fixtures; o antigo reparo do Boleto 1234 foi formalmente superado. O renderer também foi ajustado para não inventar história nem permitir edição comum dos 16 legados. O PR permanece **Draft** até a nova rodada de gates do HEAD corrente. Production continua intocada.

## 1. Porta de entrada atual

Ler nesta ordem:

1. [`../AGENTS.md`](../AGENTS.md);
2. [`handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](handoff/2026-08-28-pr211-hotfix-notas-fiscais.md);
3. [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md);
4. [`evidence/2026-08-28-pr211-referencias-visuais.md`](evidence/2026-08-28-pr211-referencias-visuais.md);
5. [`handoff/2026-08-27-pr2-service-advisory-noop.md`](handoff/2026-08-27-pr2-service-advisory-noop.md);
6. [`handoff/2026-08-27-pr1-invoice-submit-guard.md`](handoff/2026-08-27-pr1-invoice-submit-guard.md);
7. [`handoff/2026-08-27-hotfix-boleto-internet.md`](handoff/2026-08-27-hotfix-boleto-internet.md);
8. [`handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md);
9. [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
10. [`reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx);
11. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) e a documentação específica da entrega.

O Markdown é a fonte operacional para busca, diff e execução. O Word é a versão integral para leitura e aprovação. O arquivo `.sha256` ao lado do Word permite verificar sua integridade.

## 2. Fonte de verdade

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. schema, migrations, Auth, RLS, RPCs, Edge Functions e dados efetivos do Supabase;
3. deployment efetivamente publicado na Vercel e seu manifesto;
4. decisões de negócio vigentes;
5. testes e evidências reproduzíveis que representam o contrato atual;
6. documentação canônica;
7. auditorias, planos e handoffs históricos.

Nenhum documento antigo prevalece sobre código e ambientes atuais. Valores voláteis devem ser revalidados antes de código, migration, reparo ou publicação.

## 3. Baseline de origem do plano

```text
Baseline funcional publicado pelo PR2 / PR #206:
2ec822820dd6e3d7415edf7de9c7913562b0981f

Origem:
merge do PR #206, contendo PR1 e a hotfix do PR #203

Deployment Production desse baseline:
dpl_41bzBJnL9baQX7N8sJe8mpY1ZD7H / 2ec822820dd6e3d7415edf7de9c7913562b0981f

Observação:
commits posteriores exclusivamente documentais podem ser descendentes desse SHA e gerar novos deployments sem alterar o runtime funcional. Revalidar o HEAD corrente antes de iniciar PR3.1.
```

O PR #199 foi documental. O PR #200 corrigiu o incidente `Incorreto + Pendência`. O PR #201 versionou o plano mestre. O PR #203 introduziu o requisito inicial de boleto para Educação Conectada. O PR #208 moveu o boleto para `Tipo de Gasto`, e o PR #209 corrigiu definitivamente a duplicidade: `boleto_internet` existe somente dentro de Notas Fiscais, sem categoria documental autônoma. O PR #202 concluiu PR1 com guard canônico de submit e refresh mínimo no núcleo. O PR #206 concluiu PR2 com matriz canônica de Consulta Assessoria, planner de efeitos e no-op real. Não reimplementar essas entregas.

## 4. Estado das correções

### Integrado e publicado

- PR #199: plano inicial versionado; nenhuma correção funcional;
- PR #200: operação `Incorreto + Pendência` centralizada e protegida contra falha posterior de extensão opcional;
- PR #201: plano mestre e rota de continuidade versionados;
- PR #203: requisito inicial de boleto para Educação Conectada integrado e publicado;
- PR #202: PR1 integrado e publicado; guard canônico de Nota Fiscal/Despesa e refresh mínimo no núcleo;
- PR #206: PR2 integrado e publicado; regra canônica de Consulta Assessoria, planner de efeitos, no-op real e fechamento das rotas agregadas;
- PR #208: `boleto_internet` introduzido como tipo de gasto de Notas Fiscais, exclusivo de Educação Conectada, com proteção server-side;
- PR #209: duplicidade documental removida; `boletoInternet` legado deixou de participar de avaliação, consolidação, retificação e novas Pendências;
- auditorias independentes: consolidadas no plano de 26/08;
- cinco revisões finais: incorporadas ao plano canônico.

### Boleto de Internet — contrato vigente após PR #209

- PR #203 introduziu originalmente `boletoInternet` como categoria documental de Educação Conectada;
- PR #208 introduziu o tipo de gasto relacional `boleto_internet` em Notas Fiscais e a proteção de banco que o restringe a escolas com Educação Conectada ativa;
- PR #209 removeu a representação documental duplicada;
- contrato atual: **Boleto de pagamento de Internet existe somente como opção de `Tipo de Gasto` dentro de Notas Fiscais**;
- não existe linha, subitem, bonificação, análise técnica ou Pendência independente `boletoInternet`;
- bonificação, análise técnica e Pendência são as próprias de `notaFiscal`;
- `boleto_internet` não cria bem patrimonial e não participa de Consulta Assessoria;
- somente despesas de tipo `servico` participam da matriz de Assessoria;
- chaves históricas `boletoInternet` já gravadas permanecem preservadas no JSON para auditabilidade, mas são ignoradas pelo fluxo ativo e não bloqueiam consolidação;
- nenhuma Pendência histórica `boletoInternet` está ativa em Production no fechamento do PR #209;
- Production funcional do PR #209: merge `4ce328c507ecbf3dea09446ca377d1f4f3535fec`, Vercel `dpl_22c8wzDnR1dkzGfycfWJxfQHutXw`, `READY`;
- inspeção autenticada em Production confirmou um gasto real `boleto_internet` exibido apenas dentro de Notas Fiscais, sem bem e sem campos de Assessoria;
- Supabase Production permanece `ACTIVE_HEALTHY` com 42 migrations; PR #209 não adicionou migration.


### Plano mestre em execução — PR2 concluído

- G0: concluído como baseline operacional do programa;
- PR1 / PR #202: integrado, publicado e validado em Production;
- PR2 / PR #206: integrado, publicado e validado em Production;
- merge funcional PR2: `2ec822820dd6e3d7415edf7de9c7913562b0981f`;
- Vercel Production: `dpl_41bzBJnL9baQX7N8sJe8mpY1ZD7H`, `READY`;
- Supabase Production: `ACTIVE_HEALTHY`, sem migration, backfill ou reparo;
- smoke autenticado comprovou no-op real com zero DataService/RPC/log e bloqueio das rotas agregadas de Assessoria;
- nenhuma outra rota genérica de escrita agregada foi encontrada na busca final;
- PR3.1 em diante: ainda não integrados.

Itens ainda não integrados do plano incluem:

- readiness sistêmico em PR3.1, PR3.2 e PR3.3;
- reparo condicionado dos dados antigos;
- idempotência real de NF;
- contrato único, contexto e UX de Pendências;
- escrita remota totalmente autoritativa e incremental;
- medição e otimização causal do bootstrap.

PR2 não executou migration, reparo de dados, deduplicação por conteúdo, idempotência de servidor nem redesign de Pendências.



## 5. Decisões finais incorporadas

1. A duplicidade atual de NF não é atribuída ao fallback de `InvoiceService`. PR5 fará o inventário de produtores persistentes e eliminará fallbacks dependentes exclusivamente de `Date.now()`, incluindo o caso confirmado de `DirectoryService`.
2. `web-vitals` e `Server-Timing` não entram no PR9A. Só poderão ser avaliados depois dele para responder a uma lacuna diagnóstica comprovada. Nenhuma telemetria externa está autorizada.
3. PR3 é executado como PR3.1, PR3.2 e PR3.3, com gates próprios.
4. PR8 é executado como dois PRs reais: PR8A e PR8B.
5. PR9C define orçamento por hipótese somente depois do baseline e do ruído medidos em PR9A/PR9B; não há meta percentual universal antecipada.

## 6. Exclusões definitivas

Não incluir nesta frente:

- antigo item 20 da auditoria, sobre autoridade server-side mais ampla;
- proteção de senhas vazadas no Supabase Auth;
- PR #195;
- deduplicação de NF por conteúdo.

Não transformar qualquer exclusão em dependência, gate oculto ou hardening. Se surgir necessidade inevitável, parar e solicitar nova decisão do responsável pelo produto.

## 7. Invariantes de negócio

- Pendências continuam transversais a todas as competências.
- Pendência, análise técnica e bonificação são dimensões distintas.
- `Sim + Incorreto + pendência` continua válido.
- Novo envio leva à reanálise e não resolve automaticamente.
- Despesa `A identificar` não altera a bonificação agregada, mas após a decisão do PR #211 nasce tecnicamente `Incorreto` e com Pendência individual obrigatória.
- Pendência ativa e `Não analisado`, isoladamente, não bloqueiam consolidação.
- Sem NF de serviço, Consulta Assessoria converge para `Não se aplica`.
- Duas NFs de conteúdo igual podem ser legítimas.
- Abrir detalhe de Pendência não muda a competência global.
- Abrir o Prontuário a partir de uma Pendência pode mudar a competência explicitamente.
- `Ver detalhes` permanece durante este programa.

## 8. Ordem aprovada

```text
G0
→ PR1
→ PR2
→ PR3.1
→ PR3.2
→ PR3.3
→ PR4
→ PR5
→ PR6
→ PR6B
→ PR7A
→ PR7B
→ PR8A
→ PR8B
→ PR9A
→ PR9B
→ PR9C
→ encerramento
```

Gates de sequência:

- PR4 exige PR2 publicado e validado, seguido de preflight fresco;
- PR3 só termina depois de PR3.3;
- PR8A depende de PR5;
- PR8B depende de PR8A publicado e validado;
- PR9C depende de causa e orçamento registrados após PR9A/PR9B;
- nenhuma entrega posterior começa antes do gate da anterior.

## 9. Método de execução

Cada entrega usa o ciclo:

```text
revalidar premissa
→ provar o defeito com RED
→ implementar a menor correção suficiente
→ buscar consumidores e regras equivalentes fora do diff esperado
→ executar revisão adversarial independente
→ provar gates proporcionais
→ publicar e executar smoke
→ registrar evidência e reversão
→ parar antes da próxima entrega
```

Planos são hipóteses técnicas, não autoridade superior ao código e aos ambientes. O executor deve registrar divergências; não adaptar silenciosamente o produto ao documento.

## 10. Próxima ação

Concluir **PR #211 — hotfix de individualização de Notas Fiscais**.

Sequência imediata:

1. executar novamente todos os gates sobre o HEAD que contém a limpeza fail-closed e a projeção dos legados;
2. corrigir qualquer falha funcional, SQL, E2E, Auth/RLS, segurança ou backup;
3. repetir o preflight somente leitura de autoria e contexto imediatamente antes de eventual migration;
4. confirmar preservação dos 16 registros legítimos e elegibilidade exata das 12 despesas/NFs + três Pendências de teste;
5. confirmar `main`, Preview e mergeabilidade;
6. somente então avaliar retirada de Draft e pedir/usar autorização final de merge.

A Consulta Assessoria permanece individual por NF de serviço. A auditoria externa que identificou o bloqueio cruzado foi útil, mas o HEAD atual já usa uma implementação mais robusta: lookup por `registered_invoice_id` e confirmação atômica via `service-advisory-pendency.js`. Não substituir essa integração pelo antigo lookup genérico.

A classificação canônica de dados está em `evidence/2026-08-29-pr211-classificacao-dados-legados.md`.

Depois da publicação do hotfix, fazer reconciliação pós-PR #211 e somente então retomar PR3.1.

## 11. Documentos históricos preservados

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md) — checkpoint anterior ao PR #200;
- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md) — primeiro plano executável, agora superado;
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx) — versão Word histórica;
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — estabilização anterior;
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md) — snapshot anterior.

Esses arquivos não devem ser apagados ou reescritos para parecer atuais.
