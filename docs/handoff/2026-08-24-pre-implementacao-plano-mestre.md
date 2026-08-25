# RADAR PDDE — Handoff canônico pré-implementação do plano mestre de correções

**Data de referência:** 24 de agosto de 2026
**Classe documental:** Canônico — continuidade técnica, funcional e decisória
**Baseline analisado:** `4542bbfdba7b4a6073445c8f3ea6ceafbb660dba`
**Situação:** diagnóstico concluído; plano aprovado como base; nenhuma correção implementada
**Documento integral em Word:** [`../reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](../reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx)
**Plano textual executável:** [`../superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](../superpowers/plans/2026-08-24-plano-mestre-correcoes.md)

> Este é o primeiro documento a ler ao retomar o projeto depois de 24/08/2026. Ele não autoriza execução automática de migration, reparo de dados, merge ou publicação. Antes de atuar, confirme `main`, Vercel e Supabase ao vivo.

## 1. Estado exato desta frente

Esta frente nasceu de três conjuntos de relatos reais:

1. lentidão ao salvar despesa e duplicação depois de clique repetido;
2. impossibilidade de consolidar uma análise mensal por mensagem sobre Consulta Assessoria;
3. dificuldade crescente para localizar, compreender e operar a fila transversal de Pendências.

A investigação percorreu código, contratos, documentação, testes, GitHub e consultas somente leitura no Supabase Production. O resultado não foi uma alteração de produto, mas um plano sequencial para corrigir defeitos reais sem desfazer regras de negócio corretas.

No encerramento deste handoff:

- nenhum arquivo funcional foi alterado;
- nenhuma migration foi criada ou aplicada;
- nenhum dado de Production foi escrito;
- nenhum deploy foi iniciado;
- nenhum PR de correção foi aberto;
- o PR #195 permanece expressamente fora desta frente, por decisão do responsável pelo produto;
- a única mudança pretendida neste checkpoint é documental e de versionamento do diagnóstico/plano.

## 2. Baseline verificado

### 2.1 GitHub

```text
Repositório: WilsonMPeixoto-2/RADARPDDE
main: 4542bbfdba7b4a6073445c8f3ea6ceafbb660dba
commit curto: 4542bbf
origem: merge do PR #194
```

O PR #195 foi fechado sem merge, tratava de outro assunto e não deve ser usado como código, dependência, precedente ou fonte para esta correção.

### 2.2 Supabase Production

```text
Projeto: scnryinorqeucbfkioxo
Nome: RADAR PDDE 2026
Estado observado: ACTIVE_HEALTHY
PostgreSQL: 17.6.1
```

Snapshot somente leitura confirmado durante o diagnóstico:

| Entidade/estado | Quantidade |
|---|---:|
| Avaliações mensais | 113 |
| Despesas/notas cadastradas | 17 |
| Históricos administrativos | 1.562 |
| Pendências totais | 22 |
| Pendências abertas | 19 |
| Aguardando reanálise | 2 |
| Canceladas | 1 |
| Resolvidas | 0 |
| Tentativas de envio | 5 |
| Contatos registrados | 0 |

Concentração observada das pendências ativas:

- 12 registros na escola `04.10.001`, R.A. 10, Controladora Juliana Barbosa;
- 9 registros na escola `04.30.002`, R.A. 30, Controladora Mônica Chagas.

Esses números são evidência datada, não constantes do produto. Reconsultar o remoto antes de qualquer decisão dependente de contagem.

## 3. Conclusões do diagnóstico

### 3.1 Despesa lenta e lançamento duplicado

**Classificação:** defeito real, não simples erro de usuário.

O formulário permite mais de uma submissão enquanto a primeira ainda está em andamento. Cada execução de uma inclusão gera um identificador novo; por isso, dois cliques podem produzir duas despesas legítimas para o backend. O sistema também não oferece feedback imediato suficientemente forte para impedir que a pessoa repita o gesto diante da demora percebida.

Achados no SHA analisado:

- `app.js`, em `salvarDadosNota()`, não possui guarda síncrona de operação em andamento;
- Enter e clique podem alcançar o mesmo fluxo mais de uma vez;
- `InvoiceService.save()` gera um novo ID em cada inclusão;
- a edição chega ao caminho de update/histórico mesmo quando os campos aparentam não ter mudado;
- a dispensa de reler `administrativeLogs` em `invoice:save` existe apenas na extensão opcional de desempenho;
- se essa extensão não se instalar, o núcleo pode voltar a reler 1.562 históricos e executar atualização visual ampla.

Consequências:

- clique duplo comum precisa ser contido imediatamente no cliente;
- retry de rede, duas abas e perda de resposta exigem idempotência no servidor em etapa própria;
- duas despesas intencionalmente iguais continuam permitidas;
- nunca deduplicar por descrição, valor, nota, horário ou conteúdo semelhante.

### 3.2 Consolidação e Consulta Assessoria

**Classificação:** defeito de coerência derivada confirmado em quatro contextos; a mensagem de consolidação está reagindo ao banco vazio, não inventando a condição.

Contextos confirmados:

| Escola | Competência | Programa |
|---|---|---|
| `04.10.002` | `2026-03` | Educação Conectada |
| `04.10.002` | `2026-08` | PDDE Básico |
| `04.31.001` | `2026-08` | PDDE Básico |
| `04.31.804` | `2026-05` | PDDE Básico |

Nos quatro casos:

- Consulta Assessoria está vazia na avaliação;
- não existe Nota Fiscal de serviço no contexto;
- a análise de Assessoria aparece como `Não analisado`;
- o estado real esperado pela regra é `Não se aplica`.

O código já possui `InvoiceService.syncServiceRequirement()`, que agrega a regra de Assessoria a partir das NFs. Entretanto, `VerificationService.setBonification()` possui uma transição separada capaz de limpar Assessoria quando Nota Fiscal sai de N/A para Sim/Não sem obrigatoriamente executar novamente o cálculo canônico.

A correção não é mandar a consolidação ignorar o vazio. A correção é garantir uma única verdade:

```text
sem NF de serviço
→ Consulta Assessoria = Não se aplica
→ interface mostra Não se aplica
→ consolidação lê Não se aplica
```

O caso `04.10.002 / março / Educação Conectada` deve voltar a consolidar se todos os demais itens de bonificação estiverem preenchidos.

### 3.3 Suposto paradoxo entre pendência, bonificação e análise

O diagnóstico não autorizou transformar despesa `A identificar` automaticamente em `Não` na bonificação ou `Incorreto` na análise.

Permanecem válidas as dimensões independentes:

- bonificação;
- análise técnica;
- existência/estado da pendência;
- próxima ação operacional.

Portanto:

- `Sim + Incorreto + pendência` pode ser um estado legítimo;
- pendência ativa, por si só, não deve impedir consolidação;
- `Não analisado`, por si só, não deve impedir consolidação;
- novo envio inicia reanálise e não resolve automaticamente;
- a mesma pendência equivalente não deve ser aberta duas vezes;
- registrar algo `A identificar` não deve fabricar uma análise que o usuário não realizou.

O bloqueio observado nas imagens de março é explicado pela Consulta Assessoria vazia. Não há evidência de que o usuário tenha causado o incidente apenas por ter marcado `Sim` ou deixado a análise como `Não analisado`.

### 3.4 Prontidão de módulos críticos

`RadarProductExtensionsReady` confirma principalmente que os scripts terminaram de carregar. Ele não comprova que cada patch funcional conseguiu se instalar.

Além disso:

- a extensão de pendência atômica tenta se anexar por polling a cada 20 ms;
- a extensão de desempenho usa padrão equivalente;
- as tentativas terminam depois de dez segundos;
- em inicialização lenta, o script pode existir sem a função crítica estar operacional;
- uma falha na cadeia sequencial de scripts também pode impedir módulos posteriores.

A correção deve introduzir prontidão operacional individual e seletiva:

- falha em módulo funcional crítico bloqueia somente controles dependentes;
- falha em diagnóstico, métrica ou estética permanece fail-open;
- um módulo auxiliar com falha não impede a instalação de módulo crítico posterior;
- não aumentar apenas o timeout fixo.

### 3.5 Gestão de Pendências

**Regra de negócio preservada:** ADR-044 continua correta. A fila deve mostrar todas as competências e não pode voltar a seguir implicitamente a competência global.

O problema atual é de gestão do trabalho:

- lista plana e cartões altos/repetidos;
- escola, competência, documento, status e próxima ação sem hierarquia suficiente;
- R.A. sem filtro dedicado;
- Controlador escondido em `Mais filtros`;
- seletor nativo de escola ruim no Android/mobile;
- faixas de tempo pouco aderentes ao volume real;
- muitas ações expostas simultaneamente;
- ações e regras espalhadas entre renderização base, extensões e `MutationObserver`;
- modal de reanálise mistura contexto, último envio e decisão em texto corrido;
- o detalhe de pendência cancelada ainda usa título como `Erros atuais`;
- a página escolhe inicialmente `Abertas` sempre que existe qualquer aberta, mesmo quando o perfil possui trabalho em `Aguardando reanálise`;
- a projeção da lista e a projeção operacional não usam a mesma data-base depois de reabertura/reanálise incorreta;
- o domínio PEND-05 permite reabrir Resolvida ou Cancelada, mas a interface só expõe Resolvida.

Decisões propostas e preservadas pelo plano:

- todas as competências continuam visíveis;
- abas continuam representando status; não criar filtro de status redundante;
- `Minha carteira` pode ser atalho porque a responsabilidade deriva de `schools.controller_id`;
- filtro dedicado de R.A. pode usar `schools.ra`;
- não criar `Minha R.A.` enquanto não existir relação formal usuário ↔ R.A.;
- agrupamento por escola será opcional, não padrão inicial, até comprovar que a prioridade cronológica global não se perde;
- não criar ainda ações ambíguas no cabeçalho do grupo, como contato/prontuário sem competência/pendência definida;
- cada cartão deve expor uma ação principal; secundárias vão para menu contextual;
- ação destrutiva fica protegida e não compete com a ação principal.

## 4. Pontos técnicos confirmados

Os números de linha abaixo pertencem ao SHA `4542bbf` e podem se mover depois de alterações.

| Ponto | Local principal | Uso no plano |
|---|---|---|
| Submit sem trava | `app.js` próximo de 10295 | PR 1 |
| Entidades marcadas como alteradas | `src/application/invoice-service.js` próximo de 274 | PR 1/8 |
| Nova ID a cada inclusão | `src/application/invoice-service.js` próximo de 339 | PR 1/5 |
| Releitura remota | `src/infrastructure/data-service.js` próximo de 389 e 542 | PR 1/8 |
| RPC de salvamento | `src/infrastructure/supabase-repository.js` próximo de 646 | PR 5/8 |
| Transição que limpa Assessoria | `src/application/verification-service.js` próximo de 288 | PR 2 |
| Incorreto exige pendência | `src/application/verification-service.js` próximo de 329 | preservar/PR 3 |
| Consolidação lê bonificação | `src/domain/fluxo-operacional.js` próximo de 81 | preservar |
| Instalação expira | `src/integration/atomic-analysis-pendency.js` próximo de 392 | PR 3 |
| Ready comprova scripts, não instalação | `src/integration/product-extensions-bootstrap.js` próximo de 79 | PR 3 |
| Aba inicial por volume | `src/integration/task-9-pendencias-page.js` próximo de 108–118 | PR 6 |
| Data-base divergente | `src/domain/pendencias-view-model.js` próximo de 222–254 | PR 6 |
| Tempo operacional canônico | `src/domain/operational-projection.js` próximo de 67–82 | PR 6 |
| Reabertura recusada pela interface | `src/integration/task-10-11-pendency-actions.js` próximo de 436–445 e 493–505 | PR 6 |

## 5. Sequência aprovada como base

O plano possui uma Etapa 0 e nove PRs, porque a reforma visual de Pendências foi dividida em 7A e 7B.

| Ordem | Entrega | Objetivo |
|---:|---|---|
| 0 | Congelar baseline | Registrar SHA, consultas, comandos, métricas e smoke matrix; sem alterar código/dados |
| 1 | Contenção imediata | Trava síncrona, `Salvando…`, bloqueio de Enter/cliques e dispensa de reler históricos no núcleo |
| 2 | Efeitos canônicos | Regra compartilhada da Assessoria, planejador de efeitos e no-op verdadeiramente semântico |
| 3 | Prontidão crítica | Registro de instalação por módulo, espera real e isolamento entre crítico e auxiliar |
| 4 | Reparo de dados | Corrigir somente os contextos aprovados que ainda satisfizerem o predicado auditado |
| 5 | Idempotência | Chave por intenção, reserva atômica, compatibilidade gradual e testes concorrentes |
| 6 | Contrato da fila | Tempo operacional canônico, prioridade por trabalho, reabrir Cancelada e action model único |
| 7A | Fila e filtros | Minha carteira, R.A., Controlador, escola pesquisável, tempo na etapa, cards e ação principal |
| 7B | Detalhe e reanálise | Drawer/modal estruturados, divulgação progressiva e agrupamento opcional por escola |
| 8 | Desempenho completo | Resposta autoritativa ampliada, remoções explícitas, aplicação incremental e métricas centrais |

### 5.1 Por que o no-op ficou no PR 2

O sequenciamento anterior colocava o no-op no PR 1. A análise integrada mostrou que isso criaria retrabalho e risco: uma edição visualmente idêntica pode precisar reconciliar Assessoria, bem derivado, consolidação ou outro efeito persistente.

Assim, o PR 1 contém somente o incidente. O PR 2 primeiro cria uma função pura compartilhada e um planejador de efeitos; somente então retorna `unchanged: true` quando despesa, bem, avaliação, Assessoria, consolidação e demais efeitos já estiverem corretos.

### 5.2 Gates obrigatórios

- PR 4 somente após PR 2 publicado e validado.
- PR 7A/7B somente após PR 6 estabilizar o modelo funcional.
- PR 8 somente após PR 5 concluir idempotência e os testes cobrirem `deleted_asset_id`.
- A guarda de envio do PR 1 permanece em todas as etapas posteriores.
- A regra pura/planejador do PR 2 é reutilizada pelo no-op e pela resposta incremental do PR 8.
- A chave do PR 5 entra na resposta do PR 8 sem ser redesenhada.
- `PendencyQueueModel` e `PendencyActionModel` do PR 6 são consumidos por 7A/7B; a interface não replica as regras.

## 6. Ressalvas importantes de implementação

### 6.1 Idempotência não deduplica conteúdo

A chave nasce uma única vez por intenção e é reutilizada em retry, perda de resposta ou repetição da mesma operação. Duas intenções reais recebem chaves diferentes e continuam podendo criar despesas iguais.

### 6.2 Resposta atual da RPC ainda não é completa

O serviço trabalha com despesa, bem, avaliação e log, mas a resposta atual não entrega todo o histórico criado. Quando remove um bem, a RPC devolve `deleted_asset_id`, porém o DataService atual não interpreta automaticamente esse escalar como remoção da coleção local.

Ativar resposta totalmente autoritativa antes de cobrir esse caso pode deixar o frontend com bem removido ainda em memória. Por isso a ampliação completa ficou no PR 8.

### 6.3 Histórico administrativo

O objetivo imediato é não reler 1.562 históricos depois de `invoice:save`. Não transformar toda a auditoria do sistema em lazy loading nesta frente. Timeline, alertas, auditoria e exportações continuam preservados.

### 6.4 Reparação dos quatro contextos

O reparo deve aceitar entre zero e quatro linhas elegíveis, porque alguma pode ter sido corrigida legitimamente antes da execução. Deve abortar se surgir divergência fora do conjunto autorizado ou se qualquer linha não satisfizer mais:

```text
Consulta Assessoria vazia
AND nenhuma NF de serviço no contexto
```

Não sobrescrever valor não vazio. Executar consulta antes/depois, snapshot e auditoria dentro de operação controlada.

## 7. Testes reproduzidos

Conjunto principal:

```bash
node --test \
  tests/pendency-cancelled-reopen.test.js \
  tests/pendencias-view-model.test.js \
  tests/unit/pendency-service-access.test.js \
  tests/unit/pendency-reanalysis-roles.test.js
```

Resultado observado: 22 aprovados, zero falhas.

Conjunto ampliado:

```bash
node --test \
  tests/pendency-cancelled-reopen.test.js \
  tests/pendencias-view-model.test.js \
  tests/unit/pendency-service-access.test.js \
  tests/unit/pendency-reanalysis-roles.test.js \
  tests/unit/operational-write-diagnostics-integration.test.js
```

Resultado observado: 31 aprovados, zero falhas. Os 31 são os mesmos 22 mais nove testes de integração da instrumentação. Nunca registrar apenas a contagem sem o comando/arquivos usados.

Testes ainda necessários estão descritos no plano. Entre eles:

- clique duplo e Enter + clique;
- duas requisições concorrentes com a mesma chave;
- perda de resposta depois do commit + retry;
- edição visualmente igual com derivado coerente e incoerente;
- zero, uma e várias NFs de serviço;
- carga inicial acima de dez segundos;
- falha auxiliar sem bloquear módulo crítico posterior;
- filtros combinados da fila e matriz de ações por estado/perfil;
- snapshots mobile 360, 390 e 412 px e navegação por teclado/leitor de tela.

## 8. Próximo passo exato

Antes de escrever código, confirmar que esta documentação foi integrada à `main`. Depois:

1. revalidar o SHA da `main`, deployment de Production e Supabase;
2. abrir branch isolada para **PR 1 — Contenção imediata**;
3. não antecipar no-op, migration, idempotência ou redesign da fila no PR 1;
4. escrever os testes de submit repetido;
5. implementar guarda síncrona e feedback;
6. declarar no núcleo de `invoice:save` a dispensa de refresh de `administrativeLogs`;
7. executar validação proporcional e smoke de inclusão/edição em desktop e celular;
8. abrir PR com evidências, risco e reversão;
9. parar no gate e comprovar estabilidade antes do PR 2.

## 9. Arquivos para retomada

Ler nesta ordem:

1. [`../../AGENTS.md`](../../AGENTS.md);
2. [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
3. este handoff;
4. [`../superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](../superpowers/plans/2026-08-24-plano-mestre-correcoes.md);
5. [`../reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](../reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx);
6. [`../decisions/ADR-044-pendencias-passivo-transversal.md`](../decisions/ADR-044-pendencias-passivo-transversal.md);
7. [`../decisions/ADR-046-escritas-operacionais-incrementais-e-observaveis.md`](../decisions/ADR-046-escritas-operacionais-incrementais-e-observaveis.md);
8. [`../architecture/avaliacao-mensal.md`](../architecture/avaliacao-mensal.md);
9. [`../architecture/product-extensions-load-order.md`](../architecture/product-extensions-load-order.md);
10. [`../reference/TEST_GOVERNANCE.md`](../reference/TEST_GOVERNANCE.md).

## 10. Integridade do Word

```text
Arquivo: docs/reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx
SHA-256: a83774ffaaf39de19a5fbe5dc7244d0ae60950ce8fa2bdec0d82214503412c95
Páginas renderizadas na validação: 33
Imagens incorporadas: 13
Falhas de integridade ZIP/OOXML: 0
Achados de acessibilidade de severidade alta: 0
```

O Word contém o relatório completo em linguagem não técnica, wireframes, mapa dos arquivos, critérios de aceite, sequência dos PRs e as imagens originais fornecidas pelos usuários.

## 11. Regra de continuidade

Se este trabalho for retomado por outro chat, agente ou ferramenta, não recomeçar pela hipótese dos usuários nem executar correções oportunistas. Partir do SHA efetivo, comparar com este checkpoint, reproduzir somente as evidências que ainda forem materiais e seguir os gates na ordem.

Se `main` já tiver avançado, este documento continua sendo evidência do diagnóstico em `4542bbf`; qualquer divergência posterior deve ser reconciliada explicitamente, não apagada.
