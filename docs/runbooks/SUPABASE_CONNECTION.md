# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Orientar validação, diagnóstico, contingência e recuperação da conexão entre o RADAR PDDE e o Supabase autorizado.

Este runbook não autoriza migration, importação, alteração de Auth/RLS, deployment de Edge Function, criação de contas técnicas ou release. Cada operação remota depende de escopo e autorização expressos.

## 2. Baseline

```text
GitHub main: 8f2a267cceb00959c0e6eeee4d9b883c7212e17a
Vercel Production: dpl_GrBhxgRquJNcq9DG7cCn1JQ1oXnQ — READY
projeto Supabase: scnryinorqeucbfkioxo
estado: ACTIVE_HEALTHY
região: sa-east-1
PostgreSQL: 17.6.1.147
runtime Production: supabase-production
repositório normal: SupabaseRepository
migrations em Production: 26
closing_competence: 2026-12
app_config.row_version: 20
Edge Function: team-account-management v103, ACTIVE, JWT obrigatório
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
auditoria de integridade: healthy, totalIssues=0, schemaVersion=1
Node.js: 24.x
```

O histórico oficial reconhecido pela Supabase CLI é a fonte de verdade para migrations aplicadas. A função pública de integridade é `SECURITY INVOKER`, a implementação privilegiada permanece em `radar_private`, e a execução é concedida somente ao `service_role`.

## 3. Regras permanentes

- não inserir chave administrativa no frontend, GitHub, logs ou artefatos;
- usar somente chave publicável no navegador;
- não confundir Preview com Production;
- manter um perfil institucional ativo por usuário;
- preservar perfis históricos inativos em troca autorizada de função;
- não aplicar seed automaticamente em banco remoto;
- não alterar schema com histórico divergente;
- não publicar dumps SQL como evidência;
- não executar operação remota apenas porque o teste local passou;
- não realizar merge ou mudança de Production sem autorização expressa;
- não reutilizar contas pessoais como identidades técnicas de monitoramento;
- não considerar workflow integrado como monitor ativado sem credenciais e execução real.

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

O build público pode conter URL e chave publicável. São proibidos `service_role`, `sb_secret_*`, senha de banco, token administrativo e credencial Auth Admin.

## 5. Validação estática e local

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

Confirmar scripts e bundles reproduzíveis, migrations, pgTAP, tipos, Auth local, RLS positiva e negativa e Edge Function quando aplicável.

## 6. Validação remota somente leitura

Antes de diagnosticar falha funcional, confirmar:

1. projeto correto e `ACTIVE_HEALTHY`;
2. deployment de Production e SHA;
3. `radar-build-manifest.json`;
4. `dataMode = supabase-production`;
5. sessão e papel efetivo;
6. `cre_scope` e escopos escolares;
7. histórico de migrations;
8. Edge Functions ativas, versão e JWT;
9. logs de Auth, API, Postgres e Edge Function;
10. auditoria de integridade;
11. incidentes automáticos abertos.

Não imprimir chaves ou payloads pessoais.

## 7. Histórico e aplicação de migrations

### Consultas e dry-run

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

### Aplicação real, somente em janela autorizada

```bash
supabase db push --linked
```

A presença do comando neste runbook não constitui autorização. Aplicação real exige PR específico, histórico alinhado, reset local, pgTAP, lint, tipos, backup/restauração, análise do SQL, plano de reversão e autorização expressa.

Migration SME canônica:

```text
20260728182226_sme_access_governance
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

## 8. Monitor geral de Production

Workflows:

```text
.github/workflows/production-system-smoke.yml
.github/workflows/production-data-integrity.yml
```

O monitor geral executa após `push` na `main`, a cada hora e manualmente. Verifica manifesto, ambiente, modo de dados, shell, gate de autenticação, assets, bloqueio anônimo, preflight das Edge Functions e incidentes.

### Política de commit publicada pelo PR nº 153

- quando uma entrada real do artefato web mudou, o monitor exige exatamente o novo SHA e aguarda propagação;
- quando não houve mudança web, o monitor valida o manifesto íntegro atualmente publicado sem fixar SHA;
- o modo sem SHA fixo não pode ser combinado com `--expected-commit`;
- todas as demais verificações continuam obrigatórias.

Essa política evita falsos incidentes quando a Vercel publica automaticamente uma mudança de CI ou documentação durante a execução do monitor. O run de `push` nº `31054708691` aprovou o comportamento. A issue nº 152 permanece encerrada.

A auditoria de dados executa a cada seis horas e manualmente, usa conexão administrativa efêmera e publica somente contagens sanitizadas.

## 9. Auth e perfis

Papéis vigentes:

- `controller`;
- `federal_assistant`;
- `sme_management`;
- `inventory`;
- `technical_admin`.

Diagnóstico de login:

1. verificar sessão;
2. confirmar `user_profiles.active`;
3. confirmar `profiles.active`;
4. confirmar `current_app_role()`;
5. verificar `cre_scope`, `controller_id` e `user_school_scopes`;
6. diferenciar sessão, perfil, escopo e leitura de dados.

A simulação visual do administrador técnico não altera JWT.

## 10. Gestão de Equipe

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Estado remoto:

```text
status: ACTIVE
version: 103
verify_jwt: true
Supabase JS: 2.110.9
```

### Cadastro, edição ou desativação

1. confirmar papel autorizado;
2. validar diretório e e-mail;
3. verificar conta e vínculo histórico;
4. procurar conta Auth única pelo e-mail normalizado antes de convidar;
5. reutilizar conta existente somente sem perfil ativo conflitante;
6. executar Auth Admin;
7. executar RPC transacional;
8. compensar etapa anterior se a posterior falhar;
9. confirmar retorno funcional ao frontend;
10. recarregar e confirmar persistência;
11. verificar log administrativo.

### Transição entre perfis

- o perfil de origem deve estar inativo antes da ativação do destino;
- a mesma conta Auth pode ser reutilizada sem novo convite;
- deve existir no máximo um perfil institucional ativo;
- históricos inativos devem ser preservados;
- o bloqueio anterior deve ser restaurado se a RPC falhar;
- vínculo conflitante deve retornar `ACCOUNT_CONFLICT`;
- o gateway deve preservar `code`, `message` e `details`;
- conflito funcional não pode virar indisponibilidade geral.

## 11. Smoke autenticado de leitura

O PR nº 148 integrou:

```text
.github/workflows/production-authenticated-read.yml
playwright.production-authenticated-read.config.js
tests/e2e/production-authenticated-read.spec.js
tests/support/production-authenticated-read.js
```

O monitor previsto cobre os cinco perfis e seis jornadas de leitura. Seu estado é:

```text
workflow integrado: sim
execução remota habilitada: não
contas técnicas: não provisionadas
segredo RADAR_PRODUCTION_READ_ACCOUNTS_JSON: não criado
variável RADAR_PRODUCTION_AUTH_READ_ENABLED: não habilitada
execução autenticada real: não realizada
```

Enquanto não houver autorização:

- manter o workflow remoto desabilitado;
- não reutilizar contas reais;
- não criar contas automaticamente;
- não habilitar service role no navegador;
- não registrar screenshots, vídeos, traces ou credenciais;
- permitir somente autenticação, leitura e `current_app_role`;
- não promover cobertura da matriz.

A ativação exige cinco contas técnicas, segredo protegido, variável de habilitação, execução manual aprovada e execução agendada aprovada.

## 12. Backup e recuperação

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O gate usa duas pilhas descartáveis, compara schema, dados, Auth e migrations e não substitui política institucional de retenção remota.

## 13. Diagnóstico funcional por camadas

```text
controle visível e habilitado
→ handler executado
→ console e payload
→ serviço de aplicação
→ repositório escolhido
→ requisição HTTP
→ CORS, JWT e status
→ RLS ou RPC
→ alteração no banco
→ resposta ao frontend
→ renderização
→ releitura após refresh
```

Classificar a fronteira exata antes de propor correção.

## 14. Falhas comuns

| Sintoma | Verificação inicial |
|---|---|
| login não avança | sessão, perfil, papel e bootstrap |
| tela sem dados | escopo, RLS, entidade e PostgREST |
| botão não faz nada | handler, capacidade e erro JavaScript |
| operação retorna CORS | preflight, origem e versão da função |
| convite diz conta existente | conta Auth, perfis ativos e histórico |
| troca de função é recusada | perfil anterior ativo ou vínculo conflitante |
| interface diz indisponibilidade em conflito | `FunctionsHttpError.context` no gateway |
| grava e volta ao estado anterior | persistência, conflito e releitura |
| monitor abre incidente após mudança sem frontend | política de SHA e corrida de deployment |
| auditoria retorna inconsistência | código da invariante e contagem agregada |

## 15. Contingência local

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

Exige novo build controlado. Não apaga o Supabase, não sincroniza estado local de volta e não deve ser ativado antes do diagnóstico.

## 16. Critério de encerramento

A investigação termina quando a causa foi identificada, o fluxo autorizado funciona de ponta a ponta, o indevido permanece bloqueado, o dado persiste e é relido, a falha parcial não deixa resíduo, existe regressão e a evidência corresponde ao SHA e ao ambiente corretos.
