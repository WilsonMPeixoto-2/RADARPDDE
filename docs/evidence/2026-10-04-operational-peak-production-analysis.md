# Evidência de Production — pico operacional com múltiplos usuários

Data da análise: 2026-10-04

Esta nota registra consultas **somente de leitura** aos logs do projeto Supabase de Production para confrontar a hipótese de uso real levantada durante a investigação do PR #407. Nenhum dado, migration, configuração ou registro de Production foi alterado.

## Premissa operacional informada pelo produto

O uso real não é caracterizado por vários Controladores trabalhando normalmente na mesma escola. Dois Controladores atuando exatamente na mesma escola ao mesmo tempo é possível, mas altamente improvável. Existe uma distribuição operacional de escolas, embora os Controladores mantenham autorização para acessar as demais.

Nos períodos de pico, porém, aproximadamente seis pessoas podem estar alterando dados ao mesmo tempo, em geral em escolas diferentes: criando, corrigindo, excluindo e reanalisando lançamentos. O caso de colaboração simultânea na mesma escola com relevância prática maior é Controlador + Assistente de Verbas Federais.

A exigência do produto é convergência automática sem Ctrl+F5, não reconstrução global e imediata de todas as sessões após qualquer alteração em qualquer escola.

Esta premissa orienta os novos testes, mas **não é assumida como explicação única dos incidentes**. A investigação deve continuar cobrindo custo da RPC, concorrência, RLS, payload, renderização, recuperação de falhas e outras causas independentes.

## Evidência observada no incidente de 2026-10-02

Consultas aos logs de gateway do Supabase para `POST /rest/v1/rpc/read_operational_context` encontraram forte concentração de leituras completas do contexto operacional.

Na janela horária `2026-10-02T18:00` registrada pelo Supabase:

- 986 chamadas de `read_operational_context`;
- 5 usuários autenticados distintos;
- distribuição por usuário: 401, 223, 173, 134 e 55 chamadas;
- 831 respostas HTTP 200;
- 148 respostas HTTP 500;
- 7 respostas HTTP 401;
- tempo médio de origem aproximado: 3,57 s;
- maior tempo de origem observado na janela: aproximadamente 15,44 s.

Outras janelas do mesmo dia também tiveram volume muito alto:

| Janela registrada | Leituras completas |
| --- | ---: |
| 12:00 | 840 |
| 15:00 | 447 |
| 16:00 | 927 |
| 17:00 | 733 |
| 18:00 | 986 |
| 21:00 | 752 |

Os minutos mais carregados mostram simultaneidade entre vários usuários e degradação crescente. Exemplos da janela das 18h:

| Minuto | Leituras | Usuários | Média aproximada | HTTP 500 |
| --- | ---: | ---: | ---: | ---: |
| 18:18 | 71 | 5 | 1,35 s | 0 |
| 18:19 | 55 | 4 | 1,01 s | 0 |
| 18:20 | 50 | 5 | 2,11 s | 4 |
| 18:21 | 19 | — | 7,89 s | 11 |
| 18:24 | 15 | — | 9,49 s | 8 |
| 18:33 | 22 | 5 | 7,60 s | 14 |
| 18:54 | 15 | — | 9,77 s | 12 |

A amostra de respostas 500 consultada apresenta `PostgREST; error=57014`, compatível com consulta cancelada/timeout, com chamadas simultâneas chegando a aproximadamente 8,6–9,1 s antes da falha.

## Leitura causal permitida pelos dados

Os dados **não demonstram sozinhos que a invalidação entre escolas seja a única causa**. Demonstram, porém, algo mais forte que a hipótese inicial:

1. o incidente real coincidiu com vários usuários autenticados;
2. o sistema executou centenas de leituras completas do contexto por hora, chegando a dezenas por minuto;
3. essas leituras ficaram progressivamente mais lentas em várias rajadas;
4. uma parcela relevante terminou em erro 500 por cancelamento/timeout;
5. portanto, reduzir leituras completas que não são necessárias para a tela em uso é uma correção causalmente plausível e mensurável, não apenas uma otimização estética.

A correção por relevância escolar do candidato #407 deve ser julgada por uma comparação nova contra a baseline já publicada após o #408 (`d9bf67f7...`), usando seis Controladores em escolas distintas e, separadamente, Controlador + Assistente na mesma escola.

## Outras causas que permanecem abertas

Mesmo que a amplificação cruzada seja reduzida, ainda é necessário investigar:

- custo intrínseco de uma única `read_operational_context` sob RLS;
- tamanho do payload completo, atualmente calibrado em aproximadamente 1,36 MB na fixture de forma de Production;
- consultas e índices usados pela RPC em concorrência;
- efeito de várias gravações simultâneas sobre CPU/IO/locks e políticas RLS;
- custo de normalização e aplicação do contexto no navegador;
- reconstruções de DOM e Long Tasks;
- interação entre escrita, abort de leitura, retry e reconexão;
- alterações globais ou sem `school_id`, que continuam usando caminho conservador;
- superfícies globais (Dashboard, Carteira, Pendências etc.) que realmente dependem de várias escolas.

A meta é reduzir trabalho inútil **sem trocar consistência por silêncio**: uma escola alterada precisa aparecer atualizada automaticamente quando se torna relevante, e mudanças na mesma escola em colaboração real precisam convergir rapidamente.