# RADAR PDDE 2026 | Matriz de aproveitamento das dependências modernizadas

**Estado:** auditoria A0 de configuração, com **piloto A1 executado posteriormente em branch isolada**; não é autorização de integração funcional. [Evidência experimental A1](../evidence/2026-10-22-ts7-knip-capability-a1/README.md).  
**Data:** 22/10/2026 (BRT).  
**Código-base examinado:** main em 7141489e084691722a1bef814bea0c9c1c5f8023, após PRs #472/#473.  
**Estudo complementar:** docs/audits/2026-10-22-technology-opportunities.md, commit 46cfe3927e203e1f6ca6b50eff3c8ed57e8e8484.  
**Meta:** verificar se recursos introduzidos ou melhorados nas versões já instaladas estão efetivamente sendo aproveitados. Não criar funcionalidades apenas para utilizar pacotes novos.

## 1. Resumo executivo e interpretação

A modernização das versões foi concluída e aprovada, mas atualização de dependências não implica adoção automática das novas capacidades. As lacunas *comprovadas na configuração* concentram-se em:
1. TypeScript 7: tsconfig.database-types.json inclui somente src/types/database.types.ts; não realiza checagem gradual dos serviços JS críticos.
2. Knip 6.42.1: comando npm analyze:unused especifica apenas dependencies,devDependencies,unlisted,unresolved. Não inventariamos arquivos/exports internos inutilizados com esse comando.
3. Axe 4.14: teste central usa tags WCAG 2.0/2.1 e filtro de impacto serious/critical; não inclui explicitamente WCAG 2.2 nem cobre todas as telas/estados operacionais. Já há verificações especializadas de foco, Dashboard e Prontuário.
4. Lighthouse 13.5: runner lighthouserc.cjs examina a rota inicial em três execuções, separando desktop/mobile. Não há auditoria Lighthouse de fluxos de abrir/recarregar Prontuário e salvar NF; capacidade de user flows antecede a 13.5, cuja correção permite abortar navegações pendentes.
5. CI: .github/workflows/preproduction-full-validation.yml dispara em qualquer pull_request para main, inclusive docs-only; outros workflows já possuem paths. Isso produziu suites de navegador e Supabase para o PR #473, que só alterou Markdown. Alterar requer inventariar branch protections/status checks antes de configurar filtros; não suprimir gates requeridos.
6. Supabase: pg_stat_statements, hypopg e index_advisor já instaladas no projeto hospedado; é possível experimentar diagnóstico/índices hipotéticos *sem instalar extensões*. O aviso do advisor sobre senhas vazadas foi **classificado como conhecido, indisponível no plano contratado e fora de escopo**; não encaminhar nova recomendação de habilitação nem investigação de elegibilidade.

Não foi medida regressão de UX nem melhoria por qualquer ajuste proposto. Nenhuma alteração de produto, testes, CSS, workflows, GitHub Settings, SQL, índices, Auth ou Production foi executada nesta auditoria.

## 2. Matriz: versões, adoção e oportunidades

Legenda: **JA** = capacidade já aproveitada; **LC** = lacuna de configuração comprovada; **EXP** = experimento condicionado a evidência; **N/A** = atualização corretiva ou recurso irrelevante para este workload.

| Tecnologia instalada/servidor | Estado comprovado no RADAR | Mudança/capacidade de interesse | Diagnóstico | Próxima ação proporcional |
|---|---|---|---|---|
| Playwright 1.64.1 | screenshots/traces DOM, ARIA e screen já configurados, retries CI=1, workers CI=1, E2E desktop e mobile | locks (desde 1.63), vídeo com FPS ajustável (1.64) e diagnóstico melhorado | **JA + EXP** | locks não trazem ganho de CI com worker único e não coordenam workflows separados; somente se houver conflito de recurso compartilhado demonstrado. Vídeo FPS maior somente em reproduções curtas de flicker. |
| @axe-core/playwright 4.14.0 / axe-core 4.14 | AxeBuilder usado nos E2E; scan da home com tags até WCAG 2.1 e filtro serious/critical | nova regra padrão label-content-name-mismatch; ganho de performance na ferramenta; WCAG 2.2 existente | **JA + LC** | inventariar regras efetivamente executadas e ampliar *diagnóstico* para estados Prontuário/Pendências e WCAG 2.2, sem elevar gate sem triagem. |
| ESLint 10.13.0 | eslint.config.js já incorpora regras estruturais recomendadas, incluindo no-obj-calls e no-unsafe-optional-chaining; limite 42 warnings em lint:security | detecção mais precisa em duas regras no 10.13 | **JA + EXP** | classificar 42 avisos do produto e 231 nos testes conforme evidência de atualização; nova versão não requer ativação dessas regras. Ajustar severidade somente por risco. |
| Knip 6.42.1 | analyze:unused restringe a quatro tipos de problema de dependências | melhor resolução de scripts/ações; análise de files/exports/types e modo --production já disponíveis | **LC** | executar piloto diagnóstico não bloqueante com --include files,exports,types; mapear loaders browser globais antes de classificar falso positivo. Não remover arquivos automaticamente. |
| TypeScript 7.0.2 | compiler novo instalado e typecheck limitado a types gerados; JS do produto não é checado | compilador nativo Go, checagem tipada de JS via JSDoc/allowJs/checkJs (capacidade pré-existente, mais acessível pela velocidade) | **LC** | PoC em um módulo ou contrato puro, com tsconfig isolado e baseline de diagnósticos; não fazer migração ampla. Não usar API JS legada de TypeScript com novo compilador. |
| MSW 3.0.3 | teste de rede remoto adaptado para onUnhandledFrame='error', interceptações 500, timeout, conflito e retorno incompleto | harness e semântica de interceptação atualizados | **JA + EXP** | só estender a casos com falha material não representada: resposta perdida após commit, resposta antiga após write e logout/abort. Não duplicar pgTAP/Supabase real. |
| @supabase/supabase-js 2.118.0 | bundle navegador e import Edge Function versionados; retry GET controlado sem retry de escrita POST | typegen de campos computados e RPCs sem argumentos; content-encoding em uploads | **JA + EXP** | tipos gerados já alinhados no #472; aproveitar assinaturas em fronteira JSDoc selecionada. Não criar Storage/upload sem caso de uso. |
| Supabase CLI 2.121.0 | contrato local de grants explícito e 674/674 pgTAP; #472 integrado e 19/19 candidato, 8/8 pós-merge | melhorias de stack/tooling; notebooks de plataforma são recurso separado | **JA** | não reabrir investigação 2x2 nem alterar permissões; usar Notebooks read-only para diagnóstico reproduzível se útil. |
| PostgREST 14.18 (versão informada na investigação) | camada REST operante sob Supabase; versão do binário hospedado não foi conferida separadamente por este conector | correções de JWT emitido no futuro e timestamp de log após longa inatividade | **N/A** | não há configuração nova necessária para essas correções; explorar logs apenas se houver erro de JWT/latência demonstrado. |
| PostgreSQL 17.11 (hospedado, confirmado) | ACTIVE_HEALTHY e 17.11.0.003; 11 extensões ativas, incluindo pg_stat_statements, hypopg e index_advisor | correções de segurança e integridade da release 17.11, sem nova API de UI | **JA + EXP** | usar stats já disponíveis, nunca inventar índice com base em alerta isolado. Nenhuma migration nesta fase. |
| Lighthouse 13.5.0 | 3 runs por perfil, url inicial; budgets mobile e desktop configurados | correção para user flows com navegação pendente; auditoria ARD para agentes | **JA + LC** | piloto user flow no cenário operacional autenticado descartável; ARD não tem utilidade comprovada para sistema humano privado. |
| Fuse.js 7.5.0 | token search combinatório e correção de ranking já ativos; global-search.js chama rebuildEngine() a cada entrada válida | correções de ranking/normalização; FuseWorker opcional | **JA + EXP** | medir criação de catálogo/índice por tecla; tentar reutilização segura antes de Worker. Verificar compatibilidade do token search com Worker. |
| Floating UI 1.8.0 | offset, flip, shift, size e autoUpdate ativos nos menus globais | melhor posicionamento adaptativo, recursos já presentes | **JA + EXP** | somente aplicar a superfícies com corte/foco reproduzido; não reinstalar ou redesenhar todos os drawers. |
| fast-check 4.10.2 | test:properties existente em invariantes de avaliação | provas generativas e shrinking | **JA + EXP** | acrescentar propriedade de domínio somente quando lacuna demonstrada, com seed e contraexemplo reproduzíveis. |
| Ajv 8.20.0 | bundle e verificações JSON já existentes | schemas runtime | **JA + EXP** | alinhar validação de uma fronteira alterada sem duplicar contratos do domínio. |
| dependency-cruiser 18.7.0 | check:architecture verifica módulos e dependências | detecção de ciclos/fronteiras | **JA** | usar grafo para selecionar PoC de tipagem/estado; não redesenhar arquitetura para satisfação de um grafo. |
| Stylelint 17.16.0 | lint:css integra estilos globais e src/styles | confiabilidade de CSS | **JA** | continuar usando na alteração visual; sem novo toggle de impacto comprovado. |
| esbuild 0.28.2 / Prettier 3.9.10 | bundlers e verificações de artefatos reprodutíveis; contrato semântico de typegen adotado | builds rápidos e formatação previsível | **JA** | preservar geração canônica e comparação estrutural; não ressuscitar testes de igualdade cosmética. |

## 3. Verificações adicionais de Production — somente leitura

Conector Supabase, projeto scnryinorqeucbfkioxo:
- Status ACTIVE_HEALTHY; PostgreSQL 17.11.0.003.
- Extensões instaladas incluem pg_stat_statements 1.11, hypopg 1.4.1, index_advisor 0.2.0, pg_jsonschema 0.3.3, pgtap 1.3.3, plpgsql_check 2.8, pgcrypto e outras; nenhuma ativação adicional proposta agora.
- Advisor Segurança: **1 WARN, auth_leaked_password_protection**. **Decisão confirmada pelo responsável:** o RADAR utiliza plano sem acesso a esse recurso premium, questão já investigada repetidamente. **Estado: exceção documentada / sem ação / não reabrir ou recomendar upgrade de plano por este alerta.** Não interpretar esse aviso como vulnerabilidade específica ou senha efetivamente comprometida. Rever somente se o plano/funcionalidade mudar por decisão expressa do responsável. Esta exceção não se estende a outros avisos de segurança.
- Advisor Desempenho: **1 categoria INFO unused_index com 19 findings**. A consulta agregada a pg_stat_user_indexes indicou 78 índices no esquema public, 40 com idx_scan=0 e 120.268 scans cumulativos totais; o número de advisory findings não é igual à quantidade de índices com contador zero porque há critérios de exclusão. stats_reset veio NULL; sem janela confiável ou uso humano representativo, nenhum DROP INDEX é recomendado.
- pg_stat_statements já responde a consulta agregada: 4.914 fingerprints observados, 10.434 calls, 67.361,1 ms agregados de execução no horizonte estatístico, cujo início não foi determinado aqui. Esses números **não são benchmark de experiência do usuário** nem localizam um gargalo concreto.

Não consultar texto SQL, credenciais ou registros pessoais para compor evidência pública. Diagnóstico futuro deve usar agregados e intervalos controlados; considerar tráfego de CI distinto de usuários reais.

## 4. Intervenções candidatas, em ordem de custo/benefício

### A. Tipagem JavaScript gradual em uma única fronteira (prioridade alta, P0)

- Tipo: configuração de desenvolvimento; não altera runtime.
- Alterar somente config isolada de tsconfig para um módulo pequeno ou JSDoc pontual, usando allowJs/checkJs/noEmit. Conferir tipos/exports dos RPCs realmente consumidos antes de expandir.
- Definir baseline de diagnósticos antes; não silenciar centenas de erros com skip/any ou liberação de opções globais.
- Critérios: detectar ao menos um erro de contrato em mutação negativa, manter build/bundle e os testes da fronteira; sem JS output.
- Limite: TypeScript 7 acelerar compilação não comprova ganho de tempo de trabalho no caso concreto; medir.

### B. Knip ampliado em modo diagnóstico, não bloqueante (prioridade alta, P0)

- Tipo: ferramenta de desenvolvimento.
- Usar --include files,exports,types e relatório reproduzível primeiro, sem alterar o script atual; se optar por --production, configurar entradas produtivas com sufixos e considerar módulos IIFE carregados dinamicamente pelo browser.
- Cada achado deve ter prova de ausência de consumo por HTML/bootstrap/import dinâmico; evitar falso positivo/remoção.
- Critérios: classificação dos achados com localização e justificativa; só depois propor remoção de código efetivamente morto.

### C. Axe: ampliar a cobertura de acessibilidade e estados (prioridade alta, P0)

- Tipo: testes.
- Primeira execução informativa com critérios WCAG 2.2 e estados Prontuário/NF/Pendência/erro/salvando, zoom 200%, teclado, foco e nome acessível; preservar os scans já existentes.
- Não mudar critério de CI de serious/critical antes da triagem das violações e suas causas.
- Critérios: achados atribuídos a componente real; reteste de foco/label da mesma jornada; validação visual humana.

### D. CI proporcional ao impacto do PR (prioridade alta, P0 por custo)

- Fato: preproduction-full-validation.yml contém pull_request: branches: main SEM paths; PR #473 mudou apenas oito Markdown e mesmo assim disparou homologação integral, navegador e Supabase. Outras workflows já usam filtros paths.
- Antes de editar: verificar proteção da branch e checks requeridos, especialmente risco de check ausente bloquear merge quando filtro pula workflow.
- Desenho candidato: classificador de diff + resultado obrigatório estável, com jobs pesados condicionados a arquivos funcionais; docs-only valida Markdown, links e governança. Manter execução manual/release integral quando importante.
- Critérios: PR docs-only não roda suites de autenticação/banco, PR RLS continua rodando suites RLS, PR product JS preserva desktop/CI aplicáveis, required checks continuam satisfeitos. Provar os três tipos de PR antes de merge.

### E. Performance operacional e index da busca (P1, somente após baseline)

- Abertura/reload do Prontuário e NF com observador de outra sessão; segregar rede/SQL/CPU/DOM/pós-commit até UI interativa.
- Usar instrumentação existente em tests/support/performance-journey-observer.js e operational-session-observer.js.
- Se o índice da pesquisa for custo perceptível, tentar reutilização com invalidação canônica antes de FuseWorker.
- Não multiplicar etapas de CI com cada experimento. Uma hipótese, uma baseline, uma contraprova e um critério de parada.

### F. Diagnóstico SQL e índices (P1, somente leitura)

- Avaliar índices hipotéticos via hypopg/index_advisor e estatísticas de workload representativo. Não remover índices pela contagem de 19 advisory INFO.
- O aviso de proteção contra senhas vazadas **não é tarefa desta frente**: recurso indisponível no plano existente e decisão já esclarecida pelo responsável.
- Nenhuma mudança na persistência, autenticação ou segurança de Production foi autorizada por esta auditoria de capacidades.

## 5. O que NÃO promover a tarefa

- Locks do Playwright como solução universal: a CI Playwright usa workers=1, e locks não atravessam runners/workflows do GitHub.
- Vídeos com FPS maior para todas as suítes: aumentam custo e perturbam medidas de CPU.
- Migração total JavaScript→TypeScript; adoção de framework; nova arquitetura de dados.
- Workers, pgvector, filas ou materialized views por mera disponibilidade.
- Ativar WebMCP, ARD, passkeys, uploads comprimidos ou API de agente sem caso institucional comprovado.
- Remover índices INFO ou relaxar RLS/grants em razão da modernização das ferramentas.
- Reabrir as provas da CLI 2.121 já encerradas nos PRs #472/#473.
- Confundir release corretiva do PostgREST 14.18/PostgreSQL 17.11 com nova funcionalidade habilitável.

## 6. Plano de validação e registros para agentes

- Para cada piloto, registrar: problema verificável, comportamento vigente, recurso novo, configuração proposta, resultado baseline, contraprova negativa, efeito de usuário e limitação.
- Alteração só é concluída com um gate proporcional e comparação real. Não criar teste canônico independente se já existir prova reutilizável.
- Toda falha classificada por origem: produto, teste obsoleto, fixture, ambiente, flaky ou inconclusiva, conforme docs/reference/TEST_GOVERNANCE.md.
- Se houver alteração da CI, confirmar rulesets/branch protection antes; ausência de permissão para ler rulesets é dependência, não sinal de que não há requisitos.
- Se houver mudança em Auth/DB/Production, abrir frente independente, executar consultas de leitura, obter aprovação específica da alteração e comprovar estado depois.
- Esta etapa A0 não modifica a aplicação, as dependências, o banco nem a Vercel. A recomendação inicial é preparar pilotos A/B/C e desenho D, sem merge de configurações nesta etapa.

## 7. Evidências e fontes primárias

**Código RADAR (SHA 7141489e):**
- package.json, playwright.config.js, playwright.visual.config.js;
- tsconfig.database-types.json e src/types/database.types.ts;
- eslint.config.js, knip.config.cjs;
- tests/e2e/accessibility-scans.spec.js, tests/e2e/school-details-desktop.spec.js;
- tests/unit/msw-remote-failures.test.js;
- lighthouserc.cjs, scripts/run-lighthouse-baseline.mjs;
- src/integration/global-search.js e src/domain/global-search-index.js;
- src/application/state-port.js, src/data/supabase-repository.js;
- .github/workflows/preproduction-full-validation.yml, supabase-readiness.yml e visual-regression.yml;
- docs/reference/TEST_GOVERNANCE.md e docs/reference/PRODUCT_SURFACE_CATALOG.md.

**Oficiais:**
- Playwright: https://playwright.dev/docs/release-notes
- Axe 4.14: https://github.com/dequelabs/axe-core/releases/tag/v4.14.0
- ESLint 10.13: https://github.com/eslint/eslint/releases/tag/v10.13.0
- Knip CLI: https://knip.dev/reference/cli e modo Production: https://knip.dev/features/production-mode
- TypeScript 7: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- Supabase JS 2.118: https://github.com/supabase/supabase-js/releases/tag/v2.118.0
- PostgreSQL 17.11: https://www.postgresql.org/docs/17/release-17-11.html
- PostgREST 14.18: https://github.com/PostgREST/postgrest/releases/tag/v14.18
- Lighthouse 13.5: https://github.com/GoogleChrome/lighthouse/releases/tag/v13.5.0
- Documentação de elegibilidade do alerta já encerrado (não constitui pendência): https://supabase.com/docs/guides/auth/password-security

**Limites:** fontes públicas e inspeções estáticas, mais consultas agregadas apenas de leitura aos metadados/estatísticas hospedados. Não foram executados benchmarks novos, scans WCAG 2.2 novos, comparações de Knip ampliadas, piloto de JSDoc ou auditoria autenticada da interface. Essas são fases seguintes, não resultados já comprovados.

## 8. Pós-escrito A1 — resultados dos pilotos

Após a leitura A0, o [piloto A1](../evidence/2026-10-22-ts7-knip-capability-a1/README.md) executou **TypeScript 7.0.2 e Knip 6.42.1** em GitHub Actions isolado. TypeScript aprovou a baseline do módulo de chaves e reprovou uma violação de tipo intencional (TS2322), após atualizar a opção `moduleResolution=Node` removida pela versão 7. Knip listou 34 arquivos, mas **34/34 possuem referências explícitas nos carregadores dinâmicos**, de modo que nenhum pode ser excluído com base na análise estática. Não confundir esse resultado com remoção de código morto ou ganho de desempenho comprovado. Nenhuma alteração do runtime/Production foi realizada.
