# Navegação contextual e retorno seguro

## 1. Finalidade

A navegação contextual complementa as rotas canônicas do RADAR PDDE. Ela não cria um segundo roteador e não substitui o histórico do navegador.

O recurso resolve o retorno de telas de aprofundamento para a origem operacional real, preservando o contexto necessário para que o usuário continue o trabalho sem reconstruir manualmente a tela anterior.

## 2. Superfícies contextuais

São consideradas superfícies de aprofundamento:

- Prontuário da unidade;
- Pendências operacionais abertas a partir de Dashboard, Carteira ou Prontuário.

Telas raiz, como Dashboard, Carteira e Competências, não recebem botão de retorno contextual.

Modais continuam usando **Fechar** ou **Cancelar**. A navegação contextual não interfere nesses controles.

## 3. Componentes

### Histórico canônico

```text
src/integration/navigation-history.js
```

Continua responsável por:

- URL canônica;
- `pushState` e `replaceState`;
- `popstate`;
- restauração pelo botão nativo do navegador;
- autorização e fallback de rota.

### Contexto de retorno

```text
src/integration/navigation-context.js
```

É responsável por:

- capturar a origem antes da entrada em uma superfície contextual;
- manter uma pilha limitada na sessão;
- restaurar competência, rota, rolagem e foco;
- inserir o botão **Voltar para …** por DOM seguro;
- usar Carteira como fallback quando a origem não existe.

### Bootstrap

```text
src/integration/navigation-context-bootstrap.js
```

Aguarda a instalação de `RadarNavigationHistory` e só então carrega o módulo contextual. Isso evita corrida entre os módulos dinâmicos sem alterar a sequência canônica de autenticação e autorização.

O bootstrap é carregado por:

```text
src/integration/product-extensions-bootstrap.js
```

## 4. Contrato persistido

A pilha é mantida em `sessionStorage`:

```text
radar_pdde_navigation_return_context_v1
```

Cada item possui:

```javascript
{
  version: 1,
  capturedAt,
  origin: {
    view,
    param,
    section,
    filters
  },
  target: {
    view,
    param,
    section,
    filters
  },
  competenceKey,
  scrollY,
  focus: {
    id,
    schoolId,
    pendencyRef,
    action
  }
}
```

A pilha é limitada a 12 itens e existe somente durante a sessão da aba. Não é persistida no Supabase nem incorporada a logs administrativos.

## 5. Captura

A origem é capturada quando a transição entra em:

- `prontuario` a partir de outra tela;
- `pendencias` a partir de outra tela.

Não há nova captura quando a navegação ocorre entre abas do mesmo Prontuário. Nesse caso, a origem útil permanece a tela que levou ao Prontuário.

Links canônicos `a[data-radar-route="true"]` são observados na fase de captura do evento. Assim, o contexto é registrado antes que `navigation-bootstrap.js` execute a navegação na fase de propagação.

Chamadas legadas de `switchView()` são cobertas por um wrapper compatível.

## 6. Retorno

O retorno segue esta ordem:

1. retirar o último contexto da pilha;
2. restaurar a competência global, quando diferente;
3. navegar pela API `RadarNavigationHistory.navigate()`;
4. aguardar dois frames de renderização;
5. restaurar a posição vertical;
6. restaurar o foco no elemento de origem;
7. recalcular a presença e o rótulo do botão contextual.

A busca do foco usa, nesta ordem:

1. `id` do elemento;
2. referência da pendência;
3. ação do controle;
4. identificador da escola presente em `data-school-id` ou na rota `/escolas/:id`.

## 7. Fallback

Quando a tela é acessada diretamente, por nova aba, favorito ou URL compartilhada, pode não existir origem contextual.

Nessa situação:

- o botão é exibido como **Voltar para Carteira**;
- o retorno navega para `/carteira`;
- a rolagem volta ao topo;
- nenhuma entrada artificial é criada na pilha.

## 8. Segurança e privacidade

O contexto armazena somente dados de interface necessários ao retorno:

- nomes de views;
- identificadores operacionais já presentes na rota;
- competência;
- filtros canônicos;
- posição de rolagem;
- descritores mínimos de foco.

Não armazena nomes de pessoas, e-mails, telefones, observações, valores financeiros ou conteúdo documental.

A montagem do botão usa `createElement`, `textContent` e atributos controlados. Não utiliza `innerHTML`.

## 9. Compatibilidade

O recurso preserva:

- rotas canônicas;
- botão Voltar/Avançar do navegador;
- abertura de link em nova aba;
- autorização por perfil;
- seletor global de competência;
- filtros mantidos pelos módulos de origem;
- desktop, Android e iPhone.

## 10. Testes

### Unidade

```text
tests/unit/navigation-context.test.js
```

Comprova:

- normalização do contrato;
- pilha em sessão;
- seleção de transições capturáveis;
- restauração da competência;
- navegação para origem;
- rolagem e foco;
- fallback para Carteira.

### Jornada

```text
tests/e2e/canonical-routes.spec.js
```

Comprova em desktop, Android e iPhone:

- abertura do Prontuário a partir da Carteira;
- presença do botão contextual;
- retorno para `/carteira`;
- preservação da competência ativa;
- restauração de rolagem;
- restauração do foco no link da unidade.

## 11. Critério de aceite

O ciclo somente pode ser mesclado quando:

- readiness aprovar os módulos e testes;
- limite de lint de segurança não aumentar;
- migrations e Supabase local permanecerem aprovados;
- Playwright passar em desktop, Android e iPhone;
- Lighthouse e dependências não apresentarem regressão;
- a documentação representar o SHA validado.
