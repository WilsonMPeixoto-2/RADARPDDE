# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Orientar validação, diagnóstico, contingência e recuperação da conexão entre o RADAR PDDE e o Supabase autorizado.

Este runbook não autoriza migration, importação, alteração de Auth/RLS, deployment de Edge Function ou release.

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
migrations em Production: 25
closing_competence: 2026-12
app_config.row_version: 20
Edge Function: team-account-management v95, ACTIVE, JWT obrigatório
Node.js: 24.x
```

O PR nº 141 contém uma 26ª migration somente em sua branch. Não usar essa contagem para Production antes de integração e aplicação autorizada.

## 3. Regras permanentes

- não reutilizar projeto de outra aplicação;
- não inserir chave administrativa no frontend, GitHub, logs ou artefatos;
- usar somente chave publicável no navegador;
- não confundir Preview com Production;
- manter um perfil institucional ativo por usuário;
- não aplicar seed automaticamente em banco remoto;
- não alterar schema com histórico divergente;
- não interpretar contingência local como sincronização;
- não publicar dumps SQL como evidência;
- não executar operação remota apenas porque um teste local passou;
- não realizar merge ou mudança de Production sem autorização expressa.

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
```

Supabase descartável:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
```

Confirmar:

- scripts e bundles reproduzíveis;
- migrations aplicadas em ordem;
- pgTAP verde;
- tipos alinhados;
- Auth local e perfis efêmeros;
- RLS positiva e negativa;
- Edge Function exercitada quando aplicável.

## 6. Validação remota somente leitura

Antes de diagnosticar falha funcional, confirmar:

1. projeto correto e `ACTIVE_HEALTHY`;
2. deployment de Production e SHA;
3. `radar-build-manifest.json`;
4. `dataMode = supabase-production`;
5. sessão e papel efetivo;
6. `cre_scope` e escopos escolares;
7. contagem e histórico de migrations;
8. Edge Functions ativas e JWT;
9. logs de Auth, API, Postgres e Edge Function;
10. incidentes automáticos abertos pelo monitor.

Não imprimir chaves ou payloads pessoais nos registros de diagnóstico.

## 7. Monitor geral de Production

Workflow:

```text
.github/workflows/production-system-smoke.yml
```

Execução:

- após `push` na `main`;
- a cada hora;
- manualmente.

Verifica:

- commit publicado;
- manifesto, ambiente e modo de dados;
- shell e gate de autenticação;
- assets locais;
- bloqueio de leitura anônima;
- preflight das Edge Functions catalogadas;
- gestão automática de incidente.

Falha do monitor deve ser investigada antes de assumir indisponibilidade do Supabase; o resumo identifica o componente que falhou.

## 8. Auth e perfis

Papéis vigentes:

- `controller`;
- `federal_assistant`;
- `sme_management`;
- `inventory`;
- `technical_admin`.

Diagnóstico de login:

1. verificar sessão existente;
2. confirmar `user_profiles.active`;
3. confirmar perfil em `profiles.active`;
4. confirmar papel retornado por `current_app_role()`;
5. verificar `cre_scope`, `controller_id` e `user_school_scopes`;
6. confirmar que a aplicação permanece inerte até autorização;
7. diferenciar falha de sessão, perfil, escopo e leitura de dados.

A simulação visual do administrador técnico não altera JWT.

## 9. Gestão de Equipe

Fluxo:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Estado remoto:

```text
status: ACTIVE
version: 95
verify_jwt: true
```

### Preflight

- origem oficial deve retornar sucesso;
- origem indevida deve ser rejeitada;
- ausência de variável opcional não pode eliminar a allowlist canônica;
- resposta `OPTIONS` não deve depender de autenticação do usuário;
- requisição funcional posterior exige JWT.

### Operações

Para cadastro, edição ou desativação:

1. confirmar papel `federal_assistant` ou técnico autorizado;
2. validar diretório e e-mail;
3. verificar conta existente e vínculo histórico;
4. executar Auth Admin;
5. executar RPC transacional;
6. compensar etapa anterior se a posterior falhar;
7. confirmar retorno ao frontend;
8. recarregar e confirmar persistência;
9. verificar log administrativo.

### Diagnóstico de vínculo

Quando `user_id` do diretório estiver nulo:

- procurar vínculo coerente em `user_profiles`;
- aceitar somente correspondência única e compatível;
- rejeitar ambiguidade;
- não reenviar convite para conta existente sem verificação.

## 10. Contrato de migrations

Comandos de inspeção:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

Aplicação real exige:

- branch e PR específicos;
- histórico alinhado;
- reset local;
- pgTAP, lint e tipos;
- backup/restauração descartáveis;
- análise do SQL;
- plano de reversão;
- janela operacional;
- autorização expressa.

Migration SME canônica:

```text
20260728182226_sme_access_governance
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Seguir [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 11. Backup e recuperação

Gate:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

Comando local controlado:

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O gate:

1. inicia pilha de origem;
2. aplica migrations e seed;
3. cria identidades Auth efêmeras;
4. gera dumps lógicos;
5. restaura em segunda pilha;
6. compara schema, dados, Auth e migrations;
7. publica somente `evidence.json`;
8. remove os ambientes.

Isso prova o procedimento técnico, não substitui política institucional de retenção remota.

## 12. Diagnóstico funcional por camadas

Quando botão ou fluxo não funcionar, não concluir imediatamente que “o Supabase caiu”. Verificar na ordem:

```text
controle visível e habilitado
→ handler realmente executado
→ erro no console
→ payload e competência
→ serviço de aplicação
→ repositório escolhido
→ requisição HTTP
→ CORS, JWT e status
→ política RLS/RPC
→ alteração no banco
→ resposta ao frontend
→ renderização
→ releitura após refresh
```

Classificar a fronteira exata antes de propor correção.

## 13. Falhas comuns

| Sintoma | Verificação inicial |
|---|---|
| tela de login não avança | sessão, perfil, papel e bootstrap |
| tela carrega sem dados | escopo, RLS, entidade do bootstrap e PostgREST |
| botão não faz nada | handler, capacidade por perfil e erro de JavaScript |
| operação retorna CORS | preflight, origem e versão da Edge Function |
| convite diz conta existente | vínculo Auth histórico e `user_profiles` |
| grava e volta ao estado anterior | persistência, conflito de versão e releitura |
| Excel não gera | competência, manifesto, ExcelJS, template e download |
| monitor abre incidente | consultar job e componente exato antes de rollback |

## 14. Contingência local

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

Exige novo build controlado. Não apaga o Supabase, não sincroniza estado local de volta e não deve ser ativado antes do diagnóstico.

## 15. Critério de encerramento

A investigação termina quando:

- componente causador foi identificado;
- fluxo autorizado funciona de ponta a ponta;
- fluxo indevido permanece bloqueado;
- dado persiste e é relido;
- falha parcial não deixou resíduo;
- regressão foi criada;
- documentação foi atualizada;
- evidência está ligada ao SHA e ao ambiente corretos.
