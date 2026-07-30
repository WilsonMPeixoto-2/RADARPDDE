# Plano de implementação — alinhamento documental integral pós-PR #108

> **Status:** concluído; aguardando verificação final e merge  
> **Data-base:** 29/07/2026  
> **Branch:** `docs/alinhamento-integral-pos-pr108-20260729`  
> **Base:** `05f51cbdd433844f11db036bcdefa5f9d8941e45`

## Objetivo

Eliminar divergências remanescentes entre a documentação vigente e o estado comprovado do código, da Vercel Production e do Supabase Production antes da abertura de nova frente do produto.

A alteração é documental e de configuração exemplificativa. Não modifica runtime, frontend, serviços, migrations, RLS, dados, Auth, dependências ou deployment. O único arquivo não Markdown alterado é `.env.example`, corrigido como exemplo seguro de desenvolvimento local.

## Fontes de verdade

1. código remoto da `main`;
2. migrations, políticas, funções e histórico efetivo do Supabase autorizado;
3. artefato vigente na Vercel Production;
4. testes, manifests e evidências reproduzíveis;
5. ADRs e decisões funcionais vigentes;
6. documentação, ajustada às fontes anteriores.

## Achados corrigidos

1. contrato de competências descrevia `closing_competence = 2026-05` como estado vigente;
2. avaliação mensal tratava certificação Excel concluída como etapa futura;
3. cadeia pós-`app.js` omitia navegação contextual;
4. inventário narrativo do frontend não representava as extensões atuais;
5. estratégia de testes descrevia suíte anterior ao readiness integral;
6. arquitetura e cobertura Supabase ainda apresentavam Production local;
7. contrato SME afirmava presença de `dataValidations`;
8. parte da documentação afirmava incorretamente que o botão institucional permanecia no CSV;
9. runbooks não separavam bootstrap inicial, operação normal e reparo de histórico;
10. runbook de migrations não incorporava o gate da migration SME;
11. ADR-026 preservava hipótese desnecessária de migration adicional;
12. dicionário de dados descrevia schema futuro e incompleto;
13. `AGENTS.md` orientava agentes segundo o estágio pré-Supabase;
14. `.env.example` dizia que a aplicação publicada permanecia local;
15. índice legado de decisões continha estados já substituídos;
16. catálogo de superfícies atribuía capacidades e ambientes antigos;
17. índices apontavam para arquivos inexistentes ou omitiam fontes atuais;
18. documentos históricos de pré-conexão não exibiam classificação explícita.

## Tarefas concluídas

### 1. Contratos de produto

Atualizados:

- `docs/architecture/competencias.md`;
- `docs/architecture/avaliacao-mensal.md`;
- `docs/architecture/excel-sme-mensal.md`;
- `docs/architecture/excel-export.md`;
- `docs/architecture/excel-xlsx-runtime.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`.

### 2. Arquitetura de carregamento

Atualizados:

- `docs/architecture/frontend-load-order.md`;
- `docs/architecture/product-extensions-load-order.md`;
- `docs/architecture/README.md`.

### 3. Qualidade e testes

Reescrito:

- `docs/architecture/testing.md`.

O contrato agora inclui readiness, Supabase local, pgTAP, lint SQL, certificação Excel, Playwright, Lighthouse, precedência do frontend, build Vercel, mesmo SHA e gates externos.

### 4. Supabase

Atualizados:

- `docs/architecture/supabase-readiness.md`;
- `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`;
- `docs/reference/SUPABASE_DATA_DICTIONARY.md`;
- `docs/runbooks/SUPABASE_CONNECTION.md`;
- `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`;
- `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md`;
- `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md`;
- `docs/reference/SUPABASE_INTEGRATION_AUDIT.md`.

### 5. Decisões

Atualizados:

- `docs/DECISION_LOG.md` — ADRs 001–033;
- `docs/reference/PRODUCT_DECISIONS.md` — índice histórico substituído;
- `docs/reference/CHANGE_CLASSIFICATION.md` — exemplos atuais.

### 6. Instruções, índices e estado

Atualizados:

- `AGENTS.md`;
- `.env.example`;
- `README.md`;
- `docs/README.md`;
- `docs/CURRENT_STAGE.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/architecture/roadmap-pre-supabase.md`.

### 7. Auditoria

Criado e revisado:

- `docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`.

## Verificação final

1. comparar branch com `main`;
2. confirmar que o diff contém somente documentação Markdown e `.env.example`;
3. conferir links relativos dos documentos tocados;
4. procurar resíduos materiais de estados obsoletos em documentos vigentes;
5. confirmar que ocorrências remanescentes pertencem a histórico classificado ou decisão substituída;
6. revisar coerência entre código Excel e documentação;
7. consultar status combinado do SHA final;
8. verificar workflows associados;
9. abrir PR e revisar o patch final;
10. fazer merge somente após evidência suficiente.

## Fora do escopo

- executar `migration repair` em Production;
- habilitar proteção contra senhas vazadas;
- alterar a major do Node;
- testar backup/restauração;
- executar UAT;
- realizar polimento visual;
- publicar novo deployment;
- escolher unilateralmente a próxima frente funcional.
