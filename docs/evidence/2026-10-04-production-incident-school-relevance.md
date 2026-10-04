# Incidente real de 02/10/2026 e relevância por escola

## Objetivo

Este documento inicia uma frente limpa a partir da `main` pós-#408. O PR #407 permanece como laboratório e fonte de evidências; esta frente só deve incorporar correções cuja utilidade seja demonstrada contra o comportamento real de Production.

A hipótese de relevância por escola é importante, mas **não é considerada explicação única nem suficiente** para os incidentes. O trabalho continua investigando causas adicionais e efeitos em banco, navegador, autenticação, retry, concorrência e renderização.

## Evidência herdada do #407

O #407 já demonstrou que:

- reduzir leituras dos usuários que escrevem não basta se observadores passivos passam a reler contexto completo com frequência;
- o candidato antigo reduziu tentativas/aborts, mas aumentou payload, SQL e reconstruções de DOM;
- uma classe de flicker do Prontuário foi causalmente ligada à reconstrução do painel com reaplicação de animação;
- leituras lentas e eventos concorrentes podem abrir janelas temporais que geram trabalho adicional;
- testes verdes não bastam quando preservam uma implementação histórica em vez do requisito operacional.

Essas evidências serão reutilizadas. Não haverá repetição indiscriminada da bateria inteira do #407.

## Uso operacional real informado pelo produto

O pico relevante não é normalmente composto por vários Controladores na mesma escola.

O padrão real é:

- aproximadamente seis pessoas podem trabalhar ativamente ao mesmo tempo em períodos de pico;
- cada Controlador trabalha predominantemente nas escolas que lhe foram atribuídas;
- dois Controladores atuando exatamente na mesma escola ao mesmo tempo é possível, mas altamente improvável;
- Controlador e Assistente de Verbas Federais na mesma escola é um cenário real e importante, inclusive quando a Assistente faz uma correção que o perfil de Controlador não pode executar;
- todos continuam autorizados a acessar as escolas permitidas pelo modelo atual; carteira não é autorização;
- nenhuma pessoa deve depender de Ctrl+F5 para encontrar dados atuais.

A consequência é que atualização imediata e detalhada deve ser proporcional à relevância para a tela em uso, não ao simples fato de alguma escrita ter ocorrido em qualquer escola.

## Produção em 02/10/2026

Os logs de Production foram examinados por hora e em janelas de cinco minutos.

### Janela crítica: 15:00–15:59 BRT

- 938 `POST /rest/v1/rpc/read_operational_context`;
- 325 operações de escrita observadas;
- 280 chamadas de `save_verification_with_log`;
- 148 respostas HTTP 5xx no `read_operational_context`;
- média de aproximadamente 3,76 s por leitura completa;
- p95 de aproximadamente 10,70 s;
- máximo observado superior a 15 s;
- 4 usuários autenticados distintos nos requests da RPC;
- 6 sessões autenticadas distintas na hora.

A degradação se concentra especialmente entre 15:20 e 15:40:

- 15:20–15:24: 118 leituras, 42 escritas, 37 erros 5xx, média ~5,74 s;
- 15:25–15:29: 86 leituras, 37 escritas, 13 erros, média ~4,75 s;
- 15:30–15:34: 80 leituras, 48 escritas, 38 erros, média ~7,73 s;
- 15:35–15:39: 61 leituras, 40 escritas, 21 erros, média ~7,29 s.

Na janela agregada 15:20–15:40 foram 345 chamadas autenticadas/HTTP à RPC, 109 erros 5xx, média ~6,23 s e p95 ~11,61 s. Os logs do Postgres registraram 172 cancelamentos por `statement timeout`; o PostgREST registrou 162 respostas com código SQLSTATE `57014` pelo mesmo motivo. Não houve evidência equivalente de falha do pool de conexões nessa janela.

O papel `authenticated` está configurado com `statement_timeout=8s`. O máximo histórico de execução da `read_operational_context` em `pg_stat_statements` fica imediatamente abaixo desse limite, consistente com chamadas que são canceladas ao ultrapassá-lo sob concorrência.

### Contraprova: 18:00–18:59 BRT

Na mesma data houve uma hora com atividade de escrita ainda maior:

- 739 leituras completas;
- 466 operações de escrita;
- apenas 2 respostas 5xx;
- média de aproximadamente 279 ms nas leituras completas;
- p95 de aproximadamente 582 ms;
- 2 usuários autenticados e 2 sessões autenticadas.

Portanto, `muitas escritas` não explica sozinha a falha. A concorrência de sessões e gravações compõe o cenário, mas também não é suficiente isoladamente: às 14h houve 4 usuários e 6 sessões, 688 leituras e somente 3 erros, com média inferior a 1 s. A investigação precisa explicar por que determinadas janelas entram em saturação enquanto outras, com contagens semelhantes, permanecem saudáveis.

## Interpretação atual

O achado mais forte até aqui é uma cadeia plausível e parcialmente comprovada:

1. várias sessões ativas produzem e recebem invalidações durante uma rajada de escritas;
2. sessões que não precisam dos dados alterados ainda podem solicitar o contexto operacional completo;
3. cada contexto atual transporta aproximadamente 1,2 MB e executa uma consulta relativamente cara sob RLS;
4. chamadas concorrentes elevam a latência;
5. quando a execução ultrapassa o limite de 8 s, o Postgres cancela a instrução;
6. falhas/stale/retries podem acrescentar novas oportunidades de leitura e prolongar a pressão.

Os passos 1–5 possuem evidência direta em código/logs/métricas. O grau em que retries transformam degradação em efeito cascata ainda precisa ser medido, não presumido.

## Primeira correção candidata

Quando uma alteração traz `schoolId` conhecido e o usuário permanece no Prontuário de outra escola:

1. não baixar imediatamente todo o contexto operacional;
2. registrar localmente que aquela escola possui dados novos;
3. continuar o trabalho atual sem reconstruir a tela não relacionada;
4. ao navegar para a escola alterada, reconciliar automaticamente antes de considerar a tela atual;
5. se a alteração pertence à escola atualmente aberta, manter atualização automática rápida;
6. payload sem escola conhecida continua usando o caminho conservador/global;
7. reconexão continua exigindo recuperação segura.

Isso reduz amplificação cruzada sem transformar a divisão de carteiras em regra de autorização.

## Cenários de aceitação

A nova frente deve provar, no mínimo:

- seis Controladores alterando seis escolas diferentes não provocam releituras completas cruzadas em todas as sessões;
- Controlador + Assistente na mesma escola convergem automaticamente;
- navegar posteriormente para uma escola alterada apresenta a versão atual sem Ctrl+F5;
- nenhuma correção do #408 é regredida, especialmente recuperação após falha/stale, cooldown, retomada de aba e proteção de concorrência fiscal;
- alterações sem `schoolId`, reconexão ou dependências globais permanecem conservadoras;
- integridade no banco, foco, scroll e edição em andamento continuam preservados.

## Estratégia de stress sem bloquear a correção

O stress prolongado será incremental:

- primeiro, testes causais pequenos que provam RED/GREEN da amplificação entre escolas;
- depois, stress acelerado com seis sessões e alto volume de eventos/escritas para representar horas de uso em menos tempo;
- somente se o comportamento continuar ambíguo, executar jornada sustentada de várias horas em ambiente descartável.

A análise não precisa esperar um teste literal de horas para avançar com uma correção já causalmente demonstrada. Testes longos servem como validação adicional e detecção de degradação acumulativa, não como pedágio obrigatório para cada commit.

## Investigação que permanece aberta

Mesmo que a relevância por escola produza ganho substancial, ainda devem ser confrontados no incidente de 02/10:

- por que 15:20–15:40 degradou e 14h/18h permaneceram muito mais saudáveis;
- possível formação de fila/efeito cascata de retries;
- custo e frequência da RPC completa;
- contenção e tempos das RPCs de escrita;
- comportamento de autenticação/renovação de sessão;
- número real de sessões/abas por usuário além do `session_id` disponível no servidor;
- operações específicas que antecederam os picos de erro;
- efeitos de renderização e reconstrução no navegador;
- outras causas independentes ainda não identificadas.

A correção será promovida somente se melhorar o cenário realista sem mascarar ou piorar essas outras dimensões.

## Implementação candidata versionada no PR #409

A frente está no PR `#409`, branch `fix/operational-peak-school-relevance-2026-10-04`, criada sobre a `main` pós-#408. A baseline de abertura do PR foi `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`; o primeiro HEAD integralmente exercitado antes do fechamento documental foi `5266b6b13ed959162d280c5f42f63532b4f3bab7`. O HEAD corrente deve ser lido diretamente no PR, porque as correções documentais e de readiness posteriores avançam a branch sem alterar a semântica funcional descrita aqui.

Arquivos funcionais principais:

- `src/integration/operational-realtime-invalidation.js`: classificação por relevância escolar, `dirtySchools`, métricas e drenagem ao navegar;
- `src/integration/navigation-history.js`: emissão de `radar:navigation-committed` somente após rota efetivamente confirmada;
- `supabase/migrations/20261004040500_realtime_school_relevance.sql`: `schoolId` mínimo no Broadcast quando determinável;
- `tests/unit/operational-school-relevance.test.js`: RED/GREEN e stress acelerado de seis sessões/escolas;
- `supabase/tests/database/realtime-operational-invalidation.test.sql`: contrato pgTAP do Broadcast, incluindo derivação da escola para `pendency_attempts`.

A alteração **não** usa carteira como autorização, não transmite registro de negócio pelo Broadcast, não altera RLS de leitura/escrita e não troca o Supabase como fonte canônica.

## Mapa de testes e contraprovas reutilizáveis

### Teste causal novo

`tests/unit/operational-school-relevance.test.js` cobre seis invariantes:

1. alteração conhecida em escola diferente não relê imediatamente o Prontuário corrente;
2. navegar depois para a escola marcada força reconciliação automática;
3. mudança na escola aberta continua chegando rapidamente;
4. superfície global continua conservadora e reconcilia mudança escolar;
5. Broadcast sem escola conhecida continua global/conservador;
6. stress acelerado com seis sessões, 120 rodadas e 720 invalidações por sessão resulta em uma releitura coalescida da rajada relevante, em vez de multiplicar leituras completas pelas outras cinco escolas.

### Banco/Realtime

`supabase/tests/database/realtime-operational-invalidation.test.sql` possui `plan(14)` e preserva os contratos anteriores de canal privado, ausência de INSERT para o cliente e triggers das seis entidades, acrescentando prova de `schoolId` e de derivação da escola para `pendency_attempts`.

### Proteções do #408 que precisam permanecer verdes

A suíte unitária continua carregando os testes causais introduzidos/fortalecidos no #408, entre eles:

- invalidação Realtime durante refresh que falha é drenada após cooldown;
- duas leituras Realtime abortadas por escrita recuperam sem depender de clique/foco;
- retry Realtime stale deixa recuperação futura limitada;
- timer de cooldown não consome a única recuperação durante retry em voo;
- ordens `hidden+blur → visible+focus` e `hidden+blur → focus+visible` não duplicam leitura;
- envios fiscais sobrepostos não deixam patrimônio órfão;
- política de `npm audit` permanece fail-closed e restringe a exceção `braces` à cadeia autorizada.

Esses testes não devem ser removidos ou afrouxados para acomodar o #409.

## CI observado no HEAD 5266b6b1 antes da correção de readiness

No HEAD `5266b6b13ed959162d280c5f42f63532b4f3bab7`, a maior parte da bateria já estava verde:

- `Validar RADAR PDDE` run `37175840440`: sucesso;
- `Retificação auditável direcionada` run `37175840418`: sucesso;
- `CodeQL` run `37175840435`: sucesso;
- `Lighthouse CI` run `37175840430`: sucesso;
- `Regressão visual desktop` run `37175840409`: sucesso;
- `Hardening específico de sincronização operacional` run `37175840405`: sucesso;
- `Backup e restauração descartáveis` run `37175840397`: sucesso;
- `Confiabilidade funcional com Supabase real` run `37175840438`: sucesso;
- `Gate remoto de perfis e viewports` run `37175840407`: sucesso;
- `Ciclos funcionais reais com Supabase` run `37175840433`: sucesso;
- `Testes E2E Playwright` run `37175840398`: sucesso.

A execução de readiness mostrou `1.256/1.256` testes unitários aprovados e `8/8` testes de integração aprovados antes de parar no verificador de migrations.

Dois workflows ficaram vermelhos, ambos pela mesma causa documental/contratual e não por falha funcional observada:

- `Supabase readiness` run `37175840427` encontrou **59 migrations no diretório**, enquanto `docs/runbooks/SUPABASE_CONNECTION.md` ainda declarava 58;
- `Homologação integral pré-production` run `37175840429` aplicou corretamente a migration `20261004040500_realtime_school_relevance`, mas `supabase/verification/remote-post-apply.sql` ainda terminava a lista esperada em `20260930003000`, produzindo `MIGRATION_HISTORY_MISMATCH`.

A raiz foi corrigida na própria branch por dois commits explícitos:

- `b9a45fce4d07e36546417b0c337711bfab8c140d`: inclui `20261004040500` no contrato pós-apply;
- `a5a8a1be67c6a45315acb7a8239aba89c598cdf9`: atualiza o runbook para 59 migrations e registra a migration do #409 como **candidata**, não publicada.

Essas correções precisam ser confirmadas pela CI do **HEAD final** do PR antes de qualquer merge; o registro acima explica o vermelho anterior e não o transforma artificialmente em verde.

## Revisão esperada pelo Codex

O Codex deve tratar este documento e o handoff corrente como contexto, não como conclusão. A revisão deve procurar contraprovas, especialmente:

- perda de convergência quando várias escolas ficam dirty e uma leitura global/same-school ocorre no meio da rajada;
- geração/ack de `dirtySchools` diante de invalidação nova durante uma leitura em voo;
- navegação, `popstate`, troca de competência e superfícies globais que dependam de mais de uma escola;
- Controlador + Assistente atuando na mesma escola;
- Broadcast de `pendency_attempts` em INSERT/UPDATE/DELETE e fallback quando a Pendência já não puder ser derivada;
- possibilidade de o identificador escolar no Broadcast criar exposição indevida ou custo de RLS/trigger;
- regressões das garantias do #408;
- custo real da trigger adicional e do caminho `read_operational_context` sob concorrência;
- qualquer diferença entre o teste acelerado e o comportamento de navegador/Supabase real que seja material para o incidente.

Não aprovar por contagem de testes. Se um achado material surgir, produzir reprodução causal antes da correção. Se não houver contraprova, registrar a evidência que sustenta a ausência de bloqueio.

## Limites e não-afirmações

- o #409 continua Draft durante a preparação para revisão;
- nenhuma migration do #409 foi aplicada em Production por esta frente;
- nenhum deployment Production é afirmado por este documento;
- a melhoria de relevância por escola não é apresentada como explicação completa do incidente de 02/10;
- o harness amplo de cinco sessões do #407 não é automaticamente herdado como prova do #409;
- o stress unitário acelerado é prova causal de amplificação, não substituto para todo cenário de banco/navegador real;
- qualquer HEAD, workflow ou deployment citado deve ser revalidado ao vivo quando usado para decisão de merge.
