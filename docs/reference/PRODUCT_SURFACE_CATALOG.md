# Catálogo de superfícies do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Regra de leitura

Este catálogo descreve finalidade, perfis, dados, ações e integração. A autorização efetiva é cumulativa entre interface, capacidades, serviços, Auth, RLS, RPCs e Edge Functions.

Toda superfície deve:

- consumir entidades canônicas;
- respeitar competência e exercício;
- preservar autoria e escopo;
- indicar próxima ação;
- manter conteúdo e capacidade no mobile;
- usar serviços de aplicação e repositório;
- atualizar a interface após o backend;
- preservar o resultado após recarregar;
- tratar falha e conflito de forma compreensível.

## S-01 — Dashboard

| Campo | Contrato |
|---|---|
| Rota | `dashboard` |
| Perfis | Controlador, Assistente, SME e Inventário conforme recorte |
| Finalidade | sintetizar estado, prioridade e próximos passos |
| Dados | escolas, verificações, pendências, bens e projeções |
| Ações | filtros, cartões, navegação e exportações autorizadas |
| Assistente | grupo com Relatório RADAR PDDE e Excel SME, além de Redistribuir Escolas |
| Restrições | universos não sobrepostos e ações somente por capacidade |

## S-02 — Carteira de Escolas

| Campo | Contrato |
|---|---|
| Rota | `escolas` |
| Finalidade | pesquisar, comparar e abrir unidade |
| Perfis | Controlador, Assistente e SME em leitura autorizada |
| Responsabilidade | `controller_id` define responsável principal |
| Colaboração | Controladores da mesma CRE podem atuar sem transferência automática |
| Ações | abrir prontuário e editar quando autorizado |
| Mobile | mesmos dados e ações em organização responsiva |

## S-03 — Competências Mensais

| Campo | Contrato |
|---|---|
| Rota | `competencias` |
| Contexto | competência global única `YYYY-MM` |
| Finalidade | acompanhar bonificação, análise e pendências por mês |
| Perfis | Controlador e Assistente operam; SME consulta recorte gerencial |
| Dados | competências, programas, verificações, pendências e prazos |
| Restrições | nenhum seletor concorrente; nenhuma análise técnica para SME |

## S-04 — Pendências Operacionais

| Campo | Contrato |
|---|---|
| Rota | `pendencias` |
| Estados | Aberta, Aguardando reanálise, Resolvida e Cancelada |
| Perfis | Controlador e Assistente operam; SME consulta; Inventário vê recorte patrimonial |
| Ações | abrir, registrar envio, reanalisar, contatar, cancelar e reabrir conforme capacidade |
| Regra | novo envio não resolve; reanálise decide a transição |
| Persistência | pendência, tentativa, contato, verificação e log |

## S-05 — Prontuário

| Campo | Contrato |
|---|---|
| Rota | `prontuario` + escola |
| Finalidade | concentrar contexto da unidade |
| Conteúdo | identificação, programas, verificações, pendências, notas, bens e timeline |
| Perfis | todos conforme capacidade e escopo |
| SME | identificação e bonificação, sem análise técnica ou controles operacionais |
| Navegação | retorno contextual com competência, filtros, rolagem e foco |

## S-06 — Capital e Inventário

| Campo | Contrato |
|---|---|
| Rota | `inventario` |
| Perfis | Inventário e Assistente; leitura autorizada para outros perfis |
| Dados | bens, notas permanentes, processos, responsável e tombamento |
| Ações | encaminhar, atualizar e concluir inventariação |
| Backend | `InventoryService`, `assets` e RPCs compostas |
| Restrições | perfil Inventário não recebe módulos não patrimoniais |

## S-07 — Registros Internos

| Campo | Contrato |
|---|---|
| Rota | `auditoria` |
| Dados | `administrative_logs` e contexto funcional |
| Controlador/Assistente | leitura conforme escopo |
| SME | somente `actor_user_id = auth.uid()` |
| Admin técnico | leitura ampla e procedimentos excepcionais |
| Restrições | registros antigos sem UUID não aparecem no recorte SME |

## S-08 — Configurações SME

| Campo | Contrato |
|---|---|
| Rota | `sme-config` |
| Perfis | Gestão SME e administrador técnico |
| Dados | exercício, competência, prazo, programas e configuração global |
| Backend | `ConfigurationService`, tabelas de configuração e RPCs |
| Estado atual | funções de exercício, calendário e programas existem no frontend e no Supabase |
| Pendência funcional | confirmar o escopo de programas antes de nova mudança |
| Regra | acesso visual não substitui serviço, RLS, auditoria e concorrência |

## S-09 — Gestão de Equipe

| Campo | Contrato |
|---|---|
| Rota | `equipe` |
| Responsável | Assistente de Verbas Federais |
| Dados | Controladores, Inventário, perfis Auth e carteiras |
| Ações | cadastrar, editar, redistribuir e desativar |
| Frontend | `DirectoryService` e `TeamAccountGateway` |
| Backend | `team-account-management` v95 + Auth Admin + RPC |
| Proteções | CORS, JWT, papel, idempotência, vínculo histórico e compensação |
| Releitura | resultado deve permanecer após recarregar |

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
| Pendência | confirmar regra institucional da manutenção por SME |
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

## S-13 — Busca global

| Campo | Contrato |
|---|---|
| Local | cabeçalho |
| Motor | Fuse.js carregado sob demanda, com fallback |
| Conteúdo | escolas autorizadas, módulos, programas, competências e pendências consultáveis |
| Ação | navegação contextual para o destino |
| Segurança | não revela recurso fora do escopo |
| Acessibilidade | clique, setas, Enter e Escape |

## S-14 — Exportações

| Campo | Contrato |
|---|---|
| Institucional | XLSX histórico de quatro abas |
| SME | uma competência, uma aba e **27 colunas A:AA** |
| Template SME | 30 colunas apenas como base visual; K, R e Y removidas na projeção |
| CSV | secundário e fallback institucional |
| Assets | manifesto, tamanho e SHA do ExcelJS e template |
| Certificação | modelo, workbook, reabertura, OOXML, células e hashes |
| Persistência | nenhuma escrita de dados de negócio |
| Homologação | Excel SME aprovado no Microsoft Excel desktop |

## S-15 — Autenticação

| Campo | Contrato |
|---|---|
| Backend | Supabase Auth |
| Estado pré-auth | aplicação inerte |
| Sessão | restauração, renovação e logout controlados |
| Perfil | `user_profiles`, perfil ativo, papel efetivo e escopos |
| RLS | autorização obrigatória adicional |
| Anônimo | nenhum dado institucional |
| Monitor | shell, gate e bloqueio anônimo verificados continuamente |

## S-16 — Modais e confirmações

| Campo | Contrato |
|---|---|
| Finalidade | editar ou confirmar ação contextual |
| Acessibilidade | foco inicial, Escape, retorno e anúncio |
| Escrita | somente após validação e confirmação aplicável |
| Mobile | conteúdo integral no viewport |
| Estado | salvando, sucesso e erro sem duplicação de clique |

## S-17 — Formulários

| Campo | Contrato |
|---|---|
| Estados | intocado, alterado, inválido, salvando, erro e sucesso |
| Persistência | serviço de aplicação e unidade de trabalho |
| Erro | preservar valores, foco e mensagem funcional |
| Escrita | sem repetição automática silenciosa |
| Auditoria | autoria e contexto |
| Releitura | salvar, recarregar e confirmar o mesmo resultado |

## S-18 — Estados vazios, loading e erro

| Campo | Contrato |
|---|---|
| Tipos | vazio, carregando, sessão, rede, CORS, RLS, conflito, validação e asset |
| Finalidade | explicar o estado e oferecer próxima ação segura |
| Retry | somente quando idempotente ou explicitamente protegido |
| Escrita | nunca repetida silenciosamente |
| Consistência | mesmo código de falha produz orientação equivalente |

## S-19 — Monitoramento de Production

| Campo | Contrato |
|---|---|
| Superfície | GitHub Actions e Issues |
| Finalidade | detectar falha do ambiente publicado |
| Frequência | push na `main`, hora em hora e manual |
| Verificações | SHA, manifesto, assets, Auth gate, bloqueio anônimo e preflight |
| Incidente | issue automática única, atualizada e encerrada após recuperação |
| Limite | não substitui smoke autenticado nem mutações |

## 3. Relações obrigatórias

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

## 4. Gate para alteração de superfície

1. identificar perfis autorizados e negados;
2. mapear dados lidos e escritos;
3. localizar handler, serviço, repositório e backend;
4. testar autorização positiva e negativa;
5. confirmar atualização e releitura;
6. testar erro, conflito e compensação;
7. validar desktop, Android e iPhone;
8. validar foco, teclado e semântica;
9. atualizar catálogo e documentação;
10. confirmar ambiente e SHA da evidência.
