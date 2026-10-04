# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 3 de outubro de 2026

## 1. Estado funcional corrente

### Investigação corrente de instabilidade operacional

O hotfix #406 está integrado e publicado. A investigação autorizada continua no
[PR #407](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/407), **Draft** pelo
estado atual das provas/riscos. Candidato integrado com main: `818678a4...`.
Estão implementadas correções de refresh stale/abort, janela em RPC lenta,
eco próprio, replay de fadeIn, focus/visibility em voo, continuidade do foco de
teclado e escopo autoritativo do novo envio fiscal. Comparador automático e
métricas de CPU expõem o custo residual; não existe budget de produto inventado.

O run operacional `37144801308` concluiu com cinco jobs aprovados; o lifecycle
`37144801361` concluiu com 21 testes aprovados. A árvore do merge de CI
`37bc4aea...` é idêntica à de `818678a4...`. A comparação automática confirmou
1.128 → 491 tentativas, mas payload 42,5 → 190,2 MB, SQL 61 → 169 execuções,
DOM 324 → 441 substituições e Long Tasks 166,5 → 198,7 s somados nas sessões.
Faded frames amostrados: 801 → 0. Isso confirma ganhos e custo residual;
workflow verde não aprova a arquitetura para publicação.

O [#408](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/408) extraiu correções
de refresh e escopo fiscal diretamente da main, acrescentando controles de retry,
retomada real e escrita concorrente. Sua revisão encontrou mais uma borda: resposta
concluída entre focus/visibility da mesma retomada produzia outra leitura após
30 s. Correção e RED/GREEN publicados no #408 em `b1b12bcc...`: 69 controles e
1.250 unitários locais aprovados; conferir os checks desse SHA. A implementação
posterior do #408 ainda precisa ser incorporada ao #407 após a integração do
hotfix, preservando a instrumentação e o foco lógico experimentais deste PR.

O usuário autorizou merge/publicação quando provas e riscos justificarem;
Draft não é proibição permanente. Backup/snapshot são instrumentos, não
pré-requisitos automáticos. A [síntese consolidada](evidence/2026-10-03-operational-instability/consolidated-run-37144801308-summary.json)
preserva métricas e hashes sem copiar a telemetria bruta para o Git.

Handoff corrente desta investigação:
[`2026-10-03-operational-instability.md`](handoff/2026-10-03-operational-instability.md).
O encerramento das fases funcionais anteriores permanece histórico válido.
O manifesto consultado em 03/10 aponta `62fe000c...`, com comportamento do #406.
Main foi revalidada e permanece nesse SHA. A política antiga do #407 ainda
rejeita o advisory Stylelint/braces; a exceção estreita revisada está no #408,
junto com auditoria separada do runtime. Os dois PRs e suas provas não são
intercambiáveis. O #407 continua Draft pelo custo residual e validação hospedada
pendente; não houve publicação nesta retomada.

**As Fases A, B e C estão encerradas. A Fase D ainda não foi iniciada.**

**A Fase 2 de autonomia dos Controladores e UX da retificação está encerrada, integrada e publicada.** O PR #404 foi mergeado em `de7bebb06b867ebd557ff83cd9194fe3d45f5903` e publicado no deployment Production `dpl_CLYY92KojCXpmQcL8xXQkmc3TdgG`, `READY`, com smoke HTTP 200 na raiz e em `/escolas/04.31.001`. A retificação de classificação permanece limitada ao histórico exclusivamente fiscal encerrado/cancelado e falha fechada diante de Pendência ativa, atividade/histórico de Assessoria, `a_identificar`, bem `Inventariada` ou versionamento desconhecido.

**Não há handoff corrente desta frente e nenhuma nova fase foi iniciada automaticamente.** A proteção patrimonial adicional, anulação/transferência auditável, `PROD-UX-08`, NAV-01/UX-04 e Fase D permanecem decisões/frentes separadas.

**O PR #397 — independência entre despesas e bonificação — permanece integrado e publicado.** A ADR-055 e a leitura contextual do #396 são preservadas. A [continuidade após o #397](handoff/2026-09-30-pos-publicacao-pr397-retomada.md) passou a contexto histórico desta entrega.

`PROD-UX-08` e a rodada NAV-01/UX-04 permanecem separadas; não foram homologadas pela Fase 2. #394, planos amplos do #395 e Fase D continuam fora do recorte. O encerramento da Fase 2 não autoriza automaticamente essas frentes.

Registro da publicação de 30/09/2026:

| Fronteira | Evidência confirmada |
|---|---|
| Candidato | `0e149e148ecef708db3ab05faf9c1b5e43338fe6`; 45 checks concluídos, 43 aprovados e dois skips condicionais de Preview, sem falhas |
| Integração | [PR #397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397), merge `a5e200e5c3d7955cea0a6122bde1904469771ac3`; árvore idêntica à do candidato |
| Supabase Production | As duas migrations `20260929213000_expense_bonification_independence` e `20260930003000_expense_verification_field_ownership` foram aplicadas em ordem; histórico 56 → 58; corpos e metadados das três funções conferidos |
| Vercel Production | `dpl_suHN66eJ41tsHKPmS5SAs6N7iJnu`, `READY`; manifesto no merge acima, em `supabase-production` |
| Interface real | Formulários de NF disponíveis com bonificação vazia, Não, N/A e contexto consolidado; formulário de `a_identificar` e ações após reload conferidos; formulários cancelados, sem novas despesas |

[Evidência da publicação, checks e limites](evidence/2026-09-30-pr397-production-release/README.md). Os 20 ciclos de gravação/edição/exclusão passaram em Supabase descartável real no candidato. Não houve ciclo CRUD em Production nesta publicação: não foi definido um contexto de teste. O smoke observacional não homologa os defeitos visuais preexistentes nem substitui esse ciclo de escrita.

A correção de dependências foi incorporada ao candidato com `npm audit` sem vulnerabilidades e sem troca de ExcelJS/Ajv/esbuild. O backup completo deixou de ser pré-requisito por instrução do usuário; a execução já iniciada também concluiu com `restoreVerified: true`, 57 tabelas conferidas e artefato cifrado preservado localmente. Nenhuma atividade adicional de backup ou repetição dos 45 gates permanece necessária para encerrar o #397.

Os SHAs e deployments acima identificam a entrega funcional comprovada. Conferir o head e o manifesto ao vivo quando forem relevantes para uma nova alteração; commits documentais posteriores não reabrem essa entrega.

Baseline funcional que encerrou a Fase C:

- merge funcional de encerramento: `e6b692a97dd5148877c788da11e0c8ae4c8fcd19`;
- PR de encerramento: [#386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386);
- deployment que comprovou a publicação da C3: `dpl_vp8YKMA9pGDMZD7RQRjQDM8qkYC5`, `READY`, target `production`;
- URL oficial: https://radarpdde-fix.vercel.app;
- manifesto dessa publicação: `commitSha=e6b692a97dd5148877c788da11e0c8ae4c8fcd19`, `vercelEnvironment=production`, `runtimeEnvironment=production`, `dataMode=supabase-production`, `supabaseRepositoryEnabled=true` e `productionActivationApproved=true`;
- smoke da publicação: 50 assets válidos e RLS anônima confirmada por `blocked-401`.

Esse SHA e esse deployment são a **evidência de encerramento funcional da Fase C**. Commits posteriores exclusivamente documentais podem avançar a `main` e gerar novo deployment sem constituir nova versão funcional do produto. Por isso, o SHA exato do head corrente e o deployment ativo devem ser conferidos ao vivo no GitHub/Vercel quando forem materialmente relevantes, em vez de serem tratados como constantes dentro deste documento.

Não existe PR, branch ou handoff corrente da Fase D neste momento.

## 2. Histórico de encerramento das fases

| Frente | Resultado | Registro |
|---|---|---|
| A/B | Integradas e publicadas | [PR #378](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/378), merge `5581ee8814dd8361e8be70fe467f832f2ddce20c` |
| C1 | ExcelJS 4.4.0 preservado com `uuid@11.1.1` homologado | [PR #384](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/384), merge `70e3d7e601b9157940dba0d2cbbc8a0d7cf90ad3` |
| C2 | Supabase CLI 2.118.0 reprovada; 2.114.0 preservada | [PR #385](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/385), merge `0af1c5a81536f68b848a7194f72071c1e7e9ad2f` |
| C3 | Servidor Node canônico; `http-server` removido; dois achados CodeQL corrigidos | [PR #386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386), head homologado `bbe78d66d6aec0261ddf2f068d2ff5b1ac8f2c67`, merge funcional `e6b692a97dd5148877c788da11e0c8ae4c8fcd19` |

Validação final da C3 no head corrigido:

- 17/17 workflows aplicáveis verdes;
- suíte E2E completa: 237 casos descobertos, 183 aprovados e 54 skips condicionais;
- regressão visual aprovada sem atualização artificial de goldens;
- CodeQL reaprovado e as duas threads resolvidas automaticamente pelo `github-advanced-security[bot]`;
- após o merge funcional, os gates disparados na `main` também ficaram verdes, incluindo monitoramento de Production, smoke do Excel SME, CodeQL, Lighthouse, regressão visual, validação geral, Supabase readiness e saúde das dependências.

## 3. Decisões técnicas preservadas

- Supabase JS 2.117.2 alinhado no navegador e Edge Function;
- Supabase CLI 2.114.0 permanece homologada; não enfraquecer RLS/pgTAP para aceitar uma CLI reprovada;
- ExcelJS 4.4.0 / `uuid@11.1.1`, sem a antiga exceção de vulnerabilidade;
- `scripts/serve-radar.mjs` é o servidor canônico para dev, Playwright, auditoria e Lighthouse; `http-server` foi removido;
- `RADAR_SERVE_ROOT` seleciona a raiz servida; `RADAR_E2E_ROOT` permanece por compatibilidade;
- o servidor abre o arquivo uma vez, verifica e lê pelo mesmo `FileHandle`, fecha em `finally` e não expõe mensagens internas em respostas HTTP;
- a C3 não alterou layout, regras funcionais, banco, schema, migrations, RPCs, RLS ou persistência;
- goldens visuais não são atualizados automaticamente para obter verde;
- um resultado vermelho de CI não autoriza mudança funcional sem diagnóstico causal do SHA, ambiente, fixture, ferramenta e contrato testado.

## 4. Evidência e validade documental

Registro técnico da correção final da C3: [correções CodeQL e validação C3](evidence/2026-09-27-phase-c3-codeql.md).

Os documentos de handoff de A/B e das frentes anteriores permanecem **históricos concluídos**. Não reabrir PRs #375/#376/#377/#378 ou textos pré-merge como fila de implementação.

O handoff corrente é a investigação de instabilidade indicada na seção 1. [Retificação de classificação e UX](handoff/2026-10-01-controller-type-retification.md) passa a histórico concluído da Fase 2, assim como os handoffs de candidato/publicação do #397. [PROD-UX-08](handoff/2026-09-28-prod-ux-08-drawer-clipping.md) continua uma pendência separada de retomada visual. A investigação de `PROD-FUNC-09` está encerrada.

Para retomada, a ordem de leitura continua sendo:

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. este arquivo;
5. handoff corrente indicado acima, quando houver;
6. `docs/reference/ENGINEERING_METHOD.md`;
7. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
8. `docs/reference/STATUS_DOCUMENTOS.md`;
9. matriz funcional e ADRs da área afetada.

## 5. Pendências separadas e Fase D

A baseline principal da jornada desktop de **Despesa a identificar / Pendências / novo envio / reanálise / navegação** foi homologada por evidências complementares em ambiente local, Supabase descartável no CI e Production autenticada.

A auditoria histórica anterior à publicação do #397 confirmou em Production criação, retificação, identificação como Material de Consumo, transição para `Aguardando reanálise`, reanálise negativa coerente com ausência de arquivo real, retorno para `Aberta`, preservação de invoice/Pendência e persistência após reload no registro sintético autorizado. Essa prova pertence àquela auditoria; não representa um ciclo CRUD executado no deployment do #397.

**`PROD-FUNC-09` está encerrado em Production.** O PR [#392](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/392) corrigiu apenas o formatter de datas civis. Persistência, bridge, domínio e view model já preservavam `2026-09-27`. O merge `8284a02faf3d9381ad42e66b6d93677d396e8515` foi publicado no deployment `dpl_F8BVw5Js5v1HCcykq3NwBXa6SHzK`, `READY`, com manifesto no mesmo SHA e smoke aprovado.

A aba autenticada foi recarregada e o mesmo registro sintético, sem nova escrita, mostrou **Disponibilização 27/09/2026** e **Registro 27/09/2026, 23:12**. O CI do candidato terminou com **28 checks concluídos: 26 aprovados e 2 ignorados, sem falhas ou pendências**. [Evidência de encerramento](evidence/2026-09-28-prod-func-09-date-business/README.md).

A investigação de **`PROD-UX-08` — clipping e sobreposição do drawer global em desktop** permanece pendente. As publicações de #392 e #397 não homologam a composição inteira do drawer. Esse achado não deve ser confundido com UX-04, que trata da largura mobile e integra a rodada limitada de Preview solicitada pelo usuário.

O registro de retomada dessa pendência visual é [`docs/handoff/2026-09-28-prod-ux-08-drawer-clipping.md`](handoff/2026-09-28-prod-ux-08-drawer-clipping.md). Ele permanece como pendência separada; não há handoff corrente.

A **Fase D — hardening e performance permanece planejada, mas não iniciada**. O encerramento da Fase 2 não a inicia automaticamente nem transforma outras pendências visuais/funcionais em fila implícita.

A avaliação separada de ferramentas para evolução visual permanece em [DESIGN_TOOLING.md](evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md): Figma conectado e provas isoladas de Sharp/SVGO/Lucide/Fontsource. Nenhuma biblioteca nova dessa avaliação foi adicionada ao runtime.

### Sucessão obrigatória após a fila corretiva imediata

A discussão sobre modernização visual **não é memória opcional de conversa**. Depois de encerrar os defeitos e refinamentos imediatos oriundos da auditoria atual — `PROD-FUNC-09` já está encerrado; a fila remanescente começa por `PROD-UX-08` e pelos demais ajustes que forem formalmente mantidos — o próximo agente deve, **antes de abrir uma nova frente ampla de layout/design**, ler e reavaliar:

`docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`

Esse documento é uma avaliação técnica datada, portanto suas versões de pacotes e conclusões de compatibilidade devem ser revalidadas ao vivo antes de adoção. O que não deve se perder é a **frente de produto** que ele registra: explorar direção de arte, design system, tokens, componentização, iconografia, tipografia, Figma/Superdesign, Storybook/galeria de estados, otimização de assets e outras ferramentas capazes de elevar a qualidade visual do RADAR além de correções locais de CSS.

Essa retomada deve combinar o estudo de tooling com o método permanente instituído pelo PR #389: qualquer proposta visual precisa ser avaliada como sistema integrado e passar pela aceitação humana outside-in. Não iniciar migração de framework ou instalar bibliotecas apenas por modernidade; primeiro comparar benefício observável, custo, risco e compatibilidade com a arquitetura vigente.

Ao encerrar a fila corretiva remanescente, `CURRENT_STAGE.md` deve apontar explicitamente para um novo handoff de evolução visual que cite `DESIGN_TOOLING.md`; não saltar diretamente para Fase D ou outra frente sem decidir conscientemente esse próximo passo.
