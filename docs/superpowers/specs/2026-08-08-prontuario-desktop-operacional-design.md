# Prontuário desktop operacional — Design

## Objetivo

Preparar a tela **Detalhes da escola / Prontuário** para uso operacional iminente pelos servidores em computadores, eliminando falhas de entrada, cortes de conteúdo e controles apenas aparentes, sem alterar regras de negócio, perfis, dados ou persistência.

O desktop é o requisito de entrega desta frente. A reorganização específica para celular — principalmente ações e abas — fica formalmente adiada. Correções compartilhadas de navegação e semântica podem beneficiar outros tamanhos de tela, mas não haverá redesenho mobile neste trabalho.

## Escopo funcional

- Abrir o Prontuário no topo quando o usuário vier da Carteira ou de outra superfície.
- Preservar a posição de rolagem, competência e foco da origem para o retorno contextual.
- Impedir que tabelas, abas ou conteúdo da coluna principal ampliem horizontalmente a página desktop.
- Manter todas as ações autorizadas visíveis, identificáveis e acionáveis.
- Manter todas as abas autorizadas visíveis no desktop e sincronizadas com painel, URL e histórico.
- Oferecer semântica de abas e navegação por teclado com setas, `Home` e `End`.
- Tornar competências fora do escopo realmente desabilitadas e competências disponíveis selecionáveis.
- Apresentar programas vinculados como informação estática, e não como botões aparentes.
- Preservar os fluxos existentes de contato, cobrança, edição cadastral, pendências, capital, auditoria e histórico cronológico.
- Preservar a matriz de visibilidade dos perfis Controlador, Assistente, SME e Inventário.

## Arquitetura

### Entrada e retorno

`switchView` continuará sendo a fronteira comum de renderização. Antes da troca serão capturados a view e a escola ativas; depois da renderização, `main.content-area` será levado ao topo somente quando houver entrada em outra view ou troca de escola no Prontuário.

O contexto de retorno permanece sob responsabilidade de `src/integration/navigation-context.js`. Ele captura a posição da origem antes da navegação e a restaura depois que a rota de retorno é renderizada. Portanto, redefinir a nova superfície para o topo não elimina nem sobrescreve a posição guardada da Carteira.

### Contenção horizontal

O grid do Prontuário usará `280px minmax(0, 1fr)`. A coluna de trabalho receberá uma classe própria e `min-width: 0`; tabelas continuarão com rolagem interna quando seu conteúdo for maior que a coluna.

As abas do Prontuário poderão quebrar em mais de uma linha no desktop. Isso mantém todas as seções visíveis sem depender de uma faixa horizontal escondida e não altera seus rótulos ou destinos.

### Ações e informações estáticas

O cabeçalho receberá um grupo de ações nomeado, flexível e com quebra de linha. O grupo será renderizado somente para perfis que possuam pelo menos uma das ações atuais.

Programas vinculados serão uma lista semântica de itens estáticos, usando o mesmo sistema de cores e espaçamento do produto, mas sem aparência de chamada para ação.

### Abas e competências

Cada aba terá `role="tab"`, `aria-controls`, `aria-selected` e `tabindex` coerentes. Cada painel terá `role="tabpanel"`, `aria-labelledby` e `hidden` sincronizados. A ativação por clique, teclado, rota profunda e extensão de histórico utilizará o mesmo contrato.

Os botões de competência terão `type="button"`, `aria-pressed` e, quando fora do escopo, `disabled` e `aria-disabled="true"`. Não haverá controle focalizável cujo clique seja vazio.

## Perfis preservados

| Perfil | Ações de cabeçalho | Abas principais |
|---|---|---|
| Controlador | Registrar Contato, Gerar Cobrança, Editar Dados | Competências, Pendências, Contatos, Capital, Registros Internos e Histórico cronológico |
| Assistente | Registrar Contato, Gerar Cobrança, Editar Dados | Competências, Pendências, Contatos, Capital, Registros Internos e Histórico cronológico |
| Gestão SME | Nenhuma ação mutável no cabeçalho | Competências e Bonificação; Histórico cronológico conforme política vigente |
| Inventário | Nenhuma ação mutável no cabeçalho | Registro de Capital; Histórico cronológico conforme política vigente |

## Testes e evidências

### Regressões novas

- entrada no Prontuário parte do topo, mesmo quando a escola foi aberta após rolagem da Carteira;
- retorno contextual restaura a posição e o foco da Carteira;
- `main.content-area` não possui overflow horizontal em 1440 × 900;
- ações e abas autorizadas ficam integralmente dentro da área útil;
- clique e teclado mantêm aba, painel e atributos ARIA sincronizados;
- competências fora do escopo são desabilitadas de verdade;
- programas vinculados são expostos como lista sem controles interativos;
- os três modais do cabeçalho abrem, gerenciam foco e fecham por `Escape`;
- matriz de perfis não ganha capacidades novas.

### Regressões existentes a executar

- rotas canônicas e retorno contextual;
- núcleo funcional do Prontuário;
- jornada mensal de avaliação;
- ciclo de pendências;
- histórico cronológico;
- acessibilidade e modais;
- contrato frontend por perfil;
- gate base `test:readiness`;
- smoke mobile apenas para provar ausência de regressão compartilhada, sem declarar o layout mobile concluído.

## Restrições

- nenhuma alteração em Supabase, Auth, RLS, migrations, Edge Functions ou dados;
- nenhuma publicação, push, PR, merge ou deployment sem autorização posterior;
- nenhuma mudança de nomes, paleta, logotipo ou capacidade funcional;
- nenhuma reestruturação geral do frontend legado;
- nenhuma declaração de que a experiência mobile foi corrigida nesta frente;
- TDD obrigatório para toda mudança de comportamento.
