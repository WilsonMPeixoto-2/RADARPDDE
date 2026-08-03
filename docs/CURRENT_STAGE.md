# RADAR PDDE — Estado atual do projeto

- **Atualizado em:** 3 de agosto de 2026
- **Deployment Production vigente:** `dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp` — `READY`
- **Commit funcional publicado:** `f72a1471023f00eec0bc615c192fd25f5c29a920`
- **Projeto Supabase autorizado:** `scnryinorqeucbfkioxo` — `ACTIVE_HEALTHY`
- **Runtime Production:** `supabase-production`
- **Migrations correspondentes:** 25
- **Node.js:** `24.x`
- **Playwright validado:** `1.62.0`
- **Supabase CLI:** `2.110.0`
- **Incidente funcional aberto:** Excel SME retorna `404` em Production; correção no PR `#133`
- **Deployment automático:** bloqueado fora de janela controlada
- **Roadmap canônico:** `docs/ROADMAP_ATUALIZACOES_2026.md`

## 1. Como usar este documento

Este arquivo controla o estágio corrente, os ambientes e a próxima sequência. O portfólio completo de atualizações técnicas e funcionais está em `docs/ROADMAP_ATUALIZACOES_2026.md`.

Antes de iniciar qualquer tarefa:

1. consultar a `main` e os PRs abertos;
2. confirmar o deployment e o SHA efetivamente publicados;
3. confirmar Supabase, migrations e estado remoto quando a tarefa depender dessas camadas;
4. ler o roadmap, o contexto do projeto e o registro de decisões;
5. verificar se a frente anterior foi concluída, bloqueada, adiada ou substituída;
6. avaliar se atualização, instalação ou capacidade moderna permite resultado materialmente melhor;
7. executar os gates correspondentes ao impacto real, sem reduzir os pisos vigentes;
8. atualizar os documentos canônicos no mesmo ciclo de mudança material.

Código, ambientes efetivos e evidências reproduzíveis prevalecem sobre memória de chat, planos históricos e afirmações antigas.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

### 2.1 Produto e infraestrutura concluídos

- governança de acesso da Gestão SME;
- competência global de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- navegação contextual;
- correção de desempenho do login e da restauração de sessão;
- relatório institucional XLSX;
- motor, modelo e template do Excel SME homologados no Microsoft Excel desktop;
- Node.js fixado em `24.x`;
- gate remoto de cinco papéis em três viewports;
- backup e restauração em duas pilhas Supabase descartáveis;
- reconciliação do histórico da migration SME;
- bloqueio automático de deployment restaurado.

A homologação do conteúdo do Excel SME permanece válida. O incidente atual é de empacotamento: o deployment vigente não contém a pasta pública `assets`, impedindo que o navegador carregue o template antes da geração.

### 2.2 Rodadas de atualização

| Rodada | Estado | Resultado principal | Production |
|---|---|---|---|
| **0** | concluída | workflow do Excel SME e integridade de referências dos workflows | não exigida |
| **1** | concluída | ESLint 10.8.0, Acorn 8.18.0 e `actions/checkout` 7.0.1 | ferramentas internas |
| **2** | concluída e publicada | busca inteligente, Floating UI e View Transitions | deployment vigente |
| **3B** | concluída | Supabase CLI 2.110.0 e compatibilidade do backup/restauração | não exigida |
| **4A** | concluída | roadmap canônico e evolução tecnológica proativa | não exigida |
| **4B** | validada no PR `#128` | Playwright 1.62.0 e navegadores correspondentes | não exigida |

### 2.3 Hotfix do template Excel SME

Diagnóstico confirmado em 3 de agosto de 2026:

- o runtime solicita `/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`;
- o arquivo existe na `main`;
- o build Vercel copiava apenas `index.html`, `app.js`, `config.js`, `styles.css`, `src` e `vendor`;
- o artefato publicado não continha `assets`;
- a URL canônica do template retorna HTTP `404` em Production.

A correção do PR `#133` inclui `assets` no artefato `dist` e acrescenta teste específico para impedir regressão. Não altera XLSX, renderer, ExcelJS, Supabase, dados, migrations, Auth ou RLS.

A disponibilidade aos usuários depende de integração, publicação controlada e smoke de Production. Até novo deployment, o incidente permanece ativo no ambiente publicado.

## 3. Rodada 4B — Playwright 1.62.0

### 3.1 Alteração

- `@playwright/test`: `1.61.1 → 1.62.0`;
- `playwright`: `1.61.1 → 1.62.0`;
- `playwright-core`: `1.61.1 → 1.62.0`;
- requisito interno do Playwright: Node.js 20 ou superior;
- projeto preservado em Node.js 24.x;
- `fsevents` reorganizado automaticamente pelo npm no lockfile;
- Supabase CLI preservado em `2.110.0`;
- nenhuma outra dependência alterada.

O lockfile foi regenerado pelo npm sobre a `main` corrente. O PR Dependabot `#79`, aberto sobre base antiga, foi fechado como substituído pelo PR `#128`.

### 3.2 Matriz preservada

A rodada não adicionou Firefox nem alterou:

- projetos Playwright;
- locators;
- timeouts;
- retries;
- reporters;
- screenshots;
- limites Lighthouse;
- regras de produto.

Os novos recursos disponibilizados pela versão 1.62.0 não foram ativados sem caso de uso comprovado.

### 3.3 Evidência funcional

Pacote validado no SHA:

```text
6c03169ce0fab5833f818689bb87c8e07e1f122d
```

Workflows aprovados:

| Gate | Run | Resultado |
|---|---:|---|
| Saúde das dependências | `30786138787` | success |
| Homologação do Excel SME | `30786138685` | success |
| Lighthouse CI | `30786138689` | success |
| Supabase readiness | `30786138713` | success |
| Backup e restauração descartáveis | `30786138677` | success |
| Testes E2E Playwright | `30786138676` | success |
| Perfis × desktop, Android e iPhone | `30786138715` | success |

A saúde das dependências confirmou:

- Node.js `24.18.0` e npm `11.16.0`;
- `npm ci` reproduzível;
- 376 pacotes auditados;
- 2 vulnerabilidades moderadas já aceitas pela política do ExcelJS;
- 0 altas e 0 críticas;
- referências dos workflows, bundles, lint, Knip, assinaturas, SBOM e árvore instalada aprovados ou registrados.

### 3.4 Supabase descartável

Os gates repetiram com sucesso:

- 25 migrations;
- 225 testes pgTAP;
- lint SQL;
- tipos reproduzíveis;
- sete identidades Auth efêmeras;
- login, Auth, RLS e autorização da Edge Function;
- backup lógico e restauração em segunda pilha;
- equivalência de schema, dados, Auth e migrations.

Nenhuma dessas operações usou Production.

## 4. Produção

### 4.1 Vercel

```text
project: radarpdde-fix
deployment: dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp
state: READY
target: production
artifactCommitSha: f72a1471023f00eec0bc615c192fd25f5c29a920
nodeVersion: 24.x
git.deploymentEnabled: false
```

A Rodada 4B altera ferramenta de desenvolvimento e teste. Não modifica o bundle servido ao usuário e não exige novo deployment.

O deployment vigente, porém, não contém `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`. A correção do PR `#133` modifica o artefato servido e exige novo deployment de Production antes de ser considerada disponível.

### 4.2 Supabase

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
migrations correspondentes: 25
closing_competence: 2026-12
app_config.row_version: 5
```

A Rodada 4B e o hotfix do Excel SME não alteram migrations, schema, dados, Auth, RLS, Edge Functions ou configuração remota.

## 5. Desvios operacionais registrados

### 5.1 Documento criado fora da branch

A especificação da Rodada 4B foi criada por engano diretamente na `main` no commit `f99f17ec9eadbfbe5691b3c148f27374e4975459` e removida imediatamente no commit `e9f625c436fef31a18bd729f9a6791280ed59310`.

Consequências:

- árvore da `main` restaurada antes da criação da branch;
- somente um arquivo Markdown esteve envolvido;
- nenhuma dependência, código funcional ou ambiente foi alterado;
- a branch definitiva foi criada a partir da `main` restaurada.

### 5.2 Lockfile de base antiga

A primeira tentativa usou como referência os blobs do PR Dependabot `#79`. A revisão detectou que a base antiga também recuava o Supabase CLI de `2.110.0` para `2.109.1`.

A tentativa foi descartada antes da validação final. O lockfile definitivo foi regenerado pelo npm sobre a `main` atual e preserva o Supabase CLI `2.110.0`.

## 6. Próxima sequência técnica

A prioridade imediata é concluir o hotfix do Excel SME:

```text
validar SHA final do PR #133
→ integrar à main
→ abrir janela controlada de deployment
→ publicar em Production
→ confirmar HTTP 200 e geração do arquivo
→ restaurar bloqueio automático
```

Após o encerramento do incidente, a sequência recomendada volta a ser:

```text
Rodada 5 — verificar CodeQL, Dependency Review e actionlint; avaliar zizmor
Rodada 6 — baseline de cobertura de testes
Rodada 7 — selecionar a próxima evolução funcional por benefício
```

Correções urgentes podem alterar a ordem. A ADR-039 continua obrigando a avaliar oportunidades tecnológicas durante qualquer tarefa.

## 7. Gates globais de liberação oficial

A liberação oficial ainda não foi declarada. Permanecem no processo geral:

1. encerrar o incidente do Excel SME no ambiente publicado;
2. homologar o relatório institucional preexistente no Microsoft Excel desktop, caso essa frente seja priorizada;
3. revisar Advisors quando aplicável;
4. concluir UAT funcional;
5. realizar polimento editorial e visual;
6. registrar decisão formal de release.

Esses gates não devem ser confundidos com o roadmap de pacotes e modernização incremental.

## 8. Documentos de continuidade

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/ROADMAP_ATUALIZACOES_2026.md`;
4. `docs/PROJECT_CONTEXT.md`;
5. `docs/DECISION_LOG.md`;
6. `docs/reference/STATUS_DOCUMENTOS.md`;
7. `docs/audits/2026-08-03-hotfix-excel-sme-template-404.md`;
8. `docs/audits/2026-08-03-rodada-4b-playwright-1-62-0.md`;
9. `docs/evidence/releases/2026-08-03-playwright-1-62-0.json`.
