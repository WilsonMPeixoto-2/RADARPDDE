# Auditoria Funcional Frontend ↔ Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auditar as 41 operações atuais do RADAR PDDE e comprovar que cada controle do frontend alcança o serviço, repositório e recurso Supabase corretos, com autorização, persistência, releitura e tratamento de erro coerentes.

**Architecture:** A matriz funcional versionada é o índice da auditoria, mas cada contrato será revalidado diretamente contra a `main`. Leituras de Production serão estritamente não destrutivas; mutações serão exercitadas apenas no Supabase local ou em ambiente descartável. Falhas comprovadas gerarão planos e PRs corretivos separados, sem reabrir regras de negócio consolidadas.

**Tech Stack:** JavaScript/Node.js 24, Supabase CLI 2.110.0, Supabase JS 2.110.9, PostgreSQL 17, pgTAP, Playwright, GitHub Actions, Vercel e Markdown/JSON versionados.

## Global Constraints

- Baseline inicial: `main` em `97c8bedbd7c93d82d527e183762b37a0934bd5f0`; confirmar novamente antes de iniciar cada PR.
- O código-fonte e o estado remoto comprovado prevalecem sobre a documentação.
- Não reabrir regras de negócio consolidadas.
- Parar antes de qualquer mudança funcional não prevista e solicitar confirmação expressa.
- Não alterar dados reais em Production durante a auditoria.
- Production somente para consultas, manifestos, logs sanitizados, preflight e provas não destrutivas.
- Mutações somente no Supabase local ou em ambiente descartável com limpeza comprovada.
- Não criar contas técnicas nem ativar o smoke autenticado do PR nº 148 sem autorização específica.
- Não ampliar a suíte preventivamente; criar regressões apenas para falhas comprovadas.
- Cada correção deve usar branch e PR próprios, TDD, documentação e verificação pós-merge.
- Nenhum merge, migration, deploy ou alteração remota sem revisão do diff e gates aprovados.

---

### Task 1: Fixar o baseline técnico e o registro da auditoria

**Files:**
- Create: `docs/audits/2026-08-06-functional-supabase-audit.json`
- Create: `docs/audits/2026-08-06-functional-supabase-audit.md`
- Read: `docs/reference/functional-contract-matrix.json`
- Read: `docs/reference/functional-contract-matrix/core.json`
- Read: `docs/reference/functional-contract-matrix/configuration.json`
- Read: `docs/reference/functional-contract-matrix/operations.json`
- Read: `docs/reference/functional-contract-matrix/technical.json`

**Interfaces:**
- Consumes: `sourceCommit`, `operationFiles`, IDs e estados de cobertura da matriz funcional.
- Produces: registro canônico da auditoria com um item por operação e evidências rastreáveis.

- [ ] **Step 1: Confirmar fontes remotas**

Registrar no JSON e no Markdown:

```json
{
  "schemaVersion": 1,
  "baseline": {
    "mainCommit": "<SHA confirmado>",
    "productionMigrationCount": 27,
    "latestMigration": "202608050001_school_assignment_authorization",
    "supabaseProject": "scnryinorqeucbfkioxo",
    "supabaseJs": "2.110.9",
    "supabaseCli": "2.110.0"
  },
  "operations": []
}
```

Confirmar também o deployment Vercel, a versão ativa de `team-account-management`, os PRs nº 138, 150, 154 e 155 e os incidentes automáticos ainda abertos.

- [ ] **Step 2: Validar a matriz existente**

Run:

```bash
npm ci
npm run check:functional-matrix
npm run audit:functional
```

Expected: ambos os contratos aprovados; qualquer falha vira achado de baseline antes da auditoria funcional.

- [ ] **Step 3: Criar 41 entradas iniciais**

Cada entrada deve conter:

```json
{
  "id": "AUTH-01",
  "status": "pending",
  "frontend": null,
  "service": null,
  "repository": null,
  "backend": null,
  "authorization": null,
  "persistence": null,
  "reload": null,
  "errorHandling": null,
  "evidence": [],
  "findings": []
}
```

- [ ] **Step 4: Commit do baseline documental**

```bash
git add docs/audits/2026-08-06-functional-supabase-audit.json docs/audits/2026-08-06-functional-supabase-audit.md
git commit -m "docs: fixar baseline da auditoria funcional Supabase"
```

### Task 2: Revalidar estaticamente os 41 percursos frontend → Supabase

**Files:**
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.json`
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.md`
- Read: `app.js`
- Read: `src/integration/**`
- Read: `src/application/**`
- Read: `src/data/supabase-repository.js`
- Read: `supabase/functions/**`
- Read: `supabase/migrations/**`

**Interfaces:**
- Consumes: as 41 entradas pendentes.
- Produces: percurso estático confirmado ou achado objetivo por operação.

- [ ] **Step 1: Verificar controles e handlers**

Para cada operação, localizar o controle visível, a condição de perfil, o listener ou `onclick`, o payload montado e o tratamento de clique duplicado. Não aceitar apenas a âncora declarada na matriz.

- [ ] **Step 2: Verificar serviços e repositórios**

Confirmar a sequência real:

```text
handler → serviço de aplicação → DataService/UnitOfWork → SupabaseRepository → tabela/RPC/Edge Function
```

Registrar nome do método, recurso remoto e formato de retorno.

- [ ] **Step 3: Verificar autorização**

Para cada recurso, conferir `current_app_role()`, `can_access_school()`, `can_write_school()`, policies, grants, JWT e regras da Edge Function. Comparar o perfil permitido no frontend com o perfil aceito no banco.

- [ ] **Step 4: Executar verificadores estáticos**

```bash
npm run check
npm run check:functional-matrix
npm run check:supabase
npm run check:supabase-final
npm run typecheck:database
```

Expected: PASS. Uma divergência de caminho, símbolo, migration ou tipo deve ser registrada como achado, não corrigida silenciosamente nesta task.

- [ ] **Step 5: Classificar o percurso estático**

Usar somente:

```text
static-confirmed
static-gap
authorization-mismatch
backend-mismatch
documentation-divergence
```

- [ ] **Step 6: Commit do mapa estático**

```bash
git add docs/audits/2026-08-06-functional-supabase-audit.*
git commit -m "docs: mapear percursos frontend Supabase"
```

### Task 3: Comprovar autenticação, leitura, navegação e escopos

**Files:**
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.json`
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.md`
- Test: `tests/e2e/supabase-auth-local.spec.js`
- Test: `tests/e2e/supabase-full-contract.spec.js`
- Test: `tests/e2e/canonical-routes.spec.js`
- Test: `tests/e2e/cycle-b-carteira.spec.js`
- Test: `tests/e2e/frontend-contract.spec.js`

**Interfaces:**
- Consumes: `AUTH-01`, `NAV-01`, `NAV-02`, `COMP-01`, `READ-01` a `READ-04`.
- Produces: evidência por perfil para sessão, escopo, leitura, rota, busca, dashboard, Carteira, Prontuário e Pendências.

- [ ] **Step 1: Iniciar a pilha local limpa**

```bash
npm run supabase:start
npm run supabase:reset
```

Expected: 27 migrations e seed local aplicados.

- [ ] **Step 2: Preparar as sete identidades locais**

Usar os mesmos comandos do workflow `.github/workflows/supabase-readiness.yml`, com `RADAR_ALLOW_LOCAL_AUTH_BOOTSTRAP=true`, e executar:

```bash
npm run bootstrap:auth-fixtures
npm run check:auth-fixtures
```

Expected: sete identidades válidas; cinco perfis ativos, um perfil histórico inativo e uma identidade sem perfil.

- [ ] **Step 3: Executar as leituras por perfil**

```bash
npx playwright test \
  tests/e2e/supabase-auth-local.spec.js \
  tests/e2e/supabase-full-contract.spec.js \
  tests/e2e/canonical-routes.spec.js \
  tests/e2e/cycle-b-carteira.spec.js \
  tests/e2e/frontend-contract.spec.js \
  --project=desktop-chromium
```

Expected: perfis autorizados leem apenas o próprio recorte; negativas previstas permanecem bloqueadas.

- [ ] **Step 4: Consultar Production somente leitura**

Confirmar manifesto, modo `supabase-production`, bloqueio anônimo, preflight e auditoria agregada. Não ativar `.github/workflows/production-authenticated-read.yml` e não criar identidades técnicas.

- [ ] **Step 5: Atualizar estados**

Marcar cada operação como `confirmed`, `partial` ou `broken`, citando teste, run ou consulta.

- [ ] **Step 6: Encerrar a pilha local**

```bash
npm run supabase:stop
```

### Task 4: Comprovar Gestão de Equipe, escolas e carteira

**Files:**
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.*`
- Test: `tests/unit/team-account-role-transition.test.js`
- Test: `tests/unit/school-assignment-authorization.test.js`
- Test: `tests/e2e/supabase-full-contract.spec.js`
- Test: `supabase/tests/database/team-management-rpc.test.sql`
- Test: `supabase/tests/database/school-assignment-authorization.test.sql`
- Inspect: `src/application/directory-service.js`
- Inspect: `src/application/team-account-gateway.js`
- Inspect: `src/application/school-service.js`
- Inspect: `supabase/functions/team-account-management/index.ts`

**Interfaces:**
- Consumes: `TEAM-01` a `TEAM-04`, `SCH-01` a `SCH-03`.
- Produces: prova de cadastro, edição, desativação, transição de perfil, redistribuição unitária e em lote.

- [ ] **Step 1: Reexecutar os contratos do hotfix**

```bash
node --test \
  tests/unit/team-account-role-transition.test.js \
  tests/unit/school-assignment-authorization.test.js \
  tests/unit/team-account-gateway.test.js
```

- [ ] **Step 2: Executar pgTAP específico**

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
```

Confirmar a reutilização segura da conta Auth, um único perfil ativo, compensação, trigger de `controller_id` e negativas por perfil.

- [ ] **Step 3: Exercitar o fluxo completo com dados sintéticos**

Executar o percurso já existente no E2E: cadastrar, editar, desativar, redistribuir, reler e limpar. Verificar `administrative_logs` e ausência de resíduos.

- [ ] **Step 4: Verificar o cadastro institucional da escola**

Inspecionar a criação na interface e no `SchoolService`. Confirmar se INEP, CNPJ, designação, SICI e demais identificadores são exigidos do formulário ou substituídos por valores aleatórios. Caso valores artificiais possam chegar ao banco, classificar como falha técnica P0 e abrir plano corretivo separado; não definir novos campos nem nova regra sem confirmação.

- [ ] **Step 5: Registrar resultados e encerrar Supabase local**

```bash
npm run supabase:stop
```

### Task 5: Comprovar configurações, verificações e pendências

**Files:**
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.*`
- Test: `tests/unit/configuration-service.test.js`
- Test: `tests/unit/verification-remote-persistence.test.js`
- Test: `tests/unit/remote-operational-commands.test.js`
- Test: `tests/e2e/exercise-management.spec.js`
- Test: `tests/e2e/sme-access-governance.spec.js`
- Test: `tests/e2e/application-services.spec.js`
- Test: `supabase/tests/database/operational-command-rpc.test.sql`
- Test: `supabase/tests/database/verification-rpc.test.sql`

**Interfaces:**
- Consumes: `CFG-01` a `CFG-04`, `VER-01` a `VER-04`, `PEND-01` a `PEND-06`.
- Produces: prova de escrita, concorrência, idempotência, compensação, autoria e releitura.

- [ ] **Step 1: Executar contratos unitários e integrados**

```bash
node --test \
  tests/unit/configuration-service.test.js \
  tests/unit/verification-remote-persistence.test.js \
  tests/unit/remote-operational-commands.test.js

npx playwright test \
  tests/e2e/exercise-management.spec.js \
  tests/e2e/sme-access-governance.spec.js \
  tests/e2e/application-services.spec.js \
  --project=desktop-chromium
```

- [ ] **Step 2: Confirmar escrita e releitura no Supabase local**

Para cada operação, comparar o retorno da RPC, a tabela persistida, `row_version`, log administrativo e o estado após novo carregamento.

- [ ] **Step 3: Preservar regras de programas**

`CFG-03` e `CFG-04` não autorizam alteração de regra. Verificar somente se a implementação atual é internamente coerente com frontend, serviço e RLS. Uma contradição real deve ser apresentada ao usuário antes de qualquer mudança.

- [ ] **Step 4: Limpar dados sintéticos e registrar evidências**

Nenhuma entrada criada durante a prova pode permanecer após o teste.

### Task 6: Comprovar notas fiscais, bens e importações

**Files:**
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.*`
- Inspect: `src/application/invoice-service.js`
- Inspect: `src/application/inventory-service.js`
- Inspect: `src/data/import-coordinator.js`
- Test: `tests/unit/atomic-invoice-rpc.test.js`
- Test: `tests/e2e/application-services.spec.js`
- Test: `supabase/tests/database/invoice-rpc.test.sql`
- Test: `supabase/tests/database/inventory-capital-rls.test.sql`
- Test: `supabase/tests/database/operations-rpc.test.sql`

**Interfaces:**
- Consumes: `INV-01`, `INV-02`, `ASSET-01` a `ASSET-04`, `TECH-01`.
- Produces: prova de efeitos atômicos, reversão, escopo patrimonial, autoria e limpeza.

- [ ] **Step 1: Testar notas e efeitos vinculados**

Com dados sintéticos, cadastrar nota de consumo, serviço e permanente; editar; reler; excluir; confirmar restauração dos requisitos e ausência de bem órfão.

- [ ] **Step 2: Testar bens por perfil e CRE**

Cadastrar, encaminhar e inventariar; confirmar negativas de escopo e autoria.

- [ ] **Step 3: Auditar `ASSET-02`**

Comparar `InventoryService.updateAsset` com `saveAssetWithLog`. Se a edição usar `DataService.defaultPersist` sem versão e log enquanto a UI apresenta sucesso, reproduzir em teste RED e abrir correção isolada. Não modificar nesta task antes da evidência.

- [ ] **Step 4: Testar importação somente em ambiente descartável**

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

Confirmar staging, promoção, rollback e comparação final. Não executar importação remota.

### Task 7: Comprovar exportações e auditoria

**Files:**
- Modify: `docs/audits/2026-08-06-functional-supabase-audit.*`
- Inspect: `src/integration/excel-export-integration.js`
- Inspect: `src/domain/excel-xlsx-renderer.js`
- Inspect: `src/domain/excel-sme-monthly-renderer.js`
- Inspect: `src/application/audit-service.js`
- Inspect: `src/application/data-service.js`
- Inspect: `src/data/supabase-repository.js`
- Test: `tests/e2e/excel-export-button.spec.js`
- Test: `tests/e2e/assistant-dashboard-excel-actions.spec.js`
- Test: `tests/unit/audit-service.test.js`
- Test: `tests/unit/audit-functional-persistence-contract.test.js`

**Interfaces:**
- Consumes: `EXP-01`, `EXP-02`, `AUD-01`.
- Produces: prova de conteúdo, competência, download, falha recuperável e persistência de auditoria.

- [ ] **Step 1: Gerar e reabrir os arquivos reais**

```bash
npx playwright test \
  tests/e2e/excel-export-button.spec.js \
  tests/e2e/assistant-dashboard-excel-actions.spec.js \
  --project=desktop-chromium
```

Confirmar competência, filtros, quantidade de linhas, nomes de arquivo e reabertura via ExcelJS.

- [ ] **Step 2: Rastrear o log do clique até o banco**

Seguir `excel-export-integration.js` → `AuditService.record`/estado legado → `DataService.persist` → `SupabaseRepository` → `administrative_logs`.

- [ ] **Step 3: Testar RLS de autoria**

No Supabase local, gerar exportação com perfil autorizado, consultar o log pela mesma sessão e por perfil indevido e confirmar `actor_user_id`.

- [ ] **Step 4: Tratar o achado XLSX**

Se o log for apenas inserido no array local ou descartado pela RLS/persistência, criar teste RED específico e abrir plano corretivo separado. A geração do arquivo não deve ser considerada integralmente comprovada enquanto o sistema exibir auditoria que não persiste.

### Task 8: Triar e corrigir falhas comprovadas

**Files:**
- Create por achado: `docs/superpowers/plans/2026-08-06-<achado>.md`
- Create por achado: `docs/audits/2026-08-06-<achado>.md`
- Modify apenas os arquivos diretamente envolvidos no percurso quebrado.

**Interfaces:**
- Consumes: achados com reprodução e evidência.
- Produces: PRs pequenos, testados e documentados.

- [ ] **Step 1: Priorizar**

Ordem obrigatória:

```text
P0 perda/alteração incorreta de dados
P0 autorização indevida ou bloqueio de perfil autorizado
P0 botão/formulário sem persistência
P1 persistência sem releitura
P1 exportação ou auditoria inconsistente
P2 erro de UX ou documentação
```

- [ ] **Step 2: Aplicar debugging sistemático e TDD**

Para cada achado:

```text
reproduzir → localizar primeira fronteira divergente → teste RED → implementação mínima → GREEN → regressões do domínio → readiness
```

- [ ] **Step 3: Abrir PR separado**

A descrição deve registrar causa, percurso, regra preservada, dados de teste, limpeza, riscos e estado de Production.

- [ ] **Step 4: Publicar somente após aprovação**

Frontend, migration e Edge Function devem ser tratados separadamente e conferidos no ambiente efetivamente publicado.

### Task 9: Reconciliar a matriz e concluir a documentação

**Files:**
- Modify: `docs/reference/functional-contract-matrix.json`
- Modify: `docs/reference/functional-contract-matrix/core.json`
- Modify: `docs/reference/functional-contract-matrix/configuration.json`
- Modify: `docs/reference/functional-contract-matrix/operations.json`
- Modify: `docs/reference/functional-contract-matrix/technical.json`
- Regenerate: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`
- Modify: `docs/architecture/testing.md`
- Modify quando necessário: `docs/runbooks/SUPABASE_CONNECTION.md`
- Finalize: `docs/audits/2026-08-06-functional-supabase-audit.*`

**Interfaces:**
- Consumes: todas as evidências e PRs corretivos concluídos.
- Produces: estado canônico final da confiabilidade funcional.

- [ ] **Step 1: Atualizar cobertura sem inflar resultados**

Marcar `covered` somente quando percurso, autorização, persistência e releitura estiverem comprovados. Manter `partial` quando faltar prova não destrutiva de Production ou quando o smoke autenticado continuar desativado.

- [ ] **Step 2: Atualizar origem e gerar Markdown**

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

- [ ] **Step 3: Executar homologação final**

```bash
npm run test:readiness
npm run test:e2e
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

Expected: PASS, admitindo repetição apenas para falha externa comprovada, sem alteração de código.

- [ ] **Step 4: Revisar documentação contra fontes remotas**

Confirmar SHA da `main`, Vercel, migrations, Edge Functions, monitores e incidentes antes de afirmar publicação.

- [ ] **Step 5: Publicar relatório final**

O relatório deve apresentar contagens de:

```text
comprovadas
parcialmente comprovadas
corrigidas nesta frente
quebradas ainda abertas
contradições funcionais reais
```

- [ ] **Step 6: Commit e PR documental final**

```bash
git add docs/reference docs/CURRENT_STAGE.md docs/ROADMAP_ATUALIZACOES_2026.md docs/architecture/testing.md docs/runbooks/SUPABASE_CONNECTION.md docs/audits
git commit -m "docs: concluir auditoria funcional frontend Supabase"
```
