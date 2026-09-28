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

Os IDs acima vêm de atributos DOM da mesma linha da descrição única, observados após o envio. **Não há documento fiscal real associado a este teste.** O resultado final deve continuar explicitamente identificado como teste no histórico.

### Retificação dos dados provisórios — confirmada em Production

No mesmo lançamento, o diálogo `Editar despesa a identificar` recebeu a descrição `TESTE CONTROLADO UX 27-09-2026 23:08 — saída provisória retificada`, a referência `UX-2709-2308-R1` e o valor `R$ 1,24`. Após `Salvar Alterações`, o card de Notas Fiscais mostrou a nova descrição e o novo valor, ainda com tipo automático `Despesa a identificar` e análise `Incorreto`. O drawer reaberto exibiu descrição, referência e valor atualizados, status `Aberta`, motivo `Documento ausente` e a mesma observação sintética. Os atributos DOM preservaram `nota-82b17b35-971e-49d9-85a5-d4e0e2c55065` e `pend-699702ea-480f-4703-bd98-9de990237f35`. A persistência após reload ainda será conferida ao final do ciclo.

### Primeiro envio e identificação — confirmados em Production

Pelo CTA `Registrar envio / identificação da despesa` no drawer, o diálogo mostrou contexto da mesma unidade, competência e programa e exigiu a escolha do tipo final. Foram salvos `Material de Consumo`, referência `DOC-TESTE-UX-2709-2308`, descrição `TESTE CONTROLADO UX 27-09-2026 23:08 — material de consumo sintético`, `R$ 1,24`, data de disponibilização `27/09/2026` e observação `Teste autorizado em Production; nenhum documento fiscal ou arquivo real foi recebido.` O link opcional do Drive ficou vazio. **A data atende a validação obrigatória do formulário neste ensaio sintético; não prova disponibilização de um arquivo real.**

Após `Registrar e enviar para reanálise`, o card do Prontuário passou a `NF: DOC-TESTE-UX-2709-2308`, `Material de consumo`, `R$ 1,24` e botão clicável `Aguardando reanálise`. O mesmo `data-invoice-id` (`nota-82b17b35-971e-49d9-85a5-d4e0e2c55065`) e a referência de Pendência (`pend-699702ea-480f-4703-bd98-9de990237f35`) permaneceram no DOM. O drawer mostrou `Aguardando reanálise` e CTA `Reanalisar` com orientação coerente para conferir o documento recebido. O contador de pendências da unidade permaneceu 5. Próximas etapas: devolver como `Incorreto`, pois não existe arquivo fiscal real neste teste, e conferir persistência após reload.

**Observação de UX a avaliar:** o card acrescenta `NF:` a uma referência livre (`DOC-TESTE-...`); o formulário exigiu data de disponibilização mesmo com link do Drive vazio. Isso é visível no fluxo e não comprova que o arquivo exista. A consequência prática e eventual tratamento exigem decisão de produto; este checkpoint não afirma conformidade documental.

### Reanálise e retorno à Escola — confirmados em Production

O botão `Aguardando reanálise` no card abriu o diálogo `Reanalisar pendência documental`, com a tentativa, observação do envio, dados da despesa e contexto da Pendência. Como o ensaio não tem arquivo real, foi selecionado `Arquivo não localizado ou inacessível` e registrada a justificativa `Teste controlado em Production: nenhum arquivo fiscal real foi disponibilizado; devolvido à Escola para preservar a veracidade documental.` Após `Confirmar reanálise`, o mesmo card ficou `Incorreto`; o drawer voltou a `Aberta`, mostrou motivo `Arquivo não localizado ou inacessível` e orientou `Registrar novo envio` na **mesma Pendência**. O registro de teste permanece ativo, de modo explícito, sem conclusão documental falsa.

### Reload e caminhos alternativos — confirmados em Production

Após reload da rota da unidade e restauração da sessão, o card manteve `NF: DOC-TESTE-UX-2709-2308`, `Material de consumo`, `R$ 1,24`, `Incorreto`, o mesmo `data-invoice-id` e a mesma referência `pend-699702ea-480f-4703-bd98-9de990237f35`. O drawer permaneceu `Aberta`, com erro `Arquivo não localizado ou inacessível` e CTA `Registrar novo envio`. A aba `Pendências Ativas desta unidade (5)` listou a linha sintética com `Notas Fiscais — DOC-TESTE-UX-2709-2308`, erro, observação, ator `Escola` e `Registrar novo envio`. O link `Ver todas as pendências desta escola` abriu `/pendencias?escola=04.31.017`, filtro preservado, cinco abertas; a fila global mostrou a linha de teste, uma tentativa analisada e o mesmo erro. Isso confirma a continuidade do registro por ambos os caminhos após reload.

### Achados novos da validação autenticada

- **PROD-UX-08 — clipping do drawer global em desktop, severidade alta.** Na viewport observada de `1267 × 1113`, a página de Pendências filtrada abriu o drawer com largura computada de cerca de `431 px`, enquanto a grade interna continuou com duas colunas e o contexto com quatro. O conteúdo da primeira tentativa avançou até `x ≈ 1384`, **117 px além da borda direita do viewport**; texto, metadados e cartões ficaram cortados. Screenshot inspecionado ao vivo, ainda não versionado. A causa provável é a combinação das regras `.pendency-drawer-body` e `.pendency-detail-grid` em `task-9-pendencias.css` com o overlay estreito de `layout-responsive-2026.css`. Requer correção visual localizada e nova comparação renderizada.
- **PROD-FUNC-09 — data de disponibilização retrocede um dia na fila global, severidade média, confiança alta na UI.** O formulário aceitou `2026-09-27`; a prévia da tentativa no diálogo de reanálise exibiu `2026-09-27`, mas `Tentativas de envio` no drawer global exibiu `26/09/2026` após reload. A linha do tempo registra corretamente os eventos em `27/09/2026`. Reproduzir com data ISO em outra configuração de fuso e inspecionar formatação antes de corrigir; isto é um defeito funcional de apresentação, fora de uma correção puramente visual.

**Riscos de acessibilidade ainda não certificados:** 01b demonstra tooltip por hover; falta verificar exposição equivalente por foco/teclado e leitor de tela. Textos auxiliares cinza/roxo pequenos aparecem em 02b, 03 e 04b; falta medição de contraste e zoom/reflow. Nenhuma conclusão de conformidade WCAG é feita a partir das capturas.

## Próxima verificação

Com um registro inequivocamente destinado a teste, conferir se o ciclo de gravação real na Production reproduz os mesmos estados e mensagens. As capturas 01–11 continuam sendo **locais**, não capturas de Production. Confrontar UX-01 e UX-03 com esse ciclo antes de decidir ajustes de interface.
