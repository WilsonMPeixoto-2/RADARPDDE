# Análise documental assistida — prova de conceito isolada

Esta demonstração mostra como comparar uma informação extraída de documento com
um pagamento e apresentar uma sugestão explicável para revisão humana. São cinco
notas e seis débitos **inteiramente sintéticos**, fora do runtime do RADAR.

Não há conexão com Microsoft, Supabase, modelo de IA ou OCR. As extrações são
simuladas; os textos de origem são fictícios e seus bytes são conferidos por
SHA-256. Nenhum dado institucional é usado como fixture. A demonstração não
registra Pendência, análise técnica, bonificação ou decisão administrativa.

## Experimentar

Na raiz do repositório, com Node 24:

```bash
node --test ops/document-intelligence-poc/reconcile.test.mjs
python3 -m http.server 8766 --bind 127.0.0.1 --directory ops/document-intelligence-poc
```

Abra `http://127.0.0.1:8766/`. A tela permite selecionar uma nota, examinar as
fontes fictícias e registrar uma revisão **somente na memória da página**.
Recarregar reinicia a demonstração. Não é necessário cadastrar conta ou senha.

Para entregar um único HTML com o mesmo motor, as fontes sintéticas e este método
incorporados, sem servidor ou arquivos auxiliares:

```bash
node ops/document-intelligence-poc/build-standalone.mjs /caminho/demonstracao.html
```

O teste `tests/e2e/document-intelligence-poc.spec.js` percorre as cinco situações,
confere a revisão em memória e anexa capturas de 1440 e 390 pixels ao relatório
Playwright já existente. Sua execução depende do Chromium homologado.

## O que está implementado

| Situação | Resultado da demonstração |
|---|---|
| Mesmo contexto, referência, beneficiário, moeda e valor | Correspondência a conferir |
| Mesma referência e beneficiário, valor diferente | Diferença de valores para revisão |
| Mais de um débito possível, ou um débito disputado por duas notas | Correspondência ambígua |
| Apenas o valor coincide | Sem correspondência suficiente |
| Extração incerta, contexto sem confirmação, fonte incompleta ou inferência de IA | Revisão documental necessária |
| Bytes/versão de uma fonte mudam | Sugestão anterior não pode ser confirmada |

O valor monetário usa centavos inteiros e entrada decimal explícita. O motor não
arredonda para fabricar igualdade e não escolhe automaticamente a primeira
correspondência. Diferenças podem decorrer de retenções, tarifas, descontos,
pagamentos parciais ou de classificação — não demonstram irregularidade.

O limiar de confiança `0,90` é **apenas um parâmetro ilustrativo**, sem calibração
institucional. Mesmo uma correspondência compatível requer revisão. A confiança
de extração não mede regularidade jurídica nem comprova a autenticidade da nota.

## Limites e continuidade

- A POC verifica a integridade dos documentos de texto sintéticos, não autenticidade fiscal.
- Pagamentos agrupados, parcelas, retenções e documentos sem referência explícita ficam para uma etapa posterior; não há pareamento aproximado oculto.
- A identidade do revisor é fictícia. Uma integração real precisaria de Auth, capacidades do perfil, versão esperada e comando canônico do RADAR.
- A fonte futura deve ser identificada por `driveId`/`itemId`, versão, hash e página/trecho. URLs temporárias de download não são identidade persistente.
- T5 conserva seu escopo aprovado de histórico granular. Esta POC não implementa T5 nem adiciona uma fonte paralela de dados de negócio.

O [estudo de viabilidade](../../docs/research/2026-11-25-inteligencia-operacional-documental.md)
define arquitetura progressiva, dependências e oportunidades. O
`operational-indicators.sql` contém consultas agregadas somente de leitura para
reproduzir a análise; não contém dados nem credenciais institucionais e não é
executado pela demonstração.
