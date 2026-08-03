# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 3 de agosto de 2026  
**Classe documental:** Canônico  
**Controla:** manutenção técnica, modernização da experiência e evolução funcional

## 1. Finalidade

Este documento acompanha duas frentes independentes:

1. **manutenção técnica:** dependências, CI, segurança, testes, qualidade e ferramentas de desenvolvimento;
2. **modernização e evolução funcional:** melhorias perceptíveis na experiência, produtividade e capacidade do produto.

`docs/CURRENT_STAGE.md` controla a etapa corrente e os ambientes. Este roadmap impede que uma atualização isolada seja confundida com o plano integral.

## 2. Precedência

A situação de cada item deve ser confrontada com:

- código e dependências da `main`;
- PRs, commits e checks;
- Vercel Production e seu SHA;
- Supabase autorizado quando aplicável;
- evidências e decisões posteriores.

Integração à `main` não equivale automaticamente a presença em Production.

## 3. Taxonomia

### 3.1 Status

| Status | Significado |
|---|---|
| **Concluído** | integrado e validado; não exige publicação do site |
| **Concluído e publicado** | integrado, validado e presente em Production |
| **Parcialmente concluído** | parte entregue; restante explicitado |
| **Adiado** | postergado conscientemente após análise |
| **Pendente de execução** | pertinência reconhecida; implementação não iniciada |
| **Pendente de avaliação** | candidato sujeito a diagnóstico e decisão |
| **Mantido/congelado** | versão ou arquitetura preservada deliberadamente |
| **Não aplicável agora** | adoção não recomendada no estágio atual |

### 3.2 Prioridade

- **P0:** pré-condição ou correção bloqueante;
- **P1:** próxima frente recomendada ou ganho alto e maduro;
- **P2:** melhoria relevante dependente de diagnóstico ou etapa anterior;
- **P3:** evolução condicional, experimental ou de menor urgência.

### 3.3 Implantação

- **Interna:** documentação, CI, teste ou ferramenta; não exige deployment;
- **Vercel:** altera recurso servido pelo frontend;
- **Supabase:** altera banco, Auth, RLS, Edge Function, Storage ou configuração remota;
- **Vercel + Supabase:** exige coordenação das duas camadas;
- **Nenhuma:** decisão, diagnóstico ou preservação.

## 4. Rodadas reconciliadas

| Rodada | Estado | Resultado | Referências | Production |
|---|---|---|---|---|
| **0 — preparação** | concluída | workflow do Excel SME, verificador de referências e baseline | PR `#121`; commit `ad2fed06d7d951cd510d3f93cf8b3232d0026c1e` | não exigida |
| **1 — baixo risco** | concluída | ESLint 10.8.0, Acorn 8.18.0, relatório HTML, handlers e `actions/checkout` 7.0.1 | PR `#122`; commits `ea0871e…` e `20b4da1…` | ferramentas internas |
| **2 — experiência incremental** | concluída e publicada | Fuse.js, Floating UI e View Transitions | PR `#123`; commit `8e0a88e…`; deployment `dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp` | publicada |
| **3B — Supabase CLI** | concluída | CLI 2.110.0 e compatibilidade do backup/restauração | PR `#126`; commit `520b51e…` | não exigida |
| **4A — roadmap** | concluída | fonte canônica única e ADR-039 | PR `#127`; commit `a32e272…` | não exigida |
| **4B — Playwright** | validada no PR `#128` | Playwright 1.62.0 e navegadores correspondentes | SHA funcional `6c03169…`; sete workflows verdes | não exigida |

## 5. Roadmap técnico

| Item | Status | Prioridade | Implantação | Evidência/decisão | Próxima ação |
|---|---|---:|---|---|---|
| Corrigir referência inexistente no workflow do Excel SME | Concluído | P0 | Interna | Rodada 0 / PR `#121` | manter regressão |
| Verificador de referências locais dos workflows | Concluído | P0 | Interna | ADR-037 | manter nos gates |
| `actions/checkout` `7.0.0 → 7.0.1` | Concluído | P1 | Interna | commit `20b4da1…` | acompanhar Dependabot |
| ESLint `10.7.0 → 10.8.0` | Concluído | P1 | Interna | Rodada 1 | manter versão fixada |
| Relatório HTML navegável do ESLint | Concluído | P1 | Interna | `lint:security:html` | preservar mesmo escopo do lint bloqueante |
| Acorn `8.17.0 → 8.18.0` | Concluído | P1 | Interna | Rodada 1 | manter análise de handlers |
| Localização real de erros em handlers inline | Concluído | P1 | Interna | auditoria da Rodada 1 | manter contratos |
| Playwright `1.61.1 → 1.62.0` | Concluído | P1 | Interna | PR `#128`; SHA validado `6c03169…`; sete workflows | manter versão exata e matriz atual |
| Supabase CLI `2.109.1 → 2.110.0` | Concluído | P1 | Interna | Rodada 3B / PR `#126` | manter versão exata |
| Supabase CLI `2.111.0` | Adiado | P3 | Interna | ganho incremental insuficiente para nova rodada imediata | reavaliar em manutenção futura |
| Supabase JS `2.110.8` | Mantido/congelado | P2 | Vercel | versão atual | atualizar apenas com benefício e bateria completa |
| ExcelJS `4.4.0` | Mantido/congelado | P0 | Vercel | homologado no Excel desktop | não trocar sem necessidade comprovada |
| Verificar configuração padrão do CodeQL | Pendente de execução | P1 | Interna | ausência de workflow não comprova desativação | consultar Advanced Security e registrar estado real |
| Dependency Review Action | Pendente de execução | P1 | Interna | recomendação técnica | adicionar gate de vulnerabilidade e licença |
| `actionlint` | Pendente de execução | P1 | Interna | complementa o verificador próprio | validar YAML e expressões de Actions |
| `zizmor` | Pendente de avaliação | P2 | Interna | candidato de segurança de CI | executar baseline informativo |
| `eslint-plugin-n` | Pendente de avaliação | P2 | Interna | aplicável aos arquivos Node | medir ganho e escopo |
| Cobertura consolidada de testes | Pendente de execução | P2 | Interna | suíte ampla sem baseline único | começar como evidência, sem percentual artificial |
| CodeQL avançado customizado | Pendente de avaliação | P3 | Interna | depende da verificação padrão | adotar apenas se consultas padrão forem insuficientes |
| Renovate | Não aplicável agora | P3 | Nenhuma | duplicaria Dependabot | não instalar |
| `npm-check-updates` | Não aplicável agora | P3 | Nenhuma | Dependabot e `npm outdated` cobrem a necessidade | não instalar |
| Jest ou Vitest | Não aplicável agora | P3 | Nenhuma | `node:test` já integrado | não migrar sem problema concreto |
| Bundler geral por substituição imediata | Não aplicável agora | P3 | Nenhuma | mudança estrutural ampla | modernizar esbuild incrementalmente |
| `typescript-eslint` amplo | Não aplicável agora | P3 | Nenhuma | pouco TypeScript autoral | reavaliar se o código TS crescer |
| Novo motor de Excel | Não aplicável agora | P0 | Nenhuma | risco alto sobre funcionalidade homologada | preservar ExcelJS |
| Sentry ou telemetria externa | Pendente de avaliação | P3 | Vercel + governança | exige decisão de LGPD e operação | criar frente própria somente com necessidade |
| Troca do `http-server` | Não aplicável agora | P3 | Nenhuma | ferramenta local sem risco relevante | manter |

## 6. Modernização da experiência

| Frente | Status | Prioridade | Implantação | Próxima decisão |
|---|---|---:|---|---|
| Sistema de componentes com Lit/Web Components | Pendente de avaliação | P2 | Vercel | avaliar piloto em superfície complexa |
| Diálogos, mensagens, confirmações e estados comuns | Pendente de avaliação | P1 | Vercel | diagnosticar inconsistências e escolher abordagem |
| Data grid com Tabulator | Adiado | P2 | Vercel | reavaliar somente com caso operacional concreto |
| TanStack Table Core | Pendente de avaliação | P3 | Vercel | comparar se data grid voltar a ser priorizado |
| Busca inteligente com Fuse.js | Concluído e publicado | P1 | Vercel | manter e medir uso |
| Central de comandos `Ctrl + K` | Adiado | P2 | Vercel | reavaliar após observar a busca atual |
| Ajuda contextual com Driver.js | Pendente de avaliação | P1 | Vercel | escolher uma jornada crítica para piloto |
| Gráficos com Apache ECharts | Pendente de avaliação | P2 | Vercel | aprovar somente gráficos acionáveis e acessíveis |
| Floating UI | Concluído e publicado | P1 | Vercel | expandir somente com necessidade comprovada |
| Supabase Realtime para mudanças | Pendente de avaliação | P2 | Vercel + Supabase | começar por aviso de dado desatualizado |
| Presença e colaboração em tempo real | Pendente de avaliação | P3 | Vercel + Supabase | depende de governança e valor comprovado |
| PWA com Workbox | Pendente de avaliação | P2 | Vercel | diagnosticar conectividade antes do service worker |
| Dexie/IndexedDB para rascunhos | Pendente de avaliação | P2 | Vercel | priorizar recuperação de rascunho, não mutação offline |
| Sincronização offline de mutações | Não aplicável agora | P3 | Vercel + Supabase | não implementar sem concorrência e reconciliação |
| View Transition API | Concluído e publicado | P1 | Vercel | manter uso restrito e acessível |
| Modularização ampla com esbuild | Parcialmente concluído | P2 | Vercel | mapear entradas e ganhos antes de ampliar |
| Migração integral para framework | Não aplicável agora | P3 | Vercel | custo e risco superam o ganho imediato |

## 7. Novas capacidades do produto

| Capacidade | Status | Prioridade | Implantação | Dependência/critério |
|---|---|---:|---|---|
| Visualizações salvas | Pendente de avaliação | P1 | Vercel ou Vercel + Supabase | definir preferência local ou institucional |
| Ações em lote | Pendente de avaliação | P2 | Vercel + Supabase | autorização, atomicidade e auditoria |
| Central de notificações e tarefas | Pendente de avaliação | P2 | Vercel + Supabase | distinguir alerta de tarefa |
| Favoritos e escolas recentes | Pendente de avaliação | P2 | Vercel ou Vercel + Supabase | definir privacidade e persistência |
| Painel “Minha jornada hoje” | Pendente de avaliação | P2 | Vercel | depende de prazos e responsabilidades confiáveis |
| Histórico antes/depois | Parcialmente concluído | P2 | Vercel + Supabase | timeline existe; diff estruturado pendente |
| Comentários e menções | Pendente de avaliação | P3 | Vercel + Supabase | governança, notificação e retenção |
| Indicadores de prazo e risco | Pendente de avaliação | P1 | Vercel | regras objetivas e explicáveis |
| Atalhos globais | Parcialmente concluído | P2 | Vercel | mapear ações seguras e conflitos |
| Exportações personalizáveis | Pendente de avaliação | P2 | Vercel | preservar relatórios institucionais canônicos |
| Painéis configuráveis por perfil | Pendente de avaliação | P3 | Vercel + Supabase | modelo de preferências e limites editoriais |
| Anexos com Supabase Storage | Pendente de avaliação | P3 | Vercel + Supabase | LGPD, retenção, antivírus e limites |
| Assistência contextual de regras do PDDE | Pendente de avaliação | P1 | Vercel | regras determinísticas, fonte e explicabilidade |
| Resumo automático da situação | Pendente de avaliação | P2 | Vercel | derivar de dados canônicos e apontar fontes |
| Detecção de inconsistências | Pendente de avaliação | P1 | Vercel | regras objetivas e testáveis |
| Modo gerencial SME/CRE | Pendente de avaliação | P2 | Vercel | preservar recortes de visibilidade |

## 8. Regra permanente de oportunidade tecnológica

Toda tarefa deve avaliar se o resultado fica materialmente melhor com atualização, instalação ou capacidade moderna.

### Quando propor

- solução atual paliativa ou limitada pela tecnologia;
- componente especializado maduro melhora acessibilidade, segurança, desempenho, consistência ou manutenção;
- queixa recorrente indica problema estrutural;
- recurso solicitado pode ser mais robusto com ampliação tecnológica;
- insistir na pilha atual reduz a qualidade final.

### Conteúdo mínimo

1. limite observado;
2. tecnologia e versão sugeridas;
3. ganho concreto;
4. alternativa sem nova dependência;
5. custo e risco;
6. impacto em bundle, dados, permissões e Production;
7. testes, rollback e evidências.

Propor não significa instalar. Não ampliar escopo silenciosamente nem adotar pacote apenas por novidade.

## 9. Sequência posterior à Rodada 4B

| Ordem | Frente | Estado de decisão |
|---:|---|---|
| **5** | verificar CodeQL, adicionar Dependency Review e `actionlint`; avaliar `zizmor` | próxima frente técnica recomendada |
| **6** | baseline de cobertura | iniciar como evidência, sem limite global arbitrário |
| **7** | escolher a próxima evolução funcional por benefício | comparar candidatos antes de instalar ou implementar |

A ordem não impede correção urgente. A ADR-039 continua aplicável em todas as tarefas.

## 10. Critérios para aprovar item pendente

- problema real e usuários afetados;
- benefício perceptível e operacional;
- compatibilidade arquitetural;
- acessibilidade e equivalência mobile;
- impacto em segurança, LGPD, autoria e auditoria;
- custo de bundle, desempenho e manutenção;
- alternativa sem nova dependência;
- testes e rollback;
- necessidade de Vercel, Supabase ou ambas;
- critério objetivo de sucesso.

## 11. Manutenção

Atualizar este documento quando uma rodada mudar de estado, surgir oportunidade tecnológica material, um candidato for aprovado ou rejeitado, ou mudar a necessidade de Production. Planos históricos permanecem preservados.
