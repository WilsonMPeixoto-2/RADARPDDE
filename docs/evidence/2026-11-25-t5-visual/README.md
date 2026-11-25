# T5 / D022 — revisão visual e provas operacionais

Este índice reúne capturas do RADAR executado com **Auth, RLS e Supabase descartável reais e dados sintéticos**. Não são maquetes nem imagens institucionais. Os pixels originais foram preservados e as sete imagens foram abertas e examinadas pelo integrador.

**Origem deste conjunto:** candidata `7d8945577fd71dc2a0af3921484aecb72e8f9e08`, checkout de validação `a5c1b39953002f949b07741954fd9f5b63ba316c`, [readiness 45577125292](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292). O [manifesto](manifest-7d894557.json) registra artefatos, nomes originais, dimensões, SHA-256 e leitura humana. Os PNGs são consultados nos artefatos originais do GitHub Actions, nos links de cada seção.

**Alcance da prova:** D022 passou 2/2 e T5 passou 6/6. O grupo T2–T5 ficou em 26/27 devido à colisão de ID da descrição do Qualidade, corrigida no lote posterior. As imagens não comprovam esse reparo nem significam aprovação integral daquele run. Consultar o HEAD e a homologação posterior no [PR #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565). Inspeção técnica, aceite do proprietário e publicação são estados distintos.

## Inteligência operacional na escola

O Prontuário apresenta a próxima ação e a quantidade de sugestões em uma faixa de 34 px. O Qualidade vazio ocupa 42 px e conserva Atualizar, Registrar saída e Ver detalhes. A escola, a competência e o programa continuam identificáveis.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15005226606) · anexo `orientacao-prontuario-recolhida-desktop`.

A [geometria nativa](geometry/orientacao-composicao-7d894557.json) confirma rolagem zero em 1440 × 900: título fiscal termina em 857,09375 px; Sim, Não e N/A terminam em 886,296875 px, cada um com 68 × 38 px. A identidade da NF individual fica abaixo da seção e é alcançada pela navegação testada. A marca lateral ainda carregava nesta captura; a próxima execução aguarda explicitamente a imagem.

## Próximas ações com motivo e destino

Cada sugestão usa o contexto já carregado, explica por que aparece e abre o registro correspondente. O painel distingue os dias desde a abertura da Pendência e os dias de espera da etapa atual. As contagens indicam o recorte consultado; não são prazo institucional nem ranking pessoal.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15005226606) · anexo `orientacao-prontuario-expandida-desktop`.

Os filtros abrangem reanálise, análise fiscal, identificação de despesa, patrimônio, bonificação e acompanhamento. A lista informa quantos itens exibe e oferece expansão. A jornada autenticada verifica foco em cinco destinos e igualdade dos dados antes/depois, incluindo as saídas provisórias de Qualidade.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15005226606) · anexo `orientacao-prontuario-expandida-escuro`.

## Detalhes do Qualidade disponíveis

O estado compacto conserva as ações principais. Ver detalhes mostra a explicação completa; registros existentes e erros não são recolhidos automaticamente.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15005226606) · anexo `orientacao-quality-vazio-expandido-desktop`.

Esta captura mostra a apresentação. A prova de salvar, editar, identificar e reencontrar a descrição deve ser lida nos resultados posteriores ao reparo do ID. Os E2Es que detectaram o problema foram mantidos, e duas contraprovas locais com a marcação real reproduziram a falha anterior.

## Correção individual e alcance explícito

A janela identifica o envio e a reanálise escolhida, a escola, o mês e o programa. A prévia separa exclusão e preservação; a confirmação exige a intenção do operador.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15004399181) · anexo `t5-excluir-reanalise-real`.

Quando o histórico não permite comprovar o alcance, a interface oferece alternativas para uma nova prévia. A confirmação não é habilitada enquanto o alcance permanece indefinido. A captura seguinte mostra o corpo após rolagem, sem cortar horizontalmente as alternativas.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15004399181) · anexo `t5-ambiguidade-efeitos-celular-real`.

## Efeitos patrimoniais no celular

A prévia mostra situação, data e responsável antes/depois. Também informa que corrigir o RADAR não desfaz atos nos sistemas patrimoniais externos. Esta imagem mostra o trecho de efeitos após rolagem; os dados do bem ficam no início do mesmo diálogo.

[Abrir o artefato da captura](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292/artifacts/15004399181) · anexo `t5-correcao-inventariada-efeitos-celular-real`.

## Documentos e desempenho: evidências próprias

O piloto documental examinou três PDFs reais autorizados. Origem, páginas, identificadores e resultados foram entregues privadamente; nenhum documento institucional foi usado nas imagens acima. O [método reproduzível](../../../ops/document-intelligence-poc/local-pdf-pilot/README.md) e a [síntese D022](../2026-11-25-t5-inteligencia-documentos-desempenho.md) distinguem exercício do conteúdo, linhas vazias, pares de itens e assinatura estrutural. O piloto não executa importação nem decisão administrativa.

A otimização de CPU usa comparação controlada com saídas completas equivalentes: projeção das 163 escolas, 4,909 → 1,333 ms; Pendências, 21,392 → 7,945 ms. O [JSON de medição](../2026-11-25-t5-performance/operational-projection-cpu.json) conserva amostras e limites. O ensaio autenticado completo tem resultados mistos e não demonstra aceleração global. Uma imagem de interface não mede latência.

## Capturas excluídas e continuidade

O manifesto conserva os hashes de três imagens não selecionadas: Dashboard durante acomodação visual e sem item acionável no enquadramento; orientação móvel com menu sobreposto após resize; envio com entrada nativa de data em formato distinto do texto em português. Não foram retocadas nem substituídas por imagens geradas.

O teste seguinte aguarda folhas de estilo, fontes, marca e transições; rola um item real da fila para a captura e fecha o menu pelo controle existente quando necessário. Dashboard e orientação móvel precisam da nova inspeção. O campo nativo de data não foi redesenhado para produzir uma imagem: valores ISO e persistência continuam cobertos pela jornada T5.

Os JSONs de `geometry/` também documentam a preservação de posição durante as operações. No [cenário de erro de retificação](geometry/retificacao-erro-7d894557.json), o deslocamento operacional foi zero, mantendo o limite de 4 px; a acomodação inicial foi medida separadamente. [Contexto, falhas e contraprovas](../2026-11-25-t5-historico-granular.md).
