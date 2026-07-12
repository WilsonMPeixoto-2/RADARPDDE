# Task 8 — Separação entre bonificação, análise técnica e pendência documental

## 1. Objetivo

Eliminar a mistura atualmente existente entre o resultado da bonificação, a situação da análise técnica e a existência de pendência documental. A Task 8 deve tornar essas três dimensões independentes e legíveis em todo o sistema, sem alterar dados-fonte, perfis, Supabase, exportação Excel ou regras já consolidadas.

A implementação deve garantir que um programa possa, por exemplo, permanecer **APTO na bonificação** e simultaneamente apresentar **análise técnica incorreta** e **pendência documental ativa**.

## 2. Fonte normativa e precedência

A implementação observará, nesta ordem:

1. Dossiê Consolidado v1.0;
2. Plano do Lote 2 v2.0;
3. Plano técnico do Ciclo A;
4. estado da `main` após o merge do PR nº 14;
5. esta especificação da Task 8.

## 3. Problema atual

A função `getProgramOperationalStatus()` combina três dimensões distintas:

- `resultadoBonif`;
- estados de `analise`;
- presença de análise incorreta.

Com isso, um programa consolidado como `apta` pode ser apresentado como `inapta` apenas porque um documento foi tecnicamente classificado como `Incorreto`. Esse efeito viola a regra institucional de preservação da bonificação histórica e torna ambíguos Dashboard, Carteira, Competências e Prontuário.

## 4. Abordagem adotada

A Task 8 adotará separação no domínio e nas superfícies de interface. Não serão persistidos novos campos derivados. Os estados serão calculados a partir dos dados existentes sempre que a tela for renderizada.

Não será adotada correção apenas visual, porque manteria a regra incorreta no domínio. Também não serão gravados status redundantes no estado, para evitar divergência entre dados derivados e dados-fonte.

## 5. Modelo de estados

### 5.1. Bonificação por programa

A bonificação será calculada exclusivamente a partir de `bonificacao` e `resultadoBonif`.

Estados de apresentação:

- `apta`: programa consolidado como apto;
- `inapta`: programa consolidado como inapto;
- `em-apuracao`: há respostas lançadas, mas a consolidação ainda não foi concluída ou não é possível;
- `nao-lancada`: nenhuma resposta de bonificação foi registrada.

Regras:

- qualquer resposta `Não` produz `inapta` quando a bonificação estiver consolidada;
- respostas `Sim` e `Não se aplica`, conforme aplicabilidade, produzem `apta` quando consolidadas;
- análise técnica nunca modifica esse estado;
- pendência documental nunca modifica esse estado;
- retificação administrativa futura poderá alterar a resposta-fonte e provocar novo cálculo, mas não será implementada nesta task.

### 5.2. Análise técnica por programa

A análise técnica será calculada exclusivamente pelos seis campos de `analise`.

Estados de apresentação:

- `correto`: todos os documentos aplicáveis estão tecnicamente corretos e nenhum foi corrigido após o prazo;
- `correto-atrasado`: todos os documentos aplicáveis estão tecnicamente corretos e pelo menos um possui `Correto (Atrasado)`;
- `incorreto`: pelo menos um documento possui `Incorreto`;
- `em-analise`: há alguma análise iniciada, mas ainda existem documentos `Não analisado`;
- `nao-analisado`: todos os documentos permanecem `Não analisado`.

Ordem de precedência:

1. se houver `Incorreto`, o estado é `incorreto`;
2. se todos forem corretos e houver ao menos um `Correto (Atrasado)`, o estado é `correto-atrasado`;
3. se todos forem `Correto`, o estado é `correto`;
4. se houver mistura entre análises realizadas e `Não analisado`, o estado é `em-analise`;
5. se todos forem `Não analisado`, o estado é `nao-analisado`.

### 5.3. Pendência documental

A pendência permanece uma terceira dimensão independente, derivada do módulo `pendencias.js`.

Estados relevantes:

- ativa — Aberta;
- ativa — Aguardando reanálise;
- Resolvida;
- Cancelada;
- inexistente.

Uma pendência ativa não altera bonificação nem análise técnica. Ela apenas informa que existe providência documental pendente e qual é o próximo ator.

## 6. Alterações de domínio

O módulo `src/domain/fluxo-operacional.js` deverá deixar de oferecer um único estado operacional misto para consumo das telas.

Serão introduzidas funções independentes, com nomes finais definidos no plano de implementação, equivalentes a:

- avaliar situação da bonificação;
- avaliar situação da análise técnica;
- identificar se houve início de lançamento em cada dimensão.

A função mista existente poderá ser removida ou mantida temporariamente apenas como compatibilidade interna, desde que nenhum componente de interface continue dependendo dela e que os testes deixem explícito que ela não representa mais a regra institucional.

## 7. Integração com as telas

### 7.1. Dashboard

Indicadores de bonificação devem usar somente o estado de bonificação.

Indicadores operacionais de análise ou pendência devem ser exibidos separadamente. Contagens sobrepostas não devem ser somadas como se fossem categorias exclusivas.

### 7.2. Carteira / Escolas

A listagem deve permitir distinguir, no mesmo registro:

- resultado da bonificação;
- situação técnica documental;
- pendência/ação necessária.

A Task 8 não exige redesenho completo da Carteira, reservado ao Lote 2, mas todo rótulo ou filtro existente que se apresente como bonificação deve deixar de consumir análise técnica.

### 7.3. Competências

Cards, tabelas, filtros e resumos por programa devem mostrar a bonificação sem interferência da análise. Quando houver resumo técnico, ele deve usar o novo avaliador independente.

### 7.4. Prontuário

O programa deve apresentar dimensões separadas. A grade documental continua mostrando o valor individual de bonificação e a análise individual por documento. O resumo do programa deve usar os avaliadores independentes.

### 7.5. Pendências

Nenhuma alteração estrutural da página é obrigatória nesta task. A única exigência é que filtros, badges ou resumos de bonificação não sejam contaminados pela existência ou pelo estado da pendência.

## 8. Microcopy e semântica visual

Rótulos de bonificação:

- `APTA`;
- `INAPTA`;
- `Em apuração`;
- `Não lançada`.

Rótulos de análise técnica:

- `Correto`;
- `Correto após o prazo`;
- `Incorreto`;
- `Em análise`;
- `Não analisado`.

A cor deve reforçar, nunca substituir, o texto. A Task 14 fará o polimento visual e de acessibilidade definitivo; a Task 8 deve apenas impedir semântica enganosa.

## 9. Compatibilidade e migração

Não haverá migração de dados.

Não serão alterados:

- `INITIAL_DATA_VERSION`;
- `radar_pdde_pendency_schema_version`;
- estruturas de `localStorage`;
- dados de bonificação existentes;
- estados técnicos existentes;
- notas fiscais;
- pendências existentes.

Os novos estados são derivados em tempo de execução.

## 10. Fora de escopo

A Task 8 não implementará:

- regras de autorização por perfil;
- autenticação ou Supabase;
- retificação administrativa;
- novas colunas na exportação Excel;
- redesign integral do Dashboard, Carteira ou Prontuário;
- cancelamento ou reabertura de pendências;
- quatro abas definitivas da página Pendências;
- alteração de nomenclaturas canônicas de dados persistidos.

## 11. Testes obrigatórios

### 11.1. Testes unitários de domínio

Devem cobrir, no mínimo:

1. bonificação `apta` com análise `Incorreto` permanece `apta`;
2. bonificação `inapta` com todas as análises corretas permanece `inapta`;
3. bonificação `apta` com pendência ativa permanece `apta`;
4. bonificação parcialmente preenchida retorna `em-apuracao`;
5. ausência total de respostas retorna `nao-lancada`;
6. todas as análises `Não analisado` retornam `nao-analisado`;
7. mistura de análise realizada e `Não analisado` retorna `em-analise`;
8. qualquer `Incorreto` retorna `incorreto`;
9. todas corretas com uma `Correto (Atrasado)` retornam `correto-atrasado`;
10. todas `Correto` retornam `correto`.

### 11.2. Testes E2E

Devem provar, em pelo menos uma jornada completa:

- um programa consolidado como APTA continua exibido como APTA após análise incorreta;
- a situação técnica é exibida separadamente como Incorreto;
- a abertura de uma pendência não altera a bonificação apresentada;
- a reanálise correta tardia muda apenas o resumo técnico para `Correto após o prazo` e resolve a pendência, preservando APTA;
- filtros ou contagens rotulados como bonificação não incluem programas apenas tecnicamente incorretos.

### 11.3. Não regressão

A bateria deve incluir:

- testes unitários existentes;
- `tests/e2e/functional-core.spec.js`;
- `tests/e2e/pendency-cycle.spec.js`;
- smoke mobile em Chromium e WebKit;
- verificação de sintaxe.

## 12. Critérios de aceite

A Task 8 será considerada concluída somente quando:

1. nenhuma função de interface usar análise técnica para definir APTA/INAPTA;
2. bonificação, análise e pendência forem calculadas separadamente;
3. APTA + Incorreto + pendência ativa for representável e visível sem contradição;
4. a exportação Excel permanecer inalterada;
5. nenhuma regra de perfil for modificada;
6. todos os testes unitários e E2E passarem em CI;
7. o Preview do Vercel for validado funcional e visualmente;
8. o diff não contiver mudanças fora do escopo.

## 13. Estratégia de entrega

A implementação ocorrerá na branch `feature/ciclo-a-task-8-separacao-indicadores`.

Fluxo:

1. testes de domínio em estado vermelho;
2. implementação mínima dos avaliadores independentes;
3. substituição dos consumidores da função mista;
4. testes E2E em estado vermelho e depois verde;
5. revisão de diff e busca por usos residuais;
6. execução integral do CI;
7. PR em rascunho e Preview do Vercel;
8. revisão funcional, visual e institucional;
9. merge e produção somente após autorização expressa.
