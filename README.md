# RADAR PDDE

Sistema institucional de acompanhamento operacional do PDDE, com visão mensal, carteira de unidades, prontuário, pendências, registros internos, inventário, acompanhamento gerencial da Gestão SME e exportações institucionais.

> **Estado em 30 de julho de 2026:** conectado ao Supabase Production autorizado e publicado na Vercel Production. A liberação oficial ainda depende dos gates externos remanescentes descritos em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md).

## Estado funcional

Estão implementados e publicados:

- governança de acesso da Gestão SME;
- competência global de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- navegação contextual com preservação de competência, filtros, rolagem e foco;
- relatório institucional XLSX;
- Excel SME mensal;
- certificação automatizada de paridade integral;
- CSV legado como fallback;
- integração canônica com Supabase Production;
- reconciliação do histórico da migration SME;
- fixação deliberada do Node.js em `24.x`;
- gate remoto por papel institucional e viewport.

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

Ambientes:

| Ambiente | Persistência | Finalidade |
|---|---|---|
| local/teste | Supabase descartável ou LocalStorage controlado | desenvolvimento, regressão e contingência |
| Preview | Supabase autorizado com manifesto de Preview | homologação anterior à Production |
| Production | Supabase Production canônico | operação institucional |

`LocalStorageRepository` permanece somente como contingência por novo build controlado. Não existe sincronização automática do estado local para o Supabase.

## Runtime Node.js

A major operacional está fixada em Node.js `24.x`.

Contratos versionados:

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

A fixação consolida a major já utilizada pela Vercel e pelos workflows; não representa promoção para uma major sem histórico de testes.

## Gate remoto de perfis e viewports

O workflow canônico é:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

Ele executa em runner remoto do GitHub Actions e:

1. inicia um Supabase descartável;
2. aplica as 25 migrations versionadas;
3. cria identidades Auth efêmeras;
4. valida contratos Auth e RLS no desktop;
5. serve o código do próprio PR;
6. executa cinco papéis institucionais em:
   - Desktop Chrome;
   - Android / Pixel 7 / Chromium;
   - iPhone 15 / WebKit;
7. publica evidências e destrói o ambiente.

O gate não usa dados nem segredos de Production. A implementação também corrigiu a sobreposição móvel entre o seletor do Administrador técnico e o botão **Sair**.

## Requisitos de desenvolvimento

- Node.js `24.x`;
- npm compatível com o lockfile;
- Docker para a pilha local do Supabase;
- Supabase CLI conforme `package-lock.json`;
- Chromium e WebKit para os gates Playwright aplicáveis.

Instalação:

```bash
npm ci
```

Readiness principal:

```bash
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

## Fontes de verdade

Para qualquer decisão técnica ou funcional, consultar nesta ordem:

1. [`AGENTS.md`](AGENTS.md);
2. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
3. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
4. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
5. código e migrations da `main`;
6. estado efetivo do Supabase e da Vercel para dados mutáveis.

A memória de conversas e documentos históricos não substitui a verificação do código e dos ambientes.

## Bloqueadores remanescentes para release

Após a fixação do Node e a implantação do gate remoto, permanecem:

1. habilitar proteção contra senhas vazadas no Supabase Auth;
2. testar backup e restauração em ambiente descartável;
3. homologar manualmente os arquivos no Microsoft Excel desktop;
4. executar UAT funcional com representantes dos papéis reais;
5. realizar polimento editorial e visual;
6. registrar decisão formal de liberação.

## Evidência deste ciclo

- [`docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)
- [`docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)

## Segurança

- chaves administrativas nunca pertencem ao frontend;
- testes remotos usam ambientes e identidades descartáveis;
- Auth e RLS devem ser validados por papel e escopo;
- migrations exigem histórico alinhado, reset local, pgTAP, lint, tipos, dry-run, backup e rollback;
- nenhuma alteração em Production é inferida apenas porque o CI ficou verde.
