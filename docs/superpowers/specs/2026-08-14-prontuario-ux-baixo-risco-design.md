# Prontuário — pacote UX de baixo risco

**Data:** 14 de agosto de 2026  
**Estado:** em implementação  
**Baseline:** `9e584f199e21d3749be01e4fe92a3bea6ce0bbea`

## Objetivo

Aplicar apenas refinamentos de apresentação no acompanhamento mensal do Prontuário, sem alterar schema, regras de persistência, permissões, cálculo da avaliação mensal ou efeitos financeiros/patrimoniais.

## Escopo

### 1. Consulta à Assessoria dentro da própria NF

Cada nota fiscal de serviço já possui estado individual de envio à Assessoria e análise técnica própria. A interface deve aproximar o controle de envio da nota que ele representa:

- a caixa da NF na linha **Notas Fiscais** passa a conter o checkbox `Enviada à Assessoria`;
- o checkbox continua sendo o mesmo elemento e mantém o mesmo handler `toggleInvoiceAdvisorySent()` e a mesma persistência pelo `InvoiceService`;
- a linha **Consulta Assessoria** mantém a análise técnica individual por NF e o resumo mensal agregado;
- não criar segundo estado, coluna, tabela ou cálculo;
- uma NF não pode controlar o estado de outra.

### 2. Separação visual entre programas

O acompanhamento mensal deve tornar evidente onde começa e termina cada programa da mesma competência:

- a primeira linha de cada programa recebe marcador visual próprio;
- a célula lateral que contém competência + programa recebe classes semânticas;
- nome do programa ganha maior hierarquia tipográfica;
- início do grupo recebe separação superior mais perceptível e fundo sutil, preservando a paleta vigente;
- não transformar cada programa em tabela independente e não duplicar cabeçalhos de colunas;
- o agrupamento deve continuar legível em desktop e responsivo sem retirar conteúdo no mobile.

### 3. Preservações obrigatórias

Não alterar:

- análise técnica individual de cada documento;
- análise individual de consulta contábil por NF de serviço;
- resumo mensal automático da Assessoria;
- bonificação e consolidação;
- `RadarFluxoOperacional.evaluateMonthlyEvaluation()`;
- `InvoiceService` e `VerificationService`;
- Supabase, migrations, RLS, RPCs ou tipos de banco;
- Excel e exportações.

## Arquitetura

Durante a exploração do código foi identificado que o repositório já possui uma cadeia canônica de extensões pós-`app.js`, documentada em `docs/architecture/product-extensions-load-order.md`. Para reduzir ainda mais o risco, a implementação não modifica o núcleo monolítico de `app.js` nem `styles.css`.

A solução usa:

- `src/integration/prontuario-operational-ux.js`: extensão carregada por último, que envolve `renderProntuario`, preserva argumentos/retorno e reorganiza somente o DOM já renderizado;
- `src/styles/prontuario-operational-ux.css`: estilos isolados do refinamento;
- `src/integration/product-extensions-bootstrap.js`: inclusão dos dois artefatos na cadeia oficial;
- `tests/e2e/prontuario-ux-baixo-risco.spec.js`: contrato E2E específico.

O checkbox existente é movido como nó DOM para a caixa da NF correspondente. Não é clonado nem recriado, portanto conserva `checked`, `aria-label`, `onchange` e a persistência individual já existente. A análise técnica individual permanece na linha **Consulta Assessoria**.

A separação dos programas é derivada da estrutura já produzida pelo Prontuário: cada grupo começa na linha que contém a célula `rowspan` da competência/programa. A extensão acrescenta classes de apresentação, sem criar estado de negócio paralelo.

## Acessibilidade

- manter `aria-label` do checkbox identificando explicitamente o número da NF;
- checkbox permanece associado visualmente à respectiva caixa da NF;
- não depender apenas de cor para indicar início de programa: há também borda, espaçamento e hierarquia tipográfica;
- manter foco e controles existentes;
- não usar `innerHTML` para mover dados operacionais.

## Validação proporcional

1. teste E2E focado prova que cada checkbox está dentro da caixa da respectiva NF;
2. o mesmo teste preserva análise individual e resumo agregado;
3. cenário de Prontuário prova classes/marcadores de início de programa para mais de um programa;
4. executar gates automáticos materiais do repositório e comparar eventuais falhas com a baseline;
5. nenhuma bateria específica de Supabase, migrations, Excel ou backup é necessária, porque essas camadas não são alteradas.

## Critério de conclusão

O pacote está concluído quando a interface mostra controles de Assessoria junto às respectivas NFs, os programas são visualmente distinguíveis, a análise individual e o resumo mensal permanecem intactos, os testes focados passam e a alteração é integrada e publicada sem regressão material atribuível ao pacote.