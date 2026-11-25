# T0T6-D023 — Continuidade remota sistemática e usabilidade humana permanente

**Decisão do proprietário:** 25/11/2026, horário de Brasília. **Situação:** aprovada; cumprimento contínuo em cada entrega. **Alcance:** todas as fases, agentes e frentes do RADAR PDDE, inclusive evoluções posteriores a T0–T6. O prefixo identifica o registro de origem, não limita a vigência à release.

**Relação com decisões anteriores:** complementa D020 (propagação e continuidade) e D021 (linguagem e clareza), sem revogá-las. Este documento preserva a origem da orientação; as autoridades permanentes continuam sendo a [política transversal](../../reference/DECISION_IMPACT_POLICY.md), o [catálogo de superfícies](../../reference/PRODUCT_SURFACE_CATALOG.md), o [método de engenharia](../../reference/ENGINEERING_METHOD.md) e o [gate de frontend](../../reference/FRONTEND_USER_VALIDATION_GATE.md).

## 1. Registro remoto durante o trabalho

Cada avanço material deve deixar no GitHub remoto a decisão ou mudança recebida, seu motivo e alcance, prioridade, regra mantida ou substituída, plano, alteração realizada, testes e resultados, limitações, estado da tarefa e próximo ato. Registrar também resultados desfavoráveis, alternativas rejeitadas, autorizações já concedidas e contribuições de outros agentes com sua proveniência.

Atualizar a trilha existente no mesmo ciclo material e antes de interromper ou transferir o trabalho. Não esperar a cota acabar ou a entrega inteira terminar. Um ponto de interrupção deve permitir que outro agente encontre o código remoto, saiba o que já foi comprovado e retome pelo próximo passo correto. Confirmar branch/PR/SHA e leitura remota antes de declarar o registro disponível; se a sincronização falhar, explicitar o que permanece apenas local.

O registro não precisa reproduzir cada chamada de ferramenta nem publicar raciocínio interno. Preserva decisões, justificativas objetivas, artefatos e provas úteis. Credenciais, dados escolares identificáveis e documentos institucionais não entram no repositório público; registrar referências autorizadas e limites sem expor seu conteúdo.

## 2. Técnica e experiência humana em paralelo

A concepção, implementação e validação devem considerar ao mesmo tempo a solução técnica e como uma pessoa real — inclusive com pouca prática em sistemas — compreenderá e realizará a tarefa. A revisão visual final confirma esse trabalho contínuo; não é um acabamento opcional depois do backend.

Para cada mudança percebida pelo usuário, definir contexto, intenção, ação principal, resultado, recuperação de erro e próximo passo. Aplicar os critérios permanentes do catálogo:

- linguagem natural do trabalho, frases diretas e ausência de termos internos desnecessários;
- botões com verbo, objeto quando necessário e efeito coerente com o nome, distinguindo consultar, editar, corrigir, consolidar e excluir;
- confirmações proporcionais, com contexto, consequência e preservações, reutilizando a prévia existente sem duplicá-la;
- cores semânticas consistentes com o produto, acompanhadas de texto ou ícone e contraste nos temas suportados;
- agrupamento, hierarquia, espaçamento e respiro que reduzam a carga visual, mantendo contexto e controles essenciais encontráveis;
- tipografia legível, tamanho e peso coerentes, destaque seletivo e leitura confortável de conteúdo realista;
- foco, teclado, toque, zoom e larguras afetadas pela mudança, com feedback claro e continuidade após navegar ou recarregar.

Menor carga visual não significa fonte menor, informação essencial omitida ou cartões artificialmente altos. Preservar a composição aprovada e a densidade útil; detalhes secundários podem aparecer progressivamente. Consultas, cancelamentos e edições simples não ganham confirmação extra por rotina. A confirmação já exigida pelo contrato deve ajudar a decidir, sem criar uma segunda sequência de aprovação.

## 3. Provas e continuidade

| Dimensão | O que a entrega deve demonstrar, conforme seu impacto |
|---|---|
| Técnica | Regra, capacidades, persistência, sincronização e testes pertinentes no código identificado. |
| Uso humano | A pessoa reconhece onde está, o que está tratando, o estado atual, a ação adequada e seu resultado, pela interface renderizada. |
| Continuidade remota | Decisão, branch/PR/SHA, resultados favoráveis e desfavoráveis, limites, autorizações aplicáveis e próximo ato disponíveis ao sucessor. |

Registrar a aplicação documental desta decisão não certifica todas as telas existentes. As obrigações permanecem ativas; a cobertura de cada entrega exige suas próprias evidências proporcionais. Publicação, teste automatizado, inspeção pelo agente e aceite do proprietário são estados distintos. Autorizações já registradas preservam seu alcance quando o agente muda; não solicitar novamente uma autorização apenas pela troca de executor.

Esta orientação não amplia regras financeiras, capacidades, acesso a documentos ou autorização para mutações institucionais. Também não autoriza uma reformulação indiscriminada do layout: o executor aplica o cuidado humano à mudança efetivamente em trabalho e registra problemas adjacentes sem ampliar silenciosamente seu escopo.

## 4. Fonte textual e limite de proveniência

Instrução expressa do proprietário na conversa do projeto RADARPDDE2.0 de 25/11/2026, após a análise da publicação do T5. Não há permalink verificável da conversa disponível neste registro. Transcrição preservada abaixo; a interpretação operacional está nas seções anteriores e nos canônicos vinculados.

> Duas preocupações que eu tenho são a manutenção sistemática no repositório remoto do github dos registros de tudo que é feito. Sejam as decisões, testes, mudanças de prioridades ou de regras, decisões, planos de continuidade, etc para quando a cota de um agente terminar outro agente poder continuar da maneira correta.
>
> Outra preocupação constante que tenho é que tudo que é feito deve ser feito pensando na usabilidade do usuário humano real. A complexidade do que é feito deve ser traduzida em facilidade para o usuário. Isso significa em pensar em como apresentar as funcionalidades ou regras novas ou sequências de ações etc de forma objetiva, simples, intuitiva e facilitada para o usuário. Esse pensamento se manifesta no frontend e especialmente no layout. A parte textual, os nomes dos botões e a relação deles com as ações que fazem, o uso de linguagem humana natural e não termos técnicos que devem ficar restritos ao backend, telas de confirmação com explicação extra, uso de cores de forma semântica e com significado sistemático, espaços e respiros entre itens, programas e informações textuais densas, evitar informações textuais densas, atenção a tipografia, tipo de letras, tamanho de letras, uso de negritos ou outras escolhas tipograficas que ajudem no uso do site pelo usuário humano real que muitas vezes não tem muitas prática com o uso de sites ou sistemas. Ao longo da execução de T0 até T4 eu tentei fazer isso, aplicar correções no uso da linguagem e no nome de alguns botões etc mas esse é um pensamento e um cuidado que devem permear todas as fases de desenvolvimento e implementações. Devemos sempre pensar na parte técnica e complexa para conseguir executar as tarefas, mas devemos em paralelo pensar na materialização do que está sendo feito para o usuário humano real
