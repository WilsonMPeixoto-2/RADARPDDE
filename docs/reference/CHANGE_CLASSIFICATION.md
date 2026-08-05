# Classificação de mudanças do RADAR PDDE

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## Regra geral

Nenhum achado entra no backlog sem evidência, consequência e conduta. A classe descreve a natureza do achado; prioridade e esforço são dimensões separadas.

## `CP` — Correto e protegido

- **Definição:** comportamento coerente com regras, testes e finalidade.
- **Evidência:** contrato, fluxo executado e regressão compatíveis.
- **Conduta:** preservar e ampliar proteção quando necessário.
- **Exemplo:** independência entre bonificação, análise e pendência.

## `ID` — Intencional e deliberado

- **Definição:** forma atual deriva de decisão expressa, ainda que pareça incomum.
- **Evidência:** decisão ou contrato canônico.
- **Conduta:** documentar e proteger; não reinterpretar sem autoridade.
- **Exemplo:** ausência de `dataValidations` no Excel SME para evitar reparo.

## `FA` — Funcional e aprimorável

- **Definição:** entrega a tarefa, mas há ganho demonstrável de clareza, produtividade, acessibilidade, desempenho ou manutenção.
- **Evidência:** fluxo observado e consequência concreta.
- **Conduta:** propor resultado, preservações, custo e teste.
- **Exemplo:** densidade de uma tabela correta que pode ser reorganizada sem perda.

## `IC` — Inconsistente ou duplicado

- **Definição:** capacidades equivalentes possuem contratos ou implementações concorrentes.
- **Evidência:** consumidores e divergências mapeados.
- **Conduta:** consolidar somente após equivalência e precedência.
- **Exemplo:** duas camadas CSS alterando a mesma propriedade sem contrato claro.

## `DC` — Defeito comprovado

- **Definição:** comportamento incorreto, inacessível ou incompatível com regra vigente.
- **Evidência:** reprodução, erro, teste falhando ou divergência inequívoca.
- **Conduta:** corrigir causa raiz com regressão e menor mudança suficiente.
- **Exemplos:** botão do Excel sem asset publicado; Gestão de Equipe interrompida pelo preflight CORS.

## `DQ` — Dúvida de produto ou regra

- **Definição:** intenção ou autoridade não pode ser determinada com segurança.
- **Evidência:** fontes conflitantes ou alternativas com consequência material.
- **Conduta:** formular pergunta específica e não implementar unilateralmente.
- **Exemplo atual:** extensão exata das configurações de programas permitidas à Gestão SME.

## `DF` — Dependente de etapa futura

- **Definição:** atividade prevista para etapa ainda não executada.
- **Evidência:** roadmap, plano ou dependência técnica.
- **Conduta:** registrar gate e momento correto; não apresentar como esquecimento.
- **Exemplos atuais:** smoke autenticado recorrente, provas controladas de escrita e UAT.

O Excel SME e o backup/restauração descartável não são exemplos de `DF`: essas etapas foram concluídas.

## `EP` — Evolução posterior

- **Definição:** capacidade útil, não bloqueadora e ainda sem prioridade imediata.
- **Evidência:** benefício e dependências conhecidos.
- **Conduta:** manter no roadmap e reavaliar depois das frentes prioritárias.
- **Exemplo:** indicadores preditivos após estabilização e UAT.

## Relação com prioridade

| Classe | Pode ser P0? | Observação |
|---|---|---|
| `CP` | não como correção | preservar |
| `ID` | não como correção | decisão protegida |
| `FA` | excepcionalmente | depende do impacto |
| `IC` | sim | quando causa regressão |
| `DC` | sim | conforme gravidade |
| `DQ` | bloqueia decisão | não implementar antes de resolver |
| `DF` | pode ser P1 futuro | respeitar sequência |
| `EP` | normalmente P3 | reavaliar |

## Registro mínimo

Todo achado declara:

- perfil e superfície;
- passos de reprodução;
- camada em que falha;
- evidência;
- consequência ao usuário;
- classe e prioridade;
- preservações;
- dependências;
- decisão humana necessária;
- critério de aceite ponta a ponta.
