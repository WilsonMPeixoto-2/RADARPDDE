# Revisão visual inicial — jornada Despesa a identificar

**Estado:** parcial, observacional, sem correção de produto. **Base:** `main` em `ce0886d1e7a02a711772ab765be0497383bc55ee` (tree `cc3049b3c9c2ffe8d6d704b7a9617f0e404d4476`). A [baseline funcional](../2026-09-27-post-abc-expense-baseline/README.md) foi aprovada por testes locais e UAT Supabase no CI sobre tree idêntico. Esta revisão aborda comunicação visual e UX; não reabre a conclusão de persistência.

## Método e limites

As oito primeiras capturas desta pasta foram geradas **nesta rodada**, em Windows, pelo Chromium Playwright a 1440 × 900, com `RADAR_E2E_CAPTURE=1`, ao executar os dois cenários direcionados de `tests/e2e/unidentified-expense-user-journey.spec.js`. Resultado: **2 expected, 0 unexpected**, duração total 12,7 s. Mais seis capturas registram a navegação pela aba da unidade e pela fila global. As ações da jornada são feitas pelos controles visíveis; a escola e o estado inicial vêm da fixture local. As 14 capturas aceitas foram abertas e inspecionadas individualmente antes deste relatório. Nenhuma tela de Production foi usada como evidência visual aqui.

Uma tentativa complementar no navegador interno mostrou o Prontuário em 1215 px, mas seus cliques em ações da tabela não produziram transição; isso **não foi reproduzido no Playwright** e não é classificado como defeito do RADAR. A sessão Chrome de Production pediu novo login. A comparação visual da aba **Pendências Ativas desta unidade** e da fila global foi concluída **somente no ambiente local**, com uma Pendência de fixture. O roteiro exploratório usou os controles visíveis, verificou o mesmo ID na fila global e testou ida/volta com filtro da escola; **1/1 passou**. O arquivo temporário do roteiro foi removido após a execução, preservando apenas as capturas. Acessibilidade por teclado/leitor de tela e contraste medido também não foram verificados.

## Etapas e saúde visual observada

| Etapa | Captura | Saúde e observação |
| --- | --- | --- |
| 1. Prontuário e entrada | [01](01-prontuario-inicio-fluxo.png), [01b](01b-ajuda-contextual-despesa-a-identificar.png) | **Parcial.** O CTA tem texto específico e tooltip explicativo quando encontrado. No primeiro viewport de 900 px, fica abaixo da dobra; a fixture já deixa a bonificação fiscal em `Não`. O código só renderiza o CTA principal quando existe valor de bonificação fiscal, condição que a tela inicial não explica nesse ponto. |
| 2. Criação e Pendência | [02](02-pendencia-proximo-passo.png) | **Boa.** Drawer apresenta status `Aberta`, dados provisórios, motivo, observação, competência, próximo passo e ação principal. O feedback da gravação é legível acima do drawer. |
| 3. Retificação provisória | [02b](02b-editar-despesa-provisoria.png) | **Boa.** Título, contexto e texto introdutório deixam claro que o mesmo lançamento/Pendência continuam vinculados; classificação automática permanece distinguível da edição dos dados provisórios. |
| 4. Primeiro envio/identificação | [03](03-identificar-despesa-novo-envio.png) | **Boa, com fricção potencial.** O modal explica a preservação de identidade e separa contexto de documento. Em 900 px, a data de disponibilização e campos seguintes ficam abaixo da dobra enquanto o botão de envio já aparece no rodapé fixo; a pessoa precisa rolar para conhecer todos os campos antes de decidir. |
| 5. Aguardando reanálise | [04](04-aguardando-reanalise-clicavel.png) | **Boa.** O estado é botão destacado e separado de `Visualizar pendência`. O feedback confirma que a despesa foi identificada e o documento enviado. |
| 6. Decisão de reanálise | [04b](04b-reanalise-documento-identificado.png) | **Boa estrutura; ajuste de comunicação indicado.** Documento, tentativa, contexto e decisão têm hierarquia distinta. A data `2026-09-23` aparece em formato ISO, destoando de `Maio/2026` e das datas em formato brasileiro em outras etapas. |
| 7. Resolução | [05](05-reanalise-concluida.png) | **Parcial na mensagem.** O card passa a `Correto (Atrasado)` e o toast diz `Reanálise registrada com sucesso`. A Pendência foi resolvida no teste, mas a tela capturada não comunica explicitamente essa consequência; o usuário pode precisar abrir outra área para conferir o encerramento. |
| 8. Pendências Ativas da unidade | [06](06-pendencias-ativas-unidade.png), [07](07-identificacao-via-pendencias-ativas.png) | **Boa rota de ação, inspeção limitada.** A linha resume competência, item, defeito, responsável e abertura; o CTA leva diretamente ao mesmo formulário de identificação. Diferentemente do card do Prontuário, a linha não oferece `Visualizar pendência` nem abre o detalhe por clique; para consultar o histórico, é preciso ir à fila global ou voltar ao card. A primeira captura após a troca de aba ocorreu durante a transição, foi rejeitada e substituída após estabilização. |
| 9. Pendências Operacionais / retorno | [08](08-pendencias-operacionais-globais.png), [09](09-detalhe-fila-global.png), [10](10-retorno-prontuario.png), [11](11-retorno-fila-filtrada.png) | **Navegação funcional boa; densidade visual a observar.** `Ver todas as pendências desta escola` abriu a fila com escola filtrada e indicador visível. O mesmo registro pôde ser aberto em drawer, conduzido ao Prontuário e devolvido à fila com filtro, seleção e drawer preservados. Em 1440 × 900, o bloco de filtros ocupa quase o viewport inicial e a linha da Pendência fica abaixo da dobra; a consulta ao detalhe exige rolagem. O drawer reúne contexto, erros, observação, tentativas, contatos e cinco ações no rodapé, com alta densidade. |

## Achados priorizados, sem alteração aplicada

**UX-01 — encontrabilidade inicial; prioridade média; confiança média.** O CTA de Despesa a identificar aparece depois de rolagem na captura 01b e depende de um valor prévio da bonificação fiscal no render principal (`app.js`, `canAddUnidentifiedExpense`). A fixture já satisfaz essa condição; o percurso visual de uma competência sem bonificação definida não foi homologado ponta a ponta. Investigar se a interface deve explicar o pré-requisito ou tornar a entrada localizável no estado vazio, sem alterar regras funcionais por suposição.

**UX-02 — variação de formato da data; prioridade baixa; confiança alta.** Em 04b a tentativa recebida mostra `2026-09-23`; o restante do contexto usa nomes de mês/ano em português e o drawer usa dia/mês/ano. Padronizar a apresentação da data reduziria a leitura técnica, preservando o valor de dados subjacente.

**UX-03 — clareza da resolução; prioridade média; confiança média.** Em 05, `Correto (Atrasado)` e `Reanálise registrada com sucesso` não dizem diretamente que a Pendência foi encerrada. Considerar feedback que faça a relação entre análise e fechamento, após observar a mesma tarefa em Pendências Ativas para evitar mensagem redundante.

**UX-04 — campos abaixo da dobra; prioridade baixa/média; confiança média.** Em 03, contexto e identificação ocupam a maior parte do primeiro viewport; o rodapé de confirmação permanece visível antes da seção de data e observação. Verificar em teste com usuário se a pessoa percebe que há mais campos antes de enviar. A captura, sozinha, não prova erro de validação ou submissão prematura.

**UX-05 — inspeção inconsistente entre superfícies; prioridade média; confiança alta no desktop local.** Em 06, a aba da unidade mostra o defeito e oferece o próximo envio, mas não dá acesso direto ao detalhe completo da Pendência. O mesmo registro tem `Visualizar pendência` no card do Prontuário e `Ver detalhes` na fila global. Quem começa pela aba da unidade precisa mudar de superfície para consultar observação e tentativas antes de agir. Harmonizar a ação de inspeção pode reduzir essa troca sem duplicar dados na tabela.

**UX-06 — fila global exige rolagem para o primeiro registro; prioridade baixa/média; confiança alta no desktop local.** Em 08, o cabeçalho, os indicadores e a área de filtros levam as abas e a tabela para a base do viewport de 900 px, mesmo com um único registro. Avaliar compactação progressiva dos filtros ou entrada mais direta no item selecionado, preservando a clareza do escopo de competência e escola.

**UX-07 — identidade da despesa perde destaque no drawer global; prioridade média; confiança alta no desktop local.** Em 06, o item é `Despesa a identificar` e o CTA nomeia a identificação. Em 09, o título do drawer vira `Notas Fiscais` e a próxima ação é o genérico `Entregar ou corrigir o documento`; sem voltar à linha selecionada, a pessoa não vê no cabeçalho que está identificando uma despesa provisória. Expor a natureza provisória e a ação específica no próprio drawer ajudaria a conectar as superfícies.

## Production autenticada — checkpoint de navegação

Após o login do usuário, a sessão autenticada de `https://radarpdde-fix.vercel.app/` foi inspecionada no navegador interno, em viewport de aproximadamente 1215 px. **Este checkpoint é leitura de UI de Production, sem gravação e sem captura versionada.** O SHA exato do deployment não foi identificado; as observações não são atribuídas automaticamente ao tree da baseline.

Na unidade **Escola Municipal Cardeal Câmara (04.31.017)**, competência **Agosto/2026**, o Prontuário mostrou quatro Pendências Ativas, todas de `Despesa a identificar`. Os cards de Notas Fiscais mostraram estado `Incorreto`, dados provisórios e `Visualizar pendência`; a aba `Pendências Ativas desta unidade (4)` listou competência, defeito, responsável, abertura e `Registrar envio / identificação da despesa`, sem controle de detalhe na própria linha. A captura visual ao vivo confirmou a mesma diferença de inspeção descrita em UX-05.

O link `Ver todas as pendências desta escola` abriu `/pendencias?escola=04.31.017`, com filtro da unidade selecionado e quatro resultados abertos. Na fila, a próxima ação do registro **WEDAX DEDETIZADORA** foi específica — `Enviar documento e identificar a despesa`. Seu drawer, porém, intitulou o item apenas `Notas Fiscais` e indicou `Entregar ou corrigir o documento`, corroborando UX-07. O drawer mostrou contexto, erro `Documento ausente`, observação, tentativas, contatos e linha do tempo. `Abrir no Prontuário` conduziu à mesma unidade e competência; `Voltar às Pendências` restaurou filtro e drawer do mesmo registro. **Nenhum envio, reanálise, edição ou cancelamento foi salvo.**

Os cliques disparados pelo controle remoto do navegador interno não ativaram os handlers de navegação nessa sessão; a ativação por **Enter** funcionou. Isso não é classificado como defeito do produto, pois a navegação local Playwright já havia passado por clique. A abertura inicial do Prontuário usou o `href` exibido pelo próprio link. Falta executar e observar o ciclo de gravação na Production com um registro inequivocamente destinado a teste.

## Production autenticada — checkpoint de gravação autorizado

O usuário autorizou expressamente escritas em Production após o checkpoint observacional. Foi iniciado um **novo registro sintético**, sem alterar as quatro despesas existentes, na Escola Municipal Cardeal Câmara, competência `08/2026`, `PDDE Básico`:

| Campo | Valor de teste e evidência após criação |
| --- | --- |
| Descrição provisória | `TESTE CONTROLADO UX 27-09-2026 23:08 — saída provisória` |
| Referência / valor | `UX-2709-2308` / `R$ 1,23` |
| Observação | `Registro sintético autorizado para auditoria de UX; sem despesa ou documento real.` |
| Invoice no DOM | `nota-82b17b35-971e-49d9-85a5-d4e0e2c55065` |
| Pendência no DOM | `pend-699702ea-480f-4703-bd98-9de990237f35` |
| Estado observado | Card `Despesa a identificar`, análise `Incorreto`, drawer `Aberta`, `Documento ausente`, dados provisórios e próximo passo; contador da aba da unidade passou de 4 para 5. |

Os IDs acima vêm de atributos DOM da mesma linha da descrição única, observados após o envio; ainda falta conferir persistência após reload e identidade em todas as etapas. **Não há documento fiscal real associado a este teste.** Próximas etapas: retificar, identificar como consumo com dados sintéticos, registrar envio, reanalisar e verificar o estado restaurado. O resultado final deve continuar explicitamente identificado como teste no histórico.

**Riscos de acessibilidade ainda não certificados:** 01b demonstra tooltip por hover; falta verificar exposição equivalente por foco/teclado e leitor de tela. Textos auxiliares cinza/roxo pequenos aparecem em 02b, 03 e 04b; falta medição de contraste e zoom/reflow. Nenhuma conclusão de conformidade WCAG é feita a partir das capturas.

## Próxima verificação

Com um registro inequivocamente destinado a teste, conferir se o ciclo de gravação real na Production reproduz os mesmos estados e mensagens. As capturas 01–11 continuam sendo **locais**, não capturas de Production. Confrontar UX-01 e UX-03 com esse ciclo antes de decidir ajustes de interface.
