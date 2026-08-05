# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 5 de agosto de 2026  
**Classe documental:** Canônico  
**Controla:** confiabilidade funcional, saúde operacional, manutenção e evolução do produto

## 1. Finalidade

O roadmap organiza quatro frentes:

1. **confiabilidade funcional:** provar a atividade completa do usuário até o backend e a releitura;
2. **saúde operacional:** Production, integridade, incidentes, backup e recuperação;
3. **manutenção técnica:** dependências, CI, qualidade e ferramentas;
4. **evolução do produto:** experiência, produtividade e novas capacidades.

`docs/CURRENT_STAGE.md` controla a etapa corrente. Implementação, integração, publicação e comprovação são estados diferentes.

## 2. Baseline

```text
main: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
commit publicado: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 25
Edge Function team-account-management: versão 95, ACTIVE, JWT obrigatório
```

O PR nº 141 permanece aberto em rascunho e independente.

## 3. Taxonomia

| Status | Significado |
|---|---|
| **Concluído** | integrado e validado; não exige publicação do site |
| **Concluído e publicado** | integrado, validado e presente em Production |
| **Em andamento** | branch ou PR ativo, ainda não integrado |
| **Parcialmente concluído** | parte comprovada; lacunas explícitas |
| **Pendente de execução** | implementação não iniciada |
| **Pendente de decisão** | depende de regra funcional expressa |
| **Adiado** | postergado conscientemente |
| **Mantido/congelado** | versão ou arquitetura preservada |
| **Não aplicável agora** | adoção não recomendada no estágio atual |

Prioridades:

- **P0:** falha ou risco capaz de desamparar a operação;
- **P1:** próxima frente necessária para confiança;
- **P2:** manutenção ou melhoria relevante;
- **P3:** evolução condicional.

## 4. Cronologia recente

| PR/Rodada | Estado | Resultado |
|---|---|---|
| PR nº 121 | concluído | integridade de referências dos workflows |
| PR nº 122 | concluído | ESLint 10.8.0, Acorn 8.18.0 e auditoria |
| PR nº 123 | concluído e publicado | busca, Floating UI e View Transitions |
| PR nº 126 | concluído | Supabase CLI 2.110.0 e recuperação |
| PR nº 127 | concluído | evolução tecnológica proativa |
| PR nº 128 | concluído | Playwright 1.62.0 |
| PR nº 136 | concluído e publicado | runtime e assets do Excel SME |
| PR nº 137 | concluído e publicado | Excel SME de 27 colunas |
| PR nº 138 | concluído e publicado | Gestão de Equipe, CORS e Auth |
| PR nº 139 | concluído e publicado | monitor geral de Production |
| PR nº 140 | concluído e publicado | incidentes automáticos |
| PR nº 141 | em andamento | auditoria agregada de integridade dos dados |
| PR nº 142 | concluído e publicado | reconciliação documental integral |
| Matriz funcional | em andamento | contrato executável de 40 operações |

## 5. Frente P0/P1 — confiabilidade funcional

### Matriz canônica

A branch corrente mapeia 40 operações em 13 superfícies:

| Cobertura | Quantidade |
|---|---:|
| Comprovada | 8 |
| Parcial | 29 |
| Lacuna técnica | 1 |
| Decisão funcional pendente | 2 |

| Item | Status | Prioridade | Próxima ação |
|---|---|---:|---|
| Matriz perfil × superfície × ação × backend | Em andamento | P0 | concluir PR e integrar somente com autorização |
| Verificador da matriz no readiness | Em andamento | P0 | validar referências, evidências e Markdown gerado |
| Smoke autenticado de leitura por perfil | Pendente de execução | P0 | cobrir seis operações classificadas |
| Provas controladas de escrita e releitura | Pendente de execução | P0 | cobrir 23 operações classificadas |
| Conflitos e compensação | Parcialmente concluído | P0 | transformar contratos em provas por jornada |
| Observação contínua de funções já comprovadas | Parcialmente concluído | P1 | manter cinco operações sob monitoramento |
| UAT com servidores reais | Pendente de execução | P1 | executar após leitura e escrita controladas |

### Lacuna técnica derivada

| ID | Problema | Conduta |
|---|---|---|
| `ASSET-02` | edição genérica de bem usa persistência padrão, sem o mesmo RPC atômico com log e versão das demais mutações patrimoniais | auditar e corrigir em PR próprio antes de prova de escrita |

### Decisões funcionais derivadas

| IDs | Tema | Conduta |
|---|---|---|
| `CFG-03`, `CFG-04` | autoridade da Gestão SME para cadastrar, editar e desativar programas | confirmar regra de produto antes de alterar frontend ou RLS |

## 6. Frente P1 — garantia operacional

| Item | Status | Prioridade | Próxima ação |
|---|---|---:|---|
| Monitor geral de Production | Concluído e publicado | P0 | manter execução horária |
| Incidentes automáticos | Concluído e publicado | P0 | observar ocorrências reais |
| Preflight das Edge Functions | Concluído e publicado | P0 | catalogar nova função automaticamente |
| Bloqueio anônimo | Concluído e publicado | P0 | manter prova contínua |
| Backup/restauração descartáveis | Concluído | P0 | manter equivalência integral |
| Auditoria de integridade dos dados | Em andamento no PR nº 141 | P1 | revisar como frente independente |
| Política institucional de retenção/DR | Pendente de decisão | P2 | separar do ensaio descartável |

## 7. Frente P1/P2 — Supabase e integração

| Item | Status | Prioridade | Próxima ação |
|---|---|---:|---|
| 25 migrations alinhadas | Concluído | P0 | manter histórico e dry-run |
| Auth, perfis e escopos | Parcialmente comprovado | P0 | smoke autenticado em Production |
| RLS positiva e negativa | Parcialmente comprovada | P0 | ligar aos IDs da matriz |
| RPCs compostas | Parcialmente comprovadas | P0 | provar escrita, releitura e falha |
| Edge Function de equipe | Concluída e publicada | P0 | manter CORS, JWT e compensação |
| Correspondência frontend ↔ backend | Mapeada na matriz | P0 | bloquear divergência pelo readiness |
| Integridade lógica dos dados | Em andamento no PR nº 141 | P1 | manter branch independente |
| Programas da Gestão SME | Pendente de decisão | P1 | resolver `CFG-03` e `CFG-04` |
| Escrita colaborativa do Controlador na CRE | Pendente de confirmação institucional | P1 | não alterar RLS sem decisão |

## 8. Frente P2 — manutenção técnica

Versões correntes:

```text
Playwright 1.62.0
eslint-plugin-playwright 2.10.5
Knip 6.29.0
Supabase JS 2.110.8
Supabase CLI 2.110.0
ExcelJS 4.4.0
```

| Atualização | Status | Prioridade | Regra |
|---|---|---:|---|
| Playwright 1.62.1 | Pendente | P2 | PR isolado e matriz completa |
| eslint-plugin-playwright 2.11.0 | Pendente | P2 | revisar regras e falsos positivos |
| Knip 6.30.0 | Pendente | P2 | validar inventário |
| Supabase JS 2.111.0 | Pendente de avaliação | P2 | repetir Auth, RLS e bootstrap |
| Supabase CLI 2.111.0 | Pendente de avaliação | P2 | repetir migrations, funções e backup |
| ExcelJS | Mantido/congelado | P0 | nova homologação desktop se alterado |
| Dependency Review Action | Pendente | P2 | gate de vulnerabilidade/licença |
| `actionlint` | Pendente | P2 | complementar verificador próprio |
| CodeQL | Pendente de confirmação | P3 | verificar configuração disponível |
| baseline de cobertura | Pendente | P2 | começar informativo |

Não misturar atualização de dependência com correção funcional.

## 9. Experiência e evolução

| Frente | Estado | Prioridade | Decisão |
|---|---|---:|---|
| Busca inteligente | Concluída e publicada | P1 | manter |
| Floating UI | Concluída e publicada | P1 | expandir apenas quando necessário |
| View Transitions | Concluída e publicada | P2 | manter progressiva e acessível |
| Sistema comum de diálogos | Pendente de avaliação | P2 | depois da confiabilidade |
| Ajuda contextual | Pendente de avaliação | P2 | piloto após UAT |
| Gráficos acionáveis | Pendente de avaliação | P3 | somente com pergunta gerencial |
| PWA/offline | Não aplicável agora | P3 | não introduzir mutações offline |
| Migração integral de framework | Não aplicável agora | P3 | custo superior ao ganho atual |
| Modularização incremental de `app.js` | Pendente de planejamento | P2 | extrair por superfície |

Evoluções funcionais futuras permanecem condicionadas à confiabilidade e ao UAT.

## 10. Sequência recomendada

```text
1. integrar documentação reconciliada                         concluído
2. criar e validar matriz funcional                           em andamento
3. smoke autenticado de leitura                               próximo
4. corrigir ASSET-02 e executar escrita controlada
5. decidir programas da Gestão SME
6. concluir ou reavaliar PR #141
7. atualizações menores isoladas
8. UAT e correções
9. polimento editorial/visual
10. decisão formal de liberação
```

Correção urgente pode interromper a ordem, mas deve atualizar matriz, roadmap e estágio.

## 11. Critério para nova frente

- problema e usuários afetados;
- benefício operacional;
- ID ou lacuna na matriz;
- regra de negócio confirmada;
- perfil autorizado e negado;
- percurso frontend–backend;
- persistência e releitura;
- erro, conflito e rollback;
- desktop/mobile quando aplicável;
- evidência no mesmo SHA;
- autorização separada para merge e Production.
