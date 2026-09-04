# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 4 de setembro de 2026

**Classe documental:** Canônico — estado corrente e retomada futura

**Situação:** estabilização funcional materializada pelo PR #260; as regras e provas posteriores aos hotfixes prevalecem sobre planos históricos. Production só muda após merge, migration e deployment verificados.

## Atualização de 04/09 — estabilização funcional e prova ponta a ponta

A retomada corrente é [`handoff/2026-09-04-estabilizacao-funcional-pr260.md`](handoff/2026-09-04-estabilizacao-funcional-pr260.md). O objetivo não é ampliar funcionalidades, mas fechar falhas de execução e transformar os cenários críticos em regressões permanentes.

Regras consolidadas nesta frente:

- inventariação exige encaminhamento prévio;
- bem derivado de Nota Fiscal não admite alteração isolada do número fiscal;
- encaminhamento posterior de bem permanente sincroniza Capital e Inventário, o tópico Encaminhado para Inventariação no Prontuário e o histórico na mesma gravação;
- metadados técnicos de versão são removidos dos payloads de verificação e impedidos de reaparecer;
- novo envio, reanálise, encaminhamento e inventariação ficam protegidos contra repetição de gesto durante a gravação;
- o padrão de certificação funcional passa a ser `ação → persistência → leitura direta → reload → releitura`.

O conjunto canônico passa a 46 migrations com `20260904040000_functional_reliability_inventory_sync.sql`. As jornadas de NF/Inventário, ciclo completo de Nota Fiscal e verificação mensal usam Supabase descartável real para provar persistência e releitura.

A fila R1–R9 descrita em 03/09 permanece como histórico arquitetural e não deve ser executada literalmente. Qualquer trabalho futuro deve partir do código, testes, banco e decisões posteriores à estabilização, preservando as soluções mais novas.


## Atualização de 03/09 — reauditoria source-first e novo plano remanescente

A porta de entrada executável corrente é [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md). A evidência que sustenta o escopo está em [`audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`](audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md).

Baseline reauditorado:

- `main`: `18150cc9ef7e15e2e777041fce541b847af517e1`;
- último commit funcional dentro desse estado: `75237c6ec5c22e8f7be9eb39fd21481f6d608010` (PR #249);
- Vercel Production observada: `dpl_HVkoBtt9WkM97XJZN7hYzB1aL8Tw`, `READY`, SHA `18150cc9ef7e15e2e777041fce541b847af517e1`;
- Supabase Production `scnryinorqeucbfkioxo`: `ACTIVE_HEALTHY`, 44 migrations.

A nova leitura dos códigos refinou a reconciliação anterior:

- **R1** vem antes do readiness porque `operational-write-performance.js` ainda injeta decisões de consistência e aplicação incremental;
- **R2A–R2C** preservam `RadarProductExtensionsReady`, `radar:application-services-ready` e ADR-052, removendo somente readiness/polling residual;
- **R3** preserva guard/no-op/planner existentes e trata IDs persistentes, intent, idempotência durável e uma única RPC v2 de save já com resultado remoto completo;
- **R4** unifica semântica de Pendências sem redesenhar a UI;
- **R5** reaproveita DataService/StatePort já existentes para ativar convergência autoritativa/incremental;
- **R6** é gate de equivalência sem diff obrigatório;
- **R7/R8** tratam diagnóstico causal e otimização comprovada;
- **R9** fecha a frente antes da reavaliação da ADR-051.

Sequência executável:

```text
R1 → R2A → R2B → R2C → R3 → R4 → R5 → R6 → R7 → R8 → R9
→ reavaliar ADR-051 em frente separada
```

Fora da fila: G0, PR1, PR2, PR4 antigo, PR6B, PR7B e PR9B.

## Checkpoint histórico pós-PR #237

> **Leitura histórica:** os blocos 0.x abaixo preservam a evolução PR #211/#214/#215 e não definem a fila atual. Quando houver linguagem temporal daquele período, prevalecem a atualização de 03/09 no topo e o handoff canônico de reconciliação.

Naquele checkpoint, a porta de entrada era [`handoff/2026-08-31-pr237-fechamento-visual-e-ci.md`](handoff/2026-08-31-pr237-fechamento-visual-e-ci.md). Hoje, a entrada canônica é a reconciliação de 03/09 indicada no topo deste arquivo.

O conjunto PR #218–#237 incorporou autoridade determinística dos fluxos críticos, preservação/canonização de contexto das Pendências, correções da Consulta Assessoria, abertura no mês corrente e a revisão visual do Prontuário/Pendências. As falhas de CI observadas na virada de agosto para setembro foram reclassificadas: quatro eram expectativas temporais de teste e uma era sincronização visual incremental real da bonificação da Assessoria.

Os blocos abaixo sobre PR #211/#214/#215 permanecem como histórico técnico necessário, mas não representam sozinhos o estado mais recente.

## 0. Hotfix publicado — PR #211

Naquele momento, o estado ainda não era “iniciar PR3.1”: o hotfix isolado precisava ser conciliado com o plano mestre. Essa reconciliação foi concluída em 03/09 e este bloco permanece apenas como histórico técnico:

- fechamento técnico daquele checkpoint: [`handoff/2026-08-30-pr215-fechamento-tecnico.md`](handoff/2026-08-30-pr215-fechamento-tecnico.md);
- encerramento histórico pós-PR #211: [`handoff/2026-08-30-pr211-publicacao-concluida.md`](handoff/2026-08-30-pr211-publicacao-concluida.md);
- plano específico: [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md);
- handoff histórico do Draft: [`handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](handoff/2026-08-28-pr211-hotfix-notas-fiscais.md);
- decisão arquitetural: [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- referências visuais: [`evidence/2026-08-28-pr211-referencias-visuais.md`](evidence/2026-08-28-pr211-referencias-visuais.md).

O PR #211 **não substitui o plano mestre**. Ele é um parêntese operacional necessário para corrigir uma inconsistência funcional descoberta depois das entregas anteriores.

Naquele momento, o roteiro de continuidade exigia:

```text
revalidar main
→ revalidar Supabase Production
→ revalidar Vercel Production
→ comparar o diff completo do PR #211 com o plano mestre
→ marcar tarefas futuras já atendidas/parcialmente atendidas/afetadas
→ atualizar documentação
→ só então iniciar PR3.1
```

Esse roteiro foi cumprido pela reconciliação de 03/09 e **não deve ser reexecutado literalmente**.

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

Naquele checkpoint, a homologação autenticada pela interface real ainda estava pendente. Essa anotação não representa mais o estado corrente: validações e refinamentos posteriores avançaram até o PR #249; o status atual está consolidado na atualização de 03/09.

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
2. [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md);
3. [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
4. [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
5. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
6. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
7. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) e [`DECISION_LOG.md`](DECISION_LOG.md);
8. [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md) quando a frente tocar dependências/tooling;
9. [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md), lido pela reconciliação de 03/09;
10. somente depois, os checkpoints PR #211/#215/#237 e demais históricos.

O Markdown reconciliado é a fonte operacional para busca, diff e execução. O Word de 26/08 permanece referência integral daquele plano, mas não incorpora decisões posteriores.

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
commits posteriores exclusivamente documentais podem ser descendentes desse SHA e gerar novos deployments sem alterar o runtime funcional. Revalidar o HEAD corrente antes de qualquer fase executável; a fila atual usa R1–R9.
```

O PR #199 foi documental. O PR #200 corrigiu o incidente `Incorreto + Pendência`. O PR #201 versionou o plano mestre. O PR #203 introduziu o requisito inicial de boleto para Educação Conectada. O PR #208 moveu o boleto para `Tipo de Gasto`, e o PR #209 corrigiu definitivamente a duplicidade: `boleto_internet` existe somente dentro de Notas Fiscais, sem categoria documental autônoma. O PR #202 concluiu PR1 com guard canônico de submit e refresh mínimo no núcleo. O PR #206 concluiu PR2 com matriz canônica de Consulta Assessoria, planner de efeitos e no-op real. Não reimplementar essas entregas.

## 4. Consolidação histórica até PR #215 e origem do plano

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


### Plano mestre no checkpoint pós-PR2 — histórico

- G0: concluído como baseline operacional do programa;
- PR1 / PR #202: integrado, publicado e validado em Production;
- PR2 / PR #206: integrado, publicado e validado em Production;
- merge funcional PR2: `2ec822820dd6e3d7415edf7de9c7913562b0981f`;
- Vercel Production: `dpl_41bzBJnL9baQX7N8sJe8mpY1ZD7H`, `READY`;
- Supabase Production: `ACTIVE_HEALTHY`, sem migration, backfill ou reparo;
- smoke autenticado comprovou no-op real com zero DataService/RPC/log e bloqueio das rotas agregadas de Assessoria;
- nenhuma outra rota genérica de escrita agregada foi encontrada na busca final;
- naquele checkpoint, PR3.1 em diante ainda não estavam integrados.

Naquele checkpoint, o plano ainda listava readiness, reparo de dados, idempotência, Pendências, escrita autoritativa e performance. A reconciliação de 03/09 reclassificou esse quadro:

- readiness sistêmico continua parcial em PR3.1–PR3.3;
- o PR4 antigo de reparo foi superado pelo estado atual dos dados e não deve ser executado;
- idempotência durável de NF continua pendente em PR5;
- Pendências já recebeu contexto/UX posteriores; resta a duplicidade semântica de PR6 e apenas gaps atuais comprovados de PR7A;
- escrita remota/autoritativa continua parcial em PR8A/PR8B;
- medição causal e otimização continuam em PR9A/PR9C;
- PR9B já foi atendido por caminho equivalente.

PR2, naquele momento, não executou migration, reparo de dados, deduplicação por conteúdo, idempotência de servidor nem redesign de Pendências.



## 5. Decisões source-first incorporadas

1. A duplicidade atual de NF não é atribuída ao fallback de `InvoiceService`; **R3** inventaria somente IDs persistentes de negócio, preserva o guard/no-op e elimina fallbacks fracos onde realmente persistem identidade.
2. **R1 precede R2** porque `operational-write-performance.js` ainda contém autoridade de consistência que precisa sair antes de performance/readiness poder degradar sem efeito funcional.
3. **R3** cria uma única RPC v2 de save com idempotência durável **e** resultado remoto completo; não haverá uma evolução v2 redundante posterior só para satisfazer o plano histórico.
4. **R4** unifica semântica de Pendências; textos editoriais e ordenações deliberadamente específicas podem permanecer por superfície.
5. **R5** reaproveita `DataService`, `mergePersistedResult()`, `incrementalStateEntities` e `StatePort.applyEntities()`; nova arquitetura genérica paralela só entra se RED demonstrar necessidade.
6. **R6** é gate de equivalência e pode encerrar sem diff.
7. `web-vitals` e `Server-Timing` não entram em **R7**; só podem ser avaliados depois do diagnóstico causal se houver lacuna comprovada. Nenhuma telemetria externa está autorizada.
8. **R8** define orçamento por hipótese somente depois do baseline/ruído de R7 e da metodologia estatística já vigente.

## 6. Exclusões e adiamentos deliberados

Não incluir nas frentes funcionais atualmente em execução:

- **hardening adicional de escrita direta em `registered_invoices`**: imutabilidade de `id`, validação server-side do vínculo de `verification_id` com escola + competência + programa e proteção/canonicalização de `source_context_key`;
- proteção de senhas vazadas no Supabase Auth;
- PR #195;
- deduplicação de NF por conteúdo.

O primeiro item é um **adiamento deliberado e explícito do responsável pelo produto**, registrado na ADR-051. A auditoria pós-publicação não encontrou corrupção atual em Production; encontrou uma lacuna latente de integridade caso um cliente autenticado tente contornar os serviços/RPCs e escrever diretamente na tabela. Por decisão de sequência, essa blindagem **não é gate do PR #211, da reconciliação documental nem de R1–R9**.

Ela somente deve ser retomada **depois do fechamento e rebaseline de R9**, em uma frente específica de segurança/integridade. Até lá, não antecipar esse hardening nem tratá-lo como correção funcional pendente.

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

## 8. Ordem vigente após a reauditoria source-first de 03/09

```text
R1 — retirar autoridade funcional dos wrappers de performance
→ R2A — contrato mínimo de readiness e loader tolerante
→ R2B — readiness crítico
→ R2C — readiness restrito/opcional e inventário final
→ R3 — IDs persistentes + intent/idempotência + contrato remoto v2 inativo
→ R4 — semântica única de Pendências
→ R5 — ativação autoritativa/incremental de save/remove de NF
→ R6 — gate de equivalência de Pendências
→ R7 — instrumentação causal do bootstrap
→ R8 — otimização por hipótese medida
→ R9 — fechamento funcional e rebaseline
→ reavaliar ADR-051
```

R1–R9 são fases do plano, não números de Pull Request do GitHub.

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

A próxima fase real é **R1 — retirar autoridade funcional dos wrappers de performance**.

Antes de tocar readiness:

1. escrever REDs que executem comandos representativos sem `RadarOperationalWritePerformance`;
2. mover resultado/commit autoritativo, entidades incrementais e refresh exemptions para serviços/DataService/StatePort ou contrato funcional explícito;
3. remover a dependência artificial de `prontuario-conditional-reconciler.js` em `RadarOperationalWritePerformance`;
4. preservar somente tracing/medição no módulo de performance;
5. provar que Consulta Assessoria, NF individual, Pendências e Inventário mantêm comportamento com o módulo ausente;
6. só então iniciar R2A.

## 11. Documentos históricos preservados

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md) — checkpoint anterior ao PR #200;
- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md) — primeiro plano executável, agora superado;
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx) — versão Word histórica;
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — estabilização anterior;
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md) — snapshot anterior.

Esses arquivos não devem ser apagados ou reescritos para parecer atuais.
