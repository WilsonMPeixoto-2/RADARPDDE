# Competências — contrato canônico

## Objetivo

Centralizar validação, comparação, apresentação e navegação das competências mensais do RADAR PDDE.

O valor persistido utiliza exclusivamente:

```text
YYYY-MM
```

Exemplo: `2026-08`.

A apresentação para o usuário não é persistida. Ela é derivada dos módulos de domínio.

## Formatos disponíveis

| Identificador | Exemplo | Uso previsto |
|---|---|---|
| `display` | `Agosto/2026` | títulos, cartões e indicadores |
| `numeric` | `08/2026` | relatórios compactos |
| `long` | `Agosto de 2026` | textos corridos |
| `iso` | `2026-08` | persistência e intercâmbio |
| `filename` | `2026-08` | nomes de arquivos legíveis |
| `compactFilename` | `2026_08` | nomes sem hífen |

## Chaves compostas legadas

O adaptador de compatibilidade ainda representa verificações no formato:

```text
2026-08_BASIC
```

O domínio separa competência e programa. No modelo relacional Supabase, esses valores são campos e relacionamentos distintos. A chave composta não deve orientar novas tabelas.

## Componentes do domínio

### Formatação e comparação

`src/domain/competencia.js` fornece:

```javascript
RadarCompetencia.isValidCompetenciaKey(value);
RadarCompetencia.parseCompetencia(value);
RadarCompetencia.formatCompetencia(value, format, options);
RadarCompetencia.compareCompetencias(left, right);
RadarCompetencia.isCompetenciaInRange(value, start, end);
RadarCompetencia.splitCompetenciaContext(value);
RadarCompetencia.formatCompetenciaContext(value, options);
```

### Contexto mensal global

`src/domain/competence-context.js` fornece uma fonte única de estado mensal:

```javascript
RadarCompetenceContext.initialize({
  competences,
  currentExercise,
  closingCompetence,
  initialCompetence,
  storage
});

RadarCompetenceContext.getState();
// {
//   exercise: '2026',
//   activeKey: '2026-08',
//   availableKeys: ['2026-01', ..., '2026-12'],
//   closingKey: '2026-05'
// }

RadarCompetenceContext.select(key, options);
RadarCompetenceContext.selectExercise(exercise, options);
RadarCompetenceContext.replaceConfiguration(nextState);
RadarCompetenceContext.subscribe(listener);
RadarCompetenceContext.getAvailableForExercise(exercise);
```

O módulo funciona no navegador e no Node.js e não depende de DOM.

### Integração visual

`src/integration/global-competence-selector.js`:

- transforma o indicador passivo do header em seletor mensal acessível;
- utiliza `RadarCompetenceContext` como única fonte de seleção;
- sincroniza exercício e competência;
- preserva a competência em `localStorage` durante a sessão e a recarga;
- atualiza a superfície ativa por evento único;
- remove o seletor local concorrente da página mensal;
- mantém compatibilidade com os pontos de entrada legados;
- aguarda a conclusão do bootstrap remoto antes de assumir o estado mensal.

O carregamento ocorre por `src/integration/exercise-management.js`, preservando a ordem de bootstrap existente.

## Regras de inicialização

A seleção inicial segue esta ordem:

1. competência persistida da sessão, quando existente no conjunto canônico;
2. competência inicial explicitamente fornecida e pertencente ao exercício resolvido;
3. `closing_competence`, quando válida para o exercício;
4. competência cronologicamente mais recente do exercício;
5. erro explícito quando não houver competência válida.

O exercício inicial é derivado da competência persistida, da competência carregada ou do fechamento, antes de recorrer ao valor inicial da aplicação. Isso evita retornar indevidamente a 2026 após recarregar um exercício posterior.

## Competências de 2026

O Supabase contém `2026-01` a `2026-12`. O contexto global apresenta as 12 competências do exercício aos perfis autorizados.

O PR de contexto global não altera banco ou schema. A configuração de Production permanece com `closing_competence = 2026-05` até a publicação controlada do frontend. Na mesma janela de ativação, o fechamento operacional será alterado para `2026-12` pelo contrato transacional e auditado existente.

Não criar `operational_status` ou migration adicional sem requisito comprovado que exija distinguir estados além das datas, `closed_at` e `closing_competence` já existentes.

## Persistência e navegação

- persistir somente a chave `YYYY-MM`;
- não persistir rótulo formatado;
- preservar a seleção ao navegar, trocar perfil, voltar e recarregar;
- transportar a mesma competência em drill-downs, prontuário, alertas e exportações;
- não manter seletores mensais independentes por tela;
- funções de domínio devem receber `competenceKey` explicitamente sempre que possível.

## Responsabilidades separadas

`src/domain/competencia.js` e `src/domain/competence-context.js` não determinam:

- escopo da escola;
- aptidão ou inaptidão;
- autorização de escrita;
- regras dos programas;
- resultado técnico de documentos;
- abertura ou resolução de pendências.

Essas decisões pertencem aos serviços, políticas de acesso, configurações e domínios específicos.

## Cobertura obrigatória

O contrato deve permanecer coberto por:

- seleção inicial e persistida;
- rejeição de chave inexistente ou de outro exercício;
- troca de exercício;
- janeiro a dezembro de 2026;
- ausência de seletor mensal concorrente;
- preservação entre telas, perfis e recarga;
- restauração de exercício posterior;
- header desktop, Android e iPhone;
- compatibilidade com Supabase local, Auth e RLS;
- uso da mesma chave nas exportações Excel.

Plano de continuidade: [`../superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](../superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
