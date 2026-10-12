# Auditoria independente de navegação e Task9 — OUTRO AGENTE (12/10/2026)

> **PROVENIÊNCIA:** esta investigação foi executada por um segundo agente do ChatGPT, NÃO pelo Codex responsável pelo PR #438. Resultados, hipóteses e testes devem ser **validados ou contestados pelo Codex**. Não confundir este relatório com um checkpoint de implementação do Codex.

## Escopo e rastreabilidade

- Sistema: RADAR PDDE; [PR funcional #438](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/438) ainda Draft.
- Código funcional analisado: 53f2fe991f0c4460576346cbca3a2375bf8c9890; baseline main: 113841bda52ce3bbda228524daf9a7464f12b462.
- Trabalho independente: [PR #441](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/441), branch audit/independent-agent-navigation-red-2026-10-12; baseado no #438.
- Teste novo: [independent-agent-navigation-regressions.test.js](../../tests/unit/independent-agent-navigation-regressions.test.js).
- Execução local futura: node --test tests/unit/independent-agent-navigation-regressions.test.js.
- Composição da prova: módulos **reais** de navigation-routes, navigation-policy, navigation-bootstrap, navigation-history, task-9-pendencias-page e task-9-focus-bridge executados em Node vm; DOM e History API reduzidos e determinísticos.
- Nenhuma alteração nos módulos de produto, SQL, perfis, migrations, Supabase ou Production. REDs **intencionais**, não podem ser incorporados diretamente à main antes da correção.

## CI independente comprovada

Versão do teste validada: commit 79c788675c1ab4d8f0101b41d6eb541f7d823b50 do PR #441. Houve uma primeira versão (44624dab) cujo teste de Voltar/Avançar parava no Voltar por limitação do DOM reduzido; foi ajustado **apenas esse teste**, para avaliar especificamente a situação após Avançar.

- [GitHub Actions Validar RADAR PDDE, execução 38311838135](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38311838135).
- [Relatório JUnit bruto, artifact 11775091848](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38311838135/artifacts/11775091848).
- XML JUnit baixado e inspecionado: **1.351 testes, 1.347 PASS, 4 FAIL, zero skipped e zero error**. Todos os quatro FAIL pertencem exclusivamente ao novo arquivo independente. Todos os três controles do mesmo arquivo passaram. Nenhum teste unitário preexistente falhou.
- A execução do pipeline fica vermelha **como consequência esperada** de anexar testes adversariais a código ainda não corrigido, não por modificação do produto.

| Teste | Esperado | Observado | Resultado |
|---|---|---|---|
| Controle Task9 presente antes da navegação | Filtro e rota ESC-LOCAL | ESC-LOCAL | PASS |
| Controle rota escolar inexistente na lista autorizada | Redireciona para /carteira sem filtro | Redirecionou | PASS |
| Task9 carregado depois de aplicação da rota autorizada | Filtro ESC-LOCAL reaparece na página | Filtro vazio, rota ESC-LOCAL | **RED** |
| Limpar rota → Voltar → Avançar | URL e filtro ficam sem escola após Avançar | URL sem escola; filtro ESC-LOCAL | **RED** |
| Limpar filtros | URL, rota interna e history.state coerentemente limpos | Rota interna mantém ESC-LOCAL | **RED** |
| Remover chip escolar, renderizar novamente | Filtro continua vazio | ESC-LOCAL reaparece | **RED** |
| Repetir eventos readiness | Sem duplicar wrappers/autoridade | Identidade preservada | PASS |

## Análise causal, distinguindo confirmação e hipótese

### 1. Rota escolar aplicada antes da existência da página Task9

**Confirmado em VM com scripts reais.** NavigationBootstrap tenta aplicar o filtro chamando a autoridade RadarTask9PendencyPage, ainda inexistente. O comando fica sem efeito. Depois, a página moderna é instalada, mas sua inicialização não recupera a escola da rota anteriormente autorizada. O teste constata rota interna ESC-LOCAL e filtro da página vazio. Esse mecanismo é **plausível** para o RED intermitente do primeiro acesso nos três workflows falhos do PR #438, mas a cronologia exata do navegador precisa ser instrumentada.

### 2. Estado de rota antigo consultado durante a navegação

**Confirmado em VM quanto ao efeito.** NavigationHistory aplica a rota solicitada e só depois confirma currentRoute; a ponte de foco pode ler essa rota antiga durante a renderização e reativar ESC-LOCAL. O RED isolado confirmou especificamente a divergência **após Avançar**, quando URL e rota estão sem escola e o estado Task9 voltou à escola anterior. **Hipótese causal forte**, não prova de que todo E2E real siga a mesma ordem.

Não corrigir mecanicamente adiantando currentRoute antes da autorização: NavigationPolicy pode transformar uma rota solicitada em outra permitida. A solução deve preservar a distinção entre rota solicitada e **rota autorizada**.

### 3. Limpeza visual que não reconcilia histórico e filtros

**Confirmado em VM com script real.** clearPendencyFiltersContextStable chama history.replaceState com history.state antigo e novo URL /pendencias. A rota interna de RadarNavigationHistory e history.state continuam referindo ESC-LOCAL. Ao renderizar posteriormente, FocusBridge reaplica o filtro antigo. A remoção do chip escolar tem uma rota distinta, mas mantém a mesma divergência. Esses são dois REDs adicionais reproduzíveis.

### 4. Ordem de composição de wrappers

**Confirmado em experimentos controlados complementares.** A precedência relativa de Task9 e NavigationBootstrap altera os resultados de sincronização; ao instalar NavigationBootstrap antes da autoridade nova de Task9, wrappers previamente construídos podem ficar fora da cadeia posteriormente sobrescrita. É preciso testar ambas as ordens na UI real, preservando operadores de foco, eventos de navegação e regras de acesso.

### 5. Histórico vs regressão

Os arquivos centrais NavigationRoutes/NavigationBootstrap/NavigationHistory são idênticos na main 113841bd e no candidato 53f2fe99. O corpo de sincronização do FocusBridge já existia antes; a mudança recente se concentra na instalação por eventos. Isso **sugere fragilidade herdada ou exposta por nova ordem de inicialização**, mas não certifica que o defeito fosse igualmente observável na interface antiga. O Codex deve testar A/B se essa atribuição de origem for relevante.

## Limites, critérios de aceitação e instrução para contestar

1. A VM não executa app.js integral, DOM real, Playwright, Supabase ou Auth. Os REDs provam conflitos de contratos entre módulos reais sob interleavings controlados; **não** provam vazamento de dados ou problema em Production.
2. No teste de Voltar/Avançar, o filtro logo após Voltar não é usado como condição obrigatória, pois o DOM reduzido não reproduz todo o render; o RED afirmado é **após Avançar**. O E2E Auth real deve verificar cada transição.
3. O controle de escola não autorizada só usa a política do front e lista escolar simulada; políticas RLS no banco não foram testadas por este agente.
4. O Codex deve instrumentar a ordem efetiva dos módulos e eventos, capturar URL, history.state, currentRoute, estado real do filtro e execução da autorização, além de tornar estes quatro REDs GREEN **sem relaxar as expectativas**.
5. Diferenciar filtro de escola imposto por rota e filtro manual; evitar criar outra autoridade concorrente, sincronização circular, wrappers redundantes ou alterações na proteção patrimonial.
6. Só depois reproduzir na UI autenticada, fazer testes desktop, Perfis, Prontuário, contatos/cancelamento/reabertura, reload e CI dos gates falhos do #438. Manter #438 e #441 sem merge até homologação.

**Estado final deste agente:** investigação independente preservada, **4 REDs / 3 controles GREEN comprovados em CI**, nenhum produto alterado, Codex ainda precisa confirmar ou contestar a causalidade no sistema real.
