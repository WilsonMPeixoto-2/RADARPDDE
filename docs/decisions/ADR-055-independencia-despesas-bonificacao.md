# ADR-055 — Despesas e bonificação são fluxos operacionais independentes

**Status:** Aprovada para implementação no PR corrente

## Contexto

O Prontuário possuía um acoplamento histórico entre o ciclo de despesas e o ciclo de bonificação. A interface e o `InvoiceService` tratavam o valor de `bonification.notaFiscal` e a existência de `bonus_result` como pré-condições de autorização para cadastrar, editar ou excluir despesas e para algumas operações derivadas.

Esse acoplamento produzia dois comportamentos incompatíveis com o contrato funcional atual:

1. Controlador podia perder ações de despesa porque a bonificação estava consolidada ou porque Notas Fiscais não estava marcada como `Sim`;
2. operações de despesa executadas pela Assistente podiam limpar `bonus_result` e “reabrir” a consolidação como efeito colateral.

A autorização funcional da matriz `INV-01` a `INV-04` já é definida por perfil/capacidade e pelas regras próprias do registro, não pelo estado da bonificação.

## Decisão

O ciclo operacional de despesas é independente do ciclo de bonificação.

Para perfis autorizados:

- cadastrar Nota Fiscal/despesa;
- cadastrar `a_identificar`;
- editar ou excluir quando as regras próprias do registro permitirem;
- analisar documento fiscal individual;
- operar Consulta Assessoria;
- abrir/acompanhar Pendência fiscal;
- registrar novo envio e reanalisar;

não depende de `bonification.notaFiscal` estar vazio, `Sim`, `Não` ou `Não se aplica`, nem de `bonus_result` estar consolidado.

Operações de despesa **não alteram nem limpam `bonus_result`**.

A edição da própria bonificação continua separada e submetida às regras de `VerificationService`, inclusive restrições pós-consolidação e retificação auditável.

## Contexto mensal da primeira despesa

`registered_invoices.verification_id` continua sendo vínculo estrutural obrigatório com escola, competência e programa.

Se a primeira despesa for criada antes de qualquer ação de bonificação, a operação composta materializa a linha mínima de `verifications` na mesma transação e aplica a projeção técnica canônica. Isso:

- não marca `Sim`, `Não` ou `Não se aplica`;
- não cria `bonus_result`;
- não representa início lógico da bonificação;
- não cria uma segunda ação ou log administrativo;
- preserva atomicidade e concorrência otimista do fluxo de despesa.

A identificação de bonificação `não lançada`/`em apuração` considera os lançamentos manuais, não as projeções `consAssessoria`/`encampInventario` criadas pela despesa. O resultado consolidado existente continua prevalecendo; as projeções continuam participando da avaliação canônica quando a própria bonificação for consolidada. Na primeira materialização remota, escopo de escrita escolar não substitui capacidade efetiva de despesa.

## Regras que permanecem

A independência não remove proteções próprias do domínio:

- capacidade do perfil e escopo da escola;
- contexto escola/competência/programa;
- `row_version` e idempotência;
- elegibilidade de Boleto Internet para Educação Conectada;
- Pendência ativa e histórico individual;
- regras de `a_identificar`;
- integridade de Consulta Assessoria;
- regras patrimoniais e estado terminal Inventariada.

## Consequências

- controles de bonificação podem permanecer bloqueados após consolidação enquanto as ações de despesa continuam disponíveis;
- retificar a própria bonificação e retificar uma despesa são operações diferentes;
- testes que exigiam `Sim` ou bonificação aberta para autorizar despesa deixam de representar o contrato;
- planos históricos que registram a regra anterior permanecem como histórico e não devem ser reescritos.

## Implementação de referência

- `app.js`;
- `src/domain/fluxo-operacional.js`;
- `src/application/invoice-service.js`;
- `src/domain/invoice-effects.js`;
- `src/application/pendency-service.js`;
- `src/integration/unidentified-expense-ux.js`;
- `src/integration/prontuario-conditional-reconciler.js`;
- `src/integration/service-advisory-pendency.js`;
- `src/integration/auditable-retification.js`;
- `supabase/migrations/20260929213000_expense_bonification_independence.sql`.
- `src/data/supabase-repository.js`: os RPCs especializados de despesa omitem `bonus_result`; a RPC própria de bonificação conserva sua capacidade de reabertura explícita.
- `supabase/migrations/20260930003000_expense_verification_field_ownership.sql`: nos helpers existentes de salvar/excluir despesa, o merge preserva marcações manuais e consolidação; somente análise fiscal/Assessoria/Inventário e projeções operacionais são atualizadas. Na reanálise genérica, essa restrição vale para Pendência vinculada à NF, preservando o contrato dos demais documentos.

O arquivo de migration anterior permanece intacto. Como a aplicação compartilhada não foi comprovada nesta rodada, a correção usa uma versão posterior; nenhum estado remoto pode ser deduzido da contagem de arquivos. Evidências do candidato e limites de publicação ficam no [handoff do PR #397](../handoff/2026-09-30-pr397-independencia-despesas-bonificacao.md).
