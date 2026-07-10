# Task 2: Fluxo de Nota Fiscal e consolidação

## Escopo

- Base aprovada: `d38d93f` (`fix: consolidar indicadores SME por escola`).
- Implementação restrita ao fluxo de verificação, Nota Fiscal e consolidação.
- Vínculos estruturados de pendências não foram alterados; permanecem reservados à Task 3.

## RED 1: contrato de domínio

O arquivo `tests/fluxo-operacional.test.js` foi criado antes do módulo de produção, cobrindo:

- estrutura completa da primeira verificação;
- bonificação apta, inapta e incompleta;
- proibição de `Não se aplica` nos três documentos obrigatórios;
- situação operacional vazia, parcial, apta e inapta;
- permissão de cadastrar NF por perfil e entrega;
- exigência de nota ao tentar concluir a análise.

Comando:

```text
node --test tests/fluxo-operacional.test.js
```

Resultado esperado observado: exit code `1`, com `MODULE_NOT_FOUND` para
`../src/domain/fluxo-operacional.js`.

## GREEN 1: módulo UMD

Foi criado `src/domain/fluxo-operacional.js`, exposto em CommonJS e em
`window.RadarFluxoOperacional`, com:

- `DOCUMENT_KEYS`;
- `createEmptyVerification`;
- `evaluateBonification`;
- `getProgramOperationalStatus`;
- `canRegisterFiscalNote`;
- `shouldRequireFiscalNote`.

O mesmo comando passou com `9/9` testes.

## RED 2: fluxos desktop

Antes de alterar `app.js`, foram adicionados três cenários ao Playwright:

1. Abrir o prontuário sem criar verificação e cadastrar a primeira NF antes da análise correta.
2. Cadastrar/renderizar nota de serviço e o controle da assessoria sem `pageerror`.
3. Recusar `N/A` com nota e bem existentes, preservando ambos e orientando exclusão individual.

Comando:

```text
npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium
```

Resultado observado: `1 passed`, `3 failed`.

- O prontuário persistia a verificação vazia durante a renderização.
- A grade não concluía a renderização da nota de serviço porque `isBonifLocked` era usado antes da declaração.
- `N/A` não apresentava a orientação e removia a nota implicitamente.

## Integração

- `index.html` carrega o novo domínio antes de `app.js`.
- A grade usa uma verificação vazia transitória; o primeiro comando materializa os seis documentos e as seis análises.
- `getProgramVerificationStatus` delega ao domínio puro e só retorna `apta` com consolidação apta e seis análises corretas.
- `Adicionar Nota` aparece para Controlador/Assistente assim que a entrega de NF fica `Sim`.
- Análise correta sem nota preserva o valor anterior, alerta e abre o modal; com nota existente, grava sem reabrir o modal.
- O reset do formulário ocorre antes de preencher escola e competência, preservando o contexto da primeira NF.
- Os bloqueios são calculados antes dos ramos de Nota Fiscal e Consulta Assessoria.
- `N/A` com notas informa os números cadastrados e não remove nota nem bem.
- Alteração consolidada pelo Assistente limpa `resultadoBonif` e registra `Consolidação Reaberta` antes da persistência final.
- A consolidação usa `evaluateBonification` e lista todos os campos ausentes ou inválidos.

## GREEN final

```text
npm run check
# exit 0

node --test tests/*.test.js
# 59 passed, 0 failed

npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium
# 4 passed, 0 failed
```

O Playwright emitiu apenas o aviso do runner sobre `NO_COLOR`/`FORCE_COLOR`; não houve falha funcional nem `pageerror` no cenário de serviço.

## Risco residual

- A validação desta tarefa foi feita no projeto `desktop-chromium`, como solicitado no brief; a matriz móvel permanece para a verificação integrada do lote.
