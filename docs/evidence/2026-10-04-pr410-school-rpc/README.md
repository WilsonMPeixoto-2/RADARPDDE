# #410 — RPC escolar isolada: contrato, equivalência e custo

Evidência do incremento SQL, em 04/10/2026. Base: `8a7906ed...` sobre main
`d9bf67f7...` pós-#408. Não incorpora o runtime experimental do #407/#409.
A nova migration foi criada pelo Supabase CLI fixado; a leitura global não muda.
Certificação final deste incremento: `c29b1d55888ad36eab6f4c4f3ccb1d027df8e0a8`,
[18 workflows verdes](checkpoint-ci.json), Supabase nativo com 647 pgTAP/39 arquivos,
16 E2E Auth/RLS/frontend, tipos reproduzíveis e 489 coberturas escolares equivalentes.
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
sem pilha Realtime/JSONSchema/Auth nativa. A CI Supabase local real posteriormente
provou a migration, pgTAP, geração dos tipos e gates existentes. O workflow de
readiness agora reproduz benchmark/EXPLAIN e preserva JSON/SQL/logs por 30 dias.
Git recebe agregados, hashes, conclusões e IDs, sem milhares de eventos brutos.

## Primeira prova Supabase nativa — resultado parcial explícito

Run `37207136161`, job `111450566879`, SHA `27821dad...`: **39 arquivos/647 pgTAP
aprovados**, incluindo os 81 escolares. Benchmark, 489 equivalências, EXPLAIN,
concorrência da primeira despesa e lint SQL passaram. [Métricas nativas](supabase-benchmark-first-run.json).
Artefato `11305740693`, SHA-256 `77a18b0071ae09e3cce019c709cfa25682aa0973f21ddb87329498c1bd0f1f53`.

Na mesma execução: global p50 32,686 ms / 1.324.699 bytes; escola densa 17,290 ms /
51.599 bytes (−47,1% no p50, −96,1% em bytes); mediana 10,238 ms / 5.131 bytes;
leve 8,483 ms / 1.191 bytes. Usar comparação dentro da mesma execução; não comparar
diretamente com tempos do contêiner genérico.

O job ficou vermelho **depois dessas provas**, no diff dos tipos gerados: uma única
linha em branco no EOF havia sido removida na edição local. O arquivo foi recuperado
integralmente do artifact do gerador; bundles Ajv/Supabase coincidem byte a byte.
Não se alterou checker nem formato do gerador para aceitar divergência. Os passos
Auth/frontend posteriores foram pulados nessa execução, portanto a certificação
completa precisa da nova CI no SHA com o artifact corrigido. Não chamar este run de
“Supabase readiness verde”.

## Certificação final — Supabase nativo e CI completa

Run `37207524394`, job `111451730919`, SHA `c29b1d55...`: três jobs de readiness
verdes. As mesmas 647 provas pgTAP passaram, assim como 489 coberturas, benchmark,
EXPLAIN, lint SQL, concorrência fiscal, geração reproduzível dos artifacts e 16 E2E
da pilha Auth/RLS/frontend. [JSON quantitativo](supabase-benchmark.json),
[planos nativos agregados](supabase-plan-summary.json), [18 workflows](checkpoint-ci.json).
Artifact `11305895956`, SHA-256 `4929e76cfda177c21affd7adc8e03137055c3b081b39960af9eea9fd9d6137be`.

| SQL, mesma execução final | p50 ms | p95 ms | JSON sem compressão, bytes |
|---|---:|---:|---:|
| Global | 48,647 | 49,773 | 1.327.478 |
| Escola densa | 28,700 | 29,757 | 51.699 |
| Escola mediana | 18,117 | 18,378 | 5.141 |
| Escola leve | 15,258 | 15,516 | 1.193 |

Redução da escola densa: **41,0% no p50**, **96,1% no JSON**. O custo do guard está
incluído. A variação entre runners reforça usar comparação pareada, sem afirmar
um tempo absoluto de Production ou um p99 de produto com vinte amostras.

Limite adicional da fixture reaproveitada: ela reproduz agregados/fechamento por
contexto, mas não a densidade atual de FKs NF/bem e Pendência/NF de Production.
Os casos relacionais específicos são exercitados pelos 81 pgTAP; os números de
performance se referem a esta massa, não a um clone completo. Antes da jornada
sustentada da arquitetura integrada, confrontar distribuição de relações e o
volume então vigente, ampliando a fixture ou usando uma cópia real conforme a
evidência justificar. Não interpretar 489 equivalências como 489 browsers/gestos.

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

Endpoint certificado isoladamente; antes de integrar, preservar este envelope.
Depois: capacidade explícita no Repository; aplicação escolar atômica no DataService/
StatePort; exclusão por cobertura, filhos do snapshot anterior, preservação de outras
escolas, resposta obsoleta/escrita/contexto e rollback. Não enviar a fatia à aplicação
global vigente. Só então Realtime dirigido e journeys com vários usuários ativos.

O #410 permanece Draft. Nenhum ganho de CPU/flicker/convergência entre navegadores
é alegado por este incremento isolado. As proteções do #408 permanecem íntegras.
