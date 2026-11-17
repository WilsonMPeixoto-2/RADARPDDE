# Relatório Consolidado: Sincronização `20409c1`, Diagnóstico Causal do Dependabot e Ordem de Execução Aprovada

- **Versão:** 3
- **Status da Informação:** Sincronizado com `fix/prontuario-integrado-validado-20261115@20409c1`
- **Data de Corte:** 16/11/2026 (22:25 BRT)
- **Unidade Responsável:** Engenharia e Auditoria Técnica — RADAR PDDE (4ª CRE / SME-RJ)
- **Fonte Principal:** `fix/prontuario-integrado-validado-20261115@20409c1`, CI Runs `43864109099` (`#518`) e `43864153266` (`#520`)

## Síntese Executiva

- **Tese Central:** A branch `audit/gemini-revisao-critica-e-sugestoes-20261115` incorpora integralmente os 95 commits de `fix/prontuario-integrado-validado-20261115@20409c1`, documenta a causa exata das reprovações nos PRs do Dependabot (`tests/unit/tooling-contract.test.js` e `tests/unit/supabase-modernization.test.js`) e fixa a prioridade na homologação local de T1–T3 via Docker antes de T4/T5 e de qualquer manutenção de pacotes.
- **Contexto:** Na versão anterior (`7d6629a`), o arquivo versionado continha apenas um resumo sintético e atribuía genericamente as falhas do Dependabot a `check:generated` / `audit:inventory`, quando a causa imediata nos logs de CI são asserções de versão fixadas nos testes de contrato de ferramentas.
- **Achado Principal:** Os PRs `#518` (`prettier`), `#519` (`knip`), `#520` (`msw`), `#521` (`puppeteer-core`) e `#511` (`supabase` CLI) falham nos testes unitários porque `tooling-contract.test.js` e `supabase-modernization.test.js` cobram versões literais (`3.9.10`, `6.44.1`, `3.0.4`, `25.16.0`, `2.122.0`); além disso, o `msw` já possui a versão `3.0.6` e o PR `#502` (`lighthouse@13.6.0`) apresenta falhas adicionais de segurança de dependências.
- **Direção Proposta:** (1) Homologar T1–T3 no Docker local sem alterar dependências; (2) Corrigir eventuais defeitos comprovados nos testes reais; (3) Avançar para T4 e T5 sobre a base validada; (4) Preparar upgrades menores em branch separada e em commits individuais por pacote com seus contratos de versão atualizados.

## 1. Confirmação da Incorporação Integral (`20409c1`)

- **Branch de integração base:** `fix/prontuario-integrado-validado-20261115` (`HEAD 20409c1`, 95 commits à frente e 1 atrás de `main@4011a2b8`).
- **Escopo incorporado:** Código candidato completo de T1, T2 e T3 (incluindo os 6 reparos pós-`e26058b` reconciliados em 16/11/2026 e as 74 asserções `pgTAP` preparadas em `supabase/tests/database/operational-correction.test.sql`).

## 2. Causa Raiz Comprovada das Reprovações nos PRs do Dependabot

A verificação direta dos logs de CI (`actions/runs/43864109099` no PR `#518` e `actions/runs/43864153266` no PR `#520`) corrige a hipótese anterior baseada apenas nos nomes dos scripts de `package.json`:

| Pull Request | Pacote | Divergência Literal Comprovada nos Testes (`tooling-contract.test.js` / `supabase-modernization.test.js`) | Observações Adicionais de CI e Versão |
| :--- | :--- | :--- | :--- |
| **PR #518** | `prettier` | `3.10.1` vs. `3.9.10` esperado no teste | Falha de contrato de versão unitário; não comprova regressão funcional da biblioteca. |
| **PR #519** | `knip` | `6.45.1` vs. `6.44.1` esperado no teste | Falha de contrato de versão unitário. |
| **PR #520** | `msw` | `3.0.5` vs. `3.0.4` esperado no teste | O pacote já possui a versão **`3.0.6`** no npm (`14/11/2026`), devendo o PR `3.0.5` ser reavaliado em favor da `3.0.6`. |
| **PR #521** | `puppeteer-core` | `25.17.0` vs. `25.16.0` esperado no teste | Falha de contrato de versão unitário. |
| **PR #511** | `supabase` CLI | `3.1.0` vs. `2.122.0` esperado em `supabase-modernization.test.js` | Mudança *Major* (`v2 -> v3`); não deve ser misturada à homologação Docker de T1–T3. |
| **PR #502** | `lighthouse` | `13.6.0` vs. `13.5.0` | Além do contrato de versão, apresenta reprovações nos gates `Dependency Review` e `Saúde das dependências`. |

**Regra de governança para manutenção de pacotes:**
- Nunca agrupar 5 bibliotecas distintas em um único commit: aplicar em **branch separada** e em **commits individuais por pacote** (ou família estritamente relacionada), atualizando o respectivo contrato em `tooling-contract.test.js` / `supabase-modernization.test.js` para facilitar localização de regressões e `git revert`.

## 3. Fronteiras Técnicas de `Ajv`, `fast-check` e `@axe-core/playwright`

Sem instalar novos pacotes (`zod`, bibliotecas de PDF ou UI), o uso das ferramentas já presentes em `devDependencies` deve respeitar estritamente os seguintes limites:

1. **`Ajv` (`8.20.0`):** Valida a estrutura sintática de requisições e respostas JSON, mas **não substitui** a validação transacional no PostgreSQL (autorização/RLS, integridade referencial, `row_version` concorrente e efeitos causais nas RPCs de T2–T5).
2. **`fast-check` (`4.10.2`):** Excelente para gerar sequências de operações e testar invariantes em memória no JavaScript, mas **não comprova por si só** o comportamento real das RPCs; deve ser complementado por `pgTAP` e testes autenticados no Supabase descartável em Docker.
3. **`@axe-core/playwright` (`4.14.0`):** Útil para checagem automatizada de contraste e atributos ARIA em diferentes estados das telas, mas **não substitui** a inspeção visual humana de legibilidade, composição e hierarquia informacional.

## 4. Sequência de Execução Aprovada

1. **Prioridade 1 — Homologar T1–T3 no Docker Local (`B2` / `B1`) sem atualizar dependências:**
   - Executar as **74 asserções `pgTAP`** no PostgreSQL 17 local via Docker e os testes Playwright E2E autenticados comprovando autorização, concorrência, rollback e persistência pós-reload (`F5`), além da validação navegada pelo proprietário (`http://127.0.0.1:4179` / `localhost`).
2. **Prioridade 2 — Corrigir eventuais defeitos comprovados pelos testes reais**, preservando a arquitetura e as regras aprovadas.
3. **Prioridade 3 — Implementar T4 e T5 somente sobre a base T1–T3 validada:**
   - **T4:** Edição pós-consolidação da bonificação com status *"Alterações pendentes de consolidação"* e botão *"Consolidar alterações"*, além de `delete_context` / `clear_item_history`.
   - **T5:** Implementação SQL e UI na gaveta de Pendências, Contatos e Inventário (`delete_attempt`, `delete_review`, `delete_contact`, `correct_inventory`).
4. **Prioridade 4 — Preparar em branch separada os upgrades menores de pacotes** (em commits separados por pacote, avaliando `msw@3.0.6` e atualizando `tooling-contract.test.js`).
5. **Prioridade 5 — Integrar os upgrades somente após homologação específica** e reconciliação com a branch funcional vigente.
