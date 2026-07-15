# RADAR PDDE

O **RADAR PDDE** é uma aplicação web para acompanhar o ciclo de entrega, análise, regularização e consolidação dos programas do PDDE por unidade escolar, competência, programa e documento.

O sistema apoia Controladores, Assistentes, equipe de Inventário e gestão da SME, transformando registros documentais em filas de trabalho, históricos auditáveis e informações gerenciais navegáveis.

## Estado atual — Gate de Pré-conexão Supabase

A base funcional aprovada permanece em operação com persistência local. O PR 22 prepara integralmente a arquitetura para futura conexão ao Supabase, sem ativar banco remoto, autenticação remota ou sincronização em produção.

| Camada | Situação |
|---|---|
| Frontend e regras de negócio | Aprovados e independentes do backend. |
| Produção Vercel | `dataMode: local`, operando em `localStorage`. |
| Persistência | Contrato único com adaptadores local e Supabase. |
| Supabase | Preparado e comprovado na pilha local; projeto remoto ainda não conectado. |
| Migração | Staging, retomada, hash, promoção, reconciliação e rollback preparados. |

A formulação correta é:

> O RADAR está integralmente preparado para conexão ao Supabase, sem necessidade de nova refatoração estrutural. O Supabase ainda não está implantado nem ativado em produção.

## Progressão funcional consolidada

### Ciclo documental

- criação do modelo de pendências documentais;
- registro de novo envio e reanálise;
- separação entre bonificação, análise técnica e pendência;
- quatro filas operacionais de pendências;
- navegação contextual entre Pendências, Competências e Prontuário;
- contatos, cancelamento, reabertura e retificação administrativa;
- histórico auditável e relatório Excel `.xlsx`.

### Dashboard e Carteira

- indicadores separados para pendências abertas e itens aguardando reanálise;
- filtros locais coerentes com listas e próximas ações;
- ações contextuais para abrir pendência ou reanalisar documento;
- busca por nome, designação e INEP;
- filtros técnicos e documentais;
- tabela desktop preservada e cartões operacionais no mobile;
- ações **Ver Unidade**, **Editar** e **Abrir Pendências**.

### Qualidade e acessibilidade

- foco, Escape, armadilha de teclado e retorno ao acionador nos modais;
- mensagens de falha em região `aria-live`;
- formulários preservados após falha de dados;
- testes desktop Chromium, Android/Chromium e iPhone/WebKit;
- acessibilidade automatizada com axe;
- garantia de zero requisições ao Supabase no modo local.

## Modelo funcional

O RADAR PDDE mantém três dimensões relacionadas, porém independentes.

### Bonificação

Avalia a entrega tempestiva dos documentos exigidos e produz o resultado **APTA** ou **INAPTA**.

### Análise técnica

Registra a qualidade e a correção de cada documento: não analisado, em análise, incorreto, correto ou correto após o prazo.

### Pendência documental

Controla o saneamento de documento ausente ou incorreto. Uma pendência somente é encerrada quando o documento é apresentado e a reanálise confirma sua correção.

Combinações como **APTA + documento incorreto + pendência ativa** são válidas. A regularização posterior não altera automaticamente a bonificação histórica.

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

## Principais áreas

- **Dashboard:** visão da carteira, indicadores e próximas ações;
- **Carteira de Escolas:** pesquisa, filtros, consulta e edição;
- **Visão por Competência:** bonificação, análise e pendências mensais;
- **Prontuário:** contexto completo da escola, programa e documento;
- **Pendências:** filas, busca, detalhes, contatos e histórico;
- **Excel:** relatório estruturado e metadados de qualidade.

## Arquitetura de persistência

```text
Frontend aprovado
       ↓
Serviços de aplicação
       ↓
Unidade de trabalho e contrato único
       ├── LocalStorageRepository — modo vigente
       └── SupabaseRepository — modo preparado
```

O modo publicado continua:

- `dataMode: "local"`;
- `supabaseRepositoryEnabled: false`;
- URL e chave publicável vazias;
- nenhuma conexão Supabase.

A preparação inclui:

- serviços de aplicação e rollback determinístico;
- snapshots canônicos e porta de estado;
- 12 migrations PostgreSQL;
- Auth local, cinco perfis e RLS;
- Ajv e `pg_jsonschema`;
- RPCs transacionais;
- concorrência otimista por `row_version`;
- importação reversível por `importId`;
- artefatos gerados e fixados por versão.

Nunca utilize `service_role`, `sb_secret_*`, senha do banco ou token administrativo no frontend, no GitHub ou nos logs.

## Migração preparada

```text
exportar → validar → planejar → staging
        → retomar lotes → reconciliar
        → promover atomicamente → reconciliar destino
        → concluir ou reverter
```

A migração não é iniciada automaticamente quando o banco está vazio. A futura execução remota dependerá de projeto aprovado, cópia controlada, janela, homologação e autorização expressa.

## Documentação oficial

O índice completo está em [`docs/README.md`](docs/README.md). Documentos principais:

- [`Arquitetura de prontidão`](docs/architecture/supabase-readiness.md);
- [`Cobertura funcional`](docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`Auditoria da integração`](docs/reference/SUPABASE_INTEGRATION_AUDIT.md);
- [`Dicionário de dados`](docs/reference/SUPABASE_DATA_DICTIONARY.md);
- [`Matriz de permissões`](docs/reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`Runbook de conexão`](docs/runbooks/SUPABASE_CONNECTION.md);
- [`Migração e rollback`](docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`Relatório final do PR 22`](docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md).

## Executar localmente

Requisitos: Node.js 24 e npm.

```bash
npm ci
npm start
```

Aplicação:

```text
http://127.0.0.1:4175
```

## Testes

Validação estrutural completa:

```bash
npm run test:readiness
```

Pilha Supabase local:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:stop
```

Interface:

```bash
npm run test:e2e
npm run test:mobile
```

Migração local controlada:

```bash
npm run migration:plan -- --snapshot <snapshot.json>
npm run migration:validate -- --snapshot <snapshot.json>
npm run migration:dry-run -- --snapshot <snapshot.json>
```

## Regra de preservação

Melhorias visuais podem aperfeiçoar espaçamento, tipografia, contraste, responsividade e acabamento. Exigem aprovação expressa alterações em navegação, botões, tabelas, colunas, permissões, fluxos, regras ou conceito estético.

## Próxima etapa

1. criar ou selecionar um projeto Supabase autorizado;
2. configurar Preview com URL e chave publicável;
3. aplicar as 12 migrations;
4. criar usuários reais de homologação;
5. testar Auth, RLS, migração e reconciliação remotos;
6. executar Advisors, backup, restauração e MFA;
7. homologar o Preview;
8. somente após autorização, avaliar a ativação em produção.
