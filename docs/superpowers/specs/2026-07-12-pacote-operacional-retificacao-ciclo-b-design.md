# Pacote Operacional, Retificação e Ciclo B — Design Consolidado

## 1. Objetivo

Concluir, em um único pacote integrado, as Tasks 10, 11, 12 e 13 do Ciclo A e incorporar as entregas logicamente vinculadas do Ciclo B para Dashboard e Carteira, evitando estados intermediários incoerentes, decisões duplicadas e regressões entre telas.

O pacote deve transformar regras de pendência, regularização e retificação em possibilidades reais de uso no site, com reflexos imediatos e coerentes em Pendências, Prontuário, Dashboard, Carteira, Visão por Competência, alertas, históricos, logs e documentação.

## 2. Fontes e precedência

Aplicar a seguinte ordem de precedência:

1. Dossiê Consolidado v1.0;
2. Plano do Lote 2 aprovado v2.0;
3. plano técnico do Ciclo A;
4. decisões expressamente confirmadas pelo usuário nesta conversa;
5. código atual da `main`.

Decisões consolidadas não devem ser reabertas sem defeito comprovado, conflito documental real ou nova determinação expressa.

## 3. Escopo integrado

### 3.1 Tasks do Ciclo A absorvidas

- Task 10 — contagens, alertas, contatos, antiguidade e próximo responsável;
- Task 11 — cancelamento e reabertura de pendências;
- Task 12 — domínio de retificação administrativa;
- Task 13 — interface, histórico e materialização da retificação no Prontuário.

### 3.2 Entregas do Ciclo B absorvidas

- Dashboard do Controlador como fila operacional real;
- Carteira de Escolas com filtros e indicadores coerentes com o mesmo modelo operacional;
- navegação contextual entre Dashboard, Carteira, Pendências e Prontuário;
- projeções compartilhadas de situação documental, próxima ação, prioridade e última movimentação.

### 3.3 Documentação absorvida

- atualização inicial do README;
- criação de índice documental e organização dos documentos canônicos;
- documentação do modelo operacional compartilhado;
- documentação do fluxo de retificação;
- registro do estado atual, limites e roadmap.

## 4. Decisões já aprovadas

- `Aberta` e `Aguardando reanálise` são pendências ativas;
- `Resolvida` e `Cancelada` são históricos consultivos;
- uma pendência ativa por escola × competência × programa × documento;
- novo envio não resolve pendência;
- somente reanálise positiva resolve pendência documental;
- regularização não altera automaticamente a bonificação;
- não existe estado `Vencida`;
- cancelamento exige justificativa, usuário, perfil e data;
- reabertura preserva histórico e exige novos erros e justificativa;
- retificação administrativa será permitida ao perfil `assistente` nesta fase;
- a autorização será centralizada para futura expansão de perfis;
- Supabase, autenticação real e permissões definitivas permanecem fora do escopo;
- nenhum merge ou deploy em produção sem autorização expressa.

## 5. Arquitetura funcional

### 5.1 Modelo operacional compartilhado

Criar uma projeção derivada, sem duplicar o estado persistido, capaz de representar cada contexto documental e cada escola na competência ativa.

A projeção deve fornecer, no mínimo:

- resultado agregado da bonificação;
- situação técnica/documental;
- quantidade de pendências abertas;
- quantidade aguardando reanálise;
- total de pendências ativas;
- próximo ator derivado do estado;
- próxima ação concreta;
- última movimentação estruturada;
- data-base da antiguidade operacional;
- prioridade operacional;
- destino contextual da ação;
- controlador responsável;
- programa e documento relacionados.

Dashboard, Carteira, Pendências, alertas e integrações do Prontuário devem consumir a mesma projeção ou helpers canônicos equivalentes.

### 5.2 Próxima ação concreta

A interface não deve exibir somente `Escola` ou `Controlador`. Deve descrever a ação operacional, por exemplo:

- `Registrar novo envio do Extrato bancário`;
- `Reanalisar Ata de prioridades`;
- `Registrar contato sobre documento ausente`;
- `Abrir pendência para documento incorreto`;
- `Concluir análise documental`;
- `Consolidar PDDE Básico`;
- `Iniciar análise do programa`.

A ação deve transportar escola, competência, programa, documento, pendência e origem da navegação quando aplicável.

## 6. Pendências, contatos e alertas

### 6.1 Contagens

Todas as superfícies devem usar os estados canônicos:

- abertas;
- aguardando reanálise;
- ativas = abertas + aguardando;
- resolvidas;
- canceladas.

Nenhuma tela deve rotular o total ativo como apenas `Abertas`.

### 6.2 Contatos

Contatos devem poder ser registrados em pendências `Aberta` e `Aguardando reanálise`.

Cada contato deve manter vínculo com:

- pendência;
- escola;
- competência;
- programa;
- documento;
- usuário;
- perfil;
- data e hora;
- canal ou descrição já suportados pelo modelo atual.

O contato deve aparecer na timeline da pendência e influenciar a informação de última movimentação, sem alterar o estado da pendência.

### 6.3 Antiguidade

A antiguidade deve usar a movimentação operacional relevante:

- `Aberta`: data da abertura ou da última reabertura/reanálise incorreta que devolveu a ação à escola;
- `Aguardando reanálise`: data do envio corretivo mais recente ainda aguardando análise;
- históricos: data de resolução ou cancelamento para ordenação consultiva.

Alertas de antiguidade devem usar semântica de atenção, não de erro crítico automático. Cor e texto devem seguir o sistema visual canônico.

### 6.4 Alertas

Alertas devem:

- distinguir pendência aberta de reanálise aguardando;
- informar próxima ação concreta;
- mostrar escola, competência, programa e documento;
- abrir o mesmo registro de pendência;
- respeitar filtros e contexto de retorno;
- evitar duplicidade para o mesmo contexto documental.

## 7. Cancelamento e reabertura

### 7.1 Cancelamento

Permitido somente para pendência ativa.

Exigências:

- confirmação explícita;
- justificativa obrigatória;
- registro de usuário, perfil e data/hora;
- preservação de erros, tentativas e histórico;
- mudança para `Cancelada`;
- remoção imediata das contagens ativas;
- atualização de Dashboard, Carteira, Competências, alertas e Pendências;
- nenhuma alteração automática na bonificação ou análise técnica.

### 7.2 Reabertura

Permitida somente para pendência `Resolvida`.

Exigências:

- justificativa obrigatória;
- seleção de pelo menos um erro documental válido;
- `Documento ausente` permanece exclusivo;
- registro de usuário, perfil e data/hora;
- retorno para `Aberta`;
- preservação de todas as tentativas e eventos anteriores;
- criação de novo evento de timeline;
- atualização imediata das projeções e contagens;
- nenhuma alteração automática na bonificação.

## 8. Retificação administrativa

### 8.1 Permissão

Nesta fase, somente o perfil `assistente` pode iniciar e concluir retificação administrativa.

A regra deve ficar centralizada em helper único, para futura ampliação sem alterar cada tela individualmente.

### 8.2 Objeto da retificação

A retificação atua sobre registros consolidados de bonificação no contexto escola × competência × programa.

Ela deve permitir alterar respostas de bonificação e, quando necessário, o resultado consolidado derivado, sem apagar o estado anterior.

### 8.3 Fluxo

1. Assistente abre o Prontuário no contexto exato;
2. seleciona `Retificar consolidação`;
3. visualiza resumo do estado anterior;
4. informa justificativa obrigatória;
5. altera somente os campos permitidos;
6. visualiza comparação antes/depois;
7. confirma a retificação;
8. sistema registra histórico auditável;
9. resultados derivados são recalculados;
10. telas relacionadas são atualizadas.

### 8.4 Auditoria

Cada retificação deve registrar:

- identificador próprio;
- escola;
- competência;
- programa;
- usuário;
- perfil;
- data e hora;
- justificativa;
- estado anterior completo relevante;
- estado posterior completo relevante;
- campos efetivamente alterados;
- resultado agregado anterior e posterior.

Retificação não pode ser edição silenciosa nem apagar logs anteriores.

### 8.5 Relação com pendências

Retificar bonificação não deve resolver, cancelar ou reabrir pendência automaticamente.

Pendências e análise técnica permanecem dimensões separadas. A interface deve explicar essa separação quando coexistirem.

## 9. Dashboard do Controlador

### 9.1 Estrutura

O Dashboard deve funcionar como fila de trabalho, não apenas resumo estatístico.

Ordem recomendada:

1. contexto da carteira, Controlador e competência;
2. faixa de resultado da avaliação;
3. cartões operacionais;
4. lista de próximas ações;
5. lista de escolas correspondente ao filtro ativo;
6. alertas e gargalos relacionados.

### 9.2 Cartões operacionais

Exibir, separadamente:

- escolas no escopo;
- bonificação não lançada;
- pendências abertas;
- aguardando reanálise;
- bens não encaminhados.

As contagens são sobrepostas e não devem ser apresentadas como soma de um total único.

Cada cartão deve ser acionável, filtrar a lista abaixo e permitir transporte para a Carteira com o mesmo subconjunto.

### 9.3 Próximas ações

A fila deve ordenar por:

1. ação aguardando há mais tempo;
2. prioridade operacional definida pelo tipo de ação;
3. R.A.;
4. designação da escola.

Cada linha/cartão deve mostrar:

- escola;
- competência;
- programa e documento;
- situação atual;
- próxima ação;
- tempo aguardando;
- última movimentação;
- ação principal.

## 10. Carteira de Escolas

### 10.1 Finalidade

A Carteira é a superfície de pesquisa, comparação e acompanhamento detalhado. Deve compartilhar a mesma projeção do Dashboard, mas oferecer maior poder de filtragem.

### 10.2 Filtros

- busca por nome, designação e INEP;
- Controlador;
- programa;
- R.A.;
- resultado da bonificação;
- situação documental;
- pendências abertas;
- aguardando reanálise;
- sem pendência ativa;
- inventário.

Filtros devem ser combináveis, removíveis e preservados durante navegação contextual.

### 10.3 Conteúdo por escola

Exibir:

- nome e designação;
- Controlador;
- programas;
- bonificação na competência ativa;
- situação documental;
- quantidade aberta;
- quantidade para reanalisar;
- última movimentação;
- próxima ação concreta;
- acesso ao Prontuário;
- acesso à fila de Pendências no recorte da escola.

No mobile, usar cartões; não comprimir tabela horizontalmente.

## 11. Integração com Prontuário e Pendências

O pacote não redesenha integralmente o Prontuário, mas deve assegurar:

- abertura no contexto exato de escola, competência, programa e documento;
- foco na ação relacionada;
- ação de retificação para Assistente;
- ações de cancelar e reabrir onde permitidas;
- atualização imediata após mutações;
- retorno à origem com filtros, busca, aba, scroll e seleção restaurados;
- inexistência de estados duplicados entre lista e drawer.

## 12. Layout e experiência de uso

### 12.1 Sistema visual

- roxo/lilás para estrutura, seleção e identidade;
- azul para informação e aguardando reanálise;
- âmbar para providência necessária;
- verde para resolução positiva;
- cinza para cancelamento e estados neutros;
- vermelho somente para erro específico ou ação destrutiva.

Cor nunca será o único meio de comunicação.

### 12.2 Estados e mensagens

Todas as mutações devem oferecer:

- confirmação antes de ação destrutiva;
- mensagem de sucesso após persistência;
- mensagem de erro específica sem perda do preenchimento;
- foco devolvido ao acionador ou ao próximo elemento lógico;
- atualização de `aria-live` quando aplicável.

### 12.3 Responsividade

- desktop: tabelas, painéis e drawers;
- mobile: cartões, painéis de tela inteira e filtros recolhíveis;
- sem rolagem horizontal global;
- ações principais sempre visíveis;
- alvos de toque adequados;
- suporte a Android Chromium e iPhone WebKit.

## 13. Dados legados e compatibilidade

- não inventar dados ausentes;
- exibir `Não informado` ou `Registro legado`;
- derivar responsável pelo estado canônico, não confiar em texto legado quando houver contexto estruturado;
- normalizar registros sem apagar propriedades antigas;
- manter compatibilidade com `localStorage` atual;
- não elevar versão global de dados sem necessidade comprovada;
- migrações devem ser idempotentes.

## 14. README e biblioteca documental

### 14.1 Estrutura

Organizar:

```text
docs/
├── reference/
├── architecture/
├── plans/
├── reports/
└── superpowers/
```

### 14.2 README

O README deve incluir:

- visão geral institucional;
- problema resolvido;
- público usuário;
- funcionalidades atuais;
- regras centrais;
- status das Tasks e pacotes;
- persistência em `localStorage`;
- Supabase deliberadamente desativado;
- execução local;
- testes;
- produção;
- documentos oficiais;
- hierarquia e precedência documental;
- limitações atuais;
- roadmap consolidado.

### 14.3 Documentos

Incluir ou indexar no repositório:

- Dossiê Consolidado v1.0;
- Plano do Lote 2 aprovado v2.0;
- plano técnico do Ciclo A;
- Relatório e Guia do Ciclo A;
- protótipo Excel aprovado;
- especificações e planos produzidos durante o desenvolvimento;
- arquitetura de pendências e reanálise;
- arquitetura de retificações;
- índice de versões e status canônico.

Arquivos binários só devem ser adicionados após confirmação de disponibilidade no ambiente de execução.

## 15. Testes e critérios de aceite

### 15.1 Domínio

Testar:

- contagens por estado;
- próximo ator;
- próxima ação;
- antiguidade operacional;
- cancelamento válido e inválido;
- reabertura válida e inválida;
- histórico preservado;
- retificação pelo Assistente;
- bloqueio para outros perfis;
- comparação antes/depois;
- independência entre bonificação, análise técnica e pendência;
- migração idempotente.

### 15.2 Integração

Testar:

- Dashboard e Carteira consumindo os mesmos totais;
- alteração de estado refletida em todas as telas;
- filtros preservados;
- navegação contextual;
- cancelamento removendo item das filas ativas;
- reabertura recolocando item em `Abertas`;
- retificação recalculando resultado sem alterar pendências;
- contatos aparecendo na timeline e última movimentação;
- alertas abrindo o registro correto.

### 15.3 E2E

Validar em:

- desktop Chromium;
- Android Chromium;
- iPhone WebKit.

Cenários mínimos:

- registrar contato em pendência aberta;
- registrar contato aguardando reanálise;
- cancelar pendência ativa;
- consultar cancelada;
- reabrir resolvida;
- retificar consolidação como Assistente;
- bloquear retificação em outro perfil;
- filtrar Dashboard e transportar para Carteira;
- abrir próxima ação no Prontuário;
- voltar preservando contexto;
- ausência de overlays presos, erros de console e foco perdido.

## 16. Limites de escopo

Não implementar neste pacote:

- Supabase ativo;
- autenticação real;
- matriz definitiva de permissões;
- integração automática com Google Drive;
- notificações externas;
- alteração estrutural do Excel;
- redesenho integral do Prontuário;
- reestruturação geral do `app.js` sem relação direta com o pacote;
- Ciclo C completo;
- hardening final das Tasks 14–16, que permanece em pacote posterior.

## 17. Estratégia de entrega

- branch isolada: `feature/ciclo-a-pacote-operacional-retificacao`;
- implementação TDD em blocos autocontidos;
- commits frequentes por domínio;
- PR único para o pacote integrado;
- Preview Vercel para validação;
- nenhuma alteração da `main`, merge ou produção sem autorização expressa.

## 18. Resultado esperado

Ao final, o usuário deve perceber um sistema coerente em que:

- cada alteração de pendência atualiza todas as telas relacionadas;
- Dashboard mostra o que precisa ser feito;
- Carteira permite localizar e comparar escolas;
- Prontuário permite executar a ação no contexto exato;
- cancelamento e reabertura são auditáveis;
- retificação é explícita, justificada e reversível no histórico;
- README e documentos permitem compreender e manter o projeto;
- nenhuma regra de bonificação é alterada implicitamente por pendências ou regularizações.
