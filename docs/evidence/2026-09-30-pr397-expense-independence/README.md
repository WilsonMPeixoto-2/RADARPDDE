# PR #397 — continuação e provas de independência operacional

**Estado:** candidato na branch do PR, validação parcial; sem merge, aplicação remota ou publicação em Production nesta execução.
**Início:** 30/09/2026 (Brasília).
**Base revalidada:** `main@a38eeef6c36e99be1777ce957d459bc40cdaca02`.
**Candidato recebido:** `631be4f5569b8f9f555b5fc3c0cbfd055260cea3`, branch `fix/decouple-expenses-bonification`, PR #397 aberto/Draft. Merge-base igual à main. Checkout inicialmente limpo; stash histórico de PROD-UX-08 preservado.

## Objetivo e mapa causal antes das alterações

O operador autorizado deve trabalhar a despesa no Prontuário da escola, competência e programa visíveis, mesmo sem lançamento ou após consolidação da bonificação. A bonificação manual e seu resultado continuam sob `VerificationService`; projeções operacionais continuam derivadas pelas autoridades existentes.

| Operação | Autoriza / escreve / deriva / apresenta | Persistência e convergência | Dependência retirada / proteção preservada |
|---|---|---|---|
| NF comum: cadastrar, editar, excluir, análise elegível | controles do item em `app.js` → `InvoiceService` → `invoice-effects`/análise individual → `DataService`/`UnitOfWork` | mapper/bridge → `save_invoice_with_effects[_v2]` ou `delete_invoice_with_effects` → helper privado → retorno canônico → projeção e `read_operational_context`/reload | retirar bonificação/consolidação como gate e reabertura incidental; preservar capacidade, escopo, contexto, versão, intenção, histórico e efeitos patrimoniais |
| Primeira despesa / a_identificar | ação contextual → `InvoiceService.save[UnidentifiedExpenseWithPendency]` → planner; bootstrap injeta `ensureProgramVerification` | `save_invoice_with_effects_impl` materializa contexto; `save_unidentified_expense_with_pendency` agrega Incorreto + Pendência; UoW deve conter todas as mutações | nenhum clique prévio em Sim; contexto local vazio é descartável; falha não confirma invoice/Pendência/bem/log/bonificação |
| Pendência fiscal / envio / identificação / reanálise | acesso no item/drawer/fila → `PendencyService` e integração fiscal | RPCs individuais + wrappers públicos + helper NF + `save_pendency_command`/reanálise; resposta/versionamento → releitura | bonificação não autoriza; novo envio não resolve; mesma invoice/Pendência; tentativa válida; nenhuma NF irmã bloqueada |
| Assessoria individual | edição ordinária em `InvoiceService`; Incorreto/abertura/reanálise em `service-advisory-pendency`; envio em `service-advisory-corrective-submission` | RPCs especializadas → helper de NF / Pendência → agregado de consultas | preservar autoridades distintas, isolamento por NF, histórico e tentativa; projeções consAssessoria/consEnviada permanecem derivadas |
| Permanente / Inventário | `invoice-effects` e `InventoryService` | NF/bem transacionais, projeção encampInventario; triggers e releitura contextual | preservar vínculo e estado terminal Inventariada; projeção operacional não reabre consolidação |
| Bonificação / telas gerenciais / exportação | `VerificationService` mantém edição/consolidação/retificação; consumidores usam bonificacao/resultadoBonif | RPC própria de verification; projeções gerenciais/exportação de contexto | operação de despesa não substitui lançamento manual ou resultado; atualizar resumo técnico é permitido; investigar propagação a consumidores |

`DataService` é autoridade de aplicação, staleness e fila; `StatePort`/bridge incorporam resposta canônica. Realtime somente invalida. Wrappers de feedback/scroll/medição não recebem autoridade de negócio. A ordem de bootstrap e os consumidores não alterados continuam no mapa de revisão.

## Propriedade dos campos

| Campo/grupo | Proprietário e regra nesta frente |
|---|---|
| notaFiscal em bonificacao/bonification | lançamento manual por VerificationService; preservar exatamente, inclusive ausência, vazio, Não e N/A |
| resultadoBonif / bonus_result | consolidação/retificação por VerificationService; despesa não possui este campo, inclusive null/string vazia |
| extCC, extINV, declBBAgil e demais marcações manuais | preservar; não preencher por inferência nem por snapshot incompleto |
| consAssessoria e consEnviada | projeções das consultas individuais, derivadas pela regra preexistente; não congelar o contêiner inteiro |
| encampInventario | projeção dos bens vinculados pela autoridade patrimonial vigente; preservar terminalidade |
| análise fiscal/Assessoria, Pendência, tentativa, bem, log | efeitos próprios, identidade/versionamento e autoria canônicos |

## Classificação inicial e plano verificável

| Requisito/risco | Evidência recebida e revalidada | Situação / próximo passo |
|---|---|---|
| CI de matriz/nomenclatura/readiness | JUnit do run 36635694371, artefato unit-tests-report; reprodução local | Markdown gerado diverge; conferir fonte/gerador, regenerar oficialmente e executar verifier |
| unitário de exclusão permanente | mesmo JUnit, teste invoice-effects:325; reprodução local: apta recebido, vazio esperado | contrato de reabertura superado pela ADR-055; preservar assertions de exclusão do bem e provar resultado apta intacto |
| E2E/visual interrompidos no clique | logs citados + seletores globais em quatro arquivos; dois programas legítimos | delimitar programa/documento/registro semanticamente; executar jornada após desbloquear seleção; goldens ainda não são evidência de divergência visual |
| campos manuais na escrita | createPersistence recebe verification inteira do snapshot; mapper normaliza resultado vazio para null; SQL atual aceita bonus_result presente | risco causal localizado; construir reprodução do patch real e contraprova com consolidação existente antes de alterar fronteira |
| primeira despesa local | ensureContextVerification chama helper mutável antes de DataService.execute | hipótese de projeção sobrevivente a rollback; teste com UoW/bridge reais e rejeição, validação posterior e falha de reconciliação |
| primeira despesa remota | SELECT FOR UPDATE sobre contexto ausente + INSERT; pgTAP atual 13 assertions positivas/admin/replay serial | provar concorrência controlada, rollback intermediário, perfis/escopo, contexto remoto omitido e idempotência; conflito explícito pode ser correto |
| preservação de #396 | main contém read_operational_context; candidato não modifica DataService/consulta | atacar releitura/reload/troca de contexto/resposta tardia no caminho alterado; sem bootstrap global/cache paralelo |
| aceitação desktop | ainda sem nova captura | executar controles reais, 1440×900 e 1366×768; abrir capturas e registrar leitura humana; PROD-UX-08 continua separado |

Hipóteses materiais serão registradas como invariante → reprodução/mecanismo → autoridade → mudança mínima coerente → vizinho permitido/proibido → resultado. Não adicionar wrapper, polling, retry ou RPC paralela para contornar falhas.

## Ambiente e limites já constatados

- Node local 24.19.0, npm 11.17.0; dependências homologadas preservadas.
- Docker não está instalado neste host e WSL informa não estar instalado. Provas de PostgreSQL/Supabase reais usarão os runners descartáveis existentes do repositório, com evidência por SHA/job/artefato.
- Conector Supabase retorna zero projetos; acesso administrativo de leitura solicitado para confirmar histórico de aplicação. Nenhuma migration remota foi executada; não presumir estado do schema compartilhado.
- #395 foi lido em `44e0b59f4c002e7c5ed34ae320132a11b606acc1` como contexto metodológico, sem executar seus planos. #394, PROD-UX-08 e evolução visual ampla continuam frentes separadas.
- Merge/Production exigem autorização específica desta frente, conforme prompt atual. O candidato será preparado e publicado na branch do #397; plano de publicação precede qualquer pedido necessário.

## Checkpoint 1 — reprodução inicial

`node --test --test-reporter=dot tests/unit/functional-contract-matrix.test.js tests/unit/invoice-effects.test.js` reproduziu as duas falhas do JUnit. O comando de teste retornou falha; os comandos de inspeção seguintes não mudam essa conclusão. Nenhuma alteração de runtime feita neste checkpoint.

A confirmação do merge-ref e a contagem da CI serão vinculadas ao checkout efetivamente executado. O estado verde de um agregador ou de um job que parou cedo nunca será promovido a prova da jornada inteira.

## Checkpoint 2 — contratos reconciliados e RED da fronteira

Em 582096b4 foram publicados os seletores contextualizados, a regeneração oficial da matriz e a expectativa sucessora da ADR-055. Prova local: 19 testes de matriz/effects aprovados; 12 E2E desktop (journey + functional-core) aprovados. São fixtures locais, não Supabase real.

Invariante: despesa não possui bonus_result nem marcações manuais. Mecanismo: InvoiceService exporta verification inteira pelo bridge real; o mapper produz bonus_result:null para resultado vazio; executeRpc envia a chave intacta; helpers save/delete aceitam substituir o JSON completo e limpar o resultado. Contraprova local expense-verification-ownership: dez RPCs falharam como esperado, enquanto a capacidade própria de reabertura permaneceu válida. O teste adicional usa transformLegacyState real e saveInvoiceWithEffects para rastrear null até a chamada efetiva.

O pgTAP expense-verification-ownership foi publicado antes da correção para verificar o efeito em PostgreSQL descartável: Assistente real, patch ausente/null/vazio/divergente, marcações e análise de outros documentos, conflito/rollback, exclusão. Resultado remoto ainda pendente.

Mudança mínima planejada: omitir bonus_result apenas nos RPCs especializados de despesa; no helper existente salvar/excluir, limitar merge aos campos operacionais notaFiscal/consAssessoria/encampInventario da análise e consAssessoria/consEnviada/encampInventario da projeção. Defaults estruturais da primeira linha continuam vazios, sem inferência manual. Não alterar a RPC própria de verificação. Na reanálise genérica, preservar o contrato dos documentos não vinculados a NF e aplicar propriedade restrita somente à Pendência vinculada.

O estado da migration compartilhada segue desconhecido (conector sem projetos). Para não reescrever história possivelmente aplicada, a correção será uma migration posterior que conserva wrappers/grants/INVOKER/DEFINER e redefine somente autoridades existentes. Não haverá aplicação remota nesta execução.

## Checkpoint 3 — propriedade corrigida e provas de primeira criação instaladas

Em 64bd56ec foi publicada a correção na autoridade SQL existente (save/delete e reanálise vinculada), sem nova RPC, trigger de produto, polling ou retry. A migration 20260929213000 permanece intacta; a posterior 20260930003000 inclui defaults estruturais canônicos e merge restrito. A omissão de bonus_result nos dez RPCs especializados passou nos testes, com contraprova da reabertura legítima em save_verification_with_log.

RED real de propriedade: run 36664215906/job 109725311031, Supabase local, 529 assertions pgTAP, 7 falhas de propriedade dentre 15 do arquivo novo. Checkout 4ae84fc (merge-ref) equivalente a 582096b4; sem diferença de arquivos.

A nova migration exigiu reconciliar os espelhos verificáveis da contagem/histórico. No primeiro pipeline corretivo, migration-smoke passou; supabase-local parou antes do pgTAP em MIGRATION_HISTORY_MISMATCH e readiness parou no esperado 57/encontrado 58. Não há resultado de autorização/concorrrência desse job. Manifesto pós-aplicação, schema.test e final-alignment foram ajustados para 58, sem enfraquecer comparação exata.

Autoridade de primeira criação: hipótese adicional a refutar em banco real — can_write_school admite escopo explícito para outros perfis; a capacidade de despesa não deve nascer apenas desse escopo. O pgTAP first-expense-authority testa Controlador real, SME/Inventário com escrita explícita, CRE indevida, ID não canônico, erro de valor após INSERT, cliente que omite contexto remoto existente e ausência de efeitos parciais. Nenhuma mudança de capacidade implementada sem ver o resultado causal.

A prova de concorrência usa duas sessões paradas num BEFORE INSERT de teste, depois de observarem linha inexistente. Esse trigger existe somente no runner descartável e é removido no finally; não compõe migration. Critério: um vencedor atômico, conflito explícito do perdedor, replay sem novo log, chave divergente rejeitada e recuperação após leitura da versão vigente. Não impõe sucesso simultâneo irrestrito.

Readiness local avançou por unitários e integração, parando somente no espelho 57/58, depois corrigido. Capturas e ciclo real do novo UAT ainda pendentes. CURRENT_STAGE/STATUS_DOCUMENTOS foram reconciliados para um único handoff #397, preservando UX08 separado. Plano de publicação compatível documentado, sem aplicação remota.

## Hipótese refutada na leitura humana — início indevido no resumo

Capturas reais de 64bd56ec/36665464434 foram abertas. A primeira NF nasceu com todos os lançamentos manuais vazios e bonus_result:null, mas o programa apareceu Em apuração porque consAssessoria=Não se aplica (projeção legítima) participa de hasStarted. A ADR-055 exige que a materialização operacional não represente início lógico de bonificação. O teste em tests/fluxo-operacional.test.js reproduziu em-apuracao recebido/nao-lancada esperado.

Causa: getProgramBonificationStatus usa todos os campos do contêiner para detectar início, sem distinguir propriedade. Correção mínima planejada: somente essa detecção ignora consAssessoria/encampInventario derivados; evaluateBonification e cálculo de consolidação não mudam. Contraprovas: lançamento manual Não ainda significa em-apuracao; resultado apta existente continua apta quando projeções mudam. Não congelar nem remover projeções. A captura deve mostrar o cartão operado, não apenas cabeçalho; o UAT será ajustado para scroll contextual e modal visível.

Diagnóstico pgTAP de eda51724: teste de propriedade passou. Primeira autoridade parou antes das assertions por fixture Inventário sem inventory_member_id; foi corrigida conforme constraint real, sem tocar autorização. Também reconciliados dois NULL esperados que permaneceram no teste histórico de reabertura e o alias sintético notas para a chave canônica notaFiscal no teste de RPC; mantidas assertions de efeitos/versões/rollback.

## Checkpoint 4 — GREEN da propriedade, RED da capacidade e resumo

Em c3f84faf/36699493826, a CI executou 543 assertions pgTAP. O teste de propriedade e os vizinhos passaram; first-expense-authority falhou em 3/14. Inventário com scope can_write=true conseguiu materializar primeiro contexto; SME recebeu conflito do contexto indevidamente criado, e Controlador depois também encontrou esse contexto. A falha secundária não significa negar o Controlador autorizado. Trecho do RED está versionado.

Causa confirmada: o helper DEFINER valida escrita escolar, mas a nova materialização não valida capacidade de despesa. Menor correção: apenas no ramo not found (primeira materialização introduzida pelo #397), exigir papel efetivo controller/federal_assistant/technical_admin antes do INSERT, além de can_write_school. Não revogar grants, não trocar DEFINER/INVOKER, não endurecer operações históricas de invoices por fora do escopo. A contraprova cobre os perfis reais e escola fora da CRE.

O gate npm bloqueou a integração por quatro vulnerabilidades (duas moderate/duas high). Controle comparável: package.json/package-lock/vendor sem diff contra a38eeef6; blob do lockfile 5d2d47d66c257da1980bbe65aec5b8d6a3ba0a59 igual em main e candidato. npm audit --package-lock-only reproduz exatamente quatro alertas. Não houve atualização de dependências, allowlist, suppressão ou relaxamento de gate; correção de dependências requer frente própria autorizada. Este candidato não pode ser chamado pronto para integração enquanto o gate falha.

O ciclo real em 64bd56ec/36665464434 passou 19/19, incluindo criação UI de primeira NF, CRUD consolidado com Controlador/Assistente e exportação mantendo APTA. Após acrescentar primeiro a_identificar em CONECTADA, o ciclo subsequente será avaliado pelo novo HEAD. Capturas iniciais mostravam sobretudo cabeçalho devido ao scroll interno; serão sucedidas por cartão/modais nos tamanhos 1440/1366, efetivamente abertos. O achado de resumo lógico foi reproduzido e corrigido na autoridade getProgramBonificationStatus (18/18 testes locais), sem mudar evaluateBonification ou resultado consolidado.

## Hipóteses de fechamento — feedback de concorrência e coleta visual

Invariante: o perdedor da primeira materialização concorrente deve receber conflito recuperável, sem sucesso local falso. O banco prova 23505 quando duas sessões observam o contexto ausente; o repositório transforma esse código em CONFLICT sem status HTTP, enquanto o error-mapper reconhece 23505/409/OPTIMISTIC_CONFLICT e não CONFLICT. Hipótese: a tradução perde a classificação e apresenta falha transacional genérica. Refutação: enviar o erro remoto realista pelo repositório e pelo mapper, e verificar a UoW real com consumo/permanente/a_identificar. Se confirmada, traduzir somente conflito dos RPCs especializados de despesa para o contrato OPTIMISTIC_CONFLICT já existente, preservando a política de outras RPCs e sem retry automático.

Coleta visual em e87a8b01/36700022848: 20/20 jornadas aprovadas; a leitura das imagens confirmou Não lançada após primeira NF, mas algumas capturas ainda mostram cabeçalho ou modal em transição. Causa de tooling confirmada em styles.css: modal fechado mantém display:flex/opacidade 0, que Playwright isVisible não distingue. A captura deve usar a classe de abertura, aguardar opacidade estável e enquadrar o painel NF, com assert de presença no viewport. Alterar somente a prova; não alterar scroll ou composição do produto para produzir imagem. Drawer completo/PROD-UX-08 continua sem homologação nesta frente.

## Checkpoint 5 — candidato para gates finais

Confirmado o RED de feedback: 13/14 testes da fronteira aprovados e um recebido TRANSACTION_FAILED/esperado OPTIMISTIC_CONFLICT; UoW real 7/10, com três falhas de classificação no erro 23505. [Trecho](red-concurrency-feedback.txt). Corrigido apenas executeRpc dos nomes especializados de despesa; error-mapper global e outras RPCs preservados. GREEN dirigido: 26/26 testes da fronteira/UoW/mapper. Readiness local da árvore sucessora: 1165 unitários + 8 integrações, zero falhas/skips; verificações de matriz, arquitetura, lint, artefatos, tipos e auditoria estrutural aprovadas.

Prova remota anterior `e87a8b01`: merge-ref `8554802061c618c9bddcbfc3c4d41be233c944d5` comparado sem diferenças. Supabase readiness `36700022728` passou 546 assertions/38 arquivos, concorrência controlada e lint SQL, mas falhou após isso em quota do registro ao baixar postgres-meta. Supabase da homologação integral `36700022739` passou geração de tipos e 17 jornadas, demonstrando a diferença de ambiente/etapa. Ciclo real `36700022848`: 20/20, sem skips. Regressão visual `36700022858`: seis baselines críticos aprovados, sem mudança de goldens. Não transportar essas execuções como se fossem do próximo SHA.

Fixtures de aceitação foram reconciliadas: SQL usa NF manual Sim/apta e patch adversarial Não; UI usa NF manual Não/inapta. Primeira criação mantém manual vazio/resultado null. Combinações sintéticas anteriores são somente evidência física de propriedade, não exemplo funcional alcançável. Os novos screenshots aguardam a opacidade do modal e enquadram o painel NF nos viewports reais; imagens finais precisam ser abertas antes do parecer humano.

Revisão adversarial integrada: removidos gates apenas nas ações de despesa; isBonificationLocked e VerificationService continuam protegendo bonificação. Assessoria conserva serviços distintos, tentativa/Pendência e projeções derivadas. SQL conserva nomes/assinaturas/grants/owner/search_path, efeitos patrimoniais, versões e wrappers idempotentes; o novo teste negativo cobre só a capacidade da primeira materialização. DataService, leitura contextual, AbortSignal e invalidação não foram substituídos. Excluir histórico protegido, mudar tipo inelegível e reabrir consolidação por despesa continuam proibidos pelos testes existentes e sucessores.

O estado final dos checks e a leitura humana serão publicados no PR após estabilizar esse candidato. O bloqueio de dependências permanece explícito no CURRENT_STAGE e no único handoff corrente; não há declaração de pronto para integração ou homologação de Production.

## Checkpoint 6 — enquadramento refutado e método corrigido

Em `0f5978b2`/36702274474, o ciclo real terminou com 16 aprovados, uma falha e três cenários não executados. A primeira falha ocorreu antes de qualquer cadastro, na captura: scrollIntoViewIfNeeded alinhou a borda inferior em 901,03125 para viewport de 900; ratio recebido 0,996553/esperado 1. Não é prova negativa da gravação ou permissão e não houve redução da assertion/tolerância.

Antes de alterar novamente a coleta, o método foi reavaliado com uma prova de geometria local usando o mesmo app/Playwright e fixture, separada da prova Supabase. Reprodução exata em 1440×900: ratio 0,996553242/top 601,84375/bottom 901,03125. Scroll DOM nativo centrado produziu ratio 1/top 300,84375/bottom 600,03125. Em 1366×768 também ratio 1/top 234,5/bottom 533,6875. Modal com opacidade estável e conteúdo integral passou. Três imagens locais abertas, sem afirmar persistência real desse ensaio. A captura foi corrigida para centralizar o painel e manter ratio:1; nenhuma alteração de produto, timeout, tolerância ou golden.

O SQL do mesmo SHA passou 546 assertions, barreira, replay/payload divergente/recuperação e lint; workflow readiness falhou posteriormente por quota postgres-meta. A imagem final do ciclo Supabase e os cenários não executados precisam da execução sucessora. Não chamar 16/20 de aprovação integral.

## Checkpoint 7 — candidato executado e evidência preservada

Candidato testado: `203ef0428c598a3cf2895e9c67c67fc4b96c924a`, base `a38eeef6c36e99be1777ce957d459bc40cdaca02`, merge-ref `ad566fe98a4dfadc177179953b86dfb8a4354543` comparado sem diferenças de arquivos. [Checkpoint online](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397#issuecomment-5909882780). Esse SHA modifica somente coleta de capturas e seu registro frente a `0f5978b2`; runtime, SQL e fixtures são equivalentes. Commit posterior que preserve estas evidências não transforma a execução de 203ef042 em execução de outro SHA.

| Prova / ambiente | Execução e resultado confirmado |
|---|---|
| [Supabase readiness](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36703462042), Ubuntu/Supabase descartável | três jobs aprovados; 546 assertions pgTAP/38 arquivos; duas sessões com barreira, vencedor/conflito, replay/resposta descartada/payload divergente/recuperação; lint SQL, tipos e 16 jornadas frontend/Auth/RLS aprovados |
| [Ciclos reais](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36703462038), Chromium/Auth/Supabase descartável | 20 aprovados, zero falhas/skips/flaky; primeira NF, primeiro a_identificar CONECTADA, CRUD consolidado de Controlador/Assistente e jornadas vizinhas |
| [E2E desktop](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36703462220), modo local | 184 aprovados, 58 skips condicionais, zero falhas; skips não contam como aprovação |
| Regressão visual desktop | seis baselines críticos aprovados, nenhum golden atualizado |
| [Snapshot dos checks](checks-203ef042.json) | 42 concluídos: 36 aprovados, 4 falhos, 2 ignorados, zero pendentes |

Os quatro checks vermelhos agrupam uma causa: três jobs param na auditoria de dependências e o gate final agrega essa falha. O lockfile e package.json/vendor não diferem da base; `npm audit --package-lock-only` reproduz quatro vulnerabilidades (2 moderate/2 high). Isso é bloqueio real do gate, mesmo sem alteração de dependências nesta frente. A quota de postgres-meta de execuções anteriores **não se repetiu** neste candidato; Supabase readiness passou integralmente. Não atualizar ferramentas, fazer allowlist ou relaxar gates para integrar o #397.

### Leitura humana das capturas efetivamente abertas

As imagens abaixo vieram de controles reais em sessão Auth/Supabase descartável. Foram abertas individualmente; não são aprovação obtida apenas por DOM ou assertion. Dados e escolas são sintéticos. [Manifesto](manifest.json) registra SHA, origem no artefato `functional-lifecycle-36703462038` (ID 11091063643), perfil, contexto, viewport e SHA-256; a cópia versionada preserva a evidência após expirar a retenção da CI.

| Etapa e captura | O que um operador consegue entender pelo que está visível |
|---|---|
| [Antes da primeira NF, 1440×900](captures/01-primeira-nf-antes-1440.png) | painel Notas Fiscais vazio; nenhuma opção manual selecionada; Adicionar Nota e Registrar despesa a identificar disponíveis |
| [Modal de consumo BASIC, 1440×900](captures/02-modal-consumo-basic-1440.png) | escola, 05/2026 e PDDE Básico identificados antes de salvar; descrição, número, valor e ação Salvar Gasto legíveis; complemento longo do tipo parcialmente cortado |
| [Primeira NF após reload, 1366×768](captures/03-primeira-nf-reload-1366.png) | uma NF de R$ 123,45 reencontrada; bonificação manual segue sem seleção; editar/excluir estão junto do registro; rótulo do seletor técnico parcialmente cortado |
| [Modal a identificar CONECTADA, 1440×900](captures/04-modal-identificar-conectada-1440.png) | contexto Educação Conectada explícito; dados provisórios e observação orientam cadastro; classificação final não é exigida; ação Registrar Despesa visível |
| [Pendência recém-aberta no drawer, 1440×900](captures/05-identificar-drawer-1440.png) | sucesso, Pendência Aberta, competência/programa e dados da despesa visíveis; Registrar envio/identificação é a ação principal; edição provisória secundária; conteúdo inferior continua além do viewport |
| [a identificar após reload, 1366×768](captures/06-identificar-reload-1366.png) | registro e valor reencontrados em CONECTADA; Incorreto + Visualizar pendência; bonificação manual continua vazia; descrição usa elipse, com texto completo no drawer |
| [Controlador em contexto consolidado, 1366×768](captures/07-controller-consolidada-1366.png) | Não permanece selecionado e protegido nos controles manuais; ações de despesa disponíveis junto da NF; consolidação continua identificada |
| [Assistente em contexto consolidado, 1366×768](captures/08-assistente-consolidada-1366.png) | Não permanece selecionado; serviço aparece na Consulta Assessoria com estado operacional próprio; ações elegíveis disponíveis; retificação da bonificação permanece ação distinta |

O contexto completo é apresentado no modal; as capturas centradas no painel não certificam a composição de todos os cartões fora do enquadramento. A evidência JSON confirma a cadeia UI → persistência → releitura/reload: [primeira NF](records/contexto-primeira-despesa.json), [NF/Pendência CONECTADA](records/contextos-e-pendencia.json), [Controlador antes/depois/exclusão/exportação](records/controller-antes-depois.json), [Assistente](records/federal_assistant-antes-depois.json). Nos dois perfis, NF manual Não e resultado `inapta` permanecem, com exportação INAPTA; consAssessoria muda legitimamente para Não com o serviço e volta a N/A após sua exclusão. A exportação foi capturada antes da exclusão, conforme o cenário.

**Parecer:** as ações e o contexto exercitados estão legíveis e o resultado funcional foi reencontrado. Isso não aprova integralmente o Prontuário nem o drawer: os cortes descritos abaixo permanecem. Os screenshots automáticos genéricos de fim de teste que pegaram a tela durante rerender não foram escolhidos como prova de layout final.

### Controle comparável e roteamento das limitações visuais

Os seletores nativos mostram parte de Não analisado e do complemento do tipo de gasto cortada. Não foi presumido que o defeito era anterior só porque CSS não mudou. O primeiro controle local sem readiness das fontes mostrou métricas diferentes; foi descartado como comparação insuficiente. O controle sucessor abriu baseline e candidato no mesmo Chromium/Windows, 1366×768, mesma fixture e ação NF = Sim exigida pela baseline, aguardando stylesheet e `document.fonts.load`/`document.fonts.ready` para Plus Jakarta Sans.

O [registro de métricas](controls/font-comparison.json) mostra largura de seletor 146,765625 px, texto 82,566284 px e mesma tipografia/padding em ambos. As imagens foram abertas: [baseline do seletor](controls/baseline-select-1366.png), [candidato](controls/candidate-select-1366.png), [baseline do modal](controls/baseline-modal-1366.png), [candidato](controls/candidate-modal-1366.png). Ambos repetem os mesmos cortes. `git diff a38eeef6 HEAD -- styles.css src/styles index.html assets` é vazio. A preexistência está comprovada nesse controle local; ele não é prova de backend, nem homologação de Production ou comparação direta no runner Linux.

Roteamento: registrar os seletores como limitação visual preexistente do Prontuário/formulário para uma frente visual dirigida, sem ampliar silenciosamente o #397. O drawer completo permanece em `PROD-UX-08`, com seu handoff próprio de retomada. Não corrigir CSS ou mudar goldens para encobrir a limitação; não afirmar homologação integral da superfície. Antes de frente ampla de design, permanece obrigatória a leitura de DESIGN_TOOLING.md pelo handoff corrente.

### Situação revisável e próxima ação

O PR permanece aberto/Draft, implementação e provas publicadas na branch, **parcial para integração**. Nenhuma migration foi aplicada em banco compartilhado e não houve merge ou publicação/escrita em Production. Histórico compartilhado e Preview autenticado continuam sem homologação desta rodada; as provas remotas citadas são dos runners descartáveis. Resolver dependências em frente autorizada, consultar histórico/schema compartilhado por leitura e revisar a sequência do handoff antes de qualquer integração/SQL/publicação especificamente autorizada. Conferir os checks vivos do candidato exato; não transportar esta contagem histórica a um novo HEAD.
