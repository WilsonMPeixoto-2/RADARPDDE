# RADAR PDDE — Histórico de checkpoints do estado do projeto

> **NÃO É A PORTA DE RETOMADA NEM A FILA ATUAL.** Para continuar o projeto, comece em [`../START_HERE.md`](../START_HERE.md), leia [`CURRENT_STATE.md`](CURRENT_STATE.md) e use somente [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) como plano executável.

**Reclassificado em:** 5 de setembro de 2026  
**Classe documental:** histórico resumido de checkpoints

## 1. Por que este arquivo mudou de função

Durante agosto e o início de setembro, `CURRENT_STAGE.md` acumulou sucessivos blocos de “estado corrente”. Isso preservou muita história, mas deixou várias frases antigas de retomada convivendo no mesmo arquivo. Depois dos hotfixes #254/#256/#257/#258/#260, esse formato tornou-se perigoso para sessões novas.

A fotografia corrente foi transferida para [`CURRENT_STATE.md`](CURRENT_STATE.md). A origem/absorção do plano está em [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md). Os detalhes antigos continuam preservados nos handoffs, ADRs, auditorias, evidências e no histórico Git deste próprio arquivo.

## 2. Checkpoint funcional mais recente antes da reconciliação documental

### PR #260 — estabilização funcional, 04/09/2026

- head funcional certificado: `c3d6fc2374476a4884cfebc2f4236e346ccf2700`;
- merge em `main`: `8fc58926565a72465980143f253f0a2fee4b8fc2`;
- Supabase Production: 46 migrations naquele fechamento;
- migration mais recente: `20260904040000_functional_reliability_inventory_sync`;
- RPC patrimonial `save_asset_with_verification_and_log` presente;
- Vercel Production registrado no fechamento como READY no merge funcional;
- `production_integrity_check()` registrou `totalIssues = 0` naquele checkpoint.

Principais resultados:

- inventariação não pode pular a etapa necessária quando o bem está `Não encaminhada`;
- bem derivado de NF não aceita edição isolada do número fiscal;
- encaminhamento posterior sincroniza bem + `encampInventario` + log atomicamente;
- aliases técnicos de versão são removidos/protegidos no payload de verificação;
- novo envio, reanálise, encaminhamento e inventariação possuem guard contra repetição imediata;
- jornadas reais com Supabase/Auth passaram a provar persistência → leitura → reload → releitura.

Importante: o PR #260 **não** alterou a regra do PR #257 segundo a qual NF permanente com número e processo de inventário já existente cria o bem `Encaminhada` / **Aguardando Inventariação**.

## 3. PR #261 — fechamento documental

O PR #261 não alterou runtime ou banco. Ele produziu a `main` documental `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`, que é a baseline sobre a qual a reconciliação do PR #263 foi iniciada.

## 4. Plano reconciliado de 03/09 — PR #253

O plano source-first R1–R9 foi correto no seu checkpoint e substituiu o plano de 26/08. Depois dele, porém, novos hotfixes foram integrados antes que a fila pudesse ser retomada:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Por isso o plano de 03/09 agora é histórico e foi transformado no sucessor [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md), conforme a rastreabilidade.

## 5. Hotfixes posteriores ao plano de 03/09

### PR #254

Corrigiu novo envio/substituição em Pendências, reabertura de Cancelada/Resolvida, `canceled_at` terminal e integridade do agregado de Consulta Assessoria.

### PR #256

Sincronizou `responsavel` e `proximoAtor` nas transições documentais:

```text
Aberta → Escola
Aguardando reanálise → Controlador
terminal → nenhum
```

### PR #257

Passou a derivar `Encaminhado para Inventariação` a partir das aquisições permanentes.

Regra preservada:

```text
permanente + NF + processo existente → bem Encaminhada / Aguardando Inventariação
permanente sem processo → bem Não encaminhada
```

### PR #258

Tornou explícito no Prontuário o vínculo NF permanente ↔ bem por identidade técnica, mostrando NF, descrição, valor e status.

### PR #260

Estabilizou persistência/reload, sequência patrimonial, sincronização e repetição de gestos, sem revogar os PRs anteriores.

## 6. PR #262

**Abortado e fechado sem merge.** Não integra `main`, Production nem o conjunto de regras vigentes.

## 7. Checkpoints históricos anteriores

Os detalhes de ciclos anteriores permanecem nos arquivos específicos, entre eles:

- `handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`;
- `audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`;
- `handoff/2026-08-31-pr237-fechamento-visual-e-ci.md`;
- `handoff/2026-08-30-pr215-fechamento-tecnico.md`;
- `handoff/2026-08-30-pr211-publicacao-concluida.md`;
- `handoff/2026-08-23-post-pr-193.md`;
- `handoff/2026-08-18-encerramento-operacional.md`;
- planos datados em `superpowers/plans/`;
- ADRs em `decisions/`.

Esses arquivos explicam a evolução, mas seus “próximos passos” pertencem aos respectivos checkpoints.

## 8. Continuidade atual

Não continuar por este arquivo.

```text
START_HERE.md
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md se a origem for necessária
```
