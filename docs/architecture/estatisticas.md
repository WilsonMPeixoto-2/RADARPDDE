# Estatísticas por unidade de análise

## Objetivo

Evitar que indicadores de escolas e indicadores de programas compartilhem o mesmo total, denominador ou percentual.

O módulo `src/domain/estatisticas.js` é deliberadamente independente das regras que determinam se uma escola ou programa está apto, inapto, em andamento, não analisado ou fora do escopo. Ele recebe situações já calculadas e apenas produz resumos consistentes.

## Universos separados

### Escolas

Cada unidade escolar é contada uma única vez na competência analisada.

Exemplos de indicadores:

- escolas aptas;
- escolas inaptas;
- escolas em andamento;
- escolas não analisadas;
- escolas fora do escopo.

### Programas

Cada vínculo entre escola e programa constitui um registro independente.

Exemplos de indicadores:

- programas aptos;
- programas inaptos;
- programas em andamento;
- programas não analisados;
- programas fora do escopo.

## Denominadores

O resultado expõe dois totais:

- `total`: todos os registros com situação reconhecida, inclusive fora do escopo;
- `activeTotal`: somente os registros incluídos no escopo operacional.

As taxas de aptidão, inaptidão, andamento e não análise utilizam `activeTotal`. A taxa de registros fora do escopo utiliza `total`.

## Compatibilidade temporária

O normalizador aceita os rótulos já encontrados no protótipo, como:

- `apto` e `apta`;
- `inapto` e `inapta`;
- `em-andamento` e `emAndamento`;
- `naoAnalisado` e `naoAnalisada`;
- `fora-escopo` e `foraEscopo`.

Essa compatibilidade não define a regra institucional. Ela apenas permite que a futura integração seja gradual.

## Integração posterior

A interface deverá fornecer ao módulo duas coleções independentes:

```javascript
const snapshot = RadarEstatisticas.buildStatisticsSnapshot({
    schools: schoolStatusRecords,
    programRecords: schoolProgramStatusRecords
});
```

Os dashboards deverão escolher explicitamente `snapshot.schools` ou `snapshot.programs`, sem combinar seus totais.

## Fora do escopo desta etapa

- alterar os cards atuais;
- substituir `getEscolasStats()`;
- definir regras de aptidão ou inaptidão;
- alterar filtros ou percentuais visíveis;
- carregar o módulo no navegador;
- conectar ao Supabase.
