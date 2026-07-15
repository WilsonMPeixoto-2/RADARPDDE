# Ciclo B1 — Grafo de carregamento e precedência do frontend

## Objetivo

Transformar a ordem real de carregamento do frontend do RADAR PDDE em um contrato explícito, reproduzível e testado antes de qualquer consolidação de CSS ou decomposição do JavaScript. O pacote não altera o produto: ele identifica quais arquivos participam da interface, quando são executados, quais funções globais são estendidas e onde a cascata depende da ordem.

## Situação atual comprovada

O frontend combina três mecanismos:

1. `index.html` carrega `styles.css` e 35 scripts síncronos na ordem do documento;
2. `config.js` acrescenta nove folhas de estilo e declara 17 scripts de extensão;
3. `src/integration/load-excel-export.js` carrega mais quatro scripts, em série, depois do evento `load`.

O navegador insere as extensões de `config.js` no `head`. Quinze extensões usam `async = false` e preservam a ordem declarada; a observação com e sem atraso artificial do núcleo mostra que elas executam depois dos scripts estáticos. O loader Excel usa `async = true`, portanto sua posição relativa varia legitimamente. Ele não envolve funções do núcleo e espera o evento `load` para carregar seus quatro módulos em série. Os módulos ordenados também usam espera limitada por pré-requisitos, proteção adicional que deve ser registrada antes de qualquer substituição do loader.

Há pelo menos um encadeamento material entre extensões: `task-9-pendencias-page.js` substitui `renderPendencias`; em seguida, `task-10-11-pendency-actions.js` captura essa versão e a envolve novamente. Reordenar os arquivos pode preservar a sintaxe e ainda modificar o comportamento.

Na camada visual, as dez folhas de estilo efetivas contêm regras globais, responsivas e de movimento reduzido. Uma contagem sem contexto encontra muitos seletores repetidos, mas parte relevante corresponde a overrides intencionais dentro de `@media`. A auditoria deve separar:

- repetição do mesmo seletor em contextos diferentes, geralmente responsiva;
- repetição no mesmo contexto sem conflito de propriedade;
- colisão no mesmo contexto com valores distintos, efetivamente dependente da cascata;
- uso de `!important`, que altera a precedência normal.

## Classificação dos achados de partida

| Código | Achado | Conduta neste pacote |
|---|---|---|
| `CP` | A aplicação e os fluxos atuais passaram na linha de base do Ciclo A | preservar e reexecutar os gates |
| `ID` | Extensões carregadas depois do núcleo envolvem funções globais existentes | documentar como contrato, sem reordenar |
| `ID` | `retificacoes.js` está no HTML e é deduplicado por `data-radar-extension` | preservar e testar |
| `ID` | O pacote Excel é carregado de forma assíncrona e sequencial | preservar e testar |
| `IC` | A precedência está distribuída entre HTML, loaders, nomes históricos e cascata | tornar explícita e verificável |
| `FA` | Não havia uma auditoria automatizada específica para essa precedência | implementar a auditoria |

Nenhum arquivo será declarado obsoleto somente pelo nome `final`, `hotfix` ou `task-N`. Obsolescência exige equivalência comprovada e teste visual posterior, fora deste pacote.

## Escopo incluído

- ordem de folhas de estilo do HTML e de `config.js`;
- scripts estáticos do HTML;
- scripts de extensão de `config.js`;
- deduplicação por `data-radar-extension`;
- carregamento encadeado da exportação Excel;
- gravações e pré-requisitos em globais pelas extensões;
- escritores múltiplos da mesma função global;
- regras, declarações, `!important` e contextos condicionais do CSS;
- colisões de propriedades para o mesmo seletor e contexto;
- observação real da ordem de execução em Chromium;
- portabilidade do gate de configuração pública entre checkouts LF e CRLF, sem aceitar divergência de conteúdo;
- documentação arquitetural e auditoria do estado atual.

## Fora do escopo

- reordenar scripts ou estilos;
- fundir ou excluir folhas CSS;
- renomear arquivos históricos;
- modificar seletores, propriedades ou breakpoints;
- decompor `app.js`;
- trocar o mecanismo de extensões;
- redesenhar telas;
- instalar biblioteca de componentes;
- alterar regras de negócio, dados, persistência, Supabase ou produção.

## Artefatos

### Analisador estático

`scripts/audit/analyze-frontend-precedence.mjs` produzirá um manifesto determinístico com:

- estilos estáticos e dinâmicos na ordem declarada;
- scripts estáticos, dinâmicos, deduplicados e encadeados;
- ordem relativa garantida, separando extensões ordenadas e assíncronas;
- métricas por folha de estilo;
- seletores repetidos por contexto;
- colisões de propriedades no mesmo contexto;
- funções globais lidas e gravadas por extensão;
- escritores múltiplos e, portanto, dependentes da ordem.

O analisador terá modo de escrita e modo `--check`, que falha quando o manifesto versionado diverge do código.

### Evidência versionada

`docs/evidence/frontend-precedence/manifest.json` conterá somente caminhos, métricas e relações técnicas. Não conterá dados institucionais, contatos, credenciais, timestamps voláteis ou caminhos absolutos.

### Prova no navegador

`tests/audit/frontend-precedence.spec.js` interceptará os scripts locais, registrará sua execução sem mudar os arquivos-fonte e verificará:

- ordem relativa dos 35 scripts estáticos;
- baseline observada sem atraso;
- cenário com atraso artificial do núcleo para comprovar a estabilidade da ordem dos módulos não assíncronos;
- posição variável do loader Excel sem falso positivo;
- deduplicação de `retificacoes.js`;
- ordem sequencial dos quatro módulos Excel;
- ordem efetiva das dez folhas CSS;
- ausência de erro de página e de console.

O teste será executado por `playwright.frontend-audit.config.js`, somente em Desktop Chromium. Ele valida arquitetura de carregamento; responsividade e aparência continuam cobertas pela baseline e pelos E2E existentes.

### Documentação

- `docs/architecture/frontend-load-order.md`: contrato técnico e grafo de carregamento;
- `docs/audits/2026-07-15-frontend-precedencia-estado-atual.md`: achados, riscos, preservações e próximos limites seguros.

## Modelo de contexto CSS

Cada ocorrência será identificada por:

```text
arquivo + ordem da folha + contexto condicional + seletor + propriedade
```

O contexto global é distinto de `@media (max-width: 900px)`, que por sua vez é distinto de `@media (prefers-reduced-motion: reduce)`. Um seletor repetido em contextos diferentes não será contado como colisão na mesma condição.

Para seletores idênticos no mesmo contexto, o manifesto registrará a sequência completa de valores. A auditoria não tentará inferir equivalência visual de valores diferentes; isso exige comparação posterior por viewport.

## Modelo de dependência JavaScript

Para cada extensão, a auditoria registra:

- `requiresGlobals`: membros globais consultados como pré-requisito;
- `writesGlobals`: membros globais atribuídos;
- `sharedWriters`: membros atribuídos por mais de uma extensão;
- posição na ordem efetiva.

Isso não substitui um sistema de módulos. É uma representação fiel do contrato atual, necessária para que uma futura consolidação preserve a composição dos wrappers.

## Resultado esperado

Ao final, será possível responder com evidência:

1. qual arquivo precisa existir antes de cada extensão;
2. quais funções são envolvidas em mais de uma etapa;
3. quais folhas realmente dependem de vir depois de outras;
4. quais repetições são responsivas e quais colidem no mesmo contexto;
5. quais candidatos podem ser estudados no próximo pacote sem alterar o produto.

O benefício para o usuário é indireto, mas necessário: futuras melhorias visuais e técnicas poderão reduzir duplicação sem apagar comportamentos corretos, alterar o mobile ou quebrar fluxos de pendência, Dashboard, Carteira e Excel.

## Critérios de aceite

- nenhum arquivo funcional ou visual alterado;
- manifesto gerado duas vezes com resultado idêntico;
- `--check` aprovado;
- ordem estática e ordem real documentadas separadamente;
- deduplicação e carregamento Excel comprovados;
- colisões CSS classificadas por contexto;
- escritores globais múltiplos identificados;
- grafo arquitetural completo;
- relatório não declara remoções sem evidência;
- teste Playwright de precedência aprovado;
- configuração pública reproduzível validada em checkout Windows com CRLF e na CI com LF;
- `npm run check`, testes unitários, auditoria do Ciclo A e E2E dirigidos aprovados;
- nenhuma conexão Supabase remota, mudança de Vercel ou deployment de produção.

## Rollback

O pacote acrescenta apenas documentação, ferramentas de auditoria e validação, testes, manifesto e scripts npm. O rollback consiste em reverter esses arquivos; a aplicação permanece idêntica antes e depois.
