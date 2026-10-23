# A8 — capacidade Fuse.js 7.5: custo da reconstrução do índice

**Status:** experimento isolado; sem alteração funcional na main. **Data:** 23/10/2026. **Base:** `main@ea00ca5409e24158a904d2a754803f953eeed2a0`.

## Hipótese real de produto

`src/integration/global-search.js` contém `search(query)` que chama `rebuildEngine()` (linha 403) para toda consulta com pelo menos dois caracteres. `rebuildEngine` executa `createSearchCatalog` e `createSearchEngine`, independentemente de terem mudado escolas, Pendências ou permissões. `Fuse.js 7.5.0` é usado com `useTokenSearch: true` e `tokenMatch: 'all'`. O estudo anterior verificou que o `FuseWorker` não aceita diretamente a opção utilizada.

## Experimento e limite

- Usar as funções **reais** `createSearchCatalog`, `createSearchEngine` e `searchCatalog` do RADAR; massa **100% sintética** com 163 escolas e 400 pendências de estresse, oito consultas por sessão.
- Comparar 24 pares alternados de sessões: recriar índice a cada consulta versus criar uma vez e pesquisar sucessivamente.
- Usar a mediana da sequência de oito consultas; tempo de Node em GitHub Actions não equivale a tempo percebido pelo Controlador no navegador.
- Provar paridade exata de IDs e ordenação. Provar filtragem de escola/Pendência fora do escopo. Provar **obrigatoriedade da invalidação**: índice existente não encontra uma nova Pendência até reconstrução. Não desabilitar segurança nem alterar o runtime.
- Manter testes unitários canônicos de busca. Benchmark não tem exigência de ganho percentual e não bloqueia por latência do runner.

## Decisão pendente

Ainda são necessárias duas verificações antes de propor alteração de produto: (1) custo real no navegador usando catálogo de sessão e digitação sob perfil autenticado; (2) eventos de invalidação completos para recarga, novo envio, análise, troca de escola, competência, perfil e logout. O reuso indiscriminado introduziria dados defasados ou resultado de outro escopo. Adotar mudança somente com prova de melhoria perceptível, ranking e acessibilidade preservados, e isolamento de perfis.

O piloto não mede Lighthouse user flows, Clone/StatePort, consulta SQL ou experiência humana. Esses itens permanecem frentes distintas.
