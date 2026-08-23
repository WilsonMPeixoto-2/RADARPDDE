# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 23 de agosto de 2026

## 1. Objetivo

Orientar validação, diagnóstico, contingência e recuperação da conexão entre RADAR PDDE e Supabase autorizado.

Este runbook não autoriza, por si só, migration, importação, alteração de Auth/RLS, deployment de Edge Function ou release. Cada operação remota depende do escopo aprovado.

## 2. Baseline

Consultar [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md) e revalidar remotamente antes de operação dependente do ambiente.

Por compatibilidade com o verificador de readiness, este runbook mantém um único espelho machine-readable da contagem versionada: O conjunto versionado contém atualmente **39** migrations. A lista e a ordem continuam sendo obtidas do diretório `supabase/migrations/` e do histórico do CLI, nunca de uma segunda lista manual.

Contratos estáveis:

```text
Production data mode: supabase-production
repositório Production: SupabaseRepository
fallback local em Production: proibido (fail-closed)
Supabase JS: versão fixada em package.json
Supabase CLI: versão fixada em package.json
Node.js: 24.x
```

## 3. Regras permanentes

- não reutilizar projeto de outra aplicação;
- não inserir chave administrativa no frontend, GitHub, logs ou artefatos;
- usar somente chave publicável no navegador;
- não confundir Preview com Production;
- manter um perfil institucional ativo por usuário;
- preservar perfis históricos inativos em troca autorizada de função;
- não aplicar seed implicitamente em banco remoto;
- não alterar schema com histórico divergente;
- não permitir que falha de configuração de Production seja convertida em repositório local;
- não publicar dumps SQL como evidência;
- não executar operação remota apenas porque teste local passou;
- não reutilizar contas pessoais/operacionais como identidades técnicas de monitoramento.

## 4. Configuração por ambiente

### Preview

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

Preview também pode usar modo local explicitamente isolado quando não houver projeto Supabase de desenvolvimento.

### Production

```text
RADAR_DATA_MODE=supabase-production
RADAR_ENVIRONMENT=production
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=true
```

O build público pode conter URL e chave publicável. São proibidos credenciais administrativas, senha de banco e tokens administrativos no artefato. Se a configuração Production não puder ser validada, a aplicação operacional deve permanecer indisponível em vez de cair para dados locais.

## 5. Validação estática/local

```bash
npm ci
npm run test:readiness
npm run check:runtime-config
npm run build:vercel
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
```

Confirmar scripts e bundles reproduzíveis, migrations em ordem, pgTAP, tipos, Auth local, RLS positiva/negativa e Edge Function quando aplicável.

## 6. Validação remota somente leitura

Antes de diagnosticar falha funcional, confirmar:

1. projeto correto e estado saudável;
2. deployment de Production e SHA;
3. `radar-build-manifest.json`;
4. `dataMode = supabase-production`;
5. sessão e papel efetivo;
6. `cre_scope` e escopos escolares;
7. histórico de migrations;
8. Edge Functions ativas e JWT;
9. logs de Auth/API/Postgres/Edge Function;
10. resultado da auditoria de integridade;
11. incidentes automáticos abertos.

Não imprimir chaves ou payloads pessoais.

## 7. Migrations

### Consulta/dry-run

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

### Aplicação real

```bash
supabase db push --linked
```

A presença do comando não constitui autorização. Aplicação real exige branch/PR, histórico alinhado, reset, pgTAP, lint, tipos, backup/restauração, análise do SQL, reversão e escopo autorizado.

Seguir [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).
