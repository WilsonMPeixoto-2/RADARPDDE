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
