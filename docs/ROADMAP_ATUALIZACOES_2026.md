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
main: 1444b8df5aa11168e063ec55db635d5a2091214d
Vercel Production: dpl_6ciDyuemHM6uzZ53EVndnyuKaDKr — READY
commit público: 1444b8df5aa11168e063ec55db635d5a2091214d
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 26
última migration: 202608040001_production_integrity_monitor
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
```

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
| 145 | concluído e publicado | matriz funcional executável de 41 operações |
| 146 | concluído e publicado | Supabase JS 2.110.9 |
| smoke autenticado | em andamento | leituras reais protegidas por cinco perfis |

## 4. Confiabilidade funcional

| Item | Estado | Prioridade | Próxima ação |
|---|---|---:|---|
| Excel SME | comprovado e publicado | P0 | manter regressões e smoke |
| Gestão de Equipe | comprovada e publicada | P0 | manter preflight e observação |
| Matriz funcional executável | concluída e publicada | P0 | manter no readiness |
| Smoke autenticado de leitura | implementação em andamento | P0 | concluir PR e provisionar contas técnicas mediante autorização |
| Escrita controlada e reversível | pendente | P0 | corrigir `ASSET-02` e cobrir 23 operações |
| UAT com servidores reais | pendente | P1 | executar após os gates técnicos |

### Resultado vigente da matriz

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

As seis leituras somente mudarão para cobertura comprovada após uma execução manual e outra agendada com identidades técnicas dedicadas.

## 5. Smoke autenticado de leitura

### Escopo

- `AUTH-01` — autenticação e restauração da sessão;
- `NAV-02` — busca limitada ao recorte autorizado;
- `READ-01` — Dashboard;
- `READ-02` — Carteira ou negativa correta para Inventário;
- `READ-03` — Prontuário e timeline;
- `READ-04` — Pendências.

### Estado

| Componente | Estado |
|---|---|
| suíte Playwright remota | implementada na branch |
| detecção de requisições mutantes | implementada |
| sanitização de erros | implementada |
| workflow manual/agendado | implementado, protegido por variável |
| validação contratual em PR | implementada |
| contas técnicas dedicadas | não provisionadas |
| segredo protegido | não configurado |
| execução real em Production | não realizada |

Nenhuma conta pessoal será reutilizada. A criação das cinco identidades técnicas é uma operação controlada e exige autorização separada.

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
| smoke autenticado por perfil | em implementação | P0 |
| política institucional de retenção/DR | pendente de decisão | P2 |

## 8. Supabase e integração

| Item | Estado | Próxima ação |
|---|---|---|
| 26 migrations alinhadas | concluído | manter histórico e dry-run |
| Supabase JS 2.110.9 | concluído e publicado | manter regressões de Auth/RLS |
| Auth, perfis e escopos | parcialmente comprovado | executar smoke autenticado |
| RLS positiva e negativa | parcialmente comprovada | ligar resultados aos IDs da matriz |
| RPCs compostas | parcialmente comprovadas | provar escrita, releitura e falha |
| Edge Function de equipe | concluída | manter CORS, JWT e compensação |
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
```

Atualizações permanecem em PRs isolados. ExcelJS continua congelado até necessidade comprovada e nova homologação desktop.

## 10. Evolução do produto

Busca inteligente, Floating UI e View Transitions estão publicadas. Diálogos comuns, ajuda contextual, gráficos, modularização e novas capacidades permanecem posteriores à confiabilidade e ao UAT. PWA/offline e migração integral de framework não são prioridades atuais.

## 11. Sequência

```text
1. reconciliação documental                         concluída
2. integridade contínua dos dados                  concluída
3. matriz funcional executável                     concluída
4. Supabase JS 2.110.9                             concluído
5. implementar smoke autenticado de leitura        em andamento
6. provisionar contas e executar duas provas       depende de autorização
7. corrigir ASSET-02 e provar escritas
8. decidir programas SME
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
