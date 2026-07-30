# RADAR PDDE

O **RADAR PDDE** é uma aplicação web institucional da 4ª CRE/SME-Rio para acompanhar entrega, análise, regularização, consolidação e inventário dos programas do PDDE por unidade escolar, competência, programa e documento.

O produto atende Controladores, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário e Administração técnica, com autenticação institucional, autorização por perfil, histórico auditável, persistência no Supabase e exportações estruturadas.

## Estado operacional verificado em 29/07/2026

| Camada | Situação comprovada |
|---|---|
| Fonte de verdade | Repositório `WilsonMPeixoto-2/RADARPDDE`, branch `main`. |
| HEAD da `main` | `598361dd784563f4d70d1e25df3818f4ee066da8` — bloqueio automático restaurado após a publicação do Ciclo 5. |
| Artefato funcional publicado | Commit `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`. |
| Vercel Production | Deployment `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, estado `READY`, domínio `radarpdde-fix.vercel.app`. |
| Runtime | `environment: production`, `dataMode: supabase-production`, repositório Supabase habilitado. |
| Supabase | Projeto `RADAR PDDE 2026` (`scnryinorqeucbfkioxo`) em `ACTIVE_HEALTHY`, região `sa-east-1`. |
| Auth/RLS | Ativos; acesso anônimo bloqueado; autorização por perfil, escopo e autoria. |
| Governança SME | Somente leitura nas superfícies operacionais definidas; Registros Internos limitados ao próprio UUID autenticado. |
| Competências 2026 | Janeiro a dezembro disponíveis no contexto mensal global; `closing_competence = 2026-12`. |
| Avaliação mensal | Projeção canônica única, persistência atômica e resultado APTA/INAPTA certificados. |
| Timeline | Histórico cronológico por unidade e competência publicado como projeção somente leitura. |
| Excel | Produtos institucional e SME mensal certificados automaticamente, com manifesto determinístico e comparação célula a célula. |
| Navegação contextual | Publicada; preserva competência, origem, rolagem e foco entre Carteira, Dashboard, Pendências e Prontuário. |
| Deployment automático | Bloqueado por padrão em `vercel.json`; publicação ocorre por janela controlada. |
| Liberação oficial | Ainda não declarada. Permanecem polimento editorial, segurança, restauração, UAT e decisão formal de release. |

Documentos de entrada:

- [`Estado atual`](docs/CURRENT_STAGE.md);
- [`Contexto funcional e arquitetural`](docs/PROJECT_CONTEXT.md);
- [`Registro de decisões`](docs/DECISION_LOG.md);
- [`Índice documental`](docs/README.md);
- [`Auditoria de reconsolidação de 29/07/2026`](docs/audits/2026-07-29-reconsolidacao-contexto-codigo-documentacao.md).

## Regra de precedência

O estado do sistema é determinado por:

1. código-fonte remoto vigente;
2. migrations, funções, políticas, Auth e dados existentes no Supabase autorizado;
3. artefato efetivamente implantado na Vercel;
4. testes, manifests e evidências reproduzíveis;
5. decisões funcionais vigentes compatíveis com as fontes anteriores;
6. documentação atualizada;
7. planos, relatórios, handoffs e inventários históricos.

Documentação desatualizada deve ser corrigida para representar código e ambientes. Código funcional não deve ser alterado apenas para coincidir com documento antigo.

## Modelo funcional

### Bonificação

Avalia a entrega tempestiva dos documentos exigidos e produz o resultado **APTA** ou **INAPTA**, conforme a projeção canônica da competência e do programa.

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

Bonificação, análise e pendência são dimensões independentes. Uma regularização posterior não reescreve automaticamente o resultado histórico da bonificação.

## Perfis

### Controlador

Possui carteira de responsabilidade principal, mas pode colaborar nas demais escolas da própria CRE. A atuação não transfere automaticamente `schools.controller_id` e registra a autoria real.

### Assistente de Verbas Federais

Acompanha transversalmente a operação, administra equipe e carteiras, executa retificações e demais ações autorizadas.

### Gestão SME

Realiza acompanhamento gerencial. Nas visões mensal e do Prontuário, consulta identificação e bonificação sem análise técnica nem ações. Consulta Pendências em modo somente leitura. Registros Internos são limitados ao próprio UUID autenticado.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado, incluindo bens, encaminhamentos e inventariação.

### Administrador técnico

Administra infraestrutura, perfis, escopos, importações e auditoria. A simulação visual reproduz as capacidades do perfil escolhido sem substituir o JWT autenticado.

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
Frontend JavaScript
   ↓
Domínio puro + integrações idempotentes pós-app.js
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
- autorização por papel, escopo e capacidade;
- RLS em profundidade;
- operações compostas transacionais;
- concorrência otimista por `row_version`;
- autoria real em mutações;
- snapshots, importação controlada, reconciliação e rollback;
- chave administrativa exclusivamente server-side;
- extensões de produto carregadas de forma idempotente e degradável;
- navegação por rotas canônicas sem segundo roteador concorrente.

Nunca utilizar `service_role`, `sb_secret_*`, senha do banco ou token administrativo no frontend, no GitHub ou em logs.

## Competência global

A competência canônica usa `YYYY-MM` e é uma fonte única de contexto para Dashboard, Carteira, Competências, Prontuário, Pendências, timeline e exportações.

A seleção:

- apresenta os 12 meses do exercício disponível;
- é persistida durante a sessão;
- é preservada entre telas, retorno e recarga;
- sincroniza exercício e competência;
- rejeita competência inexistente ou de outro exercício;
- não depende de constante mensal fixa em `app.js`.

## Avaliação mensal e timeline

A identidade operacional é:

```text
escola + competência + programa
```

A avaliação mensal reúne bonificação, situação técnica, grau de conclusão e pendências correlatas sem confundir essas dimensões.

A timeline consolida verificações, pendências, tentativas, contatos, notas fiscais, bens e registros administrativos. É uma projeção somente leitura e não cria tabela, migration, RPC ou nova fonte de verdade.

## Exportações Excel

O sistema mantém dois produtos distintos:

1. **Relatório institucional histórico e multicompetência**, com quatro abas no modelo certificado;
2. **Excel SME mensal**, restrito à competência ativa e com uma única aba.

A certificação automatizada executa modelos e renderers reais, extrai células do pacote OOXML e compara endereço e valor. A evidência sintética possui manifesto SHA-256 e bloqueia divergências no readiness.

Limites atuais:

- o comando institucional exposto ao usuário ainda preserva o CSV legado;
- a homologação manual dos arquivos no Microsoft Excel desktop ainda deve ser registrada;
- a certificação sintética não consulta nem grava dados de Production.

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

```bash
npm run test:readiness
npm run test:e2e
npm run test:mobile
npm run build:vercel
```

Supabase local:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:stop
```

O readiness inclui sintaxe, lint de segurança e E2E, testes unitários e de integração, certificação Excel, alinhamento Supabase, configuração de runtime, artefatos gerados, tipos de banco e auditoria funcional.

## Bloqueadores antes da liberação oficial

- executar o ciclo de polimento editorial e visual sem alterar paleta, marca, capacidades ou nomenclatura canônica;
- homologar manualmente os arquivos no Microsoft Excel desktop;
- habilitar a proteção contra senhas vazadas no Supabase Auth;
- restringir deliberadamente a major do Node no contrato do repositório;
- validar backup e restauração em ambiente descartável;
- executar matriz remota de jornadas por perfil, competência e viewport;
- concluir UAT com usuários reais;
- registrar decisão formal de liberação, liberação com restrições ou não liberação.

## Próxima frente

A próxima frente funcional é o **polimento editorial e visual**, seguida do fortalecimento de segurança e infraestrutura, UAT e decisão formal de release. Os Ciclos 1 a 5 do plano de oficialização já foram concluídos e publicados.
