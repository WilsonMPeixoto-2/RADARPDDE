# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, Pendências, contatos, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **ANTES DE ANALISAR OU ALTERAR O PROJETO:** leia [`START_HERE.md`](START_HERE.md). Ele é a única porta de entrada operacional e informa como verificar a baseline, qual é o estado corrente e qual é o único plano executável vigente.

## Continuidade do projeto

A sequência documental atual é intencionalmente curta:

1. [`START_HERE.md`](START_HERE.md) — única porta de entrada;
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — estado factual corrente;
3. [`docs/MASTER_PLAN_CURRENT.md`](docs/MASTER_PLAN_CURRENT.md) — **único plano executável vigente**;
4. [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) — origem das tarefas e reconciliação do plano de 03/09 com os hotfixes posteriores;
5. [`AGENTS.md`](AGENTS.md) — regras permanentes de trabalho e proteção contra regressão.

Planos, handoffs, ADRs e auditorias datados continuam preservados como evidência histórica, mas não constituem ordens de execução concorrentes.

## Baseline reconciliada em 04/09/2026

- `main`: `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`;
- baseline funcional publicada: PR #260, merge `8fc58926565a72465980143f253f0a2fee4b8fc2`;
- head funcional certificado antes do merge: `c3d6fc2374476a4884cfebc2f4236e346ccf2700`;
- Supabase Production: 46 migrations na baseline do #260;
- PR #261: fechamento exclusivamente documental da estabilização;
- PR #262: abortado e fechado sem merge, portanto fora da baseline.

Se a `main` tiver avançado, siga `START_HERE.md` e reconcilie os PRs posteriores antes de executar o plano.

## Produto publicado

### Operação do PDDE

- competência global e exercício;
- Dashboard, Carteira e Competências;
- Prontuário e timeline;
- bonificação e análise técnica;
- Pendências, tentativas, reanálises e contatos;
- notas fiscais e efeitos associados;
- bens permanentes e inventariação;
- Registros Internos;
- busca e navegação contextual.

### Perfis

- **Controlador:** operação autorizada na própria CRE, com carteira como responsabilidade principal;
- **Assistente de Verbas Federais:** operação transversal e Gestão de Equipe da CRE;
- **Gestão SME:** acompanhamento gerencial e configurações autorizadas;
- **Equipe de Inventário:** fluxo patrimonial autorizado;
- **Administrador técnico:** papel técnico de infraestrutura, escopos, importação, auditoria e homologação.

`technical_admin` não é quinto perfil funcional cotidiano.

## Regras recentes que não podem regredir

O detalhamento está em [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md). Entre as decisões mais sensíveis:

- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- Nota Fiscal e Consulta Assessoria usam individualização por `registered_invoice_id` onde aplicável;
- novo envio/substituição, reabertura e próximo ator seguem os contratos dos PRs #254/#256;
- NF permanente com processo de inventário já existente cria bem `Encaminhada`, apresentado como **Aguardando Inventariação**;
- NF permanente sem processo cria bem `Não encaminhada`; este ramo não pode pular diretamente para `Inventariada`;
- `encampInventario` é derivado do conjunto de aquisições permanentes;
- Prontuário mostra o vínculo NF ↔ bem pelo vínculo técnico;
- encaminhamento posterior sincroniza patrimônio + verificação + log atomicamente;
- gestos repetidos em ações críticas possuem contenção durante a operação em andamento;
- BB Ágil N/A, Boleto Internet como tipo de gasto, comunicação externa sem nome interno e PDDE Básico primeiro somente na apresentação permanecem protegidos.

## Garantia operacional

O projeto possui, entre outros:

- Supabase como persistência canônica de Preview/Production;
- operação Production fail-closed;
- matriz funcional executável;
- gates de Auth/RLS, migrations e integridade;
- backup/restauração descartável;
- perfis × viewports;
- Playwright e jornadas reais com Supabase/Auth;
- CodeQL e dependências;
- Lighthouse desktop com múltiplas rodadas/mediana;
- certificações de exportação.

O PR #260 acrescentou jornadas de persistência → leitura → reload → releitura para fluxos críticos. Elas são baseline de regressão e devem ser reaproveitadas, não substituídas por suítes paralelas sem necessidade.

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

O índice completo fica em [`docs/README.md`](docs/README.md), mas ele não substitui a porta de entrada. Para retomada do projeto, **sempre comece em `START_HERE.md`**.
