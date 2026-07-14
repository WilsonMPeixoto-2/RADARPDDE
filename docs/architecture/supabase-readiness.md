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

## Componentes

### `config.js`

- define os modos `local`, `supabase-preview` e `supabase-production`;
- exige modo não local, duas feature flags e credenciais publicáveis válidas;
- bloqueia chaves secretas, inclusive JWT legado de `service_role`;
- exige autorização adicional para modo de produção;
- mantém o modo publicado em `local`;
- hidrata competências persistidas antes da primeira renderização;
- carrega os módulos de dados sem instanciar repositório remoto.

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

Recebe o cliente Supabase por injeção. Não importa SDK, não lê segredos, não cria cliente e não executa seed automático. Inclui:

- leitura paginada e ordenada;
- gravação em lotes controlados;
- restauração respeitando dependências de FKs;
- exclusão de `audit_events` das restaurações;
- atualização otimista por `row_version`;
- erro tipado `OPTIMISTIC_CONFLICT` quando outra sessão altera o registro.

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

Executa a leitura e transformação básica do estado atual:

- lê somente as chaves `radar_pdde_*` existentes;
- não altera o navegador;
- converte nomes de campos para `snake_case`;
- transforma `programasIds` em `school_programs`;
- transforma verificações aninhadas em linhas;
- separa tentativas de pendência;
- preserva dados legados em `payload`;
- retorna advertências e registros rejeitados.

### `src/data/state-bridge.js` e `state-bridge-metadata.js`

Completam a tradução semântica e bidirecional:

- preservam o calendário anual e o prazo mensal de bonificação;
- traduzem os campos reais usados pela interface, inclusive `desc`, `compKey`, `bemId`, `dataRegistro`, inventariador e próximo ator;
- decompõem o contexto da nota em competência, programa, verificação e bem;
- restauram snapshot canônico nas chaves locais;
- suportam `dryRun`;
- usam metadados laterais para reconciliação exata sem inserir aliases técnicos nos objetos do usuário;
- invalidam esses metadados por registro quando o usuário altera o conteúdo local.

### `src/integration/exercise-management.js`

Preenche uma lacuna funcional existente no frontend:

- implementa `changeExercise` e `criarExercicio`;
- cria as doze competências de cada exercício;
- preserva competência inicial e prazos mensais;
- atualiza o seletor anual;
- restaura os exercícios após recarregamento;
- rejeita ano inválido ou duplicado.

### `scripts/audit-functional-persistence.js`

Usa análise sintática com Acorn para inventariar:

- chaves de armazenamento local;
- raízes mutáveis de estado;
- chamadas de persistência;
- configurações;
- handlers de interface;
- campos de formulário;
- funções que alteram dados sem caminho de persistência reconhecido.

## Modelo SQL

As migrations são versionadas e não são executadas pela aplicação:

1. `202607130001_core_schema.sql` — entidades, FKs, constraints, índices e versionamento;
2. `202607130002_auth_and_rls.sql` — perfis, escopos, funções de autorização e políticas granulares;
3. `202607130003_audit_and_import.sql` — importações, auditoria operacional e triggers;
4. `202607130004_competence_bonus_deadline.sql` — prazo de bonificação por competência;
5. `202607130005_operational_context.sql` — contexto de notas, verificação, bem e inventariação;
6. `202607130006_authorization_hardening.sql` — perfil ativo único e distinção entre leitura e escrita;
7. `202607130007_configuration_audit_coverage.sql` — auditoria de parâmetros, cadastros e vínculos institucionais.

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
10. **Escopo explícito:** `can_write = false` não concede permissão de alteração.
11. **Perfil não ambíguo:** cada usuário possui no máximo um perfil ativo.
12. **Dependências reproduzíveis:** versões do runtime, bibliotecas e GitHub Actions são fixadas antes da integração real.

## Modelo futuro de ativação

1. Criar projeto ou branch Supabase de desenvolvimento.
2. Aplicar as sete migrations e verificar advisors.
3. Exportar o estado real com `RadarStateBridge.exportLegacySnapshot()`.
4. Resolver advertências e registros rejeitados.
5. Configurar apenas o Preview com `supabase-preview`.
6. Importar em ordem relacional por backend controlado.
7. Reconciliar origem e destino e testar restauração local.
8. Homologar autenticação, RLS, concorrência e falhas.
9. Substituir a integração direta antiga pelo contrato de repositório.
10. Remover o SDK flutuante por versão fixada ou bundle controlado.
11. Ativar a ponte somente após equivalência comprovada.
12. Promover para produção somente com autorização expressa.

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
