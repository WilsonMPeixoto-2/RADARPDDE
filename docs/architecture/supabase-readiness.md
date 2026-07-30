# Arquitetura de persistência e prontidão Supabase

**Estado:** vigente; conexão de Production ativa  
**Atualizado em:** 30 de julho de 2026

## 1. Estado arquitetural

```text
Frontend
→ serviços de aplicação e UnitOfWork
→ contrato único de persistência
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — contingência explícita
→ Supabase Auth + PostgREST + PostgreSQL + RLS + RPCs + auditoria
```

Production opera com `SupabaseRepository`. O modo local permanece para desenvolvimento controlado e contingência por novo build.

## 2. Runtime

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

Projeto autorizado:

```text
scnryinorqeucbfkioxo
```

A configuração pública contém somente URL e chave publicável. `service_role`, `sb_secret_*`, senha de banco e tokens administrativos são proibidos no navegador, GitHub, logs e artefatos.

## 3. Componentes

- interface: DOM, mensagens, modais e renderização;
- serviços: configuração, diretórios, escolas, avaliações, pendências, notas, inventário e auditoria;
- unidade de trabalho: captura estado anterior, persiste e compensa falhas;
- porta de estado: traduz frontend e snapshot canônico;
- repositórios: `load`, `save`, `remove`, `exportSnapshot`, `restoreSnapshot`, `healthCheck` e `capabilities`.

O adaptador Supabase acrescenta paginação, lotes, concorrência otimista, RPCs, Auth, RLS e importação controlada.

## 4. Modelo e autorização

Entidades funcionais são normalizadas; JSONB permanece para estruturas variáveis e é validado no navegador e PostgreSQL.

Tabelas expostas possuem RLS. `anon` não recebe dados institucionais.

A autorização combina perfil ativo, `cre_scope`, carteira principal, exceções por escola, leitura/escrita, Inventário, governança SME e privilégios técnicos.

A simulação visual não altera JWT.

## 5. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ Edge Function autenticada
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

Credenciais administrativas permanecem server-side. Operações usam idempotência e compensação.

## 6. Operações atômicas

RPCs e transações evitam persistência parcial em competências, escolas, verificações, pendências, contatos, notas, bens, Gestão de Equipe, importação e rollback.

Conflitos de `row_version` não são sobrescritos silenciosamente.

## 7. Migrations

Existem 25 versões correspondentes entre GitHub e Supabase Production.

```text
arquivo: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A reconciliação alterou somente o histórico. O teste `tests/unit/sme-migration-history-alignment.test.js` protege identificador e hash.

Antes de migration futura:

1. `migration list --linked`;
2. teste SME;
3. reset local;
4. pgTAP e lint;
5. tipos;
6. backup/restauração descartáveis;
7. dry-run;
8. rollback;
9. aprovação no mesmo SHA.

## 8. Backup e restauração

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

O gate usa duas pilhas locais descartáveis. Gera dumps de papéis, schema, dados e histórico, restaura em transação e compara fingerprints.

Evidência inicial:

```text
run: 30537076528
schema: true
data: true
migrations: true
```

O CI publica somente `evidence.json`. Não utiliza segredo, `--linked` ou Production.

## 9. Importação e rollback

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
→ rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador.

## 10. Resiliência e UX

Falhas são convertidas em categorias estáveis. Formulários, foco e `aria-live` são preservados. Retry automático limita-se a leituras seguras; escritas não são repetidas silenciosamente.

## 11. Rollback emergencial de runtime

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

Exige novo build, decisão registrada, diagnóstico, evidência e plano de retorno. Não apaga nem altera o Supabase e não sincroniza automaticamente estados locais.

## 12. Invariantes de segurança

- Production normal usa Supabase;
- acesso remoto exige configuração explícita;
- nenhum segredo no frontend ou repositório;
- nenhuma migration remota automática;
- nenhum seed implícito;
- Auth e RLS obrigatórios;
- autoria e auditoria nas mutações;
- histórico não editado diretamente;
- dumps SQL não publicados em artefatos.

## 13. Estado de hardening

Comprovado:

- acesso anônimo bloqueado;
- RLS por perfil e escopo;
- chave publicável no frontend;
- Edge Function protegida por JWT;
- operações compostas auditáveis;
- histórico alinhado;
- Node `24.x` fixado;
- gate remoto perfil/viewport;
- backup/restauração equivalentes;
- deployments automáticos bloqueados.

A checagem de credenciais comprometidas é restrita ao plano Pro ou superior e não integra o gate no plano Free atual.

Pendente antes da liberação oficial:

- homologação manual dos relatórios Excel;
- Advisors quando aplicável;
- UAT;
- polimento editorial/visual;
- decisão formal de release.

## 14. Verificação obrigatória

```bash
npm run test:readiness
node --test tests/unit/sme-migration-history-alignment.test.js
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

## 15. Referências

- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`testing.md`](testing.md);
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`../audits/2026-07-30-backup-restore-disposable.md`](../audits/2026-07-30-backup-restore-disposable.md).
