# Competências — contrato canônico

## Objetivo

Centralizar validação, comparação, apresentação e navegação das competências mensais do RADAR PDDE.

O valor persistido utiliza exclusivamente:

```text
YYYY-MM
```

Exemplo:

```text
2026-05
```

A apresentação para o usuário não é persistida. Ela é derivada pelo módulo `src/domain/competencia.js`.

## Formatos disponíveis

| Identificador | Exemplo | Uso previsto |
|---|---|---|
| `display` | `Maio/2026` | títulos, cartões e indicadores |
| `numeric` | `05/2026` | relatórios compactos |
| `long` | `Maio de 2026` | textos corridos |
| `iso` | `2026-05` | persistência e intercâmbio |
| `filename` | `2026-05` | nomes de arquivos legíveis |
| `compactFilename` | `2026_05` | nomes sem hífen |

## Chaves compostas legadas

O adaptador legado ainda representa verificações no formato:

```text
2026-05_BASIC
```

O domínio separa:

- competência: `2026-05`;
- programa/contexto: `BASIC`.

No modelo relacional Supabase, competência e programa são campos/relacionamentos distintos. A chave composta permanece somente na camada de compatibilidade do estado legado e não deve orientar novas tabelas.

## API de domínio

```javascript
RadarCompetencia.isValidCompetenciaKey(value);
RadarCompetencia.parseCompetencia(value);
RadarCompetencia.formatCompetencia(value, format, options);
RadarCompetencia.compareCompetencias(left, right);
RadarCompetencia.isCompetenciaInRange(value, start, end);
RadarCompetencia.splitCompetenciaContext(value);
RadarCompetencia.formatCompetenciaContext(value, options);
```

O módulo funciona no navegador e no Node.js.

## Estado operacional em 28/07/2026

O Supabase contém as 12 competências do exercício de 2026, de `2026-01` a `2026-12`.

A aplicação ainda possui limitação composta:

- `activeCompetenciaKey` inicializada em `2026-05` no `app.js`;
- `app_config.closing_competence = 2026-05`;
- tela mensal filtrando `key <= closing_competence`;
- ausência de seletor mensal global acionável no header.

Portanto, os meses posteriores existem no banco, mas não estão integralmente operacionalizados no frontend.

## Decisões vigentes

### Uma competência global

A aplicação deve manter uma única competência ativa para:

- Dashboard;
- Carteira;
- Competências;
- Prontuário;
- Pendências e alertas;
- timeline;
- exportações.

Controles locais não podem criar seleções concorrentes.

### Conceitos distintos

Não confundir:

- **existente:** registro persistido;
- **planejada:** cadastrada, mas não liberada para lançamento;
- **disponível:** selecionável e operacional;
- **fechada:** preservada para consulta e conforme regras de alteração.

`closing_competence` não deve ser usado como filtro genérico para ocultar competências existentes.

### Inicialização

A seleção inicial deve seguir:

1. seleção de sessão válida;
2. competência de fechamento válida;
3. competência disponível mais recente;
4. erro explícito quando não houver competência válida.

Constante mensal fixa no frontend é proibida.

### Persistência e navegação

- persistir apenas `YYYY-MM`;
- preservar a seleção durante navegação, retorno e recarga da sessão;
- transportar a competência em drill-downs e filtros;
- atualizar todas as projeções por evento único;
- exportações devem usar a mesma chave ativa exibida na interface.

## Contexto global planejado

O plano de oficialização prevê módulo puro:

```javascript
RadarCompetenceContext.initialize({
  competences,
  currentExercise,
  closingCompetence,
  initialCompetence,
  storage
});

RadarCompetenceContext.getState();
RadarCompetenceContext.select(key, options);
RadarCompetenceContext.subscribe(listener);
RadarCompetenceContext.getAvailableForExercise(exercise);
```

O módulo ainda não existe na `main` em 28/07/2026. Este trecho registra o contrato aprovado para a próxima implementação, não uma funcionalidade já concluída.

## Decisões que não pertencem ao domínio de formatação

`src/domain/competencia.js` não determina:

- escopo da escola;
- abertura ou fechamento operacional;
- aptidão ou inaptidão;
- permissões de alteração;
- persistência;
- regras de programa.

Essas decisões pertencem ao contexto de competência, serviços, configuração e políticas, com testes próprios.

## Testes obrigatórios

A evolução deve cobrir:

- formato e comparação;
- seleção inicial;
- rejeição de chave inexistente;
- junho a dezembro de 2026;
- seletor mensal em todas as superfícies aplicáveis;
- preservação entre telas e History API;
- consistência de Dashboard, Carteira, Prontuário e Pendências;
- uso da mesma chave nos dois relatórios Excel;
- desktop e mobile;
- todos os perfis autorizados.

Plano detalhado: [`../superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](../superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
