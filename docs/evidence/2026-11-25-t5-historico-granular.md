# T5 — correção granular de histórico e patrimônio

**Classe:** evidência de candidata; não é autorização de publicação.
**Data:** 25/11/2026.
**Base publicada:** `7523782bdc572a631783deeae2ea59be048dd725`, PR #564.
**Branch:** `feat/t5-historico-granular-20261125`.
**Candidata:** [PR #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565).

## Objetivo e escopo

A instrução “Siga para próxima etapa”, recebida após a publicação autorizada do #564, executa a T5 do plano aprovado. O operador pode corrigir ou excluir o fato selecionado sem fabricar novo envio, nova reanálise, justificativa ou baixa patrimonial. A implementação reutiliza a prévia, a confirmação, o digest, as versões e o recibo já existentes. O servidor continua sendo a autoridade dos efeitos; o helper JavaScript é uma projeção pura e não persiste dados.

| Operação | Alvo e efeito |
|---|---|
| `correct_attempt` / `delete_attempt` | ID persistido do envio. Texto/link preserva resultado; disponibilização de envio analisado recalcula atraso dependente. Exclusão remove o envio e sua revisão causal. |
| `correct_review` / `delete_review` | ID da linha de envio que contém a revisão. Correção parcial e observação vazia permitidas. Exclusão retira a revisão e sua autoria operacional, preservando o envio e sua autoria. |
| `correct_contact` / `delete_contact` | Contato geral ou vinculado por ID. Corrigir, limpar detalhes ou desvincular conscientemente não resolve Pendência nem apaga mensagens externas. |
| `correct_inventory` / `delete_asset` | Corrigir status/processo/data/membro/observação, inclusive Inventariada. Excluir somente bem independente; para bem de NF oferecer correção ou exclusão fiscal causal conforme capacidade. |
| `retifyManualDetails` | Mantém o serviço existente, identidade e origem manual; item/motivo/responsável mínimos e observação opcional, inclusive vazia. |

## Transições e preservações

- A tentativa substituída antes da análise nunca é reativada por posição do array ou renumeração.
- Remover a revisão atual conserva o envio aguardando. Uma revisão anterior válida só mantém análise/erros quando a origem é demonstrada; sem ela, o resultado dependente fica Não analisado.
- Remover o último envio ativo sem revisão restante devolve a Pendência à escola, com resolução e metadados dependentes removidos. Um evento de abertura inequívoco pode conservar seus próprios apontamentos.
- Cancelamento, reabertura e revisão posterior independentes são preservados. História ambígua apresenta opções explícitas para excluir a Pendência ou o histórico do item; cada opção abre outra prévia antes de gravar.
- Corrigir data de envio ainda aguardando não restaura análise antiga. Corrigir data de revisão que atravessa evento de estado independente exige resolver a ambiguidade.
- Bonificação e entregas fiscais são preservadas. A correção patrimonial recompõe somente os critérios derivados de encaminhamento ao Inventário, sem alterar resultado consolidado ou análise fiscal da NF.
- Histórico embutido, tabelas normalizadas, estado, erros, próximo ator e agregados são reconciliados na transação. O log administrativo preserva antes/depois e autoria Auth, distinguindo auditoria de entidade operacional.

## Autorizações e concorrência

Os perfis operacionais conservam colaboração conforme ADR-056, sem restrição artificial por autoria do lançamento. Inventário recebe somente os comandos patrimoniais na CRE autorizada; Gestão SME e anônimo não recebem mutação. NF vinculada não é apagada implicitamente por `delete_asset` e não fica órfã.

A migration `20261125064516_t5_granular_history_inventory.sql` é a 69ª no pacote candidato. Não altera registros ao instalar. As novas ações passam pela cadeia de autorização existente; as ações T0–T4 continuam delegadas às implementações publicadas. Locks de contexto/entidade, versões de registros e versões do prazo/membro impedem confirmação com prévia obsoleta. A execução atualiza tentativas antes do espelho da Pendência para não provocar uma segunda alteração de versão pelo trigger existente.

O script de concorrência já existente recebe duas contraprovas T5: envio simultâneo e inclusão de NF/vínculo patrimonial que poderia modificar o agregado. Não foi criado outro workflow, sistema de eventos ou infraestrutura de banco.

## Provas e situação

O comando completo `npm run test:readiness` foi aprovado localmente: **1.550 testes unitários e 8 de integração**, sem falhas ou skips, além de continuidade, sintaxe, matriz funcional, arquitetura, referências dos workflows, lint, configuração, artefatos e tipos. Testes focalizados do helper, cliente, flags e UI também foram executados. O parser PostgreSQL/PLpgSQL validou a estrutura da migration e do pgTAP, sem equivaler à execução de banco. A suíte autenticada contém seis jornadas no RADAR real com Auth/RLS descartável, dados sintéticos, controles de interface, gravação, releitura e outra sessão. Capturas pertencem a essas execuções, sem dados institucionais.

O CI do SHA candidato deve registrar separadamente: readiness completo, migrations/pgTAP, concorrência, jornadas autenticadas, regressão visual e inspeção dos artefatos. Resultados, SHA e URLs de runs serão reconciliados no PR e no checkpoint após a execução. Esta fotografia não declara esses gates aprovados antes de observá-los.

## Incremento operacional solicitado em D022

**Retorno do navegador em `411efd87`:** o run [45566937315](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45566937315) passou SQL/pgTAP/concorrência e as suítes Auth anteriores, mas o grupo T2–T5 teve 20 jornadas aprovadas e 7 falhas. Cinco casos T5 usavam seletor que contava simultaneamente a representação desktop e móvel da Pendência; o caso patrimonial preenchia os campos sem acionar “Revisar prévia”. Os testes passam a escolher o ID exato no painel visível e a seguir a revisão explícita da interface. O cenário T4 excedeu 90 segundos em fases diferentes; a candidata preserva a segunda sessão da Assistente para ambas as exportações, elimina um terceiro login redundante e registra durações por fase, sem aumentar o limite ou retirar asserções. Essas correções exigem novo resultado remoto, não tornam a execução anterior aprovada.

O artefato conjunto desse run tinha 561.235.955 bytes, acima do limite de download do conector (536.870.912 bytes). O mesmo workflow separa agora relatórios por grupo e publica capturas/contextos pequenos, mantendo os relatórios completos e traces. Não foi possível inspecionar as imagens desse arquivo excedente; a inspeção deve ocorrer nos artefatos acessíveis da próxima execução.

A instrução adicional do proprietário foi registrada em [D022](../continuity/prontuario-t0-t6/D022_INTELIGENCIA_DOCUMENTOS_DESEMPENHO.md), com obrigações próprias. A candidata acrescenta orientação gerencial às superfícies existentes, sugestões de próxima ação com contexto e navegação, piloto local de leitura documental real e otimizações comprovadas. A prova específica fica em [inteligência, documentos e desempenho](2026-11-25-t5-inteligencia-documentos-desempenho.md).

O CI descartável do commit `411efd871bba13822b43d6b5e9f1a997a6d99511` aprovou **1.007 asserções pgTAP em 47 arquivos**, incluindo as **101 da T5**, na [verificação CLI v3](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45566937304). O pós-aplicação enumerou corretamente as 69 migrations. Isso comprova aquele contrato SQL; as jornadas autenticadas, concorrência e alterações posteriores exigem os resultados do HEAD correspondente.

### Retorno autenticado e visual de `c601c8ee`

Os reparos abaixo passaram novamente pelo comando integral `npm run test:readiness`: **1.594 unitários e 8 integrações**, sem falhas ou skips. Esse resultado local não substitui a nova execução de navegador.

O [readiness 45569519323](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45569519323) comprovou 21 jornadas T2–T5 e registrou seis falhas. Cinco eram erros de página causados pela nova orientação ao consultar a competência antes da inicialização ou depois do logout. A guarda passa a consultar `isInitialized()` antes de obter esse estado; a contraprova local usa o contexto real recém-criado e após reset. O caso T4 longo passou sem aumento de timeout.

Cinco das seis jornadas T5 passaram. A falha restante ocorreu na segunda abertura da exclusão ambígua: abrir a janela de correção fecha a gaveta de origem, e Cancelar não a reconstrói. A jornada volta a abrir os detalhes pelo controle real antes de selecionar a reanálise novamente, mantendo a prova de que Cancelar não gravou dados. O grupo D022 não executou naquele run; o workflow preserva agora sua execução independente após falha em T2–T5, sem transformar a falha anterior em sucesso nem ignorar problemas prévios de infraestrutura/Auth.

Os novos artefatos separados puderam ser baixados e examinados. As janelas de envio, exclusão de reanálise e patrimônio identificam o registro, o contexto e o efeito da confirmação. A inspeção encontrou dois defeitos visuais reais: a faixa nova da escola ocupava cerca de 119 px e empurrava Notas Fiscais para fora da primeira tela em 1440 × 900; a alternativa de exclusão ambígua fazia o aviso exceder a largura em 390 px. O lote seguinte compacta a faixa recolhida e permite a quebra das alternativas, preservando os textos e ações. A captura móvel do patrimônio mostrava apenas o início do formulário; a jornada passa a capturar também o final rolável. As imagens corrigidas e a aprovação dos testes exigem a execução do novo SHA. Nenhum golden foi atualizado para aceitar os defeitos encontrados.

O E2E geral de `c601c8ee` também revelou uma regressão de identidade na fila nova: o ID numérico `123` e o textual `"123"` eram normalizados para a mesma chave. A candidata reutiliza o codec canônico de referências de Pendência, preserva o ID bruto e compara estritamente na navegação. O teste existente de referências hostis foi conectado ao consumidor atual e conserva três alvos distintos, clique real, foco e ausência de injeção; as contraprovas locais incluem também o número zero. Não se trata de retirar um teste de segurança para aceitar o layout novo.

O [ciclo funcional 45569519491](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45569519491) mediu ainda 11,65625 px de deslocamento após salvar uma análise de Correto para Não analisado, acima do limite de 4 px. Não foi demonstrado que a faixa gerencial causou essa diferença. A tolerância permanece, e a próxima execução preserva medidas/capturas pequenas para verificar a composição corrigida e investigar caso a diferença se repita. O arquivo completo anterior de 1,68 GB excedeu o limite de download; a sua imagem não foi inspecionada.

### Contraprovas no código corrigido `b9bd42b4`

O [readiness 45573070961](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45573070961) aprovou 17 jornadas Auth/RLS, quatro de login tardio/histórico protegido e **27/27 T2–T5 sem retry**, incluindo as seis novas T5. A navegação D022 passou com foco nos cinco alvos corretos, distinção dos relógios, preservação do resultado consolidado e ausência de escrita. A primeira jornada D022 encontrou uma pendência de composição descrita abaixo.

Os [21 ciclos funcionais 45573070963](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45573070963) passaram. A contraprova de posição mediu **0 px nos três pontos**, mantendo o limite de 4 px: [editar análise](2026-11-25-t5-visual/geometry/ancora-editar-analise.json), [salvar Pendência](2026-11-25-t5-visual/geometry/ancora-salvar-pendencia.json) e [retificar/anular](2026-11-25-t5-visual/geometry/ancora-retificar-e-anular.json), em 1280 × 720. Os dados foram preservados do artefato `functional-lifecycle-visual-45573070963` / `15003641640`.

Na captura desktop do [run 45573070662](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45573070662), a faixa da escola caiu de cerca de 119 para 34 px; o título fiscal e os controles Sim/Não/N/A cabem inteiros em 1440 × 900. O integrador abriu e revisou o Dashboard e o Prontuário antes de copiar os dois PNGs nativos para os goldens, sem alterar pixels. Essa revisão técnica não substitui o aceite do proprietário. As capturas autenticadas da T5 também confirmaram alternativas de ambiguidade e efeitos patrimoniais legíveis no celular, inclusive depois de rolar o corpo.

**Composição autenticada adicional:** a fixture D022 exibe também a faixa remota do PDDE Qualidade vazio, ausente no baseline local, e uma linha documental com duas ações. A primeira jornada mediu a identidade de uma NF individual a 1.156,15625 px, embora o critério histórico seja a seção fiscal. A imagem revelou que o título da seção também ficava abaixo da tela; portanto, trocar somente o alvo do teste não resolveria a experiência. O lote seguinte compacta a apresentação vazia/carregando do Qualidade, mantém todos os textos acessíveis, ações diretas e registros existentes e retira espaços redundantes apenas desse estado desktop. O teste passa a exigir o título da seção e seus três controles completos no mesmo limite de 900 px, conservando a identidade/foco da NF na jornada navegada. A nova composição exige outra prova de navegador.

**Instabilidade separada:** o cenário de erro durante salvamento em `evaluation-retification-ui.spec.js` mediu 47 px na primeira tentativa de dois jobs e passou nas repetições. É diferente da âncora autenticada acima. Os logs existentes não isolam o ponto da mudança; esse resultado não é descrito como estabilidade integral nem como falha de persistência.

### Revisão integrada de `7d894557`

A [regressão desktop 45577125375](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125375) aprovou **18/18**, sem repetição ou skips. O integrador abriu as duas capturas nativas e confirmou a composição. O [readiness 45577125292](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292) aprovou **2/2 jornadas D022** e os **seis cenários T5**. As provas D022 incluem os controles fiscais na primeira tela, expansão/recolhimento do Qualidade, cinco destinos/foco, relógios e igualdade dos dados antes/depois. A galeria dessa execução identifica origem, hashes e limites; as capturas não representam aceite do proprietário.

**Regressão encontrada e corrigida:** o grupo T2–T5 terminou com 26 aprovados e uma falha T3 na identificação de uma saída do Qualidade. O parágrafo informativo novo reutilizava `quality-provisional-description`, ID já pertencente ao input do editor. A leitura por `getElementById` obtinha o parágrafo, salvava descrição vazia e a identificação seguinte era impedida pela validação nativa da NF. O PNG e o contexto da falha confirmaram o campo vazio; a pré-production também encontrou descrição perdida após editar/recarregar. O reparo renomeia somente o parágrafo, seu `aria-controls` e o seletor do disclosure para `quality-provisional-summary-description`. O input canônico, a autoridade e os E2Es que detectaram a regressão foram preservados. Esse reparo exige aprovação própria no novo SHA; não converte o run anterior em aprovado.

As duas contraprovas novas usam o markup real do painel e dos inputs de `index.html`, mantendo a ordem documental de `getElementById`: unicidade dos 18 IDs relevantes e descrição preenchida → payload de inserção → formulário de identificação com ID/versão/valor corretos. Contra as três fontes de `7d894557`, ambas falharam (17 IDs únicos entre 18 e `description: null`); com o reparo, os sete testes focais passaram. A prova local complementa, sem substituir, as duas jornadas Auth que detectaram o defeito.

O fechamento desse SHA foi **22/25 workflows aprovados**. Readiness, E2E geral e pré-production reprovaram pela mesma colisão/descrição: o contrato frontend encontrou o ID duas vezes; as duas suítes amplas tiveram 295 aprovados e 98 skips, sem flaky listado, além dessa falha. Os testes instrumentados de erro de retificação passaram na primeira tentativa nos três jobs em que executaram. O novo lote mantém os contratos reprovados e requer seu resultado próprio.

**Diagnóstico da posição durante erro:** o [ensaio direcionado 45577125151](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125151) aprovou **18/18 sem retry**. O [JSON nativo](2026-11-25-t5-visual/geometry/retificacao-erro-7d894557.json), extraído sem reserializar do artefato `15003669830`, tem SHA-256 `4a373e5bee4101ac377203b6869102c1b2bfb6280db646c3f8d6b15b512ef6e1`. Antes de estabelecer a referência, a altura e a rolagem do conteúdo reduziram 47 px, mas a linha manteve o mesmo topo de 329,015625 px. A partir da referência, click, submit, captura e retorno do erro permaneceram em `scrollTop = 650`, com a linha em 149,015625 px: deslocamento operacional **zero**, tolerância de 4 px preservada. Fontes já estavam carregadas e não havia estilos pendentes nos dois momentos iniciais; a evidência não atribui a acomodação a fontes/CSS. Os [ciclos autenticados 45577125770](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125770) também passaram **21/21**, sem retry listado.

### Qualidade e produto conferidos em `bd90e642`

O [readiness 45580199861](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45580199861), job `139088031414`, aprovou **17/17 Auth/RLS, 4/4 login/histórico protegido e 27/27 T2–T5**, sem retry, em 2,9 minutos no bloco integrado. A identificação de uma saída Qualidade, sua reabertura e nova identificação pela Assistente passaram. A [pré-production 45580199896](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45580199896) também aprovou edição da descrição, recarga e identificação, além de 296 E2Es com 98 skips de escopo e nenhum flaky listado; o contrato de IDs únicos passou. A [regressão visual 45580200178](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45580200178) aprovou 18/18, sem falhas/repetições/skips.

**Limite do run:** D022 ficou em 0/2 porque ambos os testes e suas repetições expiraram em `visualAssetsReady → ready → openSchool`, antes das asserções de composição/navegação. O guard exigia o pathname `/src/styles/painel-controlador-expressiva.css`; `config.js` declara essa folha com href relativo e a navegação profunda resolve `/escolas/src/styles/...`, atendida corretamente por `resolveDeepAsset` no servidor. A correção aceita a declaração canônica da folha com/sem barra inicial, além do pathname resolvido; preserva mesma origem, `rel=stylesheet` e folha carregada. A espera específica passa a ter limite de 15 segundos e diagnóstico de href/rel/sheet em caso de falha, sem aumentar o limite da jornada ou afrouxar as asserções de interface.

Esse lote posterior altera somente teste e evidência: código de produto, migration, domínio e estilos permanecem idênticos a `bd90e642`. Sintaxe, lint e descoberta dos dois casos foram conferidos localmente; a prova Auth D022 exige o resultado próprio do novo HEAD. A falha do guard não é apresentada como falha funcional do Qualidade nem como execução D022 aprovada.

## Ativação e limites

`RADAR_T5_GRANULAR_HISTORY_RELEASE_ENABLED` permanece OFF por padrão e depende da cadeia T0–T4. O piloto de teste exige Supabase loopback e autorização de ambiente descartável. A publicação do #564 não autoriza automaticamente aplicar a migration 69 ou publicar esta candidata. Banco institucional permanece com as 68 migrations já confirmadas; os três alertas patrimoniais preexistentes não são fixtures nem alvos desta entrega.

As oito obrigações de UI T5 passam a `candidate`, com caminhos concretos no mapa D020. Código candidato, teste aprovado, inspeção visual, aceite do proprietário e publicação são estados distintos. O encerramento depende das provas do candidato e da revisão humana definida no projeto.
