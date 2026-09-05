# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, Prontuário, análise documental, Pendências, notas fiscais, patrimônio, Gestão de Equipe, acompanhamento gerencial e exportações.

> **ANTES DE ANALISAR OU ALTERAR O PROJETO:** leia [`START_HERE.md`](START_HERE.md). Ele é a única porta de entrada operacional.

## Continuidade do projeto

A cadeia corrente é:

1. [`START_HERE.md`](START_HERE.md) — baseline e ordem obrigatória;
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — estado funcional e achados abertos;
3. [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md) — método obrigatório;
4. [`docs/architecture/adversarial-analysis-replication-playbook.md`](docs/architecture/adversarial-analysis-replication-playbook.md) — procedimento reproduzível extraído da execução Astra;
5. [`docs/audits/2026-09-05-astra-adversarial-findings.md`](docs/audits/2026-09-05-astra-adversarial-findings.md) — ledger dos achados;
6. [`docs/MASTER_PLAN_CURRENT.md`](docs/MASTER_PLAN_CURRENT.md) — **único plano executável vigente**;
7. [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) — origem/absorção quando necessário;
8. [`AGENTS.md`](AGENTS.md) — regras permanentes de trabalho.

Planos, handoffs, ADRs e auditorias datados preservam história/evidência e não constituem filas concorrentes.

## Baseline funcional

- PR #260, merge `8fc58926565a72465980143f253f0a2fee4b8fc2`;
- Supabase: 46 migrations no fechamento do #260;
- PR #261: documental;
- PR #262: abortado/sem merge;
- PR #263: reconciliação documental/governança em revisão, sem runtime.

O SHA atual da `main` deve sempre ser consultado no remoto.

## Mudança metodológica de 05/09/2026

A auditoria Codex/Astra Ultra encontrou problemas não capturados pelas revisões anteriores mesmo com testes, E2E, CI e integridade amplamente verdes.

Portanto:

```text
gates verdes
≠ ausência de defeito desconhecido
```

Toda análise/implementação crítica passa a procurar explicitamente:

- segunda implementação da mesma regra;
- estado avançado destruído ao voltar à origem;
- caminho real da UI que contorna service/wrapper/RPC;
- combinação de fluxos verdes ainda não testada;
- contraexemplo que tente falsificar o contrato;
- diferença entre função correta e composição real;
- migration/RPC sucessora;
- fixture/teste histórico confundido com regra atual.

Antes de qualquer “fechamento confirmado”, deve existir evidência sobre **o que foi tentado para provar que ainda estava errado**.

## Achados adversariais abertos

- **P1 patrimônio:** save de NF permanente vinculada pode rebaixar bem `Inventariada` para `Encaminhada`;
- **P1 Excel SME:** botão real pode contornar auditoria obrigatória antes do download;
- **decisão Pendências:** idade total × tempo aguardando ator atual;
- **decisão CSV/XLSX:** política temporal e auditoria do CSV ainda precisam de contrato explícito;
- riscos arquiteturais adicionais em renderer legado de Pendências, projeções duplicadas, readiness e wrapper de performance.

Detalhes: [`docs/audits/2026-09-05-astra-adversarial-findings.md`](docs/audits/2026-09-05-astra-adversarial-findings.md).

## Regras que continuam protegidas

O detalhamento está em [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md). Entre as mais sensíveis:

- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- análise fiscal/Assessoria individual por `registered_invoice_id`;
- novo envio não resolve Pendência e substituição em `Aguardando reanálise` é suportada;
- NF permanente com número + processo já existente cria bem novo `Encaminhada` / Aguardando Inventariação;
- sem processo cria `Não encaminhada`;
- somente esse ramo exige `Não encaminhada → Encaminhada → Inventariada`;
- competência global é única, mas Pendências pode usar filtro local transversal `Todas`;
- Excel SME: uma competência, uma aba, 27 colunas A:AA;
- XLSX institucional corrente usa a competência global ativa;
- Production é fail-closed.

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

Esses comandos são gates importantes. Eles não substituem probes, composição real, cross-view e testes de sequência exigidos pelo método adversarial.

## Documentação técnica

Índice: [`docs/README.md`](docs/README.md).

Revisão dos artefatos reais da auditoria Astra: [`docs/audits/2026-09-05-astra-artifact-package-review.md`](docs/audits/2026-09-05-astra-artifact-package-review.md).

Para qualquer retomada, **sempre comece em `START_HERE.md`**.
