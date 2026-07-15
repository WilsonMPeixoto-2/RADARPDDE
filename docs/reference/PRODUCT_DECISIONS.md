# Decisões de produto do RADAR PDDE

## Finalidade

Este registro funciona como índice de decisões consolidadas. Ele não substitui o Dossiê, o Plano do Lote 2, os relatórios vigentes, o código nem os testes; aponta as fontes que devem ser lidas antes de qualquer alteração.

## Precedência

1. orientação expressa mais recente do responsável;
2. relatório atual de execução;
3. Dossiê Consolidado v1.0;
4. Plano do Lote 2 v2.0;
5. especificação e plano vigentes;
6. implementação vigente.

## Domínio

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PD-001 | A unidade escolar é a entidade monitorada. | `docs/README.md` | nova determinação institucional |
| PD-002 | Bonificação, análise técnica e pendência são dimensões independentes. | `README.md`; Dossiê | nova regra institucional |
| PD-003 | Novo envio não resolve pendência. | `README.md` | alteração expressa do fluxo |
| PD-004 | Reanálise positiva resolve; reanálise negativa reabre a providência. | `README.md` | alteração expressa do fluxo |
| PD-005 | Pendência não altera automaticamente bonificação. | `docs/README.md` | nova regra institucional |
| PD-006 | Retificação não altera automaticamente análise ou pendência. | `docs/README.md` | nova regra institucional |
| PD-007 | `Aberta` e `Aguardando reanálise` são estados ativos. | `docs/README.md` | mudança expressa do modelo |
| PD-008 | Não existe estado canônico `Vencida`. | `docs/README.md` | mudança expressa do modelo |
| PD-009 | Indicadores operacionais podem se sobrepor e não devem ser somados. | `docs/README.md` | redefinição formal dos universos |
| PD-010 | A regularização posterior não reescreve automaticamente a bonificação histórica. | `README.md` | nova regra institucional |
| PD-011 | Notas e bens consolidados possuem regras específicas de alteração por perfil. | `tests/e2e/functional-core.spec.js` | nova regra aprovada |

## Persistência e Supabase

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PS-001 | Produção permanece em `localStorage` até autorização expressa. | Plano Diretor; PR 22 | autorização de ativação |
| PS-002 | Supabase remoto ainda não está implantado. | `README.md` | projeto remoto conectado |
| PS-003 | Auth/RLS remotos são etapa futura, não defeito do gate local. | Plano Diretor | execução do Ciclo F |
| PS-004 | Segredos administrativos nunca entram no frontend, GitHub ou logs. | `README.md` | decisão não reabrível |
| PS-005 | Migração remota exige cópia controlada, reconciliação e rollback. | runbook de migração | novo desenho aprovado |
| PS-006 | O modo local não pode emitir requisições ao Supabase. | PR 22; testes de readiness | autorização e configuração remotas válidas |
| PS-007 | Banco remoto vazio não autoriza seed automático de dados locais. | PR 22; serviços de bootstrap | nova estratégia formalmente aprovada |
| PS-008 | Local e Supabase devem obedecer ao mesmo contrato funcional. | cobertura funcional do PR 22 | alteração de arquitetura aprovada |

## Visual, navegação e exportação

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PV-001 | Alteração material de layout exige proposta visual e aprovação. | Plano Diretor | decisão não reabrível |
| PV-002 | Melhorias preservam informação, ações, permissões e regras. | `STATUS_DOCUMENTOS.md` | decisão expressa por pacote |
| PV-003 | Carteira mobile usa cartões; tabela desktop é a referência atual. | `README.md` | auditoria e proposta aprovadas |
| PV-004 | Exportação Excel v2.1 é referência congelada. | `STATUS_DOCUMENTOS.md` | plano autônomo aprovado |
| PV-005 | Dashboard, Carteira, Pendências, Competências e Prontuário formam um fluxo conectado. | `README.md`; E2E de navegação contextual | nova arquitetura aprovada |
| PV-006 | Modais devem controlar foco, Escape, teclado e retorno ao acionador. | testes de acessibilidade | substituição equivalente aprovada |
| PV-007 | Melhorias visuais não podem empobrecer o modelo de domínio para reduzir densidade. | Plano Diretor | decisão expressa do responsável |

## Governança e manutenção

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PG-001 | Toda alteração deve ser precedida de auditoria específica do estado atual. | Plano Diretor | decisão não reabrível |
| PG-002 | Achados são classificados em `CP`, `ID`, `FA`, `IC`, `DC`, `DQ`, `DF` ou `EP`. | Plano Diretor | revisão formal do método |
| PG-003 | Dúvida material de produto ou regra deve ser submetida ao responsável. | Plano Diretor | decisão não reabrível |
| PG-004 | Merge e produção são autorizações distintas. | Plano Diretor | decisão não reabrível |
| PG-005 | A ausência de alteração é resultado válido quando o estado atual já é adequado. | Plano Diretor | decisão não reabrível |

## Regra de manutenção

Uma decisão só pode ser alterada quando o PR indicar o ID afetado, apresentar a nova fonte de autoridade, explicar a consequência e registrar a decisão substituta. Decisões superadas devem permanecer no histórico com status e referência à sucessora.
