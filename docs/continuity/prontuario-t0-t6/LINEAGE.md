# RADAR PDDE — genealogia e cobertura de decisões T0–T6

**Adendo de encerramento (26/11/2026):** [D025](D025_ENCERRAMENTO_T0_T6.md) registra aceite visual do resultado atual e fechamento do ciclo, não recuperação das seis pranchas originais nem revisão integral de todas as fontes. G001–G003 permanecem lacunas históricas; G004 tem aceite atual registrado, sem comprovar comparação histórica de golden/pranchas. As fotografias quantitativas e filas abaixo são históricas, não bloqueios automáticos à nova etapa.


**Índice factual de proveniência — 20/11/2026.** [Registro estruturado](lineage.json) | [Decisões e colaborações](registry.json) | [Checkpoint](CHECKPOINT.md). Este documento **não substitui** o contrato funcional nem permite declarar o projeto integralmente conhecido.

## O problema diagnosticado

O registro inicial continha 19 decisões e 22 contribuições, mas catalogar contribuições não cobria todos os requisitos aprovados. Exemplo demonstrado: a especificação visual de 13/11 ainda exigia justificativa/declaração em retificação e restringia exclusão com histórico e estado Inventariada. A flexibilização de 14/11 e a diretriz de 15/11 superaram essas proibições. **A especificação antiga não é integralmente falsa nem integralmente vigente.** É preciso associar cada requisito à sua linhagem e ao código do SHA.

Outro caso: o candidato Argon antigo continha `src/application/operational-correction-service.js`; no HEAD da Release 1 o arquivo **não existe**. O caminho efetivo é `src/application/operational-correction-client.js` + `src/integration/operational-correction-dialog.js` + migration SQL `20261114000100_operational_correction_contract.sql`. A ideia subsiste, mas o caminho da implementação mudou. Não reutilizar um arquivo antigo apenas por seu nome aparecer num relatório.

## Fotografia do inventário

| Dimensão | Quantidade | Interpretação correta |
|---|---:|---|
| Fontes identificadas | **25** | Arquivos versionados na release e em branches externas, mais uma referência a imagens ausentes |
| Fontes examinadas por inteiro | **4** | O restante não é homologado por mera listagem |
| Fontes examinadas parcialmente | **10** | Existem seções a reconciliar |
| Fontes apenas indexadas | **10** | É necessário leitura de mérito antes de classificar cada ideia |
| Pranchas não recuperadas | **1 referência** | Seis imagens descritas, sem arquivos originais na branch |
| Requisitos/propostas rastreados | **67** | Primeiro inventário atômico; **não** equivale a todos os requisitos históricos |
| Lacunas abertas | **4** | São parte da verdade de execução, não erro a ocultar |

## Linha evolutiva confirmada

| Marco | Autoridade no momento | Consequência e precedência |
|---|---|---|
| 13/11, estudo visual | [S001](lineage.json) | Direção editorial, matriz e seis pranchas; guardas então vigentes apareciam no design |
| 14/11, flexibilização | [S002](lineage.json) | Editar/excluir, inclusive históricos e patrimoniais, coordenando efeitos; observação opcional na correção e exclusão |
| 14–15/11, contrato e plano T0–T6 | S003–S005 | Agrupa design, domínio e banco; define granularidade de `clear_analysis`, `delete_invoice`, `clear_item_history`, `delete_context` |
| 15–20/11, testes e revisões paralelas | S007/S010–S024 | Seleções e reparos de Antigravity/Manus/Gemini, provas local Docker, contraprovas; fontes externas preservadas por commit SHA |
| 20/11, releases sequenciais | S006 | R1=T0–T3, R2=T4, R3=T5; T6 aplicado a cada entrega com aceite e publicação independentes |

## Esclarecimento posterior de 25/11 — D024

S028 / R074: D024 esclarece exclusivamente o alcance documental de D022: profissionalizar o fluxo agêntico existente SharePoint/OneDrive → análise cruzada → Pendências e registros autorizados no RADAR → conferência de cobertura e resultados. Não desenvolver extrator local, importador JSON, página independente ou módulo documental neste ciclo; experimentos são referências exploratórias. Evolução para usuários exige plano e aprovação prévios; planejamento agêntico posterior à consolidação T6. Sem novas permissões. R070 preserva a evidência histórica do piloto; I022-03 foi substituída por I024-01. [Decisão](D024_ESCOPO_AUDITORIA_AGENTICA.md).

## Contradições e falsas redescobertas a evitar

| Ideia de origem | Regra/decisão superveniente | O que fazer hoje |
|---|---|---|
| Retificação exigia justificativa/declaração textual (§5.9 S001) | S002/S004 — correção sem narrativa nem confirmação textual obrigatória, com autorização e confirmação destrutiva adequadas | **Não restaurar** obrigatoriedade no T2 (R053) |
| NF inventariada ou com histórico não podia ser excluída | S002/S004 — exclusão causal transacional autorizada, com dependentes exatos, não DELETE irrestrito | Preservar safety/RLS; validar T3 (R054/R028) |
| T0–T6 precisavam terminar antes da única publicação | S006 — releases independentes com T6 por etapa | R1 agora, R2 e R3 depois (R055/R049) |
| Observação obrigatória no verdadeiro **Novo envio** (§5.7 S001) | A flexibilização de **correção/exclusão** não é autorização para eliminar dado do evento de envio | **Preservar** diferença semântica (R061/R040) |
| `operational-correction-service.js` existia no primeiro candidato | Cliente e migration SQL são arquitetura efetiva atual | Conferir árvores atuais, não colar arquivo de branch histórica (R044) |
| Plano Mestre do PR #515 com cinco complementos | Propostas já triadas C013–C017 e C019–C022; algumas adiadas para T4/T5 | Não duplicar escopo nem tratar proposta como código novo |

## Como usar antes de implementar

1. Localizar o requisito pelo `T0T6-Rxxx` no [lineage.json](lineage.json). Conferir `state`, `sourceIds`, `decisionIds` e limites do campo `evidence`.
2. Abrir a **versão exata** de cada fonte no GitHub: documentos externos estão fixados pelo SHA do commit e pelo hash do blob, não pelo nome mutável da branch.
3. Abrir o código e os testes reais da release e verificar GitHub Actions do HEAD atual; referências a testes não significam que o cenário passou naquele SHA ou no ambiente institucional.
4. Se identificar regra nova, registrar transição na decisão/contrato; se a ideia era antiga, atualizar `state` e a evidência do requisito, em vez de produzir um segundo plano.
5. No fechamento de um chat, atualizar [CHECKPOINT.md](CHECKPOINT.md), registrar SHA remoto e próximos itens; **não alegar que pendências são implementações concluídas**.

## Trabalho ainda necessário para domínio histórico integral

- **Revisão detalhada das 20 fontes restantes** e identificação de requisitos ainda não catalogados; cada trecho deve resultar em requisito, relacionamento ou descarte motivado.
- **Recuperação das seis pranchas originais**. Um golden alterado ou screenshot da execução não substitui uma imagem conceitual aprovada.
- **Reconciliação de decisões exclusivas de chats e sandboxes anteriores**: só há evidência verificável quando seu conteúdo alcançar o repositório. O presente censo não pretende demonstrar que isso já ocorreu.
- **Validação real da T1** e das demais jornadas que exigem aceite visual; backend/CI verdes não encerram esse critério.

**Critério de conclusão futura do censo:** nenhuma fonte relevante fica em `indexed-pending-review` ou `partial-review` sem decisão de mérito; cada requisito tem origem, regra vigente, status no código/teste, prova por SHA e próximo passo; divergências são resolvidas por decisão explícita. Até lá, o estado da genealogia é **EM RECONCILIAÇÃO**.
