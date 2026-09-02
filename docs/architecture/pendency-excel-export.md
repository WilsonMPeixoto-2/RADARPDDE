# Exportação Excel de Pendências

**Estado:** vigente  
**Produto:** relatório operacional XLSX da tela de Pendências  
**Motor:** ExcelJS 4.4.0 carregado sob demanda

## 1. Finalidade

A tela de Pendências disponibiliza uma exportação própria em formato `.xlsx` para acompanhamento, priorização, reunião de trabalho, controle e prestação de contas.

A planilha não cria uma nova fonte de verdade. Ela projeta exatamente as pendências já autorizadas e disponíveis na tela.

## 2. Escopo exportado

O botão **Baixar planilha** considera a busca e todos os filtros aplicados no momento do clique.

A exportação reúne, em um único arquivo, as situações:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Quando não há filtros, o arquivo contém todas as pendências disponíveis no escopo autorizado do usuário. Quando há filtros, o relatório registra os filtros na aba de resumo e exporta somente os registros correspondentes.

Identificadores técnicos, UUIDs e chaves internas não integram as colunas do relatório.

## 3. Estrutura do workbook

### RESUMO

Folha executiva com:

- data e hora da geração;
- escopo;
- filtros aplicados;
- quantidade de registros exportados;
- abertas;
- aguardando reanálise;
- resolvidas;
- canceladas;
- pendências ativas;
- ação da escola;
- ação do controlador;
- pendências ativas há 30 dias ou mais.

### PENDÊNCIAS

Base estruturada e filtrável com unidade, designação, R.A., controlador, competência, programa, documento, item, erros, observação, próxima ação, responsável, datas operacionais, antiguidade, tentativas e encerramento.

A folha possui autofiltro, painel congelado, quebra de texto, larguras editoriais e configuração de impressão em paisagem.

## 4. Identidade editorial

O relatório segue a identidade editorial adotada para produtos analíticos do projeto:

- Segoe UI;
- azul-marinho estrutural `#1B365D`;
- cabeçalhos em azul-marinho com texto branco;
- corpo em `#1A1A1A`;
- linhas alternadas em cinza muito claro;
- bordas discretas;
- cartões executivos;
- cores semânticas em tons suaves:
  - amarelo para pendência aberta;
  - azul para aguardando reanálise;
  - verde para resolvida;
  - cinza para cancelada;
  - vermelho para pendência ativa com 30 dias ou mais.

As cores são apoio visual, não substituem o texto da situação.

## 5. Runtime e segurança

O ExcelJS permanece carregado sob demanda. Esta exportação utiliza apenas o motor ExcelJS e não baixa o template específico do Excel SME.

O fluxo é somente leitura e download:

```text
PendencyViewModel
→ filtros atuais
→ PendencyExcelExportModel
→ PendencyExcelRenderer
→ ExcelJS sob demanda
→ download XLSX
→ registro de auditoria
```

Não há migration, escrita em pendência, alteração de análise, mudança de status ou persistência de dados pelo ato de exportar.
