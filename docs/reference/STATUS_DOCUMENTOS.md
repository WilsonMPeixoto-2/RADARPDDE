# Matriz de validade documental

**Atualizado em:** 7 de agosto de 2026  
**Classe documental:** Canônico

## 1. Finalidade

Este documento define quais arquivos podem orientar o estado presente e quais existem apenas para rastreabilidade histórica.

O baseline mutável do ambiente fica exclusivamente em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).

## 2. Classes

| Classe | Significado |
|---|---|
| **Canônico** | controla estado, prioridade, regra geral ou validade documental vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada de contrato executável; não editar manualmente |
| **Referência vigente** | descreve contrato técnico/funcional atual |
| **Runbook vigente** | procedimento operacional atual, sem constituir autorização automática |
| **Procedimento histórico restrito** | aplicável somente a bootstrap, recuperação formal ou contexto explicitamente indicado |
| **Decisão vigente** | regra duradoura aprovada |
| **Evidência** | comprova execução específica em data/SHA/ambiente determinados |
| **Trabalho em andamento** | conteúdo de branch/PR ainda não integrado; não altera baseline da `main` |
| **Histórico executado** | plano/spec/relatório preservado após execução |
| **Superado** | não usar para orientar o presente, salvo investigação histórica |

## 3. Precedência

1. código, migrations, tipos e contratos executáveis da versão analisada;
2. Supabase e Vercel efetivos;
3. evidências reproduzíveis do mesmo SHA;
4. decisões vigentes;
5. documentos canônicos;
6. referências e runbooks vigentes;
7. históricos.

PR aberto, Preview, documento ou memória de conversa não modifica o estado de Production.

## 4. Fontes canônicas

| Arquivo | Função |
|---|---|
| `AGENTS.md` | regras de trabalho e proteção do projeto |
| `README.md` | entrada do repositório |
| `docs/CURRENT_STAGE.md` | **baseline mutável único**, prioridades e pendências reais |
| `docs/PROJECT_CONTEXT.md` | contrato funcional e arquitetural estável |
| `docs/ROADMAP_ATUALIZACOES_2026.md` | sequência e prioridades |
| `docs/DECISION_LOG.md` | decisões duradouras |
| `docs/README.md` | índice da documentação |
| `docs/reference/STATUS_DOCUMENTOS.md` | classificação de validade documental |

Nenhum outro documento deve copiar desnecessariamente SHA, deployment, contagem de migrations ou versão de Edge Function. Quando esse dado for indispensável em evidência histórica, deve vir acompanhado de data/SHA e não ser apresentado como baseline atual.

## 5. Matriz funcional ponta a ponta

| Arquivo | Classe | Uso |
|---|---|---|
| `docs/reference/functional-contract-matrix.json` | Contrato executável | perfis, superfícies, evidências e composição |
| `docs/reference/functional-contract-matrix/core.json` | Contrato executável | Auth, leitura, navegação e exportações |
| `docs/reference/functional-contract-matrix/configuration.json` | Contrato executável | configuração, escolas e equipe |
| `docs/reference/functional-contract-matrix/operations.json` | Contrato executável | verificações, pendências, notas, bens e auditoria |
| `docs/reference/functional-contract-matrix/technical.json` | Contrato executável | importação, monitoramento e integridade |
| `scripts/check-functional-contract-matrix.mjs` | Contrato executável | validação e geração |
| `tests/unit/functional-contract-matrix.test.js` | Contrato executável | regressões |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão das 41 operações |

Na reconciliação pós-PR #162, a fonte executável passa a registrar 9 operações comprovadas e 32 parciais, sem lacuna técnica ou decisão funcional pendente. `ASSET-02` e `CFG-03/04` não devem voltar aos estados antigos sem nova evidência/decisão.

## 6. Referências vigentes

### Arquitetura

- `docs/architecture/README.md`;
- `docs/architecture/competencias.md`;
- `docs/architecture/avaliacao-mensal.md`;
- `docs/architecture/modelo-operacional.md`;
- `docs/architecture/timeline-unidade.md`;
- `docs/architecture/navigation-contextual.md`;
- `docs/architecture/testing.md`;
- `docs/architecture/supabase-readiness.md`;
- `docs/architecture/frontend-load-order.md`;
- `docs/architecture/product-extensions-load-order.md`;
- contratos Excel em `docs/architecture/excel-*.md`.

`docs/architecture/roadmap-pre-supabase.md` é **Superado/Histórico executado** para fins de estágio corrente.

### Supabase e produto

- `docs/reference/SUPABASE_DATA_DICTIONARY.md`;
- `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`;
- `docs/reference/SUPABASE_INTEGRATION_AUDIT.md`;
- `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`;
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
- `docs/reference/PRODUCT_DECISIONS.md`;
- `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`;
- `docs/reference/CHANGE_CLASSIFICATION.md`.

Referências com data antiga continuam vigentes apenas quando o conteúdo técnico não divergir do código atual. Se houver divergência, prevalecem código/ambiente e esta reconciliação até atualização do arquivo específico.

## 7. Runbooks

| Documento | Classe |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | Runbook vigente |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | Runbook vigente |
| `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | Procedimento histórico restrito |
| `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md` | Procedimento histórico restrito |

Comando existente em runbook não equivale a autorização para executá-lo em Production.

## 8. Decisões

Arquivos de `docs/decisions/` e entradas correspondentes de `DECISION_LOG.md` são **Decisão vigente**, salvo quando o próprio status declarar `Substituída`, `Revogada`, `Cumprida` ou equivalente.

Decisões históricas podem conter valores datados corretos para seu momento. Esses valores não devem ser atualizados retroativamente.

## 9. Auditorias

Todos os arquivos datados de `docs/audits/` são, por padrão, **Evidência** ou **Histórico executado**.

Regras:

- preservar constatações e baseline originais;
- não trocar SHA/migration/versionamento antigo pelo valor atual;
- quando uma falha tiver sido corrigida depois, registrar a resolução em documento atual ou nova auditoria, sem apagar a descoberta original;
- auditoria datada não substitui `CURRENT_STAGE.md`.

Exemplos importantes:

- auditorias do Excel SME permanecem válidas como evidência de seus candidatos;
- auditorias dos incidentes de Gestão de Equipe permanecem válidas como histórico dos defeitos e correções;
- `2026-08-05-reconciliacao-documental-integral.md` é a reconciliação anterior e não controla o estado presente;
- `2026-08-07-reconciliacao-documental-integral-pos-pr162.md` registra a reconciliação corrente.

## 10. Evidências

Arquivos de `docs/evidence/` são **Evidência** e devem permanecer imutáveis quanto ao significado do run/SHA que registram.

`docs/evidence/2026-08-06-functional-remediation-validation.md` comprova a validação do pacote do PR #162; o fato de as migrations terem sido posteriormente aplicadas em Production é registrado em `CURRENT_STAGE.md` e na reconciliação de 7 de agosto, não por reescrita retrospectiva daquela evidência.

## 11. Planos e especificações

Arquivos de `docs/superpowers/plans/` e `docs/superpowers/specs/`:

- **Histórico executado** quando a tarefa correspondente foi concluída/substituída;
- **Trabalho em andamento** somente quando vinculados a branch/PR realmente ativo;
- nunca controlam sozinhos o presente.

Não reescrever um plano concluído para refletir solução posterior.

## 12. Handoffs e relatórios

Arquivos de `docs/handoff/` e `docs/reports/` são **Histórico executado** ou **Evidência**, salvo indicação expressa em contrário. Servem para rastreabilidade, não para baseline corrente.

## 13. PR #156

O conteúdo da branch `docs/auditoria-funcional-frontend-supabase-design-20260806` é **Trabalho em andamento histórico e divergente da `main`**.

- não fazer merge cego;
- não importar seus números de baseline como atuais;
- reaproveitar apenas evidências compatíveis com o código presente;
- o defeito de bootstrap do Controlador investigado ali foi tratado pelo PR #160;
- os achados remediados pelo PR #162 permanecem históricos naquela branch;
- qualquer auditoria restante deve partir da `main` atual.

Enquanto o PR #156 estiver aberto, seu status não altera a documentação canônica.

## 14. Afirmações superadas que não podem voltar ao presente

Não usar como estado corrente:

- Excel SME público com 30 colunas;
- Gestão de Equipe corrigida apenas pelo PR #138;
- lookup de Auth por varredura global `listUsers`;
- PR #141 aberto ou migration de integridade não aplicada;
- PR #148 ainda não integrado;
- `ASSET-02` como lacuna técnica de persistência genérica;
- `CFG-03`/`CFG-04` como decisão funcional ainda não tomada;
- geração artificial de identidade institucional de escola como comportamento válido;
- auditoria de exportação via snapshot legado de logs como contrato vigente;
- qualquer SHA, deployment, migration count ou Edge version anteriores como baseline atual.

## 15. Manutenção

Mudança material deve:

1. atualizar o código/contrato executável afetado;
2. atualizar testes e evidência;
3. atualizar a matriz funcional quando a operação mudar;
4. atualizar `CURRENT_STAGE.md` se o baseline/prioridade mudar;
5. atualizar roadmap/contexto/referência apenas quando o contrato estável mudar;
6. preservar históricos sem reescrita retrospectiva.
