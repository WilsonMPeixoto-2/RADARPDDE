# RADAR PDDE 2026 — rastreabilidade das decisões da modernização (22–23/10/2026)

**Classe:** auditoria retrospectiva datada e referência de continuidade; **não** é ADR, contrato funcional canônico, plano aprovado, nova frente ativa ou autorização para alterar Production.  
**Janela da investigação:** 22 e 23 de outubro de 2026, com antecedentes necessários de 21/10.  
**Baseline remota conferida ao elaborar este checkpoint:** `main@fef3e7834edefbe178e241c4957c52fa781bf877`, após merges #482 e #483. **Revalidar sempre a main, o deployment e os checks antes de operar.**  
**Roteamento:** [`docs/CURRENT_STAGE.md`](../CURRENT_STAGE.md) (estado mutável), [`AGENTS.md`](../../AGENTS.md) (regras permanentes), [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481) (programa pós-upgrade).  
**Objetivo deste arquivo:** permitir que agentes subsequentes recuperem, em uma leitura, perguntas, hipóteses, experimentos, contraprovas, mudanças de direção, evidências negativas, merges e limites. Não repetir pesquisas/CI já encerradas apenas porque uma transcrição histórica diz "Draft" ou "aguardar".

## 1. Conclusão executiva e mudança de estratégia

A investigação começou pela **atualização segura de ferramentas** e passou a perguntar **que capacidades poderiam melhorar concretamente o RADAR como sistema institucional de fiscalização**. O ganho esperado não é o número de bibliotecas atuais: é abrir/recarregar o Prontuário com dados corretos, salvar despesas, continuar operando, manter convergência entre sessões e reduzir risco/custo de evolução.

A [pesquisa de oportunidades de 22/10](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/docs/audit-capacidades-pacotes-out2026/docs/audits/2026-10-22-technology-opportunities.md), a [matriz A0](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/docs/audit-capacidades-pacotes-out2026/docs/audits/2026-10-22-capability-configuration-matrix.md) e a [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481) estabeleceram **quatro prioridades de execução**, nesta ordem:

1. **Experiência/desempenho de jornadas autenticadas reais:** abertura/reload de escola, lançamento de NF, feedback visual, segunda sessão e concordância banco–memória–DOM–reload.
2. **Prevenção de regressões:** contratos JS/TypeScript localizados, Axe/ESLint/Knip e provas de sensibilidade, sem migração generalizada ou eliminação de módulos carregados dinamicamente.
3. **Confiabilidade e sincronização:** MSW/Supabase/PostgREST/PostgreSQL, concorrência, respostas antigas, cobertura após gravação, perda de conexão, troca de contexto.
4. **Metodologia/custo da CI:** classificar diff, manter checks estáveis e suprimir trabalho desnecessário apenas mediante prova de impacto e segurança.

A0–A9 são **rótulos de experimentos**, não uma nova ordem de prioridades. O ensaio A8/Fuse não passou à frente do problema humano principal. Inteligência operacional e IA/documentos pertencem a frentes estratégicas **posteriores, não autorizadas automaticamente** por esta auditoria.

**Distinções obrigatórias:** atualização de versão ≠ capacidade habilitada; capacidade demonstrada ≠ recurso do produto integrado; merge de instrumentação ≠ melhoria de desempenho; CI verde ≠ UX aprovada; DOM + dois `requestAnimationFrame` ≠ pintura/percepção da tela; confirmação de commit ≠ cobertura escolar completa; rerun verde ≠ causa original diagnosticada.

## 2. Estado de referência: o que foi de fato integrado

| Frente | PR e estado ao fim da janela | Efeito real | NÃO significa |
| --- | --- | --- | --- |
| MSW 3 | [#443](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/443), merge 22/10 | Adaptou `onUnhandledRequest` → `onUnhandledFrame`, com contraprova do bloqueio de request sem handler | Alteração de runtime ou melhora de fluidez |
| SDK Supabase | [#457](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/457), antecedente de 21/10 | SDK 2.118 no pacote, bundle web e Edge Function, com guardas e retries preservados | Alteração da política RLS ou mais velocidade comprovada |
| CLI/grants/typegen | [#472](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/472), merge 22/10 | CLI 2.121, configuração explícita de grants, tipo gerado/checagem estrutural e ports da CI | Mudança de grants/SQL na Production |
| Documentação CLI | [#473](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/473) | Reconciliação documental e material do #472 | Prova funcional nova independente |
| Axe | [#464](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/464) e correções [#466](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/466), [#474](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/474) | Detectou e corrigiu nomes acessíveis inadequados em Dashboard/Pendências | Conformidade WCAG integral |
| Knip profundo | [#475](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475), integrado | Comando opt-in, inventário de arquivos/exports/tipos e conferência de loaders | Autorização para apagar 34 módulos |
| CI classificador | [#476](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/476), integrado | Shadow mode observacional, seguro em diffs ambíguos | Dispensa de gates |
| CI exceção A6 | [#477](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/477), integrado | Atalho restrito a um job e `docs/audits/*.md`; prova 342→11 s naquele job | Redução de todos workflows/tempo de interface |
| JSDoc/TypeScript | [#479](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/479), integrado | Gate pequeno para `operation-key.js` + consumidor `invoice-service.js`, sem mudança executável | TypeScript/checkJs global |
| Captura NF | [#480](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/480), integrado | Teste passa a exigir botões operacionais 100% visíveis, não cada pixel do painel | Redesign CSS ou isolamento de retry corrigido |
| Consolidação documental | [#478](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/478), merge `ea00ca5409e24158a904d2a754803f953eeed2a0` | Diff **efetivo contra main**: quatro Markdown somente | O diff histórico de preparação do PR (que continha outros arquivos) não é o resultado do merge |
| Jornada autenticada A9 | [#482](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/482), merge `c5f6e5afd66a82516461344a92d06cc6ad4c2c4e` | Scripts opt-in, Lighthouse/Axe/Event Timing/trace, JSONs, capturas e relatórios | Correção de compositor, cobertura ou desempenho de Production |
| Hotfix da auditoria | [#483](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/483), merge `fef3e7834edefbe178e241c4957c52fa781bf877` | Dependências Puppeteer/Chromium BiDi/Zod corrigidas e CI de segurança novamente aprovada | Alteração fiscal, SQL, CSS ou Auth/RLS |

**Fronteiras em aberto:** [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446)/[#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) são Drafts de **diagnóstico/characterization**, não melhorias integradas; [#460](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/460) **Caso A** segue sem diagnóstico causal final; [#481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481) permanece aberta como programa amplo, embora A9 esteja encerrado como pesquisa.

## 3. Experimento #472: atualização da CLI virou investigação causal de autorização

### 3.1. Falhas distintas na primeira candidata

A CLI 2.121 inicialmente reprovou checks de três classes: (a) unitário com versão literal 2.114, (b) bind da porta 54322 antes dos testes, (c) 672/674 pgTAP no banco descartável, somente asserções 32/33. Os **21 ciclos financeiros** de outro job passaram, o que não validava os steps que falharam.

A investigação confrontou código upstream das versões 2.114/2.121 e o **bootstrap executado antes das migrations**. A opção omitida `api.auto_expose_new_tables` havia mudado de default. O grant DELETE herdado nas tabelas de `user_profiles`/`user_school_scopes` surgia no stack novo, divergindo do contrato da stack local histórica. A diferença entre privilégios do bootstrap **local** e `service_role` administrativo **hospedado** foi mantida deliberadamente; não se tentou impor à Production a ACL da fixture.

### 3.2. Prova causal 2×2, quatro runners reais

[Run 39830514391](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39830514391), [dados e relatório](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/main/docs/evidence/2026-10-22-supabase-cli-grants/README.md):

| CLI | `auto_expose_new_tables` | DELETE no bootstrap | pgTAP final |
| --- | --- | --- | --- |
| 2.114 | ausente | não | 674/674 |
| 2.114 | `false` | não | 674/674 |
| 2.121 | ausente | sim | **672/674** (32/33 falham) |
| 2.121 | `false` | não | 674/674 |

Nas quatro células, mesmos testes/migrations; variar apenas ferramenta e opção confirmou previsão causal. A célula com pgTAP vermelho foi preservada como **controle esperado**, não classificada como verde de produto.

**Decisão:** fixar `[api] auto_expose_new_tables=false` no stack local; manter 674 asserções, não alterar SQL/RLS/GRANT/REVOKE de Production. Atualização de ferramenta é compatibilização de **contrato**, não adoção automática de novo default.

### 3.3. Typegen e infra

O gerador novo modificou representação de 48 campos JSON com `NonNullable<Json>`, 20 `ComputedFields: never` e três RPCs `Args: Record<PropertyKey, never>`, além de cosmética. A comparação byte a byte deixava de representar o objetivo: criou-se verificador de sintaxe e tokens significativos, com controles para coluna, nulabilidade, assinatura e opcionalidade. Não confundir com equivalência universal de todo TypeScript.

A reserva de portas 54320–54323 foi propagada para runners necessários. O download redundante de `postgres-meta` foi retirado apenas de uma matriz Ubuntu diagnóstica, **mantendo** os gates reais Supabase. A versão local de PostgREST não se iguala à Production; paridade necessária é a dos contratos examinados.

**Homologação:** 19/19 workflows no candidato final, 8/8 pós-merge; nenhuma escrita institucional autorizada ou executada por esse upgrade. Não reabrir a matriz 2×2.

## 4. Axe/Playwright: novo analisador encontrou defeitos anteriores; correção do instrumento visual

1. **Axe 4.14 (#464 → #466):** regra `label-content-name-mismatch` (WCAG 2.5.3) identificou cinco cartões do Dashboard do Controlador. `aria-label` artificial omitia texto visível e era também usado pela integração de design para reconhecer o componente. #466 removeu o nome acessível artificial e introduziu identidade funcional `data-cycle-b-filter`, preservando estilo, filtros e `aria-pressed`. A ferramenta nova tornou **visível** problema existente: não o criou.
2. **A3/#474:** `summary` de “Mais filtros” em Pendências tinha `aria-label` diferente do texto visível. Removido o atributo redundante, preservando expansão nativa e teclado. Isso é melhoria funcional de acessibilidade.
3. **#460 Caso B / #463:** o teste comparava topo da bounding box de orientação (inclui padding) com base do cabeçalho e acusava ≈1,775 px de sobreposição; screenshot não mostrava texto encoberto. A nova asserção mede a primeira linha **pintada do texto** via `Range.getClientRects()`, não a caixa vazia. CSS/timeout/tolerância de 2 px **não** foram alterados; Caso A segue aberto.
4. **#480:** `toBeInViewport({ratio:1})` do painel NF inteiro falhava com interseção 0,9488689 em 1366×768, embora “Adicionar Nota” e “Registrar despesa a identificar” estivessem totalmente visíveis no screenshot. A asserção passou a exigir ratio 1 dos **dois botões**, mantendo presença do painel; sem scroll individual, CSS, fixture ou regra financeira. [Evidência](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/main/docs/audits/2026-10-23-invoice-capture-viewport-diagnostic.md), [job que falhou antes](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39908494735), [21 ciclos aprovados depois](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39923912526).

**Limite:** ação 100% dentro da viewport ≠ garantia completa de affordance, foco, contraste, legibilidade ou inspeção outside-in; não declarar UX global aprovada. A contaminação de fixture por retry serial foi registrada, **não corrigida** pelo #480.

## 5. A0–A8: perguntas, contraprovas, rejeições e escolhas

| Ensaio | Pergunta | Resultado/material | Decisão |
| --- | --- | --- | --- |
| A0 | Qual capacidade da stack nova está realmente subutilizada? | Inventário de config, código, releases, referências; sem benchmark | Estudo de oportunidades, não fila de implementação |
| A1 | TS7/Knip reconhecem problemas além das regras atuais? | TS2322 em mutação artificial; Knip 34 arquivos candidatos | Exigir falsificação independente antes de impor gate |
| A2 | Detectam mudanças em consumidor real e arquivo genuinamente órfão? | TS2322 no retorno de `persistentId`; Knip encontrou candidato 35 fictício sem loader | Instrumentos têm sensibilidade; não provam bug em runtime |
| A3 | Axe ampliado identifica problema em UI existente? | `label-content-name-mismatch` em Pendências; #474 | Correção real separada |
| A4 | TS7 encontra violação na chamada real InvoiceService? | Mutação de prefixo numérico causava erro TS2345, mas JS normaliza via `String`; baseline ampla também diagnosticava | Não inventar restrição funcional para validar piloto |
| A5 | Classificação de impacto é conservadora? | Shadow sem skip; revisão Codex detectou riscos com rename/filetype | Consertar inventário (`--no-renames`, sem filtro excludente) antes do atalho |
| A6 | Um job de Supabase pode evitar trabalho em relatórios Markdown isolados? | Runner 12 testes; depois job real 342→11 s e log `A6_DOCS_ONLY_SKIP=true` | Apenas um job, `docs/audits/*.md` direto e diff inequívoco; outros gates intactos |
| A7 | Checagem localizada detecta bug executável de contrato? | Código válido tsc exit 0; `persistentID` inexistente → TS2551; sem tipagem da factory → erro não detectado; 7 unitários e AST idêntica | #479 integrou JSDoc e etapa curta em validate, **sem** reescrever serviço |
| A8 | Reutilizar índice Fuse evita reconstrução por input? | 24 pares alternados; 8 consultas em 163 escolas + 400 Pendências sintéticas; medianas 122,333 vs 96,774 ms; 9/9 testes e controle de invalidação | Ganho Node **não** é ganho browser; não integrar cache/Worker antes de prova de UX/invalidadores |

**A4→A7 foi uma correção epistemológica:** o primeiro RED era consequência de um contrato de tipo escolhido que o JS normalizava; o RED seguinte representa método inexistente e é neutralizado quando a ligação tipada é removida. [Documento A7](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/main/docs/audits/2026-10-23-js-contract-boundary-experiment.md), [PR #479](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/479). O `tsconfig.js-contract-boundary.json` usa `checkJs:false` + `// @ts-check` só nos arquivos selecionados; não tem `noImplicitAny` global verdadeiro nem valida automaticamente RPCs.

**Knip:** 34/34 candidatos tinham referência textual nos seis loaders examinados; a sonda órfã ficou sem referência. Referência textual não certifica execução; falta de referência nesses loaders não certifica código morto. #475 mantém análise opt-in e zero exclusões. [Revisão independente](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/main/docs/audits/2026-10-23-modernization-continuity-review.md).

**A5→A6:** o classificador `scripts/ci/classify-pr-impact.mjs` falha fechado para mudanças indeterminadas, e o check mantém nome estável. [Log real da redução](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39906425278), 331 s economizados **naquele job**; não extrapolar a todos os workflows. Branch protection/required checks não foram totalmente lidos pelo conector (403); não ampliar dispensa sem essa verificação.

**A8:** `src/integration/global-search.js` executa `rebuildEngine()` a cada busca. O controle negativo mostra que índice reaproveitado pode omitir registro novo até invalidação. `FuseWorker` não aceita diretamente `useTokenSearch` vigente; não substituir modo de busca silenciosamente. [Issue #481 / prova A8](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481), [run 39990335333](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39990335333). A prioridade 1 **não** foi transferida para busca.

## 6. A9: cronologia instrumental, duas hipóteses e por que o merge não é otimização

[Relatório original](2026-10-23-authenticated-capabilities-a9.md), [contraprova nativa](2026-10-23-save-interaction-native-timing.md), [resumo original JSON](../evidence/2026-10-23-authenticated-capabilities-a9/summary.json), [resumo Event Timing](../evidence/2026-10-23-save-interaction-native/summary.json), [trace parcial e manifestos](../evidence/2026-10-23-save-interaction-native/manifest.json).

### 6.1. Primeira passagem, Auth/RLS/RPC/Realtime reais

Na baseline frontend `ea00ca54`, com duas sessões Controlador, Supabase descartável PostgreSQL local 17.6, 61 migrations e massa sintética pequena, três NFs de consumo persistiram uma vez, convergiram entre sessões e reapareceram após reload. Tempos desde o click (ms):

| Medida | Amostra 1 | Amostra 2 | Amostra 3 |
| --- | ---: | ---: | ---: |
| Resposta de escrita no browser | 114,0 | 95,9 | 91,0 |
| Autor: DOM da NF + 2 rAF | 303,8 | 303,5 | 287,9 |
| Observador: DOM da NF + 2 rAF | 2.197,0 | 2.123,7 | 2.140,1 |

Não chamar `*DomTwoRafMs` de paint visível: o primeiro coletor nomeava esses campos `*PaintMs` de forma excessiva; os originais foram preservados e a interpretação retificada. Também não chamar o tempo de navegação automática de latência isolada do produto.

**Proveniência crítica:** o JSON baseline original terminou `stage=failed` **após as três gravações**, ao configurar categoria inválida no Lighthouse. Uma **outra execução**, com outra escola sintética, concluiu Lighthouse e Axe; os 418 ms **não pertencem às mesmas três gravações**. O review independente [comentário do #482](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/482#issuecomment-6371230089) reconciliou timestamps, escolas sintéticas e versões do coletor. Erros de preparação anteriores: exports de versão do Axe, categoria inválida no timespan, colisão de designação sintética. Não atribuir às operações fiscais erros do harness.

### 6.2. Lighthouse: a mudança de pergunta

Na passagem instrumentada independente de criação de NF em aba autenticada, Lighthouse 13.5 reportou INP **418,049 ms**, com input delay ≈2,009 ms, processamento ≈24,406 ms e presentation delay ≈391,711 ms. TBT=0, CLS≈0,07044, performance score 0,98. Assim, TBT baixo coexistia com uma interação cuja apresentação foi lenta no experimento. O Lighthouse não provou a causa e podia influir na própria medição. Axe no modal: **0 violações confirmadas, 32 regras aprovadas e 3 incompletas**; sem certificado WCAG global.

**Decisão:** fazer contraprova nativa **sem Lighthouse**, não editar CSS ou SQL por palpite.

### 6.3. Seis cliques predefinidos + trace separado

Série `source/build/build/source/source/build` em Chromium headless, mesma massa, duas sessões reais, viewport 1440×900, uma NF por execução, confirmação banco/DOM/reload e remoção das **próprias** fixtures. Duração Event Timing do click **544, 384, 520, 536, 904, 536 ms**; processamento JS do evento **22,0, 20,5, 19,8, 17,3, 23,8, 18,0 ms**. Não são percentis populacionais nem INP agregado de Production. Controle positivo de clique deliberadamente bloqueado validou sensibilidade do observador.

Uma sétima execução com trace local indicou render/composição por **SwiftShader/software**, CPU limitada a dois núcleos e operações `DrawAndSwap` da ordem de 134–198 ms. A presença de custo gráfico nesse runner enfraquece atribuição simplista ao JS, **não prova** efeito CSS específico nem lentidão em GPU real. O trace completo ~9,8 MB permaneceu local; Git contém hash e recorte, não o arquivo integral. Não usar o recorte como se permitisse reabrir todo o trace.

**Decisão:** A9 termina como instrumento; investigação em ambiente gráfico representativo exige frente separada, com volume, build e percepção real. Não ajustar produto ao SwiftShader.

### 6.4. Custo posterior da cobertura

As seis gravações nativas mostraram commit remoto e aplicação local em ~91–111 ms, primeiro render ~110–133 ms, `refreshRequired=false`. **Depois**, próximo de 2,1 s, Realtime pediu refresh escolar à autora; `MISSING_BASELINE_COVERAGE` promoveu-o para global. Por gravação: autora 1 leitura global ≈98 KB e 2 renders/aplicações; observadora 1 leitura escolar ≈2,1 KB e 1 render/aplicação. Os papéis/estados de cobertura **não são grupo A/B equivalente**, nem isso é % de economia comprovada.

`DataService.execute()` invalida cobertura/cancela leituras antigas antes da escrita. A cobertura contém **IDs já conhecidos por coleção**, necessários a exclusões seguras e preservação de históricos; `remoteCommitIsAuthoritative` não equivale a `remoteResultIsAuthoritative` nem a completude de todas as coleções. Portanto, não basta conservar `coverage=true` ou ignorar o Realtime. Qualquer correção futura precisa provar IDs cobertos, criação/edição/exclusão, efeitos históricos, concorrência, rollback, resposta antiga, troca de competência e superfícies vizinhas.

**Duas pesquisas distintas:** (i) apresentação do clique acaba antes de 1 s e deve ser investigada graficamente; (ii) releitura global começa ~2,1 s após o clique e deve ser investigada na autoridade de cobertura. A segunda não explica automaticamente a primeira. [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446), [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) e o Caso A de [#460](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/460) **não** foram resolvidos por A9.

### 6.5. CI e razão do encerramento

[#482](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/482) integrou **apenas instrumentação opt-in e evidências**, nenhum `src`/CSS/SQL/Auth/RLS/workflow do produto. CI final: 37 checks success / 2 skip. Teste sustentado de seis sessões falhou inicialmente **na baseline, no login, 0/400 rodadas**, esperando `opacity:1` de `#tab-verificacoes`; a comparação recusou amostra incompleta. Uma repetição dirigida passou 400 rodadas e 1.107 gravações/gestos em cada variante, sem relaxar teste. O comparador registrou **8 avisos diagnósticos** (budgets `not-established/report-only`), inclusive deltas expressivos de read attempts/aborts/long tasks com runtime igual; **não** atribuir os deltas à instrumentação.

O A9 não foi homologado integralmente como job opt-in de Actions em banco limpo. O merge é legítimo como **pesquisa instrumental encerrada**, não como gate obrigatório nem benefício de fluidez. O registro de fechamento está nos [comentários da issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481).

## 7. Incidentes de CI: provas negativas que NÃO devem desaparecer

| Frente | Ocorrência original | Contraprova e classificação | Não inferir |
| --- | --- | --- | --- |
| #475 | Timeout de readiness/role em Auth; falha de ciclos com geometria e estado de fixture | Blobs funcionais idênticos à main; uma repetição por job passou; causa não isolada | "Knip causou" ou "flakiness totalmente resolvida" |
| #478/captura | Container NF 94,8869% na viewport; botões visíveis | Screenshot real, #480 mudou alvo de asserção sem mudar UI; 21/21 ciclos | Correção de isolamento de retry |
| #478/backup | Segunda stack do restore não iniciou: porta `55322` ocupada | Rerun dirigido passou restauração; erro antes da etapa de restore original | Integridade de backup defeituosa ou dono da porta identificado |
| #482/carga | Baseline no login `opacity:0`, nenhuma rodada | Screenshots/relatório e uma repetição dirigida 400/400 | Melhoria/regressão medida em runtime invariável |
| #483/scratch | Instalação limpa `npm audit` 0 vulnerabilidades; passo posterior falhou ao ler relatório JSON antigo | CI oficial regenerou relatório: 0 moderate/high/critical | Vulnerabilidade remanescente confirmada na árvore nova |
| #479/Preview | Limite Vercel de mais de 100 deployments/dia em tentativa de Preview | Production posterior READY | Defeito funcional da versão publicada |

A política aplicável é [`TEST_GOVERNANCE.md`](../reference/TEST_GOVERNANCE.md): registrar **SHA + run/job + estágio + evidência + classificação**, distinguir produto/teste/fixture/infra/inconclusivo, não encadear reruns até obter verde. Repetição que passa enfraquece uma hipótese mas não demonstra a causa do vermelho original.

## 8. Zod #483: falha real do gate de segurança e correção dirigida

Ao transformar Puppeteer de dependência transitiva do Lighthouse em uso direto do coletor A9, #482 declarou `puppeteer-core@25.12.0` sem mudar o binário resolvido. Após o merge, o security gate do push encontrou advisory de severidade alta `GHSA-MRHX-C7XC-M3W5` no Zod transitivo (`puppeteer-core` → `chromium-bidi` → `zod`), além de Zod 4 afetado. Não se confirmou falha funcional, RLS, violação de dados ou deploy quebrado; houve **bloqueio de CI de segurança**.

O #483 atualizou `puppeteer-core 25.16.0`, `chromium-bidi 157.0.8090-0`, `zod 4.6.7` e `modern-tar 0.8.6` na árvore de desenvolvimento, sem exceção nova ou ajuste runtime. No scratch, `npm ci` e auditoria fresca reportaram **zero** vulnerabilidades, mas o passo final consultou JSON velho e gerou falso diagnóstico de advisories ExcelJS/UUID. O [workflow oficial de saúde das dependências 40030215114](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/40030215114) gerou seu próprio relatório: `found 0 vulnerabilities`, `moderate=0, high=0, critical=0`. Os **19 workflows de PR** no HEAD `d95b6d67` aprovaram; merge final `fef3e7834`.

**Aprendizado:** declarar uso direto de pacote transitivo com versão explícita, auditar a árvore exata do SHA/lock e sempre correlacionar relatório à instalação/geração atual. Não está demonstrado por que o advisory só bloqueou o push posterior, portanto não atribuir uma causa única sem confronto das duas execuções.

## 9. Governança: problemas concretos verificados nesta reconstrução

1. **Checkpoint desatualizado:** `docs/CURRENT_STAGE.md` na `main@fef3e7834` ainda inicia em `main@3949c7b`, chama #478 de "em validação" e não registra #482/#483. O [review do Codex no #478](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/478#discussion_r4361873401) havia previsto o erro. Este documento é histórico; o topo de CURRENT_STAGE deve ser corrigido na mesma entrega e atualizado nas futuras mudanças.
2. **Knip e arquivos gerados:** `scripts/audit/inspect-knip-deep.mjs` e `verify-knip-dynamic-references.mjs` geram `artifacts/tooling/*.json`; o `.gitignore` consultado não contém essa pasta. [Codex observou](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475#discussion_r4356581142). **Recomendação em frente pequena futura:** ignorar apenas os relatórios gerados necessários; não tratar como falha de runtime ou remover diretórios indiscriminadamente.
3. **Branch protection:** tentativa histórica de ler required checks retornou 403. A6 foi projetada para preservar nomes/gates; não expandir o atalho a outros workflows sem verificar regras efetivas e cenários SQL/runtime/rename/estado incerto.
4. **Instrumentação local não é reprodutibilidade de CI:** A9 não executou como job limpo e obrigatório. O trace completo não está versionado, embora hashes e recorte estejam. Se uma nova investigação exigir o trace completo, gerar evidência nova, não fingir que o hash fornece o conteúdo.
5. **Produção vs testes:** Production READY comprova deployment, não sessão humana autenticada, nem p95, nem ausência de lentidão gráfica. Massas A8/A9 são sintéticas e pequenas/locais; comparar baseline/candidato no mesmo ambiente antes de fazer promessas.
6. **Não transformar texto histórico em autoridade atual:** A5/A6/A7 documentam estágios antes de merges; #478 foi reconciliado em seu **diff final de quatro Markdown**. Fonte de status é CURRENT_STAGE + GitHub no SHA novo.

## 10. Continuidade recomendada, sem inventar handoff ou executar automaticamente

**Fase documental desta entrega:** indexar esta auditoria em `CURRENT_STAGE.md`, `docs/README.md` e `STATUS_DOCUMENTOS.md`. Preservar os relatórios originais sem sobrescrevê-los. Não há implementação funcional autorizada por este documento.

**Retomada estratégica na ordem da #481** (requer escopo e decisão próprios):

- **Prioridade 1 — experiência real:** considerar separadamente (a) prontidão/estado após reload, Caso A #460; (b) atribuição visual do clique em ambiente gráfico/GPU representativos; (c) cobertura/IDs após commit em duas sessões. Formular hipótese testável, baseline comparável, contraprova e critério de parada. Não recombinar os três num hotfix.
- **Prioridade 2 — prevenção:** usar A7/#479 como padrão para **uma** fronteira real com JSDoc/TS e mutação negativa; Knip opt-in e triagem de ESLint. Não migrar todo JS nem apagar IIFEs.
- **Prioridade 3 — confiabilidade:** reutilizar #446/#447 como referências de hipótese, não como branches para merge integral; preservar exclusões, históricos, competências, RLS/Auth, resposta velha, idempotência, rollback e autoridade de escolas.
- **Prioridade 4 — CI proporcional:** manter #476/#477, não ampliar filtros sem required checks e risco; registrar tempo por workflow e custo de previews como dimensões separadas.
- **Oportunidades condicionais:** Fuse A8 (medir busca autenticada e invalidadores primeiro), Supabase Notebooks/Explorer/Health Advisors apenas leitura/estatísticas agregadas, Floating UI onde corte comprovado, eventualmente testes de acessibilidade de zoom/teclado/erro. Nenhuma IA documental, Worker, pgvector, nova arquitetura ou índice SQL nasce automaticamente dessa auditoria.

**Gates para qualquer correção de produto:** reproduzir em `main` atual, mapear superfícies e autoridade segundo [`SYSTEM_CANONICAL_MODEL.md`](../reference/SYSTEM_CANONICAL_MODEL.md) e [`PRODUCT_SURFACE_CATALOG.md`](../reference/PRODUCT_SURFACE_CATALOG.md), definir teste RED na camada correta, conferir fonte do dado + memória + DOM + reload, testar interleaving e contexto, comparar performance sem mudar runner, validar visualmente a tela renderizada e não apenas o build.

## 11. Índice primário para não repetir arqueologia

- Programa e mudanças de ordem: [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481).
- Base original de capacidades: [matriz A0 na branch datada](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/docs/audit-capacidades-pacotes-out2026/docs/audits/2026-10-22-capability-configuration-matrix.md); [oportunidades iniciais](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/docs/audit-capacidades-pacotes-out2026/docs/audits/2026-10-22-technology-opportunities.md).
- CLI/grants: [evidência e matriz 2×2](../evidence/2026-10-22-supabase-cli-grants/README.md), [GitHub Actions 39830514391](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39830514391).
- Reconciliação A0–A6: [auditoria anterior](2026-10-23-modernization-continuity-review.md), [A5 shadow](2026-10-23-a5-ci-shadow-rollout.md), [A6](2026-10-23-a6-lifecycle-ci-skip.md), [job documental 39906425278](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39906425278).
- TypeScript A7: [experimento de fronteira](2026-10-23-js-contract-boundary-experiment.md), [PR #479](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/479).
- Captura E2E: [diagnóstico do #480](2026-10-23-invoice-capture-viewport-diagnostic.md), [PR #480](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/480).
- A8 Fuse: [run 39990335333](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39990335333), [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481) (controle negativo, paridade e limites).
- A9: [original](2026-10-23-authenticated-capabilities-a9.md), [nativo](2026-10-23-save-interaction-native-timing.md), [evidência JSON do original](../evidence/2026-10-23-authenticated-capabilities-a9/summary.json), [seis execuções e trace](../evidence/2026-10-23-save-interaction-native/summary.json), [PR #482](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/482) e [issue #481, fechamento](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481).
- Segurança: [PR #483](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/483), [auditoria Zod](2026-10-23-zod-security-advisory.md), [security gate oficial](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/40030215114).
- Pendências **não resolvidas**: [#460 Caso A](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/460), [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446), [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447).

**Síntese para o próximo agente:** pesquisas A0–A9 não são backlog de upgrades; #482 encerrou instrumento, não desempenho. Não repetir provas dos merges #472/#475/#477/#479/#480/#482/#483 sem mudança material de SHA/risco. Prioridade é transformar problemas humanos demonstrados em correções pequenas e causalmente justificadas, preservando contratos financeiros, visual institucional e colaboração. Revalidar fatos voláteis antes de escrever.

