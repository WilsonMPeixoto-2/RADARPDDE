# RADAR PDDE — Método adversarial de análise e implementação

**Estado:** protocolo operacional obrigatório  
**Instituído em:** 5 de setembro de 2026  
**Origem:** lições extraídas da auditoria adversarial executada com Codex/Astra Ultra sobre a baseline funcional do PR #260.

> Este método substitui a prática insuficiente de tratar suíte verde, documentação reconciliada ou gates de CI como prova de que uma funcionalidade está correta. Gates continuam necessários, mas são evidência de regressões conhecidas, não prova de ausência de defeitos desconhecidos.

## 1. Por que este método existe

O RADAR passou por várias rodadas de revisão em que testes, CI, Supabase, E2E e documentação ficaram verdes, mas defeitos continuaram escondidos entre fluxos que individualmente pareciam corretos.

A auditoria adversarial de 05/09/2026 demonstrou que os defeitos mais perigosos não estavam necessariamente dentro de uma função isolada. Eles apareciam em padrões como:

- fluxo A funciona + fluxo B funciona + a sequência `A → B → voltar a A` destrói um estado posterior;
- wrapper/serviço correto existe, mas o botão real usa outro caminho e o contorna;
- duas projeções atuais calculam a mesma ideia de maneiras diferentes;
- uma regra foi redefinida em migration posterior, mas matriz/teste/documento ainda aponta para a definição antiga;
- renderer/fallback legado continua executável por composição;
- teste verde protege uma expectativa histórica, uma fixture adversarial ou apenas parte do fluxo.

Portanto, **analisar corretamente não é confirmar o que já sabemos testar. É tentar produzir contraexemplos para o comportamento que acreditamos estar correto.**

## 2. Princípio central

Toda análise ou implementação relevante deve responder, antes de declarar fechamento:

1. **Onde esta regra está implementada pela segunda vez?**
2. **Que estado mais avançado esta operação pode destruir ao ser executada novamente?**
3. **Existe algum caminho real da UI que contorna o serviço/wrapper/RPC considerado autoritativo?**
4. **Que combinação de dois fluxos verdes nunca foi testada em sequência?**
5. **Qual contraexemplo faria este contrato aparentemente correto falhar?**

Se essas perguntas não foram investigadas, a revisão não é adversarial e não pode ser chamada de completa.

## 3. Etapa 0 — congelar baseline e cronologia de autoridade

Antes de analisar ou alterar:

1. consultar `main` remota e SHA exato;
2. verificar PRs funcionais posteriores e seu estado de merge;
3. ler `START_HERE.md`, `CURRENT_STATE.md`, `MASTER_PLAN_CURRENT.md` e `AGENTS.md`;
4. identificar o último hotfix/decisão que tocou a superfície;
5. separar claramente baseline integrada, PR candidato e histórico;
6. nunca promover PR aberto/abortado a contrato atual.

Para SQL/RPC, a autoridade é a **última definição efetiva da mesma assinatura em ordem de migrations**, não a primeira ocorrência encontrada por busca.

## 4. Etapa 1 — inventário mecânico amplo

Antes do aprofundamento semântico, produzir mapa de cobertura do repositório.

A busca deve incluir código, testes, migrations, pgTAP, scripts, docs correntes e históricas, fixtures, mocks, fallbacks e bootstrap.

Padrões de risco úteis, adaptados ao domínio da tarefa:

```text
transições: pendência, reanálise, novo envio, substituição, próximo ator, bonificação
entidades: invoice, nota fiscal, a_identificar, assessoria, patrimônio, inventário
identidade: row_version, linked_asset, bemId, verification_id, source_context
writes: rpc, save, update, insert, delete, remove, execute, persist
autoridade paralela: window, globalThis, prototype, fallback, legacy, mock, fixture, skip
assinaturas frágeis: Date.now, Math.random, índices de array, aliases históricos
```

A varredura mecânica serve para **encontrar candidatos e provar cobertura**, nunca para decidir semântica por regex.

## 5. Etapa 2 — mapa de autoridade por regra

Para cada regra crítica, desenhar a cadeia completa:

```text
UI real
→ handler/entrada pública
→ application service
→ domínio/planner
→ repository/data service
→ RPC/Edge Function
→ tabelas/estado persistido
→ leitura/reload
→ renderização
→ outras superfícies consumidoras
```

Depois procurar explicitamente **todas as autoridades laterais**:

- outro handler;
- closure privada;
- wrapper;
- extensão carregada dinamicamente;
- fallback legado;
- renderer antigo;
- chamada direta a repository/RPC;
- helper de domínio concorrente;
- código em `app.js` que repete regra existente em `src/`;
- callback global que altera estado funcional.

Encontrar uma implementação correta não encerra a investigação. É obrigatório procurar a segunda implementação potencialmente executável.

## 6. Etapa 3 — matriz de estados e teste de retorno à origem

Não limitar análise a `criar → editar → excluir`.

Para entidades que avançam de estado, testar o padrão:

```text
criar na origem
→ avançar em outro subsistema
→ consolidar/encaminhar/inventariar/reanalisar
→ voltar à entidade de origem
→ editar ou salvar novamente
→ persistir
→ reload
→ verificar se o estado avançado sobreviveu
```

Exemplo que revelou defeito real:

```text
criar NF permanente
→ bem Encaminhada
→ inventariar
→ salvar novamente a NF
→ o bem NÃO pode voltar para Encaminhada
```

Pergunta obrigatória: **uma regra de nascimento/criação está sendo reaplicada indevidamente a uma entidade já evoluída?**

## 7. Etapa 4 — testes de composição pelo ponto de entrada real

Testar a função correta isoladamente é insuficiente quando o usuário entra por outro caminho.

Exemplo de padrão obrigatório:

```text
clique no botão real
→ falhar a persistência/auditoria intermediária
→ verificar que o efeito posterior NÃO aconteceu
```

Se a regra diz “auditoria antes do download”, o teste deve começar no botão real e provar que falha de auditoria impede download. Testar apenas `auditExport()` não certifica que o botão usa essa autoridade.

O mesmo princípio vale para modal, atalho, callback, wrapper, extensão, API pública e chamada direta exposta em `window`.

## 8. Etapa 5 — comparação diferencial entre projeções

Quando Dashboard, Carteira, Pendências, Prontuário, timeline ou exportação mostram a mesma entidade/conceito:

1. criar **o mesmo registro**;
2. passá-lo por todas as projeções;
3. comparar status, ator, data-base, idade, rótulo e ação semântica;
4. distinguir diferença editorial legítima de divergência funcional.

Se duas projeções divergem, não escolher a mais antiga ou a mais conveniente. Classificar:

- bug comprovado;
- métricas diferentes mas legítimas;
- decisão de produto necessária;
- histórico/compatibilidade intencional.

## 9. Etapa 6 — auditoria adversarial dos próprios testes

Cada teste relevante deve ser classificado pelo que realmente representa:

- contrato atual;
- cenário legado/migração;
- fixture adversarial inválida;
- mock sintético;
- teste excluído com sucessor;
- expectativa obsoleta;
- prova de função isolada;
- prova de composição real.

Perguntas obrigatórias:

- o título descreve a assertion atual?
- o teste usa a mesma entrada que o usuário usa?
- a fixture representa estado possível hoje ou legado deliberado?
- existe mock que elimina justamente a camada onde o bug poderia estar?
- o teste está excluído? Existe sucessor explícito?
- uma suíte verde está validando duas regras concorrentes em arquivos diferentes?

Teste verde é evidência. **Não é autoridade autônoma nem prova de completude.**

## 10. Etapa 7 — persistência, falha e releitura

Para cada escrita crítica, exercitar proporcionalmente:

```text
ação
→ write remoto
→ leitura direta
→ reload
→ releitura
→ superfície relacionada
```

E, quando o risco justificar:

- falha antes do write;
- falha durante operação composta;
- commit remoto confirmado + falha local;
- rollback;
- no-op;
- retry ambíguo;
- clique/gesto repetido;
- duas operações concorrentes;
- edição posterior ao estado avançado;
- resposta parcial de RPC;
- reconciliação de entidade derivada.

Não apagar metadados ou relaxar monitor apenas para fazer integridade ficar verde.

## 11. Etapa 8 — cronologia de SQL/RPC e evidência

Ao auditar uma RPC:

1. localizar todas as migrations que definem ou redefinem a assinatura;
2. ordenar cronologicamente;
3. identificar a definição efetiva na baseline;
4. mapear grants/RLS/Edge callers correspondentes;
5. apontar testes sucessores;
6. marcar anchors de matriz/documentação que ainda levem à definição superada.

Migration histórica permanece imutável, mas não pode ser tratada como implementação vigente só porque contém o nome da função.

## 12. Etapa 9 — classificação obrigatória dos achados

Todo achado deve entrar em uma classe explícita:

- **A — correto e comprovado**;
- **B — bug funcional reproduzido**;
- **C — inconsistência de composição**;
- **D — documentação/teste obsoleto perigoso**;
- **E — duplicação arquitetural com risco**;
- **F — ambiguidade que exige decisão de produto**;
- **G — histórico legítimo isolado**;
- **H — hipótese ainda não reproduzida**.

Não transformar E/F/H em bug apenas para produzir uma lista maior. Também não esconder F sob a frase “não é bug”: uma decisão pendente é informação que deve ser levada ao responsável pelo produto.

## 13. Etapa 10 — implementação após a descoberta

A implementação deve herdar o mesmo rigor da análise.

Antes do código:

1. reproduzir o defeito atual com probe/teste focal;
2. registrar causa raiz, não só sintoma;
3. localizar consumidores e autoridades paralelas;
4. congelar invariantes que não podem regredir;
5. identificar estados avançados que precisam sobreviver.

TDD obrigatório para defeito funcional:

```text
RED reproduz causa real
→ mudança mínima
→ GREEN focal
→ jornadas relacionadas
→ composição real
→ persistência/reload
→ revisão adversarial do diff
```

Não misturar refatoração estética com hotfix. Duplicação arquitetural é tratada separadamente salvo quando for a própria causa raiz.

## 14. Etapa 11 — critério de fechamento adversarial

Antes de escrever “fechamento confirmado”, registrar explicitamente:

### O que foi tentado para provar que ainda estava errado?

No mínimo, conforme o domínio:

- contraexemplos criados;
- sequências entre dois fluxos verdes;
- teste de retorno à origem após estado avançado;
- caminhos paralelos procurados;
- falhas intermediárias injetadas;
- comparação entre projeções;
- reload/releitura;
- migrations sucessoras verificadas;
- testes/fixtures históricos classificados.

Uma lista de jobs verdes sem essa seção comprova apenas que os gates conhecidos passaram.

## 15. Artefatos recomendados de auditoria

Para auditorias amplas, preservar quando útil:

- inventário do repositório;
- cobertura da varredura;
- mapa estático de áreas/autoridades;
- evidências por regra;
- probes reproduzíveis;
- logs focalizados;
- tabela `REGRA → IMPLEMENTAÇÃO → TESTES → DOCUMENTAÇÃO → CONFLITOS → CLASSIFICAÇÃO → RISCO → AÇÃO`.

Esses artefatos evitam que uma sessão futura gaste a cota repetindo a mesma varredura e tornam a revisão auditável.

## 16. Anti-padrões proibidos

- “todos os testes passaram, então não há bug”;
- “o wrapper está correto, então o botão real deve estar correto”;
- “há teste E2E do fluxo A e do fluxo B, então A→B está coberto”;
- “uma migration contém a RPC, então ela é a definição vigente”;
- “o documento diz canônico, então prevalece sobre decisão posterior”;
- “há duas implementações e hoje concordam, então não existe risco”;
- “é decisão de produto, então não preciso comunicar”;
- “fixture impossível hoje deve ser removida”, sem verificar se representa legado/adversarial;
- criar blacklist ampla por palavras como `legacy`, `rowVersion`, `listUsers`, `setTimeout` ou `30 colunas` sem contexto;
- relaxar threshold, apagar histórico ou remover metadado para fabricar verde.

## 17. Adaptação por tipo de tarefa

### Auditoria funcional

Priorizar sequências de estados, composição real, cross-view e persistência/reload.

### Auditoria arquitetural

Priorizar autoridades concorrentes, fallbacks executáveis, callbacks globais, wrappers com autoridade funcional, módulos opcionais que mudam correção e duplicação de projeções.

### Banco/Supabase

Priorizar última definição por assinatura, atomicidade, RLS/grants, rollback, concorrência, resposta autoritativa e round-trip.

### Testes

Priorizar significado real da fixture, cobertura de composição, títulos obsoletos, exclusões/sucessores e lacunas entre fluxos.

### Implementação

Reproduzir primeiro, preservar estados avançados, inspecionar consumidores, aplicar mudança mínima, testar composição e tentar quebrar a própria correção antes de encerrar.

## 18. Regra permanente

O objetivo não é obter mais verde. O objetivo é **descobrir se o produto está errado mesmo quando tudo conhecido está verde**.

Este protocolo deve ser adaptado proporcionalmente ao tamanho da tarefa, mas suas perguntas centrais não podem ser omitidas em fluxos críticos.