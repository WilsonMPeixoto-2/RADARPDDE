# Rodada 4A — Reconciliação canônica do roadmap de atualizações

**Data:** 3 de agosto de 2026  
**Status:** aprovado para implementação  
**Escopo:** exclusivamente documental

## 1. Contexto

O RADAR PDDE possuía duas avaliações complementares:

1. manutenção técnica, dependências, segurança, CI e qualidade de desenvolvimento;
2. modernização da experiência e evolução funcional do produto.

As Rodadas 0, 1, 2 e 3B executaram partes relevantes dessas avaliações, mas o estado consolidado não foi incorporado aos documentos canônicos. `docs/CURRENT_STAGE.md`, `docs/README.md`, `docs/DECISION_LOG.md`, `AGENTS.md` e a matriz de validade documental ainda descrevem principalmente o estágio anterior às rodadas.

A ausência de uma visão única permitiu que uma atualização isolada, como Playwright, fosse interpretada como a próxima etapa integral, apesar de existirem frentes técnicas e funcionais ainda pendentes.

## 2. Objetivo

Criar uma fonte canônica única para as atualizações de 2026, capaz de informar:

- o que foi concluído;
- o que foi parcialmente concluído;
- o que foi adiado;
- o que permanece pendente;
- o que depende de avaliação ou decisão;
- a prioridade e as dependências entre etapas;
- o impacto esperado em Vercel Production e Supabase Production;
- as evidências, PRs e commits correspondentes.

## 3. Documento canônico

Será criado:

```text
docs/ROADMAP_ATUALIZACOES_2026.md
```

O documento será classificado como **Canônico** e passará a integrar a ordem de leitura obrigatória do projeto.

## 4. Taxonomia de status

Cada item do roadmap usará uma das classificações abaixo:

| Status | Significado |
|---|---|
| **Concluído** | implementação integrada e validada |
| **Concluído e publicado** | implementação integrada, validada e presente em Production |
| **Parcialmente concluído** | parte do objetivo foi entregue; o restante permanece explícito |
| **Adiado** | decisão consciente de postergar após análise |
| **Pendente de execução** | escopo já reconhecido como pertinente, ainda não implementado |
| **Pendente de avaliação** | candidato que exige diagnóstico e decisão antes de virar tarefa |
| **Mantido/congelado** | versão ou arquitetura preservada deliberadamente |
| **Não aplicável agora** | não recomendado no estágio atual |

## 5. Prioridade

| Prioridade | Uso |
|---|---|
| **P0** | correção ou pré-condição que bloqueia trabalho confiável |
| **P1** | próxima frente recomendada ou ganho alto e maduro |
| **P2** | melhoria relevante, dependente de diagnóstico ou etapa anterior |
| **P3** | evolução condicional, experimental ou de menor urgência |

Prioridade não autoriza implementação automática. Cada nova frente continua sujeita a escopo, design, testes e aprovação aplicáveis.

## 6. Classificação de implantação

Cada item indicará uma destas classes:

- **Interna:** ferramenta, CI, teste ou documentação; não exige deployment do site;
- **Vercel:** altera recursos servidos pelo frontend e exige publicação controlada;
- **Supabase:** altera schema, políticas, funções, dados ou configuração remota;
- **Vercel + Supabase:** exige coordenação das duas camadas;
- **Nenhuma:** decisão, diagnóstico ou preservação sem implantação.

Mudança integrada à `main` não será descrita automaticamente como presente em Production.

## 7. Regra de evolução tecnológica proativa

Além das rodadas específicas de atualização, toda correção, melhoria, alteração de layout ou nova capacidade deve incluir uma avaliação de adequação tecnológica.

Quando a solução puder ser materialmente melhor com nova biblioteca, atualização, capacidade nativa moderna ou ampliação arquitetural, o agente deve apresentar a proposta antes de ficar limitado pela implementação atual.

A avaliação deve ocorrer especialmente quando:

- a tecnologia atual impõe limite perceptível de qualidade, acessibilidade, desempenho, segurança ou manutenção;
- a correção possível é apenas paliativa, enquanto existe solução estrutural madura;
- a tarefa pede comportamento já resolvido por componente especializado confiável;
- o erro ou a queixa decorre de limitações da arquitetura ou dos pacotes existentes;
- uma nova capacidade do produto pode ser entregue com maior robustez por atualização ou instalação pertinente.

A proposta deve informar:

1. problema ou limite observado;
2. alternativa tecnológica sugerida;
3. ganho concreto para o usuário e para o projeto;
4. custo, risco e manutenção adicional;
5. impacto no bundle, dados, permissões e Production;
6. alternativa sem nova dependência;
7. testes, rollback e evidências necessários.

Essa regra não autoriza instalar pacotes por conveniência nem ampliar escopo silenciosamente. A solução existente continua preferível quando produz resultado equivalente com menor custo. A proposta de tecnologia é obrigatória quando o ganho for material; a instalação continua dependente de decisão e execução controlada.

## 8. Documentos alterados

- criar `docs/ROADMAP_ATUALIZACOES_2026.md`;
- atualizar `docs/CURRENT_STAGE.md`;
- atualizar `docs/DECISION_LOG.md`;
- atualizar `docs/README.md`;
- atualizar `docs/reference/STATUS_DOCUMENTOS.md`;
- atualizar `AGENTS.md`;
- criar plano e auditoria da Rodada 4A.

## 9. Limites

A Rodada 4A não pode:

- alterar `package.json` ou `package-lock.json`;
- instalar ou atualizar pacotes;
- modificar HTML, CSS ou JavaScript funcional;
- alterar migrations, schema, dados, Auth, RLS ou Edge Functions;
- habilitar deployment automático;
- publicar Vercel Production;
- executar operação no Supabase Production;
- declarar candidatos funcionais como aprovados sem decisão posterior.

## 10. Critérios de aceitação

1. as duas listas originais aparecem integralmente reconciliadas;
2. cada item possui status, prioridade, implantação e próxima decisão;
3. Rodadas 0, 1, 2 e 3B possuem referências verificáveis;
4. `CURRENT_STAGE.md` reflete o estado posterior à Rodada 3B;
5. a nova regra tecnológica consta em decisão duradoura e em instrução operacional;
6. o novo roadmap consta da ordem de leitura e da matriz de validade;
7. nenhum arquivo funcional ou de Production é alterado;
8. o diff final não contém contradições, placeholders ou estados obsoletos conhecidos.
