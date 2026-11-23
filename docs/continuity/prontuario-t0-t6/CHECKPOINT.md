# Checkpoint único de continuidade operacional — RADAR T0–T6

## Atualização verificada em 22–23/11/2026 — T4 inicial, D021 e Ondas 1–3 integradas na `main`

- **PR #538 (T4 inicial):** integrado na `main` em `ca73311377f95f32e994f98dfa5bdb4b0f56b7cc` após 21/21 workflows; migration 65 `20261121000200_correct_fiscal_bonification` aplicada no Supabase institucional e flag T4 ativada em Production (`operationalCorrectionRelease=true`, `bonificationCorrectionRelease=true`).
- **PR #540 (`T0T6-D021` — Linguagem do Controlador):** integrado na `main` em `4b698b4121c9f5f356622b468fb44b71a5832915` e publicado em Production. Botão **“Corrigir consolidação”**, janela **“Corrigir consolidação da bonificação”**, campo **“Nova avaliação — Notas Fiscais”**, aviso de alcance e reconsolidação **“Consolidar bonificação”** ativos sem alterações de SQL/RPC; aceite visual humano em campo permanece registrado separadamente em `T0T6-I021-02`.
- **Ondas 1–3 de UX/a11y integradas na `main`:** [PR #541](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/541) (`b3bf0935`, data local em contatos + confirmação/acessibilidade em Gestão de Equipe), [PR #542](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/542) (`ab8d2339`, navegação lateral `<button>` com `:where(button.nav-item)`, contraste WCAG AA nos temas claro/escuro e linguagem clara nos diálogos, 17/17 workflows verdes sem alterar o golden `prontuario.png`) e [PR #543](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/543) (`c3be209f`, compactação do painel provisório vazio do PDDE Qualidade).
- **Integridade de Production (diagnóstico somente-leitura):** o alerta recorrente `totalIssues=3` em `public.production_integrity_check()` é pré-existente desde 18/11/2026 (`permanent_invoices_without_linked_asset`: 3 notas de 2026-10 em `04.31.001` e `04.31.024` gravadas via auditoria assistida/SQL sem `linked_asset_id`). Nenhuma mutação automática foi aplicada sobre registros reais.
- **Entrega delimitada:** a T4 publicada cobre somente correção/limpeza da avaliação de **Notas Fiscais** de bonificação consolidada; `clear_item_history`, `delete_context` e demais critérios continuam na fila T4, e T5 permanece futura. Não refazer a migration 65.


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
