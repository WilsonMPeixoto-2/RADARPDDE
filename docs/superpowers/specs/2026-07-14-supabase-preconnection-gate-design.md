# Gate de Pré-conexão Supabase — desenho técnico

## 1. Finalidade

Este documento define a etapa final de preparação do RADAR PDDE antes da existência de um projeto Supabase remoto. O objetivo é fazer toda a aplicação operar por uma única arquitetura de dados, mantendo o `localStorage` como backend ativo, para que a futura conexão com Supabase exija apenas configuração, migrations, homologação remota e ativação controlada.

A etapa não autoriza:

- conexão com projeto Supabase remoto;
- uso de credenciais reais;
- aplicação de migrations fora da pilha local;
- alteração da `main` ou da produção;
- mudança de regras de negócio, telas, botões, colunas, fluxos ou estética aprovados;
- remoção do rollback local.

## 2. Estado de partida

O PR 22 já contém:

- modelo relacional e oito migrations;
- RLS, perfis, escopos e auditoria;
- repositórios local e Supabase;
- factory `fail-closed`;
- ponte bidirecional entre estado legado e modelo canônico;
- paginação, lotes, snapshots, reconciliação e controle otimista;
- RPCs atômicas para notas fiscais, bens e verificações;
- Supabase CLI, PostgreSQL 17, pgTAP, lint e tipos gerados;
- auditoria estrutural do frontend e cobertura Playwright.

A lacuna remanescente é arquitetural: o frontend ainda possui funções do `app.js` que alteram arrays globais e chamam persistência diretamente. O novo contrato está preparado, mas ainda não é a única porta de leitura e escrita da aplicação.

## 3. Alternativas consideradas

### Alternativa A — preencher URL e chave e adaptar os erros durante a conexão

Rejeitada. Essa abordagem ativaria simultaneamente integração, autenticação, RLS, migração de dados e refatoração do frontend. O risco de perda funcional e de rollback incompleto seria alto.

### Alternativa B — manter o frontend legado e usar a ponte apenas na importação

Rejeitada como solução final. A ponte preserva os dados, mas não elimina duas arquiteturas concorrentes de persistência. Cada nova funcionalidade teria de ser implementada duas vezes ou depender de sincronização implícita.

### Alternativa C — serviços de aplicação sobre um contrato único, com dois adaptadores

Escolhida. Todos os fluxos passam por serviços orientados ao domínio. O backend ativo continua local durante esta etapa. O adaptador Supabase é exercitado contra a pilha local usando o mesmo contrato. A troca futura de backend ocorre por configuração, sem reescrever a interface.

## 4. Arquitetura escolhida

```text
Interface existente
    ↓
Controladores de interface / handlers
    ↓
Serviços de aplicação do RADAR
    ↓
Contrato de repositório e unidade de trabalho
    ├── LocalStorageRepository — ativo
    └── SupabaseRepository — preparado e testado localmente
```

### 4.1 Interface

A marcação HTML, os componentes visuais e os fluxos aprovados permanecem inalterados. Os handlers existentes podem continuar expostos globalmente por compatibilidade, mas devem delegar a operação aos serviços de aplicação.

### 4.2 Serviços de aplicação

Serão criados serviços pequenos e explícitos para:

- escolas e vínculos com programas;
- exercícios, competências e configuração global;
- verificações e resultados documentais;
- pendências, tentativas, contatos e cobranças;
- notas fiscais e seus efeitos derivados;
- bens e inventariação;
- controladores e equipe de inventário;
- logs administrativos;
- sessão e identidade local de homologação.

Cada método deverá:

1. validar a entrada;
2. carregar o estado necessário;
3. aplicar a regra atual sem alterá-la;
4. executar a mutação pelo contrato;
5. registrar auditoria ou log pertinente;
6. devolver um resultado explícito ao handler;
7. manter o formulário aberto quando a gravação falhar.

### 4.3 Unidade de trabalho

Operações que alterem mais de uma entidade usarão uma abstração de unidade de trabalho. No backend local, ela produzirá snapshot anterior e restauração em caso de falha. No Supabase, usará RPC transacional quando existir ou operação SQL atômica equivalente.

## 5. Contratos funcionais obrigatórios

### 5.1 Escolas

- salvar dados cadastrais;
- alterar controlador;
- alterar programas ativos e vigências;
- preservar processo de inventário e competência inicial;
- impedir referências inválidas;
- tratar alteração concorrente.

### 5.2 Exercícios e competências

- criar exercício com doze competências;
- calcular prazos ordinários;
- manter fechamento operacional;
- distinguir prorrogação booleana de data substitutiva;
- não duplicar competências existentes;
- registrar a alteração estrutural em auditoria.

### 5.3 Pendências

- abrir pendência;
- registrar tentativa numerada;
- reanalisar tentativa;
- resolver ou cancelar com datas coerentes;
- registrar contatos e cobranças;
- preservar histórico e tipos de erro;
- atualizar próxima ação e projeções derivadas sem duplicá-las como fonte de verdade.

### 5.4 Notas fiscais

- usar obrigatoriamente as RPCs atômicas para salvar e remover;
- criar, atualizar ou remover bem vinculado conforme o tipo;
- atualizar a verificação documental relacionada;
- preservar competência, programa e contexto de origem;
- aplicar `row_version` em edições;
- impedir operação parcial.

### 5.5 Inventário

- preservar responsável, data, status, processo e observações;
- validar vínculo com escola, competência, nota e integrante da equipe;
- impedir remoção destrutiva de integrante já referenciado sem regra explícita.

### 5.6 Configurações e cadastros

- programas, controladores e integrantes devem preferir desativação lógica;
- exclusão física continua restrita ao administrador técnico;
- alterações estruturais devem gerar evento de auditoria;
- relações existentes devem ser validadas antes de desativação ou substituição.

## 6. Autenticação local de homologação

Será criada uma camada de sessão compatível com Supabase Auth, executável contra a pilha local. Ela deverá cobrir:

- login;
- restauração de sessão;
- logout;
- sessão expirada;
- usuário inativo;
- usuário autenticado sem perfil ativo;
- perfil ativo único;
- escopo somente leitura;
- escopo com escrita;
- todos os cinco perfis institucionais.

O seletor de perfil simulado atual poderá continuar disponível somente no modo local de demonstração. Em modo Supabase local, o perfil será derivado da sessão e das tabelas de autorização.

## 7. Configuração por ambiente

O frontend estático deverá receber uma configuração pública gerada no build:

```text
variáveis públicas do ambiente
    ↓
script de geração validado
    ↓
config.runtime.js
    ↓
createRuntimeConfig()
```

A configuração poderá conter apenas:

- modo de dados;
- URL pública do projeto;
- chave publicável;
- flags de ativação;
- identificação do ambiente.

O gerador deverá rejeitar:

- `service_role`;
- `sb_secret_*`;
- senha de banco;
- token administrativo;
- modo de produção sem autorização explícita.

O arquivo padrão versionado continuará apontando para modo local e sem credenciais.

## 8. Contratos de JSONB

Serão formalizados validadores para:

- bonificação documental;
- análise técnica;
- tipos de erro;
- histórico e tentativas;
- cancelamentos e resoluções;
- retificações;
- detalhes de auditoria;
- payloads de compatibilidade.

Campos JSONB continuarão preservando extensibilidade, mas entradas inválidas deverão ser rejeitadas antes da gravação e cobertas por testes SQL e JavaScript.

## 9. Tratamento de erros e experiência do usuário

Os erros técnicos serão convertidos em categorias funcionais:

- `NETWORK_UNAVAILABLE` — manter dados e permitir nova tentativa;
- `SESSION_EXPIRED` — preservar contexto e solicitar autenticação;
- `PERMISSION_DENIED` — informar falta de autorização;
- `OPTIMISTIC_CONFLICT` — oferecer recarga e comparação;
- `VALIDATION_FAILED` — destacar campos sem fechar o formulário;
- `TRANSACTION_FAILED` — confirmar rollback;
- `REMOTE_UNAVAILABLE` — não substituir estado válido por coleção vazia;
- `IMPORT_RECONCILIATION_FAILED` — bloquear promoção e produzir relatório.

Nenhuma falha remota poderá apagar silenciosamente o estado local ou simular sucesso.

## 10. Importação e reconciliação

Será criado um fluxo operacional único, reproduzível e idempotente:

1. exportar o estado local;
2. validar schema, chaves e referências;
3. produzir plano e contagens;
4. executar `dryRun`;
5. importar em ordem de dependência;
6. reconciliar origem e destino;
7. registrar rejeições e diferenças;
8. permitir retomada sem duplicação;
9. executar rollback testado;
10. gerar relatório final assinado por hashes.

A importação não será iniciada automaticamente por banco vazio.

## 11. Testes de aceitação

### 11.1 Contrato comum

A mesma suíte deverá ser executada contra:

- `LocalStorageRepository`;
- `SupabaseRepository` conectado à pilha local.

Os resultados funcionais devem ser equivalentes.

### 11.2 E2E em modo local

A suíte atual deve permanecer verde e provar ausência de regressão visual, funcional e de persistência.

### 11.3 E2E em Supabase local

Deverá cobrir:

- autenticação dos cinco perfis;
- leitura e escrita permitidas;
- negações de RLS;
- escopo somente leitura;
- criação e edição de escola;
- exercício e competências;
- pendência completa;
- contato e cobrança;
- nota de consumo, serviço e permanente;
- inventariação;
- conflito de versão;
- sessão expirada;
- indisponibilidade de rede simulada;
- logout e restauração de sessão.

### 11.4 Banco

- todas as migrations aplicáveis do zero;
- pgTAP para schema, RLS, RPCs e contratos JSONB;
- lint sem erros;
- índices de FKs e consultas críticas;
- operações compostas atômicas;
- nenhuma permissão anônima indevida.

## 12. Critérios de conclusão do Gate

O Gate somente será considerado concluído quando:

- nenhuma mutação institucional do frontend gravar diretamente em arrays globais como caminho final;
- todos os handlers delegarem aos serviços de aplicação;
- o backend local usar o mesmo contrato que o backend Supabase;
- a integração antiga e o seed automático do `app.js` estiverem removidos ou definitivamente neutralizados;
- a suíte comum passar nos dois adaptadores;
- o frontend completo passar contra Supabase local com Auth e RLS;
- as operações compostas críticas forem atômicas;
- conflitos, sessão expirada, falta de rede e RLS negada tiverem UX definida e testada;
- importação, reconciliação e rollback forem executáveis e testados;
- o modo padrão continuar local, sem credenciais e sem chamadas remotas;
- nenhuma tela, regra, botão, coluna ou estética aprovada sofrer regressão.

## 13. Fora de escopo

Continuam fora desta etapa:

- criação do projeto Supabase remoto;
- aplicação remota de migrations;
- configuração de SMTP real;
- usuários institucionais reais;
- Security e Performance Advisors remotos;
- teste de latência de internet real;
- carga com dados institucionais de produção;
- ativação em Vercel Preview ou produção;
- migração do frontend para React, Next.js ou outro framework;
- Realtime sem demanda operacional aprovada.

## 14. Estratégia de entrega

A implementação será dividida em pacotes verificáveis:

1. serviços de aplicação e contrato comum;
2. remoção da integração legada;
3. autenticação e sessão locais;
4. operações transacionais adicionais;
5. configuração pública por ambiente;
6. validadores JSONB e tratamento de erros;
7. importador e reconciliação;
8. E2E completo em Supabase local;
9. auditoria final de equivalência e prontidão.

Cada pacote deverá ser concluído com testes antes do seguinte. O PR permanecerá em rascunho, deployments automáticos continuarão desabilitados e nenhuma promoção ocorrerá sem autorização expressa.