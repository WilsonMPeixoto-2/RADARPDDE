# RADAR PDDE — atualização controlada de dependências (10/10/2026)

> **Status:** etapas 0 a 4 concluídas e integradas, com publicação Vercel Production confirmada em 10/10/2026. Este é um registro **datado**; consultar `package.json`, `package-lock.json`, PRs e o deployment ativo para conhecer versões posteriores.

## Escopo e método

Escopo exclusivo: a versão corrente da `main` do repositório `WilsonMPeixoto-2/RADARPDDE`. PRs históricos de dependências não serviram de base nem foram reaproveitados. Cada pacote foi atualizado **individualmente**, com lockfile reproduzível por npm, testes locais proporcionais, PR isolado, CI e verificação de Production. Nenhuma revisão oportunista de CSS, regras de negócio, SQL ou tolerâncias de screenshots foi autorizada.

**Baseline da etapa 0:** `1f8f46febe319bf277a60b0dc8f7424c430acb61`, Node `24.21.0`, npm `11.19.0`; `npm ci`, sintaxe, matriz funcional e TypeScript aprovados; **1.323 testes unitários aprovados**. A auditoria npm encontrou **seis alertas high preexistentes**, já enquadrados na política de exceções por alcance (sem indicação de novos alertas causados pelas quatro atualizações); não equivale a declarar zero vulnerabilidades.

## Integrações de 10/10/2026 (sequência cronológica)

| Etapa | Mudança | PR integrado | SHA de merge em `main` | Comprovação |
|---|---|---|---|---|
| 1 | `knip` **6.40.0 → 6.41.0** | [#433](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/433) | `8c2d533886613a2bf8370d86f50731e1c3ba5d54` | 35 checks success, 2 skipped; Knip 6.41.0 executado sem apontamentos |
| 2 | `@types/node` **24.19.0 → 24.19.2** | [#434](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/434) | `b2173602bcf7dcb04f82f2250ec7652996b225a5` | 35 success, 2 skipped; 1.323 unitários e 8 integração locais |
| 3 | `@supabase/supabase-js` **2.117.2 → 2.117.3** | [#435](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/435) | `d4f89f546b5827935b92ebccf819268ae47accc3` | 36 success, 2 skipped; Supabase real, Auth/RLS/pgTAP e suites funcionais |
| 4 | `@playwright/test` **1.63.0 → 1.64.0** (`playwright`/`playwright-core` transitivos também 1.64.0) | [#436](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/436) | `7fa7089e139bc6c96600d27642802aea0943d349` | 35 success, 2 skipped; E2E desktop, visual e seis sessões reais aprovados |

Todos os PRs acima foram mesclados em **10/10/2026**, na ordem 433 → 434 → 435 → 436. Não confundir checks `skipped`/condicionais com execuções aprovadas.

**Production em 10/10:** deployment [`dpl_CwjyM6xsLZhJeAikcWwG3wTsTvAW`](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix), estado `READY`, SHA `7fa7089e139bc6c96600d27642802aea0943d349`, associado ao domínio `https://radarpdde-fix.vercel.app/`. A existência de deployment `READY` e alias confirmado não substitui teste de CRUD autenticado em Production.

### Notas sobre regressões e validação

- **Knip:** o parser Oxc precisou de mais memória do que havia em um sandbox de 4 GiB. Knip 6.40.0 e 6.41.0 passaram em sandbox de **8 GiB**; não foi caracterizada regressão do produto.
- **Tipos Node:** atualização patch dentro da série Node 24. A CI de seis sessões teve uma falha inicial da *baseline* anterior, reexecutada com sucesso sem ajustes de código.
- **Supabase JS:** `vendor/supabase-client.js` foi **regenerado** pelo builder; a Edge Function `team-account-management` teve o import `npm:@supabase/supabase-js@2.117.3` alinhado; contratos de versão e de retry foram mantidos. O gate Lighthouse registrou inicialmente 73% de performance (limite 75%); a reexecução da CI passou, **sem afrouxamento do limite**. O alinhamento do código-fonte da Edge Function não prova, por si só, que uma nova versão dessa função tenha sido implantada separadamente no Supabase Production.
- **Playwright:** instalação do Chromium correspondente e suítes remotas aprovadas. Sandbox isolado carecia da biblioteca Linux `libglib-2.0.so.0` para abrir o Chromium; os runners CI preparados para navegador executaram os testes. **Sem atualização automática de screenshots de referência, CSS, mocks ou tolerâncias.**

## Aproveitamento automático versus configuração opcional

| Ferramenta | Já ativo / benefício | Exige ação extra? / decisão |
|---|---|---|
| **Knip 6.41.0** | Workflow `.github/workflows/dependency-health.yml` já executa `npm run analyze:unused` em PRs, pushes pertinentes, agenda semanal e acionamento manual. O scanner passa a usar as melhorias de resolução de dependências opcionais, padrões `.gitignore`, cache e análise sem mudança de configuração. | **Não.** Manter configuração e natureza bloqueante da auditoria. |
| **`@types/node` 24.19.2** | Declarações de tipos atualizadas para código TypeScript que importa APIs Node. Compatível com `engines.node=24.x` e CI Node 24. | **Não para cobertura atual.** `typecheck:database` cobre principalmente `src/types/database.types.ts`; ampliação gradual do typecheck dos scripts JS/Node é iniciativa própria, não ativação desta atualização. |
| **Supabase JS 2.117.3** | O bundle do navegador e a dependência npm usam a versão nova; rotinas executadas via SDK passam a consumir suas correções internas. Testes de retry, Auth/RLS e persistência permanecem no gate. | **Não** para consumir o SDK no navegador; **verificar separadamente** eventual necessidade de deploy da Edge Function alterada. Não mexer em retry, fallback ou RLS por hipótese. |
| **Playwright 1.64.0** | CI já instala Chromium da versão e preserva traces com DOM/ARIA/screen, screenshots e vídeos de falhas; o novo encoder VP9 e correções internas são usados pela ferramenta. | **Não** para recursos atuais. `--shuffle` (ordem aleatória reproduzível), `testProject.default`, locks, `locator.within()`, `getByRef()`, WebP e FPS/estilo dos vídeos são **opt-in**: avaliar apenas em teste dirigido útil. **WebMCP permanece experimental e não habilitado**, por ausência de ferramentas WebMCP de página no produto. |

Referências oficiais das funcionalidades: [Knip 6.41.0](https://github.com/webpro-nl/knip/releases/tag/knip%406.41.0) e [Playwright 1.64.0](https://github.com/microsoft/playwright/releases/tag/v1.64.0).

## Inventário das dependências diretas na `main` (10/10/2026)

`node` do projeto: **24.x**. A lista abaixo é fotografia de `package.json` no fechamento das quatro atualizações, não relatório de todas as dependências transitivas; estas continuam fixadas em `package-lock.json`.

| Pacote | Versão | Escopo |
|---|---|---|
| `@axe-core/playwright` | `4.13.0` | desenvolvimento/CI |
| `@eslint/js` | `10.0.1` | desenvolvimento/CI |
| `@floating-ui/dom` | `1.8.0` | desenvolvimento/CI |
| `@playwright/test` | `1.64.0` | desenvolvimento/CI |
| `@supabase/supabase-js` | `2.117.3` | desenvolvimento/CI |
| `@types/node` | `24.19.2` | desenvolvimento/CI |
| `acorn` | `8.19.0` | desenvolvimento/CI |
| `acorn-walk` | `8.3.5` | desenvolvimento/CI |
| `ajv` | `8.20.0` | desenvolvimento/CI |
| `dependency-cruiser` | `18.5.0` | desenvolvimento/CI |
| `esbuild` | `0.28.2` | desenvolvimento/CI |
| `eslint` | `10.12.0` | desenvolvimento/CI |
| `eslint-plugin-no-unsanitized` | `4.1.5` | desenvolvimento/CI |
| `eslint-plugin-playwright` | `2.12.1` | desenvolvimento/CI |
| `exceljs` | `4.4.0` | runtime npm |
| `fast-check` | `4.10.2` | desenvolvimento/CI |
| `fuse.js` | `7.5.0` | desenvolvimento/CI |
| `knip` | `6.41.0` | desenvolvimento/CI |
| `lighthouse` | `13.5.0` | desenvolvimento/CI |
| `msw` | `2.15.0` | desenvolvimento/CI |
| `prettier` | `3.9.9` | desenvolvimento/CI |
| `stylelint` | `17.16.0` | desenvolvimento/CI |
| `stylelint-config-recommended` | `18.0.0` | desenvolvimento/CI |
| `supabase` | `2.114.0` | desenvolvimento/CI |
| `typescript` | `7.0.2` | desenvolvimento/CI |

## Decisões e pendências após a rodada

1. **Preservar Node 24** e `@types/node` 24.19.2. Avaliar **Node 26** em ambiente descartável e somente migrar após compatibilidade de Vercel, builds, ferramentas e testes. Não misturar isso com o PR Playwright.
2. **Manter Supabase CLI 2.114.0:** upgrades prévios tiveram incompatibilidades com pgTAP/RLS; reavaliar em migração isolada e banco descartável.
3. **Manter MSW 2.15.0:** versão 3 exige migração ESM e validação do uso de mocks/contratos; adiar.
4. **Manter ExcelJS 4.4.0** e os demais pacotes no inventário sem updates oportunistas nesta rodada; revisar exceções do `npm audit` sem remover a política para obter verde artificial.
5. **Separar a homologação real das jornadas (Etapa 5):** 35/36 checks verdes comprovam gates automatizados, não perfeição das 44 operações. Prioridade: NF → Pendência → tentativa → reanálise → persistência, múltiplos perfis/sessões e checagem independente de Production com Auth autorizado. Registrar `comprovado`, `parcial`, `falha reproduzida` e `não executado`.
6. **Edge Function:** o import versionado foi integrado no repositório; deployment efetivo dessa função no Supabase Production precisa de comprovação própria antes de afirmar atualização remota.
7. **Continuar com PRs isolados e CI antes de merge.** Não readotar PRs antigos de dependências apenas porque seu número é menor; não ajustar CSS/layout para consertar teste frágil sem reprodução visual.

Fontes de verdade: GitHub PRs #433–#436, `package.json`, `package-lock.json`, `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`, `docs/reference/TEST_GOVERNANCE.md` e IDs de execução anexados a cada PR. O presente documento registra decisões e estado em **10/10/2026**; não altera regras de produto.
