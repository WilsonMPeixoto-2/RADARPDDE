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

**Escopo desta entrega:** somente edição/retificação. A exclusão de lançamentos, especialmente quando houver Pendência ou histórico protegido, não faz parte do PR #295 e será tratada separadamente em outro PR. As regras atuais de exclusão permanecem inalteradas nesta entrega.

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

Corrigir valor, descrição, número, referência, observação cadastral ou qualquer outro dado editável do lançamento **não substitui** nenhuma dessas etapas.

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

### 5.0 Inventário obrigatório antes da implementação

A lista abaixo é conceitual e **não é suficiente, por si só, para definir o escopo final de campos**.

Antes de escrever a implementação, o executor deve reconstruir no código atual todos os formulários, serviços, schemas, mapeadores, projeções e componentes que leem ou escrevem cada tipo de lançamento e produzir uma **matriz completa de campos editáveis reais**.

Para cada campo permitido, a matriz deve registrar no mínimo:

- entidade canônica e nome do campo persistido;
- rótulo apresentado ao usuário;
- tipos de lançamento aos quais se aplica;
- validações atuais;
- campos derivados afetados;
- superfícies que exibem o estado atual desse campo;
- snapshots históricos que não devem ser reescritos;
- necessidade ou não de reconciliação de efeitos secundários;
- testes que comprovam persistência e propagação.

Nenhum campo atualmente editável deve ficar de fora apenas porque não foi citado como exemplo nesta especificação.

### 5.1 Nota Fiscal / despesa identificada

Podem ser corrigidos, conforme aplicabilidade do tipo e confirmação pelo inventário do código atual:

- número/referência do documento;
- descrição;
- valor;
- tipo de gasto quando a mudança não alterar contexto histórico de forma proibida e o serviço canônico puder reconciliar todos os efeitos derivados;
- demais campos cadastrais já existentes no formulário do lançamento e que sejam semanticamente retificáveis.

Se a alteração do tipo implicar efeito derivado relevante, o comando deve recalcular e reconciliar esse efeito de modo atômico ou rejeitar a operação quando não houver contrato seguro.

### 5.2 `a_identificar`

Enquanto permanecer `a_identificar`, podem ser corrigidos, conforme o inventário real do formulário e da persistência:

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

Dados cadastrais próprios da Pendência podem ser corrigidos quando semanticamente editáveis e confirmados pelo inventário do código, incluindo os campos descritivos atualmente disponibilizados ao usuário.

Exemplos podem incluir:

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

Assim, uma Nota Fiscal marcada `Incorreto` com Pendência ativa poderá ter qualquer campo material permitido corrigido sem que a Pendência seja resolvida, removida ou recriada.

## 7. Propagação e consistência visual

Toda retificação persistida deve aparecer corretamente em **todas as projeções que derivam do lançamento ou da Pendência**, sem depender de recarregar manualmente a aplicação.

A regra não se limita ao campo `valor`.

Para **cada campo editável identificado na matriz do item 5.0**, a implementação deve localizar e validar todas as superfícies que exibem aquele dado atual. Isso inclui, conforme aplicabilidade:

- Prontuário;
- bloco de Notas Fiscais;
- tela de Pendências;
- cartões/listas de Pendências;
- detalhe da Pendência;
- drawer/gaveta da Pendência;
- modais que exibam dados do lançamento;
- mensagens de cobrança quando consumirem esses dados;
- resumos e cabeçalhos derivados;
- timeline/histórico quando exibir snapshot atual do registro;
- Capital e Inventário, quando houver bem derivado da despesa;
- visualizações de Consulta Assessoria quando dependentes do lançamento;
- demais projeções que referenciem a entidade por ID.

### 7.1 Matriz campo × projeção

Antes da implementação ser considerada pronta, deve existir uma matriz verificável no repositório com a forma:

| Campo editável | Entidade fonte | Prontuário | Pendências | Drawer | Modal | Resumo | Inventário/efeito derivado | Histórico atual | Snapshot histórico |
|---|---|---|---|---|---|---|---|---|---|
| campo X | entidade Y | atualizar | atualizar | atualizar | n/a | recalcular | n/a | refletir atual | preservar |

A matriz deve ser preenchida com os **campos reais encontrados no código**. Linhas de exemplo não substituem o inventário definitivo.

Se um campo aparecer em cinco superfícies, as cinco precisam ser atualizadas e testadas. Se aparecer em apenas uma, não se deve criar duplicação artificial.

### 7.2 Regra de fonte de verdade

Nenhuma projeção deve manter cópia textual independente como fonte principal quando o dado atualizado puder ser lido da entidade canônica pelo ID.

Quando for necessário preservar um snapshot histórico, esse snapshot permanece histórico e não deve ser sobrescrito. A interface deve distinguir:

- **estado atual do lançamento**, que deve refletir a retificação;
- **registro histórico do que ocorreu**, que deve permanecer imutável.

### 7.3 Exemplos são apenas ilustrativos

Qualquer exemplo desta especificação, inclusive alteração de valor, existe apenas para demonstrar comportamento.

A regra geral é:

> **todo campo que o usuário puder editar deve propagar seu novo valor para todas as projeções de estado atual que consomem esse campo, preservando apenas os registros históricos que por definição representam o estado pretérito.**

Exemplo de valor:

- valor anterior: R$ 1.250,00;
- valor corrigido: R$ 1.520,00;
- todas as projeções atuais que exibem valor passam a mostrar R$ 1.520,00;
- histórico da retificação registra R$ 1.250,00 → R$ 1.520,00.

Exemplo de descrição:

- descrição anterior: `Aquisição de material`;
- descrição corrigida: `Aquisição de material pedagógico`;
- todas as projeções atuais que exibem descrição passam a mostrar o texto corrigido;
- histórico registra a descrição anterior e a nova.

O mesmo princípio vale para número/referência, tipo permitido, observação, motivo e qualquer outro campo que o inventário classifique como editável.

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
- alteração de descrição/número/referência deve atualizar todos os rótulos, detalhes e composições atuais que dependam desses campos;
- alteração segura de tipo pode exigir criar, atualizar ou remover efeito patrimonial, conforme as regras canônicas existentes;
- alteração de observação/motivo deve atualizar todas as superfícies atuais que os exibam;
- alteração de dados cadastrais não deve alterar bonificação, análise técnica ou status de Pendência sem uma regra funcional específica que determine isso.

O planner/serviço canônico deve decidir os efeitos. A UI não deve executar correções paralelas independentes.

## 11. UX

A ação será apresentada como **Editar lançamento** ou **Editar**, conforme o espaço e a superfície.

Requisitos:

- disponível também quando houver Pendência ativa, desde que o usuário tenha permissão para editar aquele lançamento;
- campos imutáveis aparecem bloqueados ou fora do formulário;
- salvar mostra estado de progresso e impede duplo submit;
- sucesso atualiza imediatamente todas as projeções afetadas por cada campo alterado;
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

A implementação não será considerada concluída sem três camadas de teste.

### 14.1 Contrato funcional

No mínimo:

1. editar lançamento sem Pendência;
2. editar lançamento com Pendência ativa;
3. editar `a_identificar` com Pendência ativa;
4. impedir conversão de `a_identificar` pelo editor comum;
5. preservar `registered_invoice_id`;
6. preservar ID/status da Pendência;
7. não criar nova Pendência na edição;
8. não resolver Pendência na edição;
9. registrar trilha antes/depois apenas dos campos alterados;
10. rejeitar alteração de escola/competência/programa;
11. rejeitar conflito de versão;
12. manter novo envio e reanálise funcionando exatamente como antes;
13. validar perfis autorizados e negar perfis não autorizados;
14. validar recarga completa após edição contra o estado persistido.

### 14.2 Cobertura por campo editável

Para **cada campo real listado na matriz do item 5.0**, deve existir teste que comprove:

1. o campo pode ser alterado quando permitido;
2. o novo valor foi persistido na entidade canônica correta;
3. IDs e vínculos históricos permaneceram inalterados;
4. o histórico registrou antes/depois desse campo;
5. efeitos derivados dependentes foram reconciliados;
6. campos não relacionados não sofreram alteração colateral.

Não é aceitável testar apenas `valor` e inferir que `descrição`, `número`, `referência`, `tipo`, `observação`, `motivo` ou outros campos seguirão o mesmo comportamento.

### 14.3 Cobertura campo × projeção

Para cada combinação relevante da matriz do item 7.1, deve existir evidência automatizada ou E2E de que a projeção mostra o novo valor após a retificação.

Exemplos de categorias de validação:

- Prontuário;
- fila/cartão de Pendências;
- drawer/detalhe;
- modal;
- mensagem de cobrança;
- resumo/cabeçalho;
- Consulta Assessoria, quando dependente;
- Capital e Inventário, quando dependente;
- recarga completa da aplicação.

Snapshots históricos devem possuir teste inverso: continuam mostrando o estado pretérito quando essa for sua função semântica.

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

O usuário deve poder corrigir qualquer campo material elegível em qualquer lançamento abrangido pela feature sem perder histórico e sem quebrar o ciclo operacional.

Após salvar, **todo lugar que mostra o estado atual de qualquer campo alterado deve refletir imediatamente o novo dado**, enquanto o histórico continua mostrando fielmente o que existia antes e qual retificação foi realizada.

A feature não será considerada concluída enquanto houver algum campo editável cuja propagação para uma projeção atual relevante não tenha sido mapeada e testada.
