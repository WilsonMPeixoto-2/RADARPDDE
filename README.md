# RADAR PDDE

O **RADAR PDDE** é uma aplicação web institucional para acompanhar entrega, análise, regularização, consolidação e inventário dos programas do PDDE por unidade escolar, competência, programa e documento.

O produto atende Controladores, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário e Administração técnica, com autenticação institucional, autorização por perfil, histórico auditável, persistência no Supabase e exportações Excel.

## Estado operacional verificado em 28/07/2026

| Camada | Situação comprovada |
|---|---|
| Código-fonte | `main` em `a6b1a4628c6f3024740d8d5a6f2cb7ba028f9ff9`. |
| Deployment funcional | Commit `6f165f61016261073eba4b56ce7a0afd0074a904`, Vercel Production `READY`. |
| Runtime publicado | `environment: production`, `dataMode: supabase-production`, repositório Supabase habilitado. |
| Supabase | Projeto `RADAR PDDE 2026` ativo e saudável, com Auth, RLS, migrations e dados institucionais. |
| Governança SME | Implementada no frontend, serviços e RLS; migration aplicada e publicada. |
| Excel SME mensal | Implementado, com regressão para impedir reparo do arquivo; certificação integral banco–tela–arquivo ainda é gate pendente. |
| Competências 2026 | Janeiro a dezembro existem no banco; a operação permanece configurada em maio e a interface ainda oculta meses posteriores. |
| Liberação oficial | Ainda não declarada. Restam competências globais, homologação transversal, certificação Excel e gate de segurança/release. |

A descrição detalhada do estado auditado está em:

- [`Auditoria de alinhamento de 28/07/2026`](docs/audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md);
- [`Estágio atual`](docs/CURRENT_STAGE.md);
- [`Plano de oficialização operacional`](docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).

## Regra de precedência

O estado do sistema é determinado por:

1. código-fonte remoto;
2. migrations, funções, políticas e dados efetivamente existentes no Supabase autorizado;
3. artefato efetivamente implantado na Vercel;
4. testes e evidências reproduzíveis;
5. documentação alinhada às fontes anteriores.

Planos, relatórios e documentos históricos não prevalecem sobre o código e os ambientes reais.

## Modelo funcional

O RADAR mantém dimensões relacionadas, mas não intercambiáveis.

### Bonificação

Avalia a entrega tempestiva dos documentos exigidos e produz o resultado **APTA** ou **INAPTA**, conforme a regra canônica da competência e do programa.

### Análise técnica

Registra a qualidade e a correção de cada documento: não analisado, em análise, incorreto, correto ou correto após o prazo.

### Pendência operacional

Controla o saneamento de documento ausente ou incorreto e as providências internas. Estados canônicos:

```text
Aberta
  ↓ novo envio
Aguardando reanálise
  ├─ reanálise correta → Resolvida
  └─ reanálise incorreta → Aberta
```

Também existe `Cancelada`, preservando motivo, autoria e histórico.

Bonificação, análise e pendência podem coexistir sem apagar o passado. Uma regularização posterior não reescreve automaticamente o resultado histórico da bonificação.

## Perfis

### Controlador

Possui carteira de responsabilidade principal, mas pode colaborar nas demais escolas da própria CRE. A atuação não transfere automaticamente `schools.controller_id` e registra a autoria real.

### Assistente de Verbas Federais

Acompanha transversalmente a operação, administra equipe e carteiras, executa retificações e demais ações autorizadas.

### Gestão SME

Realiza acompanhamento gerencial. Nas visões mensal e do prontuário, consulta identificação e bonificação sem análise técnica nem ações. Consulta pendências em modo somente leitura. Registros Internos são limitados ao próprio UUID autenticado.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado, incluindo bens, encaminhamentos e inventariação.

### Administrador técnico

Administra infraestrutura, perfis, escopos, importações e auditoria. Não é perfil operacional equivalente à Assistente.

## Superfícies principais

- Dashboard;
- Carteira de Escolas;
- Competências Mensais;
- Prontuário da unidade;
- Pendências Operacionais;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- Configurações e visões gerenciais SME;
- alertas, modais e exportações.

Todas as superfícies representam o mesmo universo de dados e devem manter coerência de competência, perfil, escola, programa, pendência e autoria.

## Arquitetura

```text
Frontend
   ↓
Serviços de aplicação e unidade de trabalho
   ↓
Contrato único de repositório
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — rollback emergencial
   ↓
Supabase Auth + PostgreSQL + RLS + RPCs + auditoria
```

Requisitos estruturais:

- autenticação institucional;
- autorização por papel e escopo;
- RLS em profundidade;
- operações compostas transacionais;
- concorrência otimista por `row_version`;
- autoria real em mutações;
- snapshots, importação controlada, reconciliação e rollback;
- chave administrativa exclusivamente server-side.

Nunca utilizar `service_role`, `sb_secret_*`, senha do banco ou token administrativo no frontend, no GitHub ou em logs.

## Dados observados em Production

Data de corte: 28/07/2026.

| Entidade | Quantidade |
|---|---:|
| Escolas | 164 |
| Programas | 8 |
| Vínculos escola–programa | 431 |
| Controladores | 6 |
| Integrantes no diretório de Inventário | 4 |
| Perfis de usuário ativos | 13 |
| Competências | 12 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 81 |
| Bens | 2 |

Essas quantidades são um retrato operacional, não constantes de negócio.

## Competências

As 12 competências de 2026 estão persistidas. O estado atual ainda possui:

```text
closing_competence: 2026-05
activeCompetenciaKey inicial: 2026-05
```

A tela mensal filtra competências posteriores ao fechamento configurado. A correção deve separar competência existente, disponível e fechada, criar contexto mensal único e disponibilizar seletor mensal global em todas as superfícies aplicáveis.

## Excel

O sistema possui exportação mensal SME e exportação institucional/editorial. O Excel SME:

- usa a competência ativa;
- consolida Básico, Qualidade e Equidade;
- normaliza `SIM`, `NÃO` e `NÃO SE APLICA`;
- gera uma aba mensal;
- possui testes estruturais do pacote OOXML;
- não inclui as validações que faziam o Microsoft Excel reparar o arquivo.

Antes da liberação oficial, ambos os produtos Excel devem passar por reconciliação célula a célula entre Supabase, estado carregado, modelo de exportação e arquivo final.

## Executar localmente

Requisitos: Node.js 24 e npm.

```bash
npm ci
npm start
```

Aplicação local:

```text
http://127.0.0.1:4175
```

## Gates principais

Validação estrutural:

```bash
npm run test:readiness
```

Supabase local:

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

Build Vercel:

```bash
npm run build:vercel
```

## Segurança e release

Bloqueadores/requisitos antes da oficialização:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar a major operacional do Node no contrato de Production;
- executar matriz de jornadas reais por perfil, competência e viewport;
- comprovar backup e restauração em ambiente descartável;
- certificar os dois relatórios Excel;
- publicar evidências e decisão formal de liberação.

## Documentação

Índice principal: [`docs/README.md`](docs/README.md).

Documentos canônicos:

- [`Contexto funcional e arquitetural`](docs/PROJECT_CONTEXT.md);
- [`Registro de decisões`](docs/DECISION_LOG.md);
- [`Estágio atual`](docs/CURRENT_STAGE.md);
- [`Dicionário de dados`](docs/reference/SUPABASE_DATA_DICTIONARY.md);
- [`Matriz de permissões`](docs/reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`Runbook Supabase`](docs/runbooks/SUPABASE_CONNECTION.md);
- [`Migração e rollback`](docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`Auditoria de alinhamento`](docs/audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md);
- [`Plano de oficialização`](docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).

## Próxima frente

A próxima implementação de valor funcional é o **contexto global de competência**, incluindo liberação operacional de junho a dezembro, seletor mensal disponível em todas as superfícies e preservação da competência durante navegação, retorno, recarga e exportação.
