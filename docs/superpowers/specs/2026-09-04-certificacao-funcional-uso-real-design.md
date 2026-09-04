# Certificação funcional por uso real — design

**Data:** 4 de setembro de 2026  
**Classe:** design aprovado para estabilização funcional  
**Baseline:** `main` em `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Origem:** revisão pós-PR #260 e redefinição do critério de sucesso funcional

## 1. Objetivo

Certificar o RADAR PDDE com foco no que importa para o usuário humano: executar tarefas reais com confiança de que as ações, regras, relações entre telas, gravações e atualizações de estado funcionam de ponta a ponta.

O objetivo desta frente não é maximizar quantidade de checks verdes nem perseguir elegância arquitetural abstrata. Testes unitários, CI, linters e gates continuam úteis como proteção, mas não são evidência suficiente de sucesso funcional quando não reproduzem a atividade real.

## 2. Princípio central de validação

Uma funcionalidade que altera estado só é considerada validada quando, quando aplicável, for comprovada nesta sequência:

`ação real na aplicação → persistência → leitura do banco → atualização/reload da página → nova leitura/renderização → conferência de telas e subopções relacionadas`

Quando a operação puder ser acionada repetidamente por interação humana, também deve haver prova de que clique repetido ou duplo gesto não produz gravações indevidas.

Quando uma ação deve ativar automaticamente outra informação, opção, status ou registro em outra área, a sincronização faz parte do mesmo cenário funcional.

## 3. Fora do escopo prioritário

Esta frente não terá como objetivo principal:

- ampliar regras de permissão entre perfis;
- endurecer autorização por princípio arquitetural;
- redesenhar quem pode editar cada informação;
- executar refactors sem defeito funcional comprovado;
- melhorar arquitetura que não tenha impacto direto na confiabilidade de execução;
- declarar sucesso apenas porque CI, testes unitários ou checks de infraestrutura estão verdes.

O RADAR é um sistema interno de equipe pequena. Perfis serão testados para comprovar que as funções que cada pessoa realmente usa funcionam, não para criar novas barreiras de permissão.

## 4. Critério de cobertura

Antes de corrigir novos defeitos, levantar uma matriz fechada das ações relevantes que:

- salvam;
- editam;
- excluem;
- encaminham;
- concluem;
- consolidam;
- reanalisam;
- registram novo envio;
- alteram tipo ou estado;
- geram registros derivados;
- atualizam automaticamente outra tela, subopção ou resumo.

Cada linha da matriz deve conter, no mínimo:

| Campo | Conteúdo |
| --- | --- |
| Área | módulo/tela principal |
| Ação real | operação executada pelo usuário |
| Estado inicial | pré-condição necessária |
| Resultado esperado | comportamento funcional |
| Persistência | confirmação direta no banco quando aplicável |
| Reload | estado após recarregar a aplicação |
| Relações | telas/subopções/resumos derivados que precisam acompanhar |
| Clique repetido | esperado quando a ação grava dados |
| Perfil funcional | perfil que utiliza a operação |
| Resultado | PASS / FAIL / CORRIGIDO |
| Evidência | teste, leitura de banco ou artefato correspondente |

Nenhuma área relevante fica implicitamente coberta apenas porque um teste genérico passou.

## 5. Áreas obrigatórias

### 5.1 Notas Fiscais

Validar de ponta a ponta:

- criação;
- edição;
- exclusão;
- consumo;
- permanente;
- serviço;
- Boleto de Internet quando aplicável;
- conversões entre tipos;
- criação e remoção dos efeitos patrimoniais derivados;
- análise individual por NF;
- vínculo com Consulta Assessoria quando aplicável;
- duas ou mais NFs no mesmo contexto;
- NFs de conteúdo semelhante sem colapso indevido;
- persistência após reload;
- clique repetido.

### 5.2 Capital e Inventário

Validar:

- criação automática do bem quando a NF exigir inventariação;
- vínculo com a NF de origem;
- impossibilidade funcional de concluir inventariação antes do encaminhamento;
- sequência `Não encaminhada → Encaminhada → Inventariada`;
- encaminhamento posterior;
- atualização do Prontuário em `Encaminhado para Inventariação`;
- comportamento agregado com múltiplos bens/NFs no mesmo contexto;
- edição permitida sem dessincronizar NF e bem;
- persistência após reload;
- clique repetido em encaminhamento e inventariação.

### 5.3 Pendências

Validar:

- criação por fluxo que exige Pendência;
- novo envio;
- reanálise correta;
- reanálise incorreta;
- resolução;
- reabertura quando prevista;
- cancelamento quando previsto;
- continuidade por NF individual;
- Consulta Assessoria individual;
- `a_identificar` com fluxo obrigatório;
- transformação posterior de `a_identificar` preservando continuidade;
- persistência após reload;
- reflexo em Prontuário e demais telas;
- clique repetido em novo envio e reanálise.

### 5.4 Prontuário e verificação mensal

Validar:

- bonificação;
- análise técnica;
- documentos e subopções relevantes;
- Consulta Assessoria;
- status agregados;
- consolidação;
- bloqueio de consolidação quando o mês estiver realmente incompleto;
- reabertura/continuidade posterior quando aplicável;
- persistência após reload;
- reflexos em Dashboard, Carteira, Pendências e Inventário quando a regra exigir.

### 5.5 Demais operações com gravação funcional

Inventariar no código e incluir na matriz toda ação equivalente a:

- Salvar;
- Registrar;
- Editar;
- Excluir;
- Concluir;
- Encaminhar;
- Consolidar;
- Reanalisar;
- Criar exercício/configuração operacional;
- Retificar;
- Atualizar dados de escola ou registros funcionais usados no trabalho.

Nenhuma ação encontrada pode ser ignorada apenas por não ter sido citada nominalmente nesta especificação.

## 6. Relações entre funcionalidades

A validação deve procurar especialmente defeitos de integração entre áreas, porque foram esses defeitos que escaparam de testes isolados anteriores.

Exemplos obrigatórios:

- NF permanente cria e mantém bem patrimonial correspondente;
- conversão de NF ajusta o efeito patrimonial correto;
- encaminhamento de bem atualiza Prontuário;
- inventariação não pode pular encaminhamento;
- análise individual de NF não altera outra NF;
- Pendência de NF A não interfere indevidamente em NF B;
- novo envio/reanálise atualizam a situação correta após reload;
- bonificação, análise técnica e Pendência mantêm independência funcional;
- ações que ativam automaticamente subopções ou resumos devem continuar ativas após reload;
- exclusão remove os efeitos derivados que a regra exige e não remove dados independentes.

## 7. Tipos de usuário

Perfis entram como dimensão funcional da matriz.

Testar, no mínimo, Controlador, Assistente, SME e Inventário nas atividades que de fato utilizam.

O objetivo é responder:

> “este usuário consegue realizar corretamente a tarefa que o sistema apresenta para ele?”

Não é objetivo desta frente ampliar restrições entre perfis.

## 8. Cliques repetidos e repetição de gesto

Para toda operação relevante de escrita, testar quando aplicável:

- duplo clique rápido;
- segundo clique enquanto o primeiro salvamento está em andamento;
- tentativa novamente depois de falha de gravação;
- ausência de duplicação de NF, Pendência, bem, log ou mudança de estado.

Proteção visual sem prova de persistência não é suficiente.

## 9. Método de correção

Quando um cenário falhar:

1. reproduzir de forma consistente;
2. localizar a causa raiz percorrendo interface → serviço → persistência → releitura;
3. criar regressão que falha pelo mesmo motivo;
4. fazer a menor correção funcional suficiente;
5. repetir a jornada completa;
6. confirmar banco e reload;
7. conferir telas relacionadas;
8. executar regressões laterais pertinentes;
9. incorporar o cenário à matriz permanente.

Não corrigir apenas o sintoma visual quando o problema estiver na persistência ou sincronização.

## 10. Hierarquia das provas

Para esta frente, a confiança segue esta ordem:

1. jornada real funcional com aplicação e persistência;
2. leitura direta do estado persistido;
3. reload e nova conferência;
4. sincronização entre superfícies relacionadas;
5. testes automatizados que reproduzem a jornada real;
6. testes unitários/integração isolada;
7. checks de estilo, análise estática e outros gates auxiliares.

Checks auxiliares continuam obrigatórios quando aplicáveis, mas não substituem as quatro primeiras camadas.

## 11. Critério de fechamento

Esta frente só pode ser declarada concluída quando:

- a matriz de operações estiver fechada e versionada;
- todas as linhas relevantes estiverem PASS ou CORRIGIDO;
- cada correção tiver regressão permanente;
- todas as operações de escrita críticas tiverem sido verificadas com persistência e reload;
- relações automáticas entre telas e subopções estiverem comprovadas;
- cenários de clique repetido estiverem cobertos onde aplicável;
- perfis relevantes tiverem suas atividades reais validadas;
- a documentação canônica refletir as regras realmente existentes;
- `CURRENT_STAGE.md`, handoff e documentação funcional estiverem atualizados;
- Production só for promovida depois da certificação do mesmo SHA.

O relatório final deve declarar números objetivos, por exemplo:

> `92/92 cenários funcionais certificados no SHA <sha>`

Não usar a expressão “verificação completa” sem indicar exatamente a matriz e o SHA cobertos.

## 12. Relação com o PR #260

O PR #260 permanece baseline válida e não deve ser refeito. Ele introduziu uma forma mais forte de provar alguns fluxos críticos com persistência e reload.

Esta frente amplia esse mesmo padrão para o restante das operações reais do produto e corrige qualquer lacuna funcional encontrada, sem ressuscitar tarefas históricas ou alterar regras posteriores já aprovadas.

## 13. Regra de precedência

Se documento histórico, teste antigo ou comentário de código conflitar com uma regra funcional posterior já aprovada e usada no produto, prevalece a decisão posterior confirmada pelo código atual, pelo comportamento esperado e pela documentação canônica atualizada.

Teste verde que preserve regra obsoleta deve ser corrigido, não tratado como prova de sucesso.
