# RADAR PDDE | Piloto A1 verificado: TS7 e Knip 6.42

**Data de execução:** 22/10/2026 BRT (os runs GitHub mostram 23/10 UTC).
**Branch:** `docs/audit-capacidades-pacotes-out2026`. **Production/main:** intactos.
**Método:** GitHub Actions em runner ubuntu-26.04/Node 24, `npm ci` reproduzindo o lockfile.

## 1. Ensaios reais e resultados

| Etapa | Execução | Resultado | Significado |
|---|---|---|---|
| A1 inicial | [Run 39884979715](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39884979715) | Knip **aprovado**; TypeScript **falhou na configuração do próprio piloto** | TS5108: `moduleResolution=node10` (alias `Node`) removido no TypeScript 7; **não** é erro do RADAR |
| A1 corrigido | [Run 39885151845](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39885151845), commit `4aa4c4b` | **2 jobs aprovados** | TypeScript 7.0.2 aceitou `module: Node20` e `moduleResolution: Node16`; Knip 6.42.1 gerou inventário |
| Contraprova TS7 | Mesmo run final, job **TS7 - baseline e contraprova negativa** | **PASS** | Após baseline sem erros, uma atribuição deliberada `@type {string} = 123` provocou TS2322; alteração existiu somente no runner descartável |
| Knip ampliado | [Run 39884979715](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39884979715), artifact `knip-a1-diagnostics` | **34 arquivos**, **0 exports**, **0 tipos** sinalizados | Diagnóstico estático; **não** autoriza excluir arquivos |

O piloto TS foi configurado com `allowJs`, `checkJs`, `noEmit` e `strict`, porém `noImplicitAny: false` apenas em `tsconfig.js-contract-pilot.json`. **Aprovação não prova cobertura rigorosa de todos os contratos de domínio**. Próximo ensaio de tipagem só poderá ser promovido a gate depois de anotar/validar APIs reais em JSDoc e executar uma mutação negativa da assinatura de um consumidor efetivo. Não alterar as assinaturas no produto só para satisfazer a ferramenta.

## 2. Contraprova dos 34 candidatos Knip

Foi examinada a lista real produzida no artifact JSON e, contra o código da `main@7141489e`, verificada a referência textual de **34/34 caminhos** nos carregadores dinâmicos canônicos. Esta evidência demonstra que não são arquivos seguramente mortos; não demonstra necessariamente que todos carregam em toda sessão, pois alguns são condicionais.

| Carregador que contém caminhos explícitos | Quantidade | Arquivos classificados |
|---|---:|---|
| `config.js` | 14 | `cycle-b-carteira`, `cycle-b-dashboard-result`, `cycle-b-dashboard`, `exercise-early-init`, `exercise-management`, `mobile-navigation`, `modal-accessibility`, `painel-controlador-expressiva`, `task-10-11-pendency-actions`, `task-10-alerts-competence`, `task-12-13-retificacoes`, `task-9-cross-view`, `task-9-focus-bridge`, `task-9-pendencias-page` |
| `src/integration/product-extensions-bootstrap.js` | 9 | `atomic-analysis-pendency`, `controller-guide-ready`, `controller-guide`, `evaluation-retification-ui`, `navigation-context-bootstrap`, `operational-readiness-bridge`, `pendency-passive-queue-ux`, `school-timeline`, `unidentified-expense-ux` |
| `src/integration/exercise-management.js` | 2 | `src/domain/competence-context.js`, `global-competence-selector.js` |
| `src/integration/mobile-navigation.js` | 8 | `src/assets/logo-original/part-1.js` a `part-4.js` e `bundle-5-8.js`, `bundle-9-12.js`, `bundle-13-16.js`, `bundle-17-20.js` |
| `src/integration/navigation-routes.js` | 1 | `product-extensions-bootstrap.js` (também referenciado em `auth-gate.js`) |
| **Total** | **34** | **34 caminhos referenciados, 0 candidatos liberados para exclusão** |

**Conclusão causal:** o Knip foi solicitado a analisar `files,exports,types`, mas as entradas declaradas não modelam todos os carregamentos `loadScript`, `loadScriptOnce`, `document.createElement('script')` nem assets da navegação. A nova análise é útil como **inventário a reconciliar com o grafo do navegador**, não como uma prova automática de código obsoleto. Não resolver a lista acrescentando globalmente `src/**/*` às entradas, pois isso ocultaria candidatos futuros legítimos.

## 3. Recomendações derivadas, por ordem de risco

1. **Manter em modo opt-in**, sem check bloqueante: `node scripts/audit/inspect-knip-deep.mjs`. Classificar futuros caminhos não referenciados no grafo dinâmico antes de propor remoção.
2. **Aprimorar gradualmente JSDoc + TypeScript 7**, começando por uma fronteira de idempotência/contratos operacionais, sem emissão JS ou conversão ampla. Preservar `typecheck:database` como gate independente.
3. Manter o workflow `.github/workflows/tooling-capability-pilots.yml` restrito à branch experimental enquanto a etapa é avaliada. Se houver integração futura, revisar filtros/required checks e não criar execução integral para documentação.
4. Não modificar dados, permissões, Auth, Supabase, índices, CSS, UX ou Production nesta frente.

## 4. Evidência e limitações

- Fontes de código: `config.js`, `src/integration/product-extensions-bootstrap.js`, `src/integration/exercise-management.js`, `src/integration/mobile-navigation.js`, `src/integration/navigation-routes.js`, `src/integration/auth-gate.js`.
- Artifact Knip real: [run 39884979715](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39884979715) → `knip-a1-diagnostics`; contém `knip-deep-diagnostic.json` com os 34 nomes completos.
- [Documentação do JSON do Knip](https://knip.dev/features/reporters), [CLI Knip](https://knip.dev/reference/cli) e [configurações modernas TypeScript](https://www.typescriptlang.org/tsconfig/moduleResolution).
- Os artifacts do Actions podem expirar, mas **os resultados, os links por run e as relações de carregamento ficam preservados neste documento versionado**.

**Decisão administrativa já confirmada:** o aviso de senhas vazadas do Supabase é conhecido, **não acionável no plano atual e fora do escopo**; não reabrir a discussão nesta modernização.
