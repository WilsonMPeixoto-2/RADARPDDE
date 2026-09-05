# Arquitetura de persistência e prontidão Supabase

**Estado:** vigente para a baseline funcional do PR #260  
**Atualizado em:** 5 de setembro de 2026

> A continuidade começa em [`../../START_HERE.md`](../../START_HERE.md). Antes de operação remota, confirmar `main`, migrations, Edge Functions e integridade diretamente no ambiente. Não usar este documento para presumir que um deployment antigo continua atual.

## 1. Contratos estáveis

- Supabase é a persistência canônica de Production;
- `SupabaseRepository` é o adaptador normal de Preview/Production;
- LocalStorage/seed só existem nos modos explicitamente permitidos de desenvolvimento/teste;
- Production é fail-closed;
- Auth, RLS, RPCs e Edge Functions são fronteiras reais de autorização;
- nenhuma credencial administrativa chega ao navegador;
- conflitos de `row_version` não são sobrescritos silenciosamente;
- histórico de migration não é editado para “corrigir” SQL já aplicado.

## 2. Arquitetura

```text
Frontend
→ serviços de aplicação / UnitOfWork / StatePort
→ RepositoryContract
→ SupabaseRepository
→ PostgREST / RPC / Edge Function
→ Auth + RLS + PostgreSQL
```

Operações que exigem múltiplas mudanças coerentes usam RPC/transação. Quando Auth Admin e banco participam de etapas diferentes, falha parcial exige compensação.

## 3. Runtime

Preview e Production usam configuração explícita do Supabase. Somente URL e chave publicável podem estar no navegador.

Production não deve ativar fallback local por falha de configuração ou indisponibilidade do backend. Qualquer contingência que altere o modo de dados exige build/decisão específicos e plano de retorno.

## 4. Auth e autorização

A autorização combina sessão, papel ativo, CRE, escopos escolares e políticas específicas da entidade.

`technical_admin` é papel técnico efetivo; simulação visual não altera JWT.

Anônimo não recebe dados institucionais protegidos.

## 5. Gestão de Equipe

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

A Edge Function vigente:

- exige JWT;
- verifica papel de gestor;
- aplica CORS fail-closed;
- resolve conta por e-mail pela RPC restrita `resolve_team_auth_user_id_by_email`;
- evita varredura global `listUsers` como caminho normal;
- reutiliza conta somente quando não há vínculo ativo incompatível;
- rejeita ambiguidade diretório/perfil;
- desativa logicamente e preserva histórico;
- compensa alteração de Auth se a etapa de banco falhar.

## 6. Operações compostas relevantes

A baseline contém contratos atômicos para, entre outros:

- exercício + competências + log;
- escola + programas + log;
- redistribuição de carteira + log;
- verificação mensal + log;
- Pendência + tentativa/contato/reanálise;
- análise fiscal/Assessoria individual;
- Nota Fiscal + efeitos derivados;
- bem + verificação + log;
- Gestão de Equipe;
- importação/promoção/rollback.

### Patrimônio pós-PR #260

`save_asset_with_verification_and_log` sincroniza o encaminhamento de bem permanente vinculado com a verificação mensal e o histórico na mesma operação.

A migration `20260904040000_functional_reliability_inventory_sync.sql` também reforça a fronteira de payload de verificação, impedindo que aliases técnicos de versão reapareçam no JSON funcional.

## 7. Baseline de migrations

O PR #260 fechou a baseline funcional em **46 migrations**. Para qualquer trabalho futuro:

1. comparar histórico local e remoto;
2. resetar o banco descartável;
3. executar pgTAP e lint;
4. regenerar tipos/cliente;
5. confirmar reprodutibilidade dos artefatos;
6. executar backup/restauração quando o escopo exigir;
7. revisar SQL, grants e RLS;
8. aplicar em Production apenas com autorização;
9. executar verificação pós-apply.

## 8. Readiness do CI

O workflow de Supabase valida uma cadeia real, que inclui:

```text
checkout / dependências
→ Supabase local
→ reset com migrations
→ preflight de contratos
→ pgTAP
→ lint PL/pgSQL
→ geração de tipos + cliente fixado
→ confirmação de artefatos reproduzíveis
→ Auth das fixtures
→ Edge Function Gestão de Equipe
→ frontend + Auth + RLS
→ limpeza
```

Uma falha de uma etapa não autoriza mudança de produto sem reprodução.

### Incidente do PR #263

No primeiro run do SHA `617355e1...`, o job local falhou em **Regenerar tipos e cliente fixado**, depois de reset, preflight, pgTAP e lint já terem passado. O mesmo job foi reexecutado **no mesmo SHA e sem qualquer alteração de código** e passou integralmente, inclusive a etapa que havia falhado, geração/reprodutibilidade, Auth, Edge Function, frontend e RLS.

Classificação: **falha transitória do runner/ambiente de CI, não defeito reproduzível do RADAR**. Nenhuma “correção” de runtime ou schema foi feita para mascarar o evento.

## 9. Readiness arquitetural do produto

O fato de o workflow de Supabase estar completo não elimina a dívida arquitetural da Frente 2 do plano corrente.

Na aplicação, `product-extensions-bootstrap.js` ainda carrega extensões em cadeia sequencial e existem pontos de prontidão/instalação que dependem de polling ou composição frágil. A frente futura deve substituir readiness essencial por contrato determinístico sem remover timers legítimos e sem quebrar as proteções existentes.

`critical-action-guard.js`, `RadarProductExtensionsReady` e as autoridades separadas de Assessoria são baseline a preservar durante essa migração.

## 10. Backup/restauração

O gate descartável verifica dump, restauração e equivalência sem publicar conteúdo institucional. Ele é prova técnica, não política de retenção/DR.

## 11. Importação

Importação remota continua controlada por procedimento específico:

```text
snapshot
→ validação
→ plano/dry-run
→ staging
→ reconciliação
→ promoção
→ verificação
→ rollback quando necessário
```

A existência das tabelas/funções não autoriza operação real fora do procedimento aprovado.

## 12. Monitoramento e integridade

O produto possui gates para manifesto/SHA, assets, autenticação, RLS, Edge Functions, backup/restauração e integridade agregada.

`production_integrity_check()` registrou `totalIssues = 0` no fechamento da baseline do PR #260. Esse valor é histórico do checkpoint e deve ser reconsultado quando a decisão depender do estado atual de Production.

## 13. Invariantes

- Supabase canônico em Production;
- fail-closed;
- nenhum segredo administrativo no frontend;
- migrations versionadas;
- sem seed institucional implícito;
- Auth/RLS obrigatórios;
- autoria e log nas mutações previstas;
- operação composta atômica quando o domínio exigir;
- nenhum `rowVersion`/`row_version` dentro do payload funcional de verificação;
- duas NFs iguais por conteúdo podem ser legítimas;
- falha de CI precisa ser reproduzida antes de virar “bug”.

## 14. Verificação local relevante

```bash
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
npm run test:e2e
```

Os comandos exatos e credenciais/condições de conexão ficam no runbook correspondente.

## 15. Referências

- [`../CURRENT_STATE.md`](../CURRENT_STATE.md)
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md)
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md)
