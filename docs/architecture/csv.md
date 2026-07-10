# Exportação CSV segura

## Objetivo

Centralizar a geração de arquivos CSV do RADAR PDDE em um serializador único, previsível e testável, evitando implementações manuais espalhadas pelo `app.js`.

O módulo está localizado em:

```text
src/domain/csv.js
```

Nesta etapa, ele permanece isolado e ainda não é carregado pelo navegador.

## Padrões adotados

Por padrão, o serializador utiliza:

- delimitador `;`, mais adequado à abertura direta no Excel em configurações brasileiras;
- quebra de linha `CRLF`;
- BOM UTF-8 para preservar acentos e caracteres especiais;
- cabeçalho automático quando a lista de colunas é informada;
- aspas duplas apenas quando necessárias;
- duplicação de aspas internas;
- proteção contra fórmulas em valores textuais iniciados por `=`, `+`, `-` ou `@`.

## Universos de entrada

### Linhas matriciais

```javascript
RadarCsv.serializeCsv([
    ['Escola', 'Situação'],
    ['E.M. Exemplo', 'Apta']
]);
```

### Objetos com colunas declaradas

```javascript
RadarCsv.serializeCsv(registros, {
    columns: [
        { key: 'designacao', label: 'Designação' },
        { key: 'nome', label: 'Unidade escolar' },
        { key: 'situacao', label: 'Situação' }
    ]
});
```

As colunas também podem usar:

- `getValue(row, rowIndex)` para obter valores derivados;
- `format(value, row, rowIndex)` para formatação explícita.

## Proteção contra injeção de fórmulas

Planilhas podem interpretar textos iniciados por determinados caracteres como fórmulas. Por isso, valores textuais potencialmente perigosos recebem um apóstrofo inicial.

Exemplo:

```text
=SUM(A1:A2)
```

é exportado como:

```text
'=SUM(A1:A2)
```

Valores numéricos reais, como o número `-42`, não são alterados. A proteção pode ser desativada de forma explícita, mas isso não deve ser feito em exportações compostas por dados digitados por usuários.

## Regras de escape

Uma célula é envolvida por aspas quando contém:

- o delimitador adotado;
- aspas duplas;
- quebra de linha;
- retorno de carro.

Aspas internas são duplicadas.

Exemplo:

```text
Escola "Modelo"; Unidade
```

é serializado como:

```text
"Escola ""Modelo""; Unidade"
```

## Integração futura

A adoção no `app.js` deverá ocorrer em PR específico. Cada exportação atual deverá declarar:

1. suas colunas;
2. o formato de datas e competências;
3. a origem dos registros;
4. o nome canônico do arquivo;
5. testes de regressão com dados reais anonimizados.

Até essa integração, o comportamento das exportações existentes permanece inalterado.
