# RADAR PDDE

Sistema institucional de acompanhamento operacional do PDDE, com visão mensal, carteira de unidades, prontuário, pendências, registros internos, inventário, acompanhamento gerencial da Gestão SME e exportações institucionais.

> **Estado em 1º de agosto de 2026:** conectado ao Supabase Production autorizado e publicado na Vercel Production. A frente de criação/correção do Excel SME foi concluída, homologada no Microsoft Excel desktop e publicada. A liberação oficial do produto ainda depende dos gates globais descritos em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md).

## Estado funcional

Estão implementados e publicados:

- governança de acesso da Gestão SME;
- competência global de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- navegação contextual com preservação de competência, filtros, rolagem e foco;
- relatório institucional XLSX preexistente;
- Excel SME mensal de 30 colunas, baseado no template canônico, homologado sem reparo no Microsoft Excel desktop;
- certificação automatizada de paridade integral;
- CSV legado como fallback;
- integração canônica com Supabase Production;
- reconciliação do histórico da migration SME.

Hardening concluído e integrado ao repositório:

- Node.js fixado em `24.x`;
- gate remoto por papel institucional e viewport;
- backup lógico e restauração comprovados em duas pilhas Supabase descartáveis;
- comparação automatizada de schema, dados e histórico de migrations;
- publicação exclusiva de evidência sanitizada, sem dumps SQL no artefato do CI.

## Perfis e papéis

O sistema diferencia:

- **Controlador:** carteira principal e colaboração autorizada na própria CRE;
- **Assistente de Verbas Federais:** acompanhamento transversal e gestão autorizada da equipe da CRE;
- **Gestão SME:** consulta gerencial com restrições cumulativas de interface, serviço e RLS;
- **Equipe de Inventário:** superfície patrimonial da própria CRE;
- **Administrador técnico:** infraestrutura, escopos, importação, auditoria e simulação visual autorizada.

O Administrador técnico não constitui quinto perfil funcional visível e não substitui a Assistente na rotina da CRE.

## Arquitetura operacional

```text
frontend estático
→ contratos de aplicação e serviços
→ SupabaseRepository
→ Auth + PostgREST + RLS + RPC + Edge Function
→ PostgreSQL 17
```

| Ambiente | Persistência | Finalidade |
|---|---|---|
| local/teste | Supabase descartável ou LocalStorage controlado | desenvolvimento, regressão e contingência |
| Preview | Supabase autorizado com manifesto de Preview | homologação anterior à Production |
| Production | Supabase Production canônico | operação institucional |

`LocalStorageRepository` permanece somente como contingência por novo build controlado. Não existe sincronização automática do estado local para o Supabase.

## Runtime Node.js

A major operacional está fixada em Node.js `24.x`:

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

## Gate remoto de perfis e viewports

Workflow canônico:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

Ele inicia um Supabase descartável, aplica as 25 migrations, cria identidades Auth efêmeras, valida Auth/RLS e executa cinco papéis institucionais em Desktop Chrome, Pixel 7/Chromium e iPhone 15/WebKit. Não usa dados nem segredos de Production.

## Backup e restauração descartáveis

Workflow canônico:

```text
.github/workflows/backup-restore-disposable.yml
```

Comando local controlado:

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O gate:

1. inicia uma pilha Supabase de origem;
2. aplica migrations e seed versionados;
3. gera dumps lógicos de papéis, schema, dados e histórico de migrations;
4. inicia uma segunda pilha isolada;
5. restaura o backup de forma transacional;
6. compara schema, tabelas, contagens, conteúdo e histórico;
7. publica somente `evidence.json`;
8. destrói os ambientes descartáveis.

A execução é bloqueada sem a variável explícita de segurança e não aceita conexão `--linked` nem segredo remoto.

## Recurso pago excluído do escopo

A verificação de credenciais presentes em vazamentos conhecidos é oferecida pelo Supabase apenas no plano Pro ou superior. Como o projeto permanece no plano Free e não existe autorização de despesa, essa configuração não constitui bloqueador de release. A decisão deve ser revista caso o plano seja alterado.

## Requisitos de desenvolvimento

- Node.js `24.x`;
- npm compatível com o lockfile;
- Docker para a pilha local do Supabase;
- cliente PostgreSQL para o teste de restauração;
- Supabase CLI conforme `package-lock.json`;
- Chromium e WebKit para os gates Playwright aplicáveis.

Instalação e readiness:

```bash
npm ci
npm run test:readiness
```

Supabase local:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Interface:

```bash
npm run test:e2e
npm run test:mobile
```

Certificação Excel:

```bash
npm run certify:excel:fixture
```

## Exportações Excel

### Excel SME

O botão **Excel SME** gera uma única aba para a competência mensal ativa, com 30 colunas literais do modelo recebido da SME. A implementação usa o template canônico e ExcelJS 4.4.0, não inclui `dataValidations` e foi homologada no Microsoft Excel desktop sem aviso de reparo.

Essa frente foi concluída pelos PRs `#117`, `#118` e `#119`, incluindo implementação, publicação controlada e encerramento da janela de deployment.

### Relatório institucional

O relatório institucional XLSX de quatro abas já existia antes da correção do Excel SME e permanece produto independente. Qualquer homologação ou evolução futura desse arquivo não constitui pendência da frente Excel SME.

## Fontes de verdade

1. [`AGENTS.md`](AGENTS.md);
2. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
3. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
4. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
5. código e migrations da `main`;
6. estado efetivo do Supabase e da Vercel para dados mutáveis.

## Gates globais remanescentes para release

Os itens abaixo pertencem ao processo geral de liberação do produto e não são pendências do Excel SME:

1. homologar o relatório institucional preexistente no Microsoft Excel desktop, caso essa frente seja priorizada;
2. revisar os Advisors do Supabase quando aplicável;
3. executar UAT funcional com representantes dos papéis reais;
4. realizar polimento editorial e visual;
5. registrar decisão formal de liberação.

## Evidências recentes

- [`docs/evidence/releases/2026-08-01-excel-sme-production.json`](docs/evidence/releases/2026-08-01-excel-sme-production.json)
- [`docs/audits/2026-07-30-backup-restore-disposable.md`](docs/audits/2026-07-30-backup-restore-disposable.md)
- [`docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)
- [`docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)

## Segurança

- chaves administrativas nunca pertencem ao frontend;
- testes remotos usam ambientes e identidades descartáveis;
- Auth e RLS são validados por papel e escopo;
- dumps SQL não são publicados como artefatos do CI;
- migrations exigem histórico alinhado, reset local, pgTAP, lint, tipos, dry-run, backup e rollback;
- nenhuma alteração em Production é inferida apenas porque o CI ficou verde.
