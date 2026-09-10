# Retificação auditável de avaliações — especificação de design

**Data:** 10/09/2026  
**Baseline:** `main` em `e320fec1f4f08c9b25b133c46e014bcebfbdd00d`  
**Branch:** `feat/retificacao-avaliacoes-preview-20260910`  
**Ambiente de homologação:** Preview. Production e `main` permanecem intocados até aprovação explícita.

## 1. Objetivo

Ampliar a edição auditável já incorporada pelo PR #295 para as avaliações e para os dados cadastrais das Pendências, sem transformar retificação de erro operacional em atalho para regularização documental.

## 2. Regras funcionais aprovadas

1. Ações de edição devem ser explícitas e visíveis, com botões próprios no ponto em que o usuário trabalha e confirmação inequívoca do resultado.
2. Todo campo originalmente informado pelo usuário e semanticamente retificável deve poder ser corrigido, preservadas identidade, contexto, permissões, concorrência e histórico.
3. Bonificação `Sim`, `Não` ou `Não se aplica` pode ser desfeita para estado neutro quando a regra do item permitir. O histórico registra a ação **Avaliação desfeita**, com valor anterior e estado resultante.
4. A análise técnica pode ser corrigida quando o valor armazenado decorreu de erro do operador.
5. Corrigir a análise técnica **não** substitui correção documental. Quando a escola apresenta documento novo/corrigido, permanece obrigatório o fluxo **Registrar novo envio → Reanalisar**.
6. Se um `Incorreto` lançado por engano tiver aberto Pendência e o operador corrigir essa avaliação, a operação exige cumulativamente uma caixa de confirmação expressa e uma justificativa escrita obrigatória.
7. Nessa hipótese, a Pendência mantém tecnicamente o estado canônico `Cancelada`, mas recebe causa de encerramento própria `retificacao_avaliacao`, origem `avaliacao_tecnica` e rótulo visível **Anulada por edição da avaliação**. Isso não cria uma funcionalidade genérica de cancelamento de Pendência.
8. A correção da avaliação não apaga eventos anteriores e não fabrica novo envio, tentativa ou reanálise. A transição registra valor anterior, valor novo, justificativa, ator e data/hora.
9. Pendências manuais podem ter seus campos cadastrais informados pelo usuário retificados, inclusive item, motivo, responsável e observação, sem alterar status ou eventos históricos. A auditoria registra os campos efetivamente alterados, com antes/depois.
10. Pendências documentais mantêm a edição dos campos cadastrais atualmente permitidos; status, tentativas, contexto e identidade não são editáveis por esse fluxo.
11. Autoridade continua baseada nas permissões/capacidades já vigentes para a escola e a operação. Não existe regra de “somente o autor pode editar”. Esta frente não amplia perfis nem escopos de acesso.
12. Uma funcionalidade de edição só é considerada entregue quando o comando, a persistência, os controles visuais, a confirmação, o feedback de sucesso/erro e a representação posterior do resultado estiverem coerentes entre si.

## 3. Segurança semântica

A operação ordinária `setTechnicalAnalysis()` continua protegendo o contrato atual. Em especial, `Incorreto` continua exigindo abertura atômica de Pendência e uma Pendência ativa continua bloqueando alteração técnica ordinária.

A correção de erro do operador usa um comando explícito de retificação, separado do fluxo ordinário, para que seja possível exigir confirmação, produzir auditoria própria e distinguir semanticamente retificação de reanálise. O fluxo de retificação **não oferece comando autônomo de cancelamento**.

A gravação de `Incorreto` continua pertencendo ao fluxo atômico já existente que cria a Pendência. O comando de retificação não pode ser usado para produzir um novo `Incorreto`.

## 4. Bonificação desfeita

Quando uma bonificação não derivada for desfeita:

- o valor volta ao estado neutro;
- a análise técnica correspondente volta para `Não analisado` quando deixar de existir a condição de entrega necessária para uma análise válida;
- estados derivados de Notas Fiscais, Consulta Assessoria ou Inventário continuam sendo reconciliados pela autoridade canônica existente e não por regras duplicadas;
- se houver consolidação já fechada, permanecem as regras vigentes de autoridade para reabertura retroativa;
- o log deve usar `Avaliação desfeita` e registrar item, valor anterior, contexto e ator.

Itens derivados que já são bloqueados pelo serviço, como Consulta Assessoria e `boletoInternet` documental independente, continuam não editáveis como bonificação mensal autônoma.

## 5. Retificação da análise técnica

Comando explícito: `VerificationService.correctTechnicalAnalysis(input)`.

Entrada mínima:

- `schoolId`;
- `compKey`;
- `documentKey`;
- `value`;
- `profile` quando necessário ao chamador;
- `confirmPendencyCancellation = true` quando houver Pendência ativa vinculada ao `Incorreto` que está sendo corrigido;
- `retificationJustification`, obrigatória no mesmo cenário.

Contrato:

- reutiliza as mesmas validações de perfil, competência, aplicabilidade e entrega do serviço canônico;
- não aceita `notaFiscal`, `boletoInternet` ou `consAssessoria` agregados, que possuem contratos próprios;
- não cria Pendência nova;
- se a Pendência ativa existir e a análise atual for `Incorreto`, exige confirmação expressa **e** justificativa não vazia;
- a Pendência passa tecnicamente a `Cancelada`, mas o encerramento é registrado como `retificacao_avaliacao`, nunca como cancelamento comum do usuário;
- registra `origem=avaliacao_tecnica`, avaliação anterior, avaliação nova, justificativa e `confirmacaoExpressa=true`;
- nenhuma tentativa é criada, apagada ou reescrita;
- análise, encerramento especial da Pendência e log administrativo persistem atomicamente quando mudarem juntos;
- o histórico anterior é preservado e recebe ao final um evento próprio `retificacao_avaliacao`.

O banco repete as invariantes relevantes e não confia apenas na confirmação produzida pela interface. A RPC exige os metadados formais e valida se a transição solicitada corresponde ao estado real bloqueado no banco.

## 6. UX

A interface deve distinguir claramente:

- **Editar lançamento** para dados cadastrais da despesa/NF;
- **Editar bonificação** para respostas de entrega/bonificação retificáveis;
- **Editar análise** para análise técnica retificável;
- **Editar** no drawer de Pendência para dados cadastrais da Pendência.

Os controles de edição ficam visíveis junto ao campo correspondente. O usuário não deve precisar conhecer uma rota oculta, editar diretamente o banco ou descobrir por tentativa que um select bloqueado possui uma exceção administrativa.

### 6.1 Edição comum de avaliação

Ao abrir a edição, o modal exibe documento/contexto, valor atual e novo valor. O botão fica desabilitado enquanto não existir alteração efetiva. Durante a gravação, a ação entra em estado ocupado e não admite duplo envio.

Após sucesso, a tela deve refletir imediatamente o novo valor e apresentar mensagem objetiva, por exemplo **Análise técnica editada com sucesso** ou **Bonificação editada com sucesso**.

### 6.2 `Incorreto` com Pendência ativa

Ao selecionar novo estado para uma análise atualmente `Incorreto` com Pendência ativa, o modal passa a exibir uma seção de impacto informando que a Pendência será anulada em consequência da retificação e que o histórico será preservado.

A confirmação exige simultaneamente:

1. caixa obrigatória com o texto: **Confirmo que estou corrigindo um lançamento de avaliação realizado incorretamente e que a Pendência vinculada deve ser anulada por esta retificação.**
2. campo obrigatório **Justificativa da retificação**.

O botão principal passa a se chamar **Confirmar retificação e anular Pendência** e permanece desabilitado até as duas condições serem atendidas.

Após sucesso, o sistema informa **Avaliação retificada e Pendência anulada com sucesso.**

### 6.3 Representação na tela de Pendências

A ocorrência permanece consultável na aba **Canceladas**, preservando o modelo canônico de quatro estados, mas recebe tratamento visual próprio:

- rótulo **Anulada por edição da avaliação**;
- diferenciação visual discreta em relação a cancelamentos comuns;
- detalhe com o título **Retificação da avaliação técnica**;
- transição `Incorreto → <novo valor>`;
- justificativa escrita;
- responsável e data/hora;
- evento próprio na linha do tempo.

Nenhum botão de “Cancelar Pendência” é criado por esta frente.

## 7. Auditoria e concorrência

Toda retificação registra ator, data/hora, escola, competência, programa/documento, campo alterado, valor anterior e valor novo. `rowVersion`/versão esperada e os contratos transacionais vigentes continuam obrigatórios. Conflitos nunca podem ser silenciosamente sobrescritos.

Retificação manual de Pendência registra somente os campos efetivamente alterados e seus valores anterior/novo. Operação semanticamente idêntica continua sendo `no-op`, sem nova escrita ou log artificial.

## 8. Testes de aceitação

A frente precisa cobrir, no mínimo:

- retificação comum de análise sem Pendência;
- `Incorreto` com Pendência ativa recusado sem confirmação;
- confirmação recusada sem justificativa;
- sucesso atômico com confirmação + justificativa;
- preservação integral de tentativas e histórico anteriores;
- ausência de rota genérica de cancelamento;
- representação **Anulada por edição da avaliação** na aba Canceladas e no drawer;
- feedback visual de sucesso;
- edição auditável de Pendência manual com antes/depois;
- regressões das edições de NF já incorporadas pelo PR #295.

## 9. Preview e limites

Esta entrega será validada em branch e PR Draft. O Preview é deliberado, porque o projeto passou a impedir Preview automático de branches. A exceção usada para homologação não poderá ser integrada à `main` se modificar a política `main-only` da Vercel.

Nenhum merge, migration em Supabase Production ou deploy em Production integra esta etapa de implementação/homologação. A publicação em Production dependerá de aprovação posterior e explícita após homologação do Preview.
