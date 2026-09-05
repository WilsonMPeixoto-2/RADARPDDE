# Handoff — PR #211 / hotfix de Notas Fiscais — histórico

> **HISTÓRICO — NÃO USAR COMO REGRA OU ROTEIRO ATUAL.** Este arquivo descrevia o PR #211 enquanto Draft, antes dos hotfixes #254/#256/#257/#258/#260. Para a regra vigente, comece em [`../../START_HERE.md`](../../START_HERE.md) e consulte a ADR-050 já emendada.

**Data original:** 29–30 de agosto de 2026  
**Reclassificado em:** 5 de setembro de 2026

## 1. O que este checkpoint consolidou

O PR #211 estabeleceu o núcleo que continua válido:

- `notaFiscal` agregada para bonificação;
- análise técnica fiscal individual por `registered_invoice_id`;
- Pendência fiscal individual por invoice;
- Consulta Assessoria individual por NF de serviço;
- Pendência da NF A não bloqueia NF B;
- `Incorreto + Pendência` usa operação protegida/atômica;
- `a_identificar` novo precisa de Pendência e não admite backfill heurístico de legado legítimo;
- identificação posterior preserva a identidade da despesa;
- Boleto Internet continua tipo de gasto de Nota Fiscal, não documento autônomo.

## 2. Cláusula deste checkpoint que foi substituída

Na época do Draft, o handoff dizia que **novo envio exigia Pendência `Aberta`**. Essa formulação foi superada pelo PR #254.

Contrato atual:

- primeiro envio corretivo pode partir de `Aberta`;
- substituição de envio pode ser registrada enquanto a Pendência já está `Aguardando reanálise`;
- novo envio não resolve;
- o caso fica `Aguardando reanálise` até a reanálise;
- histórico anterior é preservado.

O PR #256 também passou a sincronizar próximo ator por estado.

## 3. Efeitos posteriores não existentes neste Draft

Depois do PR #211:

- PR #214 corrigiu overflow visual da individualização;
- PR #215 corrigiu aliases técnicos de versão na fronteira do payload;
- PR #254 ampliou novo envio/reabertura e corrigiu integridade de Assessoria;
- PR #256 sincronizou próximo ator;
- PR #257 derivou `encampInventario` das aquisições permanentes;
- PR #258 explicitou NF ↔ bem no Prontuário;
- PR #260 estabilizou sequência patrimonial, sincronização, persistência/reload e guards de gesto repetido.

Por isso, este handoff não deve ser usado sozinho para avaliar o produto atual.

## 4. Fontes correntes

- [`../decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](../decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md)
- [`../CURRENT_STATE.md`](../CURRENT_STATE.md)
- [`../DECISION_LOG.md`](../DECISION_LOG.md)
- [`../PLAN_TRACEABILITY.md`](../PLAN_TRACEABILITY.md)

O conteúdo original detalhado permanece preservado no histórico Git.