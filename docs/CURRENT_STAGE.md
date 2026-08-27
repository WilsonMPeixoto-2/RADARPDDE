# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 27 de agosto de 2026

**Classe documental:** Canônico — estado corrente e retomada futura

**Situação:** PR #203 integrado à `main` e publicado em Production; hotfix do boleto de Internet encerrada; PR1 permanece pausado e é a próxima frente obrigatória

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
GitHub main após encerramento da hotfix:
f90cdf83897b4c954b7b6bf74b497798006e11f9

Origem:
merge do PR #203

Vercel Production após encerramento da hotfix:
dpl_EkZDvUjMjbcopE7r9pyxbtnXnCHa / f90cdf83897b4c954b7b6bf74b497798006e11f9
```

O PR #199 foi documental. O PR #200 corrigiu o incidente `Incorreto + Pendência`. O PR #201 versionou o plano mestre. O PR #203 adicionou a categoria `boletoInternet` exclusivamente à Educação Conectada e é o baseline funcional atual de `main` e Production. Não reimplementar essas entregas.

O PR #202 iniciou G0/PR1, mas permanece fora de `main` e foi pausado para a hotfix prioritária do PR #203. Ao retomar PR1, reconciliar o head remoto e qualquer trabalho local antes de continuar; não presumir que checks de um SHA anterior cobrem um novo head.

## 4. Estado das correções

### Integrado e publicado

- PR #199: plano inicial versionado; nenhuma correção funcional;
- PR #200: operação `Incorreto + Pendência` centralizada e protegida contra falha posterior de extensão opcional;
- PR #201: plano mestre e rota de continuidade versionados;
- PR #203: `boletoInternet` exclusivo de Educação Conectada integrado e publicado, sem migration ou backfill;
- auditorias independentes: consolidadas no plano de 26/08;
- cinco revisões finais: incorporadas ao plano canônico.

### Hotfix prioritária concluída — PR #203

- PR #203 mergeado em `main` no commit `f90cdf83897b4c954b7b6bf74b497798006e11f9`;
- Vercel Production `dpl_EkZDvUjMjbcopE7r9pyxbtnXnCHa`, `READY`, no mesmo SHA da `main`;
- categoria `boletoInternet` exclusiva de Educação Conectada;
- seis documentos anteriores preservados para os demais programas;
- escrita rejeitada fora de `CONECTADA`, inclusive bonificação, análise, retificação e abertura de Pendência;
- `Incorreto` usa a operação documental atômica vigente;
- nenhuma Nota Fiscal, bem ou Consulta Assessoria é criada pelo boleto;
- 50 consolidações legadas conectadas sem a chave permanecem válidas por projeção `Não se aplica / Correto`, sem backfill nem escrita sintética;
- 5 registros conectados ainda não consolidados permanecem sem a chave e deverão avaliar o boleto explicitamente;
- Excel SME permanece com 27 colunas;
- Supabase Production permaneceu `ACTIVE_HEALTHY`, sem migration nova e com contagens inalteradas: 55 verificações CONECTADA, 50 consolidadas sem boleto, 5 não consolidadas sem boleto e 0 com boleto materializado;
- artefato servido em Production respondeu HTTP 200, declarou `deploymentTarget:"production"` e foi conferido com a regra `programIds: ['CONECTADA']` e a projeção legada;
- Playwright remoto e demais gates funcionais do head final foram aprovados;
- Lighthouse mobile permaneceu vermelho por LCP limítrofe (~15,05–15,21 s para teto de 15 s), formalmente classificado e aceito como exceção não bloqueante desta hotfix; desktop aprovado.

Não houve alteração de limiar, rerun oportunístico até verde, otimização global de performance, migration ou backfill.

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

Retomar o plano mestre pelo PR #202/PR1:

1. reconciliar a branch do PR #202 com a `main` atual `f90cdf83897b4c954b7b6bf74b497798006e11f9`, preservando integralmente o hotfix do PR #203;
2. corrigir o defeito já comprovado no guard de submit público de Nota Fiscal, hoje contornado por chamada direta a `window.salvarDadosNota()`;
3. manter a política correta de refresh mínimo já implementada no `InvoiceService`;
4. repetir os testes focados e os gates proporcionais no novo head efetivo;
5. atualizar a narrativa do PR #202 para o SHA realmente validado;
6. obter autorização antes do merge;
7. somente depois de PR1 publicado e validado iniciar PR2.

O parêntese da hotfix está encerrado e não altera a ordem aprovada do plano.

## 11. Documentos históricos preservados

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md) — checkpoint anterior ao PR #200;
- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md) — primeiro plano executável, agora superado;
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx) — versão Word histórica;
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — estabilização anterior;
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md) — snapshot anterior.

Esses arquivos não devem ser apagados ou reescritos para parecer atuais.
