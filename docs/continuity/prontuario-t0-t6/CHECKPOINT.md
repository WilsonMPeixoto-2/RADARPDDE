# Checkpoint único de continuidade operacional — RADAR T0–T6

## 25/11/2026 — PR #564 publicado; T5 em implementação

O proprietário autorizou “Pode fazer merge em produção”. A publicação do [PR #564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564) foi concluída em `7523782bdc572a631783deeae2ea59be048dd725`, árvore `b83aae17ceef279207cb0da9de7ac0e467be3cdd`, idêntica à candidata `4a14d63389da7f85e2594c1a3f3156238566a78a`. Merge às 03h28 de 25/11 (Brasília). Não houve migration, alteração de dados institucionais ou ampliação das flags nessa entrega.

| Prova concluída | Evidência |
|---|---|
| 20/20 workflows da candidata e 10/10 do push aprovados | Registro de publicação no [PR #564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564). |
| Supabase descartável do merge | [45560905549](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905549): 1.524 unitários, 8 integrações, 906 pgTAP em 46 arquivos e 42 jornadas autenticadas. |
| Publicação e manifesto do SHA exato | [Vercel](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/32j4myukPALqLX5iCnZZ5sF5bDTH), [RADAR](https://radarpdde-fix.vercel.app), quatro flags T0–T4 ativas. |
| Verificação pós-publicação | [Smoke 45560905562](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905562): 54 recursos, RLS anônimo e CORS; [navegador público 45560905653](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905653): 6/6; [visual 45560905732](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905732): 18/18. |

**Instrução de continuidade:** “Siga para próxima etapa”, na mesma conversa de 25/11. Sem permalink disponível; este registro não inventa URL da conversa. Implementar T5 na branch `feat/t5-historico-granular-20261125`, base `7523782b`, com as oito ações do plano e retificação manual opcional. Três frentes paralelas cobrem banco, telas e testes; o integrador mantém o cliente, o helper, a ativação e a continuidade. Migration criada pelo CLI: `20261125064516_t5_granular_history_inventory.sql` (69ª somente no pacote candidato).

[Escopo, transições, provas e limites da candidata T5](../../evidence/2026-11-25-t5-historico-granular.md).

**Próximo ato:** concluir a integração, rodar os gates existentes com Supabase/Auth/RLS descartável, examinar capturas reais da T5 e entregar candidata revisável com resultados e limites. A flag `RADAR_T5_GRANULAR_HISTORY_RELEASE_ENABLED` permanece OFF. Aplicação institucional e publicação da T5 dependem de autorização própria; não refazer o #562/#564 nem tratar o helper preparatório já publicado como a interface T5 concluída.

## Arquivo histórico — estado anterior à publicação do PR #564

As seções seguintes são fotografias datadas. A candidata pós-T4 mencionada como “em revisão” abaixo foi publicada conforme a seção vigente acima.

## 25/11/2026 — PR #562 publicado; missão posterior em execução

**Produção verificada:** [PR #562](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/562), candidato `0b082bf49470d7bc549ed4865544203971168728` com 21/21 workflows aprovados, merge `6dd6a9f9f8147deb39c5813baad0b5521427b8bd`. O proprietário aprovou as telas e a guarda cifrada do backup no padrão anterior do GitHub. Essas autorizações foram executadas e não precisam ser solicitadas novamente para registrar a publicação já feita.

| Marco concluído | Evidência |
|---|---|
| Backup recuperável antes da migration | [Run 45546167245](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45546167245), artefato cifrado `14991439022`, cinco schemas, leitura consistente, restauração isolada e decifragem autenticada verificadas. SHA-256 do ZIP: `be3364661a2ebdd671c6b5b2217f79faf97107de8bfe27c1ee292c7d7604a5a3`. |
| Dry-run e migration 68 | [Run 45547732347](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45547732347), artefato `14992920550`; única migration `20261124000100_extend_bonification_correction.sql`, 67 → 68, pós-verificação aprovada. |
| Publicação do frontend | [Vercel](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/7PcaBDGHirK6CtfnYQNCPKVvprUi), SHA `6dd6a9f9`, endereço [RADAR](https://radarpdde-fix.vercel.app). |
| Verificação posterior | [Smoke 45547911796](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45547911796) aprovado no SHA exato do merge; catálogo Supabase confirmou 68 migrations. Os três alertas patrimoniais preexistentes permaneceram iguais, sem correção automática. |

**Próxima entrega autorizada:** executar a missão de evolução integral do prompt recebido em 25/11, na branch `feat/evolucao-integral-pos-t4-20261125`, baseada em `6dd6a9f9`. A instrução posterior do proprietário foi “é para executar este prompt”, superando o preâmbulo do anexo que pedia apenas reescrita. A missão cobre revisão integrada T0–T4, experiência visual, engenharia, inteligência operacional, estudo documental futuro, propostas priorizadas, preparação T5 e Guia do Controlador. Não há permalink da conversa no repositório; este registro preserva a proveniência sem inventar uma URL.

**Limites da nova candidata:** banco institucional somente leitura; dados reais detalhados fora do repositório público; protótipo documental sintético sem conexão ao Microsoft Graph, OCR ou IA externos; nenhum merge ou deploy automático. A publicação anterior não estende sua autorização à nova entrega.

**Estado da preparação T5:** helper puro reforçado e contraprovas, sem novo consumidor de produção, RPC, migration ou interface de mutação. As oito obrigações de UI continuam `planned`. [Evidências desta candidata](../../evidence/2026-11-25-evolucao-pos-t4.md) e [estudo documental](../../research/2026-11-25-inteligencia-operacional-documental.md) distinguem implementação, hipótese e trabalho futuro.

**Candidata em revisão:** [PR #564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564), com código funcional em `16b9a5baf6c25b0da872c060a691898cabed4c63`. Readiness local aprovado (1.524 unitários e 8 de integração); regressão visual e Supabase readiness aprovados na CI. Capturas reais de contato em desktop/celular e histórico foram baixadas e inspecionadas; origem, limites e resultados adicionais constam na evidência da candidata e no PR. A falha do contrato estático de nomenclatura foi isolada e sua correção deve receber resultado próprio da CI. Não confundir PR em revisão com nova publicação, nem ausência de Chromium local com aprovação navegada. Não repetir backup, migration 68 ou homologação do PR #562 para validar alterações de guia e leitura de histórico.

## Arquivo histórico — estados anteriores à publicação de #562

Os cortes abaixo conservam suas evidências e ressalvas próprias. Para o estado vigente, usar a seção de 25/11 acima.

## 24/11/2026 — encerramento da implementação e publicação T4

A evidência de publicação do **PR #561** é a referência ativa de R2 em registry.json. A reexecução do comparador terminou com sucesso: 11/11 workflows aprovados no HEAD `0d3625ea`. A revisão integrada aprovada pelo proprietário em seguida corrige linguagem, hierarquia, contexto e bonificação em uma única candidata. T5 mantém suas obrigações futuras de histórico granular. Não confundir candidata com nova publicação.

**T0–T4: implementação publicada. T5: próxima frente, ainda não iniciada.** O escopo T4 foi entregue pelos PRs #538, #546 (incorporou #558), #560 e #561, com migrations 64–67 já registradas no Supabase institucional e as quatro flags de correção habilitadas em Production. A correção visual final foi publicada em `cc09e6e85efbd69c357c09a99df01f9af7273762`, deployment `dpl_jpae66LEivn8xhmqzhGTdTdQNZnN`, READY. [Evidência da publicação](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/561#issuecomment-7140925977). Não reaplicar migrations nem repetir T4. A próxima execução segue o escopo aprovado de T5 e o mapa de obrigações D020; T6 acompanha cada entrega. Ressalvas de validação histórica, comparação operacional e aceite de campo estão no checkpoint; publicação não significa aprovação humana de todos os viewports.

- Release funcional T4: #546 (HEAD `c6ac5b96`, 24/24 workflows, integração #558), merge `2771ac0d`, migrations 66/67 confirmadas, flags ativas. [Evidência](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/546#issuecomment-7132018891). A correção de comunicação visual #560 foi publicada em `3ef5f3f3`, 17/17 workflows.
- Correção de densidade #561: HEAD `0d3625ea7fd3d317ece9a4cb80aec32ad32e142a`, merge `cc09e6e8` com zero diferenças de arquivos. [Deployment READY](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/jpae66LEivn8xhmqzhGTdTdQNZnN); manifesto público confirmou SHA, ambiente Production e quatro flags true. Smoke HTTP 200 das rotas e CSS atualizado. Capturas reais e evidências: [E2E](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45440332803), artifact 14945615686, 390/716/980px claro/escuro. Nenhuma escrita institucional.
- Ressalva explícita do integrador: 10/11 workflows integralmente aprovados antes do merge; candidata do teste sustentado aprovada (400 rodadas, 1.107 gestos, seis sessões), baseline histórica falhou por timeout de 900000ms; comparador inconclusivo e reexecução em curso na decisão de integração. [Justificativa proporcional e rastreabilidade](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/561#issuecomment-7140870642). Não converter esse resultado em 11/11 sem confirmar nova execução. O comparador não estabelece orçamento de custo. Não houve validação em aparelho físico do #561 nem verificação independente do backup institucional anterior às migrations 66/67; alguns selects ainda abreviam texto em largura intermediária. Não declarar perfeição visual ou aceite de campo integral. A publicação foi autorizada pelo proprietário; implementação T4 encerrada, sem nova subdivisão. Obrigações transversais de T5/T6 seguem abertas quando aplicáveis.
- Próximo ato: iniciar Release 3 / T5, consultando escopo original, contratos e decisão de impacto antes da implementação; não repetir os PRs integrados. As seções abaixo são fotografias históricas preservadas.

## 24/11/2026 — correção de densidade em modo PC

PR #560 publicado em `3ef5f3f3308b657e69fbe9ae6af8669914024655`, [evidência remota](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/560#issuecomment-7133797951). A captura posterior do proprietário mostrou uma regressão visual em celular com modo PC: cartões demasiado altos e rótulos deslocados. Corrigir somente CSS e testes, mantendo regras e textos T4. Reprodução em Chromium com artefato Playwright confirmou a causa e redução de altura em largura intermediária. O novo teste de densidade e capturas anexadas deve passar antes de nova publicação. T5 permanece fora do escopo.

## 24/11/2026 — T4 publicada; revisão visual de campo em execução

PR #546 integrado em `2771ac0d`; migrations 66/67 confirmadas no histórico institucional. Deployment [`dpl_BRv9bntwggsvXt1K8dTFR5YhDo1n`](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/BRv9bntwggsvXt1K8dTFR5YhDo1n) READY, quatro flags true no manifesto. [Evidência de publicação](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/546#issuecomment-7132018891). Backup anterior e aceite visual de campo não comprovados naquela sessão. Não reaplicar migrations. O proprietário identificou, nas capturas móveis de produção, rótulos ambíguos, exclusão escondida, consolidação recortada e situações patrimoniais sem contexto. Branch `fix/prontuario-comunicacao-visual-20261124` corrige a apresentação em lote único, sem mudança de dados/RPC, com testes de layout, alcance e estados. CI e inspeção visual da candidata ainda necessários. T5 não iniciada.

Os estados Draft e flags OFF das seções seguintes são fotografias históricas.

## Execução complementar em 24/11/2026 — PR #546

- A baseline `f1fecf29` comprovou as duas jornadas autenticadas de exclusão e cancelamento; o job Preview condicional não executou. A captura da prévia real no artefato [Supabase readiness](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45267244475) mostrou os comandos de decisão fora da área inicial. O código candidato foi corrigido em [`584bd788`](https://github.com/WilsonMPeixoto-2/RADARPDDE/commit/584bd788d5940203d25a5fc1907ebe5a161cd3ab), com região de rolagem própria e comandos fora dela.
- As contraprovas de perfil somente leitura e alteração entre sessões foram versionadas em `14d8d3ca` e `f65b4b2f`. O runbook de recuperação foi aprofundado em `cf7ec1f7`. O lote acrescenta navegação por teclado e capturas autenticadas em desktop/claro, desktop/escuro e celular/escuro, bem como a reconciliação do modelo, catálogo e matriz funcional.
- **Não considerar os testes do novo HEAD aprovados antes da execução; não declarar aceite visual humano por automação.** A candidata segue em Draft, flag de Production desativada, migration 66 não aplicada institucionalmente; `clear_item_history` continua fora do PR.

## Atualização verificada em 22–23/11/2026 — T4 inicial, D021, Ondas 1–3, hotfix #555 e candidato T4 `delete_context` (#546)

- **PR #538 (T4 inicial):** integrado na `main` em `ca73311377f95f32e994f98dfa5bdb4b0f56b7cc` após 21/21 workflows; migration 65 `20261121000200_correct_fiscal_bonification` aplicada no Supabase institucional e flag T4 ativada em Production (`operationalCorrectionRelease=true`, `bonificationCorrectionRelease=true`).
- **PR #540 (`T0T6-D021` — Linguagem do Controlador):** integrado na `main` em `4b698b4121c9f5f356622b468fb44b71a5832915` e publicado em Production. Botão **“Corrigir consolidação”**, janela **“Corrigir consolidação da bonificação”**, campo **“Nova avaliação — Notas Fiscais”**, aviso de alcance e reconsolidação **“Consolidar bonificação”** ativos sem alterações de SQL/RPC; aceite visual humano em campo permanece registrado separadamente em `T0T6-I021-02`.
- **Ondas 1–3 de UX/a11y e higiene integradas na `main`:** [PR #541](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/541) (`b3bf0935`), [PR #542](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/542) (`ab8d2339`), [PR #543](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/543) (`c3be209f`), [PR #544](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/544) (`5c69a3ca`, higiene pós-Ondas 1–3 e sincronização documental T4/D021), [PR #545](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/545) (`4c209b11`, refinamentos pós-auditoria) e [PR #555](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/555) (`a695f07f`, hotfix do deadlock de `Escape` no diálogo de reatribuição de Gestão de Equipe, publicado em Production no deployment `dpl_6BPKPiomHXx1MawqeC2ywtkKCqfU`).
- **PR #546 (Draft — T4 `delete_context`, candidato em preparação):** branch `feat/t4-delete-context-contract-20261123` com migration candidata `supabase/migrations/20261123000100_t4_delete_program_context.sql` e flag `RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED=false` por padrão. Incorporou o hardening SQL/cliente/UX/a11y/D021 do [PR #556](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/556) em `ae4ca9bed646acdd7fc89705b090b70414c7a2d7` (`T0T6-C025`). Permanece em Draft até fechamento integral do CI no SHA final, aceite visual/operacional humano em ambiente local e decisão expressa de release (nenhuma migration institucional aplicada ou flag ativada em Production).
- **Integridade de Production (diagnóstico somente-leitura):** o alerta recorrente `totalIssues=3` em `public.production_integrity_check()` é pré-existente desde 18/11/2026 (`permanent_invoices_without_linked_asset`: 3 notas de 2026-10 em `04.31.001` e `04.31.024` gravadas via auditoria assistida/SQL sem `linked_asset_id`). Nenhuma mutação automática foi aplicada sobre registros reais.
- **Entrega delimitada:** em Production, a T4 publicada cobre somente correção/limpeza da avaliação de **Notas Fiscais** de bonificação consolidada; `delete_context` está em candidatura no PR #546 (Draft), `clear_item_history` está em candidatura no PR #558 (Draft), com migration 67 e flag própria OFF e T5 permanece futura. Não refazer a migration 65.


## Candidata consolidada T4 — 24/11/2026

[PR #558](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/558) reúne limpeza de histórico, D021, proteção de concorrência e revisão visual, sobre #546. Verificar o SHA atual e os gates antes de qualquer integração/publicação. Branch local Antigravity não recuperada no remoto; não confundir esta candidata com o worktree local. Supabase institucional e Production não são alterados por este lote. T5 não iniciada.

## Estado em 21/11/2026

**T0–T3 estão tecnicamente concluídos e publicados.** A Release 1 foi integrada pelo [PR #535](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/535) e o [PR #537](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/537) fechou as três correções de acompanhamento. A homologação operacional com usuários reais continua disponível para conferir permissões e jornadas em uso.

| Evidência | Resultado confirmado |
|---|---|
| GitHub | Merge do #537 em [`9d0f50b0`](https://github.com/WilsonMPeixoto-2/RADARPDDE/commit/9d0f50b0f42b44017591bce472581717c8a09bc0). Os 20 workflows do [commit testado do PR](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/537/checks) passaram. |
| Vercel Production | [Deploy `dpl_9ZWdbvmkc2YeBUdpamLkU3rU37NN`](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/9ZWdbvmkc2YeBUdpamLkU3rU37NN) em `READY` para o mesmo commit do merge. |
| Supabase institucional | A migration [`20261121000100_operational_correction_followup`](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/9d0f50b0f42b44017591bce472581717c8a09bc0/supabase/migrations/20261121000100_operational_correction_followup.sql) consta no histórico do projeto `scnryinorqeucbfkioxo`. Consulta de leitura ao catálogo confirmou as RPCs de prévia e confirmação, a chamada de histórico, a tabela de registros administrativos e o bloqueio concorrente. |
| Fluxos atingidos | [789 asserções SQL, quatro cenários de concorrência/idempotência e dez jornadas autenticadas T2/T3](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44944665686). [21 ciclos funcionais](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44944665571) em banco descartável. |

**Release 2 · T4 (referência histórica de 21/11).** A candidata `release/prontuario-t4-20261121` foi integrada no [PR #538](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/538) e publicada em 22/11; **não retomar aquela branch como trabalho pendente**. O primeiro caso permite corrigir a avaliação de Notas Fiscais de um programa consolidado, preservando NF, análises e Pendência fiscal e exigindo reconsolidação do mesmo programa. Limpeza de histórico e exclusão de contexto pertencem à sequência T4; T5 tem release própria. Ver seção de atualização acima.

As regras e obrigações herdadas estão no [registro](registry.json) e no [mapa de impacto](decision-impact.json). O aceite de campo continua identificado separadamente das provas em banco descartável.

## Arquivo da Release 1 — fotografias anteriores ao encerramento

**Data de fotografia anterior:** 20/11/2026. **Escopo:** Release 1, T0–T3. **Classe:** estado temporário, revalidar GitHub em cada retomada.
**Branch executora:** `release/prontuario-t0-t3-20261120` — [PR #535](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/535) (Draft).  
**Code source:** [Antigravity PR #534](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/534) @ `054d3bc4e0eaf7a7d1db8a5c0bfc2c9947d0f4fe`; a branch colaboradora pode receber novos commits.  
**Última candidata com testes funcionais completos verificados:** `b4f2853c3a5f6161b09788fb5e43fdfad1f2a840` (test:readiness, Auth/RLS/Supabase local, gate de configuração).  
**Commit de governança posterior já versionado:** `025a97f95a6db560b00ef473802e07a88cb3fb77` (documentação). **HEAD remoto após esta reconciliação deve ser conferido em tempo real; não presumir que estas duas fotografias são o HEAD.**  
**Baseline de Produção verificada em 20/11:** `main@69954645b597e39623ef2f24fe5f336ed37989f2`; nenhuma publicação T0–T3 ou migration institucional autorizada.

## Retomada funcional de 20/11 na Release 1

A release contém o código de `054d3bc4` do #534. Em `480a9864`, o [Supabase real isolado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44816424078) aprovou 773 asserções em 43 arquivos, três provas de concorrência e seis jornadas autenticadas. O [desktop](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44816424221) teve 263 aprovações, 75 casos ignorados e uma divergência de 21.977 pixels em `prontuario.png`.

O lote seguinte aplica D001/D013 à leitura do Prontuário no tema escuro e à posição do título Notas Fiscais em 1440 × 900. Aplica D011/D019 à Busca e ao arquivo Excel SME baixado antes e depois da exclusão. A jornada do Controlador e da Assistente também confronta a prévia de exclusão com um contato registrado por outra sessão entre a prévia e a confirmação. Consultar o resultado por SHA no [PR #535](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/535).

O filtro por arquivo passa a cobrir as entradas efetivas `app.js` e `styles.css`. A consulta rejeita opções e estados inválidos. As sete obrigações futuras de UI da T5 continuam planejadas, inclusive a retificação patrimonial e o vínculo com o SIGMA. O aceite da T1 permanece a cargo do proprietário.

**Complemento colaborador Antigravity (`T0T6-C024`, PR #534 sobre `128fa3c7`):** entrega ajuste visual T1 (12 competências em linha única a 1280px, `Notas Fiscais` acima da dobra em 1440×900, leitura completa de `Despesa a identificar`, `color-scheme`/`forced-colors`), `operationalCorrectionRelease` auditável em `radar-build-manifest.json` + simetria fail-closed em `config.js`, jornada Docker G3 de convivência de cliente legado (`T0T6-I018-02`), limpeza dos blocos históricos nos roteadores e [Runbook Gate G4](../../runbooks/PRONTUARIO_RELEASE_1_G4_PUBLICACAO.md). Sem publicação ou migration institucional executada.

## Estado verificável da propagação histórica — 20/11/2026

**Último SHA com readiness confirmado:** `da38a38f8ec512927dbd78d67875cbf7670cb321`. O GitHub Actions executou `check:continuity` (incluindo mapa de impactos) e aprovou **1.465 testes unitários + 8 integrações**, sem falhas nessas suítes. O conjunto completo de checks desse SHA ainda tinha jobs adicionais em andamento na consulta; não declarar CI integralmente aprovada nem T1 homologada.

**Decisão de produto D020:** [política geral de propagação](../../reference/DECISION_IMPACT_POLICY.md), [protocolo entre chats](DECISION_IMPACT_PROTOCOL.md), [mapa versionado de impactos](decision-impact.json), com 20 decisões (19 aprovadas, 1 substituída) e 52 obrigações rastreadas. O mapa registra **24 obrigações planejadas para futuras fases**, além de obrigações candidatas, preservadas e à espera de gate. O registro `trackedObligationIds` protege a perda isolada de obrigações e força sua substituição explícita. Isso não prova cobertura de todos os chats/ADRs anteriores; as lacunas do `lineage.json` continuam abertas.

**Exemplo patrimonial que deve ser relido ao iniciar T5:** D002 / D011 / D020 e R038: correção autorizada de `Inventariada` na futura UI deve conservar as garantias de domínio, permissão e independência da Bonificação; T3 concluir a exclusão causal da NF não esgota o trabalho T5. A política é geral do RADAR; não incorporar automaticamente outras frentes na Release 1.

**Próximo passo de governança:** na retomada, conferir HEAD atual, resultado do CI para o commit de documentação posterior a `da38a38f` e mudanças novas em outras conversas/branches. Depois, continuar a homologação visual T1 e a matriz de consumidores T2/T3 sem reabrir decisões já aceitas.

## Estado no corte histórico de 20/11

| Marco | Estado rigoroso | Evidência/observação |
|---|---|---|
| T0 — contrato, fixtures e mapa de operações | Candidato preparado; ampliar matriz por consumidores conforme necessidade | Plano integrado, `tests/fixtures/prontuario-correction-cases.json` e PR #535 |
| T1 — composição visual | Código candidato, **não homologado visualmente** | Golden `prontuario.png` anterior à T1; diferença aprox. 2% contra tolerância 1%; exige aceite do proprietário, não relaxar tolerância |
| T2 — correção de análise e Pendências | UI/RPC candidatas verificadas em Docker/Auth/RLS e E2E específicos; **não publicadas** | `correct_analysis`, `clear_analysis`, `delete_pendency`; revalidar consumidores |
| T3 — exclusão de NF | Backend e jornadas autenticadas incluindo reabertura de Qualidade; **não publicada** | `delete_invoice`, preservar NF irmã/bonificação, Auth, RLS, F5 e segunda sessão |
| T4/T5 | Não implementados integralmente; registrar propostas sem executar aqui | Contrato e plano; próximos releases próprias |
| T6 transversal / G4 | Backend e CI não bastam para publicar | Conferir UI, compatibilidade cliente, backup/restore, migration 63, aprovação, deploy, smoke e recuperação |

**Prova do SHA de código `b4f2853c`:** `npm run test:readiness`: **1.439 unitários e 8 integrações aprovados**. `supabase-local` aprovado com pgTAP, sete identidades Auth e E2E real T2/T3. O check **Desktop homologado** falhou no golden T1 (pendência de decisão humana); nos demais checks desse SHA foram 15 aprovados, 2 skipped e 1 falha visual. **Não declarar CI integralmente verde**.

## Registro e rastreabilidade

- Decisões vigentes, alteradas ou rejeitadas: [registry.json](registry.json), chaves `T0T6-Dxxx`.
- Contribuições por agente e estado da triagem: [registry.json](registry.json), chaves `T0T6-Cxxx`. Ex.: `T0T6-C005` (fingerprint com note, rejeitado), `T0T6-C007` (Gemini G-02 integrado), `T0T6-C014` (normalização de atraso, pendente de decisão).
- Contratos vinculantes: [contrato](../../reference/PRONTUARIO_CORRECAO_CONTRATO.md) · [plano integral](../../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md) · [matriz](../../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md) · [plano da release](../../releases/2026-11-20-prontuario-t0-t3-release-1.md).
- Handoff longo de 15/11 conserva provas por SHA, **não é a fila atual**.

## Triagem diferencial das branches — 20/11/2026

[Relatório de conciliação](AUDITORIA_COLABORADORES_20261120.md). Antigravity #534 permanece em `054d3bc4` (0 commits novos à frente desta release); PR #532 e Manus T1 já têm arquivos de teste/código com blob idêntico à candidata. Os quatro documentos do PR #515 foram analisados e classificados como C019–C022: plano mestre com recomendações duplicadas, conexões visuais parcialmente presentes, diagnóstico INAPTA ainda hipotético e mapa UX geral em frente independente. O lote acrescenta **somente testes de domínio e rastreabilidade**, sem alterar a regra operacional nem dados reais.

**Último CI antes da triagem:** PR #535@6ed30db5, 15 checks success, 2 skipped e 1 falha visual de `prontuario.png`. Após este registro, conferir novo SHA e nova execução antes de afirmar GREEN.

## Atlas genealógico — corte documental de 20/11

[LINEAGE.md](LINEAGE.md) / [lineage.json](lineage.json): 25 fontes, 67 requisitos, 4 lacunas documentadas. **Não alegar cobertura completa:** 10 fontes em revisão parcial, 10 apenas indexadas e seis pranchas conceituais ainda não versionadas em arquivo. O verificador passará a comparar hashes Git de fontes locais e IDs de decisões/implementações; retomar pela linha de requisito, não por plano de outra branch. O primeiro código Argon `src/application/operational-correction-service.js` não existe na candidata; usar cliente atual e migration SQL.

## Persistência transversal de decisões — 20/11/2026

A diretriz do proprietário **D020** exige coerência de decisões também entre chats, não apenas branches. [Protocolo](DECISION_IMPACT_PROTOCOL.md) e [mapa](decision-impact.json) registram obrigações de cada decisão aprovada em várias fases e superfícies. O primeiro corte mantém **obrigações futuras de Inventário T5 e reconsolidação T4 em aberto**, mesmo com códigos T2/T3 candidatos. Consultar `npm run decisions:impact -- --query --phase=T5 --surface=ui` antes de novo layout; `check:continuity` passa também a verificar esse mapa. A auditoria integral de todas as conversas e a cobertura semântica de cada obrigação **não estão concluídas**.

## Próximo ato verificável — sem reiniciar auditoria integral

1. Conferir **HEAD e CI atuais do PR #535**, `main` e `#534`; verificar se surgiram novos commits nas branches colaboradoras desde a última triagem.
2. Reabrir **apenas** a divergência visual T1 contra o golden anterior; comparar aparência com a direção de arte já aprovada e obter aceite humano, inclusive posição das NFs em 1440×900, tema escuro, teclado e outros viewports. **Não atualizar golden automaticamente.**
3. Fechar a matriz de consumidores afetados T2/T3 (Prontuário, Pendências, Passivo, Busca, Inventário, Carteira/Dashboard, Excel) com F5 e segunda sessão; registrar cenários não cobertos em vez de repetir SQL já comprovado.
4. Concluir plano de compatibilidade do cliente anterior, backup/restauração seletiva e sequência backend→frontend da Release 1. Sem migration, dados reais ou deploy institucional sem autorização expressa.
5. Atualizar este checkpoint e o registro **com SHA remoto real**, status de contribuições e próximo passo **antes de concluir o chat**, sem depender de memória.

**Não executar nesta frente:** atualização de pacotes, análise documental Drive ou registros reais de prestação de contas. **Não chamar o Supabase Docker de mock**; é banco real de testes isolado.
