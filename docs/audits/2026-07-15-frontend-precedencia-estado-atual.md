# Auditoria de precedência do frontend — estado atual

## Resumo executivo

O carregamento atual funciona e passou nos cenários normais e com atraso artificial. A auditoria não encontrou defeito funcional novo, script duplicado em execução ou erro de página. Encontrou, porém, dependências reais de ordem que impedem uma consolidação mecânica.

Os principais resultados são:

- 35 scripts estáticos;
- 17 scripts declarados por `config.js`;
- 1 declaração deduplicada (`retificacoes.js`);
- 15 extensões ordenadas;
- 1 loader assíncrono com posição legitimamente variável;
- 4 scripts Excel encadeados em série;
- 10 folhas de estilo;
- 68 colisões de seletor/propriedade no mesmo contexto;
- 37 colisões entre arquivos, das quais 34 são mobile;
- 2 globais com escritores múltiplos em JavaScript.

A conclusão é preservar a ordem atual enquanto a consolidação é feita por grupos comprovados, com computed styles, capturas e E2E. Nomes como `final`, `hotfix` e `task-N` descrevem a história do arquivo; não comprovam que ele esteja superado.

## Linha de base

| Campo | Valor |
|---|---|
| Data | 15/07/2026 |
| Base auditada | `ad0513299c9f4e10b08d6f1cedacb970adbc6ec8` |
| Branch | `docs/ciclo-b-precedencia-frontend` |
| PR | 27, em rascunho |
| Persistência | `LocalStorageRepository` |
| Supabase remoto | não conectado |
| Mudança funcional | nenhuma |
| Mudança visual | nenhuma |
| Produção | não alterada |

## Método

### Análise estática

`scripts/audit/analyze-frontend-precedence.mjs` lê:

- `index.html`;
- `config.js`;
- `src/integration/load-excel-export.js`;
- as dez folhas CSS efetivas;
- as dezesseis extensões efetivas;
- os quatro módulos Excel encadeados.

O resultado determinístico é [`../evidence/frontend-precedence/manifest.json`](../evidence/frontend-precedence/manifest.json).

### Observação no navegador

`tests/audit/frontend-precedence.spec.js` prefixa as respostas JavaScript locais somente durante o teste. O código versionado e o runtime da aplicação não são modificados.

Foram executados:

1. carregamento normal pelo servidor de auditoria;
2. carregamento com atraso artificial dos scripts estáticos posteriores a `config.js`.

Nos dois cenários:

- scripts estáticos preservaram ordem;
- extensões não assíncronas preservaram ordem;
- wrappers ficaram disponíveis;
- o loader Excel executou uma vez;
- os quatro módulos Excel permaneceram sequenciais;
- folhas de estilo permaneceram na ordem do manifesto;
- não houve `pageerror` ou `console.error`.

Durante repetições do teste, o loader Excel apareceu em posições distintas entre as extensões, confirmando que sua posição não deve ser congelada como se fosse síncrona.

## Achados classificados

### `CP-FE-B1-01` — Núcleo e extensões inicializam sem erro

O carregamento normal e o cenário com atraso terminaram com as APIs de Pendências, Dashboard e Excel disponíveis. Preservar com testes.

### `ID-FE-B1-02` — Deduplicação de Retificações

`src/domain/retificacoes.js` é estático e possui o marcador usado por `config.js`. A declaração dinâmica é ignorada e a execução ocorre uma vez. Não retirar o marcador isoladamente.

### `ID-FE-B1-03` — Loader Excel assíncrono

`load-excel-export.js` é o único item dinâmico com `async = true`. A posição variável é intencionalmente tolerada; o contrato relevante é a sequência dos quatro filhos após `load`.

### `ID-FE-B1-04` — Wrappers encadeados de Pendências

`task-10-11-pendency-actions.js` depende das versões de `renderPendencias` e `openPendencyDetail` instaladas pela Task 9. A ordem é semântica, não apenas organizacional.

### `IC-FE-B1-05` — Precedência CSS concentrada no mobile

Existem 37 colisões exatas entre arquivos no mesmo contexto. Trinta e quatro estão nos breakpoints de 900 px e 520 px e concentram-se na tríade:

```text
styles.css
→ mobile-responsive.css
→ mobile-rendering-hotfix.css
```

O hotfix muda principalmente altura máxima de modais, pintura, viewport, overflow e efeitos custosos. Sua posição posterior é parte da solução vigente.

### `IC-FE-B1-06` — Três overrides globais de Pendências

Os seletores `.pendency-detail-marker`, `.pendency-row-selected` e `.pendency-drawer-layer` recebem valores posteriores em arquivos da Task 9. O último caso reduz o `z-index` da camada de 1300 para 800 no arquivo cross-view. A auditoria registra o resultado; não interpreta a intenção institucional nem autoriza inversão.

### `IC-FE-B1-07` — Polling de inicialização distribuído

Nove extensões aguardam funções globais por polling antes de instalar wrappers. Isso evita falha durante a montagem incremental, mas torna o bootstrap menos explícito. Substituir esse mecanismo é uma evolução posterior, não correção urgente.

### `FA-FE-B1-08` — Comparação de computed styles

O manifesto compara seletor exato e contexto. A próxima consolidação deve capturar computed styles dos elementos tocados, porque seletores diferentes também podem disputar a mesma propriedade.

### `CP-FE-B1-09` — Dashboard em dois arquivos aditivos

Não há colisão exata entre `cycle-b-dashboard.css` e `cycle-b-dashboard-final.css`. O arquivo posterior acrescenta estados e ações. Ambos devem permanecer até uma consolidação baseada em equivalência, não no nome.

## Métricas CSS

| Métrica | Resultado |
|---|---:|
| Folhas efetivas | 10 |
| Blocos de regra | 773 |
| Ocorrências de seletor | 926 |
| Declarações | 2.528 |
| Declarações `!important` | 68 |
| Seletores repetidos em qualquer contexto | 161 |
| Seletores em contextos diferentes | 113 |
| Repetições no mesmo contexto | 128 |
| Colisões no mesmo contexto | 68 |
| Colisões entre arquivos | 37 |
| Colisões internas ao mesmo arquivo | 31 |

As 17 colisões de `max-height` entre arquivos correspondem principalmente a grupos de seletores de modal expandidos individualmente pelo analisador. Elas não representam 17 decisões de produto independentes.

## Distribuição das colisões entre arquivos

| Cadeia de arquivos | Seletores atingidos |
|---|---:|
| `mobile-responsive.css` → `mobile-rendering-hotfix.css` | 15 |
| `styles.css` → `mobile-responsive.css` → `mobile-rendering-hotfix.css` | 13 |
| `styles.css` → `mobile-responsive.css` | 6 |
| `styles.css` → `task-9-pendencias.css` | 2 |
| `task-9-pendencias.css` → `task-9-cross-view.css` | 1 |

## Métricas JavaScript

| Métrica | Resultado |
|---|---:|
| Scripts estáticos | 35 |
| Extensões declaradas | 17 |
| Declarações deduplicadas | 1 |
| Extensões ordenadas efetivas | 15 |
| Extensões assíncronas efetivas | 1 |
| Scripts encadeados pelo loader Excel | 4 |
| Arquivos dinâmicos analisados | 20 |
| Globais escritos distintos | 66 |
| Pré-requisitos globais explícitos distintos | 28 |
| Globais com escritores múltiplos | 2 |
| Módulos com polling | 9 |
| Módulos com `MutationObserver` | 3 |

## O que ficou protegido

- ordem e composição de Pendências;
- deduplicação de Retificações;
- inicialização de Carteira e Dashboard;
- acessibilidade de modais;
- carregamento da exportação Excel;
- solução mobile atual;
- comportamento com movimento reduzido;
- produção em modo local;
- configuração fail-closed do Supabase.

## O que não foi concluído por suposição

- nenhum arquivo foi marcado como removível;
- nenhuma colisão foi chamada de defeito visual sem reprodução;
- nenhuma equivalência de computed style foi presumida;
- nenhum `!important` foi removido;
- nenhum wrapper foi substituído;
- nenhum breakpoint foi unificado;
- nenhuma biblioteca foi recomendada apenas por modernidade.

## Relação com a decisão sobre dados

A decisão posterior ao Ciclo A mantém temporariamente o tratamento de D2 para o início da implantação real do Supabase, porque o site ainda é de desenvolvimento e uso exclusivo do responsável. O risco não foi eliminado: não se deve acrescentar novo D2 ao código, e o saneamento da árvore ativa, minimização e fonte protegida continuam obrigatórios antes de Preview/piloto com dados reais. A eventual reescrita do histórico permanece plano separado.

Essa decisão não altera o escopo deste pacote, que não lê nem reproduz valores de dados no manifesto.

## Próximo pacote recomendado

O candidato tecnicamente mais delimitado é uma consolidação mobile em duas fases:

1. capturar computed styles e imagens dos elementos atingidos em 900 px e 520 px;
2. consolidar somente regras comprovadamente equivalentes da tríade `styles.css` / `mobile-responsive.css` / `mobile-rendering-hotfix.css`.

Resultado esperado:

- menos dependência implícita da ordem;
- nenhuma mudança visual deliberada;
- hotfixes ainda necessários preservados e explicados;
- regressão detectável por computed style, imagem e E2E.

Esse pacote exigirá especificação própria. Se a proposta mudar aparência, hierarquia ou comportamento, será apresentado comparativo visual antes da implementação. A auditoria atual, sozinha, não autoriza a consolidação.

## Conclusão

`BL-FE-01` está tecnicamente resolvido como auditoria: o RADAR agora possui grafo, manifesto e teste de precedência. O frontend não está “pronto para apagar camadas”; está pronto para que a próxima consolidação seja pequena, mensurável e reversível.
