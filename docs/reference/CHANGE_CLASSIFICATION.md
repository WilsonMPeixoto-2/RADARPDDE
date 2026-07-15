# Classificação de mudanças do RADAR PDDE

## Regra geral

Nenhum achado entra no backlog sem código, evidência e conduta. A classificação descreve o estado do elemento analisado; não substitui prioridade, impacto ou esforço.

## `CP` — Correto e protegido

- **Definição:** comportamento coerente com regras, testes e finalidade real.
- **Evidência mínima:** teste, fluxo executado e fonte documental compatíveis.
- **Conduta permitida:** preservar; ampliar teste apenas quando a proteção for insuficiente.
- **Conduta proibida:** substituir por preferência técnica ou estética.
- **Exemplo:** independência entre bonificação, análise técnica e pendência.

## `ID` — Intencional e deliberado

- **Definição:** comportamento cuja forma atual deriva de decisão expressa, ainda que pareça incomum fora do contexto institucional.
- **Evidência mínima:** fonte canônica ou confirmação expressa.
- **Conduta permitida:** documentar, proteger e indicar a razão.
- **Conduta proibida:** reinterpretar como defeito sem nova autoridade.
- **Exemplo:** inexistência do estado canônico `Vencida`.

## `FA` — Funcional e aprimorável

- **Definição:** solução correta que entrega a tarefa, mas possui ganho demonstrável de clareza, produtividade, acessibilidade, desempenho ou manutenção.
- **Evidência mínima:** fluxo atual observado e consequência concreta da limitação.
- **Conduta permitida:** propor alternativas, resultado esperado e preservações.
- **Conduta proibida:** usar rótulos vagos de modernização ou experiência sem evidência.
- **Exemplo:** tabela desktop da Carteira é completa, porém demanda estudo de densidade e personalização.

## `IC` — Inconsistente ou duplicado

- **Definição:** capacidades equivalentes possuem contratos, estilos ou implementações concorrentes.
- **Evidência mínima:** duas ou mais implementações mapeadas, com diferença de comportamento ou precedência.
- **Conduta permitida:** consolidar após mapa de consumidores e testes de equivalência.
- **Conduta proibida:** remover camada por nome, idade ou impressão de obsolescência.
- **Exemplo:** nove folhas de extensão carregadas sequencialmente, incluindo camadas `final` e `hotfix`.

## `DC` — Defeito comprovado

- **Definição:** comportamento incorreto, inacessível, inseguro ou incompatível com regra vigente.
- **Evidência mínima:** reprodução, teste falhando, erro de console ou divergência inequívoca de contrato.
- **Conduta permitida:** corrigir com teste de regressão e menor mudança suficiente.
- **Conduta proibida:** ampliar escopo para refatoração não relacionada.
- **Exemplo:** variável CSS utilizada sem definição, quando a inspeção computada confirmar efeito incorreto.

## `DQ` — Dúvida de produto ou regra

- **Definição:** intenção, consequência ou autoridade não pode ser determinada com segurança.
- **Evidência mínima:** fontes conflitantes, ausência de fonte ou alternativas com trade-off material.
- **Conduta permitida:** formular pergunta específica, alternativas e consequências.
- **Conduta proibida:** transformar recomendação provisória em decisão final.
- **Exemplo:** decidir se colunas secundárias da Carteira devem ser ocultáveis ou sempre visíveis.

## `DF` — Dependente de etapa futura

- **Definição:** atividade deliberadamente prevista para ambiente, integração ou ciclo ainda não executado.
- **Evidência mínima:** plano, arquitetura ou runbook que a posicione em etapa posterior.
- **Conduta permitida:** registrar dependência, gate e momento correto.
- **Conduta proibida:** apresentar como falha esquecida do estado atual.
- **Exemplo:** usuários reais, Auth/RLS remotos, Advisors, backup, restauração e MFA.

## `EP` — Evolução posterior

- **Definição:** capacidade útil, mas não bloqueadora e ainda não suficientemente prioritária para execução imediata.
- **Evidência mínima:** benefício plausível e dependências conhecidas.
- **Conduta permitida:** manter no roadmap e reavaliar após ciclos anteriores.
- **Conduta proibida:** competir com risco crítico sem justificativa.
- **Exemplo:** indicadores preditivos de risco de atraso após estabilização dos dados.

## Relação com prioridade

| Classe | Pode ser P0? | Observação |
|---|---|---|
| `CP` | não como implementação | entra como proteção |
| `ID` | não como implementação | entra como decisão preservada |
| `FA` | excepcionalmente | depende do impacto real |
| `IC` | sim | quando causa regressão ou bloqueio |
| `DC` | sim | conforme gravidade |
| `DQ` | não antes da decisão | pode bloquear pacote |
| `DF` | não no ciclo atual | pode ser prioridade do ciclo futuro |
| `EP` | normalmente P3/P4 | reavaliar por evidência |

## Registro mínimo

Todo achado deve declarar: superfície, evidência, código, consequência, preservações, dependências, necessidade de decisão humana e condição de aceite.
