# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 5 de agosto de 2026

## 1. Baseline efetivo

```text
GitHub main: 8f2a267cceb00959c0e6eeee4d9b883c7212e17a
Último merge: PR #153 — correção da corrida de deployment no monitor
Vercel Production: dpl_GrBhxgRquJNcq9DG7cCn1JQ1oXnQ — READY
Commit publicado na Vercel: 8f2a267cceb00959c0e6eeee4d9b883c7212e17a
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

A `main`, a Vercel Production e a Edge Function permanecem alinhadas. Os PRs nº 148 e 153 não alteraram migrations, RLS, grants, Auth ou dados reais.

## 2. Estado executivo

Estão integrados:

- núcleo operacional por competência, escola e programa;
- Dashboard, Carteira, Competências, Prontuário, timeline e Pendências;
- notas fiscais, bens, encaminhamento e inventariação;
- Gestão de Equipe com Auth, CORS, RPC, compensação e transição segura entre perfis;
- Gestão SME com recortes gerenciais e configurações vigentes;
- Excel SME mensal de 27 colunas homologado no Excel desktop;
- monitor geral de Production e incidentes automáticos;
- auditoria agregada de vinte invariantes de integridade;
- backup e restauração descartáveis;
- matriz funcional executável de 41 operações;
- infraestrutura do smoke autenticado de leitura para cinco perfis;
- Supabase JS 2.110.9 no navegador e na Edge Function.

A infraestrutura do smoke autenticado está versionada, mas **não está ativa em Production**. Não foram criadas contas técnicas, segredo ou variável de habilitação, e nenhuma jornada autenticada real foi executada pelo novo monitor.

## 3. Matriz funcional ponta a ponta

A fonte canônica relaciona:

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

A integração do PR nº 148 não altera as seis operações de leitura para “comprovadas”, porque ainda não houve execução manual e agendada com identidades técnicas autorizadas.

## 4. Gestão de Equipe

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

- busca única por e-mail normalizado antes de convite;
- reutilização somente sem vínculo ativo conflitante;
- um único perfil institucional ativo por usuário;
- histórico inativo preservado;
- bloqueio anterior restaurado em compensação;
- payload funcional da Edge Function preservado pelo gateway;
- conflito apresentado como conflito, não como indisponibilidade.

A prova integral foi executada com dados sintéticos em Supabase descartável. A operação com pessoas reais não foi repetida automaticamente.

## 5. Smoke autenticado de leitura — PR nº 148

O PR nº 148 foi integrado no commit:

```text
feb29af157b01b8b8282e976a4d03907a3aabe60
```

A infraestrutura cobre:

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

Estado operacional:

- workflow e contratos integrados;
- execução remota desabilitada;
- cinco contas técnicas não provisionadas;
- segredo `RADAR_PRODUCTION_READ_ACCOUNTS_JSON` não criado;
- variável `RADAR_PRODUCTION_AUTH_READ_ENABLED` não habilitada;
- nenhuma conta pessoal reutilizada;
- nenhuma cobertura da matriz promovida sem evidência real.

A ativação exige autorização específica, provisionamento seguro, uma execução manual aprovada e uma execução agendada aprovada.

## 6. Correção do monitor — PR nº 153

Após o merge do PR nº 148, o monitor abriu o incidente automático nº 152 por uma corrida de deployment:

1. a alteração não exigia novo artefato web;
2. o monitor registrou o SHA publicado naquele instante;
3. a Vercel publicou automaticamente o novo commit segundos depois;
4. a comparação rígida rejeitou o deployment mais novo, embora o sistema estivesse saudável.

O PR nº 153 corrigiu a política:

- mudança web: exige exatamente o novo SHA e aguarda propagação;
- mudança sem impacto web: valida o manifesto íntegro atualmente publicado, sem fixar SHA;
- site, assets, bloqueio anônimo e preflight continuam obrigatórios;
- o incidente registra o commit observado ou obrigatório, conforme o cenário.

O `push` do merge foi aprovado pelo monitor no run `31054708691`. A issue nº 152 permanece encerrada.

## 7. Achados estruturais

### `ASSET-02` — lacuna técnica

A edição genérica de bem patrimonial usa persistência padrão, sem o mesmo RPC atômico, log e versão empregados pelas demais mutações patrimoniais. A correção deve ocorrer antes das provas controladas de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

Cadastrar, editar e desativar programas existe tecnicamente, mas a autoridade da Gestão SME deve ser confirmada antes de qualquer mudança de frontend ou RLS.

## 8. Sequência cronológica

1. PR nº 141 — auditoria contínua de integridade: concluído e aplicado.
2. PR nº 145 — matriz funcional executável: concluído.
3. PR nº 146 — Supabase JS 2.110.9: concluído e publicado.
4. PR nº 147 — workflow principal: corrigido.
5. PR nº 150 — transição de perfil: concluído e publicado.
6. PR nº 151 — documentação pós-hotfix: concluída.
7. PR nº 148 — infraestrutura do smoke autenticado: integrada e desativada.
8. PR nº 153 — corrida de deployment do monitor: corrigida e comprovada.
9. Provisionamento técnico do smoke: depende de autorização específica.
10. Correção de `ASSET-02` e escrita controlada: próxima frente técnica.
11. Decisão sobre programas da Gestão SME: pendente.
12. UAT e decisão formal de liberação: posteriores aos gates.

## 9. Gates ainda pendentes

- autorizar ou não o provisionamento das cinco identidades técnicas;
- configurar segredo e variável somente após autorização;
- aprovar uma execução manual e uma agendada do smoke autenticado;
- atualizar a matriz após evidência real;
- corrigir `ASSET-02`;
- executar provas controladas de escrita, releitura e compensação;
- decidir a autoridade sobre programas SME;
- realizar UAT com servidores reais;
- formalizar a decisão de liberação.

## 10. Continuidade

1. `AGENTS.md`;
2. `README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
5. `docs/PROJECT_CONTEXT.md`;
6. `docs/ROADMAP_ATUALIZACOES_2026.md`;
7. `docs/DECISION_LOG.md`;
8. `docs/reference/STATUS_DOCUMENTOS.md`.
