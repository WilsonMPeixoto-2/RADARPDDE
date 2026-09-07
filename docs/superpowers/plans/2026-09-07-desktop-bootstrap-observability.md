# Plano de implementação — diagnóstico instrumental do bootstrap desktop

**Design:** `docs/superpowers/specs/2026-09-07-desktop-bootstrap-observability-design.md`

## Resultado concreto esperado

Produzir, sem alterar o comportamento do RADAR, uma evidência autenticada e sanitizada que mostre onde o tempo pós-login é gasto e como scripts, estilos, dados e readiness se encadeiam no desktop.

## Task 1 — Contratos RED da instrumentação

**Criar:**
- `tests/unit/desktop-bootstrap-observer.test.js`
- `tests/unit/desktop-bootstrap-observability-workflow.test.js`

Os testes devem exigir:
- sanitização de URLs e ausência de query string;
- agregação de requisições por caminho/tabela;
- resumo de recursos duplicados;
- relatório sem payload de rede;
- workflow HML executável a partir da branch atual da auditoria;
- execução explicitamente desktop.

Executar o RED no CI antes de criar a implementação.

## Task 2 — Observer test-side

**Criar:** `tests/support/desktop-bootstrap-observer.js`

Responsabilidades:
- instalar observação antes do código da aplicação;
- marcar eventos de auth/readiness;
- observar scripts e styles dinâmicos;
- registrar fetch somente com método, caminho sanitizado, início, fim e duração;
- opcionalmente registrar timers em execução diagnóstica separada;
- coletar PerformanceResourceTiming e long tasks quando disponíveis;
- gerar resumo determinístico e serializável.

Não pode:
- mudar ordem de scripts;
- resolver Promise da aplicação;
- cancelar ou repetir requisição;
- escrever em dados operacionais;
- alterar decisões de readiness.

## Task 3 — E2E autenticado de diagnóstico

**Criar:** `tests/e2e/desktop-bootstrap-observability.spec.js`

Usar as identidades efêmeras já produzidas pelo gate HML.

Execuções separadas:
1. **timing:** login → Dashboard, sem coverage/timer wrapping;
2. **load graph:** recursos dinâmicos, readiness, requests e timers;
3. **coverage por superfícies:** JavaScript/CSS, sem usar o tempo desta execução como benchmark.

O teste escreve apenas JSON sanitizado em `test-results/desktop-bootstrap-observability/`.

## Task 4 — Integrar com o gate HML

**Modificar:** `.github/workflows/validate.yml`

- permitir o job Preview/HML para a branch fresca `audit/desktop-bootstrap-observability-2026-09-07`, sem mover a branch legada divergente `qa/supabase-preview-gate-run`;
- manter criação/limpeza das identidades efêmeras;
- executar o diagnóstico apenas no projeto desktop Chromium;
- publicar somente o JSON sanitizado de observabilidade.

Não alterar o deploy Production.

## Task 5 — Evidência estática complementar

Reutilizar:
- `npm run audit:frontend-precedence:check`;
- `npm run test:frontend-precedence`;
- `npm run check:architecture`;
- `dependency-cruiser`;
- analisador de precedência já existente.

Gerar matriz atual de loaders, polling e relações globais sem criar um segundo analisador concorrente quando o existente puder ser estendido.

## Task 6 — CI e leitura adversarial

No PR:
- validar testes unitários/integrados existentes;
- executar frontend precedence;
- executar HML autenticado desktop;
- verificar artefato sanitizado;
- confirmar ausência de mudança em `src/`, `app.js`, `config.js`, `index.html` e banco durante esta etapa.

## Task 7 — Relatório causal e contrato de dependências

**Criar após a execução real:**
- `docs/evidence/desktop-bootstrap-observability/2026-09-07-report.md`
- `docs/evidence/desktop-bootstrap-observability/surface-dependency-matrix.json`

O relatório deve responder objetivamente:
- quanto tempo decorre do clique em Entrar até o Dashboard utilizável;
- qual etapa domina esse tempo;
- quantas leituras remotas ocorrem e quais grupos de dados concentram tempo;
- quais scripts/styles carregam antes do Dashboard;
- quais carregamentos são duplicados;
- quais módulos realmente usam polling de readiness;
- qual é a composição efetiva dos wrappers centrais;
- quais dependências cada superfície desktop exige.

## Gate de saída

Nenhuma refatoração de readiness/lazy loading será iniciada neste PR. Após o diagnóstico ser fechado, seguir a fila aprovada:

1. regra única de Pendências;
2. convergência de salvar/excluir NF;
3. reorganização estrutural de bootstrap/readiness mantendo os mesmos recursos;
4. otimizações pós-login somente quando comprovadas.