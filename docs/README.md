# Documentação do RADAR PDDE

Este diretório organiza as fontes funcionais, arquiteturais, operacionais, históricas e de evidência do projeto.

## Estado de referência — 28/07/2026

O RADAR está conectado ao projeto Supabase autorizado e publicado na Vercel Production com `dataMode: supabase-production`. A governança de acesso da Gestão SME está implementada e aplicada. A liberação oficial para operação integral ainda depende do ciclo de oficialização descrito abaixo.

Documentos de entrada obrigatória:

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado operacional, riscos e próxima tarefa;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contexto funcional e arquitetural;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões vigentes e substituídas;
- [`audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md`](audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md) — auditoria de código, Vercel, Supabase e documentação;
- [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md) — plano mestre de oficialização.

## Regra de precedência

1. código-fonte remoto vigente;
2. migrations, funções, políticas, Auth e dados efetivamente existentes no Supabase autorizado;
3. artefato efetivamente implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões funcionais vigentes compatíveis com as fontes anteriores;
6. documentação atualizada;
7. documentos históricos.

Orientações expressas do responsável definem intenção e prioridade, mas uma afirmação sobre o estado técnico deve ser comprovada nas fontes operacionais. Documentos não prevalecem sobre o código ou os ambientes reais.

## Situação operacional resumida

| Dimensão | Estado |
|---|---|
| Production | Vercel `READY`, Supabase habilitado. |
| Supabase | Projeto `RADAR PDDE 2026` ativo e saudável. |
| Auth/RLS | Ativos; políticas por perfil e escopo. |
| Gestão SME | Somente leitura nas superfícies operacionais definidas e Registros Internos por UUID. |
| Competências | 12 meses persistidos; operação ainda limitada/configurada em maio. |
| Avaliações | Modelo e persistência existentes; jornada integral ainda precisa de certificação transversal. |
| Pendências | Estados, tentativas, contatos, reanálise, resolução e cancelamento existentes. |
| Excel | Exportadores implementados; certificação banco–tela–arquivo pendente. |
| Segurança | Proteção contra senhas vazadas precisa ser habilitada antes do release oficial. |
| Liberação oficial | Não declarada. |

## Referências canônicas

| Documento | Finalidade | Status |
|---|---|---|
| [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | Contexto funcional e arquitetural | Vigente |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Decisões de arquitetura e produto | Vigente |
| [`CURRENT_STAGE.md`](CURRENT_STAGE.md) | Estado operacional e próxima tarefa | Vigente |
| [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) | Classificação documental | Deve ser confrontado com este índice e com a auditoria atual |
| Dossiê Consolidado v1.0 | Contexto e regras históricas | Referência histórica, salvo decisões ainda vigentes |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional/visual original | Referência de produto, não inventário técnico atual |
| Protótipo de exportação Excel v2.1 | Estrutura editorial | Referência congelada |

## Arquitetura

- [`architecture/competencias.md`](architecture/competencias.md) — chaves e domínio de competência;
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) — projeção compartilhada entre telas;
- [`architecture/retificacoes.md`](architecture/retificacoes.md) — retificação administrativa auditável;
- [`architecture/testing.md`](architecture/testing.md) — estratégia de validação;
- [`architecture/excel-export.md`](architecture/excel-export.md) — exportação estruturada;
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md) — modelo SME mensal;
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md) — arquitetura de persistência; trechos históricos de pré-conexão devem ser lidos com a auditoria atual;
- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md) — ordem efetiva de CSS e JavaScript.

## Supabase

### Referências

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — tabelas, campos e relacionamentos;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — perfis e permissões;
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md) — equivalência e fluxos testados;
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md) — auditoria técnica;
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) — classificação de dados e ambientes.

### Runbooks

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) — configuração e validação da conexão;
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) — staging, promoção, reconciliação e rollback;
- [`runbooks/EXCEL_CERTIFICATION.md`](runbooks/EXCEL_CERTIFICATION.md) — previsto no plano de oficialização;
- [`runbooks/PRODUCTION_RELEASE.md`](runbooks/PRODUCTION_RELEASE.md) — previsto no plano de oficialização;
- [`runbooks/USER_ACCEPTANCE_TEST.md`](runbooks/USER_ACCEPTANCE_TEST.md) — previsto no plano de oficialização.

## Produto e superfícies

- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md) — decisões e fronteiras;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — catálogo de superfícies;
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) — classificação de mudanças;
- [`reference/POST_PR22_PRIORITIZED_BACKLOG.md`](reference/POST_PR22_PRIORITIZED_BACKLOG.md) — backlog histórico, não substitui o plano atual;
- [`superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`](superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md) — contratos de experiência;
- [`superpowers/specs/2026-07-15-frontend-precedencia-design.md`](superpowers/specs/2026-07-15-frontend-precedencia-design.md) — precedência do frontend;
- [`superpowers/specs/2026-07-15-interacoes-compartilhadas-design.md`](superpowers/specs/2026-07-15-interacoes-compartilhadas-design.md) — interações compartilhadas.

## Evidências e auditorias

### Vigentes ou diretamente relevantes

- [`audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md`](audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md);
- [`handoff/2026-07-15-ciclo-a-final-report.md`](handoff/2026-07-15-ciclo-a-final-report.md);
- [`evidence/frontend-precedence/manifest.json`](evidence/frontend-precedence/manifest.json);
- [`evidence/shared-interactions/full-comparison.png`](evidence/shared-interactions/full-comparison.png).

### Históricas

- [`handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`](handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md) — retrato do gate de pré-conexão;
- [`superpowers/plans/2026-07-14-supabase-preconnection-gate.md`](superpowers/plans/2026-07-14-supabase-preconnection-gate.md) — plano já executado;
- [`audits/2026-07-15-inventario-tecnico-global.md`](audits/2026-07-15-inventario-tecnico-global.md);
- [`audits/2026-07-15-dados-e-ambientes-estado-atual.md`](audits/2026-07-15-dados-e-ambientes-estado-atual.md);
- [`audits/2026-07-15-produto-estado-atual.md`](audits/2026-07-15-produto-estado-atual.md);
- [`evidence/global-baseline/manifest.json`](evidence/global-baseline/manifest.json);
- [`evidence/global-baseline/repository-inventory.json`](evidence/global-baseline/repository-inventory.json) — não representa o inventário atual; deve ser regenerado pelo script canônico.

## Regras funcionais que permanecem vigentes

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
- Gestão SME não executa mutações operacionais descritas na ADR-022.

## Plano vigente

A próxima sequência de desenvolvimento é:

1. contexto e seletor global de competência;
2. disponibilização operacional de junho a dezembro;
3. certificação da avaliação mensal;
4. linha do tempo cronológica;
5. certificação das exportações Excel;
6. navegação contextual e botões de voltar;
7. polimento editorial;
8. segurança, UAT e release oficial.

Detalhamento: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
