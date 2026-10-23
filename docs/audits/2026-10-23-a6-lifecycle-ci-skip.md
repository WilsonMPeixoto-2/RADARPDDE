# A6 — Primeira redução controlada de CI (ciclos Supabase)

Data: 23/10/2026. Status: **piloto validado; não integrado à main**.
Baseline reconciliada: PR [#476](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/476) **integrado à `main` por squash**, commit `8795f1e384b858e52b3ba4ca56ae54c58508161c`. O PR #477 aponta agora diretamente para `main` e mostra somente os quatro arquivos da A6.
Evidência do runner: [GitHub Actions 39903767162](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39903767162).

## Justificativa comprovada

O [PR #475](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475) acionou 18 workflows apesar de conter apenas duas ferramentas de auditoria, uma entrada opcional de script e Markdown. No conjunto final, 32 checks tiveram sucesso, 2 foram pulados e 2 falharam em jornadas não alteradas pelo PR, ainda sem diagnóstico conclusivo de causalidade. Isso fornece caso real para otimização de custo, **sem** autorizar supressão de falhas.

## Mudança restrita

Apenas o workflow `.github/workflows/functional-reliability-lifecycle.yml`, cujo job **Criar editar converter excluir avaliar e reanalisar** instala navegador, banco Supabase descartável, identidades e executa Playwright, passa a classificar o diff antes de iniciar trabalho pesado.

- O classificador usa `RADAR_CI_BASE_SHA` do evento `pull_request` e checkout com `fetch-depth: 2`; continua `full` caso a base não possa ser validada.
- A função `maySkipLifecycleForAuditDocs(report)` concede o atalho **apenas** se o diff comprovado contiver exclusivamente Markdown direto em `docs/audits/*.md` e `scope='docs-only'`. Relatórios de outras pastas, README, runbooks, código, testes, migrations, package, workflow e paths desconhecidos não se qualificam.
- `git diff --no-renames --name-only` considera todos os tipos de mudanças e mostra os dois lados de um rename para que renomear um arquivo funcional não seja interpretado como simples alteração Markdown.
- Quando elegível, **apenas este job** deixa de executar `npm ci`, instalação Chromium, pilha Supabase, autenticação e jornadas Playwright. O job mantém **o mesmo nome de check**; seu GitHub Summary registra explicitamente a decisão.
- Qualquer erro de classificação/JSON, workflow `workflow_dispatch` ou mudança fora da allowlist resulta no caminho integral. Se faltar output de classificação, as condições `!= 'false'` permanecem verdadeiras.
- O cleanup e artifact de fluxos funcionais são condicionados à execução integral para não invocar Supabase não inicializado no caminho curto.
- Os demais workflows e jobs ficam **intactos**.

## Prova executada (sem Supabase real no caminho curto)

O [run isolado A6 39903767162](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39903767162) concluiu **success**:
- 12 testes unitários da classificação passaram;
- a branch experimental com alterações de código foi corretamente identificada como `full`;
- o cenário Markdown de `docs/audits/` produziu `run_full=false` e o passo propositalmente falhante, protegido pela mesma condição `if`, foi marcado **skipped** pelo GitHub;
- o cenário contendo migration SQL produziu `run_full=true` e executou concretamente a etapa protegida, comprovada por sentinel.
- O experimento exercitou a decisão e o comportamento `if` real do runner, **não** a execução end-to-end completa do workflow original; portanto, ainda resta homologar um PR documental puro após esta mudança existir na base.

## Dependências para integração definitiva

1. O PR #476 foi integrado e reconciliado. O #475 continua separado com falhas funcionais ainda sob análise.
2. Validar integralmente os checks atuais do PR #477, agora sobre `main`, antes de decidir pelo merge.
3. Executar o job completo da A6 no PR de integração, porque a mudança toca CI/testes e corretamente exige modo `full`.
4. Após eventual merge, abrir um PR de teste contendo **somente** `docs/audits/*.md` e confirmar que o job conserva status de check bem-sucedido enquanto os passos pesados são pulados. Comparar o tempo de execução com os minutos consumidos nos runs anteriores.
5. Confirmar configuração real de branch protection (a consulta pela integração atual devolveu 403) antes de estender o mecanismo a outros workflows.

## Política de segurança e rastreabilidade

Não mudar RLS, Auth, RPCs, funcionalidades, testes E2E ou asserções para obter verde. Falhas preexistentes devem ser classificadas conforme `docs/reference/TEST_GOVERNANCE.md`. A A6 ainda **não gera economia em Production/main**, pois é um experimento em branch.
