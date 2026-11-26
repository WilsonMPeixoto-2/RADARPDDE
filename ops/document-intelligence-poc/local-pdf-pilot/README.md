# Piloto local de extração documental

Este piloto separado lê PDFs reais **fornecidos por caminhos locais explícitos**.
Ele não modifica a demonstração sintética da pasta superior nem integra o runtime
do RADAR. Não acessa rede, Microsoft 365 ou banco e não registra análise, bem,
Pendência, bonificação ou conclusão administrativa.

## Escopo comprovável

O extrator usa PyMuPDF para a camada de texto nativa e pypdf para inspecionar
campos `/Sig`. O motor Node reconhece apenas os três modelos abaixo:

| Modelo | Campos candidatos e limites |
|---|---|
| Termo de compromisso da Solução BB Gestão Ágil | Instituição, CNPJ e período explícito; exercício deriva do período, não de uma referência legal ou data de upload |
| Relação de bens adquiridos ou produzidos | Instituição, CNPJ, programa/exercício, linhas de itens e total declarado |
| Termo de doação | Instituição, programa/exercício, linhas de itens e total; CNPJ ausente continua ausente |

Não é um parser genérico de notas fiscais, extratos bancários ou documentos
digitalizados. Não há OCR nem score de confiança. Layouts diferentes, colunas
quebradas, múltiplas identidades ou campos sem leitura suficiente exigem revisão.
Cada valor candidato referencia documento, página, linha e trecho da camada de
texto; sua presença não comprova regularidade ou autenticidade.

## Executar sem publicar os documentos

Requisitos: Node 24, Python com PyMuPDF e pypdf. As versões usadas ficam no
manifesto; não são instaladas ou atualizadas por este piloto. Use um diretório
privado **fora do repositório** para PDFs, manifesto e análise.

```bash
python3 ops/document-intelligence-poc/local-pdf-pilot/extract_pdf.py \
  --output /caminho/privado/extraction-manifest.json \
  /caminho/privado/documento-1.pdf \
  /caminho/privado/documento-2.pdf \
  /caminho/privado/documento-3.pdf

node ops/document-intelligence-poc/local-pdf-pilot/run.mjs \
  --manifest /caminho/privado/extraction-manifest.json \
  --output /caminho/privado/document-analysis.json \
  --target-exercise 2026

node --test tests/unit/local-document-pilot.test.js
python3 -B tests/unit/local-document-extractor.test.py
```

Os arquivos JSON contêm textos, identificadores e caminhos de origem. Não devem
ser adicionados ao Git, a artefatos públicos ou à demonstração HTML. Os CLIs
recusam gravar seus resultados dentro do repositório, usam permissão `0600` e
imprimem apenas contagens e duração quando concluem. Em falhas, encerram com
código `1` e mensagem JSON sanitizada, sem traceback, caminhos, argumentos ou
trechos dos documentos. Diagnósticos das bibliotecas de PDF não são enviados
ao terminal. Os testes versionados contêm somente textos e identidades
fictícios, explicitamente sintéticos.

## Rastreabilidade e revisão

- O manifesto registra SHA-256 dos bytes do PDF, SHA-256 do texto UTF-8 de cada
  página e SHA-256 dos textos unidos por `\f`, sem normalização. A versão local
  de origem é `sha256:<hash>`; isso não substitui uma futura versão do provedor.
- O CLI confere os bytes atuais dos PDFs antes de analisar. `--previous-result`
  também recusa análise antiga quando PDF, texto, versão da origem, versão do
  extrator ou regra mudaram. O manifesto é uma saída local confiada ao extrator,
  não uma atestação criptográfica de que seus metadados nunca foram editados.
- O exercício é extraído do conteúdo apropriado ao modelo. O alvo precisa ser
  explícito. Incompatibilidade entre exercícios aparece nos documentos e no par;
  data de upload não preenche nem substitui o exercício do documento.
- `/Sig` e marcadores textuais são fatos independentes. A assinatura pode existir
  como campo/aparência sem aparecer no texto extraído. Presença de `/Sig`, `/V`
  ou `/ByteRange` não valida criptografia, certificado, signatário ou aparência.
  Esta última precisa ser conferida visualmente; o parser não declara ausência
  de assinatura a partir da ausência de texto. CNPJ é transcrito, sem consulta
  cadastral ou atribuição automática a escola.
  Campo `/Sig` com `/V null` continua identificado como campo presente, sem
  valor de assinatura nem `/ByteRange` confirmado.

## Itens, linhas-modelo e comparação

As linhas-modelo só são ignoradas quando **todos** os indicadores conhecidos
coincidem: campos zerados, quantidade zero, valores `-` e data `00/01/1900`.
Elas permanecem identificadas na evidência. Uma linha preenchida com essa data,
`31/02` ou outro calendário impossível é rejeitada; não há conversão automática
para outro dia e ela não vira um item candidato válido.

Valores são centavos inteiros; quantidade, valor unitário e total da linha são
conferidos, assim como a soma e o total declarado. O modelo reconhece apenas
quantidades inteiras positivas; outros formatos precisam de revisão.
O limite de representação é `Number.MAX_SAFE_INTEGER` centavos. A soma usa
inteiros exatos; valor declarado ou soma além desse limite gera motivo de
revisão e impede declarar a tabela completa, sem produzir total arredondado.

Relação e doação são candidatas a comparação quando instituição normalizada,
programa e exercício explícitos concordam, e CNPJs presentes não divergem. Um
CNPJ ausente não é herdado; CNPJ ambíguo impede pareamento compatível. A comparação de linhas exige número da nota, data,
descrição e quantidade; só então compara valores. Valor igual isolado não cria
correspondência. Múltiplas linhas ou documentos candidatos permanecem ambíguos,
inclusive quando duas relações apontam para uma única doação.

Dois documentos com dois itens correspondentes produzem **dois pares de
evidências**, sem afirmar quatro compras, sem deduplicar compras por valor e sem
criar bens. O resultado conserva `purchaseCount: null`, revisão humana
obrigatória, nenhuma importação e nenhuma conclusão administrativa. Mesmo um
par com campos compatíveis pode pertencer a exercício diferente do alvo.

## Medições e fronteira

O manifesto registra tempo de extração e versões Python/PyMuPDF/pypdf; a análise
registra Node e tempo de verificação de bytes mais regras. São tempos daquela
execução local, sem comparação de produtividade humana, performance de produção
ou precisão estatística. Acurácia deve ser conferida por campo e por página.
Resultado sem texto nativo ou modelo reconhecido permanece fora da cobertura.

O teste sintético cobre alteração de bytes/versões/texto, exercício versus
upload, calendário inválido, linhas-modelo, valores divergentes, igualdade
monetária insuficiente, correspondências múltiplas, âncoras e `/Sig` sem texto.
As contraprovas também cobrem `/V null`, CNPJ ambíguo, ambiguidade nas duas
direções entre documentos, limite de centavos e erros de CLI sem dados privados.
Não inclui nenhuma conexão com as autoridades de persistência do RADAR.


## Conferência privada no navegador

Abra `review.html` diretamente como arquivo local (não publique relatórios ou
PDFs em um servidor). Selecione o `document-analysis.json` produzido pelo CLI
acima. A tela mostra candidatos, trechos de página/linha, ambiguidades, itens e
pares, e permite comparar CNPJ/exercício com os dados **informados pelo
analista** a partir do RADAR. Não consulta o cadastro. Selecione o PDF original
para comparar seu SHA-256 com a referência no relatório; abra-o separadamente
no leitor local para verificar o conteúdo. O hash não autentica o relatório nem
a assinatura. Não há visualização/execução do PDF dentro desta página.

A página é autossuficiente, sem dependências, requisições de rede, armazenamento
persistente ou ações de negócio. Todos os campos do relatório são dados não
confiáveis, exibidos como texto. Uma política CSP impede conexões e recursos
externos. Limpar, trocar o relatório ou recarregar descarta o estado; mudar o
documento exige conferir novamente o original. Limites do primeiro incremento:
relatório de até 5 MB, 12 documentos e 300 itens por documento, PDF de até 25 MB,
regra `local-document-pilot/2` e navegador com Web Crypto. O teste usa apenas
fontes sintéticas, incluindo bytes fictícios que exercitam a comparação de hash;
não certifica parsing adicional ou assinaturas. Nenhum arquivo real entra no Git.

Esta é uma etapa de revisão assistida do piloto privado, não uma superfície
autenticada do produto nem conciliação direta com a base institucional. A
integração de leitura com o contexto ativo do RADAR deverá ser avaliada em
incremento separado, sem ampliar as permissões. Não crie novos registros nem
confirme uma decisão administrativa por esta página.
