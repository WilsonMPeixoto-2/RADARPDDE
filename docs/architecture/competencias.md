# Competências — contrato canônico

**Estado:** vigente e implementado  
**Atualizado em:** 29 de julho de 2026

## 1. Objetivo

Centralizar validação, comparação, apresentação, seleção e navegação das competências mensais do RADAR PDDE.

O valor canônico utiliza exclusivamente:

```text
YYYY-MM
```

Exemplo: `2026-08`.

Rótulos de apresentação são derivados e nunca substituem a chave persistida.

## 2. Formatos de apresentação

| Identificador | Exemplo | Uso |
|---|---|---|
| `display` | `Agosto/2026` | títulos, cartões e indicadores |
| `numeric` | `08/2026` | relatórios compactos |
| `long` | `Agosto de 2026` | textos corridos |
| `iso` | `2026-08` | persistência e intercâmbio |
| `filename` | `2026-08` | nomes legíveis de arquivo |
| `compactFilename` | `2026_08` | nomes sem hífen |

## 3. Chaves compostas legadas

A camada de compatibilidade ainda pode representar uma verificação como:

```text
2026-08_BASIC
```

Essa forma combina competência e programa apenas para interoperar com o núcleo legado. No modelo relacional, competência e programa são campos e relacionamentos distintos. Novas tabelas, serviços e contratos não devem usar a chave composta como identidade primária.

## 4. Componentes do domínio

### 4.1 Formatação e comparação

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

### 4.2 Contexto mensal global

`src/domain/competence-context.js` mantém uma única fonte de estado mensal:

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
//   closingKey: '2026-12'
// }

RadarCompetenceContext.select(key, options);
RadarCompetenceContext.selectExercise(exercise, options);
RadarCompetenceContext.replaceConfiguration(nextState);
RadarCompetenceContext.subscribe(listener);
RadarCompetenceContext.getAvailableForExercise(exercise);
```

O módulo é puro, funciona no navegador e no Node.js e não depende do DOM.

### 4.3 Integração visual

`src/integration/global-competence-selector.js`:

- transforma o indicador do header em seletor mensal acessível;
- usa `RadarCompetenceContext` como única fonte de seleção;
- sincroniza exercício e competência;
- preserva a competência entre telas e recarga;
- atualiza a superfície ativa por evento único;
- remove o seletor mensal concorrente da página de competências;
- mantém compatibilidade com pontos de entrada legados;
- aguarda o bootstrap remoto antes de assumir o estado mensal.

A integração é carregada pela cadeia de gestão de exercícios, sem alterar o núcleo `app.js`.

## 5. Regras de inicialização

A seleção inicial segue esta ordem:

1. competência persistida válida;
2. competência inicial explicitamente fornecida e pertencente ao exercício resolvido;
3. `closing_competence` válida para o exercício;
4. competência cronologicamente mais recente do exercício;
5. erro explícito quando não existe competência válida.

O exercício é derivado da competência persistida, carregada ou de fechamento antes do fallback da aplicação. Isso preserva exercícios posteriores após recarga.

## 6. Estado de 2026

O Supabase Production contém `2026-01` a `2026-12`. As doze competências estão disponíveis aos perfis conforme suas permissões.

Na data de corte de 29/07/2026:

```text
closing_competence = 2026-12
app_config.row_version = 5
```

A transição de `2026-05` para `2026-12` já foi concluída por fluxo transacional e auditado após a publicação do contexto global. Qualquer documento que descreva essa mudança como futura é histórico.

Não criar `operational_status` ou migration adicional sem requisito comprovado que não possa ser representado pelas competências existentes, datas, `closed_at` e `closing_competence`.

## 7. Persistência e navegação

- persistir somente `YYYY-MM`;
- não persistir rótulo formatado;
- preservar a seleção ao navegar, trocar visão permitida, retornar e recarregar;
- transportar a mesma competência em Dashboard, Carteira, Prontuário, Pendências, alertas, timeline e exportações;
- não manter seletores mensais independentes por tela;
- passar `competenceKey` explicitamente às funções de domínio sempre que possível.

A navegação contextual restaura a competência pelo mesmo domínio; não mantém uma segunda fonte de estado mensal.

## 8. Responsabilidades separadas

Os módulos de competência não determinam:

- escopo da escola;
- APTA ou INAPTA;
- autorização de escrita;
- regras dos programas;
- análise técnica;
- abertura, resolução ou cancelamento de pendência.

Essas decisões pertencem aos serviços, políticas de acesso, configurações e domínios próprios.

## 9. Cobertura obrigatória

O contrato deve permanecer coberto por:

- seleção inicial e persistida;
- rejeição de chave inexistente ou de outro exercício;
- troca de exercício;
- janeiro a dezembro de 2026;
- ausência de seletor concorrente;
- preservação entre telas, perfis e recarga;
- restauração de exercício posterior;
- header desktop, Android e iPhone;
- integração com Supabase, Auth e RLS;
- uso da mesma chave nas exportações;
- restauração pela navegação contextual.

## 10. Referências

- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
- [`avaliacao-mensal.md`](avaliacao-mensal.md);
- [`navigation-contextual.md`](navigation-contextual.md);
- [`../audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](../audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md).
