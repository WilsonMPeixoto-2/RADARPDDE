# Método de engenharia e revisão adversarial do RADAR PDDE

**Estado:** referência operacional canônica  
**Aplicação:** todas as futuras análises, correções, implementações, refatorações e revisões do RADAR PDDE  
**Atualizado em:** 6 de setembro de 2026  
**Origem dos ensinamentos:** histórico recente do projeto, especialmente #265, #266, #271, #272 e a revisão independente registrada em `docs/audits/2026-09-06-pr272-inventory-auth-review.md`.

## 1. Finalidade

Este documento registra um método de trabalho para reduzir regressões, correções incompletas e ciclos em que um hotfix resolve o sintoma imediato, mas deixa falhas nas interações ao redor.

Ele não descreve apenas como resolver os PRs usados como exemplo. Os casos históricos servem para ensinar padrões que devem ser reutilizados em qualquer frente futura.

A regra central é:

> Uma correção não está suficientemente provada porque corrige o cenário que a motivou e seus próprios testes passam. Ela precisa sobreviver a tentativas deliberadas de refutação nas fronteiras que toca.

O objetivo não é transformar toda mudança pequena em uma auditoria infinita. O grau de investigação deve ser proporcional ao risco. Quanto mais a mudança tocar persistência, concorrência, autenticação, compensação, wrappers, bootstrap, estado compartilhado ou múltiplas telas, maior deve ser a prova de integração.

## 2. Ponto de partida obrigatório

Antes de editar código:

1. revalidar a `main` remota e o SHA do candidato;
2. ler `AGENTS.md`, `docs/CURRENT_STAGE.md` e os documentos correntes da frente;
3. localizar a implementação atual no código, não apenas o plano ou teste que descreve a intenção;
4. procurar implementações equivalentes, guards, triggers, RPCs, wrappers e extensões que já cubram a mesma regra;
5. mapear produtores e consumidores do estado afetado;
6. identificar as fronteiras externas: Supabase, Auth, DOM, timers, fila, rede, arquivo, navegador ou outro serviço;
7. registrar quais afirmações são comprovadas no SHA atual e quais são apenas hipóteses.

O primeiro trabalho de uma correção é confirmar que a lacuna ainda existe. Encontrar que a proteção já está implementada é um resultado válido e, muitas vezes, melhor que escrever outro hotfix.

## 3. Sequência de raciocínio

Usar esta sequência em problemas materiais:

```text
suspeita
→ mecanismo possível
→ reprodução controlada
→ contraprova
→ classificação
→ causa raiz
→ menor correção coerente
→ regressão executável
→ revisão adversarial da própria correção
→ gates proporcionais no SHA final
```

Não converter diretamente:

```text
possibilidade → defeito → implementação
```

Uma possibilidade arquitetural só vira defeito confirmado quando existe evidência suficiente de que o comportamento incorreto pode ocorrer no código corrente.

## 4. Testar invariantes, não a forma da implementação

Testes devem provar o estado correto do produto, não apenas que determinada função foi chamada.

Exemplos de invariantes relevantes:

- banco remoto e memória local convergem depois de uma operação confirmada;
- uma intenção do usuário produz uma única gravação quando a operação não é idempotente por repetição;
- um estado terminal não regride;
- uma mensagem posterior não é apagada por timer anterior;
- uma compensação não destrói estado quando o commit remoto é desconhecido;
- o fluxo legítimo vizinho continua funcionando após a introdução de um guard;
- após reload, o usuário reencontra o mesmo estado confirmado.

Contadores de chamadas são evidência auxiliar. Eles não substituem verificação do estado final.

Sempre que possível, validar:

```text
estado remoto final
=
estado local final
=
estado apresentado ao usuário
```

Quando essa igualdade não puder ser garantida imediatamente, o sistema deve representar explicitamente a sincronização pendente ou a falha, sem declarar convergência inexistente.

## 5. Preferir código real com fronteiras controladas

Para fluxos críticos, preservar o máximo possível do código de produção dentro da reprodução.

Preferir:

```text
serviço real
+ UnitOfWork real
+ DataService real
+ bootstrap real quando relevante
+ DOM real quando relevante
+ apenas rede/Auth/banco/tempo controlados na fronteira
```

Evitar reproduções compostas principalmente por objetos falsos que apenas imitam a interpretação que o autor já tem do fluxo.

Mocks e fakes são úteis nas extremidades. Quanto mais um mock substituir lógica interna do produto, menor é a capacidade do teste de revelar problemas de composição.

## 6. Ordem e tempo são parte do comportamento

Para qualquer fluxo assíncrono, investigar não apenas valores de entrada e saída, mas também ordens relevantes.

Quando houver concorrência, refresh, retry, fila, timer, debounce, listener ou múltiplas operações consecutivas, construir interleavings determinísticos.

Modelo:

```text
A começa
→ A chega à fronteira crítica
→ reter explicitamente a continuação de A
→ executar B
→ confirmar B
→ liberar A
→ verificar estado final
```

Usar Promises, barreiras, resolvers ou relógio controlado. Evitar `sleep` como mecanismo principal para provocar corrida. Um teste que depende de sorte temporal pode esconder a falha justamente quando deveria prová-la.

Cenários mínimos a considerar conforme a frente:

- A termina antes de B;
- B termina antes da reconciliação de A;
- resposta antiga chega depois de estado novo;
- retry ocorre depois de resultado remoto desconhecido;
- timer antigo dispara depois que outro produtor assumiu o mesmo elemento/estado.

## 7. Composição precisa ser testada como composição

Se dois componentes podem alterar a mesma rota de execução, testar o conjunto real.

Isso se aplica especialmente a:

- wrappers;
- monkey patches;
- extensões;
- bootstrap;
- listeners;
- observers;
- decorators;
- módulos carregados em sequência;
- múltiplos produtores do mesmo estado ou elemento visual.

Para essas áreas, considerar:

```text
ordem real
ordem inversa relevante
instalação tardia
reinstalação
instalação duplicada
```

E verificar efeitos materiais, por exemplo:

```text
1 intenção
1 execução remota
1 efeito esperado
0 duplicações
```

Testar cada função isoladamente não prova que elas continuam corretas quando compostas.

## 8. Falhas remotas devem considerar resultado ambíguo

Em sistemas distribuídos, erro recebido pelo cliente não prova que a operação não ocorreu.

Para RPC, Auth, Edge Function e qualquer escrita remota importante, considerar ao menos:

1. falha antes de enviar;
2. falha durante o envio, com estado desconhecido;
3. rejeição remota comprovadamente anterior ao commit;
4. commit concluído e resposta recebida;
5. commit concluído e resposta perdida;
6. retry depois de resultado desconhecido;
7. duplicação/replay da mesma intenção quando aplicável.

Regra de segurança:

> Não executar compensação destrutiva apenas porque a resposta de uma operação remota se perdeu.

Antes de desfazer Auth, vínculo, registro, bem ou outra entidade, provar se o efeito remoto realmente não foi confirmado ou reconciliar pela identidade durável da operação.

## 9. Estado compartilhado exige mapa de produtores e consumidores

Antes de alterar estado compartilhado, localizar:

```text
quem escreve?
quem lê?
quem limpa?
quem substitui?
quem agenda timer?
quem restaura?
quem persiste?
quem reaplica após reload?
```

Isso vale para estado de aplicação, DOM, competência, mensagens, pendências, verificações, assets, logs, perfil autenticado e qualquer outro recurso usado por mais de um fluxo.

Uma correção em um produtor não pode presumir propriedade exclusiva sobre um recurso compartilhado.

## 10. Guard deve proteger o proibido e preservar o legítimo

Toda nova proteção funcional deve provar os dois lados:

```text
caso proibido → bloqueado sem efeito parcial
caso legítimo vizinho → continua funcionando
```

Quando houver persistência/log:

- o caso proibido não deve deixar gravação parcial ou log falso;
- o caso legítimo deve preservar concorrência e auditoria existentes.

Isso evita guards excessivos que corrigem um defeito criando outro.

## 11. Contraprovas e controles

Quando a causalidade estiver incerta, usar um controle comparável.

Exemplos:

- candidato versus `main`;
- antes versus depois;
- ordem A→B versus B→A;
- falha injetada versus fluxo normal;
- concorrência versus execução serial;
- branch alterada versus controle sem a alteração.

Uma medição ruim no candidato não prova que o candidato a causou. Uma medição boa isolada também não apaga um gate agregado vermelho.

Performance deve ser tratada da mesma forma: respeitar número de rodadas e thresholds definidos; não repetir até obter uma execução conveniente.

## 12. Revisão adversarial da própria correção

Depois que o RED virar GREEN, fazer uma segunda leitura com uma pergunta diferente da usada para implementar:

> De que outras maneiras esta solução pode produzir um estado incorreto mesmo que o cenário original esteja corrigido?

A revisão deve procurar, conforme o risco:

- segunda implementação da mesma regra;
- ordem de bootstrap;
- estado compartilhado;
- concorrência;
- resposta tardia;
- reload;
- falha no meio da operação;
- commit remoto sem ACK;
- retry;
- dupla intenção/duplo clique;
- compensação;
- log sem efeito correspondente;
- efeito sem log correspondente;
- retorno que declara sucesso maior que o estado realmente comprovado;
- fixture ou teste que mascara integração real.

Quando materialmente possível, essa revisão deve usar uma reprodução diferente do teste que guiou a implementação.

## 13. Métodos vulneráveis já observados

| Método vulnerável | Por que falha | Substituição preferida |
|---|---|---|
| Testar apenas a função corrigida | Não vê composição e consumidores | Executar a rota real com fronteiras controladas |
| Contar chamadas e inferir convergência | Uma chamada pode aplicar estado errado | Comparar estado remoto/local/visual final |
| `Promise.all()` sem controlar interleaving | Corridas aparecem por acaso | Barreiras determinísticas e resposta retida |
| `sleep` para provocar concorrência | Teste flaky e pouco reproduzível | Promise/resolver/relógio controlado |
| Mockar o sistema inteiro | O teste prova o mock, não o produto | Código real no núcleo, fake apenas na fronteira |
| Interpretar erro remoto como rollback | Commit pode ter ocorrido | Reconciliar resultado ambíguo antes de compensar |
| Testar wrappers separadamente | Cada peça pode passar e o conjunto falhar | Teste da ordem real de bootstrap/composição |
| Considerar CI verde como prova completa | CI cobre apenas cenários conhecidos | Revisão adversarial das bordas tocadas |
| Implementar antes de procurar proteção existente | Duplica regra e aumenta conflito | Refutar primeiro a necessidade do hotfix |
| Corrigir só o caso proibido | Pode quebrar vizinhos legítimos | Par proibido + legítimo |
| Repetir Lighthouse até verde | Seleciona ruído favorável | Controle comparável e protocolo fixo |
| Tratar auditoria histórica como estado atual | Pode reintroduzir regra superada | Revalidar por SHA no código corrente |

## 14. Exemplos históricos que originaram o método

Os exemplos abaixo ensinam o método. Seus estados específicos pertencem aos SHAs citados nos relatórios e não devem ser promovidos automaticamente a estado corrente no futuro.

### 14.1 #265 — refutar antes de implementar

Uma revisão posterior suspeitava que `Inventariada` ainda poderia regressar. Em vez de criar outro guard/migration, a investigação verificou o serviço, o trigger, a RPC, a migration e reutilizou o harness oficial.

A reprodução confirmou:

```text
Não encaminhada → Encaminhada → Encaminhada
Inventariada → forward rejeitado
```

O caso terminal preservou estado e não gerou persistência/log falso. A conclusão correta foi não implementar outra proteção.

**Ensinamento:** ausência no primeiro arquivo consultado não significa ausência no sistema.

### 14.2 #272 — RED/GREEN isolado era necessário, mas insuficiente

O PR corrigia um defeito real: commit remoto confirmado seguido de falha local não deveria provocar nova escrita nem sucesso limpo. Os testes novos reproduziram o defeito na main e passaram no candidato.

Ainda assim, a revisão adversarial encontrou problemas porque ampliou as perguntas além do caso original.

#### Composição de wrappers

O wrapper de performance capturava `execute` na instância antes de o feedback alterar o protótipo. Cada módulo funcionava isoladamente, mas a ordem real do bootstrap contornava o feedback.

A reprodução comparou ordem real e inversa e depois confirmou o resultado no Chromium com bootstrap real.

**Ensinamento:** módulos verdes isoladamente não provam composição verde.

#### Corrida de reconciliação

A fila existente protegia `UnitOfWork.run`, mas terminava antes da reconciliação local do `DataService`. Uma leitura antiga de A podia ser entregue depois do commit/aplicação de B e restaurar estado local antigo.

A reprodução reteve a resposta de A por Promise explícita, executou B e depois liberou A. Não usou `sleep`.

**Ensinamento:** serializar a escrita não basta quando a finalização local ocorre fora da mesma fronteira de ordem.

#### Classificação de falha

Contar duas chamadas de `applyCanonical` não provava que a segunda aplicação tinha sido bem-sucedida. A revisão injetou falha exatamente na segunda aplicação e verificou os campos finais de sincronização.

**Ensinamento:** verificar significado do estado retornado, não somente quantidade de chamadas.

#### Região visual compartilhada

O mesmo `#pendency-notice` era usado por produtores diferentes. Um timer de sucesso antigo podia ocultar erro de Pendência posterior.

**Ensinamento:** ao compartilhar recurso visual, compartilhar também propriedade, identidade e ciclo de vida.

### 14.3 #271 — commit ocorrido com resposta perdida

A revisão executou o código real da Edge Function com Auth/RPC controlados e simulou:

```text
convite Auth confirmado
→ RPC efetiva commit
→ resposta da RPC se perde
→ catch interpreta como falha
→ compensação remove Auth
```

O defeito não estava no caminho feliz nem na ambiguidade do convite já tratada pelo candidato. Estava na fronteira posterior entre commit e ACK.

**Ensinamento:** em fronteira distribuída, `erro` e `não aconteceu` são estados diferentes.

## 15. Adaptação por tipo de tarefa

| Tipo de mudança | Prova mínima recomendada quando o risco existir |
|---|---|
| Regra de domínio simples | caso válido + inválido + vizinho legítimo + efeitos/log |
| UI/feedback | DOM real, produtores/consumidores, lifecycle e acessibilidade afetada |
| Bootstrap/extensão/wrapper | ordem real, inversa relevante, tardia e repetida |
| Persistência | estado antes/depois, retorno remoto, memória, reload |
| Concorrência | interleaving determinístico sem depender de `sleep` |
| RPC/transação | falha antes, durante, após commit e ACK perdido conforme aplicável |
| Auth | identidade, vínculo, compensação, idempotência e resultado ambíguo |
| Migration/trigger | service, caminho direto, conflito otimista e ausência de efeito parcial |
| Exportação/auditoria | efeito + registro correspondente + bloqueio se auditoria obrigatória falhar |
| Performance | candidato + controle comparável + protocolo de medição fixo |
| Documentação | SHA temporal, precedência do código e distinção entre atual/histórico/candidato |

Mudança pequena e local não precisa executar todas essas classes. A matriz indica o que se torna obrigatório quando a mudança realmente toca aquela fronteira.

## 16. Critério de prontidão de um PR

Para alteração funcional material, não declarar pronto apenas com “testes verdes”. Verificar:

1. o defeito ou requisito foi comprovado no baseline correto;
2. a causa raiz foi identificada;
3. não existe correção equivalente já integrada;
4. a menor mudança coerente foi implementada;
5. o teste do defeito falha antes e passa depois quando isso é aplicável;
6. invariantes finais foram verificados;
7. interações materiais tocadas pela mudança foram atacadas adversarialmente;
8. fluxo legítimo vizinho permanece válido;
9. falhas de CI foram classificadas como produto, teste, infraestrutura ou variabilidade;
10. os gates proporcionais passaram no SHA final, ou qualquer vermelho remanescente está explicitamente classificado sem ser ocultado;
11. documentação corrente foi atualizada somente onde realmente mudou.

Para mudanças P0/P1 ou transversais, a revisão adversarial faz parte do trabalho de implementação, não é uma etapa opcional terceirizada a outro modelo.

## 17. Continuidade entre chats e ferramentas

Este método deve ser aplicado independentemente de quem estiver executando a tarefa: ChatGPT, Codex, Astra, outro agente ou revisão humana.

Uma nova conversa não deve depender da memória da conversa anterior para conhecer estas práticas. Por isso este documento faz parte da rota obrigatória de `AGENTS.md`.

Ao produzir nova evidência metodológica relevante:

- registrar o caso por SHA;
- explicar qual método falhou ou funcionou;
- generalizar o ensinamento somente quando houver base para reutilização;
- preservar o relatório histórico sem reescrevê-lo para parecer atual;
- atualizar este documento quando surgir um novo padrão de engenharia realmente útil.

A metodologia é duradoura. Os exemplos são históricos.

## 18. Relação com outros documentos

- `AGENTS.md`: define a rota obrigatória e regras do projeto.
- `docs/reference/TEST_GOVERNANCE.md`: classifica testes, falhas e validação proporcional.
- `docs/CURRENT_STAGE.md`: registra o estado operacional corrente.
- `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`: registra contratos funcionais vigentes.
- `docs/audits/2026-09-06-pr272-inventory-auth-review.md`: evidência histórica detalhada que originou parte relevante deste método.
- `docs/evidence/2026-09-06-pr-review/`: reproduções executáveis que demonstram os padrões históricos usados como exemplo.

Quando houver conflito, este documento não substitui a hierarquia de fontes de verdade do `AGENTS.md`. Ele define **como investigar e provar**, não qual regra de negócio deve vencer.