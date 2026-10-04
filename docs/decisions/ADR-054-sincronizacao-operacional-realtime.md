# ADR-054 — Sincronização operacional por invalidação Realtime

**Status:** Aprovada, implementada e publicada
**Data:** 19 de setembro de 2026
**Atualizada em:** 4 de outubro de 2026

## Contexto

Sessões diferentes do RADAR podiam permanecer com projeções locais divergentes até foco, mudança de visibilidade ou F5. O sistema já possuía Supabase canônico, RLS, retorno autoritativo de escrita e proteção por row_version.

A solução não deveria criar segunda fonte de verdade, replicar registros de negócio pelo WebSocket nem permitir que Realtime bypassasse autorização.

## Decisão

O RADAR usa Supabase Realtime Broadcast privado somente como mecanismo de invalidação.

    mudança persistida no PostgreSQL
    → trigger pós-mudança
    → Broadcast privado mínimo
    → sessão remota recebe invalidação
    → releitura do contexto canônico
    → RLS filtra o que a sessão pode ler
    → DataService/StatePort atualizam projeção
    → UI converge

Tópico canônico: radar:operational
Evento canônico: operational-change

O payload não transporta dados de negócio. Contém apenas informação mínima de entidade/operação.

### Adendo candidato do PR #409: relevância por escola

O PR #409, ainda em revisão e **não publicado**, propõe refinar a invalidação sem mudar esta decisão arquitetural:

- o Broadcast pode acrescentar `schoolId` como metadado mínimo de roteamento quando a escola afetada é determinável;
- `schoolId` não carrega conteúdo operacional da escola e não concede acesso;
- uma sessão que esteja no Prontuário de outra escola pode adiar a releitura completa e marcar a escola alterada como desatualizada;
- ao navegar para a escola marcada, a reconciliação deve ocorrer automaticamente, sem Ctrl+F5;
- superfícies globais continuam conservadoras e reconciliam mudanças escolares porque podem depender de várias escolas;
- evento sem escola conhecida e reconexão continuam seguindo o caminho global/conservador;
- toda leitura continua passando pela RLS vigente.

Enquanto o #409 não for integrado e publicado, este adendo registra apenas o contrato candidato e os critérios de revisão. O comportamento canônico de Production continua sendo o efetivamente publicado.

## Entidades que invalidam o contexto

- verifications;
- registered_invoices;
- pendencies;
- pendency_attempts;
- pendency_contacts;
- assets.

## Segurança

- canal privado;
- realtime.messages protegido por RLS;
- policy de recepção apenas para authenticated com perfil institucional ativo;
- cliente não recebe policy INSERT para publicar invalidações;
- Broadcast não concede acesso a registros;
- toda releitura continua submetida à RLS operacional.

## Concorrência e UX

- rajadas são coalescidas;
- primeira assinatura não força refresh;
- reconexão força releitura;
- invalidação durante edição não sobrescreve formulário/modal;
- refresh fica pendente até a superfície voltar a ser segura;
- nova leitura ou gravação pode abortar request operacional obsoleto;
- invalidação recebida durante refresh em voo força nova releitura depois da consulta antiga;
- falha de rede na releitura preserva a invalidação e admite uma única retry controlada;
- leitura Realtime abortada por escrita retorna `stale/aborted` sem perder a obrigação de convergir;
- término da escrita agenda drenagem da pendência no próximo tick;
- não existe polling contínuo nem retry automático de escrita.

## Alternativas rejeitadas

### Postgres Changes como mecanismo principal

Não adotado. O objetivo é invalidar, não replicar linhas, e o custo de autorização por assinante/evento pode crescer.

### Streaming de registros pelo Broadcast

Rejeitado por criar risco de segunda fonte de verdade, payload excessivo e duplicação de autorização.

### Polling frequente

Rejeitado como mecanismo principal por elevar leituras e latência quando o banco já pode emitir invalidação.

### Cache agressivo

Rejeitado como resposta ao problema de sincronização. Cache não corrige invalidação ausente.

## Consequências

Benefícios:

- outra sessão percebe mudança sem F5;
- Supabase permanece autoridade;
- RLS continua barreira de acesso;
- payload Realtime é pequeno;
- eventos perdidos podem ser recuperados por releitura em reconexão;
- edição local não é atropelada.

Custos:

- cada invalidação relevante pode provocar releitura contextual;
- debounce é necessário para rajadas;
- disponibilidade do Realtime influencia rapidez da convergência, mas não a integridade dos dados;
- foco/reconexão continuam úteis como fallback;
- a convergência não depende apenas desses eventos incidentais: pendências causadas por escrita são drenadas no pós-write.

O candidato #409 tenta reduzir especificamente o primeiro custo quando a escola afetada é conhecida e irrelevante para o Prontuário aberto. Esse refinamento só é aceitável se não reduzir a convergência posterior nem transformar o metadado de escola em mecanismo de autorização.

## Evidência

O PR #332 adicionou gate E2E obrigatório com duas sessões autenticadas:

    A altera
    → B recebe sem reload
    → UI de B converge

e:

    B está editando
    → A altera
    → B marca refresh pendente
    → B termina edição
    → atualização é aplicada

A prova roda dentro da pilha Supabase local com Auth, RLS, Realtime e frontend reais.

Os PRs #338–#341 ampliaram a evidência com testes RED → GREEN de interleavings. Foram reproduzidos e corrigidos: Broadcast durante refresh em voo, falha da releitura, Abort causado por escrita e pendência sem drenagem pós-write. Nos PRs #340 e #341, os commits GREEN passaram 10/10 workflows, incluindo Supabase real, E2E, readiness e homologação integral.

O PR #408 reforçou o contrato de recuperação com cooldown limitado, ordenações de foco/visibilidade e proteção contra perda de invalidação em leituras stale/abortadas. Esses testes permanecem regressões obrigatórias para qualquer refinamento posterior.

O PR #409 acrescenta, como evidência candidata, `tests/unit/operational-school-relevance.test.js` e o contrato pgTAP atualizado em `supabase/tests/database/realtime-operational-invalidation.test.sql`. A evidência consolidada e os limites estão em `docs/evidence/2026-10-04-production-incident-school-relevance.md`.

## Relações

- PR #329: RLS set-based;
- PR #330: fila de gravação independente de refresh;
- PR #331: cancelamento físico de leituras obsoletas;
- PR #332: implementação desta ADR;
- PR #338: preservação de invalidação durante refresh em voo;
- PR #339: retenção e retry controlada após falha de releitura;
- PR #340: convergência quando gravação aborta leitura Realtime;
- PR #341: drenagem pós-write de refresh pendente;
- PR #408: hardening seletivo de recuperação, concorrência e gates;
- PR #409: candidato de relevância por escola, ainda em revisão.

O PR #342 acrescentou prova pela UI com duas identidades distintas: Broadcast → leitura real retida → escrita auditável → Abort → releitura → convergência antes de navegar, sem reload. HEAD `065f53013edb1626ac95b17d387716dfe65850cf` aprovado em 7 workflows; screenshots inspecionadas no run `35526578564`. A prova complementa #338–#341, sem nova mudança arquitetural.
