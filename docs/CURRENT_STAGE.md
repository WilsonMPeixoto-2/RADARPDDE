# RADAR PDDE — estado atual e retomada

## Continuação da manutenção de tooling — 21/10/2026

**Versões desta árvore:** dependency-cruiser **18.7.0** (#469), ESLint **10.13.0** (#470) e Knip **6.42.1** (#471), mantendo Prettier 3.9.10, Playwright 1.64.1, Axe 4.14.0, SDK Supabase 2.118.0, CLI 2.114.0 e Node 24. São atualizações de análise, sem alteração nas regras, configurações, scripts, ignores ou runtime do site. Não representam correção nem ganho medido de fluidez.

- **Entregas anteriores concluídas:** #469 integrado em `8f8e5f996c117bbb2925d5b0cfbcdaafbb1e8b7c`; #470 em `6a6dab30e92eb9ae12d9d84b153b68618192fb74`. Ambos concluíram 19/19 workflows. O #469 teve timeout inicial de prontidão após login (20 cenários passaram); a única repetição do job concluiu 21/21, sem mudanças de produto, teste ou timeout. Isso não encerra a causa da intermitência.
- **Composição do #471:** a primeira versão isolada `e9f72342` concluiu 19/19 workflows. A reconciliação com a main acima preservou as versões de ESLint e Knip no mesmo contrato, sem retirar asserções. Os resultados finais de CI e publicação da composição são identificados por SHA no [PR #471](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/471), não pelo verde da versão inicial.
- **Prova local integrada:** instalação limpa, `test:readiness` (1.368 unitários e 8 integrações sem falhas/ignorados), Knip real, lint, tipos, artefatos e arquitetura aprovados. Arquitetura permaneceu em 191 módulos/276 dependências; diagnósticos de ESLint e saída do Knip foram preservados. Configurações não foram relaxadas para homologar ferramentas.
- **Evidências datadas:** [dependency-cruiser](evidence/2026-10-21-dependency-cruiser-18-7.md), [ESLint](evidence/2026-10-21-eslint-10-13.md) e [Knip/composição](evidence/2026-10-21-knip-6-42.md). Resultados de candidatos não substituem a conferência do deployment efetivamente publicado. O último checkpoint de Production anterior a esta continuação está preservado abaixo; revalidar o manifesto ao vivo.
- **Fronteiras:** MSW 3, CLI Supabase/paridade de grants, manutenção PostgreSQL e novos recursos de plataforma continuam separados. #446/#447 são diagnósticos, Caso A da #460 continua aberto e indicadores mensais permanecem suspensos. Nenhuma dessas frentes foi retomada por esta manutenção.

## Publicação anterior e reconciliação — 21/10/2026 (checkpoint datado)

**Checkpoint de publicação às 20:41 UTC:** `main@855fa0d71322dd133dd9f41ddbf36daba10d513c`, após integração do Axe #464. Prettier #462, Actions #444, SDK #457, medição E2E #463, Playwright #461, reserva de portas #467 e acessibilidade do Dashboard #466 também foram integrados. Não retomar esses PRs como candidatos pendentes.

- **Versões na main:** Prettier 3.9.10, Supabase JS 2.118.0, Playwright 1.64.1 e Axe 4.14.0. Node 24 e CLI Supabase 2.114.0 preservados. As Actions continuam fixadas em SHA.
- **Publicação verificada em 21/10, após #464:** Vercel `dpl_FGfg4ffwqBXJqN4RW9bVwKMy91bV`, READY às 20:41:41.654 UTC, domínio e manifesto públicos HTTP 200 no SHA `855fa0d71322dd133dd9f41ddbf36daba10d513c`. Bundle público 2.118.0 com hash homologado; Edge Function `team-account-management` ACTIVE v341, SDK 2.118.0 e `verify_jwt=true`, fonte `index.ts` idêntica à main. São leituras de versão/publicação, não jornada autenticada humana nem CRUD institucional. Revalidar esses identificadores antes de depender deles em outra entrega.
- **CI do Axe:** HEAD `daccec00f795d83f68fd8f57c1e7aeeb84529706`, 19/19 workflows aprovados. [E2E 39666305743](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39666305743): 226 aprovados, 68 pulados, nenhuma falha, incluindo scan Axe 4.14.0 e contrato dos cinco cartões. [Uso real 39666305795](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39666305795): ambas as variantes e comparador concluídos; 10 advertências diagnósticas de custo, sem budgets estabelecidos e com baseline histórica #408. Não atribuir ganho de fluidez ao upgrade do scanner.
- **Instrumento e produto foram separados:** #463 corrigiu a medição da primeira linha textual do modal, sem CSS/tolerância artificial; #466 corrigiu o nome acessível dos cartões preservando filtros e estilo; #467 reservou portas no runner descartável, sem alteração de banco ou runtime. O Caso B da #460 está resolvido; o Caso A de prontidão/hidratação após reload continua aberto.
- **Fila daquele momento:** dependency-cruiser, ESLint e Knip ainda estavam em avaliação; esse estado foi sucedido pela continuação acima. MSW 3, CLI Supabase, PostgreSQL hospedado, credenciais e recursos pagos permanecem frentes separadas.
- **Frentes preservadas:** #446/#447 continuam diagnósticos Draft, não correções aprovadas de desempenho; indicadores mensais permanecem suspensos. Esta manutenção não reabre auditoria funcional nem encerra as hipóteses sistêmicas.

[Evidência e proveniência da reconciliação](evidence/2026-10-21-tooling-mobile-reconciliation.md). Não há handoff de execução corrente designado; os checkpoints de candidatos abaixo são históricos, superados pelo código e pelos merges relacionados acima.

## Histórico do candidato SDK — 21/10/2026 (superado pelo merge #457)

O [checkpoint original](evidence/2026-10-21-supabase-sdk-update.md) preserva os RED/GREEN locais e os limites anteriores à publicação. O #457 foi integrado em `3ca37a5d23481f9f2893dade07bb1d415bd15821` após 20/20 workflows do HEAD reconciliado `6e649fc4dae015a49b5691236a2eddf8db4e7065`; a Edge Function hospedada foi conferida explicitamente. Menções a candidato/Draft/aguardar CI nesse arquivo descrevem sua data, não a fila atual.

## Histórico da manutenção inicial — 20–21/10/2026 (superado pelos merges)

A baseline inicial era `d1f1dad60778c1b8f67bb660e8ad06736b9ab219`. [Evidência local original](evidence/2026-10-21-tooling-refresh.md) e [checkpoint remoto imutável `91cc1783`](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/91cc1783640f5551df34d07b9e74ca563d45aa66/docs/evidence/2026-10-21-tooling-refresh-final.md) preservam os resultados, falhas iniciais e repetições daquela rodada. O Playwright inicialmente permaneceu Draft por #460; após #463, o HEAD reconciliado passou 19/19 workflows e foi integrado em #461. Não repetir as correções nem reutilizar o estado pendente desse momento como descrição da main.

## Encerramento da ordenação do Prontuário e CI — 19/10/2026

**Checkpoint histórico de encerramento em 19/10.** A entrega continua encerrada; versões, PRs e publicações posteriores são descritos no checkpoint de 21/10 acima. Não há handoff de execução corrente designado; o handoff da Etapa 5 preserva evidências históricas do #438.

- **Ordenação do Prontuário:** [PR #448](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/448) integrado em `55a3bf8df8e9ff130102bbca681c21d6247c9596`, candidato `d7bcc2f0bf5aec00024a8e8d23fcdf96da08745d`. Básico → Qualidade → Equidade; Conectada antes de Adolescências quando ambas presentes. Critérios de avaliação, persistência, Auth/RLS, SQL e carregamento operacional preservados.
- **Prova funcional:** 12/12 workflows do candidato concluídos com sucesso; [E2E final](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39231461006), job `118042343723`, com 225 aprovados e 68 ignorados; [ciclo funcional](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39231460958), job `117993810462`, com 21/21 aprovados após repetição isolada. O E2E dirigido usa oito programas sintéticos, opera bonificação/análise, troca competências, verifica foco/rolagem e ausência de novas movimentações em grade já ordenada. Capturas reais dos quatro blocos foram abertas e inspecionadas. Não houve Preview interativo READY; não confundir a inspeção das jornadas Playwright com sessão interativa independente em Preview.
- **Publicação da entrega visual:** deployment `dpl_8Gstvi8Z669ocy4v7gYcvn6jVyty`, READY no merge acima. Commits documentais posteriores podem avançar main/manifesto sem mudar o runtime; revalidar o ambiente ao vivo.
- **CI:** #449, #451, #454, #450 e #455 integrados; #455 em `fcf4eda47196b4e5fd9730d433abe21fa8099edb`, 29/29 workflows concluídos com sucesso, com repetições isoladas documentadas. Runners Ubuntu 26.04; CLI Supabase 2.114.0 preservada. O #455 também reserva 54320–54323 fora das portas efêmeras dos runners descartáveis, preservando reservas existentes.
- **Residuais dos testes:** prontidão após reload, captura geométrica durante reposicionamento e retry de suíte serial que reencontra fixtures já usadas continuam pontos específicos de fragilidade; não afrouxar asserções nem alterar produto para fazer CI passar. No #448, o primeiro ciclo falhou numa captura com painel parcialmente fora do viewport e o retry serial reencontrou dados anteriores; a repetição do job em ambiente novo passou. O primeiro E2E completo falhou na geometria de um modal de Despesa a identificar e seu retry interno falhou no fechamento do modal; o job final passou sem modificar código, CSS, tolerâncias ou timeouts. Os três testes específicos da ordenação passaram também na execução inicial. Esses resultados não encerram a causa completa das intermitências. O comparativo de volume do #455 registrou nove advertências diagnósticas e orçamentos de custo não estabelecidos; sucesso de workflow não certifica performance global.
- **Desempenho sistêmico:** os Drafts #446/#447 preservam evidências de clonagem, debounce, fallback por cobertura e renders. São diagnósticos e testes de caracterização, não correções aprovadas. Antes de escolher a primeira otimização, reconciliar os testes úteis com esta base e medir a massa efetivamente residente e o caminho crítico em jornadas equivalentes; não transplantar os workflows antigos nem declarar regressão apenas com ensaios sintéticos.
- **Paridade service_role:** permanece a decisão pendente descrita na [auditoria](audits/2026-10-18-supabase-cli-rls-parity.md). Não atualizar CLI, alterar grants/RLS ou relaxar pgTAP antes de reconciliar o contrato desejado com o banco efetivo.
- **Indicadores mensais:** a correção das bolinhas históricas e o novo aviso de Pendências permanecem suspensos e separados. O merge do #448 não autoriza essa implementação.

**Recuperação:** a custódia externa permanente do backup cifrado e a disponibilidade da senha histórica permanecem pendentes de confirmação operacional; não expor credenciais nem presumir posse a partir de um ensaio de restauração aprovado.

Nenhuma escrita de teste em Production, migration ou alteração de privilégios foi feita nesta entrega. A frente visual #448 está encerrada; os handoffs anteriores não constituem autorização para reabrir auditoria ampla ou modificar sincronização.

---

## Histórico de infraestrutura CI — 18/10/2026 (superado pelo encerramento acima)

**Correção já integrada à main:** [PR #449](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/449), commit de merge `aac142453d3fad112e3b3c8caba177aad87d9697`. O erro externo `toomanyrequests` em `postgres-meta:v0.97.0` foi corrigido com `SUPABASE_INTERNAL_IMAGE_REGISTRY: ghcr.io` **somente** nos steps de `gen types --local` dos dois workflows. CLI Supabase 2.114.0, SDK 2.117.3, Node 24, RLS e migrations preservados. Evidências: [readiness completo](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595283), [homologação pré-Production](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595305), [E2E](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595236), todos aprovados (E2E após retry por falha geométrica antiga independente). Ver [runbook canônico de CI](runbooks/CI_TOOLCHAIN_REGISTRY.md).

**Frente visual em andamento e separada:** [PR #448](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/448), reordenação visual dos programas no Prontuário, permanece Draft em 18/10; agente Work está preparando provas de controles/foco/rolagem, algumas ainda não publicadas na branch. **Não tocar nessa branch nem inferir homologação de testes locais não publicados.** A integração do #449 não homologa automaticamente o #448. Nenhum deploy de Production decorre deste checkpoint.

**Atualização Ubuntu/GitHub Actions, 18/10:** conforme [migração oficial do GitHub para Ubuntu 26.04](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration/), o [PR #451](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/451) foi integrado (`aa7e14c96ed375227bf4622ef6411c4b86c31f07`, 15/15 workflows verdes), seguido do [PR #454](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/454) (`384a8d80bd34b663153a5b5aeb985bbb93f51c8d`, 16/16 workflows verdes), que homologou em Ubuntu **26.04** os 17 jobs críticos, incluindo pgTAP, Auth/RLS, Playwright e homologação integral. O [PR #455](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/455) finaliza a migração dos 32 workflows restantes, sujeito aos próprios gates antes de integrar. Teste comparativo 24/26 preservado. Não regredir automaticamente para runner antigo ou ampliar versões de CLI sem contraprova.

**Contraprova de paridade RLS de 18/10:** [experimento #452](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/452) comparou 2.114.0 (674/674 pgTAP PASS) e 2.121.0 (672/674, testes 32/33 de service_role). **Nova leitura em Supabase Production confirmou que service_role possui DELETE nas duas tabelas**, enquanto os testes exigem ausência do grant. A migration de bootstrap concede SELECT/INSERT/UPDATE, sem REVOKE explícito de DELETE anterior. Logo, o vermelho da 2.121.0 **não comprova regressão da CLI**; há divergência entre teste e grants reais a reconciliar, sem alteração em Production. A CLI 2.114.0 permanece fixa preventivamente; [PR #453](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/453) de bloqueio exato foi **encerrado sem merge**. Ler obrigatoriamente [auditoria de paridade](audits/2026-10-18-supabase-cli-rls-parity.md) antes de tentar upgrade, corrigir teste ou modificar RLS. [PR #451](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/451) de runners teve 15/15 workflows aprovados e foi integrado, assim como o #454, que passou 16/16, sem afetar a frente Work #448.

---

## Histórico após o PR #438 — publicado em 13/10/2026

**Etapa 5 encerrada no escopo delimitado das sete correções do Controlador.** Este bloco registra a entrega do #438 e não substitui o checkpoint de encerramento mais recente no topo. Não confundir a auditoria ampla A–N ou desempenho global com as sete entregas certificadas.

- **GitHub:** [PR #438](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/438) integrado. `main` em `05b27fcdd523dd42d33935d96a1a68314a2513ac`; árvore Git idêntica ao candidato homologado `61e93b7fda69a51d592e5e5c9056f0d16d82c4d5`.
- **CI:** 22/22 workflows de homologação aprovados no candidato; **11/11 pós-merge aprovados**. O fluxo Auth/CRUD completo foi testado em Supabase descartável, não com escrita institucional em Production.
- **Supabase Production (`scnryinorqeucbfkioxo`):** 61ª migration `20261011193500_inventory_terminal_delete_protection` aplicada previamente ao merge, [run `38472434475`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38472434475). Dois triggers novos mais o trigger anterior ativos; RLS e políticas preservadas; 163 escolas, zero vínculos NF–patrimônio órfãos; `production_integrity_check()` = `healthy`, zero inconsistências em 19 controles.
- **Vercel Production:** [deployment `dpl_8hczsN9GeFyq3PBL5fo526gQi3VG`](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/8hczsN9GeFyq3PBL5fo526gQi3VG), estado `READY`. Alias [radarpdde-fix.vercel.app](https://radarpdde-fix.vercel.app) e manifesto público confirmaram `05b27fcd...` e `supabase-production`.
- **Recuperação:** [backup lógico cifrado, restauração e descriptografia verificados no run `38471486995`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38471486995). Artefato `11852510513`, expira em **11/01/2027 às 21:33 UTC**; exige a **senha de banco vigente na data do backup**, também após eventual rotação. Custódia externa e posse da senha histórica ainda requerem confirmação operacional; detalhes no [runbook](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md#10-a-backup-cifrado-da-production-no-release-do-pr-438).

**Importante:** as frases “Draft”, “sem merge”, “migration pendente”, “Production intacta” e “CI em andamento” nos checkpoints datados a seguir são **históricas e não descrevem o estado atual**. Nenhum teste adicional de performance/Realtime nem alteração funcional está autorizado por este encerramento.

---

## Histórico anterior ao merge do PR #438 (não vigente)

> Fechamento delimitado: requisitos e evidências no RELEASE_SCOPE_2026-10-13.md
> da pasta do handoff único. Frescor herdado não constitui regressão demonstrada
> do #438. Preservar sincronização vigente; próxima decisão é publicação das
> correções verificadas, com migration 61 controlada e CI final, sem nova bateria
> exploratória. Ajuste adicional apenas na saída temporária do script de auditoria.

> Checkpoint superveniente 13/10: comparação curta main/candidato concluída.
> Ambas convergem após 44 gravações; atualização remota chega a 23,67/24,85 s
> durante atividade contínua. Não demonstra regressão do #438. CI 99fa: 22 verdes;
> gate longo concluído com advertências, sem homologação geral de performance.
> Ver conclusão e limites no handoff único. PR permanece Draft, sem deploy.

> Checkpoint superveniente13/10: catálogo escolar permanece selecionável após
> limpar. Auth3/3,13E2E navegação (1skip mobile) e1.361 unitários aprovados.
> Três testes de retry tornados determinísticos após contraprova do relógio real;
> runtime Realtime intacto. CI/ comparação sustentada ainda pendentes; falha Docker
> separada de produto. Ler handoff único e classificação. PR438 Draft, sem merge.

## Histórico da Etapa 5 — auditoria operacional iniciada em 11/10/2026

**Checkpoint histórico de 12/10:** revisão do PR independente441 pelo agente principal,
sem subagentes. Correções de navegação, página tardia e seletor sem Pendências
consolidadas:1.359 unitários,24 E2E dirigidos (1skip mobile),3 jornadas Auth reais
aprovados. Retorno ao Prontuário corrigido causalmente. CI final pendente,438 Draft,
sem merge/deploy. Lentidão sistêmica e jornadas A–N não estão encerradas. Ler o
checkpoint datado do handoff histórico abaixo; detalhes históricos não certificam HEAD.

**Frente descrita naquele checkpoint:** jornadas A–N do Controlador, orientadas pela UI e experiência
real, após a modernização #433–#437. Não repetir certificação histórica nem
reimplementar #408/#410/#427/#429. **Handoff histórico daquela frente:**
[controller-journey/HANDOFF.md](audits/2026-10-11-controller-journey/HANDOFF.md).

Baseline revalidada: main `113841bda52ce3bbda228524daf9a7464f12b462`;
Production `dpl_Az4q8VTqmWdT8e5tMxYTGyKv7SHo`, READY no mesmo SHA;
Supabase Production com última migration `20261004210000`. Smoke público aprovado,
52 assets, leitura anônima bloqueada (401). Isso **não prova jornada autenticada**.

Preparação e limites: [ENVIRONMENT.md](audits/2026-10-11-controller-journey/ENVIRONMENT.md).
Contexto/invariantes dos PRs: [CONTEXT.md](audits/2026-10-11-controller-journey/CONTEXT.md).
Navegador real headed/ARIA/screenshot/CDP/MCP preparados em executor cloud;
Chrome pessoal depende de conexão no Desktop. Supabase descartável preparado,
com login local real, para históricos e patrimônio terminal. Após pausa para o
Chrome pessoal (extensão confirmada instalada), o usuário autorizou **continuar
neste ambiente cloud**: jornadas locais retomadas sem certificação de Production.
Configuração Codex portátil adicionada; transporte do navegador pessoal continua
não confirmado. No PR #438 há correções candidatas de identificação do documento
nos modais corretivos e instalação de ações após login tardio. RED causal,
GREEN Auth/RLS/RPC e revisão independente registrados em
[CAUSAL_FINDINGS.md](audits/2026-10-11-controller-journey/CAUSAL_FINDINGS.md).
**Naquele checkpoint, main e Production ainda estavam intactas.** A auditoria A–N e a certificação
visual/CI final continuam em andamento. Branch `audit/controller-journey-2026-10-11`.

Checkpoint de 11/10, 19:40 UTC: proteção de submit concorrente de contato e ajuste
dos três rodapés corretivos foram verificados em testes focados e UI Auth do
descartável. CI `6139fe79`: 18/19 verdes, um timeout legado não reproduzido em
main/candidato isolados. A auditoria confirmou exclusão de NF e bem Inventariada
pela ação ordinária; falha herdada da main e bloqueio para conclusão desta frente.
RED, logs sanitizados, novas jornadas e próximos passos constam do handoff único.
O PR #438 permanece Draft; nenhum merge/deploy desta auditoria foi realizado.

Checkpoint posterior, 11/10 às 22:45 Brasília: proteção terminal implementada no
serviço e na migration candidata 61, com 58 unitários dirigidos, 18 pgTAP causais,
41 arquivos pgTAP isolados, concorrência SQL e duas sessões Auth/UI aprovados.
CI do checkpoint 52efc260 terminou verde; a CI do novo candidato com migration
ainda precisa concluir. Handoff acima contém caminhos, limites e publicação pendente.

Os blocos seguintes são checkpoints datados anteriores. Prioridade “somente leitura”
do saneamento de 08/10 é contextualizada pela autorização superveniente da Etapa 5:
CRUD sintético reversível apenas com conta legitimamente autorizada; efeitos
irreversíveis permanecem no ambiente descartável. Não alterar registros reais.

---

## Atualização de dependências — 10/10/2026 (checkpoint atual)

**Etapas 0–4 encerradas e integradas à `main`, em PRs independentes:**
[#433](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/433) Knip `6.41.0`;
[#434](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/434) `@types/node` `24.19.2`;
[#435](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/435) `@supabase/supabase-js` `2.117.3` (bundle do navegador e import da Edge Function alinhados);
[#436](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/436) Playwright `1.64.0` (`@playwright/test`, `playwright` e `playwright-core`).
Todas as alterações foram integradas em **10/10/2026**; não houve mudança oportunista em regras de negócio, CSS, SQL ou permissões.

**Baseline técnica após o PR #436:** `main` `7fa7089e139bc6c96600d27642802aea0943d349`. **Production verificada:** deployment Vercel `dpl_CwjyM6xsLZhJeAikcWwG3wTsTvAW` (SHA `7fa7089e139bc6c96600d27642802aea0943d349`), `READY` no domínio `radarpdde-fix.vercel.app`. Node `24.x`, Supabase CLI `2.114.0` e MSW `2.15.0` mantidos.

**Ativações:** Knip já roda no workflow de dependências; TypeScript continua limitado ao escopo configurado; SDK do navegador usa o bundle regenerado; Playwright já instala o Chromium correspondente e produz traces/screenshots/vídeos. Novidades experimentais/opt-in não foram habilitadas sem necessidade comprovada. **Edge Function confirmada diretamente no Supabase Production**: `team-account-management` ACTIVE v323, import SDK `2.117.3` e `index.ts` idêntico ao da `main` (leitura em 10/10/2026).

**Documento de evidência e decisões:** [modernização de dependências 10/10/2026](audits/2026-10-10-modernizacao-dependencias-etapas-0-4.md), incluindo inventário integral das 25 dependências diretas, contagem da CI, diferenças entre benefícios automáticos e recursos opcionais, ressalvas e próximos passos.

**Próxima frente independente:** homologação das jornadas reais (Etapa 5), especialmente NF, Pendência, novo envio, reanálise, perfis simultâneos e persistência. A avaliação da eventual migração para **Node 26** ficará para depois, com experimento isolado. Não reabrir os PRs antigos de dependências para essa modernização.

---

## Estado vigente após saneamento documental — 08/10/2026

**Reconciliação formalmente encerrada:** o [PR #431](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/431) foi integrado na `main` em
`6e3b611698a024c6799aa377544961e5c2d1b0e3`, após seis workflows verdes.
O deployment Vercel Production `dpl_BLJAtPbhEoMDnxfnS3t4Q7zGggSY` está `READY` no mesmo SHA. O PR alterou apenas documentos e fontes da matriz funcional; **não modificou runtime, SQL, Auth/RLS, CSS ou regras de negócio**.

**Saneamento administrativo efetuado sem merge de código:** [#430](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/430) (duplicado documental), [#292](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/292) (diagnóstico visual histórico), [#395](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/395) (plano superado), [#407](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/407) e [#409](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/409) (candidatos experimentais substituídos pela arquitetura posterior). Os respectivos comentários preservam justificativas e evidências. **Fechar um PR não equivale a homologar hipóteses ou executar seu conteúdo.**

**PRs abertos que não devem ser encerrados por antiguidade:** #264 (manutenção ampla a reavaliar), #284 (readiness antigo pausado, com risco residual a examinar), #394 (indicadores históricos a reproduzir), #324 (Skill opcional a avaliar), #379/#414/#423/#424 (dependências a testar individualmente). A [classificação de 08/10](audits/2026-10-08-governanca-prs-pos431.md) é um checkpoint datado.

**Próxima prioridade de produto:** observação autenticada *somente de leitura*, em desktop, do drawer `PROD-UX-08` e dos indicadores históricos #394; documentar evidências e distinguir falha atual, já resolvida ou ainda não reproduzida. Depois qualificar risco efetivo de IDs gerados por horário/readiness e avaliar jornadas antes de propor melhorias. Não usar login incompleto, tela de acesso ou testes antigos como prova visual.

## Histórico da retomada documental anterior à integração do #431

**Base conferida em 08/10/2026:** main `a5a67d34b6dcab04903b6657fb9fa01f0aba9d11`,
merge do [PR #429](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/429).
Production `dpl_BW2hefHBNgc7Aq1R4j7wEBsfYE9K`, `READY`, no mesmo SHA.
São fatos datados, não constantes para futuras entregas.

**#410/#427/#428 e #429 estão encerrados.** O candidato final do #429,
`761560c056845f8b9dcaa017853d52f6dbfba76f`, concluiu nove workflows verdes,
incluindo o gate sustentado `37691286270`. O RED original e a contraprova
`37665993736` provaram a força causal do novo teste. A integração ocorreu em
07/10/2026 às 22:00:57 UTC. O deployment posterior publicou o merge normalmente;
o PR não mudou runtime, schema, Auth/RLS ou dependências.
O [handoff #429](handoff/2026-10-07-pr429-reconnect-proof.md) é histórico concluído.

**Prioridade daquele checkpoint (já concluída pelo #431):** reconciliar planos, demandas e documentação,
preservando regras posteriores e entregas já concluídas. O
[relatório de reconciliação](audits/2026-10-08-reconciliacao-planos-demandas.md)
registra evidências, limites e classificação dos PRs; não cria autoridade de negócio.

| Item | Situação e próximo passo |
|---|---|
| NAV-01/UX-04 do antigo #375 | Escopo original incorporado integralmente pelo #376, integrado em 26/09. Uma rodada de revalidação posterior não equivale a implementação pendente. |
| PROD-UX-08 — drawer desktop | Achado histórico a reproduzir na versão atual antes de corrigir. Não foi novamente homologado nesta reconciliação. |
| #394 — indicadores mensais históricos | Draft não integrado; verificar a leitura dos meses fora do contexto operacional atual antes de reaproveitar o candidato. |
| IDs persistentes e readiness sistêmico | Existem geradores por horário em DirectoryService e polling de instalação. Qualificar alcance e risco; não há incidente atual demonstrado nesta análise. A idempotência de NF já foi entregue. |
| Smoke autenticado #426 | Infraestrutura integrada; execução manual específica com conta real permanece adiada. Success de workflow não prova sozinho a identidade usada. |
| Fase D / planos antigos / #395 encerrado como histórico | Requalificar objetivos por entrega e residual. Não iniciar refatoração ou repetir performance por checklist histórico. |
| Evolução visual | Após a triagem, recuperar DESIGN_TOOLING.md e avaliar jornadas reais antes de escolher um piloto de superfície completa. |

Sequência posterior ao encerramento documental: observar drawer e indicadores
históricos → qualificar residuais técnicos → avaliar jornadas do produto e
selecionar a próxima entrega pelo impacto atual. Nenhuma alteração funcional
decorre apenas da existência de um documento antigo. Proteção patrimonial
adicional e anulação/transferência auditável continuam decisões separadas.
Naquele checkpoint não havia handoff corrente; a Etapa 5 foi designada posteriormente
e suas sete correções foram encerradas pelo #438. Esse encadeamento é histórico.

## Atualização canônica — sincronização agregada integrada e publicada

**Integração funcional verificada em 07/10:** [PR #427](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/427),
merge `09083d91227e3f136496e34a5eef3a0c1158fa78`. A árvore integrada é idêntica à do
candidato certificado `90414a8056bb5ac706a925376ead48681e014ec6`.
**Production de encerramento:** `dpl_5L41YQCcnLHnbE5kT4s5UtG6cvvg`, `READY`;
manifesto no merge acima, em `supabase-production`. O módulo publicado coincide
com a saída do build canônico. Commits exclusivamente documentais posteriores
podem avançar a main/deployment sem reabrir a entrega; revalidar esses fatos ao vivo.

**Frente de sincronização agregada encerrada.** Dashboard, Carteira e Competências
usam a fatia escolar existente para eventos conhecidos com cobertura segura.
O candidato final concluiu **14/14 workflows**, seis E2E nativos e a prova sustentada
de seis sessões/400 rodadas. Na jornada pareada de oito gestos, cada observador
passou de oito RPCs globais/133.356 bytes para oito escolares, zero globais e
53.362 bytes (aproximadamente 60% menos bytes). DOM/mutações não diminuíram;
não atribuir ganho de CPU ou percentual de Production a essa medição sintética.
O smoke público pós-merge confirmou 52 assets, RLS anônima `blocked-401` e preflight
das Edge Functions. Os **8/8 workflows pós-merge** concluíram com sucesso,
incluindo o contrato público de login/RLS/responsividade. [Evidências, certificação e limites](evidence/2026-10-07-aggregate-school-sync/README.md).

**Não há handoff corrente desta frente.** O [registro de 07/10](handoff/2026-10-07-aggregate-school-sync.md)
passa a histórico concluído; #407/#409 e checkpoints pré-merge do #410 não formam
fila de correções. #415, #422 e #426 permanecem integrados. O fallback global
continua necessário para contexto incerto, contatos, cobertura invalidada,
reconexão/eventos perdidos e união conservadora de várias escolas.

- **PR #410** permanece integrado no merge `33ebbf7310898e025a3ec2edc198d6ecd4ea40ac`. A simplificação de sincronização operacional por escola está publicada; validações pós-merge com perfil Controlador não detectaram regressão funcional conhecida.
- **PR #415** permanece a implementação canônica de observabilidade. O build Production injeta Vercel Web Analytics e Speed Insights sem framework adicional nem dependência de runtime. Preview/local não recebem a instrumentação.
- `/_vercel/speed-insights/script.js` e `/_vercel/insights/script.js` estão presentes no HTML de Production e responderam HTTP 200.
- **Web Analytics:** **ativo**. Em 07/10/2026, o painel autenticado da Vercel confirmou **1 visitante e 1 visualização de página nos últimos 7 dias**. A coleta já começou.
- **Speed Insights:** configurado e ativo para coleta de dados de campo. Os Core Web Vitals passarão a ganhar representatividade conforme usuários reais utilizem o RADAR; ausência de volume inicial não é pendência de configuração.
- O script oficial de Speed Insights ignora automação/headless (`navigator.webdriver`/Headless); Playwright e sandboxes não devem ser usados para fabricar amostras de campo.
- **Divergência conhecida do conector:** a chamada `count_pageviews` deste ambiente ainda pode responder `404 Web Analytics not found` mesmo com o painel Vercel mostrando Analytics ativo e dados registrados. Não interpretar esse erro isolado como desativação; enquanto persistir a divergência, o painel autenticado é a autoridade para o estado administrativo.
- **PR #416 do Vercel Agent:** permanece fechado sem merge. A dependência `@vercel/speed-insights` era redundante e não deve ser reintroduzida enquanto a integração HTML/vanilla vigente permanecer suficiente.
- **PR #422 — tooling/CI:** integrado em `e78a0e68c3b8d88303209549852d6d705d355421`. Foram atualizados ESLint `10.12.0`, Lighthouse `13.5.0`, Knip `6.40.0`, Acorn `8.19.0`, Stylelint `17.16.0` e eslint-plugin-playwright `2.12.1`. MSW permanece `2.15.0` e `@types/node` permanece na linha 24. O Supabase CLI `2.120.0` foi homologado e **reprovado** por repetir exatamente os testes pgTAP/RLS 32–33 de `service_role`; a versão canônica continua `2.114.0` e `2.120.0` foi adicionada ao bloqueio exato do Dependabot. Todos os 18 workflows do candidato final #422 concluíram verdes após a retirada da CLI reprovada.

**Resultado operacional:** a frente de observabilidade Vercel está concluída em configuração. Web Analytics já registra tráfego real; Speed Insights está apto a registrar métricas reais de performance à medida que houver navegação humana.

Referência operacional durável: [observabilidade Vercel](reference/VERCEL_OBSERVABILITY.md).

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 8 de outubro de 2026

## Histórico técnico do PR #410 — encerrado

> **Nota de validade:** esta seção preserva checkpoints anteriores ao merge do #410. Menções abaixo a PR em Draft, candidato remoto, handoff corrente ou etapas ainda pendentes pertencem ao histórico de execução e **não representam o estado atual**. O estado vigente está no bloco canônico acima.

**Retomada naquele checkpoint:** candidato remoto `d571a26a`, com aplicação e sincronização
escolar já implementadas. A revisão de 06/10 reproduziu cinco falhas de recuperação
e preservação do escopo global, mesmo com 57 contratos anteriores verdes.
[Evidência/decisão](evidence/2026-10-06-pr410-review/README.md). RED publicado em
`da5174ec`, seguido de GREEN local com política compartilhada de refresh e união
de escopos. GREEN funcional `a6a02120`: 1.294 unitários; 63 contratos + quatro E2E
reais no CI; readiness com 655 pgTAP e 17 Auth/RLS/frontend. Dois advisories de
desenvolvimento continuam bloqueando gates, com correções disponíveis. PR continua
Draft; ainda confrontar demais jobs e custo sustentado/cliente. Os parágrafos seguintes descrevem checkpoints
anteriores e não devem ser usados para reimplementar as etapas já entregues.

O usuário autorizou seguir a simplificação incremental em 04/10/2026. O [#410](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/410) parte da main pós-#408 (`d9bf67f7...`), também confirmada no manifesto Production. Continua Draft; não altera o ambiente publicado nesta etapa.

O handoff corrente é [início do #410](handoff/2026-10-04-pr410-start.md). O [plano executável](superpowers/plans/2026-10-04-operational-sync-simplification-implementation.md) registra caracterização, autoridade de rota, leitura/aplicação por escola, Realtime, fallback e remoção gradual de mecanismos. Primeiro incremento: Próxima unidade deve atualizar rota e escola visível pelo caminho canônico, com RED/GREEN de navegador.

O incremento de rota `d4a37d79...` concluiu 16 workflows verdes. A [caracterização
das seis coleções](evidence/2026-10-04-pr410-school-scope/README.md) avançou com
35 pgTAP locais e na pilha Supabase real (run `37200758428`, 566 pgTAP totais),
metadados/contagens somente de leitura em Production e mapa de
históricos, exclusões e projeções. Há contraprova de FK entre escolas permitida
pelo schema; não truncar esse vínculo na RPC futura. Contatos gerais têm cobertura
própria. O checkpoint de testes `1d13b02c...` concluiu 17 workflows com sucesso.

Incremento escolar candidato: migration `20261004132755`, RPC invoker sem consumo
no frontend, envelope/completude e fallback global para referências não isoláveis
nos dois sentidos. Provas locais: 81 pgTAP e 489 coberturas equivalentes sobre a
fixture de agregados históricos. [Evidências e limites](evidence/2026-10-04-pr410-school-rpc/README.md).
Certificação final no SHA `c29b1d55...`: **18 workflows verdes**, Supabase nativo
647 pgTAP/39 arquivos, 16 E2E Auth/RLS/frontend e 489 equivalências. Na comparação
final pareada, escola densa reduz p50 SQL em 41,0% e JSON em 96,1%. Os limites da
fixture e do custo SQL versus UI estão explícitos no relatório. Próximo incremento:
capacidade Repository e aplicação atômica por escola; novo Realtime ainda pendente.

#407 e #409 permanecem fontes de evidência. O #409 continua Draft: novos E2E de Realtime falharam no candidato `5553f130...`; o checkpoint `2d7706f3...` guarda erros e instruções. Não é base de implementação do #410. A aprovação da direção arquitetural não aprova migrations, cortes de recuperação ou merge antecipado.

As proteções do #408 são regressões obrigatórias. Os detalhes do design precisam provar escopo/históricos, exclusões, retorno autoritativo, origem da escrita e recuperação após suspensão. RPC, aplicação da fatia e sincronização dirigida já existem no candidato atual. Os checkpoints anteriores não certificam automaticamente sua composição final ou a prontidão de publicação.

## 1. Estado funcional corrente

**As Fases A, B e C estão encerradas.** A antiga Fase D não foi iniciada como pacote; seus objetivos devem ser reconciliados com #396/#410/#427 e os residuais descritos na retomada acima.

**A Fase 2 de autonomia dos Controladores e UX da retificação está encerrada, integrada e publicada.** O PR #404 foi mergeado em `de7bebb06b867ebd557ff83cd9194fe3d45f5903` e publicado no deployment Production `dpl_CLYY92KojCXpmQcL8xXQkmc3TdgG`, `READY`, com smoke HTTP 200 na raiz e em `/escolas/04.31.001`. A retificação de classificação permanece limitada ao histórico exclusivamente fiscal encerrado/cancelado e falha fechada diante de Pendência ativa, atividade/histórico de Assessoria, `a_identificar`, bem `Inventariada` ou versionamento desconhecido.

**A sincronização agregada está encerrada; não há handoff corrente operacional desta entrega.** Proteção patrimonial adicional e anulação/transferência auditável não integram essa entrega. As demandas de interface e os planos antigos seguem a classificação da retomada acima.

**O PR #397 — independência entre despesas e bonificação — permanece integrado e publicado.** A ADR-055 e a leitura contextual do #396 são preservadas. A [continuidade após o #397](handoff/2026-09-30-pos-publicacao-pr397-retomada.md) passou a contexto histórico desta entrega.

O encerramento da Fase 2 não homologa novamente PROD-UX-08 nem uma rodada posterior de navegação. O escopo original NAV-01/UX-04 entrou antes, pelo #376. #394, #395 e Fase D não são abertos automaticamente por aquela entrega.

Registro da publicação de 30/09/2026:

| Fronteira | Evidência confirmada |
|---|---|
| Candidato | `0e149e148ecef708db3ab05faf9c1b5e43338fe6`; 45 checks concluídos, 43 aprovados e dois skips condicionais de Preview, sem falhas |
| Integração | [PR #397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397), merge `a5e200e5c3d7955cea0a6122bde1904469771ac3`; árvore idêntica à do candidato |
| Supabase Production | As duas migrations `20260929213000_expense_bonification_independence` e `20260930003000_expense_verification_field_ownership` foram aplicadas em ordem; histórico 56 → 58; corpos e metadados das três funções conferidos |
| Vercel Production | `dpl_suHN66eJ41tsHKPmS5SAs6N7iJnu`, `READY`; manifesto no merge acima, em `supabase-production` |
| Interface real | Formulários de NF disponíveis com bonificação vazia, Não, N/A e contexto consolidado; formulário de `a_identificar` e ações após reload conferidos; formulários cancelados, sem novas despesas |

[Evidência da publicação, checks e limites](evidence/2026-09-30-pr397-production-release/README.md). Os 20 ciclos de gravação/edição/exclusão passaram em Supabase descartável real no candidato. Não houve ciclo CRUD em Production nesta publicação: não foi definido um contexto de teste. O smoke observacional não homologa os defeitos visuais preexistentes nem substitui esse ciclo de escrita.

A correção de dependências foi incorporada ao candidato com `npm audit` sem vulnerabilidades e sem troca de ExcelJS/Ajv/esbuild. O backup completo deixou de ser pré-requisito por instrução do usuário; a execução já iniciada também concluiu com `restoreVerified: true`, 57 tabelas conferidas e artefato cifrado preservado localmente. Nenhuma atividade adicional de backup ou repetição dos 45 gates permanece necessária para encerrar o #397.

Os SHAs e deployments acima identificam a entrega funcional comprovada. Conferir o head e o manifesto ao vivo quando forem relevantes para uma nova alteração; commits documentais posteriores não reabrem essa entrega.

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

O handoff da sincronização agregada de 07/10 é histórico concluído, com encerramento indicado no início deste documento. O handoff do #410 e [Retificação de classificação e UX](handoff/2026-10-01-controller-type-retification.md) são históricos concluídos, assim como os handoffs de candidato/publicação do #397. [PROD-UX-08](handoff/2026-09-28-prod-ux-08-drawer-clipping.md) continua uma pendência separada de retomada visual. A investigação de `PROD-FUNC-09` está encerrada.

Para retomada, a ordem de leitura continua sendo:

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. este arquivo;
5. handoff corrente indicado acima, quando houver;
6. `docs/reference/ENGINEERING_METHOD.md`;
7. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`;
8. `docs/reference/STATUS_DOCUMENTOS.md`;
9. matriz funcional e ADRs da área afetada.

## 5. Demandas a verificar e planos a requalificar

A baseline principal da jornada desktop de **Despesa a identificar / Pendências / novo envio / reanálise / navegação** foi homologada por evidências complementares em ambiente local, Supabase descartável no CI e Production autenticada.

A auditoria histórica anterior à publicação do #397 confirmou em Production criação, retificação, identificação como Material de Consumo, transição para `Aguardando reanálise`, reanálise negativa coerente com ausência de arquivo real, retorno para `Aberta`, preservação de invoice/Pendência e persistência após reload no registro sintético autorizado. Essa prova pertence àquela auditoria; não representa um ciclo CRUD executado no deployment do #397.

**`PROD-FUNC-09` está encerrado em Production.** O PR [#392](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/392) corrigiu apenas o formatter de datas civis. Persistência, bridge, domínio e view model já preservavam `2026-09-27`. O merge `8284a02faf3d9381ad42e66b6d93677d396e8515` foi publicado no deployment `dpl_F8BVw5Js5v1HCcykq3NwBXa6SHzK`, `READY`, com manifesto no mesmo SHA e smoke aprovado.

A aba autenticada foi recarregada e o mesmo registro sintético, sem nova escrita, mostrou **Disponibilização 27/09/2026** e **Registro 27/09/2026, 23:12**. O CI do candidato terminou com **28 checks concluídos: 26 aprovados e 2 ignorados, sem falhas ou pendências**. [Evidência de encerramento](evidence/2026-09-28-prod-func-09-date-business/README.md).

A investigação de **`PROD-UX-08` — clipping e sobreposição do drawer global em desktop** aguarda reprodução na versão atual. As publicações de #392 e #397 não homologam a composição inteira do drawer. Esse achado é diferente do escopo original UX-04 de largura mobile, incorporado pelo #376; uma revalidação posterior deve ter motivo e condições atuais explícitos.

O [registro de setembro](handoff/2026-09-28-prod-ux-08-drawer-clipping.md) é histórico da demanda e ponto de reprodução, não handoff corrente nem prova de persistência da falha em outubro.

A **Fase D — hardening e performance** era um pacote de planejamento. Parte importante de sua intenção foi atendida por entregas posteriores; seus residuais precisam de decisão própria. Os Planos A–D do Draft #395 são outra família de planos: A evoluiu por #396/#410/#427; B conserva residuais a qualificar; C é PROD-UX-08; D trata rebaseline/evidência. Nenhuma dessas nomenclaturas constitui fila automática.

A avaliação separada de ferramentas para evolução visual permanece em [DESIGN_TOOLING.md](evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md): Figma conectado e provas isoladas de Sharp/SVGO/Lucide/Fontsource. Nenhuma biblioteca nova dessa avaliação foi adicionada ao runtime.

### Sucessão obrigatória após a fila corretiva imediata

A discussão sobre modernização visual **não é memória opcional de conversa**. Depois de encerrar os defeitos e refinamentos imediatos oriundos da auditoria atual — `PROD-FUNC-09` já está encerrado; a fila remanescente começa por `PROD-UX-08` e pelos demais ajustes que forem formalmente mantidos — o próximo agente deve, **antes de abrir uma nova frente ampla de layout/design**, ler e reavaliar:

`docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md`

Esse documento é uma avaliação técnica datada, portanto suas versões de pacotes e conclusões de compatibilidade devem ser revalidadas ao vivo antes de adoção. O que não deve se perder é a **frente de produto** que ele registra: explorar direção de arte, design system, tokens, componentização, iconografia, tipografia, Figma/Superdesign, Storybook/galeria de estados, otimização de assets e outras ferramentas capazes de elevar a qualidade visual do RADAR além de correções locais de CSS.

Essa retomada deve combinar o estudo de tooling com o método permanente instituído pelo PR #389: qualquer proposta visual precisa ser avaliada como sistema integrado e passar pela aceitação humana outside-in. Não iniciar migração de framework ou instalar bibliotecas apenas por modernidade; primeiro comparar benefício observável, custo, risco e compatibilidade com a arquitetura vigente.

Ao encerrar a fila corretiva remanescente, `CURRENT_STAGE.md` deve apontar explicitamente para um novo handoff de evolução visual que cite `DESIGN_TOOLING.md`; não saltar diretamente para Fase D ou outra frente sem decidir conscientemente esse próximo passo.
