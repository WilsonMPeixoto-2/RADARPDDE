# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 6 de setembro de 2026  
**Classe documental:** Canônico — estado corrente e retomada futura

## 1. Checkpoint corrente — main pós-PR #279

Este arquivo é a porta de entrada para o estado mutável do projeto. Valores voláteis devem ser revalidados no remoto antes de operação que dependa deles.

Baseline revalidado em 06/09/2026:

- `main`: `b82e7c1ad9b7c5992508c99fbaff7a3498fa52d8`;
- último merge: PR #279 — preservação da auditoria da reabertura de consolidação;
- Vercel Production: `dpl_49x13gq72dNa71cQLL1AL5UgebyV`, `READY`, servindo o mesmo SHA da `main`;
- Supabase Production `scnryinorqeucbfkioxo`: 50 migrations; última versão observada `20260906072000`;
- `production_integrity_check()`: `healthy`, `totalIssues = 0`, 20 verificações sem ocorrência;
- branch `main`: sem branch protection/ruleset obrigatório no checkpoint consultado.

O checkpoint detalhado e sua classificação source-first estão em [`handoff/2026-09-06-rebaseline-pos-pr279.md`](handoff/2026-09-06-rebaseline-pos-pr279.md).

## 2. Situação funcional

A cadeia de correções #265–#279 foi integrada. Não há defeito funcional conhecido dessa cadeia aguardando implementação.

Isso **não** significa que o plano arquitetural R1–R9 esteja encerrado. Hotfixes posteriores absorveram partes importantes do plano, mas a revalidação do código atual confirmou dívidas arquiteturais remanescentes.

Entregas que não devem ser reabertas automaticamente:

- #265 — `Inventariada` terminal no serviço e no banco;
- #266 — isolamento do rollback concorrente da UnitOfWork;
- #267 — autoridade auditável da exportação Excel SME no gesto real;
- #268 — desativação de Controlador exige carteira zerada;
- #269 — testes usam contexto canônico de competência;
- #270 — loader de extensões resiliente a falha isolada;
- #271 — compensação Auth protegida para resposta ambígua;
- #272 — commit remoto separado de sincronização local, reconciliação serializada e feedback composto;
- #276 — Nota Fiscal idempotente por intenção e RPC v2;
- #277 — invariantes server-side de reanálise;
- #278 — fail-closed remoto para operações críticas sem RPC atômica;
- #279 — auditoria preservada na reabertura de consolidação.

PRs #274 e #275 consolidaram documentação/revisão e o método de engenharia. PR #273 foi controle temporário e não foi integrado.

## 3. Classificação vigente de R1–R9

R1–R9 são identificadores históricos do plano de 03/09. A tabela abaixo é a classificação vigente após revalidação do código pós-#279; ela substitui qualquer interpretação de fila automática do plano antigo.

| Fase | Estado atual | Próxima decisão |
|---|---|---|
| **R1** | **Pendente real** | Retirar autoridade funcional de `operational-write-performance.js`, preservando performance apenas como diagnóstico/observação. |
| **R2A** | **Parcialmente absorvido** | #270 já resolveu resiliência do loader; preservar. |
| **R2B/R2C** | **Pendente real** | Remover polling usado como contrato de instalação/readiness somente quando houver sinal determinístico equivalente. |
| **R3** | **Materialmente atendido** | Revalidar os critérios finais; se não surgir lacuna concreta, encerrar formalmente como cumprido por #276 e mudanças posteriores. |
| **R4** | **Pendente real** | Unificar semântica de Pendências entre `operational-projection.js` e `pendencias-view-model.js`, sem redesenho. |
| **R5** | **Pendente real** | Completar convergência autoritativa/incremental de `invoice:save`/`invoice:remove`, inclusive remoções retornadas por ID. |
| **R6** | **Gate posterior** | Executar equivalência depois de R4/R5; sem diff obrigatório se o comportamento já for equivalente. |
| **R7** | **Pendente** | Instrumentar causalmente o bootstrap que restar após R1–R6. |
| **R8** | **Condicional** | Otimizar apenas gargalos demonstrados por R7; caso contrário, no-op documentado. |
| **R9** | **Pendente** | Fechamento final após R1–R8 estarem concluídos, absorvidos ou documentados como no-op. |

## 4. Ordem das próximas ações

```text
1. concluir este rebaseline documental pós-#279
2. fechar/superseder PR #263 e reavaliar PR #5
3. tratar proteção/ruleset da main
4. R1
5. R2
6. fechamento formal de R3
7. R4
8. R5
9. R6
10. R7
11. R8 somente se medição justificar
12. R9
13. ADR-051 / hardening de registered_invoices e Auth
14. rebase + revalidação do PR #264 de dependências
```

Nenhuma etapa pode ser implementada apenas porque existe no plano de 03/09. Aplicar [`reference/ENGINEERING_METHOD.md`](reference/ENGINEERING_METHOD.md): código/ambiente atuais → hipótese → tentativa de refutação → causa real → mudança mínima → regressão → revisão adversarial → gates proporcionais.

## 5. PRs abertos relevantes

### PR #263 — continuidade documental antiga

Draft, baseado em uma `main` anterior e com grande divergência em relação aos PRs #265–#279. Não define baseline e não deve ser mergeado. Extrair somente informação ainda válida quando necessário; depois fechar como superado por este rebaseline.

### PR #264 — dependências

Manutenção legítima, mas validada sobre uma `main` anterior. Não misturar com R1–R9. Rebasear/revalidar somente na etapa própria definida acima.

### PR #5 — histórico

Reavaliar objetivamente. Se não houver decisão atual de retomada, fechar como superado para evitar backlog ambíguo.

## 6. Dívidas deliberadamente fora da frente funcional

### ADR-051

Hardening adicional de `registered_invoices` continua separado da frente funcional. A ausência de proteção específica para imutabilidade de `id`, coerência de `verification_id` e proteção/canonicalização de `source_context_key` foi revalidada no banco. Não há evidência de corrupção atual.

Retomar depois de R9 conforme [`decisions/ADR-051-adiamento-hardening-registered-invoices.md`](decisions/ADR-051-adiamento-hardening-registered-invoices.md).

### Auth

O advisor de segurança do Supabase aponta `auth_leaked_password_protection` como `WARN`. Tratar junto da frente de hardening, não como bug funcional de R1–R9.

### Performance do banco

Avisos `unused_index` do advisor são sinais de observação, não autorização para remover índice. Qualquer ação depende de medição e contraprova.

## 7. Guardrails vigentes

Preservar:

- bonificação de NF agregada, análise/Pendência individual por `registered_invoice_id`;
- resumo técnico derivado com precedência vigente;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente e legados legítimos não recebem backfill;
- `boleto_internet` somente como tipo de gasto de Notas Fiscais em Educação Conectada;
- Consulta Assessoria individual por NF de serviço;
- Pendências transversais a competências;
- bonificação, análise e Pendência como dimensões independentes;
- `Inventariada` terminal;
- competência global canônica via `RadarCompetenceContext`;
- Production fail-closed;
- commit remoto confirmado não é repetido para recuperar falha local;
- layout aprovado de Prontuário/Pendências;
- comunicação externa sem o nome interno `RADAR PDDE`;
- Supabase CLI 2.116.0 rejeitado enquanto a regressão documentada não for superada por nova homologação;
- Lighthouse com três rodadas, mediana e thresholds vigentes.

## 8. Precedência e histórico

Para determinar estado presente:

1. código do SHA atual;
2. Supabase/Auth/RLS/RPCs/Edge Functions e Vercel efetivos;
3. decisões vigentes;
4. testes atuais que representam o contrato;
5. documentação canônica corrente;
6. auditorias, planos e checkpoints históricos.

Documentos históricos permanecem válidos como evidência do seu momento, mas não controlam a fila atual. O snapshot anterior deste arquivo foi preservado em [`history/rebaseline-pre-pr279/CURRENT_STAGE-pre-pr279.md`](history/rebaseline-pre-pr279/CURRENT_STAGE-pre-pr279.md).

## 9. Retomada

Para um novo chat/agente:

1. leia `AGENTS.md`;
2. leia este arquivo;
3. leia `reference/ENGINEERING_METHOD.md`;
4. leia o checkpoint [`handoff/2026-09-06-rebaseline-pos-pr279.md`](handoff/2026-09-06-rebaseline-pos-pr279.md);
5. revalide `main`, Production e Supabase antes de qualquer mudança;
6. continue somente a primeira etapa ainda aberta da ordem da seção 4.
