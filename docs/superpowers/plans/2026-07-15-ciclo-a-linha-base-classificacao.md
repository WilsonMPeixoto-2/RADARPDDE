# Ciclo A — Linha de Base, Classificação e Contratos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** produzir uma linha de base funcional, visual, documental, técnica e de dados do RADAR PDDE, sem alterar o comportamento do produto, e converter a auditoria em decisões, contratos e backlog priorizado para os ciclos seguintes.

**Architecture:** o Ciclo A será executado em worktree e branch isoladas. Ferramentas determinísticas gerarão inventário técnico, manifesto e capturas visuais; documentos independentes registrarão decisões, dados, superfícies, contratos e backlog. Nenhum módulo funcional será modificado, e a PR permanecerá em rascunho até que evidências, validações e dúvidas materiais estejam fechadas.

**Tech Stack:** JavaScript CommonJS e ESM; Node.js 24; npm; Playwright 1.61.1; Chromium; WebKit; Git; Markdown; JSON; nenhuma dependência nova.

## Global Constraints

- Partir da `main` que contém o merge do Plano Diretor pós-PR 22.
- Não alterar `app.js`, `index.html`, `styles.css`, `config.js`, `config.runtime.js`, `src/**`, `supabase/**`, `vercel.json`, `.github/workflows/**` ou a exportação Excel.
- Produção permanece em modo local e não recebe deployment neste ciclo.
- Nenhuma URL, chave, senha, token, `service_role` ou `sb_secret_*` será adicionada.
- Nenhuma conexão Supabase remota será executada.
- Ferramentas de auditoria não podem alterar o estado funcional fora de contextos descartáveis do Playwright.
- Toda captura deve identificar commit, perfil, superfície, estado e viewport.
- Evidências versionadas devem substituir o nome do usuário por `Usuário de teste` e não podem exibir e-mail ou telefone pessoal.
- A classificação permitida é exclusivamente `CP`, `ID`, `FA`, `IC`, `DC`, `DQ`, `DF` ou `EP`.
- Nenhum achado `DQ` pode virar recomendação definitiva sem consulta ao responsável.
- Nenhum pacote dos Ciclos B–H será implementado nesta PR.
- Usar TDD para ferramentas de inventário, manifesto e validação.
- Commits pequenos e semânticos; revisar cada tarefa antes de seguir.

---

## File Map

### Create

- `docs/reference/PRODUCT_DECISIONS.md`
- `docs/reference/CHANGE_CLASSIFICATION.md`
- `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`
- `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`
- `docs/audits/2026-07-15-inventario-tecnico-global.md`
- `docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md`
- `docs/audits/2026-07-15-produto-estado-atual.md`
- `docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`
- `docs/handoff/2026-07-15-ciclo-a-final-report.md`
- `scripts/audit/generate-repository-inventory.mjs`
- `scripts/audit/prepare-baseline-output.mjs`
- `scripts/audit/build-baseline-manifest.mjs`
- `scripts/audit/validate-cycle-a-artifacts.mjs`
- `tests/unit/audit-tools.test.js`
- `tests/audit/global-baseline.spec.js`
- `playwright.audit.config.js`
- `docs/evidence/global-baseline/repository-inventory.json`
- `docs/evidence/global-baseline/manifest.json`
- `docs/evidence/global-baseline/desktop/*.png`
- `docs/evidence/global-baseline/android/*.png`
- `docs/evidence/global-baseline/iphone/*.png`

### Modify

- `package.json` — scripts `audit:inventory`, `audit:baseline` e `audit:cycle-a`.
- `docs/README.md` — índice dos artefatos aprovados.

---

### Task 1: Isolar a execução e congelar a linha de base

**Files:**
- Read: `docs/README.md`
- Read: `docs/reference/STATUS_DOCUMENTOS.md`
- Read: `docs/superpowers/plans/2026-07-14-plano-diretor-consolidacao-evolucao-pos-pr22.md`
- Read: `docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`
- Read: `README.md`
- Create: `docs/audits/2026-07-15-inventario-tecnico-global.md`

**Interfaces:**
- Consumes: `origin/main` após o Plano Diretor.
- Produces: commit de referência e resultados da baseline usados nas tarefas seguintes.

- [ ] **Step 1: Criar worktree isolada**

```bash
git fetch origin
git worktree add ../RADARPDDE-ciclo-a -b docs/ciclo-a-execucao origin/main
cd ../RADARPDDE-ciclo-a
```

Expected: worktree limpa na branch `docs/ciclo-a-execucao`.

- [ ] **Step 2: Confirmar preflight Git**

```bash
git status --short
git branch --show-current
git log -5 --oneline
git diff --stat
git diff
```

Expected: branch `docs/ciclo-a-execucao`; status e diffs vazios.

- [ ] **Step 3: Instalar dependências e executar baseline estrutural**

```bash
npm ci
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
npm run test:readiness
```

Expected: todos os comandos com exit code `0`; `package-lock.json` inalterado.

- [ ] **Step 4: Executar baseline de interface**

```bash
npm run test:e2e
npm run test:mobile
```

Expected: desktop Chromium, Pixel 7/Chromium e iPhone 15/WebKit aprovados.

- [ ] **Step 5: Gravar linha de base sem placeholder**

```bash
BASELINE_COMMIT="$(git rev-parse HEAD)"
mkdir -p docs/audits
cat > docs/audits/2026-07-15-inventario-tecnico-global.md <<EOF
# Inventário técnico global do RADAR PDDE

## Linha de base

| Campo | Valor |
|---|---|
| Data da auditoria | 15/07/2026 |
| Branch de execução | \`docs/ciclo-a-execucao\` |
| Commit de referência | \`${BASELINE_COMMIT}\` |
| Persistência publicada | \`LocalStorageRepository\` |
| Modo de dados | \`local\` |
| Supabase remoto | não conectado |
| Node.js | \`24.x\` |

## Baseline de validação

| Comando | Resultado |
|---|---|
| \`npm run check\` | aprovado |
| \`npm run test:unit\` | aprovado |
| \`npm run test:integration\` | aprovado |
| \`npm run audit:functional\` | aprovado |
| \`npm run test:readiness\` | aprovado |
| \`npm run test:e2e\` | aprovado |
| \`npm run test:mobile\` | aprovado |

## Regra de escopo

Este documento registra o estado atual. O Ciclo A não altera comportamento funcional, layout, regras, persistência, migrations ou produção.
EOF
```

- [ ] **Step 6: Confirmar escopo e commit**

```bash
test "$(git diff --name-only)" = "docs/audits/2026-07-15-inventario-tecnico-global.md"
git add docs/audits/2026-07-15-inventario-tecnico-global.md
git commit -m "docs: congelar linha de base do Ciclo A"
```

---

### Task 2: Formalizar decisões e classificação de mudanças

**Files:**
- Create: `docs/reference/PRODUCT_DECISIONS.md`
- Create: `docs/reference/CHANGE_CLASSIFICATION.md`

**Interfaces:**
- Consumes: precedência documental e regras consolidadas.
- Produces: IDs de decisão e oito códigos usados por todo o ciclo.

- [ ] **Step 1: Levantar decisões explícitas**

```bash
git grep -n -E "não deve|não existe|permanece|preserv|aprovad|canônic|bonificação|reanálise|retificação|indicadores" -- README.md docs app.js tests > /tmp/radar-decisions.txt
wc -l /tmp/radar-decisions.txt
```

Expected: referências em documentação, testes e implementação para revisão.

- [ ] **Step 2: Criar `PRODUCT_DECISIONS.md`**

O arquivo deve conter exatamente estes grupos e IDs:

```markdown
# Decisões de produto do RADAR PDDE

## Precedência

1. orientação expressa mais recente do responsável;
2. relatório atual de execução;
3. Dossiê Consolidado v1.0;
4. Plano do Lote 2 v2.0;
5. especificação e plano vigentes;
6. implementação vigente.

## Domínio

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PD-001 | A unidade escolar é a entidade monitorada. | `docs/README.md` | nova determinação institucional |
| PD-002 | Bonificação, análise técnica e pendência são dimensões independentes. | `README.md`; Dossiê | nova regra institucional |
| PD-003 | Novo envio não resolve pendência. | `README.md` | alteração expressa do fluxo |
| PD-004 | Reanálise positiva resolve; reanálise negativa reabre a providência. | `README.md` | alteração expressa do fluxo |
| PD-005 | Pendência não altera automaticamente bonificação. | `docs/README.md` | nova regra institucional |
| PD-006 | Retificação não altera automaticamente análise ou pendência. | `docs/README.md` | nova regra institucional |
| PD-007 | `Aberta` e `Aguardando reanálise` são estados ativos. | `docs/README.md` | mudança expressa do modelo |
| PD-008 | Não existe estado canônico `Vencida`. | `docs/README.md` | mudança expressa do modelo |
| PD-009 | Indicadores operacionais podem se sobrepor e não devem ser somados. | `docs/README.md` | redefinição formal dos universos |

## Persistência e Supabase

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PS-001 | Produção permanece em `localStorage` até autorização expressa. | Plano Diretor; PR 22 | autorização de ativação |
| PS-002 | Supabase remoto ainda não está implantado. | `README.md` | projeto remoto conectado |
| PS-003 | Auth/RLS remotos são etapa futura, não defeito do gate local. | Plano Diretor | execução do Ciclo F |
| PS-004 | Segredos administrativos nunca entram no frontend, GitHub ou logs. | `README.md` | decisão não reabrível |
| PS-005 | Migração remota exige cópia controlada, reconciliação e rollback. | runbook de migração | novo desenho aprovado |

## Visual, navegação e exportação

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PV-001 | Alteração material de layout exige proposta visual e aprovação. | Plano Diretor | decisão não reabrível |
| PV-002 | Melhorias preservam informação, ações, permissões e regras. | `STATUS_DOCUMENTOS.md` | decisão expressa por pacote |
| PV-003 | Carteira mobile usa cartões; tabela desktop é a referência atual. | `README.md` | auditoria e proposta aprovadas |
| PV-004 | Exportação Excel v2.1 é referência congelada. | `STATUS_DOCUMENTOS.md` | plano autônomo aprovado |

## Regra de manutenção

Uma decisão só pode ser alterada quando o PR indicar o ID afetado, apresentar a nova fonte de autoridade, explicar a consequência e registrar a decisão substituta.
```

- [ ] **Step 3: Criar `CHANGE_CLASSIFICATION.md`**

Para cada código, registrar definição, evidência mínima, conduta permitida, conduta proibida e exemplo do RADAR:

```markdown
# Classificação de mudanças do RADAR PDDE

## Regra geral

Nenhum achado entra no backlog sem código, evidência e conduta.

## `CP` — Correto e protegido
- Evidência mínima: teste, fluxo e fonte documental compatíveis.
- Conduta: preservar; ampliar teste apenas quando insuficiente.
- Proibição: substituir por preferência técnica ou estética.
- Exemplo: independência entre bonificação e pendência.

## `ID` — Intencional e deliberado
- Evidência mínima: fonte canônica ou confirmação expressa.
- Conduta: documentar e proteger.
- Proibição: corrigir sem nova decisão.
- Exemplo: inexistência do estado `Vencida`.

## `FA` — Funcional e aprimorável
- Evidência mínima: ganho observável de clareza, produtividade ou manutenção.
- Conduta: apresentar alternativas, risco e resultado esperado.
- Proibição: implementar sem comparação e aprovação quando material.
- Exemplo: colunas configuráveis na Carteira.

## `IC` — Inconsistente ou duplicado
- Evidência mínima: soluções concorrentes para o mesmo contrato.
- Conduta: mapear consumidores e consolidar com regressão protegida.
- Proibição: remover arquivo pelo nome `final` ou `hotfix`.
- Exemplo: folhas CSS sucessivas em `config.js`.

## `DC` — Defeito comprovado
- Evidência mínima: reprodução, teste falhando ou contrato violado.
- Conduta: corrigir com teste de regressão.
- Proibição: classificar por gosto.
- Exemplo: resultado filtrado incompatível com indicador.

## `DQ` — Dúvida de produto ou regra
- Evidência mínima: fontes conflitantes ou ausência de autoridade.
- Conduta: perguntar com alternativas e consequências.
- Proibição: escolher silenciosamente.
- Exemplo: ocultar coluna sem confirmar uso real.

## `DF` — Dependente de etapa futura
- Evidência mínima: plano ou runbook vigente.
- Conduta: vincular ao ciclo futuro.
- Proibição: apresentar como falha atual.
- Exemplo: Auth/RLS no Supabase remoto.

## `EP` — Evolução posterior
- Evidência mínima: benefício plausível sem urgência atual.
- Conduta: manter no roadmap com prioridade justificada.
- Proibição: deslocar trabalho crítico.
- Exemplo: indicadores preditivos antes da observabilidade.
```

- [ ] **Step 4: Verificar e commit**

```bash
for code in CP ID FA IC DC DQ DF EP; do git grep -q "## \`${code}\`" -- docs/reference/CHANGE_CLASSIFICATION.md; done
for id in PD-001 PD-009 PS-001 PS-005 PV-001 PV-004; do git grep -q "$id" -- docs/reference/PRODUCT_DECISIONS.md; done
git add docs/reference/PRODUCT_DECISIONS.md docs/reference/CHANGE_CLASSIFICATION.md
git commit -m "docs: formalizar decisões e classificação de mudanças"
```

---

### Task 3: Implementar inventário técnico determinístico

**Files:**
- Create: `scripts/audit/generate-repository-inventory.mjs`
- Create: `tests/unit/audit-tools.test.js`
- Modify: `package.json`
- Generate: `docs/evidence/global-baseline/repository-inventory.json`
- Modify: `docs/audits/2026-07-15-inventario-tecnico-global.md`

**Interfaces:**
- Produces: `generateRepositoryInventory(rootDir): Promise<object>`.
- Produces: `npm run audit:inventory`.

- [ ] **Step 1: Escrever teste falhando**

Criar `tests/unit/audit-tools.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = path.resolve(__dirname, '../..');

async function importAuditModule(name) {
  return import(pathToFileURL(path.join(rootDir, `scripts/audit/${name}`)).href);
}

test('inventário técnico é determinístico e reconhece a arquitetura vigente', async () => {
  const { generateRepositoryInventory } = await importAuditModule('generate-repository-inventory.mjs');
  const first = await generateRepositoryInventory(rootDir);
  const second = await generateRepositoryInventory(rootDir);

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.package.name, 'radar-pdde');
  assert.equal(first.package.scripts.start, 'http-server . -p 4175 -c-1');
  assert.ok(first.files.some(file => file.path === 'app.js' && file.category === 'frontend-core'));
  assert.ok(first.files.some(file => file.path === 'config.js' && file.category === 'configuration'));
  assert.ok(first.files.some(file => file.path.startsWith('src/styles/') && file.category === 'styles'));
  assert.ok(first.files.some(file => file.path.startsWith('tests/e2e/') && file.category === 'e2e-tests'));
  assert.equal(first.runtimeExtensions.styles[0], 'src/styles/mobile-responsive.css');
  assert.ok(first.runtimeExtensions.scripts.includes('src/integration/cycle-b-dashboard.js'));
  assert.equal(first.supabase.migrationCount, 12);
});
```

- [ ] **Step 2: Confirmar falha**

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar gerador**

Criar `scripts/audit/generate-repository-inventory.mjs`:

```javascript
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.html', '.css', '.sql', '.yml', '.yaml', '.txt']);

function classifyFile(filePath) {
  if (['app.js', 'index.html', 'styles.css'].includes(filePath)) return 'frontend-core';
  if (['config.js', 'config.runtime.js', '.env.example'].includes(filePath)) return 'configuration';
  if (filePath.startsWith('src/domain/')) return 'domain';
  if (filePath.startsWith('src/application/')) return 'application';
  if (filePath.startsWith('src/data/')) return 'data';
  if (filePath.startsWith('src/integration/')) return 'integration';
  if (filePath.startsWith('src/styles/')) return 'styles';
  if (filePath.startsWith('tests/unit/')) return 'unit-tests';
  if (filePath.startsWith('tests/integration/')) return 'integration-tests';
  if (filePath.startsWith('tests/e2e/')) return 'e2e-tests';
  if (filePath.startsWith('tests/audit/')) return 'audit-tests';
  if (filePath.startsWith('supabase/migrations/')) return 'migrations';
  if (filePath.startsWith('supabase/tests/')) return 'database-tests';
  if (filePath.startsWith('.github/workflows/')) return 'workflows';
  if (filePath.startsWith('docs/')) return 'documentation';
  if (filePath.startsWith('scripts/')) return 'scripts';
  return 'other';
}

async function trackedFiles(rootDir) {
  const { stdout } = await execFileAsync('git', ['ls-files', '-z'], { cwd: rootDir, encoding: 'buffer' });
  return stdout.toString('utf8').split('\0').filter(Boolean).sort((a, b) => a.localeCompare(b));
}

async function inspectFile(rootDir, filePath) {
  const absolutePath = path.join(rootDir, filePath);
  const fileStat = await stat(absolutePath);
  const record = { path: filePath, category: classifyFile(filePath), bytes: fileStat.size };
  const extension = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(extension) || ['app.js', 'styles.css'].includes(filePath)) {
    const content = await readFile(absolutePath, 'utf8');
    record.lines = content === '' ? 0 : content.split(/\r?\n/).length;
  }
  return record;
}

function extractRuntimeExtensions(configSource) {
  return {
    styles: [...configSource.matchAll(/loadStylesheet\('([^']+)'\)/g)].map(match => match[1]),
    scripts: [...configSource.matchAll(/loadScript\('([^']+)'/g)].map(match => match[1])
  };
}

export async function generateRepositoryInventory(rootDir) {
  const [packageSource, configSource, paths] = await Promise.all([
    readFile(path.join(rootDir, 'package.json'), 'utf8'),
    readFile(path.join(rootDir, 'config.js'), 'utf8'),
    trackedFiles(rootDir)
  ]);
  const packageJson = JSON.parse(packageSource);
  const files = [];
  for (const filePath of paths) files.push(await inspectFile(rootDir, filePath));
  const categories = [...new Set(files.map(file => file.category))].sort();

  return {
    schemaVersion: 1,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      engines: packageJson.engines,
      scripts: Object.fromEntries(Object.entries(packageJson.scripts).sort(([a], [b]) => a.localeCompare(b))),
      devDependencies: Object.fromEntries(Object.entries(packageJson.devDependencies).sort(([a], [b]) => a.localeCompare(b)))
    },
    runtimeExtensions: extractRuntimeExtensions(configSource),
    supabase: { migrationCount: files.filter(file => file.category === 'migrations' && file.path.endsWith('.sql')).length },
    summaries: Object.fromEntries(categories.map(category => [category, files.filter(file => file.category === category).length])),
    files
  };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outputPath = path.join(rootDir, 'docs/evidence/global-baseline/repository-inventory.json');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(await generateRepositoryInventory(rootDir), null, 2)}\n`, 'utf8');
  console.log(`Inventário gravado em ${path.relative(rootDir, outputPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
```

- [ ] **Step 4: Adicionar script npm e validar**

Adicionar após `audit:functional:json`:

```json
"audit:inventory": "node scripts/audit/generate-repository-inventory.mjs",
```

Executar:

```bash
node --test tests/unit/audit-tools.test.js
npm run audit:inventory
npm run check
npm run test:unit
```

Expected: PASS e `repository-inventory.json` gerado.

- [ ] **Step 5: Completar inventário técnico**

```bash
node -e "const x=require('./docs/evidence/global-baseline/repository-inventory.json'); console.table(x.summaries)"
git grep -n "loadStylesheet\|loadScript" -- config.js
git grep -n -E "window\.alert|window\.confirm|alert\(|confirm\(" -- '*.js' ':!vendor/**' ':!src/vendor/**'
git grep -n -E "onclick=|style=" -- index.html app.js
git grep -n "localStorage" -- app.js config.js src tests
```

Completar `docs/audits/2026-07-15-inventario-tecnico-global.md` com arquitetura, concentração, ordem de carregamento, testes, dependências, pontos fortes, riscos e achados classificados. Cada achado deve citar caminho e linha ou teste.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/audit/generate-repository-inventory.mjs tests/unit/audit-tools.test.js docs/evidence/global-baseline/repository-inventory.json docs/audits/2026-07-15-inventario-tecnico-global.md
git commit -m "test: tornar inventário técnico reproduzível"
```

---

### Task 4: Classificar dados e ambientes

**Files:**
- Create: `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`
- Create: `docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md`

**Interfaces:**
- Consumes: inventário, código, migrations, testes e runbooks.
- Produces: política que separa risco atual de proteção futura do Supabase.

- [ ] **Step 1: Localizar dados e credenciais**

```bash
git grep -n -E "email|telefone|diretor|designacao|inep|cnpj|password|publishable|service_role|sb_secret|localStorage|sessionStorage|console\.|audit|snapshot|fixture|seed" -- app.js config.js config.runtime.js .env.example src scripts tests supabase docs > /tmp/radar-data-locations.txt
wc -l /tmp/radar-data-locations.txt
```

- [ ] **Step 2: Criar política de classificação**

`docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md` deve conter:

```markdown
# Classificação de dados e ambientes do RADAR PDDE

| Código | Classe | Exemplos | Git | Bundle | Preview | Produção | Logs |
|---|---|---|---|---|---|---|---|
| D0 | público institucional | nome público da escola, designação, INEP público | permitido | permitido se necessário | permitido | permitido | mínimo |
| D1 | interno institucional | status, atribuição, observação operacional | somente fixture fictícia | somente quando indispensável | protegido | protegido | sem conteúdo integral |
| D2 | pessoal/contato | nome de diretor, e-mail, telefone | não versionar sem necessidade e base | evitar | protegido e minimizado | protegido e minimizado | proibido salvo identificador técnico |
| D3 | credencial/segredo | senha, service role, token administrativo | proibido | proibido | secret store | secret store | proibido |
| D4 | configuração pública | modo, URL pública, chave publicável | exemplo vazio permitido | permitido quando autorizado | permitido | permitido | diagnóstico sem segredo |
| D5 | fixture/demonstração | escola e usuário fictícios | permitido | permitido | permitido | não usar como dado real | permitido sem dado pessoal |
| D6 | log/auditoria | ator, ação, data, versão | schema permitido | por permissão | protegido | protegido | retenção definida |
| D7 | snapshot/migração | estado canônico e staging | não versionar com dados reais | proibido | armazenamento controlado | armazenamento controlado | somente contagens e hash |
```

Adicionar finalidade, minimização, fonte oficial, acesso, retenção, mascaramento, ambientes, histórico Git, Preview, Supabase, logs e incidentes.

- [ ] **Step 3: Criar auditoria factual**

`docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md` deve usar:

```markdown
| Evidência | Local atual | Classe | Exposição atual | Proteção atual | Proteção futura | Classe do achado | Conduta |
|---|---|---|---|---|---|---|---|
```

Cobrir dados iniciais de escolas, perfil no HTML, runtime config, `localStorage`, snapshots, fixtures Auth, logs administrativos, Excel, artefatos de CI, chave publicável e segredos proibidos.

- [ ] **Step 4: Registrar dúvidas específicas**

Cada `DQ` deve seguir:

```markdown
### DQ-01 — Título específico
- Evidência:
- Intenção não comprovada:
- Alternativa A e consequência:
- Alternativa B e consequência:
- Recomendação técnica provisória:
- Decisão necessária:
```

Se não houver `DQ`, registrar expressamente que nenhuma dúvida material foi encontrada nesta frente.

- [ ] **Step 5: Validar e commit**

```bash
npm run check:supabase
npm run check:runtime-config
git diff --check
git grep -n -E "sb_secret_|service_role|postgres(ql)?://|SUPABASE_ADMIN_KEY=" -- docs scripts tests package.json ':!docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md' || true
git add docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md
git commit -m "docs: classificar dados e ambientes do RADAR"
```

---

### Task 5: Criar linha de base visual reproduzível

**Files:**
- Create: `playwright.audit.config.js`
- Create: `tests/audit/global-baseline.spec.js`
- Create: `scripts/audit/prepare-baseline-output.mjs`
- Create: `scripts/audit/build-baseline-manifest.mjs`
- Modify: `tests/unit/audit-tools.test.js`
- Modify: `package.json`
- Generate: `docs/evidence/global-baseline/manifest.json`
- Generate: 24 PNGs em `desktop`, `android` e `iphone`.

**Interfaces:**
- Produces: `npm run audit:baseline`.
- Produces: manifesto `{ schemaVersion, commit, captures }`.

- [ ] **Step 1: Congelar contrato de nomes**

Acrescentar a `tests/unit/audit-tools.test.js`:

```javascript
test('nome de captura visual é determinístico', () => {
  const valid = /^(controlador|sme)__[a-z0-9-]+__[a-z0-9-]+__(desktop|android|iphone)\.png$/;
  assert.match('controlador__dashboard__padrao__desktop.png', valid);
  assert.match('sme__configuracoes__padrao__iphone.png', valid);
  assert.doesNotMatch('Dashboard Final.png', valid);
});
```

Executar:

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: PASS.

- [ ] **Step 2: Criar preparação da saída**

Criar `scripts/audit/prepare-baseline-output.mjs`:

```javascript
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceRoot = path.join(rootDir, 'docs/evidence/global-baseline');

for (const name of ['desktop', 'android', 'iphone']) {
  await rm(path.join(evidenceRoot, name), { recursive: true, force: true });
  await mkdir(path.join(evidenceRoot, name), { recursive: true });
}
await rm(path.join(evidenceRoot, 'manifest.json'), { force: true });
console.log('Diretórios de captura preparados.');
```

Este script preserva `repository-inventory.json`.

- [ ] **Step 3: Criar configuração Playwright**

Criar `playwright.audit.config.js`:

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/audit',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/audit-baseline',
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'off', screenshot: 'off', video: 'off' },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } }
  ]
});
```

- [ ] **Step 4: Criar capturador**

Criar `tests/audit/global-baseline.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

const evidenceRoot = path.resolve(__dirname, '../../docs/evidence/global-baseline');
const scenarios = [
  { profile: 'controlador', surface: 'dashboard', state: 'padrao', view: 'dashboard' },
  { profile: 'controlador', surface: 'carteira', state: 'resultado', view: 'escolas' },
  { profile: 'controlador', surface: 'competencias', state: 'padrao', view: 'competencias' },
  { profile: 'controlador', surface: 'pendencias', state: 'padrao', view: 'pendencias' },
  { profile: 'controlador', surface: 'inventario', state: 'padrao', view: 'inventario' },
  { profile: 'controlador', surface: 'registros-internos', state: 'padrao', view: 'auditoria' },
  { profile: 'sme', surface: 'dashboard', state: 'padrao', view: 'dashboard' },
  { profile: 'sme', surface: 'configuracoes', state: 'padrao', view: 'sme-config' }
];

function captureName(scenario, viewport) {
  return `${scenario.profile}__${scenario.surface}__${scenario.state}__${viewport}.png`;
}

test.describe('linha de base visual global', () => {
  for (const scenario of scenarios) {
    test(`${scenario.profile} — ${scenario.surface}`, async ({ page }, testInfo) => {
      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });

      await page.goto('/');
      await expect(page.locator('#app-layout')).toBeVisible();
      await page.waitForFunction(() => document.querySelectorAll('link[data-radar-extension]').length >= 9);
      await page.evaluate(({ profile, view }) => {
        localStorage.removeItem('radar_cycle_b_dashboard_filter');
        localStorage.removeItem('radar_cycle_b_wallet_filters');
        switchProfile(profile);
        switchView(view);
        const userName = document.querySelector('#current-user-name');
        if (userName) userName.textContent = 'Usuário de teste';
        document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').forEach(element => {
          element.textContent = 'dado protegido';
          element.removeAttribute('href');
        });
        document.querySelectorAll('input[type="email"], input[type="tel"]').forEach(element => {
          element.value = '';
          element.setAttribute('placeholder', 'dado protegido');
        });
      }, scenario);

      await expect(page.locator('#main-container')).toBeVisible();
      await page.waitForTimeout(200);
      const viewport = testInfo.project.name;
      const file = path.join(evidenceRoot, viewport, captureName(scenario, viewport));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, fullPage: true });

      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});
```

- [ ] **Step 5: Criar construtor do manifesto**

Criar `scripts/audit/build-baseline-manifest.mjs`:

```javascript
import { execFile } from 'node:child_process';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceRoot = path.join(rootDir, 'docs/evidence/global-baseline');
const captures = [];

for (const viewport of ['desktop', 'android', 'iphone']) {
  const directory = path.join(evidenceRoot, viewport);
  const names = (await readdir(directory)).filter(name => name.endsWith('.png')).sort();
  for (const name of names) {
    const match = name.match(/^([^_]+)__([^_]+)__([^_]+)__(desktop|android|iphone)\.png$/);
    if (!match) throw new Error(`Nome de captura inválido: ${name}`);
    const fileStat = await stat(path.join(directory, name));
    if (fileStat.size < 6000) throw new Error(`Captura pequena ou vazia: ${viewport}/${name}`);
    captures.push({ profile: match[1], surface: match[2], state: match[3], viewport, file: `${viewport}/${name}`, bytes: fileStat.size });
  }
}

if (captures.length !== 24) throw new Error(`Esperadas 24 capturas; encontradas ${captures.length}`);
const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: rootDir });
const manifest = { schemaVersion: 1, commit: stdout.trim(), captures };
await writeFile(path.join(evidenceRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Manifesto gravado com ${captures.length} capturas.`);
```

- [ ] **Step 6: Adicionar script npm e executar**

Adicionar:

```json
"audit:baseline": "node scripts/audit/prepare-baseline-output.mjs && playwright test --config=playwright.audit.config.js && node scripts/audit/build-baseline-manifest.mjs",
```

Executar:

```bash
npm run audit:baseline
```

Expected: 24 testes/capturas, oito em cada viewport, manifesto com o HEAD atual.

- [ ] **Step 7: Revisar imagens e regressão**

Inspecionar todas as capturas para corte, overflow, perfil, superfície, legibilidade e dado pessoal. Depois:

```bash
npm run test:e2e
npm run test:mobile
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json playwright.audit.config.js scripts/audit/prepare-baseline-output.mjs scripts/audit/build-baseline-manifest.mjs tests/audit/global-baseline.spec.js tests/unit/audit-tools.test.js docs/evidence/global-baseline
git commit -m "test: registrar linha de base visual reproduzível"
```

---

### Task 6: Catalogar superfícies e consolidar auditoria global

**Files:**
- Create: `docs/reference/PRODUCT_SURFACE_CATALOG.md`
- Create: `docs/audits/2026-07-15-produto-estado-atual.md`

**Interfaces:**
- Consumes: decisões, dados, inventário, testes e capturas.
- Produces: catálogo de 18 superfícies e matriz de maturidade.

- [ ] **Step 1: Mapear testes e fluxo**

```bash
for file in tests/e2e/*.spec.js; do
  printf '\n## %s\n' "$file"
  grep -E "test\.describe|test\(" "$file" | sed -n '1,60p'
done > /tmp/radar-e2e-map.txt
```

- [ ] **Step 2: Criar catálogo**

Criar fichas `S-01` a `S-18` para:

1. Dashboard;
2. Carteira;
3. Competências;
4. Pendências;
5. Prontuário;
6. Capital e Inventário;
7. Registros Internos;
8. Configurações SME;
9. Gestão de Equipe;
10. Exercícios;
11. Programas;
12. Alertas;
13. Busca global;
14. Exportação Excel;
15. Autenticação;
16. Modais e confirmações;
17. Formulários;
18. Estados vazios/loading/erro.

Cada ficha usa:

```markdown
## S-01 — Dashboard

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('dashboard')`; `#nav-dashboard` |
| Perfis | perfis comprovados por código/teste |
| Tarefa real | decisão operacional apoiada |
| Dados lidos | entidades e projeções |
| Dados gravados | estado persistido ou nenhum |
| Serviços/conexões | módulos relacionados |
| Estados | padrão, filtrado, vazio, erro, loading |
| Ações | ações disponíveis |
| Desktop | comportamento observado |
| Mobile | comportamento observado |
| Acessibilidade | evidência observada/testada |
| Testes | caminhos exatos |
| Evidências | arquivos do manifesto |
| Pontos fortes | evidência |
| Riscos/lacunas | evidência |
| Classificação | códigos por achado |
```

- [ ] **Step 3: Executar inspeção headed dirigida**

```bash
npx playwright test tests/e2e/functional-core.spec.js tests/e2e/cycle-b-dashboard.spec.js tests/e2e/cycle-b-carteira.spec.js tests/e2e/task-10-11-pendencias.spec.js tests/e2e/mobile-smoke.spec.js --project=desktop-chromium --headed --workers=1
```

Complementar manualmente as superfícies sem cenário dedicado. Não registrar impressão não reproduzível.

- [ ] **Step 4: Criar auditoria global**

`docs/audits/2026-07-15-produto-estado-atual.md` deve conter:

```markdown
# Auditoria global do produto — estado atual

## Resumo executivo
## Linha de base e limites
## Modelo de domínio preservado
## Conexões entre lógicas e módulos
## Frontend e ordem de carregamento
## Design e consistência visual
## Navegação e encontrabilidade
## Dashboard
## Carteira
## Competências
## Pendências
## Prontuário
## Inventário
## Registros Internos
## Configurações SME
## Gestão de Equipe
## Formulários, modais e feedback
## Mobile e acessibilidade
## Dados e ambientes
## Persistência e Supabase
## Testes, CI e entrega
## Pontos fortes protegidos
## Defeitos comprovados
## Funcionalidades aprimoráveis
## Inconsistências e duplicações
## Dúvidas materiais
## Dependências futuras
## Mapa de maturidade
## Conclusão
```

O mapa atribui notas 1–5, sempre justificadas, a correção, regras, conexão, clareza, encontrabilidade, produtividade, acessibilidade, responsividade, consistência, estados, testabilidade e prontidão remota. Não calcular nota única.

- [ ] **Step 5: Verificar evidência e commit**

```bash
git grep -n -E "deve ser melhorado|precisa melhorar|modernizar|refatorar" -- docs/audits/2026-07-15-produto-estado-atual.md || true
```

Revisar cada ocorrência e acrescentar caminho, teste, captura ou fluxo quando faltar. Depois:

```bash
git add docs/reference/PRODUCT_SURFACE_CATALOG.md docs/audits/2026-07-15-produto-estado-atual.md
git commit -m "docs: catalogar superfícies e auditoria global"
```

---

### Task 7: Especificar contratos transversais de experiência

**Files:**
- Create: `docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`

**Interfaces:**
- Consumes: implementações corretas e inconsistências encontradas.
- Produces: contratos de UX para Ciclos B–E; não escolhe biblioteca.

- [ ] **Step 1: Levantar padrões atuais**

```bash
git grep -n -E "aria-live|role=.?dialog|aria-modal|Escape|keydown|focus\(|alert\(|confirm\(|loading|spinner|sem resultado|não foi possível|sessão" -- index.html app.js src tests > /tmp/radar-ux-contracts.txt
```

- [ ] **Step 2: Criar especificação de 16 contratos**

Criar `C-01` a `C-16` para Loading, Sucesso, Erro, Alerta, Confirmação crítica, Conflito, Sessão expirada, Indisponibilidade, Estado vazio, Formulário alterado, Salvamento, Foco, Modal, Menu, Tooltip e Painel lateral.

Cada contrato deve usar:

```markdown
## C-01 — Loading

### Finalidade
### Estados
### Comportamento
### Conteúdo e linguagem
### Acessibilidade
### Recuperação
### Evidência atual correta
### Inconsistências observadas
### Critério de aceite futuro
```

Regras gerais obrigatórias:

- preservar formulário após falha;
- impedir duplo envio;
- encerrar loading em `finally`;
- feedback não bloqueante para sucesso/informação;
- diálogo explícito para ação crítica;
- foco previsível e restaurado;
- mensagens específicas para rede, sessão, RLS, conflito, validação e indisponibilidade;
- equivalência entre modo local e Supabase.

- [ ] **Step 3: Registrar neutralidade tecnológica**

Adicionar:

```markdown
## Decisão sobre implementação futura

Este documento define capacidades e comportamento. A escolha entre Web Platform, componente próprio, biblioteca headless ou pacote externo será feita por pacote após análise de dependência. Nenhuma biblioteca é aprovada por esta especificação.
```

- [ ] **Step 4: Comparar com melhores padrões e commit**

Revisar `src/integration/modal-accessibility.js`, `src/application/error-mapper.js`, `tests/e2e/modal-accessibility.spec.js`, `tests/e2e/data-error-ux.spec.js` e `tests/e2e/mobile-smoke.spec.js`.

```bash
git add docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md
git commit -m "docs: especificar contratos transversais de experiência"
```

---

### Task 8: Priorizar backlog e registrar decisões necessárias

**Files:**
- Create: `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`
- Modify: `docs/audits/2026-07-15-produto-estado-atual.md`

**Interfaces:**
- Consumes: todos os achados classificados.
- Produces: fila única e primeiro pacote recomendado.

- [ ] **Step 1: Extrair achados**

```bash
git grep -n -E "\b(CP|ID|FA|IC|DC|DQ|DF|EP)\b" -- docs/audits docs/reference/PRODUCT_SURFACE_CATALOG.md > /tmp/radar-classified-findings.txt
```

- [ ] **Step 2: Criar backlog**

Usar:

```markdown
# Backlog priorizado pós-PR 22

## Método
- P0 — risco crítico atual comprovado;
- P1 — bloqueia próximo estágio ou causa perda operacional relevante;
- P2 — ganho alto de produto ou manutenção;
- P3 — evolução útil não bloqueadora;
- P4 — hipótese para estudo posterior.

## Itens

| ID | Prioridade | Ciclo | Superfície | Classe | Evidência | Problema/oportunidade | Resultado esperado | Preservações | Dependências | Visual | Decisão humana | Supabase | Pacote sugerido |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

Não criar item genérico como “melhorar UX”. Itens `CP` e `ID` entram como proteções, não como implementação.

- [ ] **Step 3: Registrar dependências e dúvidas**

Criar grafo textual com dependências reais. Para cada `DQ`, apresentar evidência, alternativas, consequências, recomendação provisória e decisão necessária.

- [ ] **Step 4: Selecionar primeiro pacote**

Adicionar:

```markdown
## Primeiro pacote recomendado

- Pacote:
- Achados envolvidos:
- Evidências:
- Por que vem primeiro:
- Resultado esperado:
- O que será preservado:
- Dependências satisfeitas:
- Aprovação visual necessária:
- Plano técnico a criar:
```

Preencher com resultados reais. Se F1/F2 Supabase tiver prioridade superior às melhorias do Ciclo B, registrar isso em vez de forçar uma ordem.

- [ ] **Step 5: Validar IDs e commit**

```bash
node - <<'NODE'
const fs = require('node:fs');
const text = fs.readFileSync('docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md', 'utf8');
const ids = [...text.matchAll(/^\| (BL-[A-Z0-9-]+) \|/gm)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) throw new Error(`IDs duplicados: ${[...new Set(duplicates)].join(', ')}`);
if (!ids.length) throw new Error('Backlog sem itens identificados.');
console.log(`${ids.length} itens sem duplicidade.`);
NODE
git add docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md docs/audits/2026-07-15-produto-estado-atual.md
git commit -m "docs: priorizar backlog global pós-PR 22"
```

---

### Task 9: Automatizar validação e concluir handoff

**Files:**
- Create: `scripts/audit/validate-cycle-a-artifacts.mjs`
- Modify: `tests/unit/audit-tools.test.js`
- Modify: `package.json`
- Modify: `docs/README.md`
- Create: `docs/handoff/2026-07-15-ciclo-a-final-report.md`

**Interfaces:**
- Produces: `validateCycleAArtifacts(rootDir): Promise<{errors, surfaceCount, captureCount}>`.
- Produces: `npm run audit:cycle-a`.

- [ ] **Step 1: Escrever teste falhando**

Acrescentar:

```javascript
test('validador aceita o conjunto completo do Ciclo A', async () => {
  const { validateCycleAArtifacts } = await importAuditModule('validate-cycle-a-artifacts.mjs');
  const result = await validateCycleAArtifacts(rootDir);
  assert.equal(result.errors.length, 0, result.errors.join('\n'));
  assert.ok(result.surfaceCount >= 18);
  assert.equal(result.captureCount, 24);
});
```

Executar:

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 2: Implementar validador**

Criar `scripts/audit/validate-cycle-a-artifacts.mjs`:

```javascript
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = [
  'docs/reference/PRODUCT_DECISIONS.md',
  'docs/reference/CHANGE_CLASSIFICATION.md',
  'docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md',
  'docs/reference/PRODUCT_SURFACE_CATALOG.md',
  'docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md',
  'docs/audits/2026-07-15-inventario-tecnico-global.md',
  'docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md',
  'docs/audits/2026-07-15-produto-estado-atual.md',
  'docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md',
  'docs/evidence/global-baseline/manifest.json',
  'docs/evidence/global-baseline/repository-inventory.json'
];

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function localLinks(source) {
  return [...source.matchAll(/\[[^\]]*\]\((?!https?:|mailto:|#)([^)]+)\)/g)]
    .map(match => match[1].split('#')[0]).filter(Boolean);
}

export async function validateCycleAArtifacts(rootDir) {
  const errors = [];
  for (const relativePath of REQUIRED_FILES) {
    if (!(await exists(path.join(rootDir, relativePath)))) errors.push(`Arquivo ausente: ${relativePath}`);
  }

  for (const relativePath of REQUIRED_FILES.filter(file => file.endsWith('.md'))) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!(await exists(absolutePath))) continue;
    const source = await readFile(absolutePath, 'utf8');
    if (/\b(TBD|TODO|implement later|fill in details)\b/i.test(source)) errors.push(`Placeholder proibido: ${relativePath}`);
    for (const link of localLinks(source)) {
      const target = path.resolve(path.dirname(absolutePath), decodeURIComponent(link));
      if (!(await exists(target))) errors.push(`Link quebrado em ${relativePath}: ${link}`);
    }
  }

  const catalog = await readFile(path.join(rootDir, 'docs/reference/PRODUCT_SURFACE_CATALOG.md'), 'utf8').catch(() => '');
  const surfaceCount = [...catalog.matchAll(/^## S-\d{2} —/gm)].length;
  if (surfaceCount < 18) errors.push(`Catálogo possui ${surfaceCount} superfícies; mínimo 18`);

  const manifest = JSON.parse(await readFile(path.join(rootDir, 'docs/evidence/global-baseline/manifest.json'), 'utf8').catch(() => '{"captures":[]}'));
  for (const capture of manifest.captures || []) {
    if (!(await exists(path.join(rootDir, 'docs/evidence/global-baseline', capture.file)))) errors.push(`Captura ausente: ${capture.file}`);
  }
  const captureCount = (manifest.captures || []).length;
  if (captureCount !== 24) errors.push(`Manifesto possui ${captureCount} capturas; esperado 24`);

  return { errors, surfaceCount, captureCount };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const result = await validateCycleAArtifacts(rootDir);
  if (result.errors.length) {
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Ciclo A válido: ${result.surfaceCount} superfícies e ${result.captureCount} capturas.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
```

- [ ] **Step 3: Adicionar script e validar**

Adicionar:

```json
"audit:cycle-a": "node scripts/audit/validate-cycle-a-artifacts.mjs",
```

Executar:

```bash
node --test tests/unit/audit-tools.test.js
npm run audit:cycle-a
```

Expected: PASS, 18 ou mais superfícies e 24 capturas.

- [ ] **Step 4: Atualizar `docs/README.md`**

Adicionar seção `Ciclo A pós-PR 22 — linha de base e classificação` com links para os cinco documentos de referência, três auditorias, contratos e relatório final.

- [ ] **Step 5: Criar relatório final**

`docs/handoff/2026-07-15-ciclo-a-final-report.md` deve conter:

```markdown
# Relatório final — Ciclo A pós-PR 22

## 1. Estado anterior
## 2. Escopo executado
## 3. Linha de base funcional
## 4. Decisões preservadas
## 5. Dados e ambientes
## 6. Inventário técnico
## 7. Catálogo e evidências visuais
## 8. Pontos fortes protegidos
## 9. Achados por classificação
## 10. Dúvidas submetidas ao responsável
## 11. Contratos transversais definidos
## 12. Backlog e prioridade
## 13. Primeiro pacote recomendado
## 14. Testes e evidências
## 15. Ausência de mudança funcional
## 16. Riscos remanescentes
## 17. Rollback
## 18. Autorizações pendentes
```

Preencher com números, caminhos, commits e resultados reais.

- [ ] **Step 6: Executar validação completa**

```bash
npm run audit:inventory
npm run audit:baseline
npm run audit:cycle-a
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
npm run test:readiness
npm run test:e2e
npm run test:mobile
npm audit --audit-level=high
git diff --check
```

Expected: todos os comandos com exit code `0`. Vulnerabilidade preexistente não deve ser corrigida nesta PR; registrar evidência e abrir item separado.

- [ ] **Step 7: Provar ausência de alteração funcional**

```bash
if git diff origin/main --name-only | grep -E '^(app\.js|index\.html|styles\.css|config\.js|config\.runtime\.js|src/|supabase/|vercel\.json|\.github/workflows/)'; then
  echo "Arquivo funcional alterado no Ciclo A" >&2
  exit 1
fi
```

Expected: nenhuma saída e exit code `0`.

- [ ] **Step 8: Verificar placeholders**

```bash
if git grep -n -E "\b(TBD|TODO|implement later|fill in details|melhorar UX|modernizar o sistema)\b" -- docs/reference docs/audits docs/handoff docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md; then
  echo "Texto vago ou placeholder encontrado" >&2
  exit 1
fi
```

Expected: nenhuma ocorrência.

- [ ] **Step 9: Commit final**

```bash
git add package.json scripts/audit/validate-cycle-a-artifacts.mjs tests/unit/audit-tools.test.js docs/README.md docs/handoff/2026-07-15-ciclo-a-final-report.md docs/evidence/global-baseline
git commit -m "docs: concluir linha de base global do RADAR"
```

- [ ] **Step 10: Revisar e abrir PR em rascunho**

```bash
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
git push -u origin docs/ciclo-a-execucao
gh pr create --draft --base main --head docs/ciclo-a-execucao --title "Ciclo A pós-PR 22 — linha de base, classificação e contratos" --body-file docs/handoff/2026-07-15-ciclo-a-final-report.md
```

Expected: working tree limpa e PR em rascunho. Não retirar de rascunho, não fazer merge e não iniciar o pacote seguinte sem revisão e autorização.

---

## Plan Self-Review

### Spec coverage

- decisões e classificação: Task 2;
- inventário técnico: Task 3;
- dados e ambientes: Task 4;
- baseline visual: Task 5;
- catálogo e auditoria: Task 6;
- contratos transversais: Task 7;
- backlog e dúvidas: Task 8;
- validação, índice e handoff: Task 9.

### Scope check

O resultado é uma linha de base governada e testável. O plano não implementa redesign, refatoração funcional, navegação, Supabase remoto, observabilidade ou inteligência.

### Placeholder check

O plano não usa campos pendentes nos artefatos finais. Templates são instruções completas e devem ser preenchidos com evidência real antes do commit correspondente.

### Interface consistency

- `generateRepositoryInventory(rootDir)` é criado e testado na Task 3;
- `audit:baseline` prepara diretórios, captura e só então constrói o manifesto;
- a preparação preserva `repository-inventory.json`;
- manifesto exige exatamente 24 capturas;
- `validateCycleAArtifacts(rootDir)` exige 18 superfícies e 24 capturas;
- os oito códigos são os definidos pelo Plano Diretor.
