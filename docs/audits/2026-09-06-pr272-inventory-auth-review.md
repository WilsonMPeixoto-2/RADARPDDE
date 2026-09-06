# Revisão independente — #272, Inventário terminal e compensação Auth

**Data:** 06/09/2026 UTC. **Classe:** evidência source-first, limitada aos SHAs abaixo.
**Repositório exclusivo:** WilsonMPeixoto-2/RADARPDDE.

## Resultado

**Solicitar alterações no #272.** O caso isolado que motivou o PR foi corrigido, sem repetição da escrita confirmada. Porém o feedback é contornado na composição real dos wrappers e a nova releitura corretiva permite uma corrida que restaura dados locais antigos após outra operação confirmada. Há também problemas menores no aviso compartilhado e na classificação da falha durante refresh.

**Inventário terminal já estava corrigido na main.** A versão final integrada do #265 protege tanto `InventoryService.forward()` quanto o banco, por trigger que cobre a RPC. Uma nova proteção ou migration duplicaria implementação existente. Nenhuma alteração funcional foi necessária nesta revisão.

**O #271 não cobre a perda da resposta após commit do banco.** A compensação indevida foi reproduzida com o código real da Edge Function e fronteiras Auth/RPC controladas. Não se trata de prova de ocorrência em Production.

## Baselines e método

| Referência | SHA | Situação no checkpoint |
|---|---|---|
| main | `3135d4c66bb5020507bd54d2fe202a79884680c7` | #265, #266 e #267 integrados |
| #272 | `32055e2bec7242433d79a41e359244de4e39692c` | aberto; sete commits; diff efetivo de cinco arquivos contra main |
| #271 | `309abfdfc3717a6b78a3d01ff2bc3e18814960a3` | aberto; examinado como candidato, sem substituir mudanças posteriores da main |
| #273 | `6dfd7bc9ccb7ddebe300314c0a8c453fa52c7449` | controle Lighthouse; apenas documentação, teste vazio e comentário no runtime |
| #263 | `98c48707913515f6f8b17d529691de49707320d4` | rota documental candidata, ainda não integrada |
| #262 | fechado sem merge | abortado, excluído da baseline |

Leitura de AGENTS, rota corrente, decisões, matriz e fontes remotas. `START_HERE.md` não existe na main fixada; o arquivo do #263 não foi promovido a autoridade. Foram usados worktrees isolados, diff completo dos candidatos, busca de consumidores, testes existentes, contraprova na main, reprodução de composição no Chromium e inspeção de logs dos gates. O banco institucional recebeu somente SELECTs de metadados. Não houve merge, deploy, ensaio destrutivo ou mudança de regra funcional.

As auditorias anteriores no SHA `876c5976` antecedem #265–#267. Seus achados sobre Inventário, rollback e exportação não podem ser transferidos para este checkpoint sem revalidação.

## Achados do #272

### R272-01 — P1: feedback instalado no protótipo é contornado pela instância

**Confirmado em módulos reais e Chromium com bootstrap real.**

O [bootstrap, linhas 35–38](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/integration/product-extensions-bootstrap.js#L35) carrega performance antes do feedback. O [wrapper de performance, linhas 222–250](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/integration/operational-write-performance.js#L222) captura `dataService.execute.bind(dataService)` e instala um método próprio na instância. Depois, [o novo feedback, linhas 186–201](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/integration/operational-write-feedback.js#L186) altera somente o protótipo. O método já capturado continua chamando o DataService original.

Reprodução controlada: ordem performance → feedback, uma execução, **zero avisos**; ordem inversa, uma execução, um aviso. No Chromium local, os dois marcadores estavam presentes, a instância tinha `executeWithOperationalWritePolicy`, o comando sintético foi persistido uma vez e retornou sucesso, mas a região permaneceu oculta e vazia. O teste de composição com resultado remoto confirmado e sincronização falha também gera zero avisos na ordem real.

**Impacto:** o usuário pode continuar com dados antigos sem receber a orientação de atualizar a página. A função que decide a mensagem está correta isoladamente, mas não participa do fluxo efetivo nessa ordem de instalação.

**Correção mínima recomendada:** ajustar a instalação do feedback existente na fronteira efetivamente invocada, levando em conta instâncias já decoradas, ou garantir sua instalação antes de qualquer captura do método. Não criar um terceiro módulo concorrente. Provar ordem normal e tardia, reinvocação do instalador, um único persist e um único aviso, usando o bootstrap real.

### R272-02 — P1: releitura corretiva atrasada sobrescreve outro commit local

**Confirmado com DataService e UnitOfWork reais e fronteiras de repositório/estado controladas.**

O #266 serializa `UnitOfWork.run`, mas [libera sua fila no finally, linha 205](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/application/unit-of-work.js#L205). A aplicação e a [nova releitura corretiva, linhas 545–550](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/application/data-service.js#L545), acontecem depois. `refreshRemoteEntities`, linhas 389–402, reaplica um snapshot inteiro, sem verificar se outra execução confirmou dados enquanto a leitura estava em trânsito.

Sequência determinística, sem sleeps:

1. A confirma alteração em `s1`; primeira aplicação local falha.
2. A inicia releitura; resposta captura `s2` antigo, mas sua entrega fica pendente.
3. B confirma alteração em `s2` e aplica `row_version = 2` em memória.
4. A recebe a resposta antiga e aplica `s2` com `row_version = 1`.

O servidor simulado conserva `s2 = new B`, mas a memória termina com `s2 = old B`. **A e B retornam `stateSync.status = applied`, `localStateApplied = true` e `refreshRequired = false`.** Houve exatamente duas escritas para duas intenções, sem repetição automática.

**Causa:** isolamento termina antes da reconciliação. A releitura como operação exclusivamente de leitura no servidor não garante que sua aplicação tardia seja segura para a memória. O padrão já podia afetar outros refreshes da main; o #272 também o introduz no caminho corretivo após falha de aplicação de um resultado autoritativo.

**Correção mínima recomendada:** proteger a finalização local pela mesma ordem de execução, ou invalidar explicitamente uma resposta cujo contexto de estado já foi ultrapassado. Não usar uma comparação parcial de versões que possa ressuscitar entidades excluídas. Teste necessário: A falha na aplicação, A lê, B confirma, resposta A chega depois; B deve permanecer e o estado de sincronização deve refletir qualquer recuperação ainda pendente.

### R272-03 — P2: erro de aplicação dentro do refresh perde sua classificação

**Confirmado com fronteiras controladas.** A primeira `applyCanonical` funciona, mas a segunda, dentro de `refreshRemoteEntities`, lança `Error` sem `.code`. O [catch em 552–568](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/application/data-service.js#L552) não distingue falha de leitura de falha de aplicação. Se `merged.appliedEntities` já não está vazio, o erro não é registrado em `stateApplyError`.

Resultado observado: `refreshPending = true`, porém `stateApplyErrorCode = null`, `localStateApplied = true`, status `pending`. O aviso seria de atenção se alcançado, mas os campos não representam explicitamente a última falha local. O StatePort real chama `writeMemory` e não promete rollback atômico de uma aplicação que lança exceção.

**Correção mínima:** separar a leitura da aplicação na classificação, preservando código genérico quando o erro local não tiver `.code`. Provar falha da segunda aplicação, falha somente da leitura, primeira falha persistente e recuperação transitória. Não classificar toda falha de rede como erro local.

### R272-04 — P2: o timer do aviso de sucesso apaga uma mensagem de Pendência mais recente

**Confirmado usando `showSaveNotice` e `showPendencyNotice` reais.** O [timer em 176–181](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/integration/operational-write-feedback.js#L176) oculta a região após 4,5 segundos sem conferir qual mensagem ainda é dona dela. `app.js:11522–11532` usa a mesma região e não cancela esse timer.

Sequência: salvar com sucesso → abrir Pendência → validação `Informe as observações da pendência.` → timer do salvamento anterior dispara → erro novo fica oculto. `clearPendencyNotice()` também pode retirar uma advertência de sincronização marcada como persistente. Na ordem em que R272-01 contorna o feedback, este problema fica mascarado; passa a ser observável quando o feedback é alcançado.

**Correção mínima:** compartilhar o ciclo de vida da região existente, com identidade da mensagem/timer e regra explícita de substituição. Preservar mensagens posteriores e a advertência pendente até recuperação ou dispensa definida. Testar ambos os produtores, não apenas `feedbackForResult`.

### R272-05 — P3: CSS da região abandonada permanece sem consumidor

O último commit passou a buscar `#pendency-notice`. As 67 linhas novas em [operational-write-feedback.css, a partir de 26](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/32055e2bec7242433d79a41e359244de4e39692c/src/styles/operational-write-feedback.css#L26) ainda estilizam `.radar-save-notice`, mensagem e botão de fechar. Busca no código do head não encontrou criação dessas classes. O stylesheet continua sendo carregado pelo bootstrap.

Remover somente esses seletores sem consumidor. Isso reduz ambiguidade de manutenção; não atribuir a eles, sem medição, a violação de Lighthouse.

## O que o núcleo do #272 efetivamente prova

| Critério solicitado | Resultado e evidência |
|---|---|
| Distinguir commit remoto de aplicação local | Sim no caso principal; objeto `stateSync` acrescentado sem remover os campos anteriores. Limites em R272-02/03 |
| Não repetir escrita confirmada | Confirmado nos caminhos revisados e nas reproduções: `persist` é chamado uma vez por intenção; recuperação chama `repository.load` e reaplica estado |
| Recuperação somente de leitura/reaplicação | Sim no servidor; sua aplicação local tardia ainda é vulnerável à corrida R272-02 |
| Falha inicial sem `.code` explícita | Sim: `LOCAL_STATE_APPLY_FAILED`, `failed`, `refreshRequired = true` no cenário persistente |
| Falha transitória recuperada | Dois applies e um persist; estado final declarado `applied`; testes precisam também verificar memória/versões resultantes |
| Mensagem não incentiva salvar novamente | Texto correto: afirma que salvou e orienta atualizar a página. R272-01 impede que seja mostrado na composição real |
| Compatibilidade | `ok`, `value`, `snapshot`, `persisted`, `refreshPending` e `stateApplyErrorCode` mantidos; local/demo retorna stateSync aplicado. 886 unitários + 148 raiz/integração verdes. Corrida impede equivalência irrestrita |
| Wrapper/listeners duplicados | Marcador no protótipo e marcador no documento evitam instalação repetida no caminho simples. Reinstalação testada em composição deu uma execução. Isso não corrige método capturado antes nem prova todo ciclo tardio de bootstrap |
| Reutilização da região visual | Adequada como base: existe globalmente, role=status, aria-live=polite, aria-atomic e CSS responsivo. Exige coordenação dos produtores/timers; não houve redesenho nem aceite visual humano nesta auditoria |
| Testes reproduzem defeito anterior | Os dois testes novos de sincronização falharam na main: `false !== true` no refresh e `1 !== 2` no número de aplicações. Passaram no #272. Os quatro testes de feedback usam função/FakeDataService e não cobrem a composição real |
| Gates intactos | Nenhum workflow, threshold, dependência ou configuração de gate foi alterado pelo #272. Execuções não estão todas aprovadas; detalhes abaixo |

O primeiro commit `56366ad5` é somente teste e estabelece RED antes do hotfix. Os testes do PR representam bem a primeira falha e a tentativa de recuperação, mas o StatePort stub da recuperação não altera memória; apenas contar chamadas não prova convergência após aplicação nem sob concorrência.

## Inventário terminal — implementação já integrada

| Camada/cenário | Implementação atual | Prova |
|---|---|---|
| Não encaminhada → Encaminhada | `InventoryService.forward`, valida NF/processo, preserva versões esperadas, sincroniza verificação/log | `tests/unit/inventory-service.test.js:180` e `:198`; E2E real patrimonial e pgTAP existentes |
| Encaminhada → encaminhar novamente | Guard novo recusa apenas Inventariada; caminho normal e validações anteriores mantidos | Inspeção do guard + probe adicional de duas chamadas legítimas consecutivas |
| Inventariada → forward | [guard antes da mutação, linha 309](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/3135d4c66bb5020507bd54d2fe202a79884680c7/src/application/inventory-service.js#L309), erro `ASSET_ALREADY_INVENTORIED` | `tests/unit/inventory-service.test.js:324`: estado/metadado preservados, nenhuma persistência |
| RPC direta com versão atual | Trigger BEFORE UPDATE rejeita mudança do estado terminal | [migration 47](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/3135d4c66bb5020507bd54d2fe202a79884680c7/supabase/migrations/20260905231000_inventory_terminal_state.sql); pgTAP `inventory-terminal-state.test.sql` testa erro P0001, estado mantido e ausência de log falso |
| RPC com versão antiga | UPDATE mantém predicado `row_version = p_expected_asset_version`; não encontra linha e lança OPTIMISTIC_CONFLICT | RPC em `20260904040000_functional_reliability_inventory_sync.sql:89–99`; trigger não altera o predicado |
| Concorrência inventariar × forward | Operações usam UPDATE da mesma linha; após inventariação concorrente, versão antiga conflita, e versão atual ainda encontra o trigger terminal | Conclusão estrutural do SQL e trigger; não houve ensaio novo com duas conexões reais nesta auditoria |
| NF posterior | `invoice-effects.js` preserva estado, processo e demais metadados do bem já inventariado | Três testes em `invoice-inventoried-preservation.test.js`; RPC de NF malformada também é bloqueada no pgTAP |

O corpo da RPC ainda contém `SET status = 'Encaminhada'`. Isso isoladamente não comprova a lacuna: a regra superveniente está no trigger. Ele lança exceção antes dos updates derivados e logs; a transação não confirma alterações parciais. `assets_touch_updated_at` continua habilitado e incrementa row_version nas alterações legítimas.

Consulta atual do catálogo institucional confirmou migration `20260905231000`, função `radar_private.protect_inventoried_asset_terminal_state` e trigger `assets_protect_inventoried_terminal_state` habilitado (`O`). **Essa foi consulta somente de metadados.** Execução pgTAP em Supabase descartável no readiness isolado do #272: 27 arquivos/401 testes, incluindo os sete casos da suíte terminal, aprovados. A fonte patrimonial do #272 é idêntica à main.

Não foram alterados NF, Pendência, bonificação, histórico, RPC ou migrations nesta tarefa. A atualização documental aponta as proteções já existentes para impedir uma segunda implementação.

## Auth — lacuna posterior à resposta do convite no #271

**R271-01, P1, confirmado em simulação da fronteira.**

O candidato adiciona `radar_account_operation_id` ao convite e `canCompensateAmbiguousInvite`. O ramo novo é executado quando o convite foi tentado e seu userId não chegou. Isso reduz o risco de apagar conta alheia na ambiguidade **do próprio Auth**.

Na [Edge Function do #271, linhas 333–364](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/309abfdfc3717a6b78a3d01ff2bc3e18814960a3/supabase/functions/team-account-management/index.ts#L333), depois do convite bem-sucedido, `createdUser = true`. A RPC `upsert_team_member_account` é chamada e qualquer `error` é lançado. O catch prioriza `createdUser && userId` e chama `removeInvitedUser`, sem consultar confirmação/idempotência da operação no banco. O novo `compensateAmbiguousInvite` nem é alcançado nesse cenário.

Reprodução com a função real transpileada, Auth e RPC simulados:

```text
auth-invite
database-commit-response-lost
auth-delete-compensation
```

Resultado: conta Auth excluída, linha de diretório ativa com `user_id = null`, vínculo de perfil removido, log administrativo persistido. Os efeitos de FK usados na simulação correspondem a `202607130002_auth_and_rls.sql`: diretório referencia Auth com ON DELETE SET NULL; perfis, com ON DELETE CASCADE. Nenhum usuário real foi convidado ou removido.

**Causa raiz:** exceção de transporte é tratada como certeza de rollback da transação remota. O mesmo princípio merece caracterização no ramo de conta existente, que restaura metadados Auth anteriores após erro da RPC.

**Correção mínima recomendada, ainda não implementada:** separar falha comprovadamente anterior ao commit de resultado ambíguo; não executar compensação destrutiva sem confirmação de que o vínculo não foi efetivado. Reconciliar pela identidade da operação e pelo estado durável do banco. Uma leitura isolada de ausência enquanto a transação ainda pode finalizar não basta. Avaliar o contrato existente antes de propor nova migration ou storage de idempotência.

**Regressão necessária:** convite confirmado → RPC efetiva diretório/perfil/log → resposta perdida → conta Auth preservada e resultado reconciliável; contraparte RPC comprovadamente rejeitada sem commit → compensação correta; conta pré-existente → nenhuma restauração contradiz diretório confirmado. Os oito testes de domínio do #271 passam, mas não executam essa segunda ambiguidade.

## Gates no head exato do #272

| Evidência | Resultado | Interpretação |
|---|---|---|
| Local, unitários completos | 886/886 | Inclui os seis testes novos; não cobre as corridas/composição descobertas |
| Local, testes de raiz + integração | 148/148 (141 + 7) | Executados também na main, mesmo resultado |
| Inventário/NF, local main | 13/13 | Cobertura atual integrada |
| Contraprova: testes state-sync do #272 contra main | 2 falhas esperadas | RED real antes da correção |
| [E2E isolado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135651) | SUCCESS | Desktop, Android, iPhone |
| [Supabase reload](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002136423) e [lifecycle](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135477) | SUCCESS | Ensaios descartáveis dos fluxos existentes; não injetam as novas falhas locais |
| [Readiness isolado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135480) | SUCCESS | 401 pgTAP; schema/trigger terminal incluídos |
| [Lighthouse isolado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135474) | SUCCESS no job | Desktop LCP 3,43s; mobile 16,62s > 15s, dívida não bloqueante declarada no workflow |
| [Agregado, Supabase](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135492/job/101402770585) | FAILURE | Registry recusou postgres-meta:v0.97.0 com `toomanyrequests: Rate exceeded` ao gerar tipos; falha de infraestrutura |
| [Agregado, Lighthouse](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135492/job/101402770594) | FAILURE | Desktop LCP 3850,10ms > 3500ms; três rodadas; falha real do orçamento medido |
| [Agregado final](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34002135492) | FAILURE | Outros jobs, incluindo Playwright, backup, Excel, dependências, prontidão e migrations, passaram. Não substituir seu resultado pelo de jobs isolados |
| CodeQL e perfis/viewports | SUCCESS | Sem alteração desses gates no diff |
| Auth/Preview condicionado e Supabase Preview | SKIPPED | Ausência de execução não é sucesso |
| [Controle #273](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34001948010/job/101402310268) | FAILURE em desktop | LCP 3559,59ms; mostra baseline próxima/acima do limite, sem provar ausência de contribuição do #272 |

O #272 não alterou workflows nem thresholds. O verde do Lighthouse isolado aceita a dívida móvel explicitamente. O agregado continua bloqueante no desktop e falhou corretamente. Comparação #273 sugere variabilidade/baseline limítrofe; não comprova causalidade exclusiva nem autoriza relaxar o limite ou declarar todos os gates verdes. Não foram disparados reruns repetitivos para obter aprovação.

## PRs abertos e interferências

Inventário obtido via GitHub, preservado em `current-open-prs.json` no pacote de evidências. Além dos candidatos acima: #270 (loader), #269 (competência no teste de timeline), #268 (carteira zerada na desativação), #264 (dependências), #245 (Supabase CLI) e #5 (CSV histórico). Foram triados quanto à sobreposição; esta revisão profunda não equivale a aprovação de cada um.

#270 toca o carregamento de extensões, relevante para a composição de #272, mas não estava na main/head auditados. #263 altera amplamente AGENTS e documentação; as correções documentais desta frente devem ser conciliadas no merge, sem trocar o baseline pela rota candidata. #264/#245 não foram incorporados nem usados para explicar falhas no head de #272.

## Auditoria e atualização documental

| Artefato | Contradição encontrada | Atualização nesta frente |
|---|---|---|
| AGENTS | Mandava ler/executar R1–R9 como fila corrente, embora CURRENT_STAGE já o tratasse como histórico; contagem 44 de #215 escrita no presente | Rota corrente, distinção candidato/integrado, proteção terminal existente e limites de confirmação |
| CURRENT_STAGE | Topo ainda fechava #260/46 migrations; seção final ainda mandava iniciar R1 | Checkpoint pós-#267/47 migrations, resultados por SHA e próxima ação baseada nos achados; blocos anteriores marcados históricos |
| README e docs/README | Entrada ainda promovia plano de 03/09 a executável | Roteamento consistente para checkpoint/revisão corrente |
| PROJECT_CONTEXT e DECISION_LOG | Referência executável histórica; falta do estado terminal superveniente | Contrato terminal e distinção entre intenção dos PRs e garantia implementada |
| STATUS_DOCUMENTOS | Handoff #260 como referência da retomada | Revisão corrente e classificação do #260 como checkpoint anterior |
| Runbook Supabase | Migrations já integradas ainda chamadas candidatas | Vocabulário corrigido e evidência de metadados explicitada |
| Matriz JSON/Markdown gerado | Pacote patrimonial não apontava testes/trigger do #265 | Anchors e evidências acrescentados no JSON; Markdown regenerado pelo comando oficial |

Não reescrever auditorias/handoffs históricos para parecer atuais. Não declarar corrigidos R272-01/02/03/04 ou R271-01 nesta entrega documental.

## Continuidade e mecanismos de regressão que agregam valor

Os scripts e resultados estão em [docs/evidence/2026-09-06-pr-review](../evidence/2026-09-06-pr-review/README.md). São reproduções de auditoria com fronteiras explicitadas, não novos caminhos do produto nem substitutos das suítes oficiais. Os scripts que comprovam bugs terminam com sucesso quando reproduzem o estado incorreto esperado; para futuras regressões, inverter o oráculo para o comportamento corrigido e demonstrar RED antes do fix.

Próximos testes úteis, em ordem:

1. Composição real do bootstrap + aviso pós-commit, com uma escrita e uma notificação, em instalação inicial/tardia/repetida.
2. Interleaving determinístico de releitura A e commit B, verificando estado e row_version finais.
3. Segunda aplicação falha dentro do refresh, separada da falha de rede.
4. Região compartilhada: timer antigo não apaga aviso novo; alerta de sincronização tem ciclo de vida definido.
5. Contrato Auth + banco com commit efetivo e resposta perdida; contraparte sem commit.

Os testes já existentes de Inventário/pgTAP são suficientes para a proteção solicitada; sua rastreabilidade foi melhorada. Não criar nova infraestrutura geral, migration, wrapper ou suíte duplicada apenas para aumentar contagens.

Para continuar em ChatGPT normal, anexar o handoff/relatório e o pacote de reproduções, ou abrir o PR documental desta entrega. Revalidar main e heads antes de qualquer alteração. Os arquivos locais do Codex não são automaticamente compartilhados com outro chat.
