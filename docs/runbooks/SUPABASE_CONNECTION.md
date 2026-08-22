# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 22 de agosto de 2026

## 1. Objetivo

Orientar validação, diagnóstico, contingência e recuperação da conexão entre RADAR PDDE e Supabase autorizado.

Este runbook não autoriza, por si só, migration, importação, alteração de Auth/RLS, deployment de Edge Function ou release. Cada operação remota depende do escopo aprovado.

## 2. Baseline

Consultar [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md) e revalidar remotamente antes de operação dependente do ambiente.

Por compatibilidade com o verificador de readiness, este runbook mantém um único espelho machine-readable da contagem versionada: O conjunto versionado contém atualmente **36** migrations. A lista e a ordem continuam sendo obtidas do diretório `supabase/migrations/` e do histórico do CLI, nunca de uma segunda lista manual.

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

## 8. Remediações recentes incorporadas

As migrations correntes incluem, conforme `CURRENT_STAGE.md`:

- reparo de Auth legado e lookup seguro da equipe;
- remediação funcional de exercício, nota/bem e tentativa de pendência;
- integridade da identidade institucional das escolas;
- restrição explícita da reanálise de pendências a `controller`, `federal_assistant` e `technical_admin`;
- avaliação da consulta à Assessoria Contábil individualizada no payload de cada NF de serviço, com resumo mensal derivado;
- suporte à despesa provisória `a_identificar` e persistência atômica de análise/pendência;
- integridade transacional na mudança de Nota Fiscal permanente para natureza não patrimonial, com remoção versionada do bem derivado.

Não reaplicar SQL já aplicado para “corrigir” histórico.

## 9. Monitor geral de Production

Workflows principais:

```text
.github/workflows/production-system-smoke.yml
.github/workflows/production-data-integrity.yml
```

O monitor geral verifica publicação, manifesto, ambiente, shell, Auth gate, assets, bloqueio anônimo, preflight e incidentes.

A auditoria de dados chama `production_integrity_check()` e falha se contrato/status/contagens agregadas forem inválidos.

Falha de monitor deve ser classificada pelo componente exato antes de assumir indisponibilidade geral.

## 10. Auth e perfis

Papéis:

- `controller`;
- `federal_assistant`;
- `sme_management`;
- `inventory`;
- `technical_admin`.

Diagnóstico de login:

1. sessão;
2. `user_profiles.active`;
3. `profiles.active`;
4. `current_app_role()`;
5. `cre_scope`, vínculos e `user_school_scopes`;
6. gate da aplicação;
7. leitura de dados autorizada.

Simulação visual do administrador técnico não altera JWT.

## 11. Gestão de Equipe

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

### Preflight

- origem oficial deve passar;
- origem indevida deve ser rejeitada;
- `OPTIONS` não depende de autenticação do usuário;
- requisição funcional exige JWT.

### Lookup Auth

A função não deve percorrer o catálogo inteiro com `listUsers`.

Percurso vigente:

```text
e-mail normalizado
→ resolve_team_auth_user_id_by_email
→ getUserById
→ validação de vínculos ativos
→ reutilização ou convite conforme contrato
```

Mais de uma conta para o mesmo e-mail deve resultar em conflito, não escolha arbitrária.

### Cadastro/edição/desativação

1. confirmar papel autorizado;
2. validar diretório/e-mail;
3. verificar conta e vínculo histórico;
4. resolver conta por e-mail quando necessário;
5. rejeitar perfil ativo conflitante;
6. executar operação administrativa de Auth;
7. executar RPC transacional;
8. compensar etapa anterior se a posterior falhar;
9. preservar `code`, `message` e `details` até o frontend;
10. recarregar e confirmar persistência/log.

### Transição entre perfis

- perfil de origem inativo antes da ativação do destino;
- mesma conta pode ser reutilizada sem novo convite;
- máximo de um perfil institucional ativo;
- histórico inativo preservado;
- metadados e bloqueio coerentes;
- falha de RPC restaura estado anterior da conta;
- vínculo ativo conflitante retorna `ACCOUNT_CONFLICT`.

### Carteira escolar

- redistribuição ocorre pela Gestão de Equipe;
- Controlador pode editar cadastro autorizado, mas não `controller_id`;
- seletor deve permanecer imutável para Controlador;
- serviço e banco devem rejeitar tentativa indevida.

## 12. Escolas

Nova escola exige identidade institucional real. Verificar código institucional, designação, denominação, INEP, CNPJ, SICI, competência inicial e Controlador ativo.

Não aceitar geradores artificiais como identidade definitiva. Duplicidades normalizadas de INEP/CNPJ/SICI devem ser bloqueadas.

## 13. Patrimônio, notas e pendências

- `ASSET-02` usa `saveAssetWithLog`, versão esperada e log;
- alteração do vínculo de bem derivado em nota não pode deixar órfão;
- `pendency_attempts` deve acompanhar o agregado canônico da pendência;
- reanálise de pendência exige papel autenticado `controller`, `federal_assistant` ou `technical_admin`, além do escopo escolar aplicável;
- qualquer divergência observada após reload deve ser investigada no RPC/trigger/persistência antes de culpar a interface.

## 14. Exportações

A exportação deve passar por auditoria inicial via `AuditService` antes do download. Falha dessa auditoria bloqueia o arquivo. O filtro de compatibilidade impede duplicação do log legado.

## 15. Smoke autenticado de leitura

A infraestrutura do PR #148 está integrada, porém a execução remota permanece desativada até provisionamento autorizado de cinco identidades técnicas exclusivas.

Enquanto isso:

- não reutilizar contas reais;
- não criar contas automaticamente em PR;
- não expor credencial administrativa;
- não registrar screenshots/traces/vídeos/credenciais;
- não afirmar cobertura real de Production para essas seis operações.

## 16. Backup e recuperação

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O gate usa pilhas descartáveis e não substitui política institucional de retenção/DR.

## 17. Diagnóstico funcional por camadas

```text
controle visível/habilitado
→ handler
→ serviço
→ repositório
→ requisição
→ CORS/JWT
→ RLS/RPC/trigger
→ banco
→ resposta
→ renderização
→ releitura
```

Classificar a primeira fronteira divergente antes de propor correção.

## 18. Falhas comuns

| Sintoma | Verificação inicial |
|---|---|
| login não avança | sessão, perfil, papel e bootstrap |
| tela sem dados | escopo, RLS, entidade e PostgREST |
| botão não faz nada | handler, capacidade e erro JS |
| CORS | preflight, origem e função publicada |
| conta já existe | lookup exato, perfis ativos e histórico |
| troca de função recusada | vínculo anterior ativo/conflitante |
| conflito aparece como indisponibilidade | payload do erro no gateway |
| Controlador troca carteira | interface, serviço e trigger |
| grava e volta | persistência, conflito e releitura |
| Excel não gera | competência, manifesto, motor, template e auditoria |
| monitor abre incidente | componente exato do job |
| integridade acusa problema | invariante/contagem antes de consultar registros |

## 19. Contingência e falha de configuração

Production opera em **fail-closed**. Não existe mais sinal de rollback que transforme um deployment Production em `LocalStorageRepository`.

Em caso de indisponibilidade da configuração ou conexão institucional:

1. manter o ambiente Production bloqueado para operação;
2. diagnosticar Vercel, runtime config, Auth e Supabase;
3. usar ambiente local/Preview isolado apenas para diagnóstico;
4. publicar novo artefato Production somente após correção e validação.

O modo local continua existindo para desenvolvimento e testes, mas não é contingência operacional de Production e nunca sincroniza seu estado de volta ao banco institucional.

## 20. Encerramento de investigação

A investigação termina quando causa/fronteira foi identificada, percurso autorizado funciona, indevido permanece bloqueado, dado persiste/recarrega, falha parcial não deixa resíduo, existe regressão e a evidência corresponde ao SHA/ambiente correto.
