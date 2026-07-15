# Ciclo A — Linha de Base, Classificação e Contratos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** produzir uma linha de base funcional, visual, documental, técnica e de dados do RADAR PDDE, sem alterar o comportamento do produto, e converter a auditoria em decisões, contratos e backlog priorizado para os ciclos seguintes.

**Architecture:** o Ciclo A será executado em uma worktree e branch isoladas. Ferramentas de auditoria determinísticas produzirão inventário técnico e capturas visuais; documentos separados registrarão decisões, dados, superfícies, contratos e backlog. Nenhum módulo funcional será modificado, e a PR permanecerá em rascunho até que evidências, validações e dúvidas materiais estejam fechadas.

**Tech Stack:** JavaScript CommonJS e ESM; Node.js 24; npm; Playwright 1.61.1; Chromium; WebKit; Git; Markdown; JSON; scripts de validação sem dependências novas.

## Global Constraints

- Partir da `main` que contém o merge do Plano Diretor pós-PR 22.
- Não alterar `app.js`, `index.html`, `styles.css`, `config.js`, `config.runtime.js`, `src/domain/**`, `src/application/**`, `src/data/**`, `src/integration/**`, `src/styles/**`, `supabase/**` ou a exportação Excel.
- Produção permanece em modo local e não recebe deployment neste ciclo.
- Nenhuma URL, chave, senha, token, `service_role` ou `sb_secret_*` será adicionada.
- Nenhuma conexão Supabase remota será executada.
- O código de auditoria não poderá gravar no estado funcional da aplicação fora de fixtures descartáveis do Playwright.
- Toda captura visual deverá identificar commit, perfil, superfície, estado e viewport.
- Dados pessoais ou de contato não indispensáveis deverão ser mascarados nas evidências versionadas.
- A classificação permitida é exclusivamente `CP`, `ID`, `FA`, `IC`, `DC`, `DQ`, `DF` ou `EP`.
- Nenhum achado `DQ` poderá ser transformado em recomendação definitiva sem consulta ao responsável.
- Nenhum pacote dos Ciclos B–H será implementado nesta PR.
- Usar TDD para as ferramentas de auditoria e validação.
- Commits pequenos e semânticos; revisar cada tarefa antes de seguir.

---

## File Map

### Create

- `docs/reference/PRODUCT_DECISIONS.md` — índice de decisões canônicas e fronteiras.
- `docs/reference/CHANGE_CLASSIFICATION.md` — classificação e conduta para achados.
- `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md` — política de dados por ambiente.
- `docs/reference/PRODUCT_SURFACE_CATALOG.md` — fichas das superfícies e fluxos.
- `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md` — backlog único e priorizado.
- `docs/audits/2026-07-15-inventario-tecnico-global.md` — leitura técnica do repositório.
- `docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md` — evidências de dados e ambientes.
- `docs/audits/2026-07-15-produto-estado-atual.md` — auditoria global consolidada.
- `docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md` — contratos de UX sem implementação.
- `docs/handoff/2026-07-15-ciclo-a-final-report.md` — relatório final.
- `scripts/audit/generate-repository-inventory.mjs` — inventário JSON determinístico.
- `scripts/audit/validate-cycle-a-artifacts.mjs` — validação documental e de evidências.
- `tests/unit/audit-tools.test.js` — testes dos scripts de auditoria.
- `tests/audit/global-baseline.spec.js` — captura visual reproduzível.
- `playwright.audit.config.js` — configuração separada para evidências.
- `docs/evidence/global-baseline/manifest.json` — manifesto das capturas.
- `docs/evidence/global-baseline/repository-inventory.json` — inventário gerado.
- `docs/evidence/global-baseline/desktop/*.png` — capturas desktop.
- `docs/evidence/global-baseline/android/*.png` — capturas Pixel 7.
- `docs/evidence/global-baseline/iphone/*.png` — capturas iPhone 15.

### Modify

- `package.json` — scripts `audit:inventory`, `audit:baseline` e `audit:cycle-a`.
- `docs/README.md` — índice dos artefatos do Ciclo A.

### Must Not Modify

- `app.js`;
- `index.html`;
- `styles.css`;
- `config.js`;
- `config.runtime.js`;
- `src/**` fora de nenhum arquivo, pois o Ciclo A não altera produto;
- `supabase/**`;
- `vercel.json`;
- `.github/workflows/**`;
- arquivos binários canônicos.

---

### Task 1: Isolar a execução e congelar a linha de base

**Files:**
- Read: `docs/README.md`
- Read: `docs/reference/STATUS_DOCUMENTOS.md`
- Read: `docs/superpowers/plans/2026-07-14-plano-diretor-consolidacao-evolucao-pos-pr22.md`
- Read: `docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`
- Read: `README.md`
- Create initial shell: `docs/audits/2026-07-15-inventario-tecnico-global.md`

**Interfaces:**
- Consumes: `main` após o merge do Plano Diretor.
- Produces: commit de baseline, lista de testes e hash de referência usados por todas as tarefas seguintes.

- [ ] **Step 1: Criar worktree isolada**

```bash
git fetch origin
git worktree add ../RADARPDDE-ciclo-a -b docs/ciclo-a-execucao origin/main
cd ../RADARPDDE-ciclo-a
```

Expected: nova worktree na branch `docs/ciclo-a-execucao`, sem arquivos modificados.

- [ ] **Step 2: Confirmar preflight Git**

```bash
git status --short
git branch --show-current
git log -5 --oneline
git diff --stat
git diff
```

Expected:

```text
docs/ciclo-a-execucao
```

`git status --short`, `git diff --stat` e `git diff` não produzem saída.

- [ ] **Step 3: Instalar dependências reproduzíveis**

```bash
npm ci
```

Expected: instalação concluída a partir de `package-lock.json`, sem alteração do lockfile.

- [ ] **Step 4: Executar baseline estrutural**

```bash
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
npm run test:readiness
```

Expected: todos os comandos terminam com exit code `0`.

- [ ] **Step 5: Executar baseline de interface**

```bash
npm run test:e2e
npm run test:mobile
```

Expected: desktop Chromium, Pixel 7/Chromium e iPhone 15/WebKit aprovados.

- [ ] **Step 6: Registrar commit e resultados no inventário técnico**

Criar `docs/audits/2026-07-15-inventario-tecnico-global.md` com este conteúdo inicial:

```markdown
# Inventário técnico global do RADAR PDDE

## Linha de base

| Campo | Valor |
|---|---|
| Data da auditoria | 15/07/2026 |
| Branch de execução | `docs/ciclo-a-execucao` |
| Commit de referência | `<substituir pelo resultado de git rev-parse HEAD>` |
| Persistência publicada | `LocalStorageRepository` |
| Modo de dados | `local` |
| Supabase remoto | não conectado |
| Node.js | `24.x` |

## Baseline de validação

| Comando | Resultado |
|---|---|
| `npm run check` | aprovado |
| `npm run test:unit` | aprovado |
| `npm run test:integration` | aprovado |
| `npm run audit:functional` | aprovado |
| `npm run test:readiness` | aprovado |
| `npm run test:e2e` | aprovado |
| `npm run test:mobile` | aprovado |

## Regra de escopo

Este documento registra o estado atual. O Ciclo A não altera comportamento funcional, layout, regras, persistência, migrations ou produção.
```

Antes de salvar, substituir somente o valor do commit pelo resultado de:

```bash
git rev-parse HEAD
```

- [ ] **Step 7: Confirmar que nenhum arquivo funcional mudou**

```bash
git diff --name-only
```

Expected:

```text
docs/audits/2026-07-15-inventario-tecnico-global.md
```

- [ ] **Step 8: Commit**

```bash
git add docs/audits/2026-07-15-inventario-tecnico-global.md
git commit -m "docs: congelar linha de base do Ciclo A"
```

---

### Task 2: Formalizar decisões e classificação de mudanças

**Files:**
- Create: `docs/reference/PRODUCT_DECISIONS.md`
- Create: `docs/reference/CHANGE_CLASSIFICATION.md`
- Test: `scripts/audit/validate-cycle-a-artifacts.mjs` será criado na Task 8; nesta tarefa usar inspeção manual e `git grep`.

**Interfaces:**
- Consumes: precedência de `docs/reference/STATUS_DOCUMENTOS.md` e princípios do Plano Diretor.
- Produces: códigos e decisões que todas as auditorias e o backlog devem usar.

- [ ] **Step 1: Levantar decisões explícitas**

```bash
git grep -n -E "não deve|não existe|permanece|preserv|aprovad|canônic|bonificação|reanálise|retificação|indicadores" -- README.md docs app.js tests > /tmp/radar-decisions.txt
wc -l /tmp/radar-decisions.txt
```

Expected: arquivo temporário com referências de código, testes e documentação para revisão humana.

- [ ] **Step 2: Criar o registro de decisões**

Criar `docs/reference/PRODUCT_DECISIONS.md` com as seções e decisões abaixo:

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
| PS-003 | Ausência de Auth/RLS remotos é etapa futura, não defeito do gate local. | Plano Diretor | execução do Ciclo F |
| PS-004 | Segredos administrativos nunca entram no frontend, GitHub ou logs. | `README.md` | não reabrir |
| PS-005 | Migração remota exige cópia controlada, reconciliação e rollback. | runbook de migração | não reabrir sem novo desenho aprovado |

## Visual, navegação e exportação

| ID | Decisão | Fonte principal | Condição para reabertura |
|---|---|---|---|
| PV-001 | Alteração material de layout exige proposta visual e aprovação. | Plano Diretor | não reabrir |
| PV-002 | Melhorias devem preservar informação, ações, permissões e regras. | `STATUS_DOCUMENTOS.md` | decisão expressa por pacote |
| PV-003 | Carteira mobile usa cartões; tabela desktop permanece referência atual. | `README.md` | auditoria e proposta aprovadas |
| PV-004 | Exportação Excel v2.1 é referência congelada. | `STATUS_DOCUMENTOS.md` | plano autônomo aprovado |

## Regra de manutenção

Uma decisão só pode ser alterada quando o PR indicar o ID afetado, apresentar a nova fonte de autoridade, explicar a consequência e registrar a decisão substituta.
```

- [ ] **Step 3: Criar a classificação de mudanças**

Criar `docs/reference/CHANGE_CLASSIFICATION.md` com uma seção para cada código. Usar este formato completo para todos os oito códigos:

```markdown
# Classificação de mudanças do RADAR PDDE

## Regra geral

Nenhum achado entra no backlog sem código, evidência e conduta.

## `CP` — Correto e protegido

- Definição: comportamento correto, coerente e já protegido por evidência suficiente.
- Evidência mínima: teste, fluxo executado e fonte documental compatíveis.
- Conduta permitida: preservar e complementar cobertura insuficiente.
- Conduta proibida: substituir por preferência técnica ou estética.
- Exemplo: independência entre bonificação e pendência.

## `ID` — Intencional e deliberado

- Definição: decisão consciente que pode parecer incomum fora do contexto.
- Evidência mínima: fonte canônica ou confirmação expressa.
- Conduta permitida: documentar e proteger.
- Conduta proibida: “corrigir” sem nova decisão.
- Exemplo: ausência do estado `Vencida`.

## `FA` — Funcional e aprimorável

- Definição: funciona corretamente, mas existe ganho demonstrável possível.
- Evidência mínima: problema de esforço, clareza, produtividade ou manutenção observado.
- Conduta permitida: apresentar alternativas e resultado esperado.
- Conduta proibida: implementar sem comparação e, quando visual, sem aprovação.
- Exemplo: tabela ampla da Carteira com possibilidade de colunas configuráveis.

## `IC` — Inconsistente ou duplicado

- Definição: múltiplas soluções concorrentes para o mesmo contrato.
- Evidência mínima: regras, estilos ou comportamentos equivalentes com precedência distinta.
- Conduta permitida: mapear consumidores e consolidar com regressão protegida.
- Conduta proibida: remover arquivo apenas pelo nome `final` ou `hotfix`.
- Exemplo: folhas CSS sucessivas carregadas por `config.js`.

## `DC` — Defeito comprovado

- Definição: comportamento diverge do contrato, falha ou produz resultado incorreto.
- Evidência mínima: reprodução, teste falhando ou incompatibilidade objetiva.
- Conduta permitida: corrigir com teste de regressão.
- Conduta proibida: classificar por gosto.
- Exemplo: filtro cuja lista não corresponde ao indicador selecionado.

## `DQ` — Dúvida de produto ou regra

- Definição: intenção ou autoridade não pode ser determinada com segurança.
- Evidência mínima: fontes conflitantes ou ausência de fonte.
- Conduta permitida: formular pergunta específica com alternativas e consequências.
- Conduta proibida: escolher silenciosamente.
- Exemplo: ocultar coluna operacional sem confirmação de uso real.

## `DF` — Dependente de etapa futura

- Definição: capacidade deliberadamente prevista para outro estágio.
- Evidência mínima: plano ou runbook vigente.
- Conduta permitida: vincular ao ciclo futuro e registrar dependências.
- Conduta proibida: apresentar como falha atual.
- Exemplo: Auth/RLS em projeto Supabase remoto.

## `EP` — Evolução posterior

- Definição: ganho possível que não bloqueia operação ou etapa atual.
- Evidência mínima: benefício plausível, sem urgência ou dependência imediata.
- Conduta permitida: manter no roadmap com prioridade justificada.
- Conduta proibida: deslocar trabalho crítico sem justificativa.
- Exemplo: indicadores preditivos antes da observabilidade mínima.
```

- [ ] **Step 4: Verificar códigos e decisões**

```bash
git grep -n -E "`(CP|ID|FA|IC|DC|DQ|DF|EP)`" -- docs/reference/CHANGE_CLASSIFICATION.md
git grep -n -E "PD-00[1-9]|PS-00[1-5]|PV-00[1-4]" -- docs/reference/PRODUCT_DECISIONS.md
```

Expected: todos os códigos e IDs aparecem.

- [ ] **Step 5: Commit**

```bash
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
- Produces: `generateRepositoryInventory(rootDir)` retornando objeto JSON serializável.
- Produces: comando `npm run audit:inventory`.
- Consumed by: auditoria técnica, catálogo de superfícies e validação final.

- [ ] **Step 1: Escrever teste falhando do inventário**

Criar `tests/unit/audit-tools.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = path.resolve(__dirname, '../..');

async function loadInventoryModule() {
  return import(pathToFileURL(path.join(rootDir, 'scripts/audit/generate-repository-inventory.mjs')).href);
}

test('inventário técnico classifica arquivos e scripts npm de forma determinística', async () => {
  const { generateRepositoryInventory } = await loadInventoryModule();
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

- [ ] **Step 2: Executar teste e confirmar falha**

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: FAIL com `ERR_MODULE_NOT_FOUND` para `generate-repository-inventory.mjs`.

- [ ] **Step 3: Implementar o gerador**

Criar `scripts/audit/generate-repository-inventory.mjs`:

```javascript
import { execFile } from 'node:child_process';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.html', '.css', '.sql', '.yml', '.yaml', '.txt'
]);

function classifyFile(filePath) {
  if (filePath === 'app.js' || filePath === 'index.html' || filePath === 'styles.css') return 'frontend-core';
  if (filePath === 'config.js' || filePath === 'config.runtime.js' || filePath === '.env.example') return 'configuration';
  if (filePath.startsWith('src/domain/')) return 'domain';
  if (filePath.startsWith('src/application/')) return 'application';
  if (filePath.startsWith('src/data/')) return 'data';
  if (filePath.startsWith('src/integration/')) return 'integration';
  if (filePath.startsWith('src/styles/')) return 'styles';
  if (filePath.startsWith('tests/unit/')) return 'unit-tests';
  if (filePath.startsWith('tests/integration/')) return 'integration-tests';
  if (filePath.startsWith('tests/e2e/')) return 'e2e-tests';
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
  const extension = path.extname(filePath).toLowerCase();
  const record = {
    path: filePath,
    category: classifyFile(filePath),
    bytes: fileStat.size
  };

  if (TEXT_EXTENSIONS.has(extension) || ['app.js', 'styles.css'].includes(filePath)) {
    const content = await readFile(absolutePath, 'utf8');
    record.lines = content === '' ? 0 : content.split(/\r?\n/).length;
  }

  return record;
}

function extractRuntimeExtensions(configSource) {
  const styles = [...configSource.matchAll(/loadStylesheet\('([^']+)'\)/g)].map(match => match[1]);
  const scripts = [...configSource.matchAll(/loadScript\('([^']+)'/g)].map(match => match[1]);
  return { styles, scripts };
}

export async function generateRepositoryInventory(rootDir) {
  const [packageSource, configSource, files] = await Promise.all([
    readFile(path.join(rootDir, 'package.json'), 'utf8'),
    readFile(path.join(rootDir, 'config.js'), 'utf8'),
    trackedFiles(rootDir)
  ]);
  const packageJson = JSON.parse(packageSource);
  const inspected = [];
  for (const filePath of files) inspected.push(await inspectFile(rootDir, filePath));

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
    supabase: {
      migrationCount: inspected.filter(file => file.category === 'migrations' && file.path.endsWith('.sql')).length
    },
    summaries: Object.fromEntries(
      [...new Set(inspected.map(file => file.category))]
        .sort((a, b) => a.localeCompare(b))
        .map(category => [category, inspected.filter(file => file.category === category).length])
    ),
    files: inspected
  };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outputPath = path.join(rootDir, 'docs/evidence/global-baseline/repository-inventory.json');
  const inventory = await generateRepositoryInventory(rootDir);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  process.stdout.write(`Inventário gravado em ${path.relative(rootDir, outputPath)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
```

- [ ] **Step 4: Adicionar script npm**

Adicionar em `package.json` após `audit:functional:json`:

```json
"audit:inventory": "node scripts/audit/generate-repository-inventory.mjs",
```

- [ ] **Step 5: Executar teste**

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: PASS.

- [ ] **Step 6: Gerar inventário**

```bash
npm run audit:inventory
```

Expected:

```text
Inventário gravado em docs/evidence/global-baseline/repository-inventory.json
```

- [ ] **Step 7: Completar a auditoria técnica**

Usar o JSON gerado e comandos abaixo:

```bash
node -e "const x=require('./docs/evidence/global-baseline/repository-inventory.json'); console.table(x.summaries)"
git grep -n "loadStylesheet\|loadScript" -- config.js
git grep -n "window.alert\|window.confirm\|alert(\|confirm(" -- '*.js' ':!vendor/**' ':!src/vendor/**'
git grep -n "onclick=\|style=" -- index.html app.js
git grep -n "localStorage" -- app.js config.js src tests
```

Completar `docs/audits/2026-07-15-inventario-tecnico-global.md` com:

- arquitetura vigente;
- concentração de responsabilidades;
- ordem de carregamento;
- arquivos CSS e JS incrementais;
- testes por categoria;
- dependências;
- migrations;
- pontos fortes;
- riscos;
- itens `CP/ID/FA/IC/DC/DQ/DF/EP`.

Cada apontamento deve citar caminho e linha ou teste correspondente.

- [ ] **Step 8: Rodar conjunto unitário**

```bash
npm run check
npm run test:unit
```

Expected: PASS.

- [ ] **Step 9: Commit**

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
- Consumes: inventário JSON, `app.js`, `config.js`, `.env.example`, services, repositories, tests, migrations e runbooks.
- Produces: política que habilita F1–F4 do Ciclo Supabase sem confundir proteção futura com defeito atual.

- [ ] **Step 1: Localizar categorias de dado**

```bash
git grep -n -E "email|telefone|diretor|designacao|inep|cnpj|password|publishable|service_role|sb_secret|localStorage|sessionStorage|console\.|audit|snapshot|fixture|seed" -- app.js config.js config.runtime.js .env.example src scripts tests supabase docs > /tmp/radar-data-locations.txt
wc -l /tmp/radar-data-locations.txt
```

Expected: referências suficientes para classificação manual.

- [ ] **Step 2: Criar política de dados e ambientes**

Criar `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md` com estas classes:

```markdown
# Classificação de dados e ambientes do RADAR PDDE

## Classes

| Código | Classe | Exemplos | Repositório | Bundle | Preview | Produção | Logs |
|---|---|---|---|---|---|---|---|
| D0 | público institucional | nome público da escola, designação, INEP quando público | permitido | permitido se necessário | permitido | permitido | mínimo |
| D1 | interno institucional | status, atribuição, observação operacional | fixture fictícia | somente com autorização e controle | protegido | protegido | sem conteúdo integral |
| D2 | pessoal/contato | nome de diretor, e-mail, telefone | não versionar sem base e necessidade | evitar | protegido e minimizado | protegido e minimizado | proibido salvo identificador técnico |
| D3 | credencial/segredo | senha, service role, token, chave administrativa | proibido | proibido | secret store | secret store | proibido |
| D4 | configuração pública | modo, URL pública, chave publicável | exemplo vazio permitido | permitido quando autorizado | permitido | permitido | diagnóstico sem segredo |
| D5 | fixture/demonstração | escola fictícia, usuário fictício | permitido | permitido | permitido | não usar como dado real | permitido sem dado pessoal |
| D6 | log/auditoria | ator, ação, data, versão | schema permitido | leitura por permissão | protegido | protegido | retenção definida |
| D7 | snapshot/migração | estado canônico e staging | não versionar com dados reais | proibido | armazenamento controlado | armazenamento controlado | apenas contagens e hash |
```

Adicionar seções:

- finalidade e minimização;
- fonte oficial;
- acesso por perfil;
- retenção;
- mascaramento;
- ambientes;
- bundle e Git;
- logs;
- histórico Git;
- Preview;
- Supabase remoto;
- incidentes;
- revisão periódica.

- [ ] **Step 3: Criar auditoria factual**

Criar `docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md` com tabela:

```markdown
| Evidência | Local atual | Classe | Exposição atual | Proteção atual | Proteção futura | Classificação do achado | Conduta |
|---|---|---|---|---|---|---|---|
```

Preencher pelo menos:

- dados iniciais de escolas em `app.js`;
- perfil exibido em `index.html`;
- configuração runtime;
- `localStorage`;
- snapshots de migração;
- fixtures Auth locais;
- logs administrativos;
- relatório Excel;
- artifacts de CI;
- chaves publicáveis futuras;
- segredos proibidos.

Não concluir que todo dado em frontend é defeito. Para cada item, distinguir necessidade operacional, publicidade, minimização e futura proteção por RLS.

- [ ] **Step 4: Identificar dúvidas materiais**

Criar seção `## Decisões necessárias do responsável` somente se houver `DQ`. Cada item deve seguir:

```markdown
### DQ-<número> — <título específico>

- Evidência:
- Intenção não comprovada:
- Alternativa A e consequência:
- Alternativa B e consequência:
- Recomendação técnica provisória:
- Decisão necessária:
```

Não usar perguntas genéricas.

- [ ] **Step 5: Verificar ausência de segredo introduzido**

```bash
npm run check:supabase
npm run check:runtime-config
git diff --check
git grep -n -E "sb_secret_|service_role|postgres(ql)?://|SUPABASE_ADMIN_KEY=" -- docs scripts tests package.json ':!docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md'
```

Expected: os dois scripts passam; o último comando não encontra novo segredo real.

- [ ] **Step 6: Commit**

```bash
git add docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md
git commit -m "docs: classificar dados e ambientes do RADAR"
```

---

### Task 5: Criar captura visual reproduzível

**Files:**
- Create: `playwright.audit.config.js`
- Create: `tests/audit/global-baseline.spec.js`
- Modify: `tests/unit/audit-tools.test.js`
- Modify: `package.json`
- Generate: `docs/evidence/global-baseline/manifest.json`
- Generate: PNGs em `docs/evidence/global-baseline/{desktop,android,iphone}/`

**Interfaces:**
- Produces: comando `npm run audit:baseline`.
- Produces: manifesto `{ schemaVersion, commit, captures[] }`.
- Consumed by: catálogo, auditoria visual e comparações futuras.

- [ ] **Step 1: Adicionar teste falhando para validação do manifesto**

Acrescentar a `tests/unit/audit-tools.test.js`:

```javascript
test('manifesto visual usa nomes determinísticos e viewports canônicos', () => {
  const validName = /^(controlador|assistente|inventario|sme|admin)__[a-z0-9-]+__[a-z0-9-]+__(desktop|android|iphone)\.png$/;
  assert.match('controlador__dashboard__padrao__desktop.png', validName);
  assert.match('sme__configuracoes__padrao__iphone.png', validName);
  assert.doesNotMatch('Dashboard Final.png', validName);
});
```

- [ ] **Step 2: Executar teste**

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: PASS; este teste congela o contrato de nomes antes do capturador.

- [ ] **Step 3: Criar configuração Playwright de auditoria**

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
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
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

- [ ] **Step 4: Criar capturador com catálogo explícito**

Criar `tests/audit/global-baseline.spec.js` com:

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const evidenceRoot = path.join(rootDir, 'docs/evidence/global-baseline');

const profileMap = {
  controlador: 'controlador',
  assistente: 'assistente',
  inventario: 'inventario',
  sme: 'sme',
  admin: 'admin'
};

const scenarios = [
  { profile: 'controlador', surface: 'dashboard', state: 'padrao', open: () => switchView('dashboard') },
  { profile: 'controlador', surface: 'carteira', state: 'resultado', open: () => switchView('escolas') },
  { profile: 'controlador', surface: 'competencias', state: 'padrao', open: () => switchView('competencias') },
  { profile: 'controlador', surface: 'pendencias', state: 'padrao', open: () => switchView('pendencias') },
  { profile: 'controlador', surface: 'inventario', state: 'padrao', open: () => switchView('inventario') },
  { profile: 'controlador', surface: 'registros-internos', state: 'padrao', open: () => switchView('auditoria') },
  { profile: 'sme', surface: 'dashboard', state: 'padrao', open: () => switchView('dashboard') },
  { profile: 'sme', surface: 'configuracoes', state: 'padrao', open: () => switchView('sme-config') },
  { profile: 'admin', surface: 'equipe', state: 'padrao', open: () => switchView('equipe') }
];

function fileName({ profile, surface, state }, viewport) {
  return `${profile}__${surface}__${state}__${viewport}.png`;
}

test.describe('linha de base visual global', () => {
  test.beforeAll(async () => {
    await fs.rm(evidenceRoot, { recursive: true, force: true });
    await fs.mkdir(evidenceRoot, { recursive: true });
  });

  for (const scenario of scenarios) {
    test(`${scenario.profile} — ${scenario.surface} — ${scenario.state}`, async ({ page }, testInfo) => {
      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      await page.goto('/');
      await page.evaluate(({ profile, surface, state }) => {
        localStorage.removeItem('radar_cycle_b_dashboard_filter');
        localStorage.removeItem('radar_cycle_b_wallet_filters');
        switchProfile(profileMap[profile] || profile);
        const scenario = { profile, surface, state };
        const opener = scenarios.find(candidate => (
          candidate.profile === scenario.profile
          && candidate.surface === scenario.surface
          && candidate.state === scenario.state
        ));
        opener.open();
      }, scenario);

      await expect(page.locator('#main-container')).toBeVisible();
      await page.waitForTimeout(150);

      const viewport = testInfo.project.name;
      const directory = path.join(evidenceRoot, viewport);
      const name = fileName(scenario, viewport);
      await fs.mkdir(directory, { recursive: true });
      await page.screenshot({ path: path.join(directory, name), fullPage: true });

      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);

      testInfo.annotations.push({
        type: 'capture',
        description: JSON.stringify({ ...scenario, viewport, file: `${viewport}/${name}` })
      });
    });
  }

  test.afterAll(async () => {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim();
    const captures = [];
    for (const viewport of ['desktop', 'android', 'iphone']) {
      const directory = path.join(evidenceRoot, viewport);
      const names = await fs.readdir(directory).catch(() => []);
      names.filter(name => name.endsWith('.png')).sort().forEach(name => {
        const [profile, surface, state] = name.replace(/__(desktop|android|iphone)\.png$/, '').split('__');
        captures.push({ profile, surface, state, viewport, file: `${viewport}/${name}` });
      });
    }
    await fs.writeFile(
      path.join(evidenceRoot, 'manifest.json'),
      `${JSON.stringify({ schemaVersion: 1, commit, captures }, null, 2)}\n`,
      'utf8'
    );
  });
});
```

**Important correction during implementation:** functions and constants declared in Node are not visible inside `page.evaluate`. Implement the scenario opening as a serializable `switch` inside the browser callback:

```javascript
await page.evaluate(({ profile, surface }) => {
  localStorage.removeItem('radar_cycle_b_dashboard_filter');
  localStorage.removeItem('radar_cycle_b_wallet_filters');
  switchProfile(profile);
  const viewBySurface = {
    dashboard: 'dashboard',
    carteira: 'escolas',
    competencias: 'competencias',
    pendencias: 'pendencias',
    inventario: 'inventario',
    'registros-internos': 'auditoria',
    configuracoes: 'sme-config',
    equipe: 'equipe'
  };
  switchView(viewBySurface[surface]);
}, { profile: profileMap[scenario.profile], surface: scenario.surface });
```

Use esse bloco no arquivo final; não mantenha a versão que referencia `scenarios` dentro do navegador.

- [ ] **Step 5: Adicionar script npm**

Adicionar em `package.json`:

```json
"audit:baseline": "playwright test --config=playwright.audit.config.js",
```

- [ ] **Step 6: Executar captura**

```bash
npm run audit:baseline
```

Expected: 27 cenários aprovados, nove por viewport, com `manifest.json` e PNGs.

- [ ] **Step 7: Revisar capturas manualmente**

Verificar:

- ausência de tela cortada;
- ausência de overflow global;
- conteúdo principal visível;
- perfil correto;
- navegação correta;
- dados pessoais desnecessários mascarados antes de versionar;
- capturas úteis como baseline, não apenas splash screen.

Quando uma superfície exigir estado não alcançado pelo cenário simples, adicionar cenário determinístico específico, sem mudar código de produto.

- [ ] **Step 8: Rodar testes de interface vigentes**

```bash
npm run test:e2e
npm run test:mobile
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json playwright.audit.config.js tests/audit/global-baseline.spec.js tests/unit/audit-tools.test.js docs/evidence/global-baseline
git commit -m "test: registrar linha de base visual reproduzível"
```

---

### Task 6: Catalogar superfícies e consolidar auditoria do produto

**Files:**
- Create: `docs/reference/PRODUCT_SURFACE_CATALOG.md`
- Create: `docs/audits/2026-07-15-produto-estado-atual.md`
- Read: `docs/evidence/global-baseline/manifest.json`
- Read: testes E2E por superfície.

**Interfaces:**
- Consumes: decisões, classificações, inventário, dados e capturas.
- Produces: visão funcional completa e matriz de maturidade usada pelo backlog.

- [ ] **Step 1: Mapear testes por superfície**

```bash
for file in tests/e2e/*.spec.js; do
  printf '\n## %s\n' "$file"
  grep -E "test\.describe|test\(" "$file" | sed -n '1,40p'
done > /tmp/radar-e2e-map.txt
```

Expected: mapa de cenários existentes.

- [ ] **Step 2: Criar catálogo com ficha padrão**

Criar `docs/reference/PRODUCT_SURFACE_CATALOG.md` e repetir esta ficha para as 18 superfícies da especificação:

```markdown
## S-01 — Dashboard

| Campo | Conteúdo |
|---|---|
| Mecanismo atual | `switchView('dashboard')`; `#nav-dashboard` |
| Perfis | Controlador; Assistente; Gestão SME conforme projeção |
| Tarefa real | identificar situação da carteira e próxima ação |
| Dados lidos | escolas, competências, verificações, pendências, programas |
| Dados gravados | filtros e contexto local, quando aplicável |
| Serviços/conexões | projeção operacional; Carteira; Pendências; Prontuário |
| Estados | padrão; filtrado; sem resultado; resultado contextual |
| Ações | filtrar, abrir resultado, navegar para ação |
| Desktop | cards, gráficos/listas e resultados |
| Mobile | layout responsivo e navegação móvel |
| Acessibilidade | foco, headings, controles e regiões atualizadas |
| Testes | `tests/e2e/cycle-b-dashboard.spec.js`; demais testes relacionados |
| Evidências | caminhos do manifesto visual |
| Pontos fortes | preencher com evidência |
| Riscos/lacunas | preencher com evidência |
| Classificação | `CP`, `ID`, `FA`, `IC`, `DC`, `DQ`, `DF` ou `EP` por item |
```

Superfícies obrigatórias:

- S-01 Dashboard;
- S-02 Carteira;
- S-03 Competências;
- S-04 Pendências;
- S-05 Prontuário;
- S-06 Capital e Inventário;
- S-07 Registros Internos;
- S-08 Configurações SME;
- S-09 Gestão de Equipe;
- S-10 Exercícios;
- S-11 Programas;
- S-12 Alertas;
- S-13 Busca global;
- S-14 Exportação Excel;
- S-15 Autenticação;
- S-16 Modais e confirmações;
- S-17 Formulários;
- S-18 Estados vazios/loading/erro.

- [ ] **Step 3: Executar fluxos reais por perfil**

Para cada perfil disponível no modo local:

```bash
npm start
```

Em outra sessão, usar Playwright headed:

```bash
npx playwright test tests/e2e/functional-core.spec.js tests/e2e/cycle-b-dashboard.spec.js tests/e2e/cycle-b-carteira.spec.js tests/e2e/task-10-11-pendencias.spec.js tests/e2e/mobile-smoke.spec.js --project=desktop-chromium --headed --workers=1
```

Complementar com inspeção manual de Inventário, Registros Internos, Configurações SME e Equipe.

Registrar apenas observações reproduzíveis.

- [ ] **Step 4: Criar matriz de maturidade**

Em `docs/audits/2026-07-15-produto-estado-atual.md`, criar tabela de notas 1–5 para:

- correção funcional;
- cobertura de regras;
- conexão;
- clareza;
- encontrabilidade;
- produtividade;
- acessibilidade;
- responsividade;
- consistência visual;
- estados;
- testabilidade;
- prontidão remota.

Cada nota deve ter uma justificativa textual. Não usar média única como conclusão.

- [ ] **Step 5: Consolidar a auditoria global**

Estrutura obrigatória:

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

Todo achado deve indicar código de classificação e evidência.

- [ ] **Step 6: Validar que não há recomendação sem evidência**

```bash
git grep -n -E "deve ser melhorado|precisa melhorar|modernizar|refatorar" -- docs/audits/2026-07-15-produto-estado-atual.md
```

Para cada ocorrência, confirmar que o parágrafo contém caminho, teste, captura, fluxo observado ou decisão.

- [ ] **Step 7: Commit**

```bash
git add docs/reference/PRODUCT_SURFACE_CATALOG.md docs/audits/2026-07-15-produto-estado-atual.md
git commit -m "docs: catalogar superfícies e auditoria global"
```

---

### Task 7: Especificar contratos transversais de experiência

**Files:**
- Create: `docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`

**Interfaces:**
- Consumes: padrões corretos encontrados no produto e lacunas classificadas.
- Produces: contrato funcional para Ciclos B–E; não produz componentes.

- [ ] **Step 1: Levantar implementações atuais**

```bash
git grep -n -E "aria-live|role=.?dialog|aria-modal|Escape|keydown|focus\(|alert\(|confirm\(|loading|spinner|empty|sem resultado|não foi possível|sessão" -- index.html app.js src tests > /tmp/radar-ux-contracts.txt
```

- [ ] **Step 2: Criar especificação**

Criar o arquivo com esta estrutura para cada contrato:

```markdown
# Contratos transversais de experiência

## Princípios

- preservar o trabalho preenchido após falha;
- feedback não bloqueante para sucesso e informação;
- diálogo explícito para decisão crítica;
- foco previsível;
- teclado e leitor de tela;
- ação de recuperação;
- linguagem funcional específica;
- comportamento equivalente em local e Supabase.

## C-01 — Loading

### Finalidade
Indicar operação em andamento sem apagar contexto.

### Estados
- inicial;
- em andamento;
- concluído;
- falhou;
- excedeu tempo esperado.

### Comportamento
- desabilitar apenas a ação que não pode ser repetida;
- impedir duplo envio;
- preservar campos;
- encerrar em `finally`;
- não bloquear navegação quando a operação for local e independente.

### Acessibilidade
- texto visível ou nome acessível;
- `aria-busy` na região atualizada;
- `aria-live="polite"` quando o resultado não exigir interrupção.

### Recuperação
- mensagem específica;
- botão tentar novamente quando seguro;
- orientação para sessão, permissão, rede ou validação.

### Evidência atual
- listar implementações corretas e inconsistentes encontradas.

### Critério de aceite futuro
- definir teste observável.
```

Repetir para:

- C-01 Loading;
- C-02 Sucesso;
- C-03 Erro;
- C-04 Alerta;
- C-05 Confirmação crítica;
- C-06 Conflito;
- C-07 Sessão expirada;
- C-08 Indisponibilidade;
- C-09 Estado vazio;
- C-10 Formulário alterado;
- C-11 Salvamento;
- C-12 Foco;
- C-13 Modal;
- C-14 Menu;
- C-15 Tooltip;
- C-16 Painel lateral.

- [ ] **Step 3: Separar capacidade de biblioteca**

Adicionar seção:

```markdown
## Decisão sobre implementação futura

Este documento define capacidades e comportamento. A escolha entre componente próprio, Web Platform, biblioteca headless ou pacote externo será feita por pacote, após análise de dependência. Nenhuma biblioteca é aprovada por esta especificação.
```

- [ ] **Step 4: Revisar contra as melhores implementações atuais**

Comparar com:

- `src/integration/modal-accessibility.js`;
- `src/application/error-mapper.js`;
- `tests/e2e/modal-accessibility.spec.js`;
- `tests/e2e/data-error-ux.spec.js`;
- `tests/e2e/mobile-smoke.spec.js`.

Preservar padrões já corretos em vez de criar contrato concorrente.

- [ ] **Step 5: Commit**

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
- Produces: fila única de pacotes e indicação do próximo plano técnico.

- [ ] **Step 1: Extrair achados classificados**

```bash
git grep -n -E "\b(CP|ID|FA|IC|DC|DQ|DF|EP)\b" -- docs/audits docs/reference/PRODUCT_SURFACE_CATALOG.md > /tmp/radar-classified-findings.txt
```

- [ ] **Step 2: Criar backlog**

Criar `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`:

```markdown
# Backlog priorizado pós-PR 22

## Método

Prioridade considera impacto, urgência, risco, dependência, esforço, aprovação visual e relação com Supabase. Itens `CP` e `ID` não viram implementação; entram como proteções.

## Escala

- P0 — risco crítico atual comprovado;
- P1 — bloqueia próximo estágio ou causa perda operacional relevante;
- P2 — ganho alto de produto ou manutenção;
- P3 — evolução útil não bloqueadora;
- P4 — hipótese para estudo posterior.

## Itens

| ID | Prioridade | Ciclo | Superfície | Classe | Evidência | Problema/oportunidade | Resultado esperado | Preservações | Dependências | Visual | Decisão humana | Supabase | Pacote sugerido |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

Cada item deve ter evidência concreta. Não criar item genérico “melhorar UX”.

- [ ] **Step 3: Criar mapa de dependências**

Adicionar:

```markdown
## Dependências

```text
A2 dados e ambientes
├─ F1 Preview remoto
├─ F2 migrations
└─ F3 usuários/RLS

B1 precedência frontend
├─ B2 tokens
├─ B3 interações
└─ B5 remoção de camadas

C1 estado de navegação
├─ C2 URL/histórico
├─ C3 busca
└─ C5 retorno
```
```

Completar com os itens reais identificados.

- [ ] **Step 4: Separar perguntas do backlog**

Para cada `DQ`, criar seção `## Decisões do responsável` com pergunta específica, alternativas, consequência e recomendação provisória.

Não priorizar implementação do item até a resposta.

- [ ] **Step 5: Recomendar o primeiro pacote**

Adicionar seção:

```markdown
## Primeiro pacote recomendado

- Pacote:
- Classificação dos achados:
- Evidências:
- Por que vem primeiro:
- Resultado esperado:
- O que será preservado:
- Dependências satisfeitas:
- Aprovação visual necessária:
- Plano técnico a criar:
```

Preencher somente após analisar todo o backlog. Se nenhum pacote funcional superar a urgência do Supabase F1/F2, registrar essa conclusão em vez de forçar o Ciclo B.

- [ ] **Step 6: Revisar duplicidades**

```bash
node - <<'NODE'
const fs = require('node:fs');
const text = fs.readFileSync('docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md', 'utf8');
const ids = [...text.matchAll(/^\| (BL-[A-Z0-9-]+) \|/gm)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  console.error('IDs duplicados:', [...new Set(duplicates)].join(', '));
  process.exit(1);
}
console.log(`${ids.length} itens de backlog sem IDs duplicados`);
NODE
```

Expected: exit code `0`.

- [ ] **Step 7: Commit**

```bash
git add docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md docs/audits/2026-07-15-produto-estado-atual.md
git commit -m "docs: priorizar backlog global pós-PR 22"
```

---

### Task 9: Automatizar validação dos artefatos do Ciclo A

**Files:**
- Create: `scripts/audit/validate-cycle-a-artifacts.mjs`
- Modify: `tests/unit/audit-tools.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `validateCycleAArtifacts(rootDir)`.
- Produces: comando `npm run audit:cycle-a`.
- Consumed by: gate final e futuros PRs que atualizem o catálogo.

- [ ] **Step 1: Escrever teste falhando**

Acrescentar a `tests/unit/audit-tools.test.js`:

```javascript
test('validador do Ciclo A aceita o conjunto completo de artefatos', async () => {
  const moduleUrl = pathToFileURL(path.join(rootDir, 'scripts/audit/validate-cycle-a-artifacts.mjs')).href;
  const { validateCycleAArtifacts } = await import(moduleUrl);
  const result = await validateCycleAArtifacts(rootDir);
  assert.equal(result.errors.length, 0, result.errors.join('\n'));
  assert.ok(result.surfaceCount >= 18);
  assert.ok(result.captureCount >= 27);
});
```

- [ ] **Step 2: Confirmar falha**

```bash
node --test tests/unit/audit-tools.test.js
```

Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar validador**

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

const VALID_CODES = new Set(['CP', 'ID', 'FA', 'IC', 'DC', 'DQ', 'DF', 'EP']);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function localMarkdownLinks(source) {
  return [...source.matchAll(/\[[^\]]*\]\((?!https?:|mailto:|#)([^)]+)\)/g)]
    .map(match => match[1].split('#')[0])
    .filter(Boolean);
}

export async function validateCycleAArtifacts(rootDir) {
  const errors = [];
  for (const relativePath of REQUIRED_FILES) {
    if (!(await exists(path.join(rootDir, relativePath)))) errors.push(`Arquivo ausente: ${relativePath}`);
  }

  const markdownFiles = REQUIRED_FILES.filter(file => file.endsWith('.md'));
  for (const relativePath of markdownFiles) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!(await exists(absolutePath))) continue;
    const source = await readFile(absolutePath, 'utf8');
    if (/\b(TBD|TODO|implement later|fill in details)\b/i.test(source)) {
      errors.push(`Placeholder proibido: ${relativePath}`);
    }
    for (const link of localMarkdownLinks(source)) {
      const target = path.resolve(path.dirname(absolutePath), decodeURIComponent(link));
      if (!(await exists(target))) errors.push(`Link local quebrado em ${relativePath}: ${link}`);
    }
  }

  const catalogPath = path.join(rootDir, 'docs/reference/PRODUCT_SURFACE_CATALOG.md');
  const catalog = await readFile(catalogPath, 'utf8').catch(() => '');
  const surfaceIds = [...catalog.matchAll(/^## S-\d{2} —/gm)];
  if (surfaceIds.length < 18) errors.push(`Catálogo possui ${surfaceIds.length} superfícies; mínimo 18`);

  const auditPath = path.join(rootDir, 'docs/audits/2026-07-15-produto-estado-atual.md');
  const audit = await readFile(auditPath, 'utf8').catch(() => '');
  for (const match of audit.matchAll(/\b([A-Z]{2})\b/g)) {
    const code = match[1];
    if (['CP', 'ID', 'FA', 'IC', 'DC', 'DQ', 'DF', 'EP'].includes(code) && !VALID_CODES.has(code)) {
      errors.push(`Código inválido: ${code}`);
    }
  }

  const manifestPath = path.join(rootDir, 'docs/evidence/global-baseline/manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{"captures":[]}'));
  for (const capture of manifest.captures || []) {
    const capturePath = path.join(rootDir, 'docs/evidence/global-baseline', capture.file);
    if (!(await exists(capturePath))) errors.push(`Captura ausente: ${capture.file}`);
  }

  return {
    errors,
    surfaceCount: surfaceIds.length,
    captureCount: (manifest.captures || []).length
  };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const result = await validateCycleAArtifacts(rootDir);
  if (result.errors.length) {
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(`Ciclo A válido: ${result.surfaceCount} superfícies e ${result.captureCount} capturas.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
```

- [ ] **Step 4: Adicionar script npm**

Adicionar:

```json
"audit:cycle-a": "node scripts/audit/validate-cycle-a-artifacts.mjs",
```

- [ ] **Step 5: Executar teste e validador**

```bash
node --test tests/unit/audit-tools.test.js
npm run audit:cycle-a
```

Expected: PASS e mensagem com pelo menos 18 superfícies e 27 capturas.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/audit/validate-cycle-a-artifacts.mjs tests/unit/audit-tools.test.js
git commit -m "test: validar artefatos do Ciclo A"
```

---

### Task 10: Indexar documentação, validar tudo e preparar handoff

**Files:**
- Modify: `docs/README.md`
- Create: `docs/handoff/2026-07-15-ciclo-a-final-report.md`
- Read: todos os artefatos do Ciclo A.

**Interfaces:**
- Produces: PR revisável e recomendação do próximo pacote.
- Does not produce: merge, deployment ou mudança funcional.

- [ ] **Step 1: Atualizar índice documental**

Adicionar em `docs/README.md` uma seção:

```markdown
## Ciclo A pós-PR 22 — linha de base e classificação

- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md) — decisões canônicas e fronteiras;
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) — classificação dos achados;
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) — política de dados e ambientes;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — catálogo funcional e visual;
- [`reference/POST_PR22_PRIORITIZED_BACKLOG.md`](reference/POST_PR22_PRIORITIZED_BACKLOG.md) — backlog priorizado;
- [`audits/2026-07-15-inventario-tecnico-global.md`](audits/2026-07-15-inventario-tecnico-global.md) — inventário técnico;
- [`audits/2026-07-15-dados-e-ambientes-estado-atual.md`](audits/2026-07-15-dados-e-ambientes-estado-atual.md) — auditoria de dados;
- [`audits/2026-07-15-produto-estado-atual.md`](audits/2026-07-15-produto-estado-atual.md) — auditoria global;
- [`superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`](superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md) — contratos de experiência.
```

- [ ] **Step 2: Criar relatório final**

Criar `docs/handoff/2026-07-15-ciclo-a-final-report.md`:

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

Preencher cada seção com números, caminhos, commits e resultados reais.

- [ ] **Step 3: Executar validação documental**

```bash
npm run audit:inventory
npm run audit:cycle-a
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Executar regressão completa**

```bash
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
npm run test:readiness
npm run test:e2e
npm run test:mobile
npm audit --audit-level=high
```

Expected: todos os comandos com exit code `0`. Se `npm audit` identificar vulnerabilidade preexistente, registrar versão, severidade e condição preexistente; não atualizar dependências dentro desta PR.

- [ ] **Step 5: Provar ausência de alteração funcional**

```bash
git diff origin/main --name-only | grep -E '^(app\.js|index\.html|styles\.css|config\.js|config\.runtime\.js|src/|supabase/|vercel\.json|\.github/workflows/)' && exit 1 || true
```

Expected: nenhum caminho proibido.

- [ ] **Step 6: Revisar placeholders e ambiguidades**

```bash
git grep -n -E "\b(TBD|TODO|implement later|fill in details|melhorar UX|modernizar o sistema)\b" -- docs/reference docs/audits docs/handoff docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md
```

Expected: nenhuma ocorrência nos artefatos finais. Expressões em citações históricas devem ser reformuladas.

- [ ] **Step 7: Commit final**

```bash
git add docs/README.md docs/handoff/2026-07-15-ciclo-a-final-report.md docs/evidence/global-baseline/repository-inventory.json docs/evidence/global-baseline/manifest.json
git commit -m "docs: concluir linha de base global do RADAR"
```

- [ ] **Step 8: Revisar histórico e diff**

```bash
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
```

Expected: working tree limpa e somente documentação, ferramentas de auditoria, testes de auditoria e evidências.

- [ ] **Step 9: Publicar branch e abrir PR em rascunho**

```bash
git push -u origin docs/ciclo-a-execucao
gh pr create \
  --draft \
  --base main \
  --head docs/ciclo-a-execucao \
  --title "Ciclo A pós-PR 22 — linha de base, classificação e contratos" \
  --body-file docs/handoff/2026-07-15-ciclo-a-final-report.md
```

Expected: PR em rascunho, sem auto-merge e sem deployment de produção.

- [ ] **Step 10: Verificar CI e não avançar automaticamente**

```bash
gh pr checks --watch
```

Expected: checks verdes. Não retirar de rascunho, não fazer merge e não iniciar o próximo pacote sem revisão e autorização do responsável.

---

## Plan Self-Review

### Spec coverage

- decisões e fronteiras: Task 2;
- dados e ambientes: Task 4;
- inventário técnico: Task 3;
- baseline visual: Task 5;
- catálogo e auditoria: Task 6;
- contratos transversais: Task 7;
- backlog e dúvidas: Task 8;
- validação automatizada: Task 9;
- handoff, índice e regressão: Task 10;
- ausência de mudança funcional: Global Constraints e Task 10.

### Scope check

O plano produz um único resultado testável: a linha de base governada do produto. Não implementa os pacotes identificados e não mistura Supabase remoto, redesign ou refatoração funcional.

### Placeholder check

Os artefatos de execução não podem conter `TBD`, `TODO`, “implement later” ou instruções vagas. Campos mostrados em templates devem ser preenchidos com resultados reais antes do commit correspondente.

### Interface consistency

- `generateRepositoryInventory(rootDir)` é produzido na Task 3 e testado na mesma tarefa;
- `validateCycleAArtifacts(rootDir)` é produzido na Task 9 e consumido pelo script npm;
- `audit:inventory`, `audit:baseline` e `audit:cycle-a` possuem nomes únicos e estáveis;
- manifesto usa `schemaVersion`, `commit` e `captures`;
- códigos de classificação são os oito definidos no Plano Diretor.
