# Matriz de validade documental

**Atualizado em:** 5 de setembro de 2026  
**Classe documental:** referência canônica de classificação, não fila executável

> **ROTA OBRIGATÓRIA:** qualquer retomada começa em [`../../START_HERE.md`](../../START_HERE.md). O único plano executável vigente é [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).

## 1. Rota corrente

```text
START_HERE.md
→ CURRENT_STATE.md
→ método adversarial
→ playbook reproduzível
→ achados/evidências adversariais
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md quando necessário
→ documentos específicos da tarefa
```

## 2. Documentos correntes de continuidade e método

| Documento | Estado | Uso |
|---|---|---|
| `START_HERE.md` | **CORRENTE — porta única** | primeira leitura e baseline |
| `docs/CURRENT_STATE.md` | **CORRENTE** | estado funcional, defeitos/decisões abertos |
| `docs/architecture/adversarial-analysis-and-implementation-method.md` | **CORRENTE — obrigatório** | princípios de análise/implementação adversarial |
| `docs/architecture/adversarial-analysis-replication-playbook.md` | **CORRENTE — obrigatório em auditoria crítica** | procedimento técnico reproduzível extraído dos artefatos Astra |
| `docs/audits/2026-09-05-astra-adversarial-findings.md` | **CORRENTE COMO LEDGER DE ACHADOS** | bugs, ambiguidades, dívidas e históricos classificados |
| `docs/audits/2026-09-05-astra-artifact-package-review.md` | **CORRENTE COMO EVIDÊNCIA/MÉTODO** | estudo dos 27 artefatos reais da auditoria Astra |
| `docs/MASTER_PLAN_CURRENT.md` | **CORRENTE — único plano executável** | fila real de trabalho |
| `docs/PLAN_TRACEABILITY.md` | **CORRENTE** | origem/absorção de tarefas |
| `AGENTS.md` | **CORRENTE** | regras permanentes de agentes |
| `docs/reference/TEST_GOVERNANCE.md` | **CORRENTE** | governança de testes sob o método adversarial |
| `docs/PROJECT_CONTEXT.md` | **CORRENTE** | contratos funcionais estáveis, subordinados à rota acima |
| `docs/DECISION_LOG.md` | **CORRENTE COMO LEDGER** | decisões vigentes; não é fila |

## 3. Documentos arquiteturais corrigidos em 05/09

A auditoria Astra encontrou documentação arquitetural que ainda descrevia contratos anteriores. Foram reconciliados:

- `docs/architecture/competencias.md`: competência global continua única, mas Pendências possui filtro local transversal `Todas` sem alterar o contexto global;
- `docs/architecture/excel-export.md`: XLSX institucional corrente segue competência global ativa; CSV permanece com contrato a decidir; P1 de auditoria SME registrado;
- `docs/architecture/excel-sme-mensal.md`: contrato 27 colunas preservado, mas auditoria pré-download do botão real ainda tem P1 aberto;
- `docs/architecture/excel-xlsx-runtime.md`: removida a falsa equivalência automática CSV/XLSX e registrado o P1 de composição;
- `docs/architecture/excel-integral-certification.md`: certificação de workbook foi separada de certificação da composição do botão real.

## 4. Histórico de checkpoints

| Documento | Estado | Regra de uso |
|---|---|---|
| `docs/CURRENT_STAGE.md` | **HISTÓRICO DETALHADO** | investigar checkpoints; não usar como próxima ação |
| `docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md` | **HISTÓRICO** | checkpoint anterior |
| `docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md` | **HISTÓRICO** | evidência do baseline de 03/09 |
| `docs/audits/2026-09-05-continuity-semantic-traceability-complete.md` | **HISTÓRICO/CANÔNICO PARA CONTINUIDADE, NÃO PROVA DE AUSÊNCIA DE BUG** | reconstrução #253→#261; fechamento funcional amplo foi posteriormente reaberto pelo método adversarial |
| `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` | **HISTÓRICO — NÃO EXECUTAR** | plano do checkpoint 03/09, posteriormente emendado |
| `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` | **HISTÓRICO — NÃO EXECUTAR** | plano anterior |
| demais handoffs/audits/evidence/reports/planos datados | **HISTÓRICO/EVIDÊNCIA** | abrir apenas quando a rastreabilidade exigir |

Um documento ter sido “canônico” em seu checkpoint não o transforma em instrução eterna.

## 5. Linha recente de sucessão

```text
#253
→ #254 → #256 → #257 → #258 → #260 → #261
→ #263 documental em revisão
```

PR #262 foi **abortado e fechado sem merge**.

## 6. ADRs

ADRs permanecem válidos somente no escopo não especializado/substituído posteriormente.

- ADR-049: histórica para Boleto Internet;
- ADR-050: núcleo de individualização vigente, emendado por #254/#256;
- ADR-051: hardening adicional adiado;
- ADR-052: separação de autoridades críticas vigente.

Dúvida entre ADR e hotfix posterior exige PR/código/migration sucessora antes de qualquer alteração.

## 7. Matrizes e referências geradas

- matriz funcional é inventário operacional/testável, não fonte autônoma de pré-condição;
- anchors para RPC devem apontar/registrar também a definição sucessora efetiva quando houve redefinição;
- catálogo de superfícies não substitui autorização real;
- dicionários Supabase dependem da baseline de migrations;
- uma linha de matriz não autoriza generalizar ramo específico para todos os cenários.

## 8. O que uma sessão nova NÃO deve fazer

- escolher arquivo recente pelo nome e executá-lo;
- considerar gate verde como prova de ausência de bug;
- validar apenas função isolada quando o usuário entra por outro caminho;
- ignorar segunda implementação/fallback/closure;
- usar migration antiga depois de redefinição sucessora;
- transformar fixture legado/adversarial em regra de escrita atual;
- omitir ambiguidade porque “não é bug”;
- alterar produto para caber em plano/teste histórico.

## 9. Manutenção após hotfix

Todo PR funcional deve:

1. reproduzir e classificar o problema;
2. aplicar método adversarial;
3. atualizar `CURRENT_STATE.md`;
4. atualizar `PLAN_TRACEABILITY.md`;
5. atualizar `MASTER_PLAN_CURRENT.md` se necessário;
6. atualizar documentos correntes afetados;
7. registrar o que foi tentado para provar que a correção ainda estava errada.
