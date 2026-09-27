# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 26 de setembro de 2026

## 1. Production confirmada

- `main`: `95d9f0a1112c506f915b3b6d37677e94b7bf7c26`;
- deployment Production: `dpl_Dc5aaMc2Aif6ggmj1pRauxrCQ2fU`, `READY`;
- PR #376 integrado e encerrado;
- manifesto/assets publicados conferem com o candidato aprovado;
- nenhuma configuração efêmera de Preview foi integrada.

A frente desktop/Pendências anterior está encerrada. Não reabrir #375/#376/#377 como fila de implementação.

## 2. Frente ativa — modernização de tooling A/B

Branch:

`chore/tooling-phases-a-b-2026-09-26`

Handoff corrente:

`docs/handoff/2026-09-26-tooling-modernization-a-b.md`

Objetivo: elevar capacidade de agentes, segurança de supply chain, reprodutibilidade, qualidade CSS, diagnóstico Playwright, regressão visual e busca global sem reescrever arquitetura funcional.

### Fase A

- Playwright MCP `0.0.82` versionado em `.mcp.json`, fora das dependências/runtime;
- modo isolado + modo `--extension` para sessão autenticada/SSO/2FA;
- Dependabot separado em `supabase-sdk`, `supabase-cli` e `css-quality`;
- `@supabase/supabase-js` elevado de `2.116.0` para `2.117.2`;
- navegador e Edge Function usam a mesma versão `2.117.2`;
- Supabase CLI permanece deliberadamente em `2.114.0`;
- Actions externas passam a exigir SHA completo pelo checker do repositório;
- Dependency Review Action adicionada;
- `devEngines` exige Node 24 e npm 11.

### Fase B

- Stylelint `17.15.0` + `stylelint-config-recommended 18.0.0`, calibrado para erros reais e não para dívida editorial legada;
- gate CSS incorporado ao readiness;
- seis baselines visuais Playwright em Chromium 1440×900;
- projeto visual dedicado com dois workers e locks apenas nos fluxos que compartilham estado;
- traces enriquecidos com DOM, ARIA, screen snapshot e sources;
- Fuse 7.5 usa Token Search com `tokenMatch: 'all'`;
- busca multi-termo passa a tolerar ordem livre e typo por termo.

## 3. Escopo e invariantes

A frente não altera:

- schema, migrations, RPCs ou RLS;
- modelo de persistência;
- contratos de Pendências/NF/Inventário;
- permissões funcionais;
- configuração Vercel de Production.

A única mudança funcional deliberada de produto é a melhoria da busca global por Token Search. Supabase 2.117.2 atualiza biblioteca cliente/Edge mantendo os contratos de leitura/escrita já protegidos.

## 4. Regras de teste novas

- baseline visual não é atualizado automaticamente para “ficar verde”;
- mudança de golden exige revisão visual do diff;
- `test lock` é usado apenas onde estado compartilhado material exige serialização;
- trace enriquecido é evidência de diagnóstico, não substitui contrato funcional;
- snapshots visuais complementam, não substituem, jornada real e persistência;
- o gate visual canônico usa Linux/Chromium 1440×900 no CI.

## 5. Estado de validação

A materialização de `package-lock.json`, `vendor/supabase-client.js` e seis PNGs de baseline é feita por runner Node 24/npm 11 limpo. O workflow temporário se remove após concluir essa materialização.

Depois disso, a branch deve passar readiness completo, unit/integration, visual regression, E2E desktop, Supabase readiness/pgTAP/RLS, CodeQL/Dependency Review, Lighthouse e demais gates proporcionais disparados pelo PR.

Nenhum resultado parcial autoriza merge ou Production.

## 6. Próxima ação

Concluir a materialização, abrir PR contra `main`, classificar qualquer vermelho real e deixar o candidato integralmente verde. Como `main` publica automaticamente na Vercel, merge/publicação só ocorre mediante decisão explícita posterior.

## 7. Rota de retomada

1. `AGENTS.md`
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`
3. este arquivo
4. `docs/handoff/2026-09-26-tooling-modernization-a-b.md`
5. `docs/reference/TEST_GOVERNANCE.md`
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`
7. `docs/reference/STATUS_DOCUMENTOS.md`
