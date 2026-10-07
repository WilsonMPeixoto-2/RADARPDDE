# Observabilidade Vercel — RADAR PDDE

**Classe documental:** Referência operacional vigente  
**Atualizado em:** 7 de outubro de 2026

## 1. Objetivo

Preservar o contrato de observabilidade Vercel do RADAR sem depender de memória de conversa ou de configuração implícita do painel.

## 2. Implementação canônica

A integração vigente foi introduzida pelo **PR #415** e mergeada em `0d54bdec5639f19e362e5fbcc2dcf0ab790f5696`.

O RADAR é uma aplicação **HTML/JavaScript vanilla**. Não usa Next.js, React ou outro framework que exija componente específico de Analytics/Speed Insights.

O build canônico `scripts/build-vercel.mjs` possui `injectVercelObservability()`. Somente quando `VERCEL_ENV=production`, ele injeta:

- bootstrap `window.va`;
- `/_vercel/insights/script.js` para Web Analytics;
- bootstrap `window.si`;
- `/_vercel/speed-insights/script.js` para Speed Insights.

Preview e desenvolvimento não recebem esses scripts. Essa separação evita contaminar métricas de campo com CI, Preview ou navegação de desenvolvimento.

## 3. Estado operacional em 07/10/2026

| Recurso | Estado comprovado |
|---|---|
| Build Production | instrumentação injetada e publicada |
| Deployment Production observado | `dpl_EGSnij3e9tXPeAwsRxGr4DAaUSdA` — `READY` |
| Speed Insights script | HTTP 200 em Production |
| Web Analytics script | HTTP 200 em Production |
| Speed Insights | configurado e ativo para coleta de dados de campo; o checkpoint ainda não exige volume mínimo como condição de configuração |
| Web Analytics | **ativo no projeto**; painel autenticado da Vercel confirmou **1 visitante e 1 visualização de página nos últimos 7 dias** |

O Web Analytics está, portanto, administrativamente habilitado e já recebeu dado real. O Speed Insights está publicado e habilitado para coletar Core Web Vitals à medida que usuários reais naveguem pelo RADAR.

### Observação sobre a API do conector

No mesmo dia, a chamada `count_pageviews` do conector Vercel deste ambiente ainda retornou `404 Web Analytics not found`, apesar de o painel autenticado da própria Vercel exibir o recurso ativo e dados já registrados. Tratar isso como divergência/atraso do endpoint do conector, **não** como prova de que o Web Analytics esteja desativado. Para estado administrativo, prevalece a confirmação do painel enquanto essa divergência persistir.

## 4. Regra de validação

Para confirmar Speed Insights:

1. visitar Production com navegador humano real;
2. navegar entre superfícies da SPA, por exemplo Painel → Carteira → Prontuário → outra unidade;
3. interagir normalmente e depois ocultar/fechar a aba para permitir flush por `visibilitychange` / `pagehide`;
4. confirmar no painel ou via métrica Vercel que existe ao menos uma amostra real.

O script oficial da Vercel aborta coleta quando detecta `navigator.webdriver` ou user-agent Headless. Playwright, sandboxes e CI **não são prova de coleta de campo** e não devem ser usados para gerar a primeira amostra.

Para Web Analytics, a confirmação canônica atual é a do painel autenticado da Vercel, que já mostrou o recurso ativo e dados reais. Enquanto o endpoint `count_pageviews` do conector continuar divergente, não usar o erro `not_found` isoladamente para rebaixar o estado do recurso.

## 5. PR #416 — decisão preservada

O Vercel Agent criou o PR #416 adicionando `@vercel/speed-insights@^2.0.0` ao `package.json`/lockfile. O pacote não era importado nem utilizado porque a integração vanilla já existia no build.

A CI canônica detectou `@vercel/speed-insights` como **Unused dependency** pelo Knip, derrubando os gates `Saúde das dependências` e `Homologação integral pré-production`. O PR foi fechado sem merge.

**Decisão:** não adicionar o pacote apenas para satisfazer o assistente/painel da Vercel enquanto o contrato HTML/vanilla por script oficial continuar vigente. Qualquer mudança futura deve provar necessidade e passar os gates de dependências.

## 6. Uso futuro das métricas

Com a coleta ativa, usar Speed Insights para orientar otimizações por dados de campo, priorizando FCP, LCP, INP, CLS e TTFB. Não interpretar uma única visita como baseline estável; preferir percentis e janela com volume representativo.

Web Analytics pode apoiar leitura de pageviews, rotas, dispositivos e eventos operacionais do RADAR conforme a necessidade do produto. Não há restrição documental adicional específica para escola, usuário, NF ou Pendência além das regras de acesso e segurança já vigentes no próprio sistema.

## 7. Relação com próximas otimizações

A observabilidade deve preceder novas otimizações amplas. Próximos candidatos conhecidos:

- reduzir refresh global residual em Dashboard/Carteira quando `schoolId` conhecido, em frente separada do #410;
- avaliar self-host das fontes Outfit/Plus Jakarta Sans para remover dependência de Google Fonts, somente após baseline de campo;
- avaliar Image Optimization apenas se Speed Insights/Lighthouse mostrarem custo material nos screenshots/ativos.

Não iniciar migração de framework para obter recursos que a integração vanilla já oferece.
