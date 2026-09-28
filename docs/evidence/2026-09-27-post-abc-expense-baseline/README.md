# Baseline observacional pós-A+B+C — Despesa a identificar

**Data:** 27/09/2026. **Resultado global: INCONCLUSIVO.** Os dois cenários de UX local passaram; a prova de persistência no Supabase descartável e após reload não foi executada porque este host não dispõe de Docker nem `psql`. Nenhuma escrita foi feita em Production.

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

`npm ci` concluiu com sucesso. O workflow `.github/workflows/functional-reliability-lifecycle.yml` foi conferido no SHA auditado para a etapa com Supabase: ele requer Docker, `npm run supabase:start`, `npm run supabase:reset`, a fixture SQL via `psql`, bootstrap Auth e runtime `supabase-preview`.

## Jornada UX local — PASSOU nos dois cenários executados

Com `RADAR_E2E_CAPTURE=1`, `--project=desktop-chromium` e `--workers=1`:

1. `conduz um usuário do débito sem documento até a reanálise sem atalhos internos` — passou. O usuário encontra **Registrar despesa a identificar**, preenche descrição/valor/observação, recebe o feedback de criação e o drawer de Pendência com próximo passo. Pelo drawer, registra o primeiro envio, escolhe **Material de consumo** e vê **Aguardando reanálise** clicável. Abre a reanálise, marca **Correto**, confirma e vê `Correto (Atrasado)` e o feedback de conclusão no Prontuário. A classificação atrasada é a esperada pela fixture: competência maio/2026 e disponibilização do documento em 23/09/2026. O teste observa estado em memória ao final: invoice `consumo`, análise `Correto (Atrasado)` e nenhuma Pendência ativa associada. Capturas: [aguardando reanálise](aguardando-reanalise-local.png) e [reanálise concluída](reanalise-concluida-local.png).
2. `permite retificar os dados provisórios pelo drawer sem identificar a despesa` — passou. O drawer mostra os dados provisórios; **Editar dados da despesa** permite alterar descrição, referência e valor; **Visualizar pendência** reabre o drawer com os dados retificados; **Editar detalhes** grava a observação. O estado em memória ao final tem invoice `a_identificar`, valor `215.75`, referência `REF-EXTRATO-01` e Pendência `Aberta`. A captura [retificação no drawer](retificacao-drawer-local.png) mostra os dados e o próximo passo.

Execução final conjunta dos dois cenários: **2 passed (13.2s)**. Os mesmos cenários haviam passado separadamente antes da execução conjunta. Nenhum timeout, golden, fixture ou teste foi alterado. O segundo cenário usa o ID inicial da invoice para procurar o mesmo registro ao final e encontra uma Pendência vinculada, mas **não compara explicitamente o ID da Pendência inicial com o final**; não se deve usar esse teste para afirmar essa identidade invariável. Os testes locais também **não recarregam a página**.

As capturas foram inspecionadas visualmente: os estados selecionados estão legíveis e as ações pertinentes aparecem no Prontuário/drawer. Isso não é certificação visual de todas as telas ou de Production. O Playwright não gerou trace nessa execução aprovada porque a configuração vigente usa `on-first-retry`; as capturas dos testes foram geradas por `RADAR_E2E_CAPTURE=1`.

## Jornada Supabase descartável — INCONCLUSIVO / não executada

O host não oferece comando `docker`, serviço Docker detectável, Docker Desktop no caminho padrão verificado, comando `psql` ou cliente PostgreSQL no caminho padrão verificado. A pilha local/descartável exigida pelo workflow não pôde ser comprovada. Por isso, **não foram executados** `supabase:start`, `supabase:reset`, fixture SQL, bootstrap Auth, geração de runtime `supabase-preview` nem o cenário `a identificar: abertura atômica, retificação sem perder vínculos, identificação e resolução sobrevivem ao reload` de `tests/e2e/supabase-operational-uat.spec.js`.

| Estado requerido | Evidência nesta rodada |
| --- | --- |
| Invoice/Pendência/tentativa/análise remotas | Não coletadas; Supabase local indisponível |
| IDs de invoice e Pendência remotos | Não coletados; testes locais verificam existência de IDs em memória, sem persistir os valores no relatório |
| Convergência UI ↔ Supabase | Não verificada |
| Estado após reload | Não verificado |
| Efeito colateral indevido após identificar como consumo | Não verificado remotamente |

## Achados e limites

**A-01 — infraestrutura/ambiente; confiança alta.** Fato: faltam Docker e `psql` neste host. Impacto: impede provar atomicidade, preservação de IDs, estado remoto e sobrevivência ao reload. Evidência: inspeção dos comandos/serviços/caminhos locais e requisitos do workflow corrente. Requer ambiente descartável operacional para conclusão; não indica defeito do produto.

**L-01 — cobertura local; confiança alta.** A jornada principal local não inclui retificação nem reload. O segundo cenário cobre a retificação pela UI, mas não compara o ID da Pendência antes/depois. A prova consolidada depende do cenário Supabase ainda não executado. Classificação: teste/harness/cobertura, sem defeito de usuário demonstrado.

**Console/rede:** a saída dos testes apresentou apenas avisos do runner Node sobre `NO_COLOR`/`FORCE_COLOR`, sem falha de teste. Os cenários não coletam de forma dedicada `pageerror`, console ou respostas de rede para este relatório; sua ausência material **não foi comprovada**. Não houve tráfego ou consulta a Supabase nesta rodada local.

## Artefatos e alterações

- Capturas versionadas nesta pasta: `aguardando-reanalise-local.png`, `reanalise-concluida-local.png`, `retificacao-drawer-local.png`.
- Relatório Playwright, demais capturas e resultados permanecem localmente em `playwright-report/` e `test-results/` deste checkout; são gerados/ignorados e não integram este commit.
- Alterações versionadas: somente este README e três capturas. **Nenhuma alteração de produto, teste, CSS, fixture, timeout, golden, migration, RPC/RLS, workflow, dependência ou configuração de Production.**

## Próximo ponto exato de retomada

Em host com Docker Engine e `psql` disponíveis, conferir novamente o head de `main` e o workflow no SHA que será realmente executado; preparar **apenas a pilha Supabase local descartável** conforme `.github/workflows/functional-reliability-lifecycle.yml`, sem tocar Production. Executar somente o cenário direcionado de `tests/e2e/supabase-operational-uat.spec.js` com as flags indicadas no handoff corrente e `RADAR_E2E_CAPTURE=1`. Registrar os IDs e estados remotos antes/depois da retificação, identificação e reanálise; recarregar e conferir o mesmo resultado, além de pageerror/rede. Se o SHA avançar, distinguir essa nova evidência da baseline local deste documento. Classificar qualquer falha antes de propor correção.
