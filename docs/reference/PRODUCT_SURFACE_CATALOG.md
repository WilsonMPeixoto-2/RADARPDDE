> **Regras que atravessam telas:** [política transversal de decisões](DECISION_IMPACT_POLICY.md). Cada novo layout deve consultar contratos anteriores e obrigações pendentes de Banco, UI, Inventário, Pendências, relatórios e outras superfícies; uma regra não fica obsoleta porque nasceu em chat anterior.

# Catálogo de superfícies do RADAR PDDE

**Correções T0–T4 e continuidade:** o [contrato de correção](PRONTUARIO_CORRECAO_CONTRATO.md) distingue correção operacional de regularização documental. As seções abaixo incorporam a autoridade de prévia/confirmação transacional para correção, limpeza e exclusão causal; justificativa obrigatória ou bloqueio genérico por histórico não deve ser restaurado a partir de rotas legadas. O estado de publicação e as capacidades candidatas de T5 estão no [checkpoint](../continuity/prontuario-t0-t6/CHECKPOINT.md).

**Estado:** referência operacional vigente  
**Atualizado em:** 25 de novembro de 2026 (correções T0–T4)

## 1. Regra de leitura

Este catálogo descreve finalidade, perfis, dados, ações e integração. A autorização efetiva é cumulativa entre interface, capacidades, serviços, Auth, RLS, RPCs e Edge Functions.

`technical_admin` é papel autenticado técnico transversal. A escolha de um perfil funcional para simulação altera a apresentação da interface, mas não reduz a autoridade real do administrador técnico nem troca sua identidade/JWT.

Toda superfície deve:

- consumir entidades canônicas;
- respeitar competência e exercício;
- preservar autoria e escopo;
- indicar próxima ação;
- manter conteúdo e capacidade no mobile quando a frente móvel estiver no escopo correspondente;
- usar serviços de aplicação e repositório;
- atualizar a interface após o backend;
- preservar o resultado após recarregar quando houver persistência;
- tratar falha e conflito de forma compreensível;
- tornar ações e contexto encontráveis e legíveis.

## 2. Modelo mental do usuário humano

### 2.1 Princípio central

O RADAR não é uma coleção de telas para expor tabelas. É um ambiente de trabalho administrativo usado para acompanhar unidades escolares, decidir o que exige atenção, analisar documentos, cobrar regularizações, acompanhar inventário e reconstruir o histórico de cada unidade.

Antes de avaliar uma tela, perguntar **qual pergunta humana ela responde**. Duas superfícies podem representar o mesmo fato com recortes diferentes sem existir inconsistência.

| Superfície | Pergunta principal do usuário | Papel na jornada |
|---|---|---|
| Dashboard | **O que exige minha atenção agora?** | triagem e priorização rápida |
| Carteira | **Qual escola preciso localizar, comparar ou abrir?** | localização e comparação de unidades |
| Competências | **Como está este mês/competência e seus programas?** | acompanhamento mensal e consolidação |
| Prontuário | **O que está acontecendo nesta escola e o que preciso fazer aqui?** | ambiente principal de trabalho profundo da unidade |
| Pendências | **Quais passivos ainda existem, há quanto tempo e qual etapa cada um está?** | gestão completa do passivo, tentativas, reanálise e histórico |
| Capital e Inventário | **Quais bens precisam avançar no fluxo patrimonial?** | fila patrimonial especializada |
| Gestão de Equipe | **Quem integra a equipe e quem responde por cada carteira?** | administração de pessoas e responsabilidades |
| Registros Internos | **Quem fez o quê, quando e em qual contexto?** | rastreabilidade e auditoria |
| Configurações SME | **Qual configuração institucional governa o exercício?** | administração de parâmetros autorizados |
| Busca/Alertas | **Como chego rapidamente ao registro que exige atenção?** | encontrabilidade e transporte de contexto |

### 2.2 Eixo cognitivo do produto

O usuário deve conseguir manter na cabeça, sem reconstruir o contexto a cada clique:

```text
Unidade escolar
→ competência
→ programa
→ documento / despesa / bem / pendência
→ estado atual
→ quem precisa agir
→ próxima ação
→ histórico que explica como se chegou ali
```

A **unidade escolar** é a entidade operacional principal. O diretor é informação cadastral e beneficiário da bonificação, mas não substitui a escola como eixo de navegação e monitoramento.

A **competência ativa** é um dos contextos mais importantes do produto e precisa permanecer perceptível entre as superfícies mensais. A página de Pendências é a exceção deliberada: por representar passivo histórico, abre transversalmente em todas as competências e usa filtro local opcional.

### 2.3 Um registro, vários caminhos

Dashboard, Carteira, Competências, Prontuário, Pendências, Timeline, Alertas e Busca não criam cópias conceituais. São caminhos diferentes para o mesmo universo de registros.

Ao transportar o usuário entre superfícies, preservar quando materialmente possível:

- escola;
- competência;
- programa;
- documento ou Pendência específica;
- tela de origem;
- filtros relevantes;
- posição de rolagem e foco durante a sessão.

O retorno deve levar o usuário ao lugar de onde veio, não obrigá-lo a refazer sua investigação.

### 2.4 Diferença de apresentação não é automaticamente divergência funcional

Antes de classificar duas telas como inconsistentes, verificar se elas respondem à **mesma pergunta**.

Exemplo canônico:

- a página de Pendências é a visão completa do passivo e preserva a antiguidade histórica da ocorrência;
- Dashboard/Carteira são superfícies de triagem e podem destacar o tempo da **ação operacional atual**, isto é, há quanto tempo a providência está com escola ou Controlador.

Essas métricas não devem ser unificadas apenas porque se referem à mesma Pendência. Uma descreve a idade do problema; a outra, a espera da etapa corrente.

A mesma prudência vale para resumo gerencial, detalhe técnico, histórico, fila e projeções derivadas.

### 2.5 Hierarquia visual é parte da semântica

O layout deve ajudar o usuário a perceber a regra, não apenas ornamentá-la.

Prioridades visuais duráveis:

1. deixar claro **qual escola, competência e programa** estão em análise antes dos documentos;
2. separar bonificação, análise técnica, Pendência e próxima ação, porque são dimensões diferentes;
3. manter cada Nota Fiscal/Consulta Assessoria individualmente identificável quando a regra é individual;
4. exibir ações no contexto do item correto e evitar menus genéricos quando há risco de agir no registro errado;
5. usar texto e rótulo além de cor para comunicar estado;
6. usar cor de status para semântica e cor de linha/bloco apenas para organização visual;
7. preservar estrutura e contexto em estados vazios para que ausência de registro não pareça falha de carregamento;
8. dar feedback visível a salvar, erro, bloqueio, carregamento e conclusão;
9. evitar que densidade, overflow, sobreposição ou controle fora do viewport tornem uma função tecnicamente existente inutilizável.

A identidade estrutural permanece roxa. Cores semânticas devem apoiar estados sem substituir seus rótulos.

Na edição de lançamento, o modal informa NF/tipo e contexto escolar/mês/programa antes dos campos. A faixa **Você pode corrigir** distingue dados cadastrais de classificação. Campo protegido explica a razão concreta: Pendência ativa, histórico de Assessoria, identificação provisória ou inventariação concluída. Quando elegível, alterar classificação apresenta Antes/Depois e efeitos de Assessoria/patrimônio, seguida de confirmação cancelável. Dados não editados e histórico permanecem; feedback de salvamento não antecipa sucesso nem oculta falha de sincronização.

### 2.6 Ações pertencem à superfície que possui contexto suficiente

Não duplicar a mesma ação em todas as telas por conveniência aparente.

Exemplos vigentes:

- Prontuário mostra a NF/despesa e, quando aplicável, **Visualizar pendência** no próprio item;
- o drawer do Prontuário é uma superfície contextual de gestão da Pendência: para NF comum pode oferecer **Registrar novo envio**; para `a_identificar` aberto oferece **Registrar envio / identificação da despesa** e acesso à retificação dos dados provisórios;
- após o envio, **Aguardando reanálise** é clicável no Prontuário; a página de Pendências mantém **Reanalisar** como caminho completo e alternativo para a mesma ação;
- a página de Pendências continua sendo a visão transversal completa do passivo, tentativas, erros, responsável, histórico e ações;
- Dashboard e Carteira conduzem o usuário ao registro/ação, mas não substituem a tela especializada quando falta contexto para uma decisão segura.

### 2.7 Critério de diagnóstico pelo olhar do usuário

Antes de propor correção funcional em uma superfície:

```text
qual objetivo o usuário tem aqui?
→ o que ele vê primeiro?
→ que contexto ele entende estar ativo?
→ qual informação orienta a decisão?
→ qual controle ele usa?
→ onde espera ver o resultado?
→ o resultado permanece depois de navegar/recarregar?
→ a mesma ação repercute corretamente nas superfícies relacionadas?
```

Se o comportamento estiver correto e o problema for apenas de compreensão, localização ou hierarquia, classificar como apresentação/navegação. Não alterar regra de negócio para resolver um problema de interface.

## 3. Superfícies

## S-01 — Dashboard

| Campo | Contrato |
|---|---|
| Rota | `dashboard` |
| Perfis | Controlador, Assistente, SME e Inventário conforme recorte; administrador técnico por simulação autorizada |
| Finalidade | sintetizar estado, prioridade e próximos passos |
| Dados | escolas, verificações, pendências, bens e projeções |
| Ações | filtros, cartões, navegação e exportações autorizadas |
| Assistente | grupo com Relatório RADAR PDDE e Excel SME, além de Redistribuir Escolas |
| Restrições | universos não sobrepostos e ações somente por capacidade |
| Leitura humana | cartões funcionam como filtros de triagem; “próximas ações” privilegia a providência corrente, não substitui o histórico completo |

**Orientação gerencial D022, candidata no PR #565:** reutiliza a fila para apresentar reanálises prontas, análise fiscal a conferir, despesas a identificar, patrimônio por etapa, bonificação em apuração/pendente de reconsolidação e acompanhamento em aberto. Cada item explica o motivo e abre o registro correspondente. As contagens mostram o universo carregado e o filtro escolar/mensal; não são taxa de regularidade nem obrigação sobre contextos inexistentes. Os dois relógios de Pendência permanecem distinguíveis. A capacidade do usuário continua sendo a autoridade de acesso.

## S-02 — Carteira de Escolas

| Campo | Contrato |
|---|---|
| Rota | `escolas` |
| Finalidade | pesquisar, comparar e abrir unidade |
| Perfis | Controlador, Assistente e SME em leitura autorizada; administrador técnico mantém autoridade autenticada |
| Responsabilidade | `controller_id` define responsável principal |
| Colaboração | Controladores da mesma CRE podem atuar sem transferência automática |
| Ações | abrir prontuário e editar quando autorizado |
| Mobile | mesmos dados e ações em organização responsiva |
| Leitura humana | a escola é a unidade principal; situação, última movimentação e próxima ação servem para decidir qual unidade abrir |

## S-03 — Competências Mensais

| Campo | Contrato |
|---|---|
| Rota | `competencias` |
| Contexto | competência global única `YYYY-MM` via `RadarCompetenceContext` |
| Finalidade | acompanhar bonificação, análise e pendências por mês |
| Perfis | Controlador e Assistente operam; SME consulta recorte gerencial; administrador técnico preserva autoridade real sob simulação |
| Dados | competências, programas, verificações, pendências e prazos |
| Restrições | nenhum seletor concorrente; nenhuma análise técnica para SME real |
| Leitura humana | responde ao recorte mensal; competência selecionada precisa permanecer inequívoca antes de qualquer análise/consolidação |

## S-04 — Pendências Operacionais

| Campo | Contrato |
|---|---|
| Rota | `pendencias` |
| Estados | Aberta, Aguardando reanálise, Resolvida e Cancelada |
| Perfis | Controlador e Assistente operam; SME consulta; Inventário vê recorte autorizado; administrador técnico mantém autoridade integral |
| Ações | abrir, registrar envio, reanalisar, contatar, cancelar e reabrir conforme capacidade |
| Reanálise | Controlador, Assistente e `technical_admin`; SME e Inventário não executam a mutação |
| Contexto | competência global permanece visível, mas a fila abre transversalmente em Todas as competências |
| Regra | novo envio não resolve; reanálise decide a transição |
| Persistência | pendência, tentativa, contato, verificação e log |
| Leitura humana | visão completa do passivo: origem, antiguidade, erros, tentativas, contatos, histórico, responsável atual e próxima ação |

O filtro de unidade oferece o catálogo escolar disponível à sessão, inclusive
escolas sem Pendências. Limpar filtros não remove escolas desse catálogo: deve ser
possível selecioná-las novamente e obter uma fila vazia. Registros históricos não
ampliam as opções para identificadores ausentes do catálogo. A navegação continua
sujeita à política autorizada; esse seletor não concede acesso nem altera RLS.

Nos modais de novo envio e reanálise, uma Pendência individual identifica o
número/referência da NF ou boleto, mantendo a dimensão fiscal ou Assessoria.
Reanálise preserva também descrição, tipo e valor. Snapshot pode identificar o
documento histórico ausente da coleção corrente; legado sem vínculo não recebe
uma NF inventada. Documentos genéricos continuam com seus rótulos próprios.

### Edição e correção explícitas no Prontuário

Os controles de bonificação registram o critério no contexto escola/mês/programa. A correção de valor já existente, inclusive após consolidação, oferece prévia com avaliação atual, nova avaliação, efeitos e preservações. Critérios derivados são conferidos a partir dos registros de origem; não permitem inventar manualmente uma entrega. A própria correção pode deixar a bonificação **pendente de consolidação**, com próximo passo **Consolidar bonificação**.

A análise técnica tem ação explícita por item. Corrigir análise, retirar o resultado atual, excluir uma Pendência, excluir análise e Pendências do item, excluir uma despesa e excluir o contexto possuem alcances distintos. A interface explica esses alcances antes da confirmação, com observação opcional na correção. Documento novo/corrigido recebido da escola continua pelo fluxo de envio/reanálise. Edição de notas e Assessoria mantém a identidade individual da NF.

Durante a gravação, os controles impedem duplicidade e exibem falha de forma persistente. Um recibo confirmado com projeção local pendente solicita atualização sem repetir a mutação. Os contratos detalhados e as exceções expressas constam do [modelo canônico, §9.10–9.11](SYSTEM_CANONICAL_MODEL.md#910-excluir-nota-fiscal).

**Histórico granular T5:** a lista completa mostra ações junto ao envio, à reanálise ou ao contato identificado. O resumo da gaveta permite chegar ao histórico completo. A correção apresenta campos editáveis, Antes/Depois, estado resultante e o que permanece; observações extras são opcionais. A exclusão de reanálise não se confunde com exclusão do envio. Se a causalidade for insuficiente, a pessoa escolhe um alcance explícito e recebe outra prévia. O recibo da correção pertence à auditoria e não deve reaparecer como reanálise operacional. A disponibilização depende da release T5 documentada no checkpoint.

## S-05 — Prontuário

| Campo | Contrato |
|---|---|
| Rota | `prontuario` + escola |
| Finalidade | concentrar contexto da unidade e funcionar como ambiente principal de trabalho do Controlador |
| Conteúdo | identificação, programas, verificações, pendências, notas, bens, contatos e timeline |
| Perfis | todos conforme capacidade e escopo; administrador técnico mantém autoridade autenticada |
| SME | identificação e bonificação, sem análise técnica ou controles operacionais quando o papel real é SME |
| Navegação | retorno contextual com competência, filtros, rolagem e foco |
| Independência de despesas | Controlador e Assistente podem cadastrar, editar, excluir e operar os fluxos derivados de despesas conforme suas capacidades, sem depender de Sim/Não/N/A ou consolidação da bonificação; a própria bonificação mantém suas regras de edição |
| Conta PDDE Qualidade | no contexto escola/competência, registrar saídas antes de conhecer a Ação Integrada; reencontrar/editar os dados conhecidos e identificar depois pelo formulário fiscal. Provisório não conta como NF nem cria Pendência; os estados Programa a identificar/Identificada distinguem o que ainda precisa de ação |
| Leitura humana | primeiro confirma escola/competência/programa; depois trabalha documentos individualmente sem perder o contexto da unidade |

**Exclusão de contexto:** a ação contextual fica em **Ações do programa**, no cabeçalho do programa existente. A prévia identifica escola, mês e programa, registros a excluir e registros preservados; a confirmação explícita não transfere lançamentos. O conteúdo pode rolar, mas Cancelar, Conferir novamente e Excluir estes lançamentos devem permanecer acessíveis. Perfis sem capacidade de correção não recebem a ação. A disponibilização efetiva depende da release documentada no checkpoint; não presumir ativação em Production.

**Próximos passos da escola, candidata D022:** apresentação compacta por padrão, com contagem e uma ação visível; filtros, justificativa da sugestão e demais itens ao expandir. A orientação mantém a escola e a competência do Prontuário e conduz ao item real com foco após a hidratação. Não deve deslocar desnecessariamente o trabalho fiscal para fora da área inicial, esconder ações existentes ou substituir a decisão do operador.

## S-06 — Capital e Inventário

| Campo | Contrato |
|---|---|
| Rota | `inventario` |
| Perfis | Inventário e Assistente; leitura/operação adicional conforme política para Controlador e administrador técnico |
| Dados | bens, notas permanentes, processos, responsável e tombamento |
| Ações | cadastrar, encaminhar, atualizar e concluir inventariação conforme capacidade |
| Backend | `InventoryService`, `assets` e RPCs compostas |
| Restrições | perfil Inventário não recebe módulos não patrimoniais; SME não ganha mutação patrimonial por simples acesso visual |
| Leitura humana | fila de trabalho patrimonial: distinguir o que ainda não foi encaminhado, o que aguarda inventariação e o que já foi concluído |

**Correção patrimonial T5:** a ação aparece junto ao bem no Inventário e no Prontuário, conforme capacidade real. O formulário distingue corrigir o registro no RADAR de alterar o sistema patrimonial externo. Informa o efeito da reversão de Inventariada, a preservação das avaliações fiscais/bonificação e os vínculos com NF. Bem independente pode ser excluído; para bem derivado, a próxima ação é corrigir o inventário ou abrir a exclusão causal da despesa quando o perfil permite. Não exigir baixa física fictícia para corrigir lançamento digitado por engano.

## S-07 — Registros Internos

| Campo | Contrato |
|---|---|
| Rota | `auditoria` |
| Dados | `administrative_logs` e contexto funcional |
| Controlador/Assistente | leitura conforme capacidade e escopo |
| SME | somente `actor_user_id = auth.uid()` quando o papel autenticado real é SME |
| Admin técnico | leitura ampla independentemente do perfil visual simulado |
| Restrições | registros antigos sem UUID não aparecem no recorte de um usuário SME real |
| Leitura humana | trilha de responsabilidade, não fila operacional: permite reconstruir autoria, instante e contexto das alterações |

## S-08 — Configurações SME

| Campo | Contrato |
|---|---|
| Rota | `sme-config` |
| Perfis | Gestão SME e administrador técnico |
| Dados | exercício, competência, prazo, programas e configuração global |
| Backend | `ConfigurationService`, tabelas de configuração e RPCs |
| Estado atual | funções de exercício, calendário e programas existem no frontend e no Supabase |
| Regra | acesso visual não substitui serviço, RLS, auditoria e concorrência |
| Leitura humana | parâmetros institucionais que governam o trabalho; não deve parecer área operacional de uma escola específica |

## S-09 — Gestão de Equipe

| Campo | Contrato |
|---|---|
| Rota | `equipe` |
| Responsável funcional | Assistente de Verbas Federais |
| Autoridade técnica | `technical_admin` também pode executar as operações autorizadas, sem perder identidade ao simular perfil |
| Dados | Controladores, Inventário, perfis Auth e carteiras |
| Ações | cadastrar, editar, redistribuir e desativar |
| Frontend | `DirectoryService` e `TeamAccountGateway` |
| Backend | `team-account-management` + Auth Admin + RPC |
| Proteções | CORS, JWT, papel, idempotência, vínculo histórico e compensação |
| Releitura | resultado deve permanecer após recarregar |
| Leitura humana | separar claramente pessoas de carteiras: editar integrante não pode parecer transferência silenciosa de responsabilidade escolar |

## S-10 — Exercícios

| Campo | Contrato |
|---|---|
| Finalidade | selecionar ou criar contexto anual autorizado |
| Dados | exercícios, competências, prazos e configuração |
| Criação | operação composta com competências correspondentes |
| Perfil | capacidade administrativa expressa |
| Regra | exercício e competência permanecem sincronizados |

## S-11 — Programas

| Campo | Contrato |
|---|---|
| Dados | `programs` e `school_programs` |
| Finalidade | catálogo global e vínculos escolares |
| Histórico | desativação preserva registros anteriores |
| Perfil | SME e administrador conforme políticas atuais; leitura para perfis operacionais |
| Regra | qualquer retirada ou expansão de capacidade exige decisão funcional nova; documentação histórica não a altera |
| Restrições | não alterar junto com polimento ou outra frente não relacionada |

## S-12 — Alertas

| Campo | Contrato |
|---|---|
| Local | sino e dropdown do cabeçalho |
| Finalidade | localizar itens que exigem atenção |
| Contexto | competência, escola, pendência, bem e prazo |
| Ação | transportar filtros e origem para a superfície correta |
| Persistência | nenhuma mutação de negócio |
| Acessibilidade | foco, teclado, estado e fechamento seguro |
| Leitura humana | atalho para atenção, não segunda base de tarefas; deve levar ao registro real já existente |

## S-13 — Busca global

| Campo | Contrato |
|---|---|
| Local | cabeçalho |
| Motor | Fuse.js carregado sob demanda, com fallback |
| Conteúdo | escolas autorizadas, módulos, programas, competências e pendências consultáveis |
| Ação | navegação contextual para o destino |
| Segurança | não revela recurso fora do escopo |
| Acessibilidade | clique, setas, Enter e Escape |
| Leitura humana | mecanismo de encontrabilidade transversal; resultado deve indicar o tipo do registro e levar ao contexto correto |

## S-14 — Exportações

| Campo | Contrato |
|---|---|
| Contexto temporal | exportações operacionais usam a competência global canônica aplicável |
| Institucional | XLSX de quatro abas limitado ao contexto mensal vigente conforme integração atual |
| SME | uma competência, uma aba e **27 colunas A:AA** |
| Template SME | 30 colunas apenas como base visual; K, R e Y removidas na projeção |
| CSV | secundário e fallback institucional |
| Assets | manifesto, tamanho e SHA do ExcelJS e template |
| Certificação | modelo, workbook, reabertura, OOXML, células e hashes |
| Persistência | nenhuma escrita de dados de negócio; auditoria administrativa do download permanece obrigatória |
| Homologação | Excel SME aprovado no Microsoft Excel desktop |

## S-15 — Autenticação

| Campo | Contrato |
|---|---|
| Backend | Supabase Auth |
| Estado pré-auth | aplicação inerte |
| Sessão | restauração, renovação e logout controlados |
| Perfil | `user_profiles`, perfil ativo, papel efetivo e escopos |
| Admin | simulação visual não troca JWT nem reduz a autoridade de `technical_admin` |
| RLS | autorização obrigatória adicional |
| Anônimo | nenhum dado institucional |
| Monitor | shell, gate e bloqueio anônimo verificados continuamente |

## S-16 — Modais e confirmações

| Campo | Contrato |
|---|---|
| Finalidade | editar ou confirmar ação contextual |
| Acessibilidade | foco inicial, Escape, retorno e anúncio |
| Escrita | somente após validação e confirmação aplicável |
| Mobile | conteúdo integral no viewport quando o mobile estiver no escopo da frente |
| Estado | salvando, sucesso e erro sem duplicação de clique |
| Usabilidade | cabeçalho/contexto e ações essenciais permanecem acessíveis; conteúdo extenso rola internamente quando necessário |

## S-17 — Formulários

| Campo | Contrato |
|---|---|
| Estados | intocado, alterado, inválido, salvando, erro e sucesso |
| Persistência | serviço de aplicação e unidade de trabalho |
| Erro | preservar valores, foco e mensagem funcional |
| Escrita | sem repetição automática silenciosa |
| Auditoria | autoria e contexto |
| Releitura | salvar, recarregar e confirmar o mesmo resultado quando material |

## S-18 — Estados vazios, loading e erro

| Campo | Contrato |
|---|---|
| Tipos | vazio, carregando, sessão, rede, CORS, RLS, conflito, validação e asset |
| Finalidade | explicar o estado e oferecer próxima ação segura |
| Retry | somente quando idempotente ou explicitamente protegido |
| Escrita | nunca repetida silenciosamente |
| Consistência | mesmo código de falha produz orientação equivalente |
| Leitura humana | vazio deve significar ausência real de dado; loading deve parecer transitório; erro deve explicar o que aconteceu e o que é seguro fazer |

## S-19 — Monitoramento de Production

| Campo | Contrato |
|---|---|
| Superfície | GitHub Actions e Issues |
| Finalidade | detectar falha do ambiente publicado |
| Verificações | SHA, manifesto, assets, Auth gate, bloqueio anônimo e preflight conforme workflow vigente |
| Incidente | issue automática única, atualizada e encerrada após recuperação |
| Limite | monitor técnico não substitui teste funcional quando houver risco funcional concreto |

## 4. Relações obrigatórias

```text
Dashboard
↔ Carteira
↔ Competências
↔ Prontuário
↔ Pendências
↔ Timeline
↔ Alertas
↔ Busca
↔ Exportações
```

Gestão de Equipe, Inventário, Registros Internos e Configurações conectam-se ao núcleo por capacidades específicas.

## 5. Gate para alteração de superfície

O gate é proporcional ao impacto. Ver `TEST_GOVERNANCE.md` e `FRONTEND_USER_VALIDATION_GATE.md`.

Para a superfície efetivamente alterada, verificar o conjunto materialmente necessário entre:

1. finalidade humana da superfície e pergunta que ela responde;
2. perfis autorizados e negados;
3. dados lidos e escritos;
4. handler, serviço, repositório e backend;
5. autorização positiva e, quando relevante, negativa;
6. atualização da interface e releitura quando houver persistência;
7. erro, conflito e compensação quando aplicáveis;
8. desktop/mobile conforme o escopo e risco da mudança;
9. foco, teclado, semântica, encontrabilidade, legibilidade e hierarquia visual quando houver impacto de UX;
10. documentação vigente afetada;
11. ambiente e SHA da evidência quando houver publicação.

Não executar todos os itens por ritual quando a alteração não os alcança. Também não reduzir uma mudança percebida pelo usuário a testes internos quando a jornada e o layout são materialmente afetados.
