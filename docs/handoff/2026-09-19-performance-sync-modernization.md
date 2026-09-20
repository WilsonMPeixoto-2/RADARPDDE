# Checkpoint — modernização de performance e sincronização

**Data:** 19 de setembro de 2026
**Atualizado em:** 20 de setembro de 2026
**Classe documental:** Handoff corrente
**Baseline publicado:** PR #341 / merge 71b5a6e4967641c5dc8402ebadefbc22f9b5e5c6

## 1. Objetivo da rodada

Esta frente foi aberta para responder a dois sintomas operacionais reportados por usuários do RADAR:

1. lentidão geral em leituras e contextos operacionais;
2. necessidade recorrente de pressionar F5 para perceber alterações recentes, especialmente quando outra sessão havia modificado dados.

A investigação mostrou causas complementares:

- custo excessivo de autorização RLS calculada linha a linha;
- ausência de invalidação entre sessões;
- refresh contextual compartilhando fila com gravações;
- leituras antigas permanecendo em voo depois de se tornarem obsoletas;
- refresh adiado durante edição sem retomada suficientemente confiável;
- peso desnecessário no artefato público e instabilidade de LCP/CLS.

O objetivo não foi redesenhar regras de negócio. Avaliação, Nota Fiscal, Pendência, Inventário, perfis, competência, autoria e auditoria foram preservados.

## 2. Estado final já publicado

- SHA Production: 71b5a6e4967641c5dc8402ebadefbc22f9b5e5c6;
- Vercel: dpl_4KcvK1edZm9ZvCYYPBt8gVP8JfPU;
- deployment: READY;
- Supabase: scnryinorqeucbfkioxo, ACTIVE_HEALTHY;
- migrations remotas: 54;
- migration mais recente: 20260920013656_realtime_operational_invalidation;
- erros de runtime Vercel na janela de 1 hora pós-publicação consultada em 20/09/2026: nenhum.

A versão 20260920013656 é a versão canônica que ficou tanto na main quanto no histórico remoto. Não restaurar timestamps intermediários usados durante a preparação da branch.

## 3. Entregas concluídas

### PR #327 — refresh confiável e frontend publicado mais leve

Merge: 61d2762ecb37daa30cefcafe32e06042aa689772

- refresh pendente sobrevive a edição/modal e é retomado quando a interface fica segura;
- diálogos fechados mantidos no DOM não bloqueiam mais refresh;
- fechamento assíncrono por atributos ou remoção do modal é observado;
- lastRefreshAt só representa refresh realmente aplicado;
- CI mede o mesmo dist que a Vercel publica;
- artefato público reduzido em aproximadamente 725 KiB;
- fontes críticas WOFF2 são antecipadas;
- Lighthouse desktop estabilizado em aproximadamente 81% de Performance, LCP ~3,0 s e CLS ~0,08.

### PR #329 — autorização escolar set-based nas policies RLS

Merge: 83e2576548eca2c11bac0acb143cda7ad44cde4c
Migration: 20260919234500_rls_set_based_access

- accessible_school_ids();
- writable_school_ids();
- inventory_cre_school_ids();
- 25 policies operacionais migradas para conjuntos avaliados uma vez por statement;
- nenhuma dessas policies continua chamando can_access_school() ou can_write_school() linha a linha;
- wrappers históricos permanecem compatíveis;
- technical_admin, federal_assistant, sme_management, controller e inventory foram validados;
- escopos explícitos e exceção patrimonial de Inventário foram preservados.

### PR #330 — fila de gravação separada do refresh

Merge: ce42ace4b18be5a3326ee992d90cb0c4062a81a6

- gravações remotas continuam serializadas entre si;
- leitura operacional iniciada antes de uma gravação não bloqueia mais Salvar;
- leitura iniciada depois de escrita pendente aguarda a escrita já conhecida;
- iniciar gravação invalida o contexto operacional antigo;
- resposta antiga não pode sobrescrever resultado autoritativo mais novo.

Regressão protegida:

    refresh remoto lento em andamento
    → usuário salva
    → Salvar conclui sem aguardar a leitura
    → leitura antiga retorna stale
    → projeção local não é sobrescrita

### PR #331 — cancelamento físico de leituras obsoletas

Merge: cf9c22bc670461826cf89ca585313983c6a1cb78

- cada leitura operacional recebe AbortController;
- troca de competência aborta a leitura anterior;
- início de gravação aborta request contextual obsoleto;
- AbortSignal é propagado por paginação e dependências contextuais;
- cancelamento esperado retorna stale=true, aborted=true;
- cancelamento provocado pelo RADAR não vira erro funcional.

### PR #332 — sincronização operacional entre sessões

Merge: ec6a22cac374d85907aca407a844748db1a20d4e
Migration canônica: 20260920013656_realtime_operational_invalidation

- canal privado radar:operational;
- evento operational-change;
- triggers em verifications, registered_invoices, pendencies, pendency_attempts, pendency_contacts e assets;
- payload contém somente entidade e operação;
- nenhum dado escolar, usuário, valor, documento ou conteúdo de negócio trafega no Broadcast;
- cliente autenticado recebe invalidação, mas não recebe policy para publicar eventos;
- Broadcast é coalescido por debounce;
- primeira assinatura não recarrega desnecessariamente;
- reconexão força releitura para recuperar eventos eventualmente perdidos;
- se o usuário estiver editando, a invalidação fica pendente e é aplicada quando a edição termina.

### Prova ponta a ponta A → B

    sessão A autenticada
    + sessão B autenticada
    → ambas na mesma escola/competência
    → A altera avaliação
    → trigger emite Broadcast
    → B recebe evento
    → B relê Supabase pela própria RLS
    → B atualiza projeção e UI sem F5

O mesmo teste valida proteção durante edição:

    B está editando
    → A altera
    → B recebe invalidação
    → refresh fica pendente
    → estado visível de B não é atropelado
    → B termina edição
    → refresh é aplicado
    → B converge para o estado canônico

O teste passou dentro da suíte Supabase local obrigatória, com 14/14 testes verdes no conjunto que inclui a prova multiusuário.

### PR #336 — retry de leitura reconciliado com o cliente Supabase

Merge: 232626a6574963bdbf22dbed5ffefeb6518a4f48

- removido o `withSafeReadRetry()` próprio do RADAR;
- cada leitura lógica é executada uma vez pelo repositório;
- retry de transporte de GET/PostgREST elegível fica sob responsabilidade do `@supabase/supabase-js 2.116.0`;
- POST de escrita não ganhou retry automático;
- fail-closed, paginação, AbortSignal, RLS, idempotência e concorrência otimista foram preservados.

### PR #338 — invalidação durante refresh em voo

Merge: c404c618dfea494273ccf880d725009e82065c26

Foi reproduzida a corrida em que um Broadcast chegava enquanto `refreshPromise` já existia. A invalidação nova podia ser absorvida pela leitura antiga. O controlador passou a preservar a pendência e forçar nova releitura depois que a consulta em voo termina.

### PR #339 — falha transitória da releitura Realtime

Merge: 6c92b98b03f3621e8603ff951dadd0ffb4f67f8d

RED provou que uma releitura disparada pelo Broadcast podia falhar e perder a invalidação. A correção preserva a pendência e executa uma única segunda tentativa controlada, sem loop infinito.

### PR #340 — escrita abortando leitura Realtime

Merge: 4061dd808ed526f3dfac089a84e0735a510ebed1

A primeira versão do RED falhava antes do interleaving por `INVALID_STATE_PORT`. O harness foi corrigido sem alterar produto e o RED verdadeiro confirmou que uma gravação podia abortar a leitura Realtime e deixar zero releituras agendadas. O estado `stale/aborted` passou a preservar a pendência e receber uma retry controlada.

### PR #341 — drenagem pós-write da pendência

Merge: 71b5a6e4967641c5dc8402ebadefbc22f9b5e5c6

RED provou que tanto escrita concluída quanto escrita rejeitada podiam terminar sem gatilho para drenar a invalidação tornada pendente. O wrapper já existente de `DataService.execute()` passou a agendar, em `finally`, uma verificação no próximo tick e executar `flushPending('write-settled')` somente quando necessário.

A escrita nunca é repetida. Não há polling contínuo, terceira retry Realtime, migration ou mudança de regra de negócio. O #341 fechou com 10/10 workflows verdes e Production READY.

## 4. Decisões arquiteturais vigentes

### 4.1 Supabase continua sendo a fonte canônica

    Broadcast = invalidação
    Supabase/PostgREST = releitura
    RLS = autorização efetiva
    DataService/StatePort = projeção descartável
    UI = apresentação

### 4.2 Broadcast em vez de Postgres Changes

Não migrar automaticamente para Postgres Changes. O objetivo é invalidar, não replicar linhas, e esse caminho pode reintroduzir custo por assinante/evento.

### 4.3 Gravação tem prioridade sobre refresh

Leitura de background nunca deve ficar na frente de uma ação explícita de persistência do usuário.

### 4.4 Edição local não pode ser atropelada

Invalidação recebida durante formulário/modal/campo ativo é marcada como pendente e aplicada quando a superfície volta a ser segura.

### 4.5 Cancelamento não é erro funcional

Request obsoleto abortado pelo próprio RADAR é fluxo esperado de concorrência.

### 4.6 Invalidação não pode desaparecer em interleavings

- invalidação recebida durante uma leitura em voo não pode ser consumida por snapshot anterior;
- falha transitória de releitura preserva a necessidade de atualização;
- `stale/aborted` causado por escrita converge por retry controlada;
- término de uma escrita drena refresh pendente sem depender de F5 ou interação incidental;
- não existe polling contínuo nem retry automático de escrita.

## 5. Evidências de validação do baseline atual

No candidato final do PR #332 ficaram verdes:

- Validar RADAR PDDE;
- Testes E2E Playwright;
- Supabase readiness;
- Supabase local + Auth + RLS + pgTAP;
- Confiabilidade funcional com Supabase real;
- Ciclos funcionais reais com Supabase;
- Gate remoto de perfis e viewports;
- Backup e restauração descartáveis;
- Homologação integral pré-production;
- Lighthouse CI;
- CodeQL;
- Saúde das dependências;
- Retificação auditável direcionada.

O teste multiusuário foi tornado parte obrigatória tanto do readiness Supabase quanto da homologação integral.

A rodada adversarial #338–#341 acrescentou testes de composição com leitura lenta, Broadcast, falha de rede, AbortController real e escrita concorrente. No baseline final #341 ficaram verdes validação geral, Supabase real, readiness, ciclos funcionais, perfis/viewports, Playwright, Lighthouse, CodeQL, retificação direcionada e homologação integral.

## 6. Pendências reais depois desta rodada

### P1 — medir ganho pós-RLS em janela representativa

Recolher deltas de pg_stat_statements depois de volume real suficiente e comparar school_programs, verifications, registered_invoices, pendencies e leituras de user_profiles/profiles.

Não usar uma única execução rápida como prova universal.

### P1/P2 — avaliar RPC única de contexto operacional

O contexto ainda é montado em ondas de consultas PostgREST.

Candidato futuro: get_operational_context_v2(...).

Somente implementar se medição demonstrar benefício material. Antes de substituir o caminho atual, provar paridade exata de contrato, preservar RLS, manter fallback e validar cancelamento e dependências históricas.

### P2 — indicador discreto de sincronização

A infraestrutura já emite status do canal. Pode ser útil mostrar sincronizado, reconectando ou atualização pendente, mas não é bloqueante.

### P2 — índices reportados como não utilizados

Não remover índices com base no advisor logo após reset/upgrade de estatísticas. Esperar janela representativa.

## 7. Itens deliberadamente fora da sequência atual

- upgrade de compute do Supabase;
- Redis;
- cache agressivo de estado operacional;
- Postgres Changes em todas as tabelas;
- reescrita de framework;
- remoção indiscriminada de índices;
- relaxamento dos pisos Lighthouse;
- hardening de senha vazada como condição desta frente.

## 8. Critério para considerar a modernização encerrada

- Production permanecer estável após #341;
- F5 não ser requisito normal de uso;
- gravação continuar independente de refresh lento;
- sincronização A → B continuar em gate obrigatório;
- RLS continuar semanticamente equivalente;
- decisão sobre RPC única ser tomada com base em medição;
- documentação canônica refletir o baseline final;
- auditoria final de código + Supabase + Vercel não encontrar regressão material.

## 9. Rota de retomada

1. AGENTS.md;
2. docs/reference/SYSTEM_CANONICAL_MODEL.md;
3. docs/CURRENT_STAGE.md;
4. este handoff;
5. docs/decisions/ADR-054-sincronizacao-operacional-realtime.md;
6. docs/reference/ENGINEERING_METHOD.md;
7. docs/reference/FRONTEND_USER_VALIDATION_GATE.md;
8. código e ambientes remotos do SHA vigente.

Não retomar planos antigos como fila automática. Revalidar main, Supabase e Vercel antes de executar qualquer pendência.