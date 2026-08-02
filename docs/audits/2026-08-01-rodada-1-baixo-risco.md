# Rodada 1 — atualizações técnicas de baixo risco

**Data:** 1º de agosto de 2026  
**Branch principal da rodada:** `chore/rodada-1-baixo-risco-20260801`  
**Base:** `main` após a Rodada 0  
**Escopo:** ferramentas de desenvolvimento, auditoria e integração contínua

## Objetivo

Atualizar componentes técnicos de baixo risco sem realizar trocas meramente burocráticas de versão. Cada atualização foi examinada quanto a recursos novos ou capacidades já disponíveis que pudessem ser incorporadas de forma útil ao RADAR PDDE.

## Atualizações

| Componente | Antes | Depois | Integração pertinente |
|---|---:|---:|---|
| ESLint | 10.7.0 | 10.8.0 | geração de relatório HTML navegável do lint de segurança, incluído nas evidências de saúde das dependências |
| Acorn | 8.17.0 | 8.18.0 | validação sintática dos handlers inline, com arquivo, linha e coluna do markup e uso controlado de `startLocation` |
| actions/checkout | 7.0.0 | 7.0.1 | atualização uniforme dos workflows, mantendo SHA completo e configuração restritiva; executada em PR próprio após esta etapa de pacotes |

O `package-lock.json` foi regenerado pelo npm 11.16.0 em runner oficial com Node.js 24.18.0.

## Integração do ESLint

Foi adicionado o comando:

```text
npm run lint:security:html
```

O comando mantém o mesmo escopo e o mesmo limite de alertas do lint bloqueante, mas produz `dependency-health/eslint-security.html`. O workflow de saúde das dependências passa a gerar e publicar esse relatório junto ao SBOM, árvore npm, auditoria de vulnerabilidades, assinaturas, proveniência e inventário Knip.

O relatório facilita a inspeção humana por arquivo, regra, linha e severidade sem reduzir a proteção existente.

## Integração do Acorn

A auditoria funcional passou a analisar também JavaScript presente em atributos de evento, como `onclick`, `onchange`, `onsubmit` e equivalentes.

O controle:

- identifica handlers que continuam dependendo de funções globais;
- valida a sintaxe do JavaScript inline;
- registra arquivo, linha e coluna reais do markup;
- usa `parseExpressionAt` com `startLocation` somente para expressões;
- aceita comandos válidos, como blocos iniciados por `if`;
- interpreta escapes estáticos de templates JavaScript antes de analisar o HTML que será produzido;
- ignora expressões dinâmicas com interpolação, evitando falsos positivos.

Erros sintáticos encontrados passam a integrar os achados bloqueantes da auditoria funcional.

## Desenvolvimento orientado por testes

A implementação foi conduzida por regressões demonstráveis:

1. o teste inicial falhou porque `inspectInlineHandlers` ainda não existia;
2. após a implementação, foram detectados dois casos de borda:
   - comando de controle válido tratado incorretamente como expressão;
   - aspas escapadas em HTML construído por template JavaScript;
3. testes específicos foram adicionados antes das correções;
4. a versão corrigida aprovou os cinco testes contratuais e a auditoria integral dos arquivos JavaScript do projeto.

## Segurança e compatibilidade

- nenhuma dependência de runtime foi adicionada;
- nenhuma regra do ESLint foi relaxada;
- o limite de alertas existente foi preservado;
- o Acorn continua restrito a ferramentas de auditoria;
- nenhum handler ou comportamento da interface foi alterado;
- nenhuma migration, RLS, Auth, dado, Edge Function ou Storage foi alterado;
- nenhuma configuração do Supabase ou Vercel Production foi modificada;
- ExcelJS e o gerador Excel SME permaneceram congelados.

## Sequência da atualização do checkout

A atualização do `actions/checkout` permanece na mesma Rodada 1, mas em PR próprio. Essa separação é necessária porque a atualização modifica todos os workflows e merece diff e validação próprios. O PR antigo do Dependabot deverá ser atualizado sobre a `main` resultante desta etapa e submetido novamente a todos os gates.

## Critérios de encerramento

A Rodada 1 somente estará concluída quando:

1. ESLint e Acorn estiverem integrados à `main` com lockfile reproduzível;
2. o relatório HTML do ESLint estiver publicado pelo workflow de saúde;
3. a auditoria de handlers inline estiver bloqueante e sem falsos positivos conhecidos;
4. o `actions/checkout` 7.0.1 estiver aplicado uniformemente aos workflows;
5. todos os gates aplicáveis estiverem aprovados;
6. os PRs antigos de ESLint e Acorn forem encerrados como substituídos.
