# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 5 de agosto de 2026  
**Classe documental:** Canônico

## 1. Finalidade

O roadmap organiza:

1. confiabilidade funcional ponta a ponta;
2. saúde operacional e integridade;
3. manutenção técnica;
4. evolução do produto.

Integração, aplicação no Supabase, publicação na Vercel e comprovação funcional são estados distintos.

## 2. Baseline

```text
main: 2ae98da8a547d46cd7e8e64977b855b1a90a2495
Vercel Production: dpl_BvrxJUahgWpaRbtn6Y5FrfzknKAw — READY
commit público: 2ae98da8a547d46cd7e8e64977b855b1a90a2495
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 26
última migration: 202608040001_production_integrity_monitor
Edge Function team-account-management: versão 103 — ACTIVE — JWT obrigatório
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
```

A `main`, a Vercel Production e a Edge Function estão alinhadas ao PR nº 150. A issue nº 149 foi encerrada. O hotfix não alterou migrations, RLS, grants ou dados reais.

## 3. Cronologia recente

| PR | Estado | Resultado |
|---:|---|---|
| 136 | concluído e publicado | runtime e assets do Excel SME |
| 137 | concluído e publicado | Excel SME de 27 colunas |
| 138 | concluído e publicado | Gestão de Equipe, CORS e vínculos do mesmo perfil |
| 139 | concluído e publicado | monitor geral de Production |
| 140 | concluído e publicado | incidentes automáticos |
| 142 | concluído e publicado | reconciliação documental integral |
| 141 | concluído e aplicado | auditoria de vinte invariantes de integridade |
| 145 | concluído | matriz funcional executável de 41 operações |
| 146 | concluído e publicado | Supabase JS 2.110.9 |
| 147 | concluído | correção de inicialização do workflow principal |
| 150 | concluído e publicado | transição Inventário → Controlador com conta Auth existente |
| 148 | em rascunho | smoke autenticado de leitura preparado, ainda desativado |

## 4. Confiabilidade funcional

| Item | Estado | Prioridade | Próxima ação |
|---|---|---:|---|
| Excel SME | comprovado e publicado | P0 | manter regressões e smoke |
| Gestão de Equipe — operações no mesmo perfil | comprovada e publicada | P0 | manter preflight e regressões |
| Gestão de Equipe — transição entre perfis | corrigida e publicada | P0 | repetir operação administrativa quando necessário e observar logs |
| Matriz funcional executável | integrada | P0 | usar lacunas para ordenar as próximas provas |
| Smoke autenticado de leitura | preparado, não integrado e desativado | P0 | reconciliar PR nº 148 com a `main` e integrar sem ativação |
| Identidades técnicas do smoke | não provisionadas | P0 | exigir autorização específica antes de criar contas e segredo |
| Escrita controlada e reversível | pendente | P0 | cobrir 23 operações após `ASSET-02` |
| UAT com servidores reais | pendente | P1 | executar após os gates técnicos |

### Resultado da matriz

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 29 |
| Lacuna técnica | 1 |
| Decisão funcional pendente | 2 |
| **Total** | **41** |

### Próximas provas

| Próxima prova | Operações |
|---|---:|
| nenhuma nova prova imediata | 5 |
| smoke autenticado de leitura | 6 |
| escrita controlada e reversível | 23 |
| decisão funcional expressa | 2 |
| observação contínua em Production | 5 |

## 5. Incidente P0 nº 149

A causa raiz foi a tentativa de convidar novamente uma conta Auth existente após a desativação do perfil de Inventário. O PR nº 150 acrescentou:

- busca de conta por e-mail normalizado antes do convite;
- reutilização somente sem vínculo ativo conflitante;
- preservação de um único perfil ativo e do histórico inativo;
- compensação com restauração do bloqueio anterior;
- interpretação do payload de `FunctionsHttpError` pelo gateway;
- prova integral Inventário → Controlador → redistribuição → novo login.

A publicação está ativa na Vercel e na Edge Function versão 103. Nenhuma pessoa ou escola real foi alterada automaticamente.

## 6. Achados derivados

### `ASSET-02` — P0

A edição genérica de bem usa persistência padrão, sem o RPC atômico, log e versão das demais mutações patrimoniais.

**Próxima ação:** auditoria e correção em PR próprio antes do ensaio de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

A manutenção de programas pela Gestão SME existe tecnicamente, mas a autoridade funcional precisa ser confirmada.

**Próxima ação:** decisão expressa antes de alterar frontend, serviço ou RLS.

## 7. Garantia operacional

| Item | Estado | Prioridade |
|---|---|---:|
| monitor geral de Production | concluído e publicado | P0 |
| incidentes automáticos | concluído e publicado | P0 |
| preflight das Edge Functions | concluído e publicado | P0 |
| bloqueio anônimo | concluído e publicado | P0 |
| auditoria de vinte invariantes | concluída e aplicada | P0 |
| backup/restauração descartáveis | concluído | P0 |
| smoke autenticado de cinco perfis | preparado, desativado | P0 |
| política institucional de retenção/DR | pendente de decisão | P2 |

## 8. Supabase e integração

| Item | Estado | Próxima ação |
|---|---|---|
| 26 migrations alinhadas | concluído | manter histórico e dry-run |
| Auth, perfis e escopos | parcialmente comprovado | ativar smoke autenticado após provisionamento autorizado |
| RLS positiva e negativa | parcialmente comprovada | ligar aos IDs da matriz |
| RPCs compostas | parcialmente comprovadas | provar escrita, releitura e falha |
| Edge Function de equipe | versão 103 publicada | manter CORS, JWT, reutilização segura e compensação |
| integridade lógica agregada | concluída | observar execução recorrente |
| programas SME | decisão pendente | resolver `CFG-03` e `CFG-04` |

## 9. Manutenção técnica

Versões correntes:

```text
Playwright 1.62.0
eslint-plugin-playwright 2.10.5
Knip 6.29.0
Supabase JS 2.110.9
Supabase CLI 2.110.0
ExcelJS 4.4.0
Node.js 24.x
```

Atualizações permanecem em PRs isolados e não devem ser misturadas às provas funcionais prioritárias. ExcelJS continua congelado até necessidade comprovada e nova homologação desktop.

PRs automáticos abertos de dependências não fazem parte da sequência funcional até análise e autorização específicas.

## 10. Evolução do produto

Busca inteligente, Floating UI e View Transitions estão publicadas. Diálogos comuns, ajuda contextual, gráficos, modularização e novas capacidades permanecem posteriores à confiabilidade e ao UAT. PWA/offline e migração integral de framework não são prioridades atuais.

## 11. Sequência

```text
1. reconciliação documental pós-PR 150             em conclusão
2. reconciliar e integrar PR 148 desativado
3. autorizar e provisionar contas técnicas do smoke
4. aprovar execução manual e execução agendada
5. corrigir ASSET-02
6. executar escrita controlada e reversível
7. decidir autoridade sobre programas SME
8. avaliar atualizações menores isoladas
9. UAT e correções
10. polimento editorial/visual
11. decisão formal de liberação
```

## 12. Critério para nova frente

- problema e usuários afetados;
- ID ou lacuna na matriz;
- regra de negócio confirmada;
- perfis permitidos e negados;
- percurso frontend–backend;
- persistência e releitura;
- erro, conflito e rollback;
- evidência no mesmo SHA;
- autorização separada para merge e Production.
