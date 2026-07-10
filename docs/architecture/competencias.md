# Competências — contrato canônico

## Objetivo

Centralizar validação, comparação e apresentação das competências mensais do RADAR PDDE antes da integração com o Supabase.

O valor persistido deve utilizar exclusivamente o padrão:

```text
YYYY-MM
```

Exemplo:

```text
2026-05
```

A apresentação para o usuário não deve ser persistida. Ela deve ser derivada pelo módulo `src/domain/competencia.js`.

## Formatos disponíveis

| Identificador | Exemplo | Uso previsto |
|---|---|---|
| `display` | `Maio/2026` | títulos, cards e indicadores |
| `numeric` | `05/2026` | relatórios compactos |
| `long` | `Maio de 2026` | textos corridos |
| `iso` | `2026-05` | persistência e intercâmbio |
| `filename` | `2026-05` | nomes de arquivos legíveis |
| `compactFilename` | `2026_05` | nomes de arquivos sem hífen |

## Chaves compostas existentes

O protótipo utiliza em alguns pontos uma chave composta no formato:

```text
2026-05_BASIC
```

O módulo separa:

- competência: `2026-05`;
- contexto/programa: `BASIC`.

A chave composta é aceita temporariamente para compatibilidade com o protótipo. No modelo relacional futuro, competência e programa deverão ser campos ou relacionamentos distintos.

## API pública

```javascript
RadarCompetencia.isValidCompetenciaKey(value);
RadarCompetencia.parseCompetencia(value);
RadarCompetencia.formatCompetencia(value, format, options);
RadarCompetencia.compareCompetencias(left, right);
RadarCompetencia.isCompetenciaInRange(value, start, end);
RadarCompetencia.splitCompetenciaContext(value);
RadarCompetencia.formatCompetenciaContext(value, options);
```

O arquivo funciona tanto no navegador quanto no Node.js:

```javascript
const competencia = require('./src/domain/competencia.js');
```

ou, após inclusão antes de `app.js`:

```html
<script src="src/domain/competencia.js"></script>
<script src="app.js"></script>
```

## Plano de adoção no `app.js`

A adoção deve ocorrer em uma etapa separada e revisável:

1. carregar `src/domain/competencia.js` antes de `app.js`;
2. substituir a função local `formatCompetenciaText` por um adaptador do módulo;
3. substituir comparações textuais diretas por `compareCompetencias`;
4. substituir montagem manual de mês e ano em alertas, relatórios e nomes de arquivo;
5. executar pesquisa global por `activeCompetenciaKey`, `split('-')`, `replace(' ', '/')` e formatações equivalentes;
6. manter a chave persistida em `YYYY-MM`;
7. executar testes e validação visual das telas afetadas.

## Decisões já consolidadas

- formato persistido: `YYYY-MM`;
- comparação: numérica por ano e mês;
- intervalo: inclusivo;
- exibição principal: `Mês/Ano`, por exemplo `Maio/2026`;
- valores inválidos não são transformados silenciosamente em datas;
- o modo estrito pode gerar erro explícito para validações de entrada.

## Decisões que não pertencem a este módulo

Este módulo não determina:

- se uma escola está dentro ou fora do escopo;
- quando uma competência é aberta ou encerrada;
- situação de aptidão, inaptidão ou andamento;
- permissões de alteração;
- regras de persistência.

Essas decisões permanecem na camada de regras de negócio e deverão possuir testes próprios.
