# Arquitetura de prontidão para Supabase

## Estado arquitetural

```text
Frontend aprovado
       ↓
Serviços de aplicação
       ↓
Unidade de trabalho e contrato único de persistência
       ├── LocalStorageRepository — modo vigente
       └── SupabaseRepository — modo preparado
```

A seleção ocorre por configuração pública gerada. A cópia versionada permanece em modo local e bloqueia qualquer inicialização remota.

## Componentes

### Interface

Os handlers permanecem responsáveis por DOM, mensagens, abertura de modais e renderização. Regras institucionais e mutações não são persistidas diretamente pela camada visual.

### Serviços de aplicação

Serviços especializados cobrem:

- configurações e exercícios;
- diretórios e cadastros;
- escolas e carteira;
- verificações;
- pendências, tentativas e contatos;
- notas fiscais;
- bens e inventário;
- auditoria.

### Unidade de trabalho

`DataService` e `UnitOfWork` capturam o estado anterior, executam a regra, persistem e restauram memória, armazenamento e repositório em caso de falha.

### Porta de estado

A porta traduz o modelo legado do frontend para o snapshot canônico e realiza o caminho inverso. As chaves `radar_pdde_*` continuam preservadas para operação local e rollback.

### Repositórios

Ambos implementam:

- `load`;
- `save`;
- `remove`;
- `exportSnapshot`;
- `restoreSnapshot`;
- `healthCheck`;
- `capabilities`.

O adaptador Supabase acrescenta paginação, lotes, concorrência otimista, RPCs compostas e protocolo de importação.

## Modelo de dados

O banco normaliza entidades funcionais e mantém JSONB somente onde a estrutura é realmente variável. Contratos JSON compartilhados são validados por Ajv no navegador e `pg_jsonschema` no PostgreSQL.

Tabelas expostas possuem RLS. A Data API exige grants explícitos e não concede acesso institucional ao papel `anon`.

## Autenticação e autorização

No modo local, o seletor de perfil vigente continua disponível. No modo Supabase, a identidade vem exclusivamente da sessão Auth e das tabelas protegidas de perfil e escopo.

Autorização combina:

- perfil ativo único;
- carteira do controlador;
- escopo explícito por escola;
- distinção entre leitura e escrita;
- permissões específicas do inventário;
- privilégios administrativos restritos.

## Operações atômicas

RPCs transacionais evitam persistências parciais nos seguintes fluxos:

- criação de exercício e competências;
- escola e programas;
- reanálise e efeitos documentais;
- nota, bem e verificação;
- promoção de dados staged.

## Migração

O protocolo não semeia banco vazio automaticamente. A migração é uma operação deliberada:

1. exportar o estado local;
2. validar estrutura e referências;
3. calcular hash e plano;
4. gravar lotes em staging por `importId`;
5. retomar lotes interrompidos sem duplicação;
6. reconciliar staging;
7. promover o snapshot em transação única;
8. reconciliar o destino;
9. concluir ou reverter.

A comparação canônica normaliza representações ISO equivalentes de um mesmo instante, sem alterar datas civis ou dados persistidos.

## Resiliência e UX

Falhas técnicas são convertidas em categorias estáveis e mensagens funcionais. O formulário permanece aberto, o foco é preservado e tecnologias assistivas recebem anúncio em região `aria-live`.

Retry automático é limitado a leituras seguras com erro transitório. Escritas nunca são repetidas silenciosamente.

## Invariantes de segurança

- produção padrão: `local`;
- conexão remota exige autorização explícita de configuração;
- nenhum segredo no navegador, repositório ou logs;
- nenhuma migration aplicada automaticamente em projeto remoto;
- nenhum seed implícito;
- rollback local preservado após futura ativação;
- layout, botões e regras aprovadas não dependem do backend escolhido.

## Ativação futura

A etapa remota deverá consistir principalmente em:

1. criar ou selecionar o projeto;
2. configurar URL e chave publicável em Preview;
3. aplicar as 12 migrations;
4. confirmar extensões e versões;
5. criar usuários de homologação;
6. executar Auth, RLS, importação e reconciliação remotos;
7. executar Advisors, backup, restauração e MFA;
8. homologar Preview;
9. autorizar produção.
