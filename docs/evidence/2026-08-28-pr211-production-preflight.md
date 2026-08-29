# PR #211 — preflight somente leitura de Production

**Data:** 29 de agosto de 2026  
**Ambiente:** Supabase Production `scnryinorqeucbfkioxo`  
**Natureza:** somente leitura; nenhuma mutação executada

## 1. Resultado consolidado

A classificação de dados legados foi refinada depois que a autoria dos registros foi confrontada com os logs administrativos.

O antigo tratamento “preservar os 20 `a_identificar`” não é mais a decisão vigente.

Resultado:

- 20 `a_identificar` anteriores ao contrato individual;
- 16 são históricos legítimos de Controladores e serão preservados;
- 4 são fixtures da conta técnica de teste e podem ser removidos;
- existem mais 8 NFs/despesas de teste nos mesmos cenários do hotfix, totalizando 12 despesas/NFs removíveis;
- três Pendências fiscais genéricas antigas desses cenários também são fixtures de teste;
- nenhum dos 12 registros possui Pendência individual vinculada, tentativa ou bem patrimonial;
- os cinco contextos de limpeza não contêm outras despesas não atribuídas à conta técnica;
- suas verificações não estão consolidadas.

A evidência integral, IDs e critérios fail-closed estão em:

`docs/evidence/2026-08-29-pr211-classificacao-dados-legados.md`

## 2. Registros legítimos

Os 16 `a_identificar` legítimos foram atribuídos por log administrativo:

- Juliana: 15;
- Mônica: 1.

Decisão:

- preservar conteúdo e identidade;
- não criar Pendência retroativa;
- não inventar análise individual;
- não converter automaticamente o tipo;
- projetar no novo layout como **Registro legado**;
- impedir edição/exclusão comum que apagaria ou reescreveria essa história.

O novo contrato `a_identificar = Incorreto + Pendência` continua obrigatório para novas operações.

## 3. Fixtures de teste

A migration do PR #211 contém limpeza cirúrgica, baseada em IDs e autoria comprovados, de:

- 12 despesas/NFs de teste;
- três Pendências fiscais genéricas antigas de teste.

Os logs administrativos são preservados.

A limpeza é fail-closed: qualquer divergência de autoria, contexto, conteúdo esperado, histórico ou consolidação interrompe a migration.

## 4. Boleto Internet 1234

A antiga proposta de reparar o vínculo do Boleto 1234 está **superada**.

A auditoria de autoria comprovou que o boleto e sua Pendência foram criados pela conta técnica durante os testes do hotfix. Ambos integram a limpeza de fixtures.

Não existe mais “reparo cirúrgico do Boleto 1234” como requisito de publicação do PR #211.

## 5. Production continua intocada

A migration `20260828023000_invoice_document_analysis_pendency.sql` permanece apenas na branch do PR #211.

Nenhuma limpeza, novo vínculo, backfill ou alteração de schema do PR #211 foi executada em Production durante este preflight.

## 6. Gate imediatamente anterior ao merge/migration

Antes de qualquer aplicação em Production, repetir em modo somente leitura as condições do bloco fail-closed:

1. autoria dos 12 registros;
2. autoria e estado das três Pendências;
3. ausência de histórico individual/tentativas;
4. inexistência de despesas inesperadas nos cinco contextos;
5. ausência de consolidação das cinco verificações;
6. autoria técnica dos lançamentos de bonificação de Notas Fiscais que serão neutralizados nos cinco contextos;
7. preservação dos 16 `a_identificar` legítimos.

Se qualquer item divergir, não aplicar a migration até nova análise.
