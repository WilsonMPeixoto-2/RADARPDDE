# Auditoria — alinhamento documental integral pós-PR #108

**Data de corte:** 29 de julho de 2026  
**Base auditada:** `05f51cbdd433844f11db036bcdefa5f9d8941e45`  
**Branch de correção:** `docs/alinhamento-integral-pos-pr108-20260729`

## 1. Objetivo

Verificar se a documentação vigente representa o código e os ambientes após a conclusão e publicação dos Ciclos 1 a 5, corrigindo divergências capazes de orientar incorretamente uma implementação futura.

A auditoria não altera código, banco, dados, Auth, RLS, dependências, Vercel ou configuração de runtime.

## 2. Fontes verificadas

### GitHub

- `main` em `05f51cbdd433844f11db036bcdefa5f9d8941e45`;
- baseline funcional `598361dd784563f4d70d1e25df3818f4ee066da8`;
- commit funcional publicado `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`;
- PRs #95 a #108;
- `config.js`;
- `package.json`;
- `src/integration/navigation-routes.js`;
- `src/integration/product-extensions-bootstrap.js`;
- `src/integration/navigation-context-bootstrap.js`;
- `src/types/database.types.ts`;
- contratos arquiteturais, runbooks, ADRs e evidências.

### Vercel

Estado previamente reconciliado no PR #108:

```text
deployment: dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY
state: READY
artifactCommitSha: dfc8aa3030b02edb73f764f5f56bd6759a7a1d77
```

### Supabase

Estado previamente reconciliado no PR #108:

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
PostgreSQL: 17
closing_competence: 2026-12
app_config.row_version: 5
```

## 3. Método

1. ler documentos canônicos de entrada;
2. comparar afirmações mutáveis com código e ambientes;
3. localizar linguagem de futuro aplicada a entregas concluídas;
4. comparar inventários narrativos com loaders atuais;
5. comparar scripts de qualidade com `package.json`;
6. comparar referências Supabase com tipos gerados e runbooks;
7. separar documentos vigentes de planos, auditorias e evidências históricas;
8. corrigir somente documentação operacional/canônica;
9. preservar arquivos históricos sem reescrita retrospectiva.

## 4. Divergências encontradas

### 4.1 Competências

**Antes:** `closing_competence = 2026-05` descrita como estado vigente e alteração para dezembro tratada como futura.

**Estado real:** `2026-12`, com doze competências de 2026 disponíveis e `row_version = 5`.

**Correção:** `docs/architecture/competencias.md` atualizado para o estado implementado.

### 4.2 Avaliação mensal

**Antes:** certificação Excel tratada como etapa posterior.

**Estado real:** certificação integral já implementada no Ciclo 4.

**Correção:** contrato atualizado para relação presente com `excel-integral-certification.md`.

### 4.3 Carregamento do frontend

**Antes:** inventário narrativo anterior aos ciclos recentes apresentado como ordem efetiva e cadeia pós-`app.js` limitada à timeline.

**Estado real:** `config.js` inclui painel expressivo; `product-extensions-bootstrap.js` inclui timeline e `navigation-context-bootstrap.js`; este carrega `navigation-context.js` após `RadarNavigationHistory`.

**Correção:** documentos de precedência e extensões reescritos conforme o código atual. O manifesto antigo permanece evidência datada e deve ser regenerado quando o conjunto mudar.

### 4.4 Testes

**Antes:** estratégia inicial restrita a sintaxe e testes básicos.

**Estado real:** readiness inclui lint, unidade, integração, Supabase, tipos, artefatos e certificação Excel; existem Playwright, mobile, Lighthouse, pgTAP e build Vercel.

**Correção:** `docs/architecture/testing.md` reescrito como gate cumulativo.

### 4.5 Persistência Supabase

**Antes:** LocalStorage descrito como backend vigente de Production e Supabase como ativação futura.

**Estado real:** SupabaseRepository canônico em Preview/Production; LocalStorage somente contingência.

**Correção:** arquitetura, cobertura funcional, dicionário e runbook de conexão atualizados.

### 4.6 Excel SME

**Antes:** presença de validação de lista descrita como recurso do arquivo.

**Estado real:** `dataValidations` é deliberadamente ausente porque provocava reparo no Microsoft Excel, e sua ausência é certificada.

**Correção:** contrato SME corrigido.

### 4.7 Relatório institucional

**Antes:** texto de projeto futuro não distinguia implementação, certificação e integração do botão.

**Estado real:** modelo, renderer, quatro abas e certificação estão implementados; botão institucional continua no CSV; homologação manual permanece pendente.

**Correção:** estados separados por camada.

### 4.8 Migrations

**Antes:** runbook não continha procedimento para a divergência de identificador SME.

**Estado real:** SQL local e remoto são idênticos, mas versões do histórico divergem.

**Correção:** runbook incorporou preflight, bloqueio de nova migration, princípio de `migration repair`, dry-run descartável, backup, hashes e critérios de autorização. Reparo não foi executado.

### 4.9 ADR-026

**Antes:** requisito sugeria migration adicional para disponibilizar competências.

**Estado real:** as competências já existiam e a alteração transacional de `closing_competence` foi suficiente.

**Correção:** ADR-026 marcada como implementada; ADR-032 formaliza reutilização do contrato existente; ADR-033 formaliza o bloqueio de migrations enquanto o histórico SME divergir.

### 4.10 Dicionário de dados

**Antes:** descrevia modelo “preparado para futura persistência”, `user_id` futuro e relação escola–programa futura, além de não representar o schema completo.

**Estado real:** schema está ativo em Production e tipos gerados contêm vinte tabelas funcionais/técnicas.

**Correção:** dicionário refeito a partir de `src/types/database.types.ts` e das migrations.

## 5. Documentos corrigidos

- `docs/architecture/competencias.md`;
- `docs/architecture/avaliacao-mensal.md`;
- `docs/architecture/frontend-load-order.md`;
- `docs/architecture/product-extensions-load-order.md`;
- `docs/architecture/testing.md`;
- `docs/architecture/supabase-readiness.md`;
- `docs/architecture/excel-sme-mensal.md`;
- `docs/architecture/excel-export.md`;
- `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`;
- `docs/reference/SUPABASE_DATA_DICTIONARY.md`;
- `docs/runbooks/SUPABASE_CONNECTION.md`;
- `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`;
- `docs/DECISION_LOG.md`;
- documentos canônicos de entrada e matriz de status, após fechamento desta branch.

## 6. Documentos históricos preservados

Não foram reescritos:

- planos em `docs/superpowers/plans/` anteriores a esta auditoria;
- especificações em `docs/superpowers/specs/`;
- auditorias anteriores;
- relatórios datados;
- evidências e manifests gerados;
- handoffs antigos;
- planos substituídos;
- PRs e comentários históricos.

Esses arquivos registram o conhecimento disponível na data da execução e não devem controlar o estado atual quando contradizem `CURRENT_STAGE.md`, ADRs vigentes ou código.

## 7. Decisões que permanecem vinculantes

- Supabase é canônico em Production;
- carteira é responsabilidade principal, não fronteira entre Controladores da mesma CRE;
- Gestão SME permanece somente leitura nas superfícies definidas;
- competência é contexto global único;
- avaliação mensal possui regra canônica única;
- timeline é projeção somente leitura;
- Excel exige paridade integral;
- navegação contextual preserva competência, origem, rolagem e foco;
- polimento visual não altera produto ou identidade;
- release depende de gate cumulativo;
- nova migration está bloqueada até reconciliação do histórico SME.

## 8. Bloqueadores que a documentação não resolve

1. reconciliar o identificador da migration SME;
2. habilitar proteção contra senhas vazadas;
3. fixar deliberadamente a major do Node;
4. testar backup e restauração;
5. homologar os arquivos no Microsoft Excel desktop;
6. executar matriz remota por perfil e viewport;
7. concluir UAT;
8. executar polimento editorial/visual aprovado;
9. registrar decisão formal de release.

## 9. Validação desta branch

A conclusão exige:

- diff somente Markdown;
- links relativos dos arquivos tocados válidos;
- ausência das afirmações materiais obsoletas nos documentos vigentes;
- comparação da branch com `main`;
- consulta do status combinado do SHA final;
- relato explícito se não houver workflow associado.

## 10. Conclusão

A documentação canônica passa a descrever o produto já publicado e os bloqueadores reais, sem misturar:

- entregas concluídas;
- capacidades existentes mas ainda não integradas à interface;
- gates pendentes;
- planos históricos;
- decisões futuras.

Após merge desta correção, a próxima frente pode ser escolhida a partir de `docs/CURRENT_STAGE.md`, sem depender de reconstrução por memória de chat.
