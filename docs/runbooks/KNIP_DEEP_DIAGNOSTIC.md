# Knip profundo: diagnóstico de arquivos, exports e tipos

**Estado:** comando adicional, opcional e **não bloqueante**, sem alterações de runtime, regras ou arquivos do produto.

## Por que existe

O comando atual `npm run analyze:unused` procura inconsistências de dependências, pacotes não listados e imports não resolvidos. A execução profunda complementa esse recorte, sinalizando também possíveis arquivos, exports e tipos não usados.

A aplicação usa scripts IIFE e carregamento dinâmico no navegador: um candidato apontado pela análise estática **não é automaticamente código morto**. Apagar arquivos a partir desse relatório pode quebrar fluxos reais de usuários.

## Uso

```bash
npm ci
npm run analyze:unused:deep
```

A primeira etapa executa o Knip com `files,exports,types` e escreve `artifacts/tooling/knip-deep-diagnostic.json`. A segunda etapa lê exatamente esse resultado, verifica referências textuais nos carregadores dinâmicos conhecidos e escreve `artifacts/tooling/knip-dynamic-classification.json`. Esses caminhos são diagnósticos locais, não arquivos a versionar.

As categorias são:

- **Referenciado por loader:** foi localizada uma referência textual; ainda requer confirmação funcional quando uma mudança afetar seu uso.
- **Sem referência localizada:** candidato à investigação manual; **não** equivale a autorização para excluir.
- **Erro na própria ferramenta:** execução/fonte inválida; corrigir o diagnóstico, não o produto.

Nunca remover arquivos automaticamente. O flag `RADAR_REQUIRE_ALL_KNIP_REFERENCED=1` serve apenas para triagem específica, faz o verificador falhar se algum candidato não tiver referência entre os carregadores conhecidos e **não** deve ser usado como gate regular sem analisar novas formas de carregamento.

## Prova registrada

Em 23/10/2026, a [execução A4](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39901370296) identificou 34 candidatos, 34 referências entre seis carregadores e nenhum candidato sem referência identificada. Um arquivo artificialmente órfão, criado e removido pelo runner, foi encontrado como 35º candidato. Essa contagem histórica **não** está embutida no novo comando: o número de arquivos pode variar sem ser automaticamente um defeito.

A4 também provou que TypeScript 7 pode identificar erro de argumento numa chamada real do serviço de despesas, mas a configuração ampla apresentou diagnósticos históricos e **não** foi promovida a gate. Ver [registro técnico A4](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/experiment/capabilities-a4-ts-knip-20261023/docs/audits/2026-10-23-a4-typecheck-knip-outcome.md) na branch experimental `experiment/capabilities-a4-ts-knip-20261023` (não confundir com documentação já integrada).

## Critério para promoção

Manter este comando opcional. Somente transformá-lo em política bloqueante quando a cobertura dos carregadores dinâmicos estiver comprovada, existir revisão explícita dos falsos positivos e o custo de CI tiver sido considerado. O ganho pretendido é identificar oportunidades reais de manutenção sem regressões.
