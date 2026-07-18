# Plano de implementação — contrato integral de perfis e superfícies

> **Execução:** aplicar em branch isolada a partir da `main`, preservando o PR #29 como pacote documental e de governança.

**Objetivo:** alinhar os cinco papéis institucionais, a navegação, as ações da Gestão de Equipe, os serviços e as políticas RLS, eliminando a conversão de Administrador técnico em Assistente.

**Especificação:** [`../specs/2026-07-18-contrato-perfis-superficies-design.md`](../specs/2026-07-18-contrato-perfis-superficies-design.md)

**Estratégia:** TDD por contrato. Primeiro, falhar testes de mapeamento, visibilidade e autorização. Em seguida, introduzir o perfil `admin_tecnico`, separar distribuição de carteiras de administração estrutural, criar a superfície Administração Técnica e harmonizar local/Supabase. Cada etapa deve produzir commit próprio e executar os gates indicados.

---

## Preservações obrigatórias

- não alterar regras de bonificação, análise, pendência, retificação ou inventário;
- não modificar a produção nem ativar Supabase remoto;
- não remover colunas ou ações aprovadas das superfícies operacionais;
- não expor segredos, credenciais ou dados pessoais adicionais;
- não fundir Administrador técnico com Gestão SME;
- não conceder exclusão física a perfis operacionais;
- manter os quatro estados canônicos de pendência;
- executar regressão desktop, Android e iPhone.

---

## Task 1 — Congelar o contrato atual com testes de caracterização

**Arquivos:**

- modificar `tests/unit/auth-gate.test.js`;
- modificar `tests/e2e/frontend-contract.spec.js`;
- criar `tests/e2e/profile-surface-matrix.spec.js`.

### Passo 1 — Teste unitário vermelho

Adicionar expectativa de que os cinco papéis resolvam para cinco perfis distintos:

```js
assert.equal(legacyProfileForRole('controller'), 'controlador');
assert.equal(legacyProfileForRole('federal_assistant'), 'assistente');
assert.equal(legacyProfileForRole('inventory'), 'inventario');
assert.equal(legacyProfileForRole('sme_management'), 'sme');
assert.equal(legacyProfileForRole('technical_admin'), 'admin_tecnico');
```

O teste deve falhar inicialmente porque `technical_admin` ainda resolve para `assistente`.

### Passo 2 — Teste E2E vermelho

Parametrizar a matriz mínima de itens de navegação esperados para cada perfil local. Incluir negação de `Gestão de Equipe` estrutural para Assistente e presença de `Administração Técnica` para Admin técnico.

### Passo 3 — Executar o vermelho

```bash
npm run test:unit -- --test-name-pattern="auth|perfil"
npx playwright test tests/e2e/profile-surface-matrix.spec.js --project=chromium
```

Registrar as falhas esperadas.

### Passo 4 — Commit

```bash
git add tests/unit/auth-gate.test.js tests/e2e/frontend-contract.spec.js tests/e2e/profile-surface-matrix.spec.js
git commit -m "test: congelar contrato dos cinco perfis"
```

---

## Task 2 — Criar o perfil canônico `admin_tecnico`

**Arquivos:**

- modificar `src/integration/auth-gate.js`;
- modificar `app.js`;
- modificar `index.html`;
- modificar `tests/unit/auth-gate.test.js`;
- modificar `tests/e2e/profile-surface-matrix.spec.js`.

### Passo 1 — Corrigir o mapeamento

Em `ROLE_TO_LEGACY_PROFILE`:

```js
technical_admin: 'admin_tecnico'
```

### Passo 2 — Adicionar identidade local segura

Adicionar usuário simulado sem dados pessoais reais:

```js
admin_tecnico: {
  name: 'Administrador técnico',
  role: 'Administrador técnico'
}
```

### Passo 3 — Adicionar opção local

No seletor de perfil, incluir Administrador técnico. O seletor continua oculto quando Auth remoto estiver habilitado.

### Passo 4 — Impedir fallback operacional

`renderDashboard()` e `switchView()` não devem enviar `admin_tecnico` ao Dashboard da Assistente. O destino inicial deve ser `admin-tecnico`.

### Passo 5 — Executar testes

```bash
npm run check
npm run test:unit -- --test-name-pattern="auth|perfil"
npx playwright test tests/e2e/profile-surface-matrix.spec.js --project=chromium
```

### Passo 6 — Commit

```bash
git add src/integration/auth-gate.js app.js index.html tests/unit/auth-gate.test.js tests/e2e/profile-surface-matrix.spec.js
git commit -m "feat: separar administrador técnico da assistência"
```

---

## Task 3 — Centralizar capacidades de interface

**Arquivos:**

- criar `src/domain/profile-capabilities.js`;
- modificar `config.js` para carregar o módulo antes de `app.js` ou conforme a ordem aprovada;
- modificar `app.js`;
- criar `tests/unit/profile-capabilities.test.js`;
- modificar `scripts/audit/analyze-frontend-precedence.mjs` se necessário ao manifesto de carga.

### Passo 1 — Definir capacidades, não condicionais dispersos

Estrutura mínima:

```js
const PROFILE_CAPABILITIES = Object.freeze({
  controlador: Object.freeze({
    operateDocuments: true,
    manageAssignments: false,
    manageDirectory: false,
    manageTechnicalAccess: false
  }),
  assistente: Object.freeze({
    operateDocuments: true,
    manageAssignments: true,
    manageDirectory: false,
    manageTechnicalAccess: false
  }),
  inventario: Object.freeze({
    operateInventory: true,
    manageAssignments: false,
    manageDirectory: false,
    manageTechnicalAccess: false
  }),
  sme: Object.freeze({
    manageAssignments: true,
    manageDirectory: true,
    manageInstitutionalConfig: true,
    manageTechnicalAccess: false
  }),
  admin_tecnico: Object.freeze({
    manageAssignments: true,
    manageDirectory: true,
    manageTechnicalAccess: true,
    operateDocuments: false
  })
});
```

### Passo 2 — Expor API imutável

Funções:

- `capabilitiesFor(profile)`;
- `can(profile, capability)`;
- `assertCan(profile, capability)` para camada local de serviço/interface.

### Passo 3 — Testar todas as combinações críticas

```bash
node --test tests/unit/profile-capabilities.test.js
npm run audit:frontend-precedence:check
```

### Passo 4 — Commit

```bash
git add src/domain/profile-capabilities.js config.js app.js tests/unit/profile-capabilities.test.js scripts/audit/analyze-frontend-precedence.mjs
git commit -m "refactor: centralizar capacidades por perfil"
```

---

## Task 4 — Separar distribuição de carteiras e cadastro de equipe

**Arquivos:**

- modificar `app.js`;
- modificar `src/application/directory-service.js`;
- modificar `src/application/school-service.js`;
- modificar `tests/unit/directory-service.test.js`;
- modificar `tests/unit/school-service.test.js`;
- criar `tests/e2e/team-permissions.spec.js`.

### Passo 1 — Caracterizar ações

Mapear cada ação atual:

| Ação | Capacidade |
|---|---|
| consultar integrantes | `viewDirectory` |
| reatribuir escola | `manageAssignments` |
| reatribuir em lote | `manageAssignments` |
| cadastrar integrante | `manageDirectory` |
| editar integrante | `manageDirectory` |
| desativar integrante | `manageDirectory` |
| escolher destinatário na desativação | `manageDirectory` + `manageAssignments` |

### Passo 2 — Ajustar a interface da Assistente

Na Gestão de Equipe:

- manter consulta e distribuição de carteiras;
- remover/ocultar Cadastro, Editar e Desativar;
- alterar título descritivo para `Distribuição de Carteiras` quando o perfil for Assistente;
- manter histórico e contagens.

### Passo 3 — Manter administração estrutural em SME/Admin

Para `sme` e `admin_tecnico`, preservar cadastro, edição, desativação e reatribuição.

### Passo 4 — Proteger serviços

As ações estruturais devem chamar `assertCan(currentProfile, 'manageDirectory')`. Reatribuições devem chamar `assertCan(currentProfile, 'manageAssignments')`.

No modo remoto, a decisão final continua no RLS/RPC.

### Passo 5 — Testes vermelho/verde

Cenários:

- Assistente vê dropdown de reatribuição;
- Assistente não encontra botões de cadastro, edição ou desativação;
- SME e Admin encontram e concluem ações estruturais;
- Controlador e Inventário não acessam a superfície de mutação;
- chamada direta de função sem capacidade é negada.

```bash
node --test tests/unit/directory-service.test.js tests/unit/school-service.test.js
npx playwright test tests/e2e/team-permissions.spec.js --project=chromium
```

### Passo 6 — Commit

```bash
git add app.js src/application/directory-service.js src/application/school-service.js tests/unit/directory-service.test.js tests/unit/school-service.test.js tests/e2e/team-permissions.spec.js
git commit -m "feat: separar distribuição de carteiras da gestão estrutural"
```

---

## Task 5 — Criar a superfície Administração Técnica

**Arquivos:**

- modificar `index.html`;
- modificar `app.js`;
- criar `src/integration/technical-admin-page.js`;
- criar `src/styles/technical-admin.css`;
- modificar `config.js`;
- criar `tests/e2e/technical-admin-page.spec.js`;
- criar `tests/unit/technical-admin-projection.test.js` se houver projeção dedicada.

### Passo 1 — Navegação própria

Adicionar grupo `Administração técnica`, visível apenas para `admin_tecnico`, com item `Acessos e Integração`.

### Passo 2 — Abas iniciais

- Usuários e perfis;
- Escopos;
- Importações;
- Auditoria técnica;
- Saúde da integração.

No modo local, os dados devem ser fixtures sintéticas ou projeções seguras. Nenhum segredo pode ser exibido.

### Passo 3 — Estados

Implementar:

- loading;
- sem dados;
- sem permissão;
- indisponível;
- leitura normal.

A primeira versão pode ser de consulta e preparação, exceto capacidades já suportadas pelos serviços.

### Passo 4 — Acessibilidade

- abas com semântica correta;
- foco no título ao navegar;
- tabelas com cabeçalhos;
- mensagens dinâmicas em `aria-live`;
- ações excepcionais em diálogo crítico compartilhado.

### Passo 5 — Testes

```bash
npm run check
npx playwright test tests/e2e/technical-admin-page.spec.js --project=chromium
npx playwright test tests/e2e/modal-accessibility.spec.js --project=chromium
```

### Passo 6 — Commit

```bash
git add index.html app.js src/integration/technical-admin-page.js src/styles/technical-admin.css config.js tests/e2e/technical-admin-page.spec.js tests/unit/technical-admin-projection.test.js
git commit -m "feat: criar administração técnica segregada"
```

---

## Task 6 — Alinhar matriz RLS, documentação e tipos

**Arquivos:**

- modificar `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`;
- modificar `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
- modificar `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`;
- revisar `supabase/migrations/202607130002_auth_and_rls.sql`;
- criar migration aditiva somente se a política atual não representar o contrato;
- atualizar `src/types/database.types.ts` somente por geração;
- modificar testes SQL em `supabase/tests/database/`.

### Passo 1 — Não editar migration histórica sem necessidade

Preferir nova migration aditiva para políticas e funções alteradas. Não reescrever migration já homologada localmente salvo decisão explícita de reconstrução da pilha.

### Passo 2 — Garantir equivalência

- Assistente altera vínculo escola–controlador, mas não cadastro de integrante;
- SME administra diretório e configuração, sem mutar pendência cotidiana;
- Admin técnico administra perfis/escopos e exceções;
- Inventário não altera análise;
- Controlador não acessa escola alheia.

### Passo 3 — Testes SQL

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
npm run supabase:stop
```

### Passo 4 — Commit

```bash
git add docs/reference/SUPABASE_PERMISSIONS_MATRIX.md docs/reference/PRODUCT_SURFACE_CATALOG.md docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md supabase/migrations supabase/tests src/types/database.types.ts
git commit -m "feat: alinhar políticas aos cinco perfis"
```

---

## Task 7 — Matriz E2E completa por perfil e superfície

**Arquivos:**

- ampliar `tests/e2e/profile-surface-matrix.spec.js`;
- modificar `tests/e2e/supabase-auth-local.spec.js`;
- modificar `tests/e2e/supabase-full-contract.spec.js`;
- modificar `tests/e2e/mobile-smoke.spec.js`;
- revisar `playwright.config.js`.

### Passo 1 — Parametrizar papéis

Para cada papel, testar:

- página inicial;
- itens de navegação visíveis;
- URL direta permitida;
- URL direta negada;
- ação principal permitida;
- ação crítica proibida;
- logout e sessão expirada.

### Passo 2 — Cobrir superfícies transversais

- busca global respeita escopo;
- alertas respeitam papel;
- exportação respeita autorização;
- vazio não revela dados externos;
- erro RLS mantém formulário e contexto.

### Passo 3 — Executar matriz completa

```bash
npm run test:e2e
npm run test:mobile
```

### Passo 4 — Commit

```bash
git add tests/e2e playwright.config.js
git commit -m "test: homologar superfícies por perfil"
```

---

## Task 8 — Auditoria de regressão visual e acessibilidade

**Arquivos:**

- criar evidências em `docs/evidence/profile-contract/`;
- criar `docs/audits/YYYY-MM-DD-contrato-perfis-implementado.md`;
- atualizar `design-qa.md`;
- atualizar `docs/README.md`.

### Passo 1 — Capturar superfícies representativas

No mesmo viewport:

- Dashboard Controlador;
- Distribuição de Carteiras da Assistente;
- Gestão estrutural SME;
- Dashboard Inventário;
- Administração Técnica;
- negação de acesso;
- mobile dos fluxos essenciais.

Mascarar dados pessoais somente no DOM da sessão de evidência.

### Passo 2 — Axe e teclado

Validar:

- navegação por teclado;
- foco ao trocar de tela;
- abas;
- diálogos;
- mensagens de negação;
- ausência de violações críticas/sérias nos estados auditados.

### Passo 3 — Comparação

Demonstrar que:

- Assistente preservou distribuição de carteiras;
- ações estruturais migraram para SME/Admin;
- Admin técnico não apresenta operação documental;
- demais perfis não sofreram regressão.

### Passo 4 — Commit

```bash
git add docs/evidence/profile-contract docs/audits design-qa.md docs/README.md
git commit -m "docs: auditar contrato implementado de perfis"
```

---

## Task 9 — Gate final da branch

### Passo 1 — Árvore limpa

```bash
git status --short
```

Resultado esperado: vazio.

### Passo 2 — Validação estrutural

```bash
npm run test:readiness
```

### Passo 3 — Banco local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:stop
```

### Passo 4 — Interface

```bash
npm run test:e2e
npm run test:mobile
```

### Passo 5 — Auditorias

```bash
npm run audit:frontend-precedence:check
npm run audit:functional
npm run check:generated
npm run check:runtime-config
```

### Passo 6 — Verificação de diff

```bash
git diff --check main...HEAD
git log --oneline --decorate main..HEAD
```

### Passo 7 — PR

Abrir PR em rascunho com:

- decisões implementadas;
- matriz antes/depois;
- evidências de negação e segregação;
- resultados integrais dos testes;
- declaração explícita de que Supabase remoto e produção não foram alterados.

Somente retirar do rascunho após todos os workflows passarem no SHA final.

---

## Ordem de execução resumida

```text
T1 testes de contrato
  ↓
T2 admin_tecnico próprio
  ↓
T3 capacidades centralizadas
  ↓
T4 distribuição ≠ diretório
  ↓
T5 Administração Técnica
  ↓
T6 RLS e documentação
  ↓
T7 matriz E2E
  ↓
T8 auditoria visual/a11y
  ↓
T9 gate final
```

---

## Condição de conclusão

O pacote somente será considerado concluído quando:

- `technical_admin` não resolver para Assistente;
- cinco perfis tiverem navegação e capacidades próprias;
- Assistente distribuir carteiras sem administrar identidade;
- SME/Admin administrarem estrutura;
- Admin técnico possuir superfície própria e não operar documentos por padrão;
- local, Supabase local e testes E2E representarem o mesmo contrato;
- todos os workflows passarem no SHA final;
- nenhuma alteração tiver sido publicada em produção sem autorização expressa.
