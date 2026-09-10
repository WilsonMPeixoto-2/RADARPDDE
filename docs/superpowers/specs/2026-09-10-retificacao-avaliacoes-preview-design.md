# Retificação auditável de avaliações — especificação de design

**Data:** 10/09/2026  
**Baseline:** `main` em `e320fec1f4f08c9b25b133c46e014bcebfbdd00d`  
**Branch:** `feat/retificacao-avaliacoes-preview-20260910`  
**Ambiente de homologação:** Preview. Production e `main` permanecem intocados até aprovação explícita.

## 1. Objetivo

Ampliar a edição auditável já incorporada pelo PR #295 para as avaliações e para os dados cadastrais das Pendências, sem transformar retificação de erro operacional em atalho para regularização documental.

## 2. Regras funcionais aprovadas

1. Ações de edição devem ser explícitas e visíveis, com confirmação por **Salvar edição**.
2. Todo campo originalmente informado pelo usuário e semanticamente retificável deve poder ser corrigido, preservadas identidade, contexto, permissões, concorrência e histórico.
3. Bonificação `Sim`, `Não` ou `Não se aplica` pode ser desfeita para estado neutro quando a regra do item permitir. O histórico registra a ação **Avaliação desfeita**, com valor anterior e estado resultante.
4. A análise técnica pode ser corrigida quando o valor armazenado decorreu de erro do operador.
5. Corrigir a análise técnica **não** substitui correção documental. Quando a escola apresenta documento novo/corrigido, permanece obrigatório o fluxo **Registrar novo envio → Reanalisar**.
6. Se um `Incorreto` lançado por engano tiver aberto Pendência e o operador corrigir essa avaliação, a operação exige confirmação explícita e cancela a Pendência relacionada com o motivo **cancelada por retificação da avaliação**, preservando integralmente histórico, tentativas e identidade.
7. A correção da avaliação não apaga eventos anteriores e não fabrica novo envio, tentativa ou reanálise.
8. Pendências manuais podem ter seus campos cadastrais informados pelo usuário retificados, inclusive item, motivo, responsável e observação, sem alterar status ou eventos históricos.
9. Pendências documentais mantêm a edição dos campos cadastrais atualmente permitidos; status, tentativas, contexto e identidade não são editáveis por esse fluxo.
10. Autoridade continua baseada nas permissões/capacidades já vigentes para a escola e a operação. Não existe regra de “somente o autor pode editar”. Esta frente não amplia perfis nem escopos de acesso.

## 3. Segurança semântica

A operação ordinária `setTechnicalAnalysis()` continua protegendo o contrato atual. Em especial, `Incorreto` continua exigindo abertura atômica de Pendência e uma Pendência ativa continua bloqueando alteração técnica ordinária.

A correção de erro do operador deve usar um comando explícito de retificação, separado do fluxo ordinário, para que seja possível exigir confirmação, produzir auditoria própria e distinguir semanticamente retificação de reanálise.

## 4. Bonificação desfeita

Quando uma bonificação não derivada for desfeita:

- o valor volta ao estado neutro;
- a análise técnica correspondente volta para `Não analisado` quando deixar de existir a condição de entrega necessária para uma análise válida;
- estados derivados de Notas Fiscais, Consulta Assessoria ou Inventário continuam sendo reconciliados pela autoridade canônica existente e não por regras duplicadas;
- se houver consolidação já fechada, permanecem as regras vigentes de autoridade para reabertura retroativa;
- o log deve usar `Avaliação desfeita` e registrar item, valor anterior, contexto e ator.

Itens derivados que já são bloqueados pelo serviço, como Consulta Assessoria e `boletoInternet` documental independente, continuam não editáveis como bonificação mensal autônoma.

## 5. Retificação da análise técnica

Novo comando canônico: `VerificationService.correctTechnicalAnalysis(input)`.

Entrada mínima:

- `schoolId`;
- `compKey`;
- `documentKey`;
- `value`;
- `profile` quando necessário ao chamador;
- `confirmPendencyCancellation` quando houver Pendência ativa vinculada ao valor incorreto que está sendo corrigido.

Contrato:

- reutiliza as mesmas validações de perfil, competência, aplicabilidade e entrega do serviço canônico;
- não aceita `notaFiscal`, `boletoInternet` ou `consAssessoria` agregados, que possuem contratos próprios;
- não cria Pendência nova;
- se a Pendência ativa existir, exige confirmação explícita;
- a Pendência é cancelada no mesmo comando lógico, com justificativa canônica;
- nenhuma tentativa é criada ou reescrita;
- análise e Pendência devem persistir atomicamente quando ambas mudarem;
- o histórico registra a retificação com valor anterior e novo, e o cancelamento relacionado.

## 6. UX

A interface deve distinguir três ações:

- **Editar lançamento** para dados cadastrais da despesa/NF;
- **Editar avaliação** para bonificação/análise técnica;
- **Editar** no drawer de Pendência para dados cadastrais da Pendência.

Ao salvar avaliação:

- botão passa a estado ocupado e impede duplo submit;
- confirmação usa **Salvar edição**;
- desfazer bonificação deve ser uma escolha explícita, não um efeito oculto de trocar o select;
- corrigir `Incorreto` com Pendência ativa abre confirmação explicando que a Pendência será cancelada por retificação da avaliação, sem apagar seu histórico;
- após sucesso, todas as projeções atuais devem refletir o novo estado sem recarregamento manual.

## 7. Auditoria e concorrência

Toda retificação registra ator, data/hora, escola, competência, programa/documento, campo alterado, valor anterior e valor novo. `rowVersion`/versão esperada e os contratos transacionais vigentes continuam obrigatórios. Conflitos nunca podem ser silenciosamente sobrescritos.

## 8. Preview e limites

Esta entrega será validada em branch e PR Draft. O Preview é deliberado, porque o projeto passou a impedir Preview automático de branches. A exceção usada para homologação não poderá ser integrada à `main` se modificar a política `main-only` da Vercel.

Nenhum merge, migration em Supabase Production ou deploy em Production integra esta etapa de implementação/homologação.
