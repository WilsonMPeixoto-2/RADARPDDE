# Engenharia de continuidade e reconciliação pós-hotfixes — design

**Data:** 4 de setembro de 2026  
**Classe:** Especificação de trabalho da auditoria documental  
**Baseline factual da `main`:** `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**PR de auditoria:** #263  
**Escopo:** documentação, rastreabilidade e plano sucessor. Nenhuma alteração funcional, migration, banco ou Production.

## 1. Problema a resolver

O projeto possuía um plano mestre anterior, depois corretamente reconciliado em 03/09/2026 por uma sequência documental culminando no PR #253 e no plano source-first R1–R9. Esse plano incorporou decisões e hotfixes anteriores, marcou tarefas já realizadas e substituiu a fila executável antiga.

Depois do PR #253, novos problemas urgentes foram resolvidos por hotfixes e estabilização funcional em chats distintos. Essas mudanças posteriores alteraram o estado real do produto e, em alguns casos, especializaram ou mudaram premissas do plano R1–R9. A documentação não foi reconciliada de forma integral ao final dessa nova sequência e os documentos de entrada continuaram apontando para fontes concorrentes.

O efeito observado foi perda de continuidade entre chats: um agente novo pode ler documentação historicamente válida porém superada, interpretar uma decisão posterior como defeito e propor regressão.

## 2. Ponto de corte confiável

A reconstrução não começa no início histórico do projeto.

O último checkpoint documental que deve ser tratado como reconciliação válida de mérito é:

- PR #251 — reconciliação do plano mestre contra código, hotfixes e Production;
- PR #252 — fechamento de inconsistências temporais da documentação;
- PR #253 — novo plano remanescente source-first R1–R9, integrado em 03/09/2026 às 17:40.

O PR #253 é o **baseline de planejamento** para esta reconciliação.

A partir dele, a sequência posterior relevante é:

1. PR #254 — hotfix de novo envio e integridade de Pendências;
2. PR #256 — hotfix de próximo ator em transições de Pendências;
3. PR #257 — sincronização de despesa permanente com Encaminhado para Inventariação;
4. PR #258 — vínculo visual NF permanente ↔ inventariação no Prontuário;
5. PR #260 — estabilização funcional de sincronização, persistência, reload, sequência patrimonial e repetição de gesto;
6. PR #261 — fechamento documental da estabilização em Production.

Os números #255 e #259 não correspondem a PRs válidos no repositório e não integram a linha de decisão.

O PR #262 foi abortado, não teve merge e não altera a baseline. Seus arquivos não podem definir regra vigente.

## 3. Regra de precedência

A consolidação deve obedecer à seguinte regra:

1. decisões expressas e comportamento implementado pelos hotfixes posteriores ao PR #253 prevalecem sobre o texto do plano R1–R9 quando houver conflito;
2. entregas de R1–R9 executadas total ou parcialmente pelos hotfixes posteriores devem ser marcadas como absorvidas, parciais ou reformuladas;
3. partes de R1–R9 não tocadas pelos hotfixes permanecem candidatas a pendência, mas sua premissa deve ser revalidada contra o código final da `main`;
4. plano ou documento histórico nunca pode desfazer uma decisão posterior apenas para voltar à ordem inicialmente prevista;
5. testes e documentação são evidência do contrato, não autoridade superior às decisões funcionais posteriores e ao código resultante dessas decisões;
6. qualquer conflito ainda não resolvível deve ser marcado como dúvida, sem alteração unilateral do produto.

## 4. Método de reconciliação

A unidade de análise não será “documento inteiro vigente ou superado”. A unidade será **item do plano / decisão funcional / contrato técnico**.

Para cada fase e subitem de R1–R9, registrar:

- intenção original do PR #253;
- arquivos e componentes que justificavam a tarefa naquele baseline;
- PR posterior que tocou a mesma superfície;
- decisão funcional/técnica introduzida depois;
- código final atual que implementa a decisão;
- testes atuais relacionados;
- estado resultante: `CONCLUÍDO`, `CONCLUÍDO POR CAMINHO DIFERENTE`, `PARCIAL`, `ALTERADO`, `AINDA PENDENTE`, `SUPERADO`, `DÚVIDA`;
- ação no plano sucessor: remover, preservar, reformular ou bloquear até decisão.

Nenhum item entra no plano sucessor apenas porque constava em R1–R9.

## 5. Produtos documentais finais

### 5.1 `START_HERE.md`

Será a única porta de entrada operacional para qualquer novo chat/agente.

Deve conter somente:

- identidade do projeto;
- SHA/base corrente e regra de verificar se mudou;
- ordem obrigatória de leitura;
- qual documento é o plano executável atual;
- quais documentos são históricos;
- regra de precedência dos hotfixes posteriores;
- regra de não iniciar auditoria/implementação com contexto desatualizado.

Todo README e `AGENTS.md` deve apontar primeiro para este arquivo.

### 5.2 `docs/CURRENT_STATE.md`

Estado factual curto do produto:

- baseline funcional;
- Production/Supabase/Vercel quando aplicável;
- regras funcionais vigentes mais sensíveis à regressão;
- frentes concluídas;
- frentes realmente pendentes;
- PRs recentes que formam a baseline.

Não deve virar diário histórico.

### 5.3 `docs/PLAN_TRACEABILITY.md`

Matriz de absorção do plano R1–R9 contra os PRs #254/#256/#257/#258/#260/#261 e o código final.

É a fonte para responder: “por que este item do plano desapareceu, mudou ou continua?”.

### 5.4 `docs/MASTER_PLAN_CURRENT.md`

Será o **único plano executável vigente**.

Deve conter somente trabalho ainda necessário após a reconciliação, já adaptado às decisões posteriores dos hotfixes. Não deve carregar numeração histórica apenas por tradição. Se uma fase antiga tiver sido substituída por solução mais avançada, o plano sucessor parte da solução atual.

## 6. Tratamento dos documentos existentes

Documentos históricos não serão apagados nem reescritos para fingir que sempre disseram a regra atual.

Quando um documento antigo ainda puder ser encontrado facilmente por um novo agente, deve receber no topo um banner inequívoco de uma destas classes:

- `VIGENTE — leia START_HERE primeiro`;
- `HISTÓRICO — não executar`;
- `SUBSTITUÍDO POR <arquivo>`;
- `EVIDÊNCIA DE UM SHA/DATA — não define estado atual`.

`AGENTS.md`, `README.md` e `docs/README.md` não podem manter ordens de leitura concorrentes. Todos devem começar pela mesma porta de entrada.

## 7. Proteções mecânicas de continuidade

Após a reconciliação, o repositório deve possuir validação automática que falhe quando:

- `AGENTS.md`, `README.md` ou `docs/README.md` não apontarem `START_HERE.md` como primeira leitura;
- mais de um documento se declarar “plano executável corrente”;
- um plano histórico voltar a usar linguagem de execução presente sem banner de histórico;
- o `START_HERE.md` apontar para um plano inexistente;
- a baseline declarada ficar incompatível com a versão do plano/estado documentado, conforme regra definida no próprio bootstrap;
- um novo PR funcional relevante for integrado sem exigir atualização da rastreabilidade/estado quando ele altera uma regra protegida ou item do plano.

A validação automática serve para detectar contradição documental. Ela não decide regra de negócio.

## 8. Regras de segurança contra regressão

Durante esta frente:

- nenhuma alteração funcional será feita;
- nenhuma migration será criada ou aplicada;
- nenhuma regra será alterada para “alinhar” código a documento antigo;
- o PR #262 permanece abortado e não será reaproveitado como fonte de verdade;
- conflitos encontrados serão resolvidos pela cronologia de decisões e implementação posterior, ou marcados como dúvida;
- o comportamento homologado posteriormente pelo usuário prevalece sobre expectativa histórica conflitante;
- o plano sucessor só será criado depois de a matriz R1–R9 × hotfixes estar fechada.

## 9. Critério de conclusão

A engenharia de continuidade só pode ser considerada pronta quando:

1. cada item de R1–R9 tiver destino explícito e rastreável;
2. cada PR posterior ao #253 estiver classificado quanto ao impacto no plano e nas regras;
3. existir uma única porta de entrada;
4. existir um único plano executável vigente;
5. READMEs e AGENTS não oferecerem caminhos concorrentes;
6. documentos históricos relevantes estiverem claramente marcados como históricos/substituídos;
7. houver checagem automática da estrutura de continuidade;
8. um novo chat conseguir reconstruir o estado apenas seguindo `START_HERE.md`, sem depender da memória de conversas anteriores.

## 10. Resultado esperado

O fluxo futuro deve ser:

```text
novo chat/agente
→ START_HERE.md
→ verificar baseline atual
→ CURRENT_STATE.md
→ PLAN_TRACEABILITY.md quando precisar entender origem
→ MASTER_PLAN_CURRENT.md para executar trabalho pendente
→ código/PRs/testes específicos da tarefa
```

Nenhum agente deve escolher livremente qual handoff, plano antigo ou ADR ler primeiro para descobrir “o que fazer agora”.
