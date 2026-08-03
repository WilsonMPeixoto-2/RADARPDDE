# RADAR PDDE — Estado atual do projeto

- **Atualizado em:** 3 de agosto de 2026
- **Baseline da `main` após a Rodada 3B:** `520b51e7080ddae0f4e3f03cf4c045cbea0a233d`
- **Deployment Production vigente:** `dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp` — `READY`
- **Commit funcional publicado:** `f72a1471023f00eec0bc615c192fd25f5c29a920`
- **Projeto Supabase autorizado:** `scnryinorqeucbfkioxo` — `ACTIVE_HEALTHY`
- **Runtime Production:** `supabase-production`
- **Migrations correspondentes:** 25
- **Deployment automático:** bloqueado fora de janela controlada
- **Roadmap canônico:** `docs/ROADMAP_ATUALIZACOES_2026.md`

## 1. Como usar este documento

Este arquivo controla o estágio corrente, o estado dos ambientes e a próxima sequência. O portfólio completo de atualizações técnicas e funcionais está em `docs/ROADMAP_ATUALIZACOES_2026.md`.

Antes de iniciar qualquer tarefa:

1. consultar a `main` e os PRs abertos;
2. confirmar o deployment e o SHA efetivamente publicados;
3. confirmar Supabase, migrations e estado remoto quando a tarefa depender dessas camadas;
4. ler `ROADMAP_ATUALIZACOES_2026.md`, `PROJECT_CONTEXT.md` e `DECISION_LOG.md`;
5. verificar se a frente anterior foi declarada concluída, bloqueada, adiada ou substituída;
6. avaliar se a tarefa pode alcançar resultado materialmente melhor por atualização, instalação ou capacidade tecnológica moderna;
7. executar somente os gates correspondentes ao impacto real, sem reduzir os pisos vigentes;
8. atualizar os documentos canônicos no mesmo ciclo de mudança material.

Código, ambientes efetivos e evidências reproduzíveis prevalecem sobre memória de chat, planos históricos e afirmações documentais antigas.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

### 2.1 Produto e infraestrutura já concluídos

- governança de acesso da Gestão SME;
- competência global de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- navegação contextual;
- correção de desempenho do login e da restauração de sessão;
- relatório institucional XLSX e Excel SME mensal;
- Excel SME homologado no Microsoft Excel desktop e publicado;
- Node.js fixado em `24.x`;
- gate remoto de cinco papéis em três viewports;
- backup e restauração em duas pilhas Supabase descartáveis;
- reconciliação do histórico da migration SME;
- bloqueio automático de deployment restaurado.

### 2.2 Rodadas de atualização concluídas

#### Rodada 0 — preparação obrigatória

- corrigiu a referência inexistente no workflow do Excel SME;
- criou verificador de referências locais dos workflows;
- integrou o gate à validação e à saúde das dependências;
- registrou o baseline técnico.

Referências:

```text
PR: #121
commit: ad2fed06d7d951cd510d3f93cf8b3232d0026c1e
auditoria: docs/audits/2026-08-01-rodada-0-baseline.md
```

Nenhum efeito em Production.

#### Rodada 1 — atualizações técnicas de baixo risco

- ESLint `10.7.0 → 10.8.0`;
- Acorn `8.17.0 → 8.18.0`;
- relatório HTML navegável do lint;
- validação de handlers inline com arquivo, linha e coluna;
- `actions/checkout` `7.0.0 → 7.0.1` em 14 workflows;
- ADR-038 sobre integração pertinente de atualizações.

Referências:

```text
PR principal: #122
commit ESLint/Acorn: ea0871e0ab0f6d6dc62f76ca7bad0e7021433a92
commit checkout: 20b4da15d100169d358f38070901891c99e4f3d7
auditoria: docs/audits/2026-08-01-rodada-1-baixo-risco.md
```

Esses componentes são predominantemente internos. Sua inclusão no pacote publicado não cria funcionalidade própria para o usuário.

#### Rodada 2 — busca, elementos flutuantes e transições

- Fuse.js `7.5.0` aplicado à busca existente;
- busca por escolas autorizadas, módulos, programas, competências e pendências consultáveis;
- tolerância a acentos, fragmentos e erros moderados;
- navegação por teclado;
- Floating UI `1.8.0` para menus e resultados;
- View Transition API com ativação progressiva e `prefers-reduced-motion`;
- bundles locais e carregamento sob demanda;
- central de comandos `Ctrl + K` deliberadamente excluída.

Referências:

```text
PR funcional: #123
commit funcional: 8e0a88e88621f4caac48b24049e774700688bd08
publicação: PR #124
commit publicado: f72a1471023f00eec0bc615c192fd25f5c29a920
deployment: dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp
fechamento da janela: PR #125
```

A Rodada 2 está **concluída e publicada**.

#### Rodada 3B — Supabase CLI 2.110.0

- Supabase CLI `2.109.1 → 2.110.0`;
- adaptação da segunda pilha descartável de restauração à validação do caminho de Edge Functions;
- 25 migrations e 225 testes pgTAP aprovados;
- lint, tipos, Auth, RLS, Edge Function e backup/restauração aprovados;
- nenhum acesso ou alteração no Supabase Production;
- nenhum deployment Vercel.

Referências:

```text
PR: #126
commit: 520b51e7080ddae0f4e3f03cf4c045cbea0a233d
evidência: docs/evidence/releases/2026-08-02-supabase-cli-2-110-0.json
```

A versão `2.111.0` foi analisada e adiada por não justificar uma nova rodada imediata.

#### Rodada 4A — reconciliação canônica do roadmap

Esta atualização documental:

- cria `docs/ROADMAP_ATUALIZACOES_2026.md`;
- reconcilia integralmente as listas técnica e funcional;
- registra status, prioridade, dependências, implantação e próxima decisão;
- atualiza os documentos canônicos posteriores às Rodadas 0, 1, 2 e 3B;
- institui avaliação tecnológica proativa em todas as tarefas futuras;
- não altera produto, dependências, banco ou Production.

## 3. Produção

### 3.1 Vercel

```text
project: radarpdde-fix
deployment: dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp
state: READY
target: production
artifactCommitSha: f72a1471023f00eec0bc615c192fd25f5c29a920
nodeVersion: 24.x
git.deploymentEnabled: false
```

O deployment vigente inclui as Rodadas 1 e 2. A Rodada 3B é uma atualização interna da CLI e corretamente não gerou novo deployment.

Evidência:

```text
docs/evidence/releases/2026-08-02-rodadas-1-2-production.json
```

### 3.2 Supabase

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
activeRepository: supabase
migrations correspondentes: 25
closing_competence: 2026-12
app_config.row_version: 5
```

As Rodadas 0, 1, 2, 3B e 4A não criaram migration nem alteraram dados, Auth, RLS, Edge Functions ou configuração remota do Supabase Production.

## 4. Estado das atualizações

O estado completo está no roadmap canônico. Em síntese:

### 4.1 Técnica

Concluídos:

- correção e prevenção de referências quebradas em workflows;
- ESLint 10.8.0;
- Acorn 8.18.0;
- `actions/checkout` 7.0.1;
- Supabase CLI 2.110.0.

Próxima atualização técnica recomendada:

```text
Playwright 1.61.1 → 1.62.0
```

Ela deve ser recriada sobre a `main`, pois o PR Dependabot `#79` foi aberto em base anterior. A atualização exige navegadores correspondentes, E2E integral, cinco perfis, Desktop Chrome, Pixel 7/Chromium e iPhone 15/WebKit. Não exige Production.

Pendências posteriores:

- confirmar o estado real do CodeQL nas configurações do GitHub;
- Dependency Review Action;
- `actionlint`;
- baseline informativo do `zizmor`;
- baseline de cobertura de testes.

### 4.2 Funcional

Concluídos e publicados:

- busca inteligente;
- posicionamento responsivo de elementos flutuantes;
- transições progressivas de navegação.

Parcial ou deliberadamente não executados:

- central de comandos `Ctrl + K` — adiada;
- data grid/Tabulator — adiado por baixo valor imediato frente ao custo;
- modularização ampla com esbuild — parcial;
- atalhos de teclado — parciais;
- histórico antes/depois — timeline existente, comparação estruturada pendente.

Continuam como candidatos sujeitos a avaliação:

- sistema comum de componentes;
- ajuda contextual;
- gráficos operacionais;
- Supabase Realtime;
- PWA e recuperação de rascunhos;
- visualizações salvas;
- indicadores de prazo e risco;
- assistência contextual baseada nas regras do PDDE;
- detecção de inconsistências;
- demais capacidades listadas no roadmap.

Nenhum desses candidatos está automaticamente autorizado para implementação.

## 5. Sequência vigente

```text
Rodada 4A — concluir e integrar a reconciliação documental
Rodada 4B — Playwright 1.62.0
Rodada 5  — segurança de CI e dependências
Rodada 6  — baseline de cobertura
Rodada 7  — escolher a próxima evolução funcional por benefício
```

Correções urgentes podem alterar a ordem. Em qualquer tarefa, deve ser avaliado se atualização ou instalação pertinente oferece solução materialmente superior.

## 6. Regra de evolução tecnológica proativa

Toda correção, melhoria de layout, mudança de fluxo ou nova capacidade deve verificar se a pilha atual limita o resultado.

Quando nova biblioteca, atualização ou capacidade moderna puder melhorar materialmente acessibilidade, desempenho, segurança, consistência, manutenção ou qualidade da experiência, a proposta deve ser apresentada antes de aceitar uma solução limitada.

A proposta deve explicar:

1. limite observado;
2. tecnologia sugerida;
3. ganho concreto;
4. alternativa sem nova dependência;
5. custo e risco;
6. impacto em bundle, dados, permissões e Production;
7. testes, rollback e evidências.

A proposta não autoriza instalação automática nem ampliação silenciosa de escopo. Solução existente continua preferível quando entrega resultado equivalente com menor custo.

## 7. Gates globais de liberação oficial

A liberação oficial ainda não foi declarada. Permanecem no processo geral:

1. homologar o relatório institucional preexistente no Microsoft Excel desktop, caso essa frente seja priorizada;
2. revisar Advisors quando aplicável;
3. concluir UAT funcional;
4. realizar polimento editorial e visual;
5. registrar decisão formal de release.

Esses gates não devem ser confundidos com o roadmap de pacotes e modernização incremental.

## 8. Documentos de continuidade

Ordem recomendada:

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/ROADMAP_ATUALIZACOES_2026.md`;
4. `docs/PROJECT_CONTEXT.md`;
5. `docs/DECISION_LOG.md`;
6. `docs/reference/STATUS_DOCUMENTOS.md`;
7. arquitetura específica da próxima frente;
8. especificações, planos, auditorias e evidências correspondentes.

Referências recentes:

- `docs/audits/2026-08-01-rodada-0-baseline.md`;
- `docs/audits/2026-08-01-rodada-1-baixo-risco.md`;
- `docs/audits/2026-08-01-rodada-2-busca-flutuantes-transicoes.md`;
- `docs/audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md`;
- `docs/evidence/releases/2026-08-02-rodadas-1-2-production.json`;
- `docs/evidence/releases/2026-08-02-supabase-cli-2-110-0.json`;
- `docs/superpowers/specs/2026-08-03-rodada-4a-roadmap-atualizacoes-design.md`;
- `docs/superpowers/plans/2026-08-03-rodada-4a-roadmap-atualizacoes.md`.
