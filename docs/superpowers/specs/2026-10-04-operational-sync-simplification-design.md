# Design — simplificação arquitetural da sincronização operacional

**Status:** direção autorizada em 04/10/2026; execução incremental iniciada, detalhes sujeitos a prova  
**Data:** 04/10/2026  
**Branch:** `refactor/simplify-operational-sync-2026-10-04`  
**Baseline obrigatória:** `main` em `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6` (#408)  
**PRs de evidência, não de base:** #407 e #409

## 1. Objetivo

Reduzir a complexidade acidental da sincronização operacional do RADAR PDDE sem alterar regras de negócio, autorização, persistência canônica, auditoria ou experiência funcional esperada.

O problema a resolver não é “como fazer a arquitetura atual suportar mais uma intercalação temporal”. É reduzir o número de mecanismos necessários para manter os usuários atualizados.

O produto deve continuar oferecendo:

- gravação imediata e segura para quem executa a ação;
- atualização automática entre sessões sem Ctrl+F5;
- colaboração Controlador + Assistente na mesma escola;
- navegação entre escolas sem apresentar estado sabidamente desatualizado;
- recuperação automática após falha de Realtime/rede;
- RLS e Supabase como autoridades de segurança e persistência.

A simplificação deve terminar com **menos caminhos de atualização, menos leituras globais, menos estados temporais e menos código crítico** do que a baseline.

## 2. Realidade operacional que passa a orientar a arquitetura

O uso predominante não é seis pessoas disputando a mesma escola.

Em pico, aproximadamente seis pessoas podem trabalhar simultaneamente, normalmente em escolas diferentes. Controladores têm carteiras organizacionais próprias, embora a carteira não seja fronteira de autorização entre Controladores da mesma CRE.

Cenários relevantes:

1. Controladores diferentes trabalhando principalmente em escolas diferentes;
2. Assistente de Verbas Federais circulando entre escolas;
3. Controlador + Assistente na mesma escola, inclusive com correção privilegiada feita pela Assistente;
4. acesso ocasional de um Controlador a escola fora da própria carteira;
5. Dashboard e outras superfícies globais precisando refletir alterações sem baixar desnecessariamente o contexto inteiro a cada escrita.

A arquitetura não pode transformar carteira em autorização.

## 3. Evidência que motiva a mudança

### 3.1 Incidente de Production de 02/10/2026

Na janela crítica 15:00–15:59 BRT foram observados no trabalho do #409:

- 938 chamadas a `POST /rest/v1/rpc/read_operational_context`;
- 325 operações de escrita;
- 148 respostas 5xx da leitura completa;
- média da leitura completa de aproximadamente 3,76 s;
- p95 de aproximadamente 10,70 s;
- 172 cancelamentos PostgreSQL por `statement timeout`;
- 162 respostas PostgREST SQLSTATE `57014`;
- `statement_timeout` do papel autenticado em 8 s.

Às 18h houve mais escritas, mas muito menos degradação, mostrando que concorrência sozinha não explica o incidente. A multiplicação de leituras completas entre sessões é, contudo, um amplificador comprovado.

### 3.2 #407

O #407 demonstrou que reduzir aborts/releituras podia simultaneamente aumentar payload, SQL e trabalho do navegador quando sessões passivas reaplicavam contexto completo. Portanto, “menos tentativas” não equivale automaticamente a “arquitetura melhor”.

### 3.3 #408

O #408 é a baseline estável desta frente. Ele corrigiu problemas comprovados de coalescência, recuperação temporal e mutações fiscais concorrentes. Essas garantias não devem ser apagadas por uma refatoração apressada.

### 3.4 #409

O #409 provou duas coisas úteis:

- `schoolId` é uma informação relevante para evitar reconstruções da escola errada;
- continuar adicionando `dirtySchools`, gerações, interleavings e proteções sobre o caminho de releitura global mantém o sistema correto em muitos casos, mas não elimina a complexidade estrutural.

O #409 permanece laboratório/evidência. Esta frente parte da `main`, não do #409.

## 4. Estado atual confirmado no código da baseline

### 4.1 Leitura operacional

`DataService.loadOperationalContext()` cancela leitura anterior, espera apenas a barreira de gravações já pendentes e chama `repository.queryOperationalContext()`.

`OperationalSupabaseRepository.queryOperationalContext()` chama a RPC `read_operational_context`.

A RPC retorna, para uma competência, seis coleções operacionais completas sob RLS:

- `verifications`;
- `registeredInvoices`;
- `pendencies`;
- `pendencyAttempts`;
- `pendencyContacts`;
- `assets`.

A RPC inclui dependências históricas necessárias e é correta como leitura global. O problema é usá-la como resposta padrão para eventos locais frequentes.

### 4.2 Escritas

A arquitetura já possui um ativo importante para a simplificação: várias operações usam `remoteResultIsAuthoritative` ou `remoteCommitIsAuthoritative` e conseguem aplicar localmente o retorno persistido sem depender obrigatoriamente de uma releitura global posterior.

Esse comportamento deve ser ampliado quando apropriado, não substituído por refresh global.

### 4.3 Realtime

Na baseline, `operational-realtime-invalidation.js` recebe qualquer Broadcast operacional e agenda `refreshController.refresh(...)`.

O `operational-context-refresh.js`, por sua vez, coordena:

- leitura global;
- edição ativa;
- foco;
- visibilidade;
- cooldown;
- retry;
- leitura em voo;
- pendência;
- re-renderização da superfície atual.

Esse conjunto nasceu para preservar consistência, mas hoje concentra estados temporais demais para um evento que frequentemente significa apenas “uma escola diferente mudou”.

### 4.4 Navegação

Existe autoridade moderna em `RadarNavigationHistory`, mas o produto ainda mantém variáveis/globais legados como `activeSchoolId`, `currentView` e integrações que os consultam diretamente.

O achado do #409 em “Próxima unidade” confirmou o risco: a interface podia exibir outra escola sem que toda a pilha de navegação tivesse a mesma autoridade de rota.

## 5. Alternativas consideradas

### A. Continuar endurecendo o #409

Adicionar mais proteções temporais, dirty state, retries e testes ao caminho atual.

**Vantagem:** mudança menor no curto prazo.  
**Desvantagem:** preserva a leitura global como ferramenta principal e aumenta o espaço de estados.  
**Decisão:** não é a estratégia principal. O #409 permanece evidência.

### B. Simplificação incremental por substituição de caminhos — escolhida

Criar leitura operacional por escola, estabelecer autoridades canônicas e migrar gradualmente eventos locais para o caminho local, preservando a leitura global somente onde ela é semanticamente necessária.

**Vantagem:** reduz custo e complexidade sem big bang; rollback por etapa; reaproveita serviços/RLS/regras existentes.  
**Desvantagem:** exige período transitório com caminho novo e caminho legado coexistindo de forma explícita e curta.  
**Decisão:** escolhida.

### C. Reescrever integralmente estado/navegação/frontend

Substituir de uma vez os globais, serviços de refresh, navegação e sincronização.

**Vantagem:** arquitetura final potencialmente mais limpa.  
**Desvantagem:** risco desproporcional, regressões amplas e rollback difícil.  
**Decisão:** rejeitada.

## 6. Arquitetura alvo

### 6.1 Autoridades únicas

- **Persistência e autorização:** Supabase + RLS;
- **competência ativa:** `RadarCompetenceContext`;
- **rota/escola visível:** `RadarNavigationHistory.currentRoute()`;
- **estado de negócio no navegador:** projeção aplicada pelo `DataService/StatePort`.

`activeSchoolId`, `currentView` e equivalentes podem existir temporariamente por compatibilidade, mas deixam de ser autoridade para decisões novas de sincronização. Devem derivar da rota canônica ou ser removidos progressivamente.

### 6.2 Caminho de escrita do próprio usuário

Objetivo:

```text
controle da UI
→ serviço de domínio
→ RPC/persistência
→ retorno autoritativo
→ DataService aplica retorno
→ UI reflete o estado
```

Uma sessão não deve precisar receber seu próprio Broadcast e baixar o contexto operacional completo para descobrir o resultado da própria gravação.

Se uma operação ainda não devolve informação suficiente, deve ser avaliado primeiro se o retorno remoto pode ser tornado autoritativo. Refresh global é fallback, não padrão.

### 6.3 Broadcast remoto

O Realtime continua sendo **notificação**, nunca fonte de verdade.

Payload permitido para mudança escolar conhecida:

```text
entity
operation
schoolId
```

Nenhum dado de negócio sensível é replicado pelo Broadcast.

### 6.4 Leitura dirigida por escola

Criar uma leitura canônica pequena, sob RLS, conceitualmente:

`read_school_operational_context(p_school_id, p_competence_id, p_history_statuses)`

Ela deve devolver o mesmo conjunto de entidades operacionais necessário ao produto, mas restrito à escola e às dependências históricas daquela escola.

A função não substitui `read_operational_context`. A leitura global continua existindo para bootstrap, troca de competência, reconciliação global e recuperação conservadora.

### 6.5 Aplicação de uma fatia escolar

`DataService` ganhará uma operação explícita para aplicar uma fatia escolar sem substituir as coleções de todas as outras escolas.

Contrato desejado:

```text
carregar contexto da escola X
→ validar envelope/canonical JSON
→ substituir no estado operacional somente a fatia pertencente a X
→ preservar todas as outras escolas
→ renderizar somente a superfície que necessita da mudança
```

A remoção de registros também deve convergir. Portanto, o merge não pode ser apenas “upsert por id”; ele deve substituir a fatia da escola dentro das seis coleções operacionais carregadas para a competência.

Antes de implementar esse merge, deve ser provado por schema/teste que as dependências operacionais relevantes não atravessam escolas. Se surgir dependência legítima cross-school, esta etapa para e o contrato é revisto.

### 6.6 Decisão de relevância

Para Broadcast com `schoolId` conhecido:

#### Usuário está no Prontuário da mesma escola

- executar leitura dirigida da escola;
- aplicar a fatia;
- atualizar a superfície quando for seguro;
- se estiver editando, adiar somente a reconciliação daquela escola.

#### Usuário está no Prontuário de outra escola

- não executar leitura global;
- registrar que a escola alterada está desatualizada;
- não reconstruir a escola atualmente aberta.

#### Usuário está em Dashboard/Carteira/Competências ou outra visão agregada

- carregar somente a escola alterada;
- aplicar a fatia;
- recalcular/renderizar a projeção global a partir do estado local atualizado.

O objetivo é manter indicadores atuais sem baixar todas as escolas novamente.

### 6.7 Escola desatualizada

Usar estado transitório mínimo por escola.

Cada escola conhecida terá apenas uma geração/revisão local monotônica em memória. Um Broadcast incrementa a geração. A leitura captura a geração no início e só reconhece a escola como reconciliada se nenhuma invalidação posterior tiver ocorrido durante a consulta.

Isso evita perder uma segunda alteração ocorrida durante uma leitura sem recriar uma máquina de estados global.

### 6.8 Navegação para escola desatualizada

Ao navegar para escola marcada como desatualizada:

- a rota canônica muda primeiro;
- uma leitura dirigida é iniciada automaticamente;
- a UI converge sem Ctrl+F5;
- a navegação não deve provocar segunda leitura pela própria renderização.

A “Próxima unidade”, links de Carteira, busca, Voltar/Avançar e deep links devem produzir a mesma autoridade de rota.

### 6.9 Foco, visibilidade e reconexão

Com Realtime saudável, voltar para a aba **não deve, por si só, significar baixar a competência inteira**.

Fallback proposto:

- escola atual marcada como dirty → reconciliar apenas essa escola;
- Realtime saudável e nada dirty → nenhuma leitura automática;
- reconexão após perda de Realtime ou evento sem escola conhecida → uma reconciliação global conservadora;
- troca de competência → leitura global;
- bootstrap/login → leitura global.

Dessa forma o caminho global permanece como rede de segurança, não como resposta cotidiana a cada gesto/evento.

## 7. Migração incremental

Nenhuma etapa apaga o caminho anterior antes que o substituto tenha prova RED → GREEN e E2E.

### Etapa 0 — baseline e testes de caracterização

- congelar `main=d9bf67f7...` como baseline;
- registrar comportamento e métricas atuais;
- reutilizar provas úteis de #407/#409 sem importar sua arquitetura;
- criar testes de produto para os cinco contratos principais.

### Etapa 1 — autoridade de rota

- garantir que decisões novas consultem `RadarNavigationHistory.currentRoute()`;
- provar “Próxima unidade”, links, busca, Back/Forward e deep link;
- não remover globais legados ainda.

### Etapa 2 — RPC/leitura por escola

- criar `read_school_operational_context` com RLS;
- implementar `querySchoolOperationalContext` no repository;
- implementar `DataService.loadSchoolOperationalContext`;
- testar equivalência entre fatia escolar da leitura global e leitura dirigida.

### Etapa 3 — aplicação de fatia escolar

- adicionar merge/substituição por escola ao StatePort/DataService;
- provar criação, atualização e exclusão;
- provar dependências de Pendência, tentativa, contato, NF e patrimônio.

### Etapa 4 — Realtime dirigido

- Broadcast passa a incluir `schoolId` sem dados de negócio;
- mesma escola → leitura dirigida;
- outra escola em Prontuário → dirty somente;
- superfície global → leitura dirigida + re-renderização agregada;
- evento sem escola → fallback global.

### Etapa 5 — simplificação do refresh de sessão

- remover uso rotineiro de leitura global em focus/visibility quando Realtime está saudável;
- manter reconexão/falha desconhecida como fallback conservador;
- preservar proteção contra sobrescrever edição ativa.

### Etapa 6 — remoção de mecanismos obsoletos

Somente após as etapas anteriores ficarem verdes:

- remover branches, timers, estados ou wrappers que não tenham mais função;
- remover compatibilidade temporária;
- atualizar ADR-054 ou substituí-la por ADR superveniente;
- atualizar modelo canônico, CURRENT_STAGE e documentação operacional.

A refatoração só é considerada concluída se o saldo final de complexidade for negativo.

## 8. Estratégia de segurança e rollback

Durante a migração haverá um **feature flag temporário** para o novo caminho de sincronização dirigida.

Regras:

- Production mantém o caminho atual enquanto o novo não estiver homologado;
- CI/Supabase descartável pode executar o caminho novo;
- o flag não cria regra de negócio nem autorização;
- depois da homologação e estabilização, o flag e o caminho antigo correspondente devem ser removidos;
- nenhuma migration desta frente será aplicada a Production sem etapa explícita de publicação e validação.

Não criar staging Supabase persistente sem autorização do usuário.

## 9. Testes obrigatórios de produto

### Contratos causais

1. própria gravação aparece imediatamente sem full refresh;
2. outra sessão altera a mesma escola → convergência automática;
3. outra sessão altera outra escola → zero leitura global na sessão observadora;
4. navegar depois para escola dirty → exatamente uma reconciliação dirigida;
5. Broadcast durante leitura → geração posterior não é perdida;
6. edição ativa → atualização não atropela formulário e converge ao terminar;
7. exclusão remota → registro realmente desaparece da fatia local;
8. reconexão após possível perda de eventos → convergência conservadora;
9. URL/rota/escola visível nunca divergem;
10. autorização/RLS não muda.

### Jornada operacional representativa

- 4 Controladores em escolas diferentes;
- 1 Assistente circulando entre essas escolas;
- 1 sessão adicional em Dashboard/visão global;
- centenas de operações de criação/correção/exclusão;
- período Controlador + Assistente na mesma escola;
- uma correção exclusiva da Assistente precisa chegar ao Controlador;
- navegação posterior para escola alterada;
- perda/reconexão de Realtime;
- reload final comparando navegador com banco.

### Stress adversarial

O antigo cenário de várias sessões disputando a mesma área permanece como stress, não como representação do uso normal.

## 10. Métricas de sucesso

No cenário representativo:

- alteração em escola alheia enquanto usuário está em outro Prontuário: **0 `read_operational_context`** provocadas por essa mudança;
- navegação para escola dirty: **1 leitura dirigida**, salvo nova alteração durante a própria leitura;
- mesma escola em duas sessões: convergência automática em poucos segundos;
- própria gravação: UI atualizada pelo retorno autoritativo sempre que o contrato remoto permitir;
- zero necessidade de Ctrl+F5;
- zero perda de gravação;
- zero divergência persistente rota/tela/escola;
- nenhum 5xx provocado por avalanche de leituras globais no benchmark de pico;
- queda material de bytes transferidos, SQL agregado e reconstruções de DOM em relação à baseline;
- nenhum relaxamento de RLS ou regra funcional.

Não há meta artificial de “zero leitura global”. Ela continua válida quando o evento é realmente global ou quando a integridade exige reconciliação conservadora.

## 11. Critério de parada e escalada

Não continuar adicionando patches se duas tentativas consecutivas exigirem novos estados temporais para corrigir efeitos produzidos pelo próprio mecanismo de sincronização.

Nesse caso:

1. parar a implementação;
2. identificar qual premissa do design falhou;
3. revisar este documento;
4. somente depois retomar código.

CI verde não substitui validação operacional.

## 12. Fora de escopo

Esta frente não pretende:

- redesenhar a interface visual do RADAR;
- alterar regras de PDDE;
- mudar permissões de Controlador/Assistente/SME/Inventário;
- transformar carteira em fronteira de autorização;
- reescrever todos os serviços de domínio;
- trocar Supabase;
- criar segunda fonte de verdade no navegador;
- aplicar a migration do #409 em Production;
- absorver automaticamente #407 ou #409.

## 13. Documentos e evidências que a implementação deve consultar

- `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
- `docs/decisions/ADR-054-sincronizacao-operacional-realtime.md`;
- `docs/evidence/2026-09-29-operational-context-set-based/README.md`;
- evidências e handoffs de #407;
- `docs/handoff/2026-10-04-pr409-codex-review.md`;
- `docs/evidence/2026-10-04-pr409-review/README.md`;
- evidência do incidente de Production versionada no #409;
- testes do #408 que protegem recuperação temporal e concorrência fiscal.

## 14. Resultado esperado

A arquitetura desejada deve poder ser explicada assim:

```text
Eu gravei algo
→ o retorno do servidor atualiza minha tela.

Outra pessoa alterou a escola que estou vendo
→ o Realtime avisa que essa escola mudou
→ o RADAR lê somente essa escola
→ minha tela converge.

Outra pessoa alterou outra escola
→ minha tela não é reconstruída
→ a escola fica marcada como atualizada remotamente
→ quando ela for relevante, o RADAR lê somente ela.

O Realtime caiu ou um evento não pôde ser localizado
→ o RADAR usa a leitura global como fallback seguro.
```

Se a implementação final exigir uma explicação significativamente mais complicada que essa para o fluxo cotidiano, a simplificação não atingiu o objetivo.