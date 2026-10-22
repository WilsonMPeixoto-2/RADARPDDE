# Supabase CLI 2.121: causa dos grants e candidato preservando o contrato local

**Data:** 22/10/2026. **Classe:** evidência datada do PR #472; não altera política de Production.

Base: `main@84e793ed42a9139d8f80fcf2a16b868d8bba656e`. A manutenção não retoma as frentes de desempenho #446/#447/#460. O PostgreSQL hospedado já foi atualizado pelo proprietário; esta entrega trata exclusivamente da CLI e da stack descartável.

## 1. O relatório externo foi confrontado com os artefatos

O #379, HEAD `9dc9be585cc82597bdb11f21fb5bd49a3fd7309d`, terminou 16/19 workflows. As três classes de falha têm causas distintas:

- Unitários: 1.368/1.369, expectativa literal `2.114.0` versus dependência `2.121.0`. [Run 39709112652](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39709112652), job `119595939644`; artefato JUnit `12395828059`, SHA256 `e0a4ea406c93000d93d0b411107871c74c13a18e5770bf7472e9a8e61604485a`.
- Supabase readiness: porta `54322` ocupada no startup, job `119595939874`, [run 39709112699](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39709112699). Reset, pgTAP e Auth posteriores não foram executados. O log não identifica o dono do socket; não atribuir essa ocorrência específica à alocação efêmera sem evidência. O job ainda não tinha a reserva já usada por confiabilidade/uso real.
- Pré-Production: startup/reset concluídos; exatamente as asserções 32/33 de `rls.test.sql` falharam, 672/674. Job `119595940114`, [run 39709112706](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39709112706). O agregador final refletiu essas falhas; não constitui outra regressão.

Os 21 ciclos reais da candidata passaram no job `119595939551`, [run 39709112556](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39709112556). Isso não aprova etapas puladas nos outros jobs.

## 2. Causa localizada antes das migrations do produto

O RADAR omitia `api.auto_expose_new_tables`. Nas fontes oficiais:

- [2.114, legacyApplyApiPrivileges](https://github.com/supabase/cli/blob/v2.114.0/apps/cli/src/legacy/shared/db-bootstrap/db-setup.ts): ausente ou `false` executa a revogação dos grants automáticos de novas tabelas; `true` preserva-os.
- [2.121, applyApiPrivileges](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/db-bootstrap/db-setup.ts): `Option.getOrElse(..., () => true)` faz ausente equivaler a `true`; somente `false` explícito executa a revogação.

O SQL atua em `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, antes da criação das tabelas do RADAR. A migration `20260714180621` concede SELECT/INSERT/UPDATE para o bootstrap local, mas não revoga um DELETE herdado. Logo, a configuração ausente da nova CLI produz precisamente a divergência registrada desde as tentativas anteriores.

A [documentação de exposição da Data API](https://supabase.com/docs/guides/api/securing-your-api) distingue grants automáticos, grants explícitos e RLS. O código Go histórico sozinho não identifica o caminho executado pelo pacote npm atual; por isso a conclusão abaixo foi verificada usando os executáveis reais, não apenas a leitura das fontes. Hashes das fontes consultadas estão em `upstream-sources.json`.

## 3. Contraprova nativa 2 × 2

[Run 39830514391](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39830514391), commit `c2df21ee77533c3195440545a1d3d086698723d3`, quatro runners GitHub Ubuntu 26.04, Node 24. Manifestos e os 674 testes SQL do RADAR inalterados entre células; só a CLI efêmera e a chave estudada variam.

Primeiro, migrations/seed foram desabilitados temporariamente para observar defaults e criar uma tabela testemunha dentro de transação revertida. Depois, o config completo foi restaurado, o banco resetado e as 61 migrations e o seed canônicos aplicados. Não foi usado banco institucional. Os quatro ZIPs originais foram baixados; seus SHA256 foram conferidos contra os digests do Actions. Metadados, imagens, ACLs e resultados estão em `matrix.json`.

| CLI | Chave | DELETE service_role antes do RADAR | DELETE nos dois vínculos após migrations | pgTAP |
| --- | --- | --- | --- | --- |
| 2.114.0 | ausente | não | não | 674/674 |
| 2.114.0 | false | não | não | 674/674 |
| 2.121.0 | ausente | sim | sim | 672/674, somente 32/33 |
| 2.121.0 | false | não | não | 674/674 |

Em todas as células finais, RLS permaneceu ativa e anon sem DELETE. As ACLs finais de `user_profiles`/`user_school_scopes` na candidata `false` são iguais às da baseline. O workflow diagnóstico verde significa que as quatro previsões foram confirmadas, incluindo o RED preservado; não significa que a célula sem chave foi homologada. Seu exit pgTAP 1 está registrado.

O workflow experimental é preservado no SHA acima e retirado da árvore final para não adicionar uma matriz permanente desnecessária. A proteção executável permanece nos testes SQL existentes e na configuração explícita.

## 4. Decisão proporcional

Adotar CLI 2.121.0 com `api.auto_expose_new_tables = false` explícito **para preservar o bootstrap local já homologado**. Não reescrever os testes 32/33 nem aplicar REVOKE/GRANT em Production. A expectativa unitária de versão acompanha a nova dependência, mantendo a exigência de versão exata. A reserva de portas existente é aplicada também ao job Supabase local do readiness.

O privilégio administrativo em Production continua distinto, como já documentado em 18/10 e confirmado após o upgrade de PostgreSQL. ADR-008 mantém a chave server-side; ADR-010 admite exclusão técnica excepcional. Os scripts restritos `prepare-remote-homologation-users`/`cleanup-remote-homologation-users` usam DELETE administrativo explicitamente. A Edge Function pode remover uma conta recém-criada em compensação via Auth Admin; isso não é a mesma operação SQL direta. O bootstrap local usa upsert, não DELETE. Não é necessário transformar a permissão de uma credencial administrativa de Production no contrato do bootstrap descartável, nem o inverso.

Esta escolha não torna a CI uma réplica integral de Production. A stack 2.121 observada usa PostgreSQL 17.11.0.004, PostgREST 16.4, Auth 2.197.0 e Realtime 2.143.4; a hospedada usa PostgreSQL 17.11.0.003 e PostgREST 14.18. As imagens completas de cada célula estão no JSON. Não há medição de ganho de desempenho nesta entrega.

## 5. Validação do candidato e continuidade

- Instalação limpa local: aprovada; binário efetivo `2.121.0`.
- 37 controles focados de tooling/bootstrap/Edge: aprovados. Uma primeira execução em worktree ainda sem `node_modules` teve dois erros de import; após instalar dependências, passou sem alteração das expectativas desses testes.
- `test:readiness`: 1.369 unitários e 8 integrações, sem falhas/ignorados, lint, tipos, artefatos e auditoria estrutural aprovados.
- CLI `notebooks --help` confirma `pull`/`push`; não foi executada sincronização de notebooks nem chamada de escrita remota.
- Homologação completa do SHA final, incluindo Auth, Edge, tipos gerados e restauração descartável: conferir os checks do #472. A prova causal acima não os substitui. Não afirmar merge/publicação antes da verificação remota.

O escopo final permitido é dependência/lock, config local explícito, contrato unitário de versão, reserva no runner e documentação. Produto, migrations, RLS, grants hospedados e regras operacionais ficam fora desta manutenção. Novas falhas devem ser classificadas pelo estágio efetivamente executado antes de qualquer alteração.

## 6. Adequação ao gerador de tipos 2.121 (continuidade focal)

A comparação da CI final revelou saída TypeScript de formato diferente. A
comparação estrutural dos contratos original e gerado (após normalização apenas
de sintaxe cosmética) confirmou: 48 campos JSON de tabelas receberam
`NonNullable<Json>`, 20 tabelas receberam `ComputedFields: never`,
3 RPCs sem argumentos passaram de `Args: never` para
`Args: Record<PropertyKey, never>` e 5 arrays de string receberam
parênteses redundantes no gerador. Não surgiram tabelas, colunas, RPCs ou
argumentos adicionais nessa comparação. A representação de chaves e aspas
também mudou.

O arquivo de tipos **continua versionado**, agora com essas definições mais
precisas e formatação legível. A CI deixou de comparar o arquivo somente byte
a byte: o verificador dedicado valida a sintaxe com o parser TypeScript do Prettier 3.9,
e compara tokens significativos, ignorando exclusivamente diferenças cosméticas
comprovadas. Mudanças reais em campos, nulabilidade, tipos, RPCs e
opcionalidade continuam bloqueantes.
Bundles Ajv/Supabase e config.runtime.js continuam exigindo igualdade literal.
Testes unitários específicos distinguem mudança cosmética de mudança real.
A verificação equivalente foi aplicada à rotina remota descartável. Esta
adaptação não altera JavaScript do produto nem qualquer schema SQL.

O job isolado de backup passa a reservar 54320–54323 como os demais jobs
Supabase. Na matriz Ubuntu, a primeira tentativa de fallback manteve a MESMA tag
`postgres-meta:v0.97.0`, mas **ambos** os registries oficiais limitaram
requisições no Ubuntu 24. Como o RADAR roda exclusivamente no Ubuntu 26 e
seus gates reais de Supabase já exercitam as imagens Docker, a matriz
comparativa de SO volta a verificar somente Node, npm, Docker instalado e
Chromium real. A prova do banco **permanece obrigatória nos workflows
Supabase dedicados**, não é substituída por um teste cosmético de pull.

**Ainda não declarar homologação completa por esta edição:** verificar os checks
do commit posterior; os 15 workflows aprovados do SHA `9a6806be` são
evidência histórica, não aprovação automática de novos arquivos.
