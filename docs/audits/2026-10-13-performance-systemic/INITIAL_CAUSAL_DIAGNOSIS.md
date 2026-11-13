# RADAR PDDE — investigação sistêmica de lentidão (primeiro checkpoint)

**Data da análise:** 13/10/2026 (BRT).  
**Baseline lida:** `main@1a1cda117e31f84647bf4591e4d6db899ef231f1`, deploy Vercel `dpl_7EpjXqB1gtMSjijt3UWF23UUv7Zx` READY.  
**Natureza:** investigação histórica + revisão de código atual + SQL agregado, somente leitura em Production. **Nenhuma correção de runtime, migration, alteração de dados, instrumentação persistente ou experimento autenticado em Production foi executado nesta análise.**

## Questão investigada

A lentidão é **transversal**: login, abertura inicial, troca de competência, navegar entre páginas/abas, lançar bonificação, análise técnica, NF/Pendências, feedback após clique, estabilização visual e atualização em outras sessões. Não buscar hotfix de tela: localizar causas compartilhadas por caminho completo da interação até o dado canônico e a resposta na interface. Registrar controles negativos e não confundir redução de bytes com melhoria de uso.

## História causal confrontada

| Data/PRs | Evidência comprovada então | Proteção já implementada | Limites para a análise atual |
|---|---|---|---|
| 30/07, #113 | Auth redundante e bootstrap de 19 entidades, incluindo `audit_events` (2.741 linhas na época) | Auth deduplicada/paralela, seleção de entidades e leituras concorrentes | Não extrapolar a causa antiga para a implementação atual |
| 23–24/08, #190–#194 / ADR-046 | Escritas de avaliação gastavam tempo em leituras redundantes e reconstruções integrais, não só na gravação | Retorno autoritativo e atualização incremental onde possível | Analisar caminhos atuais que ainda forçam render integral |
| 19–21/09, #327–#341 | RLS linha a linha, refresh bloqueando escrita, invalidações perdidas e F5 | RLS set-based, fila de escrita independente, abort de leitura obsoleta, Broadcast com recuperação | Medir integração e custo sistêmico, não reinstalar proteções |
| 29/09, #396 e sucessores | 172–292 requests REST por competência; 5,69–9,50 s; 997 GETs em ~16 s depois de uma gravação | RPC agregada por competência; leitura por escola posterior | Essas medidas são de baseline histórica, não da Production atual |
| 02/10, incidente Production documentado em design #410 | Janela 15–15:59 BRT: 938 leituras globais, 325 escritas, 148 5xx, leitura média ~3,76 s, p95 ~10,70 s, 172 timeouts | #410 introduziu contexto por escola; #427 o aplicou em Dashboard/Carteira/Competências | A sobrecarga antiga está comprovada; frequência atual exige medição |
| 07/10, #427 | Sessão observadora passou de 8 leituras globais para 8 escolares; payload caiu de 133.356 para 53.351 bytes por observador | Redução da amplitude da leitura, sem nova regra de negócio | **A quantidade de renders manteve-se em 8**; redução de bytes não é prova de menos CPU/DOM |
| 11–13/10, #438 | Sete correções funcionais, algumas relacionadas a carregamento tardio e navegação | Integrado, CI/deploy verdes | Deliberadamente **não** encerrou investigação geral de performance |

Fontes:
- [Diagnóstico de login antigo](../../audits/2026-07-30-performance-login-restauracao-sessao.md)
- [ADR-046, decisão de atualização incremental](../../decisions/ADR-046-escritas-operacionais-incrementais-e-observaveis.md)
- [Histórico de sincronização 19/09](../../handoff/2026-09-19-performance-sync-modernization.md)
- [Design da simplificação #410](../../superpowers/specs/2026-10-04-operational-sync-simplification-design.md)
- [Prova pareada #427](../../evidence/2026-10-07-aggregate-school-sync/README.md)
- [Revisão independente 12/10](../2026-10-11-controller-journey/INDEPENDENT_REVIEW_2026-10-12.md)
- [Medição 13/10](../2026-10-11-controller-journey/FRESHNESS_COMPARISON_2026-10-13.md)

## Mapa atual de causas: diferenciar prova histórica de risco corrente

### C1 — Trabalho redundante ao abrir e trocar competência
**Classificação: mecanismo confirmado no código atual; repetição demonstrada em fixture; impacto em Production não medido.**

Em `src/application/data-service.js`, `bootstrap()` antecipa `queryOperationalContext(requestedCompetence)` antes de resolver a competência real do catálogo; se divergirem, `queryOperationalContext(resolvedCompetence)` é executada novamente. `startup-double-read-causal.json` confirma leitura 2026-09 descartada + leitura 2026-05, duas consultas globais, em quatro amostras de laboratório. Não afirmar que a divergência ocorre regularmente na Production.

Troca de mês usa `global-competence-selector.js`: bloqueia a área (`aria-busy`, `inert`) durante a leitura remota e só então reconstrói a view. Isso conserva coerência, mas faz a duração da leitura pesar diretamente na sensação de espera. Validar se há releituras adicionais concorrentes ou trabalho de renderização que prolonga a sensação de bloqueio.

### C2 — Custo das consultas amplas e seus disparadores
**Classificação: raiz comprovada do incidente 02/10; risco residual atual ainda não quantificado.**

A RPC `read_operational_context` continua necessária para login, troca de competência, fallback seguro ou contexto não isolável. `read_school_operational_context` reduz escopo quando há cobertura segura. Em leitura do `pg_stat_statements` de Production, acumulada desde reset de **17/09**: **14.176** chamadas globais, média **~1.006,7 ms**, máximo **~7.975 ms**; **907** chamadas escolares, média **~221,7 ms**, máximo **~4.081 ms**. Populações e períodos de uso são heterogêneos; **não é uma comparação controlada nem uma taxa diária nem prova de sobrecarga corrente**. Em duas observações entre ~00:22:06 e ~00:23:18 UTC de 14/10 houve **zero novas chamadas** de ambos os grupos. Não reflete uma jornada autenticada e ativa.

### C3 — Atualização pode ser adiada indefinidamente enquanto persistem eventos
**Classificação: mecanismo confirmado no código atual + reprodução controlada; impacto em cadência institucional real não medido.**

`operational-realtime-invalidation.js` limpa/reagenda a espera de **2 s** a cada evento novo. Sob atividade contínua, a próxima leitura pode ocorrer somente ao final da rajada. A prova 13/10 observou 44 commits, nenhuma perda final e até **~23,7–24,8 segundos** de atraso entre escrita e versão exibida nas sessões observadoras, em cenário de estímulo deliberadamente intenso. Isso foi reproduzido tanto na main pré-#438 como no candidato; **não é regressão do #438**. Não diminuir timers cegamente: maior frequência pode recriar tempestade de consultas e erros do incidente 02/10. A solução deve conciliar limite máximo de espera, carga admissível, prioridade da própria escrita e integridade.

### C4 — O navegador ainda pode atualizar/renderizar mais do que o necessário
**Classificação: pontos concretos no código, custo causal corrente ainda não medido ponta a ponta.**

`operational-context-refresh.js` chama `refreshCurrentView()` após atualização; `global-competence-selector.js` reconstrói a view na mudança de mês; `prontuario-conditional-reconciler.js` preserva render integral em casos específicos (ex.: `toggleBonif` de `notaFiscal`), conciliando os demais de forma localizada. Na prova pareada #427 o volume de dados caiu ~60%, mas **a quantidade de substituições principais do DOM permaneceu 8 por observador**. NÃO concluir que todos os renderizadores são lentos: medir em navegador completo custo de aplicação do estado, render/layout e confirmação visual, incluindo computador mais modesto.

### C5 — Escritas, trilha de auditoria e crescimento de dados
**Classificação: custo estrutural possível; ainda não demonstrado como causa de demora percebida.**

Em Production: `audit_events` **26.985** registros / **41.132.032 bytes** de tabela+índices; `administrative_logs` **12.219** / **7.790.592 bytes**; 3.163/2.209 novos eventos nos últimos 7 dias. Há **17 triggers** ativos chamando `capture_audit_event`, que registra JSON completo antigo/novo por operação; `track_functions=none` impede atribuir diretamente, pelas estatísticas atuais, o custo do trigger. Muitas ações decorrem de E2E/homologações, portanto NÃO tratar contagem como ritmo orgânico de usuários. O contrato `src/data/repository-contract.js` classifica auditoria técnica como manutenção e logs administrativos como consulta sob demanda. `repository-factory.js` restringe leitura administrativa a páginas padrão de 100 (máximo 200) por cursor. **Não há evidência de carregamento integral desses históricos no bootstrap normal atual**. Não apagar, desabilitar, amostrar ou reduzir trilha legal antes de provar impacto e preservação integral.

### C6 — Feedback de interação x tempo de commit
**Classificação: necessidade de prova integrada, não defeito global já localizado.**

A ADR-046 define resposta visual imediata, retorno autoritativo e atualização incremental. `operational-write-diagnostics.js` já instrumenta clique → feedback, RPC e aplicação → estabilização. A escrita de bonificação possui guarda para valor inalterado; não presumir ausência geral de idempotência. Ainda falta capturar sob a **mesma** sessão os tempos de bonificação, análise técnica, notas, Pendências, troca de mês, abas, navegação e login em dados representativos, distinguindo resposta visual imediata de confirmação definitiva do banco.

### C2-A — Gravação descarta a cobertura escolar e pode provocar releitura global
**Classificação: mecanismo de código confirmado na `main`; fallback real registrado em E2E; frequência/impacto sistêmico ainda não quantificados.**

`DataService.execute()` chama `invalidateSchoolOperationalCoverage()` **antes de cada escrita remota** (`data-service.js`, ~L935–L950). Essa operação cancela leitura escolar, zera a cobertura e incrementa sua geração. `loadSchoolOperationalContext()` exige cobertura anterior e, quando ela não existe, retorna `fallback: {kind:'global',reason:'MISSING_BASELINE_COVERAGE'}` (~L516–L547). O controlador de refresh, diante do fallback, chama `loadOperationalContext()` global (`operational-context-refresh.js`, ~L297–L303). A cobertura escolar é restabelecida após uma leitura global (~L777) ou outra trajetória explícita de reconciliação. Há comprovação desse fallback após escrita no [registro #427](../../evidence/2026-10-07-aggregate-school-sync/README.md), em que a leitura escolar abortada foi seguida de `MISSING_BASELINE_COVERAGE` e global.

Isso é **uma defesa correta contra conciliar fatias usando uma baseline obsoleta**, não uma autorização para preservar cobertura desatualizada. Porém, pode transformar a reação pós-gravação em leitura global, justamente em jornadas de alto volume de alterações. O diagnóstico prioritário é medir a relação entre: número de writes → invalidações de cobertura → respostas de fallback por motivo → chamadas globais → custo de rede/SQL/render; separar escrita local, escrita de outra sessão e mudança de competência. **Nunca remover o guard sem prova equivalente de cobertura completa, RLS, concorrência, deleção e reconvergência.**

## Hipótese integradora, ainda a refutar

O fator recorrente pode ser **amplificação de trabalho por evento**: um clique dispara persistência+auditoria, provoca invalidação/espera, releitura (às vezes global/fallback), aplicação de estado e redesenho da tela, em alguns caminhos repetidamente. Em picos, diferentes sessões multiplicam essas etapas; em navegação/troca de mês, a UI ainda aguarda a hidratação antes de ficar utilizável. Esta é uma **hipótese de interação entre camadas**, não comprovação de uma única causa universal; cada aresta requer medição/contraprova. Não substituir as salvaguardas de RLS, reconexão, identidade documental, patrimônio ou histórico por otimização improvisada.

## Próxima campanha de diagnóstico — execução sem novos hotfixes

1. **Baseline e representatividade:** congelar SHA/versão, usar `main` atual e um controle de laboratório com as mesmas migrations e dados anonimizados em volumes representativos; separar dia comum de rajada com 4 Controladores + Assistente + Dashboard, como design #410. Não escrever em Production.
2. **Uma mesma jornada do início ao fim:** registrar clique/feedback → solicitação/remoto → aplicação → render/layout → confirmação visível → persistência após reload, por ação: login frio/quente, alternar competências, abrir escola/aba, bonificação, análise técnica, NF, Pendência. Capturar dados de rede, contagem e volume de consultas, CPU/DOM, travamentos de interação, confiança visual e resultado.
3. **Isolar cada mecanismo por comparação pareada:** dupla leitura inicial (competência igual x divergente), leitura escolar x global, resposta autoritativa local x releitura realmente necessária, burst contínuo x cadência normal, histórico em volumes 1x/3x/10x **sem excluir nada**, render completo x reconciliado. Controles devem manter regras de negócio, conteúdo, Auth e RLS idênticos.
4. **Examinar o limite de espera da atualização:** verificar latência perceptível de sessões observadoras em cadência normal e no pico, evitando transformar controle de tempestade em espera ilimitada. Qualquer proposta precisa medir consultas SQL, 5xx, aborts, bytes e frescor simultaneamente.
5. **Classificar antes de implementar:** para cada hipótese, `comprovada na atual main` / `apenas histórica` / `refutada` / `ainda não medida`, com prova contra hipótese alternativa. Se duas correções exigirem mais timers/estado e não convergirem, parar e revisar o desenho, conforme ENGINEERING_METHOD.
6. **Evidência e gate de produto:** só então propor correções por mecanismos compartilhados; proteger seis superfícies e duas identidades em jornadas reais; mensurar ganho sem deslocar atraso para outra etapa, preservando integridade, histórico, acessibilidade e autorização.

### Premissas / limites desta rodada
- Foram revisados fonte atual e documentos, e executadas somente consultas SQL agregadas de leitura em Production. Não houve navegação operacional autenticada em Production, perfil visual completo nem stress.
- `pg_stat_statements` acumula dados de versões antigas do runtime e testes; não atribuir médias à release atual.
- Comparações antigas de desempenho podem refletir infraestrutura descartável, fixture ou revisão mais antiga; citar proveniência antes de comparar.
- Um workflow verde comprova as condições testadas, não a fluidez cotidiana.
- Não propor remover auditoria legal, alterar timers, implantar cache agressivo, reescrever frontend, mudar tamanho da instância ou relaxar políticas sem resultado causal.

---

## Segundo checkpoint — teste de custo das leituras e auditoria — 13/10/2026

**Somente leitura.** Logs do Supabase (janela móvel 24 h, contendo usuários e CI/testes) e SQL agregados em Production; confronto com GitHub Actions run [38427914654](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38427914654), candidato PR438 SHA `61e93b7f`. **Não afirmar que os números isolam o deploy da main nem que toda consulta geral é desnecessária.**

### Medição recente (Supabase Edge, respostas HTTP 200)

| Operação | Chamadas | Média | Mediana | p95 | >1s | >3s |
|---|---:|---:|---:|---:|---:|---:|
| Contexto global | 1.102 | 545,8 ms | 412,5 ms | 1.263,5 ms | 88 | 11 |
| Contexto por escola | 352 | 230,6 ms | 164 ms | 507,2 ms | 5 | 2 |
| Salvar avaliação | 549 | 229,9 ms | 158 ms | 611,8 ms | 6 | 1 |

Há mais **1 HTTP 502 global** (1.103 tentativas totais). Dados são de população e carga heterogêneas, não benchmark controlado. Contadores cumulativos do banco não cresceram no intervalo quieto observado entre 00:22–00:31Z de 14/10: 14.176 globais, 907 escolares (epoch desde 17/09). Evitar generalizar tempestade atualmente em curso. O log horário mostrou movimentos fortes durante janelas compatíveis com execução de testes, cuja autoria não pôde ser isolada sem credenciais/identificadores adicionais.

### Novo elo estrutural: duas escolas conhecidas podem gerar leitura global

A rotina atual `operational-realtime-invalidation.js` define `scheduledSchoolId` e, se receber outro evento com `schoolId` distinto enquanto o cronômetro de 2 segundos está ativo, promove o pedido para **escopo global**. Reinicia o cronômetro a cada novo aviso. Esse fallback é proposital e protege consistência, mas pode anular a leitura escolar sob múltiplos Controladores trabalhando em escolas diferentes, o cenário institucional normal. Em Pendências e algumas views não cobertas, `decideInvalidationAction` também escolhe global; **não é automaticamente bug**.

Os testes unitários gerais verificam coalescência de eventos sem `schoolId`; falta caracterização pareada específica de A+A versus A+B, normal versus rajada, escola mesma ou outra, com métricas de custo/fluidez. Não remover essa proteção sem alternativa causalmente demonstrada.

### Contraprova do ensaio longo #438 — 1.107 ações e seis sessões

Artefato real `pr438-final-operational-comparison.zip`, `comparison.json`, run `38427914654`. Controle/candidato: mesmas 1.107 escritas bem-sucedidas, convergência final e recuperação de reconexão.

| Indicador | Controle | Candidato | Resultado |
|---|---:|---:|---|
| Bytes lidos | 31.890.661 | 10.650.253 | -66,6% |
| Tentativas de leitura | 26 | 64 | +146,2% |
| Leituras abortadas | 1 | 41 | maior trabalho descartado |
| Tarefas longas do navegador | 161.563 ms | 161.848 ms | praticamente iguais |
| Tempo agregado SQL | 14.963 ms | 17.045 ms | +13,9%, janelas distintas |
| Tempo total do ensaio | 455.698 ms | 459.991 ms | +0,9%, sem ganho global |
| Frames com opacidade esmaecida | 757 | 0 | benefício visual |

**Interpretação:** houve menos tráfego e menos esmaecimento, **mas não melhora comprovada do tempo total ou das tarefas longas**. Essa é uma contraprova de simplificação incompleta, **não** demonstra regressão de #438 no uso institucional. A carga do ensaio é artificialmente intensa; as medições de SQL e navegador não abrangem as mesmas janelas perfeitamente. Um ensaio anterior (run `38356122131`) teve resultados de CPU piores ainda, reforçando variabilidade e necessidade de rodadas controladas. Não usar os números como SLO de Production.

### Auditoria: conclusões delimitadas

- `audit_events`: 26.985 linhas / 39 MB; `administrative_logs`: 12.219 linhas / ~7,8 MB. Picos de 2.269 auditorias em 02/10 e 1.558 em 09/10. Não projetar esses picos como crescimento orgânico diário.
- **23.473 atualizações históricas** examinadas: **0** casos com snapshot `old_record = new_record` ou `changed_fields` vazio. Não há evidência de massa de updates sem alteração de dados. Isso não mede o custo de snapshots antigos/novos.
- A função `capture_audit_event()` guarda ambos os snapshots JSON em UPDATE, sob 17 triggers ativos. `track_functions=none` e `pg_stat_statements.track=top` impedem atribuição direta do custo de trigger. Não imputar lentidão à auditoria sem microbenchmark comparável e sem sacrificar o histórico.
- Todos os **3.163 eventos de auditoria dos últimos sete dias** têm `request_id` nulo. O registro de autor continua independente, mas não é possível agrupar diretamente por requisição usando esse campo. Preferir correlação efêmera no ensaio isolado; não mudar logs de Production por hipótese.

### Outro limite das medições atuais: `stable` não é pintura final

`prontuario-conditional-reconciler.js` marca `stable` no callback de **um `requestAnimationFrame`** (ou microtask no fallback). Isso não certifica que pixels foram pintados, que alterações secundárias terminaram nem que a tela está responsiva. `clickToStable` interno é útil, mas insuficiente para aferir a experiência humana. Validar nos próximos ensaios com estado visual concreto, duas frames, janelas de observação e screenshots/traces, sem confundir confirmação imediata de clique com commit remoto final.

### Experimentos necessários antes de qualquer código funcional

1. Comparar uma operação de bonificação com feedback→commit→atualização, com e sem evento Realtime posterior, segregando consulta escolar/global.
2. Reproduzir `execute -> invalidateSchoolOperationalCoverage -> Broadcast -> MISSING_BASELINE_COVERAGE -> global` no Supabase descartável; diferenciar reconciliação legítima da amplificação dispensável.
3. Testar coalescência A+A, A+B, A+B+C sob cadência humana e stress, verificando latência visual máxima e consultas globais em cada superfície autorizada.
4. Medir abertura fria/quente, troca de competências diversas, análise técnica, bonificação, alternância de abas e Prontuário com dados representativos, CPU, DOM, bloqueio visual e tempo até persistência verificada.
5. Comparar volumes históricos 1x/3x/10x em **banco descartável**, com auditoria integral ativada; nenhum write/load stress em Production.
6. Não declarar ganho até comparar bytes, SQL, CPU, render, experiência visível, correção funcional e recuperação de erros **na mesma jornada**. Se o remédio desloca a espera para outra fase, parar e rever o desenho.

**Status:** checkpoint documental. Não altera sistema, permissões, Supabase, migrations, produção ou workflows.


### Teste direto dos índices do histórico (sem alteração de dados)

`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` em Production, executando apenas SELECT com saída agregada do plano, sob o papel da ferramenta (não é prova do plano RLS de um Controlador):

- `administrative_logs ORDER BY event_at DESC,id DESC LIMIT 101`: **0,319 ms**, `Index Only Scan` no `administrative_logs_event_cursor_idx`, **101 linhas**, 8 páginas em cache, zero leitura de disco. O mecanismo de paginação eficiente é real, não apenas intenção documental.
- `audit_events ORDER BY occurred_at DESC LIMIT 100`: **19,345 ms**, `Seq Scan` em **26.985 linhas** + sort, ~4.365 páginas de cache tocadas. Não existe índice genérico ordenado por `occurred_at` apenas; existem índices por `actor_user_id + occurred_at` e `table_name + record_id + occurred_at`. A consulta genérica é um **risco prospectivo de manutenção** à medida que crescer, mas **não há evidência de que seja executada na abertura normal ou explique a lentidão corrente**.
- `pg_stat_statements` indica 27 consultas REST a `administrative_logs` filtradas por escola, média ~34,8 ms (estatísticas acumuladas desde 17/09, não 24h); os maiores tempos ligados a `audit_events` são verificações de hashing/cópia de todo o banco (backup/auditoria técnica), que **não devem ser confundidas com gestos de usuários**.

**Veredito:** manter a paginação atual e não incluir índice novo só para otimizar um SELECT hipotético. Primeiro inventariar os consumidores reais de `audit_events`; somente criar índice ordenado por data se houver consulta de manutenção ou acesso humano que o justifique, com teste de custo de INSERT/UPDATE e retenção. O crescimento do histórico exige governança, mas não há prova de que seja a raiz principal da lentidão do produto.



## Terceiro checkpoint — causa metodológica recorrente e UX de confirmação

**Lacuna de representatividade comprovada:** `docs/handoff/evidence/2026-09-21-performance-journeys.json` registra explicitamente: *“Troca de competência não foi medida: fixture expõe somente Maio/2026.”* O E2E `tests/e2e/performance-journeys.spec.js` usa Supabase local e mede login, navegação e avaliações, mas seus números não certificam alternância entre meses. Antes de selecionar correção de `global-competence-selector.js`, criar ensaio real com vários meses autorizados, alternância repetida mês A→B→C→A, volumes desiguais e banco representativo, preservando filtros/rota e os resultados mostrados.

**Observabilidade da resposta visual:** `operational-write-feedback.js` já marca controle `aria-busy` e estilo pendente durante evento de clique/change; `prontuario-conditional-reconciler.js` remove estilo pendente após reconciliação. Logo, não inferir ausência geral de feedback olhando somente para demora pós-salvamento. Entretanto, a lista `SAVE_SUCCESS_MESSAGES` possui confirmação explícita para `verification:set-bonification`, não para `verification:set-technical-analysis`; a análise pode ter outro feedback na UI legada. **Verificar por screenshot/DOM e testes autenticados**, não criar toast duplicado sem confirmar.

**Trabalho de navegador além de rede:** `src/integration/` contém pelo menos 14 arquivos que mencionam `MutationObserver` (diversas superfícies, nem todos necessariamente ativos simultaneamente). Sob atualizações extensas, múltiplos observadores/enhancers podem reagir à mesma substituição de DOM, mas a ocorrência/custo ainda não está quantificada. O benchmark #438 mede ~161,8 s de tarefas longas agregadas entre seis sessões, porém não identifica qual componente as causou. Só priorizar observers mediante perfil de CPU/long tasks relacionado ao evento real e prova de que sua remoção/coalescência preserva navegação, filtros, acessibilidade e ações.

**Matriz de evidência obrigatória antes de correções:**
- Login: tempo desde clique até primeiro Dashboard **realmente utilizável**, frio/quente; medir 1 ou 2 consultas gerais e duplicações condicionais.
- Troca de mês: tempos A→B/B→C/C→A + consultas, reaplicação de estado, bloqueio e pixels estáveis; fixture com 3 competências diferentes.
- Bonificação e análise técnica: clique→feedback imediato→RPC→aplicação→pintura→reload persistente, incluindo estados de erro e concorrência.
- Navegação/abas: repetição sem chamadas remotas desnecessárias; atraso síncrono (CPU/DOM) separado de banco.
- Sincronização: duas escolas diferentes, diferentes perfis e várias cadências; tempo máximo até outras sessões exibirem a alteração, não só convergência final.
- Crescimento dos históricos: medir custo de gravação/autorização e consultas administrativas nas escalas 1x/3x/10x em base descartável; nenhum efeito sobre a Production durante a investigação.

**Critério de parada:** não aceitar uma sequência de hotfixes que ganhe velocidade em apenas uma tela; exigir comparação transversal antes/depois e um teste durável que falhe se a causa-raiz voltar. A própria indisponibilidade da métrica (como troca de competência no relatório de 21/09) é uma lacuna a corrigir na estratégia de teste, não motivo para concluir que aquele fluxo já está rápido.

---

## Quarto checkpoint — reprodução automatizada e priorização de CPU — 13/10/2026 BRT

### Testes adicionais **executados**, sem alteração funcional

PR [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447), branch `test/perf-school-event-coalescence-20261013`, só adiciona `tests/unit/systemic-performance-characterization.test.js`. CI [`Validar RADAR PDDE` run 38492452052](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38492452052) **sucesso**; downloaded o artifact `unit-tests-report` 11862765397, abri `unit-tests.xml` e conferi **3 casos executados, 0 falhas**:

1. Avisos A+A com 1 segundo de intervalo → **uma atualização escolar**, disparada no segundo 3.
2. Avisos A+B com 1 segundo de intervalo → **uma atualização global**, disparada no segundo 3, apesar de os dois eventos trazerem escola conhecida.
3. Avisos A repetidos em t=0,1,2,3,4s → **nenhuma atualização até t=6s**. A ação original precisou aguardar 6s mesmo com janela nominal de 2s.

Os testes usam scheduler/relógio determinístico e o controlador **real** de Realtime, mas substituem a rede pelo registro de solicitações. Esses resultados **provam a política de agendamento atual**, NÃO o atraso de 6s no navegador real nem que a política seja segura para ser alterada sem ensaio integrado. São caracterizações temporárias, não padrões desejados de produto.

### Atenção: trabalho excessivo concentra-se nas sessões que fazem lançamentos

Inspecionei os artefatos originais dos ensaios de seis sessões em 13/10, sem depender de sumário anterior:

- Run [38427914654](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38427914654), `operational-comparison-38427914654`: **96,5%** do tempo agregado em tarefas longas da variante candidata está nas três sessões que fizeram **1.107 lançamentos** (156.138 ms dos 161.848 ms). Na variante controle, **98,2%** (158.575 de 161.563 ms).
- Run [38356122131](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38356122131): na candidata, **97,6%** (158.198 de 162.095 ms); no controle, **97,7%** (73.084 de 74.827 ms).
- No run mais recente, cada sessão escritora somou aproximadamente **50–54 segundos** de tarefas longas durante todo o experimento. As três observadoras, que não gravavam, somaram aproximadamente **1–2 segundos cada**.

**Limites:** seis navegadores, carga sintética de 400 rodadas, instrumentação, servidor de teste e perfis desiguais; a concentração é **correlação de sessões escritoras**, não custo por salvamento nem prova de regressão atual. Ainda assim, é um sinal forte para priorizar **aplicação de estado, componentes/observadores DOM, renderizações e feedback visual no navegador escritor**, sem abandonar investigação de SQL.

### Repriorização causal baseada nos dados

**Frente principal:** medir *um lançamento real* (bonificação e análise técnica) com CPU profiler, número de renderizações/DOM e cronograma clique→feedback→commit→pintura, controlando sequência/volume, antes de qualquer otimização. O próprio benchmark mostrou que baixar bytes em ~67% sem reduzir o trabalho de renderização não trouxe ganho global demonstrado.

**Frente concomitante:** testar o agendamento multi-escola A+A versus A+B nas condições de quatro Controladores, garantindo frescor máximo e custo SQL controlado. Um simples encurtamento do timer de 2s não resolve que múltiplas escolas conhecidas são tratadas como consulta global.

**Frente de resguardo:** preservar cobertura segura depois das escritas, recuperações e política conservadora em perdas de eventos; evitar cache/reuso inválido. O mecanismo `invalidateSchoolOperationalCoverage()` no início de `DataService.execute()` explica a rota de fallback existente, mas a proporção de operações que percorre essa rota permanece por medir.

**Históricos:** resultado negativo parcial para hipótese de “27 mil eventos carregados em toda tela”; auditoria paginada funciona e não há UPDATE de auditoria com snapshots idênticos. `audit_events` ainda requer ensaio de crescimento 1x/3x/10x fora de Production, mas não merece ser removida nem tratada como causa principal sem contraprova.

### Escopo efetivo realizado até aqui

- Código atual e histórico confrontados.
- Logs recentes de Production consultados somente por leitura.
- Índices e planos de consultas read-only avaliados.
- Dois artifacts originais do Codex reabertos e verificados.
- Testes diagnósticos reproduzidos e confirmados por JUnit no PR #447.
- **Não houve** navegação autenticada de Controlador em Production, reprodução real de CPU/DOM por clique, fixture de três competências nem stress histórico 10x; esses são os próximos ensaios, não conquistas alegadas.


---

## Quinto checkpoint — contagem dos avisos e custo residual fora dos timers

Foram obtidos e examinados os **artefatos brutos** do run [38427914654](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38427914654): `operational-metrics-candidate-38427914654` (artifact id `11830622134`) e `operational-metrics-baseline-38427914654` (`11831505131`). Valores abaixo extraídos de `operational-sustained/{candidate,baseline}/session-report.json`, NÃO apenas do comparador.

**Caracterização candidata na carga artificial de 1.107 escritas:**
- Cada uma das seis sessões recebeu ~**1.407–1.408 Broadcasts** (incluindo 300 relativos a despesas). É uma carga deliberadamente muito acima da rotina usual do Controlador.
- Sessão escritora 1: **409 atualizações agendadas**, **6 tentativas efetivas**, 17 leituras abortadas, **51,591 s** de tarefas longas.
- Sessão escritora 2: **601 agendamentos**, **18 tentativas efetivas**, 24 leituras abortadas, **54,331 s** de tarefas longas.
- Sessão escritora 3: **401 agendamentos**, **1 tentativa efetiva**, **50,216 s** de tarefas longas.
- Sessão observadora 6 (Dashboard): **1.408 atualizações agendadas**, **5 tentativas efetivas**, **1,889 s** de tarefas longas.

Essas contagens fornecem uma prova **mais específica** do efeito dos timers de adiamento: o aviso é recebido/agendado inúmeras vezes, mas as leituras efetivas ficam concentradas em intervalos de quietude. A consistência **final** foi comprovada no benchmark, mas a **rapidez com que cada alteração aparece durante a sequência** não foi certificada. Essa distinção é essencial para uma operação administrativa em que “parece que não salvou” é problema de uso.

**O trabalho de CPU não se resume ao render principal:** nas três sessões escritoras candidatas, o tempo agregado das tarefas longas foi ~**156,1 s**, enquanto `applyRemoteState` mediu ~**25,1 s** e `renderProntuario` mediu ~**4,7 s**. Os relógios têm escopos e possíveis sobreposições diferentes: **não subtrair os valores como parcelas exclusivas**, nem atribuir o restante automaticamente a observers. Esses dados demonstram a necessidade de **captura de perfil de CPU** do navegador escritor com atribuição por função, incluindo execução de eventos, geração/aplicação de estado, DOM observers/enhancers, layout, performance probes e trabalho do próprio navegador.

**Próximo ensaio decisivo:** perfil do navegador por janelas de 5–10 gravações e navegação A→B→C, com ferramenta nativa Chromium/Playwright, em massa descartável calibrada. Registrar **tempo de feedback, tempo de persistência, tempo de pintura, contagem de consultas escolares/globais, tarefas longas atribuídas a funções e confirmação após reload**. Depois ensaio de seis sessões com carga *humana* (pausas entre ações), não apenas 400 rodadas intensas. O objetivo é discriminar raiz CPU/UI vs SQL e timer sem criar novas camadas de sincronização.


---

## Sexto checkpoint — ensaio multicompetência preparado (resultado ainda pendente)

O PR [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) foi ampliado, **sem mudanças em runtime/SQL de negócio**, com o teste Playwright `tests/e2e/operational-multi-competence-performance.spec.js` e uma etapa dedicada no workflow `.github/workflows/operational-real-usage-gate.yml`. O teste usa a fixture descartável já existente, que contém **dez competências, 163 escolas e 430 vínculos escola-programa**. Faz login como Controlador sintético, abre a mesma escola, alterna **agosto→setembro→outubro→agosto→setembro→outubro** e registra, por mudança: espera até interface liberada, quantidade/escopo das RPCs, tarefas longas de navegador, alterações do DOM e ausência de erro. Preserva dados institucionais e não escreve em Production.

O teste roda **depois de o workflow preservar as métricas SQL do teste sustentado**, evitando contaminar a comparação já existente. Resultado em `test-results/operational-sustained/multi-competence-{baseline,candidate}.json`, artifact `operational-metrics-*`. O workflow `Uso real operacional com volume semelhante a Production` foi iniciado no SHA `d6c1a752991532d92e7620f55fb93f1c305ec39e` (run `38493158276`), mas estava **pending** na última consulta deste checkpoint. **Não declarar tempos, aprovação visual ou melhoria até ler os arquivos gerados e verificar ambos os trabalhos do CI.**

No SHA anterior do PR #447, três testes determinísticos de Realtime foram executados no CI e confirmados individualmente no JUnit (run 38492452052, sem falhas). Após a inclusão do teste de navegador, é necessário revalidar esse novo SHA. O PR segue em Draft: caracterização e medição, não correção de performance.

**Ação seguinte ao obter os artifacts:** comparar mês 08 (mais dados) com 09/10 (menos dados), ida e volta e baseline/candidate, sem inferir ganho com uma única amostra; classificar eventuais RPC duplicadas e long tasks por componente. Se a versão baseline divergir funcionalmente, registrar limite em vez de suavizar o teste.

---

## Sétimo checkpoint — resultados de multicompetência, falha induzida pelo próprio teste e raiz identificada nas NFs (13/10 BRT, 14/10 UTC)

### O que os testes realmente mediram

Workflow `Uso real operacional com volume semelhante a Production`, run [38493158276](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38493158276), em duas pilhas Supabase **descartáveis** distintas (baseline/candidate). Ambos os jobs dos navegadores concluíram **success**; a etapa final de comparação concluiu **failure por artefato ausente**, explicado abaixo. Os artifacts do run foram baixados e comparados diretamente; os testes de alternância passaram.

| Mês / abertura | Baseline | Candidate | Chamadas globais em ambas | Recriações principais por troca |
|---|---:|---:|---:|---:|
| Agosto 1ª | 377 ms | 526 ms | 1 | 1 |
| Setembro 1ª | 349 ms | 385 ms | 1 | 1 |
| Outubro 1ª | 339 ms | 288 ms | 1 | 1 |
| Agosto 2ª | 375 ms | 380 ms | 1 | 1 |
| Setembro 2ª | 345 ms | 293 ms | 1 | 1 |
| Outubro 2ª | 365 ms | 299 ms | 1 | 1 |

- O teste usou três competências com volumes diferentes, dentro de um ambiente com 163 escolas e 430 vínculos; autenticou Controlador sintético e abriu a mesma escola.
- **Nenhuma multiplicação de RPC por troca nesse cenário**; seis RPC globais em seis alternâncias. Cada mudança recriou a raiz do Prontuário **uma vez**, e gerou **112–116 registros de mutação do DOM**. Registros de mutação não são 112 redesenhos completos; a raiz mudou uma vez.
- Todas as transições medidas ficaram abaixo de 600 ms, inclusive com instrumentação; as diferenças entre duas versões não são estáveis por mês ou um ganho geral demonstrado. Isso **não reproduz** a lentidão percebida em condições institucionais: navegador CI rápido, único Controlador, poucos minutos, sem atividade concorrente no momento da troca; a interface deveria ser perfilada também em hardware similar ao equipamento de trabalho.
- Agosto tinha mais registros que setembro/outubro na fixture, mas não houve crescimento monotônico da duração; **não inferir correlação simples de tamanho de mês com atraso** a partir desta amostra.

### Causa-raiz isolada de um *fluxo*: notas fiscais fazem reconstrução integral

No produto atual, `app.js`, função `salvarDadosNota`, após `radarInvoiceService.save()` ou `saveUnidentifiedExpenseWithPendency()`, chama `rebuildOperationalIndexes()` e, depois de fechar modal, chama **`renderProntuario(escolaId)`** (~L11653 e L11663). `renderProntuario` executa `container.innerHTML = ...` (~L9580), reconstruindo a raiz da view inteira; a proteção `prontuario-conditional-reconciler.js` é voltada para handlers de bonificação/análise, não transforma automaticamente esse caminho de salvamento de NF em patch localizado. No artifact bruto do ensaio com seis sessões ([run 38427914654](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38427914654)), sessão escritora de NF teve **300 escritas, 301 aplicações, 301 chamadas de renderização principal e 301 substituições de `main-container`**. Em contraste, escritores de avaliação tiveram **406/401 escritas**, **409/402 render calls**, mas somente **3/1 substituições principais** no candidato, indicando reconciliação parcial já eficaz nos seus caminhos. A sessão de NF gerou **35.518 mutações observadas** durante o ensaio e 54,3 segundos agregados em long tasks, mas não é possível atribuir esses 54,3 s exclusivamente à reconstrução, porque outros trabalhos e instrumentos ocorrem no mesmo processo.

**Veredito delimitado:** reconstrução integral pós-NF é uma causa **comprovada de trabalho evitável potencial**, não necessariamente de lentidão perceptível máxima; otimização requer inventário de dependências (resumo da escola, bonificação, verificação técnica, pendências, patrimônio, Assessoria, F5, aviso/scroll/foco) e um teste visual+funcional que demonstre quais regiões devem mudar. Não tirar o `renderProntuario` nem trocar por `innerHTML` parcial às cegas.

### Erro introduzido pelo harness de benchmark, não por RADAR

Na primeira tentativa, foi acrescentado segundo comando Playwright ao mesmo job. Por padrão, cada invocação limpa `test-results/` antes de iniciar. A segunda execução apagou `operational-sustained/{baseline,candidate}/session-report.json` que a primeira havia gravado. Portanto, os dois E2Es passaram, mas o comparador final falhou com `ENOENT: .../operational-sustained/baseline/session-report.json`. O artifact pequeno `operational-metrics` tinha somente o novo JSON multicompetência. **Não confundir CI vermelha com regressão do RADAR**; não houve bug funcional detectado por esse comparador.

Causa foi localizada nos logs do job `115629028303`; foi corrigida **somente a invocação do segundo teste**, agora com `--output=playwright-results-multi-competence` (fora de `test-results/`). Esse isolamento de resultados **não altera qualquer código funcional**, preservando os arquivos do primeiro ensaio. Correção no commit `13538fbb00b4225b18bedc8e45308f7226389b59` do PR [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447); nova execução workflow [38495224625](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38495224625) iniciada. **Aguardar evidência real da comparação; não declarada aprovada neste checkpoint.**

### Plano causal dirigido, antes de mexer em runtime

1. **Notas fiscais:** caracterizar via trace Chromium a parcela de `renderProntuario` pós-salvamento, efeitos colaterais de reconstrução e listeners/observers disparados, comparando NF nova/editada/excluída, despesa a identificar com Pendência, serviços/Assessoria e permanente/patrimônio. Guardar screenshots e invariantes por ação.
2. **Bonificação/análise:** perfil de CPU da própria gravação, incluindo `applyRemoteState`, reconciliação, indexação `rebuildOperationalIndexes`, estilos, DOM e pós-clique. Comparar com caminho NF como controle; não generalizar a lentidão de um para o outro.
3. **Competência:** testar na mesma escola com tráfego de mais de uma sessão, CPU do equipamento mais lento, filtros e rota; não abrir um hotfix com base em <600ms no CI, tampouco considerar fluxo certificado.
4. **Realtime:** capturar custo e frequência de fallback global de múltiplas escolas em rotina humana; preservar invariantes de consistência e evitar timer arbitrariamente mais curto.
5. **Governança:** a falha do comparador foi autoinduzida por teste: a correção é isolar outputs e validar artifacts, não reabrir o produto. Impedir que esse incidente crie loop de PRs de reparação de harness.


---

## Oitavo checkpoint — repetição homologada e perfil de CPU direcionado (13/10 BRT)

### Repetição integral aprovada — workflow 38495224625

A execução [38495224625](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38495224625) terminou **success** após isolamento dos diretórios de resultado do Playwright. **Ambas as variantes** e o comparador concluíram verdes; os artifacts passaram a conter `session-report.json` + medições multicompetência sem sobrescrita.

Artefato: `operational-comparison-38495224625` (artifact id 11864340261, `comparison.json` + `comparison.md`), obtido e lido integralmente nesta rodada.

**Carga idêntica:** 400 rodadas; 1.107/1.107 gravações bem-sucedidas em ambas as versões, validação de convergência final, reconexão real, autorização em Supabase local e screenshots do experimento. Comparação mais importante:

| Indicador | Baseline | Candidate | Interpretação |
|---|---:|---:|---|
| Bytes de consultas | 31.890.681 | 10.646.972 | -66,61%; **ganho de tráfego** |
| Tentativas de leitura | 26 | 57 | +119%, leituras abortadas crescem 1→37 |
| Atualizações de estado | 1.131 | 1.126 | -0,44%: trabalho quase igual |
| Reconstruções principais de DOM | 324 | 319 | -1,54%; pouca mudança |
| Mutações observadas de DOM | 94.445 | 87.507 | -7,35% |
| Tarefas longas do navegador | 1.820 | 1.841 | +1,15% |
| Tempo acumulado de tarefas longas | 159.061 ms | 161.469 ms | **+1,51%**, sem ganho CPU demonstrado |
| Tempo total do experimento | 459.969 ms | 458.427 ms | -0,34%, semelhante |
| SQL concluído acumulado no ensaio | 17.228 ms | 10.092 ms | -41,42%, períodos de coleta não idênticos |
| Frames esmaecidos | 754 | 0 | melhoria visual real |

**Reafirmação:** redução de SQL/bytes **não provou** redução do custo percebido ou do trabalho do navegador; +1,51% tampouco prova regressão, considerando variabilidade/teste artificial. Comparador registra explicitamente `diagnostic-comparison-complete` / `not-established` para limiares, e diferença de frescor durante atividade ainda não medido. A transferência de custo para CPU/DOM precisa ser perfilada, **não inferida só pela soma de long tasks**.

### Conexão entre reconstrução do Prontuário e diversas camadas de interface

Inspeção da versão `main` mostrou que vários módulos instalam `MutationObserver` em `#main-container` ou no `document.body`, reagindo a inserções/remoções de elementos, com funções de navegação, realce visual, Pendências, seleção de competência, retornos contextuais e painel. Exemplos concretos:
- `src/integration/navigation-context.js`: `ensureBackButton()` em mudanças do container;
- `src/integration/global-competence-selector.js`: `removeLocalCompetenceControl()` em alterações;
- `src/integration/task-9-cross-view.js`: `syncDrawerDockState()` ao detectar mutação de subtree;
- `src/integration/painel-controlador-expressiva.js`: agenda enhancer em alterações da página;
- `src/integration/task-10-11-pendency-actions.js`: agenda enhancement com requestAnimationFrame;
- `src/integration/evaluation-retification-ui.js`: agenda decoração após mutação;
- `src/integration/operational-context-refresh.js`: observa alterações relevantes quando há refresh pendente.

**Apenas a existência desses observadores não demonstra custo excessivo.** Alguns verificam a view antes de agir ou agrupam eventos por frame. Entretanto, uma substituição integral de `main-container.innerHTML` dispara o trabalho dos observadores que estiverem ativos; a combinação é candidata a **amplificação da reconstrução**. Na jornada de NF, há 301 substituições principais para 300 operações na variante candidata. Precisa-se de **CPU profiler por função** e de captura de elementos efetivamente reconstruídos para diferenciar observadores baratos de caminhos dispendiosos.

### Experimento novo instrumentado, ainda não certificado

O [PR #447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) ganhou:
- `tests/e2e/operational-write-cpu-performance.spec.js`, para comparar **três operações reais** em mesmo banco descartável e uma escola: avaliação de bonificação (Não→Sim), análise técnica (sem pendência) e cadastro de NF de consumo;
- Instrumentação Chromium `Profiler` para amostras de CPU por função, long tasks, mutações DOM, substituição de container, solicitações REST, tempo até mudança **visível e gravada**, screenshots por ação;
- Execução adicional do teste de CPU após a comparação sustentada e a troca entre meses, com `--output=playwright-results-write-cpu`, sem excluir `test-results/operational-sustained` do comparador. Relatório sanitizado `cpu-write-{baseline,candidate}.json`.

**Limitação deliberada:** somente um clique por ação em cada variante, infraestrutura CI, perfis sem dados reais. Não usar seu tempo para estabelecer SLO de Production. Caso os resultados sejam estáveis, expandir para 3–5 amostras e falhas/revisões de fluxo. O workflow correspondente ao SHA `87c69fb...` foi acionado (run `38496306947`), mas sua conclusão **ainda não foi verificada** neste checkpoint. Não declarar que CPU profiler executou com sucesso até ler artifacts e validação.

**Prevenção de loop:** a correção anterior de harness foi demonstrada pelo workflow verde. Se novo teste CPU falhar, localizar se é fluxo legítimo não previsto, instrumento inconsistente ou regressão **antes** de propor mudanças no produto. Não retirar reconciliação segura, controle de permissões, auditoria ou invalidação por escola para satisfazer métricas.
