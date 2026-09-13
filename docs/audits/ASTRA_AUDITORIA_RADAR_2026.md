# Auditoria independente — RADAR PDDE 2026

**Data:** 13/09/2026. **Classe:** relatório incremental de auditoria; não substitui decisões canônicas.  
**Alvo:** `WilsonMPeixoto-2/RADARPDDE`, branch `fix/supabase-query-architecture-2026-09-11`.  
**Código auditado:** `8409297194e7b65dcf080c0638af77c882d8e2e0`. **Comparação funcional:** merge do PR #299, `d2663f1ae7554516caf315f53b2509fbcd295e01`.

## Estado atual da auditoria

- Último bloco concluído: 10 — avaliação das correções da branch.
- Descobertas: logs excluídos do bootstrap, mas 13 outras coleções continuam integralmente carregadas; confirmado bloqueio de readiness no modo local por extensão exclusiva do remoto. Integração corrigida; desktop incompleto.
- Investigação seguinte: PR #299 e alinhamento de migrations/RPCs/código.
- Pendentes: blocos 11–12; situação efetiva de Production não revalidada; nenhuma medição atual do banco; nenhuma prova de equivalência integral.
- Restrições: somente a branch isolada; nenhuma alteração de main, banco, migrations, secrets, configuração ou deployment de Production.

## Método e escala de evidência

Cada bloco registra arquivos/funções, conclusões, problemas, riscos, descartes e pendências antes do seguinte. Classificações: **confirmado**, **provável**, **hipótese**, **descartado**. Prioridades: crítica, alta, média, baixa. Medidas sintéticas não serão apresentadas como desempenho de Production; testes locais ou com fronteiras simuladas não certificam RLS/banco remoto.

A autoria desta auditoria é a assistência executada nesta conversa; o nome do arquivo segue a solicitação. Não se presume independência por troca de modelo: a independência é metodológica, por contraprovas e separação entre fatos e hipóteses.

## Bloco 0 — base e certificação

**Examinado:** `AGENTS.md`, modelo canônico, catálogo de superfícies, CURRENT_STAGE, método de engenharia, gate de frontend, validade documental, matriz funcional; manifests e workflows; `SupabaseRepository.load/loadAfterId/exportSnapshot`; teste de integração do bootstrap administrativo.

**Evidências:**

- Ancestralidade do merge #299 confirmada por `git merge-base --is-ancestor`.
- Base inicial `4c10fdd`: integração reproduzida com 1 aprovação e 3 falhas `MISSING_KEYSET_PAGINATION` em `appConfig`.
- `loadAfterId` recebe `this.pageSize`; o cliente simulado não tinha os métodos `limit` e `gt`. Correção registrada em `4fa29f3`; proteção do produto não modificada.
- Verificações locais: integração 8/8, unitários 984/984, sintaxe aprovada, arquitetura sem violações em 180 módulos/254 dependências; lint de segurança sem erros e 42 avisos existentes; lint E2E sem erros e 159 avisos.
- [Execução 34718744668](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34718744668), código `8409297`: cinco testes desktop aprovados, um reprovado e 19 não executados pela parada na primeira falha. Não há certificação desktop integral.
- Falha: `tests/e2e/evaluation-retification-ui.spec.js`, linha 67, `await page.evaluate(() => window.RadarProductExtensionsReady)`; timeout de 30 s nas duas tentativas. O teste não chegou à retificação.
- [Artefato de screenshots/trace](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34718744668/artifacts/10305153527), SHA-256 `8e9dc63b49942f0bc6d73444dc0bf9087ec643ee5f78ee8d10f69a8ff3c6e92e`.
- Execução anterior 34718133423 foi cancelada pela concorrência ao publicar parada na primeira falha; não representa aprovação.

**A-01 — Certificação desktop bloqueada na espera das extensões.** Impacto: não foi possível provar o fluxo de retificação. Causa ainda aberta; não atribuir o timeout à RPC, Supabase, regra de retificação ou autenticação sem trace. Situação: falha do teste confirmada; defeito de produto ainda indeterminado. Prioridade alta para certificação. Recomendação: localizar a promessa/dependência pendente e reproduzir com fronteira controlada. Cobertura: não corrigido.

**Hipótese descartada neste recorte:** ausência de tamanho da página no fluxo `exportSnapshot → load → loadAfterId` como causa das três falhas anteriores. O limite existe; faltava suporte no simulador.

**Contexto recebido, não remensurado:** cerca de 3.562 logs e 46 s de leitura pelo Controlador; rollback anterior não autorizado; migration #299 permaneceu aplicada. São informações do handoff, a confrontar com código e evidência remota disponível.

## Bloco 1 — autenticação e entrada

**Examinado:** `src/auth/session-service.js` (`signIn`, `establishFresh`, `loadAuthorization`), `src/integration/auth-bootstrap.js`, `auth-gate.js` (`waitForAuthorizedData`, `handleSubmit`, `showWorkspaceError`), `app.js` (`initializeRadarData`, `initializeRadarApplicationServices`, handler DOMContentLoaded), `src/application/data-service.js` (`bootstrap`), `src/data/supabase-repository.js` (`exportSnapshot`, `load`, `loadAfterId`), `repository-contract.js`, loader e leitor administrativo.

**Fluxo comprovado:** sessão Supabase → três verificações paralelas de perfil/papel/escopo → criação do repository/state port → snapshot de 13 entidades → conversão para estruturas legadas em memória → serviços → `RadarDataContext.ready` → aplicação de autorização/abertura da interface. A sessão persiste pelo SDK; as coleções operacionais não devem persistir. O snapshot executa até seis entidades em paralelo; dentro de cada entidade percorre páginas de 500, sequencialmente, até esgotar todos os registros visíveis por RLS. Não há recorte de competência nessa consulta genérica. Uma página limitada não limita o volume total do bootstrap.

**A-01 refinado — Readiness impossível no modo local.** Impacto: consumidores de `RadarProductExtensionsReady` ficam esperando indefinidamente; E2E de retificação não inicia, embora o Dashboard esteja visível. Evidência: `product-extensions-bootstrap.js/installCriticalExtensions` exige sempre sucesso do leitor administrativo; `administrative-log-read-model.js/install` retorna falso se o repository não tem `queryAdministrativeLogs`; o repository local não tem essa capacidade. `waitForCriticalExtensions` só acorda com evento de serviços e não distingue dependência inaplicável de dependência atrasada. Reprodução Node/VM reutilizando o harness do loader, com o **instalador real**: 22 scripts solicitados, zero falhas de scripts, instalador falso, loading verdadeiro e promessa ainda pendente após 100 ms. Trace do Chromium: 145 requisições, scripts relevantes HTTP 200; screenshot inspecionado mostra Dashboard carregado. Situação: **confirmado**, prioridade **alta**, presente na branch. Correção mínima: condicionar a obrigatoriedade ao modo/capacidade remota, mantendo falha fechada quando o Supabase realmente exigir esse leitor. Teste deve cobrir ambos os modos e atraso real dos serviços. O harness atual substitui o instalador por `() => true`, mascarando a incompatibilidade. Não é evidência de falha da RPC de retificação ou do login Supabase.

**A-02 — Barreira de inicialização ainda depende de todo o acervo operacional autorizado.** Impacto: qualquer entidade crescente ou consulta lenta pode atrasar a primeira tela, mesmo que ela não use os dados. Evidência: `REMOTE_BOOTSTRAP_ENTITIES` inclui verificações, despesas, bens, Pendências, tentativas e contatos; `load` varre até o fim; abertura ocorre após `await bootstrap`. Causa: contrato de snapshot ainda completo para esses domínios. Situação: arquitetura **confirmada**, futuro impacto de volume **provável**, prioridade **alta**; correção dos logs resolve uma fonte, não estabelece limite total. Recomendação: medir por entidade e depois introduzir consultas de operação atual/contexto temporal com carregamento explícito de competências antigas; não remover essas entidades sem mapear consumidores. Cobertura: parcial.

**Conclusão causal provisória:** o código sustenta a hipótese de demora pós-autenticação por leitura desnecessária; os números históricos recebidos ainda não são prova instrumental produzida nesta auditoria. Há pelo menos uma regressão independente em readiness local. A nova distinção visual de erro pós-autenticação é correta; `unhandledrejection/error` permite informar falha, mas uma promessa que nunca termina não dispara esses eventos. A espera de dados/autorização/navegação também não tem prazo máximo.

**Descartes:** scripts de retificação ausentes no trace; falta de senha como explicação do E2E local; ausência de limite no repository como causa das três integrações antigas. **Questões abertas:** distribuição real do tempo por consulta/RLS, tamanho por entidade e comportamento de timeout no modo remoto. **Checkpoint:** bloco concluído com análise estática e reprodução controlada; sem chamadas ao banco de Production.

## Bloco 2 — ciclo de vida e custos transversais

**Examinado:** política `ENTITY_LIFECYCLE`; serviços configuration/directory/school/verification/pendency/invoice/inventory/audit; consumidores em `app.js` (alerts, Dashboard, Pendências, prontuário, avaliações); `UnitOfWork.run`, `DataService.executeCommand`, `StatePort.capture/exportFromMemory/applyEntities` e ponte de estado.

Todas as coleções da tabela permanecem em memória até recarga/encerramento do documento; o modo remoto não persiste o bootstrap em localStorage. Quantidades atuais não foram consultadas.

| Entidade | Nascimento/escrita | Leitores reais | Natureza e carga atual | Avaliação |
|---|---|---|---|---|
| Configuração, programas, controladores, equipe | Serviços configuration/directory | Calendário, perfil operacional, formulários | Pequenos estruturais; bootstrap | Adequado manter inicial |
| Escolas e vínculos escola/programa | SchoolService e atribuições | Carteira, Dashboard, seletores, avaliação | Estrutural por escopo; bootstrap | Adequado para carteira atual; depende do escopo RLS |
| Competências | createExercise → RPC | Navegação temporal e regras mensais | Calendário cresce lentamente; bootstrap | Manter; não confundir com os registros mensais |
| Verificações/avaliações | VerificationService, efeitos de Pendências/notas | Dashboard, Análise, Bonificação, prontuário | Escola × programa × mês; todos os meses no bootstrap | Histórico crescente tratado como operação atual |
| Pendências | PendencyService, avaliação incorreta, notas | Fila, alertas, detalhes, prontuário | Workflow com acúmulo de encerradas; bootstrap integral | Separar ativos de histórico exige preservar passivos |
| Tentativas | registerAttempt/RPC documental | Detalhes/reanálise e estado aninhado da Pendência | Histórico filho crescente; bootstrap integral | Candidato a consulta contextual, após mapear projeções |
| Contatos | registerContact → RPC | Alertas, Pendências, prontuário | Histórico filho crescente; bootstrap integral | Alertas precisam de último contato/resumo, não necessariamente todo histórico |
| Notas/despesas | InvoiceService/RPCs e reanálises | Documentos, avaliação, Pendências, Inventário | Histórico por competência; bootstrap integral | Recorte por contexto possível; não simplesmente retirar |
| Bens | InventoryService, efeitos de nota permanente | Fila patrimonial, Dashboard, prontuário | Operação pendente + histórico concluído; bootstrap integral | Preservar bens pendentes de competências anteriores |
| Logs administrativos | appendLog e RPC/insertOnly | Auditoria e histórico escolar | Append-only; página contextual sob demanda | Estratégia alinhada, sujeita a avaliação de cache no bloco 6 |
| Perfis/vínculos/escopos | Gestão institucional | SessionService/RLS | Auth-only | Não duplicar no snapshot operacional |
| dataImportRuns/auditEvents | Importação/mecanismos técnicos | Manutenção/auditoria técnica | Append-only; fora do bootstrap | Adequado |

**A-03 — Escrita incremental de rede ainda reconstrói o snapshot completo no navegador.** Impacto: uma alteração simples custa CPU e aloca memória proporcional a todos os dados carregados, mesmo sem reler o banco; coleções auxiliares já abertas também participam. Evidência: `UnitOfWork.run` captura memória completa, muta, exporta estado inteiro e clona o snapshot na entrada da persistência e no retorno; `StatePort.exportFromMemory` clona memória, executa `JSON.stringify` de cada chave legada em um storage temporário e chama `exportLegacySnapshot`. `applyEntities` reduz a aplicação final, mas recebe coleções inteiras daquela entidade, não somente uma linha. Causa: fronteira transacional reutiliza snapshots de compatibilidade para toda operação. Situação **confirmada**, prioridade **alta** para crescimento; magnitude temporal ainda não medida. Correção mínima: caminho transacional por entidades/registro afetado e captura de rollback correspondente, preservando fila, versões e retorno confirmado. Cobertura: rede parcialmente otimizada; CPU/memória ainda presentes.

**A-04 — Alertas têm varredura multiplicativa de contatos.** Impacto: trabalho de primeira tela aumenta com Pendências ativas × total de contatos. Evidência: `app.js/getAlerts` percorre `pendencias` e executa `contatos.filter` dentro de cada ativa. Existem índices para outros consumidores (`rebuildOperationalIndexes`), mas esse trecho não os usa. Situação **confirmada**, prioridade **média**; recomendação: índice por Pendência/último contato construído uma vez, sem mudar regra do alerta. Cobertura: presente.

**Conclusão:** a arquitetura tem política central útil, mas as classes `scoped/workflow` não estabelecem limite temporal ou quantitativo. A ponte legada e estruturas em memória possuem numerosos consumidores legítimos; remoção indiscriminada quebraria o produto. **Descartado:** pressupor que atualização incremental elimina serialização global. **Aberto:** custos medidos e quantidades reais; avaliação de caminhos específicos de releitura nos blocos seguintes.

## Bloco 3 — Análise e Bonificação

**Examinado:** `app.js/toggleBonif`, `updateAnalise` e `changeProntuarioCompetencia`; `VerificationService.runSerializedVerificationWrite/setBonification/setTechnicalAnalysis/closeBonification/retify/persistAtomicVerification`; `SupabaseRepository.saveVerificationWithLog`; `DataService.executeCommand`; extensões atomic-analysis-pendency e operational-write-feedback; testes verification-write-serialization, verification-authoritative-result-contract e supabase-verification-reliability.

**Fluxo:** handler recebe escola/competência/documento → serviço valida papel, futuro, consolidação, Pendência e documentos aplicáveis → fila por escola/competência → fila remota da instância → mutação captura versão atual → RPC `save_verification_with_log` com registro, expectedVersion e log → resultado mesclado com snapshot → atualização incremental de verificações/logs → render e feedback. As filas esperam o retorno da operação anterior e evitam reutilizar sua versão antiga em cliques rápidos na mesma aba. `Incorreto` é recusado no setter simples; a extensão direciona abertura atômica de Pendência. Notas, boleto e Assessoria possuem guardas contra alteração mensal indevida de valores derivados.

**Evidência favorável:** comandos de bonificação/análise/consolidação declaram resultado autoritativo e entidades incrementais; com resposta completa, não executam releitura remota das coleções. O feedback distingue salvamento, sucesso e commit confirmado com sincronização local pendente. O tratamento de erro restaura o valor do controle e renderiza estado restaurado. A navegação temporal usa `activeProntuarioCompetencia` e dados existentes; não foi removida pela correção de logs.

**Conclusão:** o desenho de persistência dessas operações é coerente com o objetivo funcional e não há evidência de regressão de regra nessas mudanças. O custo global A-03 continua em cada escrita. A fila remota é global à instância: uma gravação lenta de outro domínio também pode atrasar a seguinte, escolha atualmente necessária ao estado mutável/rollback compartilhado.

**Riscos, separados de defeitos:** troca de tela enquanto há RPC em trânsito precisa de E2E específico para garantir que o render tardio não perturbe o contexto atual; esta leitura não prova equivalência visual. O teste de escrita rápida simula o servidor e só prova a fila de uma instância. O E2E com Supabase real é explicitamente ignorado sem `RADAR_E2E_SUPABASE_LOCAL=1`. **Prioridade:** alta para completar certificação; média para instrumentar fila/CPU. **Recomendação:** preservar retorno autoritativo/fila/guardas; medir etapas; cobrir duas escritas rápidas e troca/retorno de competência com atraso de resposta. **Cobertura:** testes unitários verdes; jornada desktop integral ainda bloqueada por A-01. **Descartado:** necessidade de reler todo histórico para confirmar avaliação simples. **Aberto:** concorrência entre sessões (bloco 8) e prova visual do candidato completo.

## Bloco 4 — Pendências

**Examinado:** `PendencyService` (open, persistPendencyCommand, registerAttempt, registerInvoiceDocumentAttempt, reanalyze, reanalyzeInvoiceDocumentPendency, resolve, updateDetails, cancel/reopen/updateStatus, registerContact); `src/domain/pendencias.js`; handlers de novo envio, reanálise e drawer em `app.js`; RPCs em migrations `20260828023000_invoice_document_analysis_pendency.sql` e `20260906072000_pendency_reanalysis_server_invariants.sql`.

**Fluxos e evidência:** abertura documental com análise incorreta usa agregado Pendência/verificação/log; fluxo individual de nota acrescenta `registered_invoice_id` e versão da nota. Novo envio produz tentativa, muda status e pode identificar despesa/criar bem; reanálise atualiza tentativa, Pendência e análise, preservando bonificação. `resolve` usa reanálise correta, não simples troca arbitrária de status. Cancelamento/reabertura usam validação de domínio e expectedPendencyVersion; contatos possuem operationId idempotente e log na mesma RPC. A reanálise SQL exige papel autorizado, Pendência aguardando reanálise, tentativa correspondente, contexto e versões e retorna registros persistidos. O serviço mescla esses retornos mesmo quando usa `remoteCommitIsAuthoritative`.

| Operação | Confirmação/atualização observada | Leitura ampla normal |
|---|---|---|
| Abrir, novo envio, cancelar/reabrir, contato | Resultado autoritativo + mesclagem; render/índices após await | Evitada com retorno completo; fallback ainda possível |
| Reanálise comum | RPC confirma agregado, merge e commit autoritativo | Evitada no sucesso normal |
| Abrir/enviar/reanalisar nota individual | RPC documental, versões/contexto individual | Evitada quando todas as entidades declaradas aparecem no resultado |
| Editar motivo/observação | RPC de status retorna Pendência; comando sem flag autoritativa | **Sempre relê todas as Pendências** após commit |

**A-05 — Edição de detalhes ainda relê coleção integral.** Impacto: pequena edição aguarda consulta de todas as Pendências autorizadas e fica exposta a falha de leitura depois de uma gravação bem-sucedida. Evidência: `app.js/savePendencyDrawerEdits → PendencyService.updateDetails → persistPendencyCommand`; comando declara `pendencies/administrativeLogs`, mas nenhuma flag autoritativa; `DataService.needsCorrectiveRefresh` fica verdadeiro mesmo após merge válido; logs são isentos, Pendências não. Causa: adoção incompleta do contrato de retorno autoritativo. Situação **confirmada**, prioridade **média**, presente. Correção mínima: validar retorno da RPC e declarar resultado autoritativo com aplicação das entidades afetadas; teste deve contar consultas no fluxo real de comando.

**Risco:** `remoteCommitIsAuthoritative` representa confirmação de persistência, não prova de completude de todo estado derivado. Preservar essa distinção quando expandir o uso da flag; não usá-la para ocultar retorno incompleto. Estados auxiliares/detalhes consultam coleções da sessão e podem estar antigos por outra sessão (bloco 8). **Cobertura:** testes de domínio/serviço amplos existem e passaram na suíte; E2E de abertura atômica passou, ciclos completos e retificações manuais ainda não estão certificados neste candidato. **Descartado:** toda ação de Pendência obrigatoriamente relê logs; não é o caminho atual. **Aberto:** equivalência visual de todas as subopções e conflitos em banco real descartável. Prioridade alta para a jornada de novo envio/reanálise, preservando contexto e bonificação.

## Bloco 5 — Notas, documentos e Inventário

**Examinado:** `InvoiceService.save/createPersistence/updateDocumentAnalysis/updateServiceAdvisory/remove/saveUnidentifiedExpenseWithPendency`, guardas de histórico; `invoice-effects.js/planInvoiceEffects`; `InventoryService.persistAsset/forward/inventory`; Pendências individuais; `invoice-history-lock.js`, `auditable-retification.js`; SQL de efeitos de nota/transição patrimonial e testes invoice-service, invoice-effects, inventory-service.

**Reconstrução funcional:** despesa `a_identificar` exige criação atômica com Pendência individual; identificação no novo envio escolhe consumo/serviço/permanente e aplica derivados. Consumo não cria bem; serviço exige Assessoria individual; permanente cria/atualiza bem e estado de encaminhamento; boleto de internet é tipo de despesa, sem avaliação mensal independente. Análise fiscal é individual por nota e seu resumo mensal é derivado. `registered_invoice_id` mantém a relação de Pendência à nota. Regras de histórico bloqueiam exclusão e alterações estruturais incompatíveis; não foi encontrada remoção dessas guardas na branch. O marcador legado invoice-history-lock permanece com dependentes, mas declara que a autoridade está no serviço.

**Persistência:** plano calcula nota, bem/removido, verificação e log; RPC recebe versões de cada registro afetado e chave de operação para idempotência. SQL `20260822040642_invoice_asset_transition_integrity.sql` bloqueia registros, verifica vínculos e versões antes de remover/criar bens e devolve invoice/asset/deleted_asset_id/verification. Encaminhamento exige NF/processo e sincroniza avaliação por RPC; conclusão exige estado Encaminhada e devolve bem confirmado. Não foi provado órfão ou perda de vínculo no código auditado.

**A-06 — Fluxos frequentes de nota ainda relêem coleções após uma única alteração.** Impacto: cadastrar/editar/analisar/excluir nota pode esperar todas as notas, avaliações e bens das entidades declaradas, com custo crescente e falha pós-commit possível. Evidência: `invoice:save`, `invoice:update-document-analysis` e `invoice:remove` têm persistência especializada mas não declaram resultado/commit autoritativo; `DataService` faz refresh de todas as entidades alteradas exceto logs. As RPCs já retornam registros, mas o contrato genérico não interpreta `deleted_asset_id`/remoções e resposta nula como cobertura de entidade. Causa: migração incompleta do contrato de efeitos. Situação **confirmada**, prioridade **alta**, presente. Correção mínima: definir retorno completo de registros alterados e IDs removidos e aplicar patch com exclusões; somente depois eliminar releitura. Não basta adicionar uma flag às operações de exclusão.

**A-06b — Declaração incremental inefetiva na Assessoria comum.** `updateServiceAdvisory` declara entidades incrementais e apenas `remoteCommitIsAuthoritative`; `DataService.canApplyIncrementally` exige `remoteResultIsAuthoritative`. Portanto evita rede, mas aplica snapshot completo. Situação **confirmada**, prioridade **média**, mesma família A-03/A-06. Recomenda-se usar um contrato explícito de resposta completa, sem enfraquecer a recuperação de falha.

**Risco de concorrência intra-aba:** `InvoiceService.save` prepara plano/expectedVersions antes de entrar na fila global, enquanto avaliações capturam versão dentro de mutate. Operação anterior em trânsito pode tornar o plano antigo; a versão tende a rejeitar, mas exige prova de retry/replanejamento sem sobrescrever outros campos. Situação **provável**, prioridade **média**; não se afirma perda silenciosa.

**Cobertura:** testes existentes verificam consumo, permanente→serviço, remoção do último bem, Assessoria individual, análise de uma nota sem contaminar outra, despesa a identificar e encaminhamento agregado. São evidência de regra em fronteiras simuladas; não equivalem ao E2E integral com banco real. **Descartes:** necessidade funcional de reler histórico administrativo após cadastrar nota; necessidade de apagar histórico para corrigir desempenho. **Aberto:** jornada completa retificação→novo envio→reanálise→inventariação no candidato e resposta SQL efetiva do ambiente implantado.

## Bloco 6 — histórico administrativo e Auditoria

**Examinado:** `OperationalSupabaseRepository.queryAdministrativeLogs`, `administrative-log-read-model.js` completo, `school-timeline.js/activateTimeline/buildTimelineCard`, domínio school-timeline, AuditService, consumidores de load/exportSnapshot/persist por busca sistemática; índices e RLS locais; exportação Excel e filtro de auditoria.

**Correção válida:** bootstrap padrão exclui logs; instalação do read model não consulta; Auditoria/histórico escolar consultam somente quando abertos. Página padrão 100, máximo 200, consulta pede mais uma linha para hasMore; ordenação descendente por `(event_at,id)` e cursor composto com `<`, sem caminhar por offsets anteriores. Escola e ator são filtrados na consulta; RLS permanece. Registrar via AuditService insere somente o novo log e não lê anteriores. A tabela possui índice `(school_id,event_at desc)` e índice parcial de actor_user_id; plano real para ordenação composta ainda não medido.

**A-07 — Histórico cronológico perde acesso a logs antigos sem indicar incompletude.** Impacto: ao consultar competência anterior, logs dessa competência podem ficar além dos 100 mais recentes da escola e desaparecer da timeline, mesmo existindo no Supabase. Evidência: `activateTimeline` faz apenas `loadSchool(...,{refresh:true})`; consulta não filtra competência; domínio filtra competência no navegador; `renderTimeline/buildTimelineCard` não usa hasMore nem oferece continuação. A aba administrativa possui botão de páginas anteriores, mas a timeline mensal não. Falha de consulta é apenas console.error e a timeline é renderizada com dados disponíveis, sem aviso de histórico parcial. Causa: consumidor antes completo passou a receber página sem adaptar seu contrato visual/temporal. Situação **confirmada**, prioridade **alta**, regressão presente. Correção mínima: consulta/contexto temporal adequado e indicação de completude, continuação e erro na própria timeline; preservar navegação antiga.

**A-08 — Exportação Excel conserva caminho que relê todo snapshot e volta a persistir dados operacionais.** Impacto: ação secundária pode reintroduzir cópias no navegador e leitura integral inclusive de logs. Evidência encadeada: `excel-export-integration.js/logExport` chama `registerLog` e, independentemente do retorno, `persist('logs')`; `excel-export-audit.js/installLegacyFilter` suprime o log legado retornando null, mas não suprime persist; `app.js/persist → DataService.stageCompatibility` chama commitCurrent de toda memória; depois `persistSnapshot` exporta todas as entidades sem seleção e salva a coleção de logs. Não há guarda remota nesses métodos. Causa: consumidor de compatibilidade não migrado junto com AuditService; proteção append-only só existe em `executeCommand`. Situação **confirmada por caminho de código**, prioridade **alta**, presente; reprodução controlada adicional no bloco 7. Recomendação mínima: log de exportação exclusivamente pelo AuditService já instalado; bloquear persistência de snapshot de compatibilidade no modo remoto antes de tocar armazenamento/rede, preservando usos locais e manutenção explícita. Não remover genericamente a ponte sem mapear dependentes.

**Riscos adicionais:** o leitor contextual verifica `eq/or/order/limit` apenas opcionalmente; a ausência de método pode degradar silenciosamente filtro/limite/cursor, diferentemente de loadAfterId, que falha fechado. SDK atual oferece esses métodos, portanto não se afirma falha de Production; prioridade média para contrato/teste negativo. Cada escola consultada fica no Map de caches sem descarte; páginas acumuladas ficam no estado global e aumentam A-03. Respostas de escolas diferentes compartilham a mesma coleção global `logs`; renderers verificam contexto em alguns caminhos, mas aplicação da resposta não é cancelada por contexto/sessão.

**Conclusão:** o caminho principal novo está alinhado; A-07 mostra perda funcional por adaptação incompleta de consumidor, A-08 é uma rota concreta de reincidência. **Descartado:** afirmar que não existe nenhum consumidor operacional do snapshot só porque setters principais usam serviços. **Aberto:** races de histórico/troca de identidade e plano SQL real; estes são riscos, não prova de vazamento ou perda permanente. **Cobertura:** testes de uma página/cursor/refresh existem; faltam testes de timeline antiga, coexistência de superfícies e exportação com repository remoto real ou fronteira que conte chamadas.

## Bloco 7 — navegador, caches e legado

**Examinado:** busca sistemática de localStorage/sessionStorage/setItem; `state-bridge-metadata.js/clearPersistentOperationalCache`, `state-bridge.js`, StatePort, `readInitialRadarMemoryState/captureRadarMemoryState/applyRadarMemoryState`, repository factory, contexto temporal/navegação, auth-gate e SessionService; composição real dos dois módulos de exportação.

| Persistência no modo remoto | Conteúdo/justificativa | Situação |
|---|---|---|
| Sessão do SDK Supabase | Tokens de sessão/restauração, por persistSession | Intencional; não é snapshot institucional |
| `radar_pdde_theme` | Preferência visual | Intencional, pequena |
| `radar_pdde_active_competence` | Competência selecionada, validada contra disponíveis | Intencional, pequena |
| sessionStorage `radar_pdde_navigation_return_context_v1` | Pilha limitada de contexto de retorno, IDs/seletores e posição | Intencional; convém limpar ao trocar identidade |
| `radar_pdde_config/programas/controladores/equipe_inventario/escolas/verificacoes/pendencias/contatos/bens/notas_registradas/logs` | Coleções legadas | Bootstrap/escritas normais não deveriam gerar; **A-08 ainda gera** |
| `radar_pdde_bridge_metadata`, data_version, pendency_schema_version | Reconciliação/versões do cache legado | Limpeza seletiva remove; compatibilidade pode recriar |
| `radar_pdde_repository:*` | Antigo repository local | Removido no modo remoto |

**A-08 reproduzido:** composição do `logExport` real extraído da integração com `excel-export-audit.install` real e fronteiras instrumentadas produziu `audit início → persist('logs') → audit conclusão`, resultado ok, nenhum registro legado adicional. Segundo ensaio executou DataService e StatePort/bridge reais com repository marcado remoto: stageCompatibility criou **12 chaves locais** (11 coleções + metadata); persistSnapshot chamou `exportSnapshot({includeEmpty:true})` sem seleção de entidades e `save(administrativeLogs,...)`. Nenhum banco real foi usado. O teste existente excel-export-audit substitui a exportação por fake que só chama registerLog, omitindo justamente persist; logo sua aprovação não cobre essa composição. Recomendação e prioridade alta mantidas. Adicionalmente, falha nesse persistSnapshot tenta `restoreSnapshot(beforeRepository,{replace:true})`: compensação de acervo global é inadequada a escrita operacional e potencialmente interfere em mudanças concorrentes, conforme permissões efetivas; nenhum overwrite real foi observado.

**A-09 — Logout conserva estado operacional e pode anunciar sucesso após erro remoto.** Evidência: `handleSignOut` captura erro de signOut, em seguida zera RadarAuthContext e substitui mensagem por “Sessão encerrada”; não invalida DataContext/serviços/coleções/caches. Evento signed_out do bootstrap também só zera auth e mostra gate. Impacto: memória da sessão anterior permanece; falha real de encerramento é ocultada. Novo login explícito com DataContext pronto recarrega a página, o que reduz risco no fluxo normal, mas não demonstra descarte durante respostas em trânsito ou troca de sessão por outra aba. Situação: retenção/mensagem **confirmadas**, vazamento entre identidades **não provado**; prioridade **média**. Correção mínima: invalidar geração da sessão, descartar caches/contextos, neutralizar respostas antigas e manter erro honesto de logout, preservando RLS.

**Limpeza avaliada:** seleção de chaves é correta e preserva tema/seleção/token; `clearPersistentOperationalCache` retorna falhas por chave, mas chamador não inspeciona esse retorno. Persistência remanescente em navegador que recusa remoção não é observável ao suporte; risco baixo/médio, sem prova de leitura indevida. O bootstrap normal remoto hidrata memória e não reconstrói storage; os testes correspondentes sustentam somente essa fronteira.

**Conclusão:** cache persistente operacional não foi eliminado em todos os caminhos. Permanecer com objetos legados em memória como representação da UI é viável; persistir/transportar snapshots de todos os domínios em ações pequenas não é. **Descartado:** toda referência ao localStorage é defeito; preferências e sessão têm função legítima. **Aberto:** troca de contas em duas abas com RPC atrasada e ambientes com storage indisponível. Checkpoint gravado antes do bloco de concorrência.

## Bloco 8 — dois ou mais usuários

**Examinado:** busca de channel/postgres_changes/BroadcastChannel/storage/focus/visibilitychange no código de aplicação (excluídos bundles de terceiros); filas de VerificationService/DataService/UnitOfWork; mapper de conflitos; versões nos repositories e RPCs de avaliação, Pendência, nota, bem, calendário/programa; eventos de sessão.

**A-10 — Estado operacional pode permanecer antigo indefinidamente entre sessões.** Impacto: usuário B continua vendo avaliação, Pendência ou nota anterior à alteração de A até recarga ou releitura incidental da entidade. Evidência: bootstrap é a leitura principal; navegação só renderiza memória; não há assinatura de mudanças do domínio, polling de domínio ou invalidação ao retornar à aba nos caminhos pesquisados. Mensagem de conflito orienta recarregar/comparar, mas catch remoto não busca o registro atual. Situação **confirmada como comportamento**, prioridade **alta** para colaboração operacional; não significa automaticamente perda de dados. Cobertura: não resolvido pela branch.

| Cenário | O segundo usuário vê | Proteção de escrita/limite |
|---|---|---|
| Dois Controladores alteram a mesma avaliação | Versão do seu bootstrap | `save_verification_with_log` bloqueia linha e exige expectedVersion; segundo update antigo conflita |
| Controlador/Assistente operam Pendência | Status/tentativa da memória até refresh | RPCs usam versões/contexto/status; reanálise exige tentativa mais recente; fila JS não coordena sessões |
| Nota corrigida em outra sessão | Nota/derivados antigos | RPCs de nota verificam versões de nota, bem e avaliação; plano local deve ser refeito após conflito |
| Bem encaminhado/concluído por outro | Fila patrimonial antiga | RPC versionada evita update com versão velha; não atualiza visualmente a outra sessão |
| Novo contato/log | Ausente até leitura contextual/recarga | Inserção/operationId, sem conflito de update; histórico novo não se transmite sozinho |

**Alcance das versões:** ponte conserva rowVersion/row_version; `save_verification_with_log` recusa versão nula em update, usa `FOR UPDATE` e `WHERE row_version`, retorna a nova linha e log. Nota/efeitos e bens também usam versões. Cadastro simultâneo de primeira avaliação pode encontrar conflito de unicidade: proteção contra duplicata não equivale à UX normalizada de conflito. Não se afirma que todas as RPCs e todas as operações de cadastro possuem a mesma cobertura; consultas e ensaios adversariais de banco são necessários para abrangência total.

**Riscos adicionais:** snapshot de bootstrap faz várias consultas sem transação de leitura comum; uma mudança entre leitura de nota e avaliação pode montar estado temporariamente de momentos distintos. Fila local protege rollback entre comandos da mesma instância, mas o read model administrativo aplica estado diretamente, fora da fila; resposta atrasada pode competir com logs recém-produzidos antes de export/persist. Riscos **prováveis**, prioridade média, ainda sem reprodução de perda no banco. A compensação ampla de compatibilidade (A-08) exige atenção maior que operações atômicas normais.

**Recomendação prática:** começar com atualização contextual ao abrir/reabrir detalhes, ao retornar à aba após intervalo e após conflito; consultar apenas escola/competência/agregado necessário. Mostrar indicação de atualização disponível quando houver edição em andamento, sem substituir campos digitados. Preservar expectedVersion e oferecer comparação/reaplicação consciente após conflito. Para filas compartilhadas, avaliar notificação de invalidação por escola/entidade, agrupada e com atraso curto; buscar novamente o contexto ativo. Evitar subscrever/enviar todas as linhas históricas e evitar refresh global por evento. Logs não precisam de realtime permanente. Descartar respostas de geração anterior após logout/troca de identidade.

**Cobertura:** testes de fila simulam uma instância; E2E supabase-verification-reliability usa uma página e é condicionado ao ambiente descartável. Não foi executado ensaio real com dois usuários nesta auditoria. **Descartado:** fila JS ou row_version por si só manterem duas telas sincronizadas. **Aberto:** medição de frequência de conflitos e contrato de atualização contextual de cada tela.

## Bloco 9 — crescimento: atual, 10× e 100×

**Examinado:** padrões load/exportSnapshot/filter/sort/JSON.stringify; índices por escola em app.js versus varreduras de alertas/contatos; UnitOfWork/StatePort/bridge reais; cache administrativo; plano de leitura de até seis entidades.

**Experimento controlado, não Production:** Node 24.19.0, uma execução por tamanho, sem rede/DOM/banco. Estado sintético com 1.000/10.000/100.000 contatos (id, escola, canal, datas, descrição e pendenciaId null), demais coleções vazias, configuração de exercício 2026. `UnitOfWork.run` real com changedEntities programs, mutate mínimo, persist async vazio, remotePersistence true e deferLocalCommit true; StatePort/metadata bridge reais, Storage em memória. GC solicitado antes de cada tamanho. Medida inclui capture/export/clones, não aplicação final do DataService/render. Variação de heap é antes/depois, não pico nem retenção permanente.

| Contatos sintéticos | JSON de entrada | Tempo da unidade de trabalho | Variação de heap |
|---:|---:|---:|---:|
| 1.000 | 0,19 MiB | 43,5 ms | 4,4 MiB |
| 10.000 | 1,92 MiB | 402,9 ms | 46,6 MiB |
| 100.000 | 19,25 MiB | 3.589,1 ms | 391,3 MiB |

O ensaio confirma A-03 por execução: **uma operação que não altera contatos paga pelo total de contatos em memória**, sem qualquer lentidão de Supabase. Não é previsão numérica de tempo em navegadores reais; faltam aquecimento, repetição e distribuição real para benchmark de produção.

| Cenário do RADAR | Gargalo provável primeiro | Evidência/limite |
|---|---|---|
| Volume atual | Leitura desnecessária dos logs na base antiga; na branch, A-01 bloqueia readiness local e A-08 conserva rota ampla | Medida histórica de 46 s recebida, não refeita; nenhuma classificação do hardware/banco atual |
| 10× de histórico operacional | Bootstrap de avaliações/notas/Pendências/tentativas/contatos, cópias da ponte e refresh de notas/detalhes | O total transferido cresce com N; páginas não impõem teto global; experimento demonstra custo de estado |
| 100× | Alocação/GC/serialização global e barreira do bootstrap; alertas e renders com filtros repetidos; exportação legada/rollback amplos | Possível indisponibilidade percebida antes de capacidade do PostgreSQL se esgotar; ordem precisa depende de distribuição/cliente/RLS |
| Vários exercícios | Verificações escola×programa×mês e despesas/histórico acumulam; Pendências/bens ativos podem cruzar anos | Calendário pequeno pode continuar inteiro; acervo de cada competência precisa de consultas contextuais |

Com página 500, uma entidade lida até esgotar custa aproximadamente `floor(N/500)+1` requisições (inclui página vazia em múltiplo exato). Cursor melhora acesso às páginas; não torna `load` constante. Em `getAlerts`, filtro de todos os contatos por cada Pendência ativa pode aproximar custo multiplicativo se ambos crescerem. Índices em memória existentes para Pendências/bens por escola são úteis e podem permanecer; devem ser reutilizados nos consumidores que ainda fazem varreduras globais.

**Correção prioritária:** fechar A-08; ajustar A-01/A-07; completar retorno/remoções de A-05/A-06; instrumentar bootstrap por entidade; reduzir trabalho global de transação; depois recortar acervo por contexto mantendo passivos e navegação temporal. Aumentar paralelismo indefinidamente ou apagar histórico não trata a causa. **Risco SQL:** cursor de logs deve ser confrontado com EXPLAIN e índices adequados por filtro, sem supor que uma cláusula LIMIT garanta baixo custo de RLS. **Descartado:** toda lentidão remanescente precisa vir do banco. **Aberto:** cardinalidades reais, planos SQL, p50/p95 e limites de memória nos desktops da CRE. Prioridade alta para arquitetura de crescimento.

## Bloco 10 — avaliação do diff

**Escopo:** `git diff d2663f1..8409297`: 37 arquivos, 2.428 adições/96 remoções; 11 fontes do produto, 22 testes e quatro arquivos de documentação/configuração/workflow. Diff dos pontos centrais lido; módulos novos lidos por função e consumidores; alterações dos testes confrontadas com seus simuladores. Nenhuma migration nova neste diff.

| Correção/arquivo | Classificação | Fundamentação |
|---|---|---|
| Retirar logs do bootstrap — DataService/contract | **Correta mas incompleta** | Elimina consulta no caminho padrão; outras entidades crescem e compatibilidade contorna política (A-02/A-08) |
| Leitura contextual — repository-factory | **Correta, precisa ajuste/teste** | Filtros e cursor adequados com SDK completo; métodos obrigatórios tratados como opcionais; plano SQL não medido |
| `loadAfterId` — supabase-repository | **Correta, precisa teste adicional** | Limite/gt exigidos, continuidade testada; order opcional e leitura multiconsulta não é snapshot isolado |
| Read model administrativo | **Correta mas incompleta** | Consulta no pedido; caches/respostas compartilham logs globais; sem invalidação por identidade |
| Loader torna leitor crítico | **Potencialmente regressiva, regressão confirmada** | Modo local jamais satisfaz readiness (A-01) |
| Timeline usa página escolar | **Precisa ajuste** | Consulta primeira página e filtra mês depois; ignora hasMore/falha (A-07) |
| AuditService insere log individual | **Correta** | custom persist/insertOnly e retorno sem reread; consumidor de exportação legado ainda deve migrar |
| Bootstrap com persistStorage false | **Correta mas incompleta** | Testa/aplica fronteira correta; stageCompatibility contorna (A-08) |
| Limpeza seletiva — metadata bridge/factory | **Correta** | Chaves operacionais selecionadas; preservar preferências/tokens é apropriado; faltam observar falhas e impedir recriação |
| Política central append-only | **Correta mas incompleta** | Protege defaults/executeCommand, não persistSnapshot; escopos são textos, não filtros de consulta |
| Retificação manual declara resultado e incremental | **Correta no retorno, incompleta na aplicação** | Suprime refresh com retorno completo; StatePort não suporta patch de pendencies, então usa snapshot integral |
| Erro pós-login — auth-gate | **Correta mas incompleta** | Mensagem separa autenticação/preparo; não trata espera que nunca resolve; capture global pode atribuir qualquer erro durante loading ao ambiente |
| Testes de integração/fakes limit e gt | **Correta** | Compatibiliza simulador e acrescenta travessia multipágina; não remove proteção do produto |
| Testes de contrato/lifecycle/append-only | **Úteis, insuficientes para composição** | Verificam marcadores e comandos execute; perderam consumidor persist e exigência real do loader |
| Teste sucesso remoto/falha local | **Melhoria correta** | Agora falha em applyCanonical real da fronteira, afirma commit confirmado e sync falho sem repetir escrita |
| Workflow desktop, screenshots/trace e max-failures | **Correto para diagnóstico** | Mantém seleção total para aprovação; parada precoce não é certificação dos 19 não executados; CI atual vermelho |
| CURRENT_STAGE/STATUS_DOCUMENTOS | **Correto** | Preserva contexto causal/PR299 e evita orientar nova intervenção pela etapa antiga |

**A-03b — Incremental declarado sem suporte no state port.** Evidência: mapa de patch contém somente verifications, registeredInvoices e administrativeLogs; retificação manual declara pendencies. `applyEntities` cai em applyCanonical para o conjunto todo. Situação **confirmada**, prioridade **média**, sem perda funcional provada. Recomendação: ou documentar fallback real ou implementar patch completo da Pendência/índices/tentativas, com teste de comportamento; não considerar o marcador sozinho evidência de incremento.

**Inconsistência da política:** `dataImportRuns` é rotulado append-only, mas migrations de importação atualizam status/checkpoints do mesmo registro. É histórico de execuções com linhas mutáveis, não append-only puro. Hoje fora do bootstrap e usado por manutenção, portanto não foi provada regressão operacional decorrente; prioridade baixa/média para separar natureza de crescimento da política de refresh. `remoteBrowserPersistence:false` é metadado declarativo sem consumo nos escritores genéricos.

**Conclusão:** nenhuma necessidade de reescrita geral foi demonstrada. O núcleo da solução é correto, mas as afirmações “não há mais snapshot persistido” e “logs nunca voltam por caminho operacional” ainda são falsas, e duas adaptações novas regressam o contrato local/temporal. **Descartado:** tratar flags/testes de texto como comprovação de comportamento integral. **Aberto:** banco efetivo e certificação fim a fim após corrigir achados.
