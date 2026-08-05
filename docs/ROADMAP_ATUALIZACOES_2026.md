# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 5 de agosto de 2026  
**Classe documental:** Canônico  
**Controla:** confiabilidade funcional, manutenção técnica, modernização e evolução do produto

## 1. Finalidade

Este documento organiza quatro frentes independentes e ordenadas:

1. **confiabilidade funcional:** provar que cada ação visível conclui o fluxo no backend e permanece correta após releitura;
2. **saúde operacional:** monitorar Production, integridade dos dados, incidentes, backup e recuperação;
3. **manutenção técnica:** dependências, CI, testes, qualidade e ferramentas;
4. **evolução do produto:** melhorias de experiência, produtividade e capacidade.

`docs/CURRENT_STAGE.md` controla a etapa corrente. Integração à `main` não equivale automaticamente a presença em Production, e presença em Production não prova todas as jornadas funcionais.

## 2. Baseline

```text
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4 — READY
commit publicado: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 25
Edge Function team-account-management: versão 95, ACTIVE, JWT obrigatório
```

O PR nº 141 está aberto em rascunho e não integra esse baseline.

## 3. Taxonomia

| Status | Significado |
|---|---|
| **Concluído** | integrado e validado; não exige publicação do site |
| **Concluído e publicado** | integrado, validado e presente em Production |
| **Em andamento** | branch ou PR ativo, ainda não integrado |
| **Parcialmente concluído** | parte entregue; restante explicitado |
| **Pendente de execução** | pertinência reconhecida; implementação não iniciada |
| **Pendente de avaliação** | candidato sujeito a diagnóstico e decisão |
| **Adiado** | postergado conscientemente |
| **Mantido/congelado** | versão ou arquitetura preservada deliberadamente |
| **Não aplicável agora** | adoção não recomendada no estágio atual |

Prioridades:

- **P0:** falha funcional, integridade ou disponibilidade capaz de desamparar o usuário;
- **P1:** próxima frente necessária para confiança operacional;
- **P2:** manutenção ou melhoria relevante;
- **P3:** evolução condicional ou de menor urgência.

## 4. Cronologia reconciliada

| PR/Rodada | Estado | Resultado |
|---|---|---|
| Rodada 0 / PR nº 121 | concluída | integridade de referências dos workflows |
| Rodada 1 / PR nº 122 | concluída | ESLint 10.8.0, Acorn 8.18.0 e melhorias de auditoria |
| Rodada 2 / PR nº 123 | concluída e publicada | busca inteligente, Floating UI e View Transitions |
| Rodada 3B / PR nº 126 | concluída | Supabase CLI 2.110.0 e adaptação do backup/restauração |
| Rodada 4A / PR nº 127 | concluída | roadmap e evolução tecnológica proativa |
| Rodada 4B / PR nº 128 | concluída | Playwright 1.62.0 |
| PR nº 136 | concluído e publicado | runtime do Excel SME e relatórios no dashboard da Assistente |
| PR nº 137 | concluído e publicado | Excel SME de 27 colunas e alinhamento final |
| PR nº 138 | concluído e publicado | Gestão de Equipe, CORS, Auth e vínculos históricos |
| PR nº 139 | concluído e publicado | monitor geral de Production |
| PR nº 140 | concluído e publicado | incidentes automáticos |
| PR nº 141 | em andamento | auditoria agregada de integridade dos dados |
| Reconciliação documental de 5/8 | em andamento | baseline e documentação canônica |

## 5. Frente P0/P1 — confiabilidade funcional

| Item | Status | Prioridade | Evidência atual | Próxima ação |
|---|---|---:|---|---|
| Excel SME gerar e baixar arquivo válido | Concluído e publicado | P0 | PRs nº 136 e 137; Excel desktop; smoke e OOXML | manter monitor e regressões |
| Gestão de Equipe alcançar Edge Function e concluir operação | Concluído e publicado | P0 | PR nº 138; Auth/RLS/CORS reais | manter smoke e ciclo integral |
| Matriz completa perfil × tela × ação × backend | Pendente de execução | P0 | cobertura dispersa | criar catálogo canônico e gaps |
| Smoke autenticado de leitura por perfil em Production | Pendente de execução | P1 | gate atual usa Supabase descartável | criar contas técnicas e prova não destrutiva |
| Provas controladas de escrita e releitura | Pendente de execução | P0 | Gestão de Equipe possui cobertura específica | generalizar para todas as mutações críticas |
| Provas de falha parcial e compensação | Parcialmente concluído | P0 | equipe, importação e operações compostas possuem contratos | mapear todos os fluxos compostos |
| Persistência após recarregar | Parcialmente concluído | P0 | coberta em fluxos específicos | tornar requisito padrão de E2E |
| Mensagens úteis para indisponibilidade de backend | Parcialmente concluído | P1 | Excel e Gestão de Equipe possuem erros tipados | revisar outras ações críticas |
| Conflito de `row_version` por fluxo | Parcialmente concluído | P1 | suporte arquitetural existente | provar interface e recuperação por módulo |
| UAT com servidores reais | Pendente de execução | P1 | automação não substitui uso real | executar após matriz funcional |

## 6. Frente P1 — garantia operacional

| Item | Status | Prioridade | Implantação | Próxima ação |
|---|---|---:|---|---|
| Monitor geral de Production | Concluído e publicado | P0 | GitHub Actions + Vercel + Supabase | manter execução horária |
| Incidentes automáticos | Concluído e publicado | P0 | GitHub Issues | validar comportamento em ocorrência real |
| Preflight remoto das Edge Functions | Concluído e publicado | P0 | Supabase | catalogar qualquer nova função automaticamente |
| Bloqueio anônimo do Supabase | Concluído e publicado | P0 | Supabase RLS | manter prova contínua |
| Auditoria contínua de integridade dos dados | Em andamento no PR nº 141 | P1 | Supabase + GitHub Actions | revisar, integrar e aplicar somente com autorização |
| Painel/resumo de saúde operacional | Pendente de avaliação | P2 | GitHub ou interface técnica | primeiro estabilizar monitores e códigos |
| Runbook de incidente funcional | Pendente de atualização | P1 | documentação | ligar monitor, diagnóstico e rollback |
| Backup/restauração descartáveis | Concluído | P0 | CI | manter equivalência de schema, dados, Auth e migrations |
| Política institucional de retenção/DR | Pendente de decisão | P2 | Supabase e governança | separar do teste descartável |

## 7. Frente P1/P2 — Supabase e integração

| Item | Status | Prioridade | Próxima ação |
|---|---|---:|---|
| 25 migrations alinhadas | Concluído | P0 | manter teste de histórico e dry-run |
| Auth, perfis e escopos | Concluído, com verificação contínua parcial | P0 | incluir no smoke autenticado |
| RLS positiva e negativa por entidade | Parcialmente concluído | P0 | gerar matriz executável por operação |
| RPCs compostas | Parcialmente concluído | P0 | mapear consumidor frontend e prova de atomicidade |
| Edge Function de equipe | Concluído e publicado | P0 | manter versão, CORS, JWT e compensação |
| Correspondência frontend ↔ tabela/RPC/função | Pendente de consolidação | P0 | criar catálogo de integração |
| Integridade lógica dos dados | Em andamento no PR nº 141 | P1 | revisar invariantes e execução remota |
| Configurações da Gestão SME | Pendente de confirmação funcional | P1 | decidir exercício, calendário e programas |
| Escopo de escrita do Controlador na CRE | Pendente de confirmação funcional | P1 | validar regra institucional antes de alterar RLS |

## 8. Frente P2 — manutenção técnica e dependências

Versões correntes:

```text
Playwright 1.62.0
eslint-plugin-playwright 2.10.5
Knip 6.29.0
Supabase JS 2.110.8
Supabase CLI 2.110.0
ExcelJS 4.4.0
```

| Atualização | Status | Prioridade | Regra de execução |
|---|---|---:|---|
| Playwright 1.62.1 | Pendente de execução | P2 | PR isolado; repetir matriz completa |
| eslint-plugin-playwright 2.11.0 | Pendente de execução | P2 | revisar novas regras e falsos positivos |
| Knip 6.30.0 | Pendente de execução | P2 | validar inventário e referências |
| Supabase JS 2.111.0 | Pendente de avaliação | P2 | repetir sessão, Auth, RLS e bootstrap |
| Supabase CLI 2.111.0 | Pendente de avaliação | P2 | repetir reset, migrations, Edge Functions e backup |
| ExcelJS | Mantido/congelado | P0 | não alterar sem necessidade e nova homologação desktop |
| Dependency Review Action | Pendente de execução | P2 | gate de vulnerabilidade e licença |
| `actionlint` | Pendente de execução | P2 | complementar verificador próprio |
| CodeQL | Pendente de confirmação | P3 | verificar configuração disponível |
| baseline de cobertura | Pendente de execução | P2 | começar informativo, sem piso arbitrário |

Atualizações não devem ser agrupadas com correções funcionais.

## 9. Modernização da experiência

| Frente | Status | Prioridade | Decisão |
|---|---|---:|---|
| Busca inteligente | Concluída e publicada | P1 | manter |
| Floating UI | Concluída e publicada | P1 | expandir somente quando necessário |
| View Transitions | Concluída e publicada | P2 | manter progressiva e acessível |
| Sistema comum de diálogos e mensagens | Pendente de avaliação | P2 | revisar após confiabilidade funcional |
| Ajuda contextual | Pendente de avaliação | P2 | piloto em jornada crítica após UAT |
| Gráficos acionáveis | Pendente de avaliação | P3 | somente com pergunta gerencial clara |
| PWA/offline | Não aplicável agora | P3 | não introduzir mutações offline |
| Migração integral para framework | Não aplicável agora | P3 | custo superior ao ganho atual |
| Modularização incremental de `app.js` | Pendente de planejamento | P2 | extrair por superfície sem reescrita ampla |

## 10. Evolução funcional futura

Somente após confiabilidade e UAT:

- visualizações salvas;
- indicadores de prazo e risco;
- favoritos e escolas recentes;
- painel de jornada diária;
- histórico antes/depois;
- exportações personalizáveis;
- assistência contextual de regras;
- resumo automático explicável;
- modo gerencial ampliado.

Cada item exige regra de negócio, perfil, persistência, acessibilidade, teste e rollback próprios.

## 11. Sequência recomendada

```text
1. reconciliar documentação
2. criar matriz funcional ponta a ponta
3. smoke autenticado de leitura
4. provas controladas de escrita e compensação
5. concluir/reavaliar PR #141
6. executar atualizações menores isoladas
7. UAT e correções encontradas
8. polimento editorial/visual
9. decisão formal de liberação
```

Correção funcional urgente pode interromper a ordem, mas deve atualizar este roadmap e o estado corrente.

## 12. Critério para aprovar nova frente

- problema real e usuários afetados;
- benefício operacional claro;
- aderência ao domínio do PDDE;
- contrato ponta a ponta definido;
- permissões positivas e negativas;
- compatibilidade desktop/mobile;
- persistência e releitura;
- tratamento de falha e rollback;
- evidência do mesmo SHA;
- documentação atualizada;
- autorização separada para merge e Production.
