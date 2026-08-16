# Plano de implementação — Despesa a identificar

**Data:** 16/08/2026  
**Branch:** `feat/despesa-a-identificar-20260816`  
**Base:** `39eddbf52c50f9791339f6c5ce1598139ad3338a`

## Objetivo

Permitir registrar uma saída observada no extrato bancário antes de a escola apresentar documentação suficiente para definir a natureza do gasto ou informar o número da Nota Fiscal.

## Contrato funcional

- novo tipo canônico `a_identificar`;
- descrição, valor, escola, competência e programa continuam obrigatórios;
- número da NF é opcional somente para `a_identificar`;
- `consumo`, `permanente` e `servico` continuam exigindo número da NF;
- `a_identificar` não cria bem patrimonial e não aciona Assessoria Contábil;
- ao editar para `permanente` ou `servico`, os efeitos normais passam a ser aplicados;
- uma despesa `a_identificar` não conta como NF válida para liberar análise técnica de Notas Fiscais;
- banco grava ausência real como `NULL`, sem placeholders como `SEM-NÚMERO`.

## Banco

Alterar `registered_invoices` de forma retrocompatível:

1. permitir `invoice_number IS NULL`;
2. incluir `a_identificar` no check de `expense_type`;
3. adicionar contrato que exija número não vazio para os três tipos identificados;
4. atualizar `save_invoice_with_effects` para preservar `NULL` em `a_identificar` e nunca inventar número.

A migration será aplicada em Production antes da publicação do frontend porque é expansiva e compatível com a versão atual.

## Aplicação e UX

- `InvoiceService`: validação condicional, auditoria própria e transições de tipo;
- ponte de estado: `NULL` ↔ string vazia na UI sem perda semântica;
- Prontuário/modal: opção “A identificar”, indicação clara de documentação pendente e número opcional apenas nesse estado;
- botão específico para registrar despesa a identificar quando a NF ainda não foi entregue, sem liberar cadastro normal de NF indevidamente.

## Testes

RED → GREEN para:

- cadastro sem número;
- tipos normais sem número rejeitados;
- ausência de bem e Assessoria;
- conversão para permanente/serviço;
- despesa não identificada não satisfaz requisito de NF;
- round-trip Supabase com `invoice_number = NULL`;
- E2E do modal e do Prontuário.
