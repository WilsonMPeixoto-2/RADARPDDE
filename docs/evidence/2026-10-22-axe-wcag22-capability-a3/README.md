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
no [PR #474](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/474), ainda condicionadas à
homologação desse PR: remover o `aria-label` redundante, comparar nome
acessível e texto, executar a regra Axe específica e confirmar expansão
por Enter e foco preservado.

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
