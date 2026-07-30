# Documentação do RADAR PDDE

Este diretório organiza fontes funcionais, arquiteturais, operacionais, históricas e de evidência do projeto.

## Estado de referência — 29/07/2026

O RADAR está conectado ao Supabase Production autorizado e publicado na Vercel Production com `dataMode: supabase-production`.

Estão concluídos e publicados:

- governança da Gestão SME;
- competência mensal global;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- certificação automatizada dos relatórios Excel;
- navegação contextual e retorno seguro.

A liberação oficial ainda não foi declarada.

## Entrada obrigatória

1. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado operacional, bloqueadores e próxima decisão;
2. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — finalidade, perfis, arquitetura e contratos;
3. [`DECISION_LOG.md`](DECISION_LOG.md) — decisões vigentes e substituídas;
4. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — classificação e precedência documental;
5. [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md) — reconstrução do estado real;
6. [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md) — divergência de versão, equivalência do SQL e regra de tratamento.

## Regra de precedência

1. código-fonte remoto vigente;
2. migrations, funções, políticas, Auth e dados do Supabase autorizado;
3. artefato efetivamente implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões funcionais vigentes;
6. documentação atualizada;
7. documentos históricos.

Orientações do responsável definem intenção e prioridade. Afirmações sobre implementação ou implantação precisam ser comprovadas nas fontes operacionais.

## Situação operacional resumida

| Dimensão | Estado |
|---|---|
| GitHub | baseline funcional `598361dd...`; ciclos 1 a 5 presentes. |
| Production | deployment `dpl_7tLM3...`, commit `dfc8aa3...`, `READY`. |
| Supabase | `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, PostgreSQL 17. |
| Auth/RLS | ativos; políticas por perfil e escopo. |
| Gestão SME | somente leitura nas superfícies definidas; logs por UUID. |
| Competências | 12 meses; `closing_competence = 2026-12`. |
| Avaliação mensal | projeção canônica concluída e publicada. |
| Timeline | projeção cronológica concluída e publicada. |
| Excel | certificação automatizada concluída para os dois produtos. |
| Navegação contextual | concluída e publicada em desktop e mobile. |
| Migrations | 24 versões correspondentes; migration SME com identificador remoto distinto e SQL idêntico. |
| Segurança | proteção contra senhas vazadas ainda desabilitada. |
| Liberação oficial | não declarada. |

## Referências canônicas

| Documento | Finalidade | Status |
|---|---|---|
| [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | Contexto funcional e arquitetural | Vigente |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Decisões de arquitetura e produto | Vigente |
| [`CURRENT_STAGE.md`](CURRENT_STAGE.md) | Estado operacional e próxima decisão | Vigente e transitório |
| [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) | Classificação documental | Vigente |
| [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md) | Auditoria pós-ciclos | Vigente |
| [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md) | Rastreabilidade da migration SME | Vigente até a reconciliação |
| [`audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md`](audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md) | Linha de base anterior aos ciclos | Histórico relevante |
| Plano de oficialização de 28/07/2026 | Sequência que originou os ciclos 1 a 5 | Executado quanto aos ciclos; referencial para gates finais |
| Dossiê Consolidado v1.0 | Contexto e regras históricas | Referência histórica |
| Plano do Lote 2 v2.0 | Contrato funcional e visual original | Referência de produto |
| Protótipo Excel v2.1 | Estrutura editorial | Referência congelada |

## Arquitetura

- [`architecture/competencias.md`](architecture/competencias.md) — contexto global de competência;
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md) — projeção mensal canônica;
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md) — timeline como projeção;
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md) — retorno e restauração de contexto;
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md) — carregamento das extensões;
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md) — certificação dos dois produtos Excel;
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md) — modelo SME mensal;
- [`architecture/excel-export.md`](architecture/excel-export.md) — exportação estruturada;
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) — projeções compartilhadas;
- [`architecture/retificacoes.md`](architecture/retificacoes.md) — retificação auditável;
- [`architecture/testing.md`](architecture/testing.md) — estratégia de validação;
- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md) — ordem do frontend;
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md) — persistência; estágios pré-conexão são históricos.

## Supabase

### Referências

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — modelo relacional; introduções de pré-conexão devem ser lidas com migrations e tipos vigentes;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — perfis e permissões;
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md) — fluxos e equivalência;
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md) — auditoria técnica;
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) — classificação de dados e ambientes.

### Runbooks

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) — conexão e validação;
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) — promoção e rollback.

Antes da próxima migration de Production, o runbook deve incorporar a reconciliação do identificador local/remoto da migration SME.

Runbooks ainda necessários antes da liberação oficial:

- certificação/homologação manual no Microsoft Excel;
- release de Production;
- UAT;
- backup e restauração em ambiente descartável.

## Produto e superfícies

- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md) — decisões e fronteiras;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — catálogo de superfícies;
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) — classificação de mudanças;
- [`reference/POST_PR22_PRIORITIZED_BACKLOG.md`](reference/POST_PR22_PRIORITIZED_BACKLOG.md) — backlog histórico, não representa a próxima frente atual.

## Evidências vigentes

- [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md);
- [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md);
- [`evidence/excel-certification/synthetic-manifest.json`](evidence/excel-certification/synthetic-manifest.json);
- [`architecture/competencias.md`](architecture/competencias.md);
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md);
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md);
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md).

Evidências antigas, inventários gerados e handoffs anteriores devem ser preservados como histórico, não editados manualmente para aparentar atualização.

## Regras funcionais vigentes

- a unidade escolar é a entidade monitorada;
- bonificação, análise técnica e pendência são dimensões independentes;
- novo envio não resolve a pendência;
- reanálise positiva resolve e reanálise negativa retorna ao estado aberto;
- pendência não altera automaticamente a bonificação;
- retificação não altera automaticamente análise ou pendência;
- `Aberta` e `Aguardando reanálise` são estados ativos;
- não existe estado canônico `Vencida`;
- indicadores operacionais podem se sobrepor;
- carteira define responsabilidade principal, não isolamento entre Controladores da mesma CRE;
- Gestão SME não executa mutações operacionais descritas na ADR-022;
- timeline é projeção e não nova fonte de verdade;
- competência mensal é contexto global único;
- navegação de retorno preserva contexto operacional.

## Estado do plano de oficialização

Concluídos:

1. competência global;
2. disponibilização de janeiro a dezembro;
3. avaliação mensal certificada;
4. timeline cronológica;
5. certificação automatizada dos relatórios Excel;
6. navegação contextual.

Pendentes:

1. reconciliação do identificador da migration SME;
2. homologação manual dos arquivos no Microsoft Excel desktop;
3. polimento editorial e visual;
4. proteção contra senhas vazadas;
5. fixação da major do Node;
6. backup e restauração testados;
7. gate remoto por perfil e viewport;
8. UAT;
9. decisão formal de liberação.

A próxima frente ainda não foi escolhida.
