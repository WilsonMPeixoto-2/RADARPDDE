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
main: 30bdecc1116bbcd007448d21db57326b28d9a003
Vercel Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
commit público: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 26
última migration: 202608040001_production_integrity_monitor
```

O PR nº 141 foi integrado e aplicado no Supabase. Como não alterou o frontend, a Vercel permanece no artefato do PR nº 142.

## 3. Cronologia recente

| PR | Estado | Resultado |
|---:|---|---|
| 136 | concluído e publicado | runtime e assets do Excel SME |
| 137 | concluído e publicado | Excel SME de 27 colunas |
| 138 | concluído e publicado | Gestão de Equipe, CORS e Auth |
| 139 | concluído e publicado | monitor geral de Production |
| 140 | concluído e publicado | incidentes automáticos |
| 142 | concluído e publicado | reconciliação documental integral |
| 141 | concluído e aplicado | auditoria de vinte invariantes de integridade |
| matriz funcional | em andamento | contrato executável de 41 operações |

## 4. Confiabilidade funcional

| Item | Estado | Prioridade | Próxima ação |
|---|---|---:|---|
| Excel SME | comprovado e publicado | P0 | manter regressões e smoke |
| Gestão de Equipe | comprovada e publicada | P0 | manter preflight e observação |
| Matriz funcional executável | em andamento | P0 | concluir PR e integrar mediante autorização |
| Smoke autenticado de leitura | pendente | P0 | cobrir seis operações sem mutação |
| Escrita controlada e reversível | pendente | P0 | cobrir 23 operações |
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

## 5. Achados derivados

### `ASSET-02` — P0

A edição genérica de bem usa persistência padrão, sem o RPC atômico, log e versão das demais mutações patrimoniais.

**Próxima ação:** auditoria e correção em PR próprio antes do ensaio de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

A manutenção de programas pela Gestão SME existe tecnicamente, mas a autoridade funcional precisa ser confirmada.

**Próxima ação:** decisão expressa antes de alterar frontend, serviço ou RLS.

## 6. Garantia operacional

| Item | Estado | Prioridade |
|---|---|---:|
| monitor geral de Production | concluído e publicado | P0 |
| incidentes automáticos | concluído e publicado | P0 |
| preflight das Edge Functions | concluído e publicado | P0 |
| bloqueio anônimo | concluído e publicado | P0 |
| auditoria de vinte invariantes | concluída e aplicada | P0 |
| backup/restauração descartáveis | concluído | P0 |
| política institucional de retenção/DR | pendente de decisão | P2 |

## 7. Supabase e integração

| Item | Estado | Próxima ação |
|---|---|---|
| 26 migrations alinhadas | concluído | manter histórico e dry-run |
| Auth, perfis e escopos | parcialmente comprovado | smoke autenticado |
| RLS positiva e negativa | parcialmente comprovada | ligar aos IDs da matriz |
| RPCs compostas | parcialmente comprovadas | provar escrita, releitura e falha |
| Edge Function de equipe | concluída | manter CORS, JWT e compensação |
| integridade lógica agregada | concluída | observar execução recorrente |
| programas SME | decisão pendente | resolver `CFG-03` e `CFG-04` |

## 8. Manutenção técnica

Versões correntes:

```text
Playwright 1.62.0
eslint-plugin-playwright 2.10.5
Knip 6.29.0
Supabase JS 2.110.8
Supabase CLI 2.110.0
ExcelJS 4.4.0
```

Atualizações permanecem em PRs isolados e somente depois da matriz e dos gates funcionais prioritários. ExcelJS continua congelado até necessidade comprovada e nova homologação desktop.

## 9. Evolução do produto

Busca inteligente, Floating UI e View Transitions estão publicadas. Diálogos comuns, ajuda contextual, gráficos, modularização e novas capacidades permanecem posteriores à confiabilidade e ao UAT. PWA/offline e migração integral de framework não são prioridades atuais.

## 10. Sequência

```text
1. reconciliação documental                         concluída
2. integridade contínua dos dados                  concluída
3. matriz funcional executável                     em andamento
4. smoke autenticado de leitura
5. correção ASSET-02 e escrita controlada
6. decisão sobre programas SME
7. atualizações menores isoladas
8. UAT e correções
9. polimento editorial/visual
10. decisão formal de liberação
```

## 11. Critério para nova frente

- problema e usuários afetados;
- ID ou lacuna na matriz;
- regra de negócio confirmada;
- perfis permitidos e negados;
- percurso frontend–backend;
- persistência e releitura;
- erro, conflito e rollback;
- evidência no mesmo SHA;
- autorização separada para merge e Production.
