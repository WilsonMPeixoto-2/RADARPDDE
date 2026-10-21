# dependency-cruiser 18.7.0 — candidato isolado, 21/10/2026

Classe: evidência datada de manutenção de tooling; não altera contrato funcional.
Base: `855fa0d71322dd133dd9f41ddbf36daba10d513c` (main após #464).

## Escopo e justificativa

Atualização 18.5.0 → 18.7.0, release oficial de 19/10:
https://github.com/sverweij/dependency-cruiser/releases/tag/v18.7.0.
O npm confirmou latest 18.7.0 e engines `^22||^24||>=26`, compatíveis com Node 24.
Corrige análise de peerDependenciesMeta e precisão de mensagens/resolução;
não representa melhoria de runtime ou fluidez do RADAR. Substitui a proposta
intermediária 18.6.0 do #458 se e quando este candidato for integrado.

Somente manifest/lock e esta evidência. Lock: versão da ferramenta e ignore
7.0.11 → 7.0.12; acorn 8.18.0 nested removido por deduplicação para o 8.19.0
já existente na raiz. Nenhum outro nó mudou. A primeira geração pelo npm
removeu metadados libc de pacotes opcionais não relacionados e reordenou o
manifest; essas mudanças incidentais foram rejeitadas, preservando o baseline.
`npm ci` foi repetido sobre o lock corrigido e terminou com sucesso.

## Prova local

Ambiente Linux, Node 24.19.0 e npm 11.9.0, instalação limpa.

- `check:architecture` antes/depois: sem violações, **191 módulos e 276 dependências**.
- As quatro regras de arquitetura e o arquivo de configuração não foram alterados.
- Unitários JUnit: **1.368 aprovados, zero falhas/ignorados**.
- Integração: **8/8**, zero falhas/ignorados.
- `check:generated`, `typecheck:database` e `git diff --check` aprovados.
- Audit runtime: zero vulnerabilidades; relatório completo continua sujeito à
  política estrita existente para o advisory de desenvolvimento braces/Stylelint.

Não adicionar regras ignoradas, mudar produto nem reduzir severidade para aceitar
a ferramenta. Readiness e pré-production já executam `check:architecture` via
`test:readiness`; não foi criado workflow adicional.

## Limites e continuidade

Estes resultados locais não substituem a CI do HEAD final. Aguardar os gates
aplicáveis antes de merge; registrar o SHA e os runs na descrição do PR.
Nenhuma migration, Auth/RLS, Supabase CLI, Edge Function, CSS ou serviço de
aplicação mudou. O pacote é exclusivamente de desenvolvimento.
