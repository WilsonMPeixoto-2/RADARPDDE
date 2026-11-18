# Auditoria de continuidade — branches, código, documentação T0–T6

**Data da conferência:** 16/11/2026 (horário de Brasília). **Natureza:** evidência de leitura do GitHub e reconciliação documental; não constitui homologação técnica ou autorização de release.
**Repositório:** [RADARPDDE](https://github.com/WilsonMPeixoto-2/RADARPDDE). **Branch de execução única:** `fix/prontuario-integrado-validado-20261115`. **HEAD do código antes do saneamento documental:** `a8e4704516db4abbb59b24b623acd52f3de38cae`. SHAs finais de documentação devem ser revalidados no remoto em cada sessão.
**Main/Produção por esta frente:** `main@4011a2b8e2ce39e048d5ecb68026c9f041b74cb0` permaneceu sem merge relacionado a T0–T6.

## 1. Escopo e método

Conferidos: lista remota de branches do repositório, histórico mais recente da `main`, PRs abertos e respectivas origens, commits das branches relevantes (Argon, Antigravity, Gemini, Manus, Preview de Pendências, hotfix de autenticação), diff da frente de parágrafos de Pendências; documentos do roteamento `AGENTS.md`, `docs/CURRENT_STAGE.md`, `docs/reference/STATUS_DOCUMENTOS.md`, contrato aprovado, plano, matriz e handoff; presenças dos RPCs em migration e tipos, plano/contagem estática pgTAP e flag do piloto.

Este levantamento **não** indica leitura exaustiva de todas as centenas de branches legadas. A varredura de listagem dos ramos e PRs destacou as fontes relacionadas ao desenvolvimento em curso. Ramos antigos são evidências históricas, não filas automáticas.

## 2. Referências externas verificadas

| Fonte | Último commit conferido | Destino nesta frente |
|---|---|---|
| Integração oficial | `a8e47045` antes desta atualização | Única branch de execução; commits subsequentes apenas de documentação nesta auditoria |
| Antigravity | `1cb118fd` | Seis correções já aproveitadas seletivamente. Sem novo código remoto para importar |
| Gemini | `16aca6c1` | Parecer histórico, sem novo commit |
| Manus — auditoria | `a87e9e0e` | Parecer histórico, não ponto de retomada |
| Argon original | `182b7949` | Origem histórica; não reimplantar pela versão antiga |
| PR #515 — `fix/preview-pendencias-column-spacing-20261111` | `08bddb19` | Frente de layout separada; não misturar CSS sem ensaio visual |
| PR #522 — `fix/pendencias-paragrafos-legiveis-20261116` | `37de3033` | Draft; altera `src/styles/task-9-pendencias.css` e `tests/unit/pendency-surface-polish.test.js`; comparar ao homologar as gavetas T2/T3 |
| PR #523 — `hotfix/production-auth-timeout-recovery-20261116` | `ed2054a3` | Draft de incidente de autenticação; não compõe T0–T6 automaticamente |
| `main` | `4011a2b8` | Nenhuma mudança de T0–T6 integrada |

PRs Dependabot atualizam candidatos de ferramentas, não implementam novas operações de correção/exclusão. **Não executar cherry-pick nem merge integral** de qualquer branch de auditoria, hotfix ou Preview sem comparação por arquivo e teste de regressão.

## 3. Problemas documentais encontrados e correções

| Arquivo canônico | Problema concreto anterior | Tratamento executado |
|---|---|---|
| `docs/CURRENT_STAGE.md` | Três descrições correntes sobrepostas, uma afirmando que exclusão de NF ainda não tinha sido conectada; HEADs antigos misturados ao estado vigente | Uma seção de continuidade atual com tabela T0–T6, separando todo o restante como histórico |
| `docs/handoff/2026-11-15-prontuario-integracao-verificada.md` | Marcos anteriores afirmavam somente piloto, 61/73 pgTAP e Antigravity em SHA antigo | Nova seção `Estado vigente — reconciliação de 16/11/2026`; referências antigas permanecem como retrospectiva expressamente subordinada |
| `docs/reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md` | Declarações superadas sobre tipos RPC, UI não conectada e riscos R1–R3/R5 sem mencionar as correções já integradas | Corrigido inventário de camadas, riscos mitigados versus prova ainda pendente, data e fonte Antigravity |
| `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md` | Indicava plano apenas proposto e nenhuma implementação iniciada | Quadro de execução por fase; checkboxes mantidos como requisitos e critérios de aceite, não simulam tarefas homologadas |
| `AGENTS.md` | Roteador temporário apontava snapshot antigo; testes de diálogo relatados por outros agentes podiam ser confundidos com SQL autenticado | Redirecionado ao estado vigente e exigência de validação local real; fronteiras entre PRs destacadas |
| `docs/reference/STATUS_DOCUMENTOS.md` | Data de atualização antiga e seção declarando inexistir handoff corrente em 22/10 | Cabeçalho atual 16/11, handoff único, precedência de fontes e qualificação explícita do trecho histórico |

**Resultado esperado:** nova sessão deve seguir `AGENTS.md` → `docs/CURRENT_STAGE.md` → contrato/plano/matriz → seção vigente do único handoff, consultar SHAs reais e não repetir as seis correções já integradas.

## 4. Verificação objetiva do código de integração

- Migration candidata presente: `supabase/migrations/20261114000100_operational_correction_contract.sql`, com `preview_operational_change` e `apply_operational_change`.
- Tipos de dados: `src/types/database.types.ts` já declara **ambas as RPCs**; regeneração conferida contra o banco local ainda pendente.
- Arquivo `supabase/tests/database/operational-correction.test.sql`: `select plan(74)` e contagem estática de **74** asserções `ok/is/throws_*/lives_ok`. **Contagem de código não é execução pgTAP**.
- Configuração de candidata possui `operationalCorrectionPilot`; flag desligada por padrão; frontend e banco local precisam estar em localhost para ativação.
- A UI de correção, limpeza, exclusão de NF/Pendência, acompanhamento da Assessoria, prévia, confirmação e orientação contextual está versionada; rotas legadas ainda coexistem sob controle de escopo, não foram todas substituídas/homologadas.

### Limitações dos testes

- A busca de Actions por nome da branch oficial retornou **zero execuções** no momento da auditoria. Não atribuir eventual CI verde de outro SHA/branch à integração `a8e47045` ou aos commits exclusivamente documentais.
- Antigravity reportou execução de readiness e Playwright com RPC controlada; na integração houve validação isolada de DOM/cliente com mocks. **Faltam** 74 pgTAP reais, suite Auth/RLS, duas sessões, concorrência entre chaves distintas, refresh após commit, testes de origem provisória Qualidade, integração de escritores antigos, relatório visual final de navegador local e aceite humano.
- Assim, **T2/T3 estão implementadas como candidatas de fluxo, NÃO homologadas, NÃO publicadas**. T4/T5 não estão concluídas.

## 5. Continuidade sem retrabalho

1. No computador local, baixar a branch de integração em diretório isolado; validar Node e Docker; `npm ci`, `npm run supabase:start`, `npm run supabase:reset`, `npm run supabase:test:db`.
2. Reproduzir no banco descartável os fluxos T2/T3 com dados fictícios, Auth/RLS real e limites de concorrência. **Regressão encontrada deve ter teste RED, correção e teste GREEN**; guardar evidência no SHA testado.
3. Navegar no frontend do mesmo commit; confirmar nomes, botões, prévias, estados, foco e retorno à fila. Comparar screenshots claros/escuros e viewports definidos no plano.
4. Concluir eventuais cortes e projeções ainda não demonstrados, compatibilizar testes antigos e consumidores, registrar aprovação por etapa.
5. Iniciar T4 e T5 somente depois do gate T2/T3; liberar T6 apenas após a execução completa e autorização explícita. **Sem tocar no Supabase institucional nem publicar por este checkpoint.**

**Fontes de execução:** [estado mutável](../CURRENT_STAGE.md), [contrato](../reference/PRONTUARIO_CORRECAO_CONTRATO.md), [plano](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md), [matriz](../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md), [handoff único](../handoff/2026-11-15-prontuario-integracao-verificada.md).
