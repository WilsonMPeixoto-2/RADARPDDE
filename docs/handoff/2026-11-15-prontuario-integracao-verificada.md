# RADAR PDDE — checkpoint executável da integração T0–T3 (15/11/2026)

**Leitura obrigatória temporária para qualquer agente que continuar esta frente.**
**Branch oficial de integração e recuperação.** `fix/prontuario-integrado-validado-20261115@20409c12`. A candidata e suas verificações estão no [PR #534](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/534). O [#532](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/532) reúne a revisão independente em `2235821c`. A seção [verificação de 20/11](#verificação-de-2011-e-prova-complementar-do-qualidade) e os resultados por SHA do #534 orientam a retomada.
**Baseline conservada:** `main` em `69954645` em 19/11/2026 (avançada exclusivamente pelos PRs de manutenção de ferramentas #524, #526, #531 e #533), sem alteração, merge ou deploy pela frente T0–T6.
**Plano de destino:** [Prontuário: design, correção e exclusão integrados](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).
**Matriz obrigatória de transição por jornada:** [Regras antigas → novos comandos → substituição → testes/interfaces/documentação](../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md). Diferenciar **código candidato ainda desligado** de **defeito no produto vigente**; a retirada de regras legadas ocorre no lote correto e exige testes de compatibilidade, não simplesmente remoção de testes antigos. Documento complementar ao plano original, sem segunda branch de execução.

**Ambiente de homologação interna definido (15/11):** seguir a [seção 8 da matriz](../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md): preparar e manter **uma cópia local navegável da branch, frontend real e Supabase isolado por Docker**, com autenticação e dados sintéticos. O proprietário participa da navegação e valida os marcos visuais/operacionais de T1–T5 antes de cada fechamento; automatizar SQL/Auth/RLS/Playwright com o workflow GitHub existente como complemento. Preparar o ambiente no primeiro fluxo T2 pronto, não esperar T6. T2/T3 já têm UI e comandos candidatos ligados sob flag, porém cortes antigos, cobertura de dependências e homologação de ponta a ponta continuam pendentes; T4/T5 requerem implementação. Regras antigas permanecem até o corte correspondente na branch candidata; expectativa de teste é adaptada no mesmo lote. **Nenhuma publicação está prevista/autorizada**. Esta decisão não executa workflows nem altera aplicações ou bancos.
**Novo princípio de decisão do proprietário (15/11):** **desbloqueio orientado ao objetivo**, documentado no [contrato](../reference/PRONTUARIO_CORRECAO_CONTRATO.md) e na [matriz, §7.1](../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md). Preferir correção direta com recomposição segura; caso necessário, permitir a correção e oferecer ação posterior; se depender de passo anterior, orientar e levar à ação sem perder contexto; bloquear só por impedimento real. Exemplo T4: após editar bonificação consolidada, indicar **“Alterações pendentes de consolidação”** e oferecer **“Consolidar alterações”**, preservando versões e coerência de nova exportação. É **decisão de destino ainda não implementada**, não prova de funcionalidade disponível. Validar navegando na cópia local com Docker; não ampliar o escopo para publicação.
**Regras aprovadas:** [contrato](../reference/PRONTUARIO_CORRECAO_CONTRATO.md) e [estudo de flexibilização](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).

## Estado vigente — reconciliação de 16–17/11/2026 (LER PRIMEIRO)

**Este é o ponto único de retomada da frente.** O título e as seções posteriores documentam cortes anteriores, **não** substituem esta seção. Verificar os SHAs reais ao abrir uma nova sessão; a `main` foi conferida em `58ca0c0a` em 17/11/2026 (PRs #524 `74f92c08` e #526 `58ca0c0a` sobre `4011a2b8`), a integração oficial em `20409c12` (código `a8e47045`) e a sincronização com o 7º reparo em `audit/antigravity-argon-prontuario-20261115`. A documentação desta seção registra a fotografia do código existente, não a liberação de uma capacidade em Produção.

### Fotografia de 16–17/11 na branch oficial de integração

| Lote | Entregas concretas já integradas | Estado rigoroso |
|---|---|---|
| T0 | Especificação, fixtures, controles de integridade e decisão de UX | Preparado, conferir casos usados nos testes |
| T1 | Cabeçalho contextual do Prontuário e projeções de NF atual em Pendências/Busca/consumidores | Implementado, **sem aceite visual final** |
| T2 | `correct_analysis`, `clear_analysis`, `delete_pendency`; cliente RPC com `operationKey` e payload congelados; diálogo de confirmação e orientação; conexões em NF, Assessoria (incluindo interceptação no `<select>` em `service-advisory-pendency.js`, reconciliação do botão `Editar análise` em `prontuario-conditional-reconciler.js` e `aria-describedby`) e gavetas, primeira análise direta; seleção explícita de Pendências, mesmo após marcar a última | **Candidato parcialmente integrado, ainda sem homologação Auth/RLS e funcional completa** |
| T3 | `delete_invoice` com prévia de impacto, dependentes por ID, reconciliação de agregados de Assessoria/Inventário, proteção de versão das NFs irmãs, lock de tentativas; preservar bonificação e patrimônio compartilhado quando devidos | **Candidato de exclusão fiscal conectado, sem homologação real; tratamento de provisória Qualidade e corte completo das rotas antigas ainda a verificar** |
| T4 | Regras de edição da bonificação consolidada, `clear_item_history` e `delete_context` definidas | Implementação de domínio/banco/UI pendente |
| T5 | Helper puro `pendency-correction.js` e cenários históricos | Persistência transacional, UI e autorização ainda pendentes |
| T6 | Matriz de testes, UX e publicação definida | Homologação global e aprovação não realizadas |

**Seis correções do Antigravity incorporadas seletivamente em `20409c12` (origem `audit/antigravity-argon-prontuario-20261115@1cb118fd`) + 7º reparo em 17/11/2026:** (1–6) preservar seleção de Pendências; renderizar a fila original após confirmar; primeira análise sem modal de correção desnecessário; exibir número de NF atualizado; ordenar **Editar lançamento** antes de **Excluir**; adicionar versões de NFs irmãs e locks de tentativas; e (7) interceptar retificação no `<select>` de Consulta à Assessoria (`service-advisory-pendency.js`), reconciliar incrementalmente o botão `Editar análise` (`prontuario-conditional-reconciler.js`), adicionar botão `Editar análise` com `aria-describedby` em `service-advisory-row` (`app.js`) e aplicar `overscroll-behavior: contain`, foco inicial seguro em `Cancelar` e `input:not(:disabled)` no ciclo de `Tab` (`modern-web-guidance`). **Não repetir merge ou cherry-pick dos 6 reparos já integrados.**

**Relatório de verificação e rastreabilidade:** [auditoria de branches, código, provas e documentos de 16/11](../audits/2026-11-16-reconciliacao-branches-codigo-documentacao-t0-t6.md) e [relatório atualizado de 17/11](../audits/2026-11-15-antigravity-argon-prontuario/RELATORIO.md). A busca de GitHub Actions pela branch de integração retornou **zero execuções**; não atribuir CI de outra branch ao HEAD integrado.

### Evidência da candidata em `9c66e8e3`

- **CI Docker real completo (`Supabase readiness`, run [`44669524893`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44669524893) em `audit/antigravity-argon-prontuario-20261115@9c66e8e3`, PR #534 Draft, 20/11/2026):** os 3 jobs (`readiness`, `migration-smoke` e `supabase-local`) passaram 100%, comprovando:
  - **63 migrations + 77/77 asserções pgTAP** em `operational-correction.test.sql` (incluindo correção `array_agg(distinct value order by value)` em `selectedPendencyIds`) + `schema.test.sql` + demais 41 suítes pgTAP (`All tests successful. Result: PASS`);
  - **Concorrência e idempotência determinísticas sob barreira em PostgreSQL 17** (`scripts/test-operational-correction-concurrency-local.mjs`): mesma `operationKey` simultânea -> 1 commit + 1 replay idempotente + 1 exclusão atômica incluindo bem `Inventariada`; duas `operationKey` distintas disputando o mesmo `planDigest` -> 1 vencedor + 1 rejeição limpa (`STALE_PLAN`/`PLAN_BLOCKED: NO_EFFECT`); reutilização de `operationKey` com payload alterado -> `IDEMPOTENCY_CONFLICT`;
  - **`check:generated` + `typecheck:database` aprovados** (SHA-256 exato `e9ebed11...` de `src/types/database.types.ts`);
  - **Auth/RLS real com 7 identidades + Edge Function + 17/17 + 4/4 suítes locais com flag OFF** (preservando o comportamento padrão);
  - **4/4 testes Playwright autenticados T2/T3 com `RADAR_OPERATIONAL_CORRECTION_PREVIEW=true`** (`tests/e2e/supabase-operational-correction-local.spec.js`, 17,5 s): T2 documental (`correct_analysis` + `clear_analysis`), T2 Consulta à Assessoria + transição real A-01 + `Corrigir análise` pela gaveta, T3 `delete_invoice` com Pendência preservando NF vizinha e bonificação consolidada (`apta`, ADR-055) — todos verificados após `F5` real, no banco PostgreSQL e em **segunda sessão autenticada (`federal_assistant`)** — mais contraprova de perfil `sme` sem botões de ação e com `preview_operational_change` rejeitada pelo PostgreSQL com `AUTHORIZATION_DENIED`. Evidência arquivada em `docs/audits/2026-11-15-antigravity-argon-prontuario/evidencias/ci-supabase-local-t2t3-44669524893.log`.
- Na árvore local (`npm run test:readiness`): **1.436/1.436 unitários e 8/8 integrações** (ESLint `10.15.0`, dependency-cruiser `18.8.0`, Lighthouse `13.6.0`, Supabase CLI `3.2.0`, 0 vulnerabilidades `npm audit`) e **46/46 testes Chromium E2E** nas 10 suítes locais (**20/20** em `operational-correction-dialog.spec.js`).
- **O que ainda NÃO está encerrado:** **aceite visual e operacional humano pelo proprietário** navegando nas telas T1–T3 (incluindo decisão de atualizar o snapshot golden pré-T1 `prontuario.png` após aprovação visual), ensaio E2E complementar de retorno de saída provisória PDDE Qualidade na UI + conferência final de consumidores/rotas legadas, incorporação seletiva na branch oficial `fix/prontuario-integrado-validado-20261115`, e implementação de T4–T6.
- A feature flag `RADAR_OPERATIONAL_CORRECTION_PREVIEW` permanece **OFF por padrão** em `config.runtime.js` e o piloto exige **frontend e API Supabase de teste em localhost**; nenhuma alteração em `main`, Vercel Production ou Supabase institucional (`scnryinorqeucbfkioxo`) foi realizada.

### Verificação de 20/11 e prova complementar do Qualidade

Na candidata `5a41653b`, o [Supabase readiness](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44670962311) aprovou as quatro jornadas autenticadas, as três disputas/reutilizações de intenção e a suíte SQL (773 verificações em 43 arquivos). O [desktop](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44670962203) registrou 263 aprovações, 73 casos pulados e uma diferença visual reproduzida nas duas tentativas. Em 1440 × 900, a faixa de programa, competência, estados e consolidação deixa o grupo Notas Fiscais abaixo da primeira tela. O aceite visual é do proprietário.

O diálogo de exclusão exibia `identified → open` para a movimentação que deu origem à NF. A correção traduz esse efeito do plano do servidor para o estado **Programa a identificar** mostrado no painel. O novo teste do #534 registra uma saída na escola sintética `ESC-QUALITY`, identifica a NF, confere a prévia, exclui, confere o painel antes e depois de F5 e identifica novamente pela Assistente em outra sessão. Verifica no banco o mesmo provisório, uma única nova NF e uma nova chave de identificação. O código do piloto conserva a confirmação e a transação existentes. O resultado desse novo ensaio deve ser aferido no job `supabase-local` do commit candidato.

Em [`7c676056`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44778521967), a prévia de Assessoria mostrava duas linhas idênticas quando a análise da NF e o resumo do programa mudavam juntos. A correção agrupa a transição e identifica ambos os efeitos. O teste autenticado confere os dois nomes.

### Reconciliação das entradas e dos consumidores

| Jornada | Autoridade na candidata | Cobertura e critério de aceite |
|---|---|---|
| T0/T1 · identificação corrente da NF | `InvoiceService.save` preserva identidade. O Prontuário e a fila leem a identificação vigente. O retrato da abertura pertence à Pendência. | O ensaio T1/T2 do #534 cria a Pendência, edita a NF, recarrega, procura o número novo na fila como Assistente, lê o retrato anterior e exclui só a Pendência. As projeções locais de Capital e Assessoria têm a cobertura distinta de `invoice-retification-projections.spec.js`. |
| T1 · contexto visual | Grade em `app.js`, botão no cabeçalho do programa e comparação em `global-visual-polish.spec.js`. | A comparação continua reprovando a suíte quando diverge. O teste também percorre contato, capital, registros internos e histórico após a captura. A gravação da nova referência depende do aceite do proprietário. |
| T2 · correção e exclusão | Análise documental via `evaluation-retification-ui.js`. NF via `beginInvoiceDocumentAnalysisEdit`. Assessoria via `service-advisory-pendency.js`. Gavetas do Prontuário e da fila chamam `excluirPendenciaOperacional`. A confirmação do piloto usa `preview_operational_change` e `apply_operational_change`. | Distinguir primeira análise, abertura genuína de Incorreto, correção e exclusão. A nova prova da fila verifica filtro, permanência da NF, resultado individual e bonificação depois de F5. |
| T3 · exclusão fiscal, patrimônio e Qualidade | `removerNotaRegistrada` abre a prévia integrada no piloto. Com a flag desligada vale o serviço publicado. A transação determina o destino da NF, bens, Pendências e provisório. | Ensaio anterior mostrou preservação de NF vizinha e bonificação. pgTAP cobre bens exclusivos/compartilhados. O novo ensaio do Qualidade testa recarga e nova identificação em outra sessão. |
| T4 · bonificação e contexto | O cliente do piloto e o planejador SQL implementam quatro ações de T2/T3. O planejador reserva `clear_item_history` e `delete_context`. | Implementar retificação da marca após consolidação, histórico, estado “Alterações pendentes de consolidação”, reconsolidação e coerência da próxima exportação. |
| T5 · eventos e patrimônio | `src/domain/pendency-correction.js` calcula os efeitos em memória. Os comandos de tentativa, reanálise, contato e patrimônio ainda estão reservados no planejador. | Conectar prévia, gravação, interface e releitura para cada ação, conservando os eventos independentes. |
| T6 · homologação global | As projeções têm autoridades diferentes, inclusive planilha SME, Pendências, Passivo, Busca, Inventário e Timeline. | Registrar o alcance por superfície e o SHA, verificar perfis, exportações, retorno de navegação, recuperação e visual. Publicação tem autorização própria. |

### Trabalho seguinte, sem reabrir regra já aprovada

1. Consultar os resultados do SHA do #534. Registrar separadamente o ensaio de retorno do Qualidade e o da NF retificada na fila.
2. Validar com o proprietário as telas T1–T3 no ambiente local. Conferir a faixa do programa, as consequências da correção/exclusão, os registros que continuam visíveis e o retorno à fila filtrada.
3. Fechar a conferência dos consumidores e dos escritores legados para o corte aprovado. Integrar seletivamente na branch oficial depois da homologação. Em seguida, executar T4 e T5 na ordem do plano e reunir as provas de T6.

**Branches paralelas inspecionadas (16–17/11):** `main@58ca0c0a` (PRs #524 `74f92c08` e #526 `58ca0c0a` já mesclados nesta branch); `chore/supabase-cli3-2-remote-safety-20261117@7414b21e` (issue #530) e `chore/deps-browser-validation-blocked-20261117@baf158ab` (issue #528, bloqueada por `picomatch@4.0.7`) mantidas separadas; PR #515 (layout Pendências), PR #522 Draft (`37de3033`, parágrafos CSS de Pendências) e PR #523 Draft (`ed2054a3`, incidente de autenticação) permanecem separados; `audit/gemini-revisao-critica-e-sugestoes-20261115@d55747b9` e Manus (`a87e9e0e`) continuam fontes comparativas/históricas, não pontos de execução.

**Invariante de produto:** correção/exclusão deve permitir atingir o objetivo com efeitos transacionais coerentes e avisos simples; nenhuma justificativa obrigatória, inventário/NF independente preservado, não inventar envio ou reanálise, não impedir por histórico apenas. Se dependência legítima exigir etapa anterior, fornecer botão e orientação, não um impasse sem saída.

**Todo texto abaixo descreve marcos históricos de seus próprios commits.** Em especial, menções a 61/73 pgTAP, `52ff0871`, `a869b2df`, somente diálogo piloto ou exclusão ainda não conectada **não são o estado vigente**.

---

## Reconciliação Antigravity pós-e26058bc — 16/11/2026

**Origem examinada:** `audit/antigravity-argon-prontuario-20261115@1cb118fd`, branch à frente de `fix/prontuario-integrado-validado-20261115@e26058bc` por 5 commits, sem divergência prévia. O GitHub confirmou por comparação os patches exatos. As **cinco alterações funcionais/arquivo de teste** foram incorporadas seletivamente à branch de integração, **sem merge integral** e sem importar instruções históricas paralelas. O relatório do Antigravity permanece consultável na sua branch de auditoria.

**Correções aproveitadas, todas relativas ao comportamento já aprovado:**
1. Preservar na tela as caixas de Pendências candidatas após selecionar a última; a seleção continua visível e revisável.
2. Após uma operação iniciada na fila de Pendências, atualizar a própria fila, não substituir sua tela pelo Prontuário; novo teste Playwright de regressão.
3. Manter a **primeira análise** de NF/Assessoria direta e simples; reservar o diálogo de correção para retificação de um resultado já registrado.
4. Mostrar na confirmação de exclusão de Pendência a identificação **atual** da NF, sem alterar seu histórico original; ordenar **Editar lançamento** antes de **Excluir**.
5. Capturar versões das NFs irmãs durante o cálculo agregado de análise fiscal; aplicar `FOR UPDATE` aos envios da Pendência envolvidos na transação. Um **novo teste pgTAP** garante a presença das versões das NFs irmãs na prévia, elevando o plano preparado a **74 asserções**.

**Evidência e limite da prova:** o Antigravity relata `npm run test:readiness` aprovado (**1.416 unitários, 8 de integração**) e **18/18 Playwright do diálogo + 2/2 de retificação**. Os logs versionados na auditoria registram uma execução de **19/19** de um conjunto anterior, além do `test:readiness`; portanto distinguir relatório de execução mais recente de prova reproduzida. Na presente integração foi executado **teste isolado do diálogo com DOM/RPC simulados**, comprovando permanência de duas opções selecionadas, gravação única e atualização da fila correta. **Ainda não executados na integração:** suíte completa, 74 pgTAP com PostgreSQL real, concorrência real, Auth/RLS local, segunda sessão, persistência após F5 e aceite de UI. Não confundir a inspeção visual que o agente relata ter iniciado em `127.0.0.1:4179` com homologação concluída.

**Próximo gate:** teste local Docker/Supabase completo e inspeção visual do proprietário. Se falhar, corrigir sobre esta branch e repetir, nunca atualizar Production como método de teste. A flag piloto continua condicionada a frontend e Supabase em localhost; nenhuma alteração em `main`, Vercel ou Supabase institucional está autorizada.

---

## Incremento T2/T3 — código candidato conectado na branch isolada (15/11, após a decisão de flexibilização)

**Situação:** implementação candidata de T2/T3 avançada, **NÃO HOMOLOGADA**. Não afirmar que os fluxos passaram em Supabase local ou Playwright autenticado. A chave `RADAR_OPERATIONAL_CORRECTION_PREVIEW` segue desligada por padrão; `main`, Production, Supabase institucional e Preview permanecem intocados. Verificar HEAD real no GitHub antes de continuar.

**Entregas reais na branch de integração:**
- `app.js`: o Prontuário conecta correção de análise individual de NF e Consulta Assessoria, exclusão de NF inclusive com histórico/pendência/bem, exclusão de Pendência e alternativa **Corrigir análise** a partir da gaveta; não permite apagar diretamente sem prévia. O modo `Incorreto` continua abrindo o fluxo genuíno de Pendência, não uma reanálise fictícia. Conserva a rota legada quando a chave de ensaio está desligada.
- `src/integration/task-9-pendencias-page.js`: acrescentados botões **Corrigir análise** e **Excluir pendência** na gaveta operacional, inclusive resolução de registros históricos carregados fora da fatia do Prontuário.
- `src/integration/operational-correction-dialog.js`: um diálogo para T2/T3 com nome, prévia de exclusões/alterações, preservação de bonificação e bem compartilhado, confirmação clara e caminhos alternativos para dependência obrigatória ou abertura de Pendência. A confirmação fecha o modal **sem reativar foco em um editor** antes do refresh. Se o commit for confirmado mas a tela não sincronizar, mostra instrução **Atualizar página** e jamais refaz a gravação.
- `supabase/migrations/20261114000100_operational_correction_contract.sql`: seleção vazia/incompleta de Pendências não pode transformar Incorreto em Correto; recalcula, na mesma transação, projeções da Assessoria e Inventário na exclusão de NF, Assessoria ao excluir Pendência ativa e ao corrigir/limpar análise individual. Vizinhos considerados na leitura de versões e bloqueio da operação. Bem Inventariado exclusivo já era suportado por comando autorizado; não o reinventar.
- `src/types/database.types.ts`: RPCs `preview_operational_change`/`apply_operational_change` descritas para a candidata; **regenerar e conferir os tipos pela CLI contra a migration local aplicada** antes do gate.
- `supabase/tests/database/operational-correction.test.sql`: **73 asserções pgTAP escritas, NÃO EXECUTADAS nesta etapa**, incluindo cenário de Pendência selecionada vazia, exclusão de NF patrimonial, exclusão de NF serviço, Assessoria e bonificação independente. Testes Playwright de diálogo ampliados para correção, exclusão, fluxo orientado, recarga e autorização de ação do usuário; **não foram executados em navegador real neste incremento**.

**Validação limitada efetivamente realizada:** checagem sintática por `new Function(...)` dos módulos JS alterados e testes JS; conferência estrutural da contagem pgTAP `73` e dos delimitadores SQL; execução isolada do cliente de RPC provando `operationKey`/payload idempotentes; execução isolada do diálogo com DOM mínimo provando prévia, uma chamada `apply`, fechamento da camada antes de `refreshSchool`. **Essas verificações não substituem pgTAP, TypeScript, CI, Auth/RLS e Playwright com backend local.**

**Bloqueio ambiental desta sessão:** a criação de Sandbox Vercel falhou por limite de uso de Snapshots Storage no plano Hobby (HTTP 402). Não foram iniciados Docker/PostgreSQL/Playwright autenticado, e não existe autorização para publicar em Vercel. Não criar um ambiente compartilhado ou ligar ao banco institucional como atalho.

**Ativação da candidata no localhost:** `scripts/generate-runtime-config.mjs` agora aceita `RADAR_OPERATIONAL_CORRECTION_PREVIEW=true` **somente** com `RADAR_DATA_MODE=supabase-preview`, `RADAR_ENVIRONMENT=test` (ou local/development) e `RADAR_SUPABASE_URL=http://127.0.0.1:54321` (ou localhost), com repositório habilitado e chave `ANON_KEY` pública do Docker. `config.js` ainda exige que a **página seja aberta em localhost/127.0.0.1**. O termo `supabase-preview` aqui designa **o modo de dados do Supabase de teste local**, não uma publicação Vercel Preview. O gerador rejeita ativação em URL remota, modo de Produção e ambiente Preview. Os testes de configuração foram ampliados e executados isoladamente contra as funções puras, mas ainda aguardam `npm run test:readiness` na cópia completa. Manter `config.runtime.js` gerado de teste fora de commits e restaurar a configuração padrão após o ensaio; nenhum segredo de serviço no frontend.

**Próximo gate obrigatório (sem reabrir decisões aprovadas):** na cópia local da branch, executar `npm ci`, `npm run supabase:start`, `npm run supabase:reset`, `npm run supabase:test:db`, autenticação com usuários sintéticos e Playwright contra RPC real; verificar rollback/concorrência entre **duas operações distintas**, escrita REST antiga, exclusão com filho novo entre preview/apply, autorização negada, duas sessões, F5, cache e todas as superfícies relacionadas. Rodar `npm run test:readiness` e testes de UI, ajustar testes antigos para o contrato novo no lote correspondente e submeter T2/T3 à navegação e aceite do proprietário. **Se algum teste falhar, corrigir código e repetir antes de declarar T2/T3 encerrados.** T4/T5 permanecem em desenvolvimento posterior.

---

## Última conferência da branch Antigravity — 15/11/2026

**Verificação final com GitHub e sandbox remoto:** `audit/antigravity-argon-prontuario-20261115@52ff0871` **não teve novos commits** após a incorporação seletiva à integração `a869b2df`. O `main@4011a2b8` permaneceu intacto. A divergência entre branches é intencional: preserve ambas, não efetue merge integral. Não existem arquivos de código adicionais a importar no corte verificado.

**Teste independente do código REMOTO integrado `a869b2df`:** `npm run test:readiness` com **1.414 unitários e 8 integrações** (exit 0); Chromium Playwright nas sete suítes de retificação, projeções NF, Pendências, diálogo e SME: **40 aprovados, 1 ignorado e 0 falhas** (exit 0, 2 workers). Trata-se de UI com RPC controlada, não de teste autenticado da 63ª migration em banco institucional.

**Análise detalhada, SHAs, exclusões seletivas e comandos:** [reconciliação final Antigravity](../audits/2026-11-15-antigravity-reconciliacao-final.md). **Este checkpoint continua sendo o único ponto de retomada funcional**, sem apagar registros anteriores.

## Reconciliação independente — projeções de NF e Pendências (15/11/2026)

**Origem auditada e preservada:** `audit/antigravity-argon-prontuario-20261115@52ff0871`, partindo de `466810ff`. O Antigravity relatou inspeção **somente de leitura** no Supabase institucional (62 migrations instaladas, 43 Pendências com identificação histórica diferente da NF atual); esses totais são **evidência do relatório do Antigravity, não reconferência independente direta no banco**. A migration de correção T2/T3 **não foi instalada** no Supabase institucional.

**Código incorporado seletivamente:** projeção dos dados atuais da NF vinculada na fila, cartões e detalhes de Pendências, Passivo de Competências, Busca Global (incluindo texto *visível* do resultado) e Exportação Excel, além de orientações e botões alternativos no editor de NF e no diálogo de análise. O vínculo é exclusivamente por `registeredInvoiceId`, não por número, posição ou valor de nota. Atualização dos dados da NF e de bem relacionado permanece governada pelo `InvoiceService` existente.

**Correção de integridade durante a integração:** o candidato originalmente modificava `pendency.item` em memória **após** a conclusão de `invoice:save` e também na rotina de renderização. Como não havia comando de persistência para `pendencies` nessa etapa, o código criava divergência entre estado local e banco e poderia sobrescrever dados históricos. Retirei essa mutação; as telas derivam a apresentação atual das NFs vinculadas, preservando `pendency.item` original e `documentSnapshot` nos dados. A normalização não substitui mais números incidentais dentro de textos livres. A Busca Global passa a **exibir** o número e a descrição atuais no título do resultado, além de indexá-los.

**Limite funcional importante:** não houve UPDATE transacional de `public.pendencies.payload.item` no banco de Produção. O item histórico persistido pode continuar com a identificação original; as telas que recebem NF e Pendência vinculadas projetam os valores atuais. Uma eventual sincronização material de dados históricos exigirá comando e migração próprios, governança da auditoria e validação transacional; não presumir que este patch já a realizou.

**Testes reproduzidos:** TDD RED/GREEN para não mutar `pendency.item`, preservar números incidentais e exibir a NF correta na Busca Global. `npm run test:readiness`: **1.414 unitários, 8 de integração**, demais gates verdes. Playwright Chromium: **40 aprovados, 1 ignorado** (2 workers; editor de NF, projeções, busca, Pendências, correção de análise, retificação legada e Gestão SME). Esses testes usam fixtures e dados simulados; **não comprovam persistência/autenticação com Supabase real nem autorizam ativação de T2/T3 em Produção**.

**Próximo passo:** concluir T2/T3 com transação autenticada e reload em banco isolado, e validar atualização entre duas sessões antes de liberar funcionalidades. Não repetir as auditorias do Argon e do Manus sem alteração material de código.

## Incremento de usabilidade — ação direta “Limpar análise” (15/11/2026)

**Origem preservada:** `audit/antigravity-argon-prontuario-20261115@466810ff`, alterando somente `src/integration/operational-correction-dialog.js`, `tests/e2e/operational-correction-dialog.spec.js` e plano de continuidade da auditoria.

**Incorporado ao diálogo canônico:** botão dedicado **Limpar análise** na barra de ações; o primeiro clique apenas prepara uma prévia `clear_analysis` (sem `apply_operational_change`); a gravação somente é enviada após **Confirmar correção**. Quando já está `Não analisado`, a limpeza direta fica indisponível. Os textos visíveis passam a `O que vai mudar ao confirmar`, `Calculando o que vai mudar…` e `Nenhuma outra análise será alterada`. A API pública `RadarOperationalCorrectionDialog.open`, o tratamento de `AMBIGUOUS_CONSEQUENCE`, o retry idempotente e a flag desligada foram preservados.

**Testes reproduzidos independentemente do Antigravity:** Playwright Chromium **24/24** (2 workers, novo caso do botão + demais diálogos, retificação legada, layout, contraste e acesso SME); `npm run test:readiness` **1.412 unitários, 8 integrações**, demais verificações aprovadas. Testes de tela usam transporte RPC controlado: **não** comprovam gravação autenticada com Supabase, persistência após F5 ou autorização para habilitar em Produção.

**Nomenclatura futura:** sugestões de botões de T2–T5 permanecem **propostas**, não interfaces implementadas. Em particular, exclusão de nota fiscal **não deve prometer excluir bens tombados/inventariados**, pois o contrato atual bloqueia estados patrimoniais terminais; a prévia deverá explicar dependências, bloqueios e os registros efetivamente atingidos.

## Atualização verificada — Antigravity Argon integrado seletivamente (15/11/2026)

**Origem independente preservada:** `audit/antigravity-argon-prontuario-20261115@7802c0fb`, código `5c2f80b1`. Sua branch permanece intacta. A branch principal recebeu as alterações compatíveis, sem cherry-pick integral, pois uma modificação SQL da proposta enfraquecia a identificação das operações.

**Incorporado:**
- T2: seleção explícita (checkboxes não marcados por padrão) de Pendências candidatas no bloqueio `AMBIGUOUS_CONSEQUENCE`; correção da remoção do botão residual de recarga após `STALE_PLAN`; cliente congela a requisição da primeira tentativa por `WeakMap` sem alterar a `operationKey`.
- T5: helper de domínio sobre o esquema verdadeiro de `tentativas`, rejeitando `targetId` inexistente e múltiplas tentativas sem alvo escolhido; ainda **sem ligação ao SQL/UI real**.
- T1: superfície escura síncrona e transição limitada a `box-shadow` para evitar contraste transitório insuficiente.

**Recusado com prova RED/GREEN:** a alteração do Antigravity removia `note` do `request_fingerprint` SQL, permitindo que **a mesma chave idempotente com observação diferente** recebesse um replay silencioso. O teste negativo falhou em PostgreSQL descartável com a proposta original (sem exceção). Foi preservado o fingerprint completo da migration anterior, com teste SQL novo para **rejeitar observação divergente** e outro para **repetir exatamente a observação original**. O cliente que congela o payload já resolve o retry sem precisar relaxar o servidor.

**Verificação independente do lote ajustado:** `npm run test:readiness`: **1.412/1.412 unitários e 8/8 integrações**, demais gates aprovados; PostgreSQL 18 descartável com **63 migrations aplicadas e 61/61 pgTAP**; teste real com duas sessões `scripts/test-operational-correction-concurrency.sh`: **um commit, um replay, uma exclusão**; Playwright/Chromium com **23/23** testes em 2 workers (diálogo, retificação legada, layout, contraste e governança SME). O teste paralelo com 8 workers sofreu `exit 137` por falta de memória do sandbox; **não** se tratou de falha funcional. O transporte RPC dos E2E ainda é controlado; **a integração autenticada com Supabase descartável e reload continua pendente**.

**Próximo trabalho funcional:** concluir as jornadas reais de T2 (Pendência, NF e Consulta Assessoria) e T3 (exclusão coordenada de NF via autoridade única), seguidas da implantação transacional de T4/T5 e homologação T6. A flag segue desligada, sem mudanças em `main`, Vercel Production ou Supabase institucional.

## Comece aqui — retomada pelo Astra

**O que abrir:** branch `fix/prontuario-integrado-validado-20261115`, consultar `git status`, `git log -1` e comparar com `main` antes de editar. Este checkpoint, `docs/CURRENT_STAGE.md` e `docs/reference/STATUS_DOCUMENTOS.md` apontam para a **mesma** frente. O handoff antigo do Argon é histórico. Não abrir uma quarta branch nem repetir a auditoria inteira sem mudança material de SHA.

**Objetivo aprovado, sem ampliar escopo:** aprimorar a estrutura visual do Prontuário e permitir correção/exclusão coordenada de lançamentos e dependentes, sem falso envio, falsa reanálise ou justificativa obrigatória. Preservar diferenças entre bonificação manual, análise técnica, NF, Pendência, inventário e saída provisória; manter ADR-055/056 e permissões institucionais. A fonte de decisão é o contrato e plano T0–T6 acima, não a proposta pessoal de um agente.

| Lote | Código já disponível | Falta comprovar ou implementar |
| --- | --- | --- |
| **T0** | Contrato, plano e 500 linhas de fixtures recuperadas do Argon | Verificar cobertura das fixtures com cenários de aceitação efetivos |
| **T1** | Cabeçalhos horizontais por programa, ajustes CSS, correção do teste Gestão SME, teste automatizado de contraste | Comparação visual aprovada, persistência após reload e revisão mobile/perfis |
| **T2** | RPCs e cliente integrados; diálogo piloto de análise com `correct_analysis`, `clear_analysis` e seleção explícita de Pendências candidatas; 61 testes SQL e concorrência idempotente | Ainda conectar exclusão de Pendência, análise individual NF/Assessoria, autenticação e persistência pós-reload |
| **T3** | Exclusão causal de NF e dependentes proposta no SQL, inclusive testes isolados | Encaminhar exclusão das autoridades existentes à operação única, tratar patrimônio/provisória e reconciliação de caches/UI |
| **T4** | Regras descritas no contrato | Correção de bonificação e exclusão de pacote/contexto |
| **T5** | Helper de recomposição `pendency-correction.js` reconciliado com `tentativas` reais e testes unitários, preservado como componente de domínio puro | Ainda faltam RPCs, interfaces e testes de persistência para histórico, contatos e inventário |
| **T6** | Gates parciais e roteiro de teste | Homologação visual, funcional, segurança, CI, integrações e plano de publicação, somente após autorização |

**Próxima alteração útil:** concluir **T2** (diálogos de correção, conexão única ao bootstrap e controles reais). O cliente existente espera `repository.executeRpc`; não confundir um cliente testado em isolamento com produto operacional. Primeiro escrever os cenários negativos e positivos do clique até recibo, atualização da tela e reload; depois integrar, sem sobrescrever a autoridade existente por uma implementação parcial. **Não aplicar SQL ao Supabase institucional.**

**Evite retrabalho:** não reconduzir a T1 do zero; não copiar a migration original insegura do Argon; não apagar as fixtures T0/T5 recuperadas; não trazer de volta restrições antigas; não refazer o PR #515 de Pendências. Verificar os resultados dos testes por SHA e repetir os afetados após alterações, pois testes anteriores não certificam código novo.

## Incremento T2 — diálogo piloto sob flag desligada por padrão

O trabalho da sessão Work foi interrompido por cota antes de chegar ao GitHub. A integração aqui é uma **reconstrução independente** da camada de diálogo usando o cliente/RPC já versionados, não uma recuperação de arquivos privados.

- Módulo `src/integration/operational-correction-dialog.js`, incluído no bootstrap e associado ao botão real **Editar análise** sob `RADAR_OPERATIONAL_CORRECTION_PREVIEW === true`. A flag permanece desligada por padrão.
- O diálogo exibe a prévia real do plano do servidor, alterações e bloqueios; observação é opcional; usa a mesma `operationKey` no retry; distingue erro de gravação de commit confirmado sem recarga local.
- Com flag desligada, o comportamento existente permanece preservado. Sem repositório remoto, a flag falha fechada: não há fallback silencioso para gravação local.
- O piloto T2 **não** valida ainda persistência autenticada em Supabase descartável e não autoriza ativação em Production. Exclusões de NF, Pendência e histórico T3–T5 permanecem pendentes.

**Testes executados nesta reconstrução isolada:** `npm run test:readiness` aprovado (1.404 unitários, 8 testes de integração e demais verificações institucionais); Playwright Chromium: **18/18** nas suítes do diálogo, da retificação legada, da Gestão SME e do layout do Prontuário (incluindo 390 px, tema escuro e interação com botão real sob transporte simulado). Essas provas não equivalem a CRUD autenticado no Supabase institucional; o teste de navegador usa `executeRpc` controlado.

## Aproveitamento seletivo da autoauditoria Gemini (15/11)

Referência **somente de leitura**: `audit/gemini-revisao-critica-e-sugestoes-20261115@6b4efb5d`. Não integrar o diálogo alternativo integralmente: o módulo substitui a API pública `open()` por `openCorrectionDialog()` e falhou em **6/8** testes Playwright do contrato atual, embora seus 8 testes unitários específicos passem. O `test:readiness` dessa branch também passou; isso não prova compatibilidade de navegador.

- **G-01: já atendido** no diálogo integrado: `context.invoiceId` vira `target.id`; o diagnóstico de que a versão-base passava `target.invoiceId` estava incorreto.
- **G-02: aproveitado pontualmente:** a seleção `Não analisado` passa a pedir `clear_analysis` ao cliente/RPC existentes, sem `changes.analysis`; as outras seleções continuam em `correct_analysis`. A pré-seleção antiga para avaliações inicialmente não analisadas foi preservada. A interface de seleção explícita de múltiplas Pendências continua pendente; **não** aplicar seleção automática de consequências.
- **G-03: não incorporar o helper sugerido sem reconciliação adicional:** ao receber um `attemptId` inexistente, `findTargetAttemptIndex` cai silenciosamente na última tentativa, corrigindo ou excluindo a tentativa errada. Reproduzido com duas tentativas sintéticas. O módulo antigo em T5 segue como artefato preliminar, não como solução operacional.
- **G-04: avaliar somente o fallback:** `administrativeLogReadRequired()` consulta a factory canônica (`RadarRepositoryFactory.isSupabaseExplicitlyEnabled`) antes do caminho `RadarDataContext`; não se demonstrou falha generalizada que exija modificar o bootstrap.
- **Aprimoramento independente pós-Manus:** após erro de rede de resultado incerto, manter análise, observação e `operationKey` intactas para retry, sem nova prévia; informar possibilidade de commit remoto e oferecer recarga.
- **Validação:** novo E2E G-02 falhou antes da correção e passou depois; testes direcionados G-02/integração real/retry: 3/3. `npm run test:readiness`: 1.405 unitários e 8 integrações aprovados. A regressão de 21 testes Playwright estava em 20/21 por alteração de pré-seleção; essa alteração foi revertida e os 3 testes afetados passaram. **Bateria completa reexecutada no commit `46bd6dfc` em sandbox novo:** Playwright Chromium **21/21 aprovados**, `npm run test:readiness` **1.405 unitários + 8 de integração aprovados**, sem falhas; hashes dos três arquivos do commit conferidos contra o GitHub. Os transportes RPC dos E2E são controlados, não teste autenticado no Supabase institucional.

## De onde veio o código

- A base deste candidato é `audit/manus-sugestoes-correcao-20261114` (`f0fa7335`), com a T1 de cabeçalhos horizontais reconstruída do Astra e uma proposta nova de RPCs mais segura que o contrato incompleto do Argon.
- O ajuste mais recente do teste Gestão SME da T1 (`300ac6d1`) foi incorporado e validado. Nenhuma regra funcional da Gestão SME foi alterada para fazê-lo passar.
- Os artefatos **não substituíveis** do Argon (`182b7949`), `tests/fixtures/prontuario-correction-cases.json` e `src/domain/pendency-correction.js`, foram recuperados para manter os cenários T0 e a base da T5. **Sua existência não significa que a T5 já esteja integrada.**
- O relatório do Manus continua referência histórica, **não é o contrato executável final**: `audit/manus-auditoria-frente-integrada-20261114`.

## Correções realizadas pela auditoria independente

1. **SQL — repetição concorrente da mesma intenção:** `apply_operational_change_impl` agora serializa por `operationKey` com advisory lock transacional antes de consultar o ledger, para que o segundo pedido retorne o recibo idempotente, não `NOT_FOUND`. Regressão reproduzível: `scripts/test-operational-correction-concurrency.sh` (somente banco local com nome `ind_*` ou `radar_test_*`), massa `tests/fixtures/operational-correction-concurrency-seed.sql`.
2. **Tema escuro — NF e dados escolares:** os títulos escuros da T1 eram ilegíveis; a alteração do Manus trocava apenas a cor da fonte, criando texto claro sobre a superfície ainda branca das linhas de NF. O CSS foi reconciliado definindo a **superfície escura da linha** e sua listra no Prontuário, sem `!important` adicional. O Playwright `tests/e2e/prontuario-dark-contrast-regression.spec.js` mede os pares texto/fundo **após** a transição, exigindo WCAG AA de pelo menos 4,5:1. Teste criado inicialmente vermelho no candidato anterior, depois verde.
3. **Readiness SQL:** o runbook declara 63 migrations, identificando a 63ª como *candidata não instalada em Production*; o verificador canônico local também espera 63. Não alterar o histórico de migrations remoto para justificar um contador.
4. **T1/SME:** alteração exclusiva do teste E2E para o novo DOM; permissões efetivas permanecem intactas.

## Resultado e limitações

- Migration candidata e testes SQL aplicados **somente em PostgreSQL descartável**. A migração não está instalada no Supabase institucional.
- Componente `src/application/operational-correction-client.js` é um cliente de prévia/aplicação e **não está instalado no bootstrap visual**. RPCs estarem testadas não significa que T2/T3 estejam disponíveis na interface do usuário.
- Não declarar T1 concluída só pela suíte: requer revisão humana de capturas, histórico e persistência após reload. Testes Playwright com massa local NÃO provam persistência Supabase real.
- Parte da T2 exige diálogos reais, estado sem falso sucesso, carregamento controlado e interface de correção para avaliação, Pendência e NF. A T3 requer delegação da exclusão existente para a autoridade composta quando habilitada, preservando caminho antigo quando desabilitada até homologação. Não instalar duas interceptações sobre a mesma ação.
- T4 (bonificação e contexto errado), T5 (histórico e inventário granulares) e T6 (homologação global/produção) **não estão completas**.
- **Nenhuma operação de escrita institucional, deploy ou merge foi autorizada por este checkpoint.** Registros e usuários de teste são fictícios.

## Comandos de verificação local

```bash
npm ci
npm run test:readiness
npx playwright test tests/e2e/prontuario-correction-layout.spec.js tests/e2e/sme-access-governance.spec.js tests/e2e/prontuario-dark-contrast-regression.spec.js --project=desktop-chromium --workers=1
# Apenas PostgreSQL descartável com schema/migrations já carregados:
# sudo -u postgres bash scripts/test-operational-correction-concurrency.sh ind_radar_corrected
# sudo -u postgres psql -X -q -t -A -d ind_radar_corrected -f supabase/tests/database/operational-correction.test.sql
```

## Próxima ordem objetiva

1. Conferir HEAD remoto desta branch e o estado da `main`. Executar novamente os testes e confirmar que a integração não perdeu os artefatos T0/T5 recuperados.
2. Completar o módulo de diálogo e a integração no **bootstrap e nos controles reais**, baseando-se no plano/receipt da RPC. Evitar criar novas regras de negócio no DOM.
3. Fechar as jornadas T2/T3 com teste autenticado no banco descartável, edit/save/reload e duas sessões. Reprovar qualquer sucesso falso, exclusão ampliada, ressurreição no cache, ou justificativa obrigatória.
4. Fazer revisão visual de screenshots reais 1280/1440/1920 e 390 px, claro/escuro, perfis Controlador/Assistente/SME antes de merge.
5. Só depois da aprovação e integração preparar migração/release separadas, revalidando Prod e CI.

**Regra de continuidade:** atualizar este documento com commit, arquivos, testes e pendências após cada lote; não substituir evidências por afirmações de outro agente.
