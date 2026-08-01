# Catálogo de superfícies do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 29 de julho de 2026

## 1. Regra de leitura

Este catálogo descreve finalidade, recortes e conexões das superfícies atuais. Não substitui:

- política de capacidades;
- serviços de aplicação;
- Auth e RLS;
- contratos de arquitetura;
- testes por perfil;
- verificação do código vigente.

Quando uma linha mencionar perfis “conforme capacidade”, a decisão efetiva deve ser obtida em `src/application/capabilities.js`, guardas de interface, serviços e RLS.

## 2. Princípios transversais

Todas as superfícies devem:

- consumir entidades canônicas;
- respeitar competência global;
- preservar autoria e escopo;
- apresentar próxima ação quando houver trabalho pendente;
- não esconder conteúdo essencial no mobile;
- manter foco, teclado e semântica acessível;
- não criar persistência paralela;
- refletir a governança restritiva da Gestão SME.

## S-01 — Dashboard

| Campo | Contrato atual |
|---|---|
| Rota | `dashboard` |
| Finalidade | sintetizar estado, prioridade e próximos passos |
| Perfis | Controlador, Assistente, Gestão SME e Inventário conforme recorte |
| Contextos | competência, CRE, carteira, escola, programa e situação |
| Dados | escolas, verificações, pendências e projeções operacionais |
| Ações | filtros, cartões e navegação contextual |
| Mobile | mesmos indicadores e universos, reorganizados |
| Restrições | cartões não podem somar universos sobrepostos nem conceder ação proibida |

## S-02 — Carteira de Escolas

| Campo | Contrato atual |
|---|---|
| Rota | `escolas` |
| Finalidade | pesquisar, comparar e abrir unidade |
| Perfis | Controlador e Assistente; leitura gerencial autorizada para SME |
| Responsabilidade | `controller_id` identifica responsável principal |
| Colaboração | Controladores atuam nas escolas da mesma CRE sem transferência automática |
| Desktop | tabela operacional completa |
| Mobile | cartões com o mesmo conteúdo funcional |
| Conexões | Dashboard, Prontuário e Pendências |

## S-03 — Competências Mensais

| Campo | Contrato atual |
|---|---|
| Rota | `competencias` |
| Finalidade | acompanhar bonificação, análise e pendências por mês |
| Contexto | competência global única `YYYY-MM` |
| Perfis | Controlador e Assistente operam; SME consulta bonificação sem análise técnica |
| Dados | competências, programas, verificações, pendências e prazos |
| Conexões | Prontuário, Pendências, alertas, Dashboard e exportações |
| Restrições | nenhum seletor mensal concorrente; nenhuma mutação SME |

## S-04 — Pendências Operacionais

| Campo | Contrato atual |
|---|---|
| Rota | `pendencias` |
| Finalidade | gerir fila, envio, reanálise, contato e encerramento |
| Estados | Aberta, Aguardando reanálise, Resolvida e Cancelada |
| Perfis | Controlador e Assistente conforme capacidade; SME somente leitura |
| Dados | pendências, tentativas, contatos, documentos, escola e verificação |
| Ações | registrar envio, reanalisar, contatar, cancelar e reabrir quando autorizado |
| Restrições | novo envio não resolve; regularização não reescreve bonificação |
| Conexões | Competências, Prontuário, Dashboard e timeline |

## S-05 — Prontuário

| Campo | Contrato atual |
|---|---|
| Rota | `prontuario` + escola |
| Finalidade | concentrar contexto completo da unidade |
| Perfis | Controlador, Assistente, Inventário e SME conforme capacidade |
| Conteúdo | identificação, programas, verificações, pendências, notas, bens e histórico |
| SME | identificação e bonificação; sem análise técnica ou controles operacionais |
| Navegação | retorno contextual para origem real |
| Timeline | aba de leitura cronológica derivada |
| Restrições | não duplicar fonte de estado; respeitar competência ativa |

## S-06 — Capital e Inventário

| Campo | Contrato atual |
|---|---|
| Rota | `inventario` |
| Finalidade | acompanhar bens permanentes, encaminhamento e inventariação |
| Perfis | Equipe de Inventário e Assistente; demais somente quando capacidade expressa existir |
| Escopo | própria CRE, escola e bem autorizado |
| Dados | bens, notas permanentes, processos e autoria |
| Ações | registrar ou atualizar situação patrimonial conforme perfil |
| Conexões | Prontuário, notas, escolas e auditoria |
| Restrições | não conceder módulos não patrimoniais ao Inventário |

## S-07 — Registros Internos

| Campo | Contrato atual |
|---|---|
| Rota | `auditoria` |
| Finalidade | consultar registros administrativos e rastreabilidade |
| Controlador/Assistente | leitura conforme escopo e capacidade |
| Gestão SME | somente registros com `actor_user_id = auth.uid()` |
| Administrador técnico | leitura técnica integral autorizada |
| Dados | `administrative_logs` e contexto funcional |
| Restrições | registros antigos sem UUID não são expostos à SME |

## S-08 — Configurações e Gestão SME

| Campo | Contrato atual |
|---|---|
| Rota | `sme-config` |
| Finalidade | apresentar parâmetros e funções gerenciais autorizadas |
| Perfis | Gestão SME e Administrador técnico conforme capacidade específica |
| Dados | configuração, exercício, competências e parâmetros autorizados |
| Restrições | não inferir mutação ampla apenas pelo nome da tela |
| Programas por exercício | frente separada ainda não implementada |
| Segurança | toda escrita exige serviço, autorização e auditoria |

## S-09 — Gestão de Equipe

| Campo | Contrato atual |
|---|---|
| Rota | `equipe` |
| Finalidade | administrar Controladores, Inventário e atribuições |
| Perfil funcional responsável | Assistente de Verbas Federais |
| Perfil técnico | Administrador técnico para suporte autorizado |
| Backend | `TeamAccountGateway` + Edge Function autenticada + Auth Admin + RPC |
| Ações | convidar, editar, desativar e redistribuir |
| Restrições | Gestão SME não substitui a liderança local; exclusão física é excepcional |
| Auditoria | autoria, idempotência e compensação obrigatórias |

## S-10 — Exercícios

| Campo | Contrato atual |
|---|---|
| Finalidade | selecionar contexto anual e criar exercício quando autorizado |
| Dados | exercícios, competências, prazos e configuração global |
| Criação | operação atômica com doze competências |
| Contexto | exercício e competência permanecem sincronizados |
| Perfis | somente capacidades administrativas expressas |
| Restrições | não alterar fechamento ou calendário por acesso visual isolado |

## S-11 — Programas

| Campo | Contrato atual |
|---|---|
| Finalidade | catálogo global e vínculos escola–programa |
| Dados | `programs` e `school_programs` |
| Histórico | desativação preserva registros anteriores |
| Perfis | somente capacidades administrativas expressas |
| Frente futura | classificação e configuração por exercício exigem desenho próprio |
| Restrições | não misturar essa frente ao polimento ou à governança SME já concluída |

## S-12 — Alertas

| Campo | Contrato atual |
|---|---|
| Local | sino do header e dropdown |
| Finalidade | localizar itens que exigem atenção |
| Contexto | competência global, pendências e prazos |
| Ação | transportar recorte e origem para a superfície adequada |
| Persistência | nenhuma escrita de negócio |
| Acessibilidade | teclado, foco, nome e estado do controle |
| Restrições | prioridade deve refletir regra canônica, não contagem arbitrária |

## S-13 — Busca global

| Campo | Contrato atual |
|---|---|
| Local | header |
| Finalidade | localizar escola por nome, designação ou INEP |
| Dados | cadastro de escolas do escopo autorizado |
| Resultado | navegação para Carteira ou Prontuário |
| Segurança | não revelar escola fora do escopo remoto |
| Mobile | campo e resultados acessíveis |
| Restrições | busca não concede acesso por si só |

## S-14 — Exportações Excel

| Campo | Contrato atual |
|---|---|
| Institucional | botão principal XLSX, histórico e quatro abas |
| SME | botão próprio, uma competência, uma aba e 30 colunas do template canônico |
| CSV | botão secundário e fallback institucional |
| Certificação | regra canônica até a célula OOXML e hashes |
| `dataValidations` SME | ausente por contrato |
| Persistência | nenhuma escrita no Supabase |
| Gate pendente | abertura manual do relatório institucional no Microsoft Excel desktop; Excel SME aprovado |

## S-15 — Autenticação

| Campo | Contrato atual |
|---|---|
| Backend | Supabase Auth em Preview e Production |
| Estado pré-auth | aplicação operacional inerte e acesso institucional bloqueado |
| Sessão | restauração, expiração e logout controlados |
| Perfil | derivado de `user_profiles`, não de seletor visual |
| RLS | segunda linha obrigatória de autorização |
| Anônimo | zero acesso a dados institucionais |
| Gate pendente | proteção contra senhas vazadas |

## S-16 — Modais e confirmações

| Campo | Contrato atual |
|---|---|
| Finalidade | editar, confirmar ou concluir ação contextual |
| Acessibilidade | foco inicial, trap, Escape, retorno e `aria-live` |
| Segurança | mutação somente após validação e confirmação aplicável |
| Mobile | diálogo integral dentro do viewport |
| Legado | `alert/confirm` ainda pode existir, mas não é padrão desejado |
| Restrições | um único modal acessível por ação; sem duplicação de handlers |

## S-17 — Formulários

| Campo | Contrato atual |
|---|---|
| Estados | intocado, alterado, inválido, salvando, erro e sucesso |
| Dados | campos do domínio e contexto da entidade |
| Persistência | serviços de aplicação e unidade de trabalho |
| Erro | preservar valores e foco; mapear mensagem funcional |
| Escrita | sem retry automático silencioso |
| Auditoria | autoria e contexto da operação |
| Acessibilidade | rótulo, obrigatoriedade, erro associado e teclado |

## S-18 — Estados vazios, loading e erro

| Campo | Contrato atual |
|---|---|
| Tipos | vazio, carregando, rede, sessão, RLS, conflito e validação |
| Finalidade | explicar o estado e oferecer próxima ação segura |
| Retry | somente leitura segura e falha transitória |
| Escrita | nunca repetida silenciosamente |
| Acessibilidade | anúncio em `aria-live` e foco quando necessário |
| Conteúdo | não exibir mensagens de infraestrutura como texto operacional bruto |
| Consistência | mesmo erro deve produzir orientação equivalente entre superfícies |

## 3. Relações obrigatórias

```text
Dashboard
↔ Carteira
↔ Competências
↔ Prontuário
↔ Pendências
↔ Timeline
↔ Alertas
↔ Exportações
```

Gestão de Equipe, Inventário, Registros Internos e Configurações conectam-se a esse núcleo por capacidades específicas, sem alterar as regras canônicas.

## 4. Gate para alteração de superfície

Antes de modificar uma superfície:

1. verificar código e perfil efetivo;
2. identificar dados lidos e escritos;
3. mapear conexões e estado global;
4. validar desktop, Android e iPhone;
5. validar foco, teclado e semântica;
6. testar autorização positiva e negativa;
7. preservar conteúdo e rastreabilidade;
8. atualizar este catálogo quando o contrato material mudar.
