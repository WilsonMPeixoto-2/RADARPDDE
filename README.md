# RADAR PDDE

O **RADAR PDDE** é uma aplicação web para acompanhar o ciclo de entrega, análise, regularização e consolidação dos programas do PDDE por unidade escolar, competência, programa e documento.

O sistema apoia o trabalho cotidiano de Controladores, Assistentes, equipe de Inventário e gestão da SME, transformando registros documentais em filas de trabalho, históricos auditáveis e informações gerenciais navegáveis.

## Estado atual — 13 de julho de 2026

Os PRs **18 a 21** foram incorporados à `main` e publicados no Vercel. Esse conjunto reúne as Tasks 10–13 do Ciclo A, o Dashboard operacional, a Carteira de Escolas restaurada e aprimorada, acessibilidade dos modais legados, coerência dos filtros e adaptação móvel.

A infraestrutura de **prontidão para Supabase** está sendo versionada de forma isolada. Ela não ativa banco remoto, autenticação nem sincronização em produção.

| Ambiente | Situação atual |
|---|---|
| `main` | Base funcional aprovada, incluindo os PRs 18, 19, 20 e 21. |
| Produção Vercel | Alinhada à `main` e operando exclusivamente com persistência local. |
| Preparação Supabase | Adaptadores, migrations, RLS, testes e runbooks preparados; conexão bloqueada por configuração. |

## Progressão funcional consolidada

### Ciclo A até a Task 9

- criação do modelo de pendências documentais;
- registro de novo envio e reanálise;
- separação entre bonificação, análise técnica e pendência;
- página de Pendências com quatro filas, busca, filtros, detalhes e histórico;
- navegação contextual entre Pendências, Competências e Prontuário;
- geração do relatório Excel `.xlsx`.

### Tasks 10 e 11

- registro de contatos relacionados a uma pendência, sem alterar sua situação;
- cancelamento justificado de pendência lançada indevidamente;
- reabertura de pendência resolvida, preservando o histórico anterior;
- alertas diferenciando providência da escola e reanálise do Controlador.

### Tasks 12 e 13

- retificação administrativa pelo perfil Assistente;
- comparação clara entre informação anterior e informação corrigida;
- justificativa obrigatória e histórico da retificação;
- preservação das pendências e da análise técnica durante a retificação.

### Dashboard e Carteira

- indicadores separados para pendências abertas e itens aguardando reanálise;
- filtros locais do Dashboard com seleção e limpeza pelo segundo clique;
- lista e próximas ações operacionais usando exatamente o mesmo recorte;
- ações contextuais para abrir pendência ou reanalisar documento;
- busca da Carteira por nome, designação e INEP;
- filtros técnicos e documentais;
- preservação da tabela desktop aprovada;
- cartões operacionais na visualização móvel;
- manutenção das ações **Ver Unidade**, **Editar** e **Abrir Pendências**.

### Qualidade e validação

- acessibilidade por teclado, foco, Escape e retorno ao acionador nos modais legados;
- leitura por tecnologias assistivas e adaptação móvel;
- testes de domínio e interface executados em desktop Chromium, Android/Chromium e iPhone/WebKit;
- validações específicas assegurando que o modo local não faça requisições ao Supabase.

## Regra de preservação visual e funcional

Melhorias de qualidade visual são permitidas quando aperfeiçoam os elementos existentes, por exemplo:

- espaçamento, alinhamento e hierarquia;
- tipografia, contraste e legibilidade;
- responsividade e adaptação móvel;
- consistência e acabamento visual.

Exigem **aprovação expressa prévia** do responsável pelo projeto:

- remover ou acrescentar caminhos de navegação;
- retirar, trocar ou mudar a finalidade de botões;
- substituir componentes ou tabelas já aprovados;
- alterar colunas, permissões, fluxos ou funcionalidades;
- modificar o conceito estético definido.

Uma apresentação aparentemente mais organizada não autoriza alteração funcional. Toda evolução visual deve preservar integralmente as ações e os caminhos existentes, salvo decisão expressa em contrário.

## Modelo funcional

O RADAR PDDE mantém três dimensões relacionadas, porém independentes.

### Bonificação

Avalia a entrega tempestiva dos documentos exigidos e produz o resultado **APTA** ou **INAPTA** para fins de consolidação e encaminhamento à SME.

### Análise técnica

Registra a qualidade e a correção de cada documento: não analisado, em análise, incorreto, correto ou correto após o prazo.

### Pendência documental

Controla o saneamento de documento ausente ou incorreto. Uma pendência somente é encerrada quando o documento é apresentado e a reanálise confirma sua correção.

Consequentemente, combinações como **APTA + documento incorreto + pendência ativa** são válidas. A regularização posterior não altera automaticamente a bonificação histórica.

## Ciclo das pendências

```text
Aberta
  ↓ novo envio
Aguardando reanálise
  ├─ reanálise correta → Resolvida
  └─ reanálise incorreta → Aberta
```

Estados canônicos:

- `Aberta` — depende de providência da escola;
- `Aguardando reanálise` — depende de conferência do Controlador;
- `Resolvida` — reanálise positiva concluída;
- `Cancelada` — lançamento indevido cancelado com justificativa.

`Aberta` e `Aguardando reanálise` são pendências ativas. Não existe estado `Vencida`; a antiguidade é utilizada para priorização.

## Principais áreas do sistema

- **Dashboard:** visão da carteira, indicadores separados e próximas ações;
- **Carteira de Escolas:** pesquisa, filtros, comparação das unidades, consulta e edição;
- **Visão por Competência:** acompanhamento mensal de bonificação, análise e pendências;
- **Prontuário:** contexto completo da escola, programa e documento;
- **Pendências:** quatro filas, busca global, filtros, detalhes, contatos e histórico;
- **Excel:** relatório estruturado com bonificações, síntese, qualidade dos dados e metadados.

## Documentação oficial

O índice completo está em [`docs/README.md`](docs/README.md). A matriz de precedência, disponibilidade e integridade está em [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md).

Documentação arquitetural e operacional relevante:

- [`Modelo operacional compartilhado`](docs/architecture/modelo-operacional.md);
- [`Retificações administrativas`](docs/architecture/retificacoes.md);
- [`Competências`](docs/architecture/competencias.md);
- [`Testes e validação`](docs/architecture/testing.md);
- [`Prontidão para Supabase`](docs/architecture/supabase-readiness.md);
- [`Dicionário de dados Supabase`](docs/reference/SUPABASE_DATA_DICTIONARY.md);
- [`Matriz futura de permissões`](docs/reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`Runbook de conexão`](docs/runbooks/SUPABASE_CONNECTION.md);
- [`Migração e rollback`](docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).

## Precedência das decisões

Quando houver divergência entre fontes, deve ser aplicada a seguinte ordem:

1. orientação expressa mais recente do responsável pelo projeto;
2. relatório atual de execução, quanto ao estado da implementação;
3. Dossiê consolidado;
4. Plano aprovado do Lote 2;
5. plano técnico da implementação;
6. código vigente.

Decisões consolidadas não devem ser reabertas sem nova regra institucional, defeito comprovado ou determinação expressa.

## Dados e persistência

O modo vigente permanece **exclusivamente local**:

- dados iniciais versionados no frontend;
- persistência funcional no `localStorage` do navegador;
- `dataMode: "local"` na configuração publicada;
- `supabaseRepositoryEnabled: false`;
- `legacyAppBridgeEnabled: false`;
- URL e chave publicável vazias;
- nenhuma chamada de rede ao Supabase.

A preparação futura inclui:

- contrato comum de persistência;
- adaptador local testável;
- adaptador Supabase injetável e desativado;
- factory com comportamento *fail-closed*;
- snapshots, importação em lotes e reconciliação;
- migrations PostgreSQL versionadas;
- autenticação, perfis e políticas RLS planejadas;
- auditoria e controle de importações;
- verificações automáticas contra credenciais secretas.

A existência desses arquivos **não autoriza a conexão**. A ativação exigirá projeto Supabase próprio, aplicação controlada das migrations, configuração de Preview, testes de equivalência, homologação e autorização expressa.

Nunca utilize `service_role`, `sb_secret_`, senha do banco ou token administrativo no frontend ou no repositório.

## Executar localmente

Requisitos: Node.js compatível com o projeto e npm.

```bash
npm install
npm start
```

A aplicação será disponibilizada em:

```text
http://127.0.0.1:4175
```

## Testes

Validação completa de prontidão:

```bash
npm run test:readiness
```

Comandos individuais:

```bash
npm run check
npm run test:unit
npm run check:supabase
npm run test:e2e
```

Projetos de interface cobertos:

- Chromium desktop;
- Android/Chromium;
- iPhone/WebKit.

## Organização do desenvolvimento

- `main` — base aprovada para publicação;
- branches `feature/*` e `fix/*` — trabalho isolado;
- alterações relevantes são revisadas por Pull Request;
- mudanças funcionais, merge e produção exigem autorização expressa;
- testes e Preview da Vercel devem ser aprovados antes do encerramento.

## Roadmap consolidado

1. concluir a revisão da infraestrutura de prontidão sem conectar produção;
2. criar ou selecionar um projeto Supabase autorizado;
3. aplicar migrations em ambiente de desenvolvimento ou Preview;
4. importar uma cópia controlada e executar reconciliação completa;
5. homologar autenticação, RLS, concorrência e recuperação;
6. somente após autorização, avaliar a ativação remota em produção.
