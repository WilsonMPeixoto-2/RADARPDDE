# Excel SME com template canônico e ExcelJS — Design

## Objetivo

Gerar o Excel SME mensal como uma tradução fiel entre os dados do RADAR PDDE e o modelo original `CRE 04 - CONTROLE ONEDRIVE2026 (1).xlsx`, preservando literalmente estrutura, textos, estilos e campos destinados ao preenchimento posterior.

## Decisões consolidadas

- O arquivo original é a referência canônica do produto Excel SME.
- O motor será ExcelJS 4.4.0, usando o workbook documental no navegador.
- A biblioteca e o template serão carregados somente quando o usuário acionar `Excel SME`, sem impacto no login ou no bootstrap inicial.
- O relatório institucional de quatro abas e o CSV legado permanecem inalterados.
- Não haverá alteração de banco, migrations, RLS, Auth ou dados de Production.
- O PR permanecerá em rascunho até o candidato abrir no Microsoft Excel desktop sem reparo.

## Arquitetura

### 1. Modelo de tradução

`src/domain/excel-sme-export-model.js` transforma o estado do RADAR em linhas mensais independentes de qualquer biblioteca de planilha.

Responsabilidades:

- selecionar somente a competência mensal ativa;
- agrupar programas nas contas BÁSICO, QUALIDADE e EQUIDADE;
- mapear os seis campos documentais de cada conta;
- deixar vazios os campos que não possuem origem no RADAR;
- calcular `SISTEMÁTICA PREENCHIDA` com base na completude canônica;
- calcular `STATUS` por meio de `RadarFluxoOperacional.evaluateMonthlyEvaluation`, sem duplicar regras de negócio;
- preservar a unidade escolar como eixo de cada linha.

### 2. Aplicação do template

`src/domain/excel-sme-template-renderer.js` carrega o template oficial, seleciona a aba correspondente ao mês, remove as demais abas e preenche as linhas pelo código de designação.

O renderer deve:

- preservar os 30 cabeçalhos literais;
- preservar A1:B1 mesclado, larguras, alturas, estilos, bordas, filtros, congelamento e configuração de impressão;
- manter campos descritivos à esquerda com recuo leve e valores categóricos centralizados, sempre com alinhamento vertical e quebra de texto coerentes;
- remover `dataValidations`, pois esse recurso já provocou reparo e planilha vazia em clientes Microsoft Excel;
- limpar somente os valores mensais E:AD antes do preenchimento;
- substituir fórmulas antigas de `STATUS` pelo resultado canônico do RADAR;
- manter AA:AD vazias quando não houver fonte correspondente no sistema;
- manter linhas do template sem correspondência com dados operacionais em branco;
- acrescentar unidade ausente do template apenas por fallback, copiando a apresentação de uma linha canônica.

### 3. Carregamento sob demanda

`src/integration/excel-export-integration.js` chama um carregador lazy para:

1. carregar `/vendor/exceljs.min.js`;
2. buscar `/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`;
3. gerar e baixar o arquivo.

A biblioteca não integra o caminho crítico de autenticação nem o carregamento inicial de dados.

## Correspondência de dados

Para cada conta, os programas elegíveis são os programas vinculados à escola e classificados na respectiva família.

- Campo documental: agrega apenas valores existentes; `NÃO` prevalece, depois `SIM`, depois `NÃO SE APLICA`; ausência permanece vazia.
- Sistemática:
  - `SIM` quando todos os programas vinculados daquela conta possuem verificação consolidável na competência;
  - `NÃO` quando existe lançamento iniciado, mas a conta ainda está incompleta;
  - vazio quando nenhum lançamento foi iniciado ou a escola não possui programa daquela conta.
- Status da linha:
  - `INAPTA` se qualquer programa vinculado e consolidável for inapto;
  - `APTA` somente quando todos os programas vinculados com incidência na competência estiverem consolidados e aptos;
  - vazio enquanto o resultado ainda não puder ser determinado.

Bonificação, análise técnica e pendências continuam controles independentes. A exportação não altera pendências nem grava dados.

## Segurança e dependências

O alerta do `npm audit` para ExcelJS será tratado por política de alcance, não por supressão genérica:

- versão fixada em 4.4.0;
- bundle oficial do navegador versionado e conferido contra `node_modules/exceljs/dist/exceljs.min.js`;
- writer de streaming, APIs de filesystem e entrada de padrões glob não serão usados;
- exceção limitada aos avisos conhecidos e à cadeia transitiva comprovadamente não alcançada;
- qualquer advisory novo, crítico ou fora da exceção continuará bloqueando o gate.

Não será adicionado outro motor de XLSX. Ferramentas complementares só serão incluídas quando tiverem função distinta e comprovadamente necessária.

## Testes e aceitação

- regressões de correspondência programa → conta;
- regressões de campos vazios intencionais;
- matriz de APTA, INAPTA, incompleta e não iniciada;
- igualdade literal dos 30 cabeçalhos;
- preservação de mesclagem, estilos, filtro, congelamento e impressão, sem `dataValidations`;
- round-trip de leitura e escrita pelo ExcelJS;
- inspeção do pacote OOXML;
- geração de artefato sintético para homologação;
- abertura obrigatória no Microsoft Excel desktop sem aviso de reparo.

## Fora do escopo

- alterar textos do modelo original;
- redesenhar o documento;
- preencher datas, parecer ou observações sem fonte no RADAR;
- modificar o relatório institucional ou o CSV;
- publicar em Production antes da homologação manual.
