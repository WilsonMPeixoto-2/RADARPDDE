# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 5 de agosto de 2026

## 1. Baseline efetivo

```text
GitHub main: 1444b8df5aa11168e063ec55db635d5a2091214d
Últimos merges: PR #145 — matriz funcional; PR #146 — Supabase JS 2.110.9
Branch corrente: feat/smoke-autenticado-leitura-production-20260805
Vercel Production: dpl_6ciDyuemHM6uzZ53EVndnyuKaDKr — READY
Commit publicado na Vercel: 1444b8df5aa11168e063ec55db635d5a2091214d
Supabase Production: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Migrations em Production: 26
Última migration: 202608040001_production_integrity_monitor
Competência de fechamento: 2026-12
Edge Function team-account-management: ACTIVE, versão 95, JWT obrigatório
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
Node.js: 24.x
```

A `main`, o artefato público da Vercel e o cliente Supabase do navegador estão alinhados no commit `1444b8df…`.

## 2. Estado executivo

Estão integrados e publicados:

- núcleo operacional por competência, escola e programa;
- Dashboard, Carteira, Competências, Prontuário, timeline e Pendências;
- notas fiscais, bens, encaminhamento e inventariação;
- Gestão de Equipe com Auth, CORS, RPC e compensação;
- Gestão SME com recortes gerenciais e configurações vigentes;
- Excel SME mensal de 27 colunas homologado no Excel desktop;
- monitor geral de Production e incidentes automáticos;
- auditoria agregada de vinte invariantes de integridade;
- matriz funcional executável de 41 operações;
- Supabase JS 2.110.9 no frontend e na Edge Function.

A prioridade corrente é provar as seis leituras críticas diretamente no site publicado, usando identidades técnicas dedicadas e sem qualquer mutação operacional.

## 3. Fase corrente — smoke autenticado de leitura

A fase cobre:

| ID | Operação |
|---|---|
| `AUTH-01` | autenticar, restaurar sessão e aplicar perfil/escopo |
| `NAV-02` | pesquisar somente entidades autorizadas |
| `READ-01` | consultar Dashboard |
| `READ-02` | consultar Carteira quando autorizada |
| `READ-03` | consultar Prontuário e timeline |
| `READ-04` | consultar Pendências |

Perfis:

- Controlador;
- Assistente de Verbas Federais;
- Gestão SME;
- Equipe de Inventário;
- Administrador técnico.

### Implementação preparada

- `.github/workflows/production-authenticated-read.yml`;
- `playwright.production-authenticated-read.config.js`;
- `tests/e2e/production-authenticated-read.spec.js`;
- `tests/support/production-authenticated-read.js`;
- testes unitários do contrato e do workflow;
- plano de provisionamento e ativação.

O monitor valida ambiente, papel, recorte, busca, Dashboard, Carteira ou sua negativa, Prontuário, Pendências, refresh e logout. Ele falha se detectar `POST` operacional, Edge Function ou métodos `PATCH`, `PUT` e `DELETE`.

## 4. Estado do provisionamento

A consulta agregada ao Supabase Production confirmou usuários funcionais ativos, mas não encontrou identidade provável de monitoramento para nenhum perfil.

Por segurança:

- nenhuma conta pessoal será reutilizada;
- nenhuma identidade foi criada automaticamente;
- nenhum segredo foi gravado no repositório;
- o acesso remoto permanece desabilitado em pull requests;
- a execução recorrente permanece bloqueada até autorização específica para criar cinco contas técnicas.

A ativação exigirá:

1. cinco contas técnicas dedicadas no Supabase Auth;
2. perfis e escopos mínimos representativos;
3. segredo `RADAR_PRODUCTION_READ_ACCOUNTS_JSON` no GitHub;
4. variável `RADAR_PRODUCTION_AUTH_READ_ENABLED=true`;
5. execução manual aprovada;
6. execução agendada subsequente aprovada.

Até essa ativação, a fase está **implementada, mas não comprovada em Production**. As seis operações permanecem `partial/authenticated-read` na matriz.

## 5. Matriz funcional integrada

O PR nº 145 integrou:

- fonte JSON canônica;
- visão Markdown gerada;
- verificador determinístico;
- testes de IDs, perfis, âncoras, evidências e mutações;
- integração ao readiness.

Resultado vigente:

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 29 |
| Lacuna técnica | 1 |
| Decisão funcional pendente | 2 |
| **Total** | **41** |

## 6. Achados estruturais ainda abertos

### `ASSET-02` — lacuna técnica

A edição genérica de bem patrimonial ainda usa persistência padrão, sem o mesmo RPC atômico, log e versão das demais mutações. Deve ser corrigida antes da prova controlada de escrita.

### `CFG-03` e `CFG-04` — decisão funcional

A manutenção de programas pela Gestão SME existe tecnicamente, mas sua autoridade funcional precisa ser confirmada antes de alteração de frontend, serviço ou RLS.

## 7. Sequência cronológica

1. reconciliação documental — concluída pelo PR nº 142;
2. integridade contínua — concluída pelo PR nº 141;
3. matriz funcional — concluída pelo PR nº 145;
4. Supabase JS 2.110.9 — concluído e publicado pelo PR nº 146;
5. smoke autenticado de leitura — implementação atual;
6. provisionamento protegido e duas execuções reais — dependem de autorização;
7. correção de `ASSET-02` e provas de escrita controlada;
8. decisão sobre programas da Gestão SME;
9. UAT e decisão formal de liberação.

## 8. Gates ainda pendentes

- concluir o PR do monitor autenticado;
- autorizar e provisionar cinco identidades técnicas;
- executar o smoke manual e o agendado em Production;
- atualizar a cobertura das seis operações após evidência real;
- corrigir `ASSET-02`;
- provar 23 mutações com releitura e reversão;
- resolver `CFG-03` e `CFG-04`;
- realizar UAT com servidores reais;
- formalizar a liberação.

## 9. Continuidade

1. `AGENTS.md`;
2. `README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
5. `docs/ROADMAP_ATUALIZACOES_2026.md`;
6. `docs/superpowers/plans/2026-08-05-smoke-autenticado-leitura-production.md`;
7. `docs/PROJECT_CONTEXT.md`;
8. `docs/DECISION_LOG.md`.
