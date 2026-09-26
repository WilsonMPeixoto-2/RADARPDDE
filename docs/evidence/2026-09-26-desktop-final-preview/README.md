# Preview desktop final — candidato único #376

**Data:** 26/09/2026  
**Estado:** deployment técnico READY; homologação visual/navegada ainda pendente.

## Produto

- PR candidato: #376
- base: `main`
- head de produto: `8d44b1d18f96b1dddb96f1d92af2cd816587e759`
- runtime funcional/UI: `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`
- Production permanece em `bb7246438b8c6b72ef068b21bb40d492a7049af2`

## Preview

Branch:
`preview/desktop-final-2026-09-26`

A branch difere do candidato somente em `vercel.json`.

### Tentativa 1

- commit: `795a8cac4767b2794836722ee35ac44545ea6773`
- deployment: `dpl_4wFGj3QbqQRwuFdKXCNhCJL9qjaJ`
- estado: ERROR
- causa: os testes unitários main-only detectaram corretamente a habilitação temporária da branch Preview.

### Preview válido

- commit efêmero: `9aa59f5a0fea47bbb03036dfa6eda0ee001eac15`
- mensagem: `chore(preview): separar build efêmero dos gates da política main-only`
- deployment: `dpl_EcLDqaAPe7aWo5dwNyR6G3TuwQSy`
- estado: READY
- URL: `https://radarpdde-4ja1codbg-wilson-m-peixotos-projects.vercel.app`

A exceção de build existe somente na branch efêmera. Os guardrails/testes/configuração do candidato de produto permanecem intactos.

## CI do candidato

No head `8d44b1d1...`, os sete workflows relevantes estão em success:

- Playwright
- validação geral
- snapshot
- retificação
- Lighthouse
- Supabase readiness
- Excel SME

## Limite desta evidência

READY não equivale a homologação visual.

Ainda é necessário navegar este Preview e registrar evidência do mesmo runtime para filtro escolar, URL/retorno do Prontuário, identificação, contenção da ação longa, feedback com drawer e reanálise.

Não reutilizar screenshots de Previews anteriores como prova desse deployment.
