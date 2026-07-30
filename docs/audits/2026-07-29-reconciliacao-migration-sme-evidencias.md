# RADAR PDDE — Evidências da reconciliação da migration SME

**Data da execução:** 29 de julho de 2026  
**Branch de controle:** `agent/reconcile-sme-migration-history`  
**Projeto Supabase:** `scnryinorqeucbfkioxo`

## 1. Teste vermelho

Foi criado teste de regressão antes da implementação. A primeira execução falhou porque a hipótese inicial pretendia renomear o arquivo local para `20260728190344`.

A investigação histórica posterior demonstrou que:

- `20260728182226_sme_access_governance.sql` já estava criado e testado no GitHub antes da aplicação remota;
- o timestamp `20260728190344` surgiu apenas no histórico de Production;
- o GitHub é a fonte de verdade do projeto.

A hipótese inicial foi descartada, e o teste foi reescrito para proteger a identidade canônica correta.

## 2. Estado anterior

| Verificação | Resultado |
|---|---|
| Migrations remotas | 25 |
| Versão local da SME | `20260728182226` |
| Versão remota da SME | `20260728190344` |
| Comprimento do SQL equivalente | 1.411 caracteres |
| SHA-256 equivalente | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` |
| Demais migrations alinhadas | 24 de 24 |

## 3. Operação realizada

O histórico foi reconciliado exclusivamente pelo mecanismo oficial de migration repair:

```text
supabase migration repair 20260728182226 --linked --status applied
supabase migration repair 20260728190344 --linked --status reverted
```

A primeira operação registrou a versão canônica usando o arquivo local. A segunda removeu somente o registro derivado. Nenhum comando `db push` efetivo foi executado e nenhuma instrução de schema foi reaplicada.

## 4. Estado posterior

| Verificação | Resultado |
|---|---|
| Migrations remotas | 25 |
| Registro `20260728182226` | presente, nome `sme_access_governance` |
| Registro `20260728190344` | ausente |
| Instruções armazenadas pelo CLI | 4 |
| Conteúdo reconstruído | 1.411 caracteres |
| SHA-256 reconstruído | `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e` |
| Arquivo local canônico | preservado |
| Schema, RLS e dados | sem alteração |

O CLI armazena a migration reparada em quatro instruções separadas. A concatenação das quatro instruções com os delimitadores SQL originais reproduz exatamente o conteúdo canônico e o mesmo hash.

## 5. Proteção contra regressão

O teste `tests/unit/sme-migration-history-alignment.test.js` exige cumulativamente:

- existência de `20260728182226_sme_access_governance.sql`;
- ausência de `20260728190344_sme_access_governance.sql` no repositório;
- SHA-256 canônico do SQL.

O workflow usado para o reparo foi removido da branch após a execução para impedir reacionamento acidental.

## 6. Conclusão

A divergência de rastreabilidade foi eliminada. GitHub e Supabase Production agora utilizam o mesmo identificador `20260728182226` para a migration de governança SME, preservando o estado funcional já existente.
