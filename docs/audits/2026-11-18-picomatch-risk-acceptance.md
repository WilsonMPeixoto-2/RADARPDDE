# Aceitação restrita de risco — picomatch / GHSA-FC5Q-39XC-VJPF

**Decisão:** 18/11/2026. **Revisão obrigatória:** até 18/12/2026, 23:59:59 UTC. **Condição:** apenas sete ocorrências de um único advisory, na árvore de desenvolvimento. Não declara a vulnerabilidade corrigida.

## Evidência factual

- Execuções GitHub Actions antes da alteração: 7 ocorrências altas e 0 críticas, agrupadas em um advisory ReDoS: GHSA-FC5Q-39XC-VJPF / CVE-2026-112366, envolvendo dependency-cruiser, fdir, knip, picomatch, stylelint, stylelint-config-recommended e tinyglobby.
- `npm audit --omit=dev --json`: 0 vulnerabilidades; apenas `exceljs` é dependência declarada de runtime em `package.json`.
- A vulnerabilidade já existia no `main@58ca0c0a507fb42ee512ace95ab766edaa1f2243` e não foi criada pelo PR #531.
- `picomatch@4.0.7` era a última versão identificada na auditoria; não se afirma que a correção upstream já exista.
- Vetor: ReDoS no processamento de padrões glob especialmente preparados, com possível impacto de disponibilidade em processos de tooling. Exposição do website publicado é considerada baixa **apenas enquanto o pacote não entrar no grafo de produção**. Ataques no CI, especialmente se forem processados padrões controlados por terceiros, permanecem hipótese de risco residual.

## Controles obrigatórios e não dispensados

1. A exceção é limitada ao advisory `GHSA-FC5Q-39XC-VJPF` e aos sete pacotes nomeados. A lista de raízes diretas também é fechada: `dependency-cruiser`, `knip`, `stylelint` e `stylelint-config-recommended`.
2. Cada ocorrência deve estar marcada `dev: true` no lockfile; caso apareça pacote fora da árvore de desenvolvimento, a auditoria falha com `DEV_ONLY_SCOPE_VIOLATION`.
3. O script existente preserva `npm audit --omit=dev --audit-level=high`, os controles de identidade do bundle ExcelJS e as proibições de capacidades não utilizadas no browser.
4. Vulnerabilidade crítica, advisory novo, aumento de efeitos para dependências desconhecidas, mudança para dependência direta não autorizada ou inconsistência dos metadados continuam bloqueantes.
5. A exceção expira automaticamente em 18/12/2026. A auditoria completa `npm audit --json` continua a registrar as sete ocorrências; **não** substituir o relatório corrente pelo arquivo histórico versionado, que pode estar defasado.
6. Reavaliar quando houver patch oficial comprovado ou alteração das condições de exposição, substituindo a exceção por dependências corrigidas após testes reproduzíveis.

## Homologação

Antes do ajuste: `npm run audit:exceljs-policy` falhava em CI nos três checks associados à auditoria por `NEW_ADVISORY` (não por falha funcional do RADAR).

Contraprova isolada: 19 testes da política, inclusive seis testes novos de limites de risco, passaram; `npm audit --omit=dev`: zero; `npm run test:readiness`: 1404 unitários e 8 integrações sem falhas; `npm run build:vercel`: aprovado. A liberação exige ainda CI completa do HEAD integrado.

## Escopo da decisão

Este registro **não autoriza** o bypass de outros gates, alterações de RLS, autenticação, migrations de produção ou operação em dados institucionais. O objetivo é não impedir uma atualização de ferramenta já homologada por um alerta pré-existente, restrito ao ambiente de desenvolvimento. Ver [issue #528](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/528) e [PR #531](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/531).
