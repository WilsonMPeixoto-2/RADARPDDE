# Gate permanente de validação pelo usuário no frontend

**Estado:** referência operacional canônica  
**Aplicação:** todas as futuras correções, implementações, refatorações, otimizações e alterações visuais ou funcionais do RADAR PDDE  
**Atualizado em:** 28 de setembro de 2026  
**Complementa:** `docs/reference/ENGINEERING_METHOD.md`

## 1. Regra central

Nenhuma alteração que possa afetar comportamento percebido pelo usuário pode ser considerada concluída apenas porque o código está correto, os testes internos passaram, o build foi gerado ou o banco aceitou a gravação.

A conclusão exige também validação do produto pela interface real, no frontend, reproduzindo a forma como o usuário efetivamente utiliza o RADAR PDDE.

A regra é:

> Código verde sem jornada real do usuário comprovada não encerra a tarefa.

A aceitação de uma mudança percebida pelo usuário possui **duas aprovações independentes**:

    aprovação técnica
    +
    aprovação humana do resultado renderizado
    =
    tarefa concluída

A aprovação técnica demonstra que a regra, persistência e integrações funcionam. A aprovação humana demonstra que uma pessoa consegue perceber, ler, entender e operar o resultado composto. Uma não substitui a outra.

O prompt recebido não é uma especificação exaustiva de qualidade visual. O agente deve preservar os requisitos implícitos de uso humano mesmo quando o usuário descreve apenas a ideia funcional.

O objetivo é evitar regressões em que serviços, handlers, módulos, migrations ou testes aparentem estar corretos, mas a funcionalidade falhe quando o usuário navega, clica, preenche, salva, atualiza a página ou retorna ao registro.

## 2. Escopo obrigatório

Este gate é permanente e se aplica a todas as frentes futuras na medida do impacto da mudança, incluindo:

- correções de bugs;
- novas funcionalidades;
- refatorações;
- alterações de bootstrap, readiness, carregamento ou performance;
- alterações de persistência e sincronização;
- mudanças de regra de negócio;
- alterações de perfil, autorização ou contexto;
- mudanças de layout, componentes, modais, drawers, botões, filtros, tabs e navegação;
- alterações que possam produzir efeitos indiretos em outras telas.

O grau de cobertura deve ser proporcional ao risco. Mudanças pequenas não exigem percorrer o sistema inteiro, mas toda superfície materialmente tocada deve ser validada pela interface real.

## 3. Três camadas de prova

Uma entrega relevante deve combinar três tipos de evidência.

### 3.1 Código, arquitetura e persistência

Validar, conforme aplicável:

- testes unitários e de integração;
- contratos e invariantes;
- serviços e handlers;
- migrations, RPCs, RLS e Auth;
- persistência e integridade do Supabase;
- build e demais gates técnicos proporcionais.

Essa camada é necessária, mas não suficiente.

### 3.2 Automação pelo navegador real

Usar Playwright, Playwright MCP ou ferramenta equivalente para executar a jornada pelo frontend, interagindo com os mesmos controles disponíveis ao usuário. Quando a prova depender de SSO/2FA/sessão existente, o modo MCP com extensão pode reutilizar a sessão autorizada; isso não muda os guardrails de escrita ou ambiente.

Sempre que materialmente possível, o teste deve:

1. autenticar pelo fluxo real;
2. navegar pela interface;
3. clicar nos controles reais;
4. preencher os campos pela UI;
5. executar a ação visível ao usuário;
6. conferir a resposta da interface;
7. verificar o estado persistido quando houver gravação;
8. atualizar/recarregar a página;
9. reencontrar o mesmo estado após a releitura;
10. verificar efeitos relacionados em outras telas quando a regra for transversal.

Não substituir essa prova por chamada direta ao serviço quando a finalidade do teste for afirmar que a funcionalidade está disponível e funciona para o usuário.

### 3.3 Homologação visual e navegada

Inspecionar a interface renderizada, por screenshots, visual snapshots versionados, traces, vídeo ou navegação interativa apropriada, para confirmar que o produto continua utilizável e visualmente íntegro. Baseline visual automatizado é regressão complementar; atualização do golden exige revisão consciente do diff.

Verificar conforme o impacto:

- botão, ação, aba, filtro ou link realmente presente;
- posicionamento e hierarquia visual coerentes;
- textos e estados visíveis corretos;
- modal/drawer abrindo e fechando;
- feedback de sucesso, erro, bloqueio e carregamento;
- ausência de sobreposição, corte ou componente invisível;
- navegação, voltar/avançar e mudança de contexto;
- atualização da tela após gravação;
- persistência após refresh;
- console e rede sem erro material relacionado à jornada.

### 3.4 Leitura humana outside-in obrigatória

Esta etapa existe para impedir que a própria implementação determine o critério de sucesso.

O agente deve fazer uma segunda leitura começando pela tela, não pelo código. A intenção é reproduzir, de forma disciplinada, a perspectiva de uma pessoa que não conhece handlers, seletores, classes CSS, serviços ou decisões internas.

#### Passagem A — primeira leitura

Com a interface já renderizada, antes de consultar a implementação para explicar o resultado, registrar em linguagem comum:

    Onde estou?
    O que estou vendo?
    Qual registro ou assunto está em foco?
    Qual é o estado atual?
    O que parece mais importante?
    O que eu faria agora?
    O que espero que aconteça depois?

A resposta deve ser inferível pela tela. Se o agente só consegue responder porque conhece o código ou o roteiro do teste, a interface reprova essa passagem.

#### Passagem B — varredura de integridade visual

Observar o conjunto completo e verificar:

- legibilidade;
- espaçamento e respiro;
- alinhamento;
- contraste;
- clipping e truncamento;
- overflow horizontal ou vertical inesperado;
- sobreposição;
- hierarquia entre informação principal e secundária;
- densidade;
- coerência com componentes vizinhos e superfícies relacionadas;
- comportamento no viewport suportado;
- affordance de controles e áreas clicáveis;
- feedback visível;
- continuidade visual durante mudança de estado.

Não examinar apenas o elemento novo. A pergunta é se **o produto resultante** continua coerente depois que o novo elemento passou a conviver com os anteriores.

#### Passagem C — compreensão e continuidade

Executar a ação principal e responder novamente, pela interface:

    O que acabou de acontecer?
    O estado mudou para quê?
    Quem precisa agir agora?
    Existe uma próxima ação clara?
    Eu consigo reencontrar este caso se navegar, voltar ou recarregar?

Uma mensagem como “Operação realizada com sucesso” pode ser tecnicamente verdadeira e ainda ser insuficiente se a consequência relevante para o usuário permanecer ambígua.

#### Passagem D — só então correlacionar com o código

Depois de registrar a percepção da tela, usar DOM, CSS, JavaScript, trace e DevTools para explicar a causa de qualquer problema observado.

A ordem é intencional:

    percepção humana
    → problema observado
    → mecanismo técnico

e não:

    implementação parece correta
    → portanto a tela deve estar boa

Esta passagem não substitui teste com usuários reais quando esse nível de pesquisa for necessário. Ela estabelece o mínimo obrigatório de julgamento humano para qualquer agente que implemente ou revise interface.

## 4. Testar a jornada, não apenas a função

Sempre que uma alteração tocar uma funcionalidade real, formular ao menos uma prova no formato de jornada do usuário.

Exemplo inadequado como prova única:

```text
InvoiceService.save() retorna sucesso.
```

Exemplo adequado:

```text
login
→ abrir Carteira
→ escolher escola
→ abrir Prontuário
→ selecionar competência/programa
→ abrir Nota Fiscal
→ editar/preencher
→ clicar em Salvar
→ observar atualização da tela
→ verificar persistência
→ atualizar o navegador
→ reabrir a Nota Fiscal
→ confirmar que o estado permanece correto
→ conferir reflexos relacionados, quando houver
```

O mesmo princípio vale para Pendências, patrimônio/inventário, retificações, equipe, competências, filtros, exportações e demais fluxos do produto.

## 5. Primeira navegação e ordens alternativas

Alterações de bootstrap, readiness, carregamento, lazy loading, instalação de módulos ou navegação exigem atenção adicional.

Não basta provar uma jornada depois que outras telas já inicializaram dependências.

Quando relevante, testar também:

- funcionalidade como primeira superfície acessada após o login;
- acesso direto por rota;
- troca de perfil/contexto antes da primeira abertura da tela;
- navegação em ordem diferente da jornada principal;
- refresh dentro da própria tela;
- retorno à tela após visitar outra superfície.

Uma função que só funciona porque outra página inicializou silenciosamente uma dependência é regressão funcional.

## 6. Escrita e persistência

Para qualquer operação de escrita relevante, a prova de conclusão deve buscar a convergência:

```text
estado persistido remoto
=
estado local da aplicação
=
estado apresentado ao usuário
=
estado reencontrado após reload
```

Quando houver efeitos transversais, verificar também as projeções relacionadas.

Exemplos:

- Nota Fiscal permanente e seu reflexo em Capital/Inventário;
- análise individual e Pendência correspondente;
- reanálise e estado da tentativa;
- competência ativa e filtros dependentes;
- alterações de equipe e carteira;
- retificações e histórico/auditoria.

## 7. Qualidade humana é parte da funcionalidade

Uma funcionalidade tecnicamente existente, mas difícil de perceber, ler, compreender ou operar não está concluída.

Alterações que afetem UI devem incluir inspeção visual real da superfície impactada. Testes que apenas verificam presença de seletor no DOM podem ser usados como apoio, mas não substituem evidência de renderização, composição e compreensão humana.

### 7.1 Condições que bloqueiam a conclusão

Salvo decisão explícita em contrário, uma alteração percebida pelo usuário reprova o gate se, em viewport suportado e estado representativo:

- conteúdo necessário à decisão fica cortado, encoberto, sobreposto ou fora da área utilizável;
- controle necessário existe no DOM, mas não é razoavelmente encontrável pela composição visual;
- ação secundária recebe mais destaque que a ação principal sem justificativa funcional;
- títulos, rótulos ou agrupamentos fazem o usuário perder a identidade do caso ou do estado que está operando;
- novo componente quebra alinhamento, respiro, largura, fluxo ou hierarquia dos elementos com os quais passou a conviver;
- scroll é necessário para informação essencial, mas a composição não oferece pista suficiente de que existe conteúdo relevante adiante;
- feedback confirma apenas a execução técnica e não comunica uma consequência material para a jornada;
- a interface depende do conhecimento prévio do implementador para ser compreendida;
- uma largura suportada produz clipping, overflow horizontal, controles inacessíveis ou leitura materialmente degradada.

### 7.2 Critérios concretos de aprovação humana

A superfície pode ser aprovada quando, no estado representativo:

1. **orientação:** a pessoa identifica tela, contexto, registro e estado sem consultar outra fonte;
2. **prioridade:** a hierarquia visual faz a informação mais importante chamar atenção antes das secundárias;
3. **ação:** a próxima ação relevante é descobrível, nomeada em linguagem compatível com a tarefa e visualmente diferenciada;
4. **leitura:** textos, valores e controles necessários estão integralmente legíveis e possuem espaço compatível com seu conteúdo real;
5. **composição:** o elemento novo parece parte da mesma interface e não degrada elementos preexistentes;
6. **feedback:** depois da ação, a pessoa entende o que mudou, o novo estado e, quando aplicável, quem deve agir;
7. **continuidade:** navegar, voltar e recarregar não destrói o contexto necessário para continuar;
8. **responsividade:** a mesma intenção permanece legível e operável nas larguras desktop suportadas afetadas pela mudança;
9. **densidade:** a quantidade de informação não esconde a tarefa principal nem cria competição desnecessária entre ações;
10. **coerência semântica:** datas, estados, nomes e rótulos são apresentados de forma humana e consistente entre superfícies que tratam o mesmo fato.

Não existe obrigação de colocar tudo acima da dobra. Existe obrigação de não esconder de forma enganosa o que é necessário para decidir ou agir.

### 7.3 Evidência mínima de uma mudança visual material

Para mudança visual ou material:

- usar estado preenchido e conteúdo com comprimento e densidade realistas; tela vazia ou texto curto não certifica o estado populado;
- verificar o viewport desktop principal e pelo menos um viewport desktop mais restrito quando a geometria puder mudar;
- abrir e inspecionar efetivamente as screenshots ou capturas produzidas; gerar arquivo sem examiná-lo não conta como validação;
- registrar uma **leitura humana do resultado** em linguagem comum, sem citar classes CSS, seletores ou handlers;
- confrontar o elemento novo com seus vizinhos e com a etapa anterior e posterior da jornada;
- quando Production tiver densidade ou composição materialmente diferente de fixture ou Preview, obter evidência navegada apropriada antes de afirmar homologação visual de Production.

O projeto usa 1440×900 como baseline visual canônica. Quando a alteração puder degradar monitores mais restritos, incluir uma largura desktop menor pertinente ao risco, como 1366×768 ou 1280×720, sem transformar isso em exigência de múltiplos navegadores para toda mudança.

## 8. Performance não pode comprar regressão

Otimização de carregamento, bootstrap ou tempo de resposta só pode ser aprovada se preservar a equivalência funcional das jornadas afetadas.

A ordem de prioridade é:

```text
integridade funcional
→ integridade dos dados
→ regras de negócio e autorização
→ disponibilidade visual e usabilidade
→ performance
```

Uma melhoria de tempo que introduz corrida, botão ausente, módulo não instalado, rota incompleta, estado não persistido ou dependência da ordem de navegação é reprovada, mesmo que o benchmark melhore.

Toda medição de performance deve ser comparada com uma baseline funcional válida. Métrica de velocidade não é prova de equivalência.

## 9. Critério de conclusão

Uma tarefa relevante só pode ser declarada concluída quando, conforme o impacto:

- os gates técnicos proporcionais estiverem verdes;
- as jornadas reais afetadas tiverem sido executadas pelo frontend;
- as ações críticas tiverem sido exercidas por controles visíveis ao usuário;
- persistência e releitura tiverem sido comprovadas quando houver escrita;
- o layout/superfície afetada tiver sido inspecionado visualmente;
- a leitura humana outside-in tiver sido registrada e aprovada quando a mudança for percebida pelo usuário;
- nenhum bloqueador da seção 7.1 estiver presente;
- não houver regressão material conhecida nas jornadas vizinhas;
- o SHA efetivamente homologado for o mesmo candidato à integração/publicação.

Se alguma dessas provas não puder ser executada por limitação do ambiente, registrar explicitamente a lacuna. Não converter ausência de teste em aprovação presumida.

## 10. Relação com o método de engenharia

Este documento especializa, para a perspectiva do usuário, a regra já estabelecida em `ENGINEERING_METHOD.md` de testar invariantes, composição, estado final e código real com fronteiras controladas.

Em caso de dúvida, aplicar os dois documentos em conjunto:

```text
causa real no código
+ prova técnica
+ jornada real pelo frontend
+ persistência/releitura
+ inspeção visual
+ leitura humana outside-in
+ revisão adversarial
= evidência suficiente para conclusão
```

Este gate não é específico de um PR ou do problema de carregamento de setembro de 2026. Ele é regra permanente do projeto até decisão canônica posterior que o substitua explicitamente.