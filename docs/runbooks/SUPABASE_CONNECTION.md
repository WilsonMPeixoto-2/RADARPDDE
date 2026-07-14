# Runbook — conexão futura com Supabase

## Situação atual

Não execute este runbook durante a etapa de preparação. A produção permanece em `localStorage`, com URL e chave vazias e feature flags desativadas.

O `app.js` ainda contém uma integração direta preliminar e antiga, com tabelas e seed incompatíveis com o novo esquema. Ela permanece inativa porque a configuração publicada não expõe credenciais. **Não se deve simplesmente preencher URL, chave e ligar as flags.** A ponte definitiva deverá substituir esse caminho pelo contrato de repositório antes de qualquer conexão da aplicação.

A infraestrutura preparada já inclui:

- exportação e restauração bidirecional do estado `radar_pdde_*`;
- repositório Supabase com paginação integral e gravação em lotes;
- atualização otimista por `row_version`;
- reconciliação de snapshots;
- esquema, autenticação futura, RLS, auditoria e importações;
- distinção efetiva entre acesso somente leitura e autorização de escrita;
- auditoria técnica de parâmetros, cadastros e vínculos institucionais;
- inventário automatizado de chaves, configurações, handlers, formulários e mutações.

## Pré-requisitos

- projeto Supabase criado e ativo;
- branch de integração isolada;
- migrations aplicadas em ambiente de desenvolvimento;
- URL e chave **publishable** disponíveis;
- nenhuma chave `service_role`, `sb_secret_`, senha ou token administrativo no frontend;
- Preview do Vercel separado de produção;
- snapshot local exportado e validado;
- autorização expressa para iniciar a conexão experimental.

## 1. Aplicar migrations

Aplicar, nesta ordem:

1. `202607130001_core_schema.sql`;
2. `202607130002_auth_and_rls.sql`;
3. `202607130003_audit_and_import.sql`;
4. `202607130004_competence_bonus_deadline.sql`;
5. `202607130005_operational_context.sql`;
6. `202607130006_authorization_hardening.sql`;
7. `202607130007_configuration_audit_coverage.sql`.

Após a aplicação:

- listar migrations executadas;
- verificar advisors de segurança e desempenho;
- confirmar RLS ativa em todas as tabelas expostas;
- confirmar ausência de políticas para `anon`;
- confirmar apenas um perfil ativo por usuário;
- confirmar que escopo somente leitura não concede escrita;
- gerar tipos TypeScript como artefato de conferência;
- executar teste de criação e rollback em ambiente descartável;
- confirmar as FKs de notas para programa, verificação, bem e escola;
- confirmar o vínculo do inventariador e a data de inventariação;
- confirmar triggers de auditoria em parâmetros, programas, controladores, equipe, competências e vínculos escola–programa.

## 2. Criar usuários de teste

Criar usuários separados para:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

Vincular cada usuário em `user_profiles`. Controladores precisam de `controller_id`; integrantes do inventário precisam de `inventory_member_id`.

## 3. Configurar escopos

- associar escolas ao controlador por `schools.controller_id`;
- usar `user_school_scopes` para exceções;
- marcar `can_write` explicitamente;
- comprovar que `can_write = false` concede apenas leitura;
- conceder escopo a inventariador que precise registrar o primeiro bem de uma escola;
- não conceder perfil técnico administrativo a usuário operacional;
- manter apenas um vínculo ativo em `user_profiles` por usuário.

## 4. Validar o repositório sem conectar a aplicação

Nesta fase, `config.js` continua integralmente em modo local. A validação do banco ocorre por cliente injetado em ambiente técnico controlado, e não pela interface pública do RADAR.

Exemplo conceitual:

```javascript
const client = createClient(projectUrl, publishableKey);
const repository = new RadarSupabaseRepository.SupabaseRepository({
  client,
  pageSize: 500,
  writeBatchSize: 250
});
const health = await repository.healthCheck();
```

As credenciais devem vir do ambiente de execução ou do conector autorizado, nunca do GitHub.

Validar:

- leitura paginada com coleções acima de mil registros;
- escrita em lotes;
- leitura com cada usuário de teste;
- negativas de RLS;
- gravação em tabelas permitidas;
- atualização concorrente por `updateWithVersion()`;
- exclusão restrita ao Administrador técnico;
- exportação de snapshot remoto;
- ausência de seed automático;
- ordem relacional de restauração;
- logs operacionais e auditoria técnica.

## 5. Exportar e importar uma cópia controlada

Seguir `SUPABASE_MIGRATION_AND_ROLLBACK.md`:

1. exportar o estado atual com `RadarStateBridge.exportLegacySnapshot()`;
2. resolver advertências e rejeições;
3. registrar `import_id`;
4. importar em ordem relacional por backend controlado;
5. exportar o destino;
6. reconciliar origem e destino;
7. executar uma restauração simulada com `dryRun: true`;
8. preservar o snapshot local e os metadados laterais de reconciliação.

A importação não deve ocorrer no navegador com credencial administrativa.

## 6. Implementar a ponte definitiva em PR separado

Somente após o repositório e os dados estarem homologados:

- substituir as chamadas diretas do `app.js` por operações do contrato de repositório;
- remover o seed automático e a integração antiga com tabelas legadas;
- remover o carregamento CDN flutuante do SDK e usar versão fixada ou bundle controlado;
- criar o cliente Supabase somente quando `connectionEnabled` for verdadeiro;
- mapear carregamento, gravação, conflitos e falhas;
- utilizar `updateWithVersion()` nas edições de registros existentes;
- manter o adaptador local e `RadarStateBridge` como referência e rollback;
- criar testes de equivalência para cada mutação do domínio;
- comprovar que nenhuma tela, cálculo, botão ou fluxo mudou.

A simples alteração de flags **não substitui essa implementação**.

## 7. Configurar somente o Preview

Depois de a ponte definitiva estar implementada e testada, alterar a fonte de configuração apenas na branch de Preview:

```javascript
{
  dataMode: DATA_MODES.SUPABASE_PREVIEW,
  productionActivationApproved: false,
  features: {
    supabaseRepositoryEnabled: true,
    legacyAppBridgeEnabled: true
  },
  supabase: {
    url: 'URL_DO_PROJETO',
    publishableKey: 'CHAVE_PUBLICÁVEL'
  }
}
```

A conexão exige simultaneamente:

- modo não local;
- `supabaseRepositoryEnabled: true`;
- `legacyAppBridgeEnabled: true`;
- URL válida;
- chave publicável válida.

## 8. Executar validações

```bash
npm run test:readiness
npm run test:e2e
```

Confirmar:

- cliente criado somente no Preview;
- produção continua em modo local;
- leitura e escrita respeitam RLS;
- usuário sem perfil recebe acesso negado;
- nenhum seed é executado automaticamente;
- banco vazio não causa inserção implícita;
- falha de rede é tratada sem corromper o estado;
- nenhuma coleção é truncada por limite de paginação;
- resultados funcionais coincidem com o modo local;
- ida e volta Supabase → estado local preserva campos funcionais;
- alterações locais posteriores não são ocultadas pelos metadados de reconciliação.

## 9. Homologar RLS e concorrência

Executar todos os casos da matriz de permissões, incluindo tentativas negativas. Ocultar um botão não prova segurança; a operação deve ser negada pelo banco.

Também validar:

- duas sessões alterando o mesmo registro;
- incremento de `row_version`;
- retorno de `OPTIMISTIC_CONFLICT` para versão obsoleta;
- sessão expirada;
- usuário desativado;
- tentativa de ativar dois perfis simultâneos;
- exceção de escola somente leitura;
- exceção de escola com escrita;
- auditoria de inserção, alteração e exclusão.

## 10. Preparar produção

A promoção exige simultaneamente:

- autorização funcional e técnica;
- snapshot e backup preservados;
- reconciliação sem diferenças não justificadas;
- CI verde;
- Preview homologado;
- advisors analisados;
- rollback testado;
- período de implantação definido.

O modo `supabase-production` exige `productionActivationApproved: true`. Sem essa autorização, a configuração retorna automaticamente para `local`.
