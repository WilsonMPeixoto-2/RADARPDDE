# PROD-FUNC-09 — data civil da tentativa no drawer global

**Estado:** investigação com RED reproduzido; correção ainda não aplicada.  
**Baseline:** `main@aa9f951dca95eb49740816869253d91e667e157d` (PR #391 integrado).  
**Branch de trabalho:** `fix/prod-func-09-date-display-2026-09-28`.  
**Ambiente:** Windows, Node 24.19.0, npm 11.17.0, Playwright desktop-chromium em `America/Sao_Paulo`.  
**Production nesta rodada:** somente leitura; nenhuma nova mutação.

## Fato humano observado

No ciclo sintético autorizado e documentado na branch histórica `audit/post-abc-expense-baseline-2026-09-27`, o operador informou `27/09/2026` como data de disponibilização. O diálogo de reanálise mostrou `2026-09-27`; após reload, o drawer global de Pendências mostrou `26/09/2026` em **Tentativas de envio**. A linha do tempo dos eventos continuou em `27/09/2026`. O registro é `pend-699702ea-480f-4703-bd98-9de990237f35`, invoice `nota-82b17b35-971e-49d9-85a5-d4e0e2c55065`.

## Rastreio de camadas até o RED

| Fronteira | Evidência corrente |
| --- | --- |
| Persistência canônica | `tests/unit/pendency-availability-roundtrip.test.js` exige `available_at` distinto de `submitted_at` e restauração da data civil; `supabase/tests/database/pendency-attempt-availability.test.sql` verifica o mesmo contrato na RPC/coluna. São provas de contrato, ainda sem leitura SQL direta do registro de Production. O app Supabase conectado não listou projetos nesta sessão. |
| Adaptador / bridge | `legacy-state-adapter.js` grava `dataDisponibilizacao` em `available_at`; `state-bridge.js` restaura `dateOnly(attempt.available_at)` como `dataDisponibilizacao`. |
| Domínio | `RadarPendencias.registerCorrectiveSubmission` copia a string civil recebida para a tentativa e mantém `dataRegistro` separado. |
| View model | `buildPendencyRecords` copia as tentativas sem converter `dataDisponibilizacao`. A regressão acrescentada em `pendency-cycle.spec.js` inspeciona `2026-09-27` em domínio e projeção antes de abrir o drawer. |
| Apresentação | `renderAttempts` passa `attempt.dataDisponibilizacao` a `formatDate`. Este executa `new Date(value).toLocaleDateString('pt-BR')`; para date-only, o instante UTC pode cair no dia anterior em `America/Sao_Paulo`. |

**RED reproduzido:** `npx playwright test tests/e2e/pendency-cycle.spec.js --project=desktop-chromium --workers=1 -g 'mostra o dia informado de disponibilização'` falhou com `Expected: 27/09/2026; Received: 26/09/2026`. A falha ocorre na interface renderizada, não em uma asserção sobre a implementação. O teste também preservará a contraprova do instante técnico de registro (`2026-09-27T12:00:00Z` → `09:00` local).

**Próximo passo exato:** confirmar a trilha do registro remoto por meio de leitura autorizada, se a conexão permitir, ou registrar a limitação; concluir a classificação causal; aplicar a menor correção de formatação somente para date-only; executar GREEN, round-trip, regressões relacionadas e leitura humana outside-in do drawer renderizado. `PROD-UX-08` continua separado.
