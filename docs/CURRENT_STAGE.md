# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 30 de setembro de 2026

## 1. Estado funcional corrente

**As Fases A, B e C estão encerradas. A Fase D ainda não foi iniciada.**

**Prioridade executora corrente: PR #397 — independência entre despesas e bonificação.** A decisão funcional é a ADR-055; a implementação permanece candidata na branch `fix/decouple-expenses-bonification`, baseada em `main@a38eeef6`. O PR #396 já integrou a leitura `read_operational_context`, que deve ser preservada. O handoff corrente passa a ser [PR #397](handoff/2026-09-30-pr397-independencia-despesas-bonificacao.md); checkpoints e CI por SHA estão no próprio PR. Isso não comprova merge, aplicação de SQL ou publicação em Production.

`PROD-UX-08` permanece pendência visual separada, com seu registro de retomada preservado. #394 e os planos amplos do #395 não compõem o escopo executor do #397. Autorizações históricas de outros PRs não autorizam merge/deploy/escrita em Production nesta frente.

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

O handoff corrente é [PR #397 — independência de despesas](handoff/2026-09-30-pr397-independencia-despesas-bonificacao.md). [PROD-UX-08](handoff/2026-09-28-prod-ux-08-drawer-clipping.md) é uma pendência separada de retomada visual. A investigação de `PROD-FUNC-09` está encerrada.

Para retomada, a ordem de leitura continua sendo:

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. este arquivo;
5. `docs/reference/ENGINEERING_METHOD.md`;
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
7. `docs/reference/STATUS_DOCUMENTOS.md`;
8. matriz funcional e ADRs da área afetada.

## 5. Frente ativa e Fase D

A baseline principal da jornada desktop de **Despesa a identificar / Pendências / novo envio / reanálise / navegação** foi homologada por evidências complementares em ambiente local, Supabase descartável no CI e Production autenticada.

A auditoria em Production confirmou criação, retificação, identificação como Material de Consumo, transição para `Aguardando reanálise`, reanálise negativa coerente com ausência de arquivo real, retorno para `Aberta`, preservação de invoice/Pendência e persistência após reload no registro sintético autorizado.

**`PROD-FUNC-09` está encerrado em Production.** O PR [#392](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/392) corrigiu apenas o formatter de datas civis. Persistência, bridge, domínio e view model já preservavam `2026-09-27`. O merge `8284a02faf3d9381ad42e66b6d93677d396e8515` foi publicado no deployment `dpl_F8BVw5Js5v1HCcykq3NwBXa6SHzK`, `READY`, com manifesto no mesmo SHA e smoke aprovado.

A aba autenticada foi recarregada e o mesmo registro sintético, sem nova escrita, mostrou **Disponibilização 27/09/2026** e **Registro 27/09/2026, 23:12**. O CI do candidato terminou com **28 checks concluídos: 26 aprovados e 2 ignorados, sem falhas ou pendências**. [Evidência de encerramento](evidence/2026-09-28-prod-func-09-date-business/README.md).

A investigação de **`PROD-UX-08` — clipping e sobreposição do drawer global em desktop** permanece pendente e separada da frente executora #397. A correção de data não homologa a composição inteira do drawer; essa limitação foi novamente vista em Production e exige diagnóstico próprio antes de alterar CSS.

O registro de retomada dessa pendência visual é [`docs/handoff/2026-09-28-prod-ux-08-drawer-clipping.md`](handoff/2026-09-28-prod-ux-08-drawer-clipping.md). Ele não concorre com o handoff corrente do #397.

A **Fase D — hardening e performance permanece planejada, mas foi deliberadamente adiada** até que esta frente funcional/visual principal seja novamente compreendida no baseline pós-A+B+C. Ela não foi cancelada nem iniciada.

A avaliação separada de ferramentas para evolução visual permanece em [DESIGN_TOOLING.md](evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md): Figma conectado e provas isoladas de Sharp/SVGO/Lucide/Fontsource. Nenhuma biblioteca nova dessa avaliação foi adicionada ao runtime.

### Sucessão obrigatória após a fila corretiva imediata

A discussão sobre modernização visual **não é memória opcional de conversa**. Depois de encerrar os defeitos e refinamentos imediatos oriundos da auditoria atual — começando por `PROD-FUNC-09`, depois `PROD-UX-08` e demais ajustes que forem formalmente mantidos na fila — o próximo agente deve, **antes de abrir uma nova frente ampla de layout/design**, ler e reavaliar:

`docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`

Esse documento é uma avaliação técnica datada, portanto suas versões de pacotes e conclusões de compatibilidade devem ser revalidadas ao vivo antes de adoção. O que não deve se perder é a **frente de produto** que ele registra: explorar direção de arte, design system, tokens, componentização, iconografia, tipografia, Figma/Superdesign, Storybook/galeria de estados, otimização de assets e outras ferramentas capazes de elevar a qualidade visual do RADAR além de correções locais de CSS.

Essa retomada deve combinar o estudo de tooling com o método permanente instituído pelo PR #389: qualquer proposta visual precisa ser avaliada como sistema integrado e passar pela aceitação humana outside-in. Não iniciar migração de framework ou instalar bibliotecas apenas por modernidade; primeiro comparar benefício observável, custo, risco e compatibilidade com a arquitetura vigente.

Ao encerrar a fila corretiva atual, `CURRENT_STAGE.md` deve apontar explicitamente para um novo handoff de evolução visual que cite `DESIGN_TOOLING.md`; não saltar diretamente para Fase D ou outra frente sem decidir conscientemente esse próximo passo.
