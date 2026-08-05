# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 5 de agosto de 2026  
**Classe documental:** Canônico

## 1. Finalidade

O roadmap organiza:

1. confiabilidade funcional ponta a ponta;
2. saúde operacional e integridade;
3. manutenção técnica;
4. evolução do produto.

Integração, aplicação no Supabase, publicação na Vercel, ativação operacional e comprovação funcional são estados distintos.

## 2. Baseline

```text
main: 8f2a267cceb00959c0e6eeee4d9b883c7212e17a
Vercel Production: dpl_GrBhxgRquJNcq9DG7cCn1JQ1oXnQ — READY
commit público: 8f2a267cceb00959c0e6eeee4d9b883c7212e17a
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 26
última migration: 202608040001_production_integrity_monitor
Edge Function team-account-management: versão 103 — ACTIVE — JWT obrigatório
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
```

## 3. Cronologia recente

| PR | Estado | Resultado |
|---:|---|---|
| 136 | concluído e publicado | runtime e assets do Excel SME |
| 137 | concluído e publicado | Excel SME de 27 colunas |
| 138 | concluído e publicado | Gestão de Equipe, CORS e vínculos do mesmo perfil |
| 139 | concluído e publicado | monitor geral de Production |
| 140 | concluído e publicado | incidentes automáticos |
| 141 | concluído e aplicado | auditoria de vinte invariantes de integridade |
| 142 | concluído | reconciliação documental integral |
| 145 | concluído | matriz funcional executável de 41 operações |
| 146 | concluído e publicado | Supabase JS 2.110.9 |
| 147 | concluído | correção do workflow principal |
| 150 | concluído e publicado | transição Inventário → Controlador |
| 151 | concluído | documentação pós-hotfix |
| 148 | concluído, desativado | infraestrutura do smoke autenticado de leitura |
| 153 | concluído | correção da corrida de deployment no monitor |

## 4. Confiabilidade funcional

| Item | Estado | Prioridade | Próxima ação |
|---|---|---:|---|
| Excel SME | comprovado e publicado | P0 | manter regressões e smoke |
| Gestão de Equipe — mesmo perfil | comprovada e publicada | P0 | manter preflight e regressões |
| Gestão de Equipe — transição entre perfis | corrigida e publicada | P0 | observar uso real e logs |
| Matriz funcional executável | integrada | P0 | usar lacunas para ordenar provas |
| Smoke autenticado de leitura | infraestrutura integrada, execução desativada | P0 | decidir provisionamento das contas técnicas |
| Identidades técnicas do smoke | não provisionadas | P0 | exigir autorização específica |
| Escrita controlada e reversível | pendente | P0 | cobrir 23 operações após `ASSET-02` |
| UAT com servidores reais | pendente | P1 | executar após gates técnicos |

### Resultado da matriz

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 29 |
| Lacuna técnica | 1 |
| Decisão funcional pendente | 2 |
| **Total** | **41** |

A integração do workflow não promoveu as seis operações de leitura, pois não houve execução autenticada real em Production.

## 5. Smoke autenticado de leitura

O PR nº 148 integrou:

- workflow agendado e manual;
- configuração Playwright exclusiva;
- barreira de rede contra mutações;
- validação dos cinco perfis;
- contratos unitários e documentação técnica.

Estado atual:

```text
workflow versionado: sim
execução remota habilitada: não
contas técnicas: não criadas
segredo protegido: não criado
variável de ativação: não habilitada
execução manual real: não realizada
execução agendada real: não realizada
```

A ativação depende de autorização específica e não deve reutilizar contas pessoais ou funcionais existentes.

## 6. Incidentes recentes

### Issue nº 149 — transição de perfil

Encerrada pelo PR nº 150. A publicação está ativa na Vercel e na Edge Function versão 103. Nenhum dado real foi modificado automaticamente.

### Issue nº 152 — falso incidente do monitor

A issue foi aberta porque uma mudança sem impacto web disparou um deployment automático durante a execução do monitor. O PR nº 153 estabeleceu:

- SHA estrito quando o artefato web muda;
- manifesto saudável sem SHA fixo quando não há mudança web;
- manutenção de todas as verificações de site, assets, RLS anônima e Edge Functions.

O monitor de `push` do merge passou no run `31054708691`. A issue nº 152 permanece encerrada.

## 7. Achados derivados

### `ASSET-02` — P0

A edição genérica de bem usa persistência padrão, sem RPC atômico, log e versão equivalentes às demais mutações patrimoniais.

**Próxima ação:** corrigir em PR próprio antes do ensaio de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

A manutenção de programas pela Gestão SME existe tecnicamente, mas a autoridade funcional precisa ser confirmada.

**Próxima ação:** decisão expressa antes de alterar frontend, serviço ou RLS.

## 8. Garantia operacional

| Item | Estado | Prioridade |
|---|---|---:|
| monitor geral de Production | concluído e publicado | P0 |
| política de SHA por impacto web | corrigida e comprovada | P0 |
| incidentes automáticos | concluído e publicado | P0 |
| preflight das Edge Functions | concluído e publicado | P0 |
| bloqueio anônimo | concluído e publicado | P0 |
| auditoria de vinte invariantes | concluída e aplicada | P0 |
| backup/restauração descartáveis | concluído | P0 |
| smoke autenticado de cinco perfis | integrado, desativado | P0 |
| política institucional de retenção/DR | pendente de decisão | P2 |

## 9. Supabase e integração

| Item | Estado | Próxima ação |
|---|---|---|
| 26 migrations alinhadas | concluído | manter histórico e dry-run |
| Auth, perfis e escopos | parcialmente comprovado | ativar smoke somente após autorização |
| RLS positiva e negativa | parcialmente comprovada | ligar aos IDs da matriz |
| RPCs compostas | parcialmente comprovadas | provar escrita, releitura e falha |
| Edge Function de equipe | versão 103 publicada | manter CORS, JWT e compensação |
| integridade lógica agregada | concluída | observar execução recorrente |
| programas SME | decisão pendente | resolver `CFG-03` e `CFG-04` |

## 10. Manutenção técnica

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

Atualizações devem permanecer em PRs isolados. PRs automáticos de dependências não entram na sequência funcional sem análise e autorização específicas.

## 11. Sequência

```text
1. documentação pós-PRs 148 e 153
2. decidir sobre provisionamento das cinco contas técnicas
3. se autorizado, criar contas, segredo e variável
4. aprovar uma execução manual e uma agendada
5. atualizar matriz somente com evidência real
6. corrigir ASSET-02
7. executar escrita controlada e reversível
8. decidir autoridade sobre programas SME
9. avaliar atualizações menores isoladas
10. UAT e correções
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
