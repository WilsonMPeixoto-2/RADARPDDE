# RADAR PDDE — estado atual e retomada

## Follow-up restrito de testes/documentação — PR #429

A entrega funcional #427/#428 permanece encerrada. O #429 fortalece exclusivamente
a prova de reconexão e alinha duas referências do smoke #426. RED nativo confirmou
falso positivo no teste antigo; candidato `829c3d10` tem 1323 unitários/8 integrações
verdes e GREEN nativo em seis execuções (runs `37655737551`, `37655886850` e
`37656306919`, baseline e candidato). A contraprova do mecanismo final (run
`37665993736`, recovery suprimido só no harness) falhou como exigido na espera da
resposta de recovery. Sem mudança em produto ou Production. Handoff **deste follow-up de testes**:
[checkpoint #429](handoff/2026-10-07-pr429-reconnect-proof.md).

## Atualização canônica — sincronização agregada integrada e publicada

**Integração funcional verificada em 07/10:** [PR #427](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/427),
merge `09083d91227e3f136496e34a5eef3a0c1158fa78`. A árvore integrada é idêntica à do
candidato certificado `90414a8056bb5ac706a925376ead48681e014ec6`.
**Production de encerramento:** `dpl_5L41YQCcnLHnbE5kT4s5UtG6cvvg`, `READY`;
manifesto no merge acima, em `supabase-production`. O módulo publicado coincide
com a saída do build canônico. Commits exclusivamente documentais posteriores
podem avançar a main/deployment sem reabrir a entrega; revalidar esses fatos ao vivo.

**Frente de sincronização agregada encerrada.** Dashboard, Carteira e Competências
usam a fatia escolar existente para eventos conhecidos com cobertura segura.
O candidato final concluiu **14/14 workflows**, seis E2E nativos e a prova sustentada
de seis sessões/400 rodadas. Na jornada pareada de oito gestos, cada observador
passou de oito RPCs globais/133.356 bytes para oito escolares, zero globais e
53.362 bytes (aproximadamente 60% menos bytes). DOM/mutações não diminuíram;
não atribuir ganho de CPU ou percentual de Production a essa medição sintética.
O smoke público pós-merge confirmou 52 assets, RLS anônima `blocked-401` e preflight
das Edge Functions. Os **8/8 workflows pós-merge** concluíram com sucesso,
incluindo o contrato público de login/RLS/responsividade. [Evidências, certificação e limites](evidence/2026-10-07-aggregate-school-sync/README.md).

**Não há handoff corrente desta frente.** O [registro de 07/10](handoff/2026-10-07-aggregate-school-sync.md)
passa a histórico concluído; #407/#409 e checkpoints pré-merge do #410 não formam
fila de correções. #415, #422 e #426 permanecem integrados. O fallback global
continua necessário para contexto incerto, contatos, cobertura invalidada,
reconexão/eventos perdidos e união conservadora de várias escolas.

- **PR #410** permanece integrado no merge `33ebbf7310898e025a3ec2edc198d6ecd4ea40ac`. A simplificação de sincronização operacional por escola está publicada; validações pós-merge com perfil Controlador não detectaram regressão funcional conhecida.
- **PR #415** permanece a implementação canônica de observabilidade. O build Production injeta Vercel Web Analytics e Speed Insights sem framework adicional nem dependência de runtime. Preview/local não recebem a instrumentação.
- `/_vercel/speed-insights/script.js` e `/_vercel/insights/script.js` estão presentes no HTML de Production e responderam HTTP 200.
- **Web Analytics:** **ativo**. Em 07/10/2026, o painel autenticado da Vercel confirmou **1 visitante e 1 visualização de página nos últimos 7 dias**. A coleta já começou.
- **Speed Insights:** configurado e ativo para coleta de dados de campo. Os Core Web Vitals passarão a ganhar representatividade conforme usuários reais utilizem o RADAR; ausência de volume inicial não é pendência de configuração.
- O script oficial de Speed Insights ignora automação/headless (`navigator.webdriver`/Headless); Playwright e sandboxes não devem ser usados para fabricar amostras de campo.
- **Divergência conhecida do conector:** a chamada `count_pageviews` deste ambiente ainda pode responder `404 Web Analytics not found` mesmo com o painel Vercel mostrando Analytics ativo e dados registrados. Não interpretar esse erro isolado como desativação; enquanto persistir a divergência, o painel autenticado é a autoridade para o estado administrativo.
- **PR #416 do Vercel Agent:** permanece fechado sem merge. A dependência `@vercel/speed-insights` era redundante e não deve ser reintroduzida enquanto a integração HTML/vanilla vigente permanecer suficiente.
- **PR #422 — tooling/CI:** integrado em `e78a0e68c3b8d88303209549852d6d705d355421`. Foram atualizados ESLint `10.12.0`, Lighthouse `13.5.0`, Knip `6.40.0`, Acorn `8.19.0`, Stylelint `17.16.0` e eslint-plugin-playwright `2.12.1`. MSW permanece `2.15.0` e `@types/node` permanece na linha 24. O Supabase CLI `2.120.0` foi homologado e **reprovado** por repetir exatamente os testes pgTAP/RLS 32–33 de `service_role`; a versão canônica continua `2.114.0` e `2.120.0` foi adicionada ao bloqueio exato do Dependabot. Todos os 18 workflows do candidato final #422 concluíram verdes após a retirada da CLI reprovada.

**Resultado operacional:** a frente de observabilidade Vercel está concluída em configuração. Web Analytics já registra tráfego real; Speed Insights está apto a registrar métricas reais de performance à medida que houver navegação humana.

Referência operacional durável: [observabilidade Vercel](reference/VERCEL_OBSERVABILITY.md).

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 7 de outubro de 2026

## Histórico técnico do PR #410 — encerrado

> **Nota de validade:** esta seção preserva checkpoints anteriores ao merge do #410. Menções abaixo a PR em Draft, candidato remoto, handoff corrente ou etapas ainda pendentes pertencem ao histórico de execução e **não representam o estado atual**. O estado vigente está no bloco canônico acima.

**Retomada vigente:** candidato remoto `d571a26a`, com aplicação e sincronização
escolar já implementadas. A revisão de 06/10 reproduziu cinco falhas de recuperação
e preservação do escopo global, mesmo com 57 contratos anteriores verdes.
[Evidência/decisão](evidence/2026-10-06-pr410-review/README.md). RED publicado em
`da5174ec`, seguido de GREEN local com política compartilhada de refresh e união
de escopos. GREEN funcional `a6a02120`: 1.294 unitários; 63 contratos + quatro E2E
reais no CI; readiness com 655 pgTAP e 17 Auth/RLS/frontend. Dois advisories de
desenvolvimento continuam bloqueando gates, com correções disponíveis. PR continua
Draft; ainda confrontar demais jobs e custo sustentado/cliente. Os parágrafos seguintes descrevem checkpoints
anteriores e não devem ser usados para reimplementar as etapas já entregues.

O usuário autorizou seguir a simplificação incremental em 04/10/2026. O [#410](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/410) parte da main pós-#408 (`d9bf67f7...`), também confirmada no manifesto Production. Continua Draft; não altera o ambiente publicado nesta etapa.

O handoff corrente é [início do #410](handoff/2026-10-04-pr410-start.md). O [plano executável](superpowers/plans/2026-10-04-operational-sync-simplification-implementation.md) registra caracterização, autoridade de rota, leitura/aplicação por escola, Realtime, fallback e remoção gradual de mecanismos. Primeiro incremento: Próxima unidade deve atualizar rota e escola visível pelo caminho canônico, com RED/GREEN de navegador.

O incremento de rota `d4a37d79...` concluiu 16 workflows verdes. A [caracterização
das seis coleções](evidence/2026-10-04-pr410-school-scope/README.md) avançou com
35 pgTAP locais e na pilha Supabase real (run `37200758428`, 566 pgTAP totais),
metadados/contagens somente de leitura em Production e mapa de
históricos, exclusões e projeções. Há contraprova de FK entre escolas permitida
pelo schema; não truncar esse vínculo na RPC futura. Contatos gerais têm cobertura
própria. O checkpoint de testes `1d13b02c...` concluiu 17 workflows com sucesso.

Incremento escolar candidato: migration `20261004132755`, RPC invoker sem consumo
no frontend, envelope/completude e fallback global para referências não isoláveis
nos dois sentidos. Provas locais: 81 pgTAP e 489 coberturas equivalentes sobre a
fixture de agregados históricos. [Evidências e limites](evidence/2026-10-04-pr410-school-rpc/README.md).
Certificação final no SHA `c29b1d55...`: **18 workflows verdes**, Supabase nativo
647 pgTAP/39 arquivos, 16 E2E Auth/RLS/frontend e 489 equivalências. Na comparação
final pareada, escola densa reduz p50 SQL em 41,0% e JSON em 96,1%. Os limites da
fixture e do custo SQL versus UI estão explícitos no relatório. Próximo incremento:
capacidade Repository e aplicação atômica por escola; novo Realtime ainda pendente.

#407 e #409 permanecem fontes de evidência. O #409 continua Draft: novos E2E de Realtime falharam no candidato `5553f130...`; o checkpoint `2d7706f3...` guarda erros e instruções. Não é base de implementação do #410. A aprovação da direção arquitetural não aprova migrations, cortes de recuperação ou merge antecipado.

As proteções do #408 são regressões obrigatórias. Os detalhes do design precisam provar escopo/históricos, exclusões, retorno autoritativo, origem da escrita e recuperação após suspensão. RPC, aplicação da fatia e sincronização dirigida já existem no candidato atual. Os checkpoints anteriores não certificam automaticamente sua composição final ou a prontidão de publicação.

## 1. Estado funcional corrente

**As Fases A, B e C estão encerradas. A Fase D ainda não foi iniciada.**

**A Fase 2 de autonomia dos Controladores e UX da retificação está encerrada, integrada e publicada.** O PR #404 foi mergeado em `de7bebb06b867ebd557ff83cd9194fe3d45f5903` e publicado no deployment Production `dpl_CLYY92KojCXpmQcL8xXQkmc3TdgG`, `READY`, com smoke HTTP 200 na raiz e em `/escolas/04.31.001`. A retificação de classificação permanece limitada ao histórico exclusivamente fiscal encerrado/cancelado e falha fechada diante de Pendência ativa, atividade/histórico de Assessoria, `a_identificar`, bem `Inventariada` ou versionamento desconhecido.

**A sincronização agregada está encerrada; não há handoff corrente operacional desta entrega.** A proteção patrimonial adicional, anulação/transferência auditável, `PROD-UX-08`, NAV-01/UX-04 e Fase D permanecem decisões/frentes separadas.

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

O handoff da sincronização agregada de 07/10 é histórico concluído, com encerramento indicado no início deste documento. O handoff do #410 e [Retificação de classificação e UX](handoff/2026-10-01-controller-type-retification.md) são históricos concluídos, assim como os handoffs de candidato/publicação do #397. [PROD-UX-08](handoff/2026-09-28-prod-ux-08-drawer-clipping.md) continua uma pendência separada de retomada visual. A investigação de `PROD-FUNC-09` está encerrada.

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
