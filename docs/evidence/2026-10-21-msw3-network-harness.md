# MSW 3.0.3 — preservação do harness de falhas remotas

Classe: evidência datada de manutenção, não regra funcional nem handoff corrente.
Base: `main@c480e2445e1ddbdbe91369dfb7f1182a7d73a944`.
PR existente #443, candidato original do Dependabot
`a9c57e8e8e4034b3bad1a8e721ee50320500232d`, reconciliado sobre essa main.

## Objetivo e compatibilidade real

Atualizar MSW **2.15.0 → 3.0.3** sem enfraquecer as garantias dos testes de falha
de persistência. O único consumidor encontrado é
`tests/unit/msw-remote-failures.test.js`; não há worker de navegador, cookies,
GraphQL, WebSocket, React Native ou fake timers nesse consumidor.

Fontes primárias:

- [Guia 2.x → 3.x](https://mswjs.io/docs/migrations/2.x-to-3.x).
- [Anúncio da major](https://mswjs.io/blog/introducing-msw-3.0).
- [Release 3.0.0](https://github.com/mswjs/msw/releases/tag/v3.0.0)
  e [3.0.3](https://github.com/mswjs/msw/releases/tag/v3.0.3).
- Manifesto/tarball publicado no npm, conferido também na instalação real.

O pacote exige **Node >=22.12.0**, compatível com Node 24; TypeScript mínimo 5.9
é compatível com a versão canônica 7.0.2. ESM-only não exige converter o projeto:
o consumidor CommonJS já usava `import()` dinâmico. `http`, `HttpResponse`,
`delay` e `passthrough` permanecem exportados na raiz por compatibilidade nesta
major; `setupServer`, `use`, `resetHandlers` e `close` permanecem em `msw/node`.

## Causa da adaptação necessária

`server.listen({ onUnhandledRequest: 'error' })` perde efeito em MSW 3:
o código instalado lê apenas `options?.onUnhandledFrame ?? "warn"`.
Uma troca só de pacote/lock pode manter os quatro testes existentes verdes,
mas permitir tráfego real não previsto pelo harness.

A implementação muda somente a chave para `onUnhandledFrame: 'error'`, mantendo
os handlers e as asserções originais sobre erro 500, timeout, conflito e resposta
autoritativa incompleta. Nenhum serviço do RADAR foi alterado para aceitar a ferramenta.

## Prova causal, sem falso positivo de DNS

Foi adicionada uma sonda ao mesmo arquivo de teste:

1. Um servidor HTTP real escuta porta efêmera em `127.0.0.1`.
2. Um handler explícito de passthrough permite um controle HTTP 200 e confirma
   uma requisição recebida: o transporte está efetivamente disponível.
3. Os handlers são removidos; a mesma URL deve ser rejeitada pelo MSW e a
   contagem do servidor deve continuar em um, ou seja, **zero requisições
   adicionais sem handler chegam ao transporte**.
4. O servidor e suas conexões são encerrados em `finally`.

Não usa `radar.test` como prova negativa: um erro de DNS poderia produzir uma
rejeição falsa. Não usa Production, proxy modificado ou serviço externo.

| Estado | Resultado observado |
| --- | --- |
| Baseline original, MSW 2.15.0 | 4/4 cenários aprovados |
| Nova sonda com MSW 2.15.0 | 5/5; controle acessível, tráfego sem handler bloqueado |
| MSW 3.0.3, chave antiga | exit 1, **4 aprovados/1 falha**, `Missing expected rejection`; log warn |
| MSW 3.0.3, `onUnhandledFrame` | exit 0, **5/5**, tráfego sem handler bloqueado |

O RED pertence à compatibilidade do harness, não a uma regressão do produto.
O teste da sonda permanece como proteção contra futuras migrações silenciosas.

## Instalação, lock e segurança

Linux, Node **24.19.0**, npm **11.9.0**. `npm ci` limpo executado depois da
normalização final do lock. MSW 3 não possui `postinstall`; a entrada obsoleta
`allowScripts["msw@2.15.0"]=false` foi removida, sem habilitar nenhum script novo.
A autorização existente do esbuild permanece.

Diff semântico do lock, além da versão na raiz: **14 nós adicionados, 5 alterados,
8 removidos**, todos da cadeia MSW/interceptores/parsers de URL/CLI e seus tipos.
Oito objetos opcionais do parser Knip tinham apenas a ordem de propriedades
alterada pelo bot; foram restaurados byte a byte da base. Nenhum metadado de
plataforma, fonte de produto ou nó de dependência de runtime foi modificado.

## Verificação local da árvore integrada

- `test:readiness`: **1.369 unitários + 8 integrações**, zero falhas/ignorados.
- Contratos de tooling existentes: **13/13**, sem mudanças nas asserções.
- Arquitetura: **191 módulos/276 dependências**, zero violações.
- Lint de código/E2E/CSS, tipos, gerados, matrizes e auditoria estrutural aprovados.
- `analyze:unused`: exit 0, sem achados.
- Audit runtime: zero vulnerabilidades; relatório completo mantém seis registros
  high da cadeia já conhecida braces/Stylelint, aprovados pela política estrita
  existente. Nenhum advisory novo foi aceito nem regra de segurança relaxada.

Logs locais em `/workspace/scratch/msw3-20261021/`; resumos e hashes duráveis:

| Log | SHA-256 |
| --- | --- |
| baseline-network.log | `d18a5ddb17e00dc5edcd821d006cbb4f87aa0ffa51591995ba8a15fbb87f2075` |
| msw3-unadapted-red.log | `5196c4bf4fdf7435778997ca9dbb83a7567c5f163219bfbffd3518486975fedf` |
| msw3-green.log | `62de9da8dabb1d0baaeaf817136410234f1c0cc75d9bd7328ac413946782682e` |

## Fronteira de conclusão

Os resultados locais e os runs antigos do Dependabot não certificam o HEAD
final. A CI, o SHA do merge, a publicação e eventuais ocorrências ficam no
próprio #443 e no checkpoint de encerramento. Não repetir suítes extensas apenas
para acrescentar resultados documentais posteriores.

CLI Supabase 2.114.0 e paridade de grants permanecem separados. Tipos Node 26
não são upgrade apropriado para runtime 24. As demais dependências diretas
estavam em latest compatível na consulta de 21/10. Nenhuma alteração de schema,
RLS, dados institucionais, regras de negócio ou observabilidade faz parte desta
migração. Não alegar ganho de fluidez nem encerrar a #460 por causa de CI verde.
