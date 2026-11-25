# Reconciliação do diagnóstico sistêmico — 19/10/2026

**Natureza:** conclusão do *checkpoint investigativo*, e não encerramento do problema de desempenho. PR #446, originalmente produzido contra `main@1a1cda117e31f84647bf4591e4d6db899ef231f1`, reconciliado com a linha principal posterior aos PRs #438, #448, #449–#455 e #459. Os arquivos originais foram preservados sem alterar seus resultados históricos. A versão anterior da branch foi arquivada em `archive/pr446-performance-diagnostics-20261014` no SHA `9bcd919abb8eb6c0798a7db7a5616de715bbddff`.

## Quais evidências continuam sustentadas

| Mecanismo | Evidência existente | O que ainda falta provar |
| --- | --- | --- |
| Debounce Realtime de 2 s reiniciado sucessivamente | Testes determinísticos do PR #447 e ensaio de 44 commits com convergência final; atrasos até ~23,7–24,8 s naquele estresse | Frequência e latência percebida na rotina real, limite máximo de espera e carga segura |
| Promoção de atualização por escola para global | Fluxos de invalidação, fallback `MISSING_BASELINE_COVERAGE` e caracterização A+B do #447 | Taxa de ocorrência por tipo de escrita, custo SQL e impacto no DOM da versão atual |
| Amplificação de clones por entidade | Ensaios com 1/163/1.630/16.300 registros alterando apenas um; custo mediano máximo relatado 523,07 ms, *somente CPU local sintética* | Cardinalidade realmente residente no navegador e fração do caminho crítico atribuível à clonagem |
| Renderização de Nota Fiscal | Perfil Chromium de bonificação, análise e NF identificou uma reconstrução completa após a NF na amostra analisada | Custo incremental de DOM/layout e equivalência funcional de uma atualização localizada |
| RPCs globais mais extensas que escolares | Incidente de 02/10 e redução de tráfego no #427 | Contagem atual de consultas sob atividade representativa, pois estatísticas históricas não medem causalidade corrente |
| Crescimento da auditoria | Contagens e capacidade de consulta paginada examinadas | Custo marginal de triggers e persistência, sem assumir que o histórico seja carregado no bootstrap |

Os valores acima são históricos e possuem escopos/denominadores diferentes. Nem o resultado de testes sintéticos nem os deltas de um benchmark de seis sessões constituem percentis populacionais, SLO de Production ou prova de que um único mecanismo é a causa predominante.

## Reconciliado contra o estado posterior ao PR #459

- A correção funcional do #438, a ordenação visual do #448, a restauração da geração de tipos pelo GHCR (#449) e o Ubuntu 26.04 (#451/#454/#455) já estão integrados.
- **Não transplantar para a main workflows do PR #447 derivados da baseline anterior.** Incorporar seletivamente testes diagnósticos sobre o CI vigente; condicionar perfis caros à campanha de medição, não ao sucesso obrigatório de todo PR.
- Uma falha histórica do `supabase-local` por rate limit ECR não é regressão da arquitetura de desempenho e já teve correção específica no #449.
- O conteúdo antigo do handoff permanece **evidência datada**, não ordem vigente para modificar runtime ou executar migração.
- Os dois pgTAP de `service_role` e CLI 2.121.0 permanecem questão de paridade independente; não alterar privilégios para fazer testes de desempenho passar.
- Os indicadores mensais V2.1 permanecem separados e não foram implementados.

## Qual é a próxima ação autorizada pela evidência

Após a incorporação ou reconciliação seletiva do PR #447, abrir uma frente **nova** de medição da latência ponta a ponta: clique → feedback inicial → resposta remota → estado autoritativo aplicado → pintura estabilizada → convergência entre sessões. Medir separadamente CPU/GC, tamanho real da coleção na memória, clones, chamadas globais/escolares, aplicação de snapshots e substituições do DOM, usando fluxos de NF, Bonificação, Análise, Pendência, competência e login em ambiente descartável representativo.

Somente uma comparação pareada com o mesmo conjunto de dados, número de gestos e funcionalidades preservadas deve fundamentar um PR funcional de otimização. Preservar rollback, versões, autorização, identidade fiscal, Pendências, patrimônio terminal e consistência entre sessões. **Não** retirar `structuredClone`, snapshots ou fallback Realtime com base apenas nesses experimentos.

**Limites de release:** este PR altera somente documentação e evidências versionadas, não o runtime, workflow, SQL, migrations, Auth/RLS, Production ou regras de negócio. O encerramento do documento não equivale a encerrar a investigação de causa ou resolver a lentidão.
