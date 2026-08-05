# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 5 de agosto de 2026

## 1. Baseline efetivo

```text
GitHub main: 30bdecc1116bbcd007448d21db57326b28d9a003
Últimos merges: PR #142 — reconciliação documental; PR #141 — integridade contínua
Branch corrente: feat/matriz-funcional-ponta-a-ponta-20260805-r2
Vercel Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
Commit publicado na Vercel: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Supabase Production: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Migrations em Production: 26
Última migration: 202608040001_production_integrity_monitor
Competência de fechamento: 2026-12
Edge Function team-account-management: ACTIVE, versão 95, JWT obrigatório
Node.js: 24.x
```

A diferença entre a `main` e o commit público da Vercel é conhecida: o PR nº 141 adicionou auditoria, workflow, testes e migration, sem alterar o frontend. O Supabase Production já recebeu a 26ª migration. Nenhuma promoção adicional da Vercel integra esta branch.

## 2. Estado executivo

O RADAR PDDE opera com frontend estático na Vercel e Supabase Production como backend canônico. Estão integrados:

- núcleo operacional por competência, escola e programa;
- Dashboard, Carteira, Competências, Prontuário, timeline e Pendências;
- notas fiscais, bens, encaminhamento e inventariação;
- Gestão de Equipe com Auth, CORS, RPC e compensação;
- Gestão SME com recortes gerenciais e configurações vigentes;
- Excel SME mensal de 27 colunas homologado no Excel desktop;
- monitor geral de Production e incidentes automáticos;
- auditoria agregada e somente leitura de vinte invariantes de integridade em Production;
- backup/restauração descartáveis e gate por perfil/viewport.

A prioridade corrente é transformar o percurso completo das atividades do usuário em contrato executável e usar suas lacunas para ordenar as próximas provas.

## 3. Fase corrente — matriz funcional ponta a ponta

A branch atual cria a fonte canônica:

```text
perfil
× superfície
× ação
× serviço
× repositório
× tabela/RPC/Edge Function
× autorização
× concorrência
× releitura
× compensação
× evidência
```

### Resultado atual

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 29 |
| Lacuna técnica | 1 |
| Decisão funcional pendente | 2 |
| **Total** | **41** |

| Próxima prova | Operações |
|---|---:|
| manter regressão existente | 5 |
| smoke autenticado de leitura | 6 |
| escrita controlada e reversível | 23 |
| decisão funcional expressa | 2 |
| observação contínua em Production | 5 |

### Contratos versionados

- `docs/reference/functional-contract-matrix.json`;
- `docs/reference/functional-contract-matrix/*.json`;
- `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
- `scripts/check-functional-contract-matrix.mjs`;
- `tests/unit/functional-contract-matrix.test.js`.

O verificador integra o readiness e bloqueia IDs duplicados, perfis ou superfícies desconhecidos, permissões incompletas, âncoras/evidências inexistentes e mutações críticas sem releitura, concorrência ou compensação.

## 4. Achados estruturais da matriz

### `ASSET-02` — lacuna técnica

A edição genérica de bem patrimonial usa `DataService.defaultPersist`, sem o mesmo RPC atômico, log e versão empregados pelas demais mutações patrimoniais. A correção deverá ocorrer em PR próprio antes da prova controlada de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

Cadastrar, editar e desativar programas existe no frontend e no Supabase, mas a autoridade da Gestão SME deve ser confirmada antes de expansão, retirada ou mudança de RLS.

## 5. Sequência cronológica

1. **Reconciliação documental:** concluída e integrada pelo PR nº 142.
2. **Integridade contínua dos dados:** concluída e integrada pelo PR nº 141; 26ª migration aplicada.
3. **Matriz funcional executável:** em execução nesta branch.
4. **Smoke autenticado de leitura:** próxima fase, cobrindo seis operações sem mutação.
5. **Correção de `ASSET-02` e escrita controlada:** PRs isolados, com releitura e reversão.
6. **Decisão sobre programas da Gestão SME:** confirmação funcional antes de código.
7. **UAT e liberação:** após os gates técnicos e funcionais.

## 6. Critério de conclusão funcional

Uma função crítica somente é considerada concluída quando houver prova de:

1. visibilidade correta por perfil;
2. acionamento real no navegador;
3. payload correto;
4. serviço e repositório esperados;
5. backend alcançado;
6. autorização positiva e negativa;
7. consulta ou gravação concluída;
8. interface atualizada;
9. resultado preservado após recarregar;
10. conflito tratado;
11. falha parcial compensada;
12. regressão permanente no CI.

## 7. Gates ainda pendentes

- concluir e integrar a matriz mediante autorização;
- smoke autenticado recorrente;
- provas controladas de escrita, releitura e compensação;
- decisão funcional sobre programas SME;
- correção da edição patrimonial genérica;
- homologação do relatório institucional quando priorizada;
- UAT com servidores reais;
- decisão formal de liberação.

## 8. Continuidade

1. `AGENTS.md`;
2. `README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
5. `docs/PROJECT_CONTEXT.md`;
6. `docs/ROADMAP_ATUALIZACOES_2026.md`;
7. `docs/DECISION_LOG.md`;
8. `docs/reference/STATUS_DOCUMENTOS.md`.
