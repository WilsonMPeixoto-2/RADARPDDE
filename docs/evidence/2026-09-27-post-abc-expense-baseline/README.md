# Baseline observacional pós-A+B+C — Despesa a identificar

**Data:** 27/09/2026. **Resultado da baseline principal: PASSOU no conteúdo auditado**, por evidências complementares: dois cenários de UX local executados neste host e o UAT operacional com Supabase descartável executado no GitHub Actions sobre um merge-ref com tree idêntico ao da `main` auditada. A etapa Supabase não foi repetida neste host, que não dispõe de Docker nem `psql`. Isto não certifica Production nem substitui uma auditoria visual aprofundada. Nenhuma escrita foi feita em Production.

## Proveniência e ambiente

| Item | Valor auditado |
| --- | --- |
| Repositório | `WilsonMPeixoto-2/RADARPDDE` |
| Base | `origin/main` em `ce0886d1e7a02a711772ab765be0497383bc55ee`, conferida por `git fetch origin`/`git ls-remote` antes dos testes |
| Branch deste registro | `audit/post-abc-expense-baseline-2026-09-27`, criada diretamente da base acima |
| Host / navegador | Windows, Chromium Playwright, `desktop-chromium`, viewport 1440 × 900, um worker |
| Node / npm | `v24.19.0` / `11.17.0` |
| Playwright / Supabase CLI | `1.63.0` / `2.114.0` |
| Servidor | `npm run start` da configuração Playwright; servidor canônico Node em `scripts/serve-radar.mjs` |
| Runtime dos testes de UX | `config.runtime.js`: `environment=local`, `dataMode=local`, repositório Supabase desabilitado |
| Dados | Escola de fixture e competência `05/2026` preparadas por `tests/support/unidentified-expense-fixture.js`; ações da jornada executadas pelos controles da UI |
| Produto/testes | Sem alteração |
| CI com Supabase | Ubuntu, merge-ref do PR #388 `92e7ee77444d58c755df0e12d14a6e46c8660a23`; tree `cc3049b3c9c2ffe8d6d704b7a9617f0e404d4476` |

`npm ci` concluiu com sucesso neste host. O workflow `.github/workflows/functional-reliability-lifecycle.yml` foi conferido no SHA auditado: ele prepara Supabase local com Docker, aplica a fixture SQL via `psql`, faz bootstrap Auth e gera runtime `supabase-preview`.

### Equivalência exata de conteúdo e execução no CI

O [log do workflow funcional do PR #388](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36352877259) mostra checkout de `refs/pull/388/merge` em `92e7ee7`, preparação do Supabase local descartável, execução de Playwright `desktop-chromium` e **16 passed (4.3m)**. A [API Git do merge-ref](https://api.github.com/repos/WilsonMPeixoto-2/RADARPDDE/git/commits/92e7ee77444d58c755df0e12d14a6e46c8660a23) informa tree `cc3049b3c9c2ffe8d6d704b7a9617f0e404d4476`; `git show` da `main` `ce0886d1e7a02a711772ab765be0497383bc55ee` informa **o mesmo tree**. Os commits são diferentes, mas código, testes e configuração versionada têm conteúdo idêntico.

O log confirma especificamente a aprovação dos cenários `a identificar: abertura atômica, retificação sem perder vínculos, identificação e resolução sobrevivem ao reload` e `a identificar → consumo: identifica, resolve a Pendência documental e não cria efeitos indevidos` — itens 8 e 9 dos 16 testes.

## Jornada UX local — PASSOU nos dois cenários executados

Com `RADAR_E2E_CAPTURE=1`, `--project=desktop-chromium` e `--workers=1`:

1. `conduz um usuário do débito sem documento até a reanálise sem atalhos internos` — passou. O usuário encontra **Registrar despesa a identificar**, preenche descrição/valor/observação, recebe o feedback de criação e o drawer de Pendência com próximo passo. Pelo drawer, registra o primeiro envio, escolhe **Material de consumo** e vê **Aguardando reanálise** clicável. Abre a reanálise, marca **Correto**, confirma e vê `Correto (Atrasado)` e o feedback de conclusão no Prontuário. A classificação atrasada é a esperada pela fixture: competência maio/2026 e disponibilização do documento em 23/09/2026. O teste observa estado em memória ao final: invoice `consumo`, análise `Correto (Atrasado)` e nenhuma Pendência ativa associada. Capturas: [aguardando reanálise](aguardando-reanalise-local.png) e [reanálise concluída](reanalise-concluida-local.png).
2. `permite retificar os dados provisórios pelo drawer sem identificar a despesa` — passou. O drawer mostra os dados provisórios; **Editar dados da despesa** permite alterar descrição, referência e valor; **Visualizar pendência** reabre o drawer com os dados retificados; **Editar detalhes** grava a observação. O estado em memória ao final tem invoice `a_identificar`, valor `215.75`, referência `REF-EXTRATO-01` e Pendência `Aberta`. A captura [retificação no drawer](retificacao-drawer-local.png) mostra os dados e o próximo passo.

Execução final conjunta dos dois cenários: **2 passed (13.2s)**. Os mesmos cenários haviam passado separadamente antes da execução conjunta. Nenhum timeout, golden, fixture ou teste foi alterado. O segundo cenário usa o ID inicial da invoice para procurar o mesmo registro ao final e encontra uma Pendência vinculada, mas **não compara explicitamente o ID da Pendência inicial com o final**; não se deve usar esse teste para afirmar essa identidade invariável. Os testes locais também **não recarregam a página**.

As capturas foram inspecionadas visualmente: os estados selecionados estão legíveis e as ações pertinentes aparecem no Prontuário/drawer. Isso não é certificação visual de todas as telas ou de Production. O Playwright não gerou trace nessa execução aprovada porque a configuração vigente usa `on-first-retry`; as capturas dos testes foram geradas por `RADAR_E2E_CAPTURE=1`.

## Jornada Supabase descartável — PASSOU no CI de conteúdo equivalente

Neste host, `docker` e `psql` não estavam disponíveis, então o UAT não foi repetido localmente. A prova já produzida no GitHub Actions foi incorporada somente após conferir o checkout real e a identidade dos trees. O cenário principal em `tests/e2e/supabase-operational-uat.spec.js` executa as ações de criação, retificação, identificação e reanálise pela UI, com consultas à base Supabase descartável:

| Estado requerido | Evidência no cenário CI aprovado |
| --- | --- |
| Criação | Invoice remota com `analiseDocumentoFiscal=Incorreto`; Pendência remota vinculada e `Aberta` |
| Retificação | Consulta da mesma Pendência por `pending.id` confirma vínculo com o mesmo `invoice.id` |
| Primeiro envio/identificação | Mesma invoice remota passa a `consumo`, análise `Não analisado`; mesma Pendência passa a `Aguardando reanálise` e existe uma tentativa |
| Reanálise | Pela UI, documento marcado correto; invoice remota `Correto` e mesma Pendência, consultada por ID, `Resolvida` |
| Nova carga da UI | `page.goto('/escolas/ESC-UAT')` inicia nova navegação e a UI reencontra o card e o resultado `Correto`. O cenário não chama literalmente `page.reload()` nesse ponto; a nova navegação é a prova de restauração usada pelo teste |
| Consumo sem efeito indevido | Cenário complementar confirma ausência de asset vinculado, de registro em `assets` para a invoice e de card de Assessoria |

`observeBrowser(page)` recolhe `pageerror`, `console.error` e requests das tabelas operacionais; `assertOperationalReads(observed)` exige listas vazias de pageerror/console.error e ausência de GET operacional global sem filtro ou de leitura de `administrative_logs`. **Os testes aprovados satisfizeram essas asserções.** Não existe, nesse helper, uma verificação abrangente de todos os status HTTP de todas as respostas de rede.

Os IDs concretos das fixtures efêmeras não foram extraídos para este relatório; a prova de identidade consiste nas consultas e asserções pelo **mesmo ID capturado no início do cenário**.

## Achados e limites

**A-01 — infraestrutura/ambiente local; confiança alta.** Fato: faltam Docker e `psql` neste host. Impacto: impede repetir o UAT Supabase aqui, mas **não impede aproveitar a execução comprovada no CI sobre tree idêntico**. Não indica defeito do produto.

**L-01 — cobertura local; confiança alta.** A jornada principal local não inclui retificação nem nova carga da página. O segundo cenário local cobre a retificação, mas não compara o ID da Pendência antes/depois. O UAT Supabase do CI cobre esses pontos. Classificação: cobertura complementar entre ambientes, sem defeito de usuário demonstrado.

**A-02 — infraestrutura externa do gate pré-production; confiança alta.** O [workflow pré-production do mesmo PR](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36352877415) terminou vermelho. No job `Supabase local, Auth, RLS e pgTAP`, os **34 arquivos/486 testes pgTAP passaram** e `supabase db lint` não encontrou erros. O job falhou depois, em `supabase gen types`, porque o Docker recebeu `toomanyrequests: Data limit exceeded` ao buscar `public.ecr.aws/supabase/postgres-meta:v0.97.0`, inclusive após três tentativas. O gate final permaneceu vermelho; essa falha não contradiz o UAT funcional aprovado, mas também não deve ser apresentada como gate integral verde.

**Console/rede:** a saída dos testes Windows apresentou apenas avisos do runner Node sobre `NO_COLOR`/`FORCE_COLOR`. O UAT no CI verificou `pageerror=[]` e `console.error=[]` por asserção, além das restrições de leitura operacional citadas acima. Ausência de qualquer falha HTTP não foi demonstrada de forma abrangente.

## Artefatos e alterações

- Capturas versionadas nesta pasta: `aguardando-reanalise-local.png`, `reanalise-concluida-local.png`, `retificacao-drawer-local.png`.
- Relatório Playwright, demais capturas e resultados permanecem localmente em `playwright-report/` e `test-results/` deste checkout; são gerados/ignorados e não integram este commit.
- Evidência CI: [ciclos funcionais reais com Supabase — 16/16](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36352877259) e [gate pré-production — falha de registry após pgTAP/lint aprovados](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36352877415).
- Alterações versionadas: somente este README e três capturas. **Nenhuma alteração de produto, teste, CSS, fixture, timeout, golden, migration, RPC/RLS, workflow, dependência ou configuração de Production.**

## Próximo ponto exato de retomada

Usar a baseline funcional aprovada como ponto de partida para uma **auditoria aprofundada de UX/comunicação visual** no fluxo Despesa a identificar → Pendência → retificação → primeiro envio/identificação → Aguardando reanálise → reanálise → resolução, incluindo a navegação Prontuário ↔ Pendências. Observar clareza dos estados e próximos passos, encontrabilidade, hierarquia visual, redundâncias, feedback, foco/scroll e contexto preservado; documentar problemas concretos sem corrigir produto durante a auditoria. Se a `main` avançar, vincular novas observações ao SHA real, sem atribuir a esta baseline evidência de outro conteúdo. O rate limit do gate pré-production permanece um item de infraestrutura de CI separado, antes de qualquer decisão de publicação.
