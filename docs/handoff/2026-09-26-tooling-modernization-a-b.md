# Registro da entrega — modernização de tooling A/B

**Data:** 26/09/2026  
**Branch:** `chore/tooling-phases-a-b-2026-09-26`  
**Base:** `95d9f0a1112c506f915b3b6d37677e94b7bf7c26`  
**Production:** baseline anterior à integração: SHA acima. Confirmar publicação posterior no PR #378.

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
6. O bundle minificado pode conter whitespace final gerado; o bootstrap valida whitespace em lock/snapshots, não reescreve o artefato do bundler.
7. `retain-on-failure-and-retries` com DOM+ARIA+screen em toda a suíte grande elevou custo e provocou timeout/session closed; a política foi ajustada para `on-first-retry` nas suítes grandes, preservando trace rico apenas quando necessário.
8. O Dependency Review oficial exige Dependency Graph. Quando o repositório não oferece essa capacidade, o workflow executa fallback bloqueante `npm audit` + política ExcelJS e migra automaticamente ao Action nativo assim que o Graph for habilitado.
9. A busca moderna expôs um ruído de índice: Programa passou a herdar centenas de nomes de escolas vinculadas e podia superar `Carteira de Escolas` em consulta com typo. O índice foi refinado para manter nomes de escola somente nos itens de escola; Programa continua pesquisável por identidade e descrição, preservando ranking intuitivo.

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
- publicação autorizada na retomada de 27/09, condicionada à matriz verde e smoke pós-deploy.


## Retomada de 27/09 — fechamento autorizado do PR #378

O usuário autorizou concluir os gates, tirar Draft, integrar e publicar após matriz verde, validar Production e registrar o encerramento. Essa autorização supera a pausa operacional anterior; não altera regras de negócio.

- Head retomado: `033bfb22c069cdeeae0b72b9c23f027cbacb9c05`; 18 workflows verdes.
- Visual `36293688040`: três cenários passaram; a jornada completa excedeu 90 s sem mismatch. A prova visual foi separada em dois estados independentes; os dois PNGs foram somente movidos, sem alteração de conteúdo/tolerância. A jornada funcional integral permanece na suíte E2E, sem dupla comparação de golden.
- Remoto `36293687905`: download ECR limitado e porta 54322 ocupada antes dos testes. Novo script exclusivo de runner GitHub descartável: cleanup do projeto antes/depois de falhas, três tentativas limitadas, preservação de imagens, diagnóstico de porta; nunca mata serviço alheio nem transforma esgotamento em sucesso.
- Verificação local: 12 contratos de tooling passaram; ESLint sem erros; shell validado; execução com executáveis de fronteira controlados comprovou recuperação na segunda tentativa, falha após três e recusa fora de github-hosted.
- Chromium desta sessão: download oficial retornou ZIP truncado; binário de sessão anterior terminou em SIGSEGV antes de abrir página. Não há prova visual local válida. A comparação canônica será executada no Chromium/Linux do CI, sem atualizar baselines.
- Próximo passo: confirmar os dois gates no novo SHA e a matriz completa. Avaliação de ferramentas visuais em andamento; nenhuma dependência de design adicionada ao runtime.


### Validação do candidato 060a6573

- Readiness local integral: 1.133 unitários e 8 integrações aprovados, além de checks estáticos, CSS, arquitetura, banco e artefatos.
- Gate remoto ultrapassou a falha original: inicialização/reset/Auth/RLS verdes; matriz de perfis em execução.
- A divisão visual evidenciou configuração herdada: `devices['Desktop Chrome']` no projeto sobrescrevia viewport global com 1280×720; os testes antigos faziam `setViewportSize`, ocultando isso. Agora o próprio projeto fixa 1440×900, confirmado pela configuração efetiva. Nenhum pixel de golden/CSS alterado.
- Avaliação de ferramentas concluída em `docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`, com metadados e prova executada de Sharp/SVGO/Lucide/fontes. Figma autenticado; Superdesign executável, mas login bloqueado pela revisão automática por envolver credenciais fora da avaliação autorizada.


### Consolidação final

Fases A/B concluídas em implementação. Visual aprovado em `5bbcff35`, run `36298032902`: 5 cenários/6 PNGs, 1,5 min, sem retries ou atualização dos goldens. O preset de projeto passou a manter 1440×900. A exclusão do spec visual também é definida no projeto funcional (configurações por projeto sobrescrevem defaults globais); `--list` comprovou 237 testes desktop funcionais sem os dois testes visuais, mantendo a jornada integral. Contratos de configuração protegem ambos os casos.

Este registro preserva a entrega e deixa de ser handoff corrente após o encerramento publicado no PR #378. O PR recebe a prova definitiva da matriz do head final, merge e deployment/smoke. Não usar os checkboxes históricos da etapa inicial como fila nova após esse encerramento.
