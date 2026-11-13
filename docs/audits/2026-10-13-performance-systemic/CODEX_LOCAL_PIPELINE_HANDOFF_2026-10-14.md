# Checkpoint — reprodução local de escrita completa pelo Codex

**Data:** 14/10/2026, Brasília.  
**Origem:** transcrição fornecida pelo usuário da sessão Codex interrompida por limite de cota.  
**Natureza da prova:** execução **local narrada por Codex**, ainda não reproduzida no CI remoto. **Não afirmar homologação** do novo teste em GitHub. A transcrição não traz o conteúdo integral do arquivo criado.  
**Baseline consultada pelo Codex:** `main@1a1cda117e31f84647bf4591e4d6db899ef231f1`. PRs investigativos [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446) e [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) ainda Draft no início desta conferência.

## 1. O que o Codex executou, segundo a transcrição

- Preparou dois worktrees separados, derivados das branches do #446 e #447.
- Consultou `AGENTS.md`, modelo canônico do produto, metodologia de engenharia, catálogo de superfícies, testes, `StatePort`, `UnitOfWork`, `DataService` e bridges.
- Recuperou e comparou artifacts do workflow operacional: `11866716117` (baseline), `11866427131` (candidate) e `11866527044` (comparador), verificando SHA256 dos ZIPs baixados. Resultados mostraram muita variação entre runs; não há ganho global estável certificado.
- Criou **localmente** `tests/unit/systemic-write-pipeline-characterization.test.js`, com 179 linhas, cobrindo mais camadas que o teste anterior (captura, exportação, comando, aplicação, rollback).
- Primeira execução falhou em `MODULE_NOT_FOUND: ajv`, porque o novo worktree não possuía dependências instaladas. O Codex vinculou `node_modules` de outro worktree com **hash idêntico de `package-lock.json`**, repetiu o teste e obteve **1 caso aprovado, 0 falhas**, ~2,1 s de duração do processo. Isso comprova uma execução local sob aquela instalação, não a equivalência de um `npm ci` limpo.
- Conferiu o JSON local `test-results/performance-diagnostics/write-pipeline-characterization.json`. **A transcrição recebida não contém o arquivo de teste nem esse JSON completos**, e esses caminhos internos ao worktree do Codex não estão acessíveis aqui.

## 2. Resultados quantitativos locais relatados

Cinco medições de cada volume, sempre com **uma escola/avaliação modificada**. Medianas em Node.js com dados sintéticos, sem chamada real ao banco ou jornada visual:

| Avaliações em memória | Amostras de duração da operação (ms) | Mediana (ms) | Captura (mediana) | Exportação (mediana) | Aplicação (mediana) |
|---:|---|---:|---:|---:|---:|
| 1 | 1,064; 1,462; 0,790; 0,661; 0,536 | **0,790** | 0,047 | 0,314 | 0,084 |
| 163 | 14,215; 12,509; 11,810; 10,331; 9,314 | **11,810** | 0,558 | 4,410 | 2,522 |
| 1.630 | 264,344; 129,590; 107,891; 199,812; 230,114 | **199,812** | 6,374 | 69,893 | 36,434 |

A contagem de operações de clonagem observada por fase inclui chamadas aninhadas e não deve ser somada como se fossem linhas únicas. Para 1.630 registros, o Codex informou `recordOccurrences` de 3.260 na captura, 8.157 no comando, 16.300 na exportação e 11.410 na aplicação. **Essa instrumentação é diferente do teste isolado anterior** que contou seis cópias; não se deve comparar contagens sem alinhar exatamente a unidade de observação.

O Codex também relatou teste de rollback com `singleRecordWrite=true`, `unrelatedSchoolsPreserved=true` e `rollbackVerified=true` (aprox. 6,81 ms na amostra). Essa é evidência narrada, **não houve inspeção independente do código de 179 linhas**.

## 3. Contraprova do tamanho de Production (consulta SQL somente leitura)

Na Production, a tabela `verifications` soma **1.321 registros em todas as competências**, com 292 em agosto/2026, 181 em setembro e um em outubro (instantâneo de 14/10/2026). Esses valores **não demonstram quantos objetos estão carregados simultaneamente na memória** de um navegador; o bootstrap tende a operar por competência, e o conjunto precisa ser medido com instrumentação representativa.

Portanto, o cenário sintético de 1.630 linhas aproxima o total de todos os meses, não uma competência típica; **16.300 linhas são um ensaio de crescimento, não retrato da Production**. Os resultados mostram mecanismo escalável de amplificação, mas não atribuem a ele, sozinho, lentidão multissegundo observada na GAD.

## 4. Status remoto e orientação para continuidade

Verificação independente do GitHub: no momento da leitura, a branch do [PR #447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) estava em `0496913ef70cea4174b45409a203a81373a18ef9`; o novo arquivo `systemic-write-pipeline-characterization.test.js` **não existia nessa branch**. A `main` permanecia em `1a1cda117e31f84647bf4591e4d6db899ef231f1`.

**Prova prioritária:** reproduzir a cadeia integrada em um teste versionado no PR #447, com `DataService`, `UnitOfWork`, `StatePort` e ponte canônica reais sempre que possível. Usar apenas mocks das fronteiras banco/tempo e exercitar `commit`, aplicação local, dados de outras escolas e rollback. Verificar via `npm ci` e CI. Não tratar os números locais como medição autenticada da versão da Production.

**Direção arquitetural a avaliar depois da reprodução:** granularidade de atualização/cópia sem perder confirmação de commit remoto, rollback correto (inclusive erro antes/depois do commit), isolamento de outras escolas, logs, idempotência de NF/Pendência, guarda de patrimônio terminal e consistência entre sessões. Comparar costo da cópia com rede/DOM na mesma jornada.

**Proibição:** não implantar um cache por escola nem retirar `structuredClone`, `StatePort` ou proteção de sincronização como hotfix. Essa prova identifica trabalho estrutural, mas a solução ainda exige testes de equivalência e custo.
