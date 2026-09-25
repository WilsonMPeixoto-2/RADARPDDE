# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura
**Atualizado em:** 25 de setembro de 2026

## 1. Baseline vigente

A baseline publicada mais recente incorpora as correções funcionais e os refinamentos visuais dos PRs #370 e #371 **sobre** a arquitetura de performance/sincronização já consolidada nos PRs #327–#344.

- **PR #370:** merged — UX específica de `Despesa a identificar` alinhada ao fluxo funcional já existente, sem alteração de schema, RPC ou transições;
- **PR #371:** merged — polimento visual global reaplicado sobre a baseline do #370, sem alteração de regras de negócio;
- **main / Production:** `6dd4b92367dfa7f9f45e3a9db49ebde5b21807c7`;
- **Vercel Production:** `dpl_6V1cQ9FvLdy9bQXgpd2TruxczT81`, READY, alias `radarpdde-fix.vercel.app`;
- **manifesto Production:** `dataMode=supabase-production`, `supabaseRepositoryEnabled=true`, `productionActivationApproved=true`;
- **Supabase:** `scnryinorqeucbfkioxo`;
- **runtime errors após o deploy:** nenhum erro agrupado observado na janela de validação;
- **árvore do merge #371:** idêntica à árvore do head homologado do PR.

O fluxo específico vigente de `Despesa a identificar` preserva o mesmo lançamento e a mesma Pendência do cadastro provisório até a identificação. O primeiro documento usa **Registrar envio / identificação da despesa**; depois a Pendência entra em **Aguardando reanálise**, acessível tanto pelo Prontuário quanto pela página de Pendências. A retificação dos dados provisórios reutiliza a retificação auditável existente.

Production continua em modo Supabase canônico. Não existe LocalStorage como banco operacional paralelo.

### 1.1 Baseline arquitetural anterior preservada

A modernização de performance e sincronização concluída pelos PRs #327, #329, #330, #331, #332, #336, #338, #339, #340 e #341, com provas adicionais nos #342–#344, permanece vigente. O baseline medido no #344 foi `75520d43a5ca9bc2607318cc6a70ba2a7494ca92`; os PRs posteriores preservaram seus invariantes de RLS set-based, prioridade de gravação, cancelamento de leitura obsoleta, Realtime por invalidação e proteção durante edição.

## 2. Objetivo da rodada concluída

A frente foi aberta por dois sintomas operacionais:

1. leituras/contextos mais lentos do que o esperado para o volume real do RADAR;
2. usuários precisando pressionar F5 para perceber mudanças recentes, especialmente após alteração feita por outra sessão.

A investigação separou as causas e tratou cada uma sem alterar regras de negócio:

- RLS escolar calculada repetidamente por linha;
- ausência de invalidação entre sessões;
- refresh compartilhando fila com gravações;
- leituras obsoletas continuando em voo;
- refresh durante edição sem retomada suficientemente robusta;
- duplicação entre retry próprio e retry nativo do cliente Supabase;
- invalidações que podiam ser perdidas em interleavings entre refresh em voo, falha de rede e gravações concorrentes;
- peso desnecessário no artefato público e instabilidade de LCP/CLS.

## 3. Entregas integradas

| PR | Merge | Resultado principal |
|---:|---|---|
| #327 | 61d2762ecb37daa30cefcafe32e06042aa689772 | refresh pendente confiável, build público otimizado, -725 KiB, Lighthouse ~81%, LCP ~3,0 s, CLS ~0,08 |
| #329 | 83e2576548eca2c11bac0acb143cda7ad44cde4c | RLS set-based; 25 policies sem autorização escolar linha a linha |
| #330 | ce42ace4b18be5a3326ee992d90cb0c4062a81a6 | fila de gravação independente de refresh |
| #331 | cf9c22bc670461826cf89ca585313983c6a1cb78 | AbortController/AbortSignal para leituras operacionais obsoletas |
| #332 | ec6a22cac374d85907aca407a844748db1a20d4e | Broadcast privado de invalidação e sincronização A → B sem F5 |
| #336 | 232626a6574963bdbf22dbed5ffefeb6518a4f48 | retry de leitura reconciliado com `supabase-js 2.116.0`; uma execução lógica no RADAR |
| #338 | c404c618dfea494273ccf880d725009e82065c26 | invalidação durante refresh em voo força nova releitura |
| #339 | 6c92b98b03f3621e8603ff951dadd0ffb4f67f8d | falha de rede preserva invalidação e recebe uma retry controlada |
| #340 | 4061dd808ed526f3dfac089a84e0735a510ebed1 | escrita que aborta leitura Realtime não perde convergência |
| #341 | 71b5a6e4967641c5dc8402ebadefbc22f9b5e5c6 | refresh pendente é drenado após término da gravação |
| #337 | 24a2d1ca906aa771b37820b113caa20efb75d438 | checkpoint documental e snapshots pós-RLS |
| #342 | ad4a97dc7f4eff3df51deb32dd3acdcd2383a23a | prova frontend de escrita auditável, Abort real e convergência sem F5 |
| #343 | 039a88cc55485ca46ad55edcbe665e1b349272cc | configuração pública preservada como JSON; monitor Production recuperado |
| #344 | 75520d43a5ca9bc2607318cc6a70ba2a7494ca92 | jornadas autenticadas instrumentadas; decisão quantitativa de manter arquitetura atual |

## 4. Estado arquitetural atual

### 4.1 Persistência e autorização

Supabase permanece a fonte canônica de persistência.

A autorização escolar foi convertida para conjuntos calculados por statement:

- accessible_school_ids();
- writable_school_ids();
- inventory_cre_school_ids().

Os wrappers públicos históricos permanecem compatíveis. A mudança foi de execução, não de regra de acesso.

### 4.2 Prioridade de gravação

Gravações remotas permanecem serializadas entre si, mas uma leitura operacional já em andamento não pode atrasar uma ação explícita de Salvar.

Leitura iniciada depois de uma escrita pendente aguarda a escrita já conhecida; leitura mais antiga é marcada como obsoleta.

### 4.3 Cancelamento de leitura obsoleta

Nova competência ou início de gravação cancela fisicamente o request contextual anterior. Cancelamento esperado pelo próprio RADAR retorna stale/aborted e não vira erro funcional para o usuário.

### 4.4 Sincronização entre sessões

Realtime usa Broadcast privado somente para invalidação.

Fluxo canônico:

    mudança persistida
    → trigger emite invalidação mínima
    → sessão remota recebe o evento
    → sessão relê Supabase
    → RLS filtra o que pode ser visto
    → DataService/StatePort reconciliam
    → UI converge

O Broadcast não transporta escola, usuário, valor, documento nem registro operacional.

### 4.5 Proteção durante edição

Se uma invalidação chega enquanto formulário/modal/campo está ativo, o refresh fica pendente. Quando a edição termina, o contexto é relido e aplicado. A edição local não é atropelada.

A auditoria adversarial posterior acrescentou garantias de convergência para interleavings antes não cobertos: invalidação durante leitura em voo, falha transitória da releitura, leitura Realtime abortada por uma gravação e pendência remanescente após a escrita. O desenho vigente usa no máximo uma retry Realtime controlada e uma drenagem pós-write; não existe polling contínuo nem retry automático de escrita.

## 5. Evidência funcional e técnica

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

O cenário multiusuário passou em gate obrigatório:

    A altera avaliação
    → B recebe Broadcast
    → B relê o estado canônico
    → B atualiza a UI sem F5

e também:

    B está editando
    → A altera
    → B marca refresh pendente
    → B termina edição
    → B converge sem perder o trabalho em andamento

Depois dos PRs #336 e #338–#341, a validação foi ampliada com testes RED → GREEN de composição. Foram provados e corrigidos: retry duplicado de leitura; invalidação recebida durante refresh em voo; falha de rede na releitura Realtime; leitura Realtime abortada por gravação; e pendência que precisava ser drenada após a escrita. No #341, 10/10 workflows ficaram verdes, incluindo Supabase real, readiness, ciclos funcionais, perfis/viewports, Playwright, Lighthouse, CodeQL e homologação integral.

## 6. Estado de Production

Em 21/09, o deployment `dpl_FHt2mSxrzWbq491y497RDCuf7LsN` ficou READY no merge `75520d43a5ca9bc2607318cc6a70ba2a7494ca92`. O #344 altera somente testes, workflow, evidência e documentação; o runtime funcional permanece o consolidado no #343. Supabase ACTIVE_HEALTHY.

O #343 corrigiu a incompatibilidade entre minificação de `config.runtime.js` e parser JSON. Monitor pós-merge [35541683729](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/35541683729), monitor posterior [35555050425](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/35555050425) e smoke autenticado [35549794564](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/35549794564) terminaram SUCCESS.

A checagem agregada de integridade [35550316696](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/35550316696), às 01:16 UTC de 21/09, passou pelo caminho autorizado do workflow. O SQL exige `schemaVersion=1`, `status=healthy` e `totalIssues=0`. Isso fecha a pendência anterior da chamada negada ao conector; certifica os invariantes automatizados, não uma revisão manual de cada documento escolar.

A migration Realtime que ficou canônica em main e no remoto é:

20260920013656_realtime_operational_invalidation

Não reintroduzir timestamps intermediários usados durante a preparação da branch.

## 7. Encerramento dos objetivos originais

A modernização de performance/sincronização está **formalmente encerrada em 21/09/2026**. A tabela abaixo substitui listas antigas como critério de conclusão desta frente.

| Objetivo original | Estado final | Evidência/decisão |
|---|---|---|
| RLS / escolas acessíveis como conjunto | **Implementado** | #329; policies set-based; equivalência de perfis e RLS revalidada |
| refresh não ser perdido durante edição | **Implementado** | pending refresh + retomada segura; #327/#338–#341 |
| `pendingRefresh` após modal/edição | **Implementado** | retomada automática e E2E multiusuário |
| `lastRefreshAt` somente após aplicação real | **Implementado** | #327; protegido por regressão |
| instrumentação causal de jornada | **Implementado como ferramenta de teste** | #344; 19 amostras brutas preservadas, sem alterar runtime |
| indicador visual de sincronização | **Não bloqueante / não implementado** | estado Realtime existe; não há defeito funcional que exija UI adicional |
| consolidar políticas de retry | **Implementado** | #336; retry próprio removido, transporte delegado ao cliente Supabase |
| cancelar consultas obsoletas com AbortSignal | **Implementado** | #331 |
| separar background reads da fila de writes | **Implementado** | #330 |
| RPC única de contexto | **Não implementar nesta rodada** | contexto mediano ~13,3 ms; benefício material não demonstrado |
| Realtime Broadcast de invalidação | **Implementado** | #332 + hardening #338–#342 |
| revisionamento operacional numérico | **Substituído por solução posterior comprovada** | Broadcast + reconnect/focus + pending refresh + pós-write + releitura canônica; E2E sem F5 |
| renderização parcial adicional do Prontuário | **Não implementar nesta rodada** | render síncrono mediano ~3,9 ms; gargalo não demonstrado |
| cache agressivo de JS/CSS/estado | **Não implementar nesta rodada** | build já reduzido; ausência de gargalo que justifique maior complexidade |
| upgrade de Supabase/compute | **Não fazer** | medições atuais não sustentam custo/benefício |

### 7.1 Acompanhamento longitudinal, não bloqueante

A primeira janela pós-RLS com novas chamadas registrou 798 chamadas adicionais nas 11 assinaturas acompanhadas, mas somente 6–8 chamadas novas nas consultas de contexto e sem distinção entre uso humano e automação. Isso não permite calcular um ganho percentual universal.

Continuar observando `pg_stat_statements` quando houver volume real suficiente. Essa observação **não reabre a modernização** por si só.

### 7.2 Índices

Não remover índices apenas por `idx_scan=0`. Parte deles implementa unicidade/integridade e os demais têm custo/volume pequeno. Qualquer remoção futura exige janela estatística representativa e benefício mensurável.

### 7.3 Novas intervenções

RPC única, render parcial, cache adicional, revisionamento numérico ou indicador visual só voltam ao backlog se surgirem dados ou defeitos concretos que justifiquem a mudança.

## 8. Itens deliberadamente fora da sequência atual

Não são próximos passos automáticos:

- upgrade de compute do Supabase;
- Redis;
- cache agressivo de estado operacional;
- Postgres Changes em todas as tabelas;
- reescrita de framework;
- remoção indiscriminada de índices;
- relaxamento dos pisos Lighthouse;
- hardening de senha vazada como condição desta frente.

## 9. Situação operacional

O PR #342 foi integrado após 7/7 workflows SUCCESS no HEAD `065f53013edb1626ac95b17d387716dfe65850cf` e inspeção das imagens do run `35526578564`. A prova exige duas identidades autenticadas, Broadcast, leitura HTTP real cancelada por escrita auditável, releitura e convergência antes de navegação, zero reload e confirmação no Prontuário. O Lighthouse passou sem alterar budgets.

A revisão integrada de 20/09 não encontrou nova regressão nos contratos de sincronização examinados. Encontrou a incompatibilidade de serialização no monitor descrita acima, reproduzida RED → GREEN. O handoff registra o escopo, as evidências e os limites dessa revisão. A auditoria agregada atual de integridade passou em 21/09, e a primeira janela pós-RLS com deltas está preservada. Aferição representativa de ganho continua em acompanhamento. O #344 instrumenta jornadas em Supabase local: 19 amostras preservadas no handoff, com medianas de 13,3 ms para carregamento de contexto e 45,3 ms para o cliente da RPC de gravação. Não extrapolar esses números para Production. A decisão atual é manter a arquitetura e acompanhar uso real.

Não há defeito funcional conhecido bloqueando uso normal do RADAR no baseline atual.

A auditoria adversarial encontrou quatro arestas reais de convergência nos PRs #338–#341, todas reproduzidas antes da correção e protegidas por regressão depois dela. Isso reforça que gates verdes demonstram os contratos cobertos, não ausência absoluta de interleavings não testados.

Novos relatos e novas hipóteses devem ser tratados como incidentes concretos, preferencialmente com RED → GREEN e teste de composição. Não reabrir automaticamente planos históricos nem desfazer decisões posteriores já certificadas.

## 10. Handoff corrente

Checkpoint detalhado:

docs/handoff/2026-09-19-performance-sync-modernization.md

Decisão arquitetural associada:

docs/decisions/ADR-054-sincronizacao-operacional-realtime.md

## 11. Critério de encerramento da modernização

**Atendido em 21/09/2026.**

- Production estável e READY;
- F5 não é requisito normal de convergência;
- gravação permanece independente de refresh lento;
- sincronização A → B e interleavings críticos permanecem cobertos por gates;
- RLS continua set-based e semanticamente preservada;
- decisão sobre RPC/render foi tomada por medição;
- integridade agregada passou pelo caminho autorizado;
- monitor Production e leitura autenticada estão verdes;
- auditoria final não encontrou regressão material bloqueante.

A partir deste ponto, medições futuras são observabilidade operacional. Não formam fila automática de refatoração.

## 12. Rota de retomada

Ler nesta ordem:

1. ../AGENTS.md;
2. reference/SYSTEM_CANONICAL_MODEL.md;
3. reference/PRODUCT_SURFACE_CATALOG.md;
4. este CURRENT_STAGE.md;
5. handoff/2026-09-19-performance-sync-modernization.md;
6. decisions/ADR-054-sincronizacao-operacional-realtime.md;
7. reference/ENGINEERING_METHOD.md;
8. reference/FRONTEND_USER_VALIDATION_GATE.md;
9. reference/STATUS_DOCUMENTOS.md;
10. matriz funcional e ADRs especializados conforme a frente.

Revalidar sempre main, Vercel e Supabase quando a decisão depender do estado ao vivo.
