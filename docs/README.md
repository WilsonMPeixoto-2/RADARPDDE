# Documentação do RADAR PDDE

Este diretório organiza as fontes funcionais, arquiteturais, operacionais, históricas e de evidência do projeto.

## Estado de referência — 29/07/2026

O RADAR está conectado ao projeto Supabase autorizado e publicado na Vercel Production com `dataMode: supabase-production`.

Os cinco primeiros ciclos da oficialização estão concluídos e publicados:

1. competência mensal global;
2. avaliação mensal certificada;
3. timeline cronológica da unidade;
4. certificação integral dos relatórios Excel;
5. navegação contextual e retorno seguro.

A liberação oficial ainda depende de polimento editorial/visual, homologação manual dos Excels, fortalecimento de segurança, teste de restauração, matriz remota de jornadas, UAT e decisão formal de release.

## Leitura inicial obrigatória

1. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado operacional, bloqueadores e próxima tarefa;
2. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contexto funcional e arquitetural;
3. [`DECISION_LOG.md`](DECISION_LOG.md) — decisões vigentes e substituídas;
4. [`audits/2026-07-29-reconsolidacao-contexto-codigo-documentacao.md`](audits/2026-07-29-reconsolidacao-contexto-codigo-documentacao.md) — reconstrução do estado real em 29/07/2026;
5. [`audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md`](audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md) — auditoria anterior à execução dos ciclos 1 a 5.

O plano [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md) permanece como referência histórica de implementação. Suas caixas de seleção não representam o estado atual: os subprojetos 1 a 5 foram executados por PRs posteriores.

## Regra de precedência

1. código-fonte remoto vigente;
2. migrations, funções, políticas, Auth e dados efetivamente existentes no Supabase autorizado;
3. artefato implantado na Vercel;
4. testes, manifests e evidências reproduzíveis;
5. decisões funcionais vigentes compatíveis com as fontes anteriores;
6. documentação atualizada;
7. planos, relatórios, handoffs e inventários históricos.

Orientações expressas do responsável definem intenção e prioridade, mas afirmações sobre estado técnico precisam ser comprovadas nas fontes operacionais. Documentos não prevalecem sobre código ou ambientes reais.

## Situação operacional resumida

| Dimensão | Estado em 29/07/2026 |
|---|---|
| GitHub | `main` auditada em `598361dd`; ciclos 1 a 5 integrados. |
| Vercel Production | Deployment `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, `READY`, commit `dfc8aa3030`. |
| Supabase | Projeto `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, região `sa-east-1`. |
| Auth/RLS | Ativos; políticas por perfil, escopo e autoria. |
| Gestão SME | Somente leitura nas superfícies definidas; Registros Internos por UUID. |
| Competências | Janeiro a dezembro de 2026 disponíveis; contexto mensal global. |
| Avaliação mensal | Projeção canônica e persistência certificadas. |
| Pendências | Estados, tentativas, contatos, reanálise, resolução e cancelamento existentes. |
| Timeline | Projeção cronológica publicada no Prontuário. |
| Excel | Institucional e SME mensal certificados automaticamente; homologação manual pendente. |
| Navegação | Rotas canônicas e retorno contextual publicados. |
| Segurança | Proteção contra senhas vazadas ainda desabilitada no Supabase Auth. |
| Deployment | Automático bloqueado em `vercel.json`; janelas controladas. |
| Liberação oficial | Não declarada. |

## Referências canônicas

| Documento | Finalidade | Status |
|---|---|---|
| [`CURRENT_STAGE.md`](CURRENT_STAGE.md) | Estado operacional e próxima tarefa | Vigente e prioritário |
| [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | Contexto funcional e arquitetural | Vigente |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Decisões de arquitetura e produto | Vigente |
| [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) | Classificação documental histórica | Confrontar com este índice e com a auditoria atual |
| Dossiê Consolidado v1.0 | Contexto e regras históricas | Histórico, salvo decisões ainda vigentes |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional/visual original | Referência de produto, não inventário técnico atual |
| Protótipo de exportação Excel v2.1 | Estrutura editorial | Referência congelada |

## Arquitetura

### Núcleo e persistência

- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) — projeção compartilhada entre telas;
- [`architecture/competencias.md`](architecture/competencias.md) — chaves e domínio de competência;
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md) — arquitetura de persistência;
- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md) — ordem efetiva de CSS e JavaScript;
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md) — ordem das extensões posteriores ao `app.js`.

### Fluxos operacionais

- [`architecture/retificacoes.md`](architecture/retificacoes.md) — retificação administrativa auditável;
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md) — projeção cronológica da unidade;
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md) — retorno contextual, rolagem e foco;
- [`architecture/testing.md`](architecture/testing.md) — estratégia de validação.

### Excel

- [`architecture/excel-export.md`](architecture/excel-export.md) — exportação institucional estruturada;
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md) — modelo SME mensal;
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md) — certificação célula a célula e manifesto.

## Supabase

### Referências

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — tabelas, campos e relacionamentos;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — perfis e permissões;
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md) — equivalência e fluxos testados;
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md) — auditoria técnica;
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) — classificação de dados e ambientes.

### Runbooks

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) — configuração e validação da conexão;
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) — staging, promoção, reconciliação e rollback.

Runbooks ainda necessários antes do release oficial:

- `runbooks/EXCEL_CERTIFICATION.md` — homologação manual e evidência de abertura;
- `runbooks/PRODUCTION_RELEASE.md` — gate e procedimento de publicação;
- `runbooks/USER_ACCEPTANCE_TEST.md` — protocolo de UAT.

## Produto e superfícies

- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md) — decisões e fronteiras;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — catálogo de superfícies;
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) — classificação de mudanças;
- [`reference/POST_PR22_PRIORITIZED_BACKLOG.md`](reference/POST_PR22_PRIORITIZED_BACKLOG.md) — backlog histórico, não substitui o estágio atual;
- [`superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`](superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md) — contratos de experiência;
- [`superpowers/specs/2026-07-15-frontend-precedencia-design.md`](superpowers/specs/2026-07-15-frontend-precedencia-design.md) — precedência do frontend;
- [`superpowers/specs/2026-07-15-interacoes-compartilhadas-design.md`](superpowers/specs/2026-07-15-interacoes-compartilhadas-design.md) — interações compartilhadas.

## Evidências e auditorias

### Vigentes ou diretamente relevantes

- [`audits/2026-07-29-reconsolidacao-contexto-codigo-documentacao.md`](audits/2026-07-29-reconsolidacao-contexto-codigo-documentacao.md);
- [`audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md`](audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md);
- [`evidence/excel-certification/synthetic-manifest.json`](evidence/excel-certification/synthetic-manifest.json);
- [`evidence/releases/2026-07-28-avaliacao-timeline-production.json`](evidence/releases/2026-07-28-avaliacao-timeline-production.json);
- [`handoff/2026-07-15-ciclo-a-final-report.md`](handoff/2026-07-15-ciclo-a-final-report.md).

### Históricas

- [`handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`](handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md) — retrato do gate de pré-conexão;
- [`superpowers/plans/2026-07-14-supabase-preconnection-gate.md`](superpowers/plans/2026-07-14-supabase-preconnection-gate.md) — plano executado;
- [`audits/2026-07-15-inventario-tecnico-global.md`](audits/2026-07-15-inventario-tecnico-global.md);
- [`audits/2026-07-15-dados-e-ambientes-estado-atual.md`](audits/2026-07-15-dados-e-ambientes-estado-atual.md);
- [`audits/2026-07-15-produto-estado-atual.md`](audits/2026-07-15-produto-estado-atual.md);
- [`evidence/global-baseline/manifest.json`](evidence/global-baseline/manifest.json);
- [`evidence/global-baseline/repository-inventory.json`](evidence/global-baseline/repository-inventory.json) — inventário gerado histórico; regenerar pelo script canônico quando necessário.

## Regras funcionais vigentes

- a unidade escolar é a entidade monitorada;
- bonificação, análise técnica e pendência são dimensões independentes;
- novo envio não resolve a pendência;
- reanálise positiva resolve e reanálise negativa devolve a providência ao estado aberto;
- pendência não altera automaticamente a bonificação;
- retificação não altera automaticamente análise ou pendência;
- `Aberta` e `Aguardando reanálise` são estados ativos;
- não existe estado canônico `Vencida`;
- indicadores operacionais podem se sobrepor e não devem ser somados;
- carteira define responsabilidade principal, não isolamento entre Controladores da mesma CRE;
- Gestão SME não executa mutações operacionais descritas na ADR-022;
- timeline é projeção e não fonte de verdade;
- competência mensal é contexto global único;
- navegação de retorno preserva o contexto operacional;
- polimento visual não altera identidade ou decisões de produto.

## Próxima sequência

1. polimento editorial e visual;
2. fortalecimento de segurança e infraestrutura de release;
3. homologação manual dos Excels e teste de restauração;
4. matriz remota de jornadas por perfil, competência e viewport;
5. UAT;
6. decisão formal de liberação oficial.

Para continuidade, usar [`CURRENT_STAGE.md`](CURRENT_STAGE.md), não as caixas de seleção do plano histórico.
