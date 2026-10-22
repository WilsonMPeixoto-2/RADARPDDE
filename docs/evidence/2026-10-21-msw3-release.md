# MSW 3 — validação e publicação, 21/10/2026

**Estado final:** #443 integrado em `84e793ed42a9139d8f80fcf2a16b868d8bba656e`,
Production READY, smoke aprovado. **19/19 workflows do candidato e 7/7 de push
pós-merge aprovados.** Esta rodada delimitada está concluída. Checkpoints de
espera e ocorrências iniciais abaixo são históricos, preservados para rastreabilidade.

Classe: evidência datada de continuidade, não autoridade funcional nem handoff corrente.
Este arquivo suplementar fica em branch documental separada para registrar
resultados posteriores à certificação sem disparar novamente a CI de produto.

## Candidato e causa da adaptação

PR [#443](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/443), sobre
`main@c480e2445e1ddbdbe91369dfb7f1182a7d73a944`.
HEAD **`221209dab8af23f052672811201b6d05d62ebcae`**.
[Evidência técnica versionada](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/221209dab8af23f052672811201b6d05d62ebcae/docs/evidence/2026-10-21-msw3-network-harness.md)
contém fontes primárias, lock revisado, hashes e RED/GREEN.

MSW 2.15.0 → 3.0.3, exclusivamente usado na suíte Node de falhas de rede.
`onUnhandledRequest` passou a ser ignorado em favor de `onUnhandledFrame`.
Uma sonda com transporte HTTP loopback comprovadamente acessível protege a
rejeição de requisições sem handler, sem falso positivo por DNS.

- Baseline + sonda, commit `2e40db52`: **5/5**.
- MSW 3 com chave antiga: **4/5**, falha `Missing expected rejection`, enquanto
  os quatro testes originais permanecem verdes.
- Chave correta: **5/5**, sem mudar os quatro contratos originais.
- Sem scripts MSW novos habilitados; removida somente autorização obsoleta da
  versão anterior, que possuía postinstall. MSW 3 não possui esse script.
- Lock: 14 nós adicionados, cinco alterados, oito removidos, todos relacionados;
  fontes e dependências de runtime, CSS, workflows, banco e Auth/RLS intactos.

## Prova local e na CI

Instalação limpa, readiness local com **1.369 unitários e oito integrações** sem
falhas/ignorados, arquitetura 191 módulos/276 dependências, Knip sem achados,
lint, tipos, gerados e auditoria estrutural aprovados.
Audit runtime zero; seis registros high conhecidos em braces/Stylelint sob a
mesma política estrita, sem aceitar novos advisories ou relaxar regras.
Revisão independente do patch e dos logs: sem bloqueio concreto.

No [readiness 39706386990](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39706386990),
job `119587291810`, o log original confirma a sonda e os quatro cenários originais
aprovados em **Node 24.21.0**, junto de 1.369 unitários e oito integrações,
zero falhas/ignorados. Ciclos reais, run `39706386986`, job `119587291788`:
**21/21**, sem repetição, em 4,4 minutos.

## Referência sustentada incompleta — ocorrência original preservada

[Run 39706387025](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39706387025),
job inicial da baseline `119587291900`: startup e fixtures concluíram.
O spec entrou em `signIn`, mas `operational-sustained-sessions.spec.js:46/117`
recebeu `opacity=0` quando esperava 1, timeout 5 s. O teste durou aproximadamente
21 s e **não chegou à jornada de 400 rodadas**.

A referência é o runtime histórico fixo
`d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6` (#408), não a main anterior a este PR.
A assinatura de preparação da referência já havia ocorrido na rodada #457;
isso não estabelece a causa-raiz nem prova defeito apenas no instrumento.
Não foi classificada como regressão do pacote, comparação válida ou falha das
asserções funcionais do candidato.

O candidato original, job `119587292248`, completou **400 rodadas**, 1 teste
aprovado em 6,6 minutos. O comparador original `119590265396` recusou corretamente
a amostra: `baseline: experiment is incomplete or failed (requires passed reload)`.

| Artefato original | ID | SHA-256 |
| --- | --- | --- |
| Métricas da referência incompleta | 12395402479 | `8420272f3ff1d1a4ae76edf36c4f5dfd0a2a2ed372a6812cfc7652f34bdf6612` |
| Evidência da referência incompleta | 12395297692 | `bfc11393d96b15c833bf2639c7a337184cef28b712522ece6247921d3f1e15bc` |
| Métricas do candidato aprovado | 12395124341 | `289a51baa1804c0d023149272e0a93dcda385598a9d1eb74705b2822d73f2eaa` |

Depois de registrar a ocorrência no PR, foi solicitada **uma única repetição
nativa do job da baseline**, no mesmo HEAD. Novo job `119590885753`.
O resultado do candidato foi mantido; nenhuma mudança de produto, fixture,
asserção, CSS, tolerância ou timeout. O comparador dependente deverá confirmar
que ambas as amostras completaram a jornada antes de aceitar os dados.

**Estado deste checkpoint:** 18/19 workflows aprovados, repetição da referência
ainda em execução, PR Draft, sem merge ou deploy desta atualização. Se a
referência falhar novamente, preservar o bloqueio sem terceiro rerun cego.
Qualquer resultado superveniente deve ser acrescentado com seu SHA/run real.

**Conferência direta do candidato:** o ZIP de métricas `12395124341` foi
baixado e aberto; SHA-256 corresponde ao digest acima. O JSON original informa
`stage=reload`, `outcome=passed`, `rounds=400`, seis amostras de sessão e gestos
`[406,300,401,0,0,0]` (1.107). A prova de recuperação registra snapshot antigo
retido na reconexão, UI antiga antes da resposta de recovery, convergência após
essa resposta e `realtimeRecovered=true`. Isso comprova os contratos exercitados,
não ausência absoluta de defeitos nem latência de frescor durante escrita contínua.

## Limites preservados

Não se atribui ganho de fluidez, CPU, rede ou SQL ao MSW, que não compõe o runtime
do produto. A referência histórica não isola o efeito de um pacote. Avisos
diagnósticos do comparador não são um budget de aceitação.
CLI Supabase 2.114.0/paridade de grants, tipos Node 26, #446/#447, #460 e
indicadores mensais permanecem separados. Não houve alteração ou escrita
institucional em Production nesta avaliação.

Consulta final independente do principal, `npm outdated --json`, sobre a árvore
MSW 3: retornou apenas `@types/node` 24.19.2 → latest 26.6.5 e CLI Supabase
2.114.0 → latest 2.121.0. `npm view @types/node@24 version` confirma 24.19.2
como último patch da linha suportada. Não há outro upgrade direto compatível
pendente no snapshot consultado; não antecipar tipos de APIs Node 26 nem
alterar contrato de privilégios para aceitar a CLI.

## Homologação concluída — resultado superveniente

No mesmo HEAD `221209da`, a única repetição da baseline, job
`119590885753`, concluiu **400 rodadas, 1 teste aprovado em 7,5 minutos**.
O candidato aprovado não foi repetido: a API de jobs reutiliza seu resultado
na tentativa 2 (ID `119590916963`), mantendo os mesmos instantes de início/fim
da tentativa 1, **01:34:11–01:43:18 UTC**.

**19/19 workflows aprovados no HEAD final**, sem alterar produto ou testes
depois da ocorrência inicial:

| Workflow | Run | Resultado |
| --- | --- | --- |
| Reprodutibilidade do bundle Ajv | 39706386925 | success |
| Dependency Review | 39706386921 | success |
| Saúde das dependências | 39706386991 | success |
| Validar RADAR PDDE | 39706386928 | success |
| Homologação do Excel SME | 39706387008 | success |
| Estabilidade de posição do Prontuário | 39706386975 | success |
| Lighthouse CI | 39706387045 | success |
| Compatibilidade controlada Ubuntu 24.04 x 26.04 | 39706387056 | success |
| CodeQL | 39706386952 | success |
| Confiabilidade funcional com Supabase real | 39706386965 | success |
| Regressão visual desktop | 39706387055 | success |
| Ciclos funcionais reais com Supabase | 39706386986 | success |
| Homologação integral pré-production | 39706386971 | success |
| Backup e restauração descartáveis | 39706387110 | success |
| Hardening específico de sincronização operacional | 39706387054 | success |
| Supabase readiness | 39706386990 | success |
| Gate remoto de perfis e viewports | 39706386934 | success |
| Testes E2E Playwright | 39706386977 | success |
| Uso real operacional com volume semelhante a Production | 39706387025 | success |

O comparador dependente `119593940725` concluiu com status
`diagnostic-comparison-complete`. Artefato `12396436082`, 15.740 bytes,
SHA-256 `6bcdcd94f26a4f504b03beb4db3125f2b7a65e65f582079bbcb217534ab834fb`.
São **duas advertências diagnósticas** (tentativas de leitura e frescor da
baseline não comparável), budgets `not-established/report-only`.
Não representa ganho de fluidez ou atribuição de deltas ao MSW.

Os ZIPs de métricas de **ambas as variantes** foram baixados e abertos.
Ambos registram `stage=reload`, `outcome=passed`, 400 rodadas, seis sessões,
1.107 gestos. Baseline válida: artefato `12396346011`, SHA-256
`7f26d19bac41dc3e0c30dc7ab009e1c624e74326a8f0dec3e1e02a8bd0151c3e`.
Candidato: o mesmo `12395124341` já conferido acima.

O download do comparador encontrou quatro artefatos de métricas e selecionou
os dois válidos/atuais, preservando o arquivo inicial incompleto. **Os seis
hashes de fontes do comparador coincidem exatamente com session-report,
pg-stat-before e pg-stat-after dos ZIPs válidos**. Não houve mistura com o
snapshot SQL da referência incompleta.

O SHA de workflow `5dc903b4f16a67402e246f857f0c7c97e727bd68` é o merge
sintético da CI. Sua árvore foi conferida no Git e é idêntica à do candidato:
`5ed6cd8928b122645dd06500d7fe0f6a5e3a4c2c`.
O diff é vazio. Próximo passo delimitado: integrar o HEAD homologado e verificar
a publicação automática, sem nova rodada de implementação.

## Integração confirmada

O #443 foi integrado em **`84e793ed42a9139d8f80fcf2a16b868d8bba656e`**,
em **22/10/2026 às 01:59:35 UTC (21/10 às 22:59:35 de Brasília)**.
PR fechado/merged, sem Draft. A árvore da main coincide exatamente com a árvore
homologada `5ed6cd8928b122645dd06500d7fe0f6a5e3a4c2c`; diff vazio.

No checkpoint desta integração, a Vercel iniciou o deployment automático
`dpl_C5bVMtw36XLVVuEHdkmdVaJZbV2T` em BUILDING, no SHA correto.
Os sete workflows de push pós-merge também iniciaram. A publicação e seus
pós-testes só devem ser declarados concluídos após a conferência real abaixo.

## Publicação e pós-testes concluídos

Deployment automático **`dpl_C5bVMtw36XLVVuEHdkmdVaJZbV2T`**, Production,
**READY em 22/10 às 02:00:51.123 UTC (21/10 às 23:00:51 de Brasília)**.
Origem `84e793ed42a9139d8f80fcf2a16b868d8bba656e`, alias oficial associado
sem erro. Página e `radar-build-manifest.json` HTTP 200, no mesmo SHA e modo
`supabase-production`.

Bundle público SDK Supabase **2.118.0**, 265.570 bytes, hash inalterado
`33b09b0db467df88254207a45a76fa6ab293ab1539f76c63683a78d75a7a86eb`.
O agente principal executou o smoke canônico
`scripts/check-production-system.mjs`, uma tentativa com `--expected-commit`
no merge final: **approved, 52 assets, anonymousRlsEvidence=blocked-401**.
Não houve deploy manual, mudança de configuração ou escrita institucional no
Supabase. Essas conferências públicas não equivalem a jornada humana autenticada.

Os sete workflows de **push no SHA do merge**, conferidos separadamente dos
workflows de PR, passaram sem repetição:

| Workflow da main | Run | Resultado |
| --- | --- | --- |
| Saúde das dependências | 39708856263 | success |
| Validar RADAR PDDE | 39708856237 | success |
| Lighthouse CI | 39708856291 | success |
| Monitoramento contínuo de Production | 39708856265 | success |
| CodeQL | 39708856136 | success |
| Regressão visual desktop | 39708856314 | success |
| Supabase readiness | 39708856217 | success |

Readiness inclui migrations, prontidão e frontend/Auth/RLS no backend
descartável. Nenhum resultado de outra árvore substituiu esses checks.
Não foram somados testes sobrepostos como cobertura única.

**Decisão final:** integração e publicação justificadas pela compatibilidade
comprovada da API, sonda negativa com controle positivo, preservação dos quatro
contratos originais, revisão do lock, ausência de mudança em fontes do produto,
CI do mesmo HEAD, equivalência da árvore mergeada e pós-testes efetivos.
O incidente inicial da amostra controle não foi apagado nem transformado em
defeito do produto. Sua causa-raiz não é declarada resolvida. Melhorias de
desempenho e paridade de privilégios continuam fora desta entrega.
