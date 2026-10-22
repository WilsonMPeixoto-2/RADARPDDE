# Supabase Production — verificação após upgrade PostgreSQL 17.11

**Classe:** evidência temporal de manutenção; não define regra funcional.
**Data:** 22/10/2026, verificações iniciadas às 05:23 UTC (02:23 Brasília).
**Código vigente:** `84e793ed42a9139d8f80fcf2a16b868d8bba656e`.
**Supabase Production:** `scnryinorqeucbfkioxo`, RADAR PDDE 2026, `sa-east-1`.

## Resultado e fronteira

O usuário executou pelo Dashboard o upgrade de PostgreSQL **17.6.1.166 →
17.11.0.003**. A leitura atual da Management API confirma `ACTIVE_HEALTHY`,
engine 17, canal `ga`; SQL confirma `server_version=17.11`.

**Parecer:** verificações técnicas de leitura aprovadas, sem falha do RADAR
identificada e sem indicação de rollback nas evidências disponíveis. Isso não
constitui certificação de todas as jornadas autenticadas ou de ausência absoluta
de defeitos. Nenhum login humano ou teste de escrita institucional foi realizado.

Auth permaneceu em **2.197.0** (health público atual). PostgREST passou de
**14.17 para 14.18**, conforme capturas antes/depois fornecidas pelo usuário;
essa versão específica não foi feita confirmação independente pela Management API.
CLI **2.114.0** e SDK **2.118.0** são componentes distintos, não foram atualizados
por esta análise. A API hospedada atual não homologa automaticamente a CLI candidata.

## Contrato de verificação e resultados

| Risco | Evidência atual | Resultado |
|---|---|---|
| Projeto não recuperou | Management API e SQL atual | ACTIVE_HEALTHY, PostgreSQL 17.11 |
| Frontend ou assets indisponíveis | Smoke canônico público | Aprovado, 52 assets; SHA esperado |
| Migrations ausentes | Lista completa comparada aos arquivos da main | 61/61 IDs iguais, sem ausente/extra |
| Exposição de tabelas | Catálogo RLS/políticas/grants + request público | 20/20 tabelas públicas com RLS; sete tabelas operacionais sem privilégios anon; GET escolas bloqueado 401 |
| Violação de integridade | `production_integrity_check()` | healthy, **20** controles atuais, zero problemas |
| Órfãos adicionais | LEFT JOIN NF→bem, bem→escola, tentativa→Pendência, contato→escola | Zero nos quatro controles |
| Proteção patrimonial ausente | Catálogo de triggers | Três triggers terminais ativos |
| Corpo da RPC alterado | Hash exato `pg_proc.prosrc` × migration da main | Global e escolar idênticos |
| RPC incompatível com PostgreSQL novo | Execução SQL sob contexto authenticated/Controlador existente, transação read only | Global e escolar retornam JSON válido; 163 escolas visíveis no contexto verificado |
| Fatia escolar divergente | Segunda amostra, escola com NF/bens/tentativas/contatos | As seis coleções coincidem com a parcela da leitura global |
| Auth indisponível | GET `/auth/v1/health` e `/auth/v1/settings` | Ambos 200; health GoTrue v2.197.0 |
| Transporte Realtime indisponível | WebSocket + heartbeat Phoenix | Conectou; resposta ok, 231 ms |
| Mecanismo Broadcast ausente | Seis triggers + função privada + política do canal | Seis triggers ativos; corpo da função igual à main; RLS do canal ativa |
| Índices/constraints inválidos | Catálogos PostgreSQL | Nenhum índice inválido nem constraint pública não validada |

O monitor atual retornou **20** chaves em `checks`. Referências históricas a
19 controles não foram usadas como expectativa artificial para este resultado.

### Leituras operacionais sob RLS

Foram realizadas duas amostras em `BEGIN READ ONLY`, com claims **locais à
transação** de um Controlador ativo já existente e `SET LOCAL ROLE authenticated`,
encerradas por `ROLLBACK`. Nenhum UUID, e-mail ou registro individual foi incluído
na evidência. Não foram criados usuários, tokens ou sessões Auth.

A competência `2026-09` foi escolhida pelo volume existente para exercitar a RPC;
não representa afirmação sobre a competência selecionada na interface do usuário.

Primeira amostra: global 1.939.500 bytes, escolar 178.612 bytes; envelope completo,
sem fallback e registros da escola solicitada. Segunda amostra com relações
fiscais/patrimoniais:

| Coleção | Fatia escolar | Parcela correspondente da global | Igualdade |
|---|---:|---:|---|
| Verificações | 6 | 6 | Conteúdo igual |
| NFs | 26 | 26 | Conteúdo igual |
| Pendências | 24 | 24 | Conteúdo igual |
| Tentativas | 16 | 16 | Conteúdo igual |
| Contatos de Pendência | 1 | 1 | Conteúdo igual |
| Bens | 6 | 6 | Conteúdo igual |

Nesta segunda amostra, JSON global = **1.939.500 bytes** e escolar =
**120.728 bytes**, medidos por `octet_length(jsonb::text)` no servidor. Não são
bytes HTTP nem um benchmark antes/depois do upgrade. Não permitem atribuir ganho
de latência à nova versão do PostgreSQL.

Essa prova exercita SQL/RLS/RPC, **não** emissão/renovação de JWT pelo Auth,
login na UI, despacho HTTP PostgREST ou convergência por Broadcast privado.

### Dados e estruturas observados

163 escolas; 1.523 verificações; 494 NFs; 696 Pendências; 219 tentativas;
128 contatos; 56 bens. São contagens atuais: não existe fingerprint completo
imediatamente anterior a este upgrade para provar igualdade integral antes/depois.
As 11 extensões e versões coincidem com a observação anterior desta sessão.
Nenhum slot de replicação lógica está presente.

Os três triggers patrimoniais estão habilitados:

- `assets_protect_inventoried_terminal_state`;
- `assets_protect_inventoried_terminal_delete`;
- `registered_invoices_protect_inventoried_delete`.

As RPCs de leitura continuam `STABLE SECURITY INVOKER`, executáveis por
`authenticated` e `service_role`, sem EXECUTE para `anon`. Integridade continua
restrita a `service_role`. Os grants DELETE de `service_role` nas duas tabelas de
perfis/escopos continuam presentes, conforme a auditoria histórica de 18/10; não
foram classificados como regressão do upgrade nem alterados.

## Logs: fatos e classificação

Janela consultada explicitamente: **03:26:39–05:27:00 UTC em 22/10**. Não houve
5xx nas linhas edge disponíveis nessa janela. O tráfego observado é reduzido e
majoritariamente técnico; não constitui jornada operacional sustentada.

- `401` em `/rest/v1/schools` e SQLSTATE `42501`: compatíveis com bloqueio anônimo
  esperado pelos smokes, não falha funcional de usuário autenticado.
- Duas mensagens `ORIGIN_DENIED`, status 403, da Edge Function de equipe:
  correspondem ao comportamento esperado da contraprova de origem não autorizada
  no script `check-production-team-account-preflight.mjs`; não houve falha 5xx.
- SQLSTATE `42704`, “type ltree does not exist”: a query registrada era uma
  inspeção administrativa via `mgmt-api`/MCP que usou `'ltree'::regtype` apesar de
  a extensão não estar instalada. O código do RADAR não usa esse tipo. Não foi
  classificada como erro do runtime do produto. Dados pessoais da query não foram
  persistidos neste relatório.

## Advisors e histórico de estatísticas

Security Advisor: um WARN `auth_leaked_password_protection`, sem findings novos de
RLS. A limitação de proteção de senha vazada já é registrada na
[ADR-036](../../decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md), sujeita
à decisão de plano/custo; não é regressão comprovada desta atualização.
[Orientação oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Performance Advisor: **40 INFO de índice não utilizado**, sem outro tipo retornado.
`pg_stat_statements_info.stats_reset = 2026-10-22T03:25:02.644772Z`, e
`pg_postmaster_start_time = 2026-10-22T03:26:38.722513Z`.
O ciclo de manutenção tem estatísticas novas. **Não remover índices imediatamente a partir desse aviso**, nem comparar contadores atuais com o histórico
anterior iniciado em julho como se fosse a mesma janela. Esta análise não
executou reset.
[Descrição do aviso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Limites e continuidade

- Não foram alterados dados de negócio, Auth, RLS, grants, migrations, configuração
  de serviço, índice, frontend ou deployment.
- Sem sessão humana autenticada: login/UI, gravações e convergência privada após
  upgrade continuam fora da cobertura desta verificação. Não foram provisionadas
  fixtures nem usuários no banco institucional para preencher artificialmente
  essa lacuna.
- Não foi reexecutada a bateria local/CI contra um PostgreSQL antigo para alegar
  validação do serviço hospedado novo. A prova acima veio do banco atual.
- Não há medição comparável de desempenho anterior/posterior; não foi prometida
  correção da lentidão pelo upgrade.
- O backup restaurado documentado é o snapshot histórico de 13/10; esta rodada
  não verificou backup atual, custódia ou restauração. Ver
  [runbook](../../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md#10-a-backup-cifrado-da-production-no-release-do-pr-438).
- Para a próxima observação de desempenho, usar baseline/delta **depois** do reset
  e tráfego operacional real; conservar artefatos históricos para comparações com
  janelas explicitamente distintas.

## Evidência reproduzível e fontes

[checks.json](checks.json) contém resultados agregados, janela de logs, ACLs,
triggers, IDs de migrations, igualdade das seis coleções e smoke público, sem
credenciais nem registros individuais. SHA256: `14436e623b89e1255043bcfbd216a6d3b6b8512cf4b07b86974e6838315e0b8a`.

Consultas principais: `SELECT public.production_integrity_check()`; catálogos
`pg_class`, `pg_policy`, `pg_proc`, `pg_trigger`, `pg_index`, `pg_constraint`,
`pg_extension`, `supabase_migrations.schema_migrations`; RPCs
`read_operational_context(text,text[])` e
`read_school_operational_context(text,text,text[])` dentro da transação de leitura.

Fontes oficiais consultadas:

- [Upgrade de projetos hospedados](https://supabase.com/docs/guides/platform/upgrading).
- [Notas PostgreSQL 15.19 / 17.11 e cuidados específicos](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).

Os cuidados específicos de ltree, GiST float e operadores personalizados não
foram encontrados no preflight desta sessão. Uso de pgcrypto foi inspecionado em
código e funções públicas, sem teste de descriptografia ou leitura de segredos.
