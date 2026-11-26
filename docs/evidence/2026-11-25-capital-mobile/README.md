# Registro de Capital acessível no celular — PR #573

Evidência de validação focal em 25/11/2026; não é contrato funcional paralelo nem homologação integral T6. Produto inspecionado: `c1efcea48cc6d015d50da4f317d5888cb0398a16`, base `c5d890fb`. [PR #573](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/573).

## Problema e resultado

A [prova anterior do #569](../2026-11-25-inventario-orientacao/orientacao-inventario-destino-celular-geometria.json) registrou linha de 841,17 px numa área de 320 px. A ação de inventariação ficava fora da largura visível. A candidata organiza somente o Registro de Capital do Prontuário em cartões até 900 px, conservando os controles, capacidades e handlers existentes.

| Medida | Celular 390 × 844 | Desktop 1440 × 900 |
|---|---:|---:|
| Largura da página | 390 px | 1440 px |
| Largura visível da tabela | 320 px | 1089 px |
| Conteúdo horizontal da tabela | 320 px | 1089 px |
| Deslocamento lateral | 0 px | 0 px |
| Altura de Inventariar | 44 px | 34 px |
| Foco no bem de destino | Sim | Sim |

## Jornada e inspeção visual

No [readiness 45721884398](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45721884398), as três jornadas de orientação passaram sem retry. A jornada patrimonial durou 7,277 s: autenticação real do perfil Inventário, filtro Aguardando, reload, sugestão da escola, abertura e foco do bem exato, composição móvel e desktop, tema claro, abertura da janela pelo botão Inventariar e cancelamento. ID, nome do bem e escola foram conferidos; os snapshots dos bens antes/depois são iguais. Não houve confirmação da inventariação.

As seis capturas abaixo foram abertas e inspecionadas pelo agente sucessor. Pela tela, a pessoa reconhece Registro de Capital, nome do bem, mês, valor, NF, situação Encaminhada e ação Inventariar no mesmo cartão. Os temas claro e escuro mantêm rótulos e ação legíveis. A janela informa o bem e a escola, permite conferir responsável/observações e distingue Cancelar de Confirmar Inventariação. Não há corte ou sobreposição material nesses estados. No desktop, os mesmos dados permanecem em linha tabular. A ausência do processo de inventário é exibida como informação da fixture, sem inventar um processo para o teste.

- [Dashboard desktop](orientacao-inventario-dashboard-desktop.png)
- [Dashboard celular](orientacao-inventario-dashboard-celular.png)
- [Destino celular, escuro](orientacao-inventario-destino-celular.png)
- [Destino desktop, escuro](orientacao-inventario-destino-desktop.png)
- [Ação no celular, claro](orientacao-inventario-acao-celular-claro.png)
- [Janela de inventariação no celular](orientacao-inventario-confirmacao-celular.png)

Os 17 workflows de PR do código `c1efcea4` passaram, inclusive readiness, pré-production, perfis/viewports, visual desktop, estabilidade do Prontuário, segurança, ciclos funcionais e uso operacional com volume. Não há revisão de código concluída pelo Copilot: a ferramenta informou cota insuficiente. A revisão do executor confirmou a preservação dos handlers, do controle de acesso, da identidade patrimonial e da semântica tabular explícita; os rótulos móveis são somente apresentação. Não houve mudança de domínio, RPC, schema, Auth, RLS ou flags.

## Proveniência e limites

[Manifesto com hashes](manifest.json), [geometria móvel](orientacao-inventario-destino-celular-geometria.json) e [geometria desktop](orientacao-inventario-destino-desktop-geometria.json) preservam as evidências, cujos anexos originais expiram em um dia. Foram extraídos somente imagens e dados de geometria/resultados; o relatório bruto com etapas de autenticação não foi versionado.

Esta prova usa Supabase descartável, dados sintéticos e Chromium. Não certifica dispositivo físico, WebKit, leitores de tela, todas as larguras intermediárias ou todos os perfis/estados patrimoniais. O cenário focal não ativa os controles de correção granular T5; a suíte T5 possui provas próprias. A inspeção do agente não é aceite atribuído ao proprietário nem comprovação de publicação. Os estados remotos e o próximo ato ficam no [checkpoint único](../../continuity/prontuario-t0-t6/CHECKPOINT.md).
