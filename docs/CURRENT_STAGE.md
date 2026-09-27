# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 27 de setembro de 2026

## 1. Fases A/B concluídas; entrega de encerramento da Fase C

| Frente | Resultado | Registro |
|---|---|---|
| A/B | Integradas à main e publicadas | [PR #378](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/378), merge `5581ee8814dd8361e8be70fe467f832f2ddce20c` |
| C1 | Concluída: ExcelJS 4.4.0 preservado com uuid 11.1.1 | [PR #384](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/384), merge `70e3d7e601b9157940dba0d2cbbc8a0d7cf90ad3` |
| C2 | Concluída: CLI 2.118.0 reprovada; 2.114.0 preservada | [PR #385](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/385), merge `0af1c5a81536f68b848a7194f72071c1e7e9ad2f` |
| C3 | Servidor Node canônico implementado; correções dos dois achados CodeQL nesta entrega | [PR #386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386) |

**A integração de #386 e a confirmação de Production encerram A + B + C.** O registro de encerramento no PR contém o SHA final homologado, merge, deployment READY, manifesto/assets e smoke. Enquanto o PR estiver aberto, C3 permanece candidata; depois de integrado e publicado, não existe implementação A/B/C pendente por causa de textos históricos pré-merge.

## 2. Baseline e confirmação de publicação

Baseline revalidada antes desta entrega:

- main `0af1c5a81536f68b848a7194f72071c1e7e9ad2f`;
- Production `dpl_CcYXX4tvFhjFRyGYwsaJJxupFrZ5`, READY, mesmo SHA;
- URL: https://radarpdde-fix.vercel.app.

Essa baseline não é o resultado antecipado da publicação de C3. Para o estado posterior, conferir o encerramento do [PR #386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386), o deployment associado à main e `/radar-build-manifest.json`. A matriz verde de um SHA anterior não certifica uma correção posterior.

## 3. Decisões preservadas

- Supabase JS 2.117.2 alinhado no navegador e Edge Function;
- Supabase CLI 2.114.0: não enfraquecer RLS/pgTAP para aceitar CLI reprovada;
- ExcelJS 4.4.0 / uuid 11.1.1, sem a antiga exceção de vulnerabilidade;
- servidor `scripts/serve-radar.mjs` para dev, Playwright, auditoria e Lighthouse; `http-server` removido;
- `RADAR_SERVE_ROOT` seleciona a raiz; `RADAR_E2E_ROOT` preservado por compatibilidade;
- servidor abre uma vez, verifica/lê pelo mesmo descritor e sempre o fecha; falhas HTTP não expõem mensagens internas;
- sem alteração de layout, regras funcionais, banco, schema, migrations, RPCs, RLS ou persistência nesta C3;
- goldens visuais não são atualizados automaticamente para obter verde.

## 4. Evidência e retomada

Registro técnico desta entrega: [correções CodeQL e validação C3](evidence/2026-09-27-phase-c3-codeql.md). Resultados remotos incrementais e encerramento ficam no PR #386 para permitir continuidade entre sessões.

Não há handoff corrente separado. O handoff `2026-09-26-tooling-modernization-a-b.md` é **histórico concluído**. Os PRs #375/#376/#377/#378 não formam fila de implementação. Textos pré-merge neles preservam somente o estado daquele momento.

Após o encerramento de C3, a próxima frente é a **Fase D**, ainda não iniciada nesta entrega. A avaliação de ferramentas de design está em [DESIGN_TOOLING.md](evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md): Figma conectado e provas isoladas de Sharp/SVGO/Lucide/Fontsource. Nenhuma biblioteca de design nova foi adicionada ao runtime. O modo Playwright com sessão autenticada depende da extensão instalada no computador do usuário e não bloqueia Production.
