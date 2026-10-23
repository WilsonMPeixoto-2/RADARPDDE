# Auditoria A3 | Axe 4.14 e WCAG 2.2 em três superfícies desktop

**Candidato isolado:** `a77c758284e55baa98a2ab858a2fba5ef6d0b4d4`.
**Run real:** [39887802231](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39887802231).
**Estado:** workflow concluído com **success**; teste de diagnóstico 1/1 aprovado no Chromium Ubuntu 26.04/Node 24 com Axe engine 4.14.0.

## Números efetivamente registrados no log

| Estado desktop (fixture local) | Regras WCAG 2.1 → 2.2 | Violações antes/depois | Situações inconclusivas após WCAG 2.2 |
| --- | ---: | --- | --- |
| Dashboard | 65 → 66 | 0 → 0 | `aria-valid-attr-value`: 3; `color-contrast`: 212 |
| Prontuário | 65 → 66 | 0 → 0 | `aria-valid-attr-value`: 3; `color-contrast`: 53 |
| Pendências | 67 → 68 | **1 séria → 1 séria** | `aria-prohibited-attr`: 1; `aria-valid-attr-value`: 3; `color-contrast`: 29 |

O log do job `120199977191` contém `RADAR_AXE_WCAG22_DIAGNOSTIC` com
cada `ruleCount`, impacto, alvo e contagem. No Prontuário o número
inconclusivo de contraste foi 55 no scan anterior e 53 no posterior; dois
scans sucessivos em DOM dinâmico não provam, por si, correção visual.
Nenhuma violação **nova** foi introduzida apenas pela tag `wcag22aa`.

**Violação confirmada na tela de Pendências:**
`label-content-name-mismatch`, `impact=serious`, `count=1`,
`target=["summary"]`. O componente `src/integration/pendency-passive-queue-ux.js`
mostra `Mais filtros`, mas força `aria-label="Exibir filtros adicionais de pendências"`,
que omite o texto visível. A causa foi localizada diretamente no código
da `main`, sem alteração do banco. Correção mínima e regressão dedicada
no [PR #474](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/474), **integradas à main no merge
`78227c8744519d1357dc97d39207fe0b3b27b79c`**. O `aria-label`
redundante foi removido, preservando a semântica nativa do controle.
O job Playwright completo desktop do PR aprovou **227 testes**, incluindo a
regressão específica do nome acessível/Axe, expansão por Enter e foco.

**Não confundir estados:** o run A3 aprovou a *execução do diagnóstico*;
não significa que a interface examinada estava sem violações.
As contagens em `incomplete` representam análise automática inconclusiva,
não infração comprovada. Exigem amostragem e inspeção humana proporcional,
sobretudo contraste em tela visível, antes de sugerir mudanças globais de
paleta ou declarar conformidade WCAG.

**Limites:** fixture local, Chromium desktop 1440×900, perfil visual
Controlador, três telas em estados selecionados; nenhuma inspeção visual
humana autenticada do site publicado e nenhuma certificação formal WCAG 2.2.
A regra antiga da CI ainda não foi ampliada globalmente.
O ensaio não fez migrations, alterações de Auth, RLS ou escrita em Production.

## Encerramento do PR #474: resultado e ressalvas

**Código efetivamente publicado:** PR #474, merge `78227c8744519d1357dc97d39207fe0b3b27b79c`.
A Vercel publicou o deployment `dpl_8MBkLJU8FBdAmYic8QSCjnNLGuK1`, `READY`,
e o alias `radarpdde-fix.vercel.app` apontou para esse SHA.
Nenhuma migration, política RLS, regra financeira ou modificação de
dados ocorreu nesta alteração de acessibilidade.

**Pré-merge:** 12 workflows, sendo **10 com `success`** e 2 com falhas
independentes classificadas e preservadas no [histórico do PR](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/474):
- `Ciclos funcionais reais com Supabase`: duas falhas repetidas numa fixture
  serial pré-existente de despesas, com retorno do dado de teste persistido
  entre retries e asserção de 100% de visibilidade durante screenshot
  (visibilidade medida 94,886893%). A segunda tentativa do mesmo job
  reproduziu o diagnóstico. Não alterar produto para obter verde nesse teste.
- `Uso real operacional com volume semelhante a Production`: o **candidate
  passou**, a **baseline falhou** por `opacity:0` na aba de verificação
  durante o login, e o comparador recusou corretamente produzir delta.
  Resultado **inconclusivo**, não regressão comprovada.

**Provas relevantes aprovadas:** Playwright completo desktop 227 passed,
homologação integral pré-Production (todas as etapas), regressão visual,
Lighthouse, CodeQL, Supabase readiness, Gate remoto de perfis/viewports,
validação geral, retificação e confiabilidade funcional.

**Pós-merge (verificar HEAD):** [Actions de `78227c87`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions?query=78227c8744519d1357dc97d39207fe0b3b27b79c).
No momento deste checkpoint, 6/7 workflows de push já haviam aprovado
e a homologação pública Supabase ainda executava. Não transportar esse
número datado como encerramento dos checks faltantes.

**Próximas frentes independentes:** isolamento das fixtures seriais e
desenho de benchmark que só compara baselines completas; configuração
proporcional da CI condicionada à confirmação das proteções de branch.
O piloto Knip/TypeScript permanece opcional e fora do runtime da `main`.
