# Arquitetura de preparação para Supabase

## Estado vigente

O RADAR PDDE continua operando exclusivamente com dados iniciais versionados no frontend e persistência em `localStorage`. A infraestrutura descrita neste documento não ativa banco remoto, autenticação ou sincronização.

A configuração publicada permanece:

```javascript
{
  dataMode: 'local',
  activeRepository: 'local',
  productionActivationApproved: false,
  features: {
    supabaseRepositoryEnabled: false,
    legacyAppBridgeEnabled: false
  },
  supabase: {
    url: '',
    publishableKey: '',
    connectionEnabled: false
  }
}
```

Mesmo que URL e chave sejam preenchidas acidentalmente, o modo local neutraliza as credenciais e mantém as feature flags desativadas. Chaves `sb_secret_`, o literal `service_role` e JWTs cujo payload informe `role: service_role` são rejeitados.

## Objetivo arquitetural

Separar gradualmente regras e telas da tecnologia de persistência, sem alterar o comportamento atual:

```text
Telas e regras do RADAR
        ↓
Ponte operacional futura — atualmente desativada
        ↓
Contrato de repositório
        ↓
┌──────────────────────────┬──────────────────────────┐
│ LocalStorageRepository   │ SupabaseRepository       │
│ referência contratual    │ preparado e desativado   │
└──────────────────────────┴──────────────────────────┘
        ↑
RadarStateBridge — exportação, restauração e reconciliação
```

Nesta entrega o `app.js` legado não foi reescrito para consumir o novo contrato. Os módulos são carregados passivamente para permitir futura migração incremental e testável. A persistência oficial continua sendo o conjunto de chaves `radar_pdde_*` já utilizado pelo sistema.

## Componentes de aplicação

### `config.js`

- define os modos `local`, `supabase-preview` e `supabase-production`;
- exige modo não local, duas feature flags e credenciais publicáveis válidas;
- bloqueia chaves secretas e JWT legado de `service_role`;
- exige autorização adicional para produção;
- hidrata competências persistidas antes da primeira renderização;
- mantém o modo publicado em `local`.

### Contrato e repositórios

`src/data/repository-contract.js` define entidades canônicas, snapshots, erros tipados e validação.

`src/data/local-storage-repository.js` implementa o contrato usando uma interface compatível com `Storage`.

`src/data/supabase-repository.js` recebe o cliente por injeção e oferece:

- leitura paginada e ordenada;
- gravação em lotes;
- restauração respeitando dependências de FKs;
- exclusão de `audit_events` das restaurações;
- atualização otimista por `row_version`;
- erro `OPTIMISTIC_CONFLICT` para edição concorrente.

`src/data/repository-factory.js` mantém comportamento *fail-closed*: o adaptador remoto só é criado com modo não local, duas flags ativas e conexão validada.

### Snapshot e ponte bidirecional

`src/data/snapshot-tools.js`, `legacy-state-adapter.js`, `state-bridge.js` e `state-bridge-metadata.js`:

- leem apenas as chaves `radar_pdde_*`;
- traduzem objetos para linhas relacionais;
- preservam atributos variáveis em `payload`;
- preservam campos reais como `desc`, `compKey`, `bemId`, `dataRegistro`, inventariador e próximo ator;
- decompõem o contexto da nota em competência, programa, verificação e bem;
- restauram snapshots nas estruturas locais;
- suportam `dryRun`, lotes e reconciliação exata;
- invalidam metadados laterais quando o usuário altera o registro local.

### Exercícios e competências

`src/integration/exercise-management.js` e `exercise-early-init.js`:

- implementam criação e alternância de exercício;
- criam as doze competências anuais;
- preservam competência inicial e prazo mensal;
- restauram exercícios antes da primeira renderização;
- rejeitam ano inválido ou duplicado.

## Pilha Supabase local

A preparação agora inclui uma pilha reproduzível, ainda sem projeto remoto:

- `supabase/config.toml` com PostgreSQL 17;
- Supabase CLI `2.109.1` fixada em `devDependencies`;
- banco recriado por `supabase db reset --local`;
- testes pgTAP em `supabase/tests/database`;
- lint de PL/pgSQL por `supabase db lint`;
- tipos gerados em `src/types/database.types.ts`;
- cliente `@supabase/supabase-js` `2.110.3` empacotado em `vendor/supabase-client.js`;
- esbuild `0.28.1` fixado;
- verificação de reprodutibilidade dos artefatos no CI.

O HTML não carrega mais uma versão flutuante por CDN. O bundle versionado expõe `RadarSupabaseClient` e mantém o alias `supabase` apenas para compatibilidade com a integração antiga ainda desativada.

## Modelo SQL

As nove migrations são versionadas e não são executadas pela aplicação:

1. `202607130001_core_schema.sql` — entidades, FKs, constraints, índices e versionamento;
2. `202607130002_auth_and_rls.sql` — perfis, escopos, autorização e RLS;
3. `202607130003_audit_and_import.sql` — importações, auditoria e triggers;
4. `202607130004_competence_bonus_deadline.sql` — prazo de bonificação;
5. `202607130005_operational_context.sql` — contexto de notas e inventário;
6. `202607130006_authorization_hardening.sql` — perfil ativo único e leitura/escrita separadas;
7. `202607130007_configuration_audit_coverage.sql` — auditoria de parâmetros e cadastros;
8. `202607130008_atomic_invoice_operations.sql` — RPCs transacionais de nota, bem e verificação;
9. `202607140009_verification_payload.sql` — extensões auditáveis da verificação, incluindo retificações.

As RPCs `save_invoice_with_effects` e `delete_invoice_with_effects` usam `SECURITY INVOKER`, `search_path` fixo, RLS e controle otimista por versão. A exclusão física continua restrita ao Administrador técnico.

## Estratégia de testes

### Testes unitários

Cobrem configuração, contratos, paginação, lotes, concorrência, snapshots, ponte, migrations, artefatos gerados e RPCs.

### PostgreSQL 17 independente

O smoke test aplica as nove migrations em um PostgreSQL efêmero e exercita versão, auditoria, contexto e autorização.

### Supabase local e pgTAP

A pilha local aplica as migrations reais e executa 37 verificações declarativas de:

- schema e colunas;
- funções e privilégios;
- RLS e `SECURITY INVOKER`;
- criação, atualização, conflito e remoção atômica de nota e bem;
- atualização relacionada da verificação.

Depois o CI executa lint, regenera tipos e bundle e confirma que não há diferença com os arquivos versionados.

### Interface

O Playwright mantém cobertura em Chromium desktop, Android/Chromium e iPhone/WebKit, incluindo ausência de conexão Supabase no modo local.

## Validação remota futura

O workflow manual `supabase-remote-validation.yml` está preparado para um projeto autorizado. Ele não roda automaticamente e não aplica migrations.

Quando configurado com segredos do GitHub Actions, poderá:

- vincular o `project_ref`;
- simular `db push --dry-run`;
- executar lint remoto;
- executar pgTAP remoto em transações revertidas;
- comparar tipos remotos com o contrato versionado;
- listar branches disponíveis.

Criação de branch, aplicação de migration e Advisors dependem de autorização específica.

## Princípios de segurança

1. **Fail closed:** configuração incompleta retorna ao modo local.
2. **Sem segredo no frontend:** somente chave publicável poderá ser usada.
3. **RLS obrigatória:** a chave publicável não concede acesso sem políticas.
4. **Sem seed implícito:** banco vazio não autoriza inserção automática.
5. **Sem promoção automática:** Preview e produção exigem autorizações separadas.
6. **Rollback preservado:** snapshot local permanece até homologação.
7. **Exclusão excepcional:** escrita operacional não implica exclusão.
8. **Auditoria imutável:** usuários autenticados não editam `audit_events`.
9. **Funções protegidas:** `search_path` fixo.
10. **Escopo explícito:** `can_write = false` não concede escrita.
11. **Perfil não ambíguo:** no máximo um perfil ativo por usuário.
12. **Concorrência controlada:** atualizações usam `row_version`.
13. **Mutações compostas atômicas:** nota, bem e verificação não ficam parcialmente atualizados.
14. **Dependências reproduzíveis:** runtime, bibliotecas, CLI e Actions são fixados.

## Modelo futuro de ativação

1. Criar projeto ou branch Supabase de desenvolvimento.
2. Aplicar as nove migrations em ambiente remoto autorizado.
3. Executar lint, pgTAP, tipos e Advisors.
4. Exportar o estado real com `RadarStateBridge.exportLegacySnapshot()`.
5. Resolver advertências e registros rejeitados.
6. Configurar somente Preview com `supabase-preview`.
7. Importar em ordem relacional por backend controlado.
8. Reconciliar origem e destino e testar restauração local.
9. Homologar Auth, RLS, concorrência, RPCs e falhas.
10. Substituir a integração direta antiga pelo contrato.
11. Ativar a ponte somente após equivalência comprovada.
12. Promover para produção apenas com autorização expressa.

## Invariantes

A integração futura não pode alterar:

- regras de bonificação;
- análise técnica;
- estados e transições de pendências;
- retificações;
- priorização e antiguidade;
- inventário;
- exportação Excel;
- navegação, colunas, botões ou componentes aprovados.
