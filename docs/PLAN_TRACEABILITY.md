# RADAR PDDE — Rastreabilidade do plano pós-hotfixes

**Atualizado em:** 5 de setembro de 2026  
**Baseline de planejamento:** PR #253  
**Baseline funcional posterior:** PR #260 / `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Classe:** rastreabilidade canônica; não é fila executável.

> Para executar trabalho, comece em [`../START_HERE.md`](../START_HERE.md) e use somente [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md).

## 1. Linha de decisão recente

```text
#253
→ #254 → #256 → #257 → #258 → #260 → #261
→ #263 documental em revisão
```

PR #262 foi **abortado/fechado sem merge**.

## 2. Regras posteriores preservadas

### Pendências

- novo envio não resolve;
- substituição enquanto `Aguardando reanálise` é suportada;
- `Resolvida`/`Cancelada` podem ser reabertas quando autorizado;
- próximo ator conforme #256;
- histórico legítimo não recebe estado inventado.

### NF / Assessoria / `a_identificar`

- individualização por `registered_invoice_id`;
- `a_identificar` novo atômico `Incorreto + Pendência`;
- identificação preserva ID;
- Assessoria individual por NF de serviço;
- Boleto Internet é tipo de gasto em NF de Educação Conectada.

### Inventário

- permanente + número + processo existente → bem novo `Encaminhada`;
- permanente sem processo → `Não encaminhada`;
- somente o ramo `Não encaminhada` exige a sequência completa até `Inventariada`;
- `encampInventario` derivado do conjunto;
- vínculo NF ↔ bem por identidade técnica;
- encaminhamento posterior atômico.

## 3. Auditoria adversarial de 05/09 e mudança do plano

Depois do fechamento documental inicial do PR #263, a auditoria Codex/Astra Ultra encontrou defeitos e riscos fora da cobertura conhecida.

Isso **não revoga** as regras posteriores acima. Revoga a presunção de que gates/documentação verdes eram suficientes para declarar ausência de defeitos desconhecidos.

Documentos obrigatórios:

- [`architecture/adversarial-analysis-and-implementation-method.md`](architecture/adversarial-analysis-and-implementation-method.md);
- [`architecture/adversarial-analysis-replication-playbook.md`](architecture/adversarial-analysis-replication-playbook.md);
- [`audits/2026-09-05-astra-adversarial-findings.md`](audits/2026-09-05-astra-adversarial-findings.md);
- [`audits/2026-09-05-astra-artifact-package-review.md`](audits/2026-09-05-astra-artifact-package-review.md).

### Achados que alteram prioridade

1. **P1 patrimônio:** save da NF pode rebaixar bem `Inventariada` para `Encaminhada`;
2. **P1 exportação:** botão Excel SME pode contornar auditoria pré-download;
3. **decisão Pendências:** idade total × tempo do ator atual;
4. **decisão/investigação exportação:** CSV × XLSX institucional;
5. **riscos arquiteturais:** renderer legado de Pendências, projeções duplicadas, performance/readiness com autoridade funcional/ambígua, testes/documentos antigos perigosos.

## 4. Matriz R1–R9 após a auditoria Astra

| Fase antiga | Situação | Destino atual |
|---|---|---|
| R1 autoridade funcional em performance | continua real e reforçada pelo Astra | Frente 1, depois da Frente 0 |
| R2 readiness | continua real; Promise não equivale capability instalada | Frente 2 |
| R3 IDs/intenção/idempotência NF | continua pendente com escopo reduzido | Frente 3 |
| R4 projeção Pendências | duplicação confirmada; semântica de idade exige decisão antes de unificar | Frente 4, condicionada à 0D |
| R5 save/remove NF | continua pendente; agora deve preservar explicitamente estado patrimonial avançado | Frente 5, depois do hotfix 0B |
| R6 equivalência | permanece gate | Frente 6 |
| R7 instrumentação causal | pendente | Frente 7A |
| R8 otimizações | condicional | Frente 7B |
| R9 fechamento | infraestrutura existe, critério de fechamento ficou mais rigoroso | Frente 8 |

## 5. Frente 0 adicionada

A auditoria Astra criou prioridade anterior às antigas frentes:

```text
0A — método/documentação/artefatos
→ 0B — hotfix patrimonial
→ 0C — hotfix auditoria Excel SME
→ 0D — decisões/probes Pendências e CSV
→ Frentes 1–8
```

## 6. O que o pacote Astra acrescentou à rastreabilidade

O pacote preservado demonstrou o procedimento real usado:

- inventário de 840 arquivos naquele checkout;
- varredura textual integral por classes de risco;
- mapa AST/SQL com 3.797 funções, 151 chamadas relevantes, 88 definições SQL, 57 nomes distintos e 0 erros de parse;
- divisão semântica em três recortes complementares;
- probes com código real e mocks periféricos;
- comparação entre suíte verde e lacunas de composição;
- coleta remota de migrations/deployments/funções/integridade;
- normalização do ambiente com `npm ci` após detectar dependências reaproveitadas divergentes;
- preservação progressiva em `outputs/` e `work/`.

Esse procedimento é agora requisito metodológico, não curiosidade histórica.

## 7. Regra para próximos PRs funcionais

Todo PR funcional deve:

1. confirmar baseline e PRs sucessores;
2. reproduzir/classificar o problema;
3. procurar autoridade concorrente e estado avançado afetado;
4. aplicar TDD e composição real;
5. testar persistência/reload quando material;
6. tentar produzir contraexemplo após a correção;
7. atualizar `CURRENT_STATE.md`;
8. registrar aqui o efeito sobre as frentes;
9. atualizar `MASTER_PLAN_CURRENT.md` quando o trabalho remanescente mudar.

O plano acompanha decisões posteriores comprovadas. O produto não é revertido para caber em histórico.
