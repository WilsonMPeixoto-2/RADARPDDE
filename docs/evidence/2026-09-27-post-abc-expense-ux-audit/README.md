# Revisão visual inicial — jornada Despesa a identificar

**Estado:** parcial, observacional, sem correção de produto. **Base:** `main` em `ce0886d1e7a02a711772ab765be0497383bc55ee` (tree `cc3049b3c9c2ffe8d6d704b7a9617f0e404d4476`). A [baseline funcional](../2026-09-27-post-abc-expense-baseline/README.md) foi aprovada por testes locais e UAT Supabase no CI sobre tree idêntico. Esta revisão aborda comunicação visual e UX; não reabre a conclusão de persistência.

## Método e limites

As oito capturas desta pasta foram geradas **nesta rodada**, em Windows, pelo Chromium Playwright a 1440 × 900, com `RADAR_E2E_CAPTURE=1`, ao executar os dois cenários direcionados de `tests/e2e/unidentified-expense-user-journey.spec.js`. Resultado: **2 expected, 0 unexpected**, duração total 12,7 s. As ações da jornada são feitas pelos controles visíveis; a escola e o estado inicial vêm da fixture local. As capturas foram abertas e inspecionadas individualmente antes deste relatório. Nenhuma tela de Production foi usada como evidência visual aqui.

Uma tentativa complementar no navegador interno mostrou o Prontuário em 1215 px, mas seus cliques em ações da tabela não produziram transição; isso **não foi reproduzido no Playwright** e não é classificado como defeito do RADAR. A sessão Chrome de Production pediu novo login. A comparação visual da aba **Pendências Ativas desta unidade** e da fila global permanece pendente de navegação autenticada estável. Acessibilidade por teclado/leitor de tela e contraste medido também não foram verificados.

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
| 8. Pendências Ativas / fila global | Sem captura aceita nesta rodada | **Não avaliada visualmente.** O UAT do CI valida a navegação funcional, mas não fornece evidência visual desta comparação. A sessão de Production no Chrome exige novo login. |

## Achados priorizados, sem alteração aplicada

**UX-01 — encontrabilidade inicial; prioridade média; confiança média.** O CTA de Despesa a identificar aparece depois de rolagem na captura 01b e depende de um valor prévio da bonificação fiscal no render principal (`app.js`, `canAddUnidentifiedExpense`). A fixture já satisfaz essa condição; o percurso visual de uma competência sem bonificação definida não foi homologado ponta a ponta. Investigar se a interface deve explicar o pré-requisito ou tornar a entrada localizável no estado vazio, sem alterar regras funcionais por suposição.

**UX-02 — variação de formato da data; prioridade baixa; confiança alta.** Em 04b a tentativa recebida mostra `2026-09-23`; o restante do contexto usa nomes de mês/ano em português e o drawer usa dia/mês/ano. Padronizar a apresentação da data reduziria a leitura técnica, preservando o valor de dados subjacente.

**UX-03 — clareza da resolução; prioridade média; confiança média.** Em 05, `Correto (Atrasado)` e `Reanálise registrada com sucesso` não dizem diretamente que a Pendência foi encerrada. Considerar feedback que faça a relação entre análise e fechamento, após observar a mesma tarefa em Pendências Ativas para evitar mensagem redundante.

**UX-04 — campos abaixo da dobra; prioridade baixa/média; confiança média.** Em 03, contexto e identificação ocupam a maior parte do primeiro viewport; o rodapé de confirmação permanece visível antes da seção de data e observação. Verificar em teste com usuário se a pessoa percebe que há mais campos antes de enviar. A captura, sozinha, não prova erro de validação ou submissão prematura.

**Riscos de acessibilidade ainda não certificados:** 01b demonstra tooltip por hover; falta verificar exposição equivalente por foco/teclado e leitor de tela. Textos auxiliares cinza/roxo pequenos aparecem em 02b, 03 e 04b; falta medição de contraste e zoom/reflow. Nenhuma conclusão de conformidade WCAG é feita a partir das capturas.

## Próxima verificação

Com sessão autenticada, percorrer **Prontuário → Pendências Ativas desta unidade → Pendências Operacionais → mesma Pendência → voltar ao Prontuário**, capturar cada tela e observar se competência, escola e intenção de reanálise são preservadas. Depois confrontar UX-01 e UX-03 com essa navegação real. Não aplicar melhorias antes de distinguir lacuna de comunicação de preferência estética ou de problema do harness.
