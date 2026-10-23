# A9 — contraprova de apresentação sem Lighthouse

**Estado inicial:** protocolo, antes da execução desta série.
**Base funcional:** `main@ea00ca54`; continuação diagnóstica do Draft #482 e #481.

## Pergunta e fronteira

A passagem anterior encontrou INP de 418 ms, com 392 ms de apresentação, numa
única gravação instrumentada pelo Lighthouse. Precisamos verificar se a demora
também aparece no navegador sem esse profiler. Não há mudança funcional proposta.

O coletor existente ganha um modo opt-in de **uma NF por invocação**, sem
Lighthouse/Axe, e observação nativa de Event Timing, Long Animation Frames,
long tasks, callbacks de frames, visibilidade/foco e fases da escrita/cobertura.
O observador não muda resultado de comando, fila, timer, cobertura ou fallback.

## Série fixada antes de medir

- Seis invocações: fonte, build, build, fonte, fonte, build. Três por variante;
  não estimar percentis de população nem escolher a melhor repetição.
- Duas sessões reais de Controlador, mesma viewport 1440×900, mesma competência
  2026-05, NF de consumo de 123,45. A autora deve estar visível ao salvar.
- O build usa `buildVercelArtifact`/esbuild existentes com configuração local de
  teste. Não é Vercel/CDN nem reprodução integral do ambiente Production.
- Cada invocação adiciona escola/identidades sintéticas próprias e as remove ao
  finalizar. Conferir contagens antes/depois, massa residente, versão do browser
  e hashes dos assets. Não resetar nem remover fixtures de outras investigações.
- Event Timing tem limiar mínimo de 16 ms e duração arredondada; ausência de
  entrada não será publicada como zero. Guardar timestamps e eventos da interação.
- Long Animation Frames só reporta frames acima de seu limiar; callbacks rAF
  não são prova de paint. Não somar métricas sobrepostas.
- DOM, RPC e reload continuam conferidos; não trocar asserções por métricas.
- Uma contraprova instrumental em HTML mínimo verifica que o observador detecta
  um click deliberadamente lento. Não é defeito do RADAR nem benchmark do produto.

## Critério de parada e interpretação

Terminar após as seis execuções planejadas. Falha de preparação fica registrada
como preparação. Não iniciar otimização de CSS, banco ou sincronização apenas por
um número. Se a demora não se reproduzir, ela continua **não generalizável**, sem
atribuir automaticamente culpa ao Lighthouse. Comparar profiler exige par próprio
com os demais fatores iguais; essa série testa existência sem profiler e efeito
do build, não isola todos os fatores históricos do A9.

O registro de fases também deve dizer se uma escrita foi confirmada/aplicada
antes de um refresh global por cobertura ausente. Isso distingue o mecanismo
observado da afirmação ainda não provada de que a proteção pode ser removida.

Ambiente: Supabase local descartável existente, PostgreSQL 17.6, 61 migrations;
massa pequena. Não é evidência de velocidade em Production nem efeito causal
do upgrade de PostgreSQL, Playwright ou Lighthouse.
