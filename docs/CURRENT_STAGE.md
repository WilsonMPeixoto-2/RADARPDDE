# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## 1. Baseline vigente

A refatoração da arquitetura Supabase foi integrada pelo PR #300.

**Baseline funcional de aplicação integrado:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`  
**PR #300:** merged  
**Data mode de Production:** `supabase-production`

Depois do PR #300, a `main` recebeu merges **exclusivamente documentais** para reconciliar a rota de leitura e os handoffs. Portanto, o SHA de `main`/Vercel pode estar à frente de `1a149174...` sem que o código funcional de runtime tenha mudado. Revalidar o SHA exato ao vivo; o contrato funcional publicado permanece o do PR #300 até uma alteração funcional posterior ser integrada.

O hotfix `2eff1321a8abaccd46d9627ee2eed060741ce3b7`, que reverteu a regressão global associada ao PR #299, foi preservado na reconciliação. A funcionalidade de retificação de avaliação removida pelo rollback do PR #299 não foi reintroduzida.

O PR #300 não alterou migrations do Supabase nem exigiu mudança manual de dados em Production.

## 2. Frente ativa

A frente corrente é **homologação operacional ponta a ponta e observabilidade pós-refatoração**, não nova refatoração arquitetural.

Branch:

`test/operational-uat-supabase-2026-09-13`

PR:

`#301 — UAT operacional Supabase e observabilidade pós-refatoração`

Estado observado mais recente nesta atualização:

- aberto;
- Draft;
- HEAD observado: `4a7a41dc29ab87eb5b4f56f4d26558706409af50`;
- a branch já contém uma correção funcional real de resolução dos assets do logo em `mobile-navigation.js`, além dos testes/workflow/plano de UAT;
- `Ciclos funcionais reais com Supabase` passou no HEAD `4a7a41dc...`;
- E2E completo, Supabase readiness, confiabilidade real, perfis/viewports, retificação, CodeQL e dependências também passaram naquele HEAD;
- a homologação pré-production falhou somente por rate limit externo ao baixar `postgres-meta:v0.97.0` durante geração de tipos, depois de 426 testes pgTAP aprovados e schema lint limpo.

### Handoff corrente obrigatório depois deste arquivo

[`handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md`](handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md)

Esse arquivo é o **delta corrente**. Ele pressupõe a leitura do relatório consolidado anterior:

[`handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`](handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md)

O relatório consolidado preserva a reconstrução completa do PR #300, Production, Supabase, capacidade, observabilidade e início da UAT. O checkpoint `4a7a41dc` registra o avanço posterior e substitui as instruções temporais daquele relatório que já foram superadas.

## 3. O que foi encerrado pelo PR #300

A causa raiz arquitetural foi tratada estruturalmente:

- bootstrap remoto restrito a dados estruturais necessários;
- dados operacionais carregados por competência/contexto;
- dependências históricas ainda ativas incorporadas seletivamente;
- histórico administrativo e escolar carregado sob demanda;
- consultas genéricas fail-closed quando faltam ordenação determinística ou limites;
- gravações remotas autoritativas/incrementais;
- releitura corretiva apenas quando necessária;
- `localStorage` fora do papel de segundo banco operacional no modo Supabase;
- aplicação de estado remoto à projeção em memória com `persistStorage:false`;
- proteção contra resposta stale na troca de contexto;
- acesso direto às tabelas operacionais do Supabase restrito à camada de dados, com exceções de Auth previstas.

A arquitetura não proíbe memória/cache local. O contrato vigente é:

```text
Supabase = fonte canônica persistente
memória/cache local = projeção operacional descartável
```

Estado local é útil quando melhora responsividade e não mascara falha, não substitui o Supabase e converge para a autoridade remota após escrita/reload.

## 4. Certificação do PR #300

O candidato funcional do PR #300 passou os gates de release, incluindo Playwright E2E, homologação pré-production, Supabase readiness, confiabilidade funcional com Supabase real, ciclos funcionais, perfis/viewports, CodeQL, dependências, Excel SME, snapshot e Lighthouse.

Suíte unitária: **1.018 aprovados, 0 falhas**.

O LCP desktop certificado ficou em **3,46 s** no candidato, com TBT 0 ms, acessibilidade 100% e boas práticas 100%. Oscilações pequenas posteriores, sem mudança funcional correlata, não justificam sacrificar correções arquiteturais. Mobile permanece dívida conhecida e não bloqueante para o alvo operacional desktop.

## 5. UAT operacional já comprovada

Arquivo principal:

`tests/e2e/supabase-operational-uat.spec.js`

No HEAD `4a7a41dc...`, os dois primeiros cenários novos passaram com Auth/RLS/Supabase descartável reais:

### Login → Dashboard → Registros Internos

Comprovado:

- login chega ao dashboard;
- `administrative_logs` não participa do bootstrap;
- não foi detectado GET operacional sem filtro contextual nesse fluxo;
- logs são buscados somente ao abrir Registros Internos;
- consulta limitada/ordenada.

### Avaliação → Supabase → reload

Comprovado no cenário `ESC-LOCAL / 2026-05 / PDDE Básico / Extrato Conta Corrente`:

- `Sim` e `Correto` acionados pela interface;
- projeção visual correta;
- convergência para `verifications` no Supabase;
- `row_version` válido;
- coleções operacionais verificadas ausentes do `localStorage` como banco paralelo;
- reload reencontra o mesmo estado.

A antiga falha `/is-selected/` foi corrigida no teste para o contrato real `/active-sim/`; ela não é mais pendência.

## 6. Próximas prioridades da homologação

Expandir a prova de ponta a ponta para:

1. avaliação mensal completa: Sim/Não/N/A, análise técnica, atrasado, consolidação e derivados;
2. NF/despesa de consumo;
3. serviço + Consulta Assessoria individualizada;
4. permanente + bem + Capital/Inventário + encaminhamento;
5. Boleto de Internet em Educação Conectada;
6. `a_identificar` com `Incorreto + Pendência` atômicos e identificação no novo envio;
7. ciclo integral de Pendência, tentativa, contato, novo envio, reanálise, resolução/manutenção, cancelamento/reabertura autorizados;
8. novas retificações/edições e bloqueios por histórico;
9. mensagens de sucesso, erro, bloqueio e sincronização;
10. primeira navegação, rota direta, reload e mudança rápida de competência;
11. falha de persistência remota e falha de aplicação local pós-commit;
12. reflexos cruzados entre Prontuário, Pendências, Inventário, Dashboard/Carteira e Registros Internos;
13. baseline de capacidade e detector de regressão via `pg_stat_statements`.

Critério de escrita:

```text
estado persistido remoto
=
projeção local da aplicação
=
estado mostrado ao usuário
=
estado reencontrado após reload
```

com efeitos relacionados igualmente coerentes.

## 7. Capacidade e observabilidade

Baseline de Supabase Production observado em 13/09:

- banco total ~39 MB;
- 163 escolas;
- 430 vínculos escola-programa;
- `administrative_logs` ~3.563 linhas / ~1,7 MB;
- `verifications` 339;
- `registered_invoices` 84;
- `pendencies` 94;
- `assets` 14.

O problema anterior era padrão de acesso, não volume absoluto.

`pg_stat_statements` preserva fingerprints históricos das consultas globais antigas. Não resetar. Registrar linha de corte pós-refatoração e monitorar somente o delta futuro para detectar reintrodução de consultas globais.

Observabilidade existente a preservar/integrar:

- smoke de Production horário com incidente automático;
- integridade de Production a cada 6h;
- CodeQL;
- Dependabot;
- saúde semanal de dependências;
- Vercel deployments/logs;
- Supabase Advisors/Reports/Logs;
- pgTAP/RLS/Auth/readiness.

## 8. Dependências

Não misturar upgrades de dependência com a homologação funcional atual.

Candidatos observados para avaliação posterior em branches próprias incluem `@supabase/supabase-js` e Playwright. A Supabase CLI 2.116.0 já havia sido rejeitada por regressão de garantias pgTAP/RLS; não atualizar automaticamente.

## 9. Documentos temporais antigos

- `audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md` é evidência do candidato pré-merge do PR #300;
- `audits/ASTRA_AUDITORIA_RADAR_2026.md` é diário investigativo com checkpoints intermediários;
- `PROJECT_CONTEXT.md` contém contexto funcional útil, mas também trechos temporais de 06/09;
- o relatório consolidado de 13/09 preserva o checkpoint anterior ao avanço para `4a7a41dc...` e deve ser lido como predecessor, não como última instrução operacional;
- planos, auditorias e handoffs não apontados aqui não formam fila automática.

## 10. Rota obrigatória para retomada

Ler nesta ordem:

1. `../AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. `reference/PRODUCT_SURFACE_CATALOG.md`;
4. este `CURRENT_STAGE.md`;
5. `handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md`;
6. o relatório consolidado predecessor quando precisar reconstruir o ciclo completo;
7. `reference/ENGINEERING_METHOD.md`;
8. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
9. `reference/STATUS_DOCUMENTOS.md`;
10. matriz funcional/ADRs/referências especializadas conforme a frente;
11. históricos apenas depois.

Não começar por memória de chat, plano antigo ou auditoria isolada. Revalidar SHAs/ambientes ao vivo quando a decisão depender do estado atual.
