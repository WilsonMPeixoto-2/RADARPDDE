# Plano de implementação — alinhamento documental integral pós-PR #108

> **Status:** em execução  
> **Data-base:** 29/07/2026  
> **Branch:** `docs/alinhamento-integral-pos-pr108-20260729`  
> **Base:** `05f51cbdd433844f11db036bcdefa5f9d8941e45`

## Objetivo

Eliminar divergências remanescentes entre a documentação vigente e o estado comprovado do código, da Vercel Production e do Supabase Production antes da abertura de uma nova frente do produto.

A alteração é exclusivamente documental. Não modifica runtime, frontend, serviços, migrations, RLS, dados, Auth, dependências ou configuração de deployment.

## Fontes de verdade

1. código remoto da `main`;
2. migrations, políticas, funções e histórico efetivo do Supabase autorizado;
3. artefato vigente na Vercel Production;
4. testes, manifests e evidências reproduzíveis;
5. ADRs e decisões funcionais ainda vigentes;
6. documentação, ajustada às fontes anteriores.

## Achados que exigem correção

1. contrato de competências ainda descreve `closing_competence = 2026-05` como estado futuro;
2. contrato de avaliação mensal trata a certificação Excel já implementada como etapa posterior;
3. documentação da cadeia pós-`app.js` omite a navegação contextual;
4. inventário narrativo de carregamento do frontend não representa as extensões atuais;
5. estratégia de testes ainda descreve a suíte inicial, anterior ao readiness, Supabase, Playwright, Lighthouse e certificação Excel;
6. arquitetura e cobertura Supabase ainda apresentam Production como local e a ativação remota como futura;
7. contrato do Excel SME ainda menciona `dataValidations`, embora a ausência desse elemento seja requisito certificado;
8. contrato do Excel institucional não separa claramente produto implementado, certificação concluída e troca do botão ainda pendente;
9. runbook de conexão repete contagens operacionais antigas e contém regra de hardening incompatível com o estado já implantado;
10. runbook de migrations não incorpora o gate obrigatório da divergência de identificador da migration SME;
11. ADR-026 preserva uma hipótese de implementação por migration adicional que não foi necessária;
12. índices e matriz documental precisam refletir os documentos corrigidos e a nova auditoria.

## Tarefas

### 1. Reconciliação dos contratos de produto

Atualizar:

- `docs/architecture/competencias.md`;
- `docs/architecture/avaliacao-mensal.md`;
- `docs/architecture/excel-sme-mensal.md`;
- `docs/architecture/excel-export.md`.

Critério: presente, passado concluído e pendências futuras devem aparecer em seções distintas, sem promessas já cumpridas nem capacidades inexistentes.

### 2. Reconciliação da arquitetura de carregamento

Atualizar:

- `docs/architecture/frontend-load-order.md`;
- `docs/architecture/product-extensions-load-order.md`.

Critério: representar `config.js`, `navigation-routes.js`, `product-extensions-bootstrap.js`, timeline e navegação contextual conforme o código atual, preservando manifests antigos como evidência datada.

### 3. Reconciliação de qualidade e testes

Reescrever `docs/architecture/testing.md` com:

- `test:readiness`;
- Supabase local, pgTAP e lint SQL;
- certificação Excel;
- Playwright desktop e mobile;
- Lighthouse;
- build Vercel;
- validação no mesmo SHA;
- requisitos de evidência e documentação.

### 4. Reconciliação Supabase

Atualizar:

- `docs/architecture/supabase-readiness.md`;
- `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`;
- `docs/runbooks/SUPABASE_CONNECTION.md`;
- `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`.

Critério: Production deve ser descrita com `SupabaseRepository` canônico, LocalStorage somente como contingência, 25 arquivos locais de migration, divergência de identificador SME explicitada e nenhuma alteração futura de schema autorizada antes da reconciliação.

### 5. Decisões arquiteturais

Atualizar `docs/DECISION_LOG.md` para:

- registrar o cumprimento da ADR-026 sem migration adicional;
- formalizar a reutilização do contrato existente de competências;
- formalizar o gate de reconciliação do histórico da migration SME.

### 6. Índices e estado operacional

Atualizar:

- `README.md`;
- `docs/README.md`;
- `docs/CURRENT_STAGE.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`.

Critério: uma única lista de bloqueadores, classificação coerente dos documentos e referência à auditoria final.

### 7. Auditoria final

Criar `docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md` contendo:

- fontes verificadas;
- divergências corrigidas;
- documentos históricos preservados;
- escopo do diff;
- limitações de validação;
- estado autorizado para o próximo passo.

## Verificação

1. comparar a branch com `main`;
2. confirmar que todos os arquivos alterados são Markdown;
3. conferir links relativos dos documentos tocados;
4. buscar resíduos das expressões materiais obsoletas;
5. revisar cada documento para contradição entre estado atual, histórico e pendência;
6. consultar status combinado do SHA final;
7. registrar explicitamente quando não houver workflow associado ao SHA documental.

## Fora do escopo

- executar `migration repair` em Production;
- habilitar proteção contra senhas vazadas;
- alterar a major do Node;
- testar backup/restauração;
- executar UAT;
- realizar polimento visual;
- publicar novo deployment;
- escolher unilateralmente a próxima frente funcional.
