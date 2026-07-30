# Status dos documentos do RADAR PDDE

**Atualizado em:** 29 de julho de 2026

## 1. Precedência vigente

Quando houver divergência entre fontes, aplicar nesta ordem:

1. código-fonte remoto vigente;
2. migrations, funções, políticas, Auth e dados efetivos do Supabase autorizado;
3. artefato efetivamente implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões expressas vigentes compatíveis com as fontes técnicas;
6. documentação canônica atualizada;
7. documentos, planos e evidências históricas.

A orientação do responsável define intenção, prioridade e decisão de produto. Uma afirmação sobre o que está implementado ou implantado precisa ser confirmada nas fontes operacionais.

Documentação desatualizada deve ser corrigida para representar código e ambientes. O código não deve ser alterado apenas para coincidir com documento histórico.

## 2. Estado operacional de referência

| Camada | Estado em 29/07/2026 |
|---|---|
| Baseline funcional da `main` | `598361dd784563f4d70d1e25df3818f4ee066da8` |
| Vercel Production | `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, `READY` |
| Commit funcional publicado | `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77` |
| Supabase | `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY` |
| Competências | 12; `closing_competence = 2026-12` |
| Governança SME | concluída e publicada |
| Ciclos 1 a 5 | concluídos, mesclados e publicados |
| Histórico de migrations | 25 versões alinhadas entre GitHub e Supabase Production; migration SME reconciliada |
| Liberação oficial | não declarada |

O commit `598361dd...` é posterior ao deployment funcional e apenas restaura o bloqueio automático da Vercel.

## 3. Matriz documental

| Documento | Papel | Situação | Caminho |
|---|---|---|---|
| Estado atual | Estado operacional, bloqueadores e próxima decisão | **Canônico e transitório** | `docs/CURRENT_STAGE.md` |
| Contexto do projeto | Finalidade, perfis, arquitetura e contratos | **Canônico** | `docs/PROJECT_CONTEXT.md` |
| Registro de decisões | ADRs vigentes e substituídas | **Canônico** | `docs/DECISION_LOG.md` |
| Índice de documentação | Navegação e classificação das fontes | **Canônico** | `docs/README.md` |
| Auditoria pós-ciclos 1 a 5 | Reconciliação entre código, GitHub, Vercel, Supabase e documentos | **Vigente** | `docs/audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md` |
| Achado original da migration SME | Divergência detectada, equivalência do SQL e regra preventiva | **Histórico resolvido** | `docs/audits/2026-07-29-rastreabilidade-migration-sme.md` |
| Plano de reconciliação SME | Estratégia efetivamente executada para alinhar o histórico remoto | **Executado** | `docs/audits/2026-07-29-reconciliacao-migration-sme-plano.md` |
| Evidências da reconciliação SME | Estado anterior, comandos controlados, estado posterior e proteção contra regressão | **Vigente** | `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` |
| Auditoria de alinhamento de 28/07/2026 | Linha de base anterior à execução dos ciclos | **Histórica relevante** | `docs/audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md` |
| Plano de oficialização de 28/07/2026 | Plano que originou os ciclos 1 a 5 e gates de release | **Executado quanto aos ciclos; histórico para essa parte; referencial para gates finais** | `docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md` |
| Adendo técnico do plano | Correções técnicas sobre competência, timeline e certificação | **Executado e preservado como histórico de decisão** | `docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde-addendum.md` |
| Dossiê Consolidado v1.0 | Contexto e regras históricas | **Referência; não inventário técnico atual** | `docs/reference/RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional, visual e de navegação original | **Referência de produto** | `docs/reference/RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` |
| Relatório e Guia do Ciclo A v1.0 | Explicação funcional de ciclo anterior | **Histórico produzido** | `docs/reports/RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` |
| Relatório de estado atual — 12/07/2026 | Registro dos PRs 18 e 19 | **Histórico** | `docs/reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md` |
| Protótipo Excel conservador v2.1 | Referência editorial congelada | **Referência aprovada** | `docs/reference/RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` |
| Arquitetura de prontidão Supabase | Contrato criado durante pré-conexão | **Vigente nos contratos; trechos de estágio são históricos** | `docs/architecture/supabase-readiness.md` |
| Dicionário de dados Supabase | Modelo relacional e relacionamentos | **Vigente nas tabelas; introduções de “futura persistência” ou “modo local” são históricas** | `docs/reference/SUPABASE_DATA_DICTIONARY.md` |
| Matriz de permissões Supabase | Perfis e RLS | **Aplicada; conferir ADR-022 e migrations atuais** | `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` |
| Runbook de conexão Supabase | Configuração e validação | **Executado; permanece para operação e recuperação** | `docs/runbooks/SUPABASE_CONNECTION.md` |
| Runbook de migração e rollback | Promoção, reconciliação e retorno | **Vigente; histórico SME reconciliado** | `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` |
| Arquitetura de competências | Contexto mensal global | **Vigente e implementada** | `docs/architecture/competencias.md` |
| Arquitetura da avaliação mensal | Projeção canônica APTA/INAPTA | **Vigente e implementada** | `docs/architecture/avaliacao-mensal.md` |
| Arquitetura da timeline | Histórico como projeção | **Vigente e implementada** | `docs/architecture/timeline-unidade.md` |
| Certificação integral Excel | Paridade dos dois produtos Excel | **Vigente e implementada no gate automatizado** | `docs/architecture/excel-integral-certification.md` |
| Navegação contextual | Preservação de origem, competência, rolagem e foco | **Vigente e implementada** | `docs/architecture/navigation-contextual.md` |
| Specs e planos de pré-conexão | Registro do desenho e execução anteriores | **Históricos** | `docs/superpowers/specs/` e `docs/superpowers/plans/` |
| Inventário técnico global gerado | Evidência determinística de linha de base anterior | **Histórico; deve ser regenerado pelo script canônico quando necessário** | `docs/evidence/global-baseline/repository-inventory.json` |

## 4. Estado das entregas

### Concluídas e publicadas

- conexão do frontend ao Supabase Production;
- Auth, PostgREST, RLS, migrations e auditoria;
- governança da Gestão SME;
- 12 competências de 2026 e contexto mensal global;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- certificação automatizada dos relatórios Excel;
- navegação contextual e retorno seguro;
- validação desktop, Android e iPhone do Ciclo 5;
- bloqueio automático da Vercel restaurado após cada janela controlada;
- reconciliação do identificador da migration SME entre GitHub e Supabase Production.

### Pendentes antes da liberação oficial

- homologação manual dos relatórios no Microsoft Excel desktop;
- proteção contra senhas vazadas no Supabase Auth;
- fixação deliberada da major operacional do Node;
- backup e restauração em ambiente descartável;
- gate remoto por perfil e viewport;
- UAT;
- polimento editorial e visual;
- decisão formal de liberação.

## 5. Rastreabilidade da migration SME — resolvida

| Item | Valor |
|---|---|
| Arquivo versionado | `20260728182226_sme_access_governance.sql` |
| Versão registrada em Production | `20260728182226` |
| Nome registrado | `sme_access_governance` |
| Registro derivado anterior | `20260728190344`, removido por `migration repair` |
| Total de migrations remotas | 25 |
| Comprimento reconstruído do SQL | 1.411 caracteres |
| SHA-256 reconstruído | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` |
| Divergência funcional | não identificada |
| Divergência de rastreabilidade | resolvida |

O arquivo canônico foi preservado. O reparo alterou apenas o histórico gerenciado pelo Supabase CLI, sem reaplicação do SQL. Um teste de regressão protege a versão local e o hash.

## 6. Integridade dos binários verificados

| Arquivo | SHA-256 |
|---|---|
| `RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` | `e550800f0dd5fb734ba21131d5679a592be51557cf2fb9048918e01ef1d25c26` |
| `RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` | `9cd8ad8ffb993bb2426c9dd47a459818098891b5a69e418fd8e24f99f814f206` |
| `RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` | `e22d46e7474ff5b9c489e39bdf8b21691fb67cfcc11b76b5d1776429445d5203` |
| `RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` | `bd63666aac323a122b16d5eda429956cae1ffd242fd45825973a310e9c6d7aa8` |

Hashes identificam os binários verificados. Não garantem que o conteúdo represente o estado técnico atual.

## 7. Regras de preservação

- documentos históricos não devem ser reescritos para simular atualidade;
- artefatos gerados devem ser regenerados pelo script canônico, não editados manualmente;
- PRs substituídos devem ser fechados sem merge e preservados como histórico quando úteis;
- melhorias visuais devem preservar paleta, identidade e decisões de produto;
- alterações de capacidades, caminhos, componentes, colunas, permissões ou fluxos exigem decisão e testes correspondentes;
- polimento não pode reduzir capacidade, informação ou acessibilidade.

## 8. Próxima decisão

Os ciclos 1 a 5 estão encerrados e a migration SME está reconciliada. A próxima frente ainda não foi escolhida e deve partir dos bloqueadores reais restantes.

O cadastro e a disponibilização de programas por exercício permanecem fora do escopo até decisão específica.
