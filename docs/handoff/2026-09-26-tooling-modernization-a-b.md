# Handoff corrente — modernização de tooling A/B

**Data:** 26/09/2026  
**Branch:** `chore/tooling-phases-a-b-2026-09-26`  
**Base:** `95d9f0a1112c506f915b3b6d37677e94b7bf7c26`  
**Production:** permanece no mesmo SHA durante a implementação.

## Objetivo

Implementar as Fases A e B aprovadas sem misturar refatoração de domínio.

### Fase A

1. Playwright MCP 0.0.82 para agentes;
2. separar Supabase SDK/CLI no Dependabot;
3. Supabase JS 2.117.2;
4. SHA imutável para Actions externas;
5. Dependency Review;
6. devEngines Node 24/npm 11.

### Fase B

7. Stylelint errors-only;
8. seis visual snapshots;
9. locks seletivos;
10. traces enriquecidos;
11. Fuse Token Search.

## Implementação

- `.mcp.json` expõe navegador isolado e `playwright-session --extension`;
- MCP não entra no package/runtime da aplicação;
- SDK 2.117.2 é usado pelo bundle web e pela Edge Function de equipe;
- CLI continua 2.114.0;
- checker de workflows bloqueia Actions externas sem SHA completo;
- Dependency Review bloqueia novas vulnerabilidades de severidade moderada ou superior;
- Stylelint Recommended mantém regras de erro e desativa apenas três regras editoriais/estruturais legadas;
- uma declaração CSS morta encontrada pelo novo gate foi removida sem alterar estilo computado;
- projeto visual dedicado roda em Chromium/Linux 1440×900, dois workers e 90 s por teste;
- seis baselines: Dashboard, Pendências, Prontuário, modal de Despesa a identificar, drawer/feedback e reanálise;
- jornada de Despesa a identificar usa lock de estado compartilhado;
- traces preservam DOM, ARIA, screen e sources;
- Fuse Token Search usa AND entre tokens e foi testado com ordem livre, typo e consulta cruzada.

## Descobertas durante implementação

1. Stylelint inicialmente reportou 293 ocorrências; 292 eram dívida editorial/precedência conhecida e o gate foi calibrado sem desativar sintaxe/propriedades/valores inválidos.
2. O único erro CSS real restante era `background-color` imediatamente anulado por `background: transparent`; declaração morta removida.
3. Baselines iniciais excederam o timeout funcional antigo; o timeout foi alterado apenas no projeto visual.
4. O aviso de sucesso de Pendência é temporário; sua geometria passou a ser lida atomicamente antes do baseline, sem alterar o produto.
5. O bundle 2.117.2 contém `AuthRefreshDiscardedError`, proteção relevante para refresh concorrente.
6. O bundle minificado pode conter whitespace final gerado; o bootstrap valida whitespace em lock/snapshots, não reescreve o artefato do bundler.\n7. `retain-on-failure-and-retries` com DOM+ARIA+screen em toda a suíte grande elevou custo e provocou timeout/session closed; a política foi ajustada para `on-first-retry` nas suítes grandes, preservando trace rico apenas quando necessário.\n8. O Dependency Review oficial exige Dependency Graph. Quando o repositório não oferece essa capacidade, o workflow executa fallback bloqueante `npm audit` + política ExcelJS e migra automaticamente ao Action nativo assim que o Graph for habilitado.

## Materialização concluída

- commit de materialização: `5c2495d1082fda11c71c7ce85e09ec1409dc62e5`;
- `package-lock.json` resolve Supabase JS `2.117.2`;
- bundle web versionado contém `2.117.2` e `AuthRefreshDiscardedError`;
- seis snapshots PNG foram gerados pelo Chromium do CI e versionados;
- workflow temporário de bootstrap foi removido pelo próprio runner;
- nenhuma configuração temporária de bootstrap permanece no candidato.

## Critérios de encerramento

- [x] lockfile regenerado em Node 24/npm 11;
- [x] bundle Supabase 2.117.2 gerado;
- [x] Edge Function alinhada na mesma versão;
- [x] seis PNGs versionados;
- [x] bootstrap temporário removido;
- [ ] unit/integration/readiness verdes no PR final;
- [ ] visual regression verde sem atualizar goldens;
- [ ] E2E desktop verde;
- [ ] Supabase pgTAP/RLS/readiness verde;
- [ ] Dependency Review e CodeQL verdes;
- [x] documentação canônica reconciliada;
- [ ] PR contra main mergeable.

## Guardrails

- não alterar schema/RLS/RPC para resolver tooling;
- não relaxar tolerância visual por conveniência;
- não atualizar golden sem revisar intenção;
- não misturar Supabase CLI com SDK;
- não adicionar Playwright MCP ao runtime;
- não publicar Production automaticamente ao concluir a branch.
