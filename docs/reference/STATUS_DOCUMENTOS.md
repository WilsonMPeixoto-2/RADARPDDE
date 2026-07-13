# Status dos documentos do RADAR PDDE

## Precedência vigente

Quando houver divergência entre fontes, aplicar nesta ordem:

1. orientação expressa mais recente do responsável pelo projeto;
2. relatório atual de execução, quanto ao estado da implementação;
3. Dossiê Consolidado;
4. Plano aprovado do Lote 2;
5. plano técnico e especificação vigentes;
6. implementação vigente.

Decisões consolidadas não devem ser reabertas sem nova regra institucional, defeito comprovado ou determinação expressa.

## Matriz documental

| Documento | Papel | Situação | Caminho previsto ou vigente |
|---|---|---|---|
| Dossiê Consolidado v1.0 | Contexto canônico, regras e decisões consolidadas | Canônico; arquivo verificado | `docs/reference/RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional, visual e de navegação | Aprovado; arquivo verificado | `docs/reference/RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` |
| Plano técnico do Ciclo A | Roteiro de implementação e critérios de aceite | Vigente para o Ciclo A | `docs/superpowers/plans/` |
| Relatório e Guia do Ciclo A v1.0 | Explicação funcional para usuários e gestores | Produzido após a Task 9; arquivo verificado | `docs/reports/RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` |
| Relatório de estado atual — 12/07/2026 | Registro histórico dos PRs 18 e 19 e da publicação naquela data | Histórico; versionado em Markdown | `docs/reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md` |
| Protótipo Excel conservador v2.1 | Referência congelada da exportação | Referência aprovada; arquivo verificado | `docs/reference/RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` |
| Arquitetura de prontidão para Supabase | Contrato de persistência, bloqueios e ativação futura | Vigente para a infraestrutura preparada | `docs/architecture/supabase-readiness.md` |
| Dicionário de dados Supabase | Modelo relacional, tabelas e relacionamentos | Vigente para as migrations preparadas | `docs/reference/SUPABASE_DATA_DICTIONARY.md` |
| Matriz de permissões Supabase | Perfis e políticas RLS futuras | Vigente, ainda não aplicada a ambiente remoto | `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` |
| Runbook de conexão Supabase | Procedimento controlado de ativação em Preview | Vigente; execução futura | `docs/runbooks/SUPABASE_CONNECTION.md` |
| Runbook de migração e rollback | Exportação, importação, reconciliação e retorno ao modo local | Vigente; execução futura | `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` |
| Especificação e plano Supabase readiness | Registro do desenho aprovado e da execução | Documentação de desenvolvimento | `docs/superpowers/specs/2026-07-13-supabase-readiness-design.md` e `docs/superpowers/plans/2026-07-13-supabase-readiness.md` |
| Documentação arquitetural geral | Contratos de manutenção do domínio | Vigente | `docs/architecture/` |

## Integridade dos binários verificados

| Arquivo | SHA-256 |
|---|---|
| `RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` | `e550800f0dd5fb734ba21131d5679a592be51557cf2fb9048918e01ef1d25c26` |
| `RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` | `9cd8ad8ffb993bb2426c9dd47a459818098891b5a69e418fd8e24f99f814f206` |
| `RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` | `e22d46e7474ff5b9c489e39bdf8b21691fb67cfcc11b76b5d1776429445d5203` |
| `RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` | `bd63666aac323a122b16d5eda429956cae1ffd242fd45825973a310e9c6d7aa8` |

Os arquivos binários foram verificados no ambiente de execução. Até que a inclusão binária no GitHub seja concluída, o README não deve apresentar links quebrados nem afirmar que esses caminhos já existem.

## Estado de implementação em 13/07/2026

- PRs 18, 19, 20 e 21 incorporados à `main`;
- produção Vercel alinhada à `main` no encerramento do PR 21;
- Dashboard, Carteira, Pendências, Competências e acessibilidade consolidados;
- preparação Supabase desenvolvida em branch isolada, com produção preservada em `localStorage`;
- migrations, adaptadores, testes e runbooks não autorizam conexão automática nem substituem a homologação futura.

## Regra de preservação

Melhorias visuais devem preservar botões, caminhos, componentes, colunas, permissões e funcionalidades existentes. Qualquer alteração nesses elementos exige aprovação expressa prévia do responsável pelo projeto.
