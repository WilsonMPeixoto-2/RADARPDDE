# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 30 de agosto de 2026

**Classe documental:** Canônico — estado corrente e retomada futura

**Situação:** conjunto PR #211 + #214 + #215 integrado e publicado; Production revalidada; homologação autenticada final pela interface ainda pendente; reconciliação documental/arquitetural em curso antes de PR3.1

## 0. Hotfix publicado — PR #211

O estado corrente ainda não é “iniciar PR3.1”. O hotfix isolado foi concluído e agora precisa ser conciliado com o plano mestre:

- fechamento técnico corrente: [`handoff/2026-08-30-pr215-fechamento-tecnico.md`](handoff/2026-08-30-pr215-fechamento-tecnico.md);
- encerramento histórico pós-PR #211: [`handoff/2026-08-30-pr211-publicacao-concluida.md`](handoff/2026-08-30-pr211-publicacao-concluida.md);
- plano específico: [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md);
- handoff histórico do Draft: [`handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](handoff/2026-08-28-pr211-hotfix-notas-fiscais.md);
- decisão arquitetural: [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- referências visuais: [`evidence/2026-08-28-pr211-referencias-visuais.md`](evidence/2026-08-28-pr211-referencias-visuais.md).

O PR #211 **não substitui o plano mestre**. Ele é um parêntese operacional necessário para corrigir uma inconsistência funcional descoberta depois das entregas anteriores.

Após o merge e os smokes disponíveis de Production, é obrigatório executar:

```text
revalidar main
→ revalidar Supabase Production
→ revalidar Vercel Production
→ comparar o diff completo do PR #211 com o plano mestre
→ marcar tarefas futuras já atendidas/parcialmente atendidas/afetadas
→ atualizar documentação
→ só então iniciar PR3.1
```

O hardening foi validado no SHA funcional `530ca6cb62c385ca7ca35f30e82a723e1afed3f6` e integrado à `main` pelo merge `aa82ab4e359f62259df33842fb794aa1e654c30c`. Ele bloqueia alteração comum de Assessoria com Pendência ativa, exige tentativa real e imutável na reanálise, aplica patches mínimos nas RPCs críticas, impede reaproveitamento patrimonial indevido, mantém `a_identificar` existente fora do editor comum e torna acessível a Pendência fiscal agregada real preservada.

No SHA `530ca6c` passaram: **800/800 unitários**, **7/7 integração**, Validar RADAR, Playwright completo, Supabase readiness, migration-smoke, Supabase local/Auth/RLS/pgTAP, migrations em PostgreSQL limpo, backup/restauração, perfis/viewports, CodeQL, dependências, snapshot, Ajv, Excel e Vercel Preview. Um job duplicado de Supabase da homologação agregada falhou inicialmente antes dos testes porque a porta local `54322` estava ocupada; sua reexecução passou integralmente, confirmando falha transitória do runner. O Preview READY é `https://radarpdde-hhubte7ci-wilson-m-peixotos-projects.vercel.app`.

O Lighthouse móvel permaneceu vermelho. Na execução de `main`, desktop passou com performance **79%**, acessibilidade **100%** e LCP **3,45 s** para limite de **3,50 s**; mobile registrou performance **61%**, acessibilidade **94%** e LCP **16,04 s** para limite de **15 s**. Mobile continua dívida expressamente não bloqueante deste hotfix desktop. A nova reconferência visual manual também foi adiada sem bloquear o merge.

Production foi publicada e revalidada:

- Supabase Production `scnryinorqeucbfkioxo`: 44 migrations, incluindo `20260828023000_invoice_document_analysis_pendency` e `20260830223000_payload_row_version_boundary`;
- limpeza pós-apply: 12 despesas/NFs e três Pendências técnicas removidas; 15 logs e 16 `a_identificar` legítimos preservados;
- Vercel Production: `dpl_2ApguJZe79buX9xD1od45RDTKYDR`, `READY`, manifesto no merge `aa82ab4e`;
- monitor de site/assets/RLS anônima/Edge Functions: aprovado;
- homologação do Supabase Production e readiness: aprovados;
- monitor dedicado de cinco perfis: não executado porque o provisionamento protegido continua desativado; nenhuma conta pessoal foi reutilizada.

## 0.1 Fechamento visual pós-PR #211 — PR #214

A inspeção visual final reproduzida em viewport desktop de 1280 px identificou um overflow horizontal real na grade individual de **Notas Fiscais / Consulta Assessoria**. Os mínimos das quatro colunas ultrapassavam a largura útil do Prontuário e podiam cortar/deslocar especialmente o controle **Enviada à Assessoria**.

A correção foi isolada no PR #214 e integrada à `main` no merge `cc842af7b7bc6341dab68aa55a533a2017923bcf`.

Resultado:

- grade canônica de quatro áreas preservada;
- mínimos e gaps compactados somente entre 901 e 1440 px;
- seletor técnico passa a respeitar a largura da própria coluna;
- texto de envio à Assessoria admite quebra controlada;
- E2E passou a medir `scrollWidth <= clientWidth` nos painéis de Notas Fiscais e Consulta Assessoria e a verificar que o controle de envio permanece dentro do painel;
- Playwright completo, Validar RADAR, perfis/viewports, CodeQL, migrations, pgTAP, backup/restauração, prontidão e demais gates funcionais passaram no PR #214;
- Lighthouse móvel permaneceu como dívida já conhecida e não bloqueante;
- Vercel Production publicou o merge `cc842af7` no deployment `dpl_33e4bM4z5YrbP5YGhfsr88pgwDPX`, estado `READY`;
- monitor de Production e homologação do Supabase Production passaram após a publicação.

Com isso, a antiga anotação de “reconferência visual posterior adiada” está superada: a inspeção foi executada, encontrou um defeito, o defeito foi corrigido e a regressão passou a ser protegida automaticamente.

## 0.2 Correção pós-PR #211 — PR #215

O teste manual em Production identificou falha real ao marcar **Incorreto** tanto na análise técnica individual de Nota Fiscal quanto na análise individual de Consulta Assessoria.

A causa não estava na regra de negócio nem no layout. A fronteira canônico → estado legado → adapter duplicava concorrência otimista dentro do JSON de negócio:

```text
row_version = valor canônico atual
payload.rowVersion = valor de compatibilidade potencialmente defasado
```

As RPCs atômicas interpretavam essa diferença técnica como alteração indevida da despesa.

O PR #215 corrigiu a fronteira sem relaxar identidade ou dados de negócio:

- `legacy-state-adapter.js` remove `rowVersion` e `row_version` dos payloads;
- `row_version` permanece top-level/canônico;
- a migration `20260830223000_payload_row_version_boundary` limpou payloads já persistidos;
- `save_invoice_document_with_pendency` e `save_service_advisory_with_pendency` ignoram apenas essas duas chaves técnicas nas comparações de payload;
- Production ficou com **44 migrations** e zero contaminação de versão nos payloads auditados;
- smokes transacionais contra dados e RPCs reais de Production comprovaram os dois fluxos que haviam falhado e executaram rollback ao final;
- merge funcional: `19ba20cb7b8a8415070d4a8711a8af0eb23e1fa7`;
- redeploy operacional de `main`: `24e1934541b92e4399798556c05fd164c9c43801`;
- Vercel Production: `dpl_TXwRPK2Sv72u5HtQVF3Z7ejJby3k`, `READY`.

A homologação autenticada pela interface real após esse deployment ainda deve ser executada quando o ambiente Work/Cloud Browser estiver disponível.

## 0.3 Aprendizado estrutural pós-PR #215

A revisão adversarial mostrou que uma parte relevante da recorrência de defeitos vinha da **fragmentação da autoridade funcional**: o mesmo ciclo pode atravessar `app.js`, serviços, extensões carregadas dinamicamente, wrappers de diagnóstico e RPCs.

No caso de Consulta Assessoria, a auditoria inicialmente aparentou encontrar ausência do novo envio individual. A investigação completa mostrou que a implementação já existia em `service-advisory-corrective-submission.js`, carregada depois de `service-advisory-pendency.js` pelo bootstrap de extensões. A duplicação iniciada durante a investigação foi removida antes do merge.

A ADR-052 passa a exigir:

- autoridade explícita por operação crítica;
- ordem de bootstrap tratada como contrato;
- E2E que comprove a instalação real das extensões críticas;
- regressão que falhe se a responsabilidade for duplicada ou desconectada;
- prova da composição, não apenas das camadas isoladas.

Essa regra existe para impedir que PRs futuros repitam a sequência “corrigir → criar rota paralela → perder a correção em outra superfície → corrigir novamente”.

## 1. Porta de entrada atual

Ler nesta ordem:

1. [`../AGENTS.md`](../AGENTS.md);
2. [`handoff/2026-08-30-pr211-publicacao-concluida.md`](handoff/2026-08-30-pr211-publicacao-concluida.md);
3. [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
4. [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md);
5. [`evidence/2026-08-29-pr211-classificacao-dados-legados.md`](evidence/2026-08-29-pr211-classificacao-dados-legados.md);
6. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
7. somente depois, handoffs de execução do PR #211 e o plano mestre de 26/08.

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
- PR #211: análise técnica, Pendência e ciclo de regularização individualizados por `registered_invoice_id`; migration aplicada e Production validada;
- PR #214: composição desktop dos painéis individualizados corrigida e protegida contra overflow;
- PR #215: fronteira `row_version`/payload corrigida, migration `20260830223000` aplicada e smokes transacionais reais aprovados;
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

## 6. Exclusões e adiamentos deliberados

Não incluir nas frentes funcionais atualmente em execução:

- **hardening adicional de escrita direta em `registered_invoices`**: imutabilidade de `id`, validação server-side do vínculo de `verification_id` com escola + competência + programa e proteção/canonicalização de `source_context_key`;
- proteção de senhas vazadas no Supabase Auth;
- PR #195;
- deduplicação de NF por conteúdo.

O primeiro item é um **adiamento deliberado e explícito do responsável pelo produto**, registrado na ADR-051. A auditoria pós-publicação não encontrou corrupção atual em Production; encontrou uma lacuna latente de integridade caso um cliente autenticado tente contornar os serviços/RPCs e escrever diretamente na tabela. Por decisão de sequência, essa blindagem **não é gate do PR #211, da reconciliação documental nem dos PRs restantes de correção funcional**.

Ela somente deve ser retomada **depois que todas as implementações previstas nos planos de correção de funcionalidades estiverem concluídas e validadas**, em uma frente específica de segurança/integridade. Até lá, não antecipar esse hardening nem tratá-lo como correção funcional pendente.

Não transformar qualquer exclusão ou adiamento em dependência, gate oculto ou hardening antecipado. Se surgir necessidade inevitável antes do gatilho definido, parar e solicitar nova decisão do responsável pelo produto.

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

Concluir a **reconciliação pós-hotfix PR #211/#214/#215**, validar a nova proteção arquitetural da ADR-052 e executar a homologação autenticada final antes de iniciar PR3.1.

Sequência imediata:

1. concluir os gates da proteção arquitetural/contrato executável da ADR-052;
2. executar a homologação autenticada final da interface em Production quando o Work estiver disponível;
3. comparar o conjunto integrado PR #211/#214/#215 com cada tarefa do plano mestre;
4. classificar tarefas como não afetadas, parcialmente atendidas, atendidas ou alteradas;
5. atualizar o plano mestre e o handoff de retomada sem apagar seu histórico;
6. confirmar a ordem restante;
7. somente então iniciar PR3.1 com gate próprio.

A Consulta Assessoria permanece individual por NF de serviço. O lookup usa `registered_invoice_id`, a abertura continua atômica e o serviço canônico bloqueia qualquer alteração comum enquanto a própria NF possui Pendência ativa. Não substituir esse desenho por lookup genérico ou fluxo paralelo em `app.js`.

A classificação canônica de dados está em `evidence/2026-08-29-pr211-classificacao-dados-legados.md`.

O núcleo do hotfix já foi publicado. O fechamento integral exige reconciliação documental/arquitetural e homologação autenticada final; depois disso o plano mestre pode retomar em PR3.1.

## 11. Documentos históricos preservados

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md) — checkpoint anterior ao PR #200;
- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md) — primeiro plano executável, agora superado;
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx) — versão Word histórica;
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — estabilização anterior;
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md) — snapshot anterior.

Esses arquivos não devem ser apagados ou reescritos para parecer atuais.
