# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 27 de setembro de 2026

## 1. Estado funcional corrente

**As Fases A, B e C estão encerradas. A Fase D ainda não foi iniciada.**

Baseline funcional que encerrou a Fase C:

- merge funcional de encerramento: `e6b692a97dd5148877c788da11e0c8ae4c8fcd19`;
- PR de encerramento: [#386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386);
- deployment que comprovou a publicação da C3: `dpl_vp8YKMA9pGDMZD7RQRjQDM8qkYC5`, `READY`, target `production`;
- URL oficial: https://radarpdde-fix.vercel.app;
- manifesto dessa publicação: `commitSha=e6b692a97dd5148877c788da11e0c8ae4c8fcd19`, `vercelEnvironment=production`, `runtimeEnvironment=production`, `dataMode=supabase-production`, `supabaseRepositoryEnabled=true` e `productionActivationApproved=true`;
- smoke da publicação: 50 assets válidos e RLS anônima confirmada por `blocked-401`.

Esse SHA e esse deployment são a **evidência de encerramento funcional da Fase C**. Commits posteriores exclusivamente documentais podem avançar a `main` e gerar novo deployment sem constituir nova versão funcional do produto. Por isso, o SHA exato do head corrente e o deployment ativo devem ser conferidos ao vivo no GitHub/Vercel quando forem materialmente relevantes, em vez de serem tratados como constantes dentro deste documento.

Não existe PR, branch ou handoff corrente da Fase D neste momento.

## 2. Histórico de encerramento das fases

| Frente | Resultado | Registro |
|---|---|---|
| A/B | Integradas e publicadas | [PR #378](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/378), merge `5581ee8814dd8361e8be70fe467f832f2ddce20c` |
| C1 | ExcelJS 4.4.0 preservado com `uuid@11.1.1` homologado | [PR #384](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/384), merge `70e3d7e601b9157940dba0d2cbbc8a0d7cf90ad3` |
| C2 | Supabase CLI 2.118.0 reprovada; 2.114.0 preservada | [PR #385](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/385), merge `0af1c5a81536f68b848a7194f72071c1e7e9ad2f` |
| C3 | Servidor Node canônico; `http-server` removido; dois achados CodeQL corrigidos | [PR #386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386), head homologado `bbe78d66d6aec0261ddf2f068d2ff5b1ac8f2c67`, merge funcional `e6b692a97dd5148877c788da11e0c8ae4c8fcd19` |

Validação final da C3 no head corrigido:

- 17/17 workflows aplicáveis verdes;
- suíte E2E completa: 237 casos descobertos, 183 aprovados e 54 skips condicionais;
- regressão visual aprovada sem atualização artificial de goldens;
- CodeQL reaprovado e as duas threads resolvidas automaticamente pelo `github-advanced-security[bot]`;
- após o merge funcional, os gates disparados na `main` também ficaram verdes, incluindo monitoramento de Production, smoke do Excel SME, CodeQL, Lighthouse, regressão visual, validação geral, Supabase readiness e saúde das dependências.

## 3. Decisões técnicas preservadas

- Supabase JS 2.117.2 alinhado no navegador e Edge Function;
- Supabase CLI 2.114.0 permanece homologada; não enfraquecer RLS/pgTAP para aceitar uma CLI reprovada;
- ExcelJS 4.4.0 / `uuid@11.1.1`, sem a antiga exceção de vulnerabilidade;
- `scripts/serve-radar.mjs` é o servidor canônico para dev, Playwright, auditoria e Lighthouse; `http-server` foi removido;
- `RADAR_SERVE_ROOT` seleciona a raiz servida; `RADAR_E2E_ROOT` permanece por compatibilidade;
- o servidor abre o arquivo uma vez, verifica e lê pelo mesmo `FileHandle`, fecha em `finally` e não expõe mensagens internas em respostas HTTP;
- a C3 não alterou layout, regras funcionais, banco, schema, migrations, RPCs, RLS ou persistência;
- goldens visuais não são atualizados automaticamente para obter verde;
- um resultado vermelho de CI não autoriza mudança funcional sem diagnóstico causal do SHA, ambiente, fixture, ferramenta e contrato testado.

## 4. Evidência e validade documental

Registro técnico da correção final da C3: [correções CodeQL e validação C3](evidence/2026-09-27-phase-c3-codeql.md).

Os documentos de handoff de A/B e das frentes anteriores permanecem **históricos concluídos**. Não reabrir PRs #375/#376/#377/#378 ou textos pré-merge como fila de implementação.

Não há handoff corrente separado. Para retomada, a ordem de leitura continua sendo:

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. este arquivo;
5. `docs/reference/ENGINEERING_METHOD.md`;
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
7. `docs/reference/STATUS_DOCUMENTOS.md`;
8. matriz funcional e ADRs da área afetada.

## 5. Próxima frente

A próxima frente planejada é a **Fase D — hardening e performance**, ainda não iniciada.

A avaliação separada de ferramentas para evolução visual permanece em [DESIGN_TOOLING.md](evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md): Figma conectado e provas isoladas de Sharp/SVGO/Lucide/Fontsource. Nenhuma biblioteca nova dessa avaliação foi adicionada ao runtime.

Antes de iniciar a Fase D:

1. conferir ao vivo o head de `main` e o deployment ativo;
2. criar entrega isolada a partir desse head;
3. preservar como baseline funcional a conclusão A+B+C registrada acima;
4. manter implementação, validação e eventual publicação causalmente ligadas ao mesmo SHA.
