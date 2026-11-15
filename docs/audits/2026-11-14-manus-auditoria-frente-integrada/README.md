# Auditoria independente da frente integrada do Prontuário — Manus

**Autoria:** agente Manus (auditoria independente solicitada pelo proprietário em 14/11/2026, 23:08 BRT).
**Classe documental:** auditoria datada. Não é regra funcional canônica, não é handoff de execução e não altera o plano aprovado.
**Escopo:** tudo o que foi versionado no remoto entre 12/11 00:00 e 14/11 23:30 BRT, com foco na frente integrada (plano T0–T6 do Astra, contribuições do Gemini e implementação do Gemini Argon).
**SHAs auditados:** `main` = `4011a2b8`; `feat/prontuario-correcao-integrada-20261114` = `4c0c1725`.
**Restrições respeitadas:** nenhuma alteração em `main`, no Supabase ou na Vercel. Produção consultada só em leitura. Os testes de banco rodaram num PostgreSQL 17 descartável, montado a partir das migrations do repositório.

> **Atualização 15/11 00:35:** ver [ADENDO-2026-11-15.md](ADENDO-2026-11-15.md) (testes remotos, sugestões de código na branch `audit/manus-sugestoes-correcao-20261114` e guia de continuidade).

## Estado deste pacote

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Este índice e o resumo dos achados |
| `RELATORIO.md` | Relatório completo, com a análise por etapa, as regras de negócio e as recomendações (publicado no checkpoint seguinte) |
| `evidencias/sondas-banco/` | Script das sondas comportamentais das RPCs (`probe_argon_rpcs.sql`), saída (`probe_result.txt`), bootstrap mínimo do Supabase, scripts de aplicação e execução pgTAP, e comparação pgTAP main × branch |
| `evidencias/testes/` | Saídas reais de `node --test` (suíte nova do Argon, `prontuario-program-order` na main e na branch, `test:unit` completo), gates estáticos e falhas do E2E T1 com captura de tela |
| `evidencias/inventario/` | Os 48 commits remotos do período, com data e branches que os contêm |

## Resumo dos achados verificados

1. **Produção está intacta.** A Vercel de produção serve `4011a2b8` (PR #517, só documentação). O Supabase de produção tem 62 migrations, e a última é `20261024120000_quality_provisional_movements`. A migration `20261114000100` do Argon **não** foi aplicada. Os Previews da branch aparecem como `CANCELED` por regra do `vercel.json` (`ignoreCommand` pula toda branch diferente de `main`), não por falha.
2. **O estágio real não é o fim da T3.** Pelo próprio handoff do Argon, T0 e T1 estão concluídas, T2 está em curso e T3, T4 e T6 nem começaram. A verificação mostra menos do que isso: o fixture T0 é aproveitável, mas a T1 não cumpre o gate e a T2 não funciona.
3. **O código T1 do Astra nunca chegou ao remoto.** Na última sessão (14/11, 19:52–20:08), o Astra implementou o cabeçalho horizontal por programa em `app.js`, com o `getProgramGroups` reescrito e um E2E sobre o app real. Esse trabalho ficou no contêiner do ChatGPT e não teve push. O que o Astra deixou no remoto no período é documentação: 13 commits e o PR #517.
4. **Migration do Argon (`55001ccd`) — crítico de segurança (sondas P1 e P2).** As funções `preview/apply_operational_change` são `SECURITY DEFINER` e não verificam autenticação, perfil nem escola. Elas também não fazem o `revoke`/`grant` que o repositório usa como padrão. No banco descartável, uma chamada **anônima** apagou NF, Pendência, tentativa e contato de uma escola. O ledger ficou com `actor_id` nulo.
5. **A migration não cumpre o objetivo da T3 (P3).** Excluir uma NF cujo bem está Inventariada continua falhando com `ASSET_ALREADY_INVENTORIED`, porque o trigger `registered_invoices_protect_inventoried_delete` não foi ajustado. É o caso principal da flexibilização.
6. **A migration quebra ações (P4 e P5).** `clear_analysis` e `delete_context` falham com `column p.competence_id does not exist`; a coluna real é `competence_origin`.
7. **Falso sucesso e violação de invariantes (P6 a P9).** Ações inexistentes ou não implementadas devolvem `committed: true`. Reutilizar a mesma `operation_key` com outro alvo devolve o recibo antigo. `correct_analysis` apaga a Pendência e mantém a análise `Incorreto`. O `planDigest` não muda quando o valor da NF muda nem quando o bem é inventariado.
8. **Regressões no banco.** O pgTAP existente tem 3 asserções que passam na `main` e falham na branch (`inventory-terminal-state` #2 e #5, `inventory-terminal-delete` #6). A função `protect_inventoried_asset_terminal_state` foi recriada sem `search_path`.
9. **Os testes JavaScript não passam, ao contrário do relatado.** A suíte nova do Argon tem 2 de 4 testes falhando, embora ele tenha relatado "All checks have passed". O E2E T1 falha nos 2 testes e usa HTML sintético em vez do app real. O `test:unit` completo tem 7 falhas: as 2 da suíte nova e 5 regressões em `prontuario-program-order`, que passam na `main`. Como o build de produção da Vercel executa `npm run test:unit`, um merge no estado atual faria o build de produção falhar.
10. **O código novo do Argon não está ligado ao app.** `index.html` não carrega nenhum dos três módulos novos. O serviço JS não chama RPC e opera sobre um formato de estado diferente do real: as variáveis `let` de `app.js` não ficam em `window`.
11. **Regras de negócio contrárias ao que foi aprovado.** O serviço bloqueia N/A da bonificação quando há NFs válidas, o oposto da especificação (seção 5.1) e do próprio fixture do Argon. A regra de "Correto (Atrasado)" foi inventada, em vez de reutilizar `requiresLateCorrect`. O modelo de tentativas também é incompatível com `src/domain/pendencias.js`.
12. **O próximo passo anunciado pelo Argon é arriscado.** Remover agora as travas de `evaluation-retification.js` e `invoice-history-lock.js` contraria o plano, segundo o qual as guardas só saem quando a operação completa estiver disponível.

## Recomendação imediata

Não fazer merge desta branch. Não aplicar `20261114000100` em nenhum banco compartilhado. Até revisão, tratar os commits do Argon de `0405e45d` a `4c0c1725` como **rascunho não homologado**. O fixture `bf903aea` pode ser reaproveitado. Antes de prosseguir com a T2, reconstruir a T1 do Astra.

## Como reproduzir

Requisitos: Node 24, PostgreSQL 17 com pgTAP.

1. Banco: `evidencias/sondas-banco/apply.sh <worktree> <db>` aplica `bootstrap.sql` e todas as migrations.
2. pgTAP: `evidencias/sondas-banco/runtap.sh <worktree> <db> <saida>` executa a suíte.
3. Sondas: `psql -d <db> -f evidencias/sondas-banco/probe_argon_rpcs.sql`, usando dados sintéticos de uma escola fictícia (`04.99.901`, competência `2039-05`).
4. JS: `node --test tests/unit/operational-correction-service.test.js` e `node --test tests/unit/prontuario-program-order.test.js`, na branch e na `main`.

O bootstrap substitui `auth`, `realtime` e `pg_jsonschema` por stubs mínimos. As falhas pgTAP que aparecem iguais na `main` e na branch vêm dessa limitação do ambiente. Só as diferenças entre as duas foram atribuídas à migration.
