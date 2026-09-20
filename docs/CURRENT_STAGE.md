# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura
**Atualizado em:** 20 de setembro de 2026

## 1. Baseline vigente

O baseline atualmente publicado incorpora a rodada de modernização de performance e sincronização concluída pelos PRs #327, #329, #330, #331, #332, #336, #338, #339, #340 e #341, com prova frontend adicional no #342.

- **PR #342:** merged (prova E2E, sem mudança de runtime)
- **merge de Production conferido às 22:00 UTC:** ad4a97dc7f4eff3df51deb32dd3acdcd2383a23a
- **Vercel Production:** dpl_XiHbqtceCMiWpW4QDNKWxK1kzneL
- **deployment:** READY
- **Supabase:** scnryinorqeucbfkioxo
- **Supabase status:** ACTIVE_HEALTHY
- **migrations remotas:** 54
- **migration mais recente:** 20260920013656_realtime_operational_invalidation
- **erros de runtime Vercel observados após publicação:** nenhum no intervalo consultado.

Production continua em modo Supabase canônico. Não existe LocalStorage como banco operacional paralelo.

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

Às 22:00 UTC, o deployment `dpl_XiHbqtceCMiWpW4QDNKWxK1kzneL` estava READY e correspondia ao merge `ad4a97dc7f4eff3df51deb32dd3acdcd2383a23a`. O projeto Supabase foi revalidado como ACTIVE_HEALTHY, com 54 migrations remotas.

A consulta Vercel de 20/09/2026 entre 16:57 e 22:00 UTC não retornou logs error/fatal. Isso não cobre erros no navegador. O monitor pós-merge falhou em `PRODUCTION_RUNTIME_INVALID`: o otimizador convertia o JSON de `config.runtime.js` em sintaxe JS que o parser do monitor não aceita. Esta entrega preserva esse arquivo gerado, mantém a minificação restante e acrescenta teste do build final contra o parser real. A aprovação pós-publicação exige o monitor verde; READY isoladamente não comprova saúde funcional.

A migration Realtime que ficou canônica em main e no remoto é:

20260920013656_realtime_operational_invalidation

Não reintroduzir timestamps intermediários usados durante a preparação da branch.

## 7. Pendências reais

### P1 — medir ganho pós-RLS em janela representativa

Coletas de 20/09 às 03:37:00 e 11:04:42 UTC tiveram **zero chamadas novas** nas 11 assinaturas autenticadas acompanhadas. A coleta bruta de 21:57:55 UTC confirmou os mesmos 11 queryids, 16.449 chamadas e deltas zero, com reset e início das estatísticas preservados. A janela não permite calcular média pós-migração nem justificar RPC única. Snapshots e SQL reproduzível estão vinculados no handoff corrente.

Coletar deltas de pg_stat_statements depois de volume real suficiente e comparar especialmente:

- school_programs;
- verifications;
- registered_invoices;
- pendencies;
- user_profiles/profiles.

Não classificar uma única consulta rápida como prova definitiva.

### P1/P2 — decidir RPC única de contexto operacional

O contexto ainda é montado em ondas de consultas PostgREST.

Candidato futuro: get_operational_context_v2(...).

Somente implementar se a medição demonstrar benefício material. Antes da troca, provar paridade exata do contrato, manter fallback durante rollout e preservar RLS, AbortSignal e dependências históricas.

### P2 — indicador discreto de sincronização

O módulo Realtime já emite estado de conexão. Pode ser útil mostrar sincronizado/reconectando/atualização pendente, mas isso não é bloqueante.

### P2 — índices ainda reportados como não utilizados

Não remover índices apenas pelo advisor enquanto a janela pós-reset/upgrade de estatísticas não for representativa.

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

A revisão integrada de 20/09 não encontrou nova regressão nos contratos de sincronização examinados. Encontrou a incompatibilidade de serialização no monitor descrita acima, reproduzida RED → GREEN. O handoff registra o escopo, as evidências e os limites dessa revisão. A medição real pós-RLS e a auditoria atual de integridade de Production continuam pendentes; não declarar encerramento integral.

Não há defeito funcional conhecido bloqueando uso normal do RADAR no baseline atual.

A auditoria adversarial encontrou quatro arestas reais de convergência nos PRs #338–#341, todas reproduzidas antes da correção e protegidas por regressão depois dela. Isso reforça que gates verdes demonstram os contratos cobertos, não ausência absoluta de interleavings não testados.

Novos relatos e novas hipóteses devem ser tratados como incidentes concretos, preferencialmente com RED → GREEN e teste de composição. Não reabrir automaticamente planos históricos nem desfazer decisões posteriores já certificadas.

## 10. Handoff corrente

Checkpoint detalhado:

docs/handoff/2026-09-19-performance-sync-modernization.md

Decisão arquitetural associada:

docs/decisions/ADR-054-sincronizacao-operacional-realtime.md

## 11. Critério de encerramento da modernização

A rodada pode ser classificada como integralmente encerrada quando:

- Production permanecer estável após #341;
- F5 não for requisito normal de uso;
- gravação continuar independente de refresh lento;
- sincronização A → B continuar coberta por gate obrigatório;
- RLS continuar semanticamente equivalente;
- decisão sobre RPC única for tomada com base em medição;
- auditoria final de código + Supabase + Vercel não encontrar regressão material.

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
