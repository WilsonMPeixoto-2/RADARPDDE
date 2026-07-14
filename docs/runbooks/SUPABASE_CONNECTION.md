# Runbook — conexão futura com Supabase

## Situação atual

Não execute este runbook durante a etapa de preparação. A produção permanece em `localStorage`, com URL e chave vazias e feature flags desativadas.

O `app.js` já usa o gateway único, o repositório selecionado pela configuração e um gate que valida Auth, perfil e escopos antes de consultar dados institucionais. Tudo permanece inativo porque a configuração publicada está em modo local. **Ainda não se deve simplesmente preencher URL, chave e ligar as flags:** migrations, usuários, importação, reconciliação e homologação remota continuam obrigatórios.

A infraestrutura preparada já inclui:

- exportação e restauração bidirecional do estado `radar_pdde_*`;
- repositório Supabase com paginação integral e gravação em lotes;
- atualização otimista por `row_version`;
- reconciliação de snapshots;
- dez migrations, Auth local homologável, RLS, auditoria e importações;
- RPCs transacionais para nota, bem e verificação;
- Supabase CLI fixada, ambiente local, pgTAP e lint;
- tipos TypeScript gerados do schema;
- `@supabase/supabase-js` fixado e empacotado localmente;
- validação remota manual e não destrutiva preparada.

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
2. executa `db push --dry-run`;
3. executa lint remoto;
4. executa pgTAP em transações revertidas;
5. compara os tipos remotos com `src/types/database.types.ts`;
6. lista as branches disponíveis.

Esse workflow **não aplica migrations**.

## 2. Aplicar as migrations em ambiente descartável ou branch Supabase

Aplicar, nesta ordem:

1. `202607130001_core_schema.sql`;
2. `202607130002_auth_and_rls.sql`;
3. `202607130003_audit_and_import.sql`;
4. `202607130004_competence_bonus_deadline.sql`;
5. `202607130005_operational_context.sql`;
6. `202607130006_authorization_hardening.sql`;
7. `202607130007_configuration_audit_coverage.sql`;
8. `202607130008_atomic_invoice_operations.sql`;
9. `202607140009_verification_payload.sql`.
10. `20260714180621_preconnection_auth_and_api_grants.sql`.

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

## 7. Implementar a ponte definitiva em PR separado

Somente após o banco e os dados estarem homologados:

- substituir as chamadas diretas do `app.js` pelo contrato de repositório;
- remover seed automático e integração antiga com tabelas legadas;
- criar o cliente apenas quando `connectionEnabled` for verdadeiro;
- usar as RPCs para salvar e remover notas com efeitos relacionados;
- usar `updateWithVersion()` nas demais edições;
- mapear carregamento, gravação, conflito, sessão expirada e falha de rede;
- manter o adaptador local e `RadarStateBridge` como referência e rollback;
- criar testes de equivalência para cada mutação;
- comprovar que nenhuma tela, cálculo, botão ou fluxo mudou.

O cliente já está fixado e empacotado em `vendor/supabase-client.js`. A simples alteração de flags **não substitui a implementação da ponte**.

## 8. Configurar somente o Preview

Depois de o gateway definitivo estar implementado e testado, gerar a configuração apenas no ambiente de Preview:

```bash
RADAR_DATA_MODE=supabase-preview
RADAR_ENVIRONMENT=preview
RADAR_SUPABASE_REPOSITORY_ENABLED=true
RADAR_SUPABASE_URL=https://PROJECT_REF.supabase.co
RADAR_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICAVEL
npm run generate:runtime-config
```

O gerador aceita apenas valores públicos, rejeita chaves secretas e produz exclusivamente `window.RADAR_PDDE_RUNTIME_INPUT`. Nunca gerar esse arquivo com `service_role`, `sb_secret_*`, senha de banco ou token administrativo.

## 9. Executar validações

```bash
npm run test:readiness
npm run supabase:start
npm run supabase:reset
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
