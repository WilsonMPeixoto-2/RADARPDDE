# Matriz campo × projeção — edição auditável de lançamentos

**Data:** 09/09/2026  
**Baseline funcional:** `main` em `6b40922afcd2793ad685c27994dc405d5d5aa141`  
**Branch:** `feat/edicao-lancamentos-auditavel`

## 1. Inventário de Nota Fiscal / despesa

O formulário canônico `form-dados-nota` possui quatro campos cadastrais efetivamente graváveis pelo usuário:

| Campo UI | Campo canônico | Regra de edição | Efeitos/projeções atuais |
|---|---|---|---|
| Descrição do Gasto (`nota-desc`) | `registered_invoices.desc` / `descricao` | Editável. Com histórico/Pendência mantém o mesmo ID e contexto. | Prontuário; Consulta Assessoria para serviço; texto do bem derivado quando permanente; formulários de edição; projeções que resolvam a invoice pelo ID. |
| Tipo de gasto (`nota-tipo`) | `registered_invoices.tipo` | Editável no fluxo comum sem histórico conforme contrato existente. **Com qualquer histórico de Pendência fica estruturalmente bloqueado**, pois pode alterar semântica, Assessoria e patrimônio. `a_identificar` não pode ser convertido por retificação. | Prontuário; Consulta Assessoria; Capital e Inventário; resumos derivados; regras de aplicabilidade. |
| Número / referência (`nota-numero`) | `registered_invoices.numero` | Editável. Opcional para `a_identificar`. Com Pendência mantém `registered_invoice_id`. | Prontuário; drawer/detalhe atual da Pendência por invoice; Consulta Assessoria; bem derivado (`notaFiscal`); rótulos atuais. |
| Valor (`nota-valor`) | `registered_invoices.valor` | Editável. Com Pendência mantém identidade/status. | Prontuário; drawer/detalhe atual da Pendência; Capital e Inventário quando permanente; demais projeções atuais por invoice. |

Campos estruturais não expostos como retificação comum e que permanecem imutáveis: ID/`registered_invoice_id`, escola, competência, programa, identidade da Pendência, tentativas e resultados históricos.

## 2. `a_identificar`

O registro utiliza os mesmos campos cadastrais do formulário fiscal, com as seguintes especializações:

- `tipo` permanece obrigatoriamente `a_identificar` durante a retificação;
- descrição, referência/número opcional e valor podem ser corrigidos;
- análise permanece `Incorreto`;
- a mesma Pendência permanece ativa;
- identificação posterior continua exclusivamente em **Pendências → Registrar novo envio**;
- exclusão continua bloqueada quando há histórico.

## 3. Pendência

O drawer atual já expõe retificação de dados descritivos das Pendências documentais por `PendencyService.updateDetails()`:

| Campo atual | Campo canônico | Regra |
|---|---|---|
| Motivo / erro | `motivo` + `errosAtuais` | Editável sem alterar status. Para documental respeita catálogo `DOCUMENT_ERROR_TYPES`. |
| Observação | `observacao` | Editável sem alterar status. |

Pendências manuais/operacionais também possuem `item`, `motivo`, `responsavel` e `observacao` no cadastro. Nesta entrega a retificação transversal deve preservar contexto/status/histórico e, quando a superfície de edição disponibilizar esses campos, refletir o estado atual em cartões, detalhe/drawer e filtros que os consumam.

## 4. Projeções que devem usar estado atual

| Projeção | Fonte correta após retificação | Observação |
|---|---|---|
| Prontuário / bloco Notas Fiscais | `registeredInvoices` por ID | Atualização imediata após `save`. |
| Consulta Assessoria | invoice de serviço atual | Descrição/número e metadados atuais devem refletir retificação. |
| Capital e Inventário | invoice + asset vinculado | `planInvoiceEffects` já reconcilia descrição, valor e NF no bem derivado. |
| Drawer/detalhe de Pendência fiscal | invoice atual por `registeredInvoiceId` | `pendencyDrawerDocumentMeta()` já prioriza `notasRegistradas`; `documentSnapshot` é apenas fallback histórico/legado. |
| Fila/cartões de Pendências | agregado + invoice atual quando houver vínculo individual | Não deve transformar `documentSnapshot` em fonte atual quando invoice existir. |
| Formulário Editar | invoice atual | Deve abrir também com Pendência ativa e para `a_identificar`. |
| Histórico/timeline | evento/snapshot histórico + novo evento de retificação | Eventos anteriores não são reescritos. |

## 5. Invariantes de regressão

1. Editar dados cadastrais não cria novo lançamento.
2. Editar não cria, resolve, cancela ou muda status da Pendência.
3. Novo envio e reanálise continuam os únicos caminhos de regularização.
4. `registered_invoice_id` permanece estável.
5. Tipo de gasto não muda quando existir histórico de Pendência.
6. `a_identificar` permanece `a_identificar` até `Registrar novo envio`.
7. Exclusão com histórico continua bloqueada.
8. Análise técnica continua bloqueada por Pendência ativa fora do fluxo próprio.
9. Descrição, número/referência e valor corrigidos devem aparecer em todas as projeções de estado atual que os exibem.
10. Para bem permanente, descrição, número e valor do asset vinculado acompanham a retificação da invoice pelo planner canônico.
