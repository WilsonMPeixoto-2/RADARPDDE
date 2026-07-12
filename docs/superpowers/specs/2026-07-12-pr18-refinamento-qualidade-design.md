# PR 18 — Refinamento de Qualidade Visual e Experiência

## 1. Objetivo

Concluir o pacote desenhado na PR 18 elevando a qualidade visual, responsiva e de acessibilidade das superfícies novas, sem redefinir o conceito estético roxo/lilás, a arquitetura, os fluxos ou as regras de negócio aprovadas.

## 2. Princípio de preservação

O trabalho é de acabamento, não de redesign. Permanecem inalterados:

- identidade roxa e lilás;
- semântica azul, âmbar, verde, cinza e vermelha já aprovada;
- tipografia-base, hierarquia de páginas e linguagem dos componentes;
- organização funcional de Dashboard, Carteira, Pendências e Prontuário;
- regras de bonificação, análise técnica, pendências e retificação;
- estrutura do Excel, `localStorage`, Supabase desativado e `INITIAL_DATA_VERSION`;
- proibição de merge e produção sem autorização expressa.

## 3. Correções funcionais de qualidade

### 3.1 Fila operacional completa

O Dashboard deve exibir uma ação por pendência ativa, mesmo quando a mesma escola possui mais de uma pendência. A projeção por escola continua fornecendo uma única `nextAction` para tabelas e cartões; a projeção global passa a fornecer todas as ações documentais ativas para a fila.

### 3.2 Referências seguras e teste estável

Os testes devem localizar ações por `data-pendency-ref`, o contrato seguro que preserva tipos de IDs e referências hostis. O atributo legado `data-pendency-id` não será reintroduzido.

## 4. Refinamento visual

### 4.1 Modais

- conteúdo com padding consistente e largura legível;
- cabeçalho e rodapé visualmente separados;
- ações alinhadas, com espaçamento uniforme;
- rodapé estável no celular e corpo rolável dentro de `100dvh`;
- botões empilhados e com largura total em telas estreitas;
- títulos `h2` com o mesmo padrão visual dos títulos de modal existentes;
- checkboxes com dimensão e cor coerentes com a identidade.

### 4.2 Dashboard e Carteira

- cartões do Dashboard em cinco, três, duas e uma coluna conforme o espaço real disponível;
- cartões da Carteira e Pendências adotados até o breakpoint móvel do shell, em 900 px;
- ausência de rolagem horizontal global e de micro-rolagem desnecessária nos cartões;
- quebra segura de nomes, identificadores e ações longas;
- estados vazios com título, explicação e ação de recuperação quando existirem filtros;
- hierarquia de ação preservada: ação documental ativa recebe prioridade; consulta permanece secundária.

### 4.3 Legibilidade e foco

- anel de foco roxo consistente para controles das superfícies novas;
- textos operacionais não menores que a leitura confortável no mobile;
- pesos limitados aos pesos realmente carregados pela fonte;
- cores semânticas preservadas, com contraste de texto reforçado no tema claro.

## 5. Acessibilidade e teclado

### 5.1 Diálogos

Os modais de contato, cancelamento, reabertura e retificação devem:

- focar o primeiro campo lógico;
- conter `Tab` e `Shift+Tab` dentro do diálogo;
- fechar com `Escape`;
- devolver o foco ao acionador ou, após mutação bem-sucedida, a um destino lógico recriado;
- manter `aria-labelledby`, acrescentar `aria-describedby` e atualizar corretamente `role`/`aria-live` das mensagens.

### 5.2 Alertas e navegação

- sino de alertas com nome acessível e `aria-expanded`;
- alertas operáveis como botões por teclado;
- itens do menu móvel expostos como controles acionáveis por `Enter` e `Space`;
- alteração de filtros da Carteira preserva o foco no controle equivalente após rerender.

## 6. Responsividade

- breakpoint de representação operacional alinhado em 900 px;
- Dashboard com duas colunas em tablets e notebooks estreitos;
- modais novos sem dupla rolagem ou corte causado pelo padding do overlay;
- Carteira responde a rotação/redimensionamento sem manter representação inadequada;
- Android/Chromium e iPhone/WebKit cobertos pela suíte existente.

## 7. Validação e aceite

O pacote será aceito quando:

- sintaxe e testes de domínio estiverem verdes;
- as duas regressões da linha de base estiverem corrigidas;
- Playwright completo passar em desktop Chromium, Android Chromium e iPhone WebKit;
- fluxos de teclado dos novos modais, alertas, Carteira e menu móvel tiverem cobertura;
- a aplicação não apresentar erros relevantes de console, overlay preso ou overflow global;
- inspeção visual confirmar consistência em Dashboard, Carteira, Pendências e modais;
- o diff não alterar regras de negócio, Excel, persistência ou identidade estética.

## 8. Fora do escopo

- novo design system;
- troca de paleta, marca, tipografia-base ou conceito de navegação;
- redesenho integral do Prontuário;
- Ciclo C;
- novas regras de negócio;
- Supabase, autenticação ou integração com Drive;
- merge ou publicação em produção.

