# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 23 de agosto de 2026  
**Classe documental:** Canônico — estado corrente e retomada futura  
**Situação:** PR #193 integrado e publicado; frente pós-merge limitada a documentação de continuidade e instrumentação local no PR #194

## 1. Fonte de verdade

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. schema, migrations, Auth, RLS, RPCs, Edge Functions e dados efetivos do Supabase;
3. deployment efetivamente publicado na Vercel e seu manifesto;
4. decisões de negócio vigentes;
5. testes que representam o contrato atual;
6. documentação canônica;
7. auditorias, planos e handoffs históricos.

Nenhum documento ou teste antigo prevalece sobre código e ambiente atuais.

O checkpoint detalhado de continuidade está em [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md).

## 2. Baseline pós-PR #193 confirmado no remoto

```text
Main pós-merge do PR #193:
70a63f5cf53ed2dbb1e8d3ab54dd194f7082a576

Vercel Production de referência:
dpl_6BwhhzJDEbUDrQpMptVCRxuRcLbk
estado: READY
target: production
SHA: 70a63f5cf53ed2dbb1e8d3ab54dd194f7082a576

Alias oficial: radarpdde-fix.vercel.app
Supabase Production: scnryinorqeucbfkioxo
Migrations canônicas confirmadas: 41
```

Esse é o **baseline funcional pós-PR #193**. O PR #194 parte exatamente desse SHA e adiciona documentação/instrumentação sem migration ou mudança de regra de negócio. Em retomada futura, conferir a `main` e Production ao vivo para saber se o PR #194 já foi integrado ou se houve mudanças posteriores.

## 3. Estado executivo

O RADAR PDDE permanece **apto para uso real** no baseline pós-PR #193.

A sequência #190–#193 resolveu uma frente específica de latência, consistência incremental e integridade de transições antes do uso operacional real:

- #190 removeu leituras remotas redundantes no fluxo crítico de avaliação mensal;
- #191 generalizou com cautela as políticas de retorno/commit autoritativos e corrigiu transição de bens/NF;
- #192 eliminou `renderProntuario()` integral do caminho normal de sucesso após auditoria externa;
- #193 consolidou idempotência, transições condicionais, Assessoria individual por NF, pendências vinculadas, datas de disponibilização e equivalência entre persistência e UI incremental.

O sistema mantém:

- Supabase Production como backend institucional canônico;
- autenticação, perfis, escopos e RLS ativos;
- operações críticas protegidas e auditadas;
- Production fail-closed;
- dados reais preservados;
- nenhuma escrita destrutiva de teste em Production durante a estabilização final;
- reconciliação incremental como caminho normal das escritas inline.

## 4. Contratos mais importantes para retomada

### Competência global

`RadarCompetenceContext` permanece fonte canônica do mês.

### Pendências Operacionais

Pendências são passivo transversal e não são filtradas automaticamente pela competência global. A página abre em **Todas as competências**; filtro local é opcional.

Documento: [`decisions/ADR-044-pendencias-passivo-transversal.md`](decisions/ADR-044-pendencias-passivo-transversal.md).

### Production fail-closed

Production não pode cair silenciosamente para LocalStorage/seed quando Supabase falhar ou estiver mal configurado.

Documento: [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md).

### Avaliação mensal e idempotência

- competência futura: visível, porém não editável;
- bonificação, análise técnica e pendência são dimensões distintas;
- operação semanticamente idêntica não deve gerar nova RPC, `row_version` ou log;
- `bonus_result` ausente preserva o valor; valor explicitamente vazio limpa quando o contrato da operação determina;
- N/A → Sim/Não reinicializa derivações incompatíveis, incluindo análise de NF para `Não analisado` quando aplicável.

### Nota Fiscal de serviço e Assessoria

- análise de Assessoria é individual por NF;
- `Incorreto` + abertura de pendência é operação atômica;
- pendência de Assessoria referencia a NF por `registered_invoice_id`;
- NFs diferentes podem ter pendências ativas simultâneas; a mesma NF não duplica pendência ativa equivalente;
- reanálise altera apenas a NF vinculada e depois recalcula o resumo mensal;
- histórico de pendência protege a identidade estrutural necessária à rastreabilidade da NF.

### Datas de envio corretivo

`available_at` é a data em que o documento ficou disponível pela escola. `submitted_at` é a data de lançamento no RADAR. Não confundir nem colapsar os dois campos.

### Reabertura

PEND-05 permite reabrir `Resolvida` e `Cancelada` para `Aberta` quando o contrato de reabertura for satisfeito, preservando histórico.

### Desativação de Controlador

Transferir todas as escolas primeiro. Somente com carteira zerada é permitido desativar. Desativação não redistribui escolas e preserva histórico.

## 5. Arquitetura de escrita pós-#192/#193

Caminho normal:

```text
interação
→ feedback imediato
→ persistência/RPC
→ retorno autoritativo
→ incorporação incremental
→ reconciliador localizado
→ estado visual estável
```

`renderProntuario()` completo fica restrito a bootstrap, navegação, erro, retorno incompleto ou inconsistência que não possa ser reconciliada com segurança.

Não reintroduzir rerender integral depois de cada sucesso “por segurança”.

## 6. Migrations relevantes da estabilização

PR #191:

```text
20260822040642_invoice_asset_transition_integrity
```

PR #193:

```text
20260823003500_invoice_bonus_result_clear_semantics
20260823010000_pendency_attempt_availability
20260823032000_service_advisory_pendency_invoice
20260823045000_service_advisory_corrective_submission
20260823050000_delete_invoice_bonus_result_clear_semantics
```

Total canônico confirmado no Supabase Production em 23/08: **41 migrations**.

## 7. Ferramentas de qualidade atuais

Consultar sempre `package.json` ao vivo. No estado pós-PR #193, além dos gates anteriores:

- `fast-check` está integrado a testes de propriedades;
- MSW está integrado a testes de falhas/latência/retornos remotos;
- `dependency-cruiser` está integrado a `check:architecture` e ao readiness;
- Performance API/diagnóstico operacional possui base criada no PR #193 e integração runtime concluída na branch do PR #194.

A instrumentação do PR #194 é local, efêmera e fail-open. Quando integrada à `main`, a consulta técnica fica disponível por:

```javascript
window.RadarOperationalWriteMetrics.snapshot()
window.RadarOperationalWriteMetrics.summary()
```

Ela não envia telemetria, não persiste métricas e não coleta dados de negócio.

## 8. Vulnerabilidades conhecidas de dependências

O `npm audit` continua apontando duas vulnerabilidades **moderadas** na cadeia ExcelJS/UUID.

Decisão vigente em 23/08:

- risco conscientemente aceito no momento;
- nenhuma atualização forçada;
- nenhum `npm audit fix --force`;
- nenhuma troca de ExcelJS apenas para zerar o relatório;
- acompanhar versões futuras compatíveis e reavaliar se exposição/severidade mudar.

O gate atual permanece bloqueando vulnerabilidades `high` ou superiores.

## 9. Mobile

A otimização mobile não foi critério bloqueante da estabilização urgente de 22–23/08. Não reabrir essa prioridade por inércia de um plano/teste histórico. Retomar mediante defeito real, nova prioridade ou decisão explícita.

## 10. Histórico documental

O snapshot de 18/08 permanece válido **como registro histórico daquele fechamento**, não como estado corrente:

- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md)

O checkpoint de 23/08 substitui o de 18/08 como porta de entrada para continuidade:

- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md)

## 11. Gatilhos para nova frente

Retomar desenvolvimento quando houver:

1. defeito reproduzível;
2. nova funcionalidade ou regra de negócio;
3. alteração material de Supabase/Auth/RLS/schema;
4. risco de segurança materialmente alterado;
5. problema de desempenho com impacto real;
6. exigência institucional;
7. auditoria/release expressamente solicitados.

Não transformar preferência de ferramenta ou documento histórico em requisito de produto sem evidência atual.

## 12. Ordem de leitura numa retomada

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/handoff/2026-08-23-post-pr-193.md`;
4. `docs/superpowers/specs/2026-08-22-estabilizacao-avaliacoes-reais-design.md`;
5. `docs/superpowers/specs/2026-08-23-continuity-instrumentation-post-pr193-design.md`;
6. `docs/DECISION_LOG.md`;
7. `docs/PROJECT_CONTEXT.md`;
8. `docs/reference/TEST_GOVERNANCE.md`;
9. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
10. arquitetura/runbook diretamente relacionado à tarefa.

## 13. Regra de retomada

Antes de alterar código:

- confirmar SHA atual da `main`;
- confirmar manifesto/deployment de Production;
- conferir Supabase/migrations quando relevante;
- verificar se PR #194 ou PRs posteriores mudaram o baseline;
- trabalhar em branch isolada;
- testar proporcionalmente ao risco;
- não modificar produto apenas para satisfazer teste histórico superado.
