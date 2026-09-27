# Fase C3 — correções da revisão CodeQL

**Classe documental:** Evidência técnica da entrega  
**Data:** 27 de setembro de 2026  
**PR:** [#386](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/386)  
**Head anterior:** `25f0ef4ed5b08a890e1d073585dc7f968ef1c865`  
**Base:** `0af1c5a81536f68b848a7194f72071c1e7e9ad2f`

## Diagnóstico

Os 17 workflows verdes do head anterior não eliminavam os dois alertas da revisão:

1. [Alerta 10](https://github.com/WilsonMPeixoto-2/RADARPDDE/security/code-scanning/10), `js/file-system-race`: `stat(path)` seguido de `readFile(path)` reabria o caminho. Uma troca real por rename entre as chamadas fez o HTTP entregar o conteúdo substituído.
2. [Alerta 9](https://github.com/WilsonMPeixoto-2/RADARPDDE/security/code-scanning/9), `js/stack-trace-exposure`: a resposta usava `error.message`. Um pathname malformado expunha `URI malformed`; mensagens de filesystem também poderiam revelar caminhos internos.

A reprodução de erro EIO revelou ainda `ERR_HTTP_HEADERS_SENT`, pois o código enviava 200 antes da leitura e tentava enviar 500 após a falha.

## Correção

- Abrir o arquivo uma única vez com `fs.open`.
- Verificar com `FileHandle.stat` e ler com `FileHandle.readFile` pelo mesmo descritor.
- Fechar em `finally`, inclusive em HEAD, diretório e erro.
- Concluir leitura/fechamento antes do envio dos headers 200.
- Preservar 404 para ENOENT/ENOTDIR e diretórios; falhas inesperadas recebem 500 com corpo fixo `Internal Server Error`.
- Preservar rotas SPA, assets profundos, MIME, no-store e configuração de raiz/porta.

Isso resolve a troca do pathname entre verificação e leitura. Não promete snapshot contra escrita concorrente no mesmo inode nem transforma o servidor local/CI em um sandbox para conteúdo não confiável.

## Prova RED → GREEN

Node 24.19.0 / npm 11.9.0, instalação com `npm ci --ignore-scripts`.

Antes da correção: cinco testes do servidor, dois aprovados e três reprovados. Falhas observadas: conteúdo substituído, erro de headers após EIO e mensagem interna na resposta.

Depois: cinco testes aprovados. Os testes exercitam HTTP real, rename real, injeção controlada de EIO, fechamento do descritor, HEAD, diretório, pathname inválido e atendimento da próxima requisição após erro.

`npm run test:readiness`: aprovado, incluindo **1.140 unitários e oito integrações**, contratos, lint, arquitetura, certificação Excel, tipos, runtime config e artefatos gerados.

## Validação remota e fechamento

Os resultados do novo SHA, respostas aos dois comentários CodeQL, resolução das threads, merge, deployment READY e smoke são registrados incrementalmente no PR #386. Este arquivo registra as provas locais, sem atribuir antecipadamente ao novo SHA os 17 verdes do head anterior.

A/B estão concluídas (#378); C1 (#384) e C2 (#385) estão concluídas. O fechamento operacional de C3 encerra a Fase C. Nenhuma alteração funcional ou visual e nenhuma atualização de dependência integra esta correção adicional.

## Referências primárias

- [Node.js: FileHandle](https://nodejs.org/docs/latest-v24.x/api/fs.html#class-filehandle)
- [CodeQL: file system race](https://codeql.github.com/codeql-query-help/javascript/js-file-system-race/)
- [CodeQL: stack trace exposure](https://codeql.github.com/codeql-query-help/javascript/js-stack-trace-exposure/)
