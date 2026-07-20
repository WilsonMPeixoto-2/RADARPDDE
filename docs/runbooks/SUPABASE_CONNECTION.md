# Runbook — conexão controlada com Supabase

## Situação atual

A preparação pré-Supabase está versionada, mas a conexão remota ainda não foi executada. Production permanece em `localStorage`, com URL e chave vazias, repositório Supabase desabilitado e `productionActivationApproved: false`.

O frontend usa um contrato único de persistência, serviços de aplicação e gate de autenticação. A infraestrutura inclui:

- `LocalStorageRepository` operacional e `SupabaseRepository` preparado;
- paginação, lotes, `row_version`, auditoria, snapshots, staging, reconciliação e rollback;
- Auth, RLS e quatro perfis funcionais: Controlador, Assistente de Verbas Federais, SME (Gestão) e Equipe de Inventário;
- `technical_admin` como papel técnico separado dos perfis operacionais;
- Gestão de Equipe plena pela Assistente, inclusive convite, conta, vínculo, edição e desativação de acesso;
- Edge Function protegida `team-account-management` e RPCs administrativas restritas ao `service_role`;
- o conjunto versionado contém atualmente **14** migrations;
- pgTAP, lint, tipos gerados e gates E2E;
- workflows manuais e separados para preflight, aplicação experimental e Preview Vercel prebuilt.

Não preencha URL/chave nem ative flags sem cumprir este runbook.

## Pré-requisitos

- autorização expressa para criar ou selecionar um projeto experimental exclusivo;
- projeto `radar-pdde-preview` ou branch de banco isolada, preferencialmente em `sa-east-1`;
- branch Git e commit candidatos identificados;
- `SUPABASE_ACCESS_TOKEN` e senha do banco somente em segredos do ambiente autorizado;
- URL e chave **publishable** somente para o Preview;
- `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` somente em GitHub Secrets;
- nenhuma chave `service_role`, `sb_secret_*`, senha ou token administrativo no frontend;
- snapshot local exportado e validado antes de qualquer importação.

## 1. Criar o projeto exclusivo

Não reutilize projetos de outras aplicações. O projeto deve ser claramente identificado como experimental do RADAR e permanecer separado de Production.

A criação do projeto não autoriza migrations, importação, Vercel ou Production. Cada gate exige autorização própria.

## 2. Executar somente o preflight não destrutivo

Acione manualmente `.github/workflows/supabase-remote-validation.yml`. O workflow:

1. vincula o `project_ref` autorizado;
2. registra o histórico remoto;
3. executa dry-run;
4. verifica capacidades disponíveis sem instalar objetos;
5. publica evidências sem credenciais.

Comandos canônicos:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

O preflight não aplica migrations, não executa seed e não pressupõe que o schema exista.

## 3. Aplicar as migrations somente em alvo descartável

Os arquivos em `supabase/migrations` são a única fonte da ordem. Não mantenha lista manual duplicada.

Depois de revisar o preflight, acione `.github/workflows/supabase-remote-post-apply.yml` com a confirmação:

```text
APLICAR_13_MIGRATIONS_EM_AMBIENTE_DESCARTAVEL
```

O workflow repete o dry-run e, apenas depois, executa:

```bash
supabase db push --linked
supabase migration list --linked
```

O workflow nunca usa `--include-seed`. Em seguida ele:

- confirma exatamente as 13 migrations;
- verifica `pgcrypto`, `pg_jsonschema` e as RPCs de Gestão de Equipe;
- executa lint e pgTAP;
- regenera e compara os tipos TypeScript;
- executa Security e Performance Advisors;
- implanta a Edge Function `team-account-management` com JWT obrigatório;
- publica apenas evidências técnicas sem segredos.

## 4. Homologar perfis e segregação de funções

Criar identidades separadas para:

- Controlador;
- Assistente de Verbas Federais;
- SME (Gestão);
- Equipe de Inventário;
- Administrador técnico.

A interface operacional mostra apenas os quatro primeiros. `technical_admin` não deve herdar a interface da Assistente.

Comprovar:

- usuário anônimo não acessa dados ou RPCs institucionais;
- usuário sem perfil ativo recebe acesso negado;
- Controlador vê e altera somente sua carteira e exceções autorizadas;
- Assistente acessa toda a 4ª CRE e administra controladores, carteiras e Inventário;
- SME acompanha dados gerenciais e não altera o diretório da equipe da CRE;
- Inventário atua no escopo patrimonial autorizado;
- Administrador técnico gerencia infraestrutura, perfis, escopos e auditoria, sem operação cotidiana;
- somente um perfil permanece ativo por usuário;
- exclusão física continua excepcional e técnica.

## 5. Homologar Gestão de Equipe e Auth

No perfil Assistente, validar o ciclo completo:

1. cadastrar controlador com nome e e-mail institucional;
2. receber convite por e-mail;
3. confirmar criação em Auth;
4. confirmar `controllers.user_id` e `user_profiles.profile_id = 'controller'`;
5. atribuir escolas;
6. editar nome/e-mail e confirmar sincronização da conta;
7. desativar controlador escolhendo substituto;
8. confirmar redistribuição, perfil inativo, acesso bloqueado e histórico preservado;
9. repetir os mesmos efeitos para integrante da Equipe de Inventário;
10. confirmar que repetição idempotente não cria conta duplicada.

Falha da RPC após convite deve remover a conta recém-criada. Falha da desativação deve restaurar o acesso. Credenciais administrativas permanecem apenas na Edge Function.

## 6. Validar o repositório sem conectar a interface

Com cliente técnico controlado, validar:

- saúde do projeto;
- leitura paginada acima de mil registros;
- escrita em lotes;
- RLS positiva e negativa por perfil;
- `row_version` e `OPTIMISTIC_CONFLICT`;
- RPCs compostas de notas, escolas, pendências e Gestão de Equipe;
- exportação de snapshot remoto;
- banco remoto vazio sem seed implícito;
- logs administrativos e auditoria técnica.

## 7. Importar uma cópia controlada

Seguir `SUPABASE_MIGRATION_AND_ROLLBACK.md`:

1. exportar snapshot canônico;
2. validar estrutura e referências;
3. gerar plano e dry-run;
4. carregar em staging por `import_id`;
5. retomar lotes de forma idempotente;
6. reconciliar staging;
7. promover atomicamente;
8. reconciliar destino;
9. comprovar rollback.

A importação não ocorre no navegador e nunca usa o seed local como dado institucional.

## 8. Configurar somente o Preview da Vercel

Cadastrar estas variáveis apenas no ambiente Preview:

```bash
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://PROJECT_REF.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICAVEL
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

Acione `.github/workflows/vercel-preview-prebuilt.yml` com:

```text
PUBLICAR_PREVIEW_PREBUILT
```

O workflow deve executar `vercel pull --environment=preview`, `vercel build`, confirmar `dist/radar-build-manifest.json` e publicar apenas com `vercel deploy --prebuilt`. Ele não aceita `--prod`.

No manifesto, confirmar:

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Production continua gerando:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

Não promova o Preview conectado para Production.

## 9. Executar gates

```bash
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run bootstrap:auth-fixtures
npm run check:auth-fixtures
npm run supabase:test:db
npm run supabase:lint:db
npm run test:e2e
```

Confirmar também:

- `npm run check:supabase-final` aprovado;
- tipos remotos idênticos ao arquivo versionado;
- Advisors analisados;
- Edge Function exige JWT;
- chave secreta ausente do bundle e dos logs;
- desktop, Android e iPhone sem regressão funcional;
- Production inalterada.

## 10. Critérios para preparar Production

A ativação futura de `supabase-production` exige simultaneamente:

- homologação funcional dos quatro perfis;
- validação do papel técnico separado;
- migração reconciliada;
- rollback comprovado;
- backup e restauração testados;
- Advisors tratados;
- MFA e política de segurança definidas;
- CI verde no mesmo commit implantado;
- autorização funcional e técnica específica.

Sem `productionActivationApproved: true`, a aplicação deve permanecer em modo local e fail-closed.
