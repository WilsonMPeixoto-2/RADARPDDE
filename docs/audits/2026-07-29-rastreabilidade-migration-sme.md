# RADAR PDDE — Rastreabilidade da migration de governança SME

**Data da verificação:** 29 de julho de 2026  
**Natureza:** divergência de histórico de migrations sem divergência funcional comprovada  
**Situação atual:** resolvida em 29 de julho de 2026; este documento preserva o achado original

## 1. Achado

O conjunto local versionado continha:

```text
supabase/migrations/20260728182226_sme_access_governance.sql
```

O histórico do Supabase Production registrava a mesma migration com:

```text
version = 20260728190344
name = sme_access_governance
```

As outras 24 migrations observadas possuíam correspondência entre versão e nome no repositório e no histórico remoto. A divergência estava limitada à migration de governança da Gestão SME.

## 2. Equivalência de conteúdo

A instrução registrada em `supabase_migrations.schema_migrations.statements[1]` foi comparada com o conteúdo do arquivo versionado.

| Verificação | Repositório | Supabase Production |
|---|---:|---:|
| Comprimento em caracteres, sem quebra final | 1.411 | 1.411 |
| SHA-256 | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` |

Resultado: o SQL aplicado era byte a byte equivalente ao arquivo versionado, desconsiderada eventual quebra de linha final do arquivo.

## 3. Estado funcional

As políticas efetivas confirmavam:

- `technical_admin` preserva leitura integral de `administrative_logs`;
- `sme_management` lê somente linhas com `actor_user_id = auth.uid()`;
- os demais perfis mantêm o escopo escolar anterior;
- inserções comuns exigem autoria pelo UUID autenticado;
- a migration integra os gates de readiness do repositório.

Não foi identificada divergência funcional entre o código versionado e o banco.

## 4. Risco identificado

A diferença de versão poderia produzir divergência em ferramentas que comparam exclusivamente os identificadores do histórico de migrations, mesmo quando o schema efetivo estava correto.

Riscos então possíveis:

- uma execução futura de `supabase migration list` apontar migration local e remota não correspondentes;
- `db push`, reparo ou promoção futura interpretar a migration como ausente de um lado;
- perda de rastreabilidade entre commit, nome de arquivo e histórico remoto;
- tentativa indevida de reaplicação caso o procedimento ignorasse o nome e o conteúdo equivalentes.

## 5. Regra de tratamento definida

Não renomear, reaplicar, excluir nem editar diretamente o histórico remoto sem plano específico.

Antes da próxima alteração de schema ou da liberação oficial, foi definido:

1. executar comparação formal do histórico local e remoto;
2. confirmar o comportamento da CLI Supabase usada pelo projeto;
3. escolher mecanismo suportado de reconciliação do histórico;
4. preservar prova de equivalência do SQL;
5. executar operação controlada com pré-condições;
6. aplicar o reparo somente após validação de que não haveria nova execução do SQL;
7. registrar evidência e atualizar os documentos canônicos.

## 6. Classificação na data do achado

- **Impacto funcional:** não identificado;
- **Impacto de segurança:** não identificado;
- **Impacto de rastreabilidade:** presente;
- **Prioridade:** resolver antes da próxima migration de Production e antes da decisão formal de release;
- **Ação desta auditoria original:** somente registro documental; nenhuma alteração no banco ou no arquivo de migration.

## 7. Resolução executada

A investigação histórica confirmou que o arquivo `20260728182226_sme_access_governance.sql` foi criado e testado no GitHub antes de surgir o identificador remoto `20260728190344`. Como o GitHub é a fonte de verdade, o arquivo local foi preservado.

O histórico do Supabase Production foi reconciliado pelo mecanismo oficial `supabase migration repair`:

```text
20260728182226 → applied
20260728190344 → reverted
```

O reparo não reaplicou o SQL e não alterou schema, políticas RLS ou dados.

Estado posterior comprovado:

| Verificação | Resultado |
|---|---|
| Total de migrations remotas | 25 |
| Versão canônica `20260728182226` | presente |
| Versão derivada `20260728190344` | ausente |
| Nome | `sme_access_governance` |
| Conteúdo reconstruído | 1.411 caracteres |
| SHA-256 reconstruído | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` |

O CLI armazenou o SQL em quatro instruções separadas; a concatenação com os delimitadores originais reproduz exatamente o arquivo canônico.

Referências da solução:

- [`2026-07-29-reconciliacao-migration-sme-plano.md`](2026-07-29-reconciliacao-migration-sme-plano.md);
- [`2026-07-29-reconciliacao-migration-sme-evidencias.md`](2026-07-29-reconciliacao-migration-sme-evidencias.md).
