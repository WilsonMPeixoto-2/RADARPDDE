# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 3 de agosto de 2026  
**Classe documental:** Canônico  
**Controla:** manutenção técnica, modernização da experiência e evolução funcional

## 1. Finalidade

Este documento é a fonte única para acompanhar as duas frentes de atualização do RADAR PDDE:

1. **manutenção técnica:** dependências, CI, segurança, testes, qualidade e ferramentas de desenvolvimento;
2. **modernização e evolução funcional:** melhorias perceptíveis na experiência, produtividade e capacidade do produto.

Ele não substitui `docs/CURRENT_STAGE.md`, que controla a etapa corrente e os bloqueadores imediatos. Também não substitui especificações de cada frente. Seu papel é impedir que uma atualização isolada seja confundida com o roadmap integral.

## 2. Fontes e precedência

A situação de cada item foi reconciliada com:

- código e dependências da `main`;
- PRs e commits das Rodadas 0, 1, 2 e 3B;
- evidências de Vercel Production;
- documentação canônica e auditorias das rodadas;
- listas técnica e funcional que originaram este ciclo.

Em caso de divergência, prevalecem código remoto, ambientes efetivos, evidência reproduzível e decisão posterior expressa.

## 3. Taxonomia

### 3.1 Status

| Status | Significado |
|---|---|
| **Concluído** | integrado e validado; não exige publicação do site |
| **Concluído e publicado** | integrado, validado e presente em Production |
| **Parcialmente concluído** | parte entregue; restante explicitado |
| **Adiado** | postergado conscientemente após análise |
| **Pendente de execução** | pertinência reconhecida; implementação ainda não iniciada |
| **Pendente de avaliação** | candidato sujeito a diagnóstico e decisão |
| **Mantido/congelado** | versão ou arquitetura preservada deliberadamente |
| **Não aplicável agora** | adoção não recomendada no estágio atual |

### 3.2 Prioridade

- **P0:** pré-condição ou correção bloqueante;
- **P1:** próxima frente recomendada ou ganho alto e maduro;
- **P2:** melhoria relevante dependente de diagnóstico ou etapa anterior;
- **P3:** evolução condicional, experimental ou de menor urgência.

### 3.3 Implantação

- **Interna:** documentação, CI, teste ou ferramenta; não exige deployment do site;
- **Vercel:** altera recurso servido pelo frontend;
- **Supabase:** altera banco, Auth, RLS, Edge Function, Storage ou configuração remota;
- **Vercel + Supabase:** exige coordenação das duas camadas;
- **Nenhuma:** decisão, diagnóstico ou preservação.

Integração à `main` não equivale automaticamente a presença em Production.

## 4. Rodadas reconciliadas

| Rodada | Resultado | Referências | Production |
|---|---|---|---|
| **0 — preparação obrigatória** | corrigiu o workflow do Excel SME, criou verificador de referências locais e registrou baseline | PR `#121`; commit `ad2fed06d7d951cd510d3f93cf8b3232d0026c1e`; `docs/audits/2026-08-01-rodada-0-baseline.md` | não exigida |
| **1 — baixo risco** | atualizou ESLint e Acorn, integrou relatório HTML e análise de handlers; atualizou `actions/checkout` | PR `#122`; commits `ea0871e0ab0f6d6dc62f76ca7bad0e7021433a92` e `20b4da15d100169d358f38070901891c99e4f3d7`; `docs/audits/2026-08-01-rodada-1-baixo-risco.md` | ferramentas internas; pacote foi incluído na publicação conjunta sem exigir efeito funcional próprio |
| **2 — experiência incremental** | implementou busca inteligente, Floating UI e View Transitions; excluiu deliberadamente central de comandos | PR `#123`; commit `8e0a88e88621f4caac48b24049e774700688bd08`; auditoria e especificação da Rodada 2 | publicada pelo PR `#124`; deployment `dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp`; janela fechada pelo PR `#125` |
| **3B — Supabase CLI** | atualizou CLI `2.109.1 → 2.110.0` e adaptou o teste descartável de restauração | PR `#126`; commit `520b51e7080ddae0f4e3f03cf4c045cbea0a233d`; evidência `docs/evidence/releases/2026-08-02-supabase-cli-2-110-0.json` | não exigida; nenhuma operação no Supabase Production |
| **4A — roadmap canônico** | reconcilia as duas listas e institui avaliação tecnológica proativa | especificação, plano e auditoria de 3 de agosto de 2026 | não exigida |

## 5. Roadmap técnico

| Item | Status | Prioridade | Implantação | Evidência/decisão | Próxima ação |
|---|---|---:|---|---|---|
| Corrigir referência inexistente no workflow do Excel SME | Concluído | P0 | Interna | Rodada 0 / PR `#121` | manter regressão |
| Verificador de referências locais dos workflows | Concluído | P0 | Interna | `scripts/check-workflow-references.mjs`; ADR-037 | manter nos gates |
| `actions/checkout` `7.0.0 → 7.0.1` | Concluído | P1 | Interna | commit `20b4da15d100169d358f38070901891c99e4f3d7` | acompanhar Dependabot |
| ESLint `10.7.0 → 10.8.0` | Concluído | P1 | Interna | Rodada 1 / PR `#122` | manter versão fixada |
| Relatório HTML navegável do ESLint | Concluído | P1 | Interna | `lint:security:html` e workflow de dependências | preservar mesmo escopo do lint bloqueante |
| Acorn `8.17.0 → 8.18.0` | Concluído | P1 | Interna | Rodada 1 / PR `#122` | manter análise de handlers |
| Localização real de erros em handlers inline | Concluído | P1 | Interna | auditoria funcional da Rodada 1 | manter contratos |
| Playwright `1.61.1 → 1.62.0` | Pendente de execução | P1 | Interna | PR Dependabot `#79` está sobre base antiga | recriar sobre a `main`; executar E2E, navegadores, perfis e viewports |
| Supabase CLI `2.109.1 → 2.110.0` | Concluído | P1 | Interna | Rodada 3B / PR `#126` | manter versão exata |
| Supabase CLI `2.111.0` | Adiado | P3 | Interna | benefícios incrementais não justificam nova rodada imediata | reavaliar em manutenção futura ou diante de correção aplicável |
| Supabase JS `2.110.8` | Mantido/congelado | P2 | Vercel | versão atual do projeto | atualizar apenas com benefício e bateria completa |
| ExcelJS `4.4.0` | Mantido/congelado | P0 | Vercel | compatibilidade homologada no Excel desktop | não trocar sem necessidade comprovada e nova homologação integral |
| Verificar configuração padrão do CodeQL | Pendente de execução | P1 | Interna | ausência de workflow não comprova desativação | consultar Advanced Security e registrar estado real |
| Dependency Review Action | Pendente de execução | P1 | Interna | recomendação técnica original | adicionar gate de vulnerabilidade e licença em PRs de dependência |
| `actionlint` | Pendente de execução | P1 | Interna | complementa o verificador próprio | validar YAML, expressões e contratos de Actions |
| `zizmor` | Pendente de avaliação | P2 | Interna | candidato de segurança de CI | executar baseline informativo antes de bloquear |
| `eslint-plugin-n` | Pendente de avaliação | P2 | Interna | aplicável somente a arquivos Node | medir ganho sobre Node 24 e escopo de scripts |
| Cobertura consolidada de testes | Pendente de execução | P2 | Interna | suíte ampla sem baseline único | iniciar como evidência; priorizar domínios críticos, não percentual artificial |
| CodeQL avançado customizado | Pendente de avaliação | P3 | Interna | somente após confirmar configuração padrão | adotar apenas se consultas padrão forem insuficientes |
| Renovate | Não aplicável agora | P3 | Nenhuma | duplicaria Dependabot | não instalar |
| `npm-check-updates` | Não aplicável agora | P3 | Nenhuma | Dependabot e `npm outdated` cobrem a necessidade | não instalar |
| Jest ou Vitest | Não aplicável agora | P3 | Nenhuma | `node:test` já está integrado | não migrar sem problema concreto |
| Bundler geral por substituição imediata | Não aplicável agora | P3 | Nenhuma | mudança estrutural ampla e desnecessária | modernizar esbuild incrementalmente |
| `typescript-eslint` amplo | Não aplicável agora | P3 | Nenhuma | pouco TypeScript autoral; tipos principais são gerados | reavaliar se o código TS crescer |
| Novo motor de Excel | Não aplicável agora | P0 | Nenhuma | risco alto sobre funcionalidade homologada | preservar ExcelJS |
| Sentry ou telemetria externa | Pendente de avaliação | P3 | Vercel + governança | exige decisão de LGPD, dados e operação | criar frente própria apenas com necessidade comprovada |
| Troca do `http-server` | Não aplicável agora | P3 | Nenhuma | ferramenta local sem risco operacional relevante | manter |

## 6. Roadmap de modernização da experiência

| Frente | Status | Prioridade | Implantação | Situação atual | Próxima decisão |
|---|---|---:|---|---|---|
| Sistema de componentes com Lit/Web Components | Pendente de avaliação | P2 | Vercel | não instalado; interface ainda combina componentes modernos e padrões antigos | avaliar piloto em Configurações SME, Gestão de Equipe, Inventário ou Registros Internos |
| Diálogos, mensagens, confirmações e estados comuns consistentes | Pendente de avaliação | P1 | Vercel | existem padrões variados e controles nativos antigos | diagnosticar superfícies e decidir se Lit ou componentes nativos modulares oferecem melhor resultado |
| Data grid com Tabulator | Adiado | P2 | Vercel | Rodada 3A não executada por baixo valor imediato frente ao custo | reavaliar somente com caso operacional concreto e volume que justifique a grade |
| TanStack Table Core | Pendente de avaliação | P3 | Vercel | alternativa mais flexível, porém exige desenvolvimento próprio maior | comparar apenas se data grid voltar a ser priorizado |
| Busca inteligente com Fuse.js | Concluído e publicado | P1 | Vercel | busca aproximada no campo existente, por permissões e teclado | manter e medir uso |
| Central de comandos `Ctrl + K` | Adiado | P2 | Vercel | explicitamente excluída da Rodada 2 | reavaliar após observar a busca atual e mapear ações seguras |
| Ajuda contextual com Driver.js | Pendente de avaliação | P1 | Vercel | fluxos complexos ainda dependem de documentação externa | escolher uma jornada crítica para piloto e garantir mobile/acessibilidade |
| Gráficos operacionais com Apache ECharts | Pendente de avaliação | P2 | Vercel | indicadores existem, mas sem frente específica de tendências | aprovar somente gráficos que respondam pergunta operacional e tenham equivalente textual/tabular |
| Floating UI | Concluído e publicado | P1 | Vercel | menus de alertas, perfil e resultados usam posicionamento responsivo e fallback | expandir apenas quando outra superfície comprovar necessidade |
| Supabase Realtime para detecção de mudanças | Pendente de avaliação | P2 | Vercel + Supabase | não implementado | começar por aviso de dados desatualizados, sem edição colaborativa simultânea |
| Presença de usuários e colaboração em tempo real | Pendente de avaliação | P3 | Vercel + Supabase | não implementado | depende de governança, privacidade e valor operacional comprovado |
| PWA com Workbox | Pendente de avaliação | P2 | Vercel | não implementado | diagnosticar conectividade real antes de introduzir service worker e cache |
| Dexie/IndexedDB para rascunhos | Pendente de avaliação | P2 | Vercel | não implementado | considerar recuperação de texto e formulários antes de mutações offline |
| Sincronização automática offline de mutações | Não aplicável agora | P3 | Vercel + Supabase | risco de autoria, conflito e auditoria | não implementar sem desenho específico de concorrência e reconciliação |
| View Transition API | Concluído e publicado | P1 | Vercel | transições progressivas, sem animação inicial e com `prefers-reduced-motion` | manter uso restrito e não ornamental |
| Modularização ampla com esbuild | Parcialmente concluído | P2 | Vercel | esbuild já gera bundles especializados e carregamento sob demanda; frontend amplo continua segmentado por scripts | mapear entradas, dependências globais e ganhos antes de ampliar |
| Migração integral para React/Vue/Svelte | Não aplicável agora | P3 | Vercel | custo e risco superam ganho imediato | reconsiderar somente após diagnóstico arquitetural e benefício superior à modernização incremental |

## 7. Roadmap de novas capacidades do produto

| Capacidade | Status | Prioridade | Implantação | Dependência/critério |
|---|---|---:|---|---|
| Visualizações salvas de filtros e colunas | Pendente de avaliação | P1 | Vercel ou Vercel + Supabase | definir se preferência é local ou institucional e quais perfis podem compartilhar |
| Ações em lote | Pendente de avaliação | P2 | Vercel + Supabase | exige autorização, atomicidade, auditoria e tratamento de falhas parciais |
| Central de notificações e tarefas | Pendente de avaliação | P2 | Vercel + Supabase | distinguir alerta informativo de tarefa com responsável e prazo |
| Favoritos e escolas recentes | Pendente de avaliação | P2 | Vercel ou Vercel + Supabase | definir privacidade e persistência por usuário |
| Painel “Minha jornada hoje” | Pendente de avaliação | P2 | Vercel | depende de tarefas, prazos, carteira e permissões confiáveis |
| Histórico com comparação antes/depois | Parcialmente concluído | P2 | Vercel + Supabase | timeline existe; diff estruturado ainda não | avaliar fontes com versões suficientes e restrições da Gestão SME |
| Comentários e menções internas | Pendente de avaliação | P3 | Vercel + Supabase | exige governança, moderação, notificação e retenção |
| Indicadores de prazo e risco | Pendente de avaliação | P1 | Vercel | definir regras objetivas e evitar score opaco |
| Atalhos de teclado globais | Parcialmente concluído | P2 | Vercel | busca e menus já têm navegação por teclado; não há catálogo global | mapear ações seguras e conflitos de atalhos |
| Exportações personalizáveis | Pendente de avaliação | P2 | Vercel | preservar relatórios institucionais canônicos e criar produto separado quando necessário |
| Painéis configuráveis por perfil | Pendente de avaliação | P3 | Vercel + Supabase | depende de modelo de preferências e limites editoriais |
| Anexos e evidências com Supabase Storage | Pendente de avaliação | P3 | Vercel + Supabase | exige decisão de governança, LGPD, retenção, tipos, tamanho e antivírus |
| Assistência contextual baseada nas regras do PDDE | Pendente de avaliação | P1 | Vercel | priorizar regras determinísticas, fonte e explicabilidade; não depende de IA generativa |
| Resumo automático da situação da escola | Pendente de avaliação | P2 | Vercel | deve derivar de dados canônicos e apontar fonte de cada conclusão |
| Detecção de inconsistências e recomendações operacionais | Pendente de avaliação | P1 | Vercel | regras objetivas, testáveis e sem substituir decisão humana |
| Modo de apresentação gerencial SME/CRE | Pendente de avaliação | P2 | Vercel | preservar recortes de visibilidade e não expor análise técnica restrita |

## 8. Regra permanente de oportunidade tecnológica

Toda tarefa — correção, melhoria visual, mudança de fluxo ou nova funcionalidade — deve avaliar se o resultado fica materialmente melhor com atualização, instalação ou capacidade tecnológica moderna.

### 8.1 Quando propor

A proposta deve ser apresentada quando:

- a solução atual for paliativa ou limitada pela tecnologia usada;
- existir componente especializado maduro que melhore acessibilidade, segurança, desempenho, consistência ou manutenção;
- uma queixa recorrente indicar problema estrutural da arquitetura;
- o recurso pedido puder ser entregue com maior robustez por ampliação tecnológica;
- insistir na pilha atual reduzir claramente a qualidade final.

### 8.2 Conteúdo mínimo da proposta

1. limite observado;
2. tecnologia sugerida e versão/capacidade relevante;
3. ganho concreto;
4. alternativa sem nova dependência;
5. custo e risco;
6. impacto em bundle, dados, permissões e Production;
7. testes, rollback e evidências.

### 8.3 Limites

- propor não significa instalar;
- não ampliar escopo silenciosamente;
- não adotar pacote apenas porque é moderno;
- manter solução existente quando o resultado for equivalente e mais simples;
- seguir versões fixadas, ADR-020 e ADR-038;
- separar atualização, integração funcional e ativação de Production quando isso melhorar segurança e rastreabilidade.

## 9. Sequência posterior à Rodada 4A

| Ordem | Frente | Estado de decisão |
|---:|---|---|
| **4B** | Playwright `1.62.0` e navegadores | próxima atualização técnica recomendada; branch própria; sem Production |
| **5** | verificar CodeQL, adicionar Dependency Review e `actionlint`; avaliar baseline do `zizmor` | frente de segurança e CI; escopo deve ser especificado antes da execução |
| **6** | baseline de cobertura dos testes | iniciar como evidência, sem limite global arbitrário |
| **7** | selecionar a próxima evolução funcional por benefício | comparar candidatos antes de instalar pacote ou definir solução |

A ordem acima não impede correção urgente. Em qualquer tarefa, a regra de oportunidade tecnológica pode revelar necessidade de pacote ou atualização mais adequada; a proposta deve ser apresentada e decidida antes da implementação correspondente.

## 10. Critérios para aprovar item pendente

Antes de converter candidato em tarefa aprovada, registrar:

- problema real e usuários afetados;
- benefício perceptível e operacional;
- compatibilidade com a arquitetura atual;
- acessibilidade e equivalência mobile;
- impacto em segurança, LGPD, autoria e auditoria;
- custo de bundle, desempenho e manutenção;
- alternativas sem nova dependência;
- plano de teste e rollback;
- necessidade de Vercel, Supabase ou ambas;
- critério objetivo de sucesso.

## 11. Manutenção deste roadmap

Atualizar este documento quando:

- uma rodada for concluída, parcialmente concluída, adiada ou substituída;
- surgir nova atualização técnica relevante;
- uma tarefa revelar oportunidade tecnológica material;
- um candidato funcional for aprovado ou rejeitado;
- houver mudança na necessidade de Production;
- uma evidência ou decisão alterar o status de um item.

Planos históricos permanecem preservados. O roadmap registra o estado atual sem reescrever retrospectivamente o que foi planejado ou executado.
