# Hotfix de fast-uri — advisories de 19–20/10/2026 detectados no CI

**Classe:** incidente novo de segurança e compatibilidade de dependências.  
**Fonte da detecção:** [PR #486](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/486), [workflow 40041002246](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/40041002246), job 120711816642 em 23/10. O candidato #486 alterava só o E2E de prontidão/documentação; a falha veio do **gate de advisories recém-publicados**, não de um bug evidenciado em seus testes.

## Evidência e classificação

- `npm ci`: 503 pacotes auditados, **1 vulnerabilidade moderada** reportada durante a instalação. O `npm audit --json` fresco analisado pela política do repositório identificou **3 registros de vulnerabilidade** (Ajv, fast-uri e Lighthouse) com `moderate=3, high=0, critical=0`; não somar esses registros como três causas independentes.
- `scripts/check-exceljs-audit-policy.mjs` rejeitou `NEW_ADVISORY` para quatro IDs relacionados ao mesmo pacote de origem `fast-uri`: **GHSA-W74X-V6F9-J3XG, GHSA-WJR9-J795-JXCR, GHSA-XHQ7-XMQJ-769H, GHSA-333X-W4R6-6CRP**. A recusa é **esperada e correta**; não adicionar exceção para o novo risco.
- O repositório fixa `fast-uri: 3.1.8` no campo `overrides` do `package.json`, além da entrada `node_modules/fast-uri@3.1.8` em `package-lock.json`.
- O pacote é transitivo a `ajv` e ao tooling Lighthouse. Como o RADAR entrega também `vendor/ajv.js` **pré-empacotado**, mudar apenas `node_modules` não é prova de eliminar o código anterior no navegador.

## Correção proposta

**Versão corrigida:** `fast-uri@3.1.9`, indicada pelo mantenedor em sua [release oficial v3.1.9](https://github.com/fastify/fast-uri/releases/tag/v3.1.9), sem migration para a API 4.x.

[Advisory de scheme](https://github.com/fastify/fast-uri/security/advisories/GHSA-w74x-v6f9-j3xg) | [host canonicalization](https://github.com/fastify/fast-uri/security/advisories/GHSA-wjr9-j795-jxcr) | [path equivalence](https://github.com/fastify/fast-uri/security/advisories/GHSA-xhq7-xmqj-769h) | [suffix colon](https://github.com/fastify/fast-uri/security/advisories/GHSA-333x-w4r6-6crp).

A alteração controla as seguintes superfícies:
1. `package.json`: override `fast-uri` 3.1.8 → 3.1.9, preservando Ajv/Lighthouse e demais versões.
2. `package-lock.json`: atualiza **somente** a entrada `node_modules/fast-uri` para v3.1.9, tarball oficial e SHA-512 da versão encontrada em um lockfile público independente. O **`npm ci` do GitHub é o verificador definitivo dessa integridade**: se houver inconsistência no hash/tarball, o pacote não será instalado.
3. `tests/unit/tooling-contract.test.js`: exige override e versão resolvida v3.1.9.
4. `vendor/ajv.js`: **deve ser regenerado pela rotina canônica** `npm run build:ajv` sobre `npm ci` do lock corrigido, para não manter vulnerabilidade em JavaScript entregue ao navegador. Não editar JS minificado manualmente, nem alegar correção de produto com bundle desatualizado.

**Procedimento instrumental transitório:** workflow de geração na branch isolada, usando Actions pinadas, Node 24, npm ci e `npm run build:ajv`; persiste **somente** `vendor/ajv.js` se houver delta. O workflow temporário com permissão de escrita deve ser **removido antes do merge** e não constitui parte do produto nem da CI permanente. O PR final deve mostrar apenas manifest, lock, teste, bundle canônico e documentação.

## Gates exigidos para encerramento

- `npm ci` verificar integridade e resolver `fast-uri@3.1.9` na cadeia final;
- `npm run build:ajv` reproduzir o bundle versionado e `git diff --exit-code vendor/ajv.js` ser zero após geração;
- política `audit:exceljs-policy` com relatório **fresco do mesmo SHA** sem `NEW_ADVISORY` relacionado; não usar JSON de rodada anterior;
- validar contratos JSON Ajv, exportações SME e interfaces de usuário por testes de regressão, além de CodeQL/CI pertinentes;
- status CI e commit de merge comprovados separadamente para hotfix e para o PR de caracterização #486.

**Não executado por esta investigação:** ajuste de SQL/RLS/Auth, migração, alteração de faturamento/licença, exceções de vulnerabilidade, novos pacotes diretos, mudança de esquema fiscal ou deploy manual. A atualização de override não deve ser confundida com uma avaliação exaustiva da exposição à vulnerabilidade no navegador; o bundle e o gate de CI devem convergir primeiro.

**Status deste relatório:** a correção candidata foi preparada, mas a homologação ainda precisa ser verificada no último SHA; não apresentar como merge ou Production corrigida antes desses fatos.
