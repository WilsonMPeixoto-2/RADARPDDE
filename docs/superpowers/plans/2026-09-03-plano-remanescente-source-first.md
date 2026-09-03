# Plano remanescente source-first — pós-hotfixes e pós-reauditoria do código

**Data:** 3 de setembro de 2026  
**Classe documental:** Canônico — plano executável corrente  
**Baseline de planejamento:** `main` em `18150cc9ef7e15e2e777041fce541b847af517e1`  
**Último baseline funcional:** `75237c6ec5c22e8f7be9eb39fd21481f6d608010` (PR #249)  
**Auditoria-fonte:** `docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`

> **Este plano substitui a sequência executável do plano de 26/08.** O documento de 26/08 permanece histórico/canônico para contexto, riscos, testes e decisões de sua época, mas seus números PR3/PR5/PR6/PR8/PR9 não devem ser usados como fila cega.

## 1. Objetivo

Concluir somente a dívida técnica/funcional que ainda existe no código atual, preservando integralmente:

- entregas já concluídas;
- soluções posteriores mais avançadas;
- decisões funcionais supervenientes;
- arquitetura já consolidada;
- UI e fluxos já aprovados;
- contratos de banco já validados.

Este plano é deliberadamente **source-first**: cada fase começa revalidando a premissa no SHA corrente. Se a causa já não existir, a fase vira no-op documentado; não se implementa uma solução apenas porque ela foi prevista em agosto.

## 2. Identificadores das fases

As fases usam `R1` a `R9`.

**R não significa número de Pull Request do GitHub.** O número real do PR será o atribuído pelo GitHub quando cada entrega for aberta. Isso evita colisão com PRs históricos/abertos, inclusive o PR #5 antigo do repositório.

## 3. Sequência vigente

```text
R1 — retirar autoridade funcional dos wrappers de performance
→ R2A — contrato mínimo de readiness e loader tolerante
→ R2B — readiness crítico
→ R2C — readiness restrito/opcional e fechamento do inventário
→ R3 — IDs persistentes + intent/idempotência de NF + contrato remoto v2 inativo
→ R4 — semântica única de Pendências
→ R5 — ativação autoritativa/incremental de save/remove de NF
→ R6 — gate de equivalência da superfície de Pendências
→ R7 — instrumentação causal do bootstrap
→ R8 — otimizações somente por hipótese medida
→ R9 — fechamento funcional e rebaseline
→ reavaliar ADR-051 em frente separada
```

Dependências:

- R2 depende de R1, porque um módulo de performance não pode continuar carregando semântica crítica quando for tratado como capacidade opcional;
- R3 depende de R2C para que intent/readiness não fique acoplado a polling antigo;
- R5 depende de R3 porque usa o contrato remoto v2 completo;
- R6 depende de R4 e R5;
- R7 depende do fechamento funcional R1–R6 para medir o startup que realmente permanecerá;
- R8 depende do relatório de R7 e da metodologia estatística já vigente;
- R9 depende de R1–R8 ou de no-op documentado nas fases condicionais.

## 4. Método obrigatório em toda fase

Antes de alterar código:

1. revalidar `origin/main`;
2. confirmar deployment Vercel e Supabase aplicáveis;
3. reabrir os arquivos-fonte da causa;
4. localizar consumidores/chamadores laterais;
5. escrever uma regressão RED ou justificar formalmente por que a fase é apenas evidência/no-op;
6. congelar invariantes e decisões supervenientes;
7. executar a menor mudança suficiente;
8. rodar revisão adversarial;
9. executar gates proporcionais;
10. publicar/smoke quando houver runtime ou banco;
11. atualizar documentação e evidência;
12. só então seguir para a próxima fase.

Sem proteção de branch/ruleset obrigatória, usar o conjunto de checks + revisão adversarial como gate manual equivalente.

## 5. Condições globais de parada

Parar antes de implementar se:

- o SHA atual divergir materialmente do baseline analisado;
- surgir PR funcional concorrente sobre os mesmos arquivos;
- uma fase exigir alterar decisão de produto protegida;
- uma migration começar a fabricar estado não lançado pelo usuário;
- uma mudança exigir deduplicar NF por conteúdo;
- a solução exigir enfraquecer RLS, fail-closed, optimistic concurrency ou thresholds;
- a única justificativa for “estava no plano antigo”;
- uma capacidade opcional passar a controlar consistência de dados;
- um refactor exigir redesenho visual sem defeito atual comprovado.

## 6. Guardrails funcionais imutáveis nesta frente

Preservar:

1. Notas Fiscais: bonificação agregada; análise/Pendência individual por `registered_invoice_id`;
2. `a_identificar` novo nasce `Incorreto + Pendência`; legados legítimos sem backfill;
3. Consulta Assessoria individual por NF de serviço;
4. autoridades de ADR-052 por operação;
5. Boleto Internet somente como tipo de gasto de NF em Educação Conectada;
6. BB Ágil N/A;
7. bonificação, análise e Pendência independentes;
8. Pendências transversais a competências;
9. detalhe não troca competência global; Prontuário pode trocar explicitamente;
10. duas NFs idênticas por conteúdo podem ser legítimas;
11. Production fail-closed;
12. comunicação externa sem `RADAR PDDE`;
13. XLSX de Pendências e layout aprovado;
14. PDDE Básico primeiro apenas na apresentação;
15. Supabase CLI 2.116.0 rejeitado;
16. Lighthouse com 3 runs/mediana e thresholds atuais;
17. ADR-051 adiada.

---

# R1 — retirar autoridade funcional dos wrappers de performance

## 7. Problema fonte

`operational-write-performance.js` ainda determina parte da semântica de consistência:

- resultado/commit remoto autoritativo;
- aplicação incremental;
- refresh exemptions;
- sincronização funcional do Prontuário.

Isso faz uma extensão nominalmente de performance participar da correção funcional.

`prontuario-conditional-reconciler.js` também exige `RadarOperationalWritePerformance` para instalar, embora sua lógica funcional não use essa autoridade.

## 8. Objetivo

Depois de R1:

- serviços/DataService/StatePort declaram as políticas de consistência;
- reconciliação visual funcional não depende de um módulo de performance;
- `operational-write-performance.js` pode falhar ou ficar ausente sem mudar persistência, estado canônico ou segurança;
- métricas/tracing podem degradar sem afetar operação.

## 9. Passos

### R1.1 — RED sem wrapper

Criar regressões que executem comandos representativos **sem instalar `RadarOperationalWritePerformance`** e provem a mesma semântica de persistência:

- verificação;
- Pendência;
- Inventário;
- Diretório;
- atribuição de Controlador;
- Assessoria;
- operações que hoje recebem política pelo decorator.

### R1.2 — mover política para a autoridade correta

Para cada comando atualmente listado no decorator:

- declarar `remoteResultIsAuthoritative`, `remoteCommitIsAuthoritative`, `incrementalStateEntities` e refresh exemptions no serviço/comando ou em contrato de aplicação explicitamente consumido pelo DataService;
- não duplicar a lista em outro wrapper.

### R1.3 — separar sincronização visual de medição

Extrair/reusar as funções funcionais hoje alojadas no wrapper de performance somente quando necessárias para preservar o caminho incremental.

Não criar um segundo reconciliador concorrente. Preferir:

1. rotinas já provadas;
2. `prontuario-conditional-reconciler.js` quando a responsabilidade for compatível;
3. pequeno módulo funcional apenas se os testes demonstrarem que as duas autoridades atuais não podem ser compostas.

### R1.4 — remover dependência artificial

`prontuario-conditional-reconciler.js` não pode depender de `RadarOperationalWritePerformance` só para instalar.

### R1.5 — manter performance como observador

O wrapper final pode:

- iniciar/fechar traces;
- capturar duração;
- adicionar marcações;
- observar estabilidade.

Não pode decidir o que é commit autoritativo nem quais entidades definem consistência.

## 10. Gate de R1

- mesmas escritas passam com módulo de performance presente e ausente;
- nenhuma regra de persistência depende de monkey patch tardio;
- Consulta Assessoria e individualização fiscal continuam verdes;
- sem aumento de renderização integral no caminho já incremental;
- `operational-write-performance-policy.test.js` é atualizado para provar que a política migrou, não para perpetuar a duplicação.

---

# R2 — readiness sistêmico compatível com as soluções atuais

## 11. Princípio

O objetivo não é “eliminar todo timer”.

O objetivo é eliminar **polling usado como contrato de instalação**, preservando timers de runtime legítimos.

`RadarProductExtensionsReady`, `radar:application-services-ready` e a ordem crítica de ADR-052 são baseline, não dívida a ser apagada.

## 12. R2A — contrato mínimo e loader tolerante

### Problema

`product-extensions-bootstrap.js` carrega scripts em cadeia; erro de transporte anterior pode impedir módulos independentes posteriores.

### Entrega

Introduzir um contrato mínimo de readiness, com estados observáveis suficientes para:

- pending;
- ready;
- failed;
- degraded/restricted quando aplicável;
- dependências;
- causa sanitizada.

A implementação pode ser um coordenador compartilhado, mas **não deve criar API genérica que nenhum consumidor real use**.

Compatibilidade obrigatória:

- `RadarProductExtensionsReady` continua disponível durante a migração;
- `radar:application-services-ready` continua válido;
- instaladores de Assessoria atuais são adaptados, não reescritos do zero.

O loader passa a usar descritores com dependência/criticidade e deve:

- preservar ordem onde há dependência;
- continuar capacidades independentes após falha opcional/restrita;
- deixar dependentes explicitamente indisponíveis;
- distinguir arquivo carregado de instalação concluída.

### Gate R2A

- falha induzida de módulo opcional não interrompe módulo crítico independente;
- ordem de Assessoria permanece;
- `atomic-analysis-pendency` continua protegido;
- snapshot de readiness não contém dados sensíveis;
- nenhum timeout arbitrário declara sucesso.

## 13. R2B — capacidades críticas

Migrar primeiro:

1. autenticação + dados + autorização + competência + navegação necessária;
2. proteção atômica de `Incorreto + Pendência`;
3. página/ações de Pendências necessárias à operação segura;
4. instalações de Assessoria já event-driven;
5. qualquer fluxo de escrita que uma busca lateral provar depender de polling.

### Regra especial de atomic-analysis

Não trocar o polling atual por um timeout. A nova dependência deve possuir sinal determinístico; até lá, o comportamento permanece fail-closed.

### Gates de falha induzida

Provar:

- dados prontos antes da rota;
- rota não aplicada sem competência/autorização;
- falha de extensão opcional não remove proteção atômica;
- falha crítica desabilita somente o consumidor afetado com mensagem útil;
- Assessoria mantém as quatro autoridades de ADR-052.

## 14. R2C — capacidades restritas/opcionais e inventário final

Classificar e migrar, conforme uso real:

- sessão de Controlador;
- Dashboard/Carteira;
- alertas;
- focus/cross-view;
- modal/accessibilidade;
- navegação contextual;
- formulário institucional;
- retificações;
- competência global;
- reconciliação condicional;
- compatibilidade de histórico de NF;
- performance/diagnóstico.

### O que não remover

- `MutationObserver` que observa DOM criado dinamicamente;
- `setTimeout` de feedback visual;
- timers de medição/fallback que não declaram prontidão.

### Fechamento

Buscar `setInterval|setTimeout|MutationObserver|Ready|waitFor|install` e classificar cada ocorrência remanescente como:

- readiness migrado;
- runtime legítimo;
- compatibilidade temporária com prazo de remoção;
- dívida explícita com causa.

R2 só fecha quando não houver readiness essencial escondido em polling.

---

# R3 — IDs persistentes, intent e idempotência de NF com contrato remoto v2 completo

## 15. Escopo consolidado

R3 absorve:

- a dívida real do antigo PR5;
- a parte **server-side inativa** do antigo PR8A que seria redundante se feita depois.

Não ativa ainda o save/remove normal como caminho remoto autoritativo no frontend. Essa ativação pertence a R5.

## 16. R3A — autoridade compartilhada de IDs

Criar gerador de IDs persistentes:

- `crypto.randomUUID()` preferencial;
- `crypto.getRandomValues()` como fallback criptográfico;
- erro explícito se não houver fonte segura para um ID persistente de negócio;
- injeção determinística em testes.

Inventário obrigatório:

- `DirectoryService`;
- `InvoiceService`;
- `InventoryService`;
- `PendencyService`;
- `VerificationService`;
- `appendRadarLog`/consumidores;
- IDs de retificação;
- contatos/operações gerados diretamente por `app.js`.

Não alterar automaticamente:

- IDs de incidentes;
- IDs de importação/snapshot;
- timestamps;
- métricas.

Cada ocorrência deve ser classificada antes da edição.

## 17. R3B — InvoiceSaveIntent

Uma intenção nasce quando o guard aceita o gesto e congela:

- `operationKey`;
- payload normalizado;
- invoiceId;
- assetId;
- administrativeLogId;
- semanticTimestamp;
- versões esperadas.

Regras:

- retry ambíguo reutiliza a intenção;
- sucesso confirmado encerra;
- validação comprovadamente pré-commit pode encerrar e permitir correção;
- novo gesto gera nova chave;
- duas chaves com conteúdo idêntico geram duas NFs legítimas.

Integrar ao `guardInvoiceSubmission`; não substituí-lo.

## 18. R3C — idempotência server-side

Criar storage privado de idempotência para `invoice:save`, seguindo o padrão conceitual já usado por `operation_id` de contatos:

- operation_name;
- operation_key;
- actor_user_id;
- request_hash;
- status;
- result;
- timestamps;
- unicidade por operação + chave + ator.

Mesma chave + mesmo request retorna o mesmo resultado.

Mesma chave + request diferente falha com erro de conflito.

## 19. R3D — uma única RPC v2 de save já completa

Criar `save_invoice_with_effects_v2` **uma única vez** com:

- operation key;
- idempotência;
- versões esperadas;
- invoice persistida;
- asset persistido;
- asset removido/ID de remoção;
- verification persistida;
- administrative log persistido;
- versões/entidades necessárias à reconciliação.

Não criar overload ambíguo da v1.

A v1 permanece durante o rollout.

### Delete

Um wrapper `delete_invoice_with_effects_v2` pode retornar resultado completo para R5.

**Não** adicionar idempotência ao delete por conveniência. Se perda de resposta do delete for demonstrada como risco que exige intent, parar e fazer RED antes de ampliar.

## 20. Gates de R3

Cobrir:

- mesmo milissegundo com IDs distintos;
- fallback `getRandomValues()`;
- falta de crypto segura;
- DirectoryService recebendo o gerador;
- retificação e contato sem gerador próprio fraco;
- retry exato após resposta ambígua;
- duas chamadas concorrentes com mesma chave;
- mesma chave + payload diferente;
- duas chaves + conteúdo igual;
- isolamento por ator;
- optimistic conflict;
- rollback;
- grants/RLS;
- resultado v2 composto por linhas efetivamente persistidas.

R3 publica o contrato server-side, mas o frontend normal ainda pode usar o caminho anterior até R5.

---

# R4 — semântica única de Pendências sem redesenho

## 21. Escopo

Criar/explicitar uma autoridade de **estado operacional da Pendência** que forneça, no mínimo:

- status normalizado;
- baseDate operacional;
- ageDays;
- nextActor;
- actionCode;
- priority quando compartilhável.

### Não centralizar indevidamente

Rótulos editoriais podem permanecer por superfície:

- “Registrar novo envio…”;
- “Entregar ou corrigir…”;
- “Conferir novo arquivo…”.

A autoridade central deve definir a ação semântica; a UI pode escolher a redação aprovada.

A ordenação global de Dashboard e a ordenação dentro de uma aba de Pendências também podem permanecer diferentes quando isso for apresentação deliberada. O que não pode divergir é a data-base/idade/ator da mesma Pendência.

## 22. Migração

- fazer `operational-projection.js` e `pendencias-view-model.js` consumirem o mesmo núcleo;
- consolidar labels compartilháveis sem recriar `boletoInternet` como documento ativo;
- atualizar alertas que já consomem `operational-projection`;
- manter filtros, tabs, drawer, Excel e mobile.

## 23. RED de equivalência

Para a mesma Pendência, provar entre superfícies:

- baseDate;
- idade;
- ator;
- actionCode;
- mudança após reabertura;
- mudança após novo envio;
- comportamento de resolvida/cancelada.

A divergência atual de Pendência aberta após reabertura deve desaparecer sem alterar a apresentação que não for semântica.

---

# R5 — ativação remota/autoritativa e convergência incremental da NF normal

## 24. O que já existe e deve ser reutilizado

- `DataService.remoteResultIsAuthoritative`;
- `DataService.remoteCommitIsAuthoritative`;
- `incrementalStateEntities`;
- `mergePersistedResult()`;
- `StatePort.applyEntities()`;
- no-op semântico;
- planner de efeitos;
- resposta v2 criada em R3;
- sincronizadores funcionais extraídos em R1.

## 25. O que ainda falta

### R5.1 — normalizar remoções autoritativas

Ensinar a reconciliação existente a reconhecer de modo explícito:

- `deleted_asset_id`;
- `deleted_invoice_id`;

e a confirmar que o snapshot local aplicado representa exatamente o commit retornado.

Não criar uma nova linguagem genérica de patch se a estrutura existente resolver o caso.

### R5.2 — completar entidades autoritativas

Usar o resultado v2 completo para que:

- invoice;
- asset/upsert;
- asset/remove;
- verification;
- log

sejam cobertos sem refresh remoto no caminho feliz.

### R5.3 — ativar save/remove normal

Somente depois dos REDs:

- `invoice:save`;
- `invoice:remove`

declaram resultado autoritativo e entidades incrementais no núcleo.

### R5.4 — caminho visual

Promover/reusar sincronização funcional já existente para refletir:

- lista de despesas;
- transição patrimonial;
- resumo técnico;
- Consulta Assessoria quando afetada;
- ações de consolidação;
- alertas.

`renderProntuario()` integral permanece fallback para retorno incompleto, erro de aplicação ou inconsistência não reconciliável.

### R5.5 — commit confirmado com UI pendente

Simular:

1. RPC confirmou commit;
2. aplicação local falhou;
3. leitura corretiva falhou.

O produto deve comunicar **salvo no servidor / atualização da tela pendente**, nunca “não salvo”.

Não repetir escrita automaticamente.

## 26. Gates R5

Cobrir:

- consumo → permanente;
- permanente → consumo;
- permanente → serviço;
- serviço → permanente;
- edição de permanente;
- remoção com/sem bem;
- no-op;
- log imediato;
- zero load das entidades cobertas no caminho feliz;
- zero render integral no caminho feliz;
- fallback seguro no degradado;
- foco/rolagem;
- duas abas;
- performance wrapper ausente.

---

# R6 — gate de equivalência da superfície de Pendências

## 27. Natureza da fase

R6 **não possui diff obrigatório**.

Executar após R4/R5:

- unitários do view-model;
- cross-view;
- competência transversal;
- quatro abas;
- filtros/busca;
- drawer/timeline;
- reanálise/novo envio;
- XLSX;
- foco/teclado;
- mobile;
- acessibilidade;
- perfis.

Se todos os requisitos atuais passarem e nenhuma divergência nova for encontrada:

> registrar R6 como concluído sem mudança de produto.

Se surgir gap real, abrir patch mínimo com RED. O plano antigo não serve como justificativa para redesenho.

---

# R7 — instrumentação causal do bootstrap

## 28. Estado atual preservado

Não reimplementar:

- concorrência de perfil/papel/escopos;
- concorrência de leituras remotas;
- bootstrap de entidades operacionais;
- Lighthouse com 3 runs/mediana;
- CSS não crítico já adiado.

## 29. Medição nova

Adicionar diagnóstico local/fail-open para fronteiras do startup, adaptado ao readiness final de R2:

- page-init;
- auth-start;
- session-ready;
- supabase-client-ready;
- data-fetch start/end por grupo necessário;
- normalization;
- state-apply;
- first-render;
- critical-capabilities-ready;
- visually-stable;
- useful-interaction-ready.

Regras:

- Performance API nativa;
- sem PII/payload/token;
- sem transmissão;
- sem persistência externa;
- snapshot local exportável para evidência;
- instrumentar sem reorganizar código nesta fase.

Executar amostra autenticada reproduzível e gerar relatório com mediana, pior caso e dispersão.

`web-vitals` e `Server-Timing` continuam condicionais a lacuna diagnóstica comprovada depois do relatório.

---

# R8 — otimizações somente por hipótese medida

## 30. Regra de entrada

Uma otimização só entra com:

- fase dominante identificada;
- mecanismo causal controlável;
- baseline;
- ruído/dispersão;
- orçamento antes do código;
- regressões não alvo explicitadas.

Cada hipótese vira PR pequeno e reversível.

Possibilidades permitidas apenas se a evidência apontar:

- scripts/extensões: adiar opcional depois de useful-ready;
- auth: retirar espera duplicada ainda existente;
- dados: reduzir payload ou adiar entidade não necessária à tela útil;
- state apply: eliminar clone/conversão redundante comprovada;
- render: reduzir DOM crítico;
- CSS: reduzir bloqueio comprovado.

Não relaxar thresholds.

---

# R9 — fechamento funcional e rebaseline

## 31. Gate integral

Ao final:

1. `main`, Vercel e Supabase reconciliados;
2. migrations e tipos alinhados;
3. unitários;
4. integração;
5. pgTAP/RLS/Auth;
6. migrations em banco limpo;
7. backup/restauração;
8. Playwright completo;
9. perfis/viewports;
10. Excel;
11. CodeQL/dependências;
12. Lighthouse;
13. matriz funcional;
14. revisão adversarial final;
15. documentação canônica atualizada.

## 32. Critério de encerramento

A frente funcional termina quando:

- R1–R5 estão concluídos;
- R6 é verde, com ou sem patch;
- R7 possui baseline causal;
- R8 concluiu as hipóteses aprovadas ou registrou que nenhuma melhoria adicional supera o ruído/custo;
- não há tarefa histórica ressuscitada;
- não há wrapper opcional com autoridade de consistência;
- não há readiness crítico baseado em polling sem justificativa;
- save de NF possui idempotência durável;
- Pendências usam semântica operacional única;
- save/remove normal de NF converge sem refresh/render integral no caminho feliz.

## 33. ADR-051 depois de R9

ADR-051 **não faz parte** de R1–R9.

Depois do fechamento funcional, abrir frente separada de segurança/integridade para revalidar:

- imutabilidade de `registered_invoices.id`;
- coerência de `verification_id`;
- `source_context_key`;
- escrita direta;
- grants/RLS;
- testes negativos.

Se houver nova evidência de exploração/corrupção antes de R9, a ADR deve ser reavaliada por decisão explícita; não por hardening oportunista.

---

## 34. Entregas antigas que não voltam

Não criar fases para:

- G0;
- PR1;
- PR2;
- PR4 antigo;
- PR6B;
- PR7B;
- PR9B;
- deduplicação por conteúdo;
- proteção de senha vazada;
- PR #195;
- redesign de Pendências por mockup antigo;
- documento autônomo de Boleto Internet;
- escrita agregada de Assessoria;
- backfill de `a_identificar` legítimo.

## 35. Resultado esperado do programa

O produto final não será “o plano de agosto concluído”.

Será o **produto atual consolidado**, com as decisões de agosto, hotfixes e evoluções de setembro reduzidos a uma arquitetura única e coerente, sem regressão para mecanismos que já foram superados.
