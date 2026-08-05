# Decisões de produto do RADAR PDDE — índice histórico

**Classificação:** referência histórica substituída  
**Fonte vigente:** [`../DECISION_LOG.md`](../DECISION_LOG.md)  
**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

Preservar os identificadores legados `PD-*`, `PS-*`, `PV-*` e `PG-*`. Este arquivo não controla o estado atual.

Usar, nesta ordem:

1. código e ambientes efetivos;
2. [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
3. [`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md);
4. [`../DECISION_LOG.md`](../DECISION_LOG.md);
5. contratos vigentes.

## 2. Decisões de domínio

| ID | Conteúdo | Estado | Fonte vigente |
|---|---|---|---|
| PD-001 | escola como entidade monitorada | vigente | contexto do projeto |
| PD-002 | bonificação, análise e pendência independentes | vigente | avaliação mensal |
| PD-003 | novo envio não resolve | vigente | pendências |
| PD-004 | reanálise positiva resolve e negativa reabre | vigente | pendências |
| PD-005 | pendência não altera bonificação automaticamente | vigente | avaliação mensal |
| PD-006 | retificação preserva estados independentes | vigente | retificações |
| PD-007 | Aberta e Aguardando reanálise são ativas | vigente | pendências |
| PD-008 | não existe estado canônico Vencida | vigente | pendências |
| PD-009 | indicadores podem se sobrepor | vigente | estatísticas |
| PD-010 | regularização não reescreve histórico | vigente | avaliação mensal |
| PD-011 | notas e bens possuem regras próprias | vigente | serviços e Supabase |

## 3. Persistência

| ID | Decisão antiga | Estado | Sucessora |
|---|---|---|---|
| PS-001 | Production em LocalStorage | substituída | ADR-023 |
| PS-002 | Supabase não implantado | substituída | ADR-023 |
| PS-003 | Auth/RLS como etapa futura | substituída | ADR-023 |
| PS-004 | segredo administrativo fora do frontend | vigente | ADR-008 e ADR-023 |
| PS-005 | migração com cópia, reconciliação e rollback | vigente | ADR-012 e ADR-034 |
| PS-006 | modo local sem requisição remota | vigente no adaptador local | runtime |
| PS-007 | banco vazio não autoriza seed implícito | vigente | ADR-012 |
| PS-008 | Local e Supabase compartilham contrato | vigente | ADR-001 |

Estado atual:

```text
Production: SupabaseRepository
LocalStorageRepository: desenvolvimento e contingência por novo build
```

## 4. Visual, navegação e exportação

| ID | Conteúdo | Estado | Fonte |
|---|---|---|---|
| PV-001 | mudança material exige proposta e aprovação | vigente | ADR-030 |
| PV-002 | preservar informações, ações e permissões | vigente | ADR-017 |
| PV-003 | Carteira mobile reorganizada sem perda | vigente | frontend |
| PV-004 | Excel v2.1 congelado | substituída | ADR-028 |
| PV-005 | superfícies conectadas | vigente e ampliada | ADRs 025, 027 e 029 |
| PV-006 | modais controlam foco e teclado | vigente | estratégia de testes |
| PV-007 | polimento não empobrece o domínio | vigente | ADR-030 |

Exportações atuais:

- relatório institucional XLSX de quatro abas;
- Excel SME mensal com 27 colunas A:AA;
- CSV secundário e fallback institucional;
- Excel SME homologado no Microsoft Excel desktop;
- relatório institucional mantém gate humano próprio quando priorizado.

## 5. Governança

| ID | Conteúdo | Estado | Fonte |
|---|---|---|---|
| PG-001 | auditar antes de alterar | vigente | ADRs 015 e 042 |
| PG-002 | classificar achados | vigente quando aplicável | `CHANGE_CLASSIFICATION.md` |
| PG-003 | dúvida material submetida após verificação | vigente | `AGENTS.md` |
| PG-004 | merge e Production são autorizações distintas | vigente | ADRs 003 e 031 |
| PG-005 | não alterar pode ser resultado válido | vigente | governança |

## 6. Decisões posteriores

Sem ID legado:

- carteira como responsabilidade principal — ADR-021;
- governança da SME — ADR-022;
- Supabase canônico — ADR-023;
- documentação segue ambientes — ADR-024 e ADR-042;
- competência global — ADR-025;
- timeline como projeção — ADR-027;
- certificação Excel — ADR-028;
- navegação contextual — ADR-029;
- gate cumulativo — ADR-031;
- histórico SME reconciliado — ADR-034;
- Node 24 e gate remoto — ADR-035;
- backup/restauração — ADR-036;
- integridade de workflows — ADR-037;
- atualizações intencionais — ADR-038;
- evolução tecnológica proativa — ADR-039;
- monitor e incidentes de Production — ADR-040;
- confiabilidade funcional ponta a ponta — ADR-041;
- reconciliação documental remota — ADR-042.

## 7. Regra de manutenção

Não adicionar novas decisões aqui. Registrar em `docs/DECISION_LOG.md` e, quando necessário, em ADR próprio.
