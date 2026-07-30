# Decisões de produto do RADAR PDDE — índice histórico

**Classificação:** referência histórica substituída  
**Fonte decisória vigente:** [`../DECISION_LOG.md`](../DECISION_LOG.md)  
**Atualizado em:** 29 de julho de 2026

## 1. Finalidade

Este arquivo preserva a existência dos antigos identificadores `PD-*`, `PS-*`, `PV-*` e `PG-*`, usados em fases anteriores do projeto.

Ele **não controla mais o estado atual**. Algumas decisões originais foram cumpridas, outras substituídas após a ativação do Supabase e a conclusão dos Ciclos 1 a 5.

Para qualquer implementação, usar:

1. código e ambientes efetivos;
2. [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
3. [`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md);
4. [`../DECISION_LOG.md`](../DECISION_LOG.md);
5. contratos de arquitetura vigentes.

## 2. Mapeamento das decisões de domínio

| ID legado | Conteúdo preservado | Estado atual | Fonte vigente |
|---|---|---|---|
| PD-001 | unidade escolar como entidade monitorada | vigente | `PROJECT_CONTEXT.md` |
| PD-002 | bonificação, análise técnica e pendência independentes | vigente | ADR-025 e `avaliacao-mensal.md` |
| PD-003 | novo envio não resolve pendência | vigente | `PROJECT_CONTEXT.md` |
| PD-004 | reanálise positiva resolve; negativa reabre | vigente | `PROJECT_CONTEXT.md` |
| PD-005 | pendência não altera automaticamente bonificação | vigente | `avaliacao-mensal.md` |
| PD-006 | retificação não altera automaticamente análise ou pendência | vigente | `retificacoes.md` |
| PD-007 | Aberta e Aguardando reanálise são estados ativos | vigente | `avaliacao-mensal.md` |
| PD-008 | não existe estado canônico Vencida | vigente | contratos de pendência |
| PD-009 | indicadores podem se sobrepor | vigente | `estatisticas.md` |
| PD-010 | regularização não reescreve bonificação histórica | vigente | `avaliacao-mensal.md` |
| PD-011 | notas e bens possuem regras próprias | vigente | serviços, RLS e testes |

## 3. Mapeamento das decisões de persistência

| ID legado | Decisão antiga | Estado atual | Sucessora |
|---|---|---|---|
| PS-001 | Production permanecia em LocalStorage até autorização | cumprida e substituída | ADR-023 — Production usa Supabase |
| PS-002 | Supabase remoto ainda não implantado | substituída | ADR-023 |
| PS-003 | Auth/RLS remotos eram etapa futura | substituída | ADR-023 e `supabase-readiness.md` |
| PS-004 | segredos administrativos nunca entram no frontend | vigente | ADR-008 e ADR-023 |
| PS-005 | migração exige cópia, reconciliação e rollback | vigente | ADR-012 e ADR-033 |
| PS-006 | modo local não emite requisição Supabase | vigente para modo local | contrato de runtime |
| PS-007 | banco vazio não autoriza seed implícito | vigente | ADR-012 |
| PS-008 | Local e Supabase obedecem ao mesmo contrato funcional | vigente | ADR-001 |

Estado atual:

```text
Production: supabase-production
repositório canônico: SupabaseRepository
LocalStorageRepository: contingência por novo build
```

## 4. Mapeamento visual, navegação e exportação

| ID legado | Conteúdo | Estado atual | Fonte vigente |
|---|---|---|---|
| PV-001 | alteração material de layout exige proposta e aprovação | vigente | ADR-030 |
| PV-002 | preservar informação, ações e permissões | vigente | ADR-017 e ADR-030 |
| PV-003 | Carteira mobile usa cartões | vigente | contratos de frontend |
| PV-004 | Excel v2.1 era referência congelada | substituída pela implementação certificada | ADR-028 e contratos Excel |
| PV-005 | superfícies formam fluxo conectado | vigente e ampliada | ADR-025, ADR-027 e ADR-029 |
| PV-006 | modais controlam foco e teclado | vigente | estratégia de testes e acessibilidade |
| PV-007 | polimento não empobrece o domínio | vigente | ADR-030 |

Estado atual das exportações:

- botão principal institucional: XLSX de quatro abas;
- botão próprio: Excel SME mensal;
- botão secundário: CSV legado;
- certificação automatizada: concluída;
- homologação manual no Excel desktop: pendente.

## 5. Mapeamento de governança

| ID legado | Conteúdo | Estado atual | Fonte vigente |
|---|---|---|---|
| PG-001 | auditar estado antes de alterar | vigente | ADR-015 e ADR-024 |
| PG-002 | classificação de achados | método histórico; usar quando aplicável | `CHANGE_CLASSIFICATION.md` |
| PG-003 | dúvida material submetida ao responsável | vigente após verificação técnica | `AGENTS.md` |
| PG-004 | merge e Production são autorizações distintas | vigente | ADR-003 e ADR-031 |
| PG-005 | ausência de alteração pode ser resultado válido | vigente | governança de manutenção |

## 6. Novas decisões sem ID legado

As fases posteriores acrescentaram decisões que não existiam neste índice:

- carteira como responsabilidade principal, não limite entre Controladores da mesma CRE — ADR-021;
- governança restritiva da Gestão SME — ADR-022;
- Supabase canônico em Production — ADR-023;
- documentação acompanha código e ambientes — ADR-024;
- competência global única — ADR-025;
- competências de 2026 operacionalizadas — ADR-026 e ADR-032;
- timeline como projeção — ADR-027;
- certificação Excel integral — ADR-028;
- navegação contextual — ADR-029;
- polimento sem alteração de produto — ADR-030;
- gate cumulativo de release — ADR-031;
- bloqueio de migration por divergência SME — ADR-033.

## 7. Regra de manutenção

Não adicionar nova decisão a este arquivo.

Toda decisão nova ou substituição deve ser registrada em `docs/DECISION_LOG.md`, com:

- status;
- contexto;
- decisão;
- consequência;
- sucessora ou decisão substituída;
- referência técnica.

Os IDs legados permanecem apenas para rastreabilidade histórica.
