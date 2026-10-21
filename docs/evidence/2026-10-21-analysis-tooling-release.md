# Continuação de tooling e documentação — 21/10/2026

Classe: evidência datada para continuidade; não é autoridade funcional nem handoff corrente.
Checkpoint inicial desta evidência: main `6a6dab30e92eb9ae12d9d84b153b68618192fb74`.
Este arquivo fica em branch documental separada, vinculada pelos PRs, para preservar
resultados posteriores à certificação sem disparar novamente a suíte de produto
por uma atualização textual. `docs/CURRENT_STAGE.md` da main continua sendo o estado mutável.

## Escopo e entregas concluídas

O pedido foi continuar atualizações de pacotes e correção documental após
reconciliar as alterações realizadas pelo celular. Não houve reabertura das
frentes funcionais, Realtime, performance, Auth/RLS ou permissões.

| PR | Candidato certificado | Merge | Resultado |
| --- | --- | --- | --- |
| [#464](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/464) | `daccec00f795d83f68fd8f57c1e7aeeb84529706` | `855fa0d71322dd133dd9f41ddbf36daba10d513c` | Axe 4.14.0; 19/19 workflows |
| [#468](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/468) | `079cec9461beb9e45567101a31132f2f0b1470e2` | `ec6f76ad709d2e7ab45c95ec81c9f09e54040fca` | Reconciliação documental; 5/5 workflows |
| [#469](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/469) | `05bb099ef20809b41f233f38bd483c593820fd09` | `8f8e5f996c117bbb2925d5b0cfbcdaafbb1e8b7c` | dependency-cruiser 18.7.0; 19/19 após uma repetição de job |
| [#470](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/470) | `b3eaf7006c66f87add72f0e3629e89196ba2ae65` | `6a6dab30e92eb9ae12d9d84b153b68618192fb74` | ESLint 10.13.0; 19/19 workflows |

Os totais são workflows por candidato; não são testes únicos somados.
Os PRs #465 e #458 foram encerrados como propostas substituídas, respectivamente
por #464 e #469. Não reaplicar atualizações antigas de Playwright/Axe ou instalar
dependency-cruiser 18.6.0 como se fossem pendências atuais.

## Certificação proporcional e diagnósticos preservados

- Linux, Node 24.19.0 e npm 11.9.0, instalação `npm ci` limpa.
- dependency-cruiser: arquitetura antes/depois **191 módulos, 276 dependências,
  zero violações**; quatro regras mantidas. Lock limitado à ferramenta, ignore
  7.0.12 e deduplicação de acorn para 8.19.0 já presente.
- ESLint: mesmos diagnósticos completos por arquivo, regra, severidade, local e
  mensagem. Produção: **120 arquivos, zero erros, 42 avisos**; E2E: **87 arquivos,
  zero erros, 231 avisos**. Configurações e limites não mudaram.
- Knip: 6.41.0 → 6.42.1; 23 nós relacionados, incluindo parsers oxc 0.154.0 e
  unbash 6.0.1. Nenhum pacote adicionado/removido. `analyze:unused` antes/depois
  sem achados, saída idêntica. Entradas, plugins, ignores e scripts preservados.
- Os contratos de ESLint e Knip ficaram vermelhos somente pelo literal anterior
  de versão: 12/13 antes, 13/13 depois de atualizar o literal, sem remover asserções.
- Instalação e readiness integrados: **1.368 unitários e 8 integrações**, sem
  falhas/ignorados. Lint, análise de arquitetura, gerados, tipos, matrizes e
  auditoria estrutural aprovados; lint E2E também aprovado.
- Metadados `libc` removidos incidentalmente pelo npm em nós não relacionados
  foram restaurados da baseline; os bindings Linux realmente atualizados foram
  conferidos no npm. Não aceitar ruído de plataforma no lock.
- Audit runtime: **zero vulnerabilidades**. Audit completo: seis registros high
  na cadeia conhecida braces/Stylelint, aceitos apenas pela política estrita
  existente para `GHSA-vfj7-8cjw-p6xm`; nenhuma política foi enfraquecida.

### #469: falha inicial não apagada pelo resultado final

[Run 39673183740](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39673183740),
job inicial `119476107830`: 20 cenários aprovados e timeout de prontidão no helper
de login `pendency-reanalysis-auth.spec.js:26`, aguardando contexto/role. A stack
e as fixtures já haviam sido preparadas. Não foi falha de uma asserção RLS.
Assinatura de prontidão já observada na rodada #457; a causa não foi declarada resolvida.
Uma única repetição nativa do job no mesmo candidato, `119480651329`, concluiu
**21/21**, sem falhas/instáveis/ignorados, sem mudar produto, teste ou timeout.

Principais runs #469: validação `39673183667`, readiness `39673183861`,
pré-production `39673183764`, desktop `39673183657`, uso real `39673183837`.
Principais runs #470: validação `39673458479`, dependências `39673458481`,
desktop `39673458654`, pré-production `39673458441`, readiness `39673458583`,
uso real `39673458460`.

## #471: composição e checkpoint de validação

O candidato isolado `e9f723425a48d1ae500740636b0f37e25fb1e28d` passou 19/19 workflows.
Após os merges anteriores, o HEAD foi reconciliado com a main para
`780d0daa0fddf7f8e44b2fdda99ae1906d4e3f3c`.
O único conflito textual estava nos literais adjacentes de ESLint/Knip do
contrato. Preservados ESLint 10.13.0, Knip 6.42.1 e todas as asserções.
Manifest/lock mantêm dependency-cruiser 18.7.0. Diff contra a main: sete arquivos,
sem fontes de produto, CSS, workflows, Supabase ou dependências de runtime.
Revisão independente da composição e inspeção dos logs locais não encontraram bloqueio.

A checagem `git diff origin/main --check` passou. Uma comparação do índice com o
antigo pai da branch também incluía dois hard breaks Markdown herdados do #468;
seu exit não significou falha do readiness, que terminou aprovado.

### Falha inicial do HEAD integrado e repetição limitada

[Run 39677714809](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714809),
job `119491804686`: **17 aprovados, 1 falha, 1 instável, 2 não executados**.
Startup e fixtures concluíram, e o spec foi efetivamente executado.
`supabase-expense-independence.spec.js:58/122` exige painel CONECTADA integralmente
no viewport; medição recebida **0.9488689303398132** para ratio esperado 1.
A mesma assinatura de geometria consta dos registros anteriores da #460.
O retry serial do primeiro caso encontrou ESC-INDEP já utilizada onde esperava
tabela vazia; isso não identifica por si só a falha original da primeira tentativa.

Artefato inicial `12382213483`, 43.742.896 bytes, digest SHA-256
`17b4c10ec49a5a7634c76ffd16d4d43feb02dd1a4ce115c95dcfae3e0d7a8b5c`.
A ocorrência foi registrada no PR **antes** de solicitar uma única repetição
nativa do job, no mesmo SHA. Novo job: `119497541406`.
Sem alterações de teste, fixture, CSS, tolerância ou timeout.
No checkpoint inicial deste documento, a repetição e o comparador sustentado
ainda estavam em andamento; o PR permanecia Draft. Não tomar 19/19 do candidato
antigo como aprovação do HEAD integrado. Nova falha repetida exige registrar o
bloqueio e parar, em vez de fazer uma terceira tentativa cega.

## Publicação já observada

Após #469/#470: Vercel **`dpl_G5opzsL2kax4duEiA7ZnmhLr5s1b`**, Production READY,
origem `6a6dab30e92eb9ae12d9d84b153b68618192fb74`. Domínio oficial e manifesto
respondem HTTP 200 no mesmo SHA, `dataMode=supabase-production`.
Os sete workflows de push dessa main passaram: visual `39676889966`, readiness
`39676889792`, validação `39676889784`, dependências `39676889752`, CodeQL
`39676890186`, Lighthouse `39676889652` e monitoramento Production `39676889640`.

Bundle Supabase **2.118.0**, 265.570 bytes, SHA-256 inalterado
`33b09b0db467df88254207a45a76fa6ab293ab1539f76c63683a78d75a7a86eb`.
Na conferência anterior pós-#464: Edge Function ACTIVE v341, JWT ativo, fonte
igual à main; SHA-256 `11d2fe608228e7759df73d5c6b7070bdae1acf88680fdc80409f497626ae7937`.
As conferências de publicação foram somente leitura, sem sessão humana
autenticada ou CRUD institucional.

## Limites que continuam vigentes

Estas são atualizações de análise/validação; **nenhum ganho de fluidez, frescor,
CPU, SQL ou rede é atribuído a elas**. Gate sustentado verde não elimina seus
avisos diagnósticos nem estabelece budgets. A referência histórica #408 não
isola o efeito de um pacote de desenvolvimento.

CLI Supabase **2.114.0** permanece preventiva: a paridade de grants service_role
e pgTAP 32/33 exige decisão própria, não se comprovou regressão da CLI 2.121.
MSW 3, manutenção PostgreSQL, novos recursos pagos/de plataforma, #446/#447,
Caso A da #460 e indicadores mensais continuam separados.
Custódia externa do backup cifrado e disponibilidade da senha histórica não
foram resolvidas por esta manutenção. Não houve migrations, mudanças RLS/grants,
testes de escrita em Production, nem novas regras de negócio.

Continuidade técnica: o `gh` CLI passou a responder 401 durante a sessão;
Git e conector GitHub continuaram funcionais. Não houve rotação nem impressão
de credenciais. Worktrees históricos e arquivos locais de outras frentes foram preservados.

## Resultado superveniente do #471

A única repetição nativa, job `119497541406`, concluiu **21/21**, sem falhas,
instáveis ou ignorados. O HEAD `780d0daa` terminou **19/19 workflows aprovados**.
O desktop concluiu **226 aprovados, 68 pulados**, nenhuma falha.
O vermelho inicial permanece descrito acima; um resultado posterior não
comprova que a condição intermitente foi corrigida.

O #471 foi integrado em **`c480e2445e1ddbdbe91369dfb7f1182a7d73a944`**,
em 21/10/2026 às **22:03:40 UTC (19:03:40 de Brasília)**.
Árvore do merge idêntica à do HEAD homologado:
`61153dffa7409850ae3533b7bbcae9fea37b0126`.
O diff contra o candidato é vazio, sem mudança adicional durante o merge.

| Workflow do HEAD integrado | Run | Resultado final |
| --- | --- | --- |
| Dependency Review | [39677714887](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714887) | success |
| Reprodutibilidade do bundle Ajv | [39677714853](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714853) | success |
| Saúde das dependências | [39677714862](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714862) | success |
| Validar RADAR PDDE | [39677714768](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714768) | success |
| Lighthouse CI | [39677714854](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714854) | success |
| CodeQL | [39677714899](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714899) | success |
| Compatibilidade controlada Ubuntu 24.04 x 26.04 | [39677715015](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677715015) | success |
| Homologação do Excel SME | [39677714765](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714765) | success |
| Confiabilidade funcional com Supabase real | [39677714922](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714922) | success |
| Supabase readiness | [39677714784](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714784) | success |
| Gate remoto de perfis e viewports | [39677714813](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714813) | success |
| Estabilidade de posição do Prontuário | [39677714945](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714945) | success |
| Regressão visual desktop | [39677714792](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714792) | success |
| Backup e restauração descartáveis | [39677715313](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677715313) | success |
| Hardening específico de sincronização operacional | [39677714803](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714803) | success |
| Testes E2E Playwright | [39677714832](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714832) | success |
| Homologação integral pré-production | [39677714780](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714780) | success |
| Uso real operacional com volume semelhante a Production | [39677714971](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714971) | success |
| Ciclos funcionais reais com Supabase | [39677714809](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39677714809) | success |

### Comparação sustentada, sem atribuição indevida

O artefato `12383975089` do run `39677714971` foi baixado e aberto:
16.154 bytes, SHA-256
`354c9d78576cbe57931d4999430dc393bfde716693ca58062713c497aa3031b1`.
Status `diagnostic-comparison-complete`, **seis advertências diagnósticas**,
budgets `not-established/report-only`.

| Observação | Baseline histórica #408 | Candidato atual |
| --- | --- | --- |
| Rodadas / gestos / escritas confirmadas | 400 / 1.107 / 1.107 | 400 / 1.107 / 1.107 |
| Tentativas / abortos de leitura no navegador | 26 / 1 | 82 / 63 |
| Payload observado | 31.890.675 bytes | 9.317.612 bytes |
| Execuções SQL concluídas | 46 | 43 |
| Tempo bloqueante Long Tasks | 65.888 ms | 67.105 ms |
| Frames amostrados com opacidade reduzida | 767 | 0 |
| Erros de página | 0 | 0 |

Ambas as variantes completaram a jornada, a reconexão e a comparação final.
Não é comparação incremental da main anterior com Knip: o histórico inclui as
mudanças de sincronização anteriores e durações/runners distintos. Tentativas
HTTP não equivalem a execuções SQL; o frescor durante atividade não é medido por
essa prova. O aumento de tentativas/aborts e de trabalho bloqueante não foi
omitido nem tratado como efeito causal deste pacote. Não reabrir arquitetura
com base apenas nessa comparação histórica de uma atualização de tooling.

### Publicação final do #471 confirmada

Deployment automático **`dpl_3dzovudawxyfkxAugWCsJkTrY7kQ`**, target Production,
**READY às 22:04:31.671 UTC (19:04:31 de Brasília)**, origem
`c480e2445e1ddbdbe91369dfb7f1182a7d73a944`.
Alias oficial associado sem aliasError; página e manifesto HTTP 200, mesmo SHA
e `dataMode=supabase-production`. Bundle público 2.118.0, 265.570 bytes, mantém
o hash informado acima. Verificação somente leitura, sem deploy manual,
sessão humana autenticada ou alteração do Supabase.

O agente principal também executou o smoke público canônico
`scripts/check-production-system.mjs` com `--expected-commit` no merge final e
uma tentativa: **approved**, SHA correto, **52 assets**, leitura anônima
**blocked-401**. Não confundir esse teste de negação anônima com uma sessão
autenticada de Controlador; nenhuma credencial pessoal foi utilizada.
