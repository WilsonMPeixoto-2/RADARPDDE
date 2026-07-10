# Referências aprovadas do RADAR PDDE

## Exportação Excel — versão 1

O arquivo [`RADAR_PDDE_Exportacao_Excel_Aprovada_v1.xlsx`](./RADAR_PDDE_Exportacao_Excel_Aprovada_v1.xlsx) preserva exatamente a versão visual e funcional aprovada em 10/07/2026.

Ele contém:

1. `BONIFICACOES`;
2. `SINTESE`;
3. `QUALIDADE_DADOS`;
4. `METADADOS`.

## Finalidade

O arquivo é uma **referência imutável de aceite**, destinada a:

- orientar a implementação do gerador `.xlsx`;
- permitir comparação visual e funcional;
- impedir alterações silenciosas no padrão aprovado;
- preservar tabela, estilos, gráfico, larguras, alinhamentos e hierarquia informacional.

## Dados demonstrativos

A referência contém registros exclusivamente demonstrativos. Eles não representam a base oficial do RADAR e não devem ser reutilizados como dados reais.

O futuro gerador deverá substituir integralmente os registros demonstrativos pelos dados ativos da aplicação, mantendo o padrão visual e a estrutura funcional.

## Integridade

O arquivo é controlado pelo manifesto [`excel-approved-v1.json`](./excel-approved-v1.json). A suíte automatizada verifica:

- existência do arquivo;
- tamanho em bytes;
- hash SHA-256;
- assinatura ZIP/XLSX;
- presença das quatro planilhas internas;
- presença das tabelas estruturadas e do gráfico aprovado.

Qualquer alteração no arquivo exige nova validação visual e aprovação expressa.
