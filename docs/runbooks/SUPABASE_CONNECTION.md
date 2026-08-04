# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 4 de agosto de 2026

## 1. Objetivo

Orientar validação, operação, diagnóstico, contingência e recuperação da conexão entre o RADAR PDDE e o projeto Supabase autorizado.

Este runbook não autoriza mudança de schema, importação, reparo de migrations ou release.

## 2. Situação de referência

```text
projeto: scnryinorqeucbfkioxo
estado: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
repositório normal: SupabaseRepository
contingência: LocalStorageRepository por novo build
migrations correspondentes: 26
Node: 24.x
```

O conjunto versionado contém atualmente **26** migrations. O histórico oficial reconhecido pela Supabase CLI é a fonte para conferir versões aplicadas e sua ordem efetiva; não manter uma segunda lista manual de aplicação.

Contagens operacionais são mutáveis e devem ser consultadas no ambiente com data de corte.

## 3. Regras permanentes

- não reutilizar projeto de outra aplicação;
- não inserir chave administrativa no frontend, bundle, GitHub, log ou artefato;
- usar somente chave publicável no navegador;
- não promover Preview como Production;
- manter um perfil institucional ativo por usuário;
- não reintroduzir massa `HML-*` na base operacional;
- não criar fallback paralelo sem falha comprovada;
- não aplicar seed automaticamente em banco vazio;
- não alterar schema com histórico divergente;
- não interpretar contingência local como sincronização;
- não publicar dumps SQL como evidência do CI.

## 4. Configuração por ambiente

### Preview

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

### Production

```text
RADAR_DATA_MODE=supabase-production
RADAR_ENVIRONMENT=production
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=true
```

O build público pode conter URL e chave publicável. São proibidos `service_role`, `sb_secret_*`, senha de banco, token Vercel e credencial administrativa.

## 5. Validação da conexão

### Código e runtime

```bash
npm ci
npm run test:readiness
npm run check:runtime-config
npm run build:vercel
```

Confirmar ambiente, `dataMode`, `activeRepository`, autorização de Production e ausência de segredo.

### Banco local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
```

### Ambiente remoto

Confirmar projeto, saúde, Auth, RLS, bloqueio anônimo, perfil, `cre_scope`, perfil único, JWT da Edge Function e Advisors quando aplicável.

## 6. Contrato de migrations

Os comandos canônicos são:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

O terceiro comando é destrutivo e não constitui autorização automática. O `db push --linked` real exige histórico alinhado, migration aprovada em reset/pgTAP/lint/tipos, backup, rollback, janela e autorização.

Migration SME:

```text
arquivo: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A reconciliação não alterou schema, dados ou RLS. Antes de migration futura, seguir [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 7. Perfis

- Controlador: carteira principal e colaboração na própria CRE;
- Assistente: acompanhamento transversal e Gestão de Equipe;
- Gestão SME: leitura gerencial restritiva;
- Inventário: operação patrimonial da própria CRE;
- Administrador técnico: infraestrutura, perfis, escopos e auditoria.

Simulação visual não altera JWT.

## 8. Gestão de contas

Antes de implantar `team-account-management`:

1. definir origem CORS exata;
2. manter JWT obrigatório;
3. validar papel no servidor;
4. testar convite, edição, desativação, idempotência e compensação;
5. revisar logs sem dados sensíveis;
6. executar Advisors.

A credencial Auth Admin permanece server-side.

## 9. Recurso condicionado ao plano

A checagem de credenciais comprometidas é oferecida pelo Supabase apenas em plano Pro ou superior. O projeto opera no plano Free e não possui autorização de despesa. Portanto, a ausência dessa função não bloqueia a liberação atual. Reavaliar se houver mudança de plano.

## 10. Gate remoto de perfis

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

O gate serve o código do PR, usa Supabase descartável, cria identidades efêmeras e valida cinco papéis em desktop, Android e iPhone. Não usa Production.

## 11. Backup e recuperação

Gate lógico:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

O procedimento:

1. inicia origem descartável;
2. aplica migrations e seed;
3. gera dumps de papéis, schema, dados e histórico;
4. restaura em segunda pilha isolada;
5. compara fingerprints;
6. publica somente `evidence.json`;
7. encerra os ambientes.

Evidência ampliada:

```text
run: 30538395958
schema: true
data: true
auth: true
migrations: true
```

O backup lógico anterior à ativação, `PROD-ACTIVATION-BACKUP-20260721`, deve permanecer preservado conforme política do projeto. O gate descartável comprova o procedimento, mas não substitui retenção e exportação remota periódica.

## 12. Homologação do deployment

No SHA candidato, comprovar:

- manifesto correto;
- login obrigatório;
- aplicação inerte antes do Auth;
- chave pública sem segredo;
- anônimo sem dados;
- jornadas por perfil;
- desktop, Android e iPhone;
- ausência de erro fatal e overflow;
- logs sem erro inesperado de RLS;
- deployment correspondente ao SHA.

## 13. Rollback emergencial

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

O novo build local não apaga o banco, não sincroniza estado de volta ao Supabase e exige comunicação, diagnóstico e plano de retorno.

## 14. Diagnóstico

Quando a aplicação não carregar dados:

1. confirmar projeto e deployment;
2. verificar manifesto;
3. validar sessão e perfil;
4. validar `cre_scope` e exceções;
5. inspecionar PostgREST e RLS;
6. consultar logs de Auth, API, Postgres e Edge Function;
7. classificar conectividade, autorização, dado ausente ou conflito;
8. não acionar fallback antes do diagnóstico.

## 15. Critério de encerramento

A validação termina quando:

- runtime e projeto estão corretos;
- Auth e RLS funcionam por perfil;
- nenhum segredo foi exposto;
- migrations não apresentam desvio;
- backup/restauração aplicáveis estão aprovados;
- evidências estão ligadas ao SHA;
- pendências de release permanecem explícitas;
- conectividade não é confundida com mudança funcional.
