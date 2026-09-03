# RADAR PDDE — Plano mestre de implementação das correções pós-auditoria

> **Para agentes de implementação:** executar este plano com a skill superpowers:executing-plans ou superpowers:subagent-driven-development, uma entrega por vez. Nenhuma etapa autoriza, por si só, escrita em Production, alteração de regras do GitHub ou merge.

**Objetivo:** corrigir, de forma incremental e verificável, os defeitos funcionais e arquiteturais confirmados depois dos PRs #199 e #200, sem alterar regras de negócio legítimas e sem transformar hipóteses em código.

**Arquitetura:** a execução é dividida em entregas pequenas. Cada entrega precisa provar primeiro que o problema ainda existe, criar uma regressão que falha antes da correção, implementar a menor mudança suficiente, sofrer revisão adversarial independente e demonstrar o resultado no ambiente adequado antes do merge.

**Stack:** JavaScript sem framework no navegador, serviços de aplicação em módulos UMD/CommonJS, Supabase/PostgreSQL/PostgREST, Ajv, Node.js 24.x, node:test, pgTAP, Playwright, Lighthouse CI, Vercel e GitHub Actions.

**Especificação-base:** main no commit 0965ba8d5749f2ed25b3563a65ebc5da413e7fa5, correspondente ao merge do PR #200 em 25/08/2026. O PR #199 permanece como registro histórico do primeiro plano. Este documento é a especificação operacional revisada.

**Status desta versão:** APROVADA como plano mestre operacional canônico da frente de correções pós-PR #200, depois da incorporação integral das cinco revisões técnicas consolidadas em 26/08/2026.

**Controle de aprovação:** a aprovação não alcança retroativamente a redação anterior do Word. Ela incide exclusivamente sobre esta versão revisada, que substitui os planos anteriores como referência operacional e mantém o PR #199 apenas como registro histórico.

> **Decisão formal:** plano aprovado em conteúdo e arquitetura. As condições que impediam a aprovação definitiva foram atendidas nesta versão: fortalecimento não causal dos identificadores no PR5; execução do PR3 em PR3.1, PR3.2 e PR3.3 com gates próprios; divisão do PR8 em PR8A e PR8B; tratamento condicional de web-vitals e Server-Timing depois do PR9A; e definição dos orçamentos de PR9C somente depois do baseline e do ruído medidos.

| Condicionante da aprovação | Tratamento incorporado nesta versão |
| --- | --- |
| IDs persistentes gerados no cliente | A duplicidade de NF não é atribuída ao fallback de InvoiceService. PR5 inventaria os produtores, cria o gerador compartilhado e elimina dependência exclusiva de Date.now(), incluindo o caso confirmado de DirectoryService. |
| web-vitals e Server-Timing | Não integram PR9A; permanecem possibilidades condicionais para lacunas diagnósticas comprovadas. Nenhuma coleta, transmissão ou retenção externa fica autorizada. |
| Escopo de PR3 | PR3.1 trata registry e loader; PR3.2 trata capacidades críticas; PR3.3 trata capacidades restritas e opcionais. Cada unidade possui RED, gate, revisão, publicação e reversão próprios. |
| Escopo de PR8 | PR8A instala contrato remoto e aplicação de estado sem ativar a jornada principal; PR8B ativa o resultado autoritativo e a reconciliação visual. São dois PRs reais. |
| Metas de PR9C | Não há meta percentual universal antecipada. Cada hipótese recebe orçamento próprio somente depois de PR9A/PR9B, superior ao ruído observado. A referência de 20% ou 1 segundo é apenas heurística de priorização. |

**Ordem homologada histórica em 26/08:** G0 → PR1 → PR2 → PR3.1 → PR3.2 → PR3.3 → PR4 → PR5 → PR6 → PR6B → PR7A → PR7B → PR8A → PR8B → PR9A → PR9B → PR9C → encerramento.

> **Reconciliação obrigatória de 03/09/2026:** a sequência histórica acima não deve mais ser executada literalmente. Depois dos PRs #211–#249 e da verificação direta do código/Supabase/Vercel, a matriz atual está em [`../../handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](../../handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md). Ela prevalece para decidir o que ainda falta, sem apagar este plano como histórico técnico.

## 0A. Reconciliação pós-hotfixes — estado executivo em 03/09/2026

| Entrega | Estado reconciliado |
|---|---|
| G0 | concluído |
| PR1 | concluído |
| PR2 | concluído |
| PR3.1–PR3.3 | parcial/pendente; preservar ADR-052 e extensões críticas determinísticas |
| PR4 | superado; não executar migration antiga |
| PR5 | pendente |
| PR6 | parcial; concluir autoridade semântica sem refazer UI |
| PR6B | concluído por caminho equivalente |
| PR7A | parcial/alterado; preservar layout/tabs aprovados |
| PR7B | concluído funcionalmente por caminho equivalente |
| PR8A/PR8B | parcial |
| PR9A | pendente |
| PR9B | concluído por caminho equivalente |
| PR9C | pendente |
| ADR-051 | adiado até fechamento funcional |

### Ordem restante vigente

```text
PR3.1
→ PR3.2
→ PR3.3
→ PR5
→ PR6
→ revisão focada dos gaps remanescentes de PR7A
→ PR8A
→ PR8B
→ PR9A
→ PR9C usando a metodologia estatística de PR9B já vigente
→ encerramento funcional
→ reavaliar ADR-051
```

### Proteções contra regressão documental

- PR4 não pode ser executado pelo classificador antigo. Em Production, a leitura de 03/09 encontrou **0** estados legados não vazios inconsistentes sem NF de serviço, **143** estados canônicos e **15** avaliações vazias/não iniciadas. Normalizar essas 15 seria fabricar avaliação.
- `pendencias-view-model.js` ainda possui semântica própria de ação/idade. Esse é o núcleo remanescente de PR6; não redesenhar Pendências para “cumprir” PR7.
- `InvoiceService` ainda possui fallback persistente baseado em `Date.now()` e não existe RPC idempotente v2. PR5 continua real.
- `capability-readiness.js` ainda não existe e polling de instalação permanece em integrações críticas/restritas. PR3 continua real.
- Lighthouse já opera com três rodadas e mediana; PR9B não deve ser reimplementado nem usado para relaxar thresholds.
- PDDE Básico primeiro, exportação XLSX de Pendências, BB Ágil N/A e comunicação externa sem o nome do sistema são decisões posteriores e devem ser preservadas.

---

## 0. Atualização de execução — hotfix PR #211

Em 28/08/2026 foi aberto o PR #211, `hotfix/individualizar-analise-notas-fiscais`, como parêntese operacional prioritário.

Ele **não substitui esta ordem homologada** e não é renumerado como PR3. O plano mestre continua vigente.

Entretanto, o PR #211 toca `InvoiceService`, `invoice-effects`, Pendências, `registered_invoice_id`, RPCs/migrations e o bloco de Notas Fiscais do Prontuário. Essas superfícies também aparecem em entregas futuras deste plano.

Por isso, depois de publicar o hotfix, é obrigatório um gate adicional antes de PR3.1:

```text
PR #211 publicado e validado
→ re-baseline de main/Vercel/Supabase
→ diff PR #211 × plano mestre
→ classificar tarefas futuras como não afetadas / parcialmente atendidas / atendidas / alteradas
→ atualizar CURRENT_STAGE e handoff
→ confirmar ordem restante
→ iniciar PR3.1
```

### Decisão de negócio superveniente

A regra antiga deste plano para `A identificar` foi superada pelo ADR-050, no escopo do PR #211.

Contrato vigente após essa decisão:

- `a_identificar` não fabrica bonificação;
- nasce tecnicamente `Incorreto`;
- deve nascer com Pendência individual obrigatória na mesma operação atômica;
- a identificação posterior preserva o `registered_invoice_id`;
- não se faz backfill heurístico de estados históricos sem evidência.

Plano específico: `docs/superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`.

## 1. Resultado esperado

Ao final deste programa de trabalho:

1. um único gesto de salvar despesa gera uma única chamada imediata;
2. uma repetição real da mesma intenção, inclusive depois de perda da resposta, produz um único resultado no servidor;
3. Consulta Assessoria é calculada por uma única regra canônica;
4. salvar sem mudança real não escreve, não cria log e não altera versão;
5. módulos críticos e opcionais têm prontidão observável e uma falha não interrompe módulos independentes;
6. o reparo de dados altera somente o conjunto autorizado por um preflight recém-executado;
7. todas as telas mostram a mesma idade, próximo ator e próxima ação para uma Pendência;
8. consultar uma Pendência histórica não troca silenciosamente a competência global;
9. a fila de Pendências apresenta primeiro o trabalho mais importante e funciona em mouse, teclado e mobile;
10. a resposta da escrita de NF contém tudo que a tela precisa para atualizar ou remover entidades localmente;
11. quando o servidor salva e a tela falha ao se atualizar, o usuário recebe um estado explícito de recuperação e o comando não é repetido;
12. a inicialização é medida de ponta a ponta, e otimizações são escolhidas por causa comprovada;
13. os gates de merge representam o risco real de cada mudança.

---

## 2. O que está dentro e fora do trabalho

### 2.1 Dentro do trabalho

| Frente | Entregas |
| --- | --- |
| Governança e baseline | G0 |
| Escrita de NF e Consulta Assessoria | PR1, PR2, PR4, PR5, PR8A e PR8B |
| Inicialização e readiness | PR3.1, PR3.2 e PR3.3, sob o objetivo único PR3 |
| Semântica e contexto de Pendências | PR6 e PR6B |
| Fila, detalhes, mobile e acessibilidade | PR7A e PR7B |
| Performance e estabilidade da medição | PR9A, PR9B e PR9C |

### 2.2 Concluído e usado apenas como baseline

O PR #200 já corrigiu o incidente Incorreto + Pendência:

- PendencyService.open() passou a tratar análise Incorreto e abertura da Pendência como uma operação atômica;
- VerificationService continua impedindo Incorreto isolado;
- o módulo crítico é carregado antes das extensões opcionais;
- a falha posterior de uma extensão opcional passou a ter regressão.

Essa correção não deve ser reimplementada. PR3 deve preservá-la e generalizar o readiness do sistema.

### 2.3 Exclusões definitivas por decisão de produto

| Item excluído | Decisão |
| --- | --- |
| Antigo item 20 da auditoria, sobre autoridade server-side mais ampla | Retirado do trabalho por decisão do responsável pelo produto. Não é tarefa, dependência, gate oculto nem item de hardening deste plano. |
| Proteção de senhas vazadas no Supabase Auth | Retirada do trabalho por decisão anterior do responsável pelo produto. Não deve reaparecer no encerramento. |
| PR #195 | Continua completamente separado desta frente. |
| Deduplicação de NFs por conteúdo | Proibida: duas despesas legitimamente iguais podem existir. |

Essas quatro exclusões não podem reaparecer como tarefa, dependência, gate oculto ou hardening. Se uma entrega revelar necessidade inevitável de tocar qualquer uma delas, a execução deve parar e pedir nova decisão.

### 2.4 Decisões atuais de escopo e opções condicionais

| Tema | Decisão desta versão |
| --- | --- |
| Identificadores gerados no cliente | O runtime atual de NF já recebe createPendencyClientId baseado em UUID e isso não causou a duplicidade. PR5, porém, formalizará um gerador compartilhado e eliminará fallbacks persistentes baseados exclusivamente em prefix-Date.now() como fortalecimento de consistência. |
| Troca de Ajv por Zod ou inclusão de Zod | Não necessária. Ajv já é a ferramenta de contrato do projeto; a causa da divergência é regra duplicada, não falta de biblioteca. |
| web-vitals | Não entra no PR9A. Só poderá ser avaliado depois do baseline se a Performance API nativa não responder a uma pergunta diagnóstica comprovada. A biblioteca, por si só, não autoriza coleta ou transmissão de dados reais de usuários. |
| Server-Timing | Não entra no PR9A. Só poderá ser avaliado se o diagnóstico localizar tempo material no servidor/RPC, a camada controlada pelo projeto puder emitir a métrica e houver benefício que a medição do cliente não consiga fornecer. |
| Telemetria externa/RUM | Não integra o programa atual. Qualquer transmissão, retenção ou monitoramento de usuários reais exige decisão específica sobre finalidade, dados, privacidade, acesso e prazo de retenção. |
| Reforma visual geral VIS-01 a VIS-07 | Permanece em frente paralela. Só entram ajustes visuais indispensáveis à fila, acessibilidade ou loading medido neste plano. |
| Refatorações oportunistas | Não entram só porque um arquivo foi aberto. Cada alteração deve estar ligada a uma premissa e a um teste deste plano. |

As opções condicionais não são tarefas aprovadas por antecedência. Cada uma só pode entrar pelo checkpoint definido neste plano, com problema comprovado, mudança mínima, teste e autorização quando criar dependência ou coleta nova.

### 2.5 Áreas auditadas sem reparo autorizado

Até o baseline desta especificação, não houve evidência suficiente para abrir correção de:

- corrupção generalizada de NFs;
- vínculos inválidos de NF com escola, programa ou verificação;
- assets atuais órfãos como padrão;
- duas NFs usando indevidamente o mesmo asset;
- perfis ativos duplicados incompatíveis;
- Controladores ativos sem vínculo de usuário;
- integrantes ativos de Inventário sem usuário;
- escolas ativas sem carteira válida;
- schema legado generalizado nas Pendências atuais;
- família estrutural nova de defeitos em Inventário;
- família estrutural nova de defeitos no Cycle B;
- problema geral comprovado de Excel/exportação;
- escrita anônima generalizada.

Esses temas não viram tarefas preventivas. Se surgir evidência nova, ela deve passar pela prova de premissa e por decisão de escopo antes de entrar.

---

## 3. Glossário em linguagem comum

| Termo | Significado neste plano |
| --- | --- |
| Baseline | Fotografia confirmada do código, banco, deployment e métricas antes de mudar algo. |
| RED | Teste escrito antes da correção e que falha pelo motivo esperado. Ele prova que o teste realmente detecta o defeito. |
| Regressão | Teste permanente que impede o defeito de voltar. |
| No-op | Operação que não faz nada porque o estado final já seria exatamente igual. Não chama o banco, não cria log e não muda versão. |
| Idempotência | Repetir a mesma intenção produz o mesmo resultado, sem criar uma segunda NF, bem ou log. |
| Intenção | Pacote congelado que representa um gesto do usuário: chave, dados, IDs, horário semântico e versões esperadas. |
| RPC | Função do PostgreSQL chamada pelo aplicativo como uma operação de servidor. |
| Readiness | Estado que informa se uma capacidade foi instalada e está pronta, falhou ou funciona de modo degradado. |
| Polling | Repetir uma checagem a cada poucos milissegundos esperando algo aparecer. O novo readiness não deve depender disso. |
| Preflight | Consulta somente de leitura executada imediatamente antes de uma mudança de dados. |
| Drift | Mudança ocorrida entre o preflight e a atualização. Se houver drift relevante, a migration deve parar. |
| Fonte canônica | Único módulo autorizado a calcular uma regra. Os demais apenas consomem o resultado. |
| Resposta autoritativa | Resposta do servidor que contém exatamente os registros persistidos e suas versões. |
| Reconciliação local | Atualização da memória e da tela com o que o servidor confirmou. |
| Estado degradado | O servidor salvou, mas a tela não conseguiu refletir a mudança. O sistema deve dizer isso claramente e não repetir a escrita. |
| Transação | Bloco de banco que acontece por inteiro ou é todo desfeito. Não deixa metade da NF salva. |
| Versão esperada | Número usado para detectar se outra pessoa alterou o registro desde que ele foi carregado. |
| Hash | Impressão digital calculada dos dados. Serve para provar se duas tentativas levam exatamente o mesmo pedido. |
| Fail-closed | Na dúvida sobre uma condição crítica, a função fica indisponível de forma explícita em vez de prosseguir inseguramente. |
| Smoke | Verificação curta, feita depois de publicar, para confirmar que a jornada principal funciona no ambiente real. |
| Gate | Evidência mínima que precisa estar verde antes de merge ou publicação. |
| Rollback | Maneira segura de retirar uma mudança. Em banco, normalmente é uma migration nova ou retorno do cliente à RPC anterior; nunca se apaga o histórico. |

---

## 4. Hierarquia das fontes de verdade

Em qualquer divergência, vale esta ordem:

1. código da main no SHA efetivamente em análise;
2. Supabase Production efetivo: schema, RPCs, RLS, triggers, Auth e dados;
3. deployment Production e SHA publicado;
4. decisões funcionais vigentes do responsável pelo produto;
5. testes e evidências reproduzíveis;
6. documentação canônica;
7. planos, auditorias e documentos históricos.

Consequência prática: este plano orienta o trabalho, mas não vence uma evidência mais recente. Antes de cada PR, o problema e os arquivos afetados devem ser revalidados.

---

## 5. Invariantes de negócio que nenhuma correção pode quebrar

| Regra | Como provar |
| --- | --- |
| Pendências aparecem independentemente da competência global | Teste cross-competence com mais de um mês |
| Pendência, análise técnica e bonificação são dimensões diferentes | Testes de combinação e consolidação |
| Sim + Incorreto + Pendência é válido | Teste de serviço e teste E2E |
| Novo envio leva à reanálise; não resolve automaticamente | Teste do ciclo completo |
| Despesa A identificar nasce Incorreto + Pendência individual, sem fabricar bonificação | Testes de InvoiceService/PendencyService e E2E |
| Pendência ativa, sozinha, não bloqueia consolidação | Teste de regra de consolidação |
| Não analisado, sozinho, não bloqueia consolidação | Teste de regra de consolidação |
| Sem NF de serviço, Consulta Assessoria converge para Não se aplica | Teste da regra canônica |
| Duas NFs de conteúdo igual podem ser legítimas | Teste com chaves de intenção diferentes |
| Abrir detalhe de Pendência não troca a competência global | Teste de navegação |
| Abrir Prontuário a partir da Pendência troca a competência explicitamente | Teste de navegação |
| A resposta bem-sucedida não deve forçar renderProntuario() completo | Testes de reconciliação incremental |
| Production permanece fail-closed | Testes de configuração e autenticação já existentes |

---

## 6. Decisões técnicas explícitas

Estas decisões orientam todas as implementações e só podem mudar por decisão registrada:

### Escrita de NF

- A contenção imediata usa trava por formulário ou intenção, nunca trava global da aplicação.
- A trava é adquirida de forma síncrona antes do primeiro await e liberada em finally.
- Desabilitar o botão melhora a experiência, mas não substitui a trava lógica.
- O cliente não deduplica NF por número, descrição, valor ou conteúdo.
- O runtime atual de NF já injeta createPendencyClientId baseado em UUID; o fallback interno de InvoiceService não é causa do incidente de duplicidade.
- No PR5, src/application/client-id.js passa a ser a autoridade compartilhada para identificadores persistentes gerados no cliente.
- Fallbacks baseados exclusivamente em prefix-Date.now() serão eliminados dos produtores efetivos. AuditService não será alterado como se possuísse createId próprio: seus IDs continuam vindo de appendRadarLog.
- O gerador compartilhado usa crypto.randomUUID() ou crypto.getRandomValues(); se nenhuma fonte criptográfica estiver disponível, falha explicitamente em vez de retornar um identificador fraco.
- administrativeLogs deixa de ser relido no fluxo de invoice quando o próprio comando já mantém consistência.

### Consulta Assessoria e no-op

- src/domain/service-advisory.js será a única autoridade de agregação.
- InvoiceService e VerificationService não manterão matrizes próprias da mesma regra.
- src/domain/invoice-effects.js será o único planejador dos efeitos persistentes de salvar/remover NF.
- O no-op compara NF, bem, verificação, Consulta Assessoria, consolidação e demais efeitos persistentes.
- NF igual com estado derivado incorreto não é no-op.
- IDs, horário, log, incremento de versão e reabertura só são produzidos depois de provar que existe mudança.
- Ajv pode validar valores na borda; ele não calcula regra de negócio.

### Readiness

- Readiness será orientado a sinais e Promises resolvidas ou rejeitadas pelos instaladores.
- Promise que apenas embrulha setInterval não atende ao requisito.
- Carregar um arquivo não significa que a capacidade foi instalada.
- O loader continua tentando módulos independentes depois de uma falha.
- A ordem de scripts com dependência será preservada; não haverá paralelização cega.
- MutationObserver pode permanecer para acompanhar mudanças reais do DOM, mas não será fonte de prontidão de instalação.
- Timeout operacional arbitrário será removido. Um watchdog limitado pode existir apenas para diagnosticar instalador travado e convertê-lo em falha explícita.
- Política essencial de consistência sai de operational-write-performance.js e vai para o núcleo.

### Dados e servidor

- O reparo não exige exatamente quatro registros.
- O preflight congela IDs, versões e estado esperado imediatamente antes da migration.
- Rerun com zero alterações é válido; parcial já corrigido pode ser válido; drift não explicado aborta.
- A idempotência usa uma chave estável por gesto e um hash do pedido normalizado.
- A RPC nova terá nome público explícito, por exemplo save_invoice_with_effects_v2; não será criado overload ambíguo da RPC atual com parâmetros default.
- A estrutura de idempotência ficará no schema radar_private e sem acesso direto do cliente.
- Em erro de rede ambíguo, a intenção é preservada para retry; em sucesso ou falha definitivamente anterior ao commit, ela é encerrada.

### Pendências

- src/domain/operational-projection.js é a autoridade para início da etapa, próximo ator, próxima ação e prioridade.
- O modelo da fila cuida de agrupamento, filtros, contagem e apresentação; não recalcula a semântica operacional.
- A matriz de ações é única e inclui reabertura de Resolvida e Cancelada.
- Contato só aparece para Pendência ativa.
- O rótulo é Minha carteira, não Minhas Pendências.
- Minha R.A. não será criada sem uma relação formal no modelo.
- Agrupamento por escola não será a única ordem e não destruirá a cronologia.
- Ver detalhes permanece até clique, teclado, foco, nome acessível e retorno de foco existirem no render base e passarem nos testes.

### Estado local e performance

- remoteResultIsAuthoritative só será ativado quando a resposta trouxer todas as entidades alteradas e removidas.
- StatePort terá operações explícitas de upsert e remoção por ID; não será criado um motor genérico de patches.
- Commit remoto confirmado mais falha local gera estado degradado, nunca mensagem Não salvou e nunca retry automático do comando.
- Performance será medida antes de otimizar.
- A instrumentação inicial usa a Performance API nativa, com performance.mark, performance.measure e, quando necessário, PerformanceObserver.
- PR9A mantém as medições apenas na sessão e não transmite telemetria.
- web-vitals ou Server-Timing só podem ser avaliados no checkpoint pós-PR9A para responder a uma lacuna comprovada; não são dependências nem tarefas antecipadas.
- Qualquer telemetria externa ou RUM exige nova decisão explícita do responsável pelo produto.
- O Lighthouse de CI usará pelo menos três execuções e mediana para gate; o pior caso continuará registrado para diagnóstico.

---

## 7. Autoridades canônicas após as correções

| Regra ou responsabilidade | Autoridade final | Consumidores principais |
| --- | --- | --- |
| Agregação de Consulta Assessoria | src/domain/service-advisory.js | InvoiceService, VerificationService e testes |
| Plano completo de efeitos de NF | src/domain/invoice-effects.js | InvoiceService |
| Identificadores persistentes gerados no cliente | src/application/client-id.js | app.js, DirectoryService e serviços que criam IDs persistentes |
| Persistência transacional e idempotente de NF | RPC pública v2 + implementação em radar_private | SupabaseRepository |
| Aplicação e remoção incremental no navegador | src/application/state-port.js | DataService |
| Política de refresh de cada comando | definição central do próprio comando e DataService | extensões apenas observam |
| Estado de capacidades instaladas | src/integration/capability-readiness.js | bootstraps, módulos e UI dependente |
| Início da etapa, ator, ação e prioridade de Pendência | src/domain/operational-projection.js | fila, cross-view, detalhes e alertas |
| Agrupamento, filtros e contagens da fila | src/domain/pendency-queue-model.js | task-9-pendencias-page.js |
| Ações permitidas e sua hierarquia | src/domain/pendency-action-model.js | página e detalhes |
| Contexto global de competência | RadarCompetenceContext | busca, fila e Prontuário |
| Métricas de bootstrap | módulo de diagnóstico baseado na Performance API | Playwright autenticado e artefatos locais |

Nenhum consumidor pode manter um fallback semântico diferente. Fallback de disponibilidade pode desabilitar uma capacidade; não pode inventar outra regra.

---

## 8. Método obrigatório para cada PR

### 8.1 Antes de programar: prova das premissas

O corpo do PR deve começar com esta tabela preenchida com evidência do SHA atual:

| Pergunta | Evidência exigida |
| --- | --- |
| O defeito ainda existe? | Reprodução, consulta somente de leitura ou trecho de código atual |
| Esta é a causa? | Caminho de chamada e estado antes/depois |
| O que não pode mudar? | Invariantes desta especificação |
| Quem compartilha a regra? | Chamadores, implementações semelhantes, consumidores do estado, strings/eventos/status equivalentes |
| Quais bordas importam? | Retry, concorrência, duas abas, falha de rede, módulo ausente, mobile, teclado e estado parcial conforme o PR |
| Há dados antigos envolvidos? | Preflight e versões, ou declaração explícita de que não há |
| Como desfazer? | Revert de código, retorno à RPC anterior ou migration corretiva |
| Qual teste prova a correção? | Nome e resultado RED antes da implementação |

### 8.2 Ciclo de desenvolvimento

1. confirmar main e ambientes;
2. criar branch ou worktree a partir do SHA confirmado;
3. escrever teste RED;
4. executar somente esse teste e confirmar falha pela causa certa;
5. implementar a menor alteração que o faz passar;
6. rodar testes focados e checagens estáticas dos arquivos tocados;
7. buscar obrigatoriamente fora dos arquivos previstos;
8. revisar o diff inteiro;
9. executar os gates proporcionais ao risco;
10. realizar revisão adversarial independente;
11. validar Preview e ambiente de banco descartável quando aplicável;
12. pedir decisão explícita de merge;
13. confirmar SHA publicado e executar smoke pós-publicação;
14. registrar evidências e atualizar documentação canônica.

### 8.3 Busca obrigatória fora do diff

Em todos os PRs, executar buscas equivalentes a:

    rg -n "nomeDaFuncao|nomeDoEvento|nomeDoStatus" src app.js config.js tests
    rg -n "regra equivalente ou string equivalente" src app.js tests supabase

Responder no PR:

- quem chama o código alterado;
- quem produz o estado alterado;
- quem consome esse estado;
- quem implementa regra semelhante;
- quais superfícies não citadas foram encontradas;
- por que cada ocorrência foi alterada ou preservada.

### 8.4 Revisão independente

PR2, cada subdivisão PR3.1/PR3.2/PR3.3, PR5, PR6, PR8A e PR8B exigem dois passes independentes:

1. revisão de contrato: regra, interface, compatibilidade e testes;
2. revisão adversarial: contraexemplos, concorrência, retries, inicialização parcial, estado remoto/local e superfícies esquecidas.

Os demais exigem pelo menos um passe independente. O autor não pode considerar sua própria releitura como revisão independente.

### 8.5 Classificação de falhas

Quando um gate falhar, classificar antes de mudar código:

- defeito real do produto;
- contrato antigo já substituído;
- defeito do teste;
- falha de infraestrutura;
- instabilidade estatística.

Não se relaxa assertion, timeout ou limite apenas para deixar o CI verde.

---

## 9. Ordem cronológica e dependências

### 9.1 Ordem padrão de execução

| Ordem | Entrega | Resultado |
| ---: | --- | --- |
| 0 | H0 — PR #200 | Já concluído; vira baseline |
| 1 | G0 | Baseline e governança congelados |
| 2 | PR1 | Duplo envio contido e refresh de logs reduzido |
| 3 | PR2 | Consulta Assessoria canônica e no-op verdadeiro |
| 4 | PR3.1 | Registry e loader tolerante a falhas |
| 5 | PR3.2 | Capacidades críticas e semântica essencial no núcleo |
| 6 | PR3.3 | Capacidades restritas/opcionais e remoção do polling residual |
| 7 | PR4 | Dados de Assessoria reparados com preflight |
| 8 | PR5 | Gerador compartilhado, idempotência real no servidor e RPC v2 |
| 9 | PR6 | Semântica única de Pendências |
| 10 | PR6B | Competência global preservada |
| 11 | PR7A | Fila operacional e filtros |
| 12 | PR7B | Detalhes, mobile e acessibilidade |
| 13 | PR8A | Contrato remoto completo e aplicação de estado |
| 14 | PR8B | Ativação, estado degradado e reconciliação visual incremental |
| 15 | PR9A | Instrumentação causal do bootstrap |
| 16 | PR9B | Lighthouse estatisticamente estável |
| 17 | PR9C | Otimizações escolhidas pela medição |
| 18 | Encerramento | Evidências, documentação e confirmação de Production |

### 9.2 Dependências que bloqueiam

- PR1 depende de G0.
- PR2 depende de PR1.
- PR3.1 depende de PR2 para não perpetuar semântica duplicada em extensões.
- PR3.2 depende do registry e do loader aprovados em PR3.1.
- PR3.3 depende das capacidades críticas estabilizadas em PR3.2. O objetivo PR3 só está concluído depois de PR3.3.
- PR4 depende de PR2 já publicado e observado em Production. Não depende de PR5; na ordem padrão, PR3.3 também já estará concluído.
- PR5 depende de PR2 e deve preservar o readiness estabilizado até PR3.3.
- PR6 depende de PR3.3, pois os consumidores não podem continuar dependendo de instalação tardia incerta.
- PR6B depende do contrato do PR6.
- PR7A depende de PR6 e PR6B.
- PR7B depende de PR7A.
- PR8A depende de PR5.
- PR8B depende de PR8A e não pode ativar o resultado autoritativo antes de o contrato remoto e a aplicação local estarem provados.
- PR9A pode começar a ser preparada depois de PR3.3, mas a ordem padrão a executa após PR8B para medir a arquitetura final de escrita.
- PR9B depende da saída de PR9A.
- PR9C depende de causa mensurada e orçamento registrado em PR9A/PR9B.

PR4 é uma mudança de dados. Mesmo estando em quinto lugar, seu preflight deve ser refeito imediatamente antes da execução; evidência coletada durante PR2 não autoriza uma atualização posterior.

### 9.3 A lógica da sequência em linguagem direta

1. Primeiro fotografamos a realidade e protegemos a entrada da main.
2. Depois impedimos o usuário de enviar duas vezes enquanto espera.
3. Em seguida fazemos todo o sistema usar a mesma regra de Consulta Assessoria e paramos de salvar quando nada mudou.
4. Só então organizamos a inicialização em três unidades verificáveis, para uma peça opcional não derrubar outra necessária sem criar um mega-diff impossível de revisar.
5. Com a causa da inconsistência já eliminada, corrigimos os dados antigos autorizados.
6. Depois protegemos o servidor contra retries e respostas perdidas.
7. Unificamos o significado das Pendências antes de redesenhar sua tela.
8. Separamos consultar uma Pendência de mudar o mês de trabalho.
9. Reorganizamos fila e detalhes sobre essa base semântica já estável.
10. Com a operação idempotente, primeiro completamos o contrato remoto e a aplicação de estado; depois ativamos a reconciliação visual sem releituras integrais.
11. Por último, medimos a inicialização, estabilizamos a estatística e só então otimizamos a causa comprovada.

---

## 10. Convenções de execução, commits e documentação

### 10.1 Branches

Usar uma branch por entrega:

    fix/pr1-invoice-submit-guard
    fix/pr2-service-advisory-noop
    refactor/pr3-capability-readiness
    fix/pr4-service-advisory-data-repair
    feat/pr5-invoice-idempotency-v2
    refactor/pr6-pendency-operational-contract
    fix/pr6b-pendency-competence-context
    feat/pr7a-pendency-queue
    feat/pr7b-pendency-detail-a11y
    feat/pr8a-authoritative-invoice-contract-state
    feat/pr8b-invoice-ui-reconciliation
    perf/pr9a-bootstrap-instrumentation
    ci/pr9b-lighthouse-statistics
    perf/pr9c-bootstrap-optimization

PR3 é um objetivo arquitetural dividido desde o início em PR3.1, PR3.2 e PR3.3. Cada unidade deve produzir um diff próprio, revisável, testável, publicável e reversível. Se a execução em uma única branch ameaçar essa independência, separar fisicamente as unidades nos seguintes PRs/branches, preservando a ordem e os mesmos objetivos:

    refactor/pr3-1-capability-registry-loader
    refactor/pr3-2-critical-capabilities
    refactor/pr3-3-restricted-optional-capabilities

### 10.2 Commits

Cada PR deve ter commits pequenos e reversíveis, nesta ordem sempre que aplicável:

1. teste RED;
2. núcleo ou domínio;
3. adaptação de consumidores;
4. banco;
5. UX;
6. documentação/evidências.

Não agrupar migration, redesenho visual e refatoração semântica no mesmo commit.

### 10.3 Documentos atualizados por entrega

- docs/CURRENT_STAGE.md: estado atual e próximo passo;
- docs/DECISION_LOG.md: somente decisões novas ou mudança formal de decisão;
- docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md: quando uma regra ou gate mudar;
- docs/handoff/: contexto necessário para o próximo PR;
- docs/evidence/: manifestos e resultados reproduzíveis, sem segredos;
- este plano: marcar a entrega concluída sem reescrever o histórico.

---

## 11. G0 — Congelamento de baseline e governança

**Finalidade:** garantir que todos os PRs partam da mesma realidade e que nenhum merge contorne os gates definidos.

**Não contém:** correção funcional, migration, escrita de dados ou publicação de código.

### Arquivos

- Create: docs/evidence/releases/2026-08-26-correcoes-baseline.json
- Create: docs/handoff/2026-08-26-inicio-implementacao-correcoes.md
- Modify: docs/CURRENT_STAGE.md
- Modify, se necessário: docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md

### Passos

- [ ] **G0.1 — Confirmar o código**

    git fetch origin
    git rev-parse origin/main
    git show --no-patch --format=fuller origin/main

Resultado esperado no início deste plano: 0965ba8d5749f2ed25b3563a65ebc5da413e7fa5. Se for outro SHA, parar, comparar o diff desde 0965ba8 e revalidar todos os arquivos citados.

- [ ] **G0.2 — Confirmar o deployment**

Registrar no manifesto:

- URL de Production;
- deployment ID;
- commit publicado;
- data;
- resultado de smoke autenticado de leitura;
- eventual diferença entre main e Production.

Se Production não estiver no mesmo SHA esperado, não iniciar PR1 até decidir qual é o baseline correto.

- [ ] **G0.3 — Confirmar o Supabase**

Registrar, por consultas somente de leitura:

- project ref scnryinorqeucbfkioxo;
- migrations aplicadas;
- assinaturas atuais de save_invoice_with_effects e delete_invoice_with_effects;
- grants relevantes dessas RPCs;
- contagens de registered_invoices, assets, administrative_logs e verifications;
- contagem e identidades dos candidatos atuais ao reparo de Consulta Assessoria;
- contagens de Pendências por status e schemaVersion;
- integridade dos vínculos NF → verificação e NF → bem.

Não incluir tokens, e-mails pessoais ou credenciais no manifesto.

- [ ] **G0.4 — Registrar o baseline funcional**

Executar as jornadas atuais e guardar resultado:

- uma inclusão de NF;
- uma edição;
- transições consumo → permanente, permanente → consumo e permanente → serviço;
- uma Consulta Assessoria;
- uma Pendência aberta;
- uma Pendência aguardando reanálise;
- busca de Pendência de competência histórica;
- desktop e mobile da fila.

Essa rodada serve como comparação; não deve corrigir dados.

- [ ] **G0.5 — Registrar o baseline de chamadas e performance**

Guardar:

- quantidade de chamadas por gesto de salvar NF;
- quais entidades são relidas;
- tamanho e páginas de administrative_logs;
- cinco execuções autenticadas mobile e cinco desktop;
- FCP, LCP, TTI, TBT, CLS e duração das fases já instrumentadas;
- pior caso, mediana e dispersão.

- [ ] **G0.6 — Definir proteção da main**

Com autorização explícita de um administrador do repositório:

- exigir PR;
- impedir push direto e force-push;
- exigir branch atualizada ou merge queue conforme a política escolhida;
- exigir os contextos reais, copiados de uma execução recente, dos gates agregadores;
- exigir pelo menos validação principal, CodeQL e gate integral pré-production;
- não tornar Lighthouse obrigatório enquanto PR9B ainda não estabilizar a estatística.

Se a plataforma ou permissão impedir a proteção, registrar isso no handoff e aplicar provisoriamente o gate manual:

    PR aberto
    revisão independente concluída
    testes focados verdes
    gate integral verde
    decisão de merge registrada
    confirmação pós-deploy registrada

- [ ] **G0.7 — Gate**

    npm ci
    npm run check
    npm run check:functional-matrix
    npm run check:workflow-references
    npm run test:unit

Resultado esperado: baseline reproduzível ou falhas classificadas e registradas antes de qualquer mudança.

### Condições de parada

- main ou Production não corresponde ao SHA adotado;
- migrations de Production diferem do esperado;
- aparece corrupção estrutural não contemplada;
- falta acesso somente de leitura necessário;
- um gate-base falha por defeito real ainda não classificado.

### Reversão

G0 não muda produto nem dados. Reversão de ruleset, se ele for configurado incorretamente, exige autorização administrativa e deve preservar PR obrigatório enquanto a correção é feita.

---

## 12. PR1 — Contenção imediata do duplo envio e refresh mínimo

**Finalidade:** impedir repetição imediata por clique/Enter durante latência e evitar releitura de administrativeLogs no comando de invoice.

**Dependência:** G0 concluído.

**Não contém:** no-op, migration, nova RPC, idempotência de servidor, refatoração geral de NF ou alteração de IDs.

### Arquivos

- Modify: app.js
- Modify: index.html
- Modify: src/application/invoice-service.js
- Modify: src/integration/operational-write-performance.js
- Create: tests/e2e/invoice-submit-guard.spec.js
- Modify: tests/unit/invoice-service.test.js
- Modify: tests/unit/operational-write-performance-policy.test.js
- Modify: tests/unit/operational-write-refresh-policy.test.js

### Contrato

Para cada instância de form-dados-nota:

- estado livre aceita um submit;
- a trava entra antes do primeiro await;
- submit enquanto travado retorna false e não chama InvoiceService;
- o formulário recebe aria-busy=true;
- o botão fica disabled e mostra Salvando…;
- finally sempre restaura aria-busy, disabled e o rótulo anterior;
- outro formulário ou outra intenção independente não é bloqueado.

O comando invoice:save e invoice:remove declara no núcleo que administrativeLogs é dispensado do refresh remoto completo. A extensão de performance não pode ser necessária para essa decisão.

### Passos

- [ ] **PR1.1 — Escrever regressão RED do gesto repetido**

No novo teste E2E, substituir temporariamente radarInvoiceService.save por uma Promise controlada, disparar dois submits no mesmo turno e verificar:

- apenas uma chamada;
- botão desabilitado imediatamente;
- aria-busy=true;
- texto Salvando…;
- segunda ação ignorada.

Executar:

    npx playwright test tests/e2e/invoice-submit-guard.spec.js --project=desktop-chromium

Resultado esperado antes da correção: duas chamadas ou ausência do estado ocupado.

- [ ] **PR1.2 — Cobrir combinações de entrada**

Adicionar casos:

- duplo clique;
- Enter repetido;
- Enter seguido de clique;
- inclusão;
- edição.

Não simular deduplicação por conteúdo. A asserção é uma chamada por gesto aceito.

- [ ] **PR1.3 — Implementar trava síncrona por formulário**

Em app.js, manter um WeakSet ou WeakMap privado, indexado pelo elemento form. salvarDadosNota deve:

1. obter e validar o formulário;
2. retornar antes de ler ou enviar dados se o formulário já estiver no conjunto;
3. adicionar o formulário ao conjunto;
4. capturar botão e rótulo atual;
5. aplicar estado ocupado;
6. executar o fluxo atual;
7. restaurar estado no finally.

O rótulo restaurado deve continuar distinguindo Salvar Gasto de Salvar Alterações.

- [ ] **PR1.4 — Tornar a marcação acessível**

Em index.html, dar ao botão uma identificação estável, sem remover type=submit. No formulário:

- aria-busy só fica true enquanto há operação;
- disabled impede interação adicional;
- a mensagem de erro continua anunciada pelo mecanismo vigente;
- Cancelar não fecha o modal enquanto a gravação está em estado ambíguo.

- [ ] **PR1.5 — Testar falha**

Fazer a Promise rejeitar e provar:

- uma mensagem de erro é apresentada;
- a trava é liberada;
- botão e rótulo voltam;
- um novo gesto posterior chama o serviço uma vez.

- [ ] **PR1.6 — Mover a exceção de refresh para o comando**

Em InvoiceService, declarar remoteRefreshExemptEntities com administrativeLogs nos comandos invoice:save e invoice:remove.

Remover a responsabilidade equivalente de operational-write-performance.js. Manter a extensão capaz de observar e medir, mas não de determinar consistência.

- [ ] **PR1.7 — Provar ausência da extensão**

No teste unitário, instanciar InvoiceService/DataService sem operational-write-performance.js e verificar que a escrita não chama repository.load de administrativeLogs.

- [ ] **PR1.8 — Rodar gates focados**

    node --test tests/unit/invoice-service.test.js
    node --test tests/unit/operational-write-performance-policy.test.js
    node --test tests/unit/operational-write-refresh-policy.test.js
    npx playwright test tests/e2e/invoice-submit-guard.spec.js --project=desktop-chromium
    npm run check

Resultado esperado: uma chamada por gesto, destravamento garantido e nenhuma releitura de logs causada apenas pela ausência da extensão.

- [ ] **PR1.9 — Revisão adversarial**

Verificar:

- submit programático;
- fechamento do modal durante operação;
- erro síncrono antes do primeiro await;
- rejeição remota;
- mudança do rótulo entre inclusão e edição;
- duas abas: PR1 não promete proteção entre abas; isso pertence ao PR5.

### Gate de merge

- regressão RED documentada;
- exatamente uma chamada por gesto em todas as combinações;
- extensão de performance ausente no teste;
- nenhum comportamento de negócio de NF alterado;
- Preview validado.

### Publicação e reversão

Após publicar, executar uma inclusão e uma edição controladas, conferindo chamada única na rede. Se houver bloqueio permanente, perda de mensagem ou regressão de edição, reverter o PR e publicar o SHA anterior. Não há migration.

---

## 13. PR2 — Regra canônica de Consulta Assessoria, plano de efeitos e no-op

**Finalidade:** eliminar fontes concorrentes da regra e impedir qualquer escrita quando todo o estado persistente já estiver correto.

**Dependência:** PR1 publicado e estável.

**Não contém:** reparo de dados existentes, idempotência de servidor ou redesenho de Pendências.

### Arquivos

- Create: src/domain/service-advisory.js
- Create: src/domain/invoice-effects.js
- Modify: index.html
- Modify: src/application/invoice-service.js
- Modify: src/application/verification-service.js
- Modify, somente se necessário: src/domain/json-contracts.js
- Create: tests/unit/service-advisory.test.js
- Create: tests/unit/invoice-effects.test.js
- Modify: tests/unit/invoice-service.test.js
- Modify: tests/unit/verification-service.test.js
- Modify: tests/unit/task5-gateway-integration.test.js

### Contrato da regra canônica

> **Validade histórica desta seção:** a matriz abaixo foi aprovada e executada no PR2/#206. O ADR-050/PR #211 substitui especificamente a regra de entrega da bonificação da Assessoria: uma ou mais consultas exigíveis enviadas produzem `Sim`; `Não` somente quando nenhuma NF de serviço foi enviada. As demais regras permanecem aplicáveis quando não conflitarem com o hotfix.

service-advisory.js exporta:

    deriveServiceAdvisory(invoices)
    getServiceAdvisoryState(invoice, fallback)
    normalizeServiceAdvisoryAnalysis(value)
    SERVICE_ADVISORY_ANALYSES

O resultado de deriveServiceAdvisory tem:

    {
      delivery,
      sent,
      analysis,
      invoiceCount
    }

Matriz:

| Estado das NFs de serviço no contexto | delivery | sent | analysis |
| --- | --- | ---: | --- |
| Nenhuma NF de serviço | Não se aplica | false | Correto |
| Há NF e pelo menos uma consulta não foi enviada | Não | false | Agregação das análises individuais |
| Todas as consultas foram enviadas | Sim | true | Agregação das análises individuais |

Prioridade da análise agregada:

1. qualquer Incorreto → Incorreto;
2. senão, qualquer Não analisado → Não analisado;
3. senão, qualquer Correto (Atrasado) → Correto (Atrasado);
4. caso contrário → Correto.

Uma NF de serviço recém-criada começa com consulta não enviada e análise Não analisado.

### Contrato do planejador de efeitos

invoice-effects.js exporta uma função pura:

    planInvoiceEffects(input)

Entrada:

- estado atual da NF;
- pedido normalizado;
- NFs do mesmo contexto;
- bem atual;
- verificação atual;
- perfil e regra de consolidação;
- IDs e horário apenas quando a chamada já sabe que haverá mudança.

Saída:

    {
      unchanged,
      operation,
      invoice,
      asset,
      removedAsset,
      verification,
      warnings,
      changedEntities,
      auditDescriptor
    }

O módulo não toca DOM, estado global, relógio, gerador de IDs, repositório ou log.

### Passos

- [ ] **PR2.1 — Escrever matriz RED de Consulta Assessoria**

Cobrir no mínimo:

- zero, uma e várias NFs de serviço;
- nenhuma, parte e todas enviadas;
- Não analisado, Correto, Correto (Atrasado) e Incorreto;
- mistura em que Incorreto prevalece;
- remoção da última NF de serviço;
- conversão serviço → consumo;
- conversão permanente → serviço.

Executar:

    node --test tests/unit/service-advisory.test.js

Antes da implementação, o módulo deve inexistir e o teste deve falhar.

- [ ] **PR2.2 — Extrair sem copiar**

Mover normalizeServiceAdvisoryAnalysis, getServiceAdvisoryState e aggregateServiceAdvisories de InvoiceService para service-advisory.js. InvoiceService passa a importar/consumir essas funções.

Não deixar wrapper com matriz alternativa em InvoiceService.

- [ ] **PR2.3 — Corrigir VerificationService**

Nos fluxos que alteram notaFiscal ou campos relacionados:

- obter as NFs do contexto;
- chamar deriveServiceAdvisory;
- aplicar exatamente o resultado;
- remover lógica que simplesmente limpa consAssessoria ou presume estado sem olhar as NFs.

O teste deve cobrir mudança de notaFiscal com e sem NFs de serviço.

- [ ] **PR2.4 — Escrever RED do no-op completo**

Provar:

1. mesma NF e todos os derivados corretos → zero DataService.execute, zero RPC, zero log, zero versão, zero reabertura;
2. mesma NF, mas Consulta Assessoria divergente → existe plano de correção;
3. mesma NF, mas bem derivado divergente → existe plano de correção;
4. mesma NF, mas consolidação precisa ser reaberta por mudança real → existe plano de correção;
5. conteúdo igual em uma inclusão nova → não é no-op.

- [ ] **PR2.5 — Implementar planejador puro**

O planejador deve trabalhar sobre cópias. Primeiro calcula o estado desejado sem:

- criar log;
- gerar timestamp;
- incrementar rowVersion;
- chamar reopenConsolidation;
- mutar arrays globais.

Depois compara os campos persistentes canônicos. Campos técnicos que só nasceriam por causa da escrita não podem tornar um estado igual artificialmente diferente.

- [ ] **PR2.6 — Encerrar cedo quando unchanged**

InvoiceService chama o planejador antes de DataService.execute. Se unchanged=true, retorna o mesmo formato público atual, acrescido de value.unchanged=true, sem executar qualquer efeito.

Todos os consumidores devem continuar encontrando value.invoice e value.warnings.

- [ ] **PR2.7 — Produzir efeitos somente depois da decisão**

Quando houver mudança:

- gerar IDs necessários;
- congelar horário semântico;
- aplicar a mutação planejada;
- reabrir consolidação apenas se o plano disser;
- criar um único log;
- executar persistência.

- [ ] **PR2.8 — Validar contratos Ajv existentes**

Se json-contracts.js ainda aceitar valores fora da matriz, restringir o enum existente e reconstruir o bundle Ajv pelo processo atual. Não adicionar dependência.

- [ ] **PR2.9 — Rodar gates focados**

    node --test tests/unit/service-advisory.test.js
    node --test tests/unit/invoice-effects.test.js
    node --test tests/unit/invoice-service.test.js
    node --test tests/unit/verification-service.test.js
    node --test tests/unit/task5-gateway-integration.test.js
    npm run check:generated
    npm run check

Resultado esperado: uma única matriz, no-op real e correção de derivados ainda executada quando necessária.

- [ ] **PR2.10 — Revisão adversarial dupla**

Passe de contrato:

> A expectativa histórica deste passe de que `A identificar` não participasse da análise pertence ao PR2/#206. Ela foi superada no PR #211 por `nova a_identificar = Incorreto + Pendência`; preserve o trecho abaixo apenas como evidência daquele checkpoint.

- comparar regra com todos os estados individuais atuais;
- conferir legado Correto após o prazo → Correto (Atrasado);
- garantir que A identificar não participa da regra.

Passe adversarial:

- múltiplas NFs;
- mudança de tipo;
- remoção da última;
- verificação ausente;
- estado legado incompleto;
- NF igual com derivados errados;
- falha durante persistência;
- interação com o PR #200.

### Gate de merge

- nenhum cálculo alternativo encontrado por busca;
- mesmo input e mesmo estado produz zero escrita;
- estado derivado inconsistente é corrigido;
- invariantes de bonificação e Pendência preservados;
- dois passes independentes aprovados.

### Publicação e reversão

Publicar primeiro o código que impede novas inconsistências. Observar inclusões, edições e remoções de NF de serviço. Se a agregação divergir, reverter o PR antes de qualquer PR4. PR4 fica formalmente bloqueado até PR2 estar estável.

---

## 14. Contrato comum do programa PR3 — Readiness sistêmico

**Finalidade:** substituir inicialização implícita, polling e interrupção em cascata por um contrato observável de capacidades.

**Dependência:** PR2.

**Não contém:** aumento de timeout, redesenho visual, otimização de bundle ou nova regra de negócio.

**Forma de execução:** PR3 é um único objetivo arquitetural executado em três unidades verificáveis e cronológicas: PR3.1, PR3.2 e PR3.3. Cada unidade possui RED, gate, revisão, publicação e reversão próprios. PR3 só é considerado concluído depois de PR3.3.

Se qualquer unidade deixar de ser independentemente revisável, testável ou reversível, a execução deve parar e transformar as três unidades em PRs físicos separados, preservando os mesmos nomes e objetivos. Não se comprime o trabalho em um mega-diff apenas para manter um número histórico de PR.

### Arquivos centrais

- Create: src/integration/capability-readiness.js
- Modify: index.html
- Modify: config.js
- Modify: src/integration/auth-gate.js
- Modify: src/integration/product-extensions-bootstrap.js
- Modify: src/integration/navigation-context-bootstrap.js
- Modify: src/integration/operational-readiness-bridge.js
- Modify: src/integration/operational-write-performance.js
- Modify: serviços/comandos que hoje recebem política essencial da extensão
- Create: tests/unit/capability-readiness.test.js
- Create: tests/unit/product-extensions-bootstrap.test.js
- Create: tests/unit/dynamic-module-readiness.test.js
- Create: tests/e2e/readiness-degradation.spec.js
- Modify: tests/unit/atomic-analysis-readiness.test.js
- Modify: tests/unit/auth-gate.test.js

### Inventário obrigatório

O PR deve classificar e migrar a prontidão de todos os instaladores encontrados nestas superfícies:

- config.js;
- auth-gate.js;
- product-extensions-bootstrap.js;
- navigation-context-bootstrap.js;
- operational-readiness-bridge.js;
- atomic-analysis-pendency.js;
- controller-session-context.js;
- cycle-b-carteira.js;
- cycle-b-dashboard.js;
- global-competence-selector.js;
- invoice-history-lock.js;
- modal-accessibility.js;
- navigation-history.js;
- operational-write-performance.js;
- prontuario-conditional-reconciler.js;
- school-form-integrity.js;
- service-advisory-corrective-submission.js;
- service-advisory-pendency.js;
- task-10-11-pendency-actions.js;
- task-10-alerts-competence.js;
- task-12-13-retificacoes.js;
- task-9-cross-view.js;
- task-9-focus-bridge.js;
- task-9-pendencias-page.js.

Se a busca encontrar outros setInterval, timeout de instalação, loader tardio ou espera por símbolo global, eles entram no inventário antes de concluir PR3.3.

### Contrato do registry

capability-readiness.js expõe uma API congelada:

    declare({ capability, dependencies, criticality })
    markReady(capability, details)
    markFailed(capability, error)
    markDegraded(capability, reason)
    waitFor(capability)
    snapshot()
    subscribe(listener)

Estados:

- pending;
- ready;
- failed;
- degraded.

Criticidade:

- critical: persistência, autenticação ou regra essencial;
- restricted: falha desabilita somente a função dependente;
- optional: estética, diagnóstico ou otimização.

## 14.1 PR3.1 — Registry e loader

**Objetivo da unidade:** introduzir a infraestrutura de readiness e provar isolamento de falhas sem migrar todos os instaladores.

### Passos de PR3.1

- [ ] **PR3.1.1 — Escrever RED do registry**

Provar:

- waitFor resolve quando markReady é chamado;
- waitFor rejeita com erro estruturado quando markFailed é chamado;
- dependência falha deixa a capacidade dependente indisponível;
- capacidade independente continua;
- snapshot mostra causa e criticidade;
- inscrição recebe uma única transição terminal;
- segunda instalação ou segunda transição terminal não produz estado ambíguo.

- [ ] **PR3.1.2 — Carregar o registry cedo**

Adicionar capability-readiness.js em index.html antes de config.js, autenticação, serviços e integrações que o utilizam. O registry não depende do app principal.

- [ ] **PR3.1.3 — Separar transporte de instalação**

O evento load do script confirma apenas transporte. O contrato do instalador termina em markReady, markFailed ou markDegraded. Quando o arquivo não carrega, o loader registra a falha em nome da capacidade.

- [ ] **PR3.1.4 — Tornar o loader tolerante a falhas**

Substituir a cadeia que encerra todas as extensões por execução orientada a descritores:

1. preservar dependências e ordem declaradas;
2. carregar o arquivo;
3. aguardar a instalação declarada;
4. registrar sucesso, degradação ou falha;
5. continuar capacidades independentes;
6. deixar dependentes explicitamente indisponíveis.

Não usar Promise.all cego em scripts ordenados. Promise.allSettled só é aceitável em grupos comprovadamente independentes.

- [ ] **PR3.1.5 — Tratar instalador que não termina**

Instaladores novos ou adaptados nesta unidade retornam Promise que resolve ou rejeita. Um watchdog apenas diagnóstico pode marcar HUNG_INSTALLER e desabilitar a capacidade, mas:

- não tenta adivinhar sucesso;
- não troca dez segundos por outro valor arbitrário como solução;
- não interrompe módulos independentes;
- identifica a capacidade e a dependência responsáveis.

### Gate de PR3.1

- registry disponível antes dos consumidores;
- transporte e instalação são estados distintos;
- falha simulada não encerra capacidades independentes;
- dependência falha permanece indisponível com causa estruturada;
- nenhum módulo além do necessário para provar o loader foi migrado oportunisticamente;
- dois passes independentes aprovados.

### Publicação e reversão de PR3.1

Publicar com os consumidores antigos ainda compatíveis. O registry pode existir sem ser autoridade de todos os módulos. Se alterar autenticação, navegação ou a ordem vigente fora do escopo de prova, reverter PR3.1. Não iniciar PR3.2 sem snapshot e regressões do loader aprovados.

## 14.2 PR3.2 — Capacidades críticas

**Objetivo da unidade:** migrar primeiro as capacidades cuja ausência torna autenticação, navegação, persistência ou regra essencial inseguras.

### Ordem mínima de migração crítica

1. autenticação e navegação necessária;
2. atomic-analysis-pendency do PR #200;
3. escrita operacional de NF e demais comandos comprovadamente críticos;
4. página, cross-view e ações de Pendências necessárias à operação segura;
5. Consulta Assessoria quando sua instalação condicionar uma regra persistente.

- [ ] **PR3.2.1 — Escrever RED por capacidade crítica**

Para cada capacidade, provar estado inicial, dependências, consequência de falha e controle que deve ficar indisponível. Preservar explicitamente a regressão Incorreto + Pendência do PR #200.

- [ ] **PR3.2.2 — Migrar para Promises e registry**

Trocar polling ou símbolo global pela Promise do instalador e por waitFor da capacidade. Durante a migração, o fluxo Incorreto + Pendência continua protegido mesmo se uma extensão opcional posterior falhar.

- [ ] **PR3.2.3 — Mover semântica essencial para o núcleo**

Auditar operational-write-performance.js e mover para comandos, DataService ou StatePort:

- entidades alteradas por cada comando;
- entidades dispensadas de refresh;
- entidades aplicáveis incrementalmente;
- decisão de resultado remoto autoritativo.

Depois, a extensão conserva somente medição, diagnóstico e otimizações cuja ausência não corrompe estado.

- [ ] **PR3.2.4 — Desabilitar somente o controle dependente**

Quando uma capacidade critical falhar:

- desabilitar o botão ou fluxo correspondente;
- explicar a indisponibilidade em linguagem útil;
- preservar navegação e funções independentes;
- não deixar controle aparentemente ativo que falha depois.

- [ ] **PR3.2.5 — Executar falhas induzidas críticas**

Provar no unitário e no E2E:

1. extensão opcional posterior falha;
2. atomic-analysis-pendency continua ready;
3. escrita crítica independente continua pronta;
4. falha crítica desabilita somente seus consumidores;
5. diagnóstico expõe a causa sem dados sensíveis.

### Gate de PR3.2

- autenticação e navegação necessárias chegam a ready;
- PR #200 continua protegido;
- semântica de consistência não depende da extensão de performance;
- capacidade crítica ausente falha de modo explícito e localizado;
- capacidades independentes continuam após falha induzida;
- dois passes independentes aprovados.

### Publicação e reversão de PR3.2

Inspecionar o snapshot em perfis Controlador, Assistente, Gestão SME e Inventário, sem alterar regras de acesso. Se autenticação, navegação ou escrita crítica não chegar a ready, reverter PR3.2 preservando PR3.1, desde que o loader continue compatível com o caminho anterior.

## 14.3 PR3.3 — Capacidades restritas e opcionais

**Objetivo da unidade:** migrar o restante do inventário, retirar esperas residuais de instalação e fechar o contrato sistêmico.

- [ ] **PR3.3.1 — Escrever RED das capacidades restantes**

Classificar cada módulo restante como restricted ou optional, registrar dependências e provar a consequência localizada de falha.

- [ ] **PR3.3.2 — Migrar os demais instaladores**

Migrar as capacidades de fila, detalhes, retificações, reconciliação, acessibilidade, diagnóstico, performance e estética que não entraram em PR3.2. Nenhuma capacidade opcional pode se tornar dependência silenciosa de regra essencial.

- [ ] **PR3.3.3 — Remover polling de instalação residual**

Trocar waits baseados em setInterval por waitFor da capacidade. MutationObserver só permanece quando observa nós criados depois da instalação; não pode declarar prontidão de regra essencial.

- [ ] **PR3.3.4 — Fechar inventário estático**

Buscar:

    rg -n "setInterval|setTimeout|MutationObserver|Ready|waitFor|install" src/integration config.js app.js

Cada ocorrência deve ser removida, justificada como comportamento de runtime real ou coberta por teste. O timeout de diagnóstico não pode virar mecanismo normal de prontidão.

- [ ] **PR3.3.5 — Executar regressão sistêmica**

    node --test tests/unit/capability-readiness.test.js
    node --test tests/unit/product-extensions-bootstrap.test.js
    node --test tests/unit/dynamic-module-readiness.test.js
    node --test tests/unit/atomic-analysis-readiness.test.js
    node --test tests/unit/auth-gate.test.js
    node --test tests/unit/operational-write-performance-policy.test.js
    npx playwright test tests/e2e/readiness-degradation.spec.js --project=desktop-chromium
    npm run check:architecture
    npm run check

- [ ] **PR3.3.6 — Revisão adversarial dupla**

Revisar:

- falha antes e depois da autenticação;
- script carregado cujo instalador falha;
- dependência em estado degraded;
- módulo opcional ausente;
- navegação iniciada cedo;
- duas instalações do mesmo módulo;
- ordem de eventos;
- compatibilidade temporária com consumidores que aguardavam RadarProductExtensionsReady;
- polling disfarçado dentro de Promise;
- MutationObserver usado indevidamente como readiness.

### Gate de PR3.3 e conclusão de PR3

- nenhuma espera essencial por polling;
- todos os instaladores do inventário têm capacidade e consequência declaradas;
- falha A não impede B e C independentes;
- capacidade dependente fica explicitamente indisponível;
- PR #200 permanece protegido;
- semântica essencial está no núcleo;
- dois passes independentes aprovados.

### Publicação e reversão de PR3.3

Publicar e inspecionar o snapshot completo nos quatro perfis. Se uma capacidade restrita ou opcional quebrar o produto fora de sua superfície, reverter PR3.3 e preservar PR3.1/PR3.2 quando comprovadamente seguros. Não manter como estado final um módulo dividido entre registry e polling.

---

## 15. PR4 — Reparo condicionado dos dados de Consulta Assessoria

**Finalidade:** corrigir somente os contextos que continuam inconsistentes depois que a regra canônica já impede nova divergência.

**Dependências:** PR2 publicado e observado; na ordem padrão, PR3.3 também concluído.

**Não contém:** número fixo de quatro registros, alteração ampla por predicado genérico, criação de ação falsa de usuário ou mudança da regra canônica.

### Arquivos

- Create: scripts/audit/service-advisory-repair-preflight.mjs
- Create: tests/unit/service-advisory-repair-preflight.test.js
- Create: docs/evidence/service-advisory-repair/preflight-approved.json
- Create: migration gerada no momento da execução por supabase migration new service_advisory_conditional_repair
- Create: supabase/tests/database/service-advisory-conditional-repair.test.sql
- Modify: scripts/check-supabase-readiness.js
- Modify: scripts/check-supabase-final-alignment-current.js
- Modify: docs/CURRENT_STAGE.md

O timestamp da migration não deve ser gravado antecipadamente neste plano. Ele será gerado pelo Supabase CLI depois do preflight aprovado para permanecer posterior a todas as migrations que existirem na main naquele momento.

### Definição de candidato

Um contexto é candidato somente quando:

1. a verificação existe;
2. nenhuma registered_invoice de tipo servico existe para a mesma escola, competência e programa;
3. bonification.consAssessoria, bonification.consEnviada ou analysis.consAssessoria diverge do resultado canônico;
4. o contexto não foi modificado depois da fotografia aprovada sem nova análise;
5. não existe Pendência ativa de consAssessoria cujo contexto exija preservar ou reconstruir uma NF vinculada;
6. o conjunto não contém caso ambíguo ou incompleto que exija decisão humana.

Estado canônico sem NF de serviço:

    bonification.consAssessoria = "Não se aplica"
    bonification.consEnviada = false
    analysis.consAssessoria = "Correto"

### Evidência de preflight

O manifesto aprovado deve conter, para cada candidato:

- verification_id;
- school_id;
- competence_id;
- program_id;
- row_version;
- estado antigo dos três campos;
- contagem de NFs de serviço;
- estado canônico esperado;
- horário da consulta;
- SHA do código e migration head;
- hash do conjunto inteiro.

Não guardar credenciais nem dados pessoais desnecessários.

### Passos

- [ ] **PR4.1 — Criar preflight somente de leitura**

O script deve:

1. conectar com as credenciais operacionais já previstas pelo projeto;
2. calcular candidatos usando a mesma matriz de PR2;
3. produzir JSON determinístico ordenado por verification_id;
4. produzir resumo humano;
5. retornar código diferente de zero para caso ambíguo;
6. nunca executar update.

- [ ] **PR4.2 — Escrever testes RED do classificador**

Cobrir:

- divergência elegível;
- estado já correto;
- existe NF de serviço;
- verificação ausente;
- campo legado vazio;
- quinto candidato real;
- conjunto vazio;
- estado ambíguo.

O quinto candidato não é automaticamente corrigido nem automaticamente rejeitado pelo número. Ele é exibido para investigação e só entra se for confirmado pela regra e aprovado no novo conjunto.

- [ ] **PR4.3 — Executar preflight em Production**

Com acesso somente de leitura:

    node scripts/audit/service-advisory-repair-preflight.mjs

Comparar o resultado com a auditoria anterior. O responsável pelo produto aprova explicitamente o conjunto por IDs e versões antes de criar a migration.

- [ ] **PR4.4 — Congelar o conjunto na migration**

Gerar a migration e incluir uma tabela temporária ou CTE de valores esperados com:

- ID;
- versão;
- estado antigo;
- estado final.

A migration deve executar em uma transação e bloquear apenas as linhas-alvo.

- [ ] **PR4.5 — Implementar drift detection**

Antes do update:

- recalcular o universo de candidatos;
- abortar se existir candidato fora do conjunto aprovado;
- para cada linha aprovada, aceitar estado já canônico;
- para cada linha ainda divergente, exigir versão e estado antigo aprovados;
- abortar se uma linha divergente mudou;
- abortar se uma linha desapareceu sem explicação.

Casos válidos:

| Preflight aprovado | Linhas ainda divergentes | Resultado |
| ---: | ---: | --- |
| N | N | Corrigir N |
| N | 0 | Rerun idempotente; zero update |
| N | parte | Corrigir somente a parte, se as demais já estão canônicas |

Caso inválido: universo atual contém divergência não aprovada ou uma linha aprovada mudou para outro estado ainda inconsistente.

- [ ] **PR4.6 — Atualizar e verificar na mesma transação**

Depois do update:

- todas as linhas aprovadas devem estar canônicas;
- não pode restar candidato não aprovado;
- quantidade atualizada deve ser igual à quantidade ainda divergente e elegível no início da transação;
- qualquer diferença lança exceção e desfaz tudo.

- [ ] **PR4.7 — Preservar rastreabilidade sem inventar usuário**

Não inserir administrative_log como se um Controlador ou Assistente tivesse realizado a ação. Usar:

- histórico versionado da migration;
- audit trigger existente, quando aplicável;
- manifesto de preflight e postflight;
- nota técnica no handoff.

Se for necessário um registro adicional, ele deve ser explicitamente identificado como correção técnica e nunca como decisão funcional de usuário.

- [ ] **PR4.8 — Testar em stack limpa e com estados intermediários**

    npm run supabase:reset
    npm run supabase:test:db
    npm run supabase:lint:db
    npm run typecheck:database
    npm run test:backup-restore

O pgTAP deve simular:

- execução inicial;
- rerun;
- parte já corrigida;
- versão alterada e ainda divergente;
- candidato extra;
- NF de serviço surgida entre preflight e update.

- [ ] **PR4.9 — Revisar migration linha a linha**

Revisão independente obrigatória do SQL, do conjunto aprovado e das asserções. Não aprovar apenas porque a stack limpa ficou verde.

- [ ] **PR4.10 — Executar em Production**

Exige autorização explícita para escrita em Production.

Imediatamente antes:

1. refazer o preflight;
2. comparar o hash com o conjunto aprovado;
3. confirmar backup/restauração;
4. confirmar PR2 publicado;
5. confirmar ausência de operação concorrente planejada;
6. aplicar migration;
7. executar postflight somente de leitura;
8. guardar evidência.

### Condições de parada

- conjunto ou hash mudou;
- apareceu candidato não explicado;
- PR2 não está publicado;
- backup/restauração não está comprovado;
- uma linha mudou e continua inconsistente;
- não há autorização explícita de Production.

### Gate de publicação

- preflight e postflight sem divergência;
- migration idempotente;
- exatamente o conjunto aprovado foi afetado;
- nenhuma ação falsa de usuário;
- contexto anteriormente bloqueado passa a obedecer à regra canônica;
- demais verificações não mudaram.

### Reversão

Não editar nem apagar a migration aplicada. Se o estado final estiver errado:

1. bloquear novas ações relacionadas;
2. preservar o snapshot anterior;
3. analisar se restaurar reintroduziria o defeito;
4. criar migration corretiva forward-only com novo preflight;
5. publicar somente após nova autorização.

---

## 16. PR5 — Idempotência real da gravação de NF e RPC v2

**Finalidade:** garantir que a mesma intenção de salvar produza um único commit, mesmo com resposta perdida, retry, concorrência ou dois clientes enviando a mesma intenção.

**Dependências:** PR2 e PR3.3; PR4 não altera a interface, mas é executado antes na ordem padrão.

**Não contém:** deduplicação por conteúdo, overload da RPC atual, resposta autoritativa completa de PR8A/PR8B ou idempotência de comandos não comprovados neste incidente.

### Arquivos

- Create: src/application/client-id.js
- Create: src/domain/invoice-save-intent.js
- Modify: index.html
- Modify: app.js
- Modify: src/application/directory-service.js
- Modify: src/application/invoice-service.js
- Modify: src/application/inventory-service.js
- Modify: src/application/pendency-service.js
- Modify: src/application/verification-service.js
- Modify: src/data/repository-contract.js
- Modify: src/data/supabase-repository.js
- Create: migration gerada por supabase migration new invoice_save_idempotency_v2
- Create: tests/unit/invoice-save-intent.test.js
- Create: tests/unit/invoice-idempotency.test.js
- Create: tests/unit/client-id.test.js
- Modify: testes unitários dos serviços produtores de identificadores, conforme o inventário
- Create: tests/integration/invoice-idempotency-concurrency.test.js
- Create: supabase/tests/database/invoice-idempotency-v2.test.sql
- Modify: tests/unit/supabase-repository.test.js
- Modify: tests/unit/atomic-invoice-rpc.test.js
- Modify: src/types/database.types.ts após geração

### Contrato do gerador compartilhado de identificadores

O runtime atual das operações de NF já recebe createPendencyClientId, baseado em UUID, por transactionalDependencies. Portanto, o fallback de InvoiceService não é causa da duplicidade observada. A causa continua sendo a ausência de contenção imediata e de idempotência server-side.

PR5 formaliza uma autoridade única, por exemplo:

    createClientId(prefix, environment = globalThis)

Regras:

- usar crypto.randomUUID() quando disponível;
- usar crypto.getRandomValues() para construir um identificador aleatório equivalente quando randomUUID não estiver disponível;
- nunca usar somente Date.now() como fonte de unicidade persistente;
- falhar explicitamente se não existir fonte aleatória segura, em vez de criar um identificador previsivelmente fraco;
- aceitar injeção determinística em testes;
- manter prefixo apenas como classificação legível, não como garantia de unicidade.

O inventário inicial já possui um caso efetivo: DirectoryService é instanciado antes de transactionalDependencies e atualmente pode usar seu fallback prefix-Date.now() ao criar IDs de programa, controlador e integrante de Inventário. app.js deve passar o gerador compartilhado também a esse serviço.

InventoryService, PendencyService, InvoiceService e VerificationService permanecem no inventário para remover fallbacks internos fracos e garantir uso uniforme, embora o runtime atual já injete o gerador compartilhado nesses serviços. AuditService não deve receber uma alteração fictícia: seus IDs de log continuam sendo produzidos pelo contrato appendRadarLog, que deve ser auditado como consumidor separado.

Essa mudança é fortalecimento de consistência e redução de dívida arquitetural. Ela não reclassifica o incidente de NF como colisão de IDs.

### Contrato de InvoiceSaveIntent

Uma intenção é criada uma vez quando o gesto é aceito e congela:

    {
      operationName: "invoice:save",
      operationKey,
      normalizedPayload,
      invoiceId,
      assetId,
      administrativeLogId,
      semanticTimestamp,
      expectedInvoiceVersion,
      expectedAssetVersion,
      expectedVerificationVersion
    }

Regras:

- operationKey é UUID;
- o pedido normalizado não muda entre tentativas;
- IDs gerados não mudam entre tentativas;
- o servidor calcula ou confirma o hash do pedido canônico;
- mesma chave + mesmo hash retorna o mesmo resultado;
- mesma chave + hash diferente falha com IDEMPOTENCY_KEY_REUSED;
- chaves diferentes + conteúdo igual continuam sendo duas intenções legítimas.

### Contrato da RPC

Criar função pública com nome novo:

    public.save_invoice_with_effects_v2(...)

Todos os parâmetros necessários são explícitos, inclusive p_operation_key. Não criar nova assinatura de save_invoice_with_effects.

A implementação privada:

- valida auth.uid();
- valida operação e versões como hoje;
- reserva a chave no mesmo transaction scope;
- serializa concorrentes pela chave;
- compara request_hash;
- executa os efeitos uma vez;
- grava o resultado antes do commit;
- devolve o resultado gravado em retry.

A RPC v1 permanece disponível durante todo o rollout.

### Estrutura privada

Criar radar_private.invoice_operation_idempotency com:

- operation_name;
- operation_key;
- actor_user_id;
- request_hash;
- status;
- result;
- created_at;
- completed_at;
- chave primária em operação, chave e ator.

Revogar acesso direto. Somente a função privada e o service_role estritamente necessário podem operar a tabela.

Não criar rotina de limpeza agora. Preservar os registros e medir crescimento; política de retenção exige decisão separada baseada em volume.

### Passos

- [ ] **PR5.0 — Formalizar IDs persistentes gerados no cliente**

Antes do intent, criar o gerador compartilhado e inventariar todos os produtores e consumidores de IDs persistentes.

Os testes devem:

- congelar Date.now() para o mesmo milissegundo;
- cobrir o caminho normal com crypto.randomUUID();
- indisponibilizar randomUUID e cobrir o fallback com crypto.getRandomValues();
- demonstrar, sob entradas aleatórias controladas e distintas, que chamadas feitas no mesmo milissegundo recebem identificadores distintos;
- permitir injeção determinística do gerador;
- provar erro explícito quando nenhuma fonte aleatória segura existe;
- confirmar que DirectoryService recebe o gerador compartilhado em app.js;
- terminar com busca estática por produtores persistentes que dependam exclusivamente de Date.now().

Comando mínimo de auditoria:

    rg -n "Date\.now\(\)|createId|randomUUID|getRandomValues" src app.js

O teste não afirma provar ausência absoluta de colisões de UUID. Ele prova a propriedade arquitetural relevante: a geração não depende exclusivamente do relógio e chamadas no mesmo milissegundo permanecem distinguíveis sob condições controladas.

- [ ] **PR5.1 — Escrever RED do intent**

Provar:

- uma intenção cria UUID válido;
- retry reutiliza chave, IDs, horário e payload;
- novo gesto cria outra chave;
- tentativa de alterar payload congelado falha no cliente;
- JSON canônico é estável independentemente da ordem original de chaves.

- [ ] **PR5.2 — Integrar o intent à trava do PR1**

Usar WeakMap por formulário:

- ao aceitar o gesto, criar e guardar a intenção;
- durante operação normal, manter campos e botão bloqueados;
- em sucesso confirmado, encerrar a intenção;
- em validação que comprovadamente ocorreu antes do commit, encerrar e permitir correção;
- em timeout, queda de conexão ou resposta ambígua, preservar a intenção e oferecer Tentar confirmar novamente;
- o retry envia a mesma intenção.

Não gerar nova intenção automaticamente em erro ambíguo.

- [ ] **PR5.3 — Escrever pgTAP RED**

Cobrir:

- primeiro commit;
- retry exato;
- mesma chave com payload diferente;
- mesmo conteúdo com duas chaves;
- isolamento por actor_user_id;
- permissões diretas negadas;
- versão esperada incorreta;
- resultado preservado.

- [ ] **PR5.4 — Escrever teste concorrente RED**

No Supabase local, disparar duas chamadas autenticadas simultâneas com a mesma intenção. Resultado:

    1 registered_invoice
    1 asset quando aplicável
    1 administrative_log
    1 atualização de verification
    2 respostas logicamente iguais

O teste deve usar concorrência real de chamadas, não duas chamadas sequenciais disfarçadas.

- [ ] **PR5.5 — Criar tabela e função v2**

Usar radar_private para armazenamento e implementação. A função pública v2 deve ter search_path explícito, grants explícitos e nenhum acesso anon.

Para serialização:

1. tentar reservar a chave;
2. adquirir a linha correspondente;
3. se concluída e hash igual, retornar result;
4. se hash diferente, rejeitar;
5. se nova, executar a lógica atômica vigente;
6. gravar result e completed_at;
7. retornar.

Toda essa sequência ocorre na mesma transação da NF, bem, verificação e log.

- [ ] **PR5.6 — Preservar o contrato v1**

Os testes existentes de save_invoice_with_effects continuam verdes. Não alterar defaults nem criar overload. O repositório expõe capacidade distinta, por exemplo atomicInvoiceEffectsV2.

- [ ] **PR5.7 — Migrar serviço e repositório**

SupabaseRepository chama a v2 quando recebe InvoiceSaveIntent válido. InvoiceService deixa de gerar novamente os valores congelados dentro de cada tentativa.

Não ativar remoteResultIsAuthoritative aqui; PR8A ainda precisa completar log, remoções e aplicação local, e PR8B fará a ativação.

- [ ] **PR5.8 — Simular resposta perdida**

Executar a primeira chamada até o commit e descartar sua resposta. Repetir a mesma intenção. Provar:

- nenhuma segunda NF;
- nenhum segundo bem;
- nenhum segundo log;
- mesma chave e mesmo resultado;
- UI não informa Não salvou.

- [ ] **PR5.9 — Testar duas abas corretamente**

Caso A: duas abas enviam a mesma intenção serializada → um resultado.

Caso B: duas abas criam intenções diferentes com conteúdo igual → duas NFs legítimas.

Isso protege idempotência sem introduzir deduplicação por conteúdo.

- [ ] **PR5.10 — Gerar tipos e validar banco**

    npm run supabase:reset
    npm run supabase:test:db
    npm run supabase:lint:db
    npm run supabase:gen:types
    npm run typecheck:database
    node --test tests/unit/client-id.test.js
    node --test tests/unit/invoice-save-intent.test.js
    node --test tests/unit/invoice-idempotency.test.js
    node --test tests/unit/supabase-repository.test.js
    node --test tests/integration/invoice-idempotency-concurrency.test.js

- [ ] **PR5.11 — Fazer rollout compatível**

Ordem de Production, sempre com autorização explícita:

1. aplicar migration que adiciona v2 sem retirar v1;
2. executar smoke direto da v2 com transação controlada;
3. confirmar grants;
4. publicar cliente;
5. monitorar erros v1/v2;
6. manter v1 durante todo o período de estabilização.

- [ ] **PR5.12 — Revisão adversarial dupla**

Verificar:

- commit seguido de perda de resposta;
- concorrência antes e depois da reserva;
- transação abortada;
- hash diferente;
- ator diferente;
- versão obsoleta;
- intent criado cedo demais;
- formulário editado em estado ambíguo;
- duas abas;
- replay posterior;
- compatibilidade PostgREST;
- ausência de overload.

### Gate de merge

- nenhum produtor persistente inventariado depende exclusivamente de Date.now();
- DirectoryService recebe o gerador compartilhado;
- testes cobrem mesmo milissegundo, caminho randomUUID, fallback getRandomValues e injeção determinística;
- documentação e regressões mantêm explícito que o gerador antigo não foi a causa comprovada do incidente de NF;
- concorrência real gera um commit;
- resposta perdida é recuperada;
- mesma chave com payload diferente é rejeitada;
- duas chaves com conteúdo igual permanecem legítimas;
- v1 continua funcional;
- tabela privada não é acessível diretamente;
- dois passes independentes aprovados.

### Reversão

Primeiro devolver o cliente à v1 e publicar. A RPC v2 e a tabela permanecem no banco enquanto houver possibilidade de retry de cliente v2. Só depois de confirmar ausência de clientes dependentes uma migration futura pode desativar a função; não apagar registros de operação durante resposta a incidente.

---

## 17. PR6 — Contrato semântico único das Pendências

**Finalidade:** fazer todas as superfícies exibirem a mesma etapa atual, idade, próximo ator, próxima ação, prioridade e ações permitidas.

**Dependência:** PR3.3.

**Não contém:** redesign visual completo, mudança da competência global, agrupamento final ou alteração das regras de consolidação.

### Arquivos

- Modify: src/domain/operational-projection.js
- Create: src/domain/pendency-queue-model.js
- Create: src/domain/pendency-action-model.js
- Modify: src/domain/pendencias-view-model.js
- Modify: src/integration/task-9-cross-view.js
- Modify: src/integration/task-9-pendencias-page.js
- Modify: src/integration/task-10-11-pendency-actions.js
- Modify: demais consumidores encontrados pela busca
- Create: tests/unit/pendency-queue-model.test.js
- Create: tests/unit/pendency-action-model.test.js
- Modify: tests/pendencias-view-model.test.js
- Modify: tests/pendency-cancelled-reopen.test.js
- Modify: tests/e2e/task-9-cross-view.spec.js
- Modify: tests/e2e/task-10-11-pendencias.spec.js

### Divisão de responsabilidades

operational-projection.js:

- getOperationalBaseDate;
- getConcreteNextAction;
- sortOperationalActions;
- próxima pessoa/área responsável;
- prioridade.

pendency-queue-model.js:

- projeta registros usando operational-projection;
- conta;
- filtra;
- ordena;
- escolhe segmento inicial;
- define faixas de idade.

pendency-action-model.js:

- recebe a projeção canônica e as capacidades do perfil;
- escolhe ação primária e secundárias;
- não recalcula idade, ator ou etapa.

pendencias-view-model.js e integrações:

- consomem os modelos;
- não mantêm NEXT_ACTIONS, waitingSince ou listas de reabertura próprias.

### Matriz de ações

| Estado | Ação primária | Secundárias |
| --- | --- | --- |
| Aberta | Registrar novo envio | detalhes, Prontuário, contato, cancelar |
| Aguardando reanálise | Reanalisar | detalhes, substituição quando cabível, Prontuário, contato, cancelar |
| Resolvida | Detalhes | reabrir, Prontuário |
| Cancelada | Detalhes | reabrir, Prontuário |

Contato só existe para Aberta e Aguardando reanálise. Permissões do perfil filtram ações antes de renderizar.

### Regra de idade

- Aberta original: dataAbertura;
- Aberta após reabertura: evento de reabertura mais recente;
- Aberta após reanálise incorreta: evento de retorno mais recente;
- Aberta após arquivo indisponível: evento correspondente mais recente;
- Aguardando reanálise: tentativa aguardando mais recente, usando dataRegistro ou dataDisponibilizacao;
- Resolvida: dataResolucao ou último evento equivalente;
- Cancelada: data de cancelamento.

### Passos

- [ ] **PR6.1 — Escrever RED das datas**

Casos mínimos:

- aberta original há 40 dias;
- resolvida e reaberta ontem;
- reanálise incorreta ontem;
- arquivo indisponível ontem;
- novo envio disponível hoje;
- histórico fora de ordem;
- ausência de evento opcional.

Todos os consumidores devem obter a mesma data-base.

- [ ] **PR6.2 — Escrever RED da ação canônica**

Para cada estado e perfil, verificar:

- ator;
- rótulo da próxima ação;
- prioridade;
- ação primária;
- secundárias;
- ausência de contato em estado final;
- reabertura de Resolvida e Cancelada.

- [ ] **PR6.3 — Fortalecer operational-projection**

Manter as funções atuais como autoridade e acrescentar somente o que faltar para produzir uma projeção completa. Não criar nova função equivalente em queue-model.

- [ ] **PR6.4 — Criar modelo da fila**

Entrada:

    {
      pendencies,
      schools,
      programs,
      controllers,
      contacts,
      access,
      now
    }

Saída:

    {
      records,
      counts,
      segments,
      initialSegment,
      filterOptions
    }

Cada record carrega operationalBaseDate, ageDays e nextAction vindos da autoridade canônica.

- [ ] **PR6.5 — Criar matriz única de ações**

PendencyActionModel retorna descritores, não HTML:

    {
      primary,
      secondary,
      destructive
    }

Handlers de task-10-11-pendency-actions.js usam os IDs do modelo e deixam de testar listas próprias de status.

- [ ] **PR6.6 — Migrar pendencias-view-model**

Remover:

- NEXT_ACTIONS próprio;
- cálculo próprio de waitingSince;
- faixas antigas de idade;
- regra própria de ordenação operacional.

Preservar compatibilidade de formato necessária aos componentes durante o mesmo PR.

- [ ] **PR6.7 — Migrar cross-view**

task-9-cross-view.js deve consumir os records canônicos para contagem, idade e ordem. A busca obrigatória deve localizar outras views que exibem as mesmas informações.

- [ ] **PR6.8 — Provar consistência entre telas**

Com a mesma Pendência, comparar:

- fila;
- cartão cross-view;
- detalhe;
- alerta, se exibir a ação.

As quatro superfícies devem mostrar a mesma idade, ator e ação.

- [ ] **PR6.9 — Rodar gates focados**

    node --test tests/unit/pendency-queue-model.test.js
    node --test tests/unit/pendency-action-model.test.js
    node --test tests/pendencias-view-model.test.js
    node --test tests/pendency-cancelled-reopen.test.js
    node --test tests/unit/pendency-service.test.js
    node --test tests/unit/pendency-service-access.test.js
    node --test tests/unit/pendency-reanalysis-roles.test.js
    npx playwright test tests/e2e/task-9-cross-view.spec.js --project=desktop-chromium
    npx playwright test tests/e2e/task-10-11-pendencias.spec.js --project=desktop-chromium

- [ ] **PR6.10 — Revisão adversarial dupla**

Buscar:

    rg -n "waitingSince|dataAbertura|Aguardando reanálise|nextActor|nextAction|reabr" src app.js tests

Verificar:

- histórico legado;
- eventos acentuados e sem acento já aceitos;
- tentativas fora de ordem;
- Cancelada;
- perfis diferentes;
- todas as competências;
- arquivo indisponível;
- novo envio;
- interação com PR #200.

### Gate de merge

- uma Pendência produz a mesma semântica em todas as views;
- Cancelada e Resolvida podem reabrir quando o perfil permite;
- nenhuma terceira matriz encontrada;
- filtros futuros recebem ageDays canônico;
- dois passes independentes aprovados.

### Publicação e reversão

Publicar sem alterar layout principal. Comparar uma amostra de cada estado em todas as telas. Se houver divergência, reverter o PR inteiro; não restaurar cálculos locais como correção rápida.

---

## 18. PR6B — Preservação da competência global

**Finalidade:** separar o contexto transversal do detalhe da Pendência do contexto mensal global do restante da aplicação.

**Dependência:** PR6.

### Arquivos

- Modify: src/integration/global-search.js
- Modify: src/integration/operational-readiness-bridge.js
- Modify: src/integration/task-9-cross-view.js
- Modify: src/integration/task-9-pendencias-page.js
- Modify, se necessário: src/domain/global-search-index.js
- Modify: tests/unit/global-search-integration.test.js
- Modify: tests/e2e/pendency-cross-competence.spec.js
- Create: tests/e2e/pendency-global-competence-preservation.spec.js

### Regra

| Ação | Competência global |
| --- | --- |
| Abrir fila de Pendências | Não muda |
| Abrir detalhe pela fila | Não muda |
| Abrir detalhe pela busca global | Não muda |
| Fechar detalhe | Resta exatamente o contexto visual anterior |
| Abrir no Prontuário | Muda explicitamente para a competência da Pendência |

### Passos

- [ ] **PR6B.1 — Escrever RED da busca histórica**

Jornada:

    competência global = agosto
    buscar Pendência de março
    abrir detalhe
    fechar detalhe
    competência global continua agosto

Antes da correção, global-search.js chama selectCompetenceContext com source global-search-pendency e o teste deve falhar.

- [ ] **PR6B.2 — Escrever RED do Prontuário**

Jornada:

    competência global = agosto
    abrir Pendência de março
    escolher Abrir no Prontuário
    competência global passa para março
    navegação informa visualmente a mudança

- [ ] **PR6B.3 — Remover seleção implícita**

Em global-search.js, resultado do tipo pendency:

1. navega para Pendências;
2. abre o detalhe;
3. não chama selectCompetenceContext.

Resultado do tipo competence e navegação explícita para Prontuário mantêm a seleção intencional.

- [ ] **PR6B.4 — Preservar contexto visual**

O detalhe recebe escola, programa e competência como view context próprio. Não usa a competência global para localizar o registro histórico.

Ao fechar:

- foco volta ao resultado/cartão de origem;
- filtros e rolagem são preservados quando possível;
- competência global não é reescrita.

- [ ] **PR6B.5 — Testar navegação, back e cross-view**

Cobrir:

- busca global;
- fila;
- cross-view;
- fechar modal;
- botão voltar;
- Abrir no Prontuário;
- duas Pendências de competências diferentes em sequência.

- [ ] **PR6B.6 — Rodar gates**

    node --test tests/unit/global-search-integration.test.js
    node --test tests/unit/competence-context.test.js
    npx playwright test tests/e2e/pendency-cross-competence.spec.js --project=desktop-chromium
    npx playwright test tests/e2e/pendency-global-competence-preservation.spec.js --project=desktop-chromium

### Gate de merge

- detalhe histórico não muda o mês global;
- Prontuário muda de forma explícita;
- Dashboard e Carteira continuam no mês anterior depois de apenas consultar/fechar;
- nenhuma regressão nos resultados de programa ou competência da busca.

### Publicação e reversão

Smoke em Production com uma Pendência histórica, sem alterar dados. Se o detalhe deixar de localizar a Pendência ou o Prontuário abrir no mês errado, reverter.

---

## 19. PR7A — Fila operacional de Pendências

**Finalidade:** tornar o trabalho prioritário encontrável sem criar outra fonte semântica.

**Dependências:** PR6 e PR6B.

**Não contém:** alteração de persistência, mudança da regra de idade, remoção de Ver detalhes ou remodelagem profunda do modal.

### Arquivos

- Modify: src/integration/task-9-pendencias-page.js
- Modify: src/integration/pendency-passive-queue-ux.js
- Modify: src/styles/task-9-pendencias.css
- Modify: src/styles/pendency-passive-queue.css
- Modify: src/domain/pendency-queue-model.js
- Create: tests/unit/pendency-filter-options.test.js
- Create: tests/e2e/pendency-queue-filters.spec.js
- Create: tests/e2e/pendency-queue-hierarchy.spec.js
- Modify: tests/e2e/task-9-pendencias.spec.js

### Organização da fila

Para perfis que podem reanalisar:

1. Para reanalisar — status Aguardando reanálise;
2. Aguardando escola — status Aberta;
3. Resolvidas;
4. Canceladas.

Para perfis sem capacidade de reanálise, o primeiro segmento é o primeiro que contém trabalho permitido ao perfil. Um registro explicitamente solicitado sempre prevalece sobre a escolha automática.

### Filtros

Visíveis:

- Minha carteira / Todas;
- R.A.;
- Controlador, quando o perfil puder utilizá-lo;
- escola pesquisável;
- tempo na etapa;
- busca textual.

Avançados:

- programa;
- documento;
- erro;
- competência.

Não criar outro filtro de status, porque os segmentos já expressam esse eixo.

Faixas canônicas de idade:

| ID | Rótulo | Dias |
| --- | --- | --- |
| today | Hoje | 0 |
| 1-3 | 1–3 dias | 1 a 3 |
| 4-7 | 4–7 dias | 4 a 7 |
| 8-15 | 8–15 dias | 8 a 15 |
| 16+ | 16 dias ou mais | 16 ou mais |

### Passos

- [ ] **PR7A.1 — Escrever RED da prioridade inicial**

Com uma Aberta antiga e uma Aguardando reanálise recente:

- perfil capaz de reanalisar abre Para reanalisar;
- perfil sem capacidade abre Aguardando escola;
- link direto para registro abre o segmento daquele registro.

- [ ] **PR7A.2 — Escrever RED dos filtros combinados**

Cobrir:

- Minha carteira;
- Todas;
- R.A.;
- Controlador;
- escola por nome, designação e código;
- cada faixa de idade;
- combinação de filtro visível e avançado;
- limpar filtros;
- contagens depois de filtrar.

Minha carteira usa a carteira formal de escolas do usuário. Não cria atribuição individual de Pendência.

- [ ] **PR7A.3 — Promover filtros essenciais**

Mover os filtros já existentes para a hierarquia definida. O problema é encontrabilidade, não ausência completa. Evitar duplicar controles ou manter duas fontes de estado de filtro.

- [ ] **PR7A.4 — Implementar escola pesquisável**

Usar combobox acessível com:

- busca por nome, designação e código;
- setas;
- Enter;
- Escape;
- anúncio da quantidade de resultados;
- opção Todas.

- [ ] **PR7A.5 — Aplicar faixas canônicas**

PendencyQueueModel recebe ageDays do PR6 e filtra pelas cinco faixas. Nenhum componente recalcula datas.

- [ ] **PR7A.6 — Reduzir ações repetidas**

Cada cartão ou linha mostra:

- identificação da escola;
- competência e programa;
- documento/erro;
- tempo na etapa;
- próximo ator e próxima ação;
- uma ação primária do PendencyActionModel;
- acesso discreto às secundárias.

Não criar ação no cabeçalho da escola se ela exigir uma Pendência/competência específica.

- [ ] **PR7A.7 — Preservar cronologia**

Ordem padrão usa prioridade e data operacional canônicas entre todas as escolas.

Agrupar por escola pode existir como visualização opcional, nunca como única estrutura e nunca como ordenação que esconde um item mais urgente. O estado padrão permanece cronológico-operacional.

- [ ] **PR7A.8 — Tornar o estado dos filtros compreensível**

Exibir:

- quantidade total;
- quantidade filtrada;
- filtros ativos;
- botão Limpar;
- estado vazio com explicação.

Não mostrar zero silencioso sem indicar qual filtro eliminou os resultados.

- [ ] **PR7A.9 — Rodar gates**

    node --test tests/unit/pendency-queue-model.test.js
    node --test tests/unit/pendency-filter-options.test.js
    node --test tests/pendencias-view-model.test.js
    npx playwright test tests/e2e/pendency-queue-filters.spec.js --project=desktop-chromium
    npx playwright test tests/e2e/pendency-queue-hierarchy.spec.js --project=desktop-chromium
    npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium

- [ ] **PR7A.10 — Revisão adversarial**

Verificar:

- perfil sem carteira;
- escola sem Controlador;
- R.A. ausente;
- 0 e 16 dias;
- todas as competências;
- filtro avançado escondido mas ativo;
- link direto;
- grande volume;
- mobile sem ainda antecipar as mudanças do PR7B.

### Gate de merge

- prioridade de reanálise visível;
- filtros essenciais encontráveis;
- sem status duplicado;
- Minha carteira corresponde ao modelo;
- cronologia preservada;
- uma ação principal coerente por registro.

### Publicação e reversão

Como não há migration, reverter o PR se a fila esconder registros, perder a transversalidade de competências ou apresentar contagens inconsistentes.

---

## 20. PR7B — Detalhes, reanálise, mobile e acessibilidade

**Finalidade:** tornar fila e detalhe operáveis com mouse, teclado e telas pequenas, incorporando ao render base o comportamento que hoje depende de decorator tardio.

**Dependência:** PR7A.

**Decisão sobre Ver detalhes:** o controle permanece neste programa de correções. O PR move a interação do cartão para o render base e registra se há redundância; eventual remoção exige decisão posterior separada.

### Arquivos

- Modify: src/integration/task-9-pendencias-page.js
- Modify: src/integration/pendency-passive-queue-ux.js
- Modify: src/integration/task-9-focus-bridge.js
- Modify: src/integration/task-10-11-pendency-actions.js
- Modify: src/styles/task-9-pendencias.css
- Modify: src/styles/pendency-passive-queue.css
- Modify: playwright.config.js
- Create: tests/e2e/pendency-keyboard-accessibility.spec.js
- Create: tests/e2e/mobile-pendency-ux.spec.js
- Modify: tests/e2e/accessibility-scans.spec.js
- Modify: tests/e2e/task-10-11-pendencias.spec.js

### Contrato de interação base

- cartão/linha abre detalhe por clique em área não interativa;
- cartão/linha recebe foco visível;
- Enter e Space abrem detalhe;
- botões, links, inputs e menus internos não propagam abertura;
- nome acessível identifica escola, documento, estado e ação;
- Escape fecha;
- foco retorna ao elemento originador;
- Ver detalhes continua disponível explicitamente;
- nenhum desses comportamentos depende de MutationObserver tardio.

### Passos

- [ ] **PR7B.1 — Escrever RED sem a extensão passiva**

Bloquear pendency-passive-queue-ux.js no teste e provar que hoje:

- cartão não abre;
- teclado não funciona;
- foco/nome acessível são insuficientes.

O teste deve passar somente quando o comportamento estiver no render base.

- [ ] **PR7B.2 — Mover interação para task-9-pendencias-page.js**

Renderizar atributos e instalar handlers no momento em que a linha/cartão nasce. Não transformar contêiner com botões internos em botão HTML aninhado inválido.

Tratar explicitamente:

- target.closest para controles internos;
- keydown;
- prevenção de scroll ao usar Space;
- limpeza dos handlers em rerender;
- identificação do elemento originador.

- [ ] **PR7B.3 — Reduzir a extensão passiva**

Remover dela clique, tabindex, nome acessível e teclado já movidos. Ela pode permanecer apenas com melhoria realmente opcional; se ficar sem responsabilidade, removê-la junto de loader, CSS e testes.

- [ ] **PR7B.4 — Organizar o detalhe**

Usar seções estáveis:

1. identificação da escola e contexto;
2. estado e tempo na etapa;
3. documento e erros;
4. tentativas e histórico;
5. contatos;
6. ações permitidas.

Remover repetição visual de competência, sem retirar informação necessária.

- [ ] **PR7B.5 — Preservar o diálogo de reanálise**

Manter regras corretas existentes. Melhorar apenas:

- hierarquia;
- labels;
- valor atual;
- resultado;
- observação;
- arquivo;
- confirmação de efeito;
- foco e mensagens de erro.

Não fundir reanálise com detalhe se isso esconder a ação principal.

- [ ] **PR7B.6 — Tratar Cancelada e Resolvida**

Exibir:

- motivo e data de cancelamento;
- resolução;
- histórico;
- reabrir quando permitido;
- ausência de contato em estado final.

- [ ] **PR7B.7 — Ajustar mobile**

Criar teste mobile compatível com o testMatch de Playwright e cobrir Pixel/Chromium e iPhone/WebKit.

Garantir:

- sem rolagem horizontal;
- alvo de toque adequado;
- rodapé do modal alcançável;
- títulos e valores não se sobrepõem;
- filtros não ocupam a tela inteira sem saída;
- teclado virtual não esconde a ação;
- foco visível.

- [ ] **PR7B.8 — Testar acessibilidade**

Cobrir:

- Tab;
- Shift+Tab;
- Enter;
- Space;
- Escape;
- foco de retorno;
- nome acessível;
- ordem de headings;
- labels;
- controles internos sem propagação;
- scan automatizado já adotado pelo projeto.

- [ ] **PR7B.9 — Rodar gates**

    npx playwright test tests/e2e/pendency-keyboard-accessibility.spec.js --project=desktop-chromium
    npx playwright test tests/e2e/mobile-pendency-ux.spec.js --project=mobile-chromium --project=mobile-webkit
    npx playwright test tests/e2e/accessibility-scans.spec.js --project=desktop-chromium
    npx playwright test tests/e2e/task-10-11-pendencias.spec.js --project=desktop-chromium
    npm run lint:e2e

- [ ] **PR7B.10 — Revisão adversarial**

Verificar:

- decorator bloqueado;
- carregamento lento;
- rerender e foco;
- clique no menu;
- leitores de estrutura;
- viewport estreito;
- texto longo;
- histórico grande;
- estado sem tentativas;
- retorno da competência do PR6B.

### Gate de merge

- comportamento essencial funciona sem decorator;
- Ver detalhes permanece;
- teclado e mouse equivalentes;
- foco retorna;
- mobile Chromium e WebKit verdes;
- sem perda das regras de reanálise.

### Publicação e reversão

Smoke com mouse, teclado e celular. Se o foco desaparecer, controles dispararem duas ações ou modal ficar inacessível, reverter.

---

## 21. Contrato comum de PR8A e PR8B — Escrita remota incremental

**Finalidade conjunta:** fazer a tela refletir exatamente o commit remoto sem reler coleções inteiras e sem repetir escrita quando a atualização local falhar.

**Dependência:** PR5; executados depois de PR7B na ordem padrão.

**Não contém:** motor genérico de patches, transmissão de telemetria, remoção imediata das RPCs antigas ou idempotência de delete inserida sem evidência.

**Decisão de entrega:** PR8A e PR8B são dois PRs reais desde o início. PR8A instala contrato remoto e operações de estado compatíveis, mas não ativa o novo caminho na jornada principal. PR8B só começa depois de PR8A estar publicado e validado.

### Contrato remoto comum

save_invoice_with_effects_v2 passa a devolver:

    {
      operationKey,
      invoice,
      asset,
      deletedAssetId,
      verification,
      administrativeLog,
      versions,
      changedEntities
    }

Regras:

- asset é o bem atual ou null;
- deletedAssetId informa remoção permanente → não permanente;
- administrativeLog é a linha realmente inserida;
- versions contém as versões confirmadas;
- changedEntities lista somente entidades alteradas;
- o resultado guardado na idempotência é exatamente esse.

Criar nome público explícito para remoção v2, sem overload:

    public.delete_invoice_with_effects_v2(...)

Resultado:

    {
      deletedInvoiceId,
      deletedAssetId,
      verification,
      administrativeLog,
      versions,
      changedEntities
    }

PR8A não declara a remoção idempotente por chave sem regressão que comprove essa necessidade. Se o passe adversarial mostrar que perda de resposta do delete pertence à mesma família do save, a execução deve parar e voltar ao desenho de intent do PR5. Não inserir chave decorativa nem ampliar o contrato silenciosamente.

### Contrato do StatePort

Adicionar operação explícita:

    applyEntityChanges({ upserts, removals }, options)

Entidades aceitas:

- registeredInvoices;
- assets;
- verifications;
- administrativeLogs.

Operações:

- upsert por ID;
- remove por ID;
- aplicação em memória;
- preservação das estruturas legadas necessárias;
- nenhuma substituição de coleção inteira;
- erro estruturado para entidade ou ID desconhecido;
- atomicidade local: falha não deixa metade das mudanças aplicada.

### Contrato de reconciliação

DataService retorna:

    {
      remoteCommitted,
      reconciliation: {
        status,
        appliedEntities,
        pendingEntities,
        errorCode
      }
    }

Estados:

- applied: memória e tela refletem o commit;
- pending: commit confirmado, leitura corretiva ainda pendente;
- failed: commit confirmado, aplicação local falhou.

Nenhum estado converte commit confirmado em falha de gravação. Durante a migração, refreshPending e stateApplyErrorCode permanecem campos compatíveis derivados do novo objeto; só saem depois de busca que prove ausência de consumidores.

## 21.1 PR8A — Contrato remoto e estado

**Objetivo:** completar a resposta do servidor, normalizá-la e disponibilizar operações explícitas de estado sem mudar ainda a jornada principal.

### Arquivos de PR8A

- Modify: src/application/data-service.js
- Modify: src/application/state-port.js
- Modify: src/data/supabase-repository.js
- Modify: src/data/repository-contract.js
- Create: migration gerada por supabase migration new invoice_authoritative_result_v2
- Create: supabase/tests/database/invoice-authoritative-result-v2.test.sql
- Create: tests/unit/state-port-entity-changes.test.js
- Create: tests/unit/invoice-state-reconciliation.test.js
- Modify: tests/unit/data-service-authoritative-result.test.js
- Modify: tests/unit/data-service-authoritative-commit.test.js
- Modify: tests/unit/application-data-service.test.js
- Modify: tests/unit/supabase-repository.test.js
- Modify: tests/unit/invoice-asset-transition-persistence.test.js

### Passos de PR8A

- [ ] **PR8A.1 — Escrever RED da resposta completa**

No pgTAP e no repositório, demonstrar a ausência atual de administrativeLog e das remoções completas. Cobrir save e delete.

- [ ] **PR8A.2 — Ampliar implementação privada e wrappers v2**

Retornar por to_jsonb as linhas efetivamente persistidas. Nunca devolver como autoridade o objeto enviado pelo cliente. Preservar v1 e os consumidores atuais.

- [ ] **PR8A.3 — Escrever RED do StatePort**

Cobrir NF nova/atualizada, bem novo/atualizado/removido por ID, verificação, log, ID ausente, entidade não autorizada e falha atômica local.

- [ ] **PR8A.4 — Implementar somente operações conhecidas**

Mapear registeredInvoices → notasRegistradas, assets → bens, verifications → estrutura vigente e administrativeLogs → logs. Não criar linguagem genérica de patch, paths JSON arbitrários ou execução dinâmica.

- [ ] **PR8A.5 — Implementar normalização e contrato inativo**

DataService aprende a normalizar, verificar changedEntities e produzir o objeto reconciliation. O caminho fica coberto por unitários, mas remoteResultIsAuthoritative continua desativado nos comandos principais.

- [ ] **PR8A.6 — Executar gates e revisão dupla**

    npm run supabase:reset
    npm run supabase:test:db
    npm run supabase:lint:db
    npm run typecheck:database
    node --test tests/unit/state-port-entity-changes.test.js
    node --test tests/unit/invoice-state-reconciliation.test.js
    node --test tests/unit/data-service-authoritative-result.test.js
    node --test tests/unit/data-service-authoritative-commit.test.js
    node --test tests/unit/application-data-service.test.js
    node --test tests/unit/supabase-repository.test.js

Revisar resultado sem log, deletedAssetId, versões, v1 durante rollout, função v2 direta, grants, remoção, falha atômica local e ausência de ativação prematura.

### Gate de PR8A

- resposta remota integral representa o mesmo commit;
- save e delete v2 coexistem com v1;
- StatePort faz upsert/remove por ID sem substituir coleções;
- falha local é atômica e estruturada;
- jornada principal continua usando a política anterior;
- dois passes independentes aprovados.

### Publicação e reversão de PR8A

Publicar primeiro wrappers v2 compatíveis e testar o banco. PR8A pode permanecer em Production sem o frontend depender integralmente dele. Se o contrato estiver incorreto, interromper PR8B; reverter o código inativo se necessário e manter qualquer migration aplicada para correção forward-only. Não remover v1.

## 21.2 PR8B — Ativação e reconciliação visual

**Objetivo:** ativar a resposta remota como autoridade, refletir as mudanças na memória e no DOM e tratar o estado degradado sem repetir a escrita.

### Arquivos de PR8B

- Modify: src/application/invoice-service.js
- Modify: src/application/data-service.js
- Modify: app.js
- Create: src/integration/prontuario-state-reconciler.js
- Modify: src/integration/prontuario-conditional-reconciler.js
- Modify: src/integration/operational-write-feedback.js
- Modify: src/integration/operational-write-performance.js
- Modify: index.html
- Modify: tests/unit/invoice-state-reconciliation.test.js
- Modify: tests/unit/data-service-authoritative-result.test.js
- Modify: tests/unit/data-service-authoritative-commit.test.js
- Modify: tests/unit/invoice-asset-transition-persistence.test.js
- Create: tests/e2e/invoice-degraded-reconciliation.spec.js

### Passos de PR8B

- [ ] **PR8B.1 — Ativar somente depois do contrato aprovado**

Nos comandos de invoice, ativar remoteResultIsAuthoritative=true, declarar entidades incrementais, dispensar refresh de administrativeLogs e remover asset local por deletedAssetId. Se changedEntities não estiver integralmente representado, falhar fechado para reconciliação de leitura.

- [ ] **PR8B.2 — Testar transições críticas**

Cobrir consumo → permanente, permanente → consumo, permanente → serviço, serviço → permanente, edição de permanente, remoção com/sem bem, no-op verdadeiro e no-op aparente com derivado incorreto. Em permanente → não permanente, bens não pode conservar o item removido.

- [ ] **PR8B.3 — Promover reconciliador visual para o núcleo**

prontuario-state-reconciler.js atualiza lista de despesas, bloco de bem, resumo de Consulta Assessoria e alertas afetados, preservando foco e rolagem. Retirar renderProntuario(escolaId) integral do caminho feliz de salvar/remover NF.

- [ ] **PR8B.4 — Escrever RED do estado degradado**

Simular RPC confirmada, StatePort falhando e leitura corretiva também falhando. O resultado deve:

- informar Dados salvos no servidor; atualização da tela pendente.;
- não repetir save automaticamente;
- manter a intenção confirmada e não reenviável;
- bloquear gesto repetitivo quando necessário;
- oferecer Atualizar agora como somente leitura;
- guardar errorCode e operationKey no diagnóstico;
- liberar o controle após reconciliação.

- [ ] **PR8B.5 — Implementar recuperação segura**

operational-write-feedback.js distingue falha antes do commit, commit confirmado com reconciliação pendente e sucesso completo. Uma leitura corretiva pode repetir; o comando de escrita não pode.

- [ ] **PR8B.6 — Provar caminho feliz incremental**

No teste: zero load de administrativeLogs; zero load de registeredInvoices, assets e verifications quando a resposta está completa; zero renderProntuario integral; DOM e memória refletem todas as entidades retornadas.

- [ ] **PR8B.7 — Executar gates e revisão dupla**

    node --test tests/unit/invoice-state-reconciliation.test.js
    node --test tests/unit/data-service-authoritative-result.test.js
    node --test tests/unit/data-service-authoritative-commit.test.js
    node --test tests/unit/invoice-asset-transition-persistence.test.js
    npx playwright test tests/e2e/invoice-degraded-reconciliation.spec.js --project=desktop-chromium
    npm run test:readiness

Revisar commit com falha local, reconciliação que falha duas vezes, retry acidental, duas abas, mudança de tipo, remoção, foco/rolagem, extensão de performance ausente e cliente antigo coexistindo.

### Gate de PR8B

- estado local correto em todas as transições;
- log aparece imediatamente;
- asset removido desaparece da memória;
- commit remoto nunca é comunicado como não salvo;
- nenhuma repetição automática de escrita;
- nenhum refresh/render integral no caminho feliz;
- E2E degradado e E2E completo aprovados;
- dois passes independentes aprovados.

### Publicação e reversão de PR8B

Publicar o cliente apenas depois de PR8A validado em Production. Se a ativação produzir estado incompleto, reverter PR8B para a política anterior; PR8A e as RPCs v2 podem permanecer instalados e inativos. Não remover v1 nem a tabela de idempotência durante a estabilização.

---

## 22. PR9A — Instrumentação causal do bootstrap

**Finalidade:** localizar onde o tempo inicial é gasto antes de escolher otimizações.

**Dependência recomendada:** PR3.3 e PR8B.

**Não contém neste PR:** web-vitals, Server-Timing, transmissão ou armazenamento externo de telemetria, mudança de limite do Lighthouse ou otimização por palpite.

### Arquivos

- Create: src/integration/bootstrap-performance-diagnostics.js
- Modify: index.html
- Modify: src/integration/auth-bootstrap.js
- Modify: src/integration/auth-gate.js
- Modify: src/data/repository-factory.js
- Modify: src/application/data-service.js
- Modify: src/integration/capability-readiness.js
- Modify: app.js
- Create: scripts/audit/build-bootstrap-performance-report.mjs
- Create: tests/unit/bootstrap-performance-diagnostics.test.js
- Create: tests/e2e/bootstrap-performance-authenticated.spec.js
- Create: docs/evidence/performance/bootstrap-baseline.json
- Modify: tests/unit/auth-startup-performance.test.js

### Fases obrigatórias

1. page-init;
2. auth-start;
3. session-ready;
4. supabase-client-ready;
5. entity-fetch-start e entity-fetch-end por grupo;
6. normalization-start e normalization-end;
7. state-apply-start e state-apply-end;
8. first-render;
9. extensions-installed;
10. visually-stable;
11. useful-interaction-ready.

### Contrato

bootstrap-performance-diagnostics.js:

- usa performance.mark e performance.measure;
- é fail-open;
- mantém dados apenas na sessão;
- remove payload, e-mail, token e conteúdo de registro;
- expõe snapshot congelado para teste e exportação manual;
- não faz fetch;
- não altera a ordem das operações.

### Passos

- [ ] **PR9A.1 — Escrever RED das fases**

Verificar que:

- cada fase tem início/fim válido;
- duração não é negativa;
- fase ausente aparece como missing, não como zero;
- erro de Performance API não bloqueia app;
- snapshot não contém dados pessoais.

- [ ] **PR9A.2 — Carregar diagnóstico cedo**

Adicionar o módulo antes do bootstrap de autenticação. Marcar page-init sem esperar app.js.

- [ ] **PR9A.3 — Instrumentar sem reorganizar**

Adicionar apenas marcas às fronteiras existentes. Não paralelizar, adiar ou remover nada neste PR, porque isso contaminaria o diagnóstico.

- [ ] **PR9A.4 — Integrar readiness**

extensions-installed vem do registry do PR3, distinguindo ready, failed e degraded. useful-interaction-ready exige as capacidades mínimas da tela inicial, não todos os módulos opcionais.

- [ ] **PR9A.5 — Capturar ambiente autenticado**

Playwright executa:

- cinco rodadas desktop;
- cinco rodadas mobile Chromium;
- cache frio e condição de rede controlada;
- mesmo usuário/fixture;
- mesma página inicial.

Guardar valores individuais, mediana e pior caso.

- [ ] **PR9A.6 — Gerar relatório causal**

O script classifica:

- duração absoluta;
- percentual do total;
- dispersão;
- fase dominante;
- chamadas por entidade;
- bytes quando disponíveis no navegador;
- módulos instalados depois de useful-interaction-ready.

- [ ] **PR9A.7 — Rodar gates**

    node --test tests/unit/bootstrap-performance-diagnostics.test.js
    node --test tests/unit/auth-startup-performance.test.js
    npx playwright test tests/e2e/bootstrap-performance-authenticated.spec.js --project=desktop-chromium
    node scripts/audit/build-bootstrap-performance-report.mjs

### Gate de merge

- todas as fases observáveis;
- diagnóstico não muda ordem nem comportamento;
- zero transmissão externa;
- relatório reproduzível;
- causa ainda não é declarada sem evidência.

### Reversão

Como é fail-open e local, qualquer impacto perceptível exige reverter as marcas problemáticas. Não manter instrumentação que aumenta materialmente o tempo medido.

### Checkpoint pós-PR9A

PR9A começa com a Performance API nativa porque ela mede as fronteiras que controlamos sem nova dependência nem transmissão de dados. Depois do relatório causal, registrar explicitamente qualquer pergunta diagnóstica que permaneça sem resposta.

- web-vitals só pode ser avaliado se houver uma lacuna real sobre métricas de experiência que a instrumentação nativa criada não responda de maneira adequada;
- Server-Timing só pode ser avaliado se o tempo material estiver comprovadamente no servidor/RPC, a camada puder emitir a métrica de modo controlado e a visão do cliente for insuficiente;
- instalar biblioteca não autoriza transmitir ou armazenar medições;
- qualquer RUM, coleta persistente ou envio a serviço externo exige nova decisão de produto, inventário dos dados, retenção e análise de privacidade;
- se a ferramenta exigir nova dependência ou infraestrutura, aplicar a condição global de parada antes de incluí-la.

Essas ferramentas permanecem possibilidades condicionais, não tarefas aprovadas nem exclusões definitivas.

---

## 23. PR9B — Estabilização estatística do Lighthouse

**Finalidade:** separar variação microscópica de regressão real sem esconder performance ruim.

**Dependência:** PR9A.

### Arquivos

- Modify: lighthouserc.cjs
- Modify: scripts/run-lighthouse-baseline.mjs
- Modify: .github/workflows/lighthouse-ci.yml
- Create: tests/unit/lighthouse-baseline-statistics.test.js
- Modify: docs/reference/TEST_GOVERNANCE.md

### Decisão estatística

- CI executa no mínimo três rodadas por perfil de dispositivo;
- gate usa mediana;
- relatório mantém cada rodada;
- pior caso é destacado para diagnóstico;
- média pode ser preservada como informação histórica, mas não decide o gate;
- limite atual não é relaxado neste PR.

### Passos

- [ ] **PR9B.1 — Escrever RED de mediana**

Cobrir:

- três valores;
- quatro valores;
- valor extremo;
- métrica ausente;
- score zero;
- pior caso;
- falha de uma execução.

- [ ] **PR9B.2 — Implementar estatística pura**

Extrair funções testáveis de mediana, pior caso e dispersão. Não misturar leitura de arquivo com cálculo.

- [ ] **PR9B.3 — Aumentar número de execuções**

lighthouserc.cjs passa de 2 para pelo menos 3. O workflow deve guardar todos os relatórios sem sobrescrever.

- [ ] **PR9B.4 — Mudar o gate**

Comparar thresholds com medianas. Quando houver falha:

- mostrar mediana;
- mostrar limite;
- mostrar pior caso;
- mostrar variação;
- apontar qual execução faltou, se houver.

- [ ] **PR9B.5 — Validar custo e estabilidade**

Executar pelo menos três pipelines repetidos sem mudança de código. Confirmar que:

- resultados idênticos na faixa de ruído não alternam pass/fail indevidamente;
- regressão proposital relevante ainda falha;
- duração do workflow é aceitável.

- [ ] **PR9B.6 — Rodar gates**

    node --test tests/unit/lighthouse-baseline-statistics.test.js
    npm run audit:lighthouse
    npm run check:workflow-references

### Gate de merge

- mediana decide;
- pior caso é preservado;
- pelo menos três runs;
- thresholds não relaxados;
- regressão artificial detectada.

### Publicação e reversão

Se a nova metodologia deixar de detectar regressão real ou tornar CI impraticável, reverter a mudança do gate, preservar os relatórios e corrigir o cálculo antes de tornar o check obrigatório na proteção de branch.

---

## 24. PR9C — Otimizações orientadas por evidência

**Finalidade:** reduzir o tempo até a interface útil atacando a fase dominante comprovada.

**Dependências:** PR9A e PR9B.

**Forma de execução:** PR9C é uma etapa; pode gerar mais de um PR pequeno, cada um com uma única hipótese causal. Não criar um mega-diff de bundle, banco, render e CSS.

### Regra de seleção

Uma hipótese só entra quando:

- a fase é material no baseline; representar pelo menos 20% do tempo total ou mais de 1 segundo mediano é heurística de priorização, nunca gate rígido;
- existe ação controlável no projeto;
- um teste ou medição isola a relação causal;
- o orçamento antes/depois está registrado.

### Árvore de decisão

| Evidência dominante | Ações permitidas para investigar |
| --- | --- |
| Download/execução de JS | dividir bundle, adiar módulo opcional depois de useful-interaction-ready, remover código não usado comprovado |
| CSS/render blocking | separar CSS crítico, adiar estilo não necessário, reduzir seletores/folhas comprovadamente ociosos |
| Auth/session | eliminar espera duplicada, reutilizar sessão válida, paralelizar somente operações independentes |
| Fetch de entidades | paralelizar leituras seguras, reduzir payload, paginar ou adiar entidade somente se a tela útil não depender dela |
| administrative_logs | carregar resumo ou primeira página antes do histórico completo somente se a medição provar dominância |
| Normalização/state apply | eliminar clones ou conversões repetidas comprovadas, preservar contratos |
| Primeiro render/DOM | reduzir nós, renderizar seção útil primeiro, usar loading honesto |
| Extensões | instalar capacidades críticas antes; adiar opcionais pelo registry |

### Orçamento aprovado por hipótese

Não existe meta percentual universal definida antes de PR9A e PR9B. Cada hipótese de PR9C recebe seu próprio orçamento antes da implementação, baseado no baseline causal e no ruído medido.

O registro mínimo contém:

- ambiente, perfil, fixture, cache e condição de rede;
- cinco valores individuais do baseline aplicável;
- mediana, pior caso e medida de dispersão;
- fase-alvo e mecanismo causal proposto;
- direção esperada da mudança;
- efeito mínimo detectável superior ao ruído observado;
- métricas não alvo e regressões toleradas, justificadas antes do código;
- thresholds de CI já vigentes, que continuam protegendo contra regressão;
- pessoa que aprovou o orçamento e a decisão caso a hipótese não se confirme.

O orçamento não é escolhido depois de observar o resultado. Valores absolutos conhecidos podem servir como referência de qualidade, mas nenhuma porcentagem de melhora por PR é inventada antecipadamente.

### Passos por hipótese

- [ ] **PR9C.1 — Registrar hipótese e mecanismo**

Exemplo de estrutura:

    Evidência: entity-fetch representa 43% do total.
    Hipótese: administrative_logs bloqueia first-render sem ser necessário.
    Mudança mínima: carregar resumo primeiro e histórico sob demanda.
    Invariante: auditoria completa continua acessível e consistente.
    Medida de sucesso: reduzir entity-fetch e useful-interaction-ready.

- [ ] **PR9C.2 — Criar regressão de comportamento**

Antes de otimizar, proteger tudo que não pode ser perdido:

- dados completos quando requisitados;
- regras de readiness;
- fail-closed;
- perfis;
- loading;
- erro e retry de leitura.

- [ ] **PR9C.3 — Implementar uma mudança**

Não combinar duas hipóteses independentes. Se a primeira não mover a fase esperada, reverter ou classificar antes de tentar outra.

- [ ] **PR9C.4 — Comparar antes/depois**

Mesma máquina/agente, rede, perfil, fixture e número de execuções. Relatar:

- cinco valores;
- mediana;
- pior caso;
- dispersão;
- diferença absoluta e percentual;
- métricas de comportamento.

- [ ] **PR9C.5 — Rodar gates de função e performance**

Além dos testes focados da área tocada:

    npm run audit:lighthouse
    npx playwright test tests/e2e/bootstrap-performance-authenticated.spec.js --project=desktop-chromium
    npm run test:readiness

Se test:readiness depender de credencial indisponível localmente, o workflow correspondente deve concluir antes do merge.

- [ ] **PR9C.6 — Parar quando a hipótese não se confirmar**

Não compensar resultado nulo relaxando threshold, ocultando loading ou removendo dados necessários. Voltar à evidência e escolher outra causa.

### Gate de conclusão da etapa

- orçamento específico de cada hipótese atingido ou impedimento causal documentado e aceito;
- experiência útil melhora de fato;
- pior caso não é escondido;
- nenhum dado ou capacidade necessária foi simplesmente adiado para nunca carregar;
- nenhuma transmissão ou persistência externa de telemetria sem autorização específica.

### Reversão

Cada hipótese deve ser reversível por PR. Reverter imediatamente se melhorar Lighthouse mas piorar a jornada autenticada real, integridade dos dados ou readiness.

---

## 25. Matriz de rastreabilidade dos achados

| Achado consolidado | Destino | Evidência de encerramento |
| --- | --- | --- |
| P01 — submit repetido | PR1 | uma chamada por gesto |
| P02 — releitura de administrativeLogs | PR1 | zero refresh de logs no fluxo testado sem extensão |
| P03 — mais de uma autoridade de Assessoria | PR2 | única função canônica e busca sem matriz concorrente |
| P04 — no-op incompleto | PR2 | zero escrita quando tudo está igual |
| P05 — readiness fragmentado | PR3.1–PR3.3 | registry, migração por criticidade e falha isolada |
| P06 — semântica essencial em extensão opcional | PR3.2 | política no núcleo e extensão ausente no teste |
| P07 — dados inconsistentes de Assessoria | PR4 | preflight/postflight e migration idempotente |
| P08 — idempotência incompleta | PR5 | commit único em retry e concorrência |
| P09 — risco de overload | PR5 | RPC v2 com nome explícito e v1 preservada |
| P10 — resposta insuficiente da RPC | PR8A | NF, bem, remoção, verificação, log, versões e entidades |
| P11 — commit remoto e estado local divergente | PR8B | estado degradado e reconciliação somente de leitura |
| P12 — múltiplas semânticas de Pendência | PR6 | mesma projeção em todas as views |
| P13 — idade errada depois de reabertura | PR6 | data da etapa atual |
| P14 — Cancelada não reabre na UI | PR6 | matriz e jornada de reabertura |
| P15 — hierarquia e filtros insuficientes | PR7A | segmentos e filtros operacionais |
| P16 — Minhas Pendências não representa o domínio | PR7A | Minha carteira |
| P17 — agrupamento pode esconder cronologia | PR7A | ordem cronológica padrão e agrupamento opcional |
| P18 — remoção prematura de Ver detalhes | PR7B | controle preservado e interação no render base |
| P19 — busca troca competência global | PR6B | detalhe preserva mês e Prontuário troca explicitamente |
| P21 — main sem proteção | G0 | ruleset ou gate manual documentado |
| P22 — Lighthouse instável e performance ruim | PR9B e PR9C | mediana estável e melhora medida |
| P23 — causa do bootstrap não medida | PR9A | fases e relatório causal |
| Fortalecimento dos IDs persistentes | PR5 | gerador compartilhado, DirectoryService injetado, mesmo milissegundo sob controle e nenhum produtor dependente somente de Date.now() |
| Incidente Incorreto + Pendência | PR #200 concluído | regressões já integradas e preservadas |
| Antigo P20 | Excluído | nenhuma tarefa ou gate neste plano |
| Proteção de senhas vazadas | Excluída | nenhuma tarefa ou gate neste plano |

---

## 26. Matriz de testes e gates

Os testes são proporcionais ao risco. Passar nos testes antigos não substitui a regressão específica.

| Tipo de mudança | Mínimo obrigatório |
| --- | --- |
| Domínio puro | RED unitário, matriz de bordas, npm run check |
| Serviço de aplicação | unitários do serviço, contrato DataService, erro e no-op |
| Integração/loader | falha induzida, dependências, E2E de capacidade |
| UI | jornada desktop, teclado e perfis afetados |
| Mobile | Chromium e WebKit para a superfície alterada |
| Acessibilidade | teclado, foco, nome acessível e scan automatizado |
| RPC | pgTAP, grants, cliente antigo e novo |
| Concorrência | teste realmente simultâneo |
| Migration de dados | stack limpa, preflight, drift, rerun, postflight e backup |
| Estado local/remoto | commit perdido, apply falho, remoção e reconciliação |
| Performance | pelo menos cinco amostras de diagnóstico e três no gate de CI |

### Gates locais de base

Usar conforme o risco:

    npm run check
    npm run format:check
    npm run lint
    npm run check:architecture
    npm run check:functional-matrix
    npm run check:workflow-references
    npm run test:unit
    npm run test:integration

### Gates Supabase

Para PR4, PR5 e PR8A:

    npm run supabase:reset
    npm run supabase:test:db
    npm run supabase:lint:db
    npm run typecheck:database
    npm run check:supabase
    npm run check:supabase-final

### Gate integral

PR2, cada unidade PR3.1/PR3.2/PR3.3, PR5, PR6, PR8A e PR8B devem concluir o workflow equivalente a test:readiness quando aplicável ao risco da entrega. Se o comando não puder rodar localmente por depender de ambiente/credencial, o workflow remoto deve suprir a evidência; não se marca como verde por suposição.

### Playwright

Executar somente as jornadas afetadas durante TDD e a suíte proporcional antes do merge:

    npx playwright test caminho/do/teste.spec.js --project=desktop-chromium
    npx playwright test caminho/mobile.spec.js --project=mobile-chromium --project=mobile-webkit

Nunca substituir teste autenticado relevante por smoke anônimo.

---

## 27. Protocolo de revisão adversarial do diff

O revisor deve tentar invalidar a solução, não apenas confirmar o caminho feliz.

### Escrita

- O que acontece se a resposta some depois do commit?
- O retry reaproveita IDs e chave?
- A mesma chave aceita payload diferente?
- Duas chaves com conteúdo igual continuam válidas?
- O servidor salvou e a memória falhou?
- Um asset excluído continua visível?
- Um log remoto não retornado é inventado pelo cliente?
- Há render ou refresh integral escondido em extensão?

### Readiness

- Arquivo carregado realmente significa capacidade instalada?
- Falha opcional derruba módulo crítico?
- Dependência falha deixa botão ativo?
- Existe polling disfarçado dentro de Promise?
- MutationObserver está sendo usado como readiness?
- O módulo instala duas vezes?

### Dados

- O preflight ainda corresponde ao momento da execução?
- Existe candidato não aprovado?
- Rerun é seguro?
- Parte já corrigida é aceita?
- Uma versão mudou?
- O log atribui falsamente a ação a alguém?

### Pendências

- Reaberta usa a data da etapa?
- Cancelada reabre?
- Todas as views mostram a mesma ação?
- Algum filtro remove outra competência?
- A busca histórica troca o mês?
- Teclado abre duas vezes por propagação?
- O foco retorna?
- Ver detalhes continua disponível?

### Performance

- A mudança atacou a fase medida?
- O ambiente antes/depois é o mesmo?
- A mediana melhorou e o pior caso piorou?
- Um recurso necessário foi apenas escondido?
- O loading parece mais rápido sem a aplicação estar utilizável?

---

## 28. Protocolo de merge, deployment e verificação

### 28.1 Antes do merge

1. branch atualizada com main;
2. diff revisado integralmente;
3. premissas revalidadas;
4. regressão RED demonstrada;
5. gates focados verdes;
6. gates remotos verdes;
7. revisão independente concluída;
8. migrations revisadas quando houver;
9. plano de reversão escrito no PR;
10. decisão explícita de merge.

### 28.2 Entregas sem banco

1. validar Vercel Preview;
2. merge;
3. confirmar SHA de Production;
4. executar smoke da jornada alterada;
5. observar erros;
6. registrar evidência;
7. fechar somente depois da confirmação.

### 28.3 Entregas com RPC compatível

Para PR5 e PR8A:

1. migration adiciona v2 e preserva v1;
2. aplicar e testar banco com autorização;
3. em PR8A, publicar contrato/estado ainda inativo na jornada principal;
4. em PR8B, publicar o cliente que ativa a resposta autoritativa já disponível;
5. observar;
6. manter v1;
7. qualquer retirada futura é outro trabalho.

Esse ordenamento impede cliente novo de chamar função ainda inexistente.

### 28.4 Reparo de dados

PR4 segue protocolo próprio:

    preflight fresco
    aprovação do conjunto
    backup comprovado
    migration transacional
    postflight
    evidência

Não misturar PR4 com deploy visual.

### 28.5 Smoke pós-publicação

O smoke não deve criar lixo em Production. Usar dados controlados ou jornada somente de leitura quando possível. Se uma escrita real de teste for indispensável, definir antes:

- registro;
- perfil;
- horário;
- como identificar;
- como desfazer sem apagar histórico;
- autorização.

---

## 29. Estratégia de reversão por entrega

| Entrega | Reversão |
| --- | --- |
| G0 | corrigir ruleset com autorização; documentos não afetam produto |
| PR1 | revert do frontend |
| PR2 | revert do código; bloquear PR4 |
| PR3.1 | reverter registry/loader e retornar ao bootstrap compatível anterior |
| PR3.2 | reverter migração das capacidades críticas, preservando PR3.1 se seguro |
| PR3.3 | reverter capacidades restritas/opcionais, preservando PR3.1/PR3.2 se seguros |
| PR4 | migration corretiva forward-only baseada no snapshot |
| PR5 | cliente volta à v1; v2 e registros permanecem |
| PR6 | revert dos modelos e consumidores como unidade |
| PR6B | revert de navegação |
| PR7A | revert de UI/filtros |
| PR7B | revert de UI/a11y, preservando PR7A |
| PR8A | interromper PR8B; reverter código inativo se necessário; corrigir banco forward-only e preservar v1 |
| PR8B | cliente volta à política anterior; contrato e RPCs v2 de PR8A permanecem inativos |
| PR9A | remover instrumentação problemática |
| PR9B | voltar gate anterior e corrigir cálculo |
| PR9C | revert do PR da hipótese específica |

Regras gerais:

- nunca usar git reset --hard sobre trabalho compartilhado;
- nunca editar migration já aplicada;
- nunca remover tabela/RPC durante incidente se clientes podem depender dela;
- preservar evidência antes de corrigir;
- preferir retorno a caminho compatível já conhecido.

---

## 30. Matriz de riscos

| Risco | Probabilidade | Impacto | Controle principal |
| --- | --- | --- | --- |
| Corrigir hipótese que já não existe | Média | Alto | revalidação por SHA antes de cada PR |
| Criar terceira fonte de regra | Média | Crítico | mapa de autoridades e busca fora do diff |
| No-op esconder derivado incorreto | Média | Alto | plano completo de efeitos |
| Retry criar segundo registro | Alta antes do PR5 | Crítico | intent estável + RPC v2 + concorrência |
| Migration tocar linha nova | Média | Crítico | preflight congelado + drift detection |
| Falha opcional interromper produto | Alta antes do PR3 | Alto | registry + loader tolerante |
| PR3 virar mega-diff impossível de revisar | Média | Alto | PR3.1/PR3.2/PR3.3 com gates próprios e separação física obrigatória se necessário |
| Estado remoto salvo e tela antiga | Média | Alto | estado degradado + reconciliação de leitura |
| Asset excluído permanecer na memória | Média | Alto | remoção explícita por ID |
| Ativar escrita autoritativa antes de completar o contrato | Média | Crítico | PR8A publicado e validado antes de PR8B |
| Fila esconder competência | Média | Crítico operacional | testes cross-competence |
| Busca mudar mês silenciosamente | Confirmada antes do PR6B | Alto | separação view/global context |
| Acessibilidade depender de decorator | Confirmada antes do PR7B | Alto | interação no render base |
| Lighthouse flutuar | Alta | Médio | três runs e mediana |
| Otimização atacar causa errada | Alta sem PR9A | Médio/Alto | instrumentação causal |
| Meta de performance escolhida antes dos dados | Média | Médio/Alto | orçamento por hipótese somente após PR9A/PR9B e acima do ruído medido |
| Escopo crescer para itens excluídos | Média | Alto | exclusões explícitas e stop condition |
| Merge com gate vermelho | Possível enquanto main aberta | Crítico | ruleset ou gate manual |

---

## 31. Papéis e decisões

| Papel | Responsabilidade |
| --- | --- |
| Implementador | prova premissa, escreve RED, implementa e registra evidências |
| Revisor de contrato | confere regra, interface, compatibilidade e teste |
| Revisor adversarial | procura contraexemplos e superfícies esquecidas |
| Responsável pelo produto | confirma decisões funcionais, conjunto de reparo e autorização de Production |
| Responsável pelo banco | revisa migration, grants, transação, pre/postflight e reversão |
| Administrador GitHub | configura ruleset somente após autorização |

Uma pessoa pode acumular funções técnicas, mas o passe adversarial dos PRs sensíveis precisa ser intelectualmente independente do passe que criou a solução.

---

## 32. Condições globais de parada

Parar a execução e pedir decisão quando:

- a main mudou de modo que invalida premissa;
- Production e main divergem sem explicação;
- aparece nova família de defeitos;
- surge necessidade inevitável de tocar antigo item 20, proteção de senhas vazadas ou PR #195;
- uma migration encontra drift;
- não há backup/restauração para mudança de dados;
- a RPC nova não pode coexistir com a antiga;
- um gate falha por defeito real fora do escopo;
- a correção exige nova dependência;
- uma unidade de PR3 não pode ser revisada, testada e revertida independentemente; nesse caso, separar fisicamente os PRs;
- PR8B exigiria ativar contrato de PR8A ainda não publicado ou não validado;
- ferramenta de performance exige dependência, coleta persistente ou transmissão ainda não autorizada;
- a única maneira de ficar verde é relaxar regra, timeout ou threshold;
- falta autorização para GitHub, Supabase Production, merge ou deploy.

Não transformar condição de parada em improviso técnico.

---

## 33. Modelo de descrição de cada PR

Cada PR deve usar esta estrutura:

### Problema comprovado

- SHA:
- ambiente:
- reprodução:
- causa:

### Invariantes

- regras preservadas:
- superfícies afetadas:

### Mudança

- arquivos:
- contrato antes/depois:
- itens deliberadamente não alterados:

### Evidência RED → GREEN

- comando:
- falha anterior:
- resultado posterior:

### Busca fora do diff

- chamadores:
- implementações equivalentes:
- consumidores do estado:
- ocorrências preservadas:

### Bordas testadas

- concorrência/retry:
- erro/recovery:
- perfil:
- mobile/a11y:
- dados antigos:

### Gates

- focados:
- integração:
- banco:
- Preview:

### Revisão adversarial

- contraexemplos encontrados:
- mudanças feitas depois da revisão:
- riscos residuais:

### Deployment e reversão

- ordem:
- smoke:
- sinal de rollback:
- procedimento:

---

## 34. Critérios de conclusão do programa

O programa só está concluído quando todos os itens abaixo forem verdadeiros:

- [ ] PR #200 permanece íntegro.
- [ ] G0 tem baseline, deployment, Supabase e governança registrados.
- [ ] PR1, PR2, PR3.1, PR3.2, PR3.3, PR4, PR5, PR6, PR6B, PR7A, PR7B, PR8A, PR8B, PR9A, PR9B e PR9C aplicáveis foram integrados na ordem aprovada.
- [ ] main e Production apontam para o SHA final esperado.
- [ ] nenhuma NF duplicada é criada por repetição da mesma intenção.
- [ ] chaves diferentes com conteúdo igual continuam permitidas.
- [ ] o gerador compartilhado está ativo nos produtores persistentes inventariados, inclusive DirectoryService.
- [ ] nenhum produtor persistente depende exclusivamente de Date.now(), e os testes controlados cobrem chamadas no mesmo milissegundo sem prometer ausência absoluta de colisões.
- [ ] Consulta Assessoria tem uma única autoridade.
- [ ] no-op produz zero escrita.
- [ ] dados antigos passam no postflight canônico.
- [ ] readiness mostra ready, failed ou degraded sem silêncio.
- [ ] falha opcional não derruba função crítica.
- [ ] Pendências preservam todas as competências.
- [ ] idade, ator e ação são iguais em todas as views.
- [ ] Cancelada e Resolvida reabrem conforme capacidade.
- [ ] busca histórica não muda competência global.
- [ ] Prontuário muda a competência explicitamente.
- [ ] fila funciona em desktop, mobile, mouse e teclado.
- [ ] Ver detalhes continua disponível.
- [ ] resposta da NF inclui log e remoções.
- [ ] StatePort remove asset por ID.
- [ ] commit confirmado com falha local entra em recuperação, sem repetir escrita.
- [ ] fluxo principal de sucesso não executa refresh/render integral.
- [ ] bootstrap possui medição causal.
- [ ] Lighthouse usa mediana de pelo menos três runs.
- [ ] cada hipótese de performance teve orçamento definido somente após o baseline, superior ao ruído observado, e foi atendida ou teve impedimento causal formalmente aceito.
- [ ] testes e documentos canônicos refletem o comportamento final.
- [ ] antigo item 20 não foi reintroduzido.
- [ ] proteção de senhas vazadas não foi reintroduzida.
- [ ] PR #195 não foi tocado.

---

## 35. Primeira ação de execução

Não começar alterando salvarDadosNota.

Começar por G0:

1. revalidar origin/main;
2. confirmar Production;
3. confirmar Supabase;
4. registrar o baseline;
5. decidir a proteção de branch;
6. somente então abrir fix/pr1-invoice-submit-guard.

Isso mantém a lição central das auditorias: um plano é uma hipótese técnica organizada. Cada entrega ganha confiança pela combinação de código, invariantes, regressão, revisão adversarial e evidência do ambiente.
