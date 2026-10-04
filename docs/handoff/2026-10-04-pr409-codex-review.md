# Handoff corrente — revisão adversarial do PR #409 pelo Codex

**Classe documental:** Handoff corrente  
**Data:** 4 de outubro de 2026  
**PR:** #409 — `hardening: reduzir amplificação entre escolas em picos operacionais`  
**Branch:** `fix/operational-peak-school-relevance-2026-10-04`  
**Base de abertura:** `main` pós-#408, `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`  
**HEAD no momento deste handoff:** `9dec25ad1788908a8a727072eeed5a28276ce8e4`  
**Estado:** Draft, CI do HEAD acima em execução  

## 0. O que aconteceu desde a última vez em que o Codex trabalhou neste projeto

Este é o ponto mais importante para evitar que a revisão retome de uma baseline antiga.

A última intervenção material do Codex ocorreu no PR #408. Naquela rodada ele não apenas revisou o hotfix: encontrou uma regressão temporal adicional depois de uma bateria ampla já estar verde, criou as provas de interleaving correspondentes, corrigiu o problema e consolidou o candidato final do #408 em `b1b12bcc9419b55f8bfe9717f4a1c2e5c1bee255`. O #408 foi então integrado à `main` no merge `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`.

Depois dessa intervenção do Codex, ocorreram os seguintes fatos:

1. **O #408 virou baseline real da main e de Production.** A publicação posterior foi conferida no Vercel no mesmo merge `d9bf67f7...`, com endpoint principal respondendo HTTP 200 e sem erro de runtime do Vercel na janela observada. Essa validação não foi tratada como prova de performance autenticada, apenas como confirmação de que o hotfix efetivamente chegou ao artefato publicado.

2. **O incidente operacional real de 02/10/2026 foi reanalisado com dados de Production.** A investigação deixou de depender apenas do laboratório do #407. Foram confrontadas janelas horárias e de cinco minutos, contagens de RPCs, escritas, sessões, erros 5xx, `statement_timeout` e SQLSTATE `57014`.

3. **O #407 foi mantido como laboratório, não como pacote para merge.** A principal lição preservada é que reduzir tentativas dos writers não basta quando observadores passivos continuam baixando contexto completo. O #409 foi deliberadamente aberto como frente limpa sobre a main pós-#408, em vez de sincronizar e promover toda a arquitetura experimental do #407.

4. **Foi criada uma hipótese causal limitada para amplificação entre escolas.** Em picos, aproximadamente seis pessoas podem trabalhar ao mesmo tempo, em geral em escolas distintas. Uma sessão aberta no Prontuário da escola A não deveria baixar imediatamente todo o contexto apenas porque outra sessão alterou a escola B. Ao mesmo tempo, a alteração de B não pode ser perdida: ao navegar para B ou entrar numa superfície global, a reconciliação deve ocorrer automaticamente.

5. **Foi criado RED causal sobre a main pós-#408.** `tests/unit/operational-school-relevance.test.js` inicialmente falhou contra a baseline porque outra escola ainda provocava releitura completa do Prontuário corrente e não existia drenagem específica quando a escola alterada se tornava relevante depois.

6. **Foi implementado o candidato do #409.** O Broadcast privado continua sendo apenas invalidação, mas passa a carregar `schoolId` quando determinável. O cliente mantém `dirtySchools` com geração, adia alteração claramente alheia ao Prontuário aberto, reconcilia a escola ao navegar para ela, mantém mesma escola e superfícies globais no caminho conservador e preserva fallback global quando a escola não é conhecida.

7. **Foi acrescentada uma migration candidata, ainda não publicada em Production.** `supabase/migrations/20261004040500_realtime_school_relevance.sql` adiciona o metadado mínimo de escola ao Broadcast quando o banco consegue derivá-lo, inclusive para `pendency_attempts` via `pendency_id`. Não há dado de negócio no payload e não houve mudança de fronteira de autorização.

8. **Foram versionados testes novos e reforçados.** O teste unitário de relevância escolar cobre RED/GREEN e stress acelerado com seis sessões/escolas. O pgTAP de Realtime foi ampliado para provar o `schoolId` e a derivação em `pendency_attempts`. As proteções temporais e de recuperação do #408 continuam sendo requisitos obrigatórios.

9. **A documentação canônica da frente foi atualizada.** `docs/CURRENT_STAGE.md`, `docs/reference/STATUS_DOCUMENTOS.md`, `docs/decisions/ADR-054-sincronizacao-operacional-realtime.md`, o documento de evidência do incidente e este handoff apontam o #409 como frente corrente. Nenhum deles deve ser interpretado como prova de merge ou publicação.

10. **A CI do primeiro candidato revelou referências stale de migration e uma fragilidade E2E separada.** As referências de readiness foram corrigidas progressivamente. No HEAD `6ad2181f01ee97e918db30e832102fce73457f78`, ainda sobravam duas referências antigas a 58 migrations: `scripts/check-supabase-final-alignment-current.js` e `supabase/tests/database/schema.test.sql`. Elas foram corrigidas nos commits `acd9b1bf5458ab60dc331ad3e0f571d4cd10fe56` e `9dec25ad1788908a8a727072eeed5a28276ce8e4`. O CI do novo HEAD está em execução no momento deste handoff.

Portanto, **não retomar a partir do #407 nem reimplementar o #408**. A baseline correta é `main=d9bf67f7...` + as mudanças específicas do #409.

## 1. Missão do Codex agora

Revisar o PR #409 como candidato de correção operacional, com postura adversarial. A pergunta não é “os testes passam?”, mas:

> A relevância por escola reduz de fato a amplificação de `read_operational_context` sem perder convergência, sem enfraquecer autorização e sem reintroduzir as falhas temporais já corrigidas no #408?

Antes de concluir qualquer coisa:

1. ler `AGENTS.md`;
2. ler `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. ler `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. ler `docs/CURRENT_STAGE.md`;
5. ler este handoff;
6. ler `docs/evidence/2026-10-04-production-incident-school-relevance.md`;
7. conferir ao vivo o HEAD do #409, a `main` e os checks do HEAD exato;
8. comparar a alteração com as garantias do #408 e com a ADR-054.

Não repetir mecanicamente toda a bateria do #407. Reutilizar evidências quando comparáveis e criar novos REDs apenas para hipóteses materialmente novas, interleavings não cobertos ou falhas reais da CI.

## 2. Evidência real de Production que originou o #409

Em 02/10/2026, Production apresentou uma janela de saturação operacional em que a leitura completa de contexto foi chamada em volume alto e atingiu `statement_timeout`.

### Janela crítica 15:00–15:59 BRT

- 938 `POST /rest/v1/rpc/read_operational_context`;
- 325 operações de escrita observadas;
- 280 chamadas de `save_verification_with_log`;
- 148 respostas HTTP 5xx no `read_operational_context`;
- média ~3,76 s;
- p95 ~10,70 s;
- máximo observado acima de 15 s;
- 4 usuários autenticados distintos;
- 6 sessões autenticadas distintas.

Entre 15:20 e 15:40:

- 345 chamadas autenticadas à RPC;
- 109 erros 5xx;
- média ~6,23 s;
- p95 ~11,61 s;
- 172 cancelamentos no Postgres por `statement timeout`;
- 162 respostas PostgREST SQLSTATE `57014`.

O papel `authenticated` usa `statement_timeout=8s`, coerente com a execução da RPC encostando nesse limite sob concorrência.

### Contraprovas importantes

18:00–18:59 teve **mais escrita** e comportamento muito melhor:

- 739 leituras completas;
- 466 escritas;
- média ~279 ms;
- p95 ~582 ms;
- apenas 2 erros 5xx;
- 2 usuários/2 sessões.

Às 14h também houve 4 usuários/6 sessões, mas a hora ficou muito mais saudável. Logo, quantidade de escrita e número de sessões importam, porém não explicam sozinhos a saturação.

O #409 ataca apenas um fator específico: releituras completas cruzadas entre escolas quando a alteração não é imediatamente relevante para a superfície aberta.

## 3. Premissa operacional que deve ser preservada

- em picos, cerca de seis pessoas podem trabalhar simultaneamente;
- em geral, cada Controlador está em uma escola diferente;
- dois Controladores na mesma escola ao mesmo tempo são possíveis, mas pouco prováveis;
- Controlador + Assistente de Verbas Federais na mesma escola é cenário real e precisa convergir automaticamente;
- carteira **não** é fronteira de autorização;
- nenhuma pessoa deve depender de Ctrl+F5 para ver dados atuais;
- uma tela global pode depender de várias escolas e por isso deve continuar conservadora.

## 4. Escopo funcional do candidato

O candidato não altera RLS, capacidade de escrita ou regra de carteira. A proposta é:

- Broadcast privado permanece apenas sinal de invalidação;
- payload carrega `schoolId` quando determinável, sem registro de negócio;
- alteração da escola B enquanto o usuário está no Prontuário da escola A marca B como dirty e evita leitura completa imediata de A;
- alteração da própria escola A continua reconciliando rapidamente;
- ao navegar para B, a reconciliação é disparada automaticamente;
- superfícies globais continuam reconciliando de forma conservadora;
- Broadcast sem `schoolId` continua global/conservador;
- reconexão continua forçando recuperação segura;
- dirty state possui geração para não reconhecer como concluída uma invalidação nova que chegou depois do snapshot da tentativa.

## 5. Arquivos prioritários para revisão

### Runtime

- `src/integration/operational-realtime-invalidation.js`
  - `dirtyGeneration` / `dirtySchools`;
  - captura e ack de dirty state;
  - relevância por escola;
  - interação com retry, cooldown, reconnect e refresh em voo;
  - drenagem após navegação.

- `src/integration/navigation-history.js`
  - emissão de `radar:navigation-committed` após rota realmente confirmada;
  - `commitRoute()` / `popstate`;
  - duplicação, perda ou ordem indevida do evento.

### Banco

- `supabase/migrations/20261004040500_realtime_school_relevance.sql`
  - `NEW/OLD.school_id`;
  - derivação de `schoolId` em `pendency_attempts`;
  - INSERT/UPDATE/DELETE;
  - comportamento quando a escola não é determinável;
  - `security definer`, `search_path`, revokes e ausência de conteúdo protegido no payload.

### Provas novas

- `tests/unit/operational-school-relevance.test.js`;
- `supabase/tests/database/realtime-operational-invalidation.test.sql`.

### Proteções que não podem regredir

Os testes do #408 relativos a Realtime, stale, cooldown, foco/visibilidade, write-settled, concorrência fiscal e audit fail-closed continuam obrigatórios.

## 6. RED/GREEN causal já versionado

O novo teste unitário foi criado primeiro contra a `main` pós-#408 e demonstrou ausência de dois contratos:

- outra escola ainda causava releitura completa no Prontuário corrente;
- navegar posteriormente para uma escola alterada não possuía reconciliação específica garantida.

No candidato, a suíte cobre:

1. outra escola sem refresh imediato;
2. escola dirty reconciliada na navegação;
3. mesma escola com refresh rápido;
4. superfície global conservadora;
5. Broadcast sem escola conservador;
6. stress acelerado com seis sessões/escolas, 120 rodadas por escola e 720 invalidações por sessão.

Não substituir esse RED/GREEN por testes que apenas espelhem estruturas internas.

## 7. Proteções do #408 que são baseline obrigatória

O #408 corrigiu problemas reais encontrados inclusive **depois** de CI ampla verde. Preservar:

- invalidação durante refresh que falha é drenada automaticamente;
- duas leituras Realtime abortadas por escrita convergem sem clique/foco;
- retry stale deixa recuperação futura limitada;
- timer de cooldown não consome a única recuperação enquanto retry está em voo;
- `hidden+blur → visible+focus` e `hidden+blur → focus+visible` não duplicam leitura;
- caso em que a primeira resposta termina entre os dois sinais de retomada continua sem segunda leitura desnecessária;
- foco/visibilidade não apagam invalidação nova recebida em voo;
- não existe polling contínuo;
- gesto do usuário não vira retry storm;
- concorrência fiscal falha fechado se o estado mudou enquanto a operação aguardava na fila;
- política de `npm audit` permanece fail-closed.

## 8. Estado de CI que o Codex deve conhecer

### HEAD anterior `6ad2181f01ee97e918db30e832102fce73457f78`

13 workflows foram observados:

**Sucesso:**

- `Validar RADAR PDDE`;
- `CodeQL`;
- `Retificação auditável direcionada`;
- `Lighthouse CI`;
- `Confiabilidade funcional com Supabase real`;
- `Backup e restauração descartáveis`;
- `Hardening específico de sincronização operacional`;
- `Regressão visual desktop`;
- `Gate remoto de perfis e viewports`;
- `Testes E2E Playwright`.

**Falhas:**

1. `Supabase readiness` run `37177177858`.
   - `readiness` alcançou `1.256/1.256` unitários e `8/8` integrações e só falhou no `check:supabase-final` porque `EXPECTED_MIGRATION_COUNT` ainda era 58, enquanto o diretório já continha 59.
   - `supabase-local` aplicou todas as migrations e passou o pós-apply, mas o pgTAP falhou apenas em `schema.test.sql`, cujo teste ainda contava 58 migrations e tinha a descrição textual “cinquenta e sete migrations foram registradas”.

2. `Ciclos funcionais reais com Supabase` run `37177177787`.
   - 17 testes passaram;
   - 1 ficou flaky porque o retry encontrou `verifications` produzidas pela própria tentativa anterior, indicando possível falta de isolamento da fixture/retry;
   - 1 falhou em uma asserção visual de captura: `toBeInViewport({ ratio: 1 })` recebeu ~`0.9488689` no painel `CONECTADA` após `scrollIntoView`;
   - a falha deve ser diagnosticada como problema real de layout, sensibilidade excessiva do teste ou ambos. Não baixar a exigência nem atualizar teste por reflexo sem reprodução.

3. `Homologação integral pré-production` run `37177177803`.
   - Lighthouse desktop: sucesso;
   - backup/restauração: sucesso;
   - dependências/segurança: sucesso;
   - Excel SME/OOXML: sucesso;
   - Playwright desktop completo: sucesso;
   - migrations em PostgreSQL limpo: sucesso;
   - falhou em `Supabase local, Auth, RLS e pgTAP` pela mesma contagem stale de migrations;
   - falhou em `Prontidão completa` pela mesma referência de 58 migrations;
   - gate final falhou por consequência desses jobs.

### Correções mecânicas feitas após esse HEAD

- `acd9b1bf5458ab60dc331ad3e0f571d4cd10fe56`
  - `scripts/check-supabase-final-alignment-current.js`: 58 → 59 migrations.

- `9dec25ad1788908a8a727072eeed5a28276ce8e4`
  - `supabase/tests/database/schema.test.sql`: contagem 58 → 59 e descrição corrigida para “cinquenta e nove migrations”.

O CI do HEAD `9dec25ad...` foi disparado e ainda estava em execução no momento deste handoff. **Não assumir verde.** O Codex deve consultar os workflows ao vivo antes de classificar o PR.

## 9. Contraprovas que a revisão deve tentar produzir

### Dirty state e convergência

- evento B durante leitura de A/global;
- evento B depois do snapshot de dirty state, antes do ack;
- duas gerações para B antes/durante a leitura;
- leitura global com várias escolas dirty;
- leitura da mesma escola enquanto outras continuam dirty;
- failure/stale/retry na drenagem;
- reconnect com dirty state anterior;
- stop/reinstall do controller com dirty state pendente.

### Navegação

- `switchView`, rota profunda, `popstate`, próxima escola e filtro de Pendências;
- navegação para escola dirty junto com troca de competência;
- `radar:navigation-committed` duplicado, ausente ou cedo demais;
- rota inválida/normalizada;
- entrada em superfície global depois de alterações em várias escolas.

### Multiusuário

- seis Controladores em escolas distintas;
- Controlador + Assistente na mesma escola;
- Assistente em superfície global enquanto Controladores gravam em escolas diferentes;
- duas abas da mesma identidade;
- escrita cujo Broadcast não consegue derivar escola.

### Banco e segurança

- `pendency_attempts` em DELETE quando a Pendência não puder mais ser resolvida;
- custo adicional das triggers em rajada;
- `schoolId` como metadado mínimo sem vazamento de conteúdo;
- função privada, `search_path` e revokes;
- nenhuma dependência de autorização em carteira.

### Incidente original

Mesmo que o #409 reduza leituras cruzadas, não inferir que resolveu o incidente inteiro. Se o custo da RPC continuar dominante ou outra causa aparecer, registrar como frente posterior, em vez de inflar o escopo deste PR sem reprodução.

## 10. Critério de aceitação

Recomendar merge somente se, no HEAD exato analisado:

- checks obrigatórios aplicáveis terminarem sem falha material;
- a 59ª migration passar reset, pós-apply, pgTAP e readiness;
- os testes causais do #409 continuarem verdes;
- as proteções do #408 continuarem verdes;
- não houver contraprova reproduzível de perda de convergência;
- o caminho global/conservador continuar correto;
- autorização e RLS permanecerem intactas;
- a falha E2E de viewport/retry estiver explicada, não apenas silenciada;
- documentação não afirmar publicação do #409 em Production antes de ela existir;
- qualquer achado novo seja classificado como bloqueador, melhoria posterior ou hipótese ainda não comprovada.

Contagem de testes verdes não substitui análise temporal e operacional.

## 11. O que não fazer

- não mergear o #407 inteiro no #409;
- não reimplementar soluções já consolidadas no #408;
- não transformar carteira em autorização;
- não filtrar Realtime por escola de modo que a sessão perca atualização necessária ao navegar depois;
- não colocar dados de negócio no Broadcast;
- não aumentar `statement_timeout` como substituto de causa-raiz;
- não desabilitar readiness, pgTAP, E2E ou pós-apply para obter verde;
- não atualizar goldens/thresholds visuais sem provar que o comportamento real está correto;
- não tratar a falha de viewport 0.948 como “flaky irrelevante” sem reproduzir;
- não tratar o teste contaminado por retry como bug de produto sem separar fixture de runtime;
- não reescrever evidência histórica para fazê-la parecer prova do novo HEAD;
- não abrir refatoração ampla da `read_operational_context` sem reprodução que justifique ampliar o escopo.

## 12. Referências obrigatórias

- PR #409: candidato atual;
- PR #408: baseline de recuperação temporal, concorrência fiscal e gates fail-closed;
- PR #407: laboratório de carga e arquitetura, não pacote de implementação;
- `docs/evidence/2026-10-04-production-incident-school-relevance.md`;
- `docs/decisions/ADR-054-sincronizacao-operacional-realtime.md`;
- `docs/CURRENT_STAGE.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/reference/TEST_GOVERNANCE.md`;
- `docs/runbooks/SUPABASE_CONNECTION.md`;
- `supabase/verification/remote-post-apply.sql`;
- `tests/unit/operational-school-relevance.test.js`;
- `supabase/tests/database/realtime-operational-invalidation.test.sql`;
- testes causais de refresh/Realtime/resume/cooldown/concurrency do #408 já presentes na suíte unitária.

## 13. Estado do handoff

Este documento é o handoff corrente do PR #409. O PR permanece Draft. Nenhuma migration do #409 foi aplicada em Production por esta frente. O Codex deve tratar GitHub/CI ao vivo como fonte temporal superior a qualquer SHA escrito aqui e atualizar este handoff se produzir achado material, novo RED, correção ou decisão de encerramento.
