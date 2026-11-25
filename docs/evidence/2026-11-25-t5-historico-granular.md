# T5 — correção granular de histórico e patrimônio

**Classe:** evidência de candidata; não é autorização de publicação.
**Data:** 25/11/2026.
**Base publicada:** `7523782bdc572a631783deeae2ea59be048dd725`, PR #564.
**Branch:** `feat/t5-historico-granular-20261125`.

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

## Ativação e limites

`RADAR_T5_GRANULAR_HISTORY_RELEASE_ENABLED` permanece OFF por padrão e depende da cadeia T0–T4. O piloto de teste exige Supabase loopback e autorização de ambiente descartável. A publicação do #564 não autoriza automaticamente aplicar a migration 69 ou publicar esta candidata. Banco institucional permanece com as 68 migrations já confirmadas; os três alertas patrimoniais preexistentes não são fixtures nem alvos desta entrega.

As oito obrigações de UI T5 passam a `candidate`, com caminhos concretos no mapa D020. Código candidato, teste aprovado, inspeção visual, aceite do proprietário e publicação são estados distintos. O encerramento depende das provas do candidato e da revisão humana definida no projeto.
