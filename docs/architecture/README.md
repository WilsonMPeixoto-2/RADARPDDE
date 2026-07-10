# Arquitetura do RADAR PDDE

Esta pasta registra contratos técnicos e decisões arquiteturais que devem permanecer independentes da interface e da camada de persistência.

Documentos atuais:

- [`competencias.md`](./competencias.md): formato canônico, validação, comparação e apresentação das competências mensais.
- [`estatisticas.md`](./estatisticas.md): separação entre indicadores de escolas e indicadores de programas, com denominadores independentes.
- [`excel-export.md`](./excel-export.md): preservação do relatório original, estrutura aprovada do arquivo `.xlsx`, equivalência e regras de integração.
- [`excel-workbook-plan.md`](./excel-workbook-plan.md): descrição declarativa das abas, fórmulas, tabelas, estilos e funcionalidades do workbook aprovado.
- [`excel-xlsx-runtime.md`](./excel-xlsx-runtime.md): renderização Office Open XML, ativação do botão, fallback CSV e estratégia de reversão.
