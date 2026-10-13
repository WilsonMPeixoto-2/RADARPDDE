# Diagnóstico antes de correção — checkpoint13/10

Origem: crítica externa do candidato4c737a73 (PR438, comentário6135336904).
Revisão exclusiva pelo agente principal, sem subagentes. Nenhum merge/deploy.

| Caso | Classificação sustentada | Evidência / decisão |
|---|---|---|
| Escola sem Pendências desaparece depois de limpar | Defeito real | CI38325720836/38325720799 e navegador Auth local:ESC-OTHER ausente após limpeza. RED/GREEN preservados. |
| Somente escola já selecionada acrescentada ao seletor | Correção anterior insuficiente | A validação anterior omitiu a sequência com zero registros; dados acumulados locais mascararam a falha. |
| Duas opções obrigatórias no E2E | Contrato superado pela decisão explícita | Catálogo da sessão agora é fonte de opções; substituído count2 por igualdade de TODOS os IDs desse catálogo. Demais expectativas da jornada mantidas. |
| Dois controles unitários exigiam ausência de escola sem registros | Contrato superado | Reconciliados com consulta escolar incluindo resultado vazio; proveniência441 mantida. |
| Seis sessões baseline, opacity0 | Inconclusivo; comparação inválida | Run38325720764 falha em signIn/linha46 durante Promise.all das seis sessões, antes da coleta e rodadas. Candidate success não permite deltas. Sem modificar asserção. |
| Unitário retry Realtime,1 tentativa em vez de2 | Inconclusivo, suspeita temporal do harness | Suite completa1359/1360; teste espera15ms de relógio real, durou42ms. Nenhum runtime Realtime alterado nesta rodada. Investigar antes de mudar produto/teste. |

## Decisão funcional

Pendências permite consultar qualquer escola do catálogo disponível à sessão,
inclusive zero registros, sem depender de seleção anterior. Opções vêm do mesmo
catálogo utilizado por navegação/modelo; a tabela schools continua limitada pela
RLS vigente. Registros sem escola no catálogo não acrescentam opção. Não houve
mudança de autorização. Contrato explícito no PRODUCT_SURFACE_CATALOG, S-04.

O código substitui a união registros+escola-selecionada pelo catálogo. Não introduz
novo estado, timer, controller ou dependência. Teste Auth ampliado percorre ambas
as escolas, limpar, chip, Voltar/Avançar, reload e competência:3/3 jornadas passaram.
16 controles dirigidos passaram, inclusive seleção manual não autorizada mantendo
redirecionamento para Carteira. Captura Auth de reseleção com zero registros revista.

## Estado ainda não certificado

Regressão desktop inicial:12pass/1skip/1falha no count2 obsoleto; a asserção já foi
reconciliada, ainda precisa repetição. Unitário amplo teve uma falha temporal acima;
não declarar suíte toda verde. O teste adicional de autorização foi executado nos
16dirigidos depois dessa rodada ampla. CI do próximo commit também é necessária.

A regra de classificação já existe em TEST_GOVERNANCE, seção3. Não é necessário
criar outro método concorrente: aplicá-la por escrito nesta tabela e no handoff.
O defeito de seletor foi confirmado antes de corrigir. As outras falhas não serão
convertidas em defeitos de produto ou sucessos sem contraprova. Performance segue
aberta; comparação anterior inválida não será usada para atribuir ganho.

## Contraprovas posteriores ao checkpoint730d5d99

- E2E de navegação reconciliado:13pass/1skip mobile,38,3s; limpar/detalhe/retorno
  Prontuário/exportação continuam aprovados. Sem alteração do produto adicional.
- Retry:12/12 passam isolados. Contraprova controlada usa o harness e controller
  reais com event loop ocupado50ms:1tentativa no prazo original,2após drenar timers.
  Classificação: dependência de relógio real no teste, não ausência de retry.
  Outra rodada ampla revelou a mesma fragilidade no caso stale (1360/1361).
  Os três testes de retry (falha, falha repetida, stale) agora governam o relógio
  e drenam microtasks, verificando primeira tentativa, segunda e ausência de loop.
  Nenhum controller/runtime foi modificado. Nova rodada ampla ainda em execução.
- Run38355640291 falhou ANTES dos E2E: Docker toomanyrequests/Data limit exceeded,
  depois bind54322/address already in use. Classificação: preparação/infraestrutura;
  não atribuir ao seletor. Não foram alteradas regras nem removidos gates.
- Artefato da baseline38325720764 teve download recusado Forbidden neste executor.
  Logs delimitam a etapa, mas não explicam opacity0. Nova comparação38355640318
  está executando as duas variantes. Não usar um eventual rerun verde para inventar
  causa do vermelho anterior; registrar ambos. Nenhum teste de opacidade alterado.

Resultado final local:1.361/1.361 unitários, zero skips/falhas,44,75s. A rodada
inclui os16controles dirigidos. Mantidas as evidências anteriores vermelhas;
a causa temporal dos três testes foi tratada no harness, sem relaxar tentativas.
3/3 jornadas Auth e13E2E de navegação continuam válidos: runtime idêntico ao730d5d99.
CI observada neste checkpoint:15success/1failure de preparação/5em andamento.
Não é status final; consultar runs ao retomar. Comparação38355640318 pendente.
