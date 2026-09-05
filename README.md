# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, Prontuário, análise documental, Pendências, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **ANTES DE ANALISAR OU ALTERAR O PROJETO:** leia [`START_HERE.md`](START_HERE.md). Ele é a única porta de entrada operacional.

## Continuidade do projeto

A cadeia corrente é curta e obrigatória:

1. [`START_HERE.md`](START_HERE.md) — única porta de entrada e regra para verificar a `main` atual;
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — estado funcional corrente;
3. [`docs/MASTER_PLAN_CURRENT.md`](docs/MASTER_PLAN_CURRENT.md) — **único plano executável vigente**;
4. [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) — origem/absorção do plano quando necessário;
5. [`AGENTS.md`](AGENTS.md) — regras permanentes de trabalho e proteção contra regressão.

Planos, handoffs, ADRs e auditorias datados preservam história/evidência e não constituem filas concorrentes.

## Baseline funcional reconciliada

- PR #260, merge `8fc58926565a72465980143f253f0a2fee4b8fc2`;
- head funcional certificado antes do merge: `c3d6fc2374476a4884cfebc2f4236e346ccf2700`;
- Supabase Production: 46 migrations no fechamento do #260;
- PR #261: fechamento exclusivamente documental;
- PR #262: abortado e fechado sem merge;
- PR #263: consolidação documental/governança, sem alteração de runtime ou banco.

O SHA corrente da `main` deve ser consultado no remoto. Não existe um SHA documental fixo que deva continuar sendo chamado de “main atual” depois do próprio merge da documentação.

## Produto

Superfícies principais:

- Dashboard, Carteira e Competências;
- Prontuário e timeline;
- bonificação e análise técnica;
- Pendências, tentativas, reanálises e contatos;
- Notas Fiscais e efeitos associados;
- Capital e Inventário;
- Registros Internos;
- Gestão de Equipe;
- configurações SME;
- busca, alertas, navegação contextual e exportações.

Perfis funcionais: Controlador, Assistente de Verbas Federais, Gestão SME e Equipe de Inventário. `technical_admin` é papel técnico autenticado separado; simulação visual não altera o JWT.

## Regras recentes que não podem regredir

O detalhamento está em [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md). Entre as mais sensíveis:

- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- Nota Fiscal e Consulta Assessoria usam individualização por `registered_invoice_id` onde aplicável;
- novo envio/substituição, reabertura e próximo ator seguem PRs #254/#256;
- NF permanente com número + processo de inventário já existente cria bem `Encaminhada`, mostrado como **Aguardando Inventariação**;
- NF permanente sem processo cria bem `Não encaminhada`; apenas esse ramo precisa de encaminhamento posterior antes de inventariar;
- `encampInventario` é derivado do conjunto de aquisições permanentes;
- Prontuário mostra o vínculo NF ↔ bem por identidade técnica;
- encaminhamento posterior sincroniza patrimônio + verificação + log atomicamente;
- BB Ágil N/A, Boleto Internet dentro de Notas Fiscais, comunicação externa sem nome interno e PDDE Básico primeiro somente na apresentação permanecem protegidos;
- Production é fail-closed.

## Garantia operacional

O projeto possui gates de Auth/RLS, migrations, integridade, backup/restauração, perfis/viewports, Playwright, jornadas reais com Supabase/Auth, CodeQL, dependências, Lighthouse e exportações.

O PR #260 acrescentou jornadas de `ação → persistência → leitura → reload → releitura`. Elas são baseline de regressão e devem ser reaproveitadas.

## Desenvolvimento e verificação

```bash
npm ci
npm run check
npm run test:unit
npm run test:readiness
npm run test:e2e
```

Supabase descartável:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Matriz funcional:

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

## Documentação técnica

O índice completo fica em [`docs/README.md`](docs/README.md). A auditoria semântica que fechou a reconciliação pós-hotfixes está em [`docs/audits/2026-09-05-continuity-semantic-traceability-complete.md`](docs/audits/2026-09-05-continuity-semantic-traceability-complete.md).

Para retomada do projeto, **sempre comece em `START_HERE.md`**.