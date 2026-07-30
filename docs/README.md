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
- reconciliação do histórico da migration SME;
- Node.js fixado em `24.x`;
- gate remoto por papel institucional e viewport;
- correção do conflito entre seletor técnico e logout no mobile.

A liberação oficial ainda depende de segurança Auth, backup/restauração, homologação manual no Excel, UAT, polimento e decisão formal.

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md) — regras permanentes do repositório;
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado material e bloqueadores atuais;
3. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — visão de produto e arquitetura;
4. [`DECISION_LOG.md`](DECISION_LOG.md) — decisões arquiteturais acumuladas;
5. [`decisions/ADR-035-node24-e-gate-remoto.md`](decisions/ADR-035-node24-e-gate-remoto.md) — decisão deste ciclo;
6. [`architecture/testing.md`](architecture/testing.md) — estratégia de testes e gates;
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — classificação documental.

## 3. Arquitetura vigente

- [`architecture/overview.md`](architecture/overview.md)
- [`architecture/data-flow.md`](architecture/data-flow.md)
- [`architecture/supabase.md`](architecture/supabase.md)
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

### Node e gate remoto

- [`decisions/ADR-035-node24-e-gate-remoto.md`](decisions/ADR-035-node24-e-gate-remoto.md)
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)

### Reconciliação da migration SME

- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)
- [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md) — achado histórico resolvido;

### Alinhamento documental

- [`audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`](audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md)
- [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md)

### Certificação Excel

- [`evidence/excel/README.md`](evidence/excel/README.md)
- [`evidence/excel/certification-manifest.json`](evidence/excel/certification-manifest.json)

## 7. Regra de atualização

Uma mudança material deve atualizar, no mesmo ciclo:

- o contrato executável;
- o teste de regressão;
- a documentação canônica afetada;
- a evidência do mesmo SHA;
- a lista de bloqueadores, sem marcar requisito como cumprido antes da validação.

Planos e relatórios históricos não são reescritos para parecerem atuais. Quando superados, recebem classificação explícita e a fonte canônica atual é indicada.
