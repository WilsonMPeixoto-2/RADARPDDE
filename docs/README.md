# Documentação do RADAR PDDE

**Estado de referência:** 30 de julho de 2026

Este diretório separa contratos vigentes, procedimentos, decisões, planos históricos e evidências geradas.

## 1. Estado resumido

O RADAR PDDE está conectado ao Supabase Production autorizado e publicado na Vercel Production com `dataMode: supabase-production`.

Concluídos:

- governança da Gestão SME;
- competência global janeiro–dezembro;
- avaliação mensal canônica;
- timeline cronológica;
- certificação dos relatórios Excel;
- navegação contextual;
- reconciliação da migration SME;
- Node.js fixado em `24.x`;
- gate remoto por papel e viewport;
- correção do logout técnico no mobile;
- backup e restauração em duas pilhas Supabase descartáveis;
- exclusão dos dumps SQL dos artefatos do CI.

A checagem de credenciais comprometidas é recurso do plano Pro ou superior e não integra os critérios do projeto no plano Free atual.

A liberação oficial ainda depende de homologação manual no Excel, Advisors quando aplicável, UAT, polimento e decisão formal.

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md) — regras permanentes;
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado e bloqueadores;
3. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — produto e arquitetura;
4. [`DECISION_LOG.md`](DECISION_LOG.md) — decisões acumuladas;
5. [`architecture/testing.md`](architecture/testing.md) — estratégia de testes;
6. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — classificação documental.

## 3. Arquitetura vigente

- [`architecture/overview.md`](architecture/overview.md)
- [`architecture/data-flow.md`](architecture/data-flow.md)
- [`architecture/supabase.md`](architecture/supabase.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)
- [`architecture/testing.md`](architecture/testing.md)

## 4. Runbooks

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)
- [`runbooks/SUPABASE_REMOTE_PREFLIGHT.md`](runbooks/SUPABASE_REMOTE_PREFLIGHT.md)
- [`runbooks/VERCEL_DEPLOY.md`](runbooks/VERCEL_DEPLOY.md)
- [`runbooks/MIGRATION_FIREBASE_SUPABASE.md`](runbooks/MIGRATION_FIREBASE_SUPABASE.md)
- [`runbooks/IMPORT_EXECUTION.md`](runbooks/IMPORT_EXECUTION.md)
- [`runbooks/INCIDENT_RESPONSE.md`](runbooks/INCIDENT_RESPONSE.md)

## 5. Referências

- [`reference/DATA_DICTIONARY.md`](reference/DATA_DICTIONARY.md)
- [`reference/SURFACES_CATALOG.md`](reference/SURFACES_CATALOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)

## 6. Evidências recentes

### Backup e restauração

- [`audits/2026-07-30-backup-restore-disposable.md`](audits/2026-07-30-backup-restore-disposable.md)

### Node e gate remoto

- [`decisions/ADR-035-node24-e-gate-remoto.md`](decisions/ADR-035-node24-e-gate-remoto.md)
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)

### Reconciliação da migration SME

- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)
- [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md) — achado histórico resolvido

### Alinhamento documental

- [`audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`](audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md)
- [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md)

### Certificação Excel

- [`evidence/excel/README.md`](evidence/excel/README.md)
- [`evidence/excel/certification-manifest.json`](evidence/excel/certification-manifest.json)

## 7. Regra de atualização

Uma mudança material deve atualizar, no mesmo ciclo:

- contrato executável;
- teste de regressão;
- documentação canônica afetada;
- evidência do mesmo SHA;
- lista de bloqueadores.

Planos e relatórios históricos não são reescritos para parecerem atuais. Quando superados, recebem classificação explícita e apontam para a fonte canônica atual.
