# Reconciliação de tooling e alterações feitas pelo celular — 21/10/2026

**Classe:** evidência datada de estado e publicação; não é nova autoridade funcional nem handoff corrente.  
**Base observada ao encerrar esta reconciliação:** `main@855fa0d71322dd133dd9f41ddbf36daba10d513c`.  
**Finalidade:** impedir reimplementação de atualizações já integradas e distinguir checkpoints de candidatos da publicação efetivamente observada.

## 1. O que foi integrado

A base anterior à rodada era `d1f1dad60778c1b8f67bb660e8ad06736b9ab219`. Os merges seguintes foram conferidos no GitHub e no diff da main:

| PR | Entrega delimitada | Merge | CI do HEAD final |
| --- | --- | --- | --- |
| [#462](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/462) | Prettier 3.9.9 → 3.9.10; contrato de versão | `291ec53418eea1ed048da289fa3b6fdfb3030385` | 19/19 workflows aprovados |
| [#444](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/444) | Actions fixadas por SHA, contratos reconciliados | `c38c144c512c3443d388e1d3955574b4a9819ba5` | 29/29 aprovados |
| [#463](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/463) | Medição E2E da primeira linha textual da orientação de reanálise | `ce4fe2c32ff9fc98f26d4da476b83515f47e44ea` | 7/7 aprovados |
| [#457](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/457) | Supabase JS 2.117.3 → 2.118.0 em pacote, bundle e import da função | `3ca37a5d23481f9f2893dade07bb1d415bd15821` | 20/20 aprovados após repetições delimitadas |
| [#461](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/461) | Playwright 1.64.0 → 1.64.1 isolado do Axe | `f71788413f170829f57181b12b4283a203715ce8` | 19/19 aprovados no HEAD reconciliado |
| [#467](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/467) | Reserva de portas no workflow de confiabilidade Supabase | `60578d36c5bdb1a26e4755b55750a4aef8263cb7` | 7/7 aprovados |
| [#466](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/466) | Nome acessível dos cinco cartões do Dashboard e detector de estilo | `12dd13f62d050b68d399f93e5bf1775c09aac177` | 12/12 aprovados |
| [#464](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/464) | Axe 4.13.0 → 4.14.0, somente pacote/lock | `855fa0d71322dd133dd9f41ddbf36daba10d513c` | 19/19 aprovados |

As quantidades são por candidato, não testes únicos acumulados. Workflows possuem testes sobrepostos e jobs condicionais; aprovação de workflow não converte skip em jornada executada.

## 2. Instrumento, infraestrutura e produto: causas separadas

### Medição geométrica (#463)

O caso B da [issue #460](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/460) comparava o topo da caixa `.reanalysis-guidance` com a base do cabeçalho. A caixa tem padding superior; isso não equivale à posição do texto que o usuário precisa ler. O PR passou a medir a primeira linha com `Range.getClientRects()`, mantendo foco, scroll, visibilidade, fluxo e falha explícita quando não há texto mensurável. Nenhum CSS, fixture, timeout ou tolerância arbitrária foi alterado.

[Run 39550938564](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39550938564): 225 testes aprovados, 68 pulados, nenhuma falha. O caso A da mesma issue — prontidão/hidratação após reload — continua aberto. A observação posterior de opacity 0 na preparação da baseline também não é prova desse caso A.

### Colisão de porta do runner (#467)

Os runs [39580843942](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39580843942) (#457) e [39642451524](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39642451524) (#466) falharam ao fazer bind em `54322`, antes de iniciar os testes funcionais. O #467 reutilizou a reserva `54320–54323` já presente em outros gates, preservando reservas existentes e atuando somente no runner descartável. Nenhuma alteração em Auth/RLS, SQL ou produto foi usada para corrigir infraestrutura.

### Nome acessível dos cartões (#466)

O novo Axe habilita `label-content-name-mismatch` por padrão. No candidato anterior, o scan apontou os cinco cartões do Dashboard: o `aria-label` resumido omitia texto visível. A correção funcional ficou em PR separado: nome nativo derivado do conteúdo e `data-cycle-b-filter` para identificação funcional, preservando estilo e ação. O E2E verifica os cinco nomes, estado pressionado e filtro.

O [E2E final do #466](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39644683872), job `119377010016`, concluiu com 226 aprovados e 68 pulados. Isso certifica a jornada automatizada; não afirma inspeção manual independente de todas as imagens ou uso humano autenticado em Production.

## 3. Axe 4.14.0 efetivamente validado

HEAD final `daccec00f795d83f68fd8f57c1e7aeeb84529706`, sobre `12dd13f62d050b68d399f93e5bf1775c09aac177`:

- 19/19 workflows aprovados; 37 checks aprovados e dois condicionais ignorados.
- [E2E 39666305743](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39666305743), job `119452163550`: **226 aprovados, 68 pulados, nenhuma falha**. O log inclui o scan principal e o contrato acessível dos cinco cartões usando o Axe atualizado.
- [Uso real 39666305795](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39666305795): baseline, candidato e comparador aprovados, seis sessões e 400 rodadas por variante, 1.107 gestos/gravações confirmadas.
- Artefato original do comparador `12377499429` baixado e aberto; ZIP SHA-256 `8694b2b185f984c7505111989c49ca93bdefb8ffa0a59f36e0729fa02f84af94`.
- Status `diagnostic-comparison-complete`, **10 advertências diagnósticas**, budgets de custo `not-established` / `report-only`. A baseline é a referência histórica #408; durações/runners diferem. Não atribuir os deltas ao scanner nem afirmar superioridade de custo, frescor ou fluidez.
- Diff final limitado a `package.json` e `package-lock.json`: dependência raiz e dois nós Axe, Node 24 compatível com engine >=22.12.0. Não foram removidas regras nem silenciados resultados.

## 4. Publicação observada e seus limites

Leitura anterior ao #464: deployment `dpl_FLUUZNkPNGZWpvQ9yhLN7FZCV1Pg`, READY em `12dd13f6`, com domínio/manifesto coerentes. Edge Function ACTIVE v340 com SDK 2.118.0 e JWT preservado.

**Nova conferência após o merge #464, em 21/10/2026:**

- Vercel `dpl_FGfg4ffwqBXJqN4RW9bVwKMy91bV`, READY às **20:41:41.654 UTC**, no commit `855fa0d71322dd133dd9f41ddbf36daba10d513c`.
- Domínio oficial e manifesto respondendo HTTP 200 no SHA acima, com `dataMode=supabase-production`.
- Bundle público Supabase JS 2.118.0 inalterado, 265.570 bytes; SHA-256 `33b09b0db467df88254207a45a76fa6ab293ab1539f76c63683a78d75a7a86eb`.
- Edge Function `team-account-management` ACTIVE v341, `verify_jwt=true`, import SDK 2.118.0. `index.ts` hospedado corresponde byte a byte à main; SHA-256 `11d2fe608228e7759df73d5c6b7070bdae1acf88680fdc80409f497626ae7937`.
- Nenhuma sessão humana autenticada nem CRUD institucional foi executado nesta conferência. Leitura de manifesto, fonte e versão não substitui essas jornadas.

IDs de deployment e versão da função são fatos datados, não configurações eternas. Um novo commit documental também pode avançar o manifesto. Revalidar ao vivo quando uma próxima entrega depender desses valores.

## 5. Continuidade e decisões preservadas

- Os checkpoints [tooling-refresh](2026-10-21-tooling-refresh.md) e [SDK](2026-10-21-supabase-sdk-update.md) continuam evidência histórica dos candidatos. As frases “Draft”, “aguardar CI”, “sem publicação” descrevem aquele momento.
- O [checkpoint remoto imutável `91cc1783`](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/91cc1783640f5551df34d07b9e74ca563d45aa66/docs/evidence/2026-10-21-tooling-refresh-final.md) preserva o encerramento da primeira rodada, os hashes e as falhas iniciais. Não o substituir por uma narrativa de CI sempre verde.
- A primeira CI do HEAD final #457 teve colisão de porta antes dos testes e falha de preparação da **baseline** no ensaio sustentado. Houve uma repetição delimitada, sem código alterado; 20/20 workflows terminaram aprovados. A falha da amostra controle não demonstrou regressão de desempenho do SDK.
- dependency-cruiser, ESLint e Knip são próximas avaliações isoladas. Este documento não certifica versões ainda não implementadas nem autoriza silenciar novos achados.
- CLI Supabase permanece **2.114.0** preventivamente. O #453 foi encerrado sem merge; pgTAP 32/33 e grants de Production precisam ser reconciliados antes de upgrade ou mudança de contrato. Falha isolada da CLI 2.121 não comprova regressão da ferramenta.
- MSW 3 é major separada. PostgreSQL hospedado, credenciais, novos recursos/pagamentos e observabilidade não fazem parte desta manutenção.
- #446/#447 seguem Drafts diagnósticos de desempenho. Indicadores mensais permanecem suspensos. As entregas #438/#448 continuam encerradas; não reabrir funcionalidades nem alterar sincronização em nome desta atualização.
- Custódia externa permanente do backup cifrado e disponibilidade da senha histórica continuam pendências operacionais já registradas; não inferir posse a partir de restore aprovado nem expor credenciais.

Esta correção documental não altera código de produto, configuração, migrations, Auth/RLS, banco ou dados. `CURRENT_STAGE.md` segue como estado mutável, os modelos/ADRs como autoridades funcionais e os artefatos originais como evidência de seu SHA.
