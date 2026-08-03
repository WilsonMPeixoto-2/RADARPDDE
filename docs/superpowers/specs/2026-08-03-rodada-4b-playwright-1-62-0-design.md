# Rodada 4B — Playwright 1.62.0

**Data:** 3 de agosto de 2026  
**Estado:** aprovado para execução

## Objetivo

Atualizar exclusivamente `@playwright/test` de `1.61.1` para `1.62.0`, preservando a matriz, os projetos, os testes, os limites de qualidade e os ambientes do RADAR PDDE.

## Escopo

- `package.json` e `package-lock.json`;
- documentação e evidência da rodada;
- instalação dos navegadores correspondentes no CI;
- execução dos gates aplicáveis.

## Compatibilidade

Playwright 1.62.0 exige Node.js 20 ou superior. O projeto está fixado em Node.js 24.x, portanto o requisito é atendido.

A atualização traz Chromium 151, Firefox 153 e WebKit 26.5. O RADAR continuará usando Chromium e WebKit nos projetos já existentes; Firefox não será acrescentado nesta rodada.

## Decisões

- não ativar component testing, AbortSignal, WebP, retry isolado, MCP ou outros recursos novos apenas por estarem disponíveis;
- não alterar locators, timeouts, retries, screenshots, reporters ou projetos sem falha comprovada;
- não alterar código funcional;
- não executar deployment Vercel;
- não acessar ou modificar Supabase Production;
- reutilizar o lockfile oficial gerado pelo Dependabot para a mesma atualização, reaplicado sobre a `main` atual.

## Gates

- instalação reproduzível com `npm ci`;
- versão efetiva `1.62.0`;
- auditoria de dependências;
- saúde das dependências;
- E2E Playwright completo;
- matriz de cinco perfis em desktop, Android e iPhone;
- Lighthouse;
- Supabase readiness e backup/restauração, para detectar regressões indiretas do ambiente de CI;
- Excel SME.

## Production

A mudança é ferramenta de teste e não altera o bundle servido ao usuário. Deployment Production não é necessário.