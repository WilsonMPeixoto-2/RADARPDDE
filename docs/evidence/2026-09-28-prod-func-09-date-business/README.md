# PROD-FUNC-09 — data civil da tentativa no drawer global

**Estado:** encerrado em Production em 28/09/2026; PR #392 integrado e mesmo registro relido sem alteração.

**Baseline:** `main@aa9f951dca95eb49740816869253d91e667e157d` (PR #391 integrado).

**Ambiente:** Windows, Node 24.19.0, npm 11.17.0, Playwright desktop-chromium em `America/Sao_Paulo`.

**Production nesta rodada:** somente leitura; nenhuma nova mutação.

## Observação humana e dado canônico

No ciclo sintético autorizado e documentado na branch histórica `audit/post-abc-expense-baseline-2026-09-27`, o operador informou `27/09/2026` como data de disponibilização. O diálogo de reanálise mostrou `2026-09-27`; após reload, o drawer global de Pendências mostrou `26/09/2026` em **Tentativas de envio**. A linha do tempo dos eventos continuou em `27/09/2026`. O registro é `pend-699702ea-480f-4703-bd98-9de990237f35`, invoice `nota-82b17b35-971e-49d9-85a5-d4e0e2c55065`.

Uma consulta **somente leitura** à `public.pendency_attempts` na Production, filtrada pelo ID acima, confirmou a tentativa `tentativa-e7247dfc-83c4-4a7d-84bd-17bfad323a28`:

| Campo | Valor retornado |
| --- | --- |
| `available_at` | `2026-09-27 00:00:00+00` |
| `payload->>'dataDisponibilizacao'` | `2026-09-27` |
| `submitted_at` | `2026-09-28 02:12:58.179+00` |

A data civil foi persistida corretamente como 27/09. O instante técnico de registro corresponde a 27/09, 23:12 em São Paulo. **Não há dado a corrigir na Production nem necessidade de migração.**

## Causa e correção

| Fronteira | Evidência corrente |
| --- | --- |
| Persistência | O SQL acima confirma o registro real. `tests/unit/pendency-availability-roundtrip.test.js` e `supabase/tests/database/pendency-attempt-availability.test.sql` cobrem o contrato que separa `available_at` de `submitted_at`; o teste SQL não foi reexecutado nesta rodada. |
| Adaptador / bridge | `legacy-state-adapter.js` grava `dataDisponibilizacao` em `available_at`; `state-bridge.js` restaura `dateOnly(attempt.available_at)` como `dataDisponibilizacao`. |
| Domínio e view model | `RadarPendencias.registerCorrectiveSubmission` copia a string civil recebida e mantém `dataRegistro` separado. `buildPendencyRecords` não converte `dataDisponibilizacao`. O E2E inspeciona `2026-09-27` nas duas camadas antes de abrir o drawer. |
| Apresentação | `renderAttempts` passa `attempt.dataDisponibilizacao` a `formatDate`. `new Date('2026-09-27').toLocaleDateString('pt-BR')` interpretava meia-noite UTC e exibia 26/09 em São Paulo. |

O teste E2E foi executado em RED antes da alteração: esperava `27/09/2026` no drawer renderizado e recebeu `26/09/2026`. A correção usa `timeZone: 'UTC'` **somente para a string civil exata `YYYY-MM-DD`** em `formatDate`; timestamps continuam formatados no fuso local. O mesmo E2E controla um registro em `2026-09-28T01:00:00Z` e exige `27/09/2026, 22:00` para impedir que a correção desloque o horário técnico.

## Verificação do candidato

| Verificação | Resultado |
| --- | --- |
| Regressão de data civil e teste adjacente de reanálise, Playwright desktop-chromium | 2 passaram |
| `pendency-availability-roundtrip` e `pendency-surface-polish`, unitários | 9 passaram |
| `task-9-pendencias.spec.js` e `task-9-cross-view.spec.js`, Playwright desktop-chromium | 8 passaram; 1 teste exclusivo de mobile ignorado pelo projeto desktop |
| `node --check src/integration/task-9-pendencias-page.js` | passou |
| `npm run lint:e2e` | passou sem erros; 186 warnings preexistentes no repositório |

[Screenshot do teste renderizado](availability-date-green.png): o evento mostra `27/09/2026, 22:00`. A asserção de DOM comprova `27/09/2026` na tentativa, mas a captura de 1280 × 720 também confirma que o bloco da tentativa é cortado à direita no drawer desktop. Portanto, **a correção funcional de data está GREEN, mas a aceitação visual humana completa desta superfície permanece parcial por PROD-UX-08**. A correção do recorte pertence à frente separada prevista no handoff; esta branch não altera o layout.

Os resultados acima pertencem à validação do candidato. A confirmação posterior em Production está registrada a seguir.

## Encerramento em Production

- PR funcional: [#392](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/392), candidato `620654343d5ae897a6852820a39210afbee80068`.
- CI do candidato: **28 checks concluídos: 26 aprovados e 2 ignorados, sem falhas ou pendências**. Os dois status contexts da Vercel não entram nessa contagem de check runs.
- Merge: `8284a02faf3d9381ad42e66b6d93677d396e8515`.
- Deployment: `dpl_F8BVw5Js5v1HCcykq3NwBXa6SHzK`, `READY`, target `production`, com o alias oficial `https://radarpdde-fix.vercel.app`.
- Manifesto do alias: mesmo SHA, `vercelEnvironment=production`, `runtimeEnvironment=production`, `dataMode=supabase-production`, repositório Supabase e ativação Production habilitados.
- Smoke com `--expected-commit 8284a02faf3d9381ad42e66b6d93677d396e8515`: aprovado; 50 assets válidos; RLS anônima `blocked-401`.
- Workflows pós-merge no mesmo SHA concluídos com sucesso, incluindo homologação Supabase Production, smoke autenticado de leitura, integridade dos dados, monitoramento, validação geral, Supabase readiness, regressão visual, Lighthouse e CodeQL.

A aba autenticada foi recarregada após a publicação. A consulta usou a mesma Pendência `pend-699702ea-480f-4703-bd98-9de990237f35`, sem criar tentativa, editar, enviar ou reanalisar. O drawer manteve **Tentativa 1 / Analisada**, **Disponibilização 27/09/2026**, **Registro 27/09/2026, 23:12**, resultado `arquivo_indisponivel` e Pendência **Aberta**, sob responsabilidade da Escola.

Evidências abertas e inspecionadas:

- [Data civil e instante técnico legíveis na largura de 880 px](production-date-confirmed-880.png).
- [Composição desktop ainda recortada, roteada como PROD-UX-08](production-desktop-clipping.png).
- [Observação textual da UI e identificação do registro](production-observation.json).

**Leitura outside-in:** o operador está nos detalhes de Notas Fiscais da unidade Cardeal Câmara, competência Agosto/2026, PDDE Básico. A tentativa informa disponibilização em 27/09 e registro no mesmo dia às 23:12; a linha do tempo é coerente com esse instante. O registro continua pedindo correção/entrega do documento porque o ciclo sintético anterior não recebeu arquivo fiscal real. A data está confirmada no ambiente publicado; a composição desktop continua pendente por PROD-UX-08.

**Limite da ferramenta de navegação:** o acionamento por coordenadas/locators não convergiu durante a consulta e chegou a abrir um diálogo de cancelamento, que foi dispensado sem confirmação. A leitura foi concluída acionando os botões de consulta da própria página via CDP e capturando a superfície renderizada diretamente. Nenhum dado de negócio foi gravado. O viewport temporário foi restaurado ao final.

O Preview do candidato não foi publicado: o `Ignored Build Step` retornou `0` e cancelou `dpl_34J5nKjqyrCgs3RsqCqkwJN46wMr`. A evidência Production acima substitui a pendência de validação pós-publicação; não transforma aquele Preview em validado.

**Próxima frente:** [PROD-UX-08 — composição do drawer global](../../handoff/2026-09-28-prod-ux-08-drawer-clipping.md), separada da correção da data.
