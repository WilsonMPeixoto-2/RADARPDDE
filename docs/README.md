# Documentação do RADAR PDDE

**Estado de referência:** 3 de agosto de 2026

Este diretório separa contratos vigentes, estado corrente, roadmap, procedimentos, decisões, planos históricos e evidências.

## 1. Estado resumido

O RADAR PDDE está conectado ao Supabase Production autorizado e publicado na Vercel Production com `dataMode: supabase-production`.

Estado operacional:

```text
main após Rodada 3B: 520b51e7080ddae0f4e3f03cf4c045cbea0a233d
Production: dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp — READY
commit publicado: f72a1471023f00eec0bc615c192fd25f5c29a920
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations: 25
Node: 24.x
deployment automático: bloqueado
```

Concluídos e publicados:

- governança da Gestão SME;
- competência global janeiro–dezembro;
- avaliação mensal canônica;
- timeline cronológica;
- navegação contextual;
- correção de desempenho do login;
- relatórios Excel;
- busca inteligente;
- posicionamento responsivo dos elementos flutuantes;
- transições progressivas.

Concluídos como ferramentas internas:

- Node 24 e gate remoto por papel/viewport;
- backup e restauração descartáveis;
- correção e prevenção de referências quebradas nos workflows;
- ESLint 10.8.0 e relatório HTML;
- Acorn 8.18.0 e análise de handlers;
- `actions/checkout` 7.0.1;
- Supabase CLI 2.110.0.

O portfólio técnico e funcional completo está em [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md).

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md) — regras permanentes;
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado, ambientes, sequência e bloqueadores;
3. [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md) — lista técnica e funcional consolidada;
4. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — produto e arquitetura;
5. [`DECISION_LOG.md`](DECISION_LOG.md) — decisões acumuladas;
6. [`architecture/testing.md`](architecture/testing.md) — estratégia de testes;
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — classificação documental.

## 3. Documentos canônicos

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md)
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md)
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- [`DECISION_LOG.md`](DECISION_LOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)

## 4. Arquitetura vigente

- [`architecture/overview.md`](architecture/overview.md)
- [`architecture/data-flow.md`](architecture/data-flow.md)
- [`architecture/supabase.md`](architecture/supabase.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)
- [`architecture/testing.md`](architecture/testing.md)
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md)
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md)
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md)

## 5. Runbooks

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)
- [`runbooks/SUPABASE_REMOTE_PREFLIGHT.md`](runbooks/SUPABASE_REMOTE_PREFLIGHT.md)
- [`runbooks/VERCEL_DEPLOY.md`](runbooks/VERCEL_DEPLOY.md)
- [`runbooks/MIGRATION_FIREBASE_SUPABASE.md`](runbooks/MIGRATION_FIREBASE_SUPABASE.md)
- [`runbooks/IMPORT_EXECUTION.md`](runbooks/IMPORT_EXECUTION.md)
- [`runbooks/INCIDENT_RESPONSE.md`](runbooks/INCIDENT_RESPONSE.md)

## 6. Referências

- [`reference/DATA_DICTIONARY.md`](reference/DATA_DICTIONARY.md)
- [`reference/SURFACES_CATALOG.md`](reference/SURFACES_CATALOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)

## 7. Rodadas recentes de atualização

### Rodada 0 — preparação

- [`audits/2026-08-01-rodada-0-baseline.md`](audits/2026-08-01-rodada-0-baseline.md)
- [`superpowers/plans/2026-08-01-rodada-0-preparacao-obrigatoria.md`](superpowers/plans/2026-08-01-rodada-0-preparacao-obrigatoria.md)

### Rodada 1 — ESLint, Acorn e checkout

- [`audits/2026-08-01-rodada-1-baixo-risco.md`](audits/2026-08-01-rodada-1-baixo-risco.md)
- [`decisions/ADR-038-atualizacoes-com-integracao-pertinente.md`](decisions/ADR-038-atualizacoes-com-integracao-pertinente.md)

### Rodada 2 — busca, Floating UI e transições

- [`superpowers/specs/2026-08-01-rodada-2-busca-flutuantes-transicoes-design.md`](superpowers/specs/2026-08-01-rodada-2-busca-flutuantes-transicoes-design.md)
- [`superpowers/plans/2026-08-01-rodada-2-busca-flutuantes-transicoes.md`](superpowers/plans/2026-08-01-rodada-2-busca-flutuantes-transicoes.md)
- [`audits/2026-08-01-rodada-2-busca-flutuantes-transicoes.md`](audits/2026-08-01-rodada-2-busca-flutuantes-transicoes.md)
- [`evidence/releases/2026-08-02-rodadas-1-2-production.json`](evidence/releases/2026-08-02-rodadas-1-2-production.json)

### Rodada 3B — Supabase CLI 2.110.0

- [`superpowers/specs/2026-08-02-rodada-3b-supabase-cli-2-110-0-design.md`](superpowers/specs/2026-08-02-rodada-3b-supabase-cli-2-110-0-design.md)
- [`superpowers/plans/2026-08-02-rodada-3b-supabase-cli-2-110-0.md`](superpowers/plans/2026-08-02-rodada-3b-supabase-cli-2-110-0.md)
- [`audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md`](audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md)
- [`evidence/releases/2026-08-02-supabase-cli-2-110-0.json`](evidence/releases/2026-08-02-supabase-cli-2-110-0.json)

### Rodada 4A — roadmap canônico

- [`superpowers/specs/2026-08-03-rodada-4a-roadmap-atualizacoes-design.md`](superpowers/specs/2026-08-03-rodada-4a-roadmap-atualizacoes-design.md)
- [`superpowers/plans/2026-08-03-rodada-4a-roadmap-atualizacoes.md`](superpowers/plans/2026-08-03-rodada-4a-roadmap-atualizacoes.md)
- [`decisions/ADR-039-evolucao-tecnologica-proativa.md`](decisions/ADR-039-evolucao-tecnologica-proativa.md)
- [`audits/2026-08-03-rodada-4a-roadmap-atualizacoes.md`](audits/2026-08-03-rodada-4a-roadmap-atualizacoes.md)

## 8. Outras evidências atuais

### Backup e restauração

- [`audits/2026-07-30-backup-restore-disposable.md`](audits/2026-07-30-backup-restore-disposable.md)

### Node e gate remoto

- [`decisions/ADR-035-node24-e-gate-remoto.md`](decisions/ADR-035-node24-e-gate-remoto.md)
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)

### Reconciliação da migration SME

- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)
- [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md) — achado histórico resolvido

### Certificação Excel

- [`evidence/excel/README.md`](evidence/excel/README.md)
- [`evidence/excel/certification-manifest.json`](evidence/excel/certification-manifest.json)

## 9. Regra de atualização

Uma mudança material deve atualizar, no mesmo ciclo:

- contrato executável;
- teste de regressão;
- documentação canônica afetada;
- roadmap técnico/funcional, quando aplicável;
- evidência do mesmo SHA;
- lista de bloqueadores;
- classificação documental.

Toda tarefa deve também avaliar se atualização, instalação ou capacidade tecnológica moderna produz resultado materialmente superior. A proposta deve ser apresentada quando houver ganho real, sem autorizar instalação automática nem ampliação silenciosa de escopo.

Planos e relatórios históricos não são reescritos para parecerem atuais. Quando superados, recebem classificação explícita e apontam para a fonte canônica atual.
