# A9 — retomada da prioridade 1: jornadas autenticadas

**Estado:** piloto local concluído; prioridade 1 parcialmente investigada. Não altera o produto.
**Baseline:** `ea00ca5409e24158a904d2a754803f953eeed2a0`, após #479/#480/#478.
**Roteiro:** [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481).

**Continuação de 23/10:** [contraprova nativa sem Lighthouse](2026-10-23-save-interaction-native-timing.md)
com seis gravações fonte/build, registro de cobertura e uma passagem de trace
separada. Os resultados originais abaixo foram preservados; a continuação não é
uma otimização publicada nem comprovação de velocidade em Production.

## Reconciliação antes de executar

Os três PRs estão efetivamente integrados. O diff do #479 mantém a AST executável
e acrescenta a compilação delimitada ao workflow. O #480 modifica somente o teste
de captura e seu relatório: ambos os botões continuam sujeitos a interseção 1,
sem scroll individual que pudesse esconder o corte. Não certifica todo o layout.
O #478 tem cinco workflows aprovados no HEAD `36a03088`; a homologação
pré-production `39985334289` registra tentativa 2, preservando a falha inicial.
O domínio Production responde pelo deployment `dpl_6eEZuQvC4ppdevK1ehyZUStA1mR3`,
READY no SHA da baseline. Não houve sessão humana autenticada em Production.

O piloto A8, run `39990335333`, job `120540152681`, aprovou nove testes e
registrou medianas de 122,333/96,774 ms para oito consultas sintéticas em Node.
Seu controle de invalidação e a paridade são reutilizáveis; esses tempos não
autorizam cache no produto nem representam digitação de um Controlador.

## Pergunta delimitada

Lighthouse user flows, Playwright e Axe já instalados conseguem acrescentar
evidência útil à abertura/reload do Prontuário e à gravação de NF, incluindo a
convergência em outra sessão, sem criar outra autoridade de sincronização?

## Protocolo e critério de parada

1. Usar o frontend exato da baseline e Supabase local descartável com Auth/RLS,
   RPC e Realtime reais. Preparar identidades e escola sintéticas exclusivas.
   Apenas configuração pública local chega ao navegador.
2. Confirmar login, papel real e assinatura Realtime antes da janela medida.
   Navegar pelos controles existentes e preservar a competência.
3. Três amostras de navegação e criação de NF de consumo; observar requisições,
   resposta da escrita, UI do autor, UI do observador, long tasks e renders.
   Reencontrar os registros após reload e confrontar o banco autenticado.
4. Em passagem separada, usar Lighthouse timespan/snapshot no estado autenticado
   e Axe WCAG 2.2 no modal. Não misturar tempos com e sem instrumentação pesada.
5. A medição termina após a série predefinida. Falha de preparação/harness é
   registrada como tal; não modificar o produto para obter uma medição.

## Limites definidos antes da medição

- Pilha já disponível: PostgreSQL local **17.6**, 61 migrations, última
  `20261011193500`; não representa um benchmark do PostgreSQL hospedado 17.11.
- Massa pequena e sintética, localhost, Chromium headless: não estima experiência
  de Production, volume institucional nem o efeito histórico dos upgrades.
- Tempo de RPC no navegador inclui transporte/decodificação; não equivale a SQL.
- Commit no servidor, recebimento da resposta e atualização visual são fronteiras
  distintas. Métricas sobrepostas não serão somadas como parcelas exclusivas.
- O runtime do produto permanece intacto. Instrumentação pertence ao processo
  descartável do teste; não vira gate ou budget sem validação posterior.
- A9 não substitui nem encerra #446/#447/#460; orienta qual prova falta antes de
  escolher uma intervenção de desempenho.

## Resultados e fontes preservadas

[Resumo estruturado](../evidence/2026-10-23-authenticated-capabilities-a9/summary.json),
[baseline original](../evidence/2026-10-23-authenticated-capabilities-a9/baseline-original.json),
[passagem Lighthouse](../evidence/2026-10-23-authenticated-capabilities-a9/lighthouse-original.json)
e [hashes](../evidence/2026-10-23-authenticated-capabilities-a9/manifest.json).
Os dois JSONs originais somam aproximadamente 35 KB antes da compactação textual;
preservados integralmente por serem pequenos e não terem artefato Actions próprio.
Não versionado o HTML Lighthouse de 1,1 MB, regenerável pelo script; sua atribuição
de INP relevante está preservada em JSON separado. Não foram gravadas credenciais.

Foram usados Lighthouse **13.5.0**, Playwright **1.64.1**, Axe **4.14.0** e
Supabase JS **2.118.0**, sem instalação/atualização. O código servido corresponde
à main `ea00ca54`; o checkout `b6248948` acrescentava somente o protocolo Markdown.
O coletor era um arquivo novo em desenvolvimento, posteriormente versionado nesta
branch. Não apresentar essa execução local como workflow nativo de CI aprovado.

### Gravação e convergência: três amostras sem Lighthouse

| Fronteira, em ms desde o clique em Salvar | 1 | 2 | 3 |
| --- | ---: | ---: | ---: |
| Resposta completa observada da RPC | 114,0 | 95,9 | 91,0 |
| Nova NF no DOM do autor + dois rAF | 303,8 | 303,5 | 287,9 |
| Nova NF no DOM do observador + dois rAF | 2.197,0 | 2.123,7 | 2.140,1 |

**Precisão do instrumento:** o coletor v1 chamou os dois últimos campos de
`*PaintMs`. A implementação detecta texto no DOM e aguarda dois callbacks de
`requestAnimationFrame`; isso **não prova que o registro fora da viewport foi
pintado ou percebido**, nem marca o fim de todo trabalho em background. O resumo
e o coletor atual usam `*DomTwoRafMs`. Os originais foram mantidos sem reescrever
os resultados. A observação de apresentação vem separadamente do Lighthouse.

As três NFs apareceram uma única vez no banco autenticado e nas duas projeções.
Após reload, IDs, escola, competência, programa e tipo concordaram com o banco.
Houve zero `pageerror` nas janelas observadas. Isso não homologa todos os tipos de
NF, perfis ou cenários de concorrência. O reload de **1.775 ms** e a navegação de
**1.810,5 / 2.216,2 / 2.348,5 ms** são tempos do harness, incluindo auto-waits e
asserções; a navegação inclui Carteira e link escolar. Não chamá-los de latência
pura do produto nem comparar com INP.

| Trabalho durante as três gravações | Autor | Observador |
| --- | ---: | ---: |
| RPC global | 3 | 0 |
| RPC escolar | 0 | 3 |
| Payload das leituras | 281.779 B | 9.490 B |
| Aborts observados | 0 | 0 |
| Aplicações de estado | 6 | 3 |
| Chamadas de render / substituições principais | 6 / 6 | 3 / 3 |
| Long tasks / tempo acima de 50 ms por tarefa | 1 / 7 ms | 0 / 0 ms |

As estatísticas SQL locais confirmam **seis execuções de leitura**, com delta de
**253,230 ms** de execução agregada. Não são seis consultas por usuário nem tempo
SQL remoto de Production. Os papéis acima têm responsabilidades diferentes;
a comparação de payload **não é percentual de ganho antes/depois**.

### Fronteira causal confirmada e já conhecida

Na passagem instrumentada adicional, o retorno escolar do autor registrou
`coverageBefore:false` e `fallback.reason:MISSING_BASELINE_COVERAGE`; no observador,
`coverageBefore:true`, aplicação escolar bem-sucedida e nenhum fallback.

O caminho vigente explica a diferença:

1. `DataService.execute()` invalida a cobertura e cancela leituras antigas antes
   da escrita (`src/application/data-service.js`).
2. `loadSchoolOperationalContext()` exige cobertura para substituir a fatia com
   exclusões seguras; sem ela, retorna `MISSING_BASELINE_COVERAGE`.
3. `operational-context-refresh.js` promove esse resultado para leitura global.

Isso **reconfirma uma hipótese documentada nos #446/#447**, agora na main atual
com uma escrita por UI/Auth/RPC e duas sessões. Não foi causado por #479/#480/#478
e não autoriza remover a invalidação: ela protege concorrência, respostas antigas
e completude. Uma solução futura teria de preservar essas garantias e demonstrar
que a cobertura pode continuar válida após o retorno autoritativo da escrita.

Os aproximadamente dois segundos até a outra sessão são compatíveis com a janela
Realtime vigente; não foi feita contraprova alterando timers, nem rajada contínua.
Não usar esta amostra para reabrir ou encerrar o diagnóstico de debounce.

### Capacidade Lighthouse efetivamente utilizada

Timespan executado na **mesma aba autenticada controlada por Playwright**, durante
abertura/preenchimento/salvamento de uma NF e espera pela convergência. Snapshot
separado do modal aberto. Nenhuma sessão, resposta de banco ou UI foi simulada.

- INP: **418,049 ms**, interação **Salvar Gasto**.
- Atribuição do Lighthouse: **2,009 ms** de input delay, **24,406 ms** de
  processamento e **391,711 ms** de presentation delay. Pequenas diferenças de
  precisão entre o total e a atribuição não constituem parcelas para recomputar INP.
- TBT: **0 ms**; CLS: **0,07044**; trabalho de main thread: **405,615 ms** no
  intervalo completo. São métricas diferentes, não parcelas somáveis.
- Score performance 0,98 e accessibility 1 não encerram julgamento de UX.
- Zero avisos de execução nos dois passos do Lighthouse.

[Atribuição original ao botão](../evidence/2026-10-23-authenticated-capabilities-a9/lighthouse-inp-attribution.json).
Essa é uma contribuição concreta da ferramenta: um TBT baixo pode coexistir com
atraso no próximo frame de uma interação. **Uma amostra headless com profiler não
atribui a causa a CSS, GPU, render ou banco**, nem prova que esse INP ocorre em
Production. O próximo teste útil é Event Timing/trace da mesma ação sem Lighthouse,
com viewport, massa residente e build público controlados; não ajustar CSS por palpite.

### Axe e inspeção visual

No modal de nova NF de consumo, WCAG 2.2: **zero violações confirmadas, 32 regras
aprovadas, três incompletas**. Os IDs das incompletas não foram preservados no
primeiro coletor; a versão atual registra-os em execuções futuras. Não declarar
conformidade integral ou tratar incompletas como aprovação.

Foram abertas e inspecionadas as capturas
[do modal](../evidence/2026-10-23-authenticated-capabilities-a9/invoice-modal.png)
e [do Prontuário após reload](../evidence/2026-10-23-authenticated-capabilities-a9/prontuario-after-reload.png).
No modal 1440×900: escola/mês/programa identificados, rótulos e dois comandos
legíveis, sem corte observado do rodapé; o Prontuário preserva Maio e o contador
de três notas. A captura do topo **não mostra todas as linhas fiscais**: sua
identidade foi conferida no DOM/banco. Não foi ensaiado zoom 200%, erro, reanálise,
teclado integral ou toda a experiência de scroll nesta passagem.

## Preparação, limites e decisão

Não ocultar as três falhas do novo harness:

1. Leitura de versão por `require(package/package.json)` recusada pelo exports do
   Axe, antes de qualquer backend/navegador. Corrigida lendo o arquivo instalado.
2. Timespan não aceita categoria `accessibility`; a baseline/reload já haviam
   concluído. Categorias passaram a ser específicas por modo: performance no
   timespan, accessibility no snapshot. Não se repetiu a série de três gravações.
3. A designação sintética fixa colidiu com a escola retida da tentativa anterior,
   antes do browser. Corrigida a criação de uma designação sintética livre.

Passagem 04 concluiu Lighthouse, Axe e nova gravação/convergência. As identidades
Auth efêmeras criadas foram removidas; somente fixtures financeiras sintéticas
permanecem no Supabase local para inspeção. Nenhum reset global, conta real,
fixture institucional ou configuração de Production foi usado/alterado.

**Decisão:** reaproveitar #479/#480/#478 e A8 no alcance demonstrado. A9 comprova
utilidade de user flows/snapshots e aprimora a medição da jornada, com dois alvos
delimitados de investigação: cobertura após escrita autoritativa e apresentação
da interação Salvar. Ainda não é proposta de otimização nem correção pronta.
Preservar a sequência da #481: terminar prioridade 1 com volume/build equivalentes
antes de expandir tipagem, cache de busca ou gates. #460 Caso A não foi reproduzido
nem encerrado por este recorte de NF de consumo não consolidada.

## Reproduzir sem Production

Usar pilha local descartável preparada com migrations/fixtures canônicas (Maio,
BASIC e cadastros básicos), não o projeto institucional. Gerar JSON de `supabase
status -o json` em arquivo privado fora do Git, com chaves `API_URL`, `ANON_KEY`,
`SERVICE_ROLE_KEY`. `umask 077`; não imprimir nem versionar o conteúdo.

```bash
RADAR_A9_LOCAL_ACCESS_FILE=/caminho/privado/local-access.json \
RADAR_A9_DB_CONTAINER=supabase_db_nome_descartavel \
RADAR_A9_OUTPUT=/caminho/privado/evidencias \
node scripts/audit/authenticated-journey-capabilities.mjs
```

`RADAR_A9_LIGHTHOUSE_ONLY=1` executa somente a passagem adicional, sem repetir as
três amostras. O coletor usa Puppeteer transitivo do Lighthouse para instrumentar
a mesma instância Chromium do Playwright; continua piloto opt-in, sem gate novo.
Não foi incorporado a CI normal nem homologado em runner limpo nesta rodada.
O primeiro CI do Draft detectou o `puppeteer-core` usado diretamente pelo coletor
como dependência não declarada: corrigimos **somente a declaração direta de
devDependency `25.12.0`** em `package.json` e no root do lockfile. O módulo
já integrava a árvore resolvida de Lighthouse; não foi atualizada sua versão
nem qualquer código do RADAR. Essa correção elimina a dependência implícita
em transitive imports, mas **não valida** a reprodução A9 em runner limpo.
