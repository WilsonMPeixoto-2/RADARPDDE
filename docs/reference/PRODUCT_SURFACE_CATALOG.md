# Catálogo de superfícies do RADAR PDDE

## Regra de leitura

As fichas descrevem o estado observado em 15/07/2026. Classificações não autorizam mudança; cada pacote futuro deverá revalidar a superfície e suas conexões.

## S-01 — Dashboard

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('dashboard')`; `#nav-dashboard` |
| Perfis | Controlador, Assistente, Inventário e SME |
| Tarefa real | identificar situação da carteira, recorte e próximas ações |
| Dados lidos | escolas, competências, verificações, pendências, projeção operacional |
| Dados gravados | filtro local e navegação contextual |
| Serviços/conexões | `renderDashboard*`; projeções; Carteira/Pendências/Prontuário |
| Estados | padrão, filtrado, sem resultados e perfis distintos |
| Ações | cartões, filtros, listas e ações contextuais |
| Desktop | grade de indicadores e listas |
| Mobile | layout responsivo; cartões mantêm hierarquia |
| Acessibilidade | cards clicáveis, foco e testes de modal/navegação |
| Testes | `tests/e2e/cycle-b-dashboard.spec.js`; `task-8-indicator-separation.spec.js` |
| Evidências | `*/controlador__dashboard__padrao__*.png`; `*/sme__dashboard__padrao__*.png` |
| Pontos fortes | indicadores preservam universos sobrepostos e transportam recorte |
| Riscos/lacunas | camadas CSS específicas e necessidade de URL recuperável |
| Classificação | CP, FA, IC |

## S-02 — Carteira de Escolas

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('escolas')`; `#nav-escolas` |
| Perfis | Controlador, Assistente e SME conforme perfil |
| Tarefa real | pesquisar, filtrar, comparar e abrir a unidade |
| Dados lidos | escolas, programas, verificações, pendências e controladores |
| Dados gravados | filtros, ordenação local e atribuições autorizadas |
| Serviços/conexões | Dashboard, Prontuário e Pendências |
| Estados | resultado, filtrado, vazio e mobile |
| Ações | buscar, filtrar, ver unidade, editar e abrir pendências |
| Desktop | tabela ampla e completa |
| Mobile | cartões operacionais sem tabela desktop |
| Acessibilidade | alvos móveis e navegação testados |
| Testes | `tests/e2e/cycle-b-carteira.spec.js`; `mobile-smoke.spec.js` |
| Evidências | `*/controlador__carteira__resultado__*.png` |
| Pontos fortes | informação operacional integral e versão mobile própria |
| Riscos/lacunas | largura e densidade exigem estudo sem remover colunas |
| Classificação | CP, FA, DQ |

## S-03 — Competências Mensais

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('competencias')`; `#nav-competencias` |
| Perfis | Controlador, Assistente e SME conforme escopo |
| Tarefa real | lançar e acompanhar bonificação, análise e pendências por mês |
| Dados lidos | competências, programas, verificações, pendências e prazos |
| Dados gravados | verificações e navegação contextual |
| Serviços/conexões | Prontuário, Pendências, alertas e Dashboard |
| Estados | competência global, programa, análise e bloqueios |
| Ações | selecionar competência, analisar e abrir contexto |
| Desktop | tabela operacional |
| Mobile | rolagem e adaptação responsiva |
| Acessibilidade | controles rotulados e testes de alertas |
| Testes | `tests/e2e/task-10-alertas-competencias.spec.js`; `functional-core.spec.js` |
| Evidências | `*/controlador__competencias__padrao__*.png` |
| Pontos fortes | modelo multidimensional preservado |
| Riscos/lacunas | densidade e dependência de contexto global |
| Classificação | CP, FA |

## S-04 — Pendências Operacionais

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('pendencias')`; `#nav-pendencias` |
| Perfis | Controlador, Assistente e SME conforme ações |
| Tarefa real | tratar filas, registrar envio, reanalisar, contatar, cancelar ou reabrir |
| Dados lidos | pendências, tentativas, contatos, escolas, documentos e verificações |
| Dados gravados | pendências, tentativas, contatos, retificações e logs |
| Serviços/conexões | Competências, Prontuário e Dashboard |
| Estados | quatro filas, filtros, vazio, modal e erro |
| Ações | abrir, registrar envio, reanalisar, contatar, cancelar, reabrir |
| Desktop | listas e painéis operacionais |
| Mobile | conteúdo responsivo e ações acessíveis |
| Acessibilidade | modais com foco, Escape e `aria-live` |
| Testes | `tests/e2e/pendency-cycle.spec.js`; `task-10-11-pendencias.spec.js` |
| Evidências | `*/controlador__pendencias__padrao__*.png` |
| Pontos fortes | ciclo completo e auditável |
| Riscos/lacunas | estado vazio precisa comunicar valor em bases sem pendências |
| Classificação | CP, FA |

## S-05 — Prontuário

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('prontuario', escolaId)` |
| Perfis | Controlador, Assistente, Inventário e SME conforme escopo |
| Tarefa real | consultar e operar o contexto completo de uma escola |
| Dados lidos | escola, programas, competência, verificações, notas, bens, pendências e histórico |
| Dados gravados | notas, bens, verificações, retificações e logs conforme perfil |
| Serviços/conexões | Carteira, Competências e Pendências |
| Estados | programas, documentos, consolidado, bloqueios e histórico |
| Ações | adicionar nota, analisar, retificar e navegar |
| Desktop | visão detalhada extensa |
| Mobile | adaptação por largura e rolagem |
| Acessibilidade | regras por perfil e modais testados |
| Testes | `tests/e2e/functional-core.spec.js`; `task-12-13-retificacoes.spec.js` |
| Evidências | testes e fluxo reproduzível; captura dedicada futura |
| Pontos fortes | concentra rastreabilidade e ação contextual |
| Riscos/lacunas | alta densidade e necessidade de retorno à origem |
| Classificação | CP, FA |

## S-06 — Capital e Inventário

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('inventario')`; `#nav-inventario` |
| Perfis | Equipe de Inventário, Assistente e perfis autorizados |
| Tarefa real | acompanhar bens permanentes, encaminhamento e inventariação |
| Dados lidos | bens, escolas, notas permanentes e processo de inventário |
| Dados gravados | status e encaminhamento de bens |
| Serviços/conexões | Prontuário, notas e auditoria |
| Estados | padrão, sem bens, encaminhado e inventariado |
| Ações | consultar e atualizar situação |
| Desktop | painel/tabela funcional |
| Mobile | rolagem responsiva |
| Acessibilidade | permissões e serviço de inventário |
| Testes | `tests/unit/inventory-service.test.js`; `functional-core.spec.js` |
| Evidências | `*/controlador__inventario__padrao__*.png` |
| Pontos fortes | integra nota permanente ao bem |
| Riscos/lacunas | maturidade visual inferior às superfícies centrais |
| Classificação | FA |

## S-07 — Registros Internos

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('auditoria')`; `#nav-auditoria` |
| Perfis | perfis internos autorizados |
| Tarefa real | consultar eventos administrativos e rastreabilidade |
| Dados lidos | logs administrativos e eventos |
| Dados gravados | nenhum no fluxo de consulta |
| Serviços/conexões | todas as mutações auditáveis |
| Estados | padrão e sem registros |
| Ações | consultar eventos |
| Desktop | tabela simples |
| Mobile | rolagem responsiva |
| Acessibilidade | estrutura semântica básica |
| Testes | `tests/unit/audit-service.test.js`; `application-services.spec.js` |
| Evidências | `*/controlador__registros-internos__padrao__*.png` |
| Pontos fortes | auditoria integrada aos serviços |
| Riscos/lacunas | busca, filtros e hierarquia ainda básicos |
| Classificação | FA |

## S-08 — Configurações SME

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('sme-config')`; `#nav-sme-config` |
| Perfis | Gestão SME e administrador técnico |
| Tarefa real | configurar parâmetros, exercícios, programas e equipes |
| Dados lidos | configuração, exercícios, competências, programas, controladores e inventário |
| Dados gravados | parâmetros e cadastros autorizados com auditoria |
| Serviços/conexões | Dashboard, Competências e equipes |
| Estados | padrão, formulários, validação e conflito |
| Ações | salvar, criar, desativar e reatribuir |
| Desktop | formulários administrativos |
| Mobile | adaptação responsiva parcial |
| Acessibilidade | mensagens e validações heterogêneas |
| Testes | `tests/e2e/exercise-management.spec.js`; testes de serviços |
| Evidências | `*/sme__configuracoes__padrao__*.png` |
| Pontos fortes | serviços transacionais e auditáveis |
| Riscos/lacunas | layout e feedback menos maduros; `alert` ainda presente |
| Classificação | FA, IC |

## S-09 — Gestão de Equipe

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('equipe')`; `#nav-equipe` |
| Perfis | perfis administrativos |
| Tarefa real | gerir integrantes e atribuições |
| Dados lidos | controladores, integrantes e escolas |
| Dados gravados | cadastros, desativação e reatribuição |
| Serviços/conexões | Configurações SME e Carteira |
| Estados | lista, formulário e bloqueio do último integrante |
| Ações | adicionar, editar, remover ou reatribuir |
| Desktop | área administrativa |
| Mobile | responsividade básica |
| Acessibilidade | confirmações nativas coexistentes |
| Testes | testes de `directory-service`; `functional-core.spec.js` |
| Evidências | código e testes |
| Pontos fortes | regras impedem exclusão inválida |
| Riscos/lacunas | uso de `alert/confirm` e pouca orientação |
| Classificação | CP, FA |

## S-10 — Exercícios

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | Configurações SME; `exercise-select` |
| Perfis | SME e administrador técnico |
| Tarefa real | criar exercício e selecionar contexto anual |
| Dados lidos | exercícios, competências e prazos |
| Dados gravados | exercício com doze competências e auditoria |
| Serviços/conexões | todas as superfícies com competência |
| Estados | seleção, criação, duplicidade e prazo |
| Ações | selecionar ou criar exercício |
| Desktop | seletor global e modal/formulário |
| Mobile | seletor responsivo |
| Acessibilidade | validação transacional |
| Testes | `tests/e2e/exercise-management.spec.js`; testes de configuração |
| Evidências | código e testes |
| Pontos fortes | criação atômica e contexto global |
| Riscos/lacunas | encontrabilidade depende da área administrativa |
| Classificação | CP, FA |

## S-11 — Programas

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | Configurações SME e vínculos escolares |
| Perfis | SME e administrador técnico |
| Tarefa real | cadastrar, desativar e vincular programas |
| Dados lidos | programas e vínculos escola-programa |
| Dados gravados | programas, status e vínculos |
| Serviços/conexões | Carteira, Competências e Prontuário |
| Estados | ativo, inativo e vinculado |
| Ações | cadastrar/desativar/vincular |
| Desktop | formulário administrativo |
| Mobile | responsividade básica |
| Acessibilidade | serviço e auditoria |
| Testes | testes de `configuration-service` e `school-service` |
| Evidências | código e testes |
| Pontos fortes | desativação preserva histórico |
| Riscos/lacunas | gestão distribuída em área de configuração |
| Classificação | CP, FA |

## S-12 — Alertas

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | sino do header e `toggleAlertsDropdown` |
| Perfis | perfis operacionais |
| Tarefa real | identificar itens que exigem atenção |
| Dados lidos | projeções de competências, pendências e prazos |
| Dados gravados | nenhum; navegação contextual |
| Serviços/conexões | Competências, Pendências e Dashboard |
| Estados | vazio, com alertas e dropdown aberto |
| Ações | abrir alerta e navegar |
| Desktop | dropdown no header |
| Mobile | adaptação móvel |
| Acessibilidade | controle de teclado parcial a confirmar |
| Testes | `tests/e2e/task-10-alertas-competencias.spec.js` |
| Evidências | código e testes |
| Pontos fortes | alertas ligados a competência |
| Riscos/lacunas | contrato de prioridade e leitura precisa consolidação |
| Classificação | FA |

## S-13 — Busca global

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `#global-search`; `handleGlobalSearch` |
| Perfis | usuários autenticados ou modo local |
| Tarefa real | localizar escola por nome, designação ou INEP |
| Dados lidos | cadastro de escolas |
| Dados gravados | navegação para escola |
| Serviços/conexões | Carteira e Prontuário |
| Estados | sem termo, resultados e múltiplas correspondências |
| Ações | digitar, escolher e abrir |
| Desktop | campo no header |
| Mobile | campo adaptado ao mobile |
| Acessibilidade | rótulo visual e título; teclado precisa auditoria dedicada |
| Testes | `tests/e2e/cycle-b-carteira.spec.js` e fluxos de busca |
| Evidências | código e testes |
| Pontos fortes | busca cobre identificadores operacionais |
| Riscos/lacunas | não possui URL compartilhável nem agrupamento formal |
| Classificação | FA |

## S-14 — Exportação Excel

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | botão e loader assíncrono de Excel |
| Perfis | perfis autorizados |
| Tarefa real | gerar relatório estruturado para análise e prestação de contas |
| Dados lidos | estado canônico, metadados e recorte |
| Dados gravados | arquivo `.xlsx` |
| Serviços/conexões | Dashboard/Carteira e referência congelada |
| Estados | geração, confirmação e erro |
| Ações | exportar e baixar |
| Desktop | ação contextual |
| Mobile | ação disponível em layout responsivo |
| Acessibilidade | mensagens e integração testadas |
| Testes | `tests/e2e/excel-export-button.spec.js`; testes de workbook |
| Evidências | protótipo v2.1 e testes |
| Pontos fortes | workbook estruturado e referência congelada |
| Riscos/lacunas | classificação e distribuição do arquivo são DQ |
| Classificação | ID, DQ |

## S-15 — Autenticação

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `#radar-auth-gate`; bootstrap Auth |
| Perfis | cinco perfis remotos e cenários de negação |
| Tarefa real | entrar, restaurar sessão e sair |
| Dados lidos | sessão, perfil e escopos |
| Dados gravados | sessão local no cliente Supabase; identidade aplicada ao app |
| Serviços/conexões | gate, runtime e RLS |
| Estados | local sem gate remoto; login; sessão expirada; negação |
| Ações | entrar e sair |
| Desktop | diálogo de acesso |
| Mobile | formulário responsivo |
| Acessibilidade | labels, `aria-live`, foco e negações testados |
| Testes | `tests/e2e/supabase-auth-local.spec.js`; `data-error-ux.spec.js` |
| Evidências | código e testes locais |
| Pontos fortes | gate fail-closed e sete identidades de teste |
| Riscos/lacunas | ativação remota é DF |
| Classificação | CP, DF |

## S-16 — Modais e confirmações

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | modais em `index.html` e `modal-accessibility.js` |
| Perfis | todos os perfis conforme ação |
| Tarefa real | confirmar, editar ou resolver ação contextual |
| Dados lidos | dados do formulário e entidade alvo |
| Dados gravados | mutação somente após confirmação |
| Serviços/conexões | todas as superfícies |
| Estados | aberto, erro, fechado e crítico |
| Ações | confirmar, cancelar e fechar |
| Desktop | modais novos e diálogos nativos legados |
| Mobile | modais adaptados |
| Acessibilidade | foco, trap, Escape, retorno e `aria-live` nos novos |
| Testes | `tests/e2e/modal-accessibility.spec.js`; `data-error-ux.spec.js` |
| Evidências | código e testes |
| Pontos fortes | contrato acessível já demonstrado |
| Riscos/lacunas | coexistência com `alert/confirm` cria inconsistência |
| Classificação | CP, IC, FA |

## S-17 — Formulários

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | cadastros e modais operacionais |
| Perfis | perfis conforme permissão |
| Tarefa real | registrar dados com validação e recuperação |
| Dados lidos | campos operacionais, cadastro e contexto |
| Dados gravados | serviços transacionais e auditoria |
| Serviços/conexões | Prontuário, Pendências e Configurações |
| Estados | intocado, alterado, inválido, salvando, erro e sucesso |
| Ações | preencher, validar, salvar e cancelar |
| Desktop | padrões variados |
| Mobile | inputs com medidas mobile |
| Acessibilidade | preservação após erro testada em fluxos novos |
| Testes | `tests/e2e/data-error-ux.spec.js`; testes de serviços |
| Evidências | código e testes |
| Pontos fortes | erros funcionais preservam dados em áreas modernas |
| Riscos/lacunas | obrigatoriedade e feedback não são uniformes |
| Classificação | CP, FA, IC |

## S-18 — Estados vazios, loading e erro

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | renderizadores por superfície e `error-mapper` |
| Perfis | todos os perfis |
| Tarefa real | entender ausência, espera, falha e recuperação |
| Dados lidos | resultado do carregamento e erro tipado |
| Dados gravados | nenhum ou tentativa segura |
| Serviços/conexões | todas as superfícies e persistência |
| Estados | vazio, loading, rede, sessão, RLS, conflito e validação |
| Ações | tentar novamente, ajustar filtro ou autenticar |
| Desktop | mensagens heterogêneas |
| Mobile | responsividade depende da superfície |
| Acessibilidade | `aria-live` e foco em fluxos recentes |
| Testes | `tests/e2e/data-error-ux.spec.js`; `supabase-full-contract.spec.js` |
| Evidências | código e testes |
| Pontos fortes | mapeamento funcional de erros remotos preparado |
| Riscos/lacunas | estados vazios e sucessos não possuem contrato único |
| Classificação | CP, FA, IC |
