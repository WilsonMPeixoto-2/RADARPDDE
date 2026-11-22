# T0T6-D021 — Linguagem do operador e clareza da consolidação

**Decisão do proprietário:** 22/11/2026 · **Etapas atingidas:** T4 e T5 · **Situação:** aprovada; implementação parcial em PR de UX, aceite visual de produção separado.

## Motivação e compromisso

A terminologia exibida ao usuário deve falar a linguagem operacional de Controladores e Assistentes da 4ª CRE, não a linguagem interna do banco de dados. A correção explícita do proprietário substitui **“Corrigir marca”** por **“Corrigir consolidação”** e determina que cada nova funcionalidade seja compreensível sem explicação prévia do desenvolvedor.

O requisito não é apenas trocar um rótulo: o conjunto da interface deve explicitar **o que pode ser alterado**, **em qual contexto**, **o que será preservado**, **qual efeito da confirmação** e **qual ação posterior conclui o fluxo**.

## Nomenclatura da primeira entrega da T4

| Superfície | Texto voltado ao operador |
|---|---|
| Botão de abertura no Prontuário | **Corrigir consolidação** |
| Título da janela | **Corrigir consolidação da bonificação** |
| Campo de edição | **Nova avaliação — Notas Fiscais** |
| Valor atual | **Avaliação atual** |
| Retirada deliberada da resposta | **Limpar resposta** |
| Confirmar a correção | **Confirmar correção** |
| Estado após reabrir resultado consolidado | **Alterações pendentes de consolidação** |
| Próxima ação disponível no cabeçalho | **Consolidar bonificação** |

A janela deve avisar de modo breve que **o primeiro caso da T4 corrige apenas a avaliação de Notas Fiscais**, enquanto a ampliação para outros critérios e as ações `clear_item_history`/`delete_context` continuam etapas futuras. Deve explicar que **confirmar correção não consolida automaticamente**: ao corrigir uma bonificação previamente consolidada, ela fica pendente até nova consolidação.

O texto não deve prometer reabrir bonificação se a avaliação já era inconclusa: o resultado de prévia e a ação posterior precisam refletir a condição real do programa.

## Invariantes e não escopo

- Alterações são restritas a textos, microinterações e sua apresentação; nenhuma mudança de RLS, RPC, migração, propriedade de campo, resultado de bonificação, notas fiscais, análises técnicas, pendências ou exportação é autorizada por esta decisão.
- Preservar acesso por perfil e a distinção **Bonificação × Análise Técnica × Despesas**.
- Os termos técnicos podem continuar em nomes de variáveis, comandos e persistência; não devem aparecer desnecessariamente nas ações visíveis.
- O fluxo de consolidação existente não é substituído nem duplicado; somente o rótulo do botão de reconsolidação recebe nomenclatura inequívoca.
- Aplicar o mesmo princípio à futura T4 e T5, inclusive patrimônio, contatos e histórico, sem antecipar as implementações.

## Critérios verificáveis

1. Teste autenticado por perfil localiza **Corrigir consolidação**, seleciona a nova avaliação e inspeciona a prévia sem gravar outro programa.
2. A janela explica o escopo atual e a etapa de reconsolidação; estado **Alterações pendentes de consolidação** e botão **Consolidar bonificação** aparecem após uma correção persistida de bonificação anteriormente consolidada.
3. Temas claro e escuro, foco, texto longo e viewport móvel não escondem o aviso ou a ação principal; verificar screenshots reais.
4. Testes de regressão mostram que Notas Fiscais, análises e pendências são preservadas; a correção continua independente do resultado técnico.
5. O PR de UX não altera SQL nem o contrato da RPC; deploy ocorre somente após CI e aceite humano apropriado.

**Fonte:** decisão expressa pelo proprietário na conversa RADAR PDDE de 22/11/2026; não há permalink público verificável do chat. O registro mantém a proveniência textual sem inventar URL.
