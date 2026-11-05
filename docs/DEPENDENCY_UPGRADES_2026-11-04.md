# RADAR PDDE — situação de atualizações de dependências

**Corte de verificação:** 04/11/2026 (Brasília), após o merge do PR #499.  
**Repositório canônico:** `WilsonMPeixoto-2/RADARPDDE`.  
**Fonte de verdade das versões instaladas:** `package.json` + `package-lock.json` da `main`; o presente relatório não substitui o manifesto.

## 1. Estado publicado confirmado

- **main:** `0f632f243ff171917eb36c23a3883cfd8f8bb362`, merge do [PR #499](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/499).
- **Vercel Production:** deployment `dpl_FzvbrBfXHYtvjXt61dNiqhBnZRth`, estado `READY`, ligado ao SHA acima na conferência.
- **Versões do manifesto nessa baseline:** Supabase JS `2.118.0`; Supabase CLI `2.122.0`; Lighthouse `13.5.0`; Stylelint `18.0.0`; `stylelint-config-recommended` `19.0.0`; Node `24.x`; `@types/node` `24.19.2`.
- Não houve alteração de Auth, RLS, schema, migrations ou dados de Production nesta rodada de análise.

**Regra:** não promover uma versão nova a “atual em Production” apenas porque foi publicada no npm, instalada localmente, consta de uma branch ou passou em parte do CI.

## 2. Atualização integrada e candidatas bloqueadas

| Candidata | Local | Evidência obtida | Estado da decisão |
| --- | --- | --- | --- |
| Supabase CLI `2.122.0` | [PR #499](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/499) | Corrigidos os testes fixados e a matriz; 37 checks aprovados, nenhum reprovado, 2 skips de Preview. Backup/restauração passou no rerun do job após conflito transitório de porta TCP `55322`. Merge `0f632f24…` e Vercel Production READY com SHA idêntico. | **INTEGRADA E PUBLICADA**; não confundir com CLI 3.0.0 nem com o patch 2.122.1 ainda não homologado. |
| Lighthouse `13.6.0` | [PR #502](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/502) | Lighthouse CI passou, mas testes com versão fixada precisam reconciliar e os gates de segurança detectaram novos advisories moderados `GHSA-3G3M-2FJR-6PW4` e `GHSA-G3HV-75WG-M249` na nova árvore, atingindo pacotes Lighthouse/Sentry/glob. | **Não integrar**; não criar allowlist artificial para obter verde. |
| Supabase JS `2.119.0` | Experimento isolado de ambiente, **não versionado no GitHub** | Node 24/npm 11, bundle do navegador regenerado, import da Edge Function alinhado; `1386/1386` testes unitários, `8/8` integração, `check:generated`, vendors e `typecheck:database` aprovados. A transferência dos dois artefatos gerados para o repositório não foi concluída; a sessão isolada expirou sem snapshot. | **Não publicar**. Reproduzir em branch nova, versionar lockfile e bundle íntegros, executar todos os gates remotos, incluindo Supabase real. |
| Supabase CLI `3.0.0` | Não iniciada | Major exige revisão separada dos contratos da CLI, sobretudo comandos remotos, flags e workflows históricos. | **Fora deste lote.** |

**Regras da continuidade:** um PR por atualização de alto risco; guardar o SHA do candidato e os resultados de cada gate; não considerar Preview `skipped` como homologado; não declarar deploy até verificar o SHA do deployment Production; não ampliar a tarefa para troca de fontes, ícones ou design sem entregar e homologar o SDK.

## 3. Sequência segura de retomada

1. Revalidar HEAD de `main`, pacote instalado, estado dos PRs e deployment de Production, pois estes registros são uma fotografia.
2. Preservar a evidência do #499: o primeiro backup-restauração encontrou a porta `55322` ocupada; um rerun isolado do job passou sem alterações de código. Se voltar a ocorrer, investigar antes de criar retries indiscriminados.
3. Para Supabase JS `2.119.0`, alterar conjuntamente `package.json`, `package-lock.json`, `supabase/functions/team-account-management/index.ts`, `vendor/supabase-client.js`, testes de contrato e linha do tracker. **Nunca** substituir indiscriminadamente a lista histórica de versões rejeitadas da CLI em `tests/unit/tooling-contract.test.js`.
4. Exigir `npm ci`, `check:generated`, unitários, integração, autenticação, RLS, RPC, Realtime, pgTAP, E2E, resiliência de escrita, backup/restauração e auditoria de segurança, com resultados sobre o mesmo SHA.
5. Apenas depois do merge aprovado, verificar `main`, Production `READY`, SHA do manifesto, bloqueio anônimo e jornada autenticada sem manipular dados reais.
6. Atualizar esta fotografia e `docs/CURRENT_STAGE.md` **após** cada merge efetivo, distinguindo versão instalada, candidata e rejeitada.

**Escopo documental:** este arquivo é um checkpoint técnico, não autorização de merge ou prova de publicação das candidatas.
