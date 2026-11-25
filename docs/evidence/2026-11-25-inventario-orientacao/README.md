# Inventário — orientação gerencial e abertura do bem

**Evidência técnica de 25/11/2026, vinculada ao SHA abaixo.** Preserva a jornada autenticada do perfil Inventário: login → sugestão no recorte patrimonial → abertura do bem correto, após reload, em desktop e celular. As capturas usam dados sintéticos e Supabase local descartável; foram abertas e inspecionadas pelo agente revisor e pelo integrador. Não foi observado bloqueio material nessa jornada.

## Proveniência e resultado

- [PR #569](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/569), candidata `d31b3f9ca1f4e2a94f4b3fe2e67ce7e38be76f33`.
- Base `ac57c4a084453faeb55225a7aa94b5e36e1250ec`; merge executado pelo CI `9dca22dbd4f57909e7c84548fa317d42a73bfd83`.
- [Supabase readiness — run 45688491640](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45688491640), [job supabase-local 139467333027](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45688491640/job/139467333027): sucesso.
- Etapa de orientação: **3/3 testes aprovados em 24,1 s; 0 falhas, 0 flaky, 0 skipped; `retry=0` nos três resultados**. O teste Inventário passou em **5,701 s**, iniciado às 16h53min51s de Brasília.
- [Spec no SHA candidato](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/d31b3f9ca1f4e2a94f4b3fe2e67ce7e38be76f33/tests/e2e/supabase-operational-guidance-local.spec.js): `Inventário recebe orientação no recorte patrimonial e abre o bem exato após reload no celular e desktop`.

A jornada confirma o recorte de Inventário, a ausência da sugestão de `GUIDANCE-ASSET` em **Já Inventariados** e seu retorno em **Aguardando Inventariação**, a persistência após reload e o foco no bem exato. A comparação dos bens antes/depois confirma que a navegação testada não os alterou.

## Capturas e geometrias preservadas

| Arquivo | Dimensões / observação |
| --- | --- |
| [Dashboard desktop](orientacao-inventario-dashboard-desktop.png) | 1440 × 900; escola, bem, explicação e botão “Ver registro patrimonial” legíveis. |
| [Dashboard celular](orientacao-inventario-dashboard-celular.png) | 390 × 844; card e botão cabem na largura disponível, sem sobreposição, no tema escuro. |
| [Destino celular](orientacao-inventario-destino-celular.png) | 390 × 844; escola correta, aba “Registro de Capital” ativa e identidade “Mesa sintética para conferência” visível. |
| [Destino desktop](orientacao-inventario-destino-desktop.png) | 1440 × 900; linha completa, status “Encaminhada” e ação “Inventariar” visíveis. |
| [Geometria celular](orientacao-inventario-destino-celular-geometria.json) | `focused=true`; documento 390 px; viewport da tabela 320 px, com a identidade do bem visível. |
| [Geometria desktop](orientacao-inventario-destino-desktop-geometria.json) | `focused=true`; documento 1440 px; linha inteira contida na tabela. |

Os PNGs são cópias idênticas dos anexos nativos. Os JSONs foram extraídos dos anexos inline do relatório; os seis arquivos foram preservados sem alteração após essa extração. A correspondência abaixo permite verificar conteúdo e origem mesmo após expirar a retenção do CI.

| Arquivo / anexo | Origem no relatório Playwright | SHA-256 |
| --- | --- | --- |
| `orientacao-inventario-dashboard-desktop.png` | `data/4979d303e3a41a8dc796a11eb2ae41fab5534fa7.png` | `ced636b81b2d5cec10c10b2afb818470bd75f33a84b0c2c5582de677c5ff5953` |
| `orientacao-inventario-dashboard-celular.png` | `data/100fbfcec47caf8cbe996fe1594e33e0a8246b71.png` | `b16744df7d0e3f50eaf4d83f7b1c52bed749b1b85832451d5b7c5bc226f9e43d` |
| `orientacao-inventario-destino-celular.png` | `data/916b87eb717bd9e5b646c0f1313519a58a8928e8.png` | `725f169c1d623764048adb931e15cd01febae8b76320240124be6fef5f23b1cd` |
| `orientacao-inventario-destino-desktop.png` | `data/59416162715b38faf86e9a02148ed8670c70784d.png` | `4b3c9c6d4e5032daf218ad158842a4477cfb0aa93ed4f0730ba3d091ca4d7ee7` |
| `orientacao-inventario-destino-celular-geometria.json` | Anexo inline `orientacao-inventario-destino-celular-geometria` | `dc696605ae324369c3563bcd1a529396a6c9aa9dfcd2bd6be16f2be1e719c0b3` |
| `orientacao-inventario-destino-desktop-geometria.json` | Anexo inline `orientacao-inventario-destino-desktop-geometria` | `ab36fd60fea8bcb253265ab8288954b43256c7ac9aae1ebfa305700f8a5ed7f2` |

Origem principal: [playwright-report-operational-guidance, artefato 15056274153](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45688491640/artifacts/15056274153). Seu ZIP foi conferido contra o digest GitHub `c999ed30db8332c55ad157d1b3edef932c67e10c436f6fdc1c81bf404cfffccd`. O conjunto [operational-visual-evidence, artefato 15057144276](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45688491640/artifacts/15057144276) também foi baixado e conferido: `7d9793479f62355d757b8a98c5d241fe782c04edaa514cfcc6f503a907c8a11c`. Apenas os seis anexos focais estão preservados nesta pasta.

## Alcance e limites

- A inspeção é técnica, com Chromium em 1440 × 900 e viewport móvel de 390 × 844. Não representa homologação em produção, WebKit, dispositivo físico ou aceite do proprietário.
- As capturas do dashboard foram feitas após rolar até o card; não comprovam a composição do primeiro enquadramento da página.
- No celular, a tabela conserva sua rolagem horizontal existente. A página não apresenta overflow horizontal e o bem permanece identificável, mas a jornada não executa a ação “Inventariar”, situada na coluna à direita.
- A aprovação e as contagens acima se limitam à etapa de orientação e à jornada descrita. Não encerram outras frentes, fases ou testes do projeto.
