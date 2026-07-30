# RADAR PDDE — Plano executado de reconciliação da migration SME

**Data:** 29 de julho de 2026  
**Escopo:** alinhar o histórico do Supabase Production ao arquivo canônico criado, testado e versionado no GitHub, sem reaplicar o SQL da governança SME.

## Evidências de entrada

- arquivo canônico no GitHub: `20260728182226_sme_access_governance.sql`;
- registro derivado no histórico remoto: `20260728190344_sme_access_governance`;
- conteúdo SQL equivalente, com 1.411 caracteres e SHA-256 `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e`;
- as outras 24 migrations possuíam correspondência integral entre repositório e Production;
- o arquivo canônico foi criado e validado antes do registro remoto derivado;
- o GitHub permanece como fonte de verdade do projeto.

## Estratégia executada

1. preservar o arquivo local `20260728182226_sme_access_governance.sql` sem qualquer alteração;
2. validar quantidade, nome, versão e conteúdo da migration no Supabase Production;
3. registrar `20260728182226` como `applied` pelo comando oficial `supabase migration repair`;
4. remover exclusivamente o registro derivado `20260728190344` pelo mesmo mecanismo, com status `reverted`;
5. confirmar que o histórico remoto permaneceu com 25 migrations;
6. reconstruir as quatro instruções armazenadas pelo CLI e comprovar novamente os 1.411 caracteres e o SHA-256 canônico;
7. adicionar teste de regressão que exige o arquivo canônico, proíbe o identificador derivado no repositório e verifica o hash do SQL;
8. remover o workflow descartável de reparo antes do merge.

## Resultado

- histórico remoto canônico: `20260728182226_sme_access_governance`;
- registro derivado `20260728190344`: ausente;
- total de migrations remotas: 25;
- SQL da migration: inalterado;
- schema, políticas RLS e dados: inalterados;
- deployment Vercel: não acionado pelo reparo.

## Controles observados

- nenhum SQL funcional foi reaplicado;
- nenhuma edição direta foi feita em `supabase_migrations.schema_migrations`;
- nenhuma migration funcional nova foi criada;
- nenhuma política RLS foi alterada;
- o reparo foi executado somente após pré-condições de quantidade, versão, nome e hash;
- o mecanismo operacional descartável não permanece na baseline.
