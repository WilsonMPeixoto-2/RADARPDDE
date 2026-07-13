# Arquitetura de preparação para Supabase

## Estado vigente

O RADAR PDDE continua operando exclusivamente com dados iniciais versionados no frontend e persistência em `localStorage`. A infraestrutura descrita neste documento não ativa banco remoto, autenticação ou sincronização.

A configuração publicada contém:

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

Mesmo que URL e chave sejam preenchidas acidentalmente, o modo local neutraliza as credenciais e mantém as duas feature flags desativadas. Chaves `sb_secret_`, o literal `service_role` e JWTs cujo payload informe `role: service_role` são rejeitados.

## Objetivo arquitetural

Separar gradualmente regras e telas da tecnologia de persistência, sem alterar o comportamento atual:

```text
Telas e regras do RADAR
        ↓
Ponte legada futura — atualmente desativada
        ↓
Contrato de repositório
        ↓
┌──────────────────────────┬──────────────────────────┐
│ LocalStorageRepository   │ SupabaseRepository       │
│ referência contratual    │ preparado e desativado   │
└──────────────────────────┴──────────────────────────┘
        ↑
LegacyStateAdapter — exportação controlada do estado atual
```

Nesta entrega o `app.js` legado não foi reescrito para consumir o novo contrato. Os módulos são carregados passivamente para permitir futura migração incremental e testável. A persistência oficial continua sendo o conjunto de chaves `radar_pdde_*` já utilizado pelo sistema.

## Componentes

### `config.js`

- define os modos `local`, `supabase-preview` e `supabase-production`;
- exige modo não local, duas feature flags e credenciais publicáveis válidas;
- bloqueia chaves secretas, inclusive JWT legado de `service_role`;
- exige autorização adicional para modo de produção;
- mantém o modo publicado em `local`;
- carrega passivamente os módulos de dados sem instanciar repositório.

### `src/data/repository-contract.js`

Define:

- entidades canônicas;
- formato `radar-pdde-snapshot`;
- erros tipados;
- validação de entidade;
- clonagem defensiva;
- envelope comum de snapshot.

### `src/data/local-storage-repository.js`

Implementa o contrato usando uma interface compatível com `Storage`. É uma referência testável para operações de leitura, gravação, remoção, snapshot, restauração e saúde. Não substitui automaticamente as chaves legadas do `app.js`.

### `src/data/supabase-repository.js`

Recebe o cliente Supabase por injeção. Não importa SDK, não lê segredos, não cria cliente e não executa seed automático. A restauração respeita a ordem das FKs e todos os registros utilizam `id` canônico.

### `src/data/repository-factory.js`

Seleciona o adaptador local por padrão. O adaptador Supabase só é criado quando:

1. o modo não é `local`;
2. `supabaseRepositoryEnabled` está ativo;
3. `legacyAppBridgeEnabled` está ativo;
4. `connectionEnabled` foi calculado como verdadeiro.

O repositório local não é instanciado desnecessariamente quando o modo remoto estiver futuramente autorizado.

### `src/data/snapshot-tools.js`

Cria snapshots canônicos, valida estrutura e entidades conhecidas, detecta IDs ausentes ou duplicados, divide lotes e compara origem e destino.

### `src/data/legacy-state-adapter.js`

É a ponte de exportação entre o estado real atual e o modelo relacional futuro. O módulo:

- lê somente as chaves `radar_pdde_*` existentes;
- não altera o navegador;
- converte nomes de campos para `snake_case`;
- transforma `programasIds` em `school_programs`;
- transforma verificações aninhadas em linhas;
- separa tentativas de pendência;
- preserva dados legados em `payload`;
- retorna advertências e registros rejeitados;
- produz snapshot canônico para validação e reconciliação.

## Modelo SQL

As migrations são versionadas e não são executadas pela aplicação:

1. `202607130001_core_schema.sql` — entidades, FKs, constraints, índices e versionamento;
2. `202607130002_auth_and_rls.sql` — perfis, escopos, funções de autorização e políticas granulares;
3. `202607130003_audit_and_import.sql` — importações, auditoria e triggers.

Todas as entidades acessadas pelo contrato possuem `id`. Exclusões físicas de dados operacionais são separadas das políticas de escrita e restritas ao Administrador técnico.

## Princípios de segurança

1. **Fail closed:** configuração incompleta retorna ao modo local.
2. **Sem segredo no frontend:** somente chave publicável poderá ser usada futuramente.
3. **RLS obrigatória:** a chave publicável não concede acesso sem políticas compatíveis.
4. **Sem seed implícito:** banco vazio não autoriza inserção automática.
5. **Sem promoção automática:** Preview e produção exigem autorizações separadas.
6. **Rollback preservado:** o snapshot local é mantido até homologação definitiva.
7. **Exclusão excepcional:** escrita operacional não implica permissão de exclusão.
8. **Auditoria imutável:** usuários autenticados não editam `audit_events`.
9. **Funções protegidas:** funções `security definer` usam `search_path` fixo.

## Modelo futuro de ativação

1. Criar projeto ou branch Supabase de desenvolvimento.
2. Aplicar migrations e verificar advisors.
3. Exportar o estado real com `RadarLegacyStateAdapter.exportLegacySnapshot()`.
4. Resolver advertências e registros rejeitados.
5. Configurar apenas o Preview com `supabase-preview`.
6. Importar em ordem relacional por backend controlado.
7. Reconciliar origem e destino.
8. Homologar autenticação, RLS, concorrência e falhas.
9. Ativar a ponte legada somente após equivalência comprovada.
10. Promover para produção somente com autorização expressa.

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
