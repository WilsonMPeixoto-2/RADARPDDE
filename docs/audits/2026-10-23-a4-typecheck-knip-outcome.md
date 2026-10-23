# RADAR PDDE 2026 — Experimento A4: adoção de capacidades TS7 e Knip

Data: 23/10/2026 (BRT). Baseline imutável: `main@78227c8744519d1357dc97d39207fe0b3b27b79c`.
Branch isolada: `experiment/capabilities-a4-ts-knip-20261023`.
Execução principal: [GitHub Actions 39901370296](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901370296).

## Objetivo de produto

Aproveitar capacidades das bibliotecas atualizadas quando elas possam detectar defeitos reais mais cedo ou reduzir esforço sem mudar o funcionamento do RADAR. Não criar recursos ou testes artificiais apenas para justificar o upgrade. Esta etapa faz diagnóstico de configuração e instrumentação; não muda o comportamento do usuário, dados, autenticação, RLS, RPC, migrações ou Production.

## Evidências de execução

- `TS7 - consumidor fiscal real e controle negativo`: **success** no runner Ubuntu 26.04 / Node 24, TypeScript **7.0.2**.
  - Arquivos contemplados pela configuração: `src/domain/operation-key.js` e seu consumidor real `src/application/invoice-service.js`, com resolução Node20/Node16, `allowJs/checkJs/noEmit`, `strict` e `noImplicitAny=false` delimitado ao experimento.
  - A fonte recebeu apenas comentários JSDoc para a assinatura `persistentId(prefix, operationKey)` e para a injeção da API no serviço, sem alterar a execução JavaScript.
  - O teste original de identidade `tests/unit/operation-key.test.js` passou e os dois arquivos preservaram sintaxe válida.
  - A baseline TypeScript sobre o serviço completo **retornou exit 1**: existem diagnósticos anteriores à mutação, inclusive inferências de argumentos `null | undefined` em helpers e erros em módulos dependentes. A saída parcial do job registrou pelo menos 39 linhas de diagnóstico; consultar o artifact completo para o inventário exato. **Não promover esta configuração a gate obrigatório e não silenciar os avisos em massa.**
  - A mutação temporária na chamada **real** `operationKey.persistentId('nota', key)` → `operationKey.persistentId(123, key)` produziu `TS2345` no serviço de despesas, linha 691 no experimento. A mutação foi revertida no runner; não integra a branch. Resultado: `A4_REAL_CONSUMER_MUTATION_DETECTED=true`.
- `Knip - reconciliacao e positivo controle`: **success**, versão **6.42.1**.
  - Diagnóstico ampliado: **34 files / 0 exports / 0 types** e reconciliação **34/34** com seis carregadores de módulos dinâmicos, **0 sem referência textual localizada**.
  - Controle positivo criado somente no runner: `__radar_a4_unused_positive_control.js` foi encontrado como **35º** candidato.
  - O script de classificação A4 removeu a asserção histórica de contagem exata 34; futuro crescimento do repositório não deve ser tratado como erro por si só.
  - As referências textuais não provam execução real de todos os caminhos. Os 34 não podem ser excluídos automaticamente.

## Decisões

1. **Capacidade TS7 comprovada em consumidor real, implantação geral NÃO aprovada.** A tentativa de inserir o serviço inteiro no `checkJs` produz diagnósticos preexistentes numerosos. Próximo passo é selecionar uma fronteira de dados menor, documentar parâmetros reais com JSDoc e tipar gradualmente sem introduzir `any` indiscriminado ou `@ts-ignore`.
2. **Knip diagnóstico pronto para uso opt-in na branch isolada**, não para limpar arquivos automaticamente. Preservar baseline e positivo controle e reavaliar candidatos futuros contra carregamentos dinâmicos.
3. **Não abrir PR grande nem integrar esta branch inteira à main.** Uma mudança de instrumentação futura deve nascer da `main`, incorporar seletivamente os arquivos validados e rodar testes proporcionais. A branch antiga `docs/audit-capacidades-pacotes-out2026` permanece arquivo de evidências da A0–A3.
4. **A5 futura e separada:** CI proporcional ao impacto do diff, exigindo antes leitura dos checks de proteção da `main`; a integração disponível retornou 403 para branch protection. Não remover workflows por conveniência.
5. Os pilotos A4 não são benchmark de desempenho do usuário. Lighthouse real e os diagnósticos Realtime dos PRs #446/#447 seguem em frente independente.

## Rastreabilidade

- [Run A4 principal](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901370296): 2 jobs concluídos com `success`.
- [Run A4 inicial](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901334707): falha de expressão `grep` no harness, embora o compilador já tivesse identificado `TS2345` real; corrigido no workflow do run principal. Não classificar como falha do produto.
- Evidência anterior [A2 TypeScript/Knip](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39887138715).
- Evidência anterior [A3 Axe WCAG 2.2](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39887802231), cuja divergência acessível motivou o PR #474, já integrado à main.
- Artefatos dos jobs A4 têm retenção de 7 dias. Este checkpoint preserva as descobertas relevantes.

**Estado final:** experimentos realizados; nenhum merge ou deployment, nenhuma integração permanente de TypeScript/Knip aprovada por esta prova.
