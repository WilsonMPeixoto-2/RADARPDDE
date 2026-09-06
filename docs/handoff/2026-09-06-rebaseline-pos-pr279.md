# Rebaseline source-first pós-PR #279

**Data:** 6 de setembro de 2026  
**Classe:** checkpoint canônico de retomada  
**Escopo:** estado real pós-hotfixes #265–#279, classificação R1–R9 e separação entre funcionalidade, arquitetura, hardening e manutenção

## 1. Baseline remoto revalidado

Este checkpoint foi construído a partir de código, GitHub, Vercel e Supabase atuais. Planos e auditorias anteriores foram usados somente como hipótese/critério a revalidar.

- `main`: `b82e7c1ad9b7c5992508c99fbaff7a3498fa52d8`.
- último merge da `main`: PR #279 — preservação da auditoria da reabertura de consolidação.
- Vercel Production: `dpl_49x13gq72dNa71cQLL1AL5UgebyV`, `READY`, `target=production`, Git SHA `b82e7c1ad9b7c5992508c99fbaff7a3498fa52d8`.
- Supabase Production `scnryinorqeucbfkioxo`: 50 migrations aplicadas; última versão observada `20260906072000`.
- `production_integrity_check()`: `status=healthy`, `totalIssues=0`, 20 verificações com zero ocorrências.
- `main` permanece sem branch protection/ruleset obrigatório no checkpoint consultado.

Valores voláteis devem ser reconsultados antes de merge, migration ou deploy futuro.

## 2. O que já foi absorvido pelos hotfixes #265–#279

Não reabrir automaticamente estas correções:

- #265 — `Inventariada` terminal no serviço e no banco;
- #266 — isolamento do rollback concorrente da UnitOfWork;
- #267 — autoridade auditável no botão real de exportação Excel SME;
- #268 — desativação de Controlador exige carteira zerada;
- #269 — testes usam o contexto canônico de competência;
- #270 — loader de extensões tolera falha isolada preservando fail-closed crítico;
- #271 — compensação Auth com identidade durável para resposta ambígua;
- #272 — commit remoto separado da aplicação local, reconciliação serializada e feedback composto;
- #276 — save de Nota Fiscal idempotente por intenção com `operationKey` e RPC v2;
- #277 — invariantes server-side da reanálise de Pendências;
- #278 — operações críticas remotas falham fechado sem fallback não atômico;
- #279 — auditoria da reabertura de consolidação preservada no caminho atômico.

O fato de essas frentes estarem integradas não prova que todo o plano arquitetural R1–R9 foi concluído.

## 3. Classificação source-first de R1–R9

| Fase | Estado pós-#279 | Evidência/decisão de retomada |
|---|---|---|
| **R1** | **Pendente real** | `src/integration/operational-write-performance.js` ainda injeta política de autoridade de resultado/commit, entidades incrementais, refresh e reconciliação funcional. Performance ainda participa da semântica. |
| **R2A** | **Parcialmente absorvido** | #270 tornou o loader tolerante a falha isolada. Não reimplementar o loader antigo. |
| **R2B/R2C** | **Pendente real** | Persistem vários `setInterval()` usados como contrato de instalação/readiness em integrações. Remover somente polling de instalação quando existir sinal determinístico equivalente. |
| **R3** | **Materialmente atendido; fechamento formal pendente** | #276 implementou `operationKey`, identidade persistente, idempotência durável e `save_invoice_with_effects_v2`; repositório e pgTAP possuem regressões. Revalidar os critérios finais e encerrar como cumprido/no-op se não surgir lacuna concreta. |
| **R4** | **Pendente real** | `operational-projection.js` já possui data-base/próxima ação canônicas, mas `pendencias-view-model.js` ainda duplica `NEXT_ACTIONS` e cálculo de idade/espera. Unificar sem redesenhar a UI. |
| **R5** | **Pendente real** | RPC de delete retorna `deleted_invoice_id`/`deleted_asset_id`, mas o cliente não trata essas remoções como resultado autoritativo; save/remove normal ainda não completou a convergência incremental prevista. |
| **R6** | **Gate posterior** | Executar equivalência somente depois de R4/R5. Não criar diff se as superfícies forem equivalentes. |
| **R7** | **Pendente** | Há diagnóstico de escritas operacionais, mas a instrumentação causal completa do bootstrap prevista no plano não foi localizada como implementação fechada. Medir antes de otimizar. |
| **R8** | **Condicional** | Só executar otimização que R7 demonstrar. Sem gargalo material, encerrar como no-op documentado. |
| **R9** | **Pendente** | Este rebaseline inicia o fechamento documental, mas R9 só termina após R1–R8 estarem concluídos, formalmente absorvidos ou documentados como no-op. |

## 4. Sequência operacional vigente

A partir deste checkpoint, a ordem de trabalho é:

```text
rebaseline documental pós-#279
→ limpar PRs antigos/ambíguos
→ decidir e, se possível, instituir proteção da main
→ R1
→ R2
→ fechamento formal de R3
→ R4
→ R5
→ R6
→ R7
→ R8 somente se medição justificar
→ R9
→ reavaliar ADR-051 em frente separada
→ rebase/revalidação do PR #264 de dependências
```

Cada etapa deve obedecer `docs/reference/ENGINEERING_METHOD.md`: revalidar SHA, localizar autoridade real, tentar refutar a hipótese, mudança mínima, regressão executável e revisão adversarial proporcional.

## 5. PRs abertos que não definem a baseline

### PR #263

Continua Draft, baseado em `876c5976...`, com 80 commits e conflitos em relação à evolução posterior. Contém achados válidos de sua época, mas também premissas já resolvidas pelos PRs #265–#279. Não deve ser mergeado nem usado como `main` documental. Deve ser substituído por uma rota documental limpa baseada neste checkpoint e então fechado como superado.

### PR #264

É manutenção de dependências, não correção funcional. Sua validação original ocorreu sobre uma `main` anterior. Antes de integrar: rebasear sobre a `main` pós-R9/hardening conforme a ordem aprovada, repetir `npm ci`, `npm audit`, unitários, integração, Excel, E2E e gates proporcionais.

### PR #5

É uma frente histórica antiga. Reavaliar objetivamente e fechar como superada se não existir decisão atual de retomada.

## 6. Dívidas deliberadamente separadas

### ADR-051 — `registered_invoices`

Continua adiada até o fechamento funcional/R9. A consulta de Production confirma que os triggers atuais protegem histórico, normalização, auditoria e regras específicas, mas não existe proteção equivalente específica para imutabilidade de `id`, coerência de `verification_id` e canonicalização/proteção de `source_context_key`.

Não há evidência de corrupção atual. Tratar como hardening de integridade, não como novo bug do fluxo normal.

### Auth — leaked password protection

O advisor de segurança do Supabase reporta `auth_leaked_password_protection` como `WARN`. Tratar na frente de hardening, separada de R1–R9.

### Índices não usados

O advisor de performance lista índices sem uso observado. Não remover automaticamente. Só agir após medição de carga/consultas e contraprova de utilidade, pois `unused_index` é informação de observação, não defeito por si só.

## 7. Guardrails que permanecem vigentes

Preservar integralmente:

- análise/Pendência individual de NF por `registered_invoice_id`;
- bonificação de NF agregada e resumo técnico derivado;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente; legados legítimos não recebem backfill;
- `boleto_internet` é tipo de gasto dentro de Notas Fiscais em Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- Pendências são transversais à competência;
- bonificação, análise e Pendência são dimensões independentes;
- `Inventariada` é terminal;
- Production é fail-closed;
- commit remoto confirmado não autoriza repetir a escrita para recuperar estado local;
- comunicação oficial externa não usa o nome interno `RADAR PDDE`;
- layout aprovado de Prontuário/Pendências não deve ser redesenhado por plano histórico;
- Supabase CLI 2.116.0 permanece rejeitado enquanto a regressão documentada não for superada por nova homologação;
- Lighthouse continua usando três rodadas/mediana e thresholds vigentes.

## 8. Validade dos documentos anteriores

- `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md`: histórico de planejamento; critérios reutilizáveis, não fila automática.
- `docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`: evidência daquele SHA; hipóteses precisam de revalidação.
- `docs/audits/2026-09-06-pr272-inventory-auth-review.md`: evidência do checkpoint pós-#267; achados do candidato #272/#271 são históricos porque ambos foram posteriormente corrigidos e integrados.
- `docs/handoff/2026-09-04-estabilizacao-funcional-pr260.md`: checkpoint histórico da estabilização anterior aos hotfixes #265–#279.
- `docs/decisions/ADR-050-*`, `ADR-052-*` e demais ADRs vigentes: continuam decisões duradouras salvo substituição expressa.

## 9. Próxima ação após integrar este rebaseline

1. fechar/superseder PR #263;
2. reavaliar PR #5 e fechar se histórico;
3. tratar governança da `main`;
4. iniciar R1 em PR isolado, com TDD e revisão adversarial.

Nenhuma alteração funcional, migration, regra de negócio, dado institucional ou deploy é autorizada por este documento por si só.
