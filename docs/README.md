# Documentação do RADAR PDDE

Este diretório organiza as fontes funcionais, arquiteturais, históricas e operacionais do projeto.

## Estado de referência

A base funcional contém os PRs 18 a 21. O PR 22 conclui o Gate de Pré-conexão Supabase: a arquitetura remota está preparada e testada localmente, mas produção continua em `localStorage`, sem URL, chave ou conexão ativa.

Documentos de referência:

- [`handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`](handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md) — escopo, evidências, salvaguardas e dependências remotas;
- [`superpowers/plans/2026-07-14-plano-diretor-consolidacao-evolucao-pos-pr22.md`](superpowers/plans/2026-07-14-plano-diretor-consolidacao-evolucao-pos-pr22.md) — governança da evolução, proteção contra regressões, trilhas, ciclos e gates de aprovação pós-PR 22.

## Regra de precedência

1. orientação expressa mais recente do responsável pelo projeto;
2. relatório atual de execução e descrição do PR vigente;
3. Dossiê Consolidado;
4. Plano aprovado do Lote 2;
5. planos técnicos e especificações;
6. implementação vigente.

Documentos antigos permanecem disponíveis para rastreabilidade, mas não prevalecem sobre decisões posteriores consolidadas.

## Referências canônicas

| Documento | Finalidade | Status |
|---|---|---|
| Dossiê Consolidado v1.0 | Contexto, regras de negócio e decisões consolidadas | Canônico |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional, visual e de navegação | Aprovado |
| Protótipo de exportação Excel v2.1 | Estrutura e identidade da exportação Excel | Referência congelada |
| Relatório e Guia do Ciclo A v1.0 | Relatório funcional e guia para usuários | Produzido |
| [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) | Precedência, disponibilidade e integridade | Vigente |

## Arquitetura

- [`architecture/competencias.md`](architecture/competencias.md) — contexto mensal e chaves de competência;
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) — projeção compartilhada entre telas;
- [`architecture/retificacoes.md`](architecture/retificacoes.md) — retificação administrativa auditável;
- [`architecture/testing.md`](architecture/testing.md) — estratégia de validação;
- [`architecture/excel-export.md`](architecture/excel-export.md) — exportação estruturada;
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md) — arquitetura de persistência e ativação futura.

## Supabase

### Referências

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — tabelas, campos e relacionamentos;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — perfis e permissões;
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md) — equivalência dos adaptadores e fluxos testados;
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md) — auditoria técnica e segurança.

### Runbooks

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) — conexão futura em ambiente controlado;
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) — staging, retomada, promoção, reconciliação e rollback.

### Plano final

- [`superpowers/plans/2026-07-14-supabase-preconnection-gate.md`](superpowers/plans/2026-07-14-supabase-preconnection-gate.md) — Tasks 1 a 10 e critérios de aceite do HEAD congelado.

## Ciclo A pós-PR 22 — linha de base e classificação

- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md) — decisões e fronteiras;
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) — códigos e condutas;
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) — dados e ambientes;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — 18 superfícies e conexões;
- [`reference/POST_PR22_PRIORITIZED_BACKLOG.md`](reference/POST_PR22_PRIORITIZED_BACKLOG.md) — backlog priorizado;
- [`audits/2026-07-15-inventario-tecnico-global.md`](audits/2026-07-15-inventario-tecnico-global.md) — inventário técnico;
- [`audits/2026-07-15-dados-e-ambientes-estado-atual.md`](audits/2026-07-15-dados-e-ambientes-estado-atual.md) — auditoria de dados;
- [`audits/2026-07-15-produto-estado-atual.md`](audits/2026-07-15-produto-estado-atual.md) — auditoria global;
- [`superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`](superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md) — 16 contratos de experiência;
- [`evidence/global-baseline/manifest.json`](evidence/global-baseline/manifest.json) — manifesto visual reproduzível;
- [`handoff/2026-07-15-ciclo-a-final-report.md`](handoff/2026-07-15-ciclo-a-final-report.md) — encerramento e próxima prioridade.

## Situação funcional

- Ciclo A concluído até as Tasks 10–13;
- quatro filas canônicas de pendências;
- novo envio e reanálise;
- contatos, cancelamento e reabertura;
- retificação administrativa;
- Dashboard operacional;
- Carteira de Escolas desktop e mobile;
- acessibilidade de modais;
- navegação contextual e relatório Excel.

## Persistência

- produção oficial: `LocalStorageRepository`;
- backend preparado: `SupabaseRepository`;
- 12 migrations PostgreSQL;
- Auth local, cinco perfis e RLS;
- contratos Ajv/pg_jsonschema;
- migração reversível;
- nenhuma conexão remota ativa.

## Princípios que não devem ser reinterpretados

- A unidade escolar permanece como entidade monitorada.
- Bonificação, análise técnica e pendência são dimensões independentes.
- Novo envio não resolve a pendência.
- Reanálise positiva resolve; reanálise negativa reabre a providência.
- Pendência não altera automaticamente a bonificação.
- Retificação não altera automaticamente análise técnica ou pendências.
- `Aberta` e `Aguardando reanálise` são estados ativos.
- Não existe estado `Vencida`.
- Indicadores operacionais podem se sobrepor e não devem ser somados.

## Dependências futuras

- projeto Supabase remoto;
- configuração Vercel de Preview;
- aplicação controlada das migrations;
- usuários reais de homologação;
- Auth/RLS remotos;
- importação de cópia controlada;
- Advisors, backup, restauração e MFA;
- autorização de ativação em produção.
