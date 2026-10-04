# Incidente real de 02/10/2026 e relevância por escola

## Objetivo

Este documento inicia uma frente limpa a partir da `main` pós-#408. O PR #407 permanece como laboratório e fonte de evidências; esta frente só deve incorporar correções cuja utilidade seja demonstrada contra o comportamento real de Production.

A hipótese de relevância por escola é importante, mas **não é considerada explicação única nem suficiente** para os incidentes. O trabalho continua investigando causas adicionais e efeitos em banco, navegador, autenticação, retry, concorrência e renderização.

## Evidência herdada do #407

O #407 já demonstrou que:

- reduzir leituras dos usuários que escrevem não basta se observadores passivos passam a reler contexto completo com frequência;
- o candidato antigo reduziu tentativas/aborts, mas aumentou payload, SQL e reconstruções de DOM;
- uma classe de flicker do Prontuário foi causalmente ligada à reconstrução do painel com reaplicação de animação;
- leituras lentas e eventos concorrentes podem abrir janelas temporais que geram trabalho adicional;
- testes verdes não bastam quando preservam uma implementação histórica em vez do requisito operacional.

Essas evidências serão reutilizadas. Não haverá repetição indiscriminada da bateria inteira do #407.

## Uso operacional real informado pelo produto

O pico relevante não é normalmente composto por vários Controladores na mesma escola.

O padrão real é:

- aproximadamente seis pessoas podem trabalhar ativamente ao mesmo tempo em períodos de pico;
- cada Controlador trabalha predominantemente nas escolas que lhe foram atribuídas;
- dois Controladores atuando exatamente na mesma escola ao mesmo tempo é possível, mas altamente improvável;
- Controlador e Assistente de Verbas Federais na mesma escola é um cenário real e importante, inclusive quando a Assistente faz uma correção que o perfil de Controlador não pode executar;
- todos continuam autorizados a acessar as escolas permitidas pelo modelo atual; carteira não é autorização;
- nenhuma pessoa deve depender de Ctrl+F5 para encontrar dados atuais.

A consequência é que atualização imediata e detalhada deve ser proporcional à relevância para a tela em uso, não ao simples fato de alguma escrita ter ocorrido em qualquer escola.

## Produção em 02/10/2026

Os logs de Production foram examinados por hora e em janelas de cinco minutos.

### Janela crítica: 15:00–15:59 BRT

- 938 `POST /rest/v1/rpc/read_operational_context`;
- 325 operações de escrita observadas;
- 280 chamadas de `save_verification_with_log`;
- 148 respostas HTTP 5xx no `read_operational_context`;
- média de aproximadamente 3,76 s por leitura completa;
- p95 de aproximadamente 10,70 s;
- máximo observado superior a 15 s.

A degradação se concentra especialmente entre 15:20 e 15:40:

- 15:20–15:24: 118 leituras, 42 escritas, 37 erros 5xx, média ~5,74 s;
- 15:25–15:29: 86 leituras, 37 escritas, 13 erros, média ~4,75 s;
- 15:30–15:34: 80 leituras, 48 escritas, 38 erros, média ~7,73 s;
- 15:35–15:39: 61 leituras, 40 escritas, 21 erros, média ~7,29 s.

### Contraprova: 18:00–18:59 BRT

Na mesma data houve uma hora com atividade de escrita ainda maior:

- 739 leituras completas;
- 466 operações de escrita;
- apenas 2 respostas 5xx;
- média de aproximadamente 274 ms nas leituras completas.

Portanto, `muitas escritas` não explica sozinha a falha. A concorrência de usuários e gravações compõe o cenário, mas outras condições distinguem as janelas ruins das saudáveis.

## Primeira correção candidata

Quando uma alteração traz `schoolId` conhecido e o usuário permanece no Prontuário de outra escola:

1. não baixar imediatamente todo o contexto operacional;
2. registrar localmente que aquela escola possui dados novos;
3. continuar o trabalho atual sem reconstruir a tela não relacionada;
4. ao navegar para a escola alterada, reconciliar automaticamente antes de considerar a tela atual;
5. se a alteração pertence à escola atualmente aberta, manter atualização automática rápida;
6. payload sem escola conhecida continua usando o caminho conservador/global;
7. reconexão continua exigindo recuperação segura.

Isso reduz amplificação cruzada sem transformar a divisão de carteiras em regra de autorização.

## Cenários de aceitação

A nova frente deve provar, no mínimo:

- seis Controladores alterando seis escolas diferentes não provocam releituras completas cruzadas em todas as sessões;
- Controlador + Assistente na mesma escola convergem automaticamente;
- navegar posteriormente para uma escola alterada apresenta a versão atual sem Ctrl+F5;
- nenhuma correção do #408 é regredida, especialmente recuperação após falha/stale, cooldown, retomada de aba e proteção de concorrência fiscal;
- alterações sem `schoolId`, reconexão ou dependências globais permanecem conservadoras;
- integridade no banco, foco, scroll e edição em andamento continuam preservados.

## Investigação que permanece aberta

Mesmo que a relevância por escola produza ganho substancial, ainda devem ser confrontados no incidente de 02/10:

- por que 15:20–15:40 degradou e 18:00 permaneceu saudável com mais escritas;
- possível formação de fila/efeito cascata de retries;
- custo e frequência da RPC completa;
- contenção e tempos das RPCs de escrita;
- comportamento de autenticação/renovação de sessão;
- número real de sessões por usuário;
- operações específicas que antecederam os picos de erro;
- efeitos de renderização e reconstrução no navegador;
- outras causas independentes ainda não identificadas.

A correção será promovida somente se melhorar o cenário realista sem mascarar ou piorar essas outras dimensões.