# Matriz de cobertura funcional — RADAR PDDE e Supabase

## Finalidade

Este documento relaciona as superfícies do frontend, os dados alterados pelo usuário, os efeitos derivados e a representação preparada para o Supabase. Ele não significa que a aplicação já esteja conectada: produção permanece em `localStorage` e a ponte operacional com o banco continua desativada.

## Legenda

- **Canônico:** possui tabela e colunas próprias.
- **JSONB:** atributos variáveis permanecem preservados em estrutura JSON.
- **Derivado:** calculado a partir de dados canônicos; não deve ser gravado como fonte de verdade.
- **Local:** preferência ou estado transitório que não pertence ao banco institucional.
- **Pré-ativação:** tarefa obrigatória apenas quando a conexão real for iniciada.

## Cobertura por domínio

| Superfície ou ação | Estado atual | Destino preparado | Efeitos e dependências | Evidência |
|---|---|---|---|---|
| Dashboard e cartões | Derivado de escolas, verificações e pendências | consultas sobre `schools`, `verifications`, `pendencies` | filtros locais não alteram dados | E2E Dashboard e auditoria funcional |
| Carteira de Escolas | escolas, programas, controlador, pendências e bens | `schools`, `school_programs`, `controllers`, `pendencies`, `assets` | última movimentação e próxima ação são derivados | E2E Carteira desktop/mobile |
| Busca global | filtro transitório | **Local** | não deve persistir no banco | auditoria de handlers |
| Competência global | `activeCompetenciaKey` e `config.competenciaFechamento` | `app_config.closing_competence`, `competences` | orienta Dashboard, Carteira, prontuário e alertas | testes de competência e exercício |
| Exercícios anuais | `config.exercicios` | `app_config.exercises`, `competences.exercise` | cada exercício gera doze competências | `exercise-management.spec.js` |
| Prazo de bonificação | `COMPETENCIAS[].bonifPrazo` | `competences.bonus_deadline` | usado por avisos e resultados de prazo | migration 004 e testes SQL |
| Cadastro/edição de escola | objeto em `escolas` | `schools` | controlador, processo e competência inicial têm FKs | testes de mutação e snapshot |
| Programas da escola | `programasIds` | `school_programs` | relação N:N, vigência e desativação lógica | ponte bidirecional |
| Controladores | `controladores` | `controllers` | vínculo futuro a `auth.users` | testes de repositório e RLS |
| Equipe de Inventário | `equipeInventario` | `inventory_team_members` | vínculo futuro a `auth.users` | testes de repositório e RLS |
| Bonificação documental | `verificacoes[].bonificacao` | `verifications.bonification` **JSONB** | resultado é recalculado pelas regras atuais | testes do fluxo operacional |
| Análise técnica | `verificacoes[].analise` | `verifications.analysis` **JSONB** | estados documentais permanecem iguais | testes do fluxo operacional |
| Resultado de bonificação | `resultadoBonif` | `verifications.bonus_result` | consolidado somente quando requisitos são válidos | testes de consolidação |
| Criar pendência | `pendencias` | `pendencies` | gera log e alerta; `next_actor` é preservado | E2E pendências e ponte |
| Reenviar documento | `tentativas` dentro da pendência | `pendency_attempts` | número único por pendência | E2E reenvio |
| Reanalisar pendência | tentativa e status | `pendency_attempts`, `pendencies` | pode resolver ou manter em reanálise | E2E reanálise |
| Resolver/cancelar pendência | status e datas | `pendencies` | datas condicionadas ao status | constraints SQL e E2E |
| Histórico de pendência | `historico` e atributos adicionais | `pendencies.payload`, `pendency_attempts.payload` | preservação integral durante migração | ponte e testes de ida/volta |
| Registrar contato | `contatos` | `pendency_contacts` | `desc`, tipo, data, pendência e cobrança oficial | `state-bridge.test.js` |
| Cobrança oficial | `cobrancaOficial` | `pendency_contacts.official_charge` | influencia indicadores e histórico | ponte bidirecional |
| Cadastrar nota de consumo | `notasRegistradas` | `registered_invoices` | não cria bem | migration 005 e testes |
| Cadastrar nota de serviço | nota e verificação | `registered_invoices`, `verifications` | torna consulta à assessoria obrigatória | testes funcionais existentes |
| Cadastrar nota permanente | nota e bem | `registered_invoices`, `assets` | cria bem e vincula `linked_asset_id` | migration 005 e ponte |
| Contexto da nota | `compKey` | `competence_id`, `program_id`, `verification_id`, `source_context_key` | permite reconstruir prontuário exato | migration 005 e round-trip |
| Editar nota | nota, bem e verificação relacionados | mesmas tabelas | alterações devem ser transacionais na ponte real | **Pré-ativação** |
| Remover nota | nota, bem e análise relacionada | mesmas tabelas | pode remover bem e redefinir análise | **Pré-ativação**, já coberto no modo local |
| Bens patrimoniais | `bens` | `assets` | escola, competência, NF, valor e processo | testes de inventário |
| Inventariar bem | responsável, data, status e observações | `assets.inventoried_by_member_id`, `inventoried_at`, `status`, `notes` | vínculo com equipe de inventário | migration 005 e ponte |
| Logs operacionais | `logs` | `administrative_logs` | usuário, perfil, ação, detalhes e horário | snapshot e auditoria |
| Auditoria técnica | inexistente no navegador | `audit_events` | produzida por triggers, imutável para usuários | migration 003 |
| Importações | inexistente no modo local | `data_import_runs` | idempotência e reconciliação | migration 003 |
| Perfis simulados atuais | `currentProfile` | **Local**, até autenticação real | não é identidade de segurança | matriz de permissões |
| Login e sessão | ainda não implementados | `auth.users`, `user_profiles` | exige fluxo real de autenticação | **Pré-ativação** |
| Escopo por escola | controlador/perfil atual | `user_school_scopes` e funções RLS | leitura e escrita separadas | migration 002 |
| Tema claro/escuro | `radar_pdde_theme` | **Local** | preferência visual do dispositivo | não migrar |
| View, modal e filtro ativos | variáveis de interface | **Local** | estado efêmero | não migrar |
| Alertas | derivados de pendências, prazos e bens | consultas derivadas | não duplicar como fonte de verdade | E2E de alertas |
| Exportação Excel | derivada do estado atual | leitura das entidades canônicas | arquivo não é persistência primária | regressão E2E |

## Dependências automáticas entre campos

### Nota fiscal

1. **Tipo permanente** cria ou atualiza um bem em `assets`.
2. O bem pode ser vinculado pela nota em `registered_invoices.linked_asset_id`.
3. **Tipo serviço** exige consulta à assessoria na verificação.
4. Remover a última nota pode redefinir a análise documental para “Não analisado”.
5. Remover a última nota de serviço pode devolver a consulta à assessoria para “Não se aplica”.
6. O contexto `competência_programa` é decomposto em FKs e também preservado em `source_context_key`.

### Escola e programas

1. Alterar controlador atualiza `schools.controller_id`.
2. Alterar programas recria o conjunto ativo de `school_programs`.
3. Processo de inventário influencia o encaminhamento de bens.
4. Competência inicial limita o recorte histórico da escola.

### Pendências

1. Abertura registra competência, programa, documento, responsável e próximo ator.
2. Reenvio gera tentativa numerada.
3. Reanálise altera tentativa e status da pendência.
4. Resolução e cancelamento exigem datas compatíveis.
5. Contatos e cobranças podem ser vinculados à pendência.

### Exercícios e competências

1. Criar exercício gera doze competências mensais.
2. A competência inicial selecionada passa a ser o fechamento operacional.
3. Cada competência recebe prazo ordinário no mês seguinte.
4. Alternar o exercício altera o recorte visual, não duplica dados.

## Cobertura automatizada

A preparação utiliza quatro camadas:

1. **Análise estática:** inventaria chaves `localStorage`, raízes de estado, handlers, formulários, configurações e funções mutadoras.
2. **Testes unitários:** contratos dos repositórios, paginação, lotes, concorrência, snapshots e ponte bidirecional.
3. **PostgreSQL real:** aplica todas as migrations e exercita triggers.
4. **Playwright:** desktop Chromium, Android Chromium e iPhone WebKit, com fluxos funcionais e ausência de conexão Supabase no modo local.

## Itens que não devem ser confundidos com conclusão da integração

O PR de preparação não executa estas etapas:

- criação do projeto remoto;
- aplicação de migrations no projeto real;
- criação de usuários reais;
- homologação das políticas RLS no ambiente remoto;
- substituição das chamadas diretas do `app.js` pelo repositório;
- ativação de `supabase-preview`;
- configuração de URL e chave publicável;
- promoção para produção.

## Bloqueios obrigatórios antes da primeira conexão

1. Remover a integração direta e o seed automático antigos do `app.js`.
2. Remover o carregamento flutuante `@supabase/supabase-js@2` do HTML e usar uma versão fixada ou bundle controlado.
3. Implementar autenticação e restauração de sessão.
4. Ligar cada mutação da interface ao contrato de repositório, usando `updateWithVersion()` nas edições.
5. Executar importação e reconciliação em Preview.
6. Homologar RLS com usuários positivos e negativos.
7. Testar falha de rede, sessão expirada, conflito e rollback.

Esses itens pertencem à futura etapa de conexão. O objetivo desta preparação é tornar cada um explícito, testável e reversível, sem alterar a produção atual.
