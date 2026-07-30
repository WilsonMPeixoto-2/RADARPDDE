# Evidências da reconciliação da migration SME

Documento de trabalho da branch `agent/reconcile-sme-migration-history`.

A validação deve demonstrar, antes do merge:

- teste de regressão inicialmente falhando com o arquivo antigo;
- renomeação sem alteração do conteúdo SQL;
- 25 migrations locais e 25 migrations remotas;
- ausência do timestamp `20260728182226` no conjunto canônico;
- presença do timestamp `20260728190344` nos manifests e testes;
- nenhuma alteração em schema, RLS, dados ou deployment.
