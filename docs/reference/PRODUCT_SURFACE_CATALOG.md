# Catálogo de superfícies do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 8 de setembro de 2026

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

### 2.6 Ações pertencem à superfície que possui contexto suficiente

Não duplicar a mesma ação em todas as telas por conveniência aparente.

Exemplos vigentes:

- Prontuário mostra a NF e, quando aplicável, **Visualizar pendência** no próprio item;
- o ciclo posterior de **Registrar novo envio** e **Reanalisar** pertence à página de Pendências, onde tentativa, histórico, erros e estado estão completos;
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

## S-05 — Prontuário

| Campo | Contrato |
|---|---|
| Rota | `prontuario` + escola |
| Finalidade | concentrar contexto da unidade e funcionar como ambiente principal de trabalho do Controlador |
| Conteúdo | identificação, programas, verificações, pendências, notas, bens, contatos e timeline |
| Perfis | todos conforme capacidade e escopo; administrador técnico mantém autoridade autenticada |
| SME | identificação e bonificação, sem análise técnica ou controles operacionais quando o papel real é SME |
| Navegação | retorno contextual com competência, filtros, rolagem e foco |
| Leitura humana | primeiro confirma escola/competência/programa; depois trabalha documentos individualmente sem perder o contexto da unidade |

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
