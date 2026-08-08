# Estabilização desktop funcional integral — Design

**Data da decisão:** 8 de agosto de 2026

**Baseline de implementação:** `85971e948e1b012df8af6f10fca663ba97f184f3`

**Foco de homologação:** desktop em `1440 × 900` e `1280 × 720`

**Estratégia aprovada:** fatias funcionais completas, com integração progressiva

## Objetivo

Preparar o RADAR PDDE para uso operacional próximo pelos servidores, garantindo que as principais tarefas possam ser encontradas, executadas, gravadas, relidas e compreendidas sem depender de conhecimento interno do código ou de navegação indireta.

Uma funcionalidade somente será considerada pronta quando atravessar toda a cadeia:

```text
interface
→ regra de acesso
→ serviço
→ repositório/RPC/RLS
→ gravação
→ releitura autenticada
→ recarga da página
→ apresentação compreensível
→ auditoria
→ compensação ou conflito explícito
```

Ausência de erro técnico isolado não será aceita como prova de funcionamento.

## Decisões de produto aprovadas

1. O desktop é o alvo desta estabilização. A experiência mobile não será redesenhada agora; haverá apenas regressão mínima para impedir que mudanças compartilhadas quebrem o que já funciona.
2. `RadarCompetenceContext` será a única autoridade de competência. Poderão existir vários controles visuais, mas todos serão comandos e espelhos do mesmo estado.
3. Controladores mantêm autoridade operacional completa dentro do escopo escolar autorizado. A Assistente de Verbas Federais possui autoridade operacional transversal. O administrador técnico possui autoridade total.
4. O administrador técnico mantém o modelo atual de **atuar como** um perfil funcional. Sua identidade JWT e autoria reais nunca são substituídas pelo perfil visual escolhido.
5. A Assistente de Verbas Federais pode reanalisar pendências, assim como o Controlador autorizado.
6. Pendências canceladas ou resolvidas podem ser reabertas com justificativa e novos erros, preservando o histórico anterior.
7. Escritas de homologação serão feitas apenas em Supabase local ou descartável. Production continuará somente leitura até uma versão revisada, integrada e publicada.

## Evidências que motivam a estabilização

A auditoria funcional e visual confirmou os seguintes defeitos no baseline:

- o seletor global muda o cabeçalho, mas Pendências pode continuar mostrando todas as competências;
- a Carteira possui um seletor que altera `activeCompetenciaKey` sem atualizar `RadarCompetenceContext`, permitindo cabeçalho e conteúdo em meses diferentes;
- Dashboard SME, Competências, Prontuário, alertas, timeline e exportações ainda possuem escritores ou leitores paralelos de competência;
- a Assistente abre pendência e registra novo envio, mas não consegue reanalisar porque a capacidade não está declarada na aplicação e o domínio exige literalmente o rótulo `controlador`;
- o Supabase já autoriza Assistente e administrador técnico nos caminhos operacionais relevantes, de modo que o bloqueio da Assistente é uma divergência da aplicação;
- a matriz funcional ainda nega várias operações ao administrador técnico, contradizendo as RLS/RPCs, a matriz de permissões e a decisão de produto agora aprovada;
- a fila de Pendências tenta comprimir nove colunas e mantém largura mínima de `1320px`, tornando contexto, situação e ações pouco legíveis em desktop;
- os modais de abertura e reanálise ocultam as ações em notebooks de `1280 × 720`;
- a observação da reanálise é persistida na tentativa, mas não aparece no detalhe, na busca ou na linha do tempo;
- reabertura aceita apenas registro resolvido, apesar de o contrato `PEND-05` incluir registro cancelado;
- reabrir não limpa todos os marcadores terminais, o que pode produzir registro aberto ainda marcado como cancelado;
- a ponte Supabase pode substituir a data informada de disponibilização do arquivo pela data de registro após uma recarga, alterando inclusive a classificação entre `Correto` e `Correto (Atrasado)`;
- os testes atuais passam porque alguns deles verificam apenas o valor do seletor ou formalizam a proibição incorreta da Assistente;
- não existe uma suíte autenticada que percorra serviço, RPC/RLS, releitura, `page.reload()` e restauração para as principais escritas.

## Princípios de implementação

### Uma autoridade, vários controles

O produto pode manter atalhos mensais no cabeçalho, Prontuário, Carteira ou Dashboard quando eles ajudarem a tarefa. Nenhum deles manterá estado próprio. Todo comando chamará `RadarCompetenceContext.select()` ou `selectExercise()`, e toda renderização lerá `getState()`.

### Autorização e apresentação são conceitos distintos

O perfil autenticado determina autoridade. O perfil escolhido pelo administrador técnico determina a apresentação que ele está inspecionando. Um perfil visual não reduz a autoridade técnica e não troca `auth.uid()`.

### Estado atual e histórico não se confundem

Campos como `resolved_at` e `canceled_at` descrevem o estado terminal atual. Eventos de resolução e cancelamento anteriores permanecem no histórico mesmo depois de uma reabertura.

### Escrita confirmada exige releitura

Após uma mutação remota, a interface não confiará apenas no objeto retornado pela ação. O estado canônico será relido, reconciliado e renderizado. Conflitos de versão ou autorização serão apresentados como falhas explícitas e não como sucesso aparente.

### O desenho visual existente será preservado

Paleta, tipografia, componentes, ícones e linguagem visual atuais permanecem. As mudanças reorganizam hierarquia, densidade e encontrabilidade; não criam um segundo sistema visual.

## Arquitetura de competência global

### Autoridade canônica

A interface pública existente continua sendo a fronteira única:

```js
RadarCompetenceContext.getState();
RadarCompetenceContext.select(key, { source });
RadarCompetenceContext.selectExercise(year, { initialCompetence, source });
RadarCompetenceContext.replaceConfiguration(configuration);
RadarCompetenceContext.subscribe(listener);
```

`activeCompetenciaKey` e `currentExercise` poderão permanecer temporariamente como espelhos de compatibilidade, escritos somente pelo assinante central em `global-competence-selector.js`. Eles não serão mais escritores independentes.

`activeProntuarioCompetencia` deixará de ser uma segunda autoridade. Durante a migração, qualquer compatibilidade necessária será derivada da competência global e nunca poderá divergir dela.

### Comportamento por superfície

| Superfície               | Contrato após a correção                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                | cards, alertas mensais, projeções e ações usam a competência canônica                                                                                           |
| Dashboard SME            | o controle local, quando exibido, chama o contexto e permanece sincronizado com o cabeçalho                                                                     |
| Carteira                 | o controle contextual permanece apenas se funcionar como comando do contexto; dados, indicadores e ações usam a mesma chave                                     |
| Competências             | seletor e tabela usam a chave canônica; fallback legado não escreve estado diretamente                                                                          |
| Prontuário               | botões de mês chamam o contexto; grade, timeline e abas mensais usam a mesma chave                                                                              |
| Pendências               | o modo padrão mostra a competência ativa; qualquer visão de todas as competências é um escopo explícito e visível, não um segundo mês oculto                    |
| Alertas                  | alertas do mês e passivo histórico são rotulados separadamente; abrir item histórico seleciona sua competência antes de navegar                                 |
| Timeline                 | usa somente a competência canônica                                                                                                                              |
| Exportação SME           | conteúdo, nome, metadados e auditoria usam a mesma competência canônica                                                                                         |
| Exportação institucional | permanece consolidada somente se declarar explicitamente “todas as competências” no conteúdo, nome e auditoria, sem reutilizar o mês ativo como rótulo enganoso |

### Pendências e passivo histórico

O filtro silencioso `Todas` será substituído por um contrato explícito de escopo:

- **Competência selecionada** é o padrão e acompanha imediatamente o cabeçalho;
- **Todas as competências** preserva a capacidade de gerir passivo, mas mostra um indicador inequívoco de escopo amplo;
- mudar a competência global retorna o recorte ao mês escolhido;
- abrir uma pendência de outro mês seleciona o mês do registro antes de abrir o Prontuário;
- limpar filtros não apaga silenciosamente o contexto global.

### Configuração e fechamento

`closingKey` continua sendo metadado institucional. Salvar a competência de fechamento atualiza a configuração por `replaceConfiguration()`, mas não muda a escolha do usuário quando a competência ativa ainda existir.

### Invariantes

1. A chave ativa é `YYYY-MM`, pertence ao exercício e existe no catálogo.
2. Após qualquer renderização estabilizada, contexto, cabeçalho, controles locais, conteúdo, ações, exportação e auditoria concordam.
3. Toda mudança de mês passa pelo contexto uma única vez e produz no máximo uma renderização funcional da superfície.
4. Links históricos selecionam o mês do destino antes da rota.
5. A navegação captura a competência realmente exibida e a restaura antes de scroll e foco.
6. Alterar configuração preserva a seleção válida ou escolhe fallback determinístico.

## Arquitetura de autorização e atuação técnica

### Contexto de acesso

A aplicação passará a tratar explicitamente:

```text
authenticatedRole  = papel real proveniente do JWT/user_profiles
actingProfile      = experiência funcional escolhida pelo administrador
capabilities       = autoridade calculada pelo papel real e pelo escopo
```

Para usuários comuns, `actingProfile` coincide com seu perfil funcional. Para `technical_admin`, a apresentação segue `actingProfile`, mas `capabilities` contém a união autorizada de operações técnicas e funcionais.

### Escopos

- Controlador: todas as operações de acompanhamento dentro das escolas autorizadas por CRE ou escopo explícito.
- Assistente de Verbas Federais: leitura e escrita operacional transversal, inclusive reanálise, retificação, redistribuição e apoio aos demais perfis.
- Administrador técnico: leitura e escrita total, mantendo identidade técnica real.
- SME: somente os contratos institucionais atribuídos à Gestão SME.
- Inventário: somente contratos patrimoniais atribuídos ao Inventário.
- Anônimo, inativo ou sem perfil: sem acesso à aplicação protegida.

### Auditoria do administrador técnico

`administrative_logs.actor_user_id` sempre recebe o usuário autenticado. `profile_name` identifica o papel real. O JSONB `details` conserva um contexto estruturado equivalente a:

```json
{
  "text": "Descrição humana da operação",
  "authenticatedRole": "technical_admin",
  "actingProfile": "controlador"
}
```

No estado legado e nos eventos de pendência, os mesmos conceitos serão preservados por campos compatíveis, sem reduzir os detalhes a um texto que perca autoria. A apresentação usa a fórmula “Administrador técnico · atuando como Controlador”.

Não é necessária nova tabela para essa distinção. Uma migration somente será criada se a validação final provar que o JSONB existente não sustenta consulta e restauração sem perda.

### Alinhamento documental e executável

A matriz funcional e seus JSONs serão corrigidos para permitir `technical_admin` nas operações funcionais que o Supabase já autoriza e a decisão de produto confirmou. Interface, serviços, RPC/RLS, testes e documentação não poderão manter classificações diferentes.

## Ciclo de pendência documental

### Máquina de estados

```text
Aberta
  └─ registrar envio → Aguardando reanálise

Aguardando reanálise
  ├─ correto → Resolvida
  ├─ incorreto → Aberta
  └─ arquivo indisponível → Aberta

Aberta ou Aguardando reanálise
  └─ cancelar com justificativa → Cancelada

Resolvida ou Cancelada
  └─ reabrir com justificativa e erros → Aberta
```

Registrar contato não muda o estado.

### Autoridade da reanálise

Controlador autorizado, Assistente e administrador técnico podem reanalisar. O domínio valida estado, tentativa, resultado e completude da auditoria; ele não autoriza por comparação com um rótulo localizado como `controlador`.

### Tentativas

Cada tentativa preserva separadamente:

- número e ID;
- data em que o arquivo foi disponibilizado;
- data/hora em que o envio foi registrado;
- observação do envio;
- link;
- autor do envio;
- data/hora da análise;
- resultado;
- erros encontrados;
- observação da análise;
- revisor real e contexto de atuação.

`submitted_at` continuará sendo o instante de registro. A data de disponibilização permanecerá no payload canônico e nunca será sobrescrita pela ponte de leitura. A classificação de atraso sempre usa a data informada de disponibilização.

### Marcadores terminais

As seguintes invariantes serão impostas no domínio e na ponte de persistência:

```text
status = Resolvida  ⇔ resolved_at/dataResolucao preenchido
status = Cancelada  ⇔ canceled_at/cancelamento atual preenchido
status = Aberta ou Aguardando reanálise
                    ⇔ marcadores terminais atuais vazios
```

Reabrir limpa os marcadores atuais de resolução e cancelamento. Os eventos históricos continuam intactos.

### Duplicidade, concorrência e compensação

- abertura documental continua impedindo duplicidade ativa para escola, competência, programa e documento;
- versões `row_version` e chaves de operação continuam sendo os contratos de concorrência;
- RPCs compostas permanecem atômicas;
- conflito otimista recarrega o registro e informa ao usuário que houve alteração concorrente;
- nenhum retry automático será feito para escrita não idempotente;
- sucesso visual somente ocorre após releitura do estado confirmado.

## Desenho desktop de Pendências

### Tabela

A grade será reorganizada para cinco grupos principais:

| Grupo        | Conteúdo                                                |
| ------------ | ------------------------------------------------------- |
| Unidade      | escola, designação e controlador                        |
| Contexto     | competência, programa e documento                       |
| Situação     | estado, erros atuais, próxima providência e responsável |
| Movimentação | última alteração, tempo de espera e tentativas          |
| Ações        | ação principal e menu de ações secundárias              |

A ação mais provável — por exemplo `Reanalisar` — fica visível. Detalhes, contato, abertura no Prontuário, substituição, reabertura e cancelamento ficam em grupo previsível, com ações destrutivas separadas.

Em `1440 × 900` e `1280 × 720`:

- não haverá overflow horizontal da página;
- cabeçalhos não se sobreporão;
- contexto, situação e ação principal serão legíveis sem arrastar horizontalmente;
- abrir o detalhe não tornará a linha ou suas ações inacessíveis.

### Detalhe

O painel será organizado em:

1. situação atual, erros e próxima providência;
2. escola, competência, programa e documento;
3. tentativa atual;
4. tentativas anteriores com envio e reanálise pareados;
5. contatos;
6. linha do tempo completa;
7. ações administrativas autorizadas.

Resultado bruto como `arquivo_indisponivel` nunca será mostrado ao usuário; a interface utilizará rótulo humano.

A busca indexará observações de abertura, envio e reanálise, resultado, revisor, erros, contatos e detalhes históricos.

### Modais

Os formulários de abertura, envio, reanálise, contato, cancelamento e reabertura terão:

- largura compatível com o conteúdo e o viewport;
- cabeçalho e rodapé fixos dentro do diálogo;
- conteúdo central rolável;
- ação principal visível em `1280 × 720` e `1440 × 900`;
- erros junto aos campos;
- foco inicial, contenção de foco, `Escape` e retorno de foco;
- bloqueio contra envio duplo;
- indicador de gravação;
- preservação dos dados preenchidos em falha recuperável.

## Persistência autenticada e Supabase

### Ambiente

O clone local isolado será usado para desenvolvimento e navegador. A pilha Supabase descartável será executada em CI Linux, porque o computador não possui Docker e instalá-lo não acrescenta valor suficiente para esta entrega.

A suíte de escrita abortará antes da autenticação se a URL não for loopback ou ambiente descartável explicitamente autorizado. A chave `service_role` será usada apenas no processo de preparação e limpeza, nunca no navegador.

### Fixture de contrato

Uma fixture específica da suíte, separada do `seed.sql` institucional, fornecerá:

- Controlador A autenticado;
- Controlador B autenticado;
- escola do Controlador A;
- escola do Controlador B na mesma CRE;
- escola de outra CRE;
- Assistente;
- SME;
- Inventário;
- administrador técnico;
- verificação, pendência, tentativa, contato, bem e nota necessários aos cenários;
- versões iniciais conhecidas.

### Prova positiva

Cada operação positiva executará:

1. login real;
2. captura do estado e da versão;
3. comando pela interface e serviço reais;
4. RPC/RLS;
5. releitura autenticada;
6. conferência da auditoria;
7. `page.reload()`;
8. nova conferência visual e de dados;
9. compensação funcional autorizada quando existir;
10. nova releitura e recarga.

Os logs de ida e volta permanecem. Restauração significa restabelecer o estado de domínio, não apagar a trilha de auditoria.

### Prova negativa

Para cada perfil negado:

1. capturar digest e versões das entidades;
2. tentar pela interface/serviço;
3. tentar pela RPC autenticada quando necessário para provar o banco;
4. esperar erro canônico de autorização;
5. recarregar;
6. comprovar que dados, versões, efeitos associados e logs não mudaram.

### Production

Production continuará com smoke autenticado estritamente somente leitura. Nenhuma escrita será adicionada ao workflow de leitura de Production.

## Cobertura das principais funcionalidades

A estabilização será decomposta em fatias, cada uma produzindo software utilizável:

### Fatia 1 — competência, atuação técnica e navegação

- estado mensal único em todas as superfícies;
- links históricos selecionando o mês correto;
- exportações com escopo inequívoco;
- separação entre papel real e perfil de atuação;
- matriz funcional alinhada à autoridade do administrador técnico.

### Fatia 2 — pendências completas no desktop

- Assistente e administrador técnico reanalisando;
- reabertura de resolvida e cancelada;
- datas de tentativa preservadas;
- observações e autoria visíveis;
- tabela, detalhe e modais operacionais;
- ciclo completo com recarga.

### Fatia 3 — contrato autenticado de competência e pendências

- fixture multiusuário e multi-CRE;
- verificações `VER-01..04`;
- pendências `PEND-01..06`;
- positivos, negativos, conflitos, reload e compensação.

### Fatia 4 — demais operações P0/P1

Na ordem de risco:

1. escolas e carteiras `SCH-01..03`;
2. notas e despesas `INV-01..02`;
3. patrimônio `ASSET-01..04`;
4. configuração `CFG-01..04`;
5. importação e rollback técnico `TECH-01`.

Cada operação seguirá a prova executar → gravar → reler → recarregar → localizar → compreender → auditar → compensar.

### Fatia 5 — fechamento e reconciliação

- matriz de cobertura atualizada somente com evidência real;
- documentação canônica conciliada;
- suíte completa desktop;
- smoke mobile de não regressão;
- Preview e Production verificados;
- integridade remota consultada após deployment.

## Estratégia de testes

### Unidade e integração

- seleção e substituição de configuração preservam a competência válida;
- todos os comandos locais escrevem no contexto canônico;
- Assistente, Controlador e administrador técnico recebem as capacidades aprovadas;
- domínio não autoriza por rótulo de perfil;
- reabertura limpa marcadores terminais e conserva eventos;
- round-trip preserva data de disponibilização distinta da data de registro;
- view-model expõe e indexa observação, data, autor e resultado de reanálise;
- serviços preservam atomicidade, conflito e auditoria.

### Navegador desktop

- dados distintos em dois meses provam a mudança real de cada superfície;
- todos os controles mensais permanecem sincronizados;
- Pendências acompanha o contexto e declara visão ampla quando usada;
- alerta histórico seleciona seu mês antes da navegação;
- Assistente conclui o mesmo ciclo de reanálise do Controlador;
- administrador técnico atua como perfis diferentes sem trocar JWT ou autoria;
- ciclo de pendência sobrevive a recargas sucessivas;
- tabela, detalhe, menus e modais funcionam em `1440 × 900` e `1280 × 720`;
- fluxo por teclado e foco permanece funcional.

### Supabase descartável

- Auth real dos perfis;
- RPCs compostas;
- RLS positiva e negativa;
- escola da mesma CRE, outra CRE e escopo explícito;
- conflito de `row_version`;
- idempotência por chave de operação;
- ausência de efeitos parciais;
- releitura e recarga;
- compensação e auditoria.

### Gates globais

- `test:readiness`;
- suíte Playwright desktop completa;
- perfis × viewports remotos;
- Supabase local, Auth, RLS e pgTAP em CI;
- migrations em banco limpo;
- backup/restore descartável;
- Lighthouse;
- build e Preview Vercel;
- smoke mobile limitado à não regressão compartilhada.

## Critérios de aceite

### Competência

- mudar o mês em qualquer controle muda contexto, cabeçalho e dados da tela;
- navegar ou recarregar preserva o mês;
- nenhuma superfície pode exibir mês diferente do contexto sem declarar explicitamente escopo histórico ou consolidado;
- exportação e auditoria não usam rótulo mensal incompatível com seu conteúdo.

### Perfis

- Controlador executa todas as ações operacionais permitidas dentro de seu escopo;
- Assistente executa todas as ações operacionais, inclusive reanálise;
- administrador técnico executa todas as ações mantendo JWT e autoria técnicos;
- SME, Inventário, anônimo, inativo e sem perfil não elevam acesso;
- nenhuma diferença entre botão, serviço e RLS permanece.

### Pendências

- criar, enviar, substituir, reanalisar, resolver, reabrir, cancelar e contatar funcionam e sobrevivem ao reload;
- a reanálise incorreta e arquivo indisponível voltam para Aberta com erros corretos;
- reabrir Resolvida ou Cancelada limpa marcadores terminais atuais e conserva o histórico;
- data de disponibilização nunca se transforma em data de registro;
- observações e autoria aparecem no detalhe e na timeline;
- a fila é compreensível e acionável nos dois viewports desktop.

### Persistência

- toda escrita positiva possui prova autenticada, releitura e auditoria;
- toda negação possui prova de ausência de mutação;
- conflitos não deixam efeitos parciais;
- operações com compensação restauram o estado de domínio e preservam os logs;
- a matriz só passa de parcial para coberta quando a evidência executável satisfizer o contrato.

## Fora do escopo

- redesenho específico para celular;
- substituição do frontend legado por outro framework;
- alteração de marca, paleta ou identidade visual;
- escrita de smoke em Production;
- instalação de Docker Desktop apenas para reproduzir localmente gates que já rodam de forma descartável em CI;
- refatorações sem relação direta com as jornadas aprovadas.

## Entrega e revisão

Cada fatia terá testes falhando antes da correção, implementação mínima, revisão técnica independente, suíte focal, suíte global, evidência visual antes/depois e commit próprio. PRs poderão ser integrados progressivamente quando o incremento for completo e reversível.

Nenhum relatório de agente paralelo é aceito como verdade por si só: achados, patches e testes serão revisados pelo agente principal contra o código, os contratos e a execução real antes de qualquer commit ou integração.
