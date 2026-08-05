# Arquitetura de persistência e prontidão Supabase

**Estado:** vigente; Production ativa  
**Atualizado em:** 5 de agosto de 2026

## 1. Baseline

```text
Supabase: scnryinorqeucbfkioxo
estado: ACTIVE_HEALTHY
região: sa-east-1
PostgreSQL: 17.6.1.147
migrations em Production: 25
closing_competence: 2026-12
app_config.row_version: 20
team-account-management: v95, ACTIVE, JWT obrigatório
```

O PR nº 141 propõe uma 26ª migration, mas permanece aberto em rascunho e não altera Production.

## 2. Arquitetura

```text
Frontend
→ serviços de aplicação e UnitOfWork
→ RepositoryContract
   ├── SupabaseRepository — canônico em Preview/Production
   └── LocalStorageRepository — desenvolvimento e contingência por novo build
→ Auth + PostgREST + RLS + RPC + Edge Function
→ PostgreSQL 17
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

- CORS fail-closed;
- allowlist institucional;
- preflight independente de autenticação e operação funcional com JWT;
- validação do papel da Assistente;
- vínculo Auth histórico recuperado somente quando inequívoco;
- idempotência;
- redistribuição de carteira;
- desativação lógica;
- compensação em falha parcial.

A correção integral foi publicada pelo PR nº 138.

## 7. Operações compostas

RPCs e transações protegem:

- exercício e competências;
- escola e programas;
- verificação e log;
- pendência, tentativa e reanálise;
- nota e bem vinculado;
- Gestão de Equipe;
- importação, promoção e rollback.

Conflitos de `row_version` não devem ser sobrescritos silenciosamente.

## 8. Migrations

Production possui 25 versões correspondentes.

```text
migration SME: 20260728182226_sme_access_governance
alias derivado: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Antes de migration futura:

1. histórico local/remoto;
2. reset local;
3. pgTAP e lint;
4. tipos;
5. backup/restauração;
6. dry-run;
7. plano de reversão;
8. autorização para aplicação.

## 9. Backup e restauração

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

Duas pilhas descartáveis comprovam equivalência de schema, dados, Auth e migrations. O CI publica apenas evidência sanitizada e não usa Production.

## 10. Importação

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

## 11. Monitoramento contínuo

O workflow de Production verifica:

- SHA publicado;
- manifesto e modo de dados;
- shell e assets;
- gate de autenticação;
- bloqueio anônimo;
- preflight de Edge Functions;
- incidentes automáticos.

Esse monitor cobre disponibilidade e publicação, não todas as jornadas autenticadas.

## 12. Prontidão funcional

A arquitetura está pronta para a próxima fase quando cada ação crítica tiver mapeamento:

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
→ compensação
```

Lacunas prioritárias:

- matriz funcional completa;
- smoke autenticado de leitura em Production;
- provas controladas de escrita;
- conflito de versão na interface;
- integridade contínua dos dados;
- confirmação da regra de programas SME.

## 13. Contingência

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

Exige novo build, decisão registrada e plano de retorno. Não apaga o banco e não sincroniza dados locais automaticamente.

## 14. Invariantes

- Supabase é canônico em Production;
- nenhum segredo administrativo no frontend;
- nenhuma migration remota automática;
- nenhum seed implícito;
- Auth e RLS obrigatórios;
- autoria e auditoria nas mutações;
- histórico de migrations não é editado diretamente;
- dump SQL não é publicado;
- PR aberto não altera o baseline remoto;
- merge e aplicação remota exigem autorização expressa.

## 15. Verificação

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

## 16. Referências

- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`testing.md`](testing.md);
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../reference/SUPABASE_INTEGRATION_AUDIT.md`](../reference/SUPABASE_INTEGRATION_AUDIT.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md).
