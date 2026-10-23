# RADAR PDDE — registro vivo de capacidades e aprofundamentos pós-upgrade

**Natureza:** registro operacional de acompanhamento ligado à [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481). **Não** altera regras canônicas de negócio, ADRs, escopo de Production ou autoridade de Supabase. A [auditoria aprofundada de 22–23/10](audits/2026-10-23-modernization-decision-trace.md) fundamenta as decisões; este arquivo controla **o que ainda falta**.  
**Foto-base de dependências:** `package.json` em `main@fef3e7834edefbe178e241c4957c52fa781bf877`, verificado em 23/10/2026. Esse SHA é histórico, **não o HEAD futuro** do merge documental. Atualizar versões/linhas quando o manifesto mudar, e consultar o lockfile quando a versão resolvida importar.  
**Escopo:** 26 dependências diretas (1 `dependencies`, 25 `devDependencies`). Serviços hospedados/runtime da plataforma estão no bloco separado; dependências transitivas continuam sob política de segurança, mas não exigem 1 issue de produto por pacote.

## Como evitar dois tipos de esquecimento

**Trilha A — cobertura de todos os pacotes.** Cada uma das 26 linhas precisa de uma **decisão conclusiva de triagem**, independentemente de ter ou não oportunidade de implementação.  
**Trilha B — aprofundamentos.** Cada hipótese que pedir análise longa recebe identificador, prova existente, estado, próximo passo, condição de retomada e critério de encerramento. Não há “pausado” sem condição definida.

**Legenda de cobertura (não confundir com conclusão):**
- **T0 | inventariado:** versão e consumidor/finalidade preliminar identificados; **não existe triagem individual suficiente da capacidade aproveitável**. Obrigatório examinar.
- **T1 | triagem inicial registrada:** o estudo A0 já analisou individualmente emprego/capacidades e formulou decisão provisória; falta confirmar/encerrar a decisão na matriz viva, com o SHA e a fonte pertinente.
- **T2 | hipótese testada ou correção comprovada:** pelo menos uma capacidade foi examinada com evidência específica; isso **não significa** que todas as capacidades do pacote foram examinadas, nem que oportunidades futuras estejam encerradas.

**Contadores iniciais verificados:** **26/26 inventariadas**; **17/26 com nota individual ou compartilhada no estudo A0** (**10 T1 + 7 T2**); **9/26 ainda em T0**. **0/26 declaradas concluídas na nova checklist formal:** falta aplicar a decisão conclusiva padronizada por item. Não publicar “17 pacotes aprovados” nem considerar T2 como sinônimo de encerramento total.

**Decisões finais de cobertura (a preencher mediante evidência):** `adequadamente aproveitada` / `nova capacidade inaplicável ou sem benefício` / `oportunidade identificada e vinculada à Trilha B` / `triagem pendente`. A meta é **26/26 decisões finais**, não 26 PRs.

## Trilha A — inventário fechado de dependências diretas

| Grupo | Pacote fixado no manifesto | Cobertura | Uso reconhecido / evidência inicial | Próxima conclusão de triagem | Vinculação |
| --- | --- | --- | --- | --- | --- |
| Experiência | `@playwright/test@1.64.1` | **T1** | E2E, jornadas e capturas desktop/mobile; A0; #461, #463, #480 | Instrumentação já usada; locks/FPS apenas com problema comprovado | F04 / F05 |
| Experiência | `@axe-core/playwright@4.14.0` | **T2** | Auditorias de acessibilidade de telas; A0/A3; #464, #466, #474; A9 | Problemas de nome acessível corrigidos; falta prova de estados/zoom/teclado | F06 |
| Experiência | `lighthouse@13.5.0` | **T2** | Lighthouse CI e piloto de jornada autenticada; A0/A9; #482 | Timespan/snapshot comprovados; não interpretar INP local como Production | F01 |
| Experiência | `puppeteer-core@25.16.0` | **T0** | Driver direto do coletor opt-in de A9; devDependency; #482/#483 (integração/segurança) | Verificar capacidades e limitações próprias sem refazer A9 | F01 / B1 |
| Experiência | `fuse.js@7.5.0` | **T2** | Índice de busca global/token matching; A0/A8; run 39990335333 | Cache melhorou cenário Node; browser/invalidação ainda não provados | F09 |
| Experiência | `@floating-ui/dom@1.8.0` | **T1** | Posicionamento dos menus globais; A0 (offset/flip/shift/size/autoUpdate) | Adoção já existente; expandir só com clipping/foco reproduzido | F10 |
| Dados e contratos | `@supabase/supabase-js@2.118.0` | **T1** | Persistência e sincronização no navegador/Edge; A0; #457/#472 | SDK integrado; fronteiras de RPC e conflitos são oportunidades separadas | F02 / F08 |
| Dados e contratos | `supabase@2.121.0` | **T2** | CLI/test stack local, migrations e typegen; A0; #472 e matriz causal 2×2 | Compatibilização de grants e typegen concluída; não reabrir matriz | F11 |
| Dados e contratos | `msw@3.0.3` | **T2** | Simulação controlada de falhas de rede; A0; #443 contraprova fail-closed | Migração concluída; novos cenários só se lacuna operacional comprovada | F08 |
| Dados e contratos | `ajv@8.20.0` | **T1** | Validação JSON e bundles reprodutíveis; A0; check:generated/build:ajv | Avaliar fronteira alterada e duplicações de schema antes de expandir | B2 |
| Dados e contratos | `exceljs@4.4.0` | **T0** | Excel SME/exportação, único pacote em dependencies; package.json; contratos Excel e política de segurança | Falta triagem específica de capacidades da versão e custo real; não mudar exportação sem necessidade | B2 |
| Dados e contratos | `fast-check@4.10.2` | **T1** | Propriedades generativas dos invariantes financeiros; A0; test:properties | Ampliar apenas diante de lacuna concreta de domínio e seed reprodutível | F08 / B2 |
| Qualidade estática | `typescript@7.0.2` | **T2** | Typegen DB e fronteira fiscal JSDoc; A0; A4→A7; #479 | Gate localizado integrado; não habilitar typecheck global automaticamente | F07 |
| Qualidade estática | `@types/node@24.19.2` | **T0** | Declarações de tipos para tooling Node; package.json; contexto TypeScript | Triar alinhamento com Node 24 e ganho incremental; pacote de suporte | B3 |
| Qualidade estática | `eslint@10.13.0` | **T1** | Lint de produto e de E2E; A0; #470; lint:security | Classificar 42 warnings de produto antes de modificar política | F12 |
| Qualidade estática | `@eslint/js@10.0.1` | **T0** | Conjunto de regras do ESLint; package.json; ESLint 10 integrado | Conferir configurações/regras individuais, sem duplicar análise de ESLint | F12 / B3 |
| Qualidade estática | `eslint-plugin-no-unsanitized@4.1.5` | **T0** | Regras específicas de segurança de DOM; package.json; lint:security | Avaliar regras ativas, cobertura de DOM e falsos positivos por contexto | F12 / B3 |
| Qualidade estática | `eslint-plugin-playwright@2.12.1` | **T0** | Regras de qualidade de testes E2E; package.json; lint:e2e | Verificar eficácia para flakiness e boas práticas sem impor gate arbitrário | F04 / B3 |
| Qualidade estática | `knip@6.42.1` | **T2** | Inventário de dependências, exports e arquivos; A0–A2; #475 | Diagnóstico opt-in; 34 candidatos com referências dinâmicas; zero exclusões | F13 |
| Qualidade estática | `dependency-cruiser@18.7.0` | **T1** | Fronteiras/ciclos de dependência arquitetural; A0; #469; check:architecture | Grafo já usado; só aprofundar com regressão arquitetural plausível | B3 |
| Qualidade estática | `acorn@8.19.0` | **T0** | Parser de JavaScript no tooling; package.json | Inventariar consumidores diretos e capacidades usadas; sem refatorar parser por versão | B3 |
| Qualidade estática | `acorn-walk@8.3.5` | **T0** | Travessia de AST no tooling; package.json | Verificar se oportunidades AST reais existem; coordenar com acorn | B3 |
| Qualidade estática | `stylelint@17.16.0` | **T1** | Validação de styles.css e src/styles; A0; lint:css | Adotado; avançar só se defeito visual/regra CSS demonstrado | B3 |
| Qualidade estática | `stylelint-config-recommended@18.0.0` | **T0** | Preset de regras CSS; package.json; lint:css | Auditar ativação de regras relevantes, em conjunto com Stylelint | B3 |
| Build | `esbuild@0.28.2` | **T1** | Build e bundles reprodutíveis de vendors; A0; build:vercel e scripts/build-* | Adoção existente; avaliar capacidades novas se gargalo de build real | B4 |
| Build | `prettier@3.9.10` | **T1** | Formatação e checks de artefatos tipados; A0; #462/#472; format:check | Já usado; contrato estrutural de typegen preservado | B4 |

**Nota de proveniência:** para T0, uma finalidade preliminar inferida de `package.json`, scripts ou nomes **não constitui** análise concluída de todas as capacidades. Para T1/T2, A0 e as experiências citadas são fotografias datadas; revalidar config/runtime antes de propor mudança. Não exigir funcionalidades novas só para aproveitar versões atualizadas.

## Trilha B — carteira única de investigações, correções e condicionantes

A numeração F identifica uma **frente de produto/metodologia**, não um pacote, uma nova prioridade nem um compromisso de implementar. Uma frente pode envolver vários pacotes. `B1–B4` são **lotes de triagem** e não PRs.

**Estados:** `CONCLUÍDA — contrato validado` | `ENCERRADA — pesquisa instrumental` | `CANDIDATA — falta diagnóstico` | `AGUARDANDO CONDIÇÃO` | `EM INVESTIGAÇÃO` | `EM VALIDAÇÃO` | `DESCARTADA COM PROVA`. Uma frente concluída pode originar **outra** oportunidade separada; nunca reabrir a anterior por simples proximidade.

| ID / prioridade #481 | Tema e vínculos | Estado após 23/10 | Próxima ação **ou** condição de retomada | Critério de encerramento e prova |
| --- | --- | --- | --- | --- |
| **F01 / P1** | Lighthouse, Playwright, Puppeteer, Event Timing; [A9](audits/2026-10-23-modernization-decision-trace.md) | **A9 encerrada — pesquisa instrumental**; **experiência gráfica ainda CANDIDATA** | Para eventual nova frente, medir ação Salvar em navegador com compositor gráfico/volume representativos, controles pareados; não repetir A9 local | Diagnóstico de apresentação causalmente sustentado, ou ausência de ganho/defeito reconhecida; nenhuma alteração CSS sem screenshot/jornada real |
| **F02 / P1–P3** | Cobertura escolar após gravação, Supabase SDK/Realtime; [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446), [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447) | **AGUARDANDO PROVA** | Caracterizar completude/IDs cobertos após commit autoritativo; manter proteção `MISSING_BASELINE_COVERAGE` e exclusões; confrontar efeitos históricos | Teste que prove criação/edição/exclusão, resposta antiga, duas sessões, troca de contexto e estado remoto/local/DOM/reload; sem remoção precoce de guarda |
| **F03 / P1–P3** | Prontidão/projeção após reload, [issue #460 Caso A](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/460) | **CANDIDATA — causa indeterminada** | Reproduzir descompasso de bonificação/hidratação no `main` vigente sem reutilizar falha de geometria Caso B | Causa-raiz e contraprova ou descarte documentado; Caso B já corrigido por #463 |
| **F04 / P1** | Playwright, estados de UI, test readiness/flakiness e fixtures serializadas; #463/#480 | **CORREÇÕES LOCALIZADAS CONCLUÍDAS; isolamento de retry ainda CANDIDATO** | Somente ao reproduzir, isolar fixture entre retry serial e distinguir geometry/readiness de defeito financeiro | Resultado por interação visível e banco; não relaxar asserção como atalho |
| **F05 / P1** | Captura NF e controles em viewport; [#480](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/480) | **CONCLUÍDA — critério do teste** | Nenhuma ação em aberto pelo #480; novas questões visuais requerem problema independente | Ambos os botões 100% na viewport; 21/21 ciclos reais documentados, **não** redesign |
| **F06 / P1–P2** | Axe 4.14; [#466](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/466), [#474](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/474) | **Correções de nomes CONCLUÍDAS; estados/zoom/foco CANDIDATOS** | Amostragem WCAG 2.2, teclado, zoom 200%, erro, salvando e reanálise após seleção de jornada material | Defeito atual atribuível à UI + contraprova visual/teclado; não transformar 3 checks Axe incompletos em certificação |
| **F07 / P2** | TypeScript/JSDoc; A4→A7, [#479](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/479) | **CONCLUÍDA — fronteira fiscal localizada; expansão CANDIDATA** | Escolher outra fronteira de risco **quando alterada** (RPC/serviço real), com mutação que provoque erro executável | RED/verde reais, AST/bundle invariável, testes do consumidor; sem typecheck global |
| **F08 / P3** | MSW, Supabase SDK, fast-check, Ajv; [#443](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/443) | **MSW 3 CONCLUÍDO; novas falhas de rede CONDICIONAIS** | Só abrir piloto para resposta perdida após commit, resposta obsoleta ou logout/abort se não coberto pelos testes atuais | Garantias de idempotência, rollback, auth e convergência com falha reproduzível; não duplicar pgTAP |
| **F09 / P1–P2** | Fuse.js A8; [run 39990335333](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39990335333) | **ENSAIO NODE CONCLUÍDO; cache de busca AGUARDANDO CONDIÇÃO** | Medir pesquisa no browser autenticado e mapear invalidadores (escola, competência, perfil, Pendências, logout) | Paridade de ordem/IDs com catálogo alterado, benefício perceptível no browser; sem `FuseWorker` incompatível com `useTokenSearch` |
| **F10 / P1** | Floating UI; menus globais | **USO EXISTENTE; EXTENSÃO CONDICIONAL** | Abrir somente se menu/modal/drawer com clipping, foco ou posicionamento incorreto for reproduzido | Inspeção rendered UI da superfície, sem refatoração horizontal por preferência |
| **F11 / P3** | Supabase CLI/typegen; [#472](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/472) | **CONCLUÍDA — compatibilização** | Não reabrir 2×2 sem mudança de contrato real | Grants locais coerentes, 674 pgTAP, typegen sem drift semântico; não modificar Production |
| **F12 / P2** | ESLint 10, @eslint/js, plugins de segurança e E2E | **CANDIDATA — classificação de warnings** | Identificar regras/locais dos 42 warnings de produto e histórico dos testes; tratar riscos antes de elevar severidade | Triagem causal de warnings úteis, sem relaxar scanner nem impor regras desnecessárias |
| **F13 / P2** | Knip; [#475](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/475) | **CONCLUÍDA — diagnóstico opt-in; higiene pequena CANDIDATA** | Verificar `artifacts/tooling/` e exclusão seletiva no `.gitignore` em alteração isolada; não eliminar 34 arquivos por referência textual | Relatórios não poluem Git, nenhuma remoção sem prova de ausência de execução dinâmica |
| **F14 / P4** | GitHub Actions A5/A6; [#476](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/476)/[#477](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/477) | **CONCLUÍDA — shadow + exceção em 1 job; ampliação CONDICIONAL** | Verificar required checks/branch protections (403 histórico) antes de qualquer skip novo; medir custo por job e Preview Vercel separadamente | Paths SQL/runtime continuam protegidos, nome de check estável, ganho medido apenas no recorte afetado |
| **F15 / transversal** | Integridade documental de prioridades, prova e CI; [#484](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/484), [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481) | **EM VALIDAÇÃO DOCUMENTAL** | Fechar/avaliar CI do PR #484, integrar a matriz e manter um único checkpoint `CURRENT_STAGE`; não alterar regras do produto | Docs integrados ao HEAD real, links sem quebrar, 26 linhas, frentes vinculadas e nenhuma versão histórica apresentada como status atual |

**Regra antiesquecimento:** se um agente encontrar oportunidade durante a Trilha A, (1) atualiza a linha do pacote; (2) vincula a F existente ou cria **uma** F justificada nesta tabela; (3) registra hipótese, evidência, estado, próximo passo e condição de retorno; (4) fecha a rodada horizontal **sem** transformar automaticamente o achado num PR. Se uma nova F for relevante para dois pacotes, citar o mesmo ID em ambos, sem duplicar investigação.

## Lotes de triagem horizontal e sequenciamento

| Lote | Cobertura | Critério de saída |
| --- | --- | --- |
| **B1 — 1 pacote T0** | Puppeteer-core: instrumentação real, limites, interface com Playwright/Lighthouse e advisory já resolvido | Decisão individual e distinção entre capacidade do coletor e problema de produto A9 |
| **B2 — 1 T0 + revisão leve de 2 T1** | ExcelJS (T0), Ajv e fast-check (T1) | Conhecer novas capacidades úteis para exportações/validação de despesas sem reabrir workbooks |
| **B3 — 7 T0 + revisão conjunta dos T1 relacionados** | @types/node, @eslint/js, eslint-plugin-no-unsanitized, eslint-plugin-playwright, acorn, acorn-walk, stylelint-config-recommended; relacionar TypeScript/ESLint/dependency-cruiser/Stylelint | Evidência por **cada pacote**, mesmo que análise conjunta; decidir aplicável/inaplicável/oportunidade |
| **B4 — encerramento do inventário T1/T2** | Playwright, Axe, Lighthouse, Fuse, Floating, Supabase SDK/CLI, MSW, TS, Knip, ESLint, depcruise, Ajv, fast-check, Stylelint, esbuild e Prettier | 26/26 decisões finais com fonte e oportunidade vinculada; não executar todos os aprofundamentos agora |
| **Serviços (separado)** | Node 24, PostgreSQL 17.11 hospedado, PostgREST, Supabase Auth/RLS/Realtime/Edge, Vercel, GitHub Actions e capacidades da plataforma | Registrar observabilidade/capacidade, atualidade, evidência e eventual F; não somar ao denominador de 26 |

**Condução recomendada:** completar B1/B2/B3 em lotes curtos de 4–6 tecnologias, revisando a carteira F ao final de cada lote. Quando um T1/T2 apresentar decisão final comprovada, fechá-lo imediatamente (não exigir pesquisa repetida). Manter **no máximo uma F principal de implementação funcional ativa**; exceções justificadas para risco de segurança/integridade/disponibilidade. Uma frente em espera precisa de condição de retomada. Não existe prazo ou compromisso implícito de fazer todas as F.

## Atualização obrigatória após cada lote

1. Revalidar `main`, manifesto, lock e decisões/PRs mais recentes, sem refazer pesquisa histórica encerrada.
2. Registrar T0→T1/T2 e **decisão final** pacote a pacote, com links que funcionem no próprio commit.
3. Atualizar apenas as F alteradas; não duplicar descrições em issues independentes ou reescrever auditoria A0–A9.
4. Relatar: **número de decisões finais / 26**, T0 restantes, F ativas, F condicionadas, falhas/alertas materiais e o próximo lote.
5. `docs/CURRENT_STAGE.md` aponta **somente para este registro vivo** e para a auditoria histórica. Em caso de conflito factual, prevalecem código, bancos/ambientes, ADRs e gates do SHA atual, segundo [AGENTS](../AGENTS.md).

**Regra final:** cobertura total não exige 26 implementações; aprofundamentos podem estar encerrados como investigação sem correção; melhora de experiência deve ser provada em jornada real. Nenhum pacote sem decisão, nenhuma F aberta sem retomada definida.
