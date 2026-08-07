# Arquitetura de persistência e prontidão Supabase

**Estado:** vigente; Production ativa  
**Atualizado em:** 7 de agosto de 2026

## 1. Baseline

O baseline mutável do Supabase, Vercel e GitHub fica exclusivamente em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md). Antes de operação remota, revalidar projeto, migrations, Edge Functions e integridade diretamente no ambiente.

Contratos estáveis:

- Supabase Production é a persistência canônica;
- PostgreSQL 17;
- `SupabaseRepository` é o adaptador normal de Preview/Production;
- `LocalStorageRepository` permanece desenvolvimento/contingência por novo build;
- Auth, RLS, RPCs e Edge Functions são fronteiras de autorização reais;
- nenhuma credencial administrativa chega ao navegador.

## 2. Arquitetura

```text
Frontend
→ serviços de aplicação e UnitOfWork
→ RepositoryContract
   ├── SupabaseRepository — canônico em Preview/Production
   └── LocalStorageRepository — desenvolvimento e contingência
→ PostgREST / RPC / Edge Function
→ Auth + RLS + PostgreSQL
```

## 3. Runtime

### Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

### Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

Somente URL e chave publicável podem estar no artefato do navegador.

## 4. Componentes

- domínio — competência, avaliação, pendências, timeline e regras;
- serviços — configuração, equipe, escolas, verificações, pendências, notas, inventário e auditoria;
- UnitOfWork — estado anterior, persistência, conflito e compensação;
- StatePort — tradução entre memória e snapshot;
- SupabaseRepository — paginação, lotes, RPCs, RLS e importação;
- Edge Function — operações Auth Admin da Gestão de Equipe.

## 5. Auth e autorização

A autorização combina:

- sessão válida;
- perfil e papel ativos;
- `cre_scope`;
- carteira principal;
- exceções escolares;
- políticas específicas de Inventário e SME;
- privilégios técnicos.

`anon` não recebe dados institucionais. A simulação visual do administrador técnico não altera JWT.

## 6. Gestão de Equipe

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Contratos vigentes:

- CORS fail-closed e allowlist institucional;
- preflight independente da autenticação e operação funcional com JWT;
- validação do papel institucional;
- lookup de conta Auth por e-mail usando `resolve_team_auth_user_id_by_email`, restrita a `service_role`;
- ausência de varredura global `listUsers` como caminho normal;
- normalização/reparo de registros Auth legados incompatíveis;
- recuperação de vínculo histórico somente quando inequívoca;
- reutilização de conta existente em transição autorizada;
- um único perfil institucional ativo por usuário;
- idempotência, redistribuição e desativação lógica;
- compensação em falha parcial.

Os PRs #138, #150 e #161 formam a sequência histórica da correção da Gestão de Equipe. Nenhum deles isoladamente deve ser tratado como descrição completa do contrato atual.

## 7. Operações compostas

RPCs/transações protegem:

- exercício e competências;
- escola e programas;
- atribuição de Controlador;
- verificação e log;
- pendência, tentativa, contato e reanálise;
- nota e bem vinculado;
- bem e log administrativo;
- Gestão de Equipe;
- importação, promoção e rollback.

Conflitos de `row_version` não podem ser sobrescritos silenciosamente.

## 8. Remediações de integridade incorporadas

### CFG-02

`save_exercise_with_competences` exige `row_version` positivo, exatamente doze competências de um único exercício, meses janeiro a dezembro e conflito otimista no `app_config`.

### INV-01

O trigger `registered_invoices_delete_unlinked_asset` chama `delete_unlinked_invoice_asset()` quando `linked_asset_id` muda, impedindo que o bem derivado anterior permaneça órfão.

### PEND-02

O trigger `pendencies_sync_attempt_statuses` mantém `pendency_attempts.payload.status` sincronizado com o agregado da pendência. A migration reconciliou registros existentes de forma idempotente.

### SCH-01

A tabela `schools` exige identidade institucional não vazia e índices únicos normalizados para INEP, CNPJ e SICI. O serviço também valida duplicidades antes da persistência.

### ASSET-02

`InventoryService.updateAsset` restringe a edição rápida ao campo autorizado e persiste via `saveAssetWithLog` com versão esperada e log.

## 9. Migrations

A contagem atual e as últimas versões ficam em `CURRENT_STAGE.md`. A regra operacional permanece:

1. comparar histórico local/remoto;
2. resetar localmente;
3. executar pgTAP e lint;
4. regenerar tipos;
5. executar backup/restauração;
6. analisar SQL e privilégios;
7. executar dry-run remoto;
8. documentar reversão;
9. aplicar em Production somente dentro do escopo autorizado;
10. executar verificação posterior e registrar evidência.

Histórico de migrations não é editado diretamente. `migration repair` altera histórico, não desfaz SQL.

## 10. Backup e restauração

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

Duas pilhas descartáveis comprovam equivalência de schema, dados, Auth e migrations. O CI publica apenas evidência sanitizada e não substitui política institucional de retenção/DR.

## 11. Importação

```text
snapshot
→ validação
→ plano
→ dry-run
→ staging
→ retomada
→ reconciliação
→ promoção atômica
→ reconciliação do destino
→ rollback
```

Importação remota exige pacote, janela e autorização específicos.

## 12. Monitoramento contínuo

### Sistema publicado

O monitor geral verifica SHA quando aplicável, manifesto, shell, assets, gate de autenticação, bloqueio anônimo, preflight e incidentes.

### Integridade dos dados

A auditoria agregada chama `production_integrity_check()` e valida vinte invariantes sem publicar identificadores de registros. O estado atual deve ser consultado em `CURRENT_STAGE.md` e no próprio Supabase.

### Leitura autenticada

A infraestrutura de smoke autenticado está integrada, mas permanece desativada até provisionamento autorizado de cinco identidades técnicas exclusivas.

## 13. Prontidão funcional

A arquitetura de backend está estabelecida. O ganho de confiança remanescente está em completar, operação por operação:

```text
perfil
→ superfície
→ handler
→ serviço
→ repositório
→ tabela/RPC/Edge Function
→ RLS
→ persistência
→ releitura
→ conflito
→ compensação
```

Após a reconciliação pós-PR #162, a matriz executável não registra lacuna técnica aberta, mas ainda possui operações `partial` que exigem provas controladas.

## 14. Contingência

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

Exige novo build, decisão registrada e plano de retorno. Não apaga o Supabase e não sincroniza dados locais automaticamente.

## 15. Invariantes

- Supabase é canônico em Production;
- nenhum segredo administrativo no frontend;
- nenhuma migration remota automática por mero merge;
- nenhum seed implícito;
- Auth e RLS obrigatórios;
- autoria e auditoria nas mutações;
- histórico de migrations não é editado diretamente;
- dump SQL não é publicado;
- PR/Preview não altera baseline de Production;
- conta Auth de equipe é resolvida por lookup exato, não catálogo global;
- identidade institucional de escola não é sintetizada;
- edição patrimonial rápida permanece versionada e auditada;
- exportação não é liberada antes da auditoria inicial.

## 16. Verificação

```bash
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
npm run typecheck:database
npm run test:e2e
npm run test:mobile
npm run build:vercel
```

## 17. Referências

- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`testing.md`](testing.md);
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../reference/SUPABASE_INTEGRATION_AUDIT.md`](../reference/SUPABASE_INTEGRATION_AUDIT.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md).
