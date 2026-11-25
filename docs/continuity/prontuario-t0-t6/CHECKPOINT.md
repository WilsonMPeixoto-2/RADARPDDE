# Checkpoint único de continuidade operacional — RADAR T0–T6

## 25/11/2026 — reparo focal do Inventário: provas e continuidade

**Direção do proprietário:** “Ok, continue, mas vamos tentar não ampliar demais os escopo definidos e continuar de forma objetiva”. Nesta execução: orientação patrimonial no Dashboard do Inventário, respeito ao filtro existente e abertura do bem correto. Não iniciar outras funcionalidades, reformulação visual, documentos, desempenho ou encerramento integral de T6.

**Trabalho recuperado, contribuição C029:** foi localizado outro checkout com a branch local `fix/t6-orientacao-inventario-20261125`, HEAD `31c27155eb2169032a36cb050082ae080965053d`, e reparo ainda não commitado. Foram aproveitados somente `app.js`, `src/integration/operational-guidance.js` e seus unitários/E2E; os registros anteriores daquele checkout não sobrepõem D023. SHA-256 do diff desses quatro arquivos na recuperação: `8bbbf4d7e3f8a5ec68eda8a5826400d9cb777eeb16723a4b50cb123d9eb3589b`. Não existe SHA próprio da alteração original; a branch remota nova preserva o código recuperado e o complemento revisado.

**Entrega focal:** [PR #569](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/569), branch `fix/orientacao-inventario-20261125`, baseada em `ac57c4a084453faeb55225a7aa94b5e36e1250ec`. Código funcional testado em `d31b3f9ca1f4e2a94f4b3fe2e67ce7e38be76f33`. O reparo liga o Dashboard à orientação, prepara seu universo e aceita a capacidade patrimonial. O complemento reutiliza `filteredBens` para limitar as sugestões ao filtro já escolhido; não replica regras de status. O recorte vazio continua vazio, é limpo pelos demais Dashboards e não limita o Prontuário. Textos, função de navegação, capacidades fiscais, RLS, comandos, CSS e migrations permanecem com seus contratos existentes.

**Prova local:** os dois testes recuperados falharam na base publicada e passaram com o patch; o caso adicional de dois bens da mesma escola em estados diferentes revelou que o filtro “Aguardando” também mostrava o bem não encaminhado. Após o complemento, **29/29 focais e 1.604/1.604 unitários passaram**, sem falhas ou testes ignorados. Revisão independente de produto e unitários aprovada.

**Prova autenticada e visual concluída:** [Supabase readiness 45688491640](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45688491640) passou; a etapa de orientação aprovou **3/3 testes em 24,1 s**, sem falhas, testes ignorados, intermitência ou repetição. O teste Inventário passou em 5,701 s: login real `inventory`, filtro concluído/aguardando, reload, alvo e foco exatos e snapshots dos bens antes/depois idênticos. As quatro capturas foram abertas pela raiz e por revisão independente: card e ação legíveis, escola/bem corretos, Registro de Capital ativo e nenhuma sobreposição ou overflow da página. [Imagens, geometrias e proveniência preservadas no repositório](../../evidence/2026-11-25-inventario-orientacao/README.md), pois os anexos originais do CI expiram em um dia.

**Limites da prova:** Supabase descartável e dados sintéticos; Chromium em 1440×900 e 390×844. Dashboard capturado após rolar até a sugestão. No celular, a tabela conserva a rolagem horizontal existente e a identidade do bem fica visível; a ação de escrita na coluna à direita não foi executada. Isso não é homologação institucional de escrita, dispositivo físico ou WebKit. Não houve fixture, workflow ou benchmark manual adicional.

**Próximo ato e fechamento:** consultar a seção final do [PR #569](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/569) para o SHA efetivamente integrado e a conferência do manifesto publicado. Após esse fechamento, não repetir este reparo ou reabrir o T5 por causa de um SHA documental posterior. As outras frentes abaixo mantêm seu próprio escopo; esta entrega não encerra T6 integralmente. Integrado, testado, inspecionado e publicado continuam estados distintos.

**Fechamento anterior confirmado:** D023 foi integrada no [PR #567](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/567) e publicada em `ac57c4a0`, com cinco flags T0–T5 ativas. A suíte desktop que estava em execução concluiu com sucesso às 14h38min55s: 296 testes aprovados e 98 ignorados por escopo. Os cinco workflows da candidata documental terminaram com sucesso; [pré-production finalizada às 14h39](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45664682852).

**Sinal separado, sem ampliação desta tarefa:** o monitor de integridade de Production [45678308704](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45678308704), sobre `ac57c4a0`, terminou com falha às 15h45. A causa não foi examinada nesta correção; não atribuir ao reparo nem tratar como prova de alteração dos dados. Preservar o sinal para triagem própria.

## 25/11/2026 — T5 ativo em produção; registro permanente D023

### Baseline funcional e prova de publicação

Conferência somente leitura realizada em 25/11, cerca de 13h50 de Brasília. O [PR #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565) foi integrado às 11h21 em `31c27155eb2169032a36cb050082ae080965053d`. A candidata final foi `85e482b05227bd2268fe1007e44bade853eddc61`; o PR conserva o fechamento dos testes e a seção posterior de publicação.

| Camada | Resultado e fonte |
|---|---|
| GitHub | `main` conferida no merge #565; status Vercel concluído. [Commit](https://github.com/WilsonMPeixoto-2/RADARPDDE/commit/31c27155eb2169032a36cb050082ae080965053d). |
| Vercel | Deployment `dpl_9bzP49Kxyn5yYq6gAK8csEEanhjY`, concluído às 11h35. [Deployment](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/9bzP49Kxyn5yYq6gAK8csEEanhjY). |
| Configuração publicada | [Manifesto oficial](https://radarpdde-fix.vercel.app/radar-build-manifest.json): HTTP 200, SHA do merge, `production`, `supabase-production`, `operationalCorrectionRelease`, `bonificationCorrectionRelease`, `contextDeletionRelease`, `itemHistoryRelease` e `granularHistoryRelease` iguais a `true`. |
| Banco institucional | Consulta direta confirmou `ACTIVE_HEALTHY` e 69 migrations, incluindo `20261125064516_t5_granular_history_inventory`. A seção de publicação do PR também registra a conferência anterior das 13 funções e cinco gatilhos; esses corpos não foram novamente comparados nesta análise. |
| Homologação do candidato | 25 workflows concluídos. No conjunto T2–T5, 26 casos passaram diretamente e um T3 passou na repetição; preservar a classificação de intermitência. [Readiness](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45583215832). |
| Monitor produtivo | [45654478619](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45654478619), concluído às 13h30: SHA correto, 54 recursos, bloqueio anônimo e CORS verificados. |

**Ativação T5 concluída.** Oito operações liberadas por configuração: corrigir/excluir envio, reanálise, contato e registro patrimonial, respeitando capacidade e vínculo. A publicação não equivale a executar as oito escritas sobre escolas reais: as jornadas de escrita foram homologadas no descartável e a conferência produtiva foi de leitura. Não repetir migration, backup ou liberação já concluídos apenas para atualizar o registro.

### Decisão nova e alteração documental em curso

O proprietário reafirmou os dois pilares da [D023](D023_CONTINUIDADE_REMOTA_E_USABILIDADE.md): registrar sistematicamente no GitHub o trabalho material e sua continuidade, e desenvolver a experiência humana em paralelo à solução técnica em todas as fases. A transcrição fiel e o limite de proveniência estão na decisão; não há permalink da conversa disponível. D020/D021 são preservadas e complementadas.

A branch documental `docs/continuidade-usabilidade-20261125` incorpora D023, fonte S027, requisitos R072/R073 e obrigações permanentes por fase; reforça política, catálogo, método, gate e modelo de PR; reconcilia os roteadores com a publicação real. Não altera aplicação, CSS, banco, permissões ou configuração. Verificadores, revisão e SHA de gravação remota pertencem ao PR dessa alteração; não declarar a integração documental antes do resultado GitHub. A release funcional R3 permanece associada ao PR #565.

### Pendências e próximo ato

1. **Inventário:** [achado P2 do #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565#discussion_r4696399446). O perfil tem Dashboard próprio, mas não recebe as sugestões novas em `31c27155`. A correção foi relatada em outro ambiente sem commit remoto integrado comprovado nesta conferência. Localizar e aproveitar esse trabalho antes de refazê-lo; provar login, sugestão, abertura do bem correto e composição desktop/celular. O E2E D022 do release autentica Controlador e não comprova esse perfil.
2. **T6:** vincular as obrigações à evidência final e manter explícitas as lacunas de cobertura, compatibilidade e aceite. Não marcar todas como verificadas por causa do merge ou dos testes agregados.
3. **D022 documental:** o piloto com três PDFs reais de 2025 está concluído como experiência de leitura; importação e análise dentro da interface continuam evolução distinta. Fontes identificáveis permanecem privadas.
4. **D022 desempenho:** CPU de projeções otimizada; jornada completa com resultados mistos. A atualização durante atividade contínua não foi medida. [Evidências e limites](../../evidence/2026-11-25-t5-inteligencia-documentos-desempenho.md).
5. **Fila histórica:** PRs e issues de manutenção, investigação e propostas precisam de triagem por SHA; sua existência não demonstra defeito atual nem autoriza merge integral de branches antigas.

O próximo agente começa por este bloco, pelas decisões supervenientes e pelo estado remoto real. Relato de trabalho local, código publicado, teste aprovado, inspeção do agente, aceite do proprietário e produção habilitada permanecem estados diferentes. Atualizações exclusivamente documentais posteriores não reabrem a release nem exigem um ciclo de commits para registrar seu próprio SHA.

## Arquivo histórico — PR #564 publicado; PR #565 em implementação e homologação

Fotografia anterior ao merge e à ativação T5 acima. As referências a flag OFF, migration candidata e próximos atos de homologação conservam a história; não são a fila atual.

O proprietário autorizou “Pode fazer merge em produção”. A publicação do [PR #564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564) foi concluída em `7523782bdc572a631783deeae2ea59be048dd725`, árvore `b83aae17ceef279207cb0da9de7ac0e467be3cdd`, idêntica à candidata `4a14d63389da7f85e2594c1a3f3156238566a78a`. Merge às 03h28 de 25/11 (Brasília). Não houve migration, alteração de dados institucionais ou ampliação das flags nessa entrega.

| Prova concluída | Evidência |
|---|---|
| 20/20 workflows da candidata e 10/10 do push aprovados | Registro de publicação no [PR #564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564). |
| Supabase descartável do merge | [45560905549](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905549): 1.524 unitários, 8 integrações, 906 pgTAP em 46 arquivos e 42 jornadas autenticadas. |
| Publicação e manifesto do SHA exato | [Vercel](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/32j4myukPALqLX5iCnZZ5sF5bDTH), [RADAR](https://radarpdde-fix.vercel.app), quatro flags T0–T4 ativas. |
| Verificação pós-publicação | [Smoke 45560905562](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905562): 54 recursos, RLS anônimo e CORS; [navegador público 45560905653](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905653): 6/6; [visual 45560905732](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905732): 18/18. |

**Instrução de continuidade:** “Siga para próxima etapa”, na mesma conversa de 25/11. Sem permalink disponível; este registro não inventa URL da conversa. Implementar T5 na branch `feat/t5-historico-granular-20261125`, base `7523782b`, com as oito ações do plano e retificação manual opcional. Três frentes paralelas cobrem banco, telas e testes; o integrador mantém o cliente, o helper, a ativação e a continuidade. Migration criada pelo CLI: `20261125064516_t5_granular_history_inventory.sql` (69ª somente no pacote candidato).

[Escopo, transições, provas e limites da candidata T5](../../evidence/2026-11-25-t5-historico-granular.md).

**Candidata remota:** [PR #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565), primeiro commit `1e9991b2f533aa1838919ac92048c59c9939b9d5`. A prontidão local aprovou 1.550 unitários e 8 integrações. O primeiro CI aplicou as 69 migrations, mas encontrou uma lista pós-aplicação ainda com 68: corrigida em `47af14745e382dd26e54737e42ab30aef1bb336e`, com guarda de origem e testes. Esse commit também trata reabertura independente remanescente, correção textual de erros legados e contexto de bens compartilhados. Conferir os resultados atuais do PR antes de declarar homologação integral.

**Novo direcionamento do proprietário:** [D022](D022_INTELIGENCIA_DOCUMENTOS_DESEMPENHO.md). Acrescentar orientação gerencial e próximas ações às telas existentes; medir/otimizar projeções; executar piloto de leitura com pequena amostra real. A medição de CPU e sua contraprova estão em [artefato reproduzível](../../evidence/2026-11-25-t5-performance/operational-projection-cpu.json). O recorte real usa três PDFs e consulta cadastral por leitura; fontes e resultados identificáveis não entram no repositório. O estudo anterior exclusivamente sintético não encerra essa nova instrução.

**Prontidão local do incremento D022:** 1.590 testes unitários e 8 integrações aprovados, sem falhas ou skips. Inclui a orientação gerencial e o piloto documental /2; o benchmark específico preservou os resultados em oito cenários. No commit anterior `411efd87`, o Supabase descartável aprovou 69 migrations, 1.007 testes pgTAP e as provas de concorrência. As novas jornadas/capturas D022 ainda precisam de resultado remoto próprio.

**Retorno remoto de `c601c8eed2c43a722848e3d519e5f2a3d6baa3ed`:** o [readiness 45569519323](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45569519323) passou 21 jornadas T2–T5, incluindo T4 longo e cinco das seis T5. As seis falhas restantes identificaram acesso à competência antes da inicialização/depois do logout (cinco casos) e falta de reabertura dos detalhes após Cancelar na jornada ambígua. Ambos receberam correção focal. A inspeção das imagens nativas encontrou excesso de altura da faixa gerencial da escola e corte do aviso de ambiguidade no celular, corrigidos para nova captura. D022 foi pulado após a falha T2–T5; a etapa de leitura passa a ter diagnóstico independente. Conferir os resultados posteriores, sem promover esse run a aprovado.

**Experiência documental entregue:** relatório privado dos três PDFs reais, leitura por página, proveniência, confronto cadastral somente leitura e limites. Os dados identificáveis permanecem fora do repositório. **Ensaio operacional:** [45569519301](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45569519301), seis sessões e 1.107/1.107 escritas em ambas as variantes; diagnóstico de custo com nove avisos, inclusive baseline histórica sem comparabilidade de freshness. Não atribuir a redução de bytes a ganho causal nem converter o benchmark de CPU em latência de Production. [Medições e limites](../../evidence/2026-11-25-t5-inteligencia-documentos-desempenho.md).

**Prontidão local após os reparos:** 1.594 testes unitários e oito integrações, sem falhas ou skips, no comando integral de readiness. Inclui a preservação dos IDs tipados na nova fila.

**Retorno remoto de `b9bd42b4e53cf0b4ef7444b5ea096ceaa026dd72`:** o [readiness 45573070961](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45573070961) aprovou 1.007 pgTAP, concorrência, 17/17 Auth/RLS, 4/4 login/histórico protegido e **27/27 jornadas T2–T5**, incluindo as seis T5. D022 aprovou a navegação/foco e a ausência de escrita; a composição inicial ainda falhou no contexto autenticado com o painel Qualidade vazio. A suíte visual aprovou 16/18, com duas referências deliberadamente desatualizadas e inspecionadas em pixels nativos. O lote seguinte sincroniza essas duas referências, compacta Qualidade carregando/vazio sem esconder ações nem registros, e exige título fiscal e Sim/Não/N/A inteiros na viewport de 1440 × 900. As capturas móveis T5 corrigidas estão legíveis.

**Estabilidade e desempenho desse corte:** [ciclos 45573070963](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45573070963), 21/21 e três operações com deslocamento medido de **0 px**, tolerância 4 px preservada. Um cenário distinto de erro ao salvar oscilou 47 px na primeira tentativa em duas suítes amplas e passou na repetição; a instrumentação agora separa carga inicial de estilos/fontes e operação, sem afrouxar a tolerância. O [ensaio sustentado 45573070537](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45573070537) aprovou 1.107/1.107 escritas em cada variante e emitiu sete avisos de custo; o resultado misto não comprova aceleração global. Fontes e limites estão nas evidências de T5/D022.

**Prontidão do lote de composição:** `npm run test:readiness` completo aprovado com **1.599 unitários e 8 integrações**, zero falhas ou skips. As cinco contraprovas adicionais cobrem apresentação do Qualidade, registros, erro, capacidade e troca de contexto.

**Último corte inspecionado, `7d8945577fd71dc2a0af3921484aecb72e8f9e08`:** [visual desktop 45577125375](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125375) 18/18; [D022 no readiness 45577125292](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125292) 2/2; os seis T5 aprovados; [ciclos 45577125770](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45577125770) 21/21. A composição autenticada mostrou orientação com 34 px, Qualidade com 42 px e os três controles fiscais inteiros até 886,296875 px, sem rolagem em 1440 × 900. O cenário instrumentado isolou os 47 px antes da referência; a linha permaneceu visualmente estável e o deslocamento durante salvar/erro foi zero. Fontes/CSS não foram identificados como causa.

**Reparo final de Qualidade:** o mesmo corte revelou uma colisão entre o ID do texto informativo novo e o input de descrição. Ela esvaziava o valor gravado e impedia a identificação seguinte. O painel agora usa `quality-provisional-summary-description`; o input canônico e as autoridades permanecem. As duas novas contraprovas com marcação real falharam na versão defeituosa e passaram no reparo. `npm run test:readiness` integral aprovou **1.601 unitários e 8 integrações**, sem falhas/skips. Os E2Es que detectaram a regressão não foram afrouxados. As capturas passam a aguardar assets/transições e usam a navegação móvel real; Dashboard e orientação móvel precisam da nova imagem.

**Produto conferido em `bd90e64201dec6218a339153a84a890c4d6dab2d`:** o [readiness 45580199861](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45580199861) aprovou 17/17 Auth/RLS, 4/4 login/histórico protegido e **27/27 T2–T5 sem retry**, incluindo identificação do Qualidade e seis T5. A [pré-production 45580199896](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45580199896) aprovou a edição/releitura do Qualidade, o contrato de IDs únicos e 296 E2Es (98 skips de escopo, nenhum flaky listado); [visual 45580200178](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45580200178), 18/18. O bloqueio restante do readiness foi o guard novo de capturas: comparava o pathname absoluto de uma folha declarada com href relativo, válido sob a rota profunda servida pelo RADAR. Ambos os D022 expiraram nesse guard, antes das asserções. O lote seguinte corrige só a identificação da folha no E2E, preserva a exigência de carregamento e limita essa espera a 15 s com diagnóstico. Não muda produto, schema ou limite das jornadas. As novas medições completas, variáveis entre runs, estão na evidência D022.

**Próximo ato:** consultar o resultado do HEAD atual e o registro de homologação no [PR #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565) e examinar as capturas finais de Dashboard/celular. O PR registra o SHA e os runs concluídos após este checkpoint; não repetir suites já aprovadas no mesmo código. As [evidências T5](../../evidence/2026-11-25-t5-historico-granular.md) distinguem os runs anteriores reprovados do reparo. A flag `RADAR_T5_GRANULAR_HISTORY_RELEASE_ENABLED` permanece OFF. Aplicação institucional e publicação da T5 dependem de autorização própria; não refazer o #562/#564 nem tratar o helper preparatório já publicado como a interface T5 concluída.

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

## Próximo ato registrado em 20/11 — histórico

1. Conferir **HEAD e CI atuais do PR #535**, `main` e `#534`; verificar se surgiram novos commits nas branches colaboradoras desde a última triagem.
2. Reabrir **apenas** a divergência visual T1 contra o golden anterior; comparar aparência com a direção de arte já aprovada e obter aceite humano, inclusive posição das NFs em 1440×900, tema escuro, teclado e outros viewports. **Não atualizar golden automaticamente.**
3. Fechar a matriz de consumidores afetados T2/T3 (Prontuário, Pendências, Passivo, Busca, Inventário, Carteira/Dashboard, Excel) com F5 e segunda sessão; registrar cenários não cobertos em vez de repetir SQL já comprovado.
4. Concluir plano de compatibilidade do cliente anterior, backup/restauração seletiva e sequência backend→frontend da Release 1. Sem migration, dados reais ou deploy institucional sem autorização expressa.
5. Atualizar este checkpoint e o registro **com SHA remoto real**, status de contribuições e próximo passo **antes de concluir o chat**, sem depender de memória.

**Não executar nesta frente:** atualização de pacotes, análise documental Drive ou registros reais de prestação de contas. **Não chamar o Supabase Docker de mock**; é banco real de testes isolado.
