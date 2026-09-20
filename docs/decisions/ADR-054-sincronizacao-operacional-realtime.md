# ADR-054 — Sincronização operacional por invalidação Realtime

**Status:** Aprovada, implementada e publicada
**Data:** 19 de setembro de 2026
**Atualizada em:** 20 de setembro de 2026

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

## Relações

- PR #329: RLS set-based;
- PR #330: fila de gravação independente de refresh;
- PR #331: cancelamento físico de leituras obsoletas;
- PR #332: implementação desta ADR;
- PR #338: preservação de invalidação durante refresh em voo;
- PR #339: retenção e retry controlada após falha de releitura;
- PR #340: convergência quando gravação aborta leitura Realtime;
- PR #341: drenagem pós-write de refresh pendente.
O PR #342 acrescentou prova pela UI com duas identidades distintas: Broadcast → leitura real retida → escrita auditável → Abort → releitura → convergência antes de navegar, sem reload. HEAD `065f53013edb1626ac95b17d387716dfe65850cf` aprovado em 7 workflows; screenshots inspecionadas no run `35526578564`. A prova complementa #338–#341, sem nova mudança arquitetural.
