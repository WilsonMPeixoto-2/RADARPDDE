# Status dos documentos do RADAR PDDE

**Atualizado em:** 28 de julho de 2026

## Precedência vigente

Quando houver divergência entre fontes, aplicar nesta ordem:

1. código-fonte remoto vigente;
2. migrations, funções, políticas, Auth e dados efetivamente existentes no Supabase autorizado;
3. artefato efetivamente implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões expressas vigentes compatíveis com as fontes técnicas;
6. documentação canônica atualizada;
7. documentos e planos históricos.

A orientação do responsável define intenção, prioridade e decisão de produto. Uma afirmação sobre o que já está implementado ou implantado precisa ser confirmada nas fontes operacionais.

Documentação desatualizada deve ser corrigida para representar o código e os ambientes. O código não deve ser alterado apenas para coincidir com documento histórico.

## Matriz documental

| Documento | Papel | Situação | Caminho |
|---|---|---|---|
| Estado atual | Estado operacional e próxima frente | Canônico e transitório | `docs/CURRENT_STAGE.md` |
| Contexto do projeto | Finalidade, perfis, arquitetura e contratos | Canônico | `docs/PROJECT_CONTEXT.md` |
| Registro de decisões | ADRs vigentes e substituídas | Canônico | `docs/DECISION_LOG.md` |
| Auditoria de alinhamento de 28/07/2026 | Confronto entre GitHub, Vercel, Supabase e documentação | Vigente | `docs/audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md` |
| Plano de oficialização | Próximos subprojetos, testes e gates | Vigente | `docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md` |
| Dossiê Consolidado v1.0 | Contexto e regras históricas | Referência; não inventário técnico atual | `docs/reference/RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional, visual e de navegação original | Referência de produto | `docs/reference/RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` |
| Relatório e Guia do Ciclo A v1.0 | Explicação funcional do ciclo | Histórico produzido | `docs/reports/RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` |
| Relatório de estado atual — 12/07/2026 | Registro dos PRs 18 e 19 | Histórico | `docs/reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md` |
| Protótipo Excel conservador v2.1 | Referência editorial congelada | Referência aprovada | `docs/reference/RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` |
| Arquitetura de prontidão Supabase | Contrato criado durante pré-conexão | Vigente nos contratos; trechos de estágio são históricos | `docs/architecture/supabase-readiness.md` |
| Dicionário de dados Supabase | Modelo relacional e relacionamentos | Vigente, sujeito às migrations atuais | `docs/reference/SUPABASE_DATA_DICTIONARY.md` |
| Matriz de permissões Supabase | Perfis e RLS | Aplicada; conferir ADR-022 e migrations atuais | `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` |
| Runbook de conexão Supabase | Configuração e validação da conexão | Executado; permanece para operação e recuperação | `docs/runbooks/SUPABASE_CONNECTION.md` |
| Runbook de migração e rollback | Promoção, reconciliação e retorno | Vigente | `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` |
| Specs e planos de pré-conexão | Registro do desenho e execução anteriores | Históricos | `docs/superpowers/specs/` e `docs/superpowers/plans/` |
| Documentação arquitetural geral | Contratos de manutenção do domínio | Vigente quando compatível com código atual | `docs/architecture/` |
| Inventário técnico global gerado | Evidência determinística de uma linha de base anterior | Histórico; precisa ser regenerado | `docs/evidence/global-baseline/repository-inventory.json` |

## Integridade dos binários verificados

| Arquivo | SHA-256 |
|---|---|
| `RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` | `e550800f0dd5fb734ba21131d5679a592be51557cf2fb9048918e01ef1d25c26` |
| `RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` | `9cd8ad8ffb993bb2426c9dd47a459818098891b5a69e418fd8e24f99f814f206` |
| `RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` | `e22d46e7474ff5b9c489e39bdf8b21691fb67cfcc11b76b5d1776429445d5203` |
| `RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` | `bd63666aac323a122b16d5eda429956cae1ffd242fd45825973a310e9c6d7aa8` |

Hashes identificam os binários verificados. Não garantem que o conteúdo represente o estado técnico atual.

## Estado de implementação em 28/07/2026

- Supabase Production ativo e saudável;
- Vercel Production em `supabase-production`;
- Auth, RLS, migrations, auditoria e repositório remoto ativos;
- governança da Gestão SME aplicada e publicada;
- 12 competências de 2026 no banco;
- operação mensal ainda limitada/configurada em maio;
- Excel SME implementado e sem reparo conhecido, mas certificação integral pendente;
- oficialização operacional ainda não concluída.

## Regra de preservação

Melhorias visuais devem preservar paleta, identidade e decisões de produto. Alterações de botões, caminhos, componentes, colunas, permissões, fluxos ou funcionalidades exigem decisão e testes correspondentes. Polimento não pode reduzir capacidade, informação ou acessibilidade.
