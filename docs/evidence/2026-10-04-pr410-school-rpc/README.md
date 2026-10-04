# #410 — RPC escolar isolada: contrato, equivalência e custo

Evidência do incremento SQL, em 04/10/2026. Base: `8a7906ed...` sobre main
`d9bf67f7...` pós-#408. Não incorpora o runtime experimental do #407/#409.
A nova migration foi criada pelo Supabase CLI fixado; a leitura global não muda.
Não há conexão ao frontend nem aplicação em Production neste incremento.

## Contrato e fronteira de aplicação

`read_school_operational_context(p_school_id, p_competence_id, p_history_statuses)`
retorna envelope v1 com escola, competência e histórico solicitado normalizado,
`coverage.kind=competence-and-dependencies`, lista das seis coleções e indicação
explícita de que os contatos são somente os de Pendências selecionadas.

Com `coverage.complete=true` e `fallback=null`, `entities` contém todas as seis
arrays, ordenadas por ID. A completude vale para F(escola, competência, históricos),
incluindo o fechamento histórico/NFs irmãs/bens ligados vigente. Não significa
qualquer histórico da escola nem todos os contatos gerais. Uma array vazia é um
resultado completo nessa cobertura; coleção ausente não é array vazia.

O schema não garante escola comum nas FKs. O guard sob RLS verifica referências
NF/bem, NF/avaliação, Pendência/NF e contato/Pendência nos dois sentidos. Uma raiz
estrangeira pode trazer linhas locais à RPC global, mesmo sem raiz local corrente.
Destinos não visíveis também impedem isolamento. O guard é conservador: considera
relações visíveis da escola em qualquer competência, inclusive fora da cobertura.

Nesse caso retorna `coverage.complete=false`, `entities=null` e
`fallback={kind:global,reason:NON_ISOLATABLE_RELATION}`, sem IDs estrangeiros.
O consumidor futuro deve usar o caminho global existente; nunca aplicar a resposta
como seis arrays vazias. O fallback não corrige integridade nem amplia autorização.
Não há consulta privilegiada que tente descobrir a escola da referência oculta.
Escola não visível/inexistente produz as mesmas arrays vazias autorizadas, sem
consulta de existência capaz de distinguir casos ocultos por RLS.

Função STABLE/SECURITY INVOKER, search_path pg_catalog/public, EXECUTE somente
para authenticated/service_role. Guard e fechamento usam o snapshot do chamador.
A regra de competência/programa histórica é preservada; não foram inventadas novas
constraints de negócio ou limites de histórico. Invoker não é substituído por RLS
manual nem por uma função SECURITY DEFINER.

## Provas executadas e limites

[81 pgTAP locais](local-validation.json): seis coleções comparadas integralmente
com a partição da leitura global; histórico, programa NULL, status terminal,
CASCADE/SET NULL, última NF, arrays completas vazias, perfis autorizado/proibido/
inativo, grants e oito relações cruzadas, incluindo referências de entrada/ocultas.
RED preservado como resumo/hash: o novo endpoint ainda não existia na baseline.
O contrato novo foi escrito antes da implementação; não se alega outro defeito
operacional Production por causa dessa ausência esperada.

[Benchmark](local-benchmark.json), mesma conexão e role authenticated/controller/
4ª CRE, ordem alternada e três warmups. 20 amostras por variante. A massa reaproveita
agregados históricos de 02/10 do laboratório #407 e não o runtime de lá. Totais:
1.077 avaliações, 239 NFs, 366 Pendências, 83 tentativas, 99 contatos, 22 bens,
163 escolas. A leitura de agosto fecha 473/193/329/48/5/21 registros.

Além das amostras, 163 escolas × histórico regular/Resolvida/Resolvida+Cancelada
= **489 coberturas** foram comparadas integralmente à partição global sob RLS.
Não ocorreram divergências nem fallback na fixture isolável. O ensaio usa dados
sintéticos baseados em agregados, não snapshot atual nem prova de todas as jornadas.

| SQL | p50 ms | p95 ms | JSON sem compressão, bytes |
|---|---:|---:|---:|
| Global | 42,498 | 43,530 | 1.327.478 |
| Escola densa (ESC-LOCAL) | 20,606 | 21,154 | 51.699 |
| Escola mediana | 12,759 | 12,945 | 5.141 |
| Escola leve | 10,776 | 10,923 | 1.193 |

A escola densa reduziu p50 em 51,5% e JSON em 96,1%; as demais têm redução maior
de bytes. Esses são tempos de RPC SQL, excluindo serialização, rede, parse/apply,
GC, render/DOM e interação. Bytes são octet_length(jsonb::text), não bytes HTTP.
Percentis de 20 amostras não homologam p99 de uma jornada longa ou infraestrutura
hospedada. Não comparar tempos absolutos com runners anteriores nem definir budget
de produto com estes números.

[Planos agregados](local-plan-summary.json): corpos SQL extraídos da própria migration,
com parâmetros vinculados; EXPLAIN ANALYZE/BUFFERS, RLS do mesmo controlador.
Restrição escolar ocorre nas raízes/dependências antes de UNION/JSON. Avaliações e
NFs utilizam índices escolares existentes. Não há chamada da RPC global para depois
filtrar JSON e não foram criados índices por suposição.

Há custo residual real: o guard faz validação bidirecional e os subplanos RLS de
`pendency_attempts` ainda leem Pendências autorizadas além da escola. Portanto,
“fatia escolar” não significa que absolutamente todo o trabalho passou a ser local.
O ganho medido inclui o guard; planos instrumentados têm outro custo e não devem
ser somados ou comparados diretamente aos percentis do benchmark.

O banco local genérico é PostgreSQL 17.11/pgTAP 1.3.4 com bootstrap compatível,
sem pilha Realtime/JSONSchema/Auth nativa. A CI Supabase local real deve provar a
migration, todos os pgTAP, geração dos tipos e os gates existentes. O workflow de
readiness agora reproduz benchmark/EXPLAIN e preserva JSON/SQL/logs por 30 dias.
Git recebe agregados, hashes, conclusões e IDs, sem milhares de eventos brutos.

## Reprodução

1. Recriar Supabase descartável com migrations e seed local (59 nesta branch).
2. `npm run supabase:test:db` e `npm run supabase:lint:db`.
3. `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -X -qAt -v ON_ERROR_STOP=1 -f supabase/tests/benchmarks/read-school-operational-context.sql`.
4. `node scripts/explain-school-operational-read.mjs > school-read-explain.sql`;
   executar esse arquivo com o mesmo psql, somente no ambiente descartável.

O benchmark exige tabelas operacionais vazias e executa toda a preparação/leitura
em uma transação com rollback. Não resetar pg_stat_statements. Não rodar em Production.
O gerador de EXPLAIN não executa banco: extrai e vincula os SQLs reais para inspeção
reproduzível. Mudança no formato que invalide a extração falha explicitamente.

## Próxima fronteira

Antes de integrar: certificar o SHA no Supabase nativo e revisar este envelope.
Depois: capacidade explícita no Repository; aplicação escolar atômica no DataService/
StatePort; exclusão por cobertura, filhos do snapshot anterior, preservação de outras
escolas, resposta obsoleta/escrita/contexto e rollback. Não enviar a fatia à aplicação
global vigente. Só então Realtime dirigido e journeys com vários usuários ativos.

O #410 permanece Draft. Nenhum ganho de CPU/flicker/convergência entre navegadores
é alegado por este incremento isolado. As proteções do #408 permanecem íntegras.
