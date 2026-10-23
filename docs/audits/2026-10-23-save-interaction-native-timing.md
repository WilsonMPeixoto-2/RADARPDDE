# A9 — contraprova de apresentação sem Lighthouse

**Estado:** série predefinida concluída; diagnóstico, não otimização do produto.
**Base funcional:** `main@ea00ca54`; continuação diagnóstica do Draft #482 e #481.

## Pergunta e fronteira

A passagem anterior encontrou INP de 418 ms, com 392 ms de apresentação, numa
única gravação instrumentada pelo Lighthouse. Precisamos verificar se a demora
também aparece no navegador sem esse profiler. Não há mudança funcional proposta.

O coletor existente ganha um modo opt-in de **uma NF por invocação**, sem
Lighthouse/Axe, e observação nativa de Event Timing, Long Animation Frames,
long tasks, callbacks de frames, visibilidade/foco e fases da escrita/cobertura.
O observador não muda resultado de comando, fila, timer, cobertura ou fallback.

## Série fixada antes de medir

- Seis invocações: fonte, build, build, fonte, fonte, build. Três por variante;
  não estimar percentis de população nem escolher a melhor repetição.
- Duas sessões reais de Controlador, mesma viewport 1440×900, mesma competência
  2026-05, NF de consumo de 123,45. A autora deve estar visível ao salvar.
- O build usa `buildVercelArtifact`/esbuild existentes com configuração local de
  teste. Não é Vercel/CDN nem reprodução integral do ambiente Production.
- Cada invocação adiciona escola/identidades sintéticas próprias e as remove ao
  finalizar. Conferir contagens antes/depois, massa residente, versão do browser
  e hashes dos assets. Não resetar nem remover fixtures de outras investigações.
- Event Timing tem limiar mínimo de 16 ms e duração arredondada; ausência de
  entrada não será publicada como zero. Guardar timestamps e eventos da interação.
- Long Animation Frames só reporta frames acima de seu limiar; callbacks rAF
  não são prova de paint. Não somar métricas sobrepostas.
- DOM, RPC e reload continuam conferidos; não trocar asserções por métricas.
- Uma contraprova instrumental em HTML mínimo verifica que o observador detecta
  um click deliberadamente lento. Não é defeito do RADAR nem benchmark do produto.

## Critério de parada e interpretação

Terminar após as seis execuções planejadas. Falha de preparação fica registrada
como preparação. Não iniciar otimização de CSS, banco ou sincronização apenas por
um número. Se a demora não se reproduzir, ela continua **não generalizável**, sem
atribuir automaticamente culpa ao Lighthouse. Comparar profiler exige par próprio
com os demais fatores iguais; essa série testa existência sem profiler e efeito
do build, não isola todos os fatores históricos do A9.

O registro de fases também deve dizer se uma escrita foi confirmada/aplicada
antes de um refresh global por cobertura ausente. Isso distingue o mecanismo
observado da afirmação ainda não provada de que a proteção pode ser removida.

Ambiente: Supabase local descartável existente, PostgreSQL 17.6, 61 migrations;
massa pequena. Não é evidência de velocidade em Production nem efeito causal
do upgrade de PostgreSQL, Playwright ou Lighthouse.

## Follow-up delimitado após a série

As seis gravações terminaram normalmente e a demora apareceu nas duas variantes.
Consulta CDP independente identificou composição/rasterização por software
(SwiftShader), com cota de CPU `200000 100000`. Antes de concluir causa, executar
**uma passagem adicional com trace**, no build, excluída da série nativa. Capturar
somente categorias de timeline/render/graphics e marcador do clique, sem HAR ou
headers de autenticação. O objetivo é localizar o trabalho, não ajustar o produto
para este runner. Preservar a limitação de aceleração gráfica.

## Resultado: seis gravações, todas aproveitáveis no recorte declarado

[Resumo estruturado](../evidence/2026-10-23-save-interaction-native/summary.json),
[manifesto de hashes](../evidence/2026-10-23-save-interaction-native/manifest.json),
[trecho do trace](../evidence/2026-10-23-save-interaction-native/trace-excerpt.json).

As seis invocações terminaram na primeira tentativa, sem falha de preparação,
com RPC/Auth/RLS/Realtime reais, banco/DOM/reload concordantes e zero `pageerror`
ou abort contextual. Cada invocação removeu suas duas identidades efêmeras e sua
escola sintética. As contagens anteriores e posteriores foram iguais. A passagem
extra de trace também convergiu e restaurou suas contagens; não entra nesta série.

O navegador foi Chromium **156.0.8078.4**. A massa residente foi igual nas sete
passagens: **6 escolas, 6 verificações, 24 NFs, 15 Pendências, 4 tentativas,
19 contatos e 4 bens** após a gravação, além dos catálogos registrados no JSON.
É muito menor que uma jornada institucional representativa. O registro de cada
variante contém hashes/tamanhos dos assets servidos e contagens de aplicação.

| Ordem | Artefato | Duração nativa do click (ms) | Processamento do evento (ms) | Resíduo até apresentação¹ (ms) |
| --- | --- | ---: | ---: | ---: |
| 1 | fonte | 544 | 22,0 | 519,4 |
| 2 | build | 384 | 20,5 | 360,6 |
| 3 | build | 520 | 19,8 | 496,8 |
| 4 | fonte | 536 | 17,3 | 515,5 |
| 5 | fonte | 904 | 23,8 | 870,4 |
| 6 | build | 536 | 18,0 | 515,6 |

¹ Calculado como `startTime + duration − processingEnd`; a duração é arredondada
pelo browser. É estimativa, não precisão submilissegundo da apresentação. Estes
valores são **eventos click dessa ação**, não o INP agregado de toda a página.
Todos os cliques foram confiáveis (`isTrusted`), em aba `visible` com foco.
Entradas atrasadas de eventos anteriores também constam no original; a seleção
da tabela exige nome `click` e timestamp correspondente ao clique medido.

O controle instrumental em HTML mínimo detectou o bloqueio deliberado de 80 ms:
click de 88 ms e processamento de 80,7 ms. Isso verifica o instrumento, não é
parte dos resultados do RADAR. Sua lógica foi preservada no script opt-in
`check-save-interaction-observer.mjs`.

**Refutado neste ambiente:** o atraso depender exclusivamente do Lighthouse,
ocorrer somente no código não otimizado, ou exigir que a aba autora esteja oculta.
Não se demonstrou um percentual confiável de ganho do build nem efeito do upgrade
das bibliotecas: o pacote antigo não foi comparado.

## Onde o trace acrescentou evidência

CDP confirmou `gpu_compositing=disabled_software`,
`rasterization=disabled_software` e renderer **SwiftShader/SwANGLE**. A cota do
container é `200000 100000` (dois CPUs equivalentes), compartilhada pelos serviços.
Não há aqui GPU física acelerando esta composição.

Na passagem adicional com trace, o click durou **648 ms** e processou **26,3 ms**.
No primeiro segundo após o marcador do clique, ocorreram operações
`Display::DrawAndSwap` de aproximadamente **134–198 ms** no `VizCompositorThread`.
A maior registrou **197,922 ms de parede / 190,883 ms de CPU da thread**.
Há chamadas `SoftwareRenderer::DoDrawQuad` de até **74,276 ms**, com **71,276 ms
de CPU**. Isso é trabalho efetivo de desenho por software, não apenas tempo
ocioso esperando uma resposta SQL. O maior `BeginMainFrame` da thread da autora
nesse recorte foi 40,14 ms. Durações aninhadas **não** são somadas.

O processo gráfico é compartilhado pelas duas abas. O trecho preservado mostra
carga do compositor no intervalo, mas não atribui cada quad a um elemento CSS
ou a uma aba. Não houve contraprova removendo blur, animação ou sombra. Portanto:

- existe custo relevante de composição por software neste ambiente;
- a métrica de long tasks sozinha não representa esse custo;
- ainda não está provado qual efeito visual o provoca nem o impacto com GPU real;
- **não alterar CSS do produto nem anunciar gargalo de Production a partir disso**.

O trace bruto local tem 9.785.006 bytes. Seu hash e localização estão no manifesto.
Foi versionado um trecho verificável com metadados de processos/threads, marcador
e eventos relevantes de pelo menos 5 ms que interceptam a primeira janela de
1.000 ms. Não foi versionado o trace bruto, nem HAR/credenciais; os JSONs das sete
passagens, controle e resumo foram preservados integralmente (compactação textual).
O trecho não substitui o trace completo para uma nova análise de toda a jornada.

## Cobertura: a sequência real, sem alterar a autoridade

Em **todas as seis passagens**:

1. `invoice:save` entrou com cobertura disponível. `DataService.execute()`
   invalidou a cobertura e incrementou a geração antes da escrita.
2. A escrita terminou com `remoteCommitConfirmed=true`, `localStateApplied=true`,
   `status=applied` e **`refreshRequired=false`**, cerca de **91–111 ms** após
   o clique. O primeiro `renderProntuario` terminou em **110–133 ms**.
3. Aproximadamente **2.085–2.105 ms** depois do clique, entrou
   `loadSchoolOperationalContext`, origem `session-realtime-school-refresh`.
   Encontrou `MISSING_BASELINE_COVERAGE` e promoveu a leitura a global.
4. A leitura global restabeleceu a cobertura e houve segundo render. O observador
   manteve cobertura e aplicou uma única leitura escolar.

| Por gravação desta série | Autor | Observador |
| --- | ---: | ---: |
| Leituras globais / escolares | 1 / 0 | 0 / 1 |
| Bytes do corpo da leitura | 98.273–98.274 | 2.146–2.147 |
| Aplicações de estado / renders / substituições principais | 2 / 2 / 2 | 1 / 1 / 1 |
| Erros JS / aborts contextuais | 0 / 0 | 0 / 0 |

Não é uma comparação antes/depois de otimização. O registro de ACK pelo harness
(124–158 ms) inclui observação via Playwright/Node; não deve ser usado para afirmar
que a aplicação local ocorreu antes do commit. A confirmação da escrita vem do
contrato `stateSync` e do banco autenticado, não da ordem desses relógios observados.

**Distinção decisiva:** o fallback global começa cerca de dois segundos depois;
ele não explica, por si só, a demora de apresentação do click que acabou antes
de um segundo. São duas frentes de custo diferentes na mesma jornada.

### Por que a proteção não foi retirada

O caminho atual de `InvoiceService.save()` declara **`remoteCommitIsAuthoritative`**,
não `remoteResultIsAuthoritative`. `DataService.executeCommand()` aceita o commit
confirmado e aplica o plano local mesclado sem exigir leitura corretiva imediata.
Isso não é uma certificação de completude das seis coleções escolares.
O observador inicial registrava somente a segunda flag, que aparece `false` nos
originais; o coletor passa a expor ambas para as próximas execuções. A origem
`remote-commit-incremental` e o código vigente sustentam a distinção aqui.

`schoolOperationalCoverage` contém **IDs anteriormente cobertos por coleção**,
não apenas um booleano de frescor. `replaceSchoolOperationalSlice()` usa esses IDs
para remover registros que desapareceram da fatia sem apagar históricos ou dados
de outra autoridade. `schoolOperationalContextSequence`, geração e `shouldApply`
também impedem resposta velha após escrita, mudança de competência ou navegação.

Logo, não basta manter `coverage=true` ou recomputar cobertura de um resultado
parcial. Uma futura correção deve provar a manutenção dos IDs de cobertura durante
criação/edição/exclusão e dependências históricas, além de escrita concorrente,
rollback/falha de aplicação, resposta antiga e troca de competência. Os testes
vigentes de aplicação escolar, autoridade de contatos e recovery preservam partes
dessas garantias; não foram removidos nem reinterpretados como bugs.

Esta medição atualiza a hipótese de #446/#447 com uma jornada atual e localiza a
releitura **depois** de um commit já aplicado. Não fecha esses PRs, não resolve
#460 Caso A e não torna a retirada da guarda segura automaticamente.

## Continuidade e fronteira do Draft #482

O piloto demonstrou uso útil de Lighthouse user flows e das APIs Event Timing /
Long Animation Frames via Playwright: descobriu trabalho invisível para um resumo
de long tasks e separou-o da releitura posterior. Não produziu melhoria de fluidez
no runtime; **main e Production continuam intactas**.

- Manter #482 como instrumento/evidência diagnóstica; não incluir uma correção
  ampla de sincronização ou CSS neste PR.
- Para atribuição visual real, medir em navegador com ambiente gráfico conhecido
  e massa representativa. A falta dessa prova não justifica ajustar o produto ao
  compositor de software do runner.
- Para reduzir a releitura autora, o próximo experimento de produto deve isolar
  cancelamento de respostas antigas e metadados de cobertura, preservando os
  contratos acima e comparando a mesma jornada antes/depois. Começar pelo contrato
  existente, sem nova máquina de estados ou supressão temporal de Broadcast.
- O piloto ainda não é uma execução opt-in reproduzida por Actions em banco limpo.
  CI ordinária verde não executa automaticamente este coletor nem resolve esse limite.

### Reprodução local

Requer o arquivo de acesso **privado**, Supabase descartável em loopback e o
container correto explicitamente informado. Não colocar chaves na linha de comando.

```sh
RADAR_A9_NATIVE_TIMING=1 \
RADAR_A9_PUBLIC_BUILD=1 \
RADAR_A9_LOCAL_ACCESS_FILE=/caminho/privado/local-access.json \
RADAR_A9_DB_CONTAINER=supabase_db_nome_descartavel \
RADAR_A9_OUTPUT=/caminho/isolado/resultado \
node scripts/audit/authenticated-journey-capabilities.mjs
```

Para fonte, `RADAR_A9_PUBLIC_BUILD=0`; trace separado exige `RADAR_A9_TRACE=1`.
O modo nativo remove **somente** a escola e as identidades que ele próprio criou;
os modos A9 anteriores retêm a escola sintética, como documentado originalmente.
Uma execução por pasta evita sobrescrever a evidência anterior.

### Verificação desta entrega diagnóstica

- Série nativa: 6/6 execuções completas; trace separado: 1/1 completo.
- Controle instrumental executado inicialmente como módulo inline e depois pela
  CLI versionada: ambos detectaram o bloqueio deliberado. Não contam como duas
  amostras do produto.
- Sintaxe dos três scripts, `git diff --check`, hashes e exclusão das chaves locais:
  aprovados.
- `npm run analyze:unused`: aprovado; nenhum import não declarado novo.
- `tsc -p tsconfig.js-contract-boundary.json --pretty false`: aprovado.
- `npm run check:architecture`: aprovado, 204 módulos / 314 dependências.
- No checkpoint `d618d5fd`, CI normal consultada com 17 workflows concluídos com
  sucesso e dois ainda executando. Isso não é aprovação antecipada do HEAD seguinte
  nem execução do novo piloto em Actions. O estado final deve ser lido no #482.
- Nenhuma mudança em `src`, `app.js`, CSS do produto, SQL, Auth/RLS ou workflows.
  A declaração de `puppeteer-core` feita anteriormente pelo outro agente permanece:
  mesma versão que já estava resolvida transitivamente, apenas uso direto explícito.
