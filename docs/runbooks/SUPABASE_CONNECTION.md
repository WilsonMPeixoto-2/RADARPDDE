# Runbook — conexão futura com Supabase

## Situação atual

Não execute este runbook durante a etapa de preparação. A produção permanece em `localStorage`, com URL e chave vazias e feature flags desativadas.

## Pré-requisitos

- projeto Supabase criado e em estado ativo;
- branch de integração isolada;
- migrations revisadas e aplicadas em ambiente de desenvolvimento;
- URL do projeto e chave **publishable** disponíveis;
- nenhuma chave `service_role`, `sb_secret_`, senha ou token administrativo no frontend;
- Preview do Vercel separado de produção;
- snapshot local exportado e validado;
- autorização expressa para iniciar a conexão experimental.

## 1. Aplicar migrations

Aplicar, nesta ordem:

1. `202607130001_core_schema.sql`;
2. `202607130002_auth_and_rls.sql`;
3. `202607130003_audit_and_import.sql`.

Após a aplicação:

- listar migrations executadas;
- verificar advisors de segurança e desempenho;
- confirmar que RLS está ativa nas tabelas;
- confirmar que não há políticas para o papel `anon`;
- gerar tipos TypeScript apenas como artefato de conferência, mesmo que o frontend atual permaneça JavaScript.

## 2. Criar usuários de teste

Criar usuários separados para:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

Vincular cada usuário em `user_profiles`. Controladores precisam de `controller_id`; integrantes de inventário precisam de `inventory_member_id`.

## 3. Configurar escopos

- associar escolas ao controlador por `schools.controller_id`;
- usar `user_school_scopes` apenas para exceções;
- marcar `can_write` explicitamente;
- não conceder perfil técnico administrativo a usuário operacional.

## 4. Configurar somente o Preview

Em uma branch específica, alterar a fonte publicada de configuração para:

```javascript
{
  dataMode: DATA_MODES.SUPABASE_PREVIEW,
  productionActivationApproved: false,
  features: {
    supabaseRepositoryEnabled: true,
    legacyAppBridgeEnabled: false
  },
  supabase: {
    url: 'URL_DO_PROJETO',
    publishableKey: 'CHAVE_PUBLICÁVEL'
  }
}
```

A primeira ativação mantém `legacyAppBridgeEnabled: false`. Isso permite validar o novo repositório isoladamente antes de permitir que o fluxo legado grave remotamente.

## 5. Validar infraestrutura

Executar:

```bash
npm run check
npm run test:unit
npm run check:supabase
npm run test:e2e
```

Confirmar:

- cliente criado somente no Preview;
- produção continua em modo local;
- leitura respeita RLS;
- usuário sem perfil recebe acesso negado;
- nenhum seed é executado automaticamente;
- nenhuma tabela é preenchida apenas por estar vazia.

## 6. Importar snapshot

Seguir `SUPABASE_MIGRATION_AND_ROLLBACK.md`. A importação deve usar `import_id` único e gerar relatório de reconciliação.

## 7. Ativar a ponte legada no Preview

Somente após a reconciliação aprovada:

```javascript
legacyAppBridgeEnabled: true
```

Reexecutar toda a regressão e homologar as operações de criação, alteração, reanálise, retificação, inventário e exportação.

## 8. Homologar RLS

Executar os casos da matriz de permissões, incluindo tentativas negativas. Uma tela ocultar botão não é prova de segurança; a operação deve ser negada pelo banco.

## 9. Preparar produção

A promoção exige simultaneamente:

- autorização funcional;
- autorização técnica;
- snapshot e backup preservados;
- relatório de reconciliação sem diferenças;
- CI verde;
- Preview homologado;
- plano de rollback testado.

O modo `supabase-production` ainda exige `productionActivationApproved: true`. Sem essa autorização, a configuração retorna automaticamente para `local`.
