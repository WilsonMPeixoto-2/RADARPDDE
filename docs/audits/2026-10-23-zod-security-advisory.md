# Hotfix de segurança do instrumental A9: Zod transitivo

**Data:** 23/10/2026. **Natureza:** correção de segurança exclusivamente na árvore de dependências de desenvolvimento. **Base:** `main@c5f6e5afd66a82516461344a92d06cc6ad4c2c4e` pós-merge do PR #482.

## Incidente

Após a integração da auditoria A9, dois checks no push da `main` foram bloqueados por `NEW_ADVISORY` na política de segurança existente, diante de `GHSA-MRHX-C7XC-M3W5` (Zod, alta severidade). O alcance observado era `lighthouse -> puppeteer-core@25.12.0 -> chromium-bidi@17.0.2 -> zod@3.25.76`, além de `zod@4.6.5`. O A9 fixara Puppeteer como dependência de desenvolvimento direta, mas a cadeia já existia transitivamente por Lighthouse. **O advisory não foi silenciado nem incluído em exceção.** O auditor de runtime (`npm audit --omit=dev`) permaneceu sem vulnerabilidade bloqueante.

## Correção dirigida e evidência

O [workflow descartável de diagnóstico](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/40029694369) reproduziu o lockfile com:
`npm install --package-lock-only --save-dev --save-exact --ignore-scripts --no-audit puppeteer-core@25.16.0`;
`npm update zod --package-lock-only --ignore-scripts --no-audit`;
`npm ci`; auditoria nova em `scratch-security/npm-audit.json`.

A árvore validada contém `puppeteer-core@25.16.0`, `chromium-bidi@157.0.8090-0`, `zod@4.6.7` e elimina o Zod 3 transitivo vulnerável. O relatório npm **recém-gerado** no ensaio indicou **0 vulnerabilidades**. O workflow descartável terminou vermelho porque o último comando de política apontava para o arquivo versionado **antigo** `dependency-health/npm-audit.json`, em vez de `scratch-security/npm-audit.json`. A validação oficial já escreve `dependency-health/npm-audit.json` antes do teste de política; sua execução no PR serve de contraprova definitiva.

As duas tentativas descartáveis anteriores revelaram, respectivamente, Zod residual sem correção e uma falha de composição do comando YAML (`run:` dobrado). Nenhum dos artefatos defeituosos foi integrado à `main`; a proposta aplica somente a árvore corrigida. As alterações exatas são `package.json`, `package-lock.json` e esta documentação. **Não alterar auditoria, allowlists, regras de negócio, SQL, código de UI ou configurações de produção.**

## Aceitação

`npm ci` com pacote/lock, `npm audit` fresco sem o advisory, política de alcance existente aprovada, ferramentas Playwright e Lighthouse funcionais, CI de regressão sem falhas e inspeção de Production. A integração do A9 permanece uma pesquisa instrumental, não um ganho de performance comprovado.
