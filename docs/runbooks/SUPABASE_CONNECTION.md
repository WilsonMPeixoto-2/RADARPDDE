# Runbook — conexão futura com Supabase

## Situação atual

Não execute este runbook durante a etapa de preparação. A produção permanece em `localStorage`, com URL e chave vazias e feature flags desativadas.

O `app.js` já usa o gateway único, o repositório selecionado pela configuração e um gate que valida Auth, perfil e escopos antes de consultar dados institucionais. Tudo permanece inativo porque a configuração publicada está em modo local. **Ainda não se deve simplesmente preencher URL, chave e ligar as flags:** migrations, usuários, importação, reconciliação e homologação remota continuam obrigatórios.

A infraestrutura preparada já inclui:

- exportação e restauração bidirecional do estado `radar_pdde_*`;
- repositório Supabase com paginação integral e gravação em lotes;
- atualização otimista por `row_version`;
- reconciliação de snapshots;
- o conjunto versionado contém atualmente **12** migrations, além de Auth local homologável, RLS, auditoria e importações;
- RPCs transacionais para nota, bem e verificação;
- Supabase CLI fixada, ambiente local, pgTAP e lint;
- tipos TypeScript gerados do schema;
- `@supabase/supabase-js` fixado e empacotado localmente;
- preflight remoto não destrutivo separado da aplicação experimental;
- build Vercel versionado, com artefatos distintos para produção local e Preview Supabase.

## Pré-requisitos para iniciar a conexão experimental

- projeto ou branch Supabase criado e ativo;
- branch Git isolada;
- autorização expressa para a conexão experimental;
- URL e chave **publishable** disponíveis;
- `SUPABASE_ACCESS_TOKEN` e senha do banco apenas nos segredos do ambiente autorizado;
- nenhuma chave `service_role`, `sb_secret_`, senha ou token administrativo no frontend;
- Preview do Vercel separado da produção;
- snapshot local exportado e validado.

## 1. Validar o projeto remoto sem aplicar alterações

O workflow manual `.github/workflows/supabase-remote-validation.yml` deve ser executado primeiro. Ele:

1. vincula o `project_ref` autorizado;
2. registra `supabase migration list --linked`;
3. executa `supabase db push --linked --dry-run`;
4. verifica, sem instalar, a disponibilidade de `pgcrypto`, `pg_jsonschema` e `pgtap`;
5. registra as branches disponíveis, quando o recurso estiver habilitado;
6. publica as evidências do plano como artefato da Action.

Esse workflow **não aplica migrations, não executa seed, não altera o schema e não testa objetos que ainda não existem**.

## 2. Aplicar as migrations em ambiente descartável ou branch Supabase

Os arquivos existentes em `supabase/migrations` são a única fonte de ordem. Não copie nem mantenha uma segunda lista manual. Antes de aplicar, executar:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

Depois de aprovar o plano, executar somente contra projeto de desenvolvimento ou branch de banco descartável:

```bash
supabase db push --linked
supabase migration list --linked
```

O workflow manual `.github/workflows/supabase-remote-post-apply.yml` automatiza essa fase e exige a confirmação textual `APLICAR_12_MIGRATIONS_EM_AMBIENTE_DESCARTAVEL`. Ele nunca usa `--include-seed`.

Após a aplicação:

- listar migrations executadas;
- executar Security e Performance Advisors;
- confirmar RLS ativa em todas as tabelas expostas;
- confirmar ausência de políticas para `anon`;
- confirmar apenas um perfil ativo por usuário;
- confirmar que escopo somente leitura não concede escrita;
- regenerar e comparar os tipos TypeScript;
- executar pgTAP e lint;
- validar as RPCs `save_invoice_with_effects` e `delete_invoice_with_effects`;
- confirmar triggers de auditoria em parâmetros, cadastros, vínculos e dados operacionais.
- confirmar que `anon` não lê tabelas nem executa RPCs institucionais e que `authenticated` continua sujeito a RLS.

O workflow também confirma que o histórico remoto corresponde exatamente às 12 migrations versionadas, executa lint, pgTAP, comparação de tipos e Advisors. A Data API expõe apenas `public`; o RADAR não depende de `graphql_public` nem de `pg_graphql`.

## 3. Criar usuários de teste

Criar usuários separados para:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

Vincular cada usuário em `user_profiles`. Controladores precisam de `controller_id`; integrantes do inventário precisam de `inventory_member_id`.

## 4. Configurar escopos

- associar escolas ao controlador por `schools.controller_id`;
- usar `user_school_scopes` para exceções;
- marcar `can_write` explicitamente;
- comprovar que `can_write = false` concede apenas leitura;
- conceder escopo ao inventariador que precise registrar o primeiro bem de uma escola;
- não conceder perfil técnico administrativo a usuário operacional;
- manter apenas um vínculo ativo em `user_profiles` por usuário.

## 5. Validar o repositório sem conectar a interface

Nesta fase, `config.runtime.js` continua integralmente em modo local. A validação ocorre por cliente injetado em ambiente técnico controlado.

```javascript
const client = RadarSupabaseClient.createClient(projectUrl, publishableKey);
const repository = new RadarSupabaseRepository.SupabaseRepository({
  client,
  pageSize: 500,
  writeBatchSize: 250
});
const health = await repository.healthCheck();
```

Validar:

- leitura paginada acima de mil registros;
- escrita em lotes;
- leitura com cada usuário de teste;
- negativas de RLS;
- gravação nas tabelas permitidas;
- atualização concorrente por `updateWithVersion()`;
- execução das RPCs transacionais;
- exclusão física restrita ao Administrador técnico;
- exportação de snapshot remoto;
- ausência de seed automático;
- ordem relacional de restauração;
- logs operacionais e auditoria técnica.

## 6. Exportar e importar uma cópia controlada

Seguir `SUPABASE_MIGRATION_AND_ROLLBACK.md`:

1. exportar o estado atual com `RadarStateBridge.exportLegacySnapshot()`;
2. resolver advertências e rejeições;
3. registrar `import_id`;
4. importar em ordem relacional por backend controlado;
5. exportar o destino;
6. reconciliar origem e destino;
7. executar restauração simulada com `dryRun: true`;
8. preservar snapshot local e metadados laterais.

A importação não deve ocorrer no navegador com credencial administrativa.

## 7. Confirmar o gateway definitivo antes da conexão

O frontend já passa pelo contrato único de repositório e pelos serviços de aplicação. Antes de conectar qualquer projeto remoto, confirmar no HEAD candidato que:

- o `app.js` não contém cliente, seed, tabelas ou sincronização Supabase legados;
- o cliente só é criado quando `connectionEnabled` for verdadeiro;
- banco remoto vazio nunca recebe seed implícito do navegador;
- notas usam as RPCs atômicas e as demais edições preservam `row_version`;
- carregamento, gravação, conflito, sessão expirada e falha de rede são mapeados;
- o adaptador local e `RadarStateBridge` continuam disponíveis como referência e rollback;
- os testes de equivalência cobrem cada mutação integrada;
- nenhuma tela, cálculo, botão ou regra de negócio mudou.

O cliente está fixado e empacotado em `vendor/supabase-client.js`. Alterar flags sem executar os gates deste runbook continua proibido.

## 8. Configurar somente o Preview

Depois de o gateway definitivo estar implementado e testado, cadastrar estas variáveis **somente no ambiente Preview da Vercel**:

```bash
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://PROJECT_REF.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICAVEL
RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false
```

O `vercel.json` executa `npm run build:vercel` e publica somente `dist`. Esse build copia exclusivamente os ativos públicos, gera `dist/config.runtime.js` e cria `dist/radar-build-manifest.json` sem URL ou chave. O gerador aceita apenas valores públicos e rejeita `service_role`, `sb_secret_*`, senha de banco e token administrativo.

Para reproduzir o artefato de Preview localmente com valores fictícios, use as mesmas variáveis e execute:

```bash
npm run build:vercel
```

Confirme no artefato:

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

O alvo real `VERCEL_ENV=production` bloqueia um artefato `supabase-preview`, mesmo que as variáveis tenham sido cadastradas incorretamente.

### Comprovar a produção local

As variáveis de produção permanecem ausentes ou explicitamente locais. O mesmo build deve produzir:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

Não promova um Preview conectado para produção. Produção e Preview são builds independentes, derivados do mesmo código e validados por seus respectivos manifestos públicos.

## 9. Executar validações

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

Confirmar:

- cliente criado somente no Preview;
- produção continua em modo local;
- leitura e escrita respeitam RLS;
- usuário sem perfil recebe acesso negado;
- nenhum seed é executado automaticamente;
- banco vazio não causa inserção implícita;
- falha de rede não corrompe o estado;
- nenhuma coleção é truncada;
- resultados coincidem com o modo local;
- ida e volta preserva campos funcionais;
- metadados de reconciliação não ocultam alterações locais.

## 10. Homologar RLS, concorrência e transações

Executar todos os casos da matriz de permissões, incluindo tentativas negativas:

- duas sessões alterando o mesmo registro;
- incremento de `row_version`;
- retorno de `OPTIMISTIC_CONFLICT` para versão obsoleta;
- sessão expirada;
- usuário desativado;
- tentativa de dois perfis ativos;
- exceção somente leitura e exceção com escrita;
- criação, edição e remoção atômica de nota, bem e verificação;
- auditoria de inserção, alteração e exclusão.

## 11. Preparar produção

A promoção exige simultaneamente:

- autorização funcional e técnica;
- snapshot e backup preservados;
- reconciliação sem diferenças não justificadas;
- CI verde;
- Preview homologado;
- Advisors analisados;
- rollback testado;
- período de implantação definido.

O modo `supabase-production` exige `productionActivationApproved: true`. Sem essa autorização, a configuração retorna automaticamente para `local`.
