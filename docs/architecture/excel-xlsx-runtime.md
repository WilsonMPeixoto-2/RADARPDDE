# Integração runtime das exportações Excel

**Estado:** vigente com dois pontos abertos: P1 de auditoria do botão SME e contrato CSV ainda não reconciliado  
**Atualizado em:** 5 de setembro de 2026

> Leia primeiro [`../../START_HERE.md`](../../START_HERE.md). Este documento foi atualizado após a auditoria adversarial de 05/09/2026.

## 1. Produtos

A integração mantém quatro saídas independentes:

1. XLSX institucional de quatro abas;
2. Excel SME mensal de uma aba e 27 colunas;
3. CSV legado como contingência;
4. XLSX editorial da tela de Pendências.

Esses produtos compartilham infraestrutura, mas **não possuem automaticamente a mesma política temporal nem a mesma composição de auditoria**.

## 2. XLSX institucional

Regra vigente após decisão de 09/08/2026:

```text
competência global ativa
→ modelo institucional filtrado
→ BONIFICACOES / SINTESE / QUALIDADE_DADOS / METADADOS
```

A descrição histórica multicompetência não governa mais o botão institucional atual.

## 3. Excel SME

Contrato preservado:

- competência mensal `YYYY-MM`;
- uma aba;
- 27 colunas A:AA;
- uma linha por unidade;
- template-fonte de 30 colunas projetado para 27;
- nome/aba/dados coerentes com a mesma competência;
- bloqueio de clique concorrente;
- carregamento resiliente de ExcelJS/template.

### P1 aberto

O botão SME real ainda precisa convergir para a autoridade de auditoria pré-download. A auditoria Astra reproduziu caminho em que a closure privada de exportação baixa antes da confirmação da auditoria inicial.

A correção deverá ser testada pelo gesto real com falha inicial e zero download.

## 4. CSV de contingência

O CSV legado permanece disponível, porém seu contrato temporal/auditoria não deve ser chamado de “equivalente ao XLSX” sem nova decisão.

A implementação atual conserva comportamento histórico diferente do XLSX institucional. Antes de convergir:

- decidir escopo temporal;
- decidir ordem da auditoria;
- decidir condições de fallback;
- criar teste de composição pelo botão real.

## 5. Planilha de Pendências

A tela de Pendências oferece XLSX editorial que respeita busca e filtros da fila. Como Pendências é passivo transversal, o filtro local pode incluir `Todas` sem alterar `RadarCompetenceContext`.

O fluxo continua separado do Excel SME e não usa seu template.

## 6. Runtime resiliente do Excel SME

Continuam válidos:

- estados explícitos de loading;
- timeout;
- limpeza de listeners;
- remoção de script fracassado;
- retry sem refresh;
- `AbortController` para template;
- validação de manifesto/hash;
- erros distintos para motor, manifesto, template, competência, parse, serialização e download.

Presença de `<script>` não equivale a capacidade instalada/concluída.

## 7. Assets e projeção do template

O artefato publica:

- `excel-sme-assets.json`;
- bundle local do ExcelJS;
- `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`;
- hashes/tamanhos esperados.

No template SME:

1. validar `SISTEMÁTICA PREENCHIDA` nas posições-fonte;
2. remover Y, R e K em ordem decrescente;
3. validar 27 cabeçalhos finais;
4. reconstruir linhas;
5. limitar conteúdo, filtro, impressão e estilos a A:AA.

## 8. Barreiras de fechamento

Não declarar a família Excel totalmente fechada enquanto faltarem:

- correção do P1 de auditoria SME;
- teste `falha de auditoria inicial → nenhum download` pelo botão real;
- decisão explícita CSV × XLSX;
- teste com duas competências para provar escopo temporal de cada produto.

## 9. Anti-padrões

- usar um teste feliz de download como prova da ordem da auditoria;
- tratar capacidade genérica do modelo como política do botão;
- preservar equivalência CSV/XLSX apenas porque ela foi válida em checkpoint histórico;
- considerar um wrapper instalado como prova de que todos os botões passam por ele.

## 10. Referências

- [`excel-export.md`](excel-export.md);
- [`excel-sme-mensal.md`](excel-sme-mensal.md);
- [`adversarial-analysis-and-implementation-method.md`](adversarial-analysis-and-implementation-method.md);
- [`../audits/2026-09-05-astra-adversarial-findings.md`](../audits/2026-09-05-astra-adversarial-findings.md).
