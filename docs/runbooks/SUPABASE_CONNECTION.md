# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Orientar validação, diagnóstico, contingência e recuperação da conexão entre o RADAR PDDE e o Supabase autorizado.

Este runbook não autoriza migration, importação, alteração de Auth/RLS, deployment de Edge Function ou release. Cada operação remota depende de escopo e autorização expressos.

## 2. Baseline

```text
projeto: scnryinorqeucbfkioxo
nome: RADAR PDDE 2026
estado: ACTIVE_HEALTHY
região: sa-east-1
PostgreSQL: 17.6.1.147
runtime Production: supabase-production
repositório normal: SupabaseRepository
contingência: LocalStorageRepository por novo build
migrations em Production: 26
migrations versionadas no PR nº 154: 27
closing_competence: 2026-12
app_config.row_version: 20
Edge Function: team-account-management v103, ACTIVE, JWT obrigatório
Supabase JS: 2.110.9
Supabase CLI: 2.110.0
auditoria de integridade: healthy, totalIssues=0, schemaVersion=1
Node.js: 24.x
```

O conjunto versionado contém atualmente **27** migrations. Production permanece com **26 migrations aplicadas** até a aprovação e a execução controlada da migration `202608050001_school_assignment_authorization`. O histórico oficial reconhecido pela Supabase CLI é a fonte de verdade para conferir versões aplicadas e sua ordem efetiva; não manter uma segunda lista manual de aplicação.

A migration `202608040001_production_integrity_monitor` está aplicada em Production. A RPC pública é `SECURITY INVOKER`, a implementação privilegiada permanece em `radar_private`, e a execução é concedida somente ao `service_role`.

A migration `202608050001_school_assignment_authorization` está versionada no PR nº 154 e ainda não foi aplicada em Production. Ela bloqueia a alteração de `schools.controller_id` por usuários autenticados sem papel `federal_assistant` ou `technical_admin`, preservando manutenção administrativa autorizada.

Última publicação funcional relacionada à conexão:

```text
PR: 150
merge commit: 2ae98da8a547d46cd7e8e64977b855b1a90a2495
Vercel deployment: dpl_BvrxJUahgWpaRbtn6Y5FrfzknKAw — READY
Edge Function: team-account-management v103 — ACTIVE — verify_jwt=true
```

## 3. Regras permanentes

- não reutilizar projeto de outra aplicação;
- não inserir chave administrativa no frontend, GitHub, logs ou artefatos;
- usar somente chave publicável no navegador;
- não confundir Preview com Production;
- manter um perfil institucional ativo por usuário;
- preservar perfis históricos inativos quando houver troca autorizada de função;
- não aplicar seed automaticamente em banco remoto;
- não alterar schema com histórico divergente;
- não interpretar contingência local como sincronização;
- não publicar dumps SQL como evidência;
- não executar operação remota apenas porque um teste local passou;
- não realizar merge ou mudança de Production sem autorização expressa;
- não reutilizar contas pessoais como identidades técnicas de monitoramento.

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

Confirmar scripts e bundles reproduzíveis, migrations aplicadas em ordem, pgTAP, tipos, Auth local, RLS positiva e negativa e Edge Function quando aplicável.

## 6. Validação remota somente leitura

Antes de diagnosticar falha funcional, confirmar:

1. projeto correto e `ACTIVE_HEALTHY`;
2. deployment de Production e SHA;
3. `radar-build-manifest.json`;
4. `dataMode = supabase-production`;
5. sessão e papel efetivo;
6. `cre_scope` e escopos escolares;
7. contagem e histórico de migrations;
8. Edge Functions ativas, versão e JWT;
9. logs de Auth, API, Postgres e Edge Function;
10. resultado da auditoria de integridade;
11. incidentes automáticos abertos pelo monitor.

Não imprimir chaves ou payloads pessoais nos registros de diagnóstico.

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

A presença do comando neste runbook não constitui autorização. Aplicação real exige branch e PR específicos, histórico alinhado, reset local, pgTAP, lint, tipos, backup/restauração, análise do SQL, plano de reversão, janela operacional e autorização expressa.

Migration SME canônica:

```text
20260728182226_sme_access_governance
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Seguir [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 8. Monitor geral de Production

Workflows:

```text
.github/workflows/production-system-smoke.yml
.github/workflows/production-data-integrity.yml
```

O monitor geral executa após `push` na `main`, a cada hora e manualmente. Verifica commit publicado quando a mudança exige novo artefato web, manifesto, ambiente, modo de dados, shell, gate de autenticação, assets, bloqueio anônimo, preflight das Edge Functions e gestão automática de incidente.

A auditoria de dados executa a cada seis horas e manualmente. Usa conexão PostgreSQL administrativa efêmera com os secrets existentes do Supabase CLI, chama `public.production_integrity_check()` e falha quando o contrato, o status ou o total agregado estiverem incorretos. Nenhum dado pessoal é publicado.

Falha de monitor deve ser investigada pelo componente exato antes de assumir indisponibilidade geral do Supabase.

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
6. confirmar aplicação inerte até autorização;
7. diferenciar sessão, perfil, escopo e leitura de dados.

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

### Preflight

- origem oficial deve retornar sucesso;
- origem indevida deve ser rejeitada;
- ausência de variável opcional não pode eliminar a allowlist canônica;
- `OPTIONS` não depende de autenticação do usuário;
- requisição funcional exige JWT.

### Cadastro, edição ou desativação

1. confirmar papel autorizado;
2. validar diretório e e-mail;
3. verificar conta e vínculo histórico;
4. procurar conta Auth única pelo e-mail normalizado antes de convidar;
5. reutilizar conta existente somente quando não houver perfil ativo conflitante;
6. executar Auth Admin;
7. executar RPC transacional;
8. compensar etapa anterior se a posterior falhar;
9. confirmar retorno funcional ao frontend;
10. recarregar e confirmar persistência;
11. verificar log administrativo.

### Transição entre perfis

No percurso autorizado entre Inventário e Controlador:

- o perfil de origem deve estar inativo antes da ativação do destino;
- a mesma conta Auth pode ser reutilizada, sem novo convite;
- deve existir no máximo um perfil institucional ativo para o usuário;
- registros históricos inativos devem ser preservados;
- e-mail e metadados devem ser atualizados para o perfil de destino;
- o estado de bloqueio anterior deve ser restaurado se a RPC falhar;
- vínculo ativo conflitante deve retornar `ACCOUNT_CONFLICT` com orientação funcional;
- o gateway deve ler `FunctionsHttpError.context` e preservar `code`, `message` e `details`;
- conflito funcional não pode ser exibido como indisponibilidade geral.

Quando `user_id` do diretório estiver nulo, aceitar somente correspondência única e compatível em `user_profiles`. Quando também não houver vínculo histórico no perfil de destino, procurar a conta Auth pelo e-mail antes de convidar. Rejeitar ambiguidade e nunca reenviar convite sem essa verificação.

### Redistribuição da carteira escolar

- a redistribuição funcional deve ocorrer pela Gestão de Equipe;
- o perfil Controlador pode editar os dados cadastrais das escolas da própria carteira, mas não pode alterar `controller_id`;
- a interface deve manter o seletor de controlador imutável para o Controlador;
- o serviço deve rejeitar a alteração antes de persistir;
- o banco deve bloquear a tentativa mesmo quando a rota genérica for chamada diretamente;
- somente `federal_assistant`, `technical_admin` ou manutenção administrativa autorizada podem alterar a atribuição.

## 11. Smoke autenticado de leitura

O PR nº 148 prepara cobertura somente leitura para os cinco perfis. Enquanto não houver identidades técnicas exclusivas e autorização específica:

- manter o workflow remoto desabilitado;
- não reutilizar contas reais;
- não criar contas automaticamente em PR;
- não habilitar service role no navegador ou no Playwright;
- não registrar screenshots, vídeos, traces ou credenciais de Production;
- permitir somente autenticação, leitura e a RPC `current_app_role`.

A ativação exige cinco contas técnicas, segredo protegido, variável de habilitação, execução manual aprovada e execução agendada aprovada.

## 12. Backup e recuperação

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O gate usa duas pilhas descartáveis, compara schema, dados, Auth e migrations, publica somente `evidence.json` e não substitui política institucional de retenção remota.

## 13. Diagnóstico funcional por camadas

Quando botão ou fluxo não funcionar, verificar:

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
| convite diz conta existente | conta Auth pelo e-mail, perfis ativos e histórico |
| troca de função é recusada | perfil anterior ainda ativo ou vínculo conflitante |
| interface diz indisponibilidade em conflito | payload de `FunctionsHttpError.context` no gateway |
| Controlador consegue trocar a própria carteira | seletor cadastral, serviço e trigger de `controller_id` |
| grava e volta ao estado anterior | persistência, conflito e releitura |
| Excel não gera | competência, manifesto, ExcelJS, template e download |
| monitor abre incidente | job e componente exato antes de rollback |
| auditoria retorna inconsistência | código da invariante e contagem agregada antes de consultar registros |

## 15. Contingência local

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

Exige novo build controlado. Não apaga o Supabase, não sincroniza estado local de volta e não deve ser ativado antes do diagnóstico.

## 16. Critério de encerramento

A investigação termina quando a causa foi identificada, o fluxo autorizado funciona de ponta a ponta, o indevido permanece bloqueado, o dado persiste e é relido, a falha parcial não deixa resíduo, existe regressão e a evidência corresponde ao SHA e ao ambiente corretos.
