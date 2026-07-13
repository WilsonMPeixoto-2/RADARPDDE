# Arquitetura de preparação para Supabase

## Estado vigente

O RADAR PDDE continua operando exclusivamente com dados iniciais versionados no frontend e persistência em `localStorage`. A infraestrutura descrita neste documento não ativa banco remoto, autenticação ou sincronização.

A configuração publicada contém:

```javascript
{
  dataMode: 'local',
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

Mesmo que URL e chave sejam preenchidas acidentalmente, o modo local neutraliza as credenciais e mantém as duas feature flags desativadas.

## Objetivo arquitetural

Separar gradualmente regras e telas da tecnologia de persistência, sem alterar o comportamento atual:

```text
Telas e regras do RADAR
        ↓
Contrato de repositório
        ↓
┌──────────────────────────┬──────────────────────────┐
│ LocalStorageRepository   │ SupabaseRepository       │
│ referência atual         │ preparado e desativado   │
└──────────────────────────┴──────────────────────────┘
```

Nesta entrega o `app.js` legado não foi reescrito para consumir o novo contrato. Os módulos são carregados passivamente para permitir futura migração incremental e testável.

## Componentes

### `config.js`

- define os modos `local`, `supabase-preview` e `supabase-production`;
- exige dupla autorização para conexão;
- bloqueia chaves secretas;
- exige autorização adicional para modo de produção;
- mantém o modo publicado em `local`;
- carrega passivamente os módulos de dados.

### `src/data/repository-contract.js`

Define entidades canônicas, erros tipados, validação de entidade e clonagem defensiva.

### `src/data/local-storage-repository.js`

Implementa o contrato usando uma interface compatível com `Storage`. Pode ser testado com armazenamento em memória e oferece snapshot/restauração.

### `src/data/supabase-repository.js`

Recebe o cliente Supabase por injeção. Não importa SDK, não lê segredos, não cria cliente e não executa seed automático.

### `src/data/repository-factory.js`

Seleciona o adaptador local por padrão. O adaptador Supabase só é criado quando o modo não é local e as duas flags, além de `connectionEnabled`, estão explicitamente ativas.

### `src/data/snapshot-tools.js`

Cria snapshots canônicos, valida IDs e estrutura, divide lotes e compara origem e destino.

## Princípios de segurança

1. **Fail closed:** qualquer configuração incompleta retorna ao repositório local.
2. **Sem segredo no frontend:** apenas chave publicável poderá ser usada futuramente.
3. **RLS obrigatória:** a chave publicável não concede acesso sem políticas compatíveis.
4. **Sem seed implícito:** banco vazio não autoriza inserção automática.
5. **Sem promoção automática:** Preview e produção exigem autorizações separadas.
6. **Rollback preservado:** o snapshot local é mantido até a homologação definitiva.

## Modelo futuro de ativação

1. Aplicar migrations em projeto de desenvolvimento.
2. Gerar e validar snapshot local.
3. Configurar apenas o Preview com `supabase-preview`.
4. Ativar o novo repositório sem ativar a ponte legada.
5. Executar testes contratuais e reconciliação.
6. Ativar a ponte legada apenas após equivalência comprovada.
7. Homologar autenticação e RLS por perfil.
8. Promover para produção somente com autorização expressa.

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
