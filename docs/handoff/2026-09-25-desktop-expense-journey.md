# Handoff corrente — jornada desktop de Despesa a identificar

**Data:** 25/09/2026
**Estado:** [PR #376](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376) draft, empilhado sobre o #375; implementação remota `a2915d2d1aadb08b128b88d4e810c082eb8923b2` (mesma árvore do commit local `606bb650`). Verificação visual desktop ainda pendente.
**Baseline:** main `bb724643` (#374) → head PR #375 `49e94a99` → branch `fix/desktop-expense-journey-2026-09-25`

## Autoridades e limite

`AGENTS.md` → `SYSTEM_CANONICAL_MODEL.md` → `PRODUCT_SURFACE_CATALOG.md` → `CURRENT_STAGE.md` → este handoff. O PR #375 (NAV-01/UX-04) está aberto, draft e requer validação do Preview pelo responsável antes de merge/Production. A continuação deve ser empilhada sobre #375, sem alterar regras, schema, RPC, serviços, mobile ou Production. A `main` ainda não contém #375 na leitura realizada.

## Matriz da auditoria Codex

| Achado | Estado e superfície |
|---|---|
| NAV-01, UX-04 | PR #375 aberto; implementação anterior preservada na base desta branch; não revisar mobile nesta frente |
| UX-01 | Ajustado em `unidentified-expense-ux.js`: cópia de retificação separada do cadastro; Pendência e histórico preservados |
| UX-02 | Contexto escolar/competência/programa no modal da despesa; modal de envio já exibia esse contexto e permanece igual |
| UX-03 | Descrição provisória como título principal da linha real `invoice-document-row` em `app.js`, rótulo de natureza pendente secundário; a decoração antiga de badges não é a superfície vigente |
| UX-05 | Prontuário: apenas Pendências ativas da escola; página Pendências: fila transversal e histórico explicitados; identidade da despesa na linha desktop |
| UX-06 | Reanálise: descrição/valor da despesa vinculada destacados acima de estado, tentativa, contexto e resultado; fallback para snapshot/item |
| D-01 | `CURRENT_STAGE.md` atualizado; `docs/README.md` e `STATUS_DOCUMENTOS.md` apontam este handoff |

## Verificações e limitações

- `node --check` dos três arquivos JS alterados, `git diff --check`, 8 testes focados e outros 12 testes de despesa/identificação: passaram.
- `npm run check`: passou. `node --test tests/unit/*.test.js`: **1126/1126 passaram** em 9,4 s.
- `npm run check:architecture`: passou (184 módulos, 258 dependências). `npm run lint:security`: passou com 42 avisos no limite configurado (nenhum erro); avisos existentes de `innerHTML` no projeto devem ser avaliados em outra frente.
- E2E Playwright desktop foi tentado e não começou: executável do Chromium ausente. `npx playwright install chromium` baixou 0 MiB e falhou por ZIP truncado. Navegador cloud conectado, mas recusou `http://127.0.0.1:4175` com `ERR_BLOCKED_BY_CLIENT`; não constitui validação visual. Necessária execução desktop em CI/Preview ou ambiente com browser funcional.
- Pendente: repetir E2E desktop dos fluxos de criação, retificação, envio e reanálise; inspecionar screenshots desktop da interface, executar checks relevantes e conferir o diff final.
- Pendente: confirmar CI do head documental final do #376; nunca declarar Preview do #375 aprovado apenas pelos testes desta branch.

## Ordem de retomada

1. Conferir `main`, PR #375 e a branch remota; atualizar esta matriz caso haja novo commit/merge.
2. Corrigir qualquer falha real nos testes E2E desktop, no contexto do modal, na listagem e na reanálise. Usar as jornadas de `tests/e2e/unidentified-expense-user-journey.spec.js`.
3. Verificar visualmente desktop, sem gastar a rodada revisando mobile.
4. Confirmar gates e atualizar evidências deste handoff; entregar PR empilhado para revisão do Preview sem publicar em Production automaticamente.
