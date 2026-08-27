# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 27 de agosto de 2026

**Classe documental:** Canônico — estado corrente e retomada futura

**Situação:** `main` e Production permanecem no pacote documental do PR #201; PR1 está pausado; a hotfix prioritária do boleto de Internet está em validação final no PR #203 e ainda não foi publicada

## 1. Porta de entrada atual

Ler nesta ordem:

1. [`../AGENTS.md`](../AGENTS.md);
2. [`handoff/2026-08-27-hotfix-boleto-internet.md`](handoff/2026-08-27-hotfix-boleto-internet.md);
3. [`handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md);
4. [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
5. [`reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx);
6. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) e a documentação específica da entrega.

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
GitHub main confirmado durante a revisão:
2db2a5102d877422d068141a59f5ea340a2ebdc0

Origem:
merge documental do PR #201

Vercel Production confirmado durante a revisão:
dpl_AtHwooDcYgFaiUykT8Ja8rLRoZKT / 2db2a5102d877422d068141a59f5ea340a2ebdc0
```

O PR #199 foi documental. O PR #200 corrigiu o incidente `Incorreto + Pendência`. O PR #201 versionou o plano mestre e é o baseline atual de `main` e Production. Não reimplementar essas entregas.

O PR #202 iniciou G0/PR1, mas permanece fora de `main` e foi pausado para a hotfix prioritária do PR #203. Ao retomar PR1, reconciliar o head remoto e qualquer trabalho local antes de continuar; não presumir que checks de um SHA anterior cobrem um novo head.

## 4. Estado das correções

### Integrado e publicado

- PR #199: plano inicial versionado; nenhuma correção funcional;
- PR #200: operação `Incorreto + Pendência` centralizada e protegida contra falha posterior de extensão opcional;
- PR #201: plano mestre e rota de continuidade versionados;
- auditorias independentes: consolidadas no plano de 26/08;
- cinco revisões finais: incorporadas ao plano canônico.

### Hotfix prioritária em andamento — PR #203

- categoria `boletoInternet` exclusiva de Educação Conectada;
- seis documentos anteriores preservados para os demais programas;
- escrita rejeitada no serviço fora de `CONECTADA`, inclusive por retificação direta e abertura de Pendência;
- `Incorreto` usa a operação documental atômica existente;
- nenhuma Nota Fiscal, bem ou Consulta Assessoria é criada pelo boleto;
- 50 consolidações legadas conectadas sem a chave permanecem válidas por projeção `Não se aplica / Correto`, sem backfill nem escrita sintética;
- 5 registros conectados ainda não consolidados precisarão avaliar o boleto explicitamente quando a hotfix for publicada;
- Excel SME permanece com 27 colunas;
- nenhuma migration, backfill, escrita em Supabase Production ou publicação funcional foi executada nesta branch.

O código revisado foi versionado no commit remoto `c76a7ba`; o head final do PR deve ser confirmado depois da publicação da documentação e todos os checks obrigatórios precisam corresponder a esse mesmo SHA.

### Plano mestre pausado

- G0: parcialmente comprovado e documentado durante o PR #202;
- PR1: implementação candidata fora de `main`, pausada e ainda não publicada;
- PR2 em diante: não iniciados.

Itens ainda não integrados do plano incluem:

- contenção do submit repetido e refresh mínimo;
- regra única de Consulta Assessoria e no-op semântico;
- readiness sistêmico;
- reparo condicionado dos dados antigos;
- idempotência real de NF;
- contrato único, contexto e UX de Pendências;
- escrita remota totalmente autoritativa e incremental;
- medição e otimização causal do bootstrap.

Nenhuma migration, reparo de dados ou alteração de Production descrita nessas etapas foi executada.

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
- Despesa `A identificar` não fabrica conclusão de bonificação ou análise.
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

Fechar o PR #203 sem misturá-lo ao plano mestre:

1. publicar o novo head da branch `hotfix/boleto-internet-documento`;
2. exigir Playwright, gates remotos e Preview Vercel no mesmo SHA final;
3. confirmar que o E2E cobre a jornada nova e a projeção legada sem materialização;
4. classificar o Lighthouse conforme a governança vigente, sem afrouxar limiares nem repetir até ficar verde;
5. obter autorização explícita antes do merge;
6. depois do merge, confirmar o SHA de Production, executar smoke e atualizar este documento de candidato para publicado;
7. retornar ao PR #202/PR1, reconciliar sua branch e concluir seus gates antes de iniciar PR2.

O parêntese da hotfix não muda a ordem aprovada do plano e não autoriza migration, backfill ou reparo de dados.

## 11. Documentos históricos preservados

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md) — checkpoint anterior ao PR #200;
- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md) — primeiro plano executável, agora superado;
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx) — versão Word histórica;
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — estabilização anterior;
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md) — snapshot anterior.

Esses arquivos não devem ser apagados ou reescritos para parecer atuais.
