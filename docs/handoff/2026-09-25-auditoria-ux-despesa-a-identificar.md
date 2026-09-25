# Auditoria UX — Despesa a identificar

Status: CONCLUÍDO NO ESCOPO READ-ONLY; validação de gravações permanece parcial

- Data: 2026-09-25 (America/Sao_Paulo).
- SHA da main confirmado via GitHub: bb7246438b8c6b72ef068b21bb40d492a7049af2.
- Branch: audit/ux-despesa-a-identificar-2026-09-25.
- Objetivo: avaliar a experiência real do Controlador, a navegação, encontrabilidade, continuidade e prevenção de duplicidade no fluxo Registrar despesa a identificar → Visualizar pendência → correção dos dados provisórios → Registrar envio / identificação da despesa → Aguardando reanálise → Reanalisar.
- Restrições: somente auditoria e documentação. Não alterar código, banco, dados de Production, configuração, Vercel ou Supabase. Não criar registros em Production. Não submeter formulários que gravem dados. Diferenciar evidência visual, leitura estática e informação histórica.
- Recuperação: checkpoints persistidos diretamente na branch remota pelo conector GitHub (commit remoto equivalente a commit + push; Git e gh não encontrados no PATH desta estação).

## 1. Baseline
Status: parcial

PR #374 confirmado merged em 2026-09-25T06:38:07Z; merge bb7246438b8c6b72ef068b21bb40d492a7049af2 coincide com main. Acesso autenticado ao frontend obtido, apresentação Controlador; não foi inspecionado JWT/papel efetivo. Clone local da branch disponível em work/RADARPDDE. Git localizado no runtime empacotado após checkpoint inicial.

Documentação consultada: AGENTS.md, SYSTEM_CANONICAL_MODEL.md, PRODUCT_SURFACE_CATALOG.md, CURRENT_STAGE.md, handoff corrente de modernização, ENGINEERING_METHOD.md, FRONTEND_USER_VALIDATION_GATE.md, STATUS_DOCUMENTOS.md e matriz funcional.

**D-01 — divergência documental de baseline (confirmada):** CURRENT_STAGE.md ainda descreve 6dd4b923 e PRs #370/#371 como baseline recente; a main e o PR #374 consultados ao vivo já apontam bb724643. Não confundir esse texto histórico com certificação atual de Production. Não é defeito funcional da interface.

Arquivos centrais: src/integration/unidentified-expense-ux.js; task-9-pendencias-page.js; task-10-11-pendency-actions.js; src/application/pendency-service.js; src/styles/unidentified-expense-ux.css. Testes existentes: tests/e2e/unidentified-expense-user-journey.spec.js, unidentified-expense-identification-matrix.spec.js, tests/unit/unidentified-expense*.test.js, supabase/tests/database/unidentified-expense.test.sql. Existência não equivale a execução nesta rodada.

## 2. Jornada e regras no código
Status: parcial

Autoridades e testes direcionados examinados; resultados consolidados no fechamento abaixo. Não houve auditoria SQL remota nem prova nova de escrita.

## 3. Auditoria visual e navegação
Status: concluído

Inspeção read-only realizada nas superfícies e formulários descritos nos checkpoints; transições que gravam dados não executadas.

Capturar a interface renderizada e registrar por etapa: tela → estado percebido → ação principal percebida → ação correta → interações → encontrabilidade → inconsistências → risco humano. Comparar Prontuário, Pendências Ativas desta unidade e Pendências Operacionais.

## 4. Acessibilidade e responsividade
Status: parcial

Desktop 1440×900 e viewport móvel 390×844; teclado e foco nos controles visitados. Não equivale a certificação WCAG.

## 5. Achados, limites e retomada
Status: parcial

Achados e evidências registrados nos checkpoints abaixo. Feedback pós-gravação e transições mutáveis não serão executados em Production; exigem evidência existente ou ambiente seguro.

## Checkpoint 1 — recuperação
Status: parcial

Frontend autenticado aberto na unidade com despesas provisórias em Agosto/2026. Captura desktop 1440×900 salva localmente em outputs/01-prontuario-desktop.png. Nenhuma gravação de negócio realizada. Próximo passo: abrir formulário de cadastro sem submeter e examinar drawer/edições/envio, usando registros existentes. SHA publicado ainda não confirmado independentemente.

## Checkpoint 2 — cadastro, drawer e edição
Status: parcial

Capturas locais 02–05 (desktop 1440×900) inspecionadas. Cadastro aberto e fechado por Escape sem preencher/submeter; foco retornou ao botão de origem. Drawer abriu com estado Aberta, competência/programa, dados provisórios, motivo, observação, data e Próximo passo. Identificação é o botão preenchido principal; edições têm peso secundário.

**UX-01 — P2, texto de criação dentro da edição (confirmado):** Editar dados da despesa abre título Editar despesa a identificar e botão Salvar Alterações, mas a introdução promete que o RADAR 'abrirá a Pendência correspondente', embora o usuário esteja editando um registro já vinculado. Risco: receio de duplicidade e confusão entre retificar e registrar. Recomendar texto específico de edição, afirmando preservação da despesa e da Pendência. Evidência 05-editar-despesa-texto-criacao.png. Nenhuma duplicação real foi executada ou constatada.

**UX-02 — P2, contexto incompleto nos overlays (confirmado nas telas inspecionadas):** drawer informa competência e programa, mas não repete a unidade escolar; cadastro/edição não exibem resumo de escola, competência e programa. O fundo escurecido não oferece confirmação confiável, sobretudo em mobile. Recomendar resumo contextual compacto nos próprios overlays. Evidências 03–05.

**UX-03 — P2, distinção dos registros provisórios (confirmado):** linhas existentes repetem Despesa a identificar como documento e tipo, com truncamento; descrição provisória só aparece após abrir drawer. Valor diferencia as linhas, mas falta pista textual da saída na listagem. Risco de abrir/editar registro errado quando valores forem próximos/iguais (cenário hipotético, não reproduzido). Recomendar descrição provisória como identificador primário e tipo como metadado único. Evidência 02.

Retorno: Escape no editor fecha também o contexto de drawer já substituído e devolve foco a Visualizar pendência na linha; escola/programa e posição visível preservados. Para continuar identificando, é preciso reabrir drawer (+1 clique).

## Checkpoint 3 — identificação e responsividade
Status: parcial

Identificação: modal mostra escola, competência, programa e documento; explica preservação da mesma despesa/Pendência e resultado de encaminhar à reanálise. Tipos finais só aparecem aqui; Boleto de Internet aparece desabilitado no programa examinado (fora de Educação Conectada). Formulário apenas aberto/fechado, sem alteração nem envio. Evidências 07–09. No mobile 390×844, formulário tem rolagem interna e rodapé acessível; cabeçalho/contexto ocupam quase toda primeira dobra, exigindo rolagem para preencher.

**UX-04 — P1 na experiência móvel, drawer comprimido (confirmado):** em 390×844, painel da Pendência ocupa faixa estreita à direita (~160px visuais), com texto quebrado em poucas palavras por linha, cabeçalho parcialmente fora da área visível e ações apenas após rolagem. A ação principal chega a quatro linhas; observação/contexto/Próximo passo tornam a leitura excessivamente longa. Ações foram alcançadas com scroll, portanto não classificadas como inexistentes. Evidências 10-drawer-mobile.png e 11-drawer-mobile-acoes.png. Recomendar drawer ocupar largura útil da viewport móvel e cabeçalho/fechamento acessíveis. Verificar CSS responsável antes de corrigir.

Editar detalhes: edição inline de motivo/observação, sem campos da despesa; não mostra Cancelar explícito, somente Salvar e fechar. Escape funcionou sem alterações e retornou à linha. Recomendar nome Editar motivo e observação da Pendência para antecipar a diferença. Evidência 06. Nenhum teste de descarte de dados alterados foi feito.

## Checkpoint 4 — comparação entre superfícies
Status: parcial

Production confirmado pelo manifesto público radar-build-manifest.json: commitSha bb7246438b8c6b72ef068b21bb40d492a7049af2, vercelEnvironment/runtimeEnvironment production, dataMode supabase-production. Coincide com main e merge #374.

**UX-05 — P2, identificação insuficiente entre superfícies:** Pendências Ativas mostra descrição/observação mas omite programa e valor nas linhas; Pendências Operacionais mostra programa e documento genérico Notas Fiscais, mas omite descrição/valor na lista. Há duas linhas do mesmo programa com informação aparente igual. Drawer operacional mostra a observação da mesma despesa examinada, porém Próxima ação usa Entregar ou corrigir o documento enquanto a lista usa Enviar documento e identificar a despesa. Recomendar identidade compacta consistente e mesma próxima ação no detalhe. Evidências 12–14.

**NAV-01 — P1, filtro por unidade se perde ao abrir detalhe (observado):** vindo de Pendências Ativas → Ver todas as pendências desta escola, URL /pendencias?escola=04.31.017 exibe 4 registros e banner da escola. Clicar Ver detalhes da segunda linha abre a pendência correta, mas a lista de fundo passa a 142 registros/132 ativos e o banner desaparece; fechar mantém a fila ampla, embora URL ainda contenha escola. Não foi clicado Limpar filtro. Antes: evidência 13; depois: 14–15 e snapshot de DOM. Necessário reproduzir isoladamente e localizar causa; risco de perder contexto e atuar em outra unidade.

Sem escrita de dados até este checkpoint. Próximo: contraprova de navegação e estado Aguardando reanálise em registro preexistente.

## Checkpoint 5 — reanálise e contraprovas
Status: parcial

NAV-01 reproduzido novamente por seletores semânticos: voltar ao Prontuário → Ver todas as pendências desta escola → 4 registros → Ver detalhes → 142 registros/132 ativos. O filtro explícito no select Unidade escolar funciona para localizar outro registro; a perda observada é do filtro contextual de entrada.

Reanálise inspecionada em despesa preexistente de outra unidade: Pendências Operacionais mostra Aguardando reanálise, Próxima ação Conferir o novo arquivo, responsável Controlador e botão Reanalisar. Modal abre com contexto e tentativa. Abrir no Prontuário conduz à linha destacada; Aguardando reanálise é botão roxo preenchido com ícone, distinto do badge estático Incorreto e da ação secundária Visualizar pendência. Enter abriu o modal; Escape fechou sem salvar. Evidências 16–17. Não afirmamos que este registro foi identificado nesta rodada nem que seu histórico inteiro foi reconstituído.

**UX-06 — P2, reanálise tem baixa hierarquia do contexto (confirmado):** campos Estado/ator/erros/escola/competência/programa/data/observação aparecem como sequência vertical com peso semelhante, diferente dos agrupamentos visuais do formulário de identificação. Não exibe identidade individual (número/valor/descrição) da despesa no contexto mostrado. Recomendar agrupar contexto, último envio e decisão, incluindo identificação individual. Evidência 16.

PR #374: diff restrito a operacional-write-feedback.js e asserts de mensagens na jornada E2E. Mensagens previstas: cadastro da despesa/Pendência, identificação + envio e reanálise registrada. Não modifica layout, schema ou transições; os achados de navegação/mobile não foram atribuídos a esse PR. Feedback real após salvar não executado pela restrição read-only.

## 6. Fechamento técnico e prioridades
Status: concluído

A auditoria encontrou problemas de navegação e apresentação; não constatou duplicação de despesa e não alterou registros. Critério principal de jornada sem procura/risco razoável de erro **não plenamente atendido**, principalmente pela perda do filtro e pelo drawer móvel.

Prioridade de correção:
1. NAV-01: preservar filtro contextual por unidade em toda renderização, abertura e fechamento do detalhe.
2. UX-04: drawer móvel com largura útil, leitura e fechamento acessíveis.
3. UX-03/UX-05: identidade da despesa e contexto coerentes nas três superfícies.
4. UX-01/UX-02/UX-06: texto próprio de edição, resumo contextual e hierarquia da reanálise.
5. D-01: reconciliar documentação de baseline, sem reescrever histórico como evidência nova.

Rastreamento no SHA auditado:
- styles.css:3744–3751: drawer declara width 440px e max-width 44vw; em 390px o teto é 171,6px, coerente com a faixa estreita observada. Não foi encontrado override responsivo dessa largura nas ocorrências pesquisadas.
- src/integration/unidentified-expense-ux.js:187–200: título e submit distinguem edição/criação por invoiceId, mas a introdução usa somente unidentified e conserva a promessa de abrir Pendência.
- src/integration/navigation-bootstrap.js:251–264: wrapper filtra temporariamente a coleção e restaura a completa no finally.
- src/integration/task-9-pendencias-page.js:1084 e 1106: abertura/fechamento de detalhe chamam renderPendenciasTask9 diretamente; getPageModel usa coleção pendencias e pageState.filters. Isso explica a perda do filtro aplicado somente pelo wrapper. Diagnóstico estático coerente com duas reproduções reais, sem patch nesta rodada.
- src/application/pendency-service.js:691–755: identificação passa pela invoice existente, registerCorrectiveSubmission e devolve identified; o mesmo fluxo muda análise individual para Não analisado e encaminha a Pendência. A garantia persistente não foi reexecutada contra Production.

PR #374: não encontrei defeito novo no diff delimitado examinado. Mensagem especial depende de result.value.identified, flag produzida pelo serviço atual. A proteção de aviso de sincronização pendente continua anterior ao retorno de sucesso. Isso é revisão delimitada, não aprovação integral do produto.

Verificação local: **14 testes passaram, 0 falharam**, executados com Node empacotado sobre cinco arquivos existentes:
- tests/unit/unidentified-expense.test.js
- tests/unit/unidentified-expense-identification-options.test.js
- tests/unit/unidentified-expense-state-bridge.test.js
- tests/unit/fluxo-operacional-unidentified-expense.test.js
- tests/unit/operational-write-feedback.test.js

O comando Node terminou com os 14 resultados verdes; uma busca rg posterior falhou por glob de caminho no Windows e foi refeita corretamente, sem afetar os testes. Log preservado em outputs/testes-direcionados.txt.

CI do head do PR #374 (5522c9024f99e29e0b63a8cd06a264da19dd5523) consultada ao vivo: 27 checks SUCCESS e 2 SKIPPED na resposta, incluindo Jornada leiga e identificação por tipo, Playwright completo desktop e Gate final pré-production. Evidência histórica de CI, não execução E2E desta sessão.
- Jornada: https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36093005804/job/107939197995
- Gate final: https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36093005835/job/107941131899

## 7. Matriz da jornada observada
Status: concluído

Interações aproximadas contam cliques/aberturas a partir da superfície indicada, sem digitação; rolagem é indicada separadamente. Não são medições com participantes.

| Etapa/tela | Estado percebido | Ação principal percebida / correta | Interações | Encontrabilidade | Inconsistência / risco |
|---|---|---|---|---|---|
| 1. Prontuário, bloco Notas Fiscais | Saídas provisórias Incorreto | Registrar despesa a identificar, apenas para nova saída | 1 clique após localizar programa; rolagem | Média | Descrições ausentes e título genérico repetido podem dificultar distinguir saída existente |
| 2. Cadastro provisório | Classificação automática | Registrar Despesa após dados conhecidos | 1 abertura; não enviado | Boa no modal | Contexto escolar/programa ausente; tipos finais corretamente ocultos |
| 3. Linha existente → drawer | Pendência Aberta | Visualizar pendência → registrar identificação quando documento chegar | 1 clique; mobile requer scroll | Boa desktop, ruim mobile | Drawer estreito; escola ausente no painel; tipo/valor repetidos |
| 4. Editar dados da despesa | Edição de dados provisórios | Editar dados da despesa | 1 clique no drawer; fechar + reabrir para retomar (+2) | Boa no drawer | Texto promete abertura de Pendência; contexto incompleto |
| 5. Editar detalhes | Motivo e observação editáveis | Ajustar motivo/observação | 1 clique no drawer | Média | Nome genérico; só Salvar/fechar, sem Cancelar explícito |
| 6. Registrar envio / identificação | Primeiro documento; mesmo lançamento | Escolher tipo final e registrar para reanálise | 1 clique no drawer; scroll interno mobile | Boa | Contexto completo; primeiro campo abaixo da dobra mobile; envio não executado |
| 7. Pendências Ativas | Escola deve agir | Registrar envio / identificação | 1 aba + 1 ação | Boa | Lista omite programa/valor; descrição vem de observação |
| 8. Pendências Operacionais / detalhe | Aberta, escola deve agir | Enviar documento e identificar | 1 link + 1 detalhe | Média | Filtro contextual se perde; linhas genéricas; próxima ação no detalhe menos específica |
| 9. Prontuário, registro aguardando | Aguardando reanálise | Botão Aguardando reanálise | 1 clique/Enter | Boa | A aparência clicável foi confirmada |
| 10. Modal Reanalisar | Controlador deve conferir tentativa | Selecionar resultado e Confirmar reanálise | 1 abertura; não confirmado | Boa para ação, média para contexto | Texto pouco agrupado; identidade individual ausente |
| 11. Resolvida ou retorno à escola | Não produzido nesta rodada | Depende do resultado confirmado | Não executado | Não avaliada | Sem aprovação presumida da transição ou feedback |

## 8. Cobertura visual, acessibilidade e limites
Status: parcial

Pontos positivos:
- Estados usam rótulos além de cor.
- Identificação tem ação principal com peso visual superior às edições.
- Cadastro não apresenta tipos finais; observações de classificação evitam preenchimento inventado.
- Identificação explica continuidade no mesmo registro e mostra escola/competência/programa.
- Escape fecha cadastro/edição/identificação/reanálise sem salvar nas aberturas sem mudanças; foco retorna ao acionador nos casos observados.
- Enter aciona Aguardando reanálise; foco visível observado no seletor de resultado e motivo.
- Formulário de identificação móvel permite rolagem até data/observação/link, com ação final acessível.

Ressalvas:
- Fonte pequena e tons secundários discretos tornam textos auxiliares menos destacados; contraste não medido numericamente, portanto não declarar falha/conformidade WCAG.
- Não testados leitor de tela, todas as sequências Tab, zoom 200/400%, teclado virtual real, loading durante escrita, disabled durante salvamento, falhas de gravação ou conflito.
- Ordem do drawer do Prontuário: contexto/dados → motivo/observação/data → próximo passo/ações. O registro aberto não tinha tentativas; não foi comprovada a apresentação de histórico completo nesse drawer.
- Reanálise de registro preexistente examinada; não foi seguida a mesma despesa desde criação até resolução.
- Sucesso, posição/duração do aviso pós-gravação e convergência após reload não executados em Production. Código/testes são evidência complementar, não substituto dessa experiência.
- Nenhuma nova despesa, Pendência, tentativa, alteração, reanálise, migração ou configuração foi gravada. Nenhum deploy realizado.

## 9. Evidências e retomada
Status: concluído

17 capturas desta sessão foram salvas e inspecionadas, numeradas de 01 a 17. Capturas transitórias/blank foram rejeitadas e substituídas antes de aceitação. O repositório é público; capturas com conteúdo operacional real ficaram no pacote local entregue ao usuário, e o handoff remoto preserva achados, passos reproduzíveis e diagnóstico sem publicar essas imagens.

Entregáveis locais: relatório em Markdown, galeria HTML, 17 PNGs, log dos testes e pacote ZIP em outputs/. Não há dependência da conversa para reproduzir NAV-01 ou localizar as causas de UX-01/UX-04.

Retomada recomendada: uma frente de correção delimitada para NAV-01 e UX-04, com regressão por navegação e inspeção 390×844/1440×900; depois, revisão dos textos/identidade. Para certificar gravações, usar ambiente isolado autorizado com o mesmo SHA e dados sintéticos, verificando IDs, mensagens, resolução/retorno e releitura. Não testar escritas em Production nesta tarefa.

Histórico remoto: checkpoint inicial 677d2e7; baseline 8cbdc94; edição fc836a4; mobile d678944; superfícies 7ede119; reanálise 94b4a4f. Cada checkpoint foi commitado diretamente na branch remota, sem pendência de push.
