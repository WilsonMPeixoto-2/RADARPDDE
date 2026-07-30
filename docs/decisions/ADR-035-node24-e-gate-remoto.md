# ADR-035 — Node 24 e gate remoto por papel/viewport

**Data:** 30 de julho de 2026  
**Estado:** aceito

## Contexto

O projeto declarava `engines.node = >=24 <27`, embora a Vercel e os workflows já utilizassem Node 24. A faixa permitia que ambientes futuros selecionassem majors diferentes sem decisão explícita.

A homologação remota anterior também dependia de deployment e credenciais remotas e não cobria sistematicamente os papéis institucionais em desktop, Android e iPhone sobre o código do próprio PR.

## Decisão

1. fixar a major operacional em Node.js `24.x`;
2. versionar `.nvmrc` e `.node-version` com `24`;
3. exigir Node 24 nos workflows com `actions/setup-node`;
4. manter a Vercel em `nodeVersion: 24.x`;
5. substituir o workflow remoto legado por um gate que sobe Supabase descartável no GitHub Actions;
6. aplicar as 25 migrations do zero em cada execução aplicável;
7. criar identidades Auth efêmeras;
8. validar Auth/RLS mutável uma única vez no desktop;
9. validar cinco papéis institucionais em Desktop Chrome, Pixel 7/Chromium e iPhone 15/WebKit;
10. não utilizar Production ou segredo administrativo persistente nesse gate.

## Papéis cobertos

- Administrador técnico;
- Assistente de Verbas Federais;
- Controlador;
- Equipe de Inventário;
- Gestão SME.

## Consequências positivas

- ambientes usam a mesma major do Node;
- alteração de major exige decisão deliberada e novo ciclo de testes;
- o gate valida o código do próprio PR;
- Auth, RLS e migrations são exercitados em ambiente reproduzível;
- a matriz móvel deixa de depender de simulação superficial;
- nenhuma massa temporária é criada em Production;
- artefatos Playwright ficam ligados ao SHA testado.

## Custos e limites

- o gate é mais demorado porque inicia Docker, Supabase, Chromium e WebKit;
- UAT humano continua necessário;
- homologação manual do Excel continua necessária;
- backup/restauração e proteção contra senhas vazadas permanecem gates externos;
- mudança da major Node exige revisão de Vercel, dependências, lockfile e todos os workflows.

## Evidência

- workflow: `.github/workflows/gate-remoto-perfis-viewports.yml`;
- contrato: `tests/unit/release-hardening-contract.test.js`;
- matriz: `tests/e2e/supabase-preview-profile-viewport.spec.js`;
- auditoria: `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`;
- execução inicial integralmente verde: GitHub Actions run `30516532485`.
