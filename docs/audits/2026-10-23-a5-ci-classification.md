# A5 — Classificação de impacto da CI: diagnóstico e piloto isolado

**Data:** 23/10/2026. **Estado:** experimento de branch, sem PR e sem alteração dos workflows oficiais da `main`.

## Motivação observada

O [PR #475](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475), que contém apenas duas ferramentas de diagnóstico Knip, um script novo no `package.json` e um guia Markdown, acionou **18 workflows** e publicou **34 checks** nos minutos iniciais. Alguns executam bancos descartáveis, Playwright, migrações, Excel e comparações entre sistemas operacionais, apesar de a diferença de `package.json` ser somente a inclusão de um comando opcional.

Isso **não significa** que cada check seja dispensável em qualquer PR. Demonstra que o filtro puramente por nome de arquivo não distingue mudança de dependência, build, runtime ou script de diagnóstico.

## Risco obrigatório de governança

A documentação oficial do GitHub estabelece que **pular um workflow inteiro por filtro de caminhos pode manter check obrigatório pendente**, bloqueando merges. Em contraste, um job que é pulado por condição costuma reportar conclusão compatível com checks obrigatórios. Isso não substitui a verificação concreta das regras de proteção do repositório. Fontes:
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions

A integração GitHub atual retornou HTTP 403 à consulta de branch protection. Portanto, **não estão autorizados nesta etapa**: edição em massa dos triggers, remoção de required checks ou alterações de gates de Supabase/segurança.

## Piloto

`scripts/ci/classify-pr-impact.mjs` contém um classificador *fail closed*:

- `docs-only`: unicamente arquivos Markdown em `docs/` ou Markdown raiz explicitamente autorizado.
- `tooling-only`: diagnósticos Knip explicitamente permitidos e, se houver `package.json`, **apenas** a inclusão exata do comando `analyze:unused:deep`, verificada comparando JSON anterior e posterior.
- `full`: qualquer diff vazio, não interpretável, mudança de dependência, outra alteração em `package.json`, workflow, teste, fixture, runtime, SQL, RLS ou arquivo desconhecido.

O modo CLI calcula o merge-base entre `HEAD` e `origin/main`, extrai os arquivos alterados e compara as duas versões do `package.json`. Qualquer erro em Git ou ausência de contexto retorna `full`.

Os testes unitários em `tests/unit/ci-impact-classification.test.js` cobrem os casos positivos e negativos. A branch possui uma execução própria com `push` e não depende de novo PR nem muda os checks existentes.

**Limite essencial:** o classificador ainda não aciona nem pula qualquer job; classificar como `tooling-only` não significa homologação suficiente. Antes de integrar, seria preciso ligar o resultado a uma política de gates aprovada, registrar required checks e testar PRs históricos contra os mesmos resultados.

## Próxima decisão

1. Validar o classificador no runner real e confrontá-lo com amostras dos PRs anteriores.
2. Acessar required checks com permissão apropriada antes de editar workflows.
3. Selecionar um **único** workflow para piloto de skip por job mantendo check estável. Confirmar que casos de alterações SQL, runtime e package-lock mantêm homologação completa e que não há bypass de Auth/RLS.
4. Avaliar ganho de tempo e custo, sem criar regressões ou loops de CI.

**Nenhum arquivo do produto, banco, autenticação ou Production é alterado pela A5.**
