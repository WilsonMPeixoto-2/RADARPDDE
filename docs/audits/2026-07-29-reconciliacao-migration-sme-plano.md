# RADAR PDDE — Plano executado de reconciliação da migration SME

**Data:** 29 de julho de 2026  
**Escopo:** alinhar o identificador local da migration de governança SME ao histórico efetivamente registrado no Supabase Production, sem executar novamente o SQL.

## Evidências de entrada

- arquivo local anterior: `20260728182226_sme_access_governance.sql`;
- histórico remoto: `20260728190344_sme_access_governance`;
- conteúdo SQL equivalente, com o mesmo SHA-256;
- as outras 24 migrations possuem correspondência entre repositório e Production;
- a migration SME é a última da sequência atual.

## Estratégia escolhida

1. preservar o histórico remoto, que representa o SQL efetivamente aplicado;
2. renomear exclusivamente o arquivo local para `20260728190344_sme_access_governance.sql`;
3. atualizar manifests, testes, runbooks e documentos que referenciam o identificador anterior;
4. adicionar teste de regressão que exige o identificador canônico e proíbe o antigo;
5. validar que o conjunto local permaneça com 25 migrations e que nenhum SQL seja reaplicado.

## Mudanças vedadas

- reaplicar o SQL;
- editar diretamente `supabase_migrations.schema_migrations`;
- marcar migrations como `applied` ou `reverted`;
- alterar políticas RLS;
- criar nova migration funcional;
- realizar deployment Vercel.
