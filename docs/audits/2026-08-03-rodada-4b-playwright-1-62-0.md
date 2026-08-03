# Auditoria — Rodada 4B: Playwright 1.62.0

**Data:** 3 de agosto de 2026  
**PR:** `#128`  
**SHA funcional validado:** `6c03169ce0fab5833f818689bb87c8e07e1f122d`

## 1. Objetivo

Atualizar `@playwright/test` de `1.61.1` para `1.62.0` sem alterar o produto, a matriz existente, os limites de qualidade ou os ambientes remotos.

## 2. Alterações efetivas

### `package.json`

```text
@playwright/test: 1.61.1 → 1.62.0
```

### `package-lock.json`

```text
@playwright/test: 1.62.0
playwright: 1.62.0
playwright-core: 1.62.0
engines internos: Node >=20
fsevents: mesma versão 2.3.2, reposicionada pelo npm
supabase: preservado em 2.110.0
```

Nenhuma outra dependência mudou.

## 3. Compatibilidade

O projeto usa Node.js `24.x`; a execução validada usou Node.js `24.18.0` e npm `11.16.0`. O requisito mínimo do Playwright 1.62.0 é atendido.

A matriz existente foi preservada:

- Chromium desktop;
- Pixel 7 / Chromium;
- iPhone 15 / WebKit.

Firefox não foi acrescentado. Novos recursos da versão 1.62.0 não foram ativados sem necessidade funcional comprovada.

## 4. Geração reproduzível do lockfile

O lockfile foi regenerado em workflow temporário da própria branch com:

```text
npm install --save-dev --save-exact @playwright/test@1.62.0 --package-lock-only --ignore-scripts
npm ci --ignore-scripts
```

O workflow temporário foi removido antes da validação final do pacote funcional.

## 5. Gates aprovados

| Workflow | Run | Resultado |
|---|---:|---|
| Saúde das dependências | `30786138787` | success |
| Homologação do Excel SME | `30786138685` | success |
| Lighthouse CI | `30786138689` | success |
| Supabase readiness | `30786138713` | success |
| Backup e restauração descartáveis | `30786138677` | success |
| Testes E2E Playwright | `30786138676` | success |
| Gate remoto de perfis e viewports | `30786138715` | success |

### Dependências

- `npm ci`: aprovado;
- 375 pacotes instalados e 376 auditados;
- vulnerabilidades: 2 moderadas, 0 altas, 0 críticas;
- ocorrências moderadas aceitas pela política documentada do ExcelJS;
- referências locais: 15 workflows e 68 referências válidas;
- Fuse.js 7.5.0 e Floating UI 1.8.0 reproduzíveis;
- lint HTML, Knip, assinaturas, pacotes desatualizados, SBOM e árvore instalada aprovados ou registrados;
- artefato `dependency-health-30786138787`, SHA-256 `3374495f6f65b7fbb2e26cfe0aeabec59388901e6af6027fdad4fcefa0e8a3cb`.

### Produto e navegadores

- instalação dos navegadores Playwright: aprovada;
- E2E completo: aprovado;
- cinco perfis em desktop, Android e iPhone: aprovados;
- Auth e RLS por perfil: aprovados;
- Lighthouse mobile e desktop: aprovados sem redução dos pisos;
- Excel SME: aprovado.

### Supabase descartável

- readiness geral: aprovado;
- migration smoke: aprovado;
- Supabase local: aprovado;
- 25 migrations: aprovadas;
- 225 testes pgTAP: aprovados;
- lint SQL e tipos: aprovados;
- sete identidades Auth efêmeras: aprovadas;
- Edge Function: autorização aprovada;
- backup e restauração em segunda pilha: aprovados;
- equivalência de schema, dados, Auth e migrations: aprovada.

## 6. Desvios e correções

### 6.1 Especificação criada na `main`

A especificação foi criada por engano diretamente na `main` no commit `f99f17ec9eadbfbe5691b3c148f27374e4975459`.

Correção imediata:

- arquivo removido no commit `e9f625c436fef31a18bd729f9a6791280ed59310`;
- árvore restaurada antes de criar a branch;
- nenhum pacote, código funcional ou ambiente alterado.

### 6.2 Blobs do Dependabot sobre base antiga

A primeira tentativa de reaproveitar os blobs do PR `#79` foi revisada antes da validação. Ela também recuava o Supabase CLI de `2.110.0` para `2.109.1`.

Correção:

- tentativa descartada;
- baseline atual restaurado;
- lockfile regenerado pelo npm sobre a `main` corrente;
- Supabase CLI 2.110.0 preservado;
- PR `#79` fechado como substituído pelo PR `#128`.

## 7. Production

Não houve:

- deployment Vercel;
- alteração em `vercel.json`;
- `db push`;
- migration remota;
- acesso ou mudança de dados reais;
- alteração de Auth, RLS ou Edge Functions em Production.

A atualização é interna ao desenvolvimento e aos testes.

## 8. Conclusão

Playwright 1.62.0 é compatível com a arquitetura e com a matriz vigente do RADAR PDDE. O pacote funcional foi aprovado pelos sete gates obrigatórios, sem regressão comprovada, sem ampliação de escopo e sem impacto em Production.
