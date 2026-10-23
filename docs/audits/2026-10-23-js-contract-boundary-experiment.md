# TypeScript: fronteira de identidade com consumidor fiscal real

**Classe:** experimento datado, isolado; não configura gate da main.
**Data:** 23/10/2026. **Base:** `f95b7d7ad3d9589cd616b2b052931df586755e69`.
**Branch:** `experiment/js-contract-boundary-20261023`.

## Pergunta e limite

O experimento A4 já mostrou uma incompatibilidade numa chamada real, mas a
baseline válida reprovava. Esta continuação verifica se uma fronteira útil pode
aprovar o código válido e detectar quebra real de interface, sem reescrever o
serviço nem inventar uma restrição de runtime sobre o prefixo da identidade.

São verificados `operation-key.js` e `invoice-service.js`. `checkJs: false` na
configuração e `// @ts-check` nesses arquivos limitam a checagem de corpos JS aos
arquivos selecionados; módulos importados continuam fornecendo informações de
tipos, sem transformar toda a árvore em alvo. Mantidos `strict: true`,
`noImplicitAny: false` e `skipLibCheck: true`. Isso é adoção gradual, não tipagem
integral dos dados fiscais ou eliminação de `any` em todos os módulos.

Usa a capacidade existente de JSDoc/checkJs com o compilador instalado
TypeScript **7.0.2**, Node **24.19.0**. Não atribuir a criação dessa capacidade
à versão 7 nem os benchmarks do fornecedor ao RADAR.

## Causa dos diagnósticos e adaptação

1. Somente selecionar os dois arquivos com `@ts-check`, antes de novas anotações,
   produziu **32 TS2345**. Todos vinham de `fail(..., details = null)`: o compilador
   inferia `details` como `null | undefined`, embora os callers existentes
   deliberadamente passem objetos de contexto ao erro.
2. Documentar `details` como `Record<string, unknown> | null`, os parâmetros
   textuais e o retorno `never` descreve o comportamento existente: a função
   sempre lança `RepositoryError`. Não altera lógica, diagnóstico ou payload.
3. O argumento `operationKey` da factory fiscal recebe o tipo do **módulo real**
   por `typeof import('../domain/operation-key.js')`. Assim a interface deixa de
   se perder como `any` na injeção via IIFE.
4. O módulo de chaves documenta entradas normalizadas como `unknown`, retorno
   `string` e a fonte criptográfica opcional. Preserva a coerção existente de
   prefixos: não declara artificialmente que `123` seja rejeitado em runtime.

Nenhum `@ts-ignore`, `@ts-nocheck` ou corpo executável foi introduzido. Não
desligamos `strictNullChecks` nem removemos a verificação dos arquivos escolhidos.

## Contraprova no consumidor efetivo

| Estado                                                                                                                          | Resultado                                                    |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Código válido, configuração delimitada e anotações                                                                              | `tsc` exit **0**, nenhum diagnóstico                         |
| Na atribuição real de `invoiceId`, trocar `operationKey.persistentId('nota', key)` por `operationKey.persistentID('nota', key)` | exit **1**, **TS2551** no InvoiceService: método inexistente |
| A mesma chamada inválida, retirando somente a ligação tipada da factory                                                         | exit **0**: demonstra a lacuna anterior de injeção sem tipo  |
| Fonte restaurada em `finally`                                                                                                   | exit **0** novamente; mutações não foram commitadas          |

A chamada inválida produziria acesso a método inexistente, diferente da antiga
sonda com prefixo numérico, que só violava o tipo escolhido. Esta prova verifica
a sensibilidade da fronteira de tipos; não relata um bug existente no produto.

## Regressões e equivalência

- **7/7 testes existentes** aprovados: `operation-key.test.js`,
  `invoice-idempotency.test.js`, `invoice-idempotency-repository.test.js`.
- Sintaxe dos dois arquivos e `git diff --check` aprovados.
- Acorn comparou as ASTs contra a main-base, removendo somente posições de fonte.
  **ASTs idênticas**: o diff JavaScript contém apenas comentários/JSDoc.
- SHA-256 da AST normalizada de `operation-key.js`:
  `4b49463e310d19bb3522890a3e4a029c28f91d053211f85e821df079dec977d8`.
- SHA-256 da AST normalizada de `invoice-service.js`:
  `fc64c5f2599004a7db3dfc03219ffc7cc33bf5fa8d5d3c7380a003696ad0b6d7`.

Os hashes demonstram ausência de mudança executável nesta intervenção; não
devem virar golden que impeça mudanças funcionais legítimas no futuro.

Reprodução do código válido:

```sh
node_modules/.bin/tsc -p tsconfig.js-contract-boundary.json --pretty false
node --test tests/unit/operation-key.test.js tests/unit/invoice-idempotency.test.js tests/unit/invoice-idempotency-repository.test.js
```

## Decisão de continuidade

Há fundamento para propor uma proteção limitada da interface de identidade,
com esse consumidor fiscal real. O piloto não está integrado, não modifica
`package.json`, não participa de `test:readiness` e não recebeu CI própria nesta
branch. Não tratá-lo como gate já publicado.

Antes da promoção: revisar os contratos normalizados, manter a sensibilidade à
chamada real inválida, decidir o comando/gate proporcional e certificar o diff
da proposta. Não ampliar para todos os serviços ou corrigir avisos alheios em
cadeia. SQL, RLS, RPCs, regras, UI, vendor e Production não foram alterados.

Fontes do mecanismo: [verificação de JavaScript](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html),
[JSDoc suportado](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html).
Evidência A4 anterior: [run 39901370296](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901370296).
