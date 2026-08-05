# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 5 de agosto de 2026

## 1. Baseline efetivo

```text
GitHub main: 2ae98da8a547d46cd7e8e64977b855b1a90a2495
Último merge funcional: PR #150 — transição de perfil na Gestão de Equipe
Vercel Production: dpl_BvrxJUahgWpaRbtn6Y5FrfzknKAw — READY
Commit publicado na Vercel: 2ae98da8a547d46cd7e8e64977b855b1a90a2495
Supabase Production: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Migrations em Production: 26
Última migration: 202608040001_production_integrity_monitor
Competência de fechamento: 2026-12
Edge Function team-account-management: ACTIVE, versão 103, JWT obrigatório
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
Node.js: 24.x
```

A `main`, o frontend publicado e a Edge Function estão alinhados ao hotfix do PR nº 150. A issue nº 149 foi encerrada. Nenhuma migration ou alteração automática de dados reais integrou essa publicação.

## 2. Estado executivo

O RADAR PDDE opera com frontend estático na Vercel e Supabase Production como backend canônico. Estão integrados:

- núcleo operacional por competência, escola e programa;
- Dashboard, Carteira, Competências, Prontuário, timeline e Pendências;
- notas fiscais, bens, encaminhamento e inventariação;
- Gestão de Equipe com Auth, CORS, RPC, compensação e transição segura entre perfis;
- Gestão SME com recortes gerenciais e configurações vigentes;
- Excel SME mensal de 27 colunas homologado no Excel desktop;
- monitor geral de Production e incidentes automáticos;
- auditoria agregada e somente leitura de vinte invariantes de integridade em Production;
- backup/restauração descartáveis e gate por perfil/viewport;
- matriz funcional executável de 41 operações;
- Supabase JS 2.110.9 no navegador e na Edge Function.

A prioridade corrente é concluir a camada de smoke autenticado somente leitura e, depois, avançar para as provas controladas de escrita.

## 3. Matriz funcional ponta a ponta

A fonte canônica integrada pelo PR nº 145 relaciona:

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

### Resultado registrado

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

## 4. Correção P0 mais recente — Gestão de Equipe

O PR nº 150 corrigiu o percurso:

```text
Inventário
→ desativar integrante
→ cadastrar a mesma pessoa como Controladora
→ reutilizar a conta Auth existente
→ redistribuir carteira
→ autenticar com o novo papel
```

Proteções vigentes:

- busca única por e-mail normalizado antes de enviar convite;
- reutilização somente sem vínculo ativo conflitante;
- um único perfil institucional ativo por usuário;
- histórico inativo preservado;
- estado anterior de bloqueio restaurado em compensação;
- payload funcional da Edge Function preservado pelo gateway;
- conflito apresentado como conflito, não como falsa indisponibilidade.

A prova integral foi executada com identidades e dados sintéticos em Supabase descartável. A operação com pessoas reais não foi executada automaticamente.

## 5. Frente aberta — smoke autenticado de leitura

O PR nº 148 prepara uma prova recorrente, autenticada e não destrutiva para:

- autenticação, perfil, escopo, refresh e logout;
- busca global autorizada;
- Dashboard;
- Carteira ou negativa correta para Inventário;
- Prontuário e timeline;
- Pendências.

Perfis previstos:

- Controlador;
- Assistente de Verbas Federais;
- Gestão SME;
- Equipe de Inventário;
- Administrador técnico.

Estado atual:

- implementação e contratos concluídos na branch;
- gates locais e descartáveis aprovados no SHA registrado pelo PR;
- PR ainda em rascunho e precisa ser reconciliado com a `main` após o PR nº 150;
- execução remota permanece desabilitada;
- cinco contas técnicas, segredo e variável de ativação não foram criados;
- nenhuma conta pessoal deve ser reutilizada para monitoramento.

A infraestrutura poderá ser integrada desativada. O provisionamento das identidades técnicas e a ativação recorrente exigem autorização operacional específica.

## 6. Achados estruturais da matriz

### `ASSET-02` — lacuna técnica

A edição genérica de bem patrimonial usa `DataService.defaultPersist`, sem o mesmo RPC atômico, log e versão empregados pelas demais mutações patrimoniais. A correção deverá ocorrer em PR próprio antes da prova controlada de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

Cadastrar, editar e desativar programas existe no frontend e no Supabase, mas a autoridade da Gestão SME deve ser confirmada antes de expansão, retirada ou mudança de RLS.

## 7. Sequência cronológica

1. **Reconciliação documental:** PR nº 142 concluído; atualização pós-PR nº 150 em curso.
2. **Integridade contínua dos dados:** PR nº 141 concluído; 26ª migration aplicada.
3. **Matriz funcional executável:** PR nº 145 concluído.
4. **Atualização Supabase JS:** PR nº 146 concluído e publicado em `2.110.9`.
5. **Correção do workflow principal:** PR nº 147 concluído.
6. **Hotfix da transição de perfil:** PR nº 150 concluído e publicado.
7. **Smoke autenticado de leitura:** reconciliar e integrar o PR nº 148 mantendo a ativação bloqueada.
8. **Provisionamento técnico do smoke:** criar cinco identidades exclusivas somente após autorização específica.
9. **Correção de `ASSET-02` e escrita controlada:** PRs isolados, com releitura e reversão.
10. **Decisão sobre programas da Gestão SME:** confirmação funcional antes de código.
11. **UAT e liberação:** após os gates técnicos e funcionais.

## 8. Critério de conclusão funcional

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

## 9. Gates ainda pendentes

- reconciliar e integrar o PR nº 148;
- autorizar e provisionar identidades técnicas exclusivas para o smoke;
- aprovar uma execução manual e outra agendada em Production;
- provas controladas de escrita, releitura e compensação;
- decisão funcional sobre programas SME;
- correção da edição patrimonial genérica;
- homologação do relatório institucional quando priorizada;
- UAT com servidores reais;
- decisão formal de liberação.

## 10. Continuidade

1. `AGENTS.md`;
2. `README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
5. `docs/PROJECT_CONTEXT.md`;
6. `docs/ROADMAP_ATUALIZACOES_2026.md`;
7. `docs/DECISION_LOG.md`;
8. `docs/reference/STATUS_DOCUMENTOS.md`.
