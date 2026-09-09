# Edição auditável de lançamentos — especificação de design

**Data:** 09/09/2026  
**Baseline:** `main` em `a3f98df5e722676491eba59b0fbaf42648a9bfa1`  
**Branch de trabalho:** `feat/edicao-lancamentos-auditavel`

## 1. Objetivo

Permitir a correção de dados digitados em lançamentos já existentes do RADAR PDDE, inclusive quando houver Pendência ativa, sem apagar o lançamento, sem criar uma nova identidade e sem alterar indevidamente o ciclo operacional da Pendência.

A capacidade deve funcionar de forma transversal para:

- Notas Fiscais e despesas comuns;
- `boleto_internet` enquanto tipo de gasto de Notas Fiscais;
- `a_identificar`;
- lançamentos fiscais com Pendência individual ativa;
- lançamentos relacionados à Consulta Assessoria;
- Pendências documentais/manuais que possuam dados cadastrais editáveis;
- efeitos derivados, como bem patrimonial vinculado, quando a retificação material exigir reconciliação.

## 2. Princípio central

A edição é uma **retificação auditável do mesmo registro**, e não um novo lançamento.

Portanto:

- o identificador canônico permanece o mesmo;
- o histórico anterior permanece preservado;
- a Pendência continua sendo a mesma;
- o status operacional da Pendência não muda apenas porque um campo foi corrigido;
- a edição não equivale a novo envio;
- a edição não equivale a reanálise;
- a edição não resolve a Pendência;
- a edição não cancela a Pendência;
- a edição não cria uma nova Pendência equivalente;
- a edição registra trilha de auditoria com valor anterior e valor novo dos campos efetivamente alterados.

## 3. Regra de conclusão da Pendência

Permitir edição não altera o contrato vigente de regularização.

Uma Pendência somente avança pelo fluxo próprio:

1. escola apresenta novo envio pela tela de Pendências;
2. o sistema registra a nova tentativa;
3. a Pendência vai para `Aguardando reanálise` quando aplicável;
4. o controlador reanalisa a tentativa;
5. somente resultado aprovado/correto resolve a Pendência conforme as regras canônicas atuais.

Corrigir valor, descrição, número, referência, observação cadastral ou outro dado do lançamento **não substitui** nenhuma dessas etapas.

## 4. Identidade e campos imutáveis

A edição comum não pode alterar silenciosamente a identidade histórica do registro.

Devem permanecer imutáveis no fluxo comum de retificação:

- `registered_invoice_id` / `id` do lançamento;
- escola;
- competência;
- programa;
- identidade da Pendência vinculada;
- IDs de tentativas já registradas;
- autoria e timestamps históricos já persistidos;
- resultados anteriores de reanálise;
- estado histórico de resolução/cancelamento;
- vínculos históricos que sejam parte da trilha administrativa.

Mudanças de contexto estrutural, quando algum fluxo legítimo as exigir futuramente, devem usar operação específica e não esta edição genérica.

## 5. Dados editáveis

A UI deverá expor somente campos que possam ser retificados sem destruir identidade histórica.

### 5.1 Nota Fiscal / despesa identificada

Podem ser corrigidos, conforme aplicabilidade do tipo:

- número/referência do documento;
- descrição;
- valor;
- tipo de gasto quando a mudança não alterar contexto histórico de forma proibida e o serviço canônico puder reconciliar todos os efeitos derivados;
- demais campos cadastrais já existentes no formulário do lançamento.

Se a alteração do tipo implicar efeito derivado relevante, o comando deve recalcular e reconciliar esse efeito de modo atômico ou rejeitar a operação quando não houver contrato seguro.

### 5.2 `a_identificar`

Enquanto permanecer `a_identificar`, podem ser corrigidos:

- descrição;
- referência eventualmente registrada;
- valor;
- demais metadados cadastrais não estruturais existentes.

Não pode ser convertido para Nota Fiscal comum pelo editor de retificação.

A identificação posterior continua ocorrendo exclusivamente pelo fluxo **Pendências → Registrar novo envio**, preservando o mesmo `registered_invoice_id`, conforme ADR-050.

O registro continua:

- `a_identificar`;
- análise `Incorreto`;
- com a mesma Pendência ativa;
- sujeito ao mesmo ciclo de novo envio e reanálise.

### 5.3 Pendência

Dados cadastrais próprios da Pendência podem ser corrigidos quando semanticamente editáveis, por exemplo:

- motivo/erro cadastrado;
- observação;
- outros campos descritivos atuais.

Não são editáveis por esta operação:

- status operacional;
- tentativas;
- resultado de reanálise;
- datas históricas de eventos;
- escola/competência/programa;
- identidade do documento/lançamento vinculado.

## 6. Pendência ativa não bloqueia mais retificação material

A regra atual que bloqueia edição ordinária quando há Pendência ativa será refinada.

Nova regra:

> Pendência ativa bloqueia operações que alterem o ciclo operacional ou rompam identidade/vínculo, mas **não bloqueia a retificação auditável de dados cadastrais do mesmo lançamento**.

Assim, uma Nota Fiscal marcada `Incorreto` com Pendência ativa poderá ter seu valor corrigido sem que a Pendência seja resolvida, removida ou recriada.

## 7. Propagação e consistência visual

Toda retificação persistida deve aparecer corretamente em **todas as projeções que derivam do lançamento ou da Pendência**, sem depender de recarregar manualmente a aplicação.

No mínimo, a implementação deve verificar e atualizar:

- Prontuário;
- bloco de Notas Fiscais;
- tela de Pendências;
- cartões/listas de Pendências;
- detalhe da Pendência;
- drawer/gaveta da Pendência;
- modais que exibam os dados do lançamento;
- mensagens de cobrança quando consumirem esses dados;
- resumos e cabeçalhos derivados;
- timeline/histórico quando exibir snapshot atual do registro;
- Capital e Inventário, quando houver bem derivado da despesa;
- demais projeções que referenciem a entidade por ID.

### 7.1 Regra de fonte de verdade

Nenhuma projeção deve manter cópia textual independente como fonte principal quando o dado atualizado puder ser lido da entidade canônica pelo ID.

Quando for necessário preservar um snapshot histórico, esse snapshot permanece histórico e não deve ser sobrescrito. A interface deve distinguir:

- **estado atual do lançamento**, que deve refletir a retificação;
- **registro histórico do que ocorreu**, que deve permanecer imutável.

### 7.2 Exemplo obrigatório

Estado inicial:

- despesa `a_identificar` ID X;
- valor R$ 1.250,00;
- Pendência P vinculada ao ID X.

Retificação:

- valor corrigido para R$ 1.520,00.

Resultado obrigatório:

- `registered_invoice_id` continua X;
- Pendência continua P;
- status da Pendência não muda;
- análise continua `Incorreto` enquanto o fluxo de regularização não for concluído;
- Prontuário mostra R$ 1.520,00;
- tela de Pendências mostra R$ 1.520,00;
- drawer da Pendência mostra R$ 1.520,00;
- demais projeções atuais mostram R$ 1.520,00;
- histórico registra a retificação de R$ 1.250,00 para R$ 1.520,00;
- snapshots históricos anteriores, quando existentes, não são reescritos.

## 8. Auditoria

Cada retificação deve gerar evento administrativo específico, contendo pelo menos:

- entidade alterada;
- ID canônico;
- usuário responsável;
- data/hora;
- campos alterados;
- valor anterior;
- valor novo;
- contexto de escola, competência e programa;
- Pendência relacionada, quando houver.

Não registrar campos que não mudaram.

A trilha deve ser suficientemente clara para responder posteriormente:

> quem alterou o quê, de qual valor para qual valor, em qual lançamento e em qual contexto?

## 9. Concorrência

A retificação deve respeitar `rowVersion`/versão esperada ou mecanismo canônico equivalente.

Se o registro tiver sido alterado depois que o usuário abriu o editor:

- não sobrescrever silenciosamente;
- rejeitar com conflito explícito;
- atualizar/reconciliar o estado local;
- permitir ao usuário revisar os dados atuais antes de tentar novamente.

## 10. Efeitos derivados

A retificação deve recalcular somente os efeitos realmente dependentes dos campos alterados.

Exemplos:

- alteração de valor deve atualizar todas as projeções atuais que mostram o valor;
- alteração de descrição/número deve atualizar rótulos e detalhes atuais;
- alteração segura de tipo pode exigir criar, atualizar ou remover efeito patrimonial, conforme as regras canônicas existentes;
- alteração de dados cadastrais não deve alterar bonificação, análise técnica ou status de Pendência sem uma regra funcional específica que determine isso.

O planner/serviço canônico deve decidir os efeitos. A UI não deve executar correções paralelas independentes.

## 11. UX

A ação será apresentada como **Editar lançamento** ou **Editar**, conforme o espaço e a superfície.

Requisitos:

- disponível também quando houver Pendência ativa, desde que o usuário tenha permissão para editar aquele lançamento;
- campos imutáveis aparecem bloqueados ou fora do formulário;
- salvar mostra estado de progresso e impede duplo submit;
- sucesso atualiza imediatamente as projeções afetadas;
- conflito de versão mostra mensagem específica;
- erro de persistência não altera estado visual como se tivesse salvo;
- edição da Pendência não deve ser confundida com `Registrar novo envio`, `Reanalisar`, `Resolver` ou `Cancelar`.

## 12. Permissões

A nova capacidade não amplia perfis autorizados além do que já podem alterar o tipo de entidade correspondente.

A autorização deve existir também na camada canônica/server-side quando a operação atravessar o Supabase, não apenas na UI.

## 13. Persistência

Preferência arquitetural:

- reutilizar a identidade e os comandos canônicos existentes;
- introduzir comando específico de retificação apenas onde a operação ordinária atual conflitar com os guardrails de Pendência;
- evitar `patchServices()`, decorators tardios ou regras duplicadas por tela;
- retorno remoto deve conter entidades suficientes para reconciliar o estado local sem full reload quando o contrato atual já suportar atualização incremental segura.

Se uma nova RPC for necessária, ela deve aceitar apenas os campos retificáveis e validar no servidor:

- identidade;
- contexto;
- versão;
- permissões;
- vínculo com Pendência;
- campos imutáveis.

## 14. Testes de aceite

A implementação não será considerada concluída sem testes para, no mínimo:

1. editar valor de Nota Fiscal sem Pendência;
2. editar valor de Nota Fiscal com Pendência ativa;
3. editar descrição/número com Pendência ativa;
4. editar valor de `a_identificar` com Pendência ativa;
5. impedir conversão de `a_identificar` pelo editor comum;
6. preservar `registered_invoice_id`;
7. preservar ID/status da Pendência;
8. não criar nova Pendência na edição;
9. não resolver Pendência na edição;
10. registrar trilha antes/depois;
11. rejeitar alteração de escola/competência/programa;
12. rejeitar conflito de versão;
13. propagar valor atualizado ao Prontuário;
14. propagar valor atualizado à fila/cartão de Pendências;
15. propagar valor atualizado ao drawer/detalhe;
16. manter snapshot histórico anterior imutável;
17. reconciliar efeito patrimonial quando aplicável;
18. manter novo envio e reanálise funcionando exatamente como antes;
19. validar perfis autorizados e negar perfis não autorizados;
20. validar recarga completa após edição contra o estado persistido.

## 15. Não objetivos

Esta mudança não deve:

- apagar lançamentos como forma de correção;
- recriar lançamento para corrigir dado;
- permitir troca arbitrária de escola/competência/programa;
- reescrever tentativas antigas;
- reescrever resultados de reanálise;
- resolver Pendência por edição;
- transformar edição em novo envio;
- alterar as regras de individualização da ADR-050;
- criar redesign geral das telas;
- reabrir decisões já estabilizadas dos PRs de Pendências e individualização.

## 16. Critério final de sucesso

O usuário deve poder corrigir um erro material em qualquer lançamento elegível sem perder histórico e sem quebrar o ciclo operacional.

Após salvar, **todo lugar que mostra o estado atual daquele lançamento deve refletir imediatamente os novos dados**, enquanto o histórico continua mostrando fielmente o que existia antes e qual retificação foi realizada.
