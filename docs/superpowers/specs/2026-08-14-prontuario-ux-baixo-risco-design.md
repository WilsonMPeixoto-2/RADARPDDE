# Prontuário — pacote UX de baixo risco

**Data:** 14 de agosto de 2026  
**Estado:** aprovado para implementação  
**Baseline:** `9e584f199e21d3749be01e4fe92a3bea6ce0bbea`

## Objetivo

Aplicar apenas refinamentos de apresentação no acompanhamento mensal do Prontuário, sem alterar schema, regras de persistência, permissões, cálculo da avaliação mensal ou efeitos financeiros/patrimoniais.

## Escopo

### 1. Consulta à Assessoria dentro da própria NF

Cada nota fiscal de serviço já possui estado individual de envio à Assessoria e análise técnica própria. A interface deve aproximar o controle de envio da nota que ele representa:

- a caixa da NF na linha **Notas Fiscais** passa a conter o checkbox `Enviada à Assessoria`;
- o checkbox continua chamando o mesmo handler `toggleInvoiceAdvisorySent()` e persiste pelo mesmo `InvoiceService.updateServiceAdvisory()`;
- a linha **Consulta Assessoria** mantém a análise técnica individual por NF e o resumo mensal agregado;
- não criar segundo estado, coluna, tabela ou cálculo;
- uma NF não pode controlar o estado de outra.

### 2. Separação visual entre programas

O acompanhamento mensal deve tornar evidente onde começa e termina cada programa da mesma competência:

- a primeira linha de cada programa recebe marcador visual próprio;
- a célula lateral que contém competência + programa recebe classes semânticas, em vez de depender apenas de estilos inline;
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
- `InvoiceService` e `VerificationService`, exceto se um defeito real for descoberto durante a validação;
- Supabase, migrations, RLS, RPCs ou tipos de banco;
- Excel e exportações.

## Arquitetura

A mudança fica concentrada no render do Prontuário em `app.js` e em estilos de apresentação em `styles.css`. O estado individualizado por NF já existe e permanece fonte única; o frontend apenas muda a posição do checkbox e adiciona classes para hierarquia visual.

## Acessibilidade

- manter `aria-label` do checkbox identificando explicitamente o número da NF;
- checkbox deve permanecer associado visual e semanticamente à respectiva caixa da NF;
- não depender apenas de cor para indicar início de programa;
- manter foco e controles existentes.

## Validação proporcional

1. teste E2E existente de consulta individualizada deve provar que cada checkbox está dentro da caixa da respectiva NF;
2. o mesmo teste deve continuar provando persistência independente e resumo agregado;
3. cenário de Prontuário deve provar classes/marcadores de início de programa para mais de um programa;
4. executar o teste E2E diretamente afetado e gate base proporcional;
5. nenhuma bateria de Supabase, migrations, Excel ou backup é necessária, porque essas camadas não serão alteradas.

## Critério de conclusão

O pacote está concluído quando a interface mostra controles de Assessoria junto às respectivas NFs, os programas são visualmente distinguíveis, a análise individual e o resumo mensal permanecem intactos, e os testes proporcionais passam sem regressão material.