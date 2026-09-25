# Auditoria UX — Despesa a identificar

Status: EM ANDAMENTO

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
Status: não iniciado

## 3. Auditoria visual e navegação
Status: não iniciado

Capturar a interface renderizada e registrar por etapa: tela → estado percebido → ação principal percebida → ação correta → interações → encontrabilidade → inconsistências → risco humano. Comparar Prontuário, Pendências Ativas desta unidade e Pendências Operacionais.

## 4. Acessibilidade e responsividade
Status: não iniciado

## 5. Achados, limites e retomada
Status: parcial

Nenhum achado de UX registrado ainda. Próximo passo: baseline do PR e acesso read-only à interface real. Feedback pós-gravação e transições mutáveis não serão executados em Production; exigem evidência existente ou ambiente seguro.

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
