# Rodada 4B — Playwright 1.62.0

**Data:** 3 de agosto de 2026  
**Estado:** validado

## Objetivo

Atualizar exclusivamente `@playwright/test` de `1.61.1` para `1.62.0`, preservando a matriz, os projetos, os testes, os limites de qualidade e os ambientes do RADAR PDDE.

## Escopo

- `package.json` e `package-lock.json`;
- documentação e evidência da rodada;
- navegadores correspondentes no CI;
- execução dos gates aplicáveis.

## Compatibilidade

Playwright 1.62.0 exige Node.js 20 ou superior. O projeto permanece fixado em Node.js 24.x.

A atualização traz novos builds de Chromium, Firefox e WebKit. O RADAR continua usando somente Chromium e WebKit nos projetos existentes; Firefox não foi acrescentado nesta rodada.

## Método do lockfile

O PR Dependabot `#79` foi usado apenas como referência para a alteração esperada. Como ele estava sobre base anterior e recuava o Supabase CLI, seus blobs não foram adotados no resultado final.

O lockfile definitivo foi regenerado pelo npm sobre a `main` corrente com:

```text
npm install --save-dev --save-exact @playwright/test@1.62.0 --package-lock-only --ignore-scripts
npm ci --ignore-scripts
```

O resultado preserva `supabase@2.110.0` e altera somente Playwright e a posição automática de `fsevents` no lockfile.

## Decisões

- não ativar component testing, AbortSignal, WebP, retry isolado, MCP ou outros recursos novos sem caso de uso comprovado;
- não alterar locators, timeouts, retries, screenshots, reporters ou projetos;
- não alterar código funcional;
- não executar deployment Vercel;
- não acessar ou modificar Supabase Production;
- manter `git.deploymentEnabled: false`.

## Gates aprovados no SHA funcional

```text
6c03169ce0fab5833f818689bb87c8e07e1f122d
```

- Saúde das dependências — run `30786138787`;
- Homologação do Excel SME — run `30786138685`;
- Lighthouse CI — run `30786138689`;
- Supabase readiness — run `30786138713`;
- Backup e restauração descartáveis — run `30786138677`;
- Testes E2E Playwright — run `30786138676`;
- cinco perfis em desktop, Android e iPhone — run `30786138715`.

## Production

A mudança é ferramenta de teste e não altera o bundle servido ao usuário. Deployment Production não é necessário.
