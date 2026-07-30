# RADAR PDDE — Rastreabilidade da migration de governança SME

**Data da verificação:** 29 de julho de 2026  
**Natureza:** divergência de histórico de migrations sem divergência funcional comprovada

## 1. Achado

O conjunto local versionado contém:

```text
supabase/migrations/20260728182226_sme_access_governance.sql
```

O histórico do Supabase Production registra a mesma migration com:

```text
version = 20260728190344
name = sme_access_governance
```

As outras 24 migrations observadas possuem correspondência entre versão e nome no repositório e no histórico remoto. A divergência está limitada à migration de governança da Gestão SME.

## 2. Equivalência de conteúdo

A instrução registrada em `supabase_migrations.schema_migrations.statements[1]` foi comparada com o conteúdo do arquivo versionado.

| Verificação | Repositório | Supabase Production |
|---|---:|---:|
| Comprimento em caracteres, sem quebra final | 1.411 | 1.411 |
| SHA-256 | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` |

Resultado: o SQL aplicado é byte a byte equivalente ao arquivo versionado, desconsiderada eventual quebra de linha final do arquivo.

## 3. Estado funcional

As políticas efetivas confirmam:

- `technical_admin` preserva leitura integral de `administrative_logs`;
- `sme_management` lê somente linhas com `actor_user_id = auth.uid()`;
- os demais perfis mantêm o escopo escolar anterior;
- inserções comuns exigem autoria pelo UUID autenticado;
- a migration integra os gates de readiness do repositório.

Não foi identificada divergência funcional entre o código versionado e o banco.

## 4. Risco

A diferença de versão pode produzir divergência em ferramentas que comparam exclusivamente os identificadores do histórico de migrations, mesmo quando o schema efetivo está correto.

Riscos possíveis:

- uma execução futura de `supabase migration list` apontar migration local e remota não correspondentes;
- `db push`, reparo ou promoção futura interpretar a migration como ausente de um lado;
- perda de rastreabilidade entre commit, nome de arquivo e histórico remoto;
- tentativa indevida de reaplicação caso o procedimento ignore o nome e o conteúdo equivalentes.

## 5. Regra de tratamento

Não renomear, reaplicar, excluir nem editar diretamente o histórico remoto sem plano específico.

Antes da próxima alteração de schema ou da liberação oficial:

1. executar comparação formal do histórico local e remoto;
2. confirmar o comportamento da CLI Supabase usada pelo projeto;
3. escolher mecanismo suportado de reconciliação do histórico;
4. preservar prova de equivalência do SQL;
5. executar dry-run em ambiente descartável;
6. aplicar o reparo somente após validação de que não haverá nova execução do SQL;
7. registrar evidência e atualizar os runbooks.

## 6. Classificação

- **Impacto funcional atual:** não identificado;
- **Impacto de segurança atual:** não identificado;
- **Impacto de rastreabilidade:** presente;
- **Prioridade:** resolver antes da próxima migration de Production e antes da decisão formal de release;
- **Ação executada nesta auditoria:** somente registro documental; nenhuma alteração no banco ou no arquivo de migration.
