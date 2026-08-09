# Catálogo de superfícies do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 9 de agosto de 2026

## 1. Regra de leitura

Este catálogo descreve finalidade, perfis, dados, ações e integração. A autorização efetiva é cumulativa entre interface, capacidades, serviços, Auth, RLS, RPCs e Edge Functions.

`technical_admin` é papel autenticado técnico transversal. A escolha de um perfil funcional para simulação altera a apresentação da interface, mas não reduz a autoridade real do administrador técnico nem troca sua identidade/JWT.

Toda superfície deve:

- consumir entidades canônicas;
- respeitar competência e exercício;
- preservar autoria e escopo;
- indicar próxima ação;
- manter conteúdo e capacidade no mobile;
- usar serviços de aplicação e repositório;
- atualizar a interface após o backend;
- preservar o resultado após recarregar quando houver persistência;
- tratar falha e conflito de forma compreensível;
- tornar ações e contexto encontráveis e legíveis.

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

## S-03 — Competências Mensais

| Campo | Contrato |
|---|---|
| Rota | `competencias` |
| Contexto | competência global única `YYYY-MM` via `RadarCompetenceContext` |
| Finalidade | acompanhar bonificação, análise e pendências por mês |
| Perfis | Controlador e Assistente operam; SME consulta recorte gerencial; administrador técnico preserva autoridade real sob simulação |
| Dados | competências, programas, verificações, pendências e prazos |
| Restrições | nenhum seletor concorrente; nenhuma análise técnica para SME real |

## S-04 — Pendências Operacionais

| Campo | Contrato |
|---|---|
| Rota | `pendencias` |
| Estados | Aberta, Aguardando reanálise, Resolvida e Cancelada |
| Perfis | Controlador e Assistente operam; SME consulta; Inventário vê recorte autorizado; administrador técnico mantém autoridade integral |
| Ações | abrir, registrar envio, reanalisar, contatar, cancelar e reabrir conforme capacidade |
| Reanálise | Controlador, Assistente e `technical_admin`; SME e Inventário não executam a mutação |
| Contexto | competência global e filtro de unidade devem permanecer visíveis e coerentes |
| Regra | novo envio não resolve; reanálise decide a transição |
| Persistência | pendência, tentativa, contato, verificação e log |

## S-05 — Prontuário

| Campo | Contrato |
|---|---|
| Rota | `prontuario` + escola |
| Finalidade | concentrar contexto da unidade |
| Conteúdo | identificação, programas, verificações, pendências, notas, bens e timeline |
| Perfis | todos conforme capacidade e escopo; administrador técnico mantém autoridade autenticada |
| SME | identificação e bonificação, sem análise técnica ou controles operacionais quando o papel real é SME |
| Navegação | retorno contextual com competência, filtros, rolagem e foco |

## S-06 — Capital e Inventário

| Campo | Contrato |
|---|---|
| Rota | `inventario` |
| Perfis | Inventário e Assistente; leitura/operação adicional conforme política para Controlador e administrador técnico |
| Dados | bens, notas permanentes, processos, responsável e tombamento |
| Ações | cadastrar, encaminhar, atualizar e concluir inventariação conforme capacidade |
| Backend | `InventoryService`, `assets` e RPCs compostas |
| Restrições | perfil Inventário não recebe módulos não patrimoniais; SME não ganha mutação patrimonial por simples acesso visual |

## S-07 — Registros Internos

| Campo | Contrato |
|---|---|
| Rota | `auditoria` |
| Dados | `administrative_logs` e contexto funcional |
| Controlador/Assistente | leitura conforme capacidade e escopo |
| SME | somente `actor_user_id = auth.uid()` quando o papel autenticado real é SME |
| Admin técnico | leitura ampla independentemente do perfil visual simulado |
| Restrições | registros antigos sem UUID não aparecem no recorte de um usuário SME real |

## S-08 — Configurações SME

| Campo | Contrato |
|---|---|
| Rota | `sme-config` |
| Perfis | Gestão SME e administrador técnico |
| Dados | exercício, competência, prazo, programas e configuração global |
| Backend | `ConfigurationService`, tabelas de configuração e RPCs |
| Estado atual | funções de exercício, calendário e programas existem no frontend e no Supabase |
| Regra | acesso visual não substitui serviço, RLS, auditoria e concorrência |

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
| Mobile | conteúdo integral no viewport |
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

## S-19 — Monitoramento de Production

| Campo | Contrato |
|---|---|
| Superfície | GitHub Actions e Issues |
| Finalidade | detectar falha do ambiente publicado |
| Verificações | SHA, manifesto, assets, Auth gate, bloqueio anônimo e preflight conforme workflow vigente |
| Incidente | issue automática única, atualizada e encerrada após recuperação |
| Limite | monitor técnico não substitui teste funcional quando houver risco funcional concreto |

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

O gate é proporcional ao impacto. Ver `TEST_GOVERNANCE.md`.

Para a superfície efetivamente alterada, verificar o conjunto materialmente necessário entre:

1. perfis autorizados e negados;
2. dados lidos e escritos;
3. handler, serviço, repositório e backend;
4. autorização positiva e, quando relevante, negativa;
5. atualização da interface e releitura quando houver persistência;
6. erro, conflito e compensação quando aplicáveis;
7. desktop/mobile quando o layout ou a interação forem afetados;
8. foco, teclado, semântica, encontrabilidade e legibilidade quando houver impacto de UX;
9. documentação vigente afetada;
10. ambiente e SHA da evidência quando houver publicação.

Não executar todos os itens por ritual quando a alteração não os alcança.
