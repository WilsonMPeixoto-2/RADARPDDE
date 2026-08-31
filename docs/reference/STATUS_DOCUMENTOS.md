# Matriz de validade documental

**Atualizado em:** 30 de agosto de 2026
**Classe documental:** Canônico

## 1. Finalidade

Este documento define quais arquivos podem orientar o estado presente e quais existem apenas para rastreabilidade histórica.

O estado mutável do projeto fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md). A estratégia vigente de validação fica em [`TEST_GOVERNANCE.md`](TEST_GOVERNANCE.md).

O roteamento corrente começa em [`../handoff/2026-08-30-pr211-publicacao-concluida.md`](../handoff/2026-08-30-pr211-publicacao-concluida.md). O checkpoint do plano mestre continua em [`../handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](../handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md), mas só volta a orientar a execução depois da reconciliação pós-hotfix.

## 2. Classes

| Classe | Significado |
|---|---|
| **Canônico** | controla estado, prioridade, regra geral ou validade documental vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada de contrato executável; não editar manualmente |
| **Referência vigente** | descreve contrato técnico/funcional atual |
| **Runbook vigente** | procedimento operacional atual, sem constituir autorização automática |
| **Procedimento histórico restrito** | aplicável somente ao contexto explicitamente indicado |
| **Decisão vigente** | regra duradoura aprovada |
| **Evidência** | comprova execução específica em data/SHA/ambiente determinados |
| **Trabalho em andamento** | branch/PR não integrado; não altera baseline da `main` |
| **Histórico executado** | plano/spec/relatório preservado após execução |
| **Superado** | não usar para orientar o presente, salvo investigação histórica |

## 3. Precedência

Para determinar comportamento atual:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e Vercel efetivos;
3. decisões funcionais vigentes;
4. testes atuais que representam esse contrato;
5. documentos canônicos/referências vigentes;
6. testes, auditorias e documentos históricos.

Um teste histórico não prevalece sobre regra e código posteriores. PR aberto, Preview, documento ou memória de conversa não modifica o estado de Production.

## 4. Fontes canônicas

| Arquivo | Função |
|---|---|
| `AGENTS.md` | regras de trabalho e proteção do projeto |
| `README.md` | entrada do repositório |
| `docs/CURRENT_STAGE.md` | estado corrente, prioridades e gatilhos de nova validação |
| `docs/handoff/2026-08-30-pr215-fechamento-tecnico.md` | estado canônico do conjunto PR #211/#214/#215 e ponte para homologação autenticada final |
| `docs/handoff/2026-08-30-pr211-publicacao-concluida.md` | histórico canônico imediatamente após a publicação do PR #211; superado para estado corrente pelo handoff pós-PR #215 |
| `docs/handoff/2026-08-30-pr211-retomada-work.md` | histórico da retomada final do PR #211 |
| `docs/handoff/2026-08-28-pr211-hotfix-notas-fiscais.md` | checkpoint histórico do PR #211 enquanto Draft |
| `docs/superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md` | plano executável específico do hotfix; não substitui o plano mestre |
| `docs/evidence/2026-08-28-pr211-referencias-visuais.md` | evidência/referência visual aprovada do bloco de Notas Fiscais |
| `docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md` | classificação autoritativa dos 16 legados e das fixtures técnicas |
| `docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md` | decisão vigente sobre granularidade individual de análise e Pendência |
| `docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md` | checkpoint canônico curto do plano mestre pós-PR #200 |
| `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` | plano mestre operacional aprovado, com decisões, sequência, gates e reversão |
| `docs/reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx` | versão integral aprovada e versionada do plano |
| `docs/reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.sha256` | integridade verificável do Word canônico |
| `docs/reference/TEST_GOVERNANCE.md` | classificação de falhas e estratégia proporcional de testes |
| `docs/PROJECT_CONTEXT.md` | contrato funcional e arquitetural estável |
| `docs/DECISION_LOG.md` | decisões duradouras agregadas |
| `docs/decisions/ADR-044-pendencias-passivo-transversal.md` | exceção transversal da competência em Pendências |
| `docs/decisions/ADR-045-production-fail-closed.md` | Production sem fallback local/seed |
| `docs/README.md` | índice da documentação |
| `docs/reference/STATUS_DOCUMENTOS.md` | classificação de validade documental |

Valores voláteis como HEAD da `main`, deployment e versão de serviço devem ser consultados no remoto quando necessários. Checkpoints datados podem registrar esses valores como evidência histórica.

## 5. Matriz funcional ponta a ponta

| Arquivo | Classe | Uso |
|---|---|---|
| `docs/reference/functional-contract-matrix.json` | Contrato executável | perfis, superfícies, evidências e composição |
| `docs/reference/functional-contract-matrix/core.json` | Contrato executável | Auth, leitura, navegação e exportações |
| `docs/reference/functional-contract-matrix/configuration.json` | Contrato executável | configuração, escolas e equipe |
| `docs/reference/functional-contract-matrix/operations.json` | Contrato executável | verificações, pendências, notas, bens e auditoria |
| `docs/reference/functional-contract-matrix/technical.json` | Contrato executável | importação, monitoramento e integridade |
| `scripts/check-functional-contract-matrix.mjs` | Contrato executável | validação e geração |
| `tests/unit/functional-contract-matrix.test.js` | Contrato executável | regressões da própria matriz |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão das operações registradas |

A classificação `partial` não significa defeito nem bloqueio automático. Prova adicional só é necessária quando houver risco concreto, mudança relacionada ou auditoria expressa.

A autoridade de `technical_admin` deve permanecer coerente com `src/domain/access-policy.js`: o papel técnico autenticado preserva autoridade mesmo sob simulação visual de perfil funcional.

## 6. Referências vigentes

### Arquitetura

- `docs/architecture/README.md`;
- `docs/architecture/competencias.md`;
- `docs/architecture/avaliacao-mensal.md`;
- `docs/architecture/modelo-operacional.md`;
- `docs/architecture/timeline-unidade.md`;
- `docs/architecture/navigation-contextual.md`;
- `docs/architecture/testing.md`, subordinado à governança proporcional atual quando houver divergência;
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
- `docs/reference/TEST_GOVERNANCE.md`;
- `docs/reference/PRODUCT_DECISIONS.md`;
- `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`;
- `docs/reference/CHANGE_CLASSIFICATION.md`.

Referência antiga continua útil apenas enquanto não divergir do código atual e das referências mais recentes.

## 7. Testes

Testes atuais são proteção do contrato vigente, não uma camada superior ao produto.

Falhas devem ser classificadas conforme `TEST_GOVERNANCE.md` antes de qualquer alteração:

- defeito real de produto;
- contrato de teste superado;
- defeito de fixture/teste;
- infraestrutura;
- flaky não reproduzível.

Testes superados podem ser atualizados, removidos ou explicitamente excluídos da execução quando já houver proteção sucessora adequada. Não alterar comportamento correto para satisfazer expectativa histórica.

## 8. Runbooks

| Documento | Classe |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | Runbook vigente |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | Runbook vigente |
| `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | Procedimento histórico restrito |
| `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md` | Procedimento histórico restrito |

Comando existente em runbook não equivale a autorização para executá-lo em Production.

## 9. Decisões

Arquivos de `docs/decisions/` e entradas correspondentes de `DECISION_LOG.md` são **Decisão vigente**, salvo quando o próprio status declarar `Substituída`, `Revogada`, `Cumprida` ou equivalente.

As decisões recentes mais relevantes são:

- ADR-043 — desativação de Controlador exige carteira previamente zerada;
- ADR-044 — Pendências Operacionais usam visão transversal entre competências;
- ADR-045 — Production é fail-closed e não publica seed institucional legado;
- ADR-046 — escritas operacionais usam retorno autoritativo e reconciliação incremental;
- ADR-047 — vulnerabilidades conhecidas são acompanhadas sem atualização forçada;
- ADR-048 — plano pós-PR #200 usa execução incremental e revisão adversarial;
- ADR-049 — decisão histórica do PR #203, superada no modelo ativo pelos PRs #208/#209; o vigente é `boleto_internet` dentro de Notas Fiscais;
- ADR-050 — Notas Fiscais mantêm bonificação agregada, mas análise e Pendência são individuais por `registered_invoice_id`; `a_identificar` nasce Incorreto + Pendência.

Quando uma ADR detalhada posterior especializar decisão agregada anterior, prevalece a ADR posterior no ponto expressamente indicado.

Decisões históricas podem conter valores corretos para seu momento e não devem ser atualizadas retroativamente apenas para parecer atuais.

## 10. Auditorias e evidências

Arquivos datados de `docs/audits/` e `docs/evidence/` são, por padrão, **Evidência** ou **Histórico executado**.

Regras:

- preservar constatações e baseline originais;
- não trocar SHA/migration/versionamento antigo pelo valor atual;
- quando uma falha for corrigida depois, registrar a resolução em documento atual ou nova evidência;
- auditoria datada não substitui `CURRENT_STAGE.md`;
- evidência de teste de um SHA anterior pode ser reutilizada apenas quando o código materialmente coberto não mudou.

As auditorias dos incidentes de Gestão de Equipe permanecem válidas como histórico dos defeitos e correções, não como indício de falha atual por si só.

## 11. Planos, especificações e handoffs

Arquivos de `docs/superpowers/plans/`, `docs/superpowers/specs/`, `docs/handoff/` e `docs/reports/` são normalmente **Histórico executado**, **Evidência** ou **Trabalho em andamento** conforme sua branch/PR.

**Exceções expressas atuais:** o handoff de publicação concluída é **Canônico — estado pós-publicação**; os handoffs de execução e o plano do hotfix são **Histórico executado/Evidência**; o handoff de 26/08 permanece **Canônico para a retomada do plano**, com reconciliação obrigatória pós-hotfix.

`docs/handoff/2026-08-27-hotfix-boleto-internet.md` é **Histórico executado** do PR #203. Suas afirmações sobre a categoria autônoma `boletoInternet` não prevalecem sobre os PRs #208/#209 e o ADR-050.

O plano `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` é **Canônico — aprovado, com PR1/PR2 concluídos e PR3.1 aguardando fechamento/reconciliação do conjunto PR #211/#214/#215**. Seus checkboxes não comprovam implementação. O Word correspondente é **Referência canônica versionada**; a versão Markdown prevalece para busca, diff e execução.

O handoff, o plano e o Word de 24/08 são **Superados como orientação operacional** e permanecem **Evidência/Histórico** do primeiro diagnóstico anterior ao PR #200. Não apagar nem reescrever esses arquivos.

Os handoffs de 18/08 e 23/08 permanecem **Histórico executado/Evidência** de seus respectivos checkpoints e não devem ser apagados ou reescritos para parecer atuais.

Não reescrever plano concluído para refletir solução posterior e não usar plano antigo como autoridade sobre o código atual.

## 12. Afirmações superadas que não podem voltar ao presente

Não usar como estado corrente:

- Excel SME público com 30 colunas;
- lookup de Auth por varredura global `listUsers`;
- geração artificial de identidade institucional de escola como comportamento válido;
- auditoria de exportação via snapshot legado como contrato vigente;
- Assistente sem capacidade de reanalisar pendências;
- `technical_admin` perdendo autoridade ao simular SME, Controlador, Assistente ou Inventário;
- `activeCompetenciaKey` manipulada diretamente como fonte atual de seleção mensal;
- Pendências Operacionais filtradas implicitamente pela competência global;
- fallback silencioso de Production para LocalStorage/seed;
- coleção ordenada por UUID tratada como sequência cronológica;
- cobertura `partial` interpretada automaticamente como projeto inacabado;
- qualquer SHA/deployment antigo presumido como baseline atual sem consulta ao remoto.
- `Situação técnica` agregada restaurada no cabeçalho fiscal por leitura de mockup anterior;
- preservação indistinta dos 20 `a_identificar` ou reparo do Boleto 1234;
- `a_identificar` legado editável/excluível ou recebendo Pendência retroativa;
- reanálise fiscal/Assessoria sem a tentativa real mais recente ou com reescrita do envio;
- nova reconferência visual manual ou Lighthouse móvel tratados como bloqueadores do PR #211;
- documentação que trate 43 migrations, o deployment pré-PR #215 ou o PR #211 isoladamente como estado corrente;
- qualquer interpretação de que novo envio da Assessoria não possui implementação individual: a autoridade vigente é `service-advisory-corrective-submission.js`, carregada pelo bootstrap crítico.

## 13. Manutenção

Mudança material deve, conforme impacto:

1. atualizar código/contrato executável afetado;
2. atualizar teste diretamente relacionado quando a regra mudar;
3. atualizar a matriz funcional quando a operação mudar;
4. atualizar `CURRENT_STAGE.md` quando estado/prioridade mudar;
5. atualizar ADRs e snapshot quando decisão duradoura mudar;
6. atualizar referências apenas quando o contrato estável mudar;
7. preservar históricos sem reescrita retrospectiva;
8. aplicar validação proporcional, não checklist universal.
