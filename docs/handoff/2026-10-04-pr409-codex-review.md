# Handoff corrente — revisão adversarial do PR #409 pelo Codex

**Classe documental:** Handoff corrente  
**Data:** 4 de outubro de 2026  
**PR:** #409 — `hardening: reduzir amplificação entre escolas em picos operacionais`  
**Branch:** `fix/operational-peak-school-relevance-2026-10-04`  
**Base de abertura:** `main` pós-#408, `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`  
**Estado pretendido:** Draft até revisão adversarial e CI final do HEAD corrente  

## 1. Missão do próximo agente

Revisar o PR #409 como candidato de correção operacional, não como implementação automaticamente aprovada. O objetivo é verificar se a relevância por escola reduz a amplificação de `read_operational_context` sem introduzir perda de convergência, regressão de autorização, inconsistência de navegação ou enfraquecimento das proteções consolidadas no #408.

Não repetir mecanicamente toda a investigação do #407. Reutilizar suas evidências quando forem comparáveis e criar novas reproduções apenas para hipóteses materialmente novas ou ainda ambíguas.

Antes de concluir qualquer coisa:

1. ler `AGENTS.md`;
2. ler `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. ler `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. ler `docs/CURRENT_STAGE.md`;
5. ler este handoff;
6. ler `docs/evidence/2026-10-04-production-incident-school-relevance.md`;
7. conferir ao vivo o HEAD do #409, a `main` e os checks desse HEAD;
8. comparar a alteração com as garantias do #408 e com a ADR-054.

## 2. Problema real que originou a frente

Em 02/10/2026, Production apresentou uma janela de saturação operacional em que a leitura completa de contexto passou a ser chamada em volume alto e a atingir `statement_timeout`.

Evidência já consolidada no documento de incidente:

- 15:00–15:59 BRT: 938 chamadas de `read_operational_context`, 325 escritas e 148 respostas 5xx;
- média ~3,76 s e p95 ~10,70 s na leitura completa;
- 15:20–15:40: 172 cancelamentos Postgres por `statement timeout` e 162 respostas PostgREST SQLSTATE `57014`;
- papel `authenticated` com `statement_timeout=8s`;
- contraprova às 18h: 739 leituras, 466 escritas, média ~279 ms e somente 2 erros;
- 4 usuários/6 sessões também existiram em outra hora muito mais saudável, portanto concorrência e quantidade de escritas são fatores, não explicação única.

A frente atual ataca um fator causal específico: sessões em um Prontuário recebiam invalidações de outras escolas e podiam baixar/reconstruir o contexto completo sem que a alteração fosse imediatamente relevante para a tela em uso.

## 3. Escopo funcional do candidato

O candidato não altera autorização. Carteira continua sem efeito de permissão. RLS e regras de escrita permanecem as autoridades vigentes.

A proposta é:

- Broadcast continua privado e continua sendo apenas invalidação;
- payload passa a incluir `schoolId` quando o banco consegue determiná-lo;
- se o usuário está no Prontuário da escola A e chega alteração conhecida da escola B, B é marcada como dirty e não provoca leitura completa imediata;
- se chega alteração da própria escola A, a sessão continua reconciliando rapidamente;
- ao navegar para escola dirty, a reconciliação é disparada automaticamente;
- superfícies globais continuam conservadoras, pois podem depender de várias escolas;
- Broadcast sem `schoolId` continua no caminho global/conservador;
- reconexão continua forçando recuperação segura;
- uma leitura bem-sucedida de contexto reconhece somente as dirty schools capturadas no início daquela tentativa, preservando geração posterior.

## 4. Arquivos que merecem revisão prioritária

### Implementação

- `src/integration/operational-realtime-invalidation.js`
  - `dirtyGeneration` e `dirtySchools`;
  - `captureDirtySchools()` / `acknowledgeDirtySchools()`;
  - `shouldDeferSchool()`;
  - `routeNeedsDeferredRefresh()`;
  - `handleBroadcast()`;
  - `handleNavigationCommitted()`;
  - interação com retry, reconnect, timers e `refreshController.refresh()`.

- `src/integration/navigation-history.js`
  - emissão de `radar:navigation-committed` somente depois de `currentRoute` efetivamente assumir a rota;
  - `commitRoute()` e `popstate`;
  - possibilidade de duplicação/omissão em transições reais.

### Banco

- `supabase/migrations/20261004040500_realtime_school_relevance.sql`
  - extração de `school_id` de `NEW/OLD`;
  - derivação via `pendency_id` para `pendency_attempts`;
  - comportamento em INSERT/UPDATE/DELETE;
  - fallback sem `schoolId`;
  - `security definer`, `search_path`, revokes e ausência de dados de negócio no payload.

### Testes

- `tests/unit/operational-school-relevance.test.js`;
- `supabase/tests/database/realtime-operational-invalidation.test.sql`;
- testes existentes do #408 relacionados a refresh/Reatime/cooldown/resume/concorrência;
- workflows `Hardening específico de sincronização operacional`, `Supabase readiness`, `Homologação integral pré-production`, E2E e ciclos Supabase reais.

## 5. RED/GREEN causal já existente

O teste `tests/unit/operational-school-relevance.test.js` foi criado inicialmente contra a `main` pós-#408 e falhou antes da implementação, demonstrando dois comportamentos ausentes na baseline:

- outra escola ainda causava releitura completa no Prontuário corrente;
- não havia reconciliação automática específica ao navegar depois para a escola alterada.

No candidato, ele cobre:

- outra escola sem refresh imediato;
- escola dirty reconciliada na navegação;
- mesma escola com refresh rápido;
- tela global conservadora;
- evento sem escola conservador;
- stress acelerado de seis sessões/escolas, 120 rodadas, 720 invalidações por sessão.

Não substituir esse RED/GREEN por teste de implementação que apenas espelhe estruturas internas.

## 6. Proteções herdadas do #408 que são requisito, não contexto decorativo

O #408 corrigiu problemas que podem reaparecer se o #409 mexer em scheduling e reconciliação. A revisão deve verificar a preservação destas garantias:

- invalidação recebida durante refresh que falha continua drenada automaticamente;
- duas leituras Realtime abortadas por escrita convergem sem depender de clique/foco;
- retry stale deixa uma recuperação futura limitada;
- timer de cooldown não consome a única recuperação enquanto retry está em voo;
- `hidden+blur → visible+focus` e `hidden+blur → focus+visible` não duplicam leitura;
- foco/visibilidade não apagam invalidação realmente nova;
- não existe polling contínuo;
- gesto do usuário não vira mecanismo de retry storm;
- concorrência fiscal continua falhando fechado quando estado muda na fila;
- política de dependências continua fail-closed.

O #409 não deve “melhorar performance” removendo garantias de convergência.

## 7. CI conhecido antes da preparação documental final

No HEAD funcional `5266b6b13ed959162d280c5f42f63532b4f3bab7`:

- `Validar RADAR PDDE` `37175840440`: success;
- `Retificação auditável direcionada` `37175840418`: success;
- `CodeQL` `37175840435`: success;
- `Lighthouse CI` `37175840430`: success;
- `Regressão visual desktop` `37175840409`: success;
- `Hardening específico de sincronização operacional` `37175840405`: success;
- `Backup e restauração descartáveis` `37175840397`: success;
- `Confiabilidade funcional com Supabase real` `37175840438`: success;
- `Gate remoto de perfis e viewports` `37175840407`: success;
- `Ciclos funcionais reais com Supabase` `37175840433`: success;
- `Testes E2E Playwright` `37175840398`: success.

A execução de readiness alcançou `1.256/1.256` unitários e `8/8` integrações antes de falhar em referências de migration.

Dois workflows falharam pela mesma causa de preparação da 59ª migration:

- `Supabase readiness` `37175840427`: o runbook declarava 58 migrations apesar de o diretório conter 59;
- `Homologação integral pré-production` `37175840429`: o pós-apply esperava histórico até `20260930003000`, mas o banco descartável aplicou também `20261004040500`.

Correções já versionadas:

- `b9a45fce4d07e36546417b0c337711bfab8c140d`: atualiza `remote-post-apply.sql` para a 59ª migration;
- `a5a8a1be67c6a45315acb7a8239aba89c598cdf9`: atualiza `SUPABASE_CONNECTION.md` para 59 migrations e classifica a nova migration como candidata.

Esses dois commits corrigem a causa diagnosticada. Não presumir verde: conferir os workflows do HEAD final do PR.

## 8. Contraprovas e riscos que o Codex deve tentar quebrar

A revisão deve ser adversarial nos pontos abaixo, mas sem inventar trabalho não relacionado:

### Convergência e dirty state

- evento B chega enquanto leitura de A/global está em voo;
- evento B chega depois do snapshot `dirtyAtAttempt`, antes do ack;
- escola B recebe duas gerações antes/durante a leitura;
- uma leitura global ocorre enquanto várias escolas estão dirty;
- uma leitura same-school ocorre com dirty schools de outras escolas;
- retry/failure/stale durante drenagem de dirty schools;
- reconexão com dirty state prévio;
- stop/reinstall do controller com dirty state pendente.

### Navegação

- `switchView`, rota profunda, `popstate`, próxima escola e filtro de Pendências;
- navegação para escola dirty e mudança de competência simultânea;
- evento `radar:navigation-committed` duplicado ou ausente;
- rota inválida/normalizada;
- tela global que depende de várias escolas.

### Multiusuário realista

- seis Controladores em escolas distintas;
- Controlador + Assistente na mesma escola;
- Assistente em tela global enquanto Controladores gravam em escolas diferentes;
- duas abas da mesma identidade;
- escrita que não consegue determinar escola no Broadcast.

### Banco e segurança

- `pendency_attempts` em DELETE quando a Pendência já não pode ser resolvida;
- trigger adicionando custo relevante sob rajadas;
- schoolId como metadado de roteamento sem vazamento de conteúdo protegido;
- função privada e `search_path` seguros;
- RLS/authorization sem qualquer dependência da carteira.

### Incidente original

- a mudança reduz chamadas cruzadas, mas ainda pode haver saturação por outras causas;
- o candidato não deve ser vendido como solução integral do incidente sem evidência;
- se o custo da RPC continuar dominante, registrar isso como frente posterior em vez de inflar #409.

## 9. Critério de aceitação da revisão

O Codex pode recomendar merge somente se, no HEAD exato analisado:

- os checks obrigatórios aplicáveis terminarem sem falha material;
- a 59ª migration passar reset, pós-apply, pgTAP e readiness;
- os testes causais do #409 passarem sem enfraquecer testes do #408;
- não houver contraprova reproduzível de perda de convergência ou autorização;
- o comportamento global/conservador continuar correto;
- a documentação não afirmar aplicação em Production antes de ela existir;
- qualquer achado novo tiver classificação clara: bloqueador, melhoria posterior ou hipótese não comprovada.

Quantidade de testes verdes, sozinha, não encerra a revisão.

## 10. O que não fazer

- não mergear o #407 inteiro no #409;
- não transformar carteira em fronteira de autorização;
- não filtrar Realtime por escola de forma que uma sessão perca atualização necessária ao navegar depois;
- não colocar dados de negócio no Broadcast;
- não reduzir `statement_timeout`/aumentar timeout como substituto para causa-raiz;
- não desabilitar readiness, pgTAP, E2E ou pós-apply para obter verde;
- não atualizar goldens visuais sem regressão visual real;
- não reescrever evidência histórica para fazê-la parecer prova do novo HEAD;
- não iniciar refatoração ampla de `read_operational_context` sem reprodução que justifique ampliar o escopo.

## 11. Referências obrigatórias da frente

- PR #409: candidato atual;
- `docs/evidence/2026-10-04-production-incident-school-relevance.md`: incidente, métricas, contraprovas, testes e CI;
- PR #408: hotfix seletivo e proteções de recuperação/concorrência;
- PR #407: laboratório de carga e evidências arquiteturais, não pacote de implementação;
- `docs/decisions/ADR-054-sincronizacao-operacional-realtime.md`: decisão canônica de invalidação Realtime;
- `docs/runbooks/SUPABASE_CONNECTION.md`: baseline de migrations e operação controlada;
- `supabase/verification/remote-post-apply.sql`: contrato de histórico exato das migrations;
- `docs/reference/TEST_GOVERNANCE.md`: interpretação dos gates e evidências.

## 12. Estado de handoff

Este handoff permanece corrente enquanto o #409 estiver em revisão. Quando o PR for encerrado, integrado ou abandonado, `CURRENT_STAGE.md`, `docs/reference/STATUS_DOCUMENTOS.md` e `docs/README.md` devem reclassificá-lo. Até lá, o próximo agente deve tratar o PR e a CI ao vivo como fonte temporal superior a qualquer SHA escrito neste documento.
