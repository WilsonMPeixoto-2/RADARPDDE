# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 30 de julho de 2026

## 1. Objetivo

Orientar validação, operação, diagnóstico, contingência e recuperação da conexão entre o RADAR PDDE e o projeto Supabase autorizado.

Este runbook não autoriza mudança de schema, reparo de migrations, importação de dados ou release. Essas ações exigem procedimentos próprios.

## 2. Situação de referência

```text
projeto: scnryinorqeucbfkioxo
estado: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
repositório normal: SupabaseRepository
contingência: LocalStorageRepository por novo build controlado
```

O conjunto versionado contém atualmente **25** migrations. O histórico remoto está reconciliado com os arquivos de `supabase/migrations`, inclusive para `20260728182226_sme_access_governance.sql`.

Contagens de escolas, vínculos, usuários e registros são dados operacionais mutáveis. Para diagnóstico, devem ser consultadas no ambiente e registradas com data de corte; não usar números antigos deste runbook como invariantes.

## 3. Regras permanentes

- não reutilizar projeto Supabase de outra aplicação;
- não inserir chave administrativa no frontend, bundle, GitHub ou log;
- usar somente chave publicável no navegador;
- não promover Preview como artefato de Production;
- manter um perfil institucional ativo por usuário;
- não reintroduzir massa `HML-*` na base operacional;
- não criar fallback paralelo sem falha comprovada;
- não aplicar seed automaticamente em banco vazio;
- não executar alteração de schema quando o histórico de migrations estiver divergente;
- não interpretar contingência local como sincronização bidirecional.

## 4. Configuração por ambiente

### 4.1 Preview

```text
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

### 4.2 Production

```text
RADAR_DATA_MODE=supabase-production
RADAR_ENVIRONMENT=production
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=true
```

O build público pode conter URL e chave publicável. São proibidos:

- `service_role`;
- `sb_secret_*`;
- senha de banco;
- token da Vercel;
- credencial administrativa da Edge Function.

## 5. Validação da conexão

### 5.1 Código e runtime

```bash
npm ci
npm run test:readiness
npm run check:runtime-config
npm run build:vercel
```

Confirmar no manifesto:

- ambiente esperado;
- `dataMode` correto;
- `activeRepository = supabase`;
- autorização de Production somente no build de Production;
- ausência de segredo.

### 5.2 Banco local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
```

### 5.3 Ambiente remoto

Confirmar:

- projeto correto;
- saúde dos serviços;
- Auth operacional;
- RLS ativa;
- usuário anônimo sem dados institucionais;
- perfil e `cre_scope` coerentes;
- sem múltiplos perfis ativos;
- Edge Function exigindo JWT;
- Advisors revisados quando houver alteração relevante.

## 6. Contrato de migrations

Os arquivos em `supabase/migrations` são a fonte versionada do código; a ordem efetivamente reconhecida pelo ambiente remoto deve ser confirmada pelo histórico oficial da CLI.

Comandos de inspeção e aplicação controlada:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

O terceiro comando não é uma autorização automática. O `db push --linked` real somente pode ser executado quando:

- histórico local e remoto estiver reconciliado;
- migration nova tiver passado por reset local, pgTAP, lint e tipos;
- o dry-run não indicar desvio inesperado;
- backup e rollback estiverem aprovados;
- janela e responsáveis estiverem definidos.

### 6.1 Migration SME reconciliada

```text
arquivo local: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
```

Integridade comprovada:

```text
comprimento: 1.411 caracteres
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A reconciliação:

- utilizou o mecanismo oficial de `migration repair`;
- não reaplicou nem reverteu o SQL funcional;
- não alterou schema, dados ou políticas RLS;
- deixou 25 versões correspondentes;
- deixou o `db push --linked --dry-run` sem migration pendente;
- está protegida pelo teste `tests/unit/sme-migration-history-alignment.test.js`;
- possui evidência em `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.

Antes de qualquer migration futura, seguir [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 7. Perfis funcionais

### 7.1 Controlador

- inicia pela própria carteira;
- colabora nas escolas da mesma CRE;
- preserva responsável principal e autoria real;
- não acessa outra CRE sem exceção explícita.

### 7.2 Assistente

- acompanha transversalmente a CRE;
- administra Controladores e Inventário;
- executa ações autorizadas e auditadas;
- usa Edge Function protegida para contas da equipe.

### 7.3 Gestão SME

- consulta identificação e bonificação nas visões definidas;
- consulta Pendências sem mutações operacionais;
- recebe Registros Internos apenas do próprio UUID;
- permanece limitada por interface, serviço e RLS.

### 7.4 Inventário

- acessa a superfície patrimonial da própria CRE;
- lê escolas e vínculos necessários;
- cria e atualiza bens autorizados;
- conclui inventariação;
- não recebe módulos não patrimoniais.

### 7.5 Administrador técnico

- infraestrutura, perfis, escopos, importação e auditoria;
- não equivale à Assistente;
- simulação visual não altera JWT.

## 8. Gestão de contas

Antes de implantar ou atualizar `team-account-management`:

1. definir `RADAR_ALLOWED_ORIGIN` com a origem exata;
2. rejeitar origem diferente;
3. manter JWT obrigatório;
4. confirmar validação de papel no servidor;
5. testar convite, edição, desativação, idempotência e compensação;
6. revisar logs sem dados sensíveis;
7. executar Advisors.

A credencial Auth Admin permanece exclusivamente server-side.

## 9. Proteção contra senhas vazadas

`Leaked Password Protection` está desabilitada na data de corte e constitui bloqueador de liberação oficial.

Antes do release oficial e antes de nova publicação de funcionalidade privilegiada:

1. habilitar a proteção no projeto remoto;
2. registrar evidência da configuração;
3. validar login e redefinição de senha;
4. confirmar que nenhum fluxo de teste depende de senha comprometida conhecida;
5. atualizar `CURRENT_STAGE.md`.

O fato de deployments anteriores existirem não transforma a pendência em requisito cumprido.

## 10. Homologação do deployment

No SHA candidato, comprovar:

- manifesto `supabase-production`;
- tela de login obrigatória;
- aplicação inerte antes da autenticação;
- chave pública sem segredo;
- anônimo com zero acesso institucional;
- jornadas autenticadas por perfil;
- desktop, Android e iPhone;
- ausência de erro fatal e overflow;
- logs sem erro de RLS inesperado;
- deployment correspondente ao SHA aprovado.

O gate versionado para a matriz remota é `.github/workflows/gate-remoto-perfis-viewports.yml`. Ele serve o código do próprio PR, gera o manifesto de Preview local e utiliza identidades efêmeras no Supabase autorizado.

## 11. Rollback emergencial de frontend

Definir:

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

O deployment seguinte deve produzir:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

Esse rollback:

- não apaga ou reverte o banco;
- não sincroniza alterações locais de volta ao Supabase;
- exige comunicação de contingência;
- exige plano para restaurar a conexão remota;
- deve ser removido por novo build controlado após solução.

## 12. Diagnóstico

Quando a aplicação não carrega dados:

1. confirmar projeto e deployment;
2. verificar manifesto do runtime;
3. validar sessão Auth e perfil ativo;
4. validar `cre_scope` e exceções escolares;
5. inspecionar resposta PostgREST e política RLS;
6. consultar logs de Auth, API, Postgres e Edge Function;
7. distinguir falha de conectividade, autorização, dado ausente e conflito de versão;
8. não acionar fallback local antes de classificar o incidente.

## 13. Backup e recuperação

O backup lógico anterior à ativação está associado a:

```text
PROD-ACTIVATION-BACKUP-20260721
```

Ele deve ser preservado conforme a política do projeto. Antes da liberação oficial, backup e restauração precisam ser testados em ambiente descartável com reconciliação do resultado.

## 14. Critério de encerramento

Uma validação de conexão termina somente quando:

- runtime e projeto estão corretos;
- Auth e RLS funcionam por perfil;
- nenhum segredo foi exposto;
- migrations não apresentam desvio novo;
- evidências estão ligadas ao SHA;
- pendências de release continuam explícitas;
- nenhuma mudança funcional foi inferida apenas pela conectividade.
